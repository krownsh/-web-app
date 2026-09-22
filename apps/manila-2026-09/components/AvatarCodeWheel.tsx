import React, { useState } from 'react';
import { travelerPhotoSrc } from '../lib/travelerPhoto';
import type { Traveler } from '../types';

export const CODE_MEMBERS = ['韋', '劭', '郁', '欣'] as const;
export type CodeMember = typeof CODE_MEMBERS[number];

const AVATAR_COLORS: Record<CodeMember, string> = {
    韋: 'from-sky-400 to-blue-600',
    劭: 'from-violet-400 to-purple-600',
    郁: 'from-emerald-400 to-teal-600',
    欣: 'from-rose-400 to-pink-600',
};

type Props = {
    sequence: CodeMember[];
    travelers: Traveler[];
    onValidChange: (valid: boolean) => void;
};

export const AvatarCodeWheel: React.FC<Props> = ({ sequence, travelers, onValidChange }) => {
    const [values, setValues] = useState<CodeMember[]>(() => Array(sequence.length).fill('韋'));
    const [spinningIndex, setSpinningIndex] = useState<number | null>(null);

    const advanceWheel = (index: number) => {
        if (spinningIndex !== null) return;
        setSpinningIndex(index);

        window.setTimeout(() => {
            setValues((current) => {
                const next = [...current];
                const currentIndex = CODE_MEMBERS.indexOf(current[index]);
                next[index] = CODE_MEMBERS[(currentIndex + 1) % CODE_MEMBERS.length];
                onValidChange(next.every((value, valueIndex) => value === sequence[valueIndex]));
                return next;
            });
            setSpinningIndex(null);
        }, 300);
    };

    return (
        <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <div className="relative flex justify-center gap-1.5">
                <div className="pointer-events-none absolute inset-x-0 top-1/2 h-11 -translate-y-1/2 rounded-xl border-y border-white/35 bg-white/10" />
                {values.map((value, index) => {
                    const traveler = travelers.find((item) => item.display_name.startsWith(value));
                    return (
                        <button
                            key={index}
                            type="button"
                            disabled={spinningIndex !== null}
                            onClick={() => advanceWheel(index)}
                            aria-label={`第 ${index + 1} 格，目前是${value}，點擊切換頭像`}
                            className={`relative z-10 grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br ${AVATAR_COLORS[value]} text-sm font-bold text-white shadow-lg ring-2 ring-white/70 disabled:cursor-wait ${spinningIndex === index ? 'animate-spin' : ''}`}
                        >
                            {traveler?.photo_url ? (
                                <img src={travelerPhotoSrc(traveler.photo_url)} alt="" className="size-full object-cover" />
                            ) : (
                                value
                            )}
                        </button>
                    );
                })}
            </div>
            <p className="mt-3 text-center text-[11px] font-medium text-white/70">點擊頭像轉動滾輪，排出正確代碼</p>
        </div>
    );
};
