import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const PreparationScreen: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'pre-trip' | 'general'>('pre-trip');

    return (
        <div className="flex-1 h-full overflow-y-auto no-scrollbar bg-zen-mist bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.9)_0%,rgba(252,251,249,0)_60%)] pb-32">
            {/* Header */}
            <div className="sticky top-0 z-50 flex items-center bg-zen-mist/80 backdrop-blur-md p-6 pb-2 justify-between">
                <Link to="/" className="text-zen-text/70 flex size-10 shrink-0 items-center justify-center rounded-full active:bg-zen-rock/30 transition-all duration-500">
                    <span className="material-symbols-outlined text-2xl font-light">arrow_back</span>
                </Link>
                <h2 className="text-zen-text text-lg font-medium tracking-widest flex-1 text-center pr-10 opacity-80">
                    行前準備
                </h2>
            </div>

            {/* Tab Switcher */}
            <div className="sticky top-[70px] z-40 bg-zen-mist/85 px-6 py-4 backdrop-blur-md">
                <div className="relative flex w-full items-center justify-center pb-2">
                    <div className="absolute bottom-0 h-[1px] w-full bg-gradient-to-r from-transparent via-zen-rock to-transparent opacity-60"></div>
                    <div className="flex w-full justify-around">
                        <button
                            onClick={() => setActiveTab('pre-trip')}
                            className="group relative cursor-pointer flex-1 flex justify-center py-2 transition-all duration-500"
                        >
                            <span className={`text-base tracking-widest transition-colors duration-500 ${activeTab === 'pre-trip' ? 'text-zen-moss font-medium' : 'text-zen-text-light'}`}>行前準備</span>
                            {activeTab === 'pre-trip' && <div className="absolute -bottom-[5px] h-1.5 w-1.5 rounded-full bg-zen-moss shadow-[0_0_8px_rgba(107,124,101,0.6)]"></div>}
                        </button>
                        <button
                            onClick={() => setActiveTab('general')}
                            className="group relative cursor-pointer flex-1 flex justify-center py-2 transition-all duration-500"
                        >
                            <span className={`text-base tracking-widest transition-colors duration-500 ${activeTab === 'general' ? 'text-zen-moss font-medium' : 'text-zen-text-light'}`}>一般資訊</span>
                            {activeTab === 'general' && <div className="absolute -bottom-[5px] h-1.5 w-1.5 rounded-full bg-zen-moss shadow-[0_0_8px_rgba(107,124,101,0.6)]"></div>}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-8 pt-2">

                {/* Countdown Card */}
                <div className="px-6">
                    <div className="relative overflow-hidden rounded-pebble bg-gradient-to-br from-[#ffffff] to-[#f4f2ef] shadow-mist p-8 border border-white/60">
                        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-zen-moss/5 blur-3xl"></div>
                        <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-zen-blue/5 blur-3xl"></div>
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <p className="text-sm tracking-widest text-zen-text-light mb-1 font-light">距離曼谷之旅</p>
                            <div className="flex items-baseline gap-2 mb-6">
                                <span className="text-5xl font-light text-zen-moss tracking-tighter drop-shadow-sm">5</span>
                                <span className="text-lg font-light text-zen-text-light">天</span>
                            </div>
                            <div className="w-full">
                                <div className="flex justify-between text-xs text-zen-text-light/80 mb-2 px-1">
                                    <span>準備進度</span>
                                    <span>70%</span>
                                </div>
                                <div className="h-1.5 w-full bg-zen-rock/30 rounded-full overflow-hidden">
                                    <div className="h-full bg-zen-moss/60 w-[70%] rounded-full shadow-[0_0_10px_rgba(107,124,101,0.3)]"></div>
                                </div>
                                <p className="mt-4 text-xs text-zen-brown/80 tracking-wide font-light">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-zen-brown/60 mr-2"></span>
                                    3 項待辦事項未完成
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alert */}
                <div className="px-6">
                    <div className="flex items-center gap-2 mb-4 opacity-80">
                        <span className="h-4 w-1 rounded-full bg-zen-brown/40"></span>
                        <h2 className="text-lg font-medium text-zen-text tracking-widest">重要提醒</h2>
                    </div>
                    <div className="group relative overflow-hidden rounded-organic-sm bg-[#fcf6f0] p-6 transition-all duration-500 active:shadow-mist">
                        <div className="absolute inset-0 bg-red-50/30 pointer-events-none"></div>
                        <div className="absolute -right-4 -top-4 text-zen-brown/10">
                            <span className="material-symbols-outlined text-8xl">gpp_maybe</span>
                        </div>
                        <div className="relative z-10 flex flex-col gap-2">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-zen-brown text-lg">info</span>
                                <h3 className="text-base font-medium text-zen-text tracking-wide">簽證與入境規範</h3>
                            </div>
                            <p className="text-sm text-zen-text-light leading-relaxed font-light">
                                請確認已申請觀光簽證或備妥落地簽費用 (2200 THB + 照片)。護照需有 6 個月以上效期。
                            </p>
                            <div className="mt-2 flex justify-end">
                                <button className="text-xs tracking-widest text-zen-brown active:text-zen-moss transition-colors flex items-center gap-1 py-1 px-3 rounded-full border border-zen-brown/20 active:border-zen-moss/30 active:bg-white/50">
                                    查看詳情 <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Checklists */}
                <div className="px-6">
                    <div className="flex items-center justify-between mb-4 opacity-80">
                        <div className="flex items-center gap-2">
                            <span className="h-4 w-1 rounded-full bg-zen-moss/40"></span>
                            <h2 className="text-lg font-medium text-zen-text tracking-widest">清單檢查</h2>
                        </div>
                        <button className="text-xs text-zen-moss active:text-zen-moss-light tracking-wider transition-colors">查看全部</button>
                    </div>
                    <div className="space-y-4">
                        {[
                            { title: '泰銖兌換', desc: '建議帶台幣至當地 SuperRich 綠標/橘標換匯。', checked: true },
                            { title: '下載叫車 App', desc: 'Grab 或 Bolt，建議綁定信用卡方便付款。', checked: false, important: true },
                            { title: '準備小額紙鈔', desc: '作為小費使用，20、50、100 泰銖面額。', checked: false },
                        ].map((item, i) => (
                            <label key={i} className="group flex items-start gap-4 p-5 rounded-organic-sm bg-white/40 border border-white/60 active:bg-white/70 transition-all cursor-pointer shadow-sm active:shadow-mist">
                                <div className="pt-1">
                                    <input type="checkbox" defaultChecked={item.checked} className="h-5 w-5 rounded-full border-2 border-zen-rock text-zen-moss focus:ring-0 focus:ring-offset-0 transition-all" />
                                </div>
                                <div className="flex-1 transition-opacity duration-300 group-has-[:checked]:opacity-50">
                                    <div className="flex justify-between items-start">
                                        <p className="text-base font-medium text-zen-text group-has-[:checked]:line-through decoration-zen-text-light/50 tracking-wide">{item.title}</p>
                                        {item.important && <span className="text-[10px] tracking-widest text-zen-brown/80 border border-zen-brown/20 px-2 py-0.5 rounded-full">重要</span>}
                                    </div>
                                    <p className="text-xs text-zen-text-light mt-2 font-light leading-relaxed">{item.desc}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Daily Highlights */}
                <div className="px-6">
                    <div className="flex items-center gap-2 mb-4 opacity-80">
                        <span className="h-4 w-1 rounded-full bg-zen-blue/40"></span>
                        <h2 className="text-lg font-medium text-zen-text tracking-widest">每日重點</h2>
                    </div>
                    <div className="relative pl-4 border-l border-zen-rock space-y-8 ml-2">
                        <div className="relative">
                            <div className="absolute -left-[21px] top-0 h-3 w-3 rounded-full bg-zen-bg border-2 border-zen-moss"></div>
                            <div className="glass-panel rounded-organic-sm p-5 shadow-sm transition-transform active:scale-[1.01] duration-500">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-medium tracking-widest text-zen-moss">DAY 1 · 10/12</span>
                                    <span className="flex items-center gap-1 text-[10px] tracking-widest text-zen-text-light/70 bg-white/50 px-2 py-1 rounded-full">
                                        <span className="material-symbols-outlined text-[12px]">flight_land</span> 抵達
                                    </span>
                                </div>
                                <h3 className="text-base font-medium text-zen-text mb-2 tracking-wide">機場接送與換匯</h3>
                                <p className="text-sm text-zen-text-light font-light leading-loose">
                                    入境後前往 B1 搭乘機場快線或尋找預約的接送司機 (Gate 3-4)。可在機場先換少量泰銖。
                                </p>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute -left-[21px] top-0 h-3 w-3 rounded-full bg-zen-bg border-2 border-zen-blue"></div>
                            <div className="glass-panel rounded-organic-sm p-5 shadow-sm transition-transform active:scale-[1.01] duration-500">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-medium tracking-widest text-zen-blue">DAY 3 · 10/14</span>
                                    <span className="flex items-center gap-1 text-[10px] tracking-widest text-zen-text-light/70 bg-white/50 px-2 py-1 rounded-full">
                                        <span className="material-symbols-outlined text-[12px]">temple_buddhist</span> 禮儀
                                    </span>
                                </div>
                                <h3 className="text-base font-medium text-zen-text mb-2 tracking-wide">大皇宮參觀禮儀</h3>
                                <p className="text-sm text-zen-text-light font-light leading-loose">
                                    禁止穿無袖、短褲、短裙。請穿著透氣長褲或長裙，入殿需脫鞋。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Basic Info Cards */}
                <div className="px-6">
                    <div className="flex items-center gap-2 mb-4 opacity-80">
                        <span className="h-4 w-1 rounded-full bg-zen-text-light/40"></span>
                        <h2 className="text-lg font-medium text-zen-text tracking-widest">必備資訊</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 rounded-pebble bg-white shadow-mist p-1 overflow-hidden relative group">
                            <div className="h-32 w-full rounded-[2rem] overflow-hidden relative grayscale active:grayscale-0 transition-all duration-700">
                                <img alt="Map view" className="w-full h-full object-cover opacity-80 active:opacity-100 transition-opacity" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbF6-vod9PWCr2p_l9AOgvYguhbvc1X6Thk_hkXdIiKyiOyOaqOK-jxflV_mbYujqUTc3a8VeaM21izoxHGwElQmOe4IDzLOFDDC20pIdknqv3jShs28fWNSuOYOsGociWGiTLnO9zYGLPcdtra9x8QFXRlN0ObeHkapo5AIsHq51dz7AHECcZ3exCQjcbrha8LvIJcMZ_5Tlg-LxcnPd5PWp48Hn6wX-quusy0plsFqAvA6ZNp3g9rBcyOy_pDAf9Nj1tgwh9zN4" />
                                <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-transparent"></div>
                                <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                                    <div>
                                        <h4 className="text-sm font-medium text-zen-text tracking-wide">Grande Centre Point</h4>
                                        <p className="text-[10px] text-zen-text-light mt-0.5 truncate tracking-wider">Sukhumvit Soi 19, Bangkok</p>
                                    </div>
                                    <button className="bg-zen-bg/90 p-2 rounded-full shadow-sm text-zen-text active:text-zen-moss transition-colors">
                                        <span className="material-symbols-outlined text-lg">map</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-pebble bg-[#ebf2f5]/50 p-5 flex flex-col justify-between aspect-[1.1] active:bg-[#ebf2f5] transition-colors duration-500">
                            <div className="flex justify-between items-start">
                                <span className="material-symbols-outlined text-2xl text-zen-blue/80">partly_cloudy_day</span>
                                <span className="text-[10px] font-bold text-zen-blue/60 tracking-widest">曼谷</span>
                            </div>
                            <div>
                                <p className="text-3xl font-light text-zen-text mb-1">32°</p>
                                <p className="text-[10px] text-zen-text-light tracking-wider">午後雷陣雨</p>
                            </div>
                        </div>
                        <div className="rounded-pebble bg-[#f5f2eb]/50 p-5 flex flex-col justify-between aspect-[1.1] active:bg-[#f5f2eb] transition-colors duration-500">
                            <div className="flex justify-between items-start">
                                <span className="material-symbols-outlined text-2xl text-zen-brown/80">currency_exchange</span>
                                <span className="text-[10px] font-bold text-zen-brown/60 tracking-widest">匯率</span>
                            </div>
                            <div>
                                <p className="text-3xl font-light text-zen-text mb-1">1.12</p>
                                <p className="text-[10px] text-zen-text-light tracking-wider">TWD : THB</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Horizontal Scroll Bottom */}
                <div className="pl-6">
                    <div className="flex items-center justify-between mb-4 pr-6 opacity-80">
                        <div className="flex items-center gap-2">
                            <span className="h-4 w-1 rounded-full bg-zen-text-light/40"></span>
                            <h2 className="text-lg font-medium text-zen-text tracking-widest">必買必吃</h2>
                        </div>
                        <button className="size-8 rounded-full border border-zen-rock active:bg-zen-rock/20 flex items-center justify-center text-zen-text-light transition-all">
                            <span className="material-symbols-outlined text-lg">add</span>
                        </button>
                    </div>
                    <div className="flex gap-5 overflow-x-auto pb-6 pr-6 no-scrollbar snap-x">
                        {[
                            { name: '泰式船麵', loc: '勝利紀念碑站, 必加辣', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAqUFBx3fmn2pflD4NchSjAUUa48Is6AE8Cwq2IzDWbg8s3EwaCKQXKiAw8vHVb1oWZyeRckIfUpx3f9GLxQx6ZGX4wIHel9Z204RyZDEUunDyTo7gQvKhbcI0YlS9cLuHrHuR5_Bp8cD2uedQMbIgKCcKtSB6P9HE9RFgxmdXn4EpNUCXuPLKr_IHC8NuEvNwVeNOoRO3M4dnsaNAroTa0T9EORlMJ2fU0GQBXT-lsLOmWPJNCiwCT2RBtvWnpwL_7zFyxnjx2Kpw' },
                            { name: 'Big C 零食', loc: '小老闆海苔, 芒果乾', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkpqkPYVgeWI7rPBty007VPZvqEZri11mnUFIxZNjtCo6mRKBjbwuIZH5jOGgTD37GKbB-g1fpKzWgSvRHtiXe-C6aMidbGFdOlhugzISCNRqBpjbCwpcw3Ef1-3SR5CXdopkzFeQQ_HWFoZAX_3emXlvqFPY_WbsYt-I-9G9eCy4Iky6EOHOr7jAmvJFr-yNxGEVfS4vCWjublHM8EETfZnE4mbcc7l3pcoyqNvCNITH1FCV6jw93dua14y34RPiyWBdtLk06pSI' },
                            { name: '藥妝香氛', loc: 'Mistine, Karmakamet', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbUQ718QyJYZ_NSP_stVKxB3S1qRb3Tp-6FhWtSbi_mBEYo59TraKVwNEiueOdTwX7QsW6ZhfIsOQ5vGODf-CFVipzEXekk7pWMxv10uYItsNk_PXOKKrjsJ-85oWY8pPVnvjw6hVj90y94kEq8GK9I9Y1J1KfDZkcXfW9MQggQbrqfALzHwbbm5TCGcGu052warw_Qu2XnaBk0UZCO58wtgK4VQ5sufKOTiqDINg9PkcRUoqnbX6SGTBpWavtOsOf0wrXIUrm2s0' },
                        ].map((item, i) => (
                            <div key={i} className="snap-start shrink-0 w-36 flex flex-col gap-3 group">
                                <div className="aspect-[4/5] rounded-organic-sm overflow-hidden relative shadow-sm">
                                    <img alt={item.name} className="w-full h-full object-cover opacity-90 active:scale-105 active:opacity-100 transition-all duration-700 ease-out" src={item.img} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60"></div>
                                    <div className="absolute bottom-3 left-3 text-white">
                                        <p className="text-sm font-medium tracking-wider">{item.name}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-zen-text-light font-light pl-1">{item.loc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAB */}
                <button className="fixed bottom-28 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-[2rem] bg-zen-text text-[#fcfbf9] shadow-float active:bg-zen-moss transition-all duration-500 active:scale-105 hover:rotate-3">
                    <span className="material-symbols-outlined text-2xl font-light">edit</span>
                </button>
            </div>
        </div>
    );
};

export default PreparationScreen;