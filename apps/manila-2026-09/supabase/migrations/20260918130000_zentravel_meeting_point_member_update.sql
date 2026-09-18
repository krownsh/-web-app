-- Meeting points are visible to every member (including guests).
-- Any non-guest member can update location / notes / current stop.
-- Insert and delete stay owner-only.

DROP POLICY IF EXISTS zentravel_items_write_owner ON public.zentravel_itinerary_items;
DROP POLICY IF EXISTS zentravel_items_insert_owner ON public.zentravel_itinerary_items;
DROP POLICY IF EXISTS zentravel_items_delete_owner ON public.zentravel_itinerary_items;
DROP POLICY IF EXISTS zentravel_items_update_member ON public.zentravel_itinerary_items;

CREATE POLICY zentravel_items_insert_owner ON public.zentravel_itinerary_items
  FOR INSERT TO authenticated
  WITH CHECK (zentravel_private.is_owner(trip_id));

CREATE POLICY zentravel_items_delete_owner ON public.zentravel_itinerary_items
  FOR DELETE TO authenticated
  USING (zentravel_private.is_owner(trip_id));

CREATE POLICY zentravel_items_update_member ON public.zentravel_itinerary_items
  FOR UPDATE TO authenticated
  USING (zentravel_private.can_mutate(trip_id))
  WITH CHECK (zentravel_private.can_mutate(trip_id));
