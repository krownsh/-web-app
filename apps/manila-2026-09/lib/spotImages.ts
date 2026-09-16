/** Local landmark photos, keyed by exact itinerary titles. */
export const SPOT_IMAGES: Record<string, string> = {
    '台中清泉崗起飛': '/spots/tpe.jpg',
    '抵達菲律賓': '/spots/naia.jpg',
    '韋劭上飛機': '/spots/weishao-plane.jpg',
    '韋劭抵達菲律賓': '/spots/weishao-arrive.jpg',
    '通關／領行李／換匯': '/spots/naia.jpg',
    'Grab 前往飯店': '/spots/citadines.png',
    'Citadines 入住': '/spots/citadines.png',
    '前往 Greenbelt Mall': '/spots/greenbelt.jpg',
    '晚餐 Manam': '/spots/manam.png',
    'Greenbelt 散步回飯店': '/spots/greenbelt.jpg',
    '集合 Grab 往 Intramuros': '/spots/intramuros.png',
    '王城區': '/spots/intramuros.png',
    'Grab 至 Robinsons Place Manila': '/spots/robinsons.jpg',
    'Kenny Rogers Roasters': '/spots/kenny-rogers.jpg',
    '國家自然歷史博物館': '/spots/museum.jpg',
    'SM Mall of Asia 夕陽': '/spots/moa.jpg',
    '海灣晚餐': '/spots/moa.jpg',
    '回飯店': '/spots/citadines.png',
    'Legazpi Sunday Market': '/spots/legazpi-sunday-market.jpg',
    '回飯店整理行李': '/spots/citadines.png',
    'Check-out': '/spots/citadines.png',
    '午餐': '/spots/greenbelt-inside.jpg',
    'Grab 機場／辦理登機': '/spots/naia.jpg',
    '華航 CI704 馬尼拉 → 桃園': '/spots/tpe.jpg',
};

export function imageForItem(title?: string, imageUrl?: string | null) {
    const fromDb = imageUrl && !imageUrl.endsWith('.png') ? imageUrl : undefined;
    if (fromDb) return fromDb;
    if (!title) return undefined;
    return SPOT_IMAGES[title.trim()] || SPOT_IMAGES[title];
}
