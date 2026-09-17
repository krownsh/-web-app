-- 「你是誰」後四位改為：峻軒、韋劭、郁欣、承宏
UPDATE public.zentravel_travelers t
SET sort_order = v.sort_order
FROM public.zentravel_trips tr,
(VALUES
  ('美慧', 0),
  ('智濠', 1),
  ('Haru', 2),
  ('法蓉', 3),
  ('子晨', 4),
  ('峻軒', 5),
  ('韋劭', 6),
  ('郁欣', 7),
  ('承宏', 8)
) AS v(display_name, sort_order)
WHERE t.trip_id = tr.id
  AND tr.slug = 'manila-2026-09'
  AND t.display_name = v.display_name;
