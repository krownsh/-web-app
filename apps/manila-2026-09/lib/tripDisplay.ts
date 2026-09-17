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

export function calendarDateInTz(timeZone?: string, at = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: timeZone || 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(at);
}

export function resolveHomeTripDay(opts: {
    timezone?: string;
    startDate?: string;
    endDate?: string;
    days: { day_key: string; calendar_date?: string; day_index: number }[];
    now?: Date;
}): { type: 'countdown' | 'day' | 'ended'; value: number; dayKey: string } {
    const ordered = [...opts.days].sort((a, b) => {
        const da = a.calendar_date || '';
        const db = b.calendar_date || '';
        if (da && db && da !== db) return da.localeCompare(db);
        return a.day_index - b.day_index;
    });
    const fallbackKey = ordered[0]?.day_key || 'D1';
    const todayKey = calendarDateInTz(opts.timezone, opts.now);
    const start = opts.startDate || ordered[0]?.calendar_date;
    const end = opts.endDate || ordered[ordered.length - 1]?.calendar_date;

    if (start && todayKey < start) {
        const startMs = new Date(`${start}T00:00:00`).getTime();
        const todayMs = new Date(`${todayKey}T00:00:00`).getTime();
        return {
            type: 'countdown',
            value: Math.max(1, Math.ceil((startMs - todayMs) / (1000 * 60 * 60 * 24))),
            dayKey: fallbackKey,
        };
    }
    if (end && todayKey > end) {
        const last = ordered[ordered.length - 1];
        return {
            type: 'ended',
            value: Math.max(last?.day_index + 1 || ordered.length, 1),
            dayKey: last?.day_key || `D${Math.max(ordered.length, 1)}`,
        };
    }
    const exact = ordered.find((d) => d.calendar_date === todayKey);
    if (exact) {
        return { type: 'day', value: exact.day_index + 1, dayKey: exact.day_key };
    }
    const started = [...ordered].reverse().find((d) => d.calendar_date && d.calendar_date <= todayKey);
    if (started) {
        return { type: 'day', value: started.day_index + 1, dayKey: started.day_key };
    }
    return { type: 'day', value: 1, dayKey: fallbackKey };
}
