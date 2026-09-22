import React, { useCallback, useEffect, useRef, useState } from 'react';
import { travelerPhotoSrc } from '../lib/travelerPhoto';
import type { Traveler } from '../types';

export type CodeMember = string;

const CELL = 56;

type Props = {
    sequence: CodeMember[];
    travelers: Traveler[];
    onValidChange: (valid: boolean) => void;
};

export const AvatarCodeWheel: React.FC<Props> = ({ sequence, travelers, onValidChange }) => {
    const [selected, setSelected] = useState<string[]>(() => Array(sequence.length).fill(''));
    const reelRefs = useRef<(HTMLDivElement | null)[]>([]);
    const members = travelers.map((traveler) => ({
        name: traveler.display_name,
        photoUrl: traveler.photo_url,
    }));
    const loop = [...members, ...members, ...members];

    const reportValid = useCallback((values: string[]) => {
        onValidChange(values.every((value, index) => value === sequence[index]));
    }, [onValidChange, sequence]);

    useEffect(() => {
        if (members.length === 0) {
            onValidChange(false);
            return;
        }
        reelRefs.current.forEach((reel, index) => {
            if (!reel) return;
            const start = members.length * CELL;
            reel.scrollLeft = start;
            setSelected((current) => {
                const next = [...current];
                next[index] = members[0].name;
                reportValid(next);
                return next;
            });
        });
    }, [members.length, reportValid, onValidChange]);

    const syncReel = (index: number, scrollLeft: number) => {
        if (members.length === 0) return;
        const span = members.length * CELL;
        const raw = Math.round(scrollLeft / CELL);
        const memberIndex = ((raw % members.length) + members.length) % members.length;
        setSelected((current) => {
            const next = [...current];
            if (next[index] === members[memberIndex].name) return current;
            next[index] = members[memberIndex].name;
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
        <div className="flex flex-col gap-2">
            {sequence.map((_, index) => (
                <div
                    key={index}
                    className="relative h-14 overflow-hidden overscroll-contain"
                >
                    <div
                        ref={(node) => { reelRefs.current[index] = node; }}
                        onScroll={(event) => syncReel(index, event.currentTarget.scrollLeft)}
                        className="flex h-14 overflow-x-auto overflow-y-hidden snap-x snap-mandatory overscroll-x-contain no-scrollbar"
                        style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
                    >
                        {loop.map((member, memberIndex) => (
                            <div
                                key={`${index}-${member.name}-${memberIndex}`}
                                className="grid h-14 w-14 shrink-0 snap-center place-items-center overflow-hidden"
                            >
                                {member.photoUrl ? (
                                    <img src={travelerPhotoSrc(member.photoUrl)} alt="" className="h-12 w-auto max-w-12 object-contain" />
                                ) : (
                                    <span className="text-sm font-bold">{member.name.slice(0, 1)}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
