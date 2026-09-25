-- Temporary Cebu presentation for the existing trip. Keep the slug unchanged so
-- members, game data, and existing links continue to work. Revert this commit to restore.

UPDATE public.zentravel_trips
SET
  title = '宿霧三日',
  subtitle = 'Cebu City · Quest Hotel',
  weather_lat = 10.3157,
  weather_lng = 123.8854,
  theme = jsonb_set(
    jsonb_set(theme, '{appLabel}', '"宿霧三日"'),
    '{shortName}', '"宿霧"'
  ),
  updated_at = now()
WHERE slug = 'manila-2026-09';

UPDATE public.zentravel_trip_days d
SET weather_note = v.weather_note, reminder = v.reminder
FROM public.zentravel_trips t,
(VALUES
  ('D1', '抵達炎熱潮濕', '桃園機場 13:30 起飛，15:30 抵達麥克坦宿霧機場。通關後換匯再 Grab。'),
  ('D2', '熱、補水防曬', '市區景點與海邊行程，記得防曬。'),
  ('D3', '週日市集早到', 'Carbon Market 約早上開始營業。Checkout 12:00。')
) AS v(day_key, weather_note, reminder)
WHERE d.trip_id = t.id AND v.day_key = d.day_key AND t.slug = 'manila-2026-09';

UPDATE public.zentravel_itinerary_items i
SET
  title = v.title,
  description = v.description,
  location = v.location,
  type = v.type,
  lat = v.lat,
  lng = v.lng,
  updated_at = now()
FROM public.zentravel_trips t,
(VALUES
  ('d1-ci703','抵達宿霧','15:30 抵達麥克坦宿霧國際機場。','Mactan-Cebu International Airport','flight',10.3075,123.9794),
  ('d1-immigration','通關／領行李／換匯','15:45–17:00 通關／領行李／換匯。','Mactan-Cebu International Airport','transport',10.3075,123.9794),
  ('d1-grab','Grab 前往飯店','17:00–17:30','Cebu City','transport',10.3157,123.8854),
  ('d1-checkin','Quest Hotel 入住','Cebu City 市區入住。','Quest Hotel & Conference Center Cebu','hotel',10.3157,123.8854),
  ('d1-greenbelt','前往麥哲倫十字架','18:30–19:00','Magellan’s Cross','attraction',10.2930,123.9024),
  ('d1-manam','晚餐：Cebu Lechon','烤乳豬與海鮮。19:00–20:30','Cebu City','food',10.2930,123.9024),
  ('d1-wei-arrive','韋劭抵達宿霧','20:15 抵達麥克坦宿霧國際機場。','Mactan-Cebu International Airport','flight',10.3075,123.9794),
  ('d1-walk','宿霧市區散步回飯店','飯店附近自由活動。','Cebu City','activity',10.3157,123.8854),
  ('d2-grab-intra','集合 Grab 往聖嬰聖殿','熱、補水防曬','Basilica del Santo Niño','transport',10.2930,123.9024),
  ('d2-intramuros','聖嬰聖殿與麥哲倫十字架','周邊散步拍照。09:00–12:00','Basilica del Santo Niño','attraction',10.2930,123.9024),
  ('d2-robinsons','Grab 至 Ayala Center Cebu','12:00–12:30','Ayala Center Cebu','transport',10.3103,123.8939),
  ('d2-kenny','Ayala Center 午餐','商場休息。12:30–14:30','Ayala Center Cebu','food',10.3103,123.8939),
  ('d2-museum','Museo Sugbo','宿霧博物館散步。14:30–16:30','Museo Sugbo','attraction',10.2985,123.9048),
  ('d2-moa','麥克坦海邊夕陽','16:30–18:30','Mactan','activity',10.2663,123.9997),
  ('d2-bay','海景晚餐','18:30–20:30','Mactan','food',10.2663,123.9997),
  ('d2-back','回飯店','Quest Hotel','Cebu City','hotel',10.3157,123.8854),
  ('d3-legazpi','Carbon Market','市集約早上開始，建議早到。09:00–11:30','Carbon Market','market',10.3153,123.8855),
  ('d3-pack','回飯店整理行李','11:30–12:00','Quest Hotel','hotel',10.3157,123.8854),
  ('d3-checkout','Check-out','退房 12:00','Quest Hotel','hotel',10.3157,123.8854),
  ('d3-lunch','午餐：宿霧市區','12:00–13:30','Cebu City','food',10.3153,123.8855),
  ('d3-airport','Grab 機場／辦理登機','13:30–14:00 出發；14:00 辦登機','Mactan-Cebu International Airport','transport',10.3075,123.9794),
  ('d3-ci704','華航 CI704 宿霧 → 桃園','16:50–19:05','Mactan-Cebu International Airport','flight',10.3075,123.9794)
) AS v(stable_key, title, description, location, type, lat, lng)
WHERE i.trip_id = t.id AND v.stable_key = i.stable_key AND t.slug = 'manila-2026-09';

UPDATE public.zentravel_travelers tr
SET
  outbound = jsonb_set(tr.outbound, '{route}', '"桃園 TPE → 宿霧 CEB"'),
  inbound = jsonb_set(tr.inbound, '{route}', '"宿霧 → 桃園"')
FROM public.zentravel_trips t
WHERE tr.trip_id = t.id AND t.slug = 'manila-2026-09';

UPDATE public.zentravel_reminders r
SET payload = '{"items":["Quest Hotel & Conference Center Cebu","Cebu City","入住 9/25，退房 9/27","市區集合後再出發"]}'::jsonb
FROM public.zentravel_trips t
WHERE r.trip_id = t.id AND t.slug = 'manila-2026-09' AND r.title = '住宿';
