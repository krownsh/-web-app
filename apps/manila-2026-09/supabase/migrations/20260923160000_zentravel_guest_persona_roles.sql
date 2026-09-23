-- Guest faces (test09+) must stay role = guest.
-- Persona-wall seed stamped everyone as member; logout then demoted guests.

UPDATE public.zentravel_trip_members m
SET role = 'guest'
FROM auth.users au, public.zentravel_trips t
WHERE m.user_id = au.id
  AND m.trip_id = t.id
  AND t.slug = 'manila-2026-09'
  AND au.email IN (
    'test09@gmail.com',
    'test10@gmail.com',
    'test11@gmail.com',
    'test12@gmail.com',
    'test13@gmail.com'
  )
  AND m.role <> 'owner';

CREATE OR REPLACE FUNCTION public.zentravel_join_this_app_trip()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip public.zentravel_trips%ROWTYPE;
  v_role text;
  v_email text;
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

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  v_role := CASE
    WHEN v_trip.owner_id = auth.uid() THEN 'owner'
    WHEN v_email IN (
      'test09@gmail.com',
      'test10@gmail.com',
      'test11@gmail.com',
      'test12@gmail.com',
      'test13@gmail.com'
    ) THEN 'guest'
    ELSE 'member'
  END;

  INSERT INTO public.zentravel_trip_members (trip_id, user_id, role)
  VALUES (v_trip.id, auth.uid(), v_role)
  ON CONFLICT (trip_id, user_id) DO NOTHING;

  UPDATE public.zentravel_users
  SET active_trip_id = v_trip.id, last_seen_at = now()
  WHERE id = auth.uid();

  RETURN v_trip.id;
END;
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
END;
$$;
