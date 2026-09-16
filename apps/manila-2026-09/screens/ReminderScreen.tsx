import React, { useEffect, useState } from 'react';
import { useTrip } from '../context/AppState';
import { SupabaseService } from '../services/SupabaseService';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Skeleton } from '../components/ui/skeleton';

const REMINDERS = [
    {
        title: "生活資訊",
        icon: "info",
        items: [
            "飛行時間：約 3 小時 30 分",
            "電壓：220V（兩圓孔）",
            "時差：泰國比台灣 慢 1 小時"
        ]
    },
    {
        title: "小費建議",
        icon: "payments",
        items: [
            "導遊：NT$300／人／天",
            "按摩、行李、床頭、人妖合照：依原檔標準"
        ]
    },
    {
        title: "行李規定",
        icon: "luggage",
        items: [
            "托運行李：23 公斤",
            "手提行李：7 公斤"
        ]
    },
    {
        title: "出入境規定",
        icon: "flight_takeoff",
        sections: [
            {
                subtitle: "1. 泰國入境",
                content: [
                    "2024/7/15 起，持 台灣護照免簽 入境泰國",
                    "每次停留 不超過 60 日",
                    "出境回台 請勿攜帶大麻及相關製品"
                ]
            },
            {
                subtitle: "1.1 攜帶限制",
                content: [
                    "香菸：每人 200 根（超過每根罰 200 泰銖）",
                    "酒類：1 公升",
                    "外幣：等值 5,000 美金"
                ]
            },
            {
                subtitle: "1.2 台灣出境",
                content: [
                    "新台幣現金：不超過 100,000 元",
                    "外幣：不超過 10,000 美金",
                    "液體：須符合 100ml 單瓶／1 公升透明袋 規定"
                ]
            },
            {
                subtitle: "1.3 入境前須填寫 ED 卡",
                content: [
                    "所有旅客需事先上網填寫",
                    "入境時出示 QR Code + 護照"
                ]
            },
            {
                subtitle: "1.4 禁止攜帶",
                content: [
                    "盜版著作",
                    "麻醉劑、毒品、色情書刊、武器"
                ]
            },
            {
                subtitle: "1.5 泰銖出境",
                content: [
                    "不得超過 50,000 泰銖",
                    "前往部分國家不得超過 500,000 泰銖"
                ]
            },
            {
                subtitle: "1.6 入境台灣檢疫",
                content: [
                    "禁止攜帶 動植物及其產品",
                    "包含：肉類、加工肉、蛋品、水果、土壤等",
                    "未申報處 3,000 元以上罰鍰"
                ]
            },
            {
                subtitle: "1.7 非洲豬瘟",
                content: [
                    "嚴禁攜帶 任何肉類製品 入境"
                ]
            },
            {
                subtitle: "1.8 電子菸",
                content: [
                    "禁止攜帶：電子菸、電子菸油、加熱菸",
                    "罰鍰 5 萬～500 萬元"
                ]
            }
        ]
    },
    {
        title: "旅遊須知",
        icon: "campaign",
        sections: [
            {
                subtitle: "1. 成團人數",
                content: [
                    "最低成行：12 人",
                    "未達人數將依定型化契約通知取消"
                ]
            },
            {
                subtitle: "1.1 Mini Tour",
                content: [
                    "人數：6–11 人",
                    "不派台灣領隊",
                    "當地仍有 中文導遊"
                ]
            },
            {
                subtitle: "1.2 包團",
                content: [
                    "未滿 16 人 需另補費"
                ]
            },
            {
                subtitle: "2. TDAC",
                content: [
                    "抵達前 72 小時內申請",
                    "入境時出示 QR Code"
                ]
            },
            {
                subtitle: "3. 行動電源規定（2025/3/1 起）",
                content: [
                    "禁止於航程中 使用與充電",
                    "不得托運",
                    "容量限制依各航空公司規定"
                ]
            }
        ]
    },
    {
        title: "大麻相關法規",
        icon: "block",
        items: [
            "中華民國法律：大麻屬 二級毒品",
            "泰國境內使用須遵守當地法規",
            "禁止攜帶任何大麻產品回台",
            "以下人士不得使用：未滿 20 歲、孕婦、哺乳婦",
            "公共場所抽大麻屬違法行為"
        ]
    },
    {
        title: "其他重要規定",
        icon: "gavel",
        items: [
            "16 歲以下 不得按摩或 SPA（不可退費）",
            "水上活動未參加 不可轉讓或退費",
            "外籍人士報價 另議"
        ]
    },
    {
        title: "風俗民情",
        icon: "temple_buddhist",
        items: [
            "不可摸頭",
            "不可用腳指物",
            "女性不可碰觸和尚",
            "交通 靠左行駛",
            "參觀皇室場所需注意服裝儀容"
        ]
    },
    {
        title: "保險",
        icon: "volunteer_activism",
        items: [
            "履約保證保險",
            "責任保險：意外死亡／殘廢 500 萬",
            "醫療：20 萬",
            "15 歲以下／70 歲以上：死亡／殘廢 250 萬"
        ]
    }
];

