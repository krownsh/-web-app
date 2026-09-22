import React, { useEffect, useState } from 'react';
import { travelerPhotoSrc } from '../lib/travelerPhoto';
import type { Traveler } from '../types';

export type CodeMember = string;

const AVATAR_COLORS = [
    'from-sky-400 to-blue-600',
    'from-violet-400 to-purple-600',
    'from-emerald-400 to-teal-600',
    'from-rose-400 to-pink-600',
    'from-amber-400 to-orange-600',
    'from-cyan-400 to-blue-600',
    'from-fuchsia-400 to-pink-600',
    'from-lime-400 to-green-600',
];

type Props = {
    sequence: CodeMember[];
    travelers: Traveler[];
    onValidChange: (valid: boolean) => void;
};

export const AvatarCodeWheel: React.FC<Props> = ({ sequence, travelers, onValidChange }) => {
    const [positions, setPositions] = useState<number[]>(() => Array(sequence.length).fill(0));
    const [spinningIndex, setSpinningIndex] = useState<number | null>(null);
    const members = travelers.map((traveler) => ({
            name: traveler.display_name,
            photoUrl: traveler.photo_url,
        }));

    useEffect(() => {
        if (members.length === 0) onValidChange(false);
    }, [members.length, onValidChange]);

    if (members.length === 0) {
        return (
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-center text-xs text-white/70 backdrop-blur-sm">
                正在載入全體團員頭像…
            </div>
        );
    }

    const advanceWheel = (index: number) => {
        if (spinningIndex !== null) return;
        setSpinningIndex(index);

        window.setTimeout(() => {
            setPositions((current) => {
                const next = [...current];
                next[index] += 1;
                onValidChange(next.every((position, valueIndex) => (
                    members[position % members.length]?.name === sequence[valueIndex]
                )));
                return next;
            });
            setSpinningIndex(null);
        }, 300);
    };

    const memberAt = (position: number) => {
        const normalized = ((position % members.length) + members.length) % members.length;
        return members[normalized];
    };

    return (
        <div className="rounded-2xl border border-white/20 bg-white/10 p-2.5 backdrop-blur-sm">
            <div className="rounded-xl border-2 border-cta/80 bg-[#fff9e9] p-1.5 shadow-[inset_0_0_0_2px_rgba(255,255,255,.8)]">
                <div className="flex flex-col gap-1">
                    {positions.map((position, index) => {
                        const current = memberAt(position);
                        const displayedMembers = [
                            memberAt(position - 1),
                            current,
                            memberAt(position + 1),
                            memberAt(position + 2),
                        ];

                        return (
                            <div key={index} className="flex items-center gap-2">
                                <span className="w-4 text-center text-[10px] font-bold text-cta">{index + 1}</span>
                                <button
                                    type="button"
                                    disabled={spinningIndex !== null}
                                    onClick={() => advanceWheel(index)}
                                    aria-label={`第 ${index + 1} 格，目前是${current.name}，點擊將頭像往上轉動`}
                                    className="relative h-11 min-w-0 flex-1 overflow-hidden rounded-lg border border-[#d9c891] bg-white shadow-inner disabled:cursor-wait"
                                >
                                    <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-6 -translate-y-1/2 border-y border-cta/50 bg-cta/5" />
                                    <div
                                        className={`relative flex flex-col items-center ${spinningIndex === index ? 'transition-transform duration-300 ease-out' : ''}`}
                                        style={{ transform: `translateY(${spinningIndex === index ? -38 : -14}px)` }}
                                    >
                                        {displayedMembers.map((member, memberIndex) => {
                                            return (
                                                <span
                                                    key={`${member.name}-${memberIndex}`}
                                                    className={`grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br ${AVATAR_COLORS[(position + memberIndex - 1 + AVATAR_COLORS.length) % AVATAR_COLORS.length]} text-[9px] font-bold text-white shadow-sm ${memberIndex === 1 ? 'ring-1 ring-cta/60' : 'opacity-45'}`}
                                                >
                                                    {member.photoUrl ? (
                                                        <img src={travelerPhotoSrc(member.photoUrl)} alt="" className="size-full object-cover" />
                                                    ) : (
                                                        member.name.slice(0, 1)
                                                    )}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
            <p className="mt-2 text-center text-[11px] font-medium text-white/70">點擊每格，讓頭像由下往上轉動</p>
        </div>
    );
};
