import React, { useEffect, useRef, useState } from 'react';

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
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [openId, setOpenId] = useState<string | null>(null);
    const opened = photos.find((p) => p.id === openId) || null;

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (opened) {
            if (!dialog.open) dialog.showModal();
        } else if (dialog.open) {
            dialog.close();
        }
    }, [opened]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog || 'closedBy' in HTMLDialogElement.prototype) return;
        const onClick = (event: MouseEvent) => {
            if (event.target !== dialog) return;
            const rect = dialog.getBoundingClientRect();
            const inside =
                rect.top <= event.clientY &&
                event.clientY <= rect.top + rect.height &&
                rect.left <= event.clientX &&
                event.clientX <= rect.left + rect.width;
            if (!inside) dialog.close();
        };
        dialog.addEventListener('click', onClick);
        return () => dialog.removeEventListener('click', onClick);
    }, []);

    if (!photos.length) {
        return emptyText ? <p className="text-xs text-zen-text-light mt-2">{emptyText}</p> : null;
    }

    return (
        <>
            <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
                {photos.map((p) => (
                    <figure key={p.id} className="shrink-0 snap-center w-[88%] rounded-xl overflow-hidden bg-zen-mist">
                        <button
                            type="button"
                            onClick={() => setOpenId(p.id)}
                            className="block w-full text-left"
                            aria-label="放大醜照"
                        >
                            <img src={p.url} alt="" className="w-full h-64 object-cover" />
                        </button>
                        {p.caption ? <figcaption className="text-[11px] px-2 py-1">{p.caption}</figcaption> : null}
                    </figure>
                ))}
            </div>
            <dialog
                ref={dialogRef}
                closedBy="any"
                aria-label="醜照大圖"
                className="photo-lightbox border-0 bg-transparent p-0"
                onClose={() => setOpenId(null)}
                onClick={(event) => {
                    if (event.target === event.currentTarget) dialogRef.current?.close();
                }}
            >
                <div className="relative max-w-[min(92vw,40rem)]">
                    <button
                        type="button"
                        aria-label="關閉"
                        onClick={() => dialogRef.current?.close()}
                        className="absolute -right-2 -top-2 z-10 flex size-11 items-center justify-center rounded-full bg-white text-zen-moss shadow-md"
                    >
                        <span className="material-symbols-outlined text-[26px]">close</span>
                    </button>
                    {opened && (
                        <img
                            src={opened.url}
                            alt={opened.caption || ''}
                            className="max-h-[82vh] max-w-[92vw] rounded-xl object-contain"
                        />
                    )}
                </div>
            </dialog>
        </>
    );
};
