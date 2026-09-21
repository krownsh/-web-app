-- Logout only frees the seat. Re-claiming the same traveler keeps lottery progress.

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
  INSERT INTO public.zentravel_game_claims (trip_id, user_id, traveler_id, lottery_played_at)
  VALUES (
    p_trip_id,
    auth.uid(),
    p_traveler_id,
    (SELECT d.created_at FROM public.zentravel_game_draws d
      WHERE d.trip_id = p_trip_id AND d.drawer_id = auth.uid()
      LIMIT 1)
  );
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
  SELECT
    'traveler'::text,
    t.id,
    t.display_name,
    t.photo_url,
    COALESCE(c.lottery_played_at, d.created_at)
  FROM public.zentravel_game_claims c
  JOIN public.zentravel_travelers t ON t.id = c.traveler_id
  LEFT JOIN public.zentravel_game_draws d
    ON d.trip_id = c.trip_id AND d.drawer_id = c.user_id
  WHERE c.trip_id = p_trip_id AND c.user_id = auth.uid();
END;
$$;
