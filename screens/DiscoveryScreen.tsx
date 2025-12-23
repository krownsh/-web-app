import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { SupabaseService } from '../services/SupabaseService';

// Full 5-Day Itinerary Data (Mirrored from ItineraryScreen for default fallback)
const FULL_ITINERARY_DATA: any = {
    'D1': {
        date: '27', month: 'Dec', weekday: 'Sat',
        weather: '30°C 晴時多雲',
        reminder: '起飛前兩小時抵達桃園機場集合。',
        items: [
            { id: 'd1-1', type: 'flight', time: '09:00', title: '桃園 → 曼谷', desc: '搭乘豪華客機飛往佛教王國首都曼谷。', location: '登機門 B6' },
            { id: 'd1-2', type: 'market', time: '13:00', title: '洽圖恰假日市集', desc: '東南亞最大跳蚤市場，27 個購物區、15,000 個攤位。', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGgpcfcEXnM795sViNtHwZwBWcInCs7VTlrX7rCQJvBss2MDo8OlgNgF0TTeCHP5lT4kHumUzY_bL5u3DACD9_9u_fWJUZ6Ey1FRrl8hVV32dl3wAubTTnus5Y4Uc7n6hZhGtz9LqCShPLYQlEaQ1qIaugSVEmhquoe3xiftQs4Awn8YygYaykZeTtRjWTYw0u6IZBHV67lzoLybjstBcXIteQyBgggh1iJysMV8ajV3_niXXD_5aTB0r9UOjwrPOnRsrIfEN8hhE', location: '北門入口' },
            { id: 'd1-3', type: 'temple', time: '16:00', title: '愛樂威四面佛', desc: '由正面順時針參拜。香與花環一份 20 泰銖。', location: '君悅飯店轉角' },
            { id: 'd1-4', type: 'shopping', time: '17:30', title: 'Central World', desc: '曼谷三大百貨之一，BTS Chit Lom 站 3 號出口。', location: '1F 服務台' },
            { id: 'd1-5', type: 'shopping', time: '19:00', title: 'BIG C 大賣場', desc: '必買伴手禮：海苔、餅乾、零食。', location: '2F 收銀台' },
            { id: 'd1-6', type: 'food', time: '20:30', title: '沙薇泰式料理', desc: '晚餐：40 年老店，享用招牌咖哩螃蟹。', location: '餐廳大廳' },
            { id: 'd1-7', type: 'hotel', time: '22:00', title: 'Grand Fourwings', desc: 'THE GRAND FOURWINGS CONVENTION HOTEL', location: 'Lobby' },
        ]
    },
    'D2': {
        date: '28', month: 'Dec', weekday: 'Sun',
        weather: '32°C 晴朗',
        reminder: '爆笑鐵支路火車時刻：08:05 / 12:05 / 16:40',
        items: [
            { id: 'd2-1', type: 'activity', time: '09:00', title: '丹能莎朵水上市場', desc: '體驗歐式水上市場，包含手搖船體驗。', img: 'https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
            { id: 'd2-2', type: 'activity', time: '12:00', title: '爆笑鐵支路', desc: '若遇不上火車，每人贈送可樂一杯。' },
            { id: 'd2-3', type: 'temple', time: '14:00', title: '樹中佛', desc: '400 年老樹環抱 200 年佛寺，靈驗傳奇。' },
            { id: 'd2-4', type: 'activity', time: '16:00', title: '泰拳公園', desc: '欣賞 200 多座栩栩如生的泰拳招式雕塑。' },
            { id: 'd2-5', type: 'market', time: '18:00', title: 'CICADA 週末創意市集', desc: '華欣最美夜市，僅週五～週日營業。', img: 'https://images.unsplash.com/photo-1533659828870-95ee305cee3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
            { id: 'd2-7', type: 'hotel', time: '21:00', title: 'ACE OF HUA HIN', desc: 'ACE OF HUA HIN RESORT' },
        ]
    },
    'D3': {
        date: '29', month: 'Dec', weekday: 'Mon',
        weather: '31°C 海濱微風',
        reminder: '享受飯店設施與華欣海灘風情。',
        items: [
            { id: 'd3-1', type: 'relax', time: '10:00', title: '飯店設施 / 華欣海灘', desc: '享受度假村設施，或漫步於白沙灘。' },
            { id: 'd3-2', type: 'activity', time: '13:00', title: '皇家火車站', desc: '泰國最美火車站，古色古香的柚木建築。' },
            { id: 'd3-3', type: 'activity', time: '15:00', title: '駱駝共和國', desc: 'Camel Republic，摩洛哥風格主題樂園。', img: 'https://images.unsplash.com/photo-1544669528-9844a4913c32?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
            { id: 'd3-6', type: 'market', time: '18:00', title: '華欣夜市', desc: '晚餐自費，體驗當地熱鬧氛圍。' },
        ]
    },
    'D4': {
        date: '30', month: 'Dec', weekday: 'Tue',
        weather: '32°C 晴',
        reminder: '拷龍洞禁止攜帶食物與塑膠袋 (防野猴)。',
        items: [
            { id: 'd4-1', type: 'nature', time: '09:00', title: '拷龍洞', desc: '天然鐘乳石洞穴。注意：防野猴搶食。', img: 'https://images.unsplash.com/photo-1596727147705-01a29c15332a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
            { id: 'd4-3', type: 'activity', time: '13:00', title: '湄南河遊船', desc: '搭船欣賞昭披耶河畔風光。' },
            { id: 'd4-4', type: 'shopping', time: '15:00', title: 'ICONSIAM 暹羅天地', desc: '曼谷必逛地標級購物中心，室內水上市場。', img: 'https://images.unsplash.com/photo-1569383746724-6f1b882b8f46?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
            { id: 'd4-5', type: 'food', time: '18:00', title: '喬德夜市', desc: 'Jodd Fairs，網紅美食集散地。' },
        ]
    },
    'D5': {
        date: '31', month: 'Dec', weekday: 'Wed',
        weather: '31°C 晴',
        reminder: '回程日，請檢查隨身物品。午餐自理。',
        items: [
            { id: 'd5-1', type: 'temple', time: '09:00', title: '金佛寺', desc: '參拜世界最大的黃金佛像。', },
            { id: 'd5-2', type: 'activity', time: '11:00', title: '嘟嘟車遊唐人街', desc: '搭乘泰國特色 Tuk Tuk 車穿梭唐人街。' },
            { id: 'd5-3', type: 'shopping', time: '13:00', title: 'MEGA BANGNA', desc: '超大型購物中心，最後採買機會。', img: 'https://images.unsplash.com/photo-1555529733-0e670560f7e1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
            { id: 'd5-4', type: 'flight', time: '16:00', title: '曼谷 → 桃園', desc: '前往機場，搭機返回溫暖的家。' },
        ]
    }
};

// Coordinate Registry for Known Locations (Approximation)
const COORDINATE_MAP: Record<string, [number, number]> = {
    // Bangkok Core
    '洽圖恰假日市集': [13.800, 100.551],
    '愛樂威四面佛': [13.744, 100.540],
    'Central World': [13.746, 100.539],
    'BIG C 大賣場': [13.747, 100.541],
    '沙薇泰式料理': [13.724, 100.578], // Approx
    'Grand Fourwings': [13.766, 100.643], // Approx
    'ICONSIAM 暹羅天地': [13.726, 100.510],
    '喬德夜市': [13.757, 100.566],
    '金佛寺': [13.737, 100.514],
    '嘟嘟車遊唐人街': [13.740, 100.509],
    'MEGA BANGNA': [13.633, 100.680], // Bangna

    // Outskirts / Floating Markets
    '丹能莎朵水上市場': [13.519, 99.960],
    '爆笑鐵支路': [13.407, 100.000], // Maeklong
    '樹中佛': [13.411, 99.948], // Wat Bang Kung
    '泰拳公園': [13.412, 99.949], // Near Tree Buddha

    // Hua Hin
    'CICADA 週末創意市集': [12.534, 99.966],
    'ACE OF HUA HIN': [12.651, 99.952], // Cha-Am/Hua Hin border
    '飯店設施 / 華欣海灘': [12.570, 99.960],
    '皇家火車站': [12.567, 99.955],
    '駱駝共和國': [12.780, 99.970], // Cha-Am
    '華欣夜市': [12.572, 99.957],
    '拷龍洞': [13.111, 99.938],
};

// Helper to create custom div icons
const createCustomIcon = (isSelected: boolean, index: number, type: string) => {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `
            <div class="relative flex items-center justify-center w-8 h-8 transition-all duration-300 ${isSelected ? 'scale-125' : 'scale-100'}">
                <div class="absolute inset-0 rounded-full ${isSelected ? 'bg-zen-moss animate-ping opacity-75' : 'bg-transparent'}"></div>
                <div class="relative w-8 h-8 rounded-full ${isSelected ? 'bg-zen-moss' : 'bg-white'} border-2 ${isSelected ? 'border-white' : 'border-zen-moss'} shadow-md flex items-center justify-center text-[12px] font-bold ${isSelected ? 'text-white' : 'text-zen-moss'}">
                    ${index + 1}
                </div>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
};

// Component to handle map view updates with dynamic offset
const MapViewUpdater: React.FC<{ center: [number, number], zoom: number, panelMode: string }> = ({ center, zoom, panelMode }) => {
    const map = useMap();

    useEffect(() => {
        // Initial fly to the point
        map.flyTo(center, zoom, { duration: 1.2 });

        // After flyTo starts, we calculate the pixel offset to keep the point in the visible area
        // If panelMode is 'default' (45% height list), map has ~55% space. 
        // We want the point centered in that 55%.
        const screenHeight = map.getSize().y;

        // Offset logic:
        // Visible map middle is roughly at some percent from the top.
        // For 'default', visible is top 55%. Vertical middle is 27.5% from top.
        // Screen middle is 50% from top. Offset required = (50 - 27.5) = 22.5% of height.
        // We pan the map UP by this percentage to move the marker UP on screen (Negative Y offset).
        let panOffset = 0;
        if (panelMode === 'default') {
            panOffset = -screenHeight * 0.22;
        } else {
            // In 'full' mode (92% height list), map has ~8% space. 
            // Marker should be near the very top.
            panOffset = -screenHeight * 0.42;
        }

        const timer = setTimeout(() => {
            map.panBy([0, panOffset], { animate: true, duration: 0.8 });
        }, 100);

        return () => clearTimeout(timer);
    }, [center[0], center[1], zoom, panelMode, map]);

    return null;
};

const DiscoveryScreen: React.FC = () => {
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [activeDay, setActiveDay] = useState<string>('D1');
    const [panelMode, setPanelMode] = useState<'default' | 'full'>('default');
    const [isEditing, setIsEditing] = useState(false);

    // Touch handling for drag
    const touchStartY = React.useRef<number>(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - touchStartY.current;
        if (deltaY < -50 && panelMode === 'default') setPanelMode('full');
        else if (deltaY > 50 && panelMode === 'full') setPanelMode('default');
    };

    // Load Itinerary with Setter for Editing
    const [fullItinerary, setFullItinerary] = useState(() => {
        try {
            const saved = localStorage.getItem('zen_full_itinerary_v1');
            return saved ? JSON.parse(saved) : FULL_ITINERARY_DATA;
        } catch {
            return FULL_ITINERARY_DATA;
        }
    });

    // Sync to LocalStorage & Supabase
    useEffect(() => {
        localStorage.setItem('zen_full_itinerary_v1', JSON.stringify(fullItinerary));
    }, [fullItinerary]);

    // Initialize View with Current Activity
    useEffect(() => {
        const syncCurrent = async () => {
            const current = await SupabaseService.getCurrentItinerary();
            if (current && current.id) {
                // Search for the day containing this item
                // fullItinerary is an object { D1: { items: [] }, ... }
                for (const [dayKey, day] of Object.entries(fullItinerary)) {
                    const found = (day as any).items?.find((i: any) => i.id === current.id);
                    if (found) {
                        setActiveDay(dayKey);
                        setSelectedItemId(current.id);
                        break; // Found it
                    }
                }
            }
        };
        syncCurrent();
    }, [fullItinerary]); // Dependency on itinerary ensures we can find the item once loaded

    // Initial load from Supabase if available
    useEffect(() => {
        const loadFromSupabase = async () => {
            try {
                console.log("DiscoveryScreen: Starting Supabase sync...");
                const cloudItinerary = await SupabaseService.getItinerary();
                console.log("DiscoveryScreen: Received cloud data:", cloudItinerary?.length);

                if (cloudItinerary && cloudItinerary.length > 0) {
                    // Start with a clean copy of the default data
                    const reconstructed: any = JSON.parse(JSON.stringify(FULL_ITINERARY_DATA));

                    cloudItinerary.forEach((item: any) => {
                        const dayKey = item.day;
                        if (!reconstructed[dayKey]) {
                            reconstructed[dayKey] = { items: [] };
                        }

                        // If items array doesn't exist, initialize it
                        if (!reconstructed[dayKey].items) {
                            reconstructed[dayKey].items = [];
                        }

                        const existingIdx = reconstructed[dayKey].items.findIndex((i: any) => i.id === item.id);
                        if (existingIdx >= 0) {
                            reconstructed[dayKey].items[existingIdx] = item;
                        } else {
                            reconstructed[dayKey].items.push(item);
                        }
                    });

                    console.log("DiscoveryScreen: Reconstructed data successfully");
                    setFullItinerary(reconstructed);
                }
            } catch (error) {
                console.error("Failed to sync Discovery with Supabase", error);
            }
        };
        loadFromSupabase();
    }, []);

    // Update Item Function
    const updateItem = (id: string, field: string, value: string) => {
        setFullItinerary((prev: any) => ({
            ...prev,
            [activeDay]: {
                ...prev[activeDay],
                items: prev[activeDay].items.map((item: any) =>
                    item.id === id ? { ...item, [field]: value } : item
                )
            }
        }));
    };

    // Filter Items for Map and List
    const dayItems = useMemo(() => {
        return fullItinerary[activeDay]?.items || [];
    }, [fullItinerary, activeDay]);

    // Map items to locations if coordinates exist
    const mapLocations = useMemo(() => {
        return dayItems
            .filter((item: any) => COORDINATE_MAP[item.title])
            .map((item: any) => ({
                ...item,
                lat: COORDINATE_MAP[item.title][0],
                lng: COORDINATE_MAP[item.title][1],
            }));
    }, [dayItems]);

    const selectedLocation = useMemo(() => {
        return mapLocations.find((l: any) => l.id === selectedItemId) || mapLocations[0];
    }, [selectedItemId, mapLocations]);

    // Set initial selected item when day changes
    React.useEffect(() => {
        if (mapLocations.length > 0) {
            setSelectedItemId(mapLocations[0].id);
        }
    }, [activeDay, mapLocations]);

    const mapCenter: [number, number] = selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [13.7563, 100.5018];

    // Polyline only for items that have coords, in order
    const polylinePositions = mapLocations.map((l: any) => [l.lat, l.lng] as [number, number]);

    return (
        <div className="flex flex-col h-full bg-zen-bg overflow-hidden relative">

            {/* Full Screen Map Layer */}
            <div className="absolute inset-0 z-0">
                <MapContainer
                    center={mapCenter}
                    zoom={12}
                    zoomControl={false}
                    className="w-full h-full"
                >
                    <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    />

                    {selectedLocation && <MapViewUpdater center={[selectedLocation.lat, selectedLocation.lng]} zoom={13} panelMode={panelMode} />}

                    {polylinePositions.length > 1 && (
                        <Polyline
                            positions={polylinePositions}
                            pathOptions={{ color: '#6B8E88', weight: 3, dashArray: '5, 10', opacity: 0.6 }}
                        />
                    )}

                    {mapLocations.map((loc: any, index: number) => (
                        <Marker
                            key={loc.id}
                            position={[loc.lat, loc.lng]}
                            icon={createCustomIcon(selectedItemId === loc.id, index, loc.type)}
                            zIndexOffset={selectedItemId === loc.id ? 1000 : 0}
                            eventHandlers={{ click: () => setSelectedItemId(loc.id) }}
                        />
                    ))}
                </MapContainer>
            </div>

            {/* Top Header Layer */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-8 flex flex-col gap-4 pointer-events-none">
                <div className="flex justify-between items-center">
                    <Link to="/" className="pointer-events-auto flex size-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm text-zen-text active:scale-95 transition-transform">
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    </Link>

                    {/* Edit Toggle Button */}
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`pointer-events-auto flex items-center justify-center size-10 rounded-full transition-all shadow-sm ${isEditing ? 'bg-zen-moss text-white shadow-glow' : 'bg-white/80 backdrop-blur-md text-zen-moss active:bg-zen-moss/10'}`}
                    >
                        <span className="material-symbols-outlined font-light text-[20px]">
                            {isEditing ? 'check' : 'edit'}
                        </span>
                    </button>
                </div>

                <div className="pointer-events-auto flex justify-center">
                    <div className="flex bg-white/90 backdrop-blur-md rounded-[20px] px-6 py-2 shadow-mist border border-white/50 gap-6">
                        {Object.keys(FULL_ITINERARY_DATA).map((day) => {
                            const isActive = activeDay === day;
                            // Ensure loading form fullData if possible, but fallback to static for structure
                            const dayData = fullItinerary[day] || FULL_ITINERARY_DATA[day];
                            return (
                                <button
                                    key={day}
                                    onClick={() => setActiveDay(day)}
                                    className={`flex flex-col items-center justify-center gap-0.5 transition-all duration-300 ${isActive ? 'scale-110' : 'active:opacity-70 group'}`}
                                >
                                    <span className={`text-[10px] font-medium tracking-wider uppercase ${isActive ? 'text-zen-moss font-bold' : 'text-zen-text-light group-hover:text-zen-moss/70'}`}>
                                        {day}
                                    </span>
                                    <span className={`relative z-10 transition-all ${isActive ? 'text-lg font-bold text-zen-text' : 'text-sm font-light text-zen-text-light'}`}>
                                        {dayData.date || '00'}
                                    </span>
                                    <div className={`mt-0.5 w-1 h-1 rounded-full transition-all duration-300 ${isActive ? 'bg-zen-moss shadow-[0_0_8px_rgba(141,163,153,0.6)]' : 'bg-transparent'}`}></div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Draggable Bottom Panel */}
            <div
                className={`absolute bottom-0 left-0 right-0 bg-zen-bg rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden border-t border-white/50 z-30 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${panelMode === 'full' ? 'h-[92%]' : 'h-[45%]'
                    }`}
            >
                {/* Handle Bar */}
                <div
                    className="w-full flex justify-center pt-4 pb-2 shrink-0 cursor-grab active:cursor-grabbing touch-none"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                >
                    <div className="w-12 h-1.5 bg-zen-rock/50 rounded-full"></div>
                </div>

                {/* Location Header - Currently Selected on Map */}
                {selectedLocation ? (
                    <div className="px-8 pt-2 pb-6 shrink-0">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1 min-w-0 pr-4">
                                <span className="text-xs font-bold text-zen-moss uppercase tracking-widest truncate">
                                    {activeDay} · {selectedLocation.time || '行程景點'}
                                </span>
                                <h2 className="text-2xl font-bold text-zen-text tracking-wide truncate">{selectedLocation.title}</h2>
                            </div>
                            <button className="flex items-center justify-center size-10 rounded-full bg-zen-bg border border-zen-rock shadow-sm text-zen-text-light active:bg-zen-moss active:text-white transition-colors shrink-0">
                                <span className="material-symbols-outlined">directions</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="px-8 pt-2 pb-6 shrink-0 text-center text-zen-text-light text-sm">此日行程暫無地圖資訊</div>
                )}

                {/* Weather & Reminder Info Card - Sticky */}
                {fullItinerary[activeDay] && (
                    <div className="px-6 pb-2 shrink-0">
                        <div className="bg-zen-mist/10 rounded-xl p-3 border border-zen-rock/20 relative z-10 flex flex-col gap-1">
                            <div className="flex flex-col gap-2 text-zen-text-light">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px] text-amber-500">wb_sunny</span>
                                    <span className="text-xs font-medium tracking-wide">{fullItinerary[activeDay].weather}</span>
                                </div>
                                {fullItinerary[activeDay].reminder && (
                                    <div className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5 text-zen-moss">campaign</span>
                                        <p className="text-xs font-medium tracking-wide leading-relaxed text-zen-text opacity-90">{fullItinerary[activeDay].reminder}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Scrollable Timeline List */}
                <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-32">

                    <div className="relative">
                        {/* Continuous Timeline Line */}
                        <div className="absolute left-[24px] top-4 bottom-0 w-[1px] bg-zen-rock z-0"></div>

                        <div className="grid gap-6">
                            {dayItems.map((item: any, idx: number) => {
                                const isSelected = selectedItemId === item.id;

                                return (
                                    <div
                                        key={idx}
                                        className={`relative flex w-full ${isEditing ? 'animate-pulse-slow' : ''}`}
                                        onClick={(e) => {
                                            // Update map selection if not editing inputs
                                            if (!(e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA/) && COORDINATE_MAP[item.title]) {
                                                setSelectedItemId(item.id);
                                            }
                                        }}
                                    >
                                        {/* Left: Timeline Dot & Time */}
                                        <div className="w-[48px] shrink-0 relative flex flex-col items-center">
                                            {/* Time Input/Display at top aligned with card */}
                                            <div className="mb-2 w-full flex justify-center z-10 bg-zen-bg py-1">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={item.time}
                                                        placeholder="--"
                                                        onChange={(e) => updateItem(item.id, 'time', e.target.value)}
                                                        className="text-[10px] font-bold text-zen-text bg-white/50 border-b border-zen-moss/30 focus:outline-none text-center w-10"
                                                    />
                                                ) : (
                                                    <span className="text-[10px] font-bold text-zen-text font-display tracking-wider text-center block w-full">
                                                        {item.time || '--:--'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Dot */}
                                            <div className="z-10 relative">
                                                <div className={`size-3 rounded-full border-2 transition-all duration-300 ${isSelected ? 'bg-zen-moss border-white ring-2 ring-zen-moss shadow-glow' : 'bg-white border-zen-rock'}`}></div>
                                            </div>
                                        </div>

                                        <div className="flex-1 pl-2">
                                            <div className={`flex bg-white border rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${isSelected ? 'border-zen-moss ring-1 ring-zen-moss/20 shadow-md' : 'border-white/60'}`}>

                                                {/* Main Content Area */}
                                                <div className="flex-1 flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-zen-rock/40">
                                                    {/* Description & Title */}
                                                    <div className="flex-1 p-3 flex items-start gap-2">
                                                        <div className="text-zen-moss shrink-0 mt-0.5">
                                                            <span className="material-symbols-outlined text-[18px]">{item.icon || 'place'}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            {isEditing ? (
                                                                <input
                                                                    type="text"
                                                                    value={item.title}
                                                                    onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                                                                    className="text-base font-bold text-zen-text w-full bg-transparent border-b border-zen-moss/30 focus:outline-none"
                                                                />
                                                            ) : (
                                                                <h4 className="text-base font-bold text-zen-text leading-tight">{item.title}</h4>
                                                            )}

                                                            {isEditing ? (
                                                                <textarea
                                                                    value={item.desc || ''}
                                                                    onChange={(e) => updateItem(item.id, 'desc', e.target.value)}
                                                                    className="text-xs text-zen-text-light w-full h-12 mt-1 bg-transparent border-b border-zen-moss/30 focus:outline-none resize-none"
                                                                />
                                                            ) : (
                                                                <p className="text-xs text-zen-text-light leading-relaxed font-light mt-1 w-11/12">{item.desc}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Meeting Point (Location) */}
                                                    <div className="sm:w-[90px] bg-zen-mist/20 p-2 flex flex-col justify-center gap-1">
                                                        <div className="flex items-center gap-1 text-zen-text-light">
                                                            <span className="material-symbols-outlined text-[12px]">location_on</span>
                                                            <span className="text-[9px] font-bold uppercase tracking-wider">集合點</span>
                                                        </div>
                                                        {isEditing ? (
                                                            <textarea
                                                                value={item.location || ''}
                                                                placeholder="地點.."
                                                                onChange={(e) => updateItem(item.id, 'location', e.target.value)}
                                                                className="text-[10px] font-medium text-zen-text bg-transparent border-b border-zen-moss/30 focus:outline-none w-full h-8 resize-none leading-tight"
                                                            />
                                                        ) : (
                                                            <p className="text-[10px] font-medium text-zen-text leading-tight line-clamp-2">
                                                                {item.location || '-'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Side Panel */}
                                                <div className="flex flex-col w-12 border-l border-zen-rock/20 bg-zen-mist/5 divide-y divide-zen-rock/20">
                                                    {/* Budget Button */}
                                                    <Link
                                                        to={`/map-budget?day=${activeDay}&location=${encodeURIComponent(item.title)}`}
                                                        className="flex-1 flex items-center justify-center hover:bg-yellow-50 hover:text-yellow-600 transition-colors text-zen-rock active:bg-yellow-100"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">attach_money</span>
                                                    </Link>

                                                    {/* Navigation Arrow */}
                                                    <Link
                                                        to={`/itinerary?location=${encodeURIComponent(item.title)}&day=${activeDay}&id=${item.id}`}
                                                        className="flex-1 flex items-center justify-center hover:bg-zen-moss hover:text-white transition-colors text-zen-rock active:bg-zen-moss/80"
                                                    >
                                                        <span className="material-symbols-outlined">chevron_right</span>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    {/* Padding for full scroll */}
                    <div className="h-20"></div>
                </div>
            </div>
        </div>
    );
};

export default DiscoveryScreen;