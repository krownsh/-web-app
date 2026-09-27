import React, { useMemo } from 'react';
import { travelerPhotoSrc } from '../lib/travelerPhoto';

export type GameGuessScore = {
    traveler_id: string;
    display_name: string;
    photo_url: string | null;
    angel_correct: boolean;
    devil_correct: boolean;
    score: number;
};

export const GameGuessLeaderboard: React.FC<{ scores: GameGuessScore[] }> = ({ scores }) => {
    const ranked = useMemo(() => {
        let previousScore: number | null = null;
        let rank = 0;
        return scores.map((entry, index) => {
            if (entry.score !== previousScore) rank = index + 1;
            previousScore = entry.score;
            return { ...entry, rank };
        });
    }, [scores]);

    if (!ranked.length) return null;

    return (
        <section className="mt-6 rounded-[1.5rem] border border-zen-rock bg-white p-4">
            <div className="flex items-end justify-between gap-3">
                <div>
                    <p className="text-[10px] tracking-[0.22em] uppercase text-cta">猜對排名</p>
                    <h3 className="font-serif text-2xl">誰最會猜？</h3>
                </div>
                <p className="text-right text-[10px] leading-relaxed text-zen-text-light">天使、惡魔各 1 分<br />共 2 分</p>
            </div>
            <ol className="mt-4 space-y-2">
                {ranked.map((entry) => (
                    <li key={entry.traveler_id} className="flex items-center gap-3 rounded-2xl bg-zen-mist/70 px-3 py-2.5">
                        <span className={`w-5 text-center font-serif text-lg ${entry.rank === 1 ? 'text-cta' : 'text-zen-text-light'}`}>
                            {entry.rank}
                        </span>
                        {entry.photo_url ? (
                            <img src={travelerPhotoSrc(entry.photo_url)} alt="" className="size-9 rounded-full bg-zen-moss object-cover" />
                        ) : (
                            <span className="flex size-9 items-center justify-center rounded-full bg-zen-moss font-serif text-sm text-white">
                                {entry.display_name.slice(0, 1)}
                            </span>
                        )}
                        <p className="min-w-0 flex-1 truncate text-sm font-bold">{entry.display_name}</p>
                        <p className="font-serif text-xl text-cta">{entry.score}<span className="ml-0.5 text-xs text-zen-text-light">分</span></p>
                    </li>
                ))}
            </ol>
        </section>
    );
};
