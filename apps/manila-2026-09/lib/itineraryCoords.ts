export type MapCoord = { lat: number; lng: number };

/** Temporary Cebu pins. Keys retain their stable database identifiers. */
export const ITINERARY_COORDS: Record<string, MapCoord> = {
    'd1-lai': { lat: 25.0777, lng: 121.233 }, // 桃園 TPE T2
    'd1-ci703': { lat: 10.3075, lng: 123.9794 }, // Mactan-Cebu airport
    'd1-immigration': { lat: 10.3075, lng: 123.9794 },
    'd1-grab': { lat: 10.3157, lng: 123.8854 },
    'd1-checkin': { lat: 10.3157, lng: 123.8854 },
    'd1-wei-board': { lat: 22.5771, lng: 120.3498 }, // 高雄 KHH
    'd1-greenbelt': { lat: 10.2930, lng: 123.9024 },
    'd1-manam': { lat: 10.2930, lng: 123.9024 },
    'd1-wei-arrive': { lat: 10.3075, lng: 123.9794 },
    'd1-walk': { lat: 10.3157, lng: 123.8854 },
    'd2-grab-intra': { lat: 10.3157, lng: 123.8854 },
    'd2-intramuros': { lat: 10.2930, lng: 123.9024 },
    'd2-robinsons': { lat: 10.3103, lng: 123.8939 },
    'd2-kenny': { lat: 10.3103, lng: 123.8939 },
    'd2-museum': { lat: 10.2985, lng: 123.9048 },
    'd2-moa': { lat: 10.2663, lng: 123.9997 },
    'd2-bay': { lat: 10.2663, lng: 123.9997 },
    'd2-back': { lat: 10.3157, lng: 123.8854 },
    'd3-legazpi': { lat: 10.3153, lng: 123.8855 },
    'd3-pack': { lat: 10.3157, lng: 123.8854 },
    'd3-checkout': { lat: 10.3157, lng: 123.8854 },
    'd3-lunch': { lat: 10.3153, lng: 123.8855 },
    'd3-airport': { lat: 10.3075, lng: 123.9794 },
    'd3-ci704': { lat: 10.3075, lng: 123.9794 },
};

const COORDS_BY_TITLE: Record<string, MapCoord> = {
    '桃園機場起飛': ITINERARY_COORDS['d1-lai'],
    '抵達菲律賓': ITINERARY_COORDS['d1-ci703'],
    '通關／領行李／換匯': ITINERARY_COORDS['d1-immigration'],
    'Grab 前往飯店': ITINERARY_COORDS['d1-grab'],
    'Citadines 入住': ITINERARY_COORDS['d1-checkin'],
    '韋劭上飛機': ITINERARY_COORDS['d1-wei-board'],
    '前往 Greenbelt Mall': ITINERARY_COORDS['d1-greenbelt'],
    '晚餐 Manam': ITINERARY_COORDS['d1-manam'],
    '韋劭抵達菲律賓': ITINERARY_COORDS['d1-wei-arrive'],
    'Greenbelt 散步回飯店': ITINERARY_COORDS['d1-walk'],
    '集合 Grab 往 Intramuros': ITINERARY_COORDS['d2-grab-intra'],
    '王城區': ITINERARY_COORDS['d2-intramuros'],
    'Grab 至 Robinsons Place Manila': ITINERARY_COORDS['d2-robinsons'],
    'Kenny Rogers Roasters': ITINERARY_COORDS['d2-kenny'],
    '國家自然歷史博物館': ITINERARY_COORDS['d2-museum'],
    'SM Mall of Asia 夕陽': ITINERARY_COORDS['d2-moa'],
    '海灣晚餐': ITINERARY_COORDS['d2-bay'],
    '回飯店': ITINERARY_COORDS['d2-back'],
    'Legazpi Sunday Market': ITINERARY_COORDS['d3-legazpi'],
    '回飯店整理行李': ITINERARY_COORDS['d3-pack'],
    'Check-out': ITINERARY_COORDS['d3-checkout'],
    '午餐': ITINERARY_COORDS['d3-lunch'],
    'Grab 機場／辦理登機': ITINERARY_COORDS['d3-airport'],
    '華航 CI704 馬尼拉 → 桃園': ITINERARY_COORDS['d3-ci704'],
};

export function resolveItemCoords(item: {
    stable_key?: string | null;
    title?: string | null;
    lat?: number | null;
    lng?: number | null;
}): MapCoord | null {
    const known =
        (item.stable_key && ITINERARY_COORDS[item.stable_key]) ||
        (item.title && COORDS_BY_TITLE[item.title.trim()]);
    if (known) return known;
    const lat = Number(item.lat);
    const lng = Number(item.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) {
        return { lat, lng };
    }
    return null;
}

/** Fan out pins that share the same place so every stop stays tappable. */
export function spreadOverlappingMarkers<T extends { lat: number; lng: number }>(
    items: T[],
    meters = 42
): T[] {
    const groups = new Map<string, number[]>();
    items.forEach((item, index) => {
        const key = `${item.lat.toFixed(4)},${item.lng.toFixed(4)}`;
        const list = groups.get(key) || [];
        list.push(index);
        groups.set(key, list);
    });

    const next = items.map((item) => ({ ...item }));
    const latMeters = 111_320;

    for (const indexes of groups.values()) {
        if (indexes.length < 2) continue;
        const n = indexes.length;
        const radius = meters / latMeters;
        indexes.forEach((itemIndex, i) => {
            const origin = items[itemIndex];
            const angle = (2 * Math.PI * i) / n - Math.PI / 2;
            const cosLat = Math.cos((origin.lat * Math.PI) / 180);
            next[itemIndex] = {
                ...next[itemIndex],
                lat: origin.lat + radius * Math.cos(angle),
                lng: origin.lng + (radius * Math.sin(angle)) / Math.max(cosLat, 0.2),
            };
        });
    }
    return next;
}
