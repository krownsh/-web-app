-- Guide page extras go to the cloud:
-- links are visible to every trip member; must-buys keep public/private like the home list.

ALTER TABLE public.zentravel_must_buys
  ADD COLUMN IF NOT EXISTS note text,
  ADD COLUMN IF NOT EXISTS itinerary_item_id uuid REFERENCES public.zentravel_itinerary_items (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS zentravel_must_buys_trip_loc_idx
  ON public.zentravel_must_buys (trip_id, location_ref);

CREATE TABLE IF NOT EXISTS public.zentravel_guide_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.zentravel_trips (id) ON DELETE CASCADE,
  itinerary_item_id uuid REFERENCES public.zentravel_itinerary_items (id) ON DELETE SET NULL,
  location_ref text,
  title text NOT NULL,
  url text NOT NULL DEFAULT '#',
  source text,
  owner_id uuid NOT NULL REFERENCES auth.users (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS zentravel_guide_links_trip_idx
  ON public.zentravel_guide_links (trip_id, location_ref);

ALTER TABLE public.zentravel_guide_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS zentravel_guide_links_select ON public.zentravel_guide_links;
CREATE POLICY zentravel_guide_links_select ON public.zentravel_guide_links
  FOR SELECT TO authenticated
  USING (zentravel_private.is_member(trip_id));

DROP POLICY IF EXISTS zentravel_guide_links_insert ON public.zentravel_guide_links;
CREATE POLICY zentravel_guide_links_insert ON public.zentravel_guide_links
  FOR INSERT TO authenticated
  WITH CHECK (zentravel_private.can_mutate(trip_id) AND owner_id = auth.uid());

DROP POLICY IF EXISTS zentravel_guide_links_update ON public.zentravel_guide_links;
CREATE POLICY zentravel_guide_links_update ON public.zentravel_guide_links
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND zentravel_private.can_mutate(trip_id))
  WITH CHECK (owner_id = auth.uid() AND zentravel_private.can_mutate(trip_id));

DROP POLICY IF EXISTS zentravel_guide_links_delete ON public.zentravel_guide_links;
CREATE POLICY zentravel_guide_links_delete ON public.zentravel_guide_links
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid() AND zentravel_private.can_mutate(trip_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.zentravel_guide_links TO authenticated;
GRANT ALL ON TABLE public.zentravel_guide_links TO service_role;
