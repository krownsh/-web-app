-- Replace Manila trip traveler cards with the 9-person roster.
DELETE FROM public.zentravel_travelers t
USING public.zentravel_trips tr
WHERE t.trip_id = tr.id AND tr.slug = 'manila-2026-09';

INSERT INTO public.zentravel_travelers (trip_id, display_name, outbound, inbound, sort_order)
SELECT tr.id, v.display_name, v.outbound::jsonb, v.inbound::jsonb, v.sort_order
FROM public.zentravel_trips tr
CROSS JOIN (
  VALUES
    ('美慧', 0, '{"date":"9/25","time":"13:30–15:30","label":"去程","route":"清泉崗 RMQ → NAIA","flight_no":""}', '{"date":"9/27","time":"16:50–19:05","label":"回程","route":"馬尼拉 → 桃園","flight_no":"CI704"}'),
    ('智濠', 1, '{"date":"9/25","time":"13:30–15:30","label":"去程","route":"清泉崗 RMQ → NAIA","flight_no":""}', '{"date":"9/27","time":"16:50–19:05","label":"回程","route":"馬尼拉 → 桃園","flight_no":"CI704"}'),
    ('Haru', 2, '{"date":"9/25","time":"13:30–15:30","label":"去程","route":"清泉崗 RMQ → NAIA","flight_no":""}', '{"date":"9/27","time":"16:50–19:05","label":"回程","route":"馬尼拉 → 桃園","flight_no":"CI704"}'),
    ('法蓉', 3, '{"date":"9/25","time":"13:30–15:30","label":"去程","route":"清泉崗 RMQ → NAIA","flight_no":""}', '{"date":"9/27","time":"16:50–19:05","label":"回程","route":"馬尼拉 → 桃園","flight_no":"CI704"}'),
    ('子晨', 4, '{"date":"9/25","time":"13:30–15:30","label":"去程","route":"清泉崗 RMQ → NAIA","flight_no":""}', '{"date":"9/27","time":"16:50–19:05","label":"回程","route":"馬尼拉 → 桃園","flight_no":"CI704"}'),
    ('韋劭', 5, '{"date":"9/25","time":"18:25–20:15","label":"去程","route":"高雄 KHH → 馬尼拉 MNL T1","flight_no":"Z2133","note":"菲律賓亞洲航空 · 經濟艙 · A320 · 1小時50分"}', '{"date":"9/27","time":"17:00–19:00","label":"回程","route":"馬尼拉 → 高雄","flight_no":"","note":"航班號待補"}'),
    ('郁欣', 6, '{"date":"9/25","time":"13:30–15:30","label":"去程","route":"清泉崗 RMQ → NAIA","flight_no":""}', '{"date":"9/27","time":"16:50–19:05","label":"回程","route":"馬尼拉 → 桃園","flight_no":"CI704"}'),
    ('峻軒', 7, '{"date":"9/25","time":"13:30–15:30","label":"去程","route":"清泉崗 RMQ → NAIA","flight_no":""}', '{"date":"9/27","time":"16:50–19:05","label":"回程","route":"馬尼拉 → 桃園","flight_no":"CI704"}'),
    ('承宏', 8, '{"date":"9/25","time":"13:30–15:30","label":"去程","route":"清泉崗 RMQ → NAIA","flight_no":""}', '{"date":"9/27","time":"16:50–19:05","label":"回程","route":"馬尼拉 → 桃園","flight_no":"CI704"}')
) AS v(display_name, sort_order, outbound, inbound)
WHERE tr.slug = 'manila-2026-09';

UPDATE public.zentravel_travelers t SET photo_url = v.photo_url
FROM public.zentravel_trips tr,
(VALUES
  ('美慧', '/travelers/meihui.png'),
  ('智濠', '/travelers/zhihao.png'),
  ('法蓉', '/travelers/farong.png'),
  ('子晨', '/travelers/zichen.png'),
  ('Haru', '/travelers/haru.jpg'),
  ('韋劭', '/travelers/weishao.png'),
  ('郁欣', '/travelers/yuxin.png'),
  ('峻軒', '/travelers/junxuan.png'),
  ('承宏', '/travelers/chenghong.png')
) AS v(display_name, photo_url)
WHERE t.trip_id = tr.id AND tr.slug = 'manila-2026-09' AND t.display_name = v.display_name;
