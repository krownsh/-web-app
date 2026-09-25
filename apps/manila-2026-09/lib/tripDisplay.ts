import type { Trip } from '../types';

const TITLE = '馬尼拉三日';
const TITLE_EGG = '日尼馬拉三';
const TITLE_EGG_KEY = 'zentravel-title-egg';

export function displayTripTitle(title?: string | null) {
    const text = title || TITLE;
    if (text !== TITLE) return text;
    try {
        const saved = sessionStorage.getItem(TITLE_EGG_KEY);
        if (saved === TITLE || saved === TITLE_EGG) return saved;
        const next = Math.random() < 0.4 ? TITLE_EGG : TITLE;
        sessionStorage.setItem(TITLE_EGG_KEY, next);
        return next;
    } catch {
        return TITLE;
    }
}

export function currencyMeta(code?: string) {
    const c = (code || '').toUpperCase();
    if (c === 'PHP') return { code: 'PHP', symbol: '₱', name: '披索' };
    if (c === 'THB') return { code: 'THB', symbol: '฿', name: '泰銖' };
    if (c === 'USD') return { code: 'USD', symbol: '$', name: '美元' };
    if (c === 'TWD') return { code: 'TWD', symbol: 'NT$', name: '台幣' };
    return { code: c || 'TWD', symbol: c || 'NT$', name: c || '台幣' };
}

export const MANILA_WEATHER_COORDS = { lat: 14.5515, lng: 121.0173 };

export function ymd(value?: string | null) {
    return (value || '').slice(0, 10);
}

export function weatherPlace(trip?: Trip | null) {
    const tz = trip?.timezone || '';
    if (tz.includes('Manila')) return '馬尼拉';
    if (tz.includes('Bangkok')) return '曼谷';
    return trip?.theme?.shortName || trip?.title || '當地';
}

export function weatherCoords(trip?: Trip | null) {
    const lat = Number(trip?.weather_lat);
    const lng = Number(trip?.weather_lng);
    if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) {
        return { lat, lng };
    }
    return MANILA_WEATHER_COORDS;
}

