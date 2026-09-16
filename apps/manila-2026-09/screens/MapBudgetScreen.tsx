import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MotionLink } from '../components/MotionLink';
import { supabase, SupabaseService } from '../services/SupabaseService';
import { ExpenseItem, Budget } from '../types';
import { useSession, useTrip } from '../context/AppState';
import { currencyMeta } from '../lib/tripDisplay';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import { BottomSheet } from '../components/ui/bottom-sheet';

const MapBudgetScreen: React.FC = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    // Default to day from URL or 'D1'
    const initialDay = queryParams.get('day') || 'D1';

    const [selectedDay, setSelectedDay] = useState(initialDay);
    const [viewMode, setViewMode] = useState<'all' | 'public' | 'self'>('public');

    // Budget State
    const [budgets, setBudgets] = useState<{ public: number; self: number }>({ public: 0, self: 0 });
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [editBudgetType, setEditBudgetType] = useState<'public' | 'self'>('public');
    const [editBudgetAmount, setEditBudgetAmount] = useState('');

    const { user } = useSession();
    const { trip, days } = useTrip();
    const myUserId = user?.id || '';
    const money = currencyMeta(trip?.currency);

    // Initial Data
    const defaultRecords = [
        { id: 1, title: '街頭小吃', time: '12:30', category: 'food', date: '2024-12-27', amount: 150 },
        { id: 2, title: '鄭王廟門票', time: '10:45', category: 'entertainment', date: '2024-12-27', amount: 100 },
        { id: 3, title: '泰式按摩', time: '13:15', category: 'entertainment', date: '2024-12-27', amount: 300 },
        { id: 4, title: '計程車 (Grab)', time: '09:00', category: 'transport', date: '2024-12-27', amount: 220 },
        { id: 5, title: '7-11 補給', time: '08:30', category: 'other', date: '2024-12-27', amount: 80 },
    ];

    const [records, setRecords] = useState<ExpenseItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load records from Google Sheets
    const loadRecords = async (silent = false) => {
        if (!trip?.id || !myUserId) return;
        if (!silent) setIsLoading(true);
        try {
            const data = await SupabaseService.getBudgetRecords(trip.id, myUserId);
            const budgetData = await SupabaseService.getBudgets(trip.id, myUserId);
            setRecords(data);
            const bgt = { public: 0, self: 0 };
            budgetData.forEach((b) => {
                if (b.budget_type === 'public') bgt.public = Number(b.amount) || 0;
                if (b.budget_type === 'self' && b.owner_id === myUserId) bgt.self = Number(b.amount) || 0;
            });
            setBudgets(bgt);
        } catch (err) {
            console.error(err);
            toast('記帳資料載入失敗');
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    useEffect(() => {
        if (trip?.id && myUserId) loadRecords();
    }, [trip?.id, myUserId]);

    useEffect(() => {
        if (!trip?.id) return;
        const channel = supabase
            .channel(`zentravel-budget-${trip.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'zentravel_budget_records', filter: `trip_id=eq.${trip.id}` },
                () => { loadRecords(true); }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'zentravel_budgets', filter: `trip_id=eq.${trip.id}` },
                () => { loadRecords(true); }
            )
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [trip?.id, myUserId]);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newRecord, setNewRecord] = useState({
        title: '',
        amount: '',
        currency: 'PHP',
        payment_type: 'public',
        category: 'food',
        location: '',
        date: '',
        time: ''
    });

    // Load Itinerary for Location Select (Remains Local for now as it's static-ish)
    const [itineraryLocations, setItineraryLocations] = useState<any[]>([]);
    useEffect(() => {
        if (!trip?.id) return;
        SupabaseService.getItinerary(trip.id).then((items) => {
            setItineraryLocations(items.map((item) => ({
                id: item.id,
                title: item.title,
                location: item.location,
                dayKey: item.day,
            })));
        }).catch(console.error);
    }, [trip?.id]);

    const handleAddClick = () => {
        setEditingId(null);
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        // Determine date based on selectedDay
        let defaultDate = days.find((d) => d.day_key === selectedDay)?.calendar_date || trip?.start_date || '';
        if (selectedDay === 'All') {
            const today = now.toISOString().split('T')[0];
            defaultDate = today;
        }

        setNewRecord({
            title: '',
            amount: '',
            currency: 'PHP',
            payment_type: 'public',
            category: 'food',
            location: '',
            date: defaultDate,
            time: currentTime
        });
        setIsAddModalOpen(true);
    };

    const handleEditClick = (record: any) => {
        setEditingId(record.id);
        setNewRecord({
            title: record.title,
            amount: record.amount.toString(),
            currency: record.currency || 'THB',
            payment_type: record.payment_type || 'public',
            category: record.category,
            location: record.location || '',
            date: record.date,
            time: record.time
        });
        setIsAddModalOpen(true);
    };

    const handleSave = async () => {
        if (!newRecord.title || !newRecord.amount) return;

        const recordData: any = {
            title: newRecord.title,
            amount: Number(newRecord.amount),
            currency: newRecord.currency,
            payment_type: newRecord.payment_type,
            category: newRecord.category,
            location: newRecord.location,
            date: newRecord.date,
            time: newRecord.time,
            owner_id: myUserId,
        };

        try {
            if (editingId !== null) {
                recordData.id = editingId;
                const success = await SupabaseService.updateRecord('zentravel_budget_records', editingId.toString(), recordData);
                if (success) {
                    setRecords(records.map((r: any) => r.id === editingId ? { ...r, ...recordData } : r));
                }
            } else {
                const success = await SupabaseService.addRecord('zentravel_budget_records', { ...recordData, trip_id: trip!.id, owner_id: myUserId });
                if (success) {
                    setRecords([success[0], ...records]);
                }
            }
            setIsAddModalOpen(false);
            toast('已儲存');
        } catch (err) {
            console.error(err);
            toast('儲存失敗');
        }
    };

    const handleSaveBudget = async () => {
        const amount = Number(editBudgetAmount);
        if (isNaN(amount)) return;

        try {
            const success = await SupabaseService.syncBudget(trip!.id, editBudgetType, myUserId, amount);
            if (!success || success.length === 0) {
                toast('預算更新失敗');
                return;
            }
            setBudgets(prev => ({ ...prev, [editBudgetType]: amount }));
            setIsBudgetModalOpen(false);
            toast(editBudgetType === 'public' ? '公積金預算已同步給全員' : '個人預算已更新');
            await loadRecords(true);
        } catch (err) {
            console.error(err);
            toast('預算更新失敗');
        }
    };

    // Helpers for display
    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'food': return 'restaurant';
            case 'transport': return 'local_taxi';
            case 'shopping': return 'shopping_bag';
            case 'entertainment': return 'local_activity';
            default: return 'payments';
        }
    };

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'food': return 'text-zen-moss bg-zen-mist';
            case 'transport': return 'text-cta bg-cta/10';
            case 'shopping': return 'text-cta bg-cta/10';
            case 'entertainment': return 'text-zen-moss bg-zen-mist';
            default: return 'text-zen-text-light bg-zen-mist';
        }
    };

    // Filter records
    const filteredRecords = records.filter((r: any) => {
        // First filter by day
        let dayMatch = false;
        if (selectedDay === 'All') dayMatch = true;
        else if (selectedDay === 'Pre') dayMatch = trip?.start_date ? r.date < trip.start_date : false;
        else {
            const targetDate = days.find((d) => d.day_key === selectedDay)?.calendar_date;
            dayMatch = !!targetDate && r.date === targetDate;
        }

        if (!dayMatch) return false;

        // Then filter by viewMode/privacy
        if (viewMode === 'public') return r.payment_type === 'public';
        if (viewMode === 'self') return r.payment_type === 'self' && r.owner_id === myUserId;

        // Mode 'all': show public + my personal
        return r.payment_type === 'public' || r.owner_id === myUserId;
    });

    const publicTotal = records.filter((r: any) => r.payment_type === 'public').reduce((sum: number, r: any) => sum + Number(r.amount), 0);
    const selfTotal = records.filter((r: any) => r.payment_type === 'self' && r.owner_id === myUserId).reduce((sum: number, r: any) => sum + Number(r.amount), 0);
    const currentTotal = filteredRecords.reduce((sum: number, r: any) => sum + Number(r.amount), 0);

    const getCurrencySymbol = (curr: string) => currencyMeta(curr).symbol;

    return (
        <div className="h-full flex flex-col bg-zen-mist overflow-hidden font-display page-enter">
            {/* Header (Sticky) */}
            <header className="shrink-0 w-full z-20 flex items-center justify-between px-6 pt-6 pb-2 bg-zen-mist">
                <MotionLink to="/" className="flex size-10 items-center justify-center rounded-full bg-white border border-zen-rock text-zen-text">
                    <span className="material-symbols-outlined">arrow_back</span>
                </MotionLink>
                <h1 className="text-lg font-bold tracking-widest text-zen-text/80">記帳</h1>
                <div className="size-10"></div> {/* Spacer */}
            </header>

            {/* Tab Switcher (The Image Effect) */}
            <div className="shrink-0 px-6 py-4 flex justify-center z-10 w-full overflow-hidden">
                <div className="inline-flex p-1.5 rounded-full bg-zen-rock/40 w-full max-w-md justify-between overflow-x-auto no-scrollbar gap-1">
                    {['Pre', ...days.map((d) => d.day_key), 'All'].map((day) => {
                        const label = day === 'All' ? '全行程' : (day === 'Pre' ? '行前' : day);
                        const isSelected = selectedDay === day || (day === 'All' && selectedDay === 'All Trip');

                        return (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap ${isSelected
                                    ? 'bg-white text-zen-moss shadow-sm scale-100'
                                    : 'text-zen-text-light hover:text-zen-text'
                                    }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Full Screen List Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-24">

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {/* Public Budget Card */}
                    <div
                        className={`p-5 rounded-3xl flex flex-col gap-1 relative overflow-hidden transition-all duration-300 shadow-lg cursor-pointer ${viewMode === 'public' ? 'bg-zen-moss text-white scale-100 shadow-zen-moss/20' : 'bg-white border border-zen-rock/10 text-zen-text scale-[0.98] opacity-80'}`}
                        onClick={() => setViewMode('public')}
                    >
                        <div className="absolute -right-4 -top-4 size-24 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">公積金預算（全員共用）</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setEditBudgetType('public'); setEditBudgetAmount(budgets.public.toString()); setIsBudgetModalOpen(true); }}
                                className="size-6 rounded-full bg-white/20 flex items-center justify-center active:scale-95"
                            >
                                <span className="material-symbols-outlined text-[14px]">edit</span>
                            </button>
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-xl font-bold font-display tracking-tight tabular-nums">{money.symbol}{publicTotal.toLocaleString()}</span>
                            <span className="text-[10px] opacity-60">/ {money.symbol}{budgets.public.toLocaleString()}</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-white/20 rounded-full mt-3 overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-500"
                                style={{ width: `${Math.min((publicTotal / (budgets.public || 1)) * 100, 100)}%` }}
                            ></div>
                        </div>
                        <div className="mt-2 text-[9px] font-medium opacity-70">
                            剩餘 {money.symbol}{(budgets.public - publicTotal).toLocaleString()}
                        </div>
                    </div>

                    {/* Personal Budget Card */}
                    <div
                        className={`p-5 rounded-3xl flex flex-col gap-1 relative overflow-hidden transition-all duration-300 shadow-lg cursor-pointer ${viewMode === 'self' ? 'bg-zen-brown text-white scale-100 shadow-zen-brown/20' : 'bg-white border border-zen-rock/10 text-zen-text scale-[0.98] opacity-80'}`}
                        onClick={() => setViewMode('self')}
                    >
                        <div className="absolute -right-4 -top-4 size-24 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">我的預算</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setEditBudgetType('self'); setEditBudgetAmount(budgets.self.toString()); setIsBudgetModalOpen(true); }}
                                className="size-6 rounded-full bg-white/10 flex items-center justify-center active:scale-95"
                            >
                                <span className="material-symbols-outlined text-[14px]">edit</span>
                            </button>
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-xl font-bold font-display tracking-tight tabular-nums">{money.symbol}{selfTotal.toLocaleString()}</span>
                            <span className="text-[10px] opacity-60">/ {money.symbol}{budgets.self.toLocaleString()}</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-500"
                                style={{ width: `${Math.min((selfTotal / (budgets.self || 1)) * 100, 100)}%` }}
                            ></div>
                        </div>
                        <div className="mt-2 text-[9px] font-medium opacity-70">
                            剩餘 {money.symbol}{(budgets.self - selfTotal).toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* View Mode Switcher */}
                <div className="flex bg-white p-1 rounded-2xl border border-zen-rock mb-6">
                    {(['all', 'public', 'self'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${viewMode === mode
                                ? 'bg-white text-zen-text shadow-sm'
                                : 'text-zen-text-light hover:text-zen-text'
                                }`}
                        >
                            {mode === 'all' ? '全部' : mode === 'public' ? '公積金' : '個人'}
                        </button>
                    ))}
                </div>

                {/* Spending List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-lg font-bold text-zen-text tracking-wide">
                            {viewMode === 'all' ? '全部花費' : viewMode === 'public' ? '公積金支出' : '我的個人支出'}
                        </h3>
                        <div className="text-xs font-bold text-zen-text-light">{selectedDay === 'All' ? '所有紀錄' : (selectedDay === 'Pre' ? '行前準備' : selectedDay)}</div>
                    </div>

                    {/* List Content */}
                    {isLoading ? (
                        <div className="flex flex-col gap-3 py-6">
                            <Skeleton className="h-16 w-full rounded-3xl" />
                            <Skeleton className="h-16 w-full rounded-3xl" />
                            <Skeleton className="h-16 w-full rounded-3xl" />
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 opacity-50">
                            <span className="material-symbols-outlined text-4xl mb-2">receipt_long</span>
                            <p className="text-sm font-bold">尚無消費紀錄</p>
                        </div>
                    ) : (
                        filteredRecords.map((item: any, idx: number) => (
                            <div
                                key={item.id}
                                onClick={() => handleEditClick(item)}
                                style={{ animationDelay: `${idx * 40}ms` }}
                                className={`group flex items-center gap-4 p-4 rounded-3xl border shadow-sm active:scale-[0.98] transition-all cursor-pointer animate-slide-up ${item.payment_type === 'self' ? 'bg-zen-brown/5 border-zen-brown/10' : 'bg-white border-zen-rock/5'}`}
                            >
                                <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${getCategoryColor(item.category).split(' ')[1]} ${getCategoryColor(item.category).split(' ')[0]} shadow-inner`}>
                                    <span className="material-symbols-outlined material-symbols-filled text-[24px]">{getCategoryIcon(item.category)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-bold text-zen-text truncate">{item.title}</p>
                                    <p className="text-xs font-medium text-zen-text-light mt-0.5">
                                        {item.payment_type === 'self' ? '👤 個人' : '👥 公積金'} • {item.time} • {item.date}
                                        {item.location && <span className="text-zen-moss ml-1">@{item.location}</span>}
                                    </p>
                                </div>
                                <p className="text-base font-bold text-zen-text font-display">-{getCurrencySymbol(item.currency || 'THB')}{item.amount}</p>
                            </div>
                        ))
                    )}
                </div>


            </div>

            {/* Add Button (Floating) - Moved outside scroll container */}
            <div className="fixed bottom-32 right-6 z-[900]">
                <button
                    onClick={handleAddClick}
                    className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-cta text-white shadow-float"
                >
                    <span className="material-symbols-outlined text-[28px]">add</span>
                </button>
            </div>

            {/* Add Record Modal */}
            <BottomSheet
                open={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={editingId ? '編輯消費' : '新增消費'}
            >
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="text-xs font-bold text-zen-text-light uppercase tracking-wide">項目名稱</label>
                                    <input
                                        type="text"
                                        className="w-full border-b border-zen-rock/50 py-2 bg-transparent text-lg font-bold text-zen-text focus:outline-none focus:border-zen-moss placeholder:text-gray-300"
                                        placeholder="例如：芒果糯米飯"
                                        value={newRecord.title}
                                        onChange={e => setNewRecord({ ...newRecord, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zen-text-light uppercase tracking-wide">付款人/類別</label>
                                    <div className="flex gap-2 mt-1">
                                        {(['public', 'self'] as const).map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setNewRecord({ ...newRecord, payment_type: type })}
                                                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${newRecord.payment_type === type
                                                    ? 'bg-zen-moss text-white border-zen-moss shadow-sm'
                                                    : 'bg-transparent text-zen-text-light border-zen-rock/20'
                                                    }`}
                                            >
                                                {type === 'public' ? '👥 公積金' : '👤 個人'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-zen-text-light uppercase tracking-wide">金額</label>
                                        <div className="flex items-center gap-2 border-b border-zen-rock/50">
                                            <select
                                                className="bg-transparent text-sm font-bold text-zen-text focus:outline-none"
                                                value={newRecord.currency}
                                                onChange={e => setNewRecord({ ...newRecord, currency: e.target.value })}
                                            >
                                                <option value="PHP">PHP</option>
                                                <option value="THB">THB</option>
                                                <option value="TWD">TWD</option>
                                                <option value="USD">USD</option>
                                            </select>
                                            <input
                                                type="number"
                                                className="w-full py-2 bg-transparent text-lg font-bold text-zen-text focus:outline-none placeholder:text-gray-300"
                                                placeholder="0"
                                                value={newRecord.amount}
                                                onChange={e => setNewRecord({ ...newRecord, amount: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zen-text-light uppercase tracking-wide">類別</label>
                                        <select
                                            className="w-full border-b border-zen-rock/50 py-2 bg-transparent text-lg font-bold text-zen-text focus:outline-none focus:border-zen-moss"
                                            value={newRecord.category}
                                            onChange={e => setNewRecord({ ...newRecord, category: e.target.value })}
                                        >
                                            <option value="food">餐飲</option>
                                            <option value="transport">交通</option>
                                            <option value="shopping">購物</option>
                                            <option value="entertainment">娛樂</option>
                                            <option value="other">雜支</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-zen-text-light uppercase tracking-wide">日期</label>
                                        <input
                                            type="date"
                                            className="w-full border-b border-zen-rock/50 py-2 bg-transparent text-sm font-bold text-zen-text focus:outline-none focus:border-zen-moss"
                                            value={newRecord.date}
                                            onChange={e => setNewRecord({ ...newRecord, date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zen-text-light uppercase tracking-wide">時間</label>
                                        <input
                                            type="time"
                                            className="w-full border-b border-zen-rock/50 py-2 bg-transparent text-sm font-bold text-zen-text focus:outline-none focus:border-zen-moss"
                                            value={newRecord.time}
                                            onChange={e => setNewRecord({ ...newRecord, time: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zen-text-light uppercase tracking-wide">地點 (行程)</label>
                                    <select
                                        className="w-full border-b border-zen-rock/50 py-2 bg-transparent text-lg font-bold text-zen-text focus:outline-none focus:border-zen-moss"
                                        value={newRecord.location}
                                        onChange={e => setNewRecord({ ...newRecord, location: e.target.value })}
                                    >
                                        <option value="">選擇行程地點...</option>
                                        {itineraryLocations.map((loc: any, idx) => (
                                            <option key={idx} value={loc.title}>
                                                {loc.title} {loc.location ? `(${loc.location})` : ''}
                                            </option>
                                        ))}
                                        <option value="other">其他地點</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 px-4 py-3 rounded-xl bg-zen-mist text-zen-text font-bold min-h-[44px]"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 px-4 py-3 rounded-xl btn-cta font-bold min-h-[44px]"
                                >
                                    儲存
                                </button>
                            </div>
            </BottomSheet>

            {/* Edit Budget Modal */}
            <BottomSheet
                open={isBudgetModalOpen}
                onClose={() => setIsBudgetModalOpen(false)}
                title={`編輯${editBudgetType === 'public' ? '公積金' : '個人'}預算`}
            >
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="text-xs font-bold text-zen-text-light uppercase tracking-wide">預算總額 ({money.code})</label>
                                <input
                                    type="number"
                                    className="w-full border-b border-zen-rock/50 py-2 bg-transparent text-lg font-bold text-zen-text focus:outline-none focus:border-zen-moss placeholder:text-gray-300"
                                    placeholder="0"
                                    autoFocus
                                    value={editBudgetAmount}
                                    onChange={e => setEditBudgetAmount(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => setIsBudgetModalOpen(false)}
                                className="flex-1 px-4 py-3 rounded-xl bg-zen-mist text-zen-text font-bold min-h-[44px]"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSaveBudget}
                                className="flex-1 px-4 py-3 rounded-xl btn-cta font-bold min-h-[44px]"
                            >
                                儲存預算
                            </button>
                        </div>
            </BottomSheet>
        </div >
    );
};

export default MapBudgetScreen;