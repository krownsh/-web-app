-- Allow every member or guest to cast any number of ugly-photo votes.
-- Existing votes are preserved; only the old one-vote-per-user primary key is replaced.

ALTER TABLE public.zentravel_game_devil_photo_votes
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

UPDATE public.zentravel_game_devil_photo_votes
SET id = gen_random_uuid()
WHERE id IS NULL;

ALTER TABLE public.zentravel_game_devil_photo_votes
  ALTER COLUMN id SET NOT NULL;

DO $$
DECLARE
  primary_key_name text;
BEGIN
  SELECT conname INTO primary_key_name
  FROM pg_constraint
  WHERE conrelid = 'public.zentravel_game_devil_photo_votes'::regclass
    AND contype = 'p';

  IF primary_key_name IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE public.zentravel_game_devil_photo_votes DROP CONSTRAINT %I',
      primary_key_name
    );
  END IF;
END;
$$;

ALTER TABLE public.zentravel_game_devil_photo_votes
  ADD CONSTRAINT zentravel_game_devil_photo_votes_pkey PRIMARY KEY (id);

CREATE INDEX IF NOT EXISTS zentravel_game_devil_photo_votes_trip_photo_idx
  ON public.zentravel_game_devil_photo_votes (trip_id, photo_id);

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
  VALUES (p_trip_id, auth.uid(), p_photo_id);
END;
$$;
