import React, { useEffect, useState } from 'react';
import { SupabaseService } from '../services/SupabaseService';
import { travelerPhotoSrc } from '../lib/travelerPhoto';

type Face = { id: string; display_name: string; photo_url: string | null };

export const ClaimTravelerScreen: React.FC<{ tripId: string; onClaimed: () => void }> = ({ tripId, onClaimed }) => {
    const [faces, setFaces] = useState<Face[]>([]);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState('');

    const load = () => {
        SupabaseService.getUnclaimedTravelers(tripId)
            .then(setFaces)
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
        <div className="h-full overflow-y-auto px-5 pt-8 pb-10">
            <p className="text-[10px] tracking-[0.3em] text-cta uppercase">Secret mission</p>
            <h1 className="font-serif text-3xl mt-1">你是誰？</h1>
            <p className="text-sm text-zen-text-light mt-2">點頭像鎖定身分，選完不能改。已被選走的人不會出現。</p>
            {error && <p className="mt-3 text-sm text-cta">{error}</p>}
            <div className="mt-6 grid grid-cols-2 gap-3">
                {faces.map((face) => (
                    <button
                        key={face.id}
                        type="button"
                        disabled={!!busy}
                        onClick={() => pick(face.id)}
                        className="glass-panel rounded-2xl overflow-hidden border-2 border-zen-moss p-0 text-left disabled:opacity-60"
                    >
                        {face.photo_url ? (
                            <img
                                src={travelerPhotoSrc(face.photo_url)}
                                alt=""
                                className="w-full h-40 object-contain bg-zen-mist"
                            />
                        ) : (
                            <div className="w-full h-40 bg-zen-moss text-white flex items-center justify-center font-serif text-5xl">
                                {face.display_name.slice(0, 1)}
                            </div>
                        )}
                        <p className="font-serif text-lg px-3 py-2">{busy === face.id ? '鎖定中…' : face.display_name}</p>
                    </button>
                ))}
            </div>
            {faces.length === 0 && !error && (
                <p className="mt-8 text-sm text-zen-text-light">目前沒有可選的角色。</p>
            )}
        </div>
    );
};
