import React, { useState, useEffect, useRef } from 'react';
import SwipeableRow from '../components/SwipeableRow';
import { MotionLink } from '../components/MotionLink';
import { SupabaseService } from '../services/SupabaseService';
import { MustBuyItem, ChecklistStatus, ItineraryItem, Traveler } from '../types';
import { useSession, useTrip } from '../context/AppState';
import { currencyMeta, weatherDescFromCode, weatherPlace, resolveHomeTripDay } from '../lib/tripDisplay';
import { BottomSheet } from '../components/ui/bottom-sheet';
import { CinemaHero } from '../components/CinemaHero';
import { travelerPhotoSrc } from '../lib/travelerPhoto';
import { scatterByUploader } from '../lib/scatterByUploader';
import { DevilPhotoRail } from '../components/DevilPhotoRail';

export const HomeScreen: React.FC = () => {
    const [travelers, setTravelers] = useState<Traveler[]>([]);
    const [travelerIndex, setTravelerIndex] = useState(0);
    const travelerScrollRef = useRef<HTMLDivElement>(null);
    const [devilPhotos, setDevilPhotos] = useState<{ id: string; url: string }[]>([]);
    const [showSOSModal, setShowSOSModal] = useState(false);
    const [showTranslateModal, setShowTranslateModal] = useState(false);


    // --- Meeting Point Modal State ---
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const [isAddMustBuyModalOpen, setIsAddMustBuyModalOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const { user } = useSession();
    const { trip, days, gameClaim } = useTrip();
    const myUserId = user?.id || '';
    const greetName = gameClaim?.display_name || (user?.email || '旅人').split('@')[0];
    const todayLabel = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

    useEffect(() => {
        if (!trip?.id) return;
        SupabaseService.getTravelers(trip.id)
            .then(setTravelers)
            .catch((err) => {
                console.error(err);
                setTravelers([]);
            });
        SupabaseService.getDevilPhotos(trip.id)
            .then(async (rows) => {
                const scattered = scatterByUploader(rows);
                const signed = await Promise.all(
                    scattered.map(async (p) => ({
                        id: p.id,
                        url: await SupabaseService.signedGamePhoto(p.storage_path),
                    }))
                );
                setDevilPhotos(signed);
            })
            .catch((err) => {
                console.error(err);
                setDevilPhotos([]);
            });
    }, [trip?.id]);

    const money = currencyMeta(trip?.currency);
    const placeLabel = weatherPlace(trip);

    const [liveRate, setLiveRate] = useState(Number(trip?.exchange_rate) || 1);
    const [foreignAmount, setForeignAmount] = useState('');
    const [twdAmount, setTwdAmount] = useState('');

    // Weather Data State (Open-Meteo)
    const [weatherData, setWeatherData] = useState<{
        current: { temp: number; desc: string; icon: string; wind?: number };
        hourly: { time: string; temp: number; rain: number; icon: string }[];
        daily: { date: string; label: string; max: number; min: number; rain: number; desc: string; icon: string }[];
    }>({
        current: { temp: 30, desc: '晴時多雲', icon: 'wb_sunny' },
        hourly: [],
        daily: []
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

    useEffect(() => {
        if (!trip) return;
        const fallback = Number(trip.exchange_rate) || 1;
        setLiveRate(fallback);
        setForeignAmount('');
        setTwdAmount('');
        const fetchData = async () => {
            try {
                fetch(`https://api.exchangerate-api.com/v4/latest/${trip.currency || 'THB'}`)
                    .then(res => res.json())
                    .then(json => {
                        if (json?.rates?.TWD) setLiveRate(json.rates.TWD);
                    })
                    .catch(err => console.error("Rate fetch failed", err));

                const weatherRes = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${trip.weather_lat}&longitude=${trip.weather_lng}&hourly=temperature_2m,precipitation_probability,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&current_weather=true&timezone=${encodeURIComponent(trip.timezone || 'UTC')}&forecast_days=16`
                );
                const wJson = await weatherRes.json();

                if (wJson && wJson.hourly) {
                    const current = wJson.current_weather;
                    const times = wJson.hourly.time.slice(6, 24);
                    const temps = wJson.hourly.temperature_2m.slice(6, 24);
                    const rains = wJson.hourly.precipitation_probability.slice(6, 24);
                    const codes = wJson.hourly.weathercode.slice(6, 24);

                    const hourlyData = times.map((t: string, i: number) => {
                        const hourStr = t.split('T')[1].slice(0, 5);
                        return {
                            time: hourStr,
                            temp: Math.round(temps[i]),
                            rain: rains[i],
                            icon: weatherCodeToIcon(codes[i])
                        };
                    });

                    const start = trip.start_date;
                    const end = trip.end_date;
                    const dailyData = (wJson.daily?.time || []).map((date: string, i: number) => {
                        const dayMeta = days.find((d) => d.calendar_date === date);
                        const weekday = new Date(`${date}T00:00:00`).toLocaleDateString('zh-TW', { weekday: 'short', month: 'numeric', day: 'numeric' });
                        return {
                            date,
                            label: dayMeta ? `${dayMeta.day_key} · ${weekday}` : weekday,
                            max: Math.round(wJson.daily.temperature_2m_max[i]),
                            min: Math.round(wJson.daily.temperature_2m_min[i]),
                            rain: wJson.daily.precipitation_probability_max?.[i] ?? 0,
                            desc: weatherDescFromCode(wJson.daily.weathercode[i]),
                            icon: weatherCodeToIcon(wJson.daily.weathercode[i]),
                        };
                    }).filter((d: { date: string }) => (!start || d.date >= start) && (!end || d.date <= end));

                    setWeatherData({
                        current: {
                            temp: Math.round(current.temperature),
                            desc: weatherDescFromCode(current.weathercode),
                            icon: weatherCodeToIcon(current.weathercode),
                            wind: Math.round(current.windspeed)
                        },
                        hourly: hourlyData,
                        daily: dailyData
                    });
                }

            } catch (error) {
                console.error("Failed to fetch data", error);
            }
        };
        fetchData();
    }, [trip?.id, trip?.currency, trip?.weather_lat, trip?.weather_lng, trip?.timezone, trip?.exchange_rate, trip?.start_date, trip?.end_date, days]);

    const handleForeignChange = (val: string) => {
        setForeignAmount(val);
        if (!val || isNaN(Number(val))) {
            setTwdAmount('');
            return;
        }
        setTwdAmount((Number(val) * liveRate).toFixed(0));
    };

    const handleTwdChange = (val: string) => {
        setTwdAmount(val);
        if (!val || isNaN(Number(val))) {
            setForeignAmount('');
            return;
        }
        setForeignAmount((Number(val) / liveRate).toFixed(0));
    };

    const homeDay = resolveHomeTripDay({
        timezone: trip?.timezone,
        startDate: trip?.start_date,
        endDate: trip?.end_date,
        days,
    });
    const tripState = { type: homeDay.type, value: homeDay.value };
    const currentDayKey = homeDay.dayKey;

    // Initialize Wheel Data from Google Sheets or Local fallback
    const [wheelData, setWheelData] = useState<any[]>([]);
    const [isItineraryLoading, setIsItineraryLoading] = useState(true);

    const loadItinerary = async () => {
        setIsItineraryLoading(true);
        try {
            const data = await SupabaseService.getItinerary(trip!.id);
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
                    setWheelData([]);
                }
            } else {
                setWheelData([]);
            }
        } catch (e) {
            console.error("Failed to load cloud itinerary", e);
            setWheelData([]);
        } finally {
            setIsItineraryLoading(false);
        }
    };

    useEffect(() => {
        if (trip?.id) loadItinerary();
    }, [currentDayKey, trip?.id]);

    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const saved = localStorage.getItem(`zen_active_itinerary_index_${currentDayKey}`);
        const n = saved ? parseInt(saved, 10) : 0;
        setActiveIndex(Number.isFinite(n) && n >= 0 ? n : 0);
    }, [currentDayKey]);

    useEffect(() => {
        localStorage.setItem(`zen_active_itinerary_index_${currentDayKey}`, String(activeIndex));
    }, [activeIndex, currentDayKey]);

    useEffect(() => {
        if (wheelData.length > 0 && activeIndex >= wheelData.length) {
            setActiveIndex(0);
        }
    }, [wheelData.length, activeIndex]);

    const activeItem = wheelData[activeIndex] || wheelData[0] || { location: '', note: '' };

    // Initialize state from LocalStorage or Default
    const [data, setData] = useState({
        groupNo: '',
        foreignGroupNo: '',
        groupName: '',
        leaderName: '',
        leaderPhone: '',
        badge: '',
        luggageTag: '',
        guideName: '',
        guidePhone: '',
    });

    useEffect(() => {
        if (!trip) return;
        setData({
            groupNo: trip.group_no || '—',
            foreignGroupNo: trip.foreign_group_no || '—',
            groupName: trip.title,
            leaderName: trip.leader_name || '—',
            leaderPhone: trip.leader_phone || '',
            badge: trip.badge || '—',
            luggageTag: trip.luggage_tag || '—',
            guideName: trip.leader_name || '—',
            guidePhone: trip.leader_phone || '',
        });
    }, [trip?.id]);

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
            const customItems = await SupabaseService.getMustBuys(trip!.id, myUserId);
            allItems = [...allItems, ...customItems];

            setMustBuyItems(allItems);

            // 3. Load Checklist Status from Supabase
            const statuses = await SupabaseService.getChecklistStatuses(trip!.id, myUserId);
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
        if (trip?.id && myUserId) loadMustBuy();
        window.addEventListener('storage', loadMustBuy);
        return () => window.removeEventListener('storage', loadMustBuy);
    }, [trip?.id, myUserId]);

    const handleAddMustBuy = async () => {
        if (!newMustBuy.item_name) return;
        const payload = {
            item_name: newMustBuy.item_name,
            price: newMustBuy.price || null,
            location_ref: newMustBuy.location_ref,
            visibility: newMustBuy.visibility,
            owner_id: myUserId,
            trip_id: trip!.id,
            image_url: '',
        };

        const success = await SupabaseService.addRecord('zentravel_must_buys', payload);
        if (success) {
            setMustBuyItems([...mustBuyItems, ...(success || [])]);
        }

        setNewMustBuy({ item_name: '', price: '', location_ref: '', visibility: 'private' });
        setIsAddMustBuyModalOpen(false);
    };

    const toggleCheck = (id: string) => {
        const newStatus = !checkedItems[id];
        setCheckedItems(prev => ({ ...prev, [id]: newStatus }));
        SupabaseService.syncChecklistStatus(trip!.id, id, myUserId, newStatus).catch(console.error);
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
                await SupabaseService.deleteRecord('zentravel_must_buys', id);
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
                const current = await SupabaseService.getCurrentItinerary(trip!.id);
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
                SupabaseService.setCurrentItinerary(trip!.id, item.id).catch(console.error);
            }
        }, 1500);

        return () => { if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current); };
    }, [activeIndex, wheelData]);

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
        <div className="flex-1 h-full overflow-y-auto no-scrollbar relative pb-28 page-enter">
            <div className="px-5 pt-5 flex items-start justify-between">
                <div>
                    <h1 className="font-serif text-[1.7rem] leading-tight">早安，{greetName}</h1>
                    <p className="text-xs text-zen-text-light mt-1">{todayLabel}</p>
                </div>
                <MotionLink to="/reminder" className="size-10 rounded-full bg-white border border-zen-rock flex items-center justify-center">
                    <span className="material-symbols-outlined">notifications</span>
                </MotionLink>
            </div>

            <CinemaHero tripTitle={trip?.title || '馬尼拉三日'} tripState={tripState} />

            <div className="mx-5 mt-3 rounded-[1.25rem] bg-white border border-zen-rock p-4 flex gap-3 shadow-mist">
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-cta tracking-widest uppercase">下一站 · {currentDayKey}</p>
                    <h3 className="font-serif text-xl mt-1 leading-snug">{activeItem.title || '暫無行程'}</h3>
                    <p className="text-xs text-zen-text-light mt-1">{activeItem.time}{activeItem.note ? ` · ${activeItem.note}` : ''}</p>
                    <p className="text-xs mt-2 text-zen-text">集合：{activeItem.location || '未設定'}</p>
                    <button type="button" onClick={() => setIsMeetingModalOpen(true)} className="text-[11px] text-cta mt-1 min-h-[32px]">設定集合點</button>
                </div>
                <img src={activeItem?.image || '/spots/intramuros.png'} alt="" className="w-24 h-24 rounded-xl object-cover shrink-0 bg-zen-mist" />
            </div>

            {wheelData.length > 0 && (
                <div className="mx-5 mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                    {wheelData.map((item, index) => (
                        <button
                            key={item.id || index}
                            type="button"
                            onClick={() => {
                                isUserInteraction.current = true;
                                setActiveIndex(index);
                            }}
                            className={`shrink-0 rounded-full px-3 py-2 text-xs min-h-[40px] border ${
                                index === activeIndex
                                    ? 'bg-zen-moss text-white border-zen-moss'
                                    : 'bg-white text-zen-text border-zen-rock'
                            }`}
                        >
                            {item.time} {item.title}
                        </button>
                    ))}
                </div>
            )}

            {/* Main Dashboard Stack */}
            <div className="px-5 mt-8 relative flex flex-col gap-3 stagger-in">

                <div>
                    <div className="flex items-center justify-between px-1 mb-2">
                        <h3 className="text-sm font-medium">團員</h3>
                        <p className="text-[10px] text-zen-text-light">{travelers.length ? `${travelerIndex + 1} / ${travelers.length}` : ''}</p>
                    </div>
                    {travelers.length === 0 ? (
                        <div className="glass-panel rounded-[1.25rem] p-6 text-center text-sm text-zen-text-light">尚無團員資料</div>
                    ) : (
                        <>
                            <div
                                ref={travelerScrollRef}
                                onScroll={(e) => {
                                    const el = e.currentTarget;
                                    const i = Math.round(el.scrollLeft / Math.max(el.clientWidth * 0.86, 1));
                                    setTravelerIndex(Math.min(Math.max(i, 0), travelers.length - 1));
                                }}
                                className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1"
                            >
                                {travelers.map((person) => (
                                    <article
                                        key={person.id}
                                        className="snap-center shrink-0 w-[86%] glass-panel rounded-[1.25rem] overflow-hidden p-0 flex flex-col !border-2 !border-zen-moss"
                                    >
                                        {person.photo_url ? (
                                            <img
                                                src={travelerPhotoSrc(person.photo_url)}
                                                alt=""
                                                className="w-full h-72 bg-zen-mist object-contain object-center"
                                            />
                                        ) : (
                                            <div className="w-full h-72 bg-zen-moss text-white flex items-center justify-center font-serif text-7xl">
                                                {person.display_name.slice(0, 1)}
                                            </div>
                                        )}
                                        <div className="p-4">
                                            <h4 className="font-serif text-2xl leading-tight">{person.display_name}</h4>
                                            {[person.outbound, person.inbound].filter((f) => f && (f.route || f.time || f.flight_no)).map((flight, fi) => (
                                                <div key={fi} className="mt-2">
                                                    <p className="text-[10px] tracking-widest text-cta uppercase">{flight.label || (fi === 0 ? '去程' : '回程')}</p>
                                                    <p className="text-xs font-medium truncate">
                                                        {flight.flight_no ? `${flight.flight_no} · ` : ''}{flight.route}
                                                    </p>
                                                    <p className="text-[11px] text-zen-text-light">
                                                        {flight.date} {flight.time}
                                                        {flight.note ? ` · ${flight.note}` : ''}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </article>
                                ))}
                            </div>
                            <div className="flex justify-center gap-1.5 mt-2">
                                {travelers.map((person, i) => (
                                    <button
                                        key={person.id}
                                        type="button"
                                        aria-label={`團員 ${person.display_name}`}
                                        onClick={() => {
                                            const el = travelerScrollRef.current;
                                            if (!el) return;
                                            el.scrollTo({ left: i * el.clientWidth * 0.86, behavior: 'smooth' });
                                            setTravelerIndex(i);
                                        }}
                                        className={`h-1.5 rounded-full transition-all ${i === travelerIndex ? 'w-5 bg-cta' : 'w-1.5 bg-zen-rock'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {devilPhotos.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between px-1 mb-2">
                            <h3 className="text-sm font-medium">醜照蒐集站</h3>
                        </div>
                        <DevilPhotoRail photos={devilPhotos} />
                    </div>
                )}

                <div className="glass-panel p-4 rounded-[1.25rem]">
                    <p className="text-[10px] tracking-widest text-cta uppercase">即時天氣</p>
                    <div className="flex items-end justify-between mt-1">
                        <div>
                            <p className="text-sm text-zen-text-light">{placeLabel}現在</p>
                            <p className="font-serif text-5xl leading-none mt-1">{weatherData.current?.temp ?? '--'}°</p>
                            <p className="text-xs text-zen-text-light mt-2">{weatherData.current?.desc || '載入中'}</p>
                        </div>
                        <div className="text-right">
                            <span className="material-symbols-outlined text-zen-moss text-[40px]">{weatherData.current?.icon || 'cloud'}</span>
                            {weatherData.current?.wind != null && (
                                <p className="text-[11px] text-zen-text-light mt-1">風速 {weatherData.current.wind} km/h</p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar mt-4 pt-3 border-t border-zen-rock">
                        {weatherData.hourly.length > 0 ? (
                            weatherData.hourly.map((hour, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-1 min-w-[3rem]">
                                    <span className="text-[10px] text-zen-text-light">{hour.time}</span>
                                    <span className="material-symbols-outlined text-[18px] text-zen-moss">{hour.icon}</span>
                                    <span className="text-xs font-medium">{hour.temp}°</span>
                                </div>
                            ))
                        ) : (
                            <p className="w-full text-center text-xs text-zen-text-light py-2">正在獲取{placeLabel}天氣…</p>
                        )}
                    </div>
                </div>

                <div className="glass-panel p-4 rounded-[1.25rem]">
                    <p className="text-[10px] tracking-widest text-cta uppercase">天氣預報</p>
                    <p className="text-sm mt-1 mb-3">這三天</p>
                    {weatherData.daily.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {weatherData.daily.map((day) => (
                                <div key={day.date} className="rounded-2xl bg-zen-mist px-3 py-2.5">
                                    <div className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-zen-moss mt-0.5 shrink-0">{day.icon}</span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm font-medium leading-snug break-words">{day.label}</p>
                                                <p className="font-serif text-lg leading-none tabular-nums shrink-0">
                                                    {day.max}° <span className="text-zen-text-light text-sm">/ {day.min}°</span>
                                                </p>
                                            </div>
                                            <p className="text-[11px] text-zen-text-light leading-snug break-words mt-1">
                                                {day.desc} · 降雨 {day.rain}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-zen-text-light">尚無法取得這三日預報</p>
                    )}
                </div>

                <div className="glass-panel p-4 rounded-[1.25rem]">
                    <p className="text-sm font-medium mb-1">匯率</p>
                    <p className="text-[10px] text-zen-text-light mb-3">1 {money.code} ≈ {Number(liveRate).toFixed(2)} TWD</p>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-xl bg-zen-mist p-3">
                            <span className="text-[10px] text-zen-text-light">{money.code}</span>
                            <input
                                type="number"
                                value={foreignAmount}
                                placeholder="0"
                                onChange={(e) => handleForeignChange(e.target.value)}
                                className="w-full bg-transparent text-xl font-serif focus:outline-none"
                            />
                        </div>
                        <span className="material-symbols-outlined text-zen-text-light">swap_horiz</span>
                        <div className="flex-1 rounded-xl bg-zen-mist p-3">
                            <span className="text-[10px] text-zen-text-light">TWD</span>
                            <input
                                type="number"
                                value={twdAmount}
                                placeholder="0"
                                onChange={(e) => handleTwdChange(e.target.value)}
                                className="w-full bg-transparent text-xl font-serif focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

            </div>

            <div className="flex flex-col gap-4 px-5 relative pt-1 stagger-in">

                <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setShowTranslateModal(true)} className="glass-panel p-4 rounded-[1.25rem] text-left min-h-[88px] cursor-pointer">
                        <span className="material-symbols-outlined text-cta">translate</span>
                        <p className="mt-2 text-sm font-medium">翻譯</p>
                        <p className="text-[11px] text-zen-text-light">語音／相機</p>
                    </button>
                    <button type="button" onClick={() => setShowSOSModal(true)} className="glass-panel p-4 rounded-[1.25rem] text-left min-h-[88px] cursor-pointer">
                        <span className="material-symbols-outlined text-cta">sos</span>
                        <p className="mt-2 text-sm font-medium">緊急求助</p>
                        <p className="text-[11px] text-zen-text-light">領隊與當地電話</p>
                    </button>
                </div>

                {/* Must Buy Checklist Block */}
                <div className="mt-2">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-base font-bold text-zen-text tracking-wide flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cta"></span>
                            必買清單
                        </h3>
                        {/* Link to Guide (Itinerary with active params) */}
                        <MotionLink to="/itinerary" className="text-zen-text-light text-xs font-medium tracking-wider flex items-center gap-1">
                            查看攻略
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </MotionLink>
                    </div>

                    <div className="glass-panel p-5 rounded-[1.25rem]">
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
                                                className={`flex items-center gap-4 p-3 rounded-2xl border duration-300 cursor-pointer ${isChecked ? 'bg-zen-mist border-transparent opacity-60' : 'bg-white border-zen-rock'}`}
                                            >
                                                {/* Checkbox */}
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-transform duration-200 ${isChecked ? 'bg-zen-moss border-zen-moss scale-110' : 'border-zen-rock/30 bg-white'}`}>
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
                                                    <div className="w-12 h-12 rounded-lg bg-zen-mist overflow-hidden shrink-0">
                                                        <img src={item.image_url} alt={item.item_name} className={`w-full h-full object-cover transition-all ${isChecked ? 'grayscale' : ''}`} />
                                                    </div>
                                                )}
                                            </div>
                                        </SwipeableRow>
                                    );
                                })
                            ) : (
                                <div className="p-6 text-center text-zen-text-light bg-zen-mist rounded-2xl border border-dashed border-zen-rock">
                                    <p className="text-sm font-medium">尚未添加必買清單</p>
                                    <MotionLink to="/itinerary" className="text-xs text-cta font-bold mt-2 inline-block">前往攻略添加</MotionLink>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <BottomSheet open={showSOSModal} onClose={() => setShowSOSModal(false)} title="緊急求助電話" description="請直接點擊撥打" footer={
                <button onClick={() => setShowSOSModal(false)} className="w-full py-3 rounded-xl bg-white border border-zen-rock text-zen-text font-bold text-sm min-h-[44px] cursor-pointer active:scale-95 transition-all">取消</button>
            }>
                <div className="flex flex-col gap-3">
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
                    {(trip?.sos?.length
                        ? trip.sos.map((s) => ({ name: s.label, num: s.phone, icon: 'call', desc: s.label }))
                        : []
                    ).map((item, idx) => (
                        <a key={idx} href={`tel:${item.num}`} className="flex items-center gap-4 p-3 rounded-xl active:bg-zen-mist/50 transition-colors min-h-[44px]">
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
            </BottomSheet>
            {/* Translate Modal */}
            <BottomSheet open={showTranslateModal} onClose={() => setShowTranslateModal(false)} title="翻譯助手" description="請選擇翻譯模式 (Google Translate)" footer={
                <button onClick={() => setShowTranslateModal(false)} className="w-full py-3 rounded-xl bg-white border border-zen-rock text-zen-text font-bold text-sm min-h-[44px] cursor-pointer active:scale-95 transition-all">取消</button>
            }>
                <div className="flex flex-col gap-4">
                            {/* Script for App Launch */}
                            {(() => {
                                const handleAppLaunch = (type: 'translate' | 'camera') => {
                                    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
                                    const isAndroid = /android/i.test(userAgent);
                                    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;

                                    // Target Database: Google Translate
                                    const androidPackage = 'com.google.android.apps.translate';
                                    const iosAppId = 'id414706506';
                                    const webUrl = 'https://translate.google.com/?sl=tl&tl=zh-TW';

                                    // On Desktop, just open web
                                    if (!isAndroid && !isIOS) {
                                        window.open(webUrl, '_blank');
                                        return;
                                    }

                                    if (isAndroid) {
                                        // Android Intent: Tries to open app, falls back to Play Store automatically
                                        const intentUrl = `intent://translate.google.com/?sl=tl&tl=zh-TW#Intent;scheme=https;package=${androidPackage};S.browser_fallback_url=https://play.google.com/store/apps/details?id=${androidPackage};end`;
                                        window.location.href = intentUrl;
                                    } else if (isIOS) {
                                        // iOS: Try custom scheme, fallback to App Store via timeout
                                        const appUrl = 'googletranslate://?sl=tl&tl=zh-TW';
                                        const storeUrl = `https://apps.apple.com/app/google-translate/${iosAppId}`;

                                        const start = Date.now();
                                        window.location.href = appUrl;

                                        setTimeout(() => {
                                            if (Date.now() - start < 1500) {
                                                window.location.href = storeUrl;
                                            }
                                        }, 1000);
                                    }
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
                                            onClick={() => handleAppLaunch('camera')}
                                            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-zen-rock shadow-sm active:scale-95 transition-transform group text-left w-full"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-zen-mist text-zen-moss flex items-center justify-center shrink-0 group-active:bg-zen-moss group-active:text-white duration-200">
                                                <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-base font-bold text-zen-text">相機翻譯 (Google 翻譯)</p>
                                                <p className="text-xs text-zen-text-light">開啟 App 使用相機功能</p>
                                            </div>
                                            <span className="material-symbols-outlined text-zen-rock">arrow_forward_ios</span>
                                        </button>
                                    </>
                                );
                            })()}
                </div>
            </BottomSheet>

            {/* Add Must Buy Modal */}
            <BottomSheet open={isAddMustBuyModalOpen} onClose={() => setIsAddMustBuyModalOpen(false)} title="新增必買項目">
                            <div>
                                <label className="text-xs font-bold text-zen-text-light uppercase tracking-wide">商品名稱</label>
                                <input
                                    type="text"
                                    className="w-full border-b border-zen-rock/50 py-2 bg-transparent text-lg font-bold text-zen-text focus:outline-none focus:border-zen-moss placeholder:text-gray-300"
                                    placeholder="例如：伴手禮"
                                    value={newMustBuy.item_name}
                                    onChange={e => setNewMustBuy({ ...newMustBuy, item_name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-zen-text-light uppercase tracking-wide">預估價格 ({money.symbol})</label>
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
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setIsAddMustBuyModalOpen(false)}
                                className="flex-1 px-4 py-3 rounded-xl bg-zen-mist text-zen-text font-bold min-h-[44px]"
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
            </BottomSheet>

            <BottomSheet open={isMeetingModalOpen} onClose={() => setIsMeetingModalOpen(false)} title="設定集合資訊" description={activeItem ? `針對: ${activeItem.title}` : undefined}>
                        <div className="flex flex-col gap-4">
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
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setIsMeetingModalOpen(false)}
                                className="flex-1 px-4 py-3 rounded-xl bg-zen-mist text-zen-text font-bold min-h-[44px] cursor-pointer"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleUpdateMeetingPoint}
                                className="flex-1 px-4 py-3 rounded-xl bg-zen-moss text-white font-bold shadow-lg shadow-zen-moss/30 active:scale-[0.98] transition-all min-h-[44px] cursor-pointer"
                            >
                                儲存設定
                            </button>
                        </div>
            </BottomSheet>
        </div>
    );
};