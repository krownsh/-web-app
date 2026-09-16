import React, { useState } from 'react';
import { useTrip } from '../context/AppState';
import { daysUntil } from '../lib/tripDisplay';
import { MotionLink } from '../components/MotionLink';

const CHECKLIST = [
    { title: '換匯準備', desc: '建議帶台幣至當地 SuperRich 或銀行換匯。', checked: true },
    { title: '下載叫車 App', desc: 'Grab，建議綁定信用卡方便付款。', checked: false, important: true },
    { title: '準備小額紙鈔', desc: '作為小費使用。', checked: false },
];

const PreparationScreen: React.FC = () => {
    const { trip } = useTrip();
    const [activeTab, setActiveTab] = useState<'pre-trip' | 'general'>('pre-trip');
    const countdown = daysUntil(trip?.start_date);

    return (
        <div className="flex-1 h-full overflow-y-auto no-scrollbar bg-zen-bg pb-32 page-enter">
            <div className="sticky top-0 z-50 flex items-center bg-zen-bg/90 backdrop-blur-md px-5 py-4 justify-between">
                <MotionLink to="/" className="text-zen-text flex size-10 shrink-0 items-center justify-center rounded-full">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </MotionLink>
                <h2 className="text-zen-text text-lg font-medium tracking-wide flex-1 text-center pr-10">
                    行前準備
                </h2>
            </div>

            <div className="px-5">
                <div className="relative flex rounded-full bg-zen-mist p-1">
                    <div
                        className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{ transform: activeTab === 'pre-trip' ? 'translateX(0)' : 'translateX(100%)', left: '4px' }}
                    />
                    {([
                        { id: 'pre-trip' as const, label: '行前準備' },
                        { id: 'general' as const, label: '一般資訊' },
                    ]).map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative z-10 flex-1 py-2 text-sm tracking-wide cursor-pointer ${activeTab === tab.id ? 'text-zen-moss font-medium' : 'text-zen-text-light'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div key={activeTab} className="flex flex-col gap-8 pt-6 animate-slide-up">
                {activeTab === 'pre-trip' ? (
                    <>
                        <div className="px-5">
                            <div className="relative overflow-hidden rounded-[1.25rem] bg-white border border-zen-rock p-5 shadow-mist flex gap-4">
                                <div className="shrink-0">
                                    <p className="font-serif text-5xl leading-none text-[#6b4a32] tabular-nums">{countdown > 0 ? countdown : 0}</p>
                                    <p className="text-[10px] tracking-[0.2em] text-[#6b4a32] mt-1 uppercase">Days</p>
                                    <p className="text-[10px] text-zen-text-light mt-1">until departure</p>
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <p className="text-xs text-zen-text-light mb-2">出發倒數</p>
                                    <div className="h-2 w-full bg-zen-rock rounded-full overflow-hidden">
                                        <div className="h-full bg-[#8b5a3c] w-[70%] rounded-full"></div>
                                    </div>
                                    <p className="mt-3 text-xs text-zen-text-light">3 項待辦</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-5">
                            <h2 className="text-lg font-medium text-zen-text tracking-wide mb-4">重要提醒</h2>
                            <div className="rounded-[1.25rem] bg-white border-l-4 border-cta p-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-cta text-lg">info</span>
                                    <h3 className="text-base font-medium">簽證與入境規範</h3>
                                </div>
                                <p className="text-sm text-zen-text-light leading-relaxed">
                                    請確認護照效期與入境規定。入境前備妥 QR Code 與護照。
                                </p>
                            </div>
                        </div>

                        <div className="px-5">
                            <h2 className="text-lg font-medium mb-4">清單檢查</h2>
                            <div className="space-y-3">
                                {CHECKLIST.map((item, i) => (
                                    <label key={i} className="group flex items-start gap-4 p-5 rounded-[1.25rem] bg-white border border-zen-rock cursor-pointer">
                                        <input type="checkbox" defaultChecked={item.checked} className="mt-1 h-5 w-5 rounded-full border-2 border-zen-rock text-cta" />
                                        <div className="flex-1 group-has-[:checked]:opacity-50">
                                            <div className="flex justify-between gap-2">
                                                <p className="text-base font-medium group-has-[:checked]:line-through">{item.title}</p>
                                                {item.important && <span className="text-[10px] tracking-widest text-cta border border-cta/30 px-2 py-0.5 rounded-full">重要</span>}
                                            </div>
                                            <p className="text-xs text-zen-text-light mt-2 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="px-5 grid grid-cols-2 gap-3">
                            <div className="rounded-[1.25rem] bg-white border border-zen-rock p-5">
                                <span className="material-symbols-outlined text-zen-moss">bolt</span>
                                <p className="font-serif text-3xl mt-3">220V</p>
                                <p className="text-xs text-zen-text-light mt-1">電壓 · 兩圓孔</p>
                            </div>
                            <div className="rounded-[1.25rem] bg-white border border-zen-rock p-5">
                                <span className="material-symbols-outlined text-zen-moss">currency_exchange</span>
                                <p className="font-serif text-3xl mt-3">{trip?.exchange_rate ?? '—'}</p>
                                <p className="text-xs text-zen-text-light mt-1">TWD : {trip?.currency || '—'}</p>
                            </div>
                        </div>
                        <div className="px-5">
                            <h2 className="text-lg font-medium mb-4">每日重點</h2>
                            <div className="relative pl-4 border-l border-zen-rock space-y-6 ml-2">
                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-cta"></div>
                                    <div className="bg-white rounded-[1.25rem] border border-zen-rock p-5">
                                        <p className="text-xs tracking-widest text-cta mb-2">DAY 1</p>
                                        <h3 className="text-base font-medium mb-1">機場接送與換匯</h3>
                                        <p className="text-sm text-zen-text-light leading-relaxed">入境後確認接送集合點，先換少量當地貨幣。</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PreparationScreen;
