CREATE TABLE public.zentravel_travelers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.zentravel_trips (id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  display_name text NOT NULL,
  photo_url text,
  outbound jsonb NOT NULL DEFAULT '{}'::jsonb,
  inbound jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX zentravel_travelers_trip_idx ON public.zentravel_travelers (trip_id);

ALTER TABLE public.zentravel_travelers ENABLE ROW LEVEL SECURITY;

CREATE POLICY zentravel_travelers_select ON public.zentravel_travelers
  FOR SELECT TO authenticated
  USING (zentravel_private.is_member(trip_id));

CREATE POLICY zentravel_travelers_write_owner ON public.zentravel_travelers
  FOR ALL TO authenticated
  USING (zentravel_private.is_owner(trip_id))
  WITH CHECK (zentravel_private.is_owner(trip_id));

GRANT SELECT ON TABLE public.zentravel_travelers TO authenticated;
GRANT ALL ON TABLE public.zentravel_travelers TO service_role;
