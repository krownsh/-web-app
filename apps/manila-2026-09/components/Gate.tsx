import React, { useState } from 'react';
import { supabase } from '../services/SupabaseService';
import { useSession, useTrip } from '../context/AppState';

function authMessage(message: string) {
    if (/invalid login credentials/i.test(message)) return '信箱或密碼不對';
    if (/user already registered/i.test(message)) return '這個信箱已有登入帳號。若是第一次用本 App，請再按一次註冊以加入行程名單。';
    if (/unable to validate email/i.test(message) || /invalid email/i.test(message)) {
        return '請輸入有效的信箱';
    }
    if (/email not confirmed/i.test(message)) return '請先到信箱點擊確認信，再開啟登入';
    if (/signups not allowed/i.test(message)) return '目前未開放註冊';
    return message;
}

export default function Gate({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading, enrolled, enrollThisApp } = useSession();
    const { trip, trips, loading: tripLoading, joinWithCode } = useTrip();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [hint, setHint] = useState('');
    const [busy, setBusy] = useState(false);

    const submitAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setHint('');
        setBusy(true);
        const creds = { email: email.trim(), password };
        try {
            if (mode === 'login') {
                const { data, error: err } = await supabase.auth.signInWithPassword(creds);
                if (err) {
                    setError(authMessage(err.message));
                    return;
                }
                const { data: profile } = await supabase
                    .from('zentravel_users')
                    .select('id')
                    .eq('id', data.user.id)
                    .maybeSingle();
                if (!profile) {
                    await supabase.auth.signOut();
                    setError('這個帳號還沒在本行程 App 註冊。請改按「註冊」加入，即使信箱在別的系統用過也一樣。');
                }
            } else {
                const { data: signedUp, error: signUpErr } = await supabase.auth.signUp(creds);
                if (signUpErr && /already registered|already been registered/i.test(signUpErr.message)) {
                    const { error: signInErr } = await supabase.auth.signInWithPassword(creds);
                    if (signInErr) {
                        setError(authMessage(signInErr.message));
                        return;
                    }
                    await enrollThisApp();
                    return;
                }
                if (signUpErr) {
                    setError(authMessage(signUpErr.message));
                    return;
                }
                if (!signedUp.session) {
                    setHint('帳號已建立。若專案有開信箱驗證，請先點確認信再登入。');
                    setMode('login');
                    return;
                }
                await enrollThisApp();
            }
        } catch (err: any) {
            setError(err.message || '失敗');
        } finally {
            setBusy(false);
        }
    };

    const join = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            await joinWithCode(code);
        } catch (err: any) {
            setError(err.message || '加入失敗');
        } finally {
            setBusy(false);
        }
    };

    if (authLoading || (user && enrolled && tripLoading)) {
        return (
            <div className="h-full flex items-center justify-center bg-zen-bg text-zen-text page-enter">
                <div className="flex flex-col items-center gap-3">
                    <div className="size-8 border-2 border-zen-moss/20 border-t-zen-moss rounded-full animate-spin" />
                    <p className="text-sm">載入中…</p>
                </div>
            </div>
        );
    }

    const fieldClass = "w-full rounded-xl border-2 border-zen-moss/70 bg-white px-4 py-3.5 text-sm min-h-[52px] outline-none focus:ring-2 focus:ring-cta/60 focus:border-cta";
    const ctaClass = "btn-cta w-full rounded-xl py-3.5 text-base font-medium min-h-[52px] cursor-pointer disabled:opacity-70";

    if (!user || !enrolled) {
        return (
            <div className="h-full overflow-y-auto bg-zen-bg px-6 pt-10 pb-10 page-enter">
                <h1 className="font-serif text-[2rem] text-center text-zen-text mb-5">馬尼拉三日</h1>
                <img src="/spots/intramuros.png" alt="" className="w-full h-44 object-cover rounded-[1.25rem] mb-7 shadow-mist" />
                <h2 className="text-2xl font-bold text-zen-text leading-snug">
                    {mode === 'login' ? '用信箱登入本行程' : '註冊加入本行程'}
                </h2>
                <p className="mt-2 mb-6 text-sm text-zen-text-light">
                    {mode === 'login'
                        ? '登入後再輸入團碼'
                        : '註冊只會加入本行程 App，不會沿用其他系統的名單。'}
                </p>
                <form onSubmit={submitAuth} className={`flex flex-col gap-3 ${error ? 'animate-shake' : ''}`}>
                    <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="信箱" required className={fieldClass} />
                    <input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密碼" required className={fieldClass} />
                    {error && <p className="text-sm text-red-500 animate-fade-in">{error}</p>}
                    {hint && <p className="text-sm text-zen-moss animate-fade-in">{hint}</p>}
                    <button disabled={busy} className={ctaClass}>
                        {busy ? '請稍候…' : mode === 'login' ? '登入' : '註冊'}
                    </button>
                </form>
                <button
                    type="button"
                    className="w-full mt-5 text-sm text-zen-text-light min-h-[44px] cursor-pointer"
                    onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setHint(''); }}
                >
                    {mode === 'login' ? '還沒有本 App 帳號？註冊' : '已在本 App 註冊？登入'}
                </button>
            </div>
        );
    }

    if (!trip) {
        return (
            <div className="h-full overflow-y-auto bg-zen-bg page-enter">
                <img src="/spots/intramuros.png" alt="" className="w-full h-48 object-cover" />
                <div className="px-6 pt-8 pb-10 flex flex-col items-center">
                    <h1 className="font-serif text-3xl text-zen-text">加入行程</h1>
                    <p className="mt-2 mb-8 text-sm text-zen-text-light">請輸入團碼</p>
                    <form onSubmit={join} className={`w-full flex flex-col items-center gap-5 ${error ? 'animate-shake' : ''}`}>
                        <input
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="MNL927"
                            className="w-full rounded-xl border-2 border-zen-moss/70 bg-white px-3 py-4 text-center font-serif text-2xl tracking-[0.4em] min-h-[56px] outline-none focus:ring-2 focus:ring-cta/60"
                        />
                        {error && <p className="text-sm text-red-500 animate-fade-in">{error}</p>}
                        <button disabled={busy || !code} className={ctaClass}>
                            {busy ? '請稍候…' : '加入'}
                        </button>
                    </form>
                    <button className="mt-6 text-sm text-zen-moss underline min-h-[44px] cursor-pointer" onClick={() => supabase.auth.signOut()}>
                        登出
                    </button>
                </div>
            </div>
        );
    }

    return <div className="relative flex h-full min-h-0 flex-1 flex-col">{children}</div>;
}