export function weatherCodeToIcon(code: number) {
    if (code === 0) return 'wb_sunny';
    if (code === 1 || code === 2 || code === 3) return 'partly_cloudy_day';
    if (code === 45 || code === 48) return 'foggy';
    if (code >= 51 && code <= 67) return 'rainy';
    if (code >= 80 && code <= 82) return 'rainy';
    if (code >= 95) return 'thunderstorm';
    return 'cloud';
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

export function buildOpenMeteoUrl(trip?: Trip | null) {
    const { lat, lng } = weatherCoords(trip);
    const tz = encodeURIComponent(trip?.timezone || 'Asia/Manila');
    return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,precipitation_probability,weather_code,weathercode&daily=weather_code,weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&current=temperature_2m,weather_code,wind_speed_10m&current_weather=true&timezone=${tz}&forecast_days=16`;
}

export type ParsedWeather = {
    current: { temp: number; desc: string; icon: string; wind?: number };
    hourly: { time: string; temp: number; rain: number; icon: string }[];
    daily: { date: string; label: string; max: number; min: number; rain: number; desc: string; icon: string }[];
};

function weatherCodeFrom(source: Record<string, unknown> | undefined, index?: number) {
    if (!source) return 0;
    const pick = (key: string) => {
        const value = source[key];
        if (Array.isArray(value) && index != null) return Number(value[index]);
        if (typeof value === 'number') return value;
        return NaN;
    };
    const code = pick('weathercode');
    if (Number.isFinite(code)) return code;
    const next = pick('weather_code');
    return Number.isFinite(next) ? next : 0;
}

export function parseOpenMeteo(
    wJson: any,
    opts: {
        startDate?: string;
        endDate?: string;
        days?: { day_key: string; calendar_date?: string }[];
    } = {}
): ParsedWeather | null {
    const hourly = wJson?.hourly;
    const currentWeather = wJson?.current_weather || wJson?.current;
    if (!hourly?.time || !currentWeather) return null;

    const currentTemp = Number(currentWeather.temperature ?? currentWeather.temperature_2m);
    const currentCode = weatherCodeFrom(currentWeather);
    const currentWind = Number(currentWeather.windspeed ?? currentWeather.wind_speed_10m);
    if (!Number.isFinite(currentTemp)) return null;

    const currentTime = String(currentWeather.time || '');
    let startIdx = hourly.time.findIndex((t: string) => t >= currentTime);
    if (startIdx < 0) startIdx = 0;
    const endIdx = Math.min(startIdx + 12, hourly.time.length);

    const hourlyData = hourly.time.slice(startIdx, endIdx).map((t: string, i: number) => {
        const idx = startIdx + i;
        return {
            time: String(t).split('T')[1]?.slice(0, 5) || t,
            temp: Math.round(Number(hourly.temperature_2m?.[idx]) || 0),
            rain: Number(hourly.precipitation_probability?.[idx]) || 0,
            icon: weatherCodeToIcon(weatherCodeFrom(hourly, idx)),
        };
    });

    const start = ymd(opts.startDate);
    const end = ymd(opts.endDate);
    const dailyTimes: string[] = wJson.daily?.time || [];
    const dailyData = dailyTimes.map((date: string, i: number) => {
        const dayMeta = opts.days?.find((d) => ymd(d.calendar_date) === ymd(date));
        const weekday = new Date(`${ymd(date)}T00:00:00`).toLocaleDateString('zh-TW', {
            weekday: 'short',
            month: 'numeric',
            day: 'numeric',
        });
        const code = weatherCodeFrom(wJson.daily, i);
        return {
            date: ymd(date),
            label: dayMeta ? `${dayMeta.day_key} · ${weekday}` : weekday,
            max: Math.round(Number(wJson.daily.temperature_2m_max?.[i]) || 0),
            min: Math.round(Number(wJson.daily.temperature_2m_min?.[i]) || 0),
            rain: wJson.daily.precipitation_probability_max?.[i] ?? 0,
            desc: weatherDescFromCode(code),
            icon: weatherCodeToIcon(code),
        };
    }).filter((d: { date: string }) => (!start || d.date >= start) && (!end || d.date <= end));

    return {
        current: {
            temp: Math.round(currentTemp),
            desc: weatherDescFromCode(currentCode),
            icon: weatherCodeToIcon(currentCode),
            wind: Number.isFinite(currentWind) ? Math.round(currentWind) : undefined,
        },
        hourly: hourlyData,
        daily: dailyData,
    };
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

type HomeTripDay = { day_key: string; calendar_date?: string; day_index: number };

function parseDayKeyNumber(dayKey?: string) {
    const n = Number(String(dayKey || '').replace(/^D/i, ''));
    return Number.isFinite(n) && n > 0 ? n : null;
}

/** zentravel_trip_days.day_index is 1-based (D1=1). Support 0-based fallbacks. */
export function displayTripDayNumber(day: HomeTripDay | undefined, ordered: HomeTripDay[] = []) {
    if (!day) return 1;
    const fromKey = parseDayKeyNumber(day.day_key);
    if (fromKey != null) return fromKey;
    const zeroBased = ordered.some((d) => d.day_index === 0);
    if (zeroBased) return Math.max(day.day_index + 1, 1);
    if (Number.isFinite(day.day_index) && day.day_index >= 1) return day.day_index;
    return 1;
}

export function resolveHomeTripDay(opts: {
    timezone?: string;
    startDate?: string;
    endDate?: string;
    days: HomeTripDay[];
    now?: Date;
}): { type: 'countdown' | 'day' | 'ended'; value: number; dayKey: string } {
    const ordered = [...opts.days].sort((a, b) => {
        const da = ymd(a.calendar_date);
        const db = ymd(b.calendar_date);
        if (da && db && da !== db) return da.localeCompare(db);
        return a.day_index - b.day_index;
    });
    const fallbackKey = ordered[0]?.day_key || 'D1';
    const todayKey = calendarDateInTz(opts.timezone, opts.now);
    const start = ymd(opts.startDate || ordered[0]?.calendar_date);
    const end = ymd(opts.endDate || ordered[ordered.length - 1]?.calendar_date);

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
            value: displayTripDayNumber(last, ordered),
            dayKey: last?.day_key || `D${Math.max(ordered.length, 1)}`,
        };
    }
    const exact = ordered.find((d) => ymd(d.calendar_date) === todayKey);
    if (exact) {
        return { type: 'day', value: displayTripDayNumber(exact, ordered), dayKey: exact.day_key };
    }
    const started = [...ordered].reverse().find((d) => {
        const date = ymd(d.calendar_date);
        return date && date <= todayKey;
    });
    if (started) {
        return { type: 'day', value: displayTripDayNumber(started, ordered), dayKey: started.day_key };
    }
    return { type: 'day', value: displayTripDayNumber(ordered[0], ordered), dayKey: fallbackKey };
}
