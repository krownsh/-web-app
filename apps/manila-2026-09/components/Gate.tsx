import React, { useState } from 'react';
import { supabase } from '../services/SupabaseService';
import { useSession, useTrip } from '../context/AppState';
import { displayTripTitle } from '../lib/tripDisplay';

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
    '/guests/a.png',
    '/guests/b.png',
    '/guests/c.png',
    '/guests/d.png',
];

const WALLPAPER_COLS = 6;
const WALLPAPER_ROWS = 12;

function shuffle<T>(items: T[]): T[] {
    const next = [...items];
    for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
}

function wallpaperStyle(index: number) {
    const col = index % WALLPAPER_COLS;
    const brick = col % 2 === 0 ? 0 : 20;
    const x = ((index * 47) % 33) - 16;
    const y = brick + ((index * 31) % 41) - 20;
    const rot = ((index * 19) % 29) - 14;
    return {
        transform: `translate(${x}px, ${y}px) rotate(${rot}deg)`,
    };
}

function buildMosaic() {
    const count = WALLPAPER_ROWS * WALLPAPER_COLS;
    const faces: string[] = [];
    while (faces.length < count) {
        faces.push(...shuffle(MOSAIC_FACES));
    }
    return faces.slice(0, count);
}

function LoginStage({ children }: { children: React.ReactNode }) {
    const [faces] = useState(buildMosaic);
    return (
        <div className="relative flex h-full min-h-0 items-center justify-center overflow-hidden bg-zen-dark px-6 page-enter">
            <div className="absolute -inset-14 grid grid-cols-6 gap-x-4 gap-y-5" aria-hidden="true">
                {faces.map((src, i) => (
                    <img
                        key={`${src}-${i}`}
                        src={src}
                        alt=""
                        style={wallpaperStyle(i)}
                        className="size-[4.5rem] justify-self-center object-contain"
                    />
                ))}
            </div>
            <div className="absolute inset-0 bg-zen-dark/40" aria-hidden="true" />
            <div className="relative z-10 w-full max-w-[20rem]">{children}</div>
        </div>
    );
}

export default function Gate({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading, enrolled, enrollThisApp } = useSession();
    const { trip, loading: tripLoading, refresh } = useTrip();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [hint, setHint] = useState('');
    const [busy, setBusy] = useState(false);
    const [brandTitle] = useState(() => displayTripTitle());

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
                    <h1 className="font-serif text-2xl text-center text-zen-moss">{brandTitle}</h1>
                    <h2 className="mt-1 text-center text-base font-bold text-zen-text">
                        {mode === 'login' ? '用信箱登入' : '註冊加入'}
                    </h2>
                    {/* <p className="mt-1 mb-3 text-center text-[11px] leading-snug text-zen-text-light">
                        {mode === 'login' ? '登入後再輸入團碼' : '只加入本行程 App'}
                    </p> */}
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
                        onClick={() => supabase.auth.signOut()}
                    >
                        登出
                    </button>
                </div>
            </div>
        );
    }

    return <div className="relative flex h-full min-h-0 flex-1 flex-col">{children}</div>;
}
