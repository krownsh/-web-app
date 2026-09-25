export type MapCoord = { lat: number; lng: number };

/** Canonical pins for Manila 2026-09. Keys are itinerary stable_key. */
export const ITINERARY_COORDS: Record<string, MapCoord> = {
    'd1-lai': { lat: 25.0777, lng: 121.233 }, // 桃園 TPE T2
    'd1-ci703': { lat: 14.5086, lng: 121.0198 }, // NAIA T1
    'd1-immigration': { lat: 14.5086, lng: 121.0198 },
    'd1-grab': { lat: 14.5515, lng: 121.0173 }, // Citadines
    'd1-checkin': { lat: 14.5515, lng: 121.0173 },
    'd1-wei-board': { lat: 22.5771, lng: 120.3498 }, // 高雄 KHH
    'd1-greenbelt': { lat: 14.55197, lng: 121.0205 }, // Greenbelt
    'd1-manam': { lat: 14.5522, lng: 121.0204 }, // Manam Greenbelt 2
    'd1-wei-arrive': { lat: 14.5086, lng: 121.0198 },
    'd1-walk': { lat: 14.5515, lng: 121.0173 },
    'd2-grab-intra': { lat: 14.5515, lng: 121.0173 }, // 集合在飯店
    'd2-intramuros': { lat: 14.5906, lng: 120.9733 }, // 馬尼拉大教堂
    'd2-robinsons': { lat: 14.5763, lng: 120.9839 },
    'd2-kenny': { lat: 14.5763, lng: 120.9839 },
    'd2-museum': { lat: 14.5869, lng: 120.9812 },
    'd2-moa': { lat: 14.5352, lng: 120.9822 },
    'd2-bay': { lat: 14.5358, lng: 120.9792 }, // SM by the Bay
    'd2-back': { lat: 14.5515, lng: 121.0173 },
    'd3-legazpi': { lat: 14.554, lng: 121.0245 },
    'd3-pack': { lat: 14.5515, lng: 121.0173 },
    'd3-checkout': { lat: 14.5515, lng: 121.0173 },
    'd3-lunch': { lat: 14.55197, lng: 121.0205 },
    'd3-airport': { lat: 14.5086, lng: 121.0198 },
    'd3-ci704': { lat: 14.5086, lng: 121.0198 },
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
