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

const guessLabel = (hit: boolean, guessed: boolean) => {
    if (!guessed) return '沒猜';
    return hit ? '猜對了' : '猜錯了';
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

const MyRelationTree: React.FC<{ row: Row; guessAngel: string; guessDevil: string }> = ({ row, guessAngel, guessDevil }) => (
    <article className="rounded-[1.5rem] border border-cta bg-white p-4 shadow-glow">
        <p className="text-[10px] tracking-[0.2em] uppercase text-cta">我的配對</p>
        <div className="relative mx-auto mt-4 max-w-sm">
            <div className="grid grid-cols-2 gap-3">
                <div className="relative flex flex-col items-center pb-5 text-center">
                    <p className="text-[10px] tracking-[0.2em] uppercase text-cta">天使</p>
                    <Cutout photo={row.angel_photo} name={row.angel_name} size="sm" />
                    <p className="font-serif text-lg">{row.angel_name}</p>
                    <p className="text-[11px] text-zen-text-light">{guessLabel(guessAngel === row.angel_id, !!guessAngel)}</p>
                    <span aria-hidden="true" className="absolute bottom-0 left-1/2 h-5 w-px bg-zen-rock" />
                </div>
                <div className="relative flex flex-col items-center pb-5 text-center">
                    <p className="text-[10px] tracking-[0.2em] uppercase text-zen-text">惡魔</p>
                    <Cutout photo={row.devil_photo} name={row.devil_name} size="sm" />
                    <p className="font-serif text-lg">{row.devil_name}</p>
                    <p className="text-[11px] text-zen-text-light">{guessLabel(guessDevil === row.devil_id, !!guessDevil)}</p>
                    <span aria-hidden="true" className="absolute bottom-0 left-1/2 h-5 w-px bg-zen-rock" />
                </div>
            </div>
            <div aria-hidden="true" className="relative h-9">
                <span className="absolute left-1/4 right-1/4 top-0 h-px bg-zen-rock" />
                <span className="absolute left-1/2 top-0 h-9 w-px -translate-x-1/2 bg-zen-rock" />
            </div>
            <div className="flex flex-col items-center text-center">
                <p className="text-[10px] tracking-[0.2em] uppercase text-zen-moss">主角 · 我</p>
                <Cutout photo={row.drawer_photo} name={row.drawer_name} size="lg" ring />
                <p className="font-serif text-2xl leading-tight">{row.drawer_name}</p>
            </div>
        </div>
    </article>
);

export const GameRevealBoard: React.FC<Props> = ({ rows, myTravelerId, guessAngel, guessDevil }) => {
    return (
        <div className="mt-3 space-y-4">
            {rows.map((row) => {
                const mine = row.drawer_id === myTravelerId;
                if (mine) {
                    return <MyRelationTree key={row.drawer_id} row={row} guessAngel={guessAngel} guessDevil={guessDevil} />;
                }
                return (
                    <article
                        key={row.drawer_id}
                        className="rounded-[1.5rem] border border-zen-rock bg-white p-4"
                    >
                        <div className="flex items-center gap-3">
                            <Cutout photo={row.drawer_photo} name={row.drawer_name} size="lg" ring={mine} />
                            <div className="min-w-0">
                                <p className="text-[10px] tracking-[0.2em] uppercase text-zen-text-light">
                                    抽籤人
                                </p>
                                <p className="font-serif text-2xl leading-tight">{row.drawer_name}</p>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <div className="flex flex-col items-center rounded-2xl bg-zen-mist/80 py-3">
                                <p className="text-[10px] tracking-[0.2em] uppercase text-cta">天使</p>
                                <Cutout photo={row.angel_photo} name={row.angel_name} size="sm" />
                                <p className="font-serif text-lg mt-1">{row.angel_name}</p>
                            </div>
                            <div className="flex flex-col items-center rounded-2xl bg-zen-mist/80 py-3">
                                <p className="text-[10px] tracking-[0.2em] uppercase text-zen-text">惡魔</p>
                                <Cutout photo={row.devil_photo} name={row.devil_name} size="sm" />
                                <p className="font-serif text-lg mt-1">{row.devil_name}</p>
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
    );
};
