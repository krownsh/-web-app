import React from 'react';
import { travelerPhotoSrc } from '../lib/travelerPhoto';

type Row = {
    drawer_id: string;
    drawer_name: string;
    drawer_photo: string | null;
    angel_id: string;
    angel_name: string;
    angel_photo: string | null;
    devil_id: string;
    devil_name: string;
    devil_photo: string | null;
};

type Props = {
    rows: Row[];
    myTravelerId: string | null;
    guessAngel: string;
    guessDevil: string;
};

const Cutout: React.FC<{ photo: string | null; name: string; size: 'lg' | 'sm'; ring?: boolean }> = ({
    photo,
    name,
    size,
    ring,
}) => {
    const box = size === 'lg' ? 'size-24' : 'size-20';
    const img = size === 'lg' ? 'h-24' : 'h-20';
    return (
        <div className={`relative ${box} flex items-center justify-center`}>
            <div className={`absolute inset-0 rounded-full bg-zen-moss ${ring ? 'outline outline-2 outline-cta outline-offset-2' : ''}`} />
            {photo ? (
                <img src={travelerPhotoSrc(photo)} alt="" className={`relative z-10 ${img} w-auto object-contain bg-transparent`} />
            ) : (
                <span className="relative z-10 font-serif text-2xl text-white">{name.slice(0, 1)}</span>
            )}
        </div>
    );
};

export const GameRevealBoard: React.FC<Props> = ({ rows, myTravelerId, guessAngel, guessDevil }) => {
    const guessLabel = (hit: boolean, guessed: boolean) => {
        if (!guessed) return '沒猜';
        return hit ? '猜對了' : '猜錯了';
    };

    return (
        <div className="mt-3 space-y-4">
            {rows.map((row) => {
                const mine = row.drawer_id === myTravelerId;
                return (
                    <article
                        key={row.drawer_id}
                        className={`rounded-[1.5rem] bg-white border p-4 ${mine ? 'border-cta shadow-glow' : 'border-zen-rock'}`}
                    >
                        <div className="flex items-center gap-3">
                            <Cutout photo={row.drawer_photo} name={row.drawer_name} size="lg" ring={mine} />
                            <div className="min-w-0">
                                <p className="text-[10px] tracking-[0.2em] uppercase text-zen-text-light">
                                    {mine ? '你抽到的是' : '抽籤人'}
                                </p>
                                <p className="font-serif text-2xl leading-tight">{row.drawer_name}</p>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <div className="flex flex-col items-center rounded-2xl bg-zen-mist/80 py-3">
                                <p className="text-[10px] tracking-[0.2em] uppercase text-cta">天使</p>
                                <Cutout photo={row.angel_photo} name={row.angel_name} size="sm" />
                                <p className="font-serif text-lg mt-1">{row.angel_name}</p>
                                {mine && (
                                    <p className="text-[11px] mt-0.5 text-zen-text-light">
                                        {guessLabel(guessAngel === row.angel_id, !!guessAngel)}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col items-center rounded-2xl bg-zen-mist/80 py-3">
                                <p className="text-[10px] tracking-[0.2em] uppercase text-zen-text">惡魔</p>
                                <Cutout photo={row.devil_photo} name={row.devil_name} size="sm" />
                                <p className="font-serif text-lg mt-1">{row.devil_name}</p>
                                {mine && (
                                    <p className="text-[11px] mt-0.5 text-zen-text-light">
                                        {guessLabel(guessDevil === row.devil_id, !!guessDevil)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
    );
};
