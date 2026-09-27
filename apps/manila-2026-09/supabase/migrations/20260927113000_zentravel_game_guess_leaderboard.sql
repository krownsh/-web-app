-- Reveal-only score board: one point each for correctly guessing angel and devil.

CREATE OR REPLACE FUNCTION public.zentravel_game_guess_leaderboard(p_trip_id uuid)
RETURNS TABLE (
  traveler_id uuid,
  display_name text,
  photo_url text,
  angel_correct boolean,
  devil_correct boolean,
  score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT zentravel_private.is_member(p_trip_id) THEN
    RAISE EXCEPTION 'not a member';
  END IF;

  IF NOT zentravel_private.game_is_revealed(p_trip_id) THEN
    RAISE EXCEPTION 'not revealed';
  END IF;

  RETURN QUERY
  SELECT
    claim.traveler_id,
    traveler.display_name,
    traveler.photo_url,
    COALESCE(guess.guessed_angel_id = draw.angel_id, false),
    COALESCE(guess.guessed_devil_id = draw.devil_id, false),
    (
      COALESCE((guess.guessed_angel_id = draw.angel_id)::integer, 0)
      + COALESCE((guess.guessed_devil_id = draw.devil_id)::integer, 0)
    )::integer
  FROM public.zentravel_game_claims AS claim
  JOIN public.zentravel_game_draws AS draw
    ON draw.trip_id = claim.trip_id
   AND draw.drawer_id = claim.traveler_id
  JOIN public.zentravel_travelers AS traveler
    ON traveler.id = claim.traveler_id
  LEFT JOIN public.zentravel_game_guesses AS guess
    ON guess.trip_id = claim.trip_id
   AND guess.user_id = claim.user_id
  WHERE claim.trip_id = p_trip_id
  ORDER BY 6 DESC, traveler.sort_order ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.zentravel_game_guess_leaderboard(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.zentravel_game_guess_leaderboard(uuid) TO authenticated;
