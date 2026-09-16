-- zentravel platform: trips, membership, itinerary, personal records
CREATE SCHEMA IF NOT EXISTS zentravel_private;
REVOKE ALL ON SCHEMA zentravel_private FROM PUBLIC;
GRANT USAGE ON SCHEMA zentravel_private TO postgres, service_role, authenticated;

CREATE TABLE public.zentravel_users (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  active_trip_id uuid,
  last_seen_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.zentravel_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  join_code text NOT NULL UNIQUE,
  owner_id uuid REFERENCES auth.users (id),
  title text NOT NULL,
  subtitle text,
  group_no text,
  foreign_group_no text,
  leader_name text,
  leader_phone text,
  badge text,
  luggage_tag text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Bangkok',
  currency text NOT NULL DEFAULT 'THB',
  exchange_rate numeric,
  weather_lat double precision,
  weather_lng double precision,
  sos jsonb NOT NULL DEFAULT '[]'::jsonb,
  theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.zentravel_users
  ADD CONSTRAINT zentravel_users_active_trip_fk
  FOREIGN KEY (active_trip_id) REFERENCES public.zentravel_trips (id) ON DELETE SET NULL;

CREATE TABLE public.zentravel_trip_members (
  trip_id uuid NOT NULL REFERENCES public.zentravel_trips (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (trip_id, user_id)
);

CREATE TABLE public.zentravel_trip_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.zentravel_trips (id) ON DELETE CASCADE,
  day_key text NOT NULL,
  day_index int NOT NULL,
  calendar_date date,
  date_num text,
  month_label text,
  weekday_label text,
  weather_note text,
  reminder text,
  UNIQUE (trip_id, day_key)
);

CREATE TABLE public.zentravel_itinerary_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.zentravel_trips (id) ON DELETE CASCADE,
  stable_key text NOT NULL,
  day_key text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  time text,
  title text NOT NULL,
  description text,
  location text,
  type text,
  lat double precision,
  lng double precision,
  image_url text,
  is_current boolean NOT NULL DEFAULT false,
  origin text NOT NULL DEFAULT 'seed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trip_id, stable_key)
);

CREATE TABLE public.zentravel_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.zentravel_trips (id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  title text NOT NULL,
  icon text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE public.zentravel_prep_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.zentravel_trips (id) ON DELETE CASCADE,
  tab text NOT NULL DEFAULT 'pre-trip',
  sort_order int NOT NULL DEFAULT 0,
  title text NOT NULL,
  body text
);

