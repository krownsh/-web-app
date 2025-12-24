import React, { useState, useEffect, useRef } from 'react';
import SwipeableRow from '../components/SwipeableRow';
import { Link, useLocation } from 'react-router-dom';

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
            { id: 'd3-6', type: 'market', time: '18:00', title: '華欣夜市', desc: '晚餐自費。' },
        ]
    },
    'D4': {
        date: '30 Dec',
        items: [
            { id: 'd4-1', type: 'nature', time: '09:00', title: '拷龍洞', desc: '天然鐘乳石洞穴。' },
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
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);

    // Params (Note: 'day' param from URL is used for initial approximation if ID not found, 
    // but now we have a global list)
    const idParam = queryParams.get('id');
    const initialLocationName = queryParams.get('location');

    // State for Active Selection
    // Initialize with ID from URL, or default to the first item ever
    const [selectedId, setSelectedId] = useState<string | null>(idParam || ALL_ITEMS[0].id);

    // Find the currently selected item object in the global list
    const selectedItem = ALL_ITEMS.find(it => it.id === selectedId) || ALL_ITEMS[0];

    // Derived location name from the selected item
    const currentLocationName = selectedItem?.title || initialLocationName || '一般行程';

    // Sync state if URL changes
    useEffect(() => {
        if (idParam) {
            setSelectedId(idParam);
        }
    }, [idParam]);


    // Global Data State (persisted)
    const [allGuides, setAllGuides] = useState<Record<string, LocationGuide>>(() => {
        const saved = localStorage.getItem('zen_guide_data_v1');
        return saved ? JSON.parse(saved) : DEFAULT_DB;
    });

    const currentGuide = allGuides[currentLocationName] || { name: currentLocationName, mustBuy: [], links: [] };

    const [showLinkModal, setShowLinkModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [newLink, setNewLink] = useState({ title: '', url: '', source: 'Web' });
    const [newItem, setNewItem] = useState({ name: '', price: '฿', desc: '', tag: '' });

    useEffect(() => {
        localStorage.setItem('zen_guide_data_v1', JSON.stringify(allGuides));
    }, [allGuides]);

    const handleAddLink = () => {
        if (!newLink.title) return;
        setAllGuides(prev => ({
            ...prev,
            [currentLocationName]: {
                ...currentGuide,
                name: currentLocationName, // Ensure name is set
                links: [
                    ...(prev[currentLocationName]?.links || []),
                    {
                        id: Date.now().toString(),
                        title: newLink.title,
                        url: newLink.url || '#',
                        source: newLink.source,
                        icon: 'link',
                        color: 'text-zen-blue'
                    }
                ],
                mustBuy: prev[currentLocationName]?.mustBuy || []
            }
        }));
        setNewLink({ title: '', url: '', source: 'Web' });
        setShowLinkModal(false);
    };

    const handleAddItem = () => {
        if (!newItem.name) return;
        setAllGuides(prev => ({
            ...prev,
            [currentLocationName]: {
                ...currentGuide,
                name: currentLocationName,
                mustBuy: [
                    ...(prev[currentLocationName]?.mustBuy || []),
                    {
                        id: Date.now().toString(),
                        name: newItem.name,
                        price: newItem.price,
                        desc: newItem.desc,
                        tag: newItem.tag
                    }
                ],
                links: prev[currentLocationName]?.links || []
            }
        }));
        setNewItem({ name: '', price: '฿', desc: '', tag: '' });
        setShowItemModal(false);
    };

    const handleDeleteLocalItem = (type: 'links' | 'mustBuy', id: string) => {
        setAllGuides(prev => ({
            ...prev,
            [currentLocationName]: {
                ...prev[currentLocationName],
                [type]: (prev[currentLocationName][type] || []).filter((i: any) => i.id !== id)
            }
        }));
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

    return (
        <div className="flex flex-col h-full bg-zen-mist font-display overflow-hidden">
            {/* Header / Top Bar */}
            <header className="shrink-0 bg-white/80 backdrop-blur-md border-b border-zen-rock/10 pt-4 pb-2 shadow-sm z-50">
                <div className="flex items-center justify-between px-4 mb-3">
                    <Link to="/discovery" className="flex size-8 items-center justify-center rounded-full bg-zen-bg text-zen-text active:bg-zen-rock/10 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    </Link>
                    <div className="flex flex-col items-center">
                        <h1 className="text-sm font-bold tracking-wide text-zen-text truncate">
                            {selectedItem.dayLabel} • {selectedItem.fullDate}
                        </h1>
                    </div>
                    <div className="size-8"></div>
                </div>

                {/* Horizontal Timeline List (ALL Items) */}
                <div
                    ref={scrollRef}
                    className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-2 items-end h-[70px]"
                >
                    {ALL_ITEMS.map((item: any, index: number) => {
                        const isSelected = selectedId === item.id;
                        // Check if day changed from previous item to show divider or spacing (optional, keeping simple for now)
                        const isNewDay = index === 0 || ALL_ITEMS[index - 1].dayLabel !== item.dayLabel;

                        return (
                            <React.Fragment key={item.id}>
                                {isNewDay && index !== 0 && (
                                    <div className="w-[1px] h-6 bg-zen-rock/20 mx-1 mb-2 shrink-0"></div>
                                )}
                                <button
                                    id={`nav-item-${item.id}`}
                                    onClick={() => setSelectedId(item.id)}
                                    className={`shrink-0 flex flex-col justify-center items-start px-3 py-1.5 rounded-lg transition-all duration-300 border ${isSelected
                                        ? 'bg-zen-moss text-white border-zen-moss shadow-md scale-100 h-[56px]'
                                        : 'bg-white text-zen-text border-zen-rock/10 hover:border-zen-moss/30 h-[46px]'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 w-full">
                                        <span className={`text-[10px] font-bold ${isSelected ? 'text-white/70' : 'text-zen-moss'}`}>
                                            {item.dayLabel}
                                        </span>
                                    </div>
                                    <span className={`text-xs font-bold leading-tight truncate w-full max-w-[100px] text-left ${isSelected ? 'text-white' : 'text-zen-text'}`}>
                                        {item.title}
                                    </span>
                                </button>
                            </React.Fragment>
                        );
                    })}
                </div>
            </header>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-32">

                {/* Title and Info */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-zen-text tracking-wide mb-1 leading-snug">{currentLocationName}</h2>
                    <p className="text-xs text-zen-text-light mb-2">{selectedItem.desc}</p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-zen-rock/10 shadow-sm">
                        <span className="material-symbols-outlined text-[14px] text-zen-moss">location_on</span>
                        <span className="text-[10px] font-bold text-zen-text-light">{selectedItem.location || '暫無詳細位置'}</span>
                    </div>
                </div>

                {/* 1. Saved Links (Carousel) */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-400 text-[22px]">link</span>
                            <h2 className="text-lg font-bold text-zen-text tracking-wide">收藏文章</h2>
                        </div>
                    </div>

                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
                        <button
                            onClick={() => setShowLinkModal(true)}
                            className="shrink-0 size-28 rounded-2xl border-2 border-dashed border-zen-rock/30 flex flex-col items-center justify-center gap-2 text-zen-text-light hover:bg-white/50 active:bg-zen-rock/10 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[28px]">add</span>
                            <span className="text-[10px] font-bold">新增連結</span>
                        </button>

                        {currentGuide.links.map((link) => (
                            <SwipeableRow key={link.id} onDelete={() => handleDeleteLocalItem('links', link.id)}>
                                <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block shrink-0 h-28 w-28 p-3 rounded-2xl bg-white border border-zen-rock/10 shadow-sm flex flex-col justify-between active:scale-95 transition-transform"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className={`size-7 rounded-full bg-zen-bg flex items-center justify-center ${link.color}`}>
                                            <span className="material-symbols-outlined text-[16px]">{link.icon}</span>
                                        </div>
                                        <span className="material-symbols-outlined text-zen-rock/30 text-[16px]">open_in_new</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-zen-text leading-tight line-clamp-2 mb-1">{link.title}</h3>
                                        <span className="text-[9px] text-zen-text-light bg-zen-mist px-1.5 py-0.5 rounded text-end block w-fit">{link.source}</span>
                                    </div>
                                </a>
                            </SwipeableRow>
                        ))}
                    </div>
                </div>

                {/* 2. Must Buy List */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-zen-moss text-[22px]">shopping_cart</span>
                            <h2 className="text-lg font-bold text-zen-text tracking-wide">必買清單</h2>
                        </div>
                        <button
                            onClick={() => setShowItemModal(true)}
                            className="bg-zen-moss text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm active:bg-zen-moss/80 transition-colors flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-[14px]">add</span>
                            新增
                        </button>
                    </div>

                    <div className="flex flex-col gap-4">
                        {currentGuide.mustBuy.length === 0 && (
                            <div className="p-8 rounded-3xl bg-white/50 text-center border-2 border-dashed border-zen-rock/10">
                                <p className="text-sm text-zen-text-light font-medium">還沒有必買清單，快來新增吧！</p>
                            </div>
                        )}

                        {currentGuide.mustBuy.map((item) => (
                            <SwipeableRow key={item.id} onDelete={() => handleDeleteLocalItem('mustBuy', item.id)}>
                                <div className="group p-4 rounded-2xl bg-white border border-zen-rock/20 shadow-sm flex items-start gap-4 active:scale-[0.99] transition-all">
                                    <button className="size-5 mt-1 rounded-full border-2 border-zen-rock/30 shrink-0 group-active:bg-zen-moss group-active:border-zen-moss transition-colors"></button>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-base font-bold text-zen-text leading-tight">{item.name}</h3>
                                            <div className="px-2 py-0.5 rounded-md bg-zen-bg font-bold text-xs text-zen-moss font-display border border-zen-rock/20">
                                                {item.price}
                                            </div>
                                        </div>
                                        <p className="text-xs text-zen-text-light mt-1.5 leading-relaxed">{item.desc}</p>
                                        {item.tag && (
                                            <div className="mt-2">
                                                <span className="inline-block text-[9px] font-bold text-white bg-zen-moss px-2 py-0.5 rounded-full shadow-sm">
                                                    #{item.tag}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </SwipeableRow>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {(showLinkModal || showItemModal) && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowLinkModal(false); setShowItemModal(false); }}></div>
                    <div className="relative w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-2xl animate-scale-up border border-white/20">
                        {showLinkModal ? (
                            <>
                                <h3 className="text-xl font-bold text-zen-text mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-400">add_link</span>
                                    新增收藏連結
                                </h3>
                                <div className="space-y-4">
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
                                        onClick={handleAddLink}
                                        className="w-full py-4 mt-2 rounded-xl bg-zen-blue text-white font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform"
                                    >
                                        新增連結
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="text-xl font-bold text-zen-text mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-zen-moss">add_shopping_cart</span>
                                    新增必買商品
                                </h3>
                                <div className="space-y-4">
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
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-zen-text-light uppercase">預估價格</label>
                                            <input
                                                type="text"
                                                className="w-full border-b border-zen-rock/50 py-2 bg-transparent font-medium text-zen-text focus:outline-none focus:border-zen-moss"
                                                placeholder="฿100"
                                                value={newItem.price}
                                                onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-zen-text-light uppercase">標籤 (選填)</label>
                                            <input
                                                type="text"
                                                className="w-full border-b border-zen-rock/50 py-2 bg-transparent font-medium text-zen-text focus:outline-none focus:border-zen-moss"
                                                placeholder="例如：伴手禮"
                                                value={newItem.tag}
                                                onChange={e => setNewItem({ ...newItem, tag: e.target.value })}
                                            />
                                        </div>
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
                                    <button
                                        onClick={handleAddItem}
                                        className="w-full py-4 mt-2 rounded-xl bg-zen-moss text-white font-bold shadow-lg shadow-green-200 active:scale-95 transition-transform"
                                    >
                                        加入清單
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ItineraryScreen;