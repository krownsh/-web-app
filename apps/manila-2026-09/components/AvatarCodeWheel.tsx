import React, { useCallback, useEffect, useRef, useState } from 'react';
import { travelerPhotoSrc } from '../lib/travelerPhoto';
import type { Traveler } from '../types';

export type CodeMember = string;

const CELL = 112;

type Member = {
    name: string;
    photoUrl: string | null;
};

type Props = {
    sequence: CodeMember[];
    travelers: Traveler[];
    onValidChange: (valid: boolean) => void;
};

function wrapIndex(length: number, value: number) {
    return ((value % length) + length) % length;
}

export const AvatarCodeWheel: React.FC<Props> = ({ sequence, travelers, onValidChange }) => {
    const [offsets, setOffsets] = useState<number[]>(() => Array(sequence.length).fill(0));
    const [scrolls, setScrolls] = useState<number[]>(() => Array(sequence.length).fill(0));
    const reelRefs = useRef<(HTMLDivElement | null)[]>([]);
    const members: Member[] = travelers.map((traveler) => ({
        name: traveler.display_name,
        photoUrl: traveler.photo_url,
    }));
    const loop = [...members, ...members, ...members];

    const reportValid = useCallback((values: number[]) => {
        if (members.length === 0) {
            onValidChange(false);
            return;
        }
        onValidChange(values.every((offset, index) => members[wrapIndex(members.length, offset)]?.name === sequence[index]));
    }, [members, onValidChange, sequence]);

    useEffect(() => {
        if (members.length === 0) {
            onValidChange(false);
            return;
        }
        const start = members.length * CELL;
        reelRefs.current.forEach((reel) => {
            if (reel) reel.scrollLeft = start;
        });
        const zeros = Array(sequence.length).fill(0);
        setOffsets(zeros);
        setScrolls(Array(sequence.length).fill(start));
        reportValid(zeros);
    }, [members.length, onValidChange, reportValid, sequence.length]);

    const syncReel = (index: number, scrollLeft: number) => {
        if (members.length === 0) return;
        const span = members.length * CELL;
        const raw = Math.round(scrollLeft / CELL);
        const memberIndex = wrapIndex(members.length, raw);
        setScrolls((current) => {
            if (current[index] === scrollLeft) return current;
            const next = [...current];
            next[index] = scrollLeft;
            return next;
        });
        setOffsets((current) => {
            if (current[index] === memberIndex) return current;
            const next = [...current];
            next[index] = memberIndex;
            reportValid(next);
            return next;
        });
        const reel = reelRefs.current[index];
        if (!reel) return;
        if (scrollLeft < span * 0.5) reel.scrollLeft = scrollLeft + span;
        if (scrollLeft > span * 2.5) reel.scrollLeft = scrollLeft - span;
    };

    if (members.length === 0) return null;

    return (
        <div className="flex flex-col gap-4">
            {sequence.map((_, index) => {
                const centerPos = scrolls[index] / CELL;
                return (
                    <div key={index} className="relative h-32 overflow-hidden overscroll-contain">
                        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-zen-dark to-transparent" />
                        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-zen-dark to-transparent" />
                        <div
                            ref={(node) => { reelRefs.current[index] = node; }}
                            onScroll={(event) => syncReel(index, event.currentTarget.scrollLeft)}
                            className="flex h-32 items-center overflow-x-auto overflow-y-hidden snap-x snap-mandatory overscroll-x-contain no-scrollbar px-[calc(50%-56px)]"
                            style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
                        >
                            {loop.map((member, memberIndex) => {
                                const distance = Math.abs(memberIndex - centerPos);
                                const isCenter = distance < 0.35;
                                const isSide = distance < 1.35;
                                return (
                                    <div
                                        key={`${index}-${member.name}-${memberIndex}`}
                                        className="grid h-32 w-[112px] shrink-0 snap-center place-items-center"
                                    >
                                        <div
                                            className={`grid place-items-center overflow-hidden rounded-full transition-[transform,filter,opacity,box-shadow] duration-150 ${
                                                isCenter
                                                    ? 'h-28 w-28 scale-110 shadow-[0_16px_28px_rgba(0,0,0,.5)]'
                                                    : isSide
                                                        ? 'h-[4.5rem] w-[4.5rem] scale-90 opacity-50 blur-[2px]'
                                                        : 'h-12 w-12 scale-75 opacity-0'
                                            }`}
                                        >
                                            {member.photoUrl ? (
                                                <img
                                                    src={travelerPhotoSrc(member.photoUrl)}
                                                    alt=""
                                                    className="h-full w-auto max-w-full object-contain"
                                                />
                                            ) : (
                                                <span className="text-lg font-bold">{member.name.slice(0, 1)}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
