import React, { useState, useEffect, useRef } from 'react';
import SwipeableRow from '../components/SwipeableRow';
import { useLocation } from 'react-router-dom';
import { MotionLink } from '../components/MotionLink';
import { useSession, useTrip } from '../context/AppState';
import { SupabaseService } from '../services/SupabaseService';
import { imageForItem } from '../lib/spotImages';
import { BottomSheet } from '../components/ui/bottom-sheet';
import { GuideLink, MustBuyItem } from '../types';
import { formatMustBuyPrice, migrateLocalGuideToCloud, parseMustBuyPrice } from '../lib/guideCloud';
import { toast } from 'sonner';
import { currencyMeta } from '../lib/tripDisplay';

// ----------------------------------------------------------------------
// Mock Data (Full Schedule)
// ----------------------------------------------------------------------
const FULL_ITINERARY_DATA: any = {
    'D1': {
        date: '27 Dec',
        items: [
            { id: 'd1-1', type: 'flight', time: '09:00', title: '桃園 → 曼谷', desc: '搭乘豪華客機飛往佛教王國首都曼谷。', location: '登機門 B6' },
            { id: 'd1-2', type: 'market', time: '13:00', title: '洽圖恰假日市集', desc: '東南亞最大跳蚤市場。', location: '北門入口' },
            { id: 'd1-3', type: 'temple', time: '16:00', title: '愛樂威四面佛', desc: '由正面順時針參拜。', location: '君悅飯店轉角' },
            { id: 'd1-4', type: 'shopping', time: '17:30', title: 'Central World', desc: '曼谷三大百貨之一。', location: '1F 服務台' },
            { id: 'd1-5', type: 'shopping', time: '19:00', title: 'BIG C 大賣場', desc: '必買伴手禮。', location: '2F 收銀台' },
            { id: 'd1-6', type: 'food', time: '20:30', title: '沙薇泰式料理', desc: '晚餐：40 年老店。', location: '餐廳大廳' },
            { id: 'd1-7', type: 'hotel', time: '22:00', title: 'Grand Fourwings', desc: '飯店休息。', location: 'Lobby' },
        ]
    },
    'D2': {
        date: '28 Dec',
        items: [
            { id: 'd2-1', type: 'activity', time: '09:00', title: '丹能莎朵水上市場', desc: '體驗歐式水上市場。' },
            { id: 'd2-2', type: 'activity', time: '12:00', title: '爆笑鐵支路', desc: '若遇不上火車，每人贈送可樂一杯。' },
            { id: 'd2-3', type: 'temple', time: '14:00', title: '樹中佛', desc: '400 年老樹環抱 200 年佛寺。' },
            { id: 'd2-4', type: 'activity', time: '16:00', title: '泰拳公園', desc: '欣賞 200 多座栩栩如生的泰拳招式雕塑。' },
            { id: 'd2-5', type: 'market', time: '18:00', title: 'CICADA 週末創意市集', desc: '華欣最美夜市。' },
            { id: 'd2-7', type: 'hotel', time: '21:00', title: 'ACE OF HUA HIN', desc: '飯店休息。' },
        ]
    },
    'D3': {
        date: '29 Dec',
        items: [
            { id: 'd3-1', type: 'relax', time: '10:00', title: '飯店設施 / 華欣海灘', desc: '享受度假村設施。' },
            { id: 'd3-2', type: 'activity', time: '13:00', title: '皇家火車站', desc: '泰國最美火車站。' },
            { id: 'd3-3', type: 'activity', time: '15:00', title: '駱駝共和國', desc: '摩洛哥風格主題樂園。' },
            { id: 'd3-4', type: 'food', time: '16:30', title: '網美海景祕密咖啡廳', desc: '享受無敵海景下午茶，拍照打卡聖地。' },
            { id: 'd3-6', type: 'market', time: '18:00', title: '華欣夜市', desc: '晚餐自費。' },
        ]
    },
    'D4': {
        date: '30 Dec',
        items: [
            { id: 'd4-1', type: 'nature', time: '09:00', title: '拷龍洞', desc: '天然鐘乳石洞穴。' },
            { id: 'd4-2', type: 'market', time: '11:00', title: '瑪哈拉碼頭文青市集', desc: 'Tha Maharaj，文青河岸市集。' },
            { id: 'd4-3', type: 'activity', time: '13:00', title: '湄南河遊船', desc: '搭船欣賞昭披耶河畔風光。' },
            { id: 'd4-4', type: 'shopping', time: '15:00', title: 'ICONSIAM 暹羅天地', desc: '曼谷必逛地標級購物中心。' },
            { id: 'd4-5', type: 'food', time: '18:00', title: '喬德夜市', desc: '網紅美食集散地。' },
        ]
    },
    'D5': {
        date: '31 Dec',
        items: [
            { id: 'd5-1', type: 'temple', time: '09:00', title: '金佛寺', desc: '參拜世界最大的黃金佛像。', },
            { id: 'd5-2', type: 'activity', time: '11:00', title: '嘟嘟車遊唐人街', desc: '搭乘泰國特色 Tuk Tuk 車。' },
            { id: 'd5-3', type: 'shopping', time: '13:00', title: 'MEGA BANGNA', desc: '超大型購物中心。' },
            { id: 'd5-4', type: 'flight', time: '16:00', title: '曼谷 → 桃園', desc: '搭機返回溫暖的家。' },
        ]
    }
};

