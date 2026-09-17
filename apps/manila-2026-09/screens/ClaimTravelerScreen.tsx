import React, { useEffect, useState } from 'react';
import { SupabaseService } from '../services/SupabaseService';
import { travelerPhotoSrc } from '../lib/travelerPhoto';

type Face = { id: string; display_name: string; photo_url: string | null; claimed: boolean };

export const ClaimTravelerScreen: React.FC<{ tripId: string; onClaimed: () => void }> = ({ tripId, onClaimed }) => {
    const [faces, setFaces] = useState<Face[]>([]);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState('');

    const load = () => {
        Promise.all([
            SupabaseService.getTravelers(tripId),
            SupabaseService.getUnclaimedTravelers(tripId),
        ])
            .then(([people, open]) => {
                const openIds = new Set(open.map((row) => row.id));
                setFaces(
                    people
                        .filter((person) => person.display_name !== 'Haru')
                        .map((person) => ({
                            id: person.id,
                            display_name: person.display_name,
                            photo_url: person.photo_url || null,
                            claimed: !openIds.has(person.id),
                        }))
                );
            })
            .catch((err) => setError(err.message || '載入失敗'));
    };

    useEffect(() => {
        load();
    }, [tripId]);

    const pick = async (id: string) => {
        setError('');
        setBusy(id);
        try {
            await SupabaseService.claimTraveler(tripId, id);
            onClaimed();
        } catch (err: any) {
            setError(/already taken/i.test(err.message) ? '這位已被選走，請再選' : err.message || '選擇失敗');
            load();
        } finally {
            setBusy(null);
        }
    };

    return (
        <div className="h-full overflow-y-auto bg-zen-dark px-5 pt-8 pb-10 text-zen-mist">
            <p className="text-[10px] tracking-[0.3em] text-cta uppercase">Secret mission</p>
            <h1 className="font-serif text-3xl mt-1 text-white">你是誰？</h1>
            <p className="text-sm text-white/70 mt-2">點頭像鎖定身分，選完不能改。已 check in 的人不能再選。</p>
            {error && <p className="mt-3 text-sm text-cta">{error}</p>}
            <div className="mt-6 grid grid-cols-2 gap-3">
                {faces.map((face) => (
                    <button
                        key={face.id}
                        type="button"
                        disabled={!!busy || face.claimed}
                        onClick={() => pick(face.id)}
                        className="rounded-2xl overflow-hidden border border-white/15 bg-zen-moss/40 p-0 disabled:opacity-100"
                    >
                        <div className="relative">
                            {face.photo_url ? (
                                <img
                                    src={travelerPhotoSrc(face.photo_url)}
                                    alt=""
                                    className="w-full h-40 object-contain bg-zen-dark"
                                />
                            ) : (
                                <div className="w-full h-40 bg-zen-moss text-white flex items-center justify-center font-serif text-5xl">
                                    {face.display_name.slice(0, 1)}
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
                        <p className="font-serif text-lg px-3 py-2 text-center text-white">
                            {busy === face.id ? '鎖定中…' : face.display_name}
                        </p>
                    </button>
                ))}
            </div>
            {faces.length === 0 && !error && (
                <p className="mt-8 text-sm text-white/70">目前沒有可選的角色。</p>
            )}
        </div>
    );
};
