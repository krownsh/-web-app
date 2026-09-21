-- Fix Manila itinerary map pins: TPE was stored as NAIA, several stops shared one point.

UPDATE public.zentravel_itinerary_items AS i
SET
  lat = v.lat,
  lng = v.lng,
  location = COALESCE(v.location, i.location),
  updated_at = now()
FROM (
  VALUES
    ('d1-lai', 25.0777, 121.233, '桃園機場'),
    ('d1-ci703', 14.5086, 121.0198, 'NAIA T1'),
    ('d1-immigration', 14.5086, 121.0198, 'NAIA T1'),
    ('d1-grab', 14.5515, 121.0173, NULL),
    ('d1-checkin', 14.5515, 121.0173, NULL),
    ('d1-wei-board', 22.5771, 120.3498, '高雄國際機場'),
    ('d1-greenbelt', 14.55197, 121.0205, 'Greenbelt'),
    ('d1-manam', 14.5522, 121.0204, 'Greenbelt 2'),
    ('d1-wei-arrive', 14.5086, 121.0198, 'NAIA T1'),
    ('d1-walk', 14.5515, 121.0173, NULL),
    ('d2-grab-intra', 14.5515, 121.0173, 'Citadines'),
    ('d2-intramuros', 14.5906, 120.9733, 'Intramuros'),
    ('d2-robinsons', 14.5763, 120.9839, 'Robinsons Place Manila'),
    ('d2-kenny', 14.5763, 120.9839, 'Robinsons Place Manila'),
    ('d2-museum', 14.5869, 120.9812, 'Padre Burgos'),
    ('d2-moa', 14.5352, 120.9822, 'Pasay'),
    ('d2-bay', 14.5358, 120.9792, 'SM by the Bay'),
    ('d2-back', 14.5515, 121.0173, NULL),
    ('d3-legazpi', 14.554, 121.0245, 'Legazpi Village'),
    ('d3-pack', 14.5515, 121.0173, NULL),
    ('d3-checkout', 14.5515, 121.0173, NULL),
    ('d3-lunch', 14.55197, 121.0205, 'Greenbelt'),
    ('d3-airport', 14.5086, 121.0198, 'NAIA'),
    ('d3-ci704', 14.5086, 121.0198, 'NAIA')
) AS v(stable_key, lat, lng, location)
JOIN public.zentravel_trips t ON t.slug = 'manila-2026-09'
WHERE i.trip_id = t.id
  AND i.stable_key = v.stable_key;
