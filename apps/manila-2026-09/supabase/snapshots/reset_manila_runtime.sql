-- Repeatable wipe of Manila *runtime* data only.
-- Keeps seed: trip row, days, itinerary, reminders, prep, travelers, guest_personas.
-- Does NOT touch bangkok-hua-hin-2025-12 or thaiwomao_ / chromeorder_ / stickerbook_ tables.
--
-- Storage: Postgres 不允許直接 DELETE storage.objects。
-- 請在 Dashboard → Storage → zentravel-game-photos 清空該 trip 資料夾，
-- 或用 Storage API。路徑前綴為馬尼拉 trip_id。

DO $$
DECLARE
  v_trip uuid;
BEGIN
  SELECT id INTO v_trip
  FROM public.zentravel_trips
  WHERE slug = 'manila-2026-09';

  IF v_trip IS NULL THEN
    RAISE EXCEPTION 'manila-2026-09 trip not found';
  END IF;

  DELETE FROM public.zentravel_game_devil_photo_votes WHERE trip_id = v_trip;
  DELETE FROM public.zentravel_game_devil_photos WHERE trip_id = v_trip;
  DELETE FROM public.zentravel_game_guesses WHERE trip_id = v_trip;
  DELETE FROM public.zentravel_game_wishes WHERE trip_id = v_trip;
  DELETE FROM public.zentravel_game_draws WHERE trip_id = v_trip;
  DELETE FROM public.zentravel_game_claims WHERE trip_id = v_trip;
  DELETE FROM public.zentravel_guest_claims WHERE trip_id = v_trip;
  DELETE FROM public.zentravel_budget_records WHERE trip_id = v_trip;
  DELETE FROM public.zentravel_budgets WHERE trip_id = v_trip;
  DELETE FROM public.zentravel_checklist_statuses WHERE trip_id = v_trip;
  DELETE FROM public.zentravel_guide_links WHERE trip_id = v_trip;
  DELETE FROM public.zentravel_must_buys WHERE trip_id = v_trip;
  DELETE FROM public.zentravel_itinerary_items
  WHERE trip_id = v_trip AND origin IS DISTINCT FROM 'seed';

  UPDATE public.zentravel_users
  SET active_trip_id = NULL
  WHERE active_trip_id = v_trip;
END $$;

-- 第二段：刪全部馬尼拉團籍，並刪「只用過馬尼拉」的 auth。
-- 若要留主揪外測帳，不要執行下面這段。
-- zentravel_users rows cascade from auth.users.
WITH manila AS (
  SELECT id FROM public.zentravel_trips WHERE slug = 'manila-2026-09'
),
candidates AS (
  SELECT m.user_id
  FROM public.zentravel_trip_members m
  JOIN manila t ON t.id = m.trip_id
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.zentravel_trip_members o
    JOIN public.zentravel_trips ot ON ot.id = o.trip_id
    WHERE o.user_id = m.user_id
      AND ot.slug <> 'manila-2026-09'
  )
    AND NOT EXISTS (SELECT 1 FROM public.thaiwomao_users u WHERE u.id = m.user_id)
    AND NOT EXISTS (SELECT 1 FROM public.chromeorder_users u WHERE u.id = m.user_id)
    AND NOT EXISTS (SELECT 1 FROM public.stickerbook_users u WHERE u.id = m.user_id)
),
drop_members AS (
  DELETE FROM public.zentravel_trip_members m
  USING manila t
  WHERE m.trip_id = t.id
  RETURNING m.user_id
),
del_auth AS (
  DELETE FROM auth.users au
  USING candidates c
  WHERE au.id = c.user_id
  RETURNING au.id
)
SELECT
  (SELECT count(*) FROM drop_members) AS members_removed,
  (SELECT count(*) FROM del_auth) AS auth_deleted;
