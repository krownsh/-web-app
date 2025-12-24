import React, { useState, useEffect, useRef } from 'react';
import SwipeableRow from '../components/SwipeableRow';
import { Link, useNavigate } from 'react-router-dom';
import { SupabaseService } from '../services/SupabaseService';
import { MustBuyItem, ChecklistStatus, ItineraryItem } from '../types';

// Flattened Data for the Wheel (Simulating Day 1 Data for the Home Screen)
const ITINERARY_WHEEL_DATA = [
    { id: 'd1-0', time: '07:00', title: '集合', location: '桃園機場 T1', note: '櫃檯 8' },
    { id: 'd1-1', time: '09:00', title: '桃園 → 曼谷', location: '登機門 B6', note: 'CI 833' },
    { id: 'd1-2', time: '13:00', title: '洽圖恰市集', location: '北門入口', note: '鐘樓下' },
    { id: 'd1-3', time: '16:00', title: '愛樂威四面佛', location: '君悅飯店轉角', note: '花攤旁' },
    { id: 'd1-4', time: '17:30', title: 'Central World', location: '1F 服務台', note: 'Apple 旁' },
    { id: 'd1-5', time: '19:00', title: 'Big C 採買', location: '2F 收銀台', note: '退稅櫃台' },
    { id: 'd1-6', time: '20:30', title: '沙薇泰式料理', location: '餐廳大廳', note: '預約席' },
    { id: 'd1-7', time: '22:00', title: '飯店休息', location: 'Lobby', note: '領房卡' },
];

// Default Data
const DEFAULT_DATA = {
    groupNo: 'TBG25D27BR05TA',
    foreignGroupNo: '251227-B',
    groupName: '全程五星華欣皇室風情 5 日',
    leaderName: '陳以璇',
    leaderPhone: '886-920-035-415',
    badge: '無',
    luggageTag: '洋紅',
    weatherTemp: '32°C',
    weatherDesc: '午後有雨',
    exchangeRate: '1.12'
};

// Date Metadata Map for Header Display
const DATE_MAP: Record<string, { num: string; date: string }> = {
    'D1': { num: '1', date: 'Dec 27 · Sat' },
    'D2': { num: '2', date: 'Dec 28 · Sun' },
    'D3': { num: '3', date: 'Dec 29 · Mon' },
    'D4': { num: '4', date: 'Dec 30 · Tue' },
    'D5': { num: '5', date: 'Dec 31 · Wed' },
};

