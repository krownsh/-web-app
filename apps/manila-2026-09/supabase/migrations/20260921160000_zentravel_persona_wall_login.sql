-- Public persona wall + 13 preset logins. Haru is not on the wall and has no login.

CREATE UNIQUE INDEX IF NOT EXISTS zentravel_guest_claims_persona_uidx
  ON public.zentravel_guest_claims (trip_id, persona_id);

DROP INDEX IF EXISTS zentravel_guest_claims_exclusive_uidx;

CREATE OR REPLACE FUNCTION public.zentravel_manila_persona_wall()
RETURNS TABLE (
  trip_id uuid,
  face_id uuid,
  display_name text,
  photo_url text,
  kind text,
  exclusive boolean,
  claimed boolean,
  sort_order int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH trip AS (
    SELECT id FROM public.zentravel_trips WHERE slug = 'manila-2026-09'
  )
  SELECT * FROM (
    SELECT
      t.id,
      tr.id,
      tr.display_name,
      tr.photo_url,
      'traveler'::text,
      true,
      EXISTS (
        SELECT 1 FROM public.zentravel_game_claims c
        WHERE c.trip_id = t.id AND c.traveler_id = tr.id
      ),
      tr.sort_order
    FROM trip t
    JOIN public.zentravel_travelers tr ON tr.trip_id = t.id
    WHERE tr.display_name IS DISTINCT FROM 'Haru'
    UNION ALL
    SELECT
      t.id,
      p.id,
      p.display_name,
      p.photo_url,
      'guest'::text,
      p.exclusive,
      EXISTS (
        SELECT 1 FROM public.zentravel_guest_claims c
        WHERE c.trip_id = t.id AND c.persona_id = p.id
      ),
      100 + p.sort_order
    FROM trip t
    JOIN public.zentravel_guest_personas p ON p.trip_id = t.id
  ) wall
  ORDER BY 8;
$$;

CREATE OR REPLACE FUNCTION public.zentravel_release_my_identity(p_trip_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT zentravel_private.is_member(p_trip_id) THEN
    RAISE EXCEPTION 'not a member';
  END IF;
  DELETE FROM public.zentravel_game_claims
  WHERE trip_id = p_trip_id AND user_id = auth.uid();
  DELETE FROM public.zentravel_guest_claims
  WHERE trip_id = p_trip_id AND user_id = auth.uid();
  UPDATE public.zentravel_trip_members
  SET role = CASE
    WHEN (SELECT owner_id FROM public.zentravel_trips WHERE id = p_trip_id) = auth.uid() THEN 'owner'
    ELSE 'member'
  END
  WHERE trip_id = p_trip_id AND user_id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.zentravel_manila_persona_wall() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.zentravel_release_my_identity(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.zentravel_manila_persona_wall() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.zentravel_release_my_identity(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION zentravel_private.ensure_email_user(p_email text, p_password text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_id uuid;
  v_hash text;
BEGIN
  v_hash := extensions.crypt(p_password, extensions.gen_salt('bf'));
  SELECT id INTO v_id FROM auth.users WHERE email = p_email;
  IF v_id IS NULL THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_id,
      'authenticated',
      'authenticated',
      p_email,
      v_hash,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_id,
      jsonb_build_object('sub', v_id::text, 'email', p_email),
      'email',
      v_id::text,
      now(),
      now(),
      now()
    );
  ELSE
    UPDATE auth.users
    SET encrypted_password = v_hash,
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_id;
  END IF;
  RETURN v_id;
END;
$$;

DO $$
DECLARE
  v_trip uuid;
  v_owner uuid;
  v_pw text := 'a123123';
  v_keep uuid[];
  r record;
BEGIN
  SELECT id INTO v_trip FROM public.zentravel_trips WHERE slug = 'manila-2026-09';
  IF v_trip IS NULL THEN
    RAISE EXCEPTION 'manila-2026-09 trip not found';
  END IF;

  v_owner := zentravel_private.ensure_email_user('bgkong1205@gmail.com', v_pw);
  v_keep := ARRAY[
    v_owner,
    zentravel_private.ensure_email_user('test01@gmail.com', v_pw),
    zentravel_private.ensure_email_user('test02@gmail.com', v_pw),
    zentravel_private.ensure_email_user('test03@gmail.com', v_pw),
    zentravel_private.ensure_email_user('test04@gmail.com', v_pw),
    zentravel_private.ensure_email_user('test06@gmail.com', v_pw),
    zentravel_private.ensure_email_user('test07@gmail.com', v_pw),
    zentravel_private.ensure_email_user('test08@gmail.com', v_pw),
    zentravel_private.ensure_email_user('test09@gmail.com', v_pw),
    zentravel_private.ensure_email_user('test10@gmail.com', v_pw),
    zentravel_private.ensure_email_user('test11@gmail.com', v_pw),
    zentravel_private.ensure_email_user('test12@gmail.com', v_pw),
    zentravel_private.ensure_email_user('test13@gmail.com', v_pw)
  ];

  DELETE FROM public.zentravel_game_claims WHERE trip_id = v_trip;
  DELETE FROM public.zentravel_guest_claims WHERE trip_id = v_trip;

  UPDATE public.zentravel_trips SET owner_id = v_owner WHERE id = v_trip;

  INSERT INTO public.zentravel_users (id, display_name, last_seen_at)
  SELECT uid, au.email, now()
  FROM unnest(v_keep) AS uid
  JOIN auth.users au ON au.id = uid
  ON CONFLICT (id) DO UPDATE SET last_seen_at = now();

  INSERT INTO public.zentravel_trip_members (trip_id, user_id, role)
  SELECT v_trip, uid, CASE WHEN uid = v_owner THEN 'owner' ELSE 'member' END
  FROM unnest(v_keep) AS uid
  ON CONFLICT (trip_id, user_id) DO UPDATE
  SET role = EXCLUDED.role;

  FOR r IN
    SELECT m.user_id
    FROM public.zentravel_trip_members m
    WHERE m.trip_id = v_trip
      AND m.user_id <> ALL (v_keep)
      AND NOT EXISTS (
        SELECT 1 FROM public.zentravel_trip_members o
        JOIN public.zentravel_trips ot ON ot.id = o.trip_id
        WHERE o.user_id = m.user_id AND ot.slug <> 'manila-2026-09'
      )
      AND NOT EXISTS (SELECT 1 FROM public.thaiwomao_users u WHERE u.id = m.user_id)
      AND NOT EXISTS (SELECT 1 FROM public.chromeorder_users u WHERE u.id = m.user_id)
      AND NOT EXISTS (SELECT 1 FROM public.stickerbook_users u WHERE u.id = m.user_id)
  LOOP
    UPDATE public.zentravel_travelers SET user_id = NULL WHERE user_id = r.user_id;
    DELETE FROM public.zentravel_game_devil_photo_votes WHERE user_id = r.user_id;
    DELETE FROM public.zentravel_game_devil_photo_votes
    WHERE photo_id IN (
      SELECT id FROM public.zentravel_game_devil_photos WHERE uploader_id = r.user_id
    );
    DELETE FROM public.zentravel_game_devil_photos WHERE uploader_id = r.user_id;
    DELETE FROM public.zentravel_game_guesses WHERE user_id = r.user_id;
    DELETE FROM public.zentravel_game_claims WHERE user_id = r.user_id;
    DELETE FROM public.zentravel_guest_claims WHERE user_id = r.user_id;
    DELETE FROM public.zentravel_must_buys WHERE owner_id = r.user_id;
    DELETE FROM public.zentravel_budget_records WHERE owner_id = r.user_id;
    DELETE FROM public.zentravel_budgets WHERE owner_id = r.user_id;
    DELETE FROM public.zentravel_checklist_statuses WHERE owner_id = r.user_id;
    DELETE FROM public.zentravel_guide_links WHERE owner_id = r.user_id;
    DELETE FROM public.zentravel_trip_members WHERE trip_id = v_trip AND user_id = r.user_id;
    DELETE FROM public.zentravel_users WHERE id = r.user_id;
    DELETE FROM auth.users WHERE id = r.user_id;
  END LOOP;
END $$;
