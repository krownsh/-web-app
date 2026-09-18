import React, { useEffect, useState } from 'react';
import { SupabaseService } from '../services/SupabaseService';
import { travelerPhotoSrc } from '../lib/travelerPhoto';

type Face = {
    id: string;
    display_name: string;
    photo_url: string | null;
    claimed: boolean;
    kind: 'traveler' | 'guest';
    badge?: string;
};

export const ClaimTravelerScreen: React.FC<{ tripId: string; onClaimed: () => void }> = ({ tripId, onClaimed }) => {
    const [faces, setFaces] = useState<Face[]>([]);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState('');

    const load = () => {
        Promise.all([
            SupabaseService.getTravelers(tripId),
            SupabaseService.getUnclaimedTravelers(tripId),
            SupabaseService.getGuestPersonas(tripId),
        ])
            .then(([people, open, personas]) => {
                const openIds = new Set(open.map((row) => row.id));
                const travelers: Face[] = people
                    .filter((person) => person.display_name !== 'Haru')
                    .map((person) => ({
                        id: person.id,
                        display_name: person.display_name,
                        photo_url: person.photo_url || null,
                        claimed: !openIds.has(person.id),
                        kind: 'traveler',
                    }));
                const guests: Face[] = personas.map((row) => ({
                    id: row.id,
                    display_name: row.display_name,
                    photo_url: row.photo_url,
                    claimed: row.taken,
                    kind: 'guest',
                    badge: row.exclusive ? '訪客' : '訪客 · 可共用',
                }));
                setFaces([...travelers, ...guests]);
            })
            .catch((err) => setError(err.message || '載入失敗'));
    };

    useEffect(() => {
        load();
    }, [tripId]);

    const pick = async (face: Face) => {
        setError('');
        setBusy(face.id);
        try {
            if (face.kind === 'guest') {
                await SupabaseService.claimGuestPersona(tripId, face.id);
            } else {
                await SupabaseService.claimTraveler(tripId, face.id);
            }
            onClaimed();
        } catch (err: any) {
            const taken = /already taken/i.test(err.message);
            setError(taken ? '這位已被選走，請再選' : err.message || '選擇失敗');
            load();
        } finally {
            setBusy(null);
        }
    };

    return (
        <div className="h-full overflow-y-auto bg-zen-dark px-5 pt-8 pb-10 text-zen-mist">
            <p className="text-[10px] tracking-[0.3em] text-cta uppercase">Secret mission</p>
            <h1 className="font-serif text-3xl mt-1 text-white">你是誰？</h1>
            <p className="text-sm text-white/70 mt-2">
                點頭像鎖定身分，選完不能改。已 check in 的人不能再選。後面幾位訪客不佔九人名單，全站唯讀；標「可共用」的可多人同時使用。
            </p>
            {error && <p className="mt-3 text-sm text-cta">{error}</p>}
            <div className="mt-6 grid grid-cols-2 gap-3">
                {faces.map((face) => (
                    <button
                        key={face.id}
                        type="button"
                        disabled={!!busy || face.claimed}
                        onClick={() => pick(face)}
                        className="rounded-2xl overflow-hidden border border-white/15 bg-zen-moss/40 p-0 disabled:opacity-100"
                    >
                        <div className="relative">
                            {face.photo_url ? (
                                <img
                                    src={travelerPhotoSrc(face.photo_url)}
                                    alt=""
                                    className="w-full h-40 object-contain bg-transparent"
                                />
                            ) : (
                                <div className="flex h-40 w-full items-center justify-center bg-transparent">
                                    <span className="flex size-[7.25rem] items-center justify-center rounded-full bg-zen-moss font-serif text-5xl text-white outline outline-[6px] outline-white">
                                        {face.display_name.slice(0, 1)}
                                    </span>
                                </div>
                            )}
                            {face.claimed && (
                                <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                                    <span className="-rotate-[22deg] rounded-sm border-[3px] border-cta px-1.5 py-0.5 font-black text-[11px] tracking-widest text-cta shadow-[2px_2px_0_rgba(234,88,12,0.25)] bg-white/40">
                                        CHECK IN
                                    </span>
                                </span>
                            )}
                        </div>
                        <p className="font-serif text-lg px-3 pt-2 text-center text-white">
                            {busy === face.id ? '鎖定中…' : face.display_name}
                        </p>
                        {face.badge ? (
                            <p className="pb-2 text-center text-[10px] text-white/60">{face.badge}</p>
                        ) : (
                            <div className="h-2" />
                        )}
                    </button>
                ))}
            </div>
            {faces.length === 0 && !error && (
                <p className="mt-8 text-sm text-white/70">目前沒有可選的角色。</p>
            )}
        </div>
    );
};
