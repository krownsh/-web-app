-- Restore Manila seed (trip / days / itinerary / reminders / prep / travelers / personas).
-- Safe to re-run. Does not delete members, game data, or auth users.
-- Snapshot date: 2026-09-18

DO $$
DECLARE
  v_trip uuid;
BEGIN
  SELECT id INTO v_trip FROM public.zentravel_trips WHERE slug = 'manila-2026-09';
  IF v_trip IS NULL THEN
    INSERT INTO public.zentravel_trips (
      id, slug, join_code, title, subtitle, start_date, end_date, timezone,
      currency, exchange_rate, weather_lat, weather_lng, sos, theme
    ) VALUES (
      '30aafb80-d0c1-4c77-859b-2a4dd2aff81e'::uuid, 'manila-2026-09', 'MNL927', '馬尼拉三日',
      'Makati · Citadines Benavidez', '2026-09-25', '2026-09-27', 'Asia/Manila',
      'PHP', 0.52, 14.5515, 121.0173, '[{"label": "緊急電話", "phone": "911"}, {"label": "飯店", "phone": "+63 2 7744 9499"}]'::jsonb, '{"kit": "dora-sky", "tokens": {"bg": "#D7F0FF", "mist": "#F7FCFF", "moss": "#3AA0E8", "rock": "#C5E6F7", "text": "#1E3A5F", "accent": "#F5C518", "collar": "#E23D3D", "moss-light": "#7EC8F2", "text-light": "#5A7A9A"}, "appLabel": "馬尼拉三日", "shortName": "馬尼拉", "faviconUrl": "/dora-sky.svg", "icon192Url": "/dora-sky.svg", "icon512Url": "/dora-sky.svg", "themeColor": "#3AA0E8"}'::jsonb
    ) RETURNING id INTO v_trip;
  ELSE
    UPDATE public.zentravel_trips SET
      title = '馬尼拉三日',
      subtitle = 'Makati · Citadines Benavidez',
      start_date = '2026-09-25',
      end_date = '2026-09-27',
      timezone = 'Asia/Manila',
      currency = 'PHP',
      exchange_rate = 0.52,
      weather_lat = 14.5515,
      weather_lng = 121.0173,
      sos = '[{"label": "緊急電話", "phone": "911"}, {"label": "飯店", "phone": "+63 2 7744 9499"}]'::jsonb,
      theme = '{"kit": "dora-sky", "tokens": {"bg": "#D7F0FF", "mist": "#F7FCFF", "moss": "#3AA0E8", "rock": "#C5E6F7", "text": "#1E3A5F", "accent": "#F5C518", "collar": "#E23D3D", "moss-light": "#7EC8F2", "text-light": "#5A7A9A"}, "appLabel": "馬尼拉三日", "shortName": "馬尼拉", "faviconUrl": "/dora-sky.svg", "icon192Url": "/dora-sky.svg", "icon512Url": "/dora-sky.svg", "themeColor": "#3AA0E8"}'::jsonb,
      updated_at = now()
    WHERE id = v_trip;
  END IF;

  INSERT INTO public.zentravel_trip_days (
    trip_id, day_key, day_index, calendar_date, date_num, month_label, weekday_label, weather_note, reminder
  )
  SELECT v_trip, x.day_key, x.day_index, x.calendar_date::date, x.date_num, x.month_label, x.weekday_label, x.weather_note, x.reminder
  FROM jsonb_to_recordset('[{"day_key": "D1", "day_index": 1, "calendar_date": "2026-09-25", "date_num": "25", "month_label": "Sep", "weekday_label": "Fri", "weather_note": "抵達炎熱潮濕", "reminder": "桃園機場 13:30 起飛，15:30 抵達 NAIA。韋劭 18:25 登機、20:15 抵達。通關後換匯再 Grab。"}, {"day_key": "D2", "day_index": 2, "calendar_date": "2026-09-26", "date_num": "26", "month_label": "Sep", "weekday_label": "Sat", "weather_note": "熱、補水防曬", "reminder": "國家自然歷史博物館持護照免費。"}, {"day_key": "D3", "day_index": 3, "calendar_date": "2026-09-27", "date_num": "27", "month_label": "Sep", "weekday_label": "Sun", "weather_note": "週日市集早到", "reminder": "Legazpi Sunday Market 約 07:00–14:00。Checkout 12:00。"}]'::jsonb) AS x(
    day_key text, day_index int, calendar_date text, date_num text, month_label text,
    weekday_label text, weather_note text, reminder text
  )
  ON CONFLICT (trip_id, day_key) DO UPDATE SET
    day_index = EXCLUDED.day_index,
    calendar_date = EXCLUDED.calendar_date,
    date_num = EXCLUDED.date_num,
    month_label = EXCLUDED.month_label,
    weekday_label = EXCLUDED.weekday_label,
    weather_note = EXCLUDED.weather_note,
    reminder = EXCLUDED.reminder;

  INSERT INTO public.zentravel_itinerary_items (
    trip_id, stable_key, day_key, sort_order, time, title, description, location, type, lat, lng, origin
  )
  SELECT v_trip, x.stable_key, x.day_key, x.sort_order, x.time, x.title, x.description, x.location, x.type, x.lat, x.lng, 'seed'
  FROM jsonb_to_recordset('[{"stable_key": "d1-lai", "day_key": "D1", "sort_order": 1, "time": "13:30", "title": "桃園機場起飛", "description": "桃園機場（TPE）13:30 起飛。", "location": "桃園機場", "type": "flight", "lat": 25.0777, "lng": 121.233}, {"stable_key": "d1-ci703", "day_key": "D1", "sort_order": 2, "time": "15:30", "title": "抵達菲律賓", "description": "15:30 抵達 NAIA。", "location": "NAIA T1", "type": "flight", "lat": 14.5086, "lng": 121.0198}, {"stable_key": "d1-immigration", "day_key": "D1", "sort_order": 3, "time": "15:45", "title": "通關／領行李／換匯", "description": "15:45–17:00 通關／領行李／換匯。", "location": "NAIA T1", "type": "transport", "lat": 14.5086, "lng": 121.0198}, {"stable_key": "d1-grab", "day_key": "D1", "sort_order": 4, "time": "17:00", "title": "Grab 前往飯店", "description": "17:00–17:30", "location": "Makati", "type": "transport", "lat": 14.5515, "lng": 121.0173}, {"stable_key": "d1-checkin", "day_key": "D1", "sort_order": 5, "time": "17:30", "title": "Citadines 入住", "description": "Citadines Benavidez Makati。入住 14:00 起", "location": "110 Benavidez Street", "type": "hotel", "lat": 14.5515, "lng": 121.0173}, {"stable_key": "d1-wei-board", "day_key": "D1", "sort_order": 6, "time": "18:25", "title": "韋劭上飛機", "description": "菲律賓亞洲航空 Z2133，高雄 KHH 18:25 起飛，經濟艙 A320。", "location": "高雄國際機場", "type": "flight", "lat": 22.5771, "lng": 120.3498}, {"stable_key": "d1-greenbelt", "day_key": "D1", "sort_order": 7, "time": "18:30", "title": "前往 Greenbelt Mall", "description": "18:30–19:00", "location": "Greenbelt", "type": "shopping", "lat": 14.55197, "lng": 121.0205}, {"stable_key": "d1-manam", "day_key": "D1", "sort_order": 8, "time": "19:00", "title": "晚餐 Manam", "description": "Crispy Sisig、Sinigang。19:00–20:30", "location": "Greenbelt 2", "type": "food", "lat": 14.5522, "lng": 121.0204}, {"stable_key": "d1-wei-arrive", "day_key": "D1", "sort_order": 9, "time": "20:15", "title": "韋劭抵達菲律賓", "description": "Z2133 20:15 抵達尼諾伊·阿基諾國際機場 T1。", "location": "NAIA T1", "type": "flight", "lat": 14.5086, "lng": 121.0198}, {"stable_key": "d1-walk", "day_key": "D1", "sort_order": 10, "time": "20:30", "title": "Greenbelt 散步回飯店", "description": "飯店旁有便利商店與麥當勞", "location": "Makati", "type": "activity", "lat": 14.5515, "lng": 121.0173}, {"stable_key": "d2-grab-intra", "day_key": "D2", "sort_order": 1, "time": "08:00", "title": "集合 Grab 往 Intramuros", "description": "熱、補水防曬", "location": "Citadines", "type": "transport", "lat": 14.5515, "lng": 121.0173}, {"stable_key": "d2-intramuros", "day_key": "D2", "sort_order": 2, "time": "09:00", "title": "王城區", "description": "馬尼拉大教堂、La Cathedral Café、Casa Manila。09:00–12:00", "location": "Intramuros", "type": "attraction", "lat": 14.5906, "lng": 120.9733}, {"stable_key": "d2-robinsons", "day_key": "D2", "sort_order": 3, "time": "12:00", "title": "Grab 至 Robinsons Place Manila", "description": "12:00–12:30", "location": "Robinsons Place Manila", "type": "transport", "lat": 14.5763, "lng": 120.9839}, {"stable_key": "d2-kenny", "day_key": "D2", "sort_order": 4, "time": "12:30", "title": "Kenny Rogers Roasters", "description": "商場休息。12:30–14:30", "location": "Robinsons Place Manila", "type": "food", "lat": 14.5763, "lng": 120.9839}, {"stable_key": "d2-museum", "day_key": "D2", "sort_order": 5, "time": "14:30", "title": "國家自然歷史博物館", "description": "護照免費。14:30–16:30", "location": "Padre Burgos", "type": "attraction", "lat": 14.5869, "lng": 120.9812}, {"stable_key": "d2-moa", "day_key": "D2", "sort_order": 6, "time": "16:30", "title": "SM Mall of Asia 夕陽", "description": "16:30–18:30", "location": "Pasay", "type": "activity", "lat": 14.5352, "lng": 120.9822}, {"stable_key": "d2-bay", "day_key": "D2", "sort_order": 7, "time": "18:30", "title": "海灣晚餐", "description": "18:30–20:30", "location": "SM by the Bay", "type": "food", "lat": 14.5358, "lng": 120.9792}, {"stable_key": "d2-back", "day_key": "D2", "sort_order": 8, "time": "20:30", "title": "回飯店", "description": "Citadines", "location": "Makati", "type": "hotel", "lat": 14.5515, "lng": 121.0173}, {"stable_key": "d3-legazpi", "day_key": "D3", "sort_order": 1, "time": "09:00", "title": "Legazpi Sunday Market", "description": "市集約 07:00–14:00，建議早到。09:00–11:30", "location": "Legazpi Village", "type": "market", "lat": 14.554, "lng": 121.0245}, {"stable_key": "d3-pack", "day_key": "D3", "sort_order": 2, "time": "11:30", "title": "回飯店整理行李", "description": "11:30–12:00", "location": "Citadines", "type": "hotel", "lat": 14.5515, "lng": 121.0173}, {"stable_key": "d3-checkout", "day_key": "D3", "sort_order": 3, "time": "12:00", "title": "Check-out", "description": "退房 12:00", "location": "Citadines", "type": "hotel", "lat": 14.5515, "lng": 121.0173}, {"stable_key": "d3-lunch", "day_key": "D3", "sort_order": 4, "time": "12:15", "title": "午餐", "description": "12:00–13:30", "location": "Greenbelt", "type": "food", "lat": 14.55197, "lng": 121.0205}, {"stable_key": "d3-airport", "day_key": "D3", "sort_order": 5, "time": "13:30", "title": "Grab 機場／辦理登機", "description": "13:30–14:00 出發；14:00 辦登機", "location": "NAIA", "type": "transport", "lat": 14.5086, "lng": 121.0198}, {"stable_key": "d3-ci704", "day_key": "D3", "sort_order": 6, "time": "16:50", "title": "華航 CI704 馬尼拉 → 桃園", "description": "16:50–19:05", "location": "NAIA", "type": "flight", "lat": 14.5086, "lng": 121.0198}]'::jsonb) AS x(
    stable_key text, day_key text, sort_order int, time text, title text, description text,
    location text, type text, lat double precision, lng double precision
  )
  ON CONFLICT (trip_id, stable_key) DO UPDATE SET
    day_key = EXCLUDED.day_key,
    sort_order = EXCLUDED.sort_order,
    time = EXCLUDED.time,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    location = EXCLUDED.location,
    type = EXCLUDED.type,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    origin = 'seed',
    updated_at = now();

  DELETE FROM public.zentravel_reminders WHERE trip_id = v_trip;
  INSERT INTO public.zentravel_reminders (trip_id, sort_order, title, icon, payload)
  SELECT v_trip, x.sort_order, x.title, x.icon, x.payload
  FROM jsonb_to_recordset('[{"sort_order": 1, "title": "生活資訊", "icon": "info", "payload": {"items": ["時差：與台灣相同（0 小時）", "電壓：220V", "飛行時間：約 2 小時", "幣別 PHP，約 1 PHP ≈ 0.52 TWD"]}}, {"sort_order": 2, "title": "入境與交通", "icon": "flight_takeoff", "payload": {"items": ["護照效期請自行確認", "建議帶美金到當地換 PHP", "先下載 Grab", "緊急電話 911"]}}, {"sort_order": 3, "title": "華航行李概要", "icon": "luggage", "payload": {"items": ["托運約 23 公斤", "手提約 7 公斤", "以當日航空公司公告為準"]}}, {"sort_order": 4, "title": "氣候", "icon": "wb_sunny", "payload": {"items": ["這三天都會下雨，請記得帶雨傘", "炎熱潮濕，補水防曬", "D2 戶外行程多，備水"]}}, {"sort_order": 5, "title": "住宿", "icon": "hotel", "payload": {"items": ["Citadines Benavidez Makati", "110 Benavidez Street, Makati 1229", "電話 +63 2 7744 9499", "GPS 14.5515, 121.0173", "入住 9/25 14:00，退房 9/27 12:00", "4 間房約 TWD 24,986"]}}]'::jsonb) AS x(sort_order int, title text, icon text, payload jsonb);

  DELETE FROM public.zentravel_prep_items WHERE trip_id = v_trip;
  INSERT INTO public.zentravel_prep_items (trip_id, tab, sort_order, title, body)
  VALUES
    (v_trip, 'pre-trip', 1, '護照效期', '出發前確認護照效期'),
    (v_trip, 'stay', 1, 'Citadines Benavidez Makati', '110 Benavidez Street, Makati。+63 2 7744 9499。入住 9/25 14:00、退房 9/27 12:00。4 間約 TWD 24,986'),
    (v_trip, 'pre-trip', 2, 'SIM＋旅平險', '開通漫遊或當地 SIM，投保旅平險'),
    (v_trip, 'pre-trip', 3, '換匯', '可帶美金到當地換 PHP'),
    (v_trip, 'pre-trip', 4, '下載 Grab', '落地交通用');

  INSERT INTO public.zentravel_travelers (trip_id, display_name, photo_url, outbound, inbound, sort_order)
  SELECT v_trip, x.display_name, x.photo_url, x.outbound, x.inbound, x.sort_order
  FROM jsonb_to_recordset('[{"display_name": "美慧", "photo_url": "/travelers/meihui.jpg", "sort_order": 0, "outbound": {"date": "9/25", "time": "13:30–15:30", "label": "去程", "route": "桃園 TPE → NAIA", "flight_no": ""}, "inbound": {"date": "9/27", "time": "16:50–19:05", "label": "回程", "route": "馬尼拉 → 桃園", "flight_no": "CI704"}}, {"display_name": "智濠", "photo_url": "/travelers/zhihao.jpg", "sort_order": 1, "outbound": {"date": "9/25", "time": "13:30–15:30", "label": "去程", "route": "桃園 TPE → NAIA", "flight_no": ""}, "inbound": {"date": "9/27", "time": "16:50–19:05", "label": "回程", "route": "馬尼拉 → 桃園", "flight_no": "CI704"}}, {"display_name": "Haru", "photo_url": "/travelers/haru.jpg", "sort_order": 2, "outbound": {"date": "9/25", "time": "13:30–15:30", "label": "去程", "route": "桃園 TPE → NAIA", "flight_no": ""}, "inbound": {"date": "9/27", "time": "16:50–19:05", "label": "回程", "route": "馬尼拉 → 桃園", "flight_no": "CI704"}}, {"display_name": "法蓉", "photo_url": "/travelers/farong.jpg", "sort_order": 3, "outbound": {"date": "9/25", "time": "13:30–15:30", "label": "去程", "route": "桃園 TPE → NAIA", "flight_no": ""}, "inbound": {"date": "9/27", "time": "16:50–19:05", "label": "回程", "route": "馬尼拉 → 桃園", "flight_no": "CI704"}}, {"display_name": "子晨", "photo_url": "/travelers/zichen.jpg", "sort_order": 4, "outbound": {"date": "9/25", "time": "13:30–15:30", "label": "去程", "route": "桃園 TPE → NAIA", "flight_no": ""}, "inbound": {"date": "9/27", "time": "16:50–19:05", "label": "回程", "route": "馬尼拉 → 桃園", "flight_no": "CI704"}}, {"display_name": "峻軒", "photo_url": "/travelers/junxuan.jpg", "sort_order": 5, "outbound": {"date": "9/25", "time": "13:30–15:30", "label": "去程", "route": "桃園 TPE → NAIA", "flight_no": ""}, "inbound": {"date": "9/27", "time": "16:50–19:05", "label": "回程", "route": "馬尼拉 → 桃園", "flight_no": "CI704"}}, {"display_name": "韋劭", "photo_url": "/travelers/weishao.jpg", "sort_order": 6, "outbound": {"date": "9/25", "note": "菲律賓亞洲航空 · 經濟艙 · A320 · 1小時50分", "time": "18:25–20:15", "label": "去程", "route": "高雄 KHH → 馬尼拉 MNL T1", "flight_no": "Z2133"}, "inbound": {"date": "9/27", "note": "航班號待補", "time": "17:00–19:00", "label": "回程", "route": "馬尼拉 → 高雄", "flight_no": ""}}, {"display_name": "郁欣", "photo_url": "/travelers/yuxin.jpg", "sort_order": 7, "outbound": {"date": "9/25", "time": "13:30–15:30", "label": "去程", "route": "桃園 TPE → NAIA", "flight_no": ""}, "inbound": {"date": "9/27", "time": "16:50–19:05", "label": "回程", "route": "馬尼拉 → 桃園", "flight_no": "CI704"}}, {"display_name": "承宏", "photo_url": "/travelers/chenghong.jpg", "sort_order": 8, "outbound": {"date": "9/25", "time": "13:30–15:30", "label": "去程", "route": "桃園 TPE → NAIA", "flight_no": ""}, "inbound": {"date": "9/27", "time": "16:50–19:05", "label": "回程", "route": "馬尼拉 → 桃園", "flight_no": "CI704"}}]'::jsonb) AS x(
    display_name text, photo_url text, sort_order int, outbound jsonb, inbound jsonb
  )
  WHERE NOT EXISTS (
    SELECT 1 FROM public.zentravel_travelers t
    WHERE t.trip_id = v_trip AND t.display_name = x.display_name
  );
  UPDATE public.zentravel_travelers t SET
    photo_url = x.photo_url, outbound = x.outbound, inbound = x.inbound, sort_order = x.sort_order
  FROM jsonb_to_recordset('[{"display_name": "美慧", "photo_url": "/travelers/meihui.jpg", "sort_order": 0, "outbound": {"date": "9/25", "time": "13:30–15:30", "label": "去程", "route": "桃園 TPE → NAIA", "flight_no": ""}, "inbound": {"date": "9/27", "time": "16:50–19:05", "label": "回程", "route": "馬尼拉 → 桃園", "flight_no": "CI704"}}, {"display_name": "智濠", "photo_url": "/travelers/zhihao.jpg", "sort_order": 1, "outbound": {"date": "9/25", "time": "13:30–15:30", "label": "去程", "route": "桃園 TPE → NAIA", "flight_no": ""}, "inbound": {"date": "9/27", "time": "16:50–19:05", "label": "回程", "route": "馬尼拉 → 桃園", "flight_no": "CI704"}}, {"display_name": "Haru", "photo_url": "/travelers/haru.jpg", "sort_order": 2, "outbound": {"date": "9/25", "time": "13:30–15:30", "label": "去程", "route": "桃園 TPE → NAIA", "flight_no": ""}, "inbound": {"date": "9/27", "time": "16:50–19:05", "label": "回程", "route": "馬尼拉 → 桃園", "flight_no": "CI704"}}, {"display_name": "法蓉", "photo_url": "/travelers/farong.jpg", "sort_order": 3, "outbound": {"date": "9/25", "time": "13:30–15:30", "label": "去程", "route": "桃園 TPE → NAIA", "flight_no": ""}, "inbound": {"date": "9/27", "time": "16:50–19:05", "label": "回程", "route": "馬尼拉 → 桃園", "flight_no": "CI704"}}, {"display_name": "子晨", "photo_url": "/travelers/zichen.jpg", "sort_order": 4, "outbound": {"date": "9/25", "time": "13:30–15:30", "label": "去程", "route": "桃園 TPE → NAIA", "flight_no": ""}, "inbound": {"date": "9/27", "time": "16:50–19:05", "label": "回程", "route": "馬尼拉 → 桃園", "flight_no": "CI704"}}, {"display_name": "峻軒", "photo_url": "/travelers/junxuan.jpg", "sort_order": 5, "outbound": {"date": "9/25", "time": "13:30–15:30", "label": "去程", "route": "桃園 TPE → NAIA", "flight_no": ""}, "inbound": {"date": "9/27", "time": "16:50–19:05", "label": "回程", "route": "馬尼拉 → 桃園", "flight_no": "CI704"}}, {"display_name": "韋劭", "photo_url": "/travelers/weishao.jpg", "sort_order": 6, "outbound": {"date": "9/25", "note": "菲律賓亞洲航空 · 經濟艙 · A320 · 1小時50分", "time": "18:25–20:15", "label": "去程", "route": "高雄 KHH → 馬尼拉 MNL T1", "flight_no": "Z2133"}, "inbound": {"date": "9/27", "note": "航班號待補", "time": "17:00–19:00", "label": "回程", "route": "馬尼拉 → 高雄", "flight_no": ""}}, {"display_name": "郁欣", "photo_url": "/travelers/yuxin.jpg", "sort_order": 7, "outbound": {"date": "9/25", "time": "13:30–15:30", "label": "去程", "route": "桃園 TPE → NAIA", "flight_no": ""}, "inbound": {"date": "9/27", "time": "16:50–19:05", "label": "回程", "route": "馬尼拉 → 桃園", "flight_no": "CI704"}}, {"display_name": "承宏", "photo_url": "/travelers/chenghong.jpg", "sort_order": 8, "outbound": {"date": "9/25", "time": "13:30–15:30", "label": "去程", "route": "桃園 TPE → NAIA", "flight_no": ""}, "inbound": {"date": "9/27", "time": "16:50–19:05", "label": "回程", "route": "馬尼拉 → 桃園", "flight_no": "CI704"}}]'::jsonb) AS x(
    display_name text, photo_url text, sort_order int, outbound jsonb, inbound jsonb
  )
  WHERE t.trip_id = v_trip AND t.display_name = x.display_name;

  INSERT INTO public.zentravel_guest_personas (trip_id, slug, display_name, photo_url, exclusive, sort_order)
  SELECT v_trip, x.slug, x.display_name, x.photo_url, x.exclusive, x.sort_order
  FROM jsonb_to_recordset('[{"slug": "guest-a", "display_name": "彥文", "photo_url": "/guests/a.png", "exclusive": true, "sort_order": 0}, {"slug": "guest-b", "display_name": "靜瑩", "photo_url": "/guests/b.png", "exclusive": true, "sort_order": 1}, {"slug": "guest-c", "display_name": "宇庭", "photo_url": "/guests/c.png", "exclusive": true, "sort_order": 2}, {"slug": "guest-d", "display_name": "庭宇", "photo_url": "/guests/d.png", "exclusive": true, "sort_order": 3}, {"slug": "guest-shared", "display_name": "共用訪客", "photo_url": null, "exclusive": false, "sort_order": 4}]'::jsonb) AS x(
    slug text, display_name text, photo_url text, exclusive boolean, sort_order int
  )
  ON CONFLICT (trip_id, slug) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    photo_url = EXCLUDED.photo_url,
    exclusive = EXCLUDED.exclusive,
    sort_order = EXCLUDED.sort_order;
END $$;
