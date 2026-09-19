-- Guests may write guide links, must-buys, and their own checklist ticks.
-- Meeting point, budget, and game mutations stay on can_mutate (members only).

DROP POLICY IF EXISTS zentravel_guide_links_insert ON public.zentravel_guide_links;
CREATE POLICY zentravel_guide_links_insert ON public.zentravel_guide_links
  FOR INSERT TO authenticated
  WITH CHECK (zentravel_private.is_member(trip_id) AND owner_id = auth.uid());

DROP POLICY IF EXISTS zentravel_guide_links_update ON public.zentravel_guide_links;
CREATE POLICY zentravel_guide_links_update ON public.zentravel_guide_links
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND zentravel_private.is_member(trip_id))
  WITH CHECK (owner_id = auth.uid() AND zentravel_private.is_member(trip_id));

DROP POLICY IF EXISTS zentravel_guide_links_delete ON public.zentravel_guide_links;
CREATE POLICY zentravel_guide_links_delete ON public.zentravel_guide_links
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid() AND zentravel_private.is_member(trip_id));

DROP POLICY IF EXISTS zentravel_must_buys_insert ON public.zentravel_must_buys;
CREATE POLICY zentravel_must_buys_insert ON public.zentravel_must_buys
  FOR INSERT TO authenticated
  WITH CHECK (zentravel_private.is_member(trip_id) AND owner_id = auth.uid());

DROP POLICY IF EXISTS zentravel_must_buys_update ON public.zentravel_must_buys;
CREATE POLICY zentravel_must_buys_update ON public.zentravel_must_buys
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND zentravel_private.is_member(trip_id))
  WITH CHECK (owner_id = auth.uid() AND zentravel_private.is_member(trip_id));

DROP POLICY IF EXISTS zentravel_must_buys_delete ON public.zentravel_must_buys;
CREATE POLICY zentravel_must_buys_delete ON public.zentravel_must_buys
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid() AND zentravel_private.is_member(trip_id));

DROP POLICY IF EXISTS zentravel_checklist_insert ON public.zentravel_checklist_statuses;
CREATE POLICY zentravel_checklist_insert ON public.zentravel_checklist_statuses
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND zentravel_private.is_member(trip_id));

DROP POLICY IF EXISTS zentravel_checklist_update ON public.zentravel_checklist_statuses;
CREATE POLICY zentravel_checklist_update ON public.zentravel_checklist_statuses
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND zentravel_private.is_member(trip_id))
  WITH CHECK (owner_id = auth.uid() AND zentravel_private.is_member(trip_id));
