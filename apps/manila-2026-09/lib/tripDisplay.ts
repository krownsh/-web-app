import type { Trip } from '../types';

export function currencyMeta(code?: string) {
    const c = (code || '').toUpperCase();
    if (c === 'PHP') return { code: 'PHP', symbol: '₱', name: '披索' };
    if (c === 'THB') return { code: 'THB', symbol: '฿', name: '泰銖' };
    if (c === 'USD') return { code: 'USD', symbol: '$', name: '美元' };
    if (c === 'TWD') return { code: 'TWD', symbol: 'NT$', name: '台幣' };
    return { code: c || 'TWD', symbol: c || 'NT$', name: c || '台幣' };
}

export function weatherPlace(trip?: Trip | null) {
    const tz = trip?.timezone || '';
    if (tz.includes('Manila')) return '馬尼拉';
    if (tz.includes('Bangkok')) return '曼谷';
    return trip?.theme?.shortName || trip?.title || '當地';
}

export function weatherDescFromCode(code: number) {
    if (code === 0) return '晴';
    if (code <= 3) return '多雲';
    if (code === 45 || code === 48) return '霧';
    if (code >= 51 && code <= 67) return '雨';
    if (code >= 80 && code <= 82) return '陣雨';
    if (code >= 95) return '雷雨';
    return '實時天氣';
}

export function daysUntil(startDate?: string) {
    if (!startDate) return 0;
    const start = new Date(`${startDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
