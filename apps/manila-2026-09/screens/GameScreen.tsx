import React, { useEffect, useRef, useState } from 'react';
import { useSession, useTrip } from '../context/AppState';
import { SupabaseService } from '../services/SupabaseService';
import { travelerPhotoSrc } from '../lib/travelerPhoto';
import { compressImageFile } from '../lib/compressImage';
import { hasPlayedLottery, markPlayedLottery } from '../lib/guestLottery';
import { GameDrawReveal } from '../components/GameDrawReveal';
import { GameGuessPicker } from '../components/GameGuessPicker';
import { GameLotteryBridge } from '../components/GameLotteryBridge';
import { DevilPhotoRail } from '../components/DevilPhotoRail';
import { GameRevealBoard } from '../components/GameRevealBoard';
import type { Traveler } from '../types';

type Draw = {
    drawer_id: string;
    angel_id: string;
    devil_id: string;
    angel_name: string;
    devil_name: string;
    angel_photo: string | null;
    devil_photo: string | null;
};

export const GameScreen: React.FC = () => {
    const { trip, gameClaim, isGuest, markLotteryPlayed, refreshClaim } = useTrip();
    const { user } = useSession();
    const tripId = trip?.id || '';
    const userId = user?.id || '';
    const fileRef = useRef<HTMLInputElement>(null);

    const [travelers, setTravelers] = useState<Traveler[]>([]);
    const [claimId, setClaimId] = useState<string | null>(null);
    const [lotteryPlayed, setLotteryPlayed] = useState<boolean | null>(() => {
        try {
            const tripId0 = trip?.id || '';
            const userId0 = user?.id || '';
            return hasPlayedLottery(tripId0, userId0) ? true : null;
        } catch {
            return null;
        }
    });
    const [draw, setDraw] = useState<Draw | null>(null);
    const [wishes, setWishes] = useState<Record<string, string>>({});
    const [wishDraft, setWishDraft] = useState('');
    const [photos, setPhotos] = useState<{ id: string; target_id: string; url: string }[]>([]);
    const [guessAngel, setGuessAngel] = useState('');
    const [guessDevil, setGuessDevil] = useState('');
    const [revealed, setRevealed] = useState(false);
    const [revealAt, setRevealAt] = useState('');
    const [board, setBoard] = useState<Awaited<ReturnType<typeof SupabaseService.getAllGameDraws>>>([]);
    const [msg, setMsg] = useState('');
    const [busy, setBusy] = useState(false);
    const [mode, setMode] = useState<'angel' | 'devil'>(() => {
        try {
            return sessionStorage.getItem('zentravel-game-tab') === 'devil' ? 'devil' : 'angel';
        } catch {
            return 'angel';
        }
    });

    const pool = travelers.filter((t) => t.display_name !== 'Haru');

    useEffect(() => {
        if (!tripId) return;
        SupabaseService.getTravelers(tripId)
            .then(setTravelers)
            .catch((err) => {
                console.error(err);
                setTravelers([]);
            });
    }, [tripId]);

    const guestDraw = (): Draw | null => {
        if (!gameClaim) return null;
        return {
            drawer_id: gameClaim.traveler_id,
            angel_id: gameClaim.traveler_id,
            devil_id: gameClaim.traveler_id,
            angel_name: gameClaim.display_name,
            devil_name: gameClaim.display_name,
            angel_photo: gameClaim.photo_url,
            devil_photo: gameClaim.photo_url,
        };
    };

    const loadClaimGate = async () => {
        if (!tripId || !userId) return;
        const claim = await SupabaseService.getMyGameClaim(tripId);
        setClaimId(claim?.traveler_id || gameClaim?.traveler_id || null);
        const played = !!(claim?.lottery_played_at) || hasPlayedLottery(tripId, userId);
        setLotteryPlayed(played);
        if (played) markLotteryPlayed();
    };

    const reloadPlay = async () => {
        if (!tripId || !userId) return;
        if (isGuest) {
            const [people, wishRows, info] = await Promise.all([
                SupabaseService.getTravelers(tripId),
                SupabaseService.getGameWishes(tripId),
                SupabaseService.getGameRevealInfo(tripId),
            ]);
            setTravelers(people);
            setDraw(guestDraw());
            setWishes(Object.fromEntries(wishRows.map((w) => [w.traveler_id, w.body])));
            setGuessAngel('');
            setGuessDevil('');
            setRevealed(info.revealed);
            setRevealAt(info.reveal_at);
            if (info.revealed) {
                setBoard(await SupabaseService.getAllGameDraws(tripId));
            }
            return;
        }
        const [people, myDraw, wishRows, guess, info] = await Promise.all([
            SupabaseService.getTravelers(tripId),
            SupabaseService.getMyGameDraw(tripId),
            SupabaseService.getGameWishes(tripId),
            SupabaseService.getMyGuess(tripId, userId),
            SupabaseService.getGameRevealInfo(tripId),
        ]);
        setTravelers(people);
        setDraw(myDraw);
        setWishes(Object.fromEntries(wishRows.map((w) => [w.traveler_id, w.body])));
        setGuessAngel(guess?.guessed_angel_id || '');
        setGuessDevil(guess?.guessed_devil_id || '');
        setRevealed(info.revealed);
        setRevealAt(info.reveal_at);
        if (info.revealed) {
            setBoard(await SupabaseService.getAllGameDraws(tripId));
        }
    };

    const loadDevilPhotos = async (devilId?: string) => {
        if (!tripId) return;
        const photoRows = await SupabaseService.getDevilPhotos(tripId, isGuest ? undefined : devilId);
        const signed = await Promise.all(
            photoRows.map(async (p) => ({
                id: p.id,
                target_id: p.target_id,
                url: await SupabaseService.signedGamePhoto(p.storage_path),
            }))
        );
        setPhotos(signed);
    };

    useEffect(() => {
        try {
            sessionStorage.setItem('zentravel-game-tab', mode);
        } catch {
            /* ignore */
        }
    }, [mode]);

    useEffect(() => {
        loadClaimGate().catch((err) => setMsg(err.message));
    }, [tripId, userId, isGuest]);

    useEffect(() => {
        if (!lotteryPlayed) return;
        reloadPlay().catch((err) => setMsg(err.message));
    }, [lotteryPlayed, tripId, userId]);

    useEffect(() => {
        if (!lotteryPlayed || mode !== 'devil') return;
        if (!isGuest && !draw?.devil_id) return;
        loadDevilPhotos(draw?.devil_id).catch((err) => setMsg(err.message));
    }, [lotteryPlayed, mode, tripId, draw?.devil_id, isGuest]);

    const finishLottery = async () => {
        setBusy(true);
        setMsg('');
        try {
            if (isGuest) {
                markPlayedLottery(tripId, userId);
                markLotteryPlayed();
                return guestDraw();
            }
            await SupabaseService.finishGameLottery(tripId);
            markPlayedLottery(tripId, userId);
            markLotteryPlayed();
            void refreshClaim();
            return await SupabaseService.getMyGameDraw(tripId);
        } catch (err: any) {
            setMsg(err.message || '抽籤失敗');
            throw err;
        } finally {
            setBusy(false);
        }
    };

    const saveWish = async () => {
        if (isGuest) {
            setMsg('訪客唯讀');
            return;
        }
        if (!claimId || !wishDraft.trim()) return;
        setBusy(true);
        try {
            await SupabaseService.addGameWish(tripId, claimId, wishDraft.trim());
            setWishDraft('');
            await reloadPlay();
        } catch (err: any) {
            setMsg(/duplicate/i.test(err.message) ? '已經填過，不能改' : err.message);
        } finally {
            setBusy(false);
        }
    };

    const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isGuest) {
            setMsg('訪客唯讀，不能上傳');
            e.target.value = '';
            return;
        }
        const files = Array.from<File>(e.currentTarget.files ?? []);
        e.target.value = '';
        if (!files.length || !userId) return;
        setMode('devil');
        setBusy(true);
        setMsg('');
        try {
            for (const file of files) {
                const blob = await compressImageFile(file);
                await SupabaseService.uploadDevilPhoto(tripId, userId, blob);
            }
            if (draw?.devil_id) await loadDevilPhotos(draw.devil_id);
        } catch (err: any) {
            setMsg(err.message || '上傳失敗');
        } finally {
            setBusy(false);
        }
    };

    const pickGuess = async (role: 'angel' | 'devil', id: string) => {
        if (isGuest) {
            setMsg('訪客唯讀，不能猜人');
            return;
        }
        const nextAngel = role === 'angel' ? id : guessAngel || null;
        const nextDevil = role === 'devil' ? id : guessDevil || null;
        if (role === 'angel') setGuessAngel(id);
        else setGuessDevil(id);
        try {
            await SupabaseService.saveGuess(tripId, userId, nextAngel, nextDevil);
        } catch (err: any) {
            setMsg(err.message);
        }
    };

    const nameOf = (id: string) => pool.find((t) => t.id === id)?.display_name || '';

    if (lotteryPlayed === null) {
        return <div className="h-full flex items-center justify-center text-sm text-zen-text-light">載入中…</div>;
    }

    if (!lotteryPlayed) {
        return (
            <div className="relative h-full">
                <GameLotteryBridge
                    busy={busy}
                    error={msg}
                    onFinished={finishLottery}
                    onEnterGame={() => {
                        markPlayedLottery(tripId, userId);
                        markLotteryPlayed();
                        setLotteryPlayed(true);
                    }}
                    travelers={travelers}
                />
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto px-5 pt-6 pb-28">
            <p className="text-[10px] tracking-[0.3em] text-cta uppercase">任務</p>
            <h1 className="font-serif text-3xl mt-1">天使與惡魔</h1>
            <div className="mt-4 flex p-1 rounded-full bg-zen-rock/30">
                <button
                    type="button"
                    onClick={() => setMode('angel')}
                    className={`flex-1 py-2 rounded-full text-sm font-bold ${mode === 'angel' ? 'bg-white text-zen-moss' : 'text-zen-text-light'}`}
                >
                    天使
                </button>
                <button
                    type="button"
                    onClick={() => setMode('devil')}
                    className={`flex-1 py-2 rounded-full text-sm font-bold ${mode === 'devil' ? 'bg-white text-zen-moss' : 'text-zen-text-light'}`}
                >
                    惡魔
                </button>
            </div>
            {msg && <p className="mt-2 text-sm text-cta">{msg}</p>}

            <section className="mt-5">
                {draw && (
                    <GameDrawReveal
                        role={mode}
                        name={mode === 'angel' ? draw.angel_name : draw.devil_name}
                        photo={mode === 'angel' ? draw.angel_photo : draw.devil_photo}
                    />
                )}
                {draw && mode === 'angel' && (
                    <p className="mt-3 text-sm">
                        <span className="text-cta font-bold">天使任務：</span>
                        {isGuest
                            ? '這是訪客體驗：天使與惡魔都是你自己的訪客頭像。看願望牆就好，不用送禮。'
                            : `你抽到 ${draw.angel_name}。看願望牆，不經意提供對方想要或想吃的東西，且不能被發現你是小天使。`}
                    </p>
                )}
                {draw && mode === 'devil' && (
                    <p className="mt-3 text-sm">
                        <span className="text-cta font-bold">惡魔任務：</span>
                        {isGuest
                            ? '這是訪客體驗：你可以看醜照牆，但不能上傳或參加正式配對。'
                            : `你抽到 ${draw.devil_name}。在不被發現的情況下偷拍醜照並上傳；這面牆只放 ${draw.devil_name} 的照片。`}
                    </p>
                )}
            </section>

            {mode === 'angel' && (
            <section className="mt-8">
                <h2 className="font-serif text-2xl">天使 · 願望牆</h2>
                <p className="text-xs text-zen-text-light mt-1">
                    {isGuest ? '訪客可看牆，不能填願望或猜人。' : '點別人的頭像猜你的天使（只自己看得到）。每人填一次願望，填完不能改。'}
                </p>
                <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-8">
                    {pool.map((person) => {
                        const isMe = person.id === claimId;
                        const guessed = guessAngel === person.id;
                        const stamp = (
                            <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                                <span className="-rotate-[22deg] rounded-sm border-[3px] border-cta px-1.5 py-0.5 font-black text-[11px] tracking-widest text-cta shadow-[2px_2px_0_rgba(234,88,12,0.25)] bg-white/40">
                                    我的天使
                                </span>
                            </span>
                        );
                        const avatar = (
                            <span className="relative flex h-24 w-24 items-end justify-center">
                                {person.photo_url ? (
                                    <img
                                        src={travelerPhotoSrc(person.photo_url)}
                                        alt=""
                                        className="h-24 w-auto object-contain bg-transparent"
                                    />
                                ) : (
                                    <span className="font-serif text-3xl">{person.display_name.slice(0, 1)}</span>
                                )}
                                {guessed && stamp}
                            </span>
                        );
                        return (
                        <article key={person.id} className="flex flex-col items-center">
                            <div className="w-full min-h-[4.5rem] flex flex-col items-center justify-end mb-1">
                                {wishes[person.id] ? (
                                    <div className="relative bg-white border border-zen-rock rounded-2xl px-2.5 py-1.5 text-[11px] leading-snug text-center max-w-full">
                                        {wishes[person.id]}
                                        <span className="pointer-events-none absolute left-1/2 -bottom-[6px] h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-white border-b border-r border-zen-rock" />
                                    </div>
                                ) : isMe && !isGuest ? (
                                    <div className="w-full" onClick={(e) => e.stopPropagation()}>
                                        <textarea
                                            value={wishDraft}
                                            onChange={(e) => setWishDraft(e.target.value)}
                                            className="w-full rounded-2xl border border-zen-rock bg-white px-2 py-1.5 text-[11px] min-h-[56px] outline-none text-center placeholder:text-center"
                                            placeholder="想吃的、想要的…"
                                        />
                                        <button
                                            type="button"
                                            disabled={busy || !wishDraft.trim()}
                                            onClick={saveWish}
                                            className="mt-1 w-full text-[11px] font-bold text-cta text-center"
                                        >
                                            送出並鎖定
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-zen-text-light">還沒填</p>
                                )}
                            </div>
                            {isMe || isGuest ? (
                                avatar
                            ) : (
                                <button
                                    type="button"
                                    aria-label={`猜 ${person.display_name} 是我的天使`}
                                    onClick={() => void pickGuess('angel', person.id)}
                                    className="group cursor-pointer transition-transform duration-150 hover:scale-105"
                                >
                                    {avatar}
                                </button>
                            )}
                            <p className="font-serif text-sm mt-1">{person.display_name}</p>
                        </article>
                        );
                    })}
                </div>
            </section>
            )}

            {mode === 'devil' && (
            <section className="mt-8">
                <h2 className="font-serif text-2xl">惡魔 · 醜照牆</h2>
                {draw && !isGuest && (
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => fileRef.current?.click()}
                        className="mt-2 px-4 py-2 rounded-full bg-zen-moss text-white text-sm font-bold"
                    >
                        上傳 {draw.devil_name} 的醜照
                    </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onPhoto} />
                <div className="mt-3">
                    <DevilPhotoRail
                        photos={photos.map((p) => ({ id: p.id, url: p.url, caption: nameOf(p.target_id) }))}
                        emptyText={isGuest ? '還沒有醜照' : (draw ? `還沒有 ${draw.devil_name} 的醜照` : '還沒有醜照')}
                    />
                </div>
            </section>
            )}

            {mode === 'devil' && !isGuest && (
            <section className="mt-8">
                <h2 className="font-serif text-2xl">猜我的惡魔</h2>
                <p className="text-xs text-zen-text-light mt-1">點頭像標記，只自己看得到。點了就存好。</p>
                <GameGuessPicker
                    role="devil"
                    selectedId={guessDevil}
                    people={pool.filter((t) => t.id !== claimId)}
                    onSelect={(id) => void pickGuess('devil', id)}
                />
            </section>
            )}

            <section className="mt-8 mb-6">
                <p className="text-[10px] tracking-[0.3em] text-cta uppercase">揭曉</p>
                <h2 className="font-serif text-2xl mt-1">天使與惡魔</h2>
                {revealed ? (
                    <>
                        <p className="text-xs text-zen-text-light mt-1">最後一天中午 12:00，全團配對一次打開。</p>
                        <GameRevealBoard
                            rows={board}
                            myTravelerId={claimId}
                            guessAngel={guessAngel}
                            guessDevil={guessDevil}
                        />
                    </>
                ) : (
                    <p className="text-sm text-zen-text-light mt-2">
                        完整配對在行程最後一天中午 12:00（宿霧時間）公布
                        {revealAt ? ` · ${new Date(revealAt).toLocaleString('zh-TW')}` : ''}
                    </p>
                )}
            </section>
        </div>
    );
};

export default GameScreen;
