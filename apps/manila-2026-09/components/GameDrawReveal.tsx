import React from 'react';
import { travelerPhotoSrc } from '../lib/travelerPhoto';

type Props = {
    role: 'angel' | 'devil';
    name: string;
    photo: string | null;
};

export const GameDrawReveal: React.FC<Props> = ({ role, name, photo }) => {
    const label = role === 'angel' ? '你的天使' : '你的惡魔';

    return (
        <div className="flex flex-col items-center pt-2">
            <p className={`text-[10px] tracking-[0.25em] uppercase text-cta`}>
                {label}
            </p>
            <div className="relative mt-3 size-56 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-zen-moss" />
                {photo ? (
                    <img
                        src={travelerPhotoSrc(photo)}
                        alt=""
                        className="relative z-10 h-48 w-auto object-contain bg-transparent"
                    />
                ) : (
                    <p className="relative z-10 font-serif text-6xl text-white">{name.slice(0, 1)}</p>
                )}
            </div>
            <p className="font-serif text-2xl mt-1">{name}</p>
        </div>
    );
};