CREATE TABLE public.zentravel_must_buys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.zentravel_trips (id) ON DELETE CASCADE,
  item_name text NOT NULL,
  price numeric,
  location_ref text,
  image_url text,
  visibility text NOT NULL CHECK (visibility IN ('public', 'private')),
  owner_id uuid NOT NULL REFERENCES auth.users (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.zentravel_budget_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.zentravel_trips (id) ON DELETE CASCADE,
  date date,
  time time,
  title text NOT NULL,
  amount numeric NOT NULL,
  currency text,
  category text,
  location text,
  payment_type text NOT NULL CHECK (payment_type IN ('public', 'self')),
  owner_id uuid NOT NULL REFERENCES auth.users (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.zentravel_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.zentravel_trips (id) ON DELETE CASCADE,
  budget_type text NOT NULL CHECK (budget_type IN ('public', 'self')),
  amount numeric NOT NULL DEFAULT 0,
  owner_id uuid NOT NULL REFERENCES auth.users (id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trip_id, budget_type, owner_id)
);

CREATE TABLE public.zentravel_checklist_statuses (
  trip_id uuid NOT NULL REFERENCES public.zentravel_trips (id) ON DELETE CASCADE,
  item_id uuid NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users (id),
  is_checked boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (trip_id, item_id, owner_id)
);

CREATE INDEX zentravel_itinerary_items_trip_day_idx
  ON public.zentravel_itinerary_items (trip_id, day_key, sort_order);
CREATE INDEX zentravel_must_buys_trip_idx ON public.zentravel_must_buys (trip_id);
CREATE INDEX zentravel_budget_records_trip_idx ON public.zentravel_budget_records (trip_id);
CREATE INDEX zentravel_reminders_trip_idx ON public.zentravel_reminders (trip_id);

CREATE OR REPLACE FUNCTION zentravel_private.is_member(p_trip_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.zentravel_trip_members m
    WHERE m.trip_id = p_trip_id
      AND m.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION zentravel_private.is_owner(p_trip_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.zentravel_trip_members m
    WHERE m.trip_id = p_trip_id
      AND m.user_id = auth.uid()
      AND m.role = 'owner'
  );
$$;

REVOKE ALL ON FUNCTION zentravel_private.is_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION zentravel_private.is_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION zentravel_private.is_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION zentravel_private.is_owner(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.zentravel_join_trip(p_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip public.zentravel_trips%ROWTYPE;
  v_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO v_trip
  FROM public.zentravel_trips
  WHERE lower(join_code) = lower(trim(p_code));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid join code';
  END IF;

  INSERT INTO public.zentravel_users (id, display_name)
  VALUES (
    auth.uid(),
    COALESCE(auth.jwt() ->> 'email', 'traveler')
  )
  ON CONFLICT (id) DO NOTHING;

  v_role := CASE WHEN v_trip.owner_id = auth.uid() THEN 'owner' ELSE 'member' END;

  INSERT INTO public.zentravel_trip_members (trip_id, user_id, role)
  VALUES (v_trip.id, auth.uid(), v_role)
  ON CONFLICT (trip_id, user_id) DO NOTHING;

  UPDATE public.zentravel_users
  SET active_trip_id = v_trip.id, last_seen_at = now()
  WHERE id = auth.uid();

  RETURN v_trip.id;
END;
$$;

REVOKE ALL ON FUNCTION public.zentravel_join_trip(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.zentravel_join_trip(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.zentravel_set_active_trip(p_trip_id uuid)
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
  INSERT INTO public.zentravel_users (id)
  VALUES (auth.uid())
  ON CONFLICT (id) DO NOTHING;
  UPDATE public.zentravel_users
  SET active_trip_id = p_trip_id, last_seen_at = now()
  WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.zentravel_set_active_trip(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.zentravel_set_active_trip(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.zentravel_on_trip_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_id IS NOT NULL THEN
    INSERT INTO public.zentravel_trip_members (trip_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'owner')
    ON CONFLICT (trip_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER zentravel_trips_after_insert
  AFTER INSERT ON public.zentravel_trips
  FOR EACH ROW
  EXECUTE FUNCTION public.zentravel_on_trip_insert();

ALTER TABLE public.zentravel_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zentravel_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zentravel_trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zentravel_trip_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zentravel_itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zentravel_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zentravel_prep_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zentravel_must_buys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zentravel_budget_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zentravel_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zentravel_checklist_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY zentravel_users_select_own ON public.zentravel_users
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY zentravel_users_insert_own ON public.zentravel_users
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY zentravel_users_update_own ON public.zentravel_users
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY zentravel_trips_select_member ON public.zentravel_trips
  FOR SELECT TO authenticated USING (zentravel_private.is_member(id));
CREATE POLICY zentravel_trips_insert_owner ON public.zentravel_trips
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY zentravel_trips_update_owner ON public.zentravel_trips
  FOR UPDATE TO authenticated
  USING (zentravel_private.is_owner(id))
  WITH CHECK (zentravel_private.is_owner(id));

CREATE POLICY zentravel_members_select ON public.zentravel_trip_members
  FOR SELECT TO authenticated USING (zentravel_private.is_member(trip_id));
CREATE POLICY zentravel_members_delete_self ON public.zentravel_trip_members
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR zentravel_private.is_owner(trip_id));

CREATE POLICY zentravel_days_select ON public.zentravel_trip_days
  FOR SELECT TO authenticated USING (zentravel_private.is_member(trip_id));
CREATE POLICY zentravel_days_write_owner ON public.zentravel_trip_days
  FOR ALL TO authenticated
  USING (zentravel_private.is_owner(trip_id))
  WITH CHECK (zentravel_private.is_owner(trip_id));

CREATE POLICY zentravel_items_select ON public.zentravel_itinerary_items
  FOR SELECT TO authenticated USING (zentravel_private.is_member(trip_id));
CREATE POLICY zentravel_items_write_owner ON public.zentravel_itinerary_items
  FOR ALL TO authenticated
  USING (zentravel_private.is_owner(trip_id))
  WITH CHECK (zentravel_private.is_owner(trip_id));

CREATE POLICY zentravel_reminders_select ON public.zentravel_reminders
  FOR SELECT TO authenticated USING (zentravel_private.is_member(trip_id));
CREATE POLICY zentravel_reminders_write_owner ON public.zentravel_reminders
  FOR ALL TO authenticated
  USING (zentravel_private.is_owner(trip_id))
  WITH CHECK (zentravel_private.is_owner(trip_id));

CREATE POLICY zentravel_prep_select ON public.zentravel_prep_items
  FOR SELECT TO authenticated USING (zentravel_private.is_member(trip_id));
CREATE POLICY zentravel_prep_write_owner ON public.zentravel_prep_items
  FOR ALL TO authenticated
  USING (zentravel_private.is_owner(trip_id))
  WITH CHECK (zentravel_private.is_owner(trip_id));

CREATE POLICY zentravel_must_buys_select ON public.zentravel_must_buys
  FOR SELECT TO authenticated
  USING (
    zentravel_private.is_member(trip_id)
    AND (visibility = 'public' OR owner_id = auth.uid())
  );
CREATE POLICY zentravel_must_buys_insert ON public.zentravel_must_buys
  FOR INSERT TO authenticated
  WITH CHECK (zentravel_private.is_member(trip_id) AND owner_id = auth.uid());
CREATE POLICY zentravel_must_buys_update ON public.zentravel_must_buys
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY zentravel_must_buys_delete ON public.zentravel_must_buys
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY zentravel_budget_records_select ON public.zentravel_budget_records
  FOR SELECT TO authenticated
  USING (
    zentravel_private.is_member(trip_id)
    AND (payment_type = 'public' OR owner_id = auth.uid())
  );
CREATE POLICY zentravel_budget_records_insert ON public.zentravel_budget_records
  FOR INSERT TO authenticated
  WITH CHECK (zentravel_private.is_member(trip_id) AND owner_id = auth.uid());
CREATE POLICY zentravel_budget_records_update ON public.zentravel_budget_records
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY zentravel_budget_records_delete ON public.zentravel_budget_records
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY zentravel_budgets_select ON public.zentravel_budgets
  FOR SELECT TO authenticated
  USING (
    zentravel_private.is_member(trip_id)
    AND (budget_type = 'public' OR owner_id = auth.uid())
  );
CREATE POLICY zentravel_budgets_insert ON public.zentravel_budgets
  FOR INSERT TO authenticated
  WITH CHECK (zentravel_private.is_member(trip_id) AND owner_id = auth.uid());
CREATE POLICY zentravel_budgets_update ON public.zentravel_budgets
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY zentravel_checklist_select ON public.zentravel_checklist_statuses
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() AND zentravel_private.is_member(trip_id));
CREATE POLICY zentravel_checklist_insert ON public.zentravel_checklist_statuses
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND zentravel_private.is_member(trip_id));
CREATE POLICY zentravel_checklist_update ON public.zentravel_checklist_statuses
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
