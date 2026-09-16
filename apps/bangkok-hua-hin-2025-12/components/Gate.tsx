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
                    .from('thaiwomao_users')
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
            <div className="h-screen flex items-center justify-center bg-zen-bg text-zen-text">
                載入中…
            </div>
        );
    }

    if (!user || !enrolled) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-6 bg-zen-bg px-8">
                <div className="text-center">
                    <h1 className="text-2xl font-medium tracking-widest text-zen-text">泰沃毛</h1>
                    <p className="mt-2 text-sm text-zen-text-light">
                        {mode === 'login'
                            ? '用本 App 註冊過的信箱登入，再輸入團碼。'
                            : '註冊只會加入本行程 App，不會沿用其他系統的名單。'}
                    </p>
                </div>
                <form onSubmit={submitAuth} className="w-full max-w-xs flex flex-col gap-3">
                    <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="信箱"
                        required
                        className="rounded-2xl border border-zen-rock bg-white px-4 py-3 text-sm"
                    />
                    <input
                        type="password"
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="密碼"
                        required
                        className="rounded-2xl border border-zen-rock bg-white px-4 py-3 text-sm"
                    />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {hint && <p className="text-sm text-zen-moss">{hint}</p>}
                    <button
                        disabled={busy}
                        className="rounded-full bg-zen-moss text-white py-3 text-sm tracking-widest"
                    >
                        {busy ? '請稍候…' : mode === 'login' ? '登入' : '註冊'}
                    </button>
                </form>
                <button
                    type="button"
                    className="text-xs text-zen-text-light"
                    onClick={() => {
                        setMode(mode === 'login' ? 'register' : 'login');
                        setError('');
                        setHint('');
                    }}
                >
                    {mode === 'login' ? '還沒有本 App 帳號？註冊' : '已在本 App 註冊？登入'}
                </button>
            </div>
        );
    }

    if (!trip) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 bg-zen-bg px-8">
                <h1 className="text-xl tracking-widest text-zen-text">加入行程</h1>
                <p className="text-sm text-zen-text-light text-center">
                    {trips.length === 0 ? '你還沒有這團行程。請輸入團碼 BKK512。' : '請輸入團碼加入曼谷／華欣行程。'}
                </p>
                <form onSubmit={join} className="w-full max-w-xs flex flex-col gap-3">
                    <input
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="團碼 BKK512"
                        className="rounded-2xl border border-zen-rock bg-white px-4 py-3 text-center tracking-[0.3em]"
                    />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <button disabled={busy || !code} className="rounded-full bg-zen-moss text-white py-3 text-sm">
                        加入
                    </button>
                </form>
                <button
                    className="text-xs text-zen-text-light mt-6"
                    onClick={() => supabase.auth.signOut()}
                >
                    登出
                </button>
            </div>
        );
    }

    return <>{children}</>;
}