export const ReminderScreen: React.FC = () => {
    const { trip } = useTrip();
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [openItems, setOpenItems] = useState<string[]>([]);

    useEffect(() => {
        if (!trip?.id) return;
        setSections([]);
        setOpenItems([]);
        setLoading(true);
        SupabaseService.getReminders(trip.id).then((rows) => {
            const next = rows.map((r: any) => ({
                title: r.title,
                icon: r.icon,
                ...(r.payload || {}),
            }));
            setSections(next);
            setOpenItems(next.map((_, idx) => `item-${idx}`));
        }).catch(console.error).finally(() => setLoading(false));
    }, [trip?.id]);

    const visible = sections.filter((section) => {
        if (!query.trim()) return true;
        const blob = JSON.stringify(section).toLowerCase();
        return blob.includes(query.trim().toLowerCase());
    });

    return (
        <div className="h-full flex flex-col bg-zen-bg overflow-hidden font-display relative page-enter">
            <header className="shrink-0 w-full z-20 px-5 pt-6 pb-2 text-center">
                <h1 className="font-serif text-3xl text-zen-text">旅行須知</h1>
                <p className="text-xs text-zen-text-light mt-1">旅程順利，從細節開始</p>
            </header>

            <div className="px-5 pb-3">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="搜尋提醒內容"
                    className="w-full rounded-2xl border border-zen-rock bg-white px-4 py-3 text-sm min-h-[44px] outline-none focus:ring-2 focus:ring-cta/50"
                />
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-32 pt-1 z-10 w-full">
                {loading && (
                    <div className="flex flex-col gap-3 py-4">
                        <Skeleton className="h-16 w-full rounded-3xl" />
                        <Skeleton className="h-16 w-full rounded-3xl" />
                    </div>
                )}
                {!loading && sections.length === 0 && (
                    <p className="text-sm text-zen-text-light text-center py-8">這團還沒有注意事項。</p>
                )}
                {!loading && sections.length > 0 && visible.length === 0 && (
                    <p className="text-sm text-zen-text-light text-center py-8 animate-fade-in">沒有符合的項目。</p>
                )}
                {!loading && visible.length > 0 && (
                    <Accordion
                        type="multiple"
                        value={openItems}
                        onValueChange={setOpenItems}
                        className="flex flex-col gap-3"
                    >
                        {visible.map((section, idx) => (
                            <AccordionItem
                                key={`${idx}-${section.title}`}
                                value={`item-${idx}`}
                                className="bg-white rounded-[1.25rem] border border-zen-rock px-4 last:border-b animate-fade-in"
                            >
                                <AccordionTrigger className="hover:no-underline min-h-[44px]">
                                    <span className="flex items-center gap-3">
                                        {section.icon && (
                                            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zen-moss/15 text-zen-moss">
                                                <span className="material-symbols-outlined text-[22px]">{section.icon}</span>
                                            </span>
                                        )}
                                        <span className="text-base font-bold tracking-wide text-zen-text">{section.title}</span>
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="flex flex-col gap-4">
                                        {section.items && (
                                            <ul className="flex flex-col gap-3">
                                                {section.items.map((item: string, i: number) => (
                                                    <li key={i} className="flex gap-3 text-sm text-zen-text/80 leading-relaxed font-medium">
                                                        <span className="shrink-0 mt-1.5 size-1.5 rounded-full bg-zen-moss/40"></span>
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        {section.sections && (
                                            <div className="flex flex-col gap-5">
                                                {section.sections.map((sub: any, i: number) => (
                                                    <div key={i} className="bg-zen-mist rounded-2xl p-4 border border-zen-rock">
                                                        <h3 className="text-sm font-bold text-zen-moss mb-2">{sub.subtitle}</h3>
                                                        <ul className="flex flex-col gap-2">
                                                            {sub.content.map((item: string, j: number) => (
                                                                <li key={j} className="flex gap-3 text-sm text-zen-text/70 leading-relaxed">
                                                                    <span className="shrink-0 mt-1.5 size-1 rounded-full bg-zen-text/20"></span>
                                                                    <span>{item}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
                    <div className="text-center py-6 opacity-60">
                        <p className="text-[10px] text-zen-rock/40">
                            最後更新時間：2025/12/23
                            <br />
                            資訊僅供參考，請以最新官方公告為準
                        </p>
                    </div>
            </div>
        </div>
    );
};
