-- Angel / devil secret game + Manila timezone

UPDATE public.zentravel_trips
SET timezone = 'Asia/Manila'
WHERE slug = 'manila-2026-09';

CREATE TABLE public.zentravel_game_claims (
  trip_id uuid NOT NULL REFERENCES public.zentravel_trips (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  traveler_id uuid NOT NULL REFERENCES public.zentravel_travelers (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (trip_id, user_id),
  UNIQUE (trip_id, traveler_id)
);

CREATE TABLE public.zentravel_game_draws (
  trip_id uuid NOT NULL REFERENCES public.zentravel_trips (id) ON DELETE CASCADE,
  drawer_id uuid NOT NULL REFERENCES public.zentravel_travelers (id) ON DELETE CASCADE,
  angel_id uuid NOT NULL REFERENCES public.zentravel_travelers (id) ON DELETE CASCADE,
  devil_id uuid NOT NULL REFERENCES public.zentravel_travelers (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (trip_id, drawer_id),
  CHECK (drawer_id <> angel_id AND drawer_id <> devil_id AND angel_id <> devil_id)
);

CREATE TABLE public.zentravel_game_wishes (
  trip_id uuid NOT NULL REFERENCES public.zentravel_trips (id) ON DELETE CASCADE,
  traveler_id uuid NOT NULL REFERENCES public.zentravel_travelers (id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (trip_id, traveler_id)
);

CREATE TABLE public.zentravel_game_devil_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.zentravel_trips (id) ON DELETE CASCADE,
  uploader_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES public.zentravel_travelers (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX zentravel_game_devil_photos_trip_idx
  ON public.zentravel_game_devil_photos (trip_id, created_at DESC);

CREATE TABLE public.zentravel_game_guesses (
  trip_id uuid NOT NULL REFERENCES public.zentravel_trips (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  guessed_angel_id uuid REFERENCES public.zentravel_travelers (id) ON DELETE SET NULL,
  guessed_devil_id uuid REFERENCES public.zentravel_travelers (id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (trip_id, user_id)
);

ALTER TABLE public.zentravel_game_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zentravel_game_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zentravel_game_wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zentravel_game_devil_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zentravel_game_guesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY zentravel_game_claims_select_own ON public.zentravel_game_claims
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND zentravel_private.is_member(trip_id));

CREATE POLICY zentravel_game_claims_insert ON public.zentravel_game_claims
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND zentravel_private.is_member(trip_id)
    AND zentravel_private.game_is_pool(traveler_id, trip_id)
  );

CREATE POLICY zentravel_game_wishes_select ON public.zentravel_game_wishes
  FOR SELECT TO authenticated
  USING (zentravel_private.is_member(trip_id));

CREATE POLICY zentravel_game_wishes_insert ON public.zentravel_game_wishes
  FOR INSERT TO authenticated
  WITH CHECK (
    zentravel_private.is_member(trip_id)
    AND EXISTS (
      SELECT 1 FROM public.zentravel_game_claims c
      WHERE c.trip_id = zentravel_game_wishes.trip_id
        AND c.user_id = auth.uid()
        AND c.traveler_id = zentravel_game_wishes.traveler_id
    )
  );

CREATE POLICY zentravel_game_photos_select ON public.zentravel_game_devil_photos
  FOR SELECT TO authenticated
  USING (zentravel_private.is_member(trip_id));

CREATE POLICY zentravel_game_guesses_own ON public.zentravel_game_guesses
  FOR ALL TO authenticated
  USING (user_id = auth.uid() AND zentravel_private.is_member(trip_id))
  WITH CHECK (user_id = auth.uid() AND zentravel_private.is_member(trip_id));

GRANT SELECT, INSERT ON TABLE public.zentravel_game_claims TO authenticated;
GRANT SELECT, INSERT ON TABLE public.zentravel_game_wishes TO authenticated;
GRANT SELECT ON TABLE public.zentravel_game_devil_photos TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.zentravel_game_guesses TO authenticated;
GRANT ALL ON TABLE public.zentravel_game_claims TO service_role;
GRANT ALL ON TABLE public.zentravel_game_draws TO service_role;
GRANT ALL ON TABLE public.zentravel_game_wishes TO service_role;
GRANT ALL ON TABLE public.zentravel_game_devil_photos TO service_role;
GRANT ALL ON TABLE public.zentravel_game_guesses TO service_role;

CREATE OR REPLACE FUNCTION zentravel_private.game_reveal_at(p_trip_id uuid)
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ((t.end_date::timestamp + time '12:00') AT TIME ZONE t.timezone)
  FROM public.zentravel_trips t
  WHERE t.id = p_trip_id;
$$;

CREATE OR REPLACE FUNCTION zentravel_private.game_is_revealed(p_trip_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT now() >= zentravel_private.game_reveal_at(p_trip_id);
$$;

CREATE OR REPLACE FUNCTION zentravel_private.game_is_pool(p_traveler_id uuid, p_trip_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.zentravel_travelers t
    WHERE t.id = p_traveler_id
      AND t.trip_id = p_trip_id
      AND t.display_name IS DISTINCT FROM 'Haru'
  );
$$;

REVOKE ALL ON FUNCTION zentravel_private.game_reveal_at(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION zentravel_private.game_is_revealed(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION zentravel_private.game_is_pool(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION zentravel_private.game_reveal_at(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION zentravel_private.game_is_revealed(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION zentravel_private.game_is_pool(uuid, uuid) TO authenticated;

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
  IF NOT zentravel_private.is_member(p_trip_id) THEN
    RAISE EXCEPTION 'not a member';
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

CREATE OR REPLACE FUNCTION public.zentravel_unclaimed_travelers(p_trip_id uuid)
RETURNS TABLE (
  id uuid,
  display_name text,
  photo_url text,
  sort_order int
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
  SELECT t.id, t.display_name, t.photo_url, t.sort_order
  FROM public.zentravel_travelers t
  WHERE t.trip_id = p_trip_id
    AND t.display_name IS DISTINCT FROM 'Haru'
    AND NOT EXISTS (
      SELECT 1 FROM public.zentravel_game_claims c
      WHERE c.trip_id = p_trip_id AND c.traveler_id = t.id
    )
  ORDER BY t.sort_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.zentravel_my_game_claim(p_trip_id uuid)
RETURNS TABLE (
  traveler_id uuid,
  display_name text,
  photo_url text
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
  SELECT t.id, t.display_name, t.photo_url
  FROM public.zentravel_game_claims c
  JOIN public.zentravel_travelers t ON t.id = c.traveler_id
  WHERE c.trip_id = p_trip_id AND c.user_id = auth.uid();
END;
$$;

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
  IF NOT zentravel_private.is_member(p_trip_id) THEN
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

CREATE OR REPLACE FUNCTION public.zentravel_my_game_draw(p_trip_id uuid)
RETURNS TABLE (
  drawer_id uuid,
  angel_id uuid,
  devil_id uuid,
  angel_name text,
  devil_name text,
  angel_photo text,
  devil_photo text
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
    d.drawer_id,
    d.angel_id,
    d.devil_id,
    a.display_name,
    v.display_name,
    a.photo_url,
    v.photo_url
  FROM public.zentravel_game_claims c
  JOIN public.zentravel_game_draws d
    ON d.trip_id = c.trip_id AND d.drawer_id = c.traveler_id
  JOIN public.zentravel_travelers a ON a.id = d.angel_id
  JOIN public.zentravel_travelers v ON v.id = d.devil_id
  WHERE c.trip_id = p_trip_id AND c.user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.zentravel_game_all_draws(p_trip_id uuid)
RETURNS TABLE (
  drawer_id uuid,
  drawer_name text,
  drawer_photo text,
  angel_id uuid,
  angel_name text,
  angel_photo text,
  devil_id uuid,
  devil_name text,
  devil_photo text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT zentravel_private.is_member(p_trip_id) THEN
    RAISE EXCEPTION 'not a member';
  END IF;
  IF NOT zentravel_private.game_is_revealed(p_trip_id) THEN
    RAISE EXCEPTION 'not revealed';
  END IF;
  RETURN QUERY
  SELECT
    d.drawer_id,
    dr.display_name,
    dr.photo_url,
    d.angel_id,
    a.display_name,
    a.photo_url,
    d.devil_id,
    v.display_name,
    v.photo_url
  FROM public.zentravel_game_draws d
  JOIN public.zentravel_travelers dr ON dr.id = d.drawer_id
  JOIN public.zentravel_travelers a ON a.id = d.angel_id
  JOIN public.zentravel_travelers v ON v.id = d.devil_id
  WHERE d.trip_id = p_trip_id
  ORDER BY dr.sort_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.zentravel_game_reveal_info(p_trip_id uuid)
RETURNS TABLE (
  reveal_at timestamptz,
  revealed boolean
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
    zentravel_private.game_reveal_at(p_trip_id),
    zentravel_private.game_is_revealed(p_trip_id);
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
  IF NOT zentravel_private.is_member(p_trip_id) THEN
    RAISE EXCEPTION 'not a member';
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

REVOKE ALL ON FUNCTION public.zentravel_claim_traveler(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.zentravel_unclaimed_travelers(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.zentravel_my_game_claim(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.zentravel_start_game_draw(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.zentravel_my_game_draw(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.zentravel_game_all_draws(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.zentravel_game_reveal_info(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.zentravel_add_devil_photo(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.zentravel_claim_traveler(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.zentravel_unclaimed_travelers(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.zentravel_my_game_claim(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.zentravel_start_game_draw(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.zentravel_my_game_draw(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.zentravel_game_all_draws(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.zentravel_game_reveal_info(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.zentravel_add_devil_photo(uuid, text) TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'zentravel-game-photos',
  'zentravel-game-photos',
  false,
  512000,
  ARRAY['image/jpeg']
)
ON CONFLICT (id) DO UPDATE
SET file_size_limit = 512000,
    allowed_mime_types = ARRAY['image/jpeg'];

DROP POLICY IF EXISTS zentravel_game_photos_storage_insert ON storage.objects;
DROP POLICY IF EXISTS zentravel_game_photos_storage_select ON storage.objects;

CREATE POLICY zentravel_game_photos_storage_insert
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'zentravel-game-photos'
  AND (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND zentravel_private.is_member(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY zentravel_game_photos_storage_select
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'zentravel-game-photos'
  AND (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
  AND zentravel_private.is_member(((storage.foldername(name))[1])::uuid)
);
