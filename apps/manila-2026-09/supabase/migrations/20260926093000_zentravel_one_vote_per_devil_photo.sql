-- A member or guest may vote for multiple photos, but only once per photo.

DELETE FROM public.zentravel_game_devil_photo_votes AS duplicate_vote
USING public.zentravel_game_devil_photo_votes AS kept_vote
WHERE duplicate_vote.trip_id = kept_vote.trip_id
  AND duplicate_vote.user_id = kept_vote.user_id
  AND duplicate_vote.photo_id = kept_vote.photo_id
  AND (
    duplicate_vote.created_at > kept_vote.created_at
    OR (duplicate_vote.created_at = kept_vote.created_at AND duplicate_vote.id > kept_vote.id)
  );

ALTER TABLE public.zentravel_game_devil_photo_votes
  ADD CONSTRAINT zentravel_game_devil_photo_votes_one_per_photo_key
  UNIQUE (trip_id, user_id, photo_id);

CREATE OR REPLACE FUNCTION public.zentravel_vote_devil_photo(p_trip_id uuid, p_photo_id uuid)
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
  IF NOT EXISTS (
    SELECT 1 FROM public.zentravel_guest_claims
    WHERE trip_id = p_trip_id AND user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM public.zentravel_game_claims
    WHERE trip_id = p_trip_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'claim first';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.zentravel_game_devil_photos
    WHERE id = p_photo_id AND trip_id = p_trip_id
  ) THEN
    RAISE EXCEPTION 'photo not found';
  END IF;

  INSERT INTO public.zentravel_game_devil_photo_votes (trip_id, user_id, photo_id)
  VALUES (p_trip_id, auth.uid(), p_photo_id)
  ON CONFLICT (trip_id, user_id, photo_id) DO NOTHING;
END;
$$;
