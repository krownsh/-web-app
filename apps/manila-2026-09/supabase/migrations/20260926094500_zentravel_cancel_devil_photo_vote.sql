-- A voter may only delete their own vote for the selected photo.

CREATE OR REPLACE FUNCTION public.zentravel_cancel_devil_photo_vote(
  p_trip_id uuid,
  p_photo_id uuid
)
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

  DELETE FROM public.zentravel_game_devil_photo_votes
  WHERE trip_id = p_trip_id
    AND photo_id = p_photo_id
    AND user_id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.zentravel_cancel_devil_photo_vote(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.zentravel_cancel_devil_photo_vote(uuid, uuid)
  TO authenticated;
