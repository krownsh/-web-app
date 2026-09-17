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

const MOSAIC_FACES = [
    '/travelers/meihui.png',
    '/travelers/zhihao.png',
    '/travelers/haru.png',
    '/travelers/farong.png',
    '/travelers/zichen.png',
    '/travelers/junxuan.png',
    '/travelers/weishao.png',
    '/travelers/yuxin.png',
    '/travelers/chenghong.png',
];

const WALLPAPER_COLS = 5;
const WALLPAPER_ROWS = 10;

function wallpaperStyle(row: number, col: number) {
    const brick = col % 2 === 0 ? 0 : 28;
    const y = brick + ((row * 13 + col * 17) % 36) - 14;
    const x = ((row * 11 + col * 19) % 22) - 10;
    const rot = ((row * 7 + col * 23) % 15) - 7;
    return {
        transform: `translate(${x}px, ${y}px) rotate(${rot}deg)`,
    };
}

function LoginStage({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative flex h-full min-h-0 items-center justify-center overflow-hidden bg-zen-dark px-6 page-enter">
            <div className="absolute -inset-16 grid grid-cols-5 gap-x-7 gap-y-8" aria-hidden="true">
                {Array.from({ length: WALLPAPER_ROWS * WALLPAPER_COLS }, (_, i) => {
                    const row = Math.floor(i / WALLPAPER_COLS);
                    const col = i % WALLPAPER_COLS;
                    return (
                        <img
                            key={i}
                            src={MOSAIC_FACES[i % MOSAIC_FACES.length]}
                            alt=""
                            style={wallpaperStyle(row, col)}
                            className="size-[4.5rem] justify-self-center object-contain"
                        />
                    );
                })}
            </div>
            <div className="absolute inset-0 bg-zen-dark/40" aria-hidden="true" />
            <div className="relative z-10 w-full max-w-[20rem]">{children}</div>
        </div>
    );
}

export default function Gate({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading, enrolled, enrollThisApp } = useSession();
    const { trip, loading: tripLoading, joinWithCode } = useTrip();
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
            <div className="h-full flex items-center justify-center bg-zen-dark text-zen-mist page-enter">
                <div className="flex flex-col items-center gap-3">
                    <div className="size-8 border-2 border-white/20 border-t-cta rounded-full animate-spin" />
                    <p className="text-sm">載入中…</p>
                </div>
            </div>
        );
    }

    const fieldClass =
        'w-full rounded-xl border-2 border-zen-moss/70 bg-white px-4 py-3 text-base min-h-[52px] outline-none focus:ring-2 focus:ring-cta/60 focus:border-cta';
    const ctaClass = 'btn-cta w-full rounded-xl py-3.5 text-lg font-medium min-h-[52px] cursor-pointer disabled:opacity-70';

    if (!user || !enrolled) {
        return (
            <LoginStage>
                <form
                    onSubmit={submitAuth}
                    className={`w-full rounded-2xl border border-cta/40 bg-zen-bg px-5 py-6 shadow-float ${error ? 'animate-shake' : ''}`}
                >
                    <h1 className="font-serif text-2xl text-center text-zen-moss">馬尼拉三日</h1>
                    <h2 className="mt-1 text-center text-base font-bold text-zen-text">
                        {mode === 'login' ? '用信箱登入' : '註冊加入'}
                    </h2>
                    <p className="mt-1 mb-3 text-center text-[11px] leading-snug text-zen-text-light">
                        {mode === 'login' ? '登入後再輸入團碼' : '只加入本行程 App'}
                    </p>
                    <label className="sr-only" htmlFor="gate-email">信箱</label>
                    <input
                        id="gate-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="信箱"
                        required
                        className={fieldClass}
                    />
                    <label className="sr-only" htmlFor="gate-password">密碼</label>
                    <input
                        id="gate-password"
                        type="password"
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="密碼"
                        required
                        className={`${fieldClass} mt-2`}
                    />
                    {error && <p className="mt-2 text-xs text-red-500 animate-fade-in">{error}</p>}
                    {hint && <p className="mt-2 text-xs text-zen-moss animate-fade-in">{hint}</p>}
                    <button disabled={busy} className={`${ctaClass} mt-3`}>
                        {busy ? '請稍候…' : mode === 'login' ? '登入' : '註冊'}
                    </button>
                    <button
                        type="button"
                        className="w-full mt-2 text-[11px] text-zen-text-light min-h-[36px] cursor-pointer"
                        onClick={() => {
                            setMode(mode === 'login' ? 'register' : 'login');
                            setError('');
                            setHint('');
                        }}
                    >
                        {mode === 'login' ? '還沒帳號？註冊' : '已有帳號？登入'}
                    </button>
                </form>
            </LoginStage>
        );
    }

    if (!trip) {
        return (
            <LoginStage>
                <form
                    onSubmit={join}
                    className={`w-full rounded-2xl border border-cta/40 bg-zen-bg px-5 py-6 shadow-float ${error ? 'animate-shake' : ''}`}
                >
                    <h1 className="font-serif text-2xl text-center text-zen-moss">加入行程</h1>
                    <p className="mt-1 mb-3 text-center text-[11px] text-zen-text-light">請輸入團碼</p>
                    <label className="sr-only" htmlFor="gate-code">團碼</label>
                    <input
                        id="gate-code"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="MNL927"
                        autoComplete="off"
                        className="w-full rounded-xl border-2 border-zen-moss/70 bg-white px-2 py-3 text-center font-serif text-xl tracking-[0.28em] min-h-[48px] outline-none focus:ring-2 focus:ring-cta/60"
                    />
                    {error && <p className="mt-2 text-xs text-red-500 animate-fade-in">{error}</p>}
                    <button disabled={busy || !code} className={`${ctaClass} mt-3`}>
                        {busy ? '請稍候…' : '加入'}
                    </button>
                    <button
                        type="button"
                        className="mt-2 w-full text-[11px] text-zen-moss underline min-h-[36px] cursor-pointer"
                        onClick={() => supabase.auth.signOut()}
                    >
                        登出
                    </button>
                </form>
            </LoginStage>
        );
    }

    return <div className="relative flex h-full min-h-0 flex-1 flex-col">{children}</div>;
}