export const HomeScreen: React.FC = () => {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [showSOSModal, setShowSOSModal] = useState(false);
    const [showTranslateModal, setShowTranslateModal] = useState(false);


    // --- Meeting Point Modal State ---
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const [isAddMustBuyModalOpen, setIsAddMustBuyModalOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // User ID initialization
    const [myUserId] = useState(() => {
        let id = localStorage.getItem('zen_user_id');
        if (!id) {
            id = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('zen_user_id', id);
        }
        return id;
    });

    // Currency Calculator State
    const [liveRate, setLiveRate] = useState(0.92); // Default fallback
    const [thbAmount, setThbAmount] = useState('');
    const [twdAmount, setTwdAmount] = useState('');

    // Weather Data State (Open-Meteo)
    const [weatherData, setWeatherData] = useState<{
        current: { temp: number; desc: string; icon: string };
        hourly: { time: string; temp: number; rain: number; icon: string }[];
    }>({
        current: { temp: 30, desc: '晴時多雲', icon: 'wb_sunny' },
        hourly: []
    });

    const weatherCodeToIcon = (code: number) => {
        if (code === 0) return 'wb_sunny';
        if (code === 1 || code === 2 || code === 3) return 'partly_cloudy_day';
        if (code === 45 || code === 48) return 'foggy';
        if (code >= 51 && code <= 67) return 'rainy';
        if (code >= 80 && code <= 82) return 'rainy';
        if (code >= 95) return 'thunderstorm';
        return 'cloud';
    };

    // Fetch Data on Mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Exchange Rate
                fetch('https://api.exchangerate-api.com/v4/latest/THB')
                    .then(res => res.json())
                    .then(json => {
                        if (json?.rates?.TWD) setLiveRate(json.rates.TWD);
                    })
                    .catch(err => console.error("Rate fetch failed", err));

                // 2. Weather (Open-Meteo) - Bangkok
                // Get today's forecast
                const weatherRes = await fetch(
                    'https://api.open-meteo.com/v1/forecast?latitude=13.7563&longitude=100.5018&hourly=temperature_2m,precipitation_probability,weathercode&current_weather=true&timezone=Asia%2FBangkok&forecast_days=1'
                );
                const wJson = await weatherRes.json();

                if (wJson && wJson.hourly) {
                    const current = wJson.current_weather;

                    // Filter for 06:00 to 24:00 (indices 6 to 23)
                    // The API returns 0-23 hours. We want 6 to 23.
                    const times = wJson.hourly.time.slice(6, 24);
                    const temps = wJson.hourly.temperature_2m.slice(6, 24);
                    const rains = wJson.hourly.precipitation_probability.slice(6, 24);
                    const codes = wJson.hourly.weathercode.slice(6, 24);

                    const hourlyData = times.map((t: string, i: number) => {
                        // t is ISO string, e.g. "2023-12-22T06:00"
                        const hourStr = t.split('T')[1].slice(0, 5); // "06:00"
                        return {
                            time: hourStr,
                            temp: Math.round(temps[i]),
                            rain: rains[i],
                            icon: weatherCodeToIcon(codes[i])
                        };
                    });

                    setWeatherData({
                        current: {
                            temp: Math.round(current.temperature),
                            desc: '曼谷實時', // Simple label as code description is complex to map fully in text
                            icon: weatherCodeToIcon(current.weathercode)
                        },
                        hourly: hourlyData
                    });
                }

            } catch (error) {
                console.error("Failed to fetch data", error);
            }
        };
        fetchData();
    }, []);

    const handleThbChange = (val: string) => {
        setThbAmount(val);
        if (!val || isNaN(Number(val))) {
            setTwdAmount('');
            return;
        }
        setTwdAmount((Number(val) * liveRate).toFixed(0));
    };

    const handleTwdChange = (val: string) => {
        setTwdAmount(val);
        if (!val || isNaN(Number(val))) {
            setThbAmount('');
            return;
        }
        setThbAmount((Number(val) / liveRate).toFixed(0));
    };

    const tripStartDate = new Date('2025-12-27T00:00:00');
    const [tripState, setTripState] = useState<{ type: 'countdown' | 'day', value: number }>({ type: 'day', value: 1 });
    const [currentDayKey, setCurrentDayKey] = useState('D1');

    useEffect(() => {
        const calculateTripState = () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const diffTime = tripStartDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
                setTripState({ type: 'countdown', value: diffDays });
                setCurrentDayKey('D1');
            } else {
                const dayNum = Math.abs(diffDays) + 1;
                const cappedDayNum = Math.min(Math.max(dayNum, 1), 5);
                setTripState({ type: 'day', value: cappedDayNum });
                setCurrentDayKey(`D${cappedDayNum}`);
            }
        };
        calculateTripState();
    }, []);

    // Initialize Wheel Data from Google Sheets or Local fallback
    const [wheelData, setWheelData] = useState<any[]>([]);
    const [isItineraryLoading, setIsItineraryLoading] = useState(true);

    const loadItinerary = async () => {
        setIsItineraryLoading(true);
        try {
            const data = await SupabaseService.getItinerary();
            if (data && data.length > 0) {
                // Filter by current day (D1, D2...)
                const dayItems = data.filter((item: any) => item.day === currentDayKey);
                if (dayItems.length > 0) {
                    setWheelData(dayItems.map((item: any) => ({
                        id: item.id,
                        time: item.time,
                        title: item.title,
                        location: item.location || '',
                        note: item.description || ''
                    })));
                } else {
                    // Fallback to local if no matching day found in cloud
                    setWheelData(currentDayKey === 'D1' ? ITINERARY_WHEEL_DATA : []);
                }
            } else {
                setWheelData(currentDayKey === 'D1' ? ITINERARY_WHEEL_DATA : []);
            }
        } catch (e) {
            console.error("Failed to load cloud itinerary", e);
            setWheelData(currentDayKey === 'D1' ? ITINERARY_WHEEL_DATA : []);
        } finally {
            setIsItineraryLoading(false);
        }
    };

    useEffect(() => {
        loadItinerary();
    }, [currentDayKey]);

    const [activeIndex, setActiveIndex] = useState(() => {
        const saved = localStorage.getItem('zen_active_itinerary_index');
        return saved ? parseInt(saved, 10) : 0;
    });

    // Persist active index whenever it changes
    useEffect(() => {
        localStorage.setItem('zen_active_itinerary_index', activeIndex.toString());
    }, [activeIndex]);

    const activeItem = wheelData[activeIndex] || wheelData[0] || { location: '', note: '' };

    // Initialize state from LocalStorage or Default
    const [data, setData] = useState(() => {
        const saved = localStorage.getItem('zen_home_data');
        if (!saved) return DEFAULT_DATA;

        const parsed = JSON.parse(saved);
        const merged = { ...DEFAULT_DATA };

        // 只有當 saved 資料中確實有非空值時才覆蓋預設值
        Object.keys(DEFAULT_DATA).forEach(key => {
            const typedKey = key as keyof typeof DEFAULT_DATA;
            if (parsed[typedKey] !== undefined && parsed[typedKey] !== '') {
                (merged as any)[typedKey] = parsed[typedKey];
            }
        });

        return merged;
    });

    // Save to LocalStorage whenever data changes
    useEffect(() => {
        localStorage.setItem('zen_home_data', JSON.stringify(data));
    }, [data]);

    // --- Must Buy List Logic ---
    const [mustBuyItems, setMustBuyItems] = useState<any[]>([]);
    const [newMustBuy, setNewMustBuy] = useState({
        item_name: '',
        price: '',
        location_ref: '',
        visibility: 'private' as 'public' | 'private'
    });

    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    const [isMustBuyLoading, setIsMustBuyLoading] = useState(true);

    const loadMustBuy = async () => {
        setIsMustBuyLoading(true);
        try {
            // 1. Load from Guide (Local for now as it's provided by App)
            const guideData = localStorage.getItem('zen_guide_data_v1');
            const dataToParse = guideData || '{}';
            const parsed = JSON.parse(dataToParse);
            let allItems: any[] = [];
            Object.values(parsed).forEach((loc: any) => {
                if (loc.mustBuy && Array.isArray(loc.mustBuy)) {
                    const itemsWithLoc = loc.mustBuy.map((item: any) => ({
                        ...item,
                        item_name: item.name,
                        location_ref: loc.name || '未知地點',
                        visibility: 'public'
                    }));
                    allItems = [...allItems, ...itemsWithLoc];
                }
            });

            // 2. Load Custom/Private items from Supabase
            const customItems = await SupabaseService.getMustBuys(myUserId);
            allItems = [...allItems, ...customItems];

            setMustBuyItems(allItems);

            // 3. Load Checklist Status from Supabase
            const statuses = await SupabaseService.getChecklistStatuses(myUserId);
            const statusMap: Record<string, boolean> = {};
            statuses.forEach(s => {
                statusMap[s.item_id] = s.is_checked;
            });
            setCheckedItems(statusMap);
        } catch (e) {
            console.error("Failed to load must buy items from sync", e);
        } finally {
            setIsMustBuyLoading(false);
        }
    };

    useEffect(() => {
        loadMustBuy();
        window.addEventListener('storage', loadMustBuy);
        return () => window.removeEventListener('storage', loadMustBuy);
    }, []);

    const handleAddMustBuy = async () => {
        if (!newMustBuy.item_name) return;
        const newItem: any = {
            id: 'custom_' + Date.now(),
            item_name: newMustBuy.item_name,
            price: newMustBuy.price,
            location_ref: newMustBuy.location_ref,
            visibility: newMustBuy.visibility,
            owner_id: myUserId,
            image_url: '',
            created_at: new Date().toISOString()
        };

        const success = await SupabaseService.addRecord('must_buys', newItem);
        if (success) {
            setMustBuyItems([...mustBuyItems, newItem]);
        }

        setNewMustBuy({ item_name: '', price: '', location_ref: '', visibility: 'private' });
        setIsAddMustBuyModalOpen(false);
    };

    const toggleCheck = (id: string) => {
        const newStatus = !checkedItems[id];
        setCheckedItems(prev => ({ ...prev, [id]: newStatus }));
        SupabaseService.syncChecklistStatus(id, myUserId, newStatus).catch(console.error);
    };

    const handleDeleteMustBuy = async (id: string, e?: any) => {
        if (e) e.stopPropagation();

        // Optimistic UI
        setMustBuyItems(prev => prev.filter(i => i.id !== id));

        // Delete from LocalStorage if needed
        let localData = localStorage.getItem('zen_guide_data_v1');
        if (localData) {
            const parsed = JSON.parse(localData);
            let modified = false;
            Object.keys(parsed).forEach(locKey => {
                const loc = parsed[locKey];
                if (loc.mustBuy) {
                    const originalLen = loc.mustBuy.length;
                    loc.mustBuy = loc.mustBuy.filter((i: any) => i.id !== id);
                    if (loc.mustBuy.length !== originalLen) modified = true;
                }
            });
            if (modified) {
                localStorage.setItem('zen_guide_data_v1', JSON.stringify(parsed));
            }
        }

        // Attempt Supabase delete (if it's a UUID/Supabase ID)
        if (id.length > 20) { // UUID heuristic
            try {
                await SupabaseService.deleteRecord('must_buys', id);
            } catch (e) {
                console.error("Failed to delete from Supabase", e);
            }
        }
    };
    // ---------------------------

    // --- Active Itinerary Sync Logic ---
    const isUserInteraction = useRef(false);
    const programmaticScroll = useRef(false);

    // Sync 'is_current' on load
    useEffect(() => {
        const syncInitial = async () => {
            if (wheelData.length === 0) return;
            try {
                const current = await SupabaseService.getCurrentItinerary();
                if (current) {
                    const idx = wheelData.findIndex((i: any) => i.id === current.id);
                    if (idx !== -1 && idx !== activeIndex) {
                        programmaticScroll.current = true;
                        setActiveIndex(idx);
                        // Physically scroll to the item (Instant snap)
                        if (scrollRef.current) {
                            scrollRef.current.scrollTo({ top: idx * 72, behavior: 'instant' });
                        }
                    }
                }
            } catch (e) { console.error(e); }
        };
        syncInitial();
    }, [wheelData, currentDayKey]);

    // Scroll Handler for the Wheel
    const handleScroll = () => {
        if (scrollRef.current) {
            // Ignore programmatic scrolls for interaction tracking
            if (programmaticScroll.current) {
                // We don't reset programmaticScroll here immediately because scroll events might fire multiple times.
                // Resetting it in a timeout or relying on the robust check below is safer.
                // Actually, for snap scrolling, it settles. 
                // Let's just set a flag to ignore logic if needed, but here we just need to know if we should setActiveIndex.
            } else {
                isUserInteraction.current = true;
            }

            const itemHeight = 72; // Adjusted height for better spacing
            const scrollTop = scrollRef.current.scrollTop;
            const index = Math.round(scrollTop / itemHeight);

            // Clamp index
            const clampedIndex = Math.min(Math.max(index, 0), wheelData.length - 1);

            if (clampedIndex !== activeIndex) {
                setActiveIndex(clampedIndex);
            }
        }
    };

    // Reset programmatic flag after render/scroll settles
    useEffect(() => {
        if (programmaticScroll.current) {
            const timer = setTimeout(() => {
                programmaticScroll.current = false;
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [activeIndex]);


    // Debounce Update 'is_current' on scroll
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        if (wheelData.length === 0 || !isUserInteraction.current) return;

        if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);

        updateTimeoutRef.current = setTimeout(() => {
            const item = wheelData[activeIndex];
            if (item && item.id) {
                SupabaseService.setCurrentItinerary(item.id).catch(console.error);
            }
        }, 1500);

        return () => { if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current); };
    }, [activeIndex, wheelData]);

    const handleChange = (key: string, value: string) => {
        setData(prev => ({ ...prev, [key]: value }));
    };

    const handleExport = () => {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = `zen_travel_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
    };

    // --- Meeting Point Modal State ---
    const [meetingPointForm, setMeetingPointForm] = useState({ location: '', note: '' });

    // Pre-fill form when opening or active item changes
    useEffect(() => {
        if (isMeetingModalOpen && activeItem) {
            setMeetingPointForm({
                location: activeItem.location || '',
                note: activeItem.note || ''
            });
        }
    }, [isMeetingModalOpen, activeItem]);

    const handleUpdateMeetingPoint = async () => {
        if (!activeItem || !activeItem.id) return;

        // Optimistic Update
        const updatedWheelData = [...wheelData];
        if (updatedWheelData[activeIndex]) {
            updatedWheelData[activeIndex] = {
                ...updatedWheelData[activeIndex],
                location: meetingPointForm.location,
                note: meetingPointForm.note
            };
            setWheelData(updatedWheelData);
        }

        setIsMeetingModalOpen(false);

        // Sync to DB
        await SupabaseService.updateItinerary(activeItem.id, {
            location: meetingPointForm.location,
            description: meetingPointForm.note
        });
    };

    return (
        <div className="flex-1 h-full overflow-y-auto no-scrollbar relative pb-32">
            {/* Hero Section - Artistic Day Indicator (Restored Size + Full Glass) */}
            <div className="relative w-full h-[400px] rounded-b-[4rem] overflow-hidden group/hero shrink-0 z-10 bg-zen-moss shadow-mist">
                {/* Background Base with Deep Gradients */}
                <div className="absolute inset-0 bg-gradient-to-br from-zen-moss via-zen-moss to-[#4A6660]"></div>

                {/* Subtle light effects behind the glass */}
                <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-zen-moss/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-zen-blue/20 rounded-full blur-[120px]"></div>

                {/* Full-Bleed Glass Overlay */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl border-b border-white/10 flex flex-col items-center justify-center pb-8">
                    <span className="text-sm font-bold tracking-[0.8em] text-white/50 uppercase mb-[-1.5rem] pl-2 z-10 drop-shadow-md">
                        {tripState.type === 'countdown' ? 'Countdown' : 'Day'}
                    </span>
                    <h1 className="text-[12rem] font-bold text-white leading-none tracking-tighter drop-shadow-2xl font-display opacity-95 animate-float-soft">
                        {tripState.type === 'countdown' ? tripState.value : tripState.value}
                    </h1>

                    {/* Subtle Date Capsule */}
                    <div className="mt-6 flex items-center gap-3 bg-white/10 backdrop-blur-xl px-8 py-2.5 rounded-full border border-white/20 shadow-lg">
                        <span className="text-xs text-white/80 font-medium tracking-widest uppercase">
                            {tripState.type === 'countdown' ? `距離出發還有 ${tripState.value} 天` : (DATE_MAP[currentDayKey]?.date || 'Dec 27 · Sat')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Dashboard Stack */}
            <div className="px-5 -mt-12 relative z-30 flex flex-col gap-4">

                {/* 1. Guide & Vehicle Card */}
                <div className={`glass-panel p-0 rounded-[2rem] shadow-float bg-white/85 backdrop-blur-xl border border-white/60 overflow-hidden transition-all duration-300 ${isEditing ? 'ring-4 ring-zen-moss/20 scale-[1.01]' : ''}`}>

                    {/* Edit Trigger & Actions */}
                    <div className="absolute top-0 right-0 z-20 flex">
                        {isEditing && (
                            <div className="flex">
                                <button
                                    onClick={() => {
                                        if (window.confirm('確定要將所有資料重置為預設值嗎？這將清除您的自定義修改。')) {
                                            setData(DEFAULT_DATA);
                                            localStorage.removeItem('zen_home_data');
                                        }
                                    }}
                                    title="重置為預設資料"
                                    className="p-3 bg-red-50 text-red-500 active:bg-red-500 active:text-white transition-colors border-l border-b border-white/20"
                                >
                                    <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                                </button>
                                <button
                                    onClick={handleExport}
                                    title="下載備份資料"
                                    className="p-3 bg-zen-blue/20 text-zen-blue active:bg-zen-blue active:text-white transition-colors border-l border-b border-white/20"
                                >
                                    <span className="material-symbols-outlined text-[18px]">download</span>
                                </button>
                            </div>
                        )}
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`p-3 rounded-bl-2xl transition-colors ${isEditing ? 'bg-zen-moss text-white' : 'bg-white/50 text-zen-text-light active:text-zen-moss'}`}
                        >
                            <span className="material-symbols-outlined text-[18px]">{isEditing ? 'save' : 'edit'}</span>
                        </button>
                    </div>

                    {/* Header Strip */}
                    <div className="bg-zen-moss/10 px-5 py-3 border-b border-white/40 flex items-center gap-2 text-zen-moss">
                        <span className="material-symbols-outlined text-[20px]">description</span>
                        <p className="text-[13px] font-bold tracking-wider">團體基本資料</p>
                    </div>

                    <div className="p-5 space-y-5">
                        {/* Group Name Section */}
                        <div className="space-y-1.5">
                            <p className="text-[10px] text-zen-text-light font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                                <span className="w-1 h-3 bg-zen-moss rounded-full"></span>
                                團名
                            </p>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={data.groupName}
                                    onChange={(e) => handleChange('groupName', e.target.value)}
                                    className="w-full bg-zen-bg/30 rounded-lg px-3 py-2 text-sm font-bold text-zen-text focus:outline-none border border-zen-moss/20"
                                />
                            ) : (
                                <p className="text-[15px] font-bold text-zen-text leading-relaxed">{data.groupName}</p>
                            )}
                        </div>

                        {/* ID Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] text-zen-text-light font-bold uppercase tracking-[0.2em]">團號</p>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={data.groupNo}
                                        onChange={(e) => handleChange('groupNo', e.target.value)}
                                        className="w-full bg-zen-bg/30 rounded px-2 py-1 text-xs font-medium text-zen-text focus:outline-none border border-zen-rock"
                                    />
                                ) : (
                                    <p className="text-xs font-display font-medium text-zen-text bg-zen-mist px-2.5 py-1 rounded inline-block">{data.groupNo}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-zen-text-light font-bold uppercase tracking-[0.2em]">國外團號</p>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={data.foreignGroupNo}
                                        onChange={(e) => handleChange('foreignGroupNo', e.target.value)}
                                        className="w-full bg-zen-bg/30 rounded px-2 py-1 text-xs font-medium text-zen-text focus:outline-none border border-zen-rock"
                                    />
                                ) : (
                                    <p className="text-xs font-display font-medium text-zen-text bg-zen-mist px-2.5 py-1 rounded inline-block">{data.foreignGroupNo}</p>
                                )}
                            </div>
                        </div>

                        <div className="h-[1px] bg-zen-rock/50"></div>

                        {/* Leader & Contact Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] text-zen-text-light font-bold uppercase tracking-[0.2em] flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">person</span>
                                    領隊
                                </p>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={data.leaderName}
                                        onChange={(e) => handleChange('leaderName', e.target.value)}
                                        className="w-full bg-transparent border-b border-purple-200 text-[14px] font-bold text-zen-text focus:outline-none"
                                    />
                                ) : (
                                    <p className="text-[14px] font-bold text-zen-text">{data.leaderName}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-zen-text-light font-bold uppercase tracking-[0.2em] flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">smartphone</span>
                                    台灣手機
                                </p>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={data.leaderPhone}
                                        onChange={(e) => handleChange('leaderPhone', e.target.value)}
                                        className="w-full bg-transparent border-b border-purple-200 text-[14px] font-bold text-zen-text focus:outline-none"
                                    />
                                ) : (
                                    <a href={`tel:${data.leaderPhone}`} className="text-[14px] font-bold text-purple-600 underline decoration-purple-200 decoration-2 underline-offset-4">{data.leaderPhone}</a>
                                )}
                            </div>
                        </div>

                        {/* Badge & Luggage Grid */}
                        <div className="grid grid-cols-2 gap-4 bg-zen-mist/40 p-3.5 rounded-2xl border border-white/50 shadow-inner">
                            <div className="space-y-1">
                                <p className="text-[10px] text-zen-text-light font-bold tracking-[0.2em] uppercase">胸牌</p>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={data.badge}
                                        onChange={(e) => handleChange('badge', e.target.value)}
                                        className="w-full bg-transparent border-b border-zen-rock text-xs font-semibold text-zen-text focus:outline-none"
                                    />
                                ) : (
                                    <p className="text-xs font-semibold text-zen-text">{data.badge}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-zen-text-light font-bold tracking-[0.2em] uppercase">行李牌</p>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={data.luggageTag}
                                        onChange={(e) => handleChange('luggageTag', e.target.value)}
                                        className="w-full bg-transparent border-b border-pink-200 text-xs font-bold text-pink-500 focus:outline-none"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className="w-3.5 h-3.5 rounded-sm bg-pink-500 shadow-sm"></div>
                                        <p className="text-xs font-bold text-pink-500 uppercase tracking-tight">{data.luggageTag}色</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Weather Card (Real-time API) */}
                <div className="glass-panel p-5 rounded-[2rem] shadow-sm border border-white/60 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-zen-moss">location_on</span>
                                <span className="text-xs font-bold text-zen-text-light tracking-widest uppercase">Bangkok</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <h2 className="text-4xl font-bold text-zen-text font-display leading-none">
                                    {weatherData.current?.temp || '--'}°
                                </h2>
                                <p className="text-sm text-zen-text-light mb-1 font-medium">
                                    {weatherData.current?.desc || '載入中...'}
                                </p>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-400 flex items-center justify-center border border-blue-100 shadow-sm">
                            <span className="material-symbols-outlined text-[28px]">
                                {weatherData.current?.icon || 'cloud_sync'}
                            </span>
                        </div>
                    </div>

                    {/* Hourly Forecast (6:00 - 24:00) */}
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
                        {weatherData.hourly.length > 0 ? (
                            weatherData.hourly.map((hour: any, idx: number) => (
                                <div key={idx} className="flex flex-col items-center gap-1.5 min-w-[3.5rem] p-2 rounded-2xl bg-white/40 border border-white/40">
                                    <span className="text-[10px] text-zen-text-light font-bold">{hour.time}</span>
                                    <span className="material-symbols-outlined text-[20px] text-zen-blue">{hour.icon}</span>
                                    <span className="text-sm font-bold text-zen-text">{hour.temp}°</span>
                                    <div className="flex items-center gap-0.5 text-[9px] text-blue-400 font-medium">
                                        <span className="material-symbols-outlined text-[10px]">water_drop</span>
                                        {hour.rain}%
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="w-full text-center text-xs text-zen-text-light py-4">正在獲取曼谷天氣資訊...</div>
                        )}
                    </div>
                </div>

                {/* 3. Exchange Rate Card (Dedicated) */}
                <div className={`glass-panel p-5 rounded-[2rem] shadow-sm border border-white/60 transition-all duration-300 ${isEditing ? 'ring-4 ring-zen-moss/20 bg-white/90' : 'bg-white/60'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center shrink-0 border border-yellow-100">
                                <span className="material-symbols-outlined text-[20px]">currency_exchange</span>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-zen-text">匯率計算機</h3>
                                <p className="text-[10px] text-zen-text-light">即時匯率: 1 THB ≈ {liveRate} TWD</p>
                            </div>
                        </div>
                        {isEditing && (
                            <div className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-[10px] font-bold">
                                編輯模式
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 bg-white/50 rounded-2xl p-1 border border-zen-moss/20">
                        {/* Input THB */}
                        <div className="flex-1 flex flex-col items-center p-3 rounded-xl bg-white shadow-sm border border-white">
                            <span className="text-[10px] text-zen-text-light font-bold uppercase tracking-wider mb-1">泰銖 (THB)</span>
                            <input
                                type="number"
                                value={thbAmount}
                                placeholder="0"
                                onChange={(e) => handleThbChange(e.target.value)}
                                className="text-center bg-transparent text-2xl font-bold text-zen-text focus:outline-none font-display placeholder:text-zen-rock/30 w-full"
                            />
                        </div>

                        <span className="material-symbols-outlined text-zen-moss/50">swap_horiz</span>

                        {/* Input TWD */}
                        <div className="flex-1 flex flex-col items-center p-3 rounded-xl bg-white shadow-sm border border-white">
                            <span className="text-[10px] text-zen-text-light font-bold uppercase tracking-wider mb-1">台幣 (TWD)</span>
                            <input
                                type="number"
                                value={twdAmount}
                                placeholder="0"
                                onChange={(e) => handleTwdChange(e.target.value)}
                                className="text-center bg-transparent text-2xl font-bold text-zen-text focus:outline-none font-display placeholder:text-zen-rock/30 w-full"
                            />
                        </div>
                    </div>
                </div>

            </div>

            <div className="flex flex-col gap-6 px-5 relative z-20 pt-2">

                {/* Quick Actions Block */}
                <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-base font-bold text-zen-text tracking-wide flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-zen-blue"></span>
                            快速功能
                        </h3>
                    </div>
                    <div className="glass-panel p-5 rounded-[2rem] shadow-sm border border-white/60">
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: '翻譯助手', icon: 'translate', color: 'text-zen-blue', bg: 'bg-zen-blue/10', onClick: () => setShowTranslateModal(true) },
                                { label: '緊急求助', icon: 'sos', color: 'text-red-400', bg: 'bg-red-50', onClick: () => setShowSOSModal(true) },
                            ].map((action, i) => (
                                <div key={i} onClick={action.onClick} className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-transform">
                                    <div className={`w-16 h-16 rounded-[1.5rem] ${action.bg} ${action.color} flex items-center justify-center shadow-sm border border-white/50`}>
                                        <span className="material-symbols-outlined text-[28px]">{action.icon}</span>
                                    </div>
                                    <span className="text-[11px] font-medium text-zen-text-light tracking-wide">{action.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Current Activity Wheel (Strict iOS Picker Style) */}
                <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-base font-bold text-zen-text tracking-wide flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-zen-moss"></span>
                            當下行程
                        </h3>
                    </div>

                    <div className="glass-panel rounded-organic shadow-mist overflow-hidden h-[340px] flex flex-col relative">
                        {isItineraryLoading && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-30 flex items-center justify-center">
                                <div className="size-6 border-2 border-zen-moss/20 border-t-zen-moss rounded-full animate-spin"></div>
                            </div>
                        )}
                        {/* Left: Scroll Wheel (80% width) */}
                        <div className="w-full h-[65%] relative border-b border-zen-rock/50 bg-white/30">
                            {/* Fade Masks */}
                            <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-white/90 to-transparent z-20 pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white/90 to-transparent z-20 pointer-events-none"></div>

                            <div
                                ref={scrollRef}
                                onScroll={handleScroll}
                                // snap-y snap-mandatory ensures it always stops exactly on an item
                                // py-[84px] = (240px container - 72px item) / 2 = 84px to center the first/last items
                                className="h-full overflow-y-auto no-scrollbar snap-y snap-mandatory py-[84px] relative z-10"
                            >
                                {wheelData.map((item, index) => {
                                    const isActive = index === activeIndex;
                                    const distance = Math.abs(index - activeIndex);

                                    // Visual Transform logic
                                    // Only show items within distance 1 (current, prev, next) clearly
                                    // Others are hidden or very faint
                                    let opacity = 0;
                                    let scale = 0.9;

                                    if (distance === 0) {
                                        opacity = 1;
                                        scale = 1;
                                    } else if (distance === 1) {
                                        opacity = 0.4; // Faded
                                        scale = 0.95;
                                    }

                                    return (
                                        <div
                                            key={item.id}
                                            style={{
                                                scrollSnapStop: 'always',
                                                opacity: opacity,
                                                transform: `scale(${scale})`,
                                            }}
                                            className="h-[72px] flex items-center justify-center px-4 snap-center transition-all duration-300 ease-out"
                                        >
                                            <div className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${isActive ? 'bg-zen-rock/50 shadow-inner' : 'bg-transparent'}`}>
                                                <span className={`text-sm font-display tracking-wider shrink-0 transition-colors duration-300 ${isActive ? 'text-zen-moss font-bold' : 'text-zen-text-light font-medium'}`}>
                                                    {item.time}
                                                </span>
                                                <span className={`truncate transition-all duration-300 ${isActive ? 'text-xl font-bold text-zen-text tracking-tight' : 'text-base text-zen-text-light font-normal'}`}>
                                                    {item.title}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right: Meeting Point Panel (20% width) */}
                        <div className="w-full h-[35%] flex flex-col items-center justify-center p-2 bg-white/40">
                            <div className="flex flex-col items-center text-center gap-0.5 animate-float-soft w-full">
                                <div className="w-8 h-8 rounded-full bg-zen-moss/10 flex items-center justify-center text-zen-moss mb-0.5">
                                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                                </div>
                                <span className="text-[8px] font-bold text-zen-text-light uppercase tracking-widest scale-90 whitespace-nowrap">集合地點</span>
                                <h4 className="text-xs font-bold text-zen-text leading-tight px-0.5 line-clamp-2 w-full break-words">{activeItem.location}</h4>
                            </div>

                            <button
                                onClick={() => setIsMeetingModalOpen(true)}
                                className="mt-3 text-[9px] font-medium text-zen-moss border border-zen-moss/30 px-2 py-0.5 rounded-full active:bg-zen-moss active:text-white transition-colors whitespace-nowrap scale-90"
                            >
                                設定
                            </button>
                        </div>

                    </div>
                </div>

                {/* Must Buy Checklist Block */}
                <div className="mt-2">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-base font-bold text-zen-text tracking-wide flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                            必買清單
                        </h3>
                        {/* Link to Guide (Itinerary with active params) */}
                        <Link to="/itinerary" className="text-zen-text-light text-xs font-medium active:text-zen-moss tracking-wider flex items-center gap-1 transition-colors">
                            查看攻略
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </Link>
                    </div>

                    <div className="glass-panel p-5 rounded-[2rem] shadow-sm border border-white/60">
                        {/* Header Actions */}
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] text-zen-text-light font-bold uppercase tracking-wider">我的清單</span>
                            <button
                                onClick={() => setIsAddMustBuyModalOpen(true)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-zen-moss/10 text-zen-moss font-bold text-xs active:bg-zen-moss/20 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                新增項目
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            {isMustBuyLoading ? (
                                <div className="flex flex-col items-center justify-center py-10">
                                    <div className="size-8 border-3 border-zen-moss/20 border-t-zen-moss rounded-full animate-spin mb-3"></div>
                                    <p className="text-xs font-medium text-zen-text-light">同步清單中...</p>
                                </div>
                            ) : mustBuyItems.length > 0 ? (
                                mustBuyItems.map((item, i) => {
                                    const isChecked = checkedItems[item.id];
                                    return (
                                        <SwipeableRow key={item.id || i} onDelete={() => handleDeleteMustBuy(item.id)}>
                                            <div
                                                onClick={() => toggleCheck(item.id)}
                                                className={`flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300 cursor-pointer ${isChecked ? 'bg-gray-100 border-transparent opacity-60' : 'bg-white border-white shadow-sm'}`}
                                            >
                                                {/* Checkbox */}
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-zen-moss border-zen-moss' : 'border-zen-rock/30 bg-white'}`}>
                                                    {isChecked && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-base font-bold text-zen-text truncate transition-all ${isChecked ? 'line-through text-zen-text-light' : ''}`}>
                                                        {item.item_name}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] font-bold text-zen-moss bg-zen-moss/10 px-1.5 py-0.5 rounded-md">
                                                            {item.price}
                                                        </span>
                                                        {item.location_ref && (
                                                            <span className="text-[10px] text-zen-text-light truncate max-w-[120px]">
                                                                @{item.location_ref}
                                                            </span>
                                                        )}
                                                        {item.visibility === 'private' && (
                                                            <span className="text-[10px] font-bold text-zen-brown bg-zen-brown/10 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                                                <span className="material-symbols-outlined text-[10px]">lock</span>
                                                                私人
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Thumbnail (if exists) */}
                                                {item.image_url && (
                                                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                                        <img src={item.image_url} alt={item.item_name} className={`w-full h-full object-cover transition-all ${isChecked ? 'grayscale' : ''}`} />
                                                    </div>
                                                )}
                                            </div>
                                        </SwipeableRow>
                                    );
                                })
                            ) : (
                                <div className="p-6 text-center text-zen-text-light bg-white/40 rounded-2xl border border-white/40 border-dashed">
                                    <p className="text-sm font-medium">尚未添加必買清單</p>
                                    <Link to="/itinerary" className="text-xs text-zen-moss font-bold mt-2 inline-block">前往攻略添加</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* SOS Modal */}
            {showSOSModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pb-24 animate-fade-in">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSOSModal(false)}></div>
                    <div className="relative w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up">

                        {/* Header */}
                        <div className="bg-red-50 p-6 flex flex-col items-center border-b border-red-100">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-3 text-red-500 shadow-sm border border-white">
                                <span className="material-symbols-outlined text-[32px]">sos</span>
                            </div>
                            <h2 className="text-xl font-bold text-zen-text tracking-wide">緊急求助電話</h2>
                            <p className="text-xs text-zen-text-light mt-1">請直接點擊撥打</p>
                        </div>

                        {/* Contact List */}
                        <div className="p-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">

                            {/* Priority: Guide */}
                            <a href={`tel:${data.guidePhone}`} className="flex items-center gap-4 p-4 bg-zen-moss/10 rounded-2xl border border-zen-moss/20 active:scale-95 transition-transform">
                                <div className="w-12 h-12 rounded-full bg-zen-moss text-white flex items-center justify-center shrink-0 shadow-md">
                                    <span className="material-symbols-outlined text-[24px]">person</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-zen-moss font-bold uppercase tracking-wider">領隊導遊 (優先)</p>
                                    <p className="text-lg font-bold text-zen-text">{data.guideName}</p>
                                    <p className="text-sm font-medium text-zen-text-light">{data.guidePhone}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-zen-moss shadow-sm">
                                    <span className="material-symbols-outlined">call</span>
                                </div>
                            </a>

                            <div className="h-[1px] bg-zen-rock/50 my-1"></div>

                            {/* Public Services */}
                            {[
                                { name: '觀光警察', num: '1155', icon: 'local_police', desc: 'Tourist Police (中英)' },
                                { name: '報案專線', num: '191', icon: 'emergency', desc: 'Police Ready' },
                                { name: '急救中心', num: '1669', icon: 'ambulance', desc: 'Ambulance' },
                                { name: '泰國觀光局', num: '1672', icon: 'info', desc: 'TAT Call Center' },
                                { name: '駐泰代表處', num: '+66-81-666-4006', icon: 'apartment', desc: 'Emergency (TECO)' },
                            ].map((item, idx) => (
                                <a key={idx} href={`tel:${item.num}`} className="flex items-center gap-4 p-3 hover:bg-zen-mist/30 rounded-xl transition-colors active:bg-zen-mist/50">
                                    <div className="w-10 h-10 rounded-full bg-zen-mist/50 text-zen-text-light flex items-center justify-center shrink-0 border border-white/50">
                                        <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-base font-bold text-zen-text">{item.name}</p>
                                        <p className="text-[10px] text-zen-text-light">{item.desc}</p>
                                    </div>
                                    <div className="text-lg font-bold text-zen-text font-display tracking-wide">{item.num}</div>
                                </a>
                            ))}
                        </div>

                        {/* Footer Close */}
                        <div className="p-4 border-t border-zen-rock/50 bg-zen-bg/50">
                            <button
                                onClick={() => setShowSOSModal(false)}
                                className="w-full py-3 rounded-xl bg-white border border-zen-rock text-zen-text font-bold text-sm shadow-sm active:scale-95 transition-all"
                            >
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Translate Modal */}
            {showTranslateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pb-24 animate-fade-in">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTranslateModal(false)}></div>
                    <div className="relative w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up">

                        {/* Header */}
                        <div className="bg-blue-50 p-6 flex flex-col items-center border-b border-blue-100">
                            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3 text-blue-500 shadow-sm border border-white">
                                <span className="material-symbols-outlined text-[32px]">translate</span>
                            </div>
                            <h2 className="text-xl font-bold text-zen-text tracking-wide">翻譯助手</h2>
                            <p className="text-xs text-zen-text-light mt-1">請選擇翻譯模式 (Google Translate)</p>
                        </div>

                        {/* Options */}
                        <div className="p-6 flex flex-col gap-4">
                            {/* Script for App Launch */}
                            {(() => {
                                const handleAppLaunch = (type: 'translate' | 'lens') => {
                                    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
                                    const isAndroid = /android/i.test(userAgent);
                                    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;

                                    let appUrl = '';
                                    let storeUrl = '';

                                    if (type === 'translate') {
                                        appUrl = 'googletranslate://?sl=th&tl=zh-TW';
                                        if (isAndroid) {
                                            storeUrl = 'https://play.google.com/store/apps/details?id=com.google.android.apps.translate';
                                        } else if (isIOS) {
                                            storeUrl = 'https://apps.apple.com/app/google-translate/id414706506';
                                        } else {
                                            // Desktop
                                            window.open('https://translate.google.com/?sl=th&tl=zh-TW', '_blank');
                                            return;
                                        }
                                    } else if (type === 'lens') {
                                        if (isAndroid) {
                                            appUrl = 'googlelens://';
                                            storeUrl = 'https://play.google.com/store/apps/details?id=com.google.ar.lens';
                                        } else if (isIOS) {
                                            // iOS gets Google App
                                            appUrl = 'googleapp://';
                                            storeUrl = 'https://apps.apple.com/app/google/id284815942';
                                        } else {
                                            // Desktop
                                            window.open('https://lens.google.com/', '_blank');
                                            return;
                                        }
                                    }

                                    const start = Date.now();
                                    // Try open app
                                    window.location.href = appUrl;

                                    // Fallback to store
                                    setTimeout(() => {
                                        if (Date.now() - start < 1500) {
                                            window.location.href = storeUrl;
                                        }
                                    }, 1000);
                                };

                                return (
                                    <>
                                        {/* Voice */}
                                        <button
                                            onClick={() => handleAppLaunch('translate')}
                                            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-zen-rock shadow-sm active:scale-95 transition-transform group text-left w-full"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-zen-blue/10 text-zen-blue flex items-center justify-center shrink-0 group-active:bg-zen-blue group-active:text-white transition-colors">
                                                <span className="material-symbols-outlined text-[24px]">mic</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-base font-bold text-zen-text">語音翻譯 (Google 翻譯)</p>
                                                <p className="text-xs text-zen-text-light">開啟 App 進行對話翻譯</p>
                                            </div>
                                            <span className="material-symbols-outlined text-zen-rock">arrow_forward_ios</span>
                                        </button>

                                        {/* Camera */}
                                        <button
                                            onClick={() => handleAppLaunch('lens')}
                                            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-zen-rock shadow-sm active:scale-95 transition-transform group text-left w-full"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-500 flex items-center justify-center shrink-0 group-active:bg-purple-500 group-active:text-white transition-colors">
                                                <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-base font-bold text-zen-text">相機翻譯 (Google Lens)</p>
                                                <p className="text-xs text-zen-text-light">開啟 Google 智慧鏡頭 (iOS 為 Google App)</p>
                                            </div>
                                            <span className="material-symbols-outlined text-zen-rock">arrow_forward_ios</span>
                                        </button>
                                    </>
                                );
                            })()}

                            {/* App Download Link */}
                            <div className="mt-2 text-center">
                                <p className="text-[10px] text-zen-text-light mb-2">建議下載 Google 翻譯 App 以獲得最佳體驗</p>
                                <div className="flex justify-center gap-4">
                                    <a href="https://apps.apple.com/app/google-translate/id414706506" target="_blank" rel="noopener noreferrer" className="text-xs text-zen-blue font-bold hover:underline">App Store</a>
                                    <span className="text-zen-rock/50">|</span>
                                    <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.translate" target="_blank" rel="noopener noreferrer" className="text-xs text-zen-blue font-bold hover:underline">Google Play</a>
                                </div>
                            </div>
                        </div>

                        {/* Footer Close */}
                        <div className="p-4 border-t border-zen-rock/50 bg-zen-bg/50">
                            <button
                                onClick={() => setShowTranslateModal(false)}
                                className="w-full py-3 rounded-xl bg-white border border-zen-rock text-zen-text font-bold text-sm shadow-sm active:scale-95 transition-all"
                            >
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Must Buy Modal */}
            {isAddMustBuyModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pb-24 animate-fade-in">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddMustBuyModalOpen(false)}></div>
                    <div className="relative w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-2xl animate-scale-up border border-white/20">
                        <h3 className="text-xl font-bold text-zen-text mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-purple-400">add_shopping_cart</span>
                            新增必買項目
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-zen-text-light uppercase tracking-wide">商品名稱</label>
                                <input
                                    type="text"
                                    className="w-full border-b border-zen-rock/50 py-2 bg-transparent text-lg font-bold text-zen-text focus:outline-none focus:border-zen-moss placeholder:text-gray-300"
                                    placeholder="例如：手標泰式奶茶"
                                    value={newMustBuy.item_name}
                                    onChange={e => setNewMustBuy({ ...newMustBuy, item_name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-zen-text-light uppercase tracking-wide">預估價格 (฿)</label>
                                    <input
                                        type="number"
                                        className="w-full border-b border-zen-rock/50 py-2 bg-transparent text-lg font-bold text-zen-text focus:outline-none focus:border-zen-moss placeholder:text-gray-300"
                                        placeholder="0"
                                        value={newMustBuy.price}
                                        onChange={e => setNewMustBuy({ ...newMustBuy, price: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zen-text-light uppercase tracking-wide">地點</label>
                                    <input
                                        type="text"
                                        className="w-full border-b border-zen-rock/50 py-2 bg-transparent text-lg font-bold text-zen-text focus:outline-none focus:border-zen-moss placeholder:text-gray-300"
                                        placeholder="例如：Big C"
                                        value={newMustBuy.location_ref}
                                        onChange={e => setNewMustBuy({ ...newMustBuy, location_ref: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zen-text-light uppercase tracking-wide">公開程度</label>
                                <div className="flex gap-2 mt-1">
                                    {(['public', 'private'] as const).map(v => (
                                        <button
                                            key={v}
                                            onClick={() => setNewMustBuy({ ...newMustBuy, visibility: v })}
                                            className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${newMustBuy.visibility === v
                                                ? 'bg-zen-moss text-white border-zen-moss shadow-sm'
                                                : 'bg-transparent text-zen-text-light border-zen-rock/20'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">{v === 'public' ? 'language' : 'lock'}</span>
                                            {v === 'public' ? '推薦給大家' : '加入我的清單'}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-zen-text-light mt-2 px-1">
                                    {newMustBuy.visibility === 'public' ? '＊這項推薦將會同步給所有行程成員。' : '＊這項紀錄只有在您的裝置上看得到。'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setIsAddMustBuyModalOpen(false)}
                                className="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-zen-text font-bold active:bg-gray-200 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleAddMustBuy}
                                className="flex-1 px-4 py-3 rounded-xl bg-zen-moss text-white font-bold shadow-lg shadow-zen-moss/30 active:scale-[0.98] transition-all"
                            >
                                確定新增
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Meeting Point Settings Modal */}
            {isMeetingModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pb-24 animate-fade-in">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMeetingModalOpen(false)}></div>
                    <div className="relative w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-2xl animate-scale-up border border-white/20">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-zen-moss/10 flex items-center justify-center text-zen-moss">
                                <span className="material-symbols-outlined text-[24px]">location_on</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-zen-text">設定集合資訊</h3>
                                <p className="text-xs text-zen-text-light">針對: {activeItem.title}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-zen-text-light uppercase tracking-wide">集合地點</label>
                                <input
                                    type="text"
                                    className="w-full border-b border-zen-rock/50 py-2 bg-transparent text-lg font-bold text-zen-text focus:outline-none focus:border-zen-moss placeholder:text-gray-300"
                                    placeholder="例如：北門入口"
                                    value={meetingPointForm.location}
                                    onChange={e => setMeetingPointForm({ ...meetingPointForm, location: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zen-text-light uppercase tracking-wide">備註 / 說明</label>
                                <textarea
                                    className="w-full border-b border-zen-rock/50 py-2 bg-transparent text-base font-medium text-zen-text focus:outline-none focus:border-zen-moss placeholder:text-gray-300 min-h-[60px] resize-none"
                                    placeholder="例如：鐘樓下集合，請準時"
                                    value={meetingPointForm.note}
                                    onChange={e => setMeetingPointForm({ ...meetingPointForm, note: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setIsMeetingModalOpen(false)}
                                className="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-zen-text font-bold active:bg-gray-200 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleUpdateMeetingPoint}
                                className="flex-1 px-4 py-3 rounded-xl bg-zen-moss text-white font-bold shadow-lg shadow-zen-moss/30 active:scale-[0.98] transition-all"
                            >
                                儲存設定
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Meeting Point Settings Modal */}
            {isMeetingModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pb-24 animate-fade-in">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMeetingModalOpen(false)}></div>
                    <div className="relative w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-2xl animate-scale-up border border-white/20">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-zen-moss/10 flex items-center justify-center text-zen-moss">
                                <span className="material-symbols-outlined text-[24px]">location_on</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-zen-text">設定集合資訊</h3>
                                <p className="text-xs text-zen-text-light">針對: {activeItem.title}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-zen-text-light uppercase tracking-wide">集合地點</label>
                                <input
                                    type="text"
                                    className="w-full border-b border-zen-rock/50 py-2 bg-transparent text-lg font-bold text-zen-text focus:outline-none focus:border-zen-moss placeholder:text-gray-300"
                                    placeholder="例如：北門入口"
                                    value={meetingPointForm.location}
                                    onChange={e => setMeetingPointForm({ ...meetingPointForm, location: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zen-text-light uppercase tracking-wide">備註 / 說明</label>
                                <textarea
                                    className="w-full border-b border-zen-rock/50 py-2 bg-transparent text-base font-medium text-zen-text focus:outline-none focus:border-zen-moss placeholder:text-gray-300 min-h-[60px] resize-none"
                                    placeholder="例如：鐘樓下集合，請準時"
                                    value={meetingPointForm.note}
                                    onChange={e => setMeetingPointForm({ ...meetingPointForm, note: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setIsMeetingModalOpen(false)}
                                className="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-zen-text font-bold active:bg-gray-200 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleUpdateMeetingPoint}
                                className="flex-1 px-4 py-3 rounded-xl bg-zen-moss text-white font-bold shadow-lg shadow-zen-moss/30 active:scale-[0.98] transition-all"
                            >
                                儲存設定
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};