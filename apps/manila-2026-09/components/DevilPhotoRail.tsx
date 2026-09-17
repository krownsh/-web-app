import React from 'react';

type Photo = {
    id: string;
    url: string;
    caption?: string;
};

type Props = {
    photos: Photo[];
    emptyText?: string;
};

export const DevilPhotoRail: React.FC<Props> = ({ photos, emptyText }) => {
    if (!photos.length) {
        return emptyText ? <p className="text-xs text-zen-text-light mt-2">{emptyText}</p> : null;
    }

    return (
        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
            {photos.map((p) => (
                <figure key={p.id} className="shrink-0 snap-center w-[72%] rounded-xl overflow-hidden bg-zen-mist">
                    <img src={p.url} alt="" className="w-full h-44 object-cover" />
                    {p.caption ? <figcaption className="text-[11px] px-2 py-1">{p.caption}</figcaption> : null}
                </figure>
            ))}
        </div>
    );
};
