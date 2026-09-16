CREATE OR REPLACE FUNCTION public.zentravel_join_trip(p_code text)
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

  IF NOT EXISTS (
    SELECT 1 FROM public.zentravel_users WHERE id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not registered for this app';
  END IF;

  SELECT * INTO v_trip
  FROM public.zentravel_trips
  WHERE lower(join_code) = lower(trim(p_code));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid join code';
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

CREATE OR REPLACE FUNCTION public.zentravel_set_active_trip(p_trip_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.zentravel_users WHERE id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not registered for this app';
  END IF;
  IF NOT zentravel_private.is_member(p_trip_id) THEN
    RAISE EXCEPTION 'not a member';
  END IF;
  UPDATE public.zentravel_users
  SET active_trip_id = p_trip_id, last_seen_at = now()
  WHERE id = auth.uid();
END;
$$;
