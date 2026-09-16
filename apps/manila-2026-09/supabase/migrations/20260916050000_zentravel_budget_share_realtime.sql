DELETE FROM public.zentravel_budgets a
USING public.zentravel_budgets b
WHERE a.budget_type = 'public'
  AND b.budget_type = 'public'
  AND a.trip_id = b.trip_id
  AND a.updated_at < b.updated_at;

ALTER TABLE public.zentravel_budgets
  DROP CONSTRAINT IF EXISTS zentravel_budgets_trip_id_budget_type_owner_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS zentravel_budgets_public_trip_uidx
  ON public.zentravel_budgets (trip_id)
  WHERE budget_type = 'public';

CREATE UNIQUE INDEX IF NOT EXISTS zentravel_budgets_self_trip_owner_uidx
  ON public.zentravel_budgets (trip_id, owner_id)
  WHERE budget_type = 'self';

DROP POLICY IF EXISTS zentravel_budgets_update ON public.zentravel_budgets;
CREATE POLICY zentravel_budgets_update ON public.zentravel_budgets
  FOR UPDATE TO authenticated
  USING (
    zentravel_private.is_member(trip_id)
    AND (budget_type = 'public' OR owner_id = auth.uid())
  )
  WITH CHECK (
    zentravel_private.is_member(trip_id)
    AND (budget_type = 'public' OR owner_id = auth.uid())
  );
