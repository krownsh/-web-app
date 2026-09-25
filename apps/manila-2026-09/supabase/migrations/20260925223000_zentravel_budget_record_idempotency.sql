ALTER TABLE public.zentravel_budget_records
  ADD COLUMN IF NOT EXISTS client_request_id uuid;

UPDATE public.zentravel_budget_records
SET client_request_id = gen_random_uuid()
WHERE client_request_id IS NULL;

ALTER TABLE public.zentravel_budget_records
  ALTER COLUMN client_request_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'zentravel_budget_records_request_key'
  ) THEN
    ALTER TABLE public.zentravel_budget_records
      ADD CONSTRAINT zentravel_budget_records_request_key
      UNIQUE (trip_id, owner_id, client_request_id);
  END IF;
END $$;
