import React from 'react';
import { supabase } from '../services/SupabaseService';
import { useSession, useTrip } from '../context/AppState';

export default function Gate({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading, enrolled } = useSession();
    const { trip, loading: tripLoading, refresh } = useTrip();

    if (authLoading || (user && enrolled && tripLoading)) {
        return (
            <div className="h-full flex items-center justify-center bg-zen-dark text-zen-mist page-enter">
                <div className="flex flex-col items-center gap-3">
                    <div className="size-8 border-2 border-white/20 border-t-cta rounded-full animate-spin" />
                    <p className="text-sm">載入中…</p>
                </div>
            </div>
        );
    }

    if (user && enrolled && !trip) {
        return (
            <div className="h-full flex items-center justify-center bg-zen-dark text-zen-mist page-enter">
                <div className="flex flex-col items-center gap-3 px-6 text-center">
                    {tripLoading ? (
                        <div className="size-8 border-2 border-white/20 border-t-cta rounded-full animate-spin" />
                    ) : (
                        <span className="material-symbols-outlined text-3xl text-cta">cloud_off</span>
                    )}
                    <p className="text-sm">{tripLoading ? '正在加入行程…' : '行程載入失敗'}</p>
                    <button
                        type="button"
                        className="mt-1 rounded-xl bg-cta px-4 py-2 text-sm text-zen-dark min-h-[40px] cursor-pointer"
                        onClick={() => void refresh()}
                    >
                        再試一次
                    </button>
                    <button
                        type="button"
                        className="text-[11px] text-zen-mist underline min-h-[36px] cursor-pointer"
                        onClick={() => void supabase.auth.signOut()}
                    >
                        登出
                    </button>
                </div>
            </div>
        );
    }

    return <div className="relative flex h-full min-h-0 flex-1 flex-col">{children}</div>;
}