// Flatten data for easier consumption in the timeline
const ALL_ITEMS = Object.entries(FULL_ITINERARY_DATA).flatMap(([dayKey, dayData]: [string, any]) => {
    return dayData.items.map((item: any) => ({
        ...item,
        dayLabel: dayKey, // D1, D2...
        fullDate: dayData.date
    }));
});

// ----------------------------------------------------------------------
// Types (Guide)
// ----------------------------------------------------------------------

interface GuideItem {
    id: string;
    name: string;
    price: string;
    desc: string;
    img?: string;
    tag?: string;
}

interface ExternalLink {
    id: string;
    title: string;
    source: string;
    url: string;
    icon: string;
    color: string;
}

interface LocationGuide {
    name: string;
    mustBuy: GuideItem[];
    links: ExternalLink[];
}

const DEFAULT_DB: Record<string, LocationGuide> = {
    // '洽圖恰假日市集': {
    //     name: '洽圖恰假日市集',
    //     mustBuy: [
    //         { id: 'chat-1', name: '椰子冰淇淋', price: '฿60', desc: '入口處必吃，附贈椰子水。', tag: '必吃' },
    //         { id: 'chat-2', name: '手工編織包', price: '฿250', desc: '8區特色小店，質感很好。', tag: '熱銷' },
    //         { id: 'chat-3', name: '香氛精油', price: '฿100', desc: '送禮自用兩相宜，味道選擇多。' },
    //         { id: 'chat-4', name: '泰式奶茶', price: '฿40', desc: '手標紅茶現沖及時飲。' },
    //     ],
    //     links: [
    //         { id: 'l1', title: '洽圖恰戰利品大公開', source: 'Dcard', url: 'https://www.dcard.tw', icon: 'forum', color: 'text-blue-400' },
    //         { id: 'l2', title: '市集地圖與攻略', source: 'Blog', url: 'https://google.com', icon: 'map', color: 'text-green-500' }
    //     ]
    // },
    // 'BIG C 大賣場': {
    //     name: 'BIG C Supercenter',
    //     mustBuy: [
    //         { id: 'bigc-1', name: '小老闆海苔', price: '฿59', desc: '經典伴手禮，整箱搬最划算。', tag: '必買' },
    //         { id: 'bigc-2', name: 'Pocky 芒果口味', price: '฿20', desc: '泰國限定口味。' },
    //         { id: 'bigc-3', name: '手標泰式茶粉', price: '฿130', desc: '紅色罐裝最經典。' },
    //     ],
    //     links: [
    //         { id: 'l3', title: 'BIG C 必買清單 Top 10', source: 'Instagram', url: 'https://instagram.com', icon: 'photo_camera', color: 'text-pink-500' }
    //     ]
    // }
};

// ----------------------------------------------------------------------
// Component: Itinerary Screen (Guide Page)
// ----------------------------------------------------------------------

const ItineraryScreen: React.FC = () => {
    const { trip, days, isGuest } = useTrip();
    const { user } = useSession();
    const myUserId = user?.id || '';
    const money = currencyMeta(trip?.currency);
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);

    // Params (Note: 'day' param from URL is used for initial approximation if ID not found, 
    // but now we have a global list)
    const idParam = queryParams.get('id');
    const initialLocationName = queryParams.get('location');
    const [allItems, setAllItems] = useState<any[]>([]);
    const [itemsLoading, setItemsLoading] = useState(true);

    useEffect(() => {
        if (!trip?.id) return;
        setItemsLoading(true);
        SupabaseService.getItinerary(trip.id).then((items) => {
            setAllItems(items.map((item) => ({
                ...item,
                desc: item.description,
                dayLabel: item.day,
                fullDate: days.find((d) => d.day_key === item.day)?.date_num || item.day,
            })));
        }).catch(console.error).finally(() => setItemsLoading(false));
    }, [trip?.id, days]);

    const [selectedId, setSelectedId] = useState<string | null>(idParam);

    const selectedItem = allItems.find(it => it.id === selectedId) || allItems[0];

    // Derived location name from the selected item
    const currentLocationName = selectedItem?.title || initialLocationName || '一般行程';

    // Sync state if URL changes
    useEffect(() => {
        if (idParam) {
            setSelectedId(idParam);
        }
    }, [idParam]);

    const [links, setLinks] = useState<GuideLink[]>([]);
    const [mustBuys, setMustBuys] = useState<MustBuyItem[]>([]);
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [newLink, setNewLink] = useState({ title: '', url: '', source: 'Web' });
    const [newItem, setNewItem] = useState({
        name: '',
        price: '',
        desc: '',
        visibility: 'public' as 'public' | 'private',
    });

    const loadGuideExtras = async () => {
        if (!trip?.id) return;
        try {
            if (!isGuest && myUserId) {
                await migrateLocalGuideToCloud(trip.id, myUserId);
            }
            const [cloudLinks, cloudBuys, statuses] = await Promise.all([
                SupabaseService.getGuideLinks(trip.id),
                SupabaseService.getMustBuys(trip.id, myUserId),
                myUserId ? SupabaseService.getChecklistStatuses(trip.id, myUserId) : Promise.resolve([]),
            ]);
            setLinks(cloudLinks);
            setMustBuys(cloudBuys);
            const statusMap: Record<string, boolean> = {};
            statuses.forEach((s) => { statusMap[s.item_id] = s.is_checked; });
            setCheckedItems(statusMap);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        void loadGuideExtras();
    }, [trip?.id, myUserId, isGuest]);

    const spotLinks = links.filter((link) => (
        (selectedItem?.id && link.itinerary_item_id === selectedItem.id)
        || (!!link.location_ref && link.location_ref === currentLocationName)
    ));
    const spotBuys = mustBuys.filter((item) => (
        (selectedItem?.id && item.itinerary_item_id === selectedItem.id)
        || (!!item.location_ref && item.location_ref === currentLocationName)
    ));

    const handleAddLink = async () => {
        if (isGuest) return;
        if (!newLink.title || !trip?.id || !myUserId) return;
        try {
            const rows = await SupabaseService.addGuideLink({
                trip_id: trip.id,
                itinerary_item_id: selectedItem?.id || null,
                location_ref: currentLocationName,
                title: newLink.title.trim(),
                url: newLink.url.trim() || '#',
                source: newLink.source,
                owner_id: myUserId,
            });
            setLinks((prev) => [...prev, ...rows]);
            setNewLink({ title: '', url: '', source: 'Web' });
            setShowLinkModal(false);
            toast.success('已分享給全團');
        } catch (err) {
            console.error(err);
            toast.error('連結沒有存進資料庫');
        }
    };

    const handleAddItem = async () => {
        if (isGuest) return;
        if (!newItem.name || !trip?.id || !myUserId) return;
        try {
            const rows = await SupabaseService.addRecord('zentravel_must_buys', {
                trip_id: trip.id,
                item_name: newItem.name.trim(),
                price: parseMustBuyPrice(newItem.price),
                location_ref: currentLocationName,
                itinerary_item_id: selectedItem?.id || null,
                visibility: newItem.visibility,
                owner_id: myUserId,
                image_url: '',
                note: newItem.desc.trim() || null,
            });
            setMustBuys((prev) => [...prev, ...(rows || [])]);
            setNewItem({ name: '', price: '', desc: '', visibility: 'public' });
            setShowItemModal(false);
            toast.success(newItem.visibility === 'public' ? '已推薦給全團' : '已加入你的清單');
        } catch (err) {
            console.error(err);
            toast.error('必買沒有存進資料庫');
        }
    };

    const toggleCheck = (id: string) => {
        if (isGuest || !trip?.id || !myUserId) return;
        const next = !checkedItems[id];
        setCheckedItems((prev) => ({ ...prev, [id]: next }));
        SupabaseService.syncChecklistStatus(trip.id, id, myUserId, next).catch((err) => {
            console.error(err);
            setCheckedItems((prev) => ({ ...prev, [id]: !next }));
            toast.error('勾選沒有存進去');
        });
    };

    const handleDeleteLink = async (id: string) => {
        if (isGuest) return;
        setLinks((prev) => prev.filter((item) => item.id !== id));
        try {
            await SupabaseService.deleteRecord('zentravel_guide_links', id);
        } catch (err) {
            console.error(err);
            toast.error('刪除失敗');
            void loadGuideExtras();
        }
    };

    const handleDeleteMustBuy = async (id: string) => {
        if (isGuest) return;
        setMustBuys((prev) => prev.filter((item) => item.id !== id));
        try {
            await SupabaseService.deleteRecord('zentravel_must_buys', id);
        } catch (err) {
            console.error(err);
            toast.error('刪除失敗');
            void loadGuideExtras();
        }
    };

    // Auto-scroll to selected item
    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (selectedId && scrollRef.current) {
            const el = document.getElementById(`nav-item-${selectedId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
    }, [selectedId]);

    if (!selectedItem) {
        return (
            <div className="flex flex-col h-full bg-zen-bg font-display items-center justify-center gap-3 px-6 page-enter">
                <p className="text-sm text-zen-text-light">{itemsLoading ? '載入中…' : '這團還沒有行程項目。'}</p>
                <MotionLink to="/discovery" className="text-xs text-cta">回行程</MotionLink>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-zen-bg font-display overflow-hidden page-enter">
            <header className="shrink-0 px-5 pt-6 pb-2">
                <h1 className="font-serif text-3xl text-center text-zen-text">攻略</h1>
                <p className="text-xs text-zen-text-light text-center mt-1">必吃、必買與收藏</p>
            </header>

            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-3"
            >
                {allItems.map((item: any) => {
                    const isSelected = selectedId === item.id;
                    const thumb = imageForItem(item.title, item.image || item.image_url);
                    return (
                        <button
                            key={item.id}
                            id={`nav-item-${item.id}`}
                            type="button"
                            onClick={() => setSelectedId(item.id)}
                            className={`shrink-0 w-32 rounded-[1.1rem] overflow-hidden border text-left ${
                                isSelected ? 'border-cta ring-1 ring-cta/40' : 'border-zen-rock'
                            }`}
                        >
                            {thumb ? (
                                <img src={thumb} alt="" className="h-16 w-full object-cover bg-zen-mist" />
                            ) : (
                                <div className="h-16 w-full bg-zen-mist" />
                            )}
                            <div className="px-2 py-1.5 bg-white">
                                <p className="text-[9px] text-cta">{item.dayLabel}</p>
                                <p className="text-[11px] font-medium truncate">{item.title}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                <div key={selectedId} className="animate-slide-up">
                    {selectedItem && imageForItem(selectedItem.title, selectedItem.image || selectedItem.image_url) && (
                        <div className="overflow-hidden bg-zen-mist">
                            <img
                                src={imageForItem(selectedItem.title, selectedItem.image || selectedItem.image_url)}
                                alt={currentLocationName}
                                className="w-full h-44 object-cover"
                            />
                        </div>
                    )}
                    <div className="px-6 pt-5">
                        <p className="text-[10px] tracking-[0.28em] uppercase text-cta mb-2">{selectedItem.dayLabel} · {selectedItem.time || selectedItem.fullDate}</p>
                        <h2 className="font-serif text-3xl text-zen-text tracking-wide mb-3 leading-snug">{currentLocationName}</h2>
                        <p className="text-sm text-zen-text-light mb-4 leading-relaxed whitespace-pre-wrap">{selectedItem.desc}</p>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-zen-rock">
                            <span className="material-symbols-outlined text-[14px] text-cta">location_on</span>
                            <span className="text-[10px] font-medium text-zen-text-light">{selectedItem.location || '暫無詳細位置'}</span>
                        </div>
                    </div>
                </div>

                <div className="px-6 mt-8 mb-10">
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="font-serif text-xl text-zen-text">收藏文章</h2>
                    </div>
                    <p className="text-[11px] text-zen-text-light mb-4">全團都看得到。正式團員可新增，誰加的誰可以刪。</p>

                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        {!isGuest && (
                        <button
                            type="button"
                            onClick={() => setShowLinkModal(true)}
                            className="shrink-0 size-28 rounded-[1.25rem] border border-dashed border-zen-rock flex flex-col items-center justify-center gap-2 text-zen-text-light bg-white"
                        >
                            <span className="material-symbols-outlined text-[28px]">add</span>
                            <span className="text-[10px] font-medium">新增連結</span>
                        </button>
                        )}

                        {spotLinks.map((link) => {
                            const card = (
                                <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block shrink-0 h-28 w-28 p-3 rounded-[1.25rem] bg-white border border-zen-rock flex flex-col justify-between"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="size-7 rounded-full bg-zen-mist flex items-center justify-center text-zen-moss">
                                            <span className="material-symbols-outlined text-[16px]">link</span>
                                        </div>
                                        <span className="material-symbols-outlined text-zen-rock text-[16px]">open_in_new</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-medium text-zen-text leading-tight line-clamp-2 mb-1">{link.title}</h3>
                                        <span className="text-[9px] text-zen-text-light bg-zen-mist px-1.5 py-0.5 rounded">{link.source || 'Web'}</span>
                                    </div>
                                </a>
                            );
                            return !isGuest && link.owner_id === myUserId ? (
                                <SwipeableRow key={link.id} onDelete={() => handleDeleteLink(link.id)}>
                                    {card}
                                </SwipeableRow>
                            ) : (
                                <div key={link.id}>{card}</div>
                            );
                        })}
                    </div>
                    {spotLinks.length === 0 && isGuest && (
                        <p className="text-xs text-zen-text-light mt-2">這個景點還沒有收藏文章。</p>
                    )}
                </div>

                <div className="px-6 mb-10">
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="font-serif text-xl text-zen-text">必買清單</h2>
                        {!isGuest && (
                        <button
                            type="button"
                            onClick={() => setShowItemModal(true)}
                            className="btn-cta text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 min-h-[44px]"
                        >
                            <span className="material-symbols-outlined text-[14px]">add</span>
                            新增
                        </button>
                        )}
                    </div>
                    <p className="text-[11px] text-zen-text-light mb-4">可選「推薦給大家」或只給自己看。點一下即可劃掉，勾選狀態每人一份。</p>

                    <div className="flex flex-col gap-3">
                        {spotBuys.length === 0 && (
                            <div className="p-8 rounded-[1.25rem] bg-white text-center border border-dashed border-zen-rock">
                                <p className="text-sm text-zen-text-light">還沒有必買清單，快來新增吧！</p>
                            </div>
                        )}

                        {spotBuys.map((item) => {
                            const isChecked = !!checkedItems[item.id];
                            const row = (
                                <div
                                    role="checkbox"
                                    aria-checked={isChecked}
                                    tabIndex={isGuest ? -1 : 0}
                                    onClick={() => toggleCheck(item.id)}
                                    onKeyDown={(e) => {
                                        if (isGuest) return;
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            toggleCheck(item.id);
                                        }
                                    }}
                                    className={`group p-4 rounded-[1.25rem] bg-white border border-zen-rock flex items-start gap-4 ${isGuest ? '' : 'cursor-pointer'} ${isChecked ? 'opacity-60' : ''}`}
                                >
                                    <span
                                        aria-hidden
                                        className={`size-5 mt-1 rounded-full border-2 shrink-0 flex items-center justify-center ${isChecked ? 'bg-zen-moss border-zen-moss' : 'border-zen-rock'}`}
                                    >
                                        {isChecked && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-3">
                                            <h3 className={`text-base font-medium text-zen-text leading-tight ${isChecked ? 'line-through text-zen-text-light' : ''}`}>
                                                {item.item_name}
                                            </h3>
                                            {formatMustBuyPrice(item.price, money.symbol) && (
                                                <div className="px-2 py-0.5 rounded-md bg-zen-mist text-xs text-zen-moss font-serif">
                                                    {formatMustBuyPrice(item.price, money.symbol)}
                                                </div>
                                            )}
                                        </div>
                                        {item.note && (
                                            <p className={`text-xs text-zen-text-light mt-1.5 leading-relaxed ${isChecked ? 'line-through' : ''}`}>{item.note}</p>
                                        )}
                                        {item.visibility === 'private' && (
                                            <span className="inline-flex items-center gap-0.5 mt-2 text-[9px] font-bold text-zen-brown bg-zen-brown/10 px-1.5 py-0.5 rounded-md">
                                                <span className="material-symbols-outlined text-[10px]">lock</span>
                                                私人
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                            return !isGuest && item.owner_id === myUserId ? (
                                <SwipeableRow key={item.id} onDelete={() => handleDeleteMustBuy(item.id)}>
                                    {row}
                                </SwipeableRow>
                            ) : (
                                <div key={item.id}>{row}</div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <BottomSheet
                open={showLinkModal}
                onClose={() => setShowLinkModal(false)}
                title="新增收藏連結"
            >
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-zen-text-light uppercase">標題</label>
                                        <input
                                            type="text"
                                            className="w-full border-b border-zen-rock/50 py-2 bg-transparent font-bold text-zen-text focus:outline-none focus:border-zen-blue"
                                            placeholder="文章標題..."
                                            value={newLink.title}
                                            onChange={e => setNewLink({ ...newLink, title: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zen-text-light uppercase">網址 (URL)</label>
                                        <input
                                            type="url"
                                            className="w-full border-b border-zen-rock/50 py-2 bg-transparent text-sm text-zen-text focus:outline-none focus:border-zen-blue"
                                            placeholder="https://..."
                                            value={newLink.url}
                                            onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zen-text-light uppercase">來源</label>
                                        <select
                                            className="w-full border-b border-zen-rock/50 py-2 bg-transparent text-sm text-zen-text focus:outline-none focus:border-zen-blue"
                                            value={newLink.source}
                                            onChange={e => setNewLink({ ...newLink, source: e.target.value })}
                                        >
                                            <option value="Blog">部落格 / 網頁</option>
                                            <option value="Dcard">Dcard</option>
                                            <option value="Instagram">Instagram</option>
                                            <option value="YouTube">YouTube</option>
                                            <option value="Other">其他</option>
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => void handleAddLink()}
                                        className="w-full py-4 mt-2 rounded-xl btn-cta font-bold min-h-[44px]"
                                    >
                                        新增連結
                                    </button>
                                </div>
            </BottomSheet>
            <BottomSheet
                open={showItemModal}
                onClose={() => setShowItemModal(false)}
                title="新增必買商品"
            >
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-zen-text-light uppercase">商品名稱</label>
                                        <input
                                            type="text"
                                            className="w-full border-b border-zen-rock/50 py-2 bg-transparent font-bold text-zen-text focus:outline-none focus:border-zen-moss"
                                            placeholder="例如：椰子糖..."
                                            value={newItem.name}
                                            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zen-text-light uppercase">預估價格</label>
                                        <input
                                            type="text"
                                            className="w-full border-b border-zen-rock/50 py-2 bg-transparent font-medium text-zen-text focus:outline-none focus:border-zen-moss"
                                            placeholder={`${money.symbol}100`}
                                            value={newItem.price}
                                            onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zen-text-light uppercase">備註 / 描述</label>
                                        <textarea
                                            className="w-full border-b border-zen-rock/50 py-2 bg-transparent text-sm text-zen-text focus:outline-none focus:border-zen-moss resize-none h-20"
                                            placeholder="哪裡買？有什麼特色？"
                                            value={newItem.desc}
                                            onChange={e => setNewItem({ ...newItem, desc: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zen-text-light uppercase tracking-wide">公開程度</label>
                                        <div className="flex gap-2 mt-1">
                                            {(['public', 'private'] as const).map((v) => (
                                                <button
                                                    key={v}
                                                    type="button"
                                                    onClick={() => setNewItem({ ...newItem, visibility: v })}
                                                    className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${newItem.visibility === v
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
                                            {newItem.visibility === 'public' ? '＊全團都看得到這項推薦。' : '＊只有你看得到，換手機也在。'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => void handleAddItem()}
                                        className="w-full py-4 mt-2 rounded-xl btn-cta font-bold min-h-[44px]"
                                    >
                                        加入清單
                                    </button>
                                </div>
            </BottomSheet>
        </div>
    );
};

export default ItineraryScreen;