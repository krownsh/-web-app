-- Per-user lottery bridge: watching the video marks lottery_played_at.
-- Draws stay trip-global; this column is personal so later users still see the film.

ALTER TABLE public.zentravel_game_claims
  ADD COLUMN IF NOT EXISTS lottery_played_at timestamptz;

UPDATE public.zentravel_game_claims c
SET lottery_played_at = d.created_at
FROM public.zentravel_game_draws d
WHERE d.trip_id = c.trip_id
  AND d.drawer_id = c.traveler_id
  AND c.lottery_played_at IS NULL;

DROP FUNCTION IF EXISTS public.zentravel_my_game_claim(uuid);

CREATE FUNCTION public.zentravel_my_game_claim(p_trip_id uuid)
RETURNS TABLE (
  traveler_id uuid,
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
  SELECT t.id, t.display_name, t.photo_url, c.lottery_played_at
  FROM public.zentravel_game_claims c
  JOIN public.zentravel_travelers t ON t.id = c.traveler_id
  WHERE c.trip_id = p_trip_id AND c.user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.zentravel_finish_game_lottery(p_trip_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.zentravel_start_game_draw(p_trip_id);

  UPDATE public.zentravel_game_claims
  SET lottery_played_at = COALESCE(lottery_played_at, now())
  WHERE trip_id = p_trip_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'claim first';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.zentravel_finish_game_lottery(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.zentravel_my_game_claim(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.zentravel_finish_game_lottery(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.zentravel_my_game_claim(uuid) TO authenticated;
