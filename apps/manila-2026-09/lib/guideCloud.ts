import { SupabaseService } from '../services/SupabaseService';

const LOCAL_KEY = 'zen_guide_data_v1';

function migratedFlag(tripId: string, userId: string) {
    return `zen_guide_migrated_v2_${tripId}_${userId}`;
}

export function parseMustBuyPrice(raw: unknown): number | null {
    const digits = String(raw ?? '').replace(/[^\d.]/g, '');
    if (!digits) return null;
    const n = Number(digits);
    return Number.isFinite(n) ? n : null;
}

export function formatMustBuyPrice(price: unknown, symbol = '₱') {
    if (price == null || price === '') return '';
    const text = String(price);
    if (/[^\d.]/.test(text)) return text;
    return `${symbol}${text}`;
}

export async function migrateLocalGuideToCloud(tripId: string, userId: string) {
    if (!tripId || !userId) return;
    try {
        if (localStorage.getItem(migratedFlag(tripId, userId))) return;
        const raw = localStorage.getItem(LOCAL_KEY);
        if (!raw) {
            localStorage.setItem(migratedFlag(tripId, userId), '1');
            return;
        }
        const parsed = JSON.parse(raw) as Record<string, {
            name?: string;
            links?: { title?: string; url?: string; source?: string }[];
            mustBuy?: { name?: string; item_name?: string; price?: unknown; desc?: string; tag?: string }[];
        }>;
        for (const loc of Object.values(parsed || {})) {
            const locationRef = loc.name || '';
            for (const link of loc.links || []) {
                if (!link?.title) continue;
                await SupabaseService.addGuideLink({
                    trip_id: tripId,
                    location_ref: locationRef,
                    title: String(link.title),
                    url: String(link.url || '#'),
                    source: String(link.source || 'Web'),
                    owner_id: userId,
                });
            }
            for (const item of loc.mustBuy || []) {
                const name = item.name || item.item_name;
                if (!name) continue;
                const note = [item.desc, item.tag ? `#${item.tag}` : ''].filter(Boolean).join('\n') || null;
                await SupabaseService.addRecord('zentravel_must_buys', {
                    trip_id: tripId,
                    item_name: name,
                    price: parseMustBuyPrice(item.price),
                    location_ref: locationRef,
                    visibility: 'private',
                    owner_id: userId,
                    image_url: '',
                    note,
                });
            }
        }
        localStorage.setItem(migratedFlag(tripId, userId), '1');
    } catch (err) {
        console.error('guide migrate failed', err);
    }
}
