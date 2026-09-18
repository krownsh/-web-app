-- Auto-join Manila trip (no join code). Guest personas + read-only guests.

ALTER TABLE public.zentravel_trip_members
  DROP CONSTRAINT IF EXISTS zentravel_trip_members_role_check;

ALTER TABLE public.zentravel_trip_members
  ADD CONSTRAINT zentravel_trip_members_role_check
  CHECK (role IN ('owner', 'member', 'guest'));

CREATE OR REPLACE FUNCTION zentravel_private.is_guest(p_trip_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.zentravel_trip_members m
    WHERE m.trip_id = p_trip_id
      AND m.user_id = auth.uid()
      AND m.role = 'guest'
  );
$$;

CREATE OR REPLACE FUNCTION zentravel_private.can_mutate(p_trip_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT zentravel_private.is_member(p_trip_id)
     AND NOT zentravel_private.is_guest(p_trip_id);
$$;

REVOKE ALL ON FUNCTION zentravel_private.is_guest(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION zentravel_private.can_mutate(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION zentravel_private.is_guest(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION zentravel_private.can_mutate(uuid) TO authenticated;

CREATE TABLE public.zentravel_guest_personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.zentravel_trips (id) ON DELETE CASCADE,
  slug text NOT NULL,
  display_name text NOT NULL,
  photo_url text,
  exclusive boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  UNIQUE (trip_id, slug)
);

CREATE TABLE public.zentravel_guest_claims (
  trip_id uuid NOT NULL REFERENCES public.zentravel_trips (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES public.zentravel_guest_personas (id) ON DELETE CASCADE,
  exclusive boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (trip_id, user_id)
);

CREATE UNIQUE INDEX zentravel_guest_claims_exclusive_uidx
  ON public.zentravel_guest_claims (trip_id, persona_id)
  WHERE exclusive;

ALTER TABLE public.zentravel_guest_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zentravel_guest_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY zentravel_guest_personas_select ON public.zentravel_guest_personas
  FOR SELECT TO authenticated
  USING (zentravel_private.is_member(trip_id));

CREATE POLICY zentravel_guest_claims_select ON public.zentravel_guest_claims
  FOR SELECT TO authenticated
  USING (zentravel_private.is_member(trip_id));

GRANT SELECT ON TABLE public.zentravel_guest_personas TO authenticated;
GRANT SELECT ON TABLE public.zentravel_guest_claims TO authenticated;
GRANT ALL ON TABLE public.zentravel_guest_personas TO service_role;
GRANT ALL ON TABLE public.zentravel_guest_claims TO service_role;

INSERT INTO public.zentravel_guest_personas (trip_id, slug, display_name, photo_url, exclusive, sort_order)
SELECT tr.id, v.slug, v.display_name, v.photo_url, v.exclusive, v.sort_order
FROM public.zentravel_trips tr
CROSS JOIN (VALUES
  ('guest-a', '彥文', '/guests/a.png', true, 0),
  ('guest-b', '靜瑩', '/guests/b.png', true, 1),
  ('guest-c', '宇庭', '/guests/c.png', true, 2),
  ('guest-d', '庭宇', '/guests/d.png', true, 3),
  ('guest-shared', '共用訪客', NULL, false, 4)
) AS v(slug, display_name, photo_url, exclusive, sort_order)
WHERE tr.slug = 'manila-2026-09'
ON CONFLICT (trip_id, slug) DO NOTHING;

CREATE OR REPLACE FUNCTION public.zentravel_join_this_app_trip()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip public.zentravel_trips%ROWTYPE;
  v_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.zentravel_users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'not registered for this app';
  END IF;

  SELECT * INTO v_trip
  FROM public.zentravel_trips
  WHERE slug = 'manila-2026-09';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'trip not found';
  END IF;

  v_role := CASE WHEN v_trip.owner_id = auth.uid() THEN 'owner' ELSE 'member' END;

  INSERT INTO public.zentravel_trip_members (trip_id, user_id, role)
  VALUES (v_trip.id, auth.uid(), v_role)
  ON CONFLICT (trip_id, user_id) DO NOTHING;

  UPDATE public.zentravel_users
  SET active_trip_id = v_trip.id, last_seen_at = now()
  WHERE id = auth.uid();

  RETURN v_trip.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.zentravel_guest_personas_for_trip(p_trip_id uuid)
RETURNS TABLE (
  id uuid,
  display_name text,
  photo_url text,
  exclusive boolean,
  sort_order int,
  taken boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT zentravel_private.is_member(p_trip_id) THEN
    RAISE EXCEPTION 'not a member';
  END IF;
  RETURN QUERY
  SELECT
    p.id,
    p.display_name,
    p.photo_url,
    p.exclusive,
    p.sort_order,
    (p.exclusive AND EXISTS (
      SELECT 1 FROM public.zentravel_guest_claims c
      WHERE c.trip_id = p.trip_id AND c.persona_id = p.id
    )) AS taken
  FROM public.zentravel_guest_personas p
  WHERE p.trip_id = p_trip_id
  ORDER BY p.sort_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.zentravel_claim_guest_persona(p_trip_id uuid, p_persona_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_excl boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT zentravel_private.is_member(p_trip_id) THEN
    RAISE EXCEPTION 'not a member';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.zentravel_game_claims
    WHERE trip_id = p_trip_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.zentravel_guest_claims
    WHERE trip_id = p_trip_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'already claimed';
  END IF;

  SELECT exclusive INTO v_excl
  FROM public.zentravel_guest_personas
  WHERE id = p_persona_id AND trip_id = p_trip_id;

  IF v_excl IS NULL THEN
    RAISE EXCEPTION 'invalid persona';
  END IF;

  INSERT INTO public.zentravel_guest_claims (trip_id, user_id, persona_id, exclusive)
  VALUES (p_trip_id, auth.uid(), p_persona_id, v_excl);

  UPDATE public.zentravel_trip_members
  SET role = 'guest'
  WHERE trip_id = p_trip_id AND user_id = auth.uid() AND role = 'member';
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'already taken';
END;
$$;

CREATE OR REPLACE FUNCTION public.zentravel_my_identity(p_trip_id uuid)
RETURNS TABLE (
  kind text,
  id uuid,
  display_name text,
  photo_url text,
  lottery_played_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT zentravel_private.is_member(p_trip_id) THEN
    RAISE EXCEPTION 'not a member';
  END IF;
  RETURN QUERY
  SELECT 'guest'::text, p.id, p.display_name, p.photo_url, NULL::timestamptz
  FROM public.zentravel_guest_claims c
  JOIN public.zentravel_guest_personas p ON p.id = c.persona_id
  WHERE c.trip_id = p_trip_id AND c.user_id = auth.uid();

  IF FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 'traveler'::text, t.id, t.display_name, t.photo_url, c.lottery_played_at
  FROM public.zentravel_game_claims c
  JOIN public.zentravel_travelers t ON t.id = c.traveler_id
  WHERE c.trip_id = p_trip_id AND c.user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.zentravel_claim_traveler(p_trip_id uuid, p_traveler_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT zentravel_private.can_mutate(p_trip_id) THEN
    RAISE EXCEPTION 'not a member';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.zentravel_guest_claims
    WHERE trip_id = p_trip_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'already claimed';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.zentravel_game_claims
    WHERE trip_id = p_trip_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'already claimed';
  END IF;
  IF NOT zentravel_private.game_is_pool(p_traveler_id, p_trip_id) THEN
    RAISE EXCEPTION 'invalid traveler';
  END IF;
  INSERT INTO public.zentravel_game_claims (trip_id, user_id, traveler_id)
  VALUES (p_trip_id, auth.uid(), p_traveler_id);
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'already taken';
END;
$$;

CREATE OR REPLACE FUNCTION public.zentravel_finish_game_lottery(p_trip_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT zentravel_private.can_mutate(p_trip_id) THEN
    RAISE EXCEPTION 'guests cannot join the draw';
  END IF;
  PERFORM public.zentravel_start_game_draw(p_trip_id);

  UPDATE public.zentravel_game_claims
  SET lottery_played_at = COALESCE(lottery_played_at, now())
  WHERE trip_id = p_trip_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'claim first';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.zentravel_add_devil_photo(p_trip_id uuid, p_storage_path text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_devil uuid;
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT zentravel_private.can_mutate(p_trip_id) THEN
    RAISE EXCEPTION 'guests cannot upload';
  END IF;
  SELECT d.devil_id INTO v_devil
  FROM public.zentravel_game_claims c
  JOIN public.zentravel_game_draws d
    ON d.trip_id = c.trip_id AND d.drawer_id = c.traveler_id
  WHERE c.trip_id = p_trip_id AND c.user_id = auth.uid();
  IF v_devil IS NULL THEN
    RAISE EXCEPTION 'no draw';
  END IF;
  IF p_storage_path IS NULL OR p_storage_path NOT LIKE p_trip_id::text || '/' || auth.uid()::text || '/%' THEN
    RAISE EXCEPTION 'bad path';
  END IF;
  INSERT INTO public.zentravel_game_devil_photos (trip_id, uploader_id, target_id, storage_path)
  VALUES (p_trip_id, auth.uid(), v_devil, p_storage_path)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

DROP POLICY IF EXISTS zentravel_must_buys_insert ON public.zentravel_must_buys;
CREATE POLICY zentravel_must_buys_insert ON public.zentravel_must_buys
  FOR INSERT TO authenticated
  WITH CHECK (zentravel_private.can_mutate(trip_id) AND owner_id = auth.uid());

DROP POLICY IF EXISTS zentravel_budget_records_insert ON public.zentravel_budget_records;
CREATE POLICY zentravel_budget_records_insert ON public.zentravel_budget_records
  FOR INSERT TO authenticated
  WITH CHECK (zentravel_private.can_mutate(trip_id) AND owner_id = auth.uid());

DROP POLICY IF EXISTS zentravel_budgets_insert ON public.zentravel_budgets;
CREATE POLICY zentravel_budgets_insert ON public.zentravel_budgets
  FOR INSERT TO authenticated
  WITH CHECK (zentravel_private.can_mutate(trip_id) AND owner_id = auth.uid());

DROP POLICY IF EXISTS zentravel_budgets_update ON public.zentravel_budgets;
CREATE POLICY zentravel_budgets_update ON public.zentravel_budgets
  FOR UPDATE TO authenticated
  USING (
    zentravel_private.can_mutate(trip_id)
    AND (budget_type = 'public' OR owner_id = auth.uid())
  )
  WITH CHECK (
    zentravel_private.can_mutate(trip_id)
    AND (budget_type = 'public' OR owner_id = auth.uid())
  );

DROP POLICY IF EXISTS zentravel_checklist_insert ON public.zentravel_checklist_statuses;
CREATE POLICY zentravel_checklist_insert ON public.zentravel_checklist_statuses
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND zentravel_private.can_mutate(trip_id));

DROP POLICY IF EXISTS zentravel_game_claims_insert ON public.zentravel_game_claims;
CREATE POLICY zentravel_game_claims_insert ON public.zentravel_game_claims
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND zentravel_private.can_mutate(trip_id)
    AND zentravel_private.game_is_pool(traveler_id, trip_id)
  );

DROP POLICY IF EXISTS zentravel_game_wishes_insert ON public.zentravel_game_wishes;
CREATE POLICY zentravel_game_wishes_insert ON public.zentravel_game_wishes
  FOR INSERT TO authenticated
  WITH CHECK (
    zentravel_private.can_mutate(trip_id)
    AND EXISTS (
      SELECT 1 FROM public.zentravel_game_claims c
      WHERE c.trip_id = zentravel_game_wishes.trip_id
        AND c.user_id = auth.uid()
        AND c.traveler_id = zentravel_game_wishes.traveler_id
    )
  );

DROP POLICY IF EXISTS zentravel_game_guesses_own ON public.zentravel_game_guesses;
CREATE POLICY zentravel_game_guesses_own ON public.zentravel_game_guesses
  FOR ALL TO authenticated
  USING (user_id = auth.uid() AND zentravel_private.can_mutate(trip_id))
  WITH CHECK (user_id = auth.uid() AND zentravel_private.can_mutate(trip_id));

DROP POLICY IF EXISTS zentravel_game_photos_storage_insert ON storage.objects;
CREATE POLICY zentravel_game_photos_storage_insert
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'zentravel-game-photos'
  AND (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND zentravel_private.can_mutate(((storage.foldername(name))[1])::uuid)
);

DROP POLICY IF EXISTS zentravel_must_buys_update ON public.zentravel_must_buys;
CREATE POLICY zentravel_must_buys_update ON public.zentravel_must_buys
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND zentravel_private.can_mutate(trip_id))
  WITH CHECK (owner_id = auth.uid() AND zentravel_private.can_mutate(trip_id));

DROP POLICY IF EXISTS zentravel_must_buys_delete ON public.zentravel_must_buys;
CREATE POLICY zentravel_must_buys_delete ON public.zentravel_must_buys
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid() AND zentravel_private.can_mutate(trip_id));

DROP POLICY IF EXISTS zentravel_budget_records_update ON public.zentravel_budget_records;
CREATE POLICY zentravel_budget_records_update ON public.zentravel_budget_records
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND zentravel_private.can_mutate(trip_id))
  WITH CHECK (owner_id = auth.uid() AND zentravel_private.can_mutate(trip_id));

DROP POLICY IF EXISTS zentravel_budget_records_delete ON public.zentravel_budget_records;
CREATE POLICY zentravel_budget_records_delete ON public.zentravel_budget_records
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid() AND zentravel_private.can_mutate(trip_id));

DROP POLICY IF EXISTS zentravel_checklist_update ON public.zentravel_checklist_statuses;
CREATE POLICY zentravel_checklist_update ON public.zentravel_checklist_statuses
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND zentravel_private.can_mutate(trip_id))
  WITH CHECK (owner_id = auth.uid() AND zentravel_private.can_mutate(trip_id));

CREATE OR REPLACE FUNCTION public.zentravel_start_game_draw(p_trip_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n int;
  v_seed text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT zentravel_private.can_mutate(p_trip_id) THEN
    RAISE EXCEPTION 'not a member';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.zentravel_game_claims
    WHERE trip_id = p_trip_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'claim first';
  END IF;

  PERFORM 1 FROM public.zentravel_trips WHERE id = p_trip_id FOR UPDATE;

  IF EXISTS (SELECT 1 FROM public.zentravel_game_draws WHERE trip_id = p_trip_id) THEN
    RETURN;
  END IF;

  SELECT count(*)::int INTO n
  FROM public.zentravel_travelers t
  WHERE t.trip_id = p_trip_id AND t.display_name IS DISTINCT FROM 'Haru';

  IF n < 3 THEN
    RAISE EXCEPTION 'not enough travelers';
  END IF;

  v_seed := gen_random_uuid()::text;

  INSERT INTO public.zentravel_game_draws (trip_id, drawer_id, angel_id, devil_id)
  SELECT
    p_trip_id,
    a.id,
    b.id,
    c.id
  FROM (
    SELECT
      t.id,
      (row_number() OVER (ORDER BY md5(t.id::text || v_seed)) - 1) AS idx
    FROM public.zentravel_travelers t
    WHERE t.trip_id = p_trip_id AND t.display_name IS DISTINCT FROM 'Haru'
  ) a
  JOIN (
    SELECT
      t.id,
      (row_number() OVER (ORDER BY md5(t.id::text || v_seed)) - 1) AS idx
    FROM public.zentravel_travelers t
    WHERE t.trip_id = p_trip_id AND t.display_name IS DISTINCT FROM 'Haru'
  ) b ON b.idx = (a.idx + 1) % n
  JOIN (
    SELECT
      t.id,
      (row_number() OVER (ORDER BY md5(t.id::text || v_seed)) - 1) AS idx
    FROM public.zentravel_travelers t
    WHERE t.trip_id = p_trip_id AND t.display_name IS DISTINCT FROM 'Haru'
  ) c ON c.idx = (a.idx + 2) % n;
END;
$$;

REVOKE ALL ON FUNCTION public.zentravel_join_this_app_trip() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.zentravel_guest_personas_for_trip(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.zentravel_claim_guest_persona(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.zentravel_my_identity(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.zentravel_join_this_app_trip() TO authenticated;
GRANT EXECUTE ON FUNCTION public.zentravel_guest_personas_for_trip(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.zentravel_claim_guest_persona(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.zentravel_my_identity(uuid) TO authenticated;
