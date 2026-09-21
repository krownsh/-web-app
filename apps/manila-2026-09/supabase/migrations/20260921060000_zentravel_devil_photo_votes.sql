-- One vote per member/guest per trip; can be moved to another ugly photo.

CREATE TABLE public.zentravel_game_devil_photo_votes (
  trip_id uuid NOT NULL REFERENCES public.zentravel_trips (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  photo_id uuid NOT NULL REFERENCES public.zentravel_game_devil_photos (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (trip_id, user_id)
);

CREATE INDEX zentravel_game_devil_photo_votes_photo_idx
  ON public.zentravel_game_devil_photo_votes (photo_id);

ALTER TABLE public.zentravel_game_devil_photo_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY zentravel_game_devil_photo_votes_select
  ON public.zentravel_game_devil_photo_votes
  FOR SELECT TO authenticated
  USING (zentravel_private.is_member(trip_id));

GRANT SELECT ON TABLE public.zentravel_game_devil_photo_votes TO authenticated;
GRANT ALL ON TABLE public.zentravel_game_devil_photo_votes TO service_role;

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
  ON CONFLICT (trip_id, user_id) DO UPDATE
    SET photo_id = excluded.photo_id,
        updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.zentravel_devil_photo_votes(p_trip_id uuid)
RETURNS TABLE (
  photo_id uuid,
  user_id uuid,
  display_name text,
  photo_url text,
  kind text
)
LANGUAGE plpgsql
STABLE
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

  RETURN QUERY
  SELECT
    v.photo_id,
    v.user_id,
    COALESCE(gp.display_name, t.display_name, '旅人'::text),
    COALESCE(gp.photo_url, t.photo_url),
    CASE
      WHEN gp.id IS NOT NULL THEN 'guest'::text
      WHEN t.id IS NOT NULL THEN 'traveler'::text
      ELSE 'unknown'::text
    END
  FROM public.zentravel_game_devil_photo_votes v
  LEFT JOIN public.zentravel_guest_claims gc
    ON gc.trip_id = v.trip_id AND gc.user_id = v.user_id
  LEFT JOIN public.zentravel_guest_personas gp
    ON gp.id = gc.persona_id
  LEFT JOIN public.zentravel_game_claims tc
    ON tc.trip_id = v.trip_id AND tc.user_id = v.user_id
  LEFT JOIN public.zentravel_travelers t
    ON t.id = tc.traveler_id
  WHERE v.trip_id = p_trip_id
  ORDER BY v.created_at ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.zentravel_vote_devil_photo(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.zentravel_devil_photo_votes(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.zentravel_vote_devil_photo(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.zentravel_devil_photo_votes(uuid) TO authenticated;
