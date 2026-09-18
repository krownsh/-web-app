-- Outbound airport is TPE, not RMQ.

UPDATE public.zentravel_itinerary_items
SET
  title = '桃園機場起飛',
  location = '桃園機場',
  description = '桃園機場（TPE）13:30 起飛。'
WHERE title = '台中清泉崗起飛';

UPDATE public.zentravel_travelers
SET outbound = jsonb_set(outbound, '{route}', '"桃園 TPE → NAIA"')
WHERE outbound->>'route' = '清泉崗 RMQ → NAIA';
