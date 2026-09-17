import React from 'react';
import { travelerPhotoSrc } from '../lib/travelerPhoto';
import type { Traveler } from '../types';

type Props = {
    role: 'angel' | 'devil';
    people: Traveler[];
    selectedId: string;
    onSelect: (id: string) => void;
};

export const GameGuessPicker: React.FC<Props> = ({ role, people, selectedId, onSelect }) => {
    const stamp = role === 'angel' ? '我的天使' : '我的惡魔';

    return (
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6">
            {people.map((person) => {
                const selected = selectedId === person.id;
                return (
                    <button
                        key={person.id}
                        type="button"
                        onClick={() => onSelect(person.id)}
                        className="group flex flex-col items-center cursor-pointer"
                    >
                        <span className="relative flex h-28 w-28 items-end justify-center transition-transform duration-150 group-hover:scale-105">
                            {person.photo_url ? (
                                <img
                                    src={travelerPhotoSrc(person.photo_url)}
                                    alt=""
                                    className="h-28 w-auto object-contain bg-transparent"
                                />
                            ) : (
                                <span className="font-serif text-4xl">{person.display_name.slice(0, 1)}</span>
                            )}
                            {selected && (
                                <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                                    <span className="-rotate-[22deg] rounded-sm border-[3px] border-cta px-1.5 py-0.5 font-black text-[11px] tracking-widest text-cta shadow-[2px_2px_0_rgba(234,88,12,0.25)] bg-white/40">
                                        {stamp}
                                    </span>
                                </span>
                            )}
                        </span>
                        <span className="font-serif text-sm mt-1">{person.display_name}</span>
                    </button>
                );
            })}
        </div>
    );
};
