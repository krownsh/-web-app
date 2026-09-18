-- Guest exclusive names + photos; shared guest has no photo.

UPDATE public.zentravel_guest_personas
SET display_name = v.display_name, photo_url = v.photo_url
FROM (VALUES
  ('guest-a', '彥文', '/guests/a.png'),
  ('guest-b', '靜瑩', '/guests/b.png'),
  ('guest-c', '宇庭', '/guests/c.png'),
  ('guest-d', '庭宇', '/guests/d.png'),
  ('guest-shared', '共用訪客', NULL)
) AS v(slug, display_name, photo_url)
WHERE zentravel_guest_personas.slug = v.slug
  AND trip_id = (SELECT id FROM public.zentravel_trips WHERE slug = 'manila-2026-09');
