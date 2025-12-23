import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SupabaseService } from '../services/SupabaseService';
import { ExpenseItem, Budget } from '../types';

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

    // User ID initialization
    const [myUserId] = useState(() => {
        let id = localStorage.getItem('zen_user_id');
        if (!id) {
            id = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('zen_user_id', id);
        }
        return id;
    });

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
    const loadRecords = async () => {
        setIsLoading(true);
        const data = await SupabaseService.getBudgetRecords(myUserId);
        const budgetData = await SupabaseService.getBudgets(myUserId);

        setRecords(data);

        // Parse budgets
        const bgt = { public: 0, self: 0 };
        budgetData.forEach(b => {
            if (b.budget_type === 'public') bgt.public = b.amount;
            if (b.budget_type === 'self') bgt.self = b.amount;
        });
        setBudgets(bgt);

        setIsLoading(false);
    };

    useEffect(() => {
        loadRecords();
    }, []);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newRecord, setNewRecord] = useState({
        title: '',
        amount: '',
        currency: 'THB',
        payment_type: 'public',
        category: 'food',
        location: '',
        date: '',
        time: ''
    });

    // Load Itinerary for Location Select (Remains Local for now as it's static-ish)
    const [itineraryLocations, setItineraryLocations] = useState<any[]>([]);
    useEffect(() => {
        try {
            const savedItinerary = localStorage.getItem('zen_full_itinerary_v1');
            if (savedItinerary) {
                const parsed = JSON.parse(savedItinerary);
                let allItems: any[] = [];
                Object.keys(parsed).forEach(dayKey => {
                    if (parsed[dayKey] && Array.isArray(parsed[dayKey].items)) {
                        const items = parsed[dayKey].items.map((item: any) => ({
                            id: item.id,
                            title: item.title,
                            location: item.location,
                            dayKey: dayKey
                        }));
                        allItems = [...allItems, ...items];
                    }
                });
                setItineraryLocations(allItems);
            }
        } catch (e) {
            console.error("Failed to load itinerary for budget", e);
        }
    }, []);

    const handleAddClick = () => {
        setEditingId(null);
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        // Determine date based on selectedDay
        let defaultDate = '2024-12-27'; // Default D1
        if (selectedDay === 'D2') defaultDate = '2024-12-28';
        if (selectedDay === 'D3') defaultDate = '2024-12-29';
        if (selectedDay === 'D4') defaultDate = '2024-12-30';
        if (selectedDay === 'D5') defaultDate = '2024-12-31';
        if (selectedDay === 'All') {
            const today = now.toISOString().split('T')[0];
            if (today >= '2024-12-27' && today <= '2024-12-31') {
                defaultDate = today;
            }
        }

        setNewRecord({
            title: '',
            amount: '',
            currency: 'THB',
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

        if (editingId !== null) {
            recordData.id = editingId;
            const success = await SupabaseService.updateRecord('budget_records', editingId.toString(), recordData);
            if (success) {
                setRecords(records.map((r: any) => r.id === editingId ? { ...r, ...recordData } : r));
            }
        } else {
            recordData.id = 'rec_' + Date.now();
            const success = await SupabaseService.addRecord('budget_records', recordData);
            if (success) {
                setRecords([recordData, ...records]);
            }
        }
        setIsAddModalOpen(false);
    };

    const handleSaveBudget = async () => {
        const amount = Number(editBudgetAmount);
        if (isNaN(amount)) return;

        const success = await SupabaseService.syncBudget('bgt_' + editBudgetType + '_' + myUserId, editBudgetType, myUserId, amount);
        if (success) {
            setBudgets(prev => ({ ...prev, [editBudgetType]: amount }));
        }
        setIsBudgetModalOpen(false);
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
            case 'transport': return 'text-orange-400 bg-orange-50';
            case 'shopping': return 'text-purple-400 bg-purple-50';
            case 'entertainment': return 'text-blue-400 bg-blue-50';
            default: return 'text-gray-400 bg-gray-50';
        }
    };

    // Filter records
    const filteredRecords = records.filter((r: any) => {
        // First filter by day
        let dayMatch = false;
        if (selectedDay === 'All') dayMatch = true;
        else if (selectedDay === 'Pre') dayMatch = r.date < '2024-12-27';
        else {
            let targetDate = '2024-12-27';
            if (selectedDay === 'D2') targetDate = '2024-12-28';
            if (selectedDay === 'D3') targetDate = '2024-12-29';
            if (selectedDay === 'D4') targetDate = '2024-12-30';
            if (selectedDay === 'D5') targetDate = '2024-12-31';
            dayMatch = r.date === targetDate;
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

    const getCurrencySymbol = (curr: string) => {
        if (curr === 'TWD') return 'NT$';
        if (curr === 'USD') return '$';
        return '฿';
    };

    return (
        <div className="h-full flex flex-col bg-zen-mist overflow-hidden font-display">
            {/* Header (Sticky) */}
            <header className="shrink-0 w-full z-20 flex items-center justify-between px-6 pt-6 pb-2 bg-zen-mist">
                <Link to="/" className="flex size-10 items-center justify-center rounded-full bg-white border border-zen-rock/20 shadow-sm text-zen-text transition-transform active:scale-95 active:bg-white/80">
                    <span className="material-symbols-outlined">arrow_back</span>
                </Link>
                <h1 className="text-lg font-bold tracking-widest text-zen-text/80">記帳</h1>
                <div className="size-10"></div> {/* Spacer */}
            </header>

            {/* Tab Switcher (The Image Effect) */}
            <div className="shrink-0 px-6 py-4 flex justify-center z-10 w-full overflow-hidden">
                <div className="inline-flex p-1.5 rounded-full bg-gray-200/50 backdrop-blur-sm shadow-inner w-full max-w-md justify-between overflow-x-auto no-scrollbar gap-1">
                    {['Pre', 'D1', 'D2', 'D3', 'D4', 'D5', 'All'].map((day) => {
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
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">公積金預算</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setEditBudgetType('public'); setEditBudgetAmount(budgets.public.toString()); setIsBudgetModalOpen(true); }}
                                className="size-6 rounded-full bg-white/20 flex items-center justify-center active:scale-95"
                            >
                                <span className="material-symbols-outlined text-[14px]">edit</span>
                            </button>
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-xl font-bold font-display tracking-tight">฿{publicTotal.toLocaleString()}</span>
                            <span className="text-[10px] opacity-60">/ ฿{budgets.public.toLocaleString()}</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-white/20 rounded-full mt-3 overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-500"
                                style={{ width: `${Math.min((publicTotal / (budgets.public || 1)) * 100, 100)}%` }}
                            ></div>
                        </div>
                        <div className="mt-2 text-[9px] font-medium opacity-70">
                            剩餘 ฿{(budgets.public - publicTotal).toLocaleString()}
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
                            <span className="text-xl font-bold font-display tracking-tight">฿{selfTotal.toLocaleString()}</span>
                            <span className="text-[10px] opacity-60">/ ฿{budgets.self.toLocaleString()}</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-500"
                                style={{ width: `${Math.min((selfTotal / (budgets.self || 1)) * 100, 100)}%` }}
                            ></div>
                        </div>
                        <div className="mt-2 text-[9px] font-medium opacity-70">
                            剩餘 ฿{(budgets.self - selfTotal).toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* View Mode Switcher */}
                <div className="flex bg-white/50 backdrop-blur-sm p-1 rounded-2xl border border-zen-rock/5 mb-6">
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
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="size-10 border-4 border-zen-moss/20 border-t-zen-moss rounded-full animate-spin mb-4"></div>
                            <p className="text-sm font-bold text-zen-text-light">資料同步中...</p>
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 opacity-50">
                            <span className="material-symbols-outlined text-4xl mb-2">receipt_long</span>
                            <p className="text-sm font-bold">尚無消費紀錄</p>
                        </div>
                    ) : (
                        filteredRecords.map((item: any) => (
                            <div
                                key={item.id}
                                onClick={() => handleEditClick(item)}
                                className={`group flex items-center gap-4 p-4 rounded-3xl border shadow-sm active:scale-[0.98] transition-all cursor-pointer ${item.payment_type === 'self' ? 'bg-zen-brown/5 border-zen-brown/10' : 'bg-white border-zen-rock/5'}`}
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
                    className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-zen-text text-white shadow-xl shadow-zen-text/30 transition-all active:scale-95 hover:bg-black"
                >
                    <span className="material-symbols-outlined text-[28px]">add</span>
                </button>
            </div>

            {/* Add Record Modal */}
            {
                isAddModalOpen && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
                        <div className="relative w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-2xl animate-scale-up border border-white/20">
                            <h3 className="text-xl font-bold text-zen-text mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-zen-moss">edit_square</span>
                                {editingId ? '編輯消費' : '新增消費'}
                            </h3>
                            <div className="space-y-4">
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
                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-zen-text font-bold active:bg-gray-200 transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 px-4 py-3 rounded-xl bg-zen-moss text-white font-bold shadow-lg shadow-zen-moss/30 active:scale-[0.98] transition-all"
                                >
                                    儲存
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit Budget Modal */}
            {isBudgetModalOpen && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsBudgetModalOpen(false)}></div>
                    <div className="relative w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-2xl animate-scale-up border border-white/20">
                        <h3 className="text-xl font-bold text-zen-text mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-zen-moss">account_balance_wallet</span>
                            編輯{editBudgetType === 'public' ? '公積金' : '個人'}預算
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-zen-text-light uppercase tracking-wide">預算總額 (THB)</label>
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
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setIsBudgetModalOpen(false)}
                                className="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-zen-text font-bold active:bg-gray-200 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSaveBudget}
                                className="flex-1 px-4 py-3 rounded-xl bg-zen-moss text-white font-bold shadow-lg shadow-zen-moss/30 active:scale-[0.98] transition-all"
                            >
                                儲存預算
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default MapBudgetScreen;