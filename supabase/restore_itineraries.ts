
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const FULL_ITINERARY_DATA = {
    'D1': {
        items: [
            { id: 'd1-1', type: 'flight', time: '09:00', title: '桃園 → 曼谷', description: '搭乘豪華客機飛往佛教王國首都曼谷。', location: '登機門 B6', day: 'D1' },
            { id: 'd1-2', type: 'market', time: '13:00', title: '洽圖恰假日市集', description: 'Chatuchak Weekend Market，佔地 14 公頃，必吃大頭蝦、椰子冰淇淋。', location: '北門入口', day: 'D1' },
            { id: 'd1-3', type: 'temple', time: '16:00', title: '愛樂威四面佛', description: '泰國香火最鼎盛的膜拜據點之一。', location: '君悅飯店轉角', day: 'D1' },
            { id: 'd1-4', type: 'shopping', time: '17:30', title: 'Central World', description: '曼谷三大百貨之一，BTS Chit Lom 站 3 號出口。', location: '1F 服務台', day: 'D1' },
            { id: 'd1-5', type: 'shopping', time: '19:00', title: 'BIG C 大賣場', description: '必買伴手禮：海苔、餅乾、零食。', location: '2F 收銀台', day: 'D1' },
            { id: 'd1-6', type: 'food', time: '20:30', title: '沙薇泰式料理', description: '晚餐：40 年老店，享用招牌咖哩螃蟹。', location: '餐廳大廳', day: 'D1' },
            { id: 'd1-7', type: 'hotel', time: '22:00', title: 'Grand Fourwings', description: 'THE GRAND FOURWINGS CONVENTION HOTEL', location: 'Lobby', day: 'D1' },
        ]
    },
    'D2': {
        items: [
            { id: 'd2-1', type: 'activity', time: '09:00', title: '丹能莎朵水上市場', description: '體驗歐式水上市場，包含手搖船體驗。', day: 'D2' },
            { id: 'd2-2', type: 'activity', time: '12:00', title: '爆笑鐵支路', description: '若遇不上火車，每人贈送可樂一杯。', day: 'D2' },
            { id: 'd2-3', type: 'temple', time: '14:00', title: '樹中佛', description: '全泰國十大靈驗佛寺之一。', day: 'D2' },
            { id: 'd2-4', type: 'activity', time: '16:00', title: '泰拳公園', description: '欣賞 200 多座栩栩如生的泰拳招式雕塑。', day: 'D2' },
            { id: 'd2-5', type: 'market', time: '18:00', title: 'CICADA 週末創意市集', description: '華欣最美夜市，僅週五～週日營業。', day: 'D2' },
            { id: 'd2-7', type: 'hotel', time: '21:00', title: 'ACE OF HUA HIN', description: 'ACE OF HUA HIN RESORT', day: 'D2' },
        ]
    },
    'D3': {
        items: [
            { id: 'd3-1', type: 'relax', time: '10:00', title: '飯店設施 / 華欣海灘', description: '享受度假村設施，或漫步於白沙灘。', day: 'D3' },
            { id: 'd3-2', type: 'activity', time: '13:00', title: '皇家火車站', description: '泰國最美火車站，古色古香的柚木建築。', day: 'D3' },
            { id: 'd3-3', type: 'activity', time: '15:00', title: '駱駝共和國', description: 'Camel Republic，摩洛哥風格主題樂園。', day: 'D3' },
            { id: 'd3-6', type: 'market', time: '18:00', title: '華欣夜市', description: '晚餐自費，體驗當地熱鬧氛圍。', day: 'D3' },
        ]
    },
    'D4': {
        items: [
            { id: 'd4-1', type: 'nature', time: '09:00', title: '拷龍洞', description: '天然鐘乳石洞穴。注意：防野猴搶食。', day: 'D4' },
            { id: 'd4-3', type: 'activity', time: '13:00', title: '湄南河遊船', description: '搭船欣賞昭披耶河畔風光。', day: 'D4' },
            { id: 'd4-4', type: 'shopping', time: '15:00', title: 'ICONSIAM 暹羅天地', description: '曼谷必逛地標級購物中心，室內水上市場。', day: 'D4' },
            { id: 'd4-5', type: 'food', time: '18:00', title: '喬德夜市', description: 'Jodd Fairs，網紅美食集散地。', day: 'D4' },
        ]
    },
    'D5': {
        items: [
            { id: 'd5-1', type: 'temple', time: '09:00', title: '金佛寺', description: '參拜世界最大的黃金佛像。', day: 'D5' },
            { id: 'd5-2', type: 'activity', time: '11:00', title: '嘟嘟車遊唐人街', description: '搭乘泰國特色 Tuk Tuk 車穿梭唐人街。', day: 'D5' },
            { id: 'd5-3', type: 'shopping', time: '13:00', title: 'MEGA BANGNA', description: '超大型購物中心，最後採買機會。', day: 'D5' },
            { id: 'd5-4', type: 'flight', time: '16:00', title: '曼谷 → 桃園', description: '前往機場，搭機返回溫暖的家。', day: 'D5' },
        ]
    }
};

async function restoreItineraries() {
    console.log("Restoring itineraries...");

    // 1. Clear existing
    const { error: delError } = await supabase.from('itineraries').delete().neq('id', 'placeholder');
    if (delError) console.error("Error clearing:", delError);
    else console.log("Cleared existing itineraries.");

    // 2. Insert new
    const rows = [];
    for (const day in FULL_ITINERARY_DATA) {
        FULL_ITINERARY_DATA[day].items.forEach(item => {
            rows.push({
                id: item.id,
                day: day,
                time: item.time,
                title: item.title,
                description: item.description,
                location: item.location || null,
                type: item.type,
                // Add defaults for schema compliance
                is_current: false,
                created_at: new Date().toISOString()
            });
        });
    }

    const { error: insError } = await supabase.from('itineraries').insert(rows);
    if (insError) console.error("Error inserting:", insError);
    else console.log(`Successfully restored ${rows.length} itinerary items.`);
}

restoreItineraries();
