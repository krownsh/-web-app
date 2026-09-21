import React, { useEffect, useMemo, useRef, useState } from 'react';
import { travelerPhotoSrc } from '../lib/travelerPhoto';

export type DevilPhotoVote = {
    photo_id: string;
    user_id: string;
    display_name: string;
    photo_url: string | null;
    kind: string;
};

export type DevilLeaderboardPhoto = {
    id: string;
    url: string;
    created_at: string;
};

type Props = {
    photos: DevilLeaderboardPhoto[];
    votes: DevilPhotoVote[];
    myUserId: string;
    onVote: (photoId: string) => void;
    voting: boolean;
};

const PLACE = {
    1: { label: '大醜', ring: 'bg-[#d4a017]', badge: 'bg-[#d4a017] text-white', icon: 'emoji_events' },
    2: { label: '小醜', ring: 'bg-[#9aa3a8]', badge: 'bg-[#8a9499] text-white', icon: 'military_tech' },
    3: { label: '銅醜', ring: 'bg-[#c47a3a]', badge: 'bg-[#c47a3a] text-white', icon: 'workspace_premium' },
} as const;

function rankPhotos(photos: DevilLeaderboardPhoto[], votes: DevilPhotoVote[]) {
    const grouped = new Map<string, DevilPhotoVote[]>();
    for (const vote of votes) {
        const list = grouped.get(vote.photo_id) ?? [];
        list.push(vote);
        grouped.set(vote.photo_id, list);
    }
    return [...photos]
        .sort((a, b) => {
            const va = grouped.get(a.id)?.length ?? 0;
            const vb = grouped.get(b.id)?.length ?? 0;
            return vb - va || a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id);
        })
        .map((photo, index) => ({
            ...photo,
            voters: grouped.get(photo.id) ?? [],
            place: (index < 3 ? (index + 1) : null) as 1 | 2 | 3 | null,
        }));
}

const VoterRow: React.FC<{ voters: DevilPhotoVote[] }> = ({ voters }) => {
    const shown = voters.slice(0, 8);
    const extra = voters.length - shown.length;
    return (
        <div className="flex items-center gap-1 min-h-[28px] overflow-hidden px-0.5 pt-1">
            {voters.length === 0 ? (
                <p className="text-[10px] text-zen-text-light">還沒有人投</p>
            ) : (
                <>
                    <div className="flex items-center">
                        {shown.map((voter, i) => {
                            const src = travelerPhotoSrc(voter.photo_url);
                            return (
                                <span
                                    key={voter.user_id}
                                    title={voter.display_name}
                                    className="relative size-7 rounded-full overflow-hidden border-2 border-zen-bg bg-zen-moss text-white shrink-0 -ml-1.5 first:ml-0"
                                    style={{ zIndex: shown.length - i }}
                                >
                                    {src ? (
                                        <img src={src} alt="" className="size-full object-cover" />
                                    ) : (
                                        <span className="flex size-full items-center justify-center font-serif text-[11px]">
                                            {voter.display_name.slice(0, 1)}
                                        </span>
                                    )}
                                </span>
                            );
                        })}
                    </div>
                    <p className="text-[10px] text-zen-text-light tabular-nums">
                        {voters.length} 票{extra > 0 ? ` · +${extra}` : ''}
                    </p>
                </>
            )}
        </div>
    );
};

type CardProps = {
    photo: ReturnType<typeof rankPhotos>[number];
    myUserId: string;
    onOpen: () => void;
    onVote: () => void;
    voting: boolean;
};

const PhotoCard: React.FC<CardProps> = ({ photo, myUserId, onOpen, onVote, voting }) => {
    const votedHere = photo.voters.some((v) => v.user_id === myUserId);
    const place = photo.place ? PLACE[photo.place] : null;

    return (
        <figure className="w-[7.25rem] shrink-0">
            <div className={`rounded-xl p-[3px] ${place ? place.ring : 'bg-zen-rock/70'}`}>
                <div className="relative overflow-hidden rounded-[0.6rem] bg-zen-mist">
                    {place && (
                        <span className={`absolute left-1.5 top-1.5 z-[1] inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${place.badge}`}>
                            <span className="material-symbols-outlined text-[13px]">{place.icon}</span>
                            {place.label}
                        </span>
                    )}
                    <button type="button" onClick={onOpen} className="block w-full text-left" aria-label="放大醜照">
                        <img src={photo.url} alt="" className="aspect-square w-full object-cover" />
                    </button>
                    {votedHere ? (
                        <span className="absolute bottom-1.5 right-1.5 rounded-full bg-zen-moss/90 px-2 py-0.5 text-[10px] font-medium text-white">
                            已投
                        </span>
                    ) : (
                        <button
                            type="button"
                            disabled={voting}
                            aria-label="投這張醜照"
                            onClick={(event) => {
                                event.stopPropagation();
                                onVote();
                            }}
                            className="absolute bottom-1.5 right-1.5 flex size-9 items-center justify-center rounded-full bg-white text-cta shadow-md disabled:opacity-60"
                        >
                            <span className="material-symbols-outlined text-[20px]">how_to_vote</span>
                        </button>
                    )}
                </div>
            </div>
            <VoterRow voters={photo.voters} />
        </figure>
    );
};

export const DevilPhotoLeaderboard: React.FC<Props> = ({ photos, votes, myUserId, onVote, voting }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [openId, setOpenId] = useState<string | null>(null);
    const ranked = useMemo(() => rankPhotos(photos, votes), [photos, votes]);
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

    if (!photos.length) return null;

    const cardProps = (photo: ReturnType<typeof rankPhotos>[number]) => ({
        photo,
        myUserId,
        voting,
        onOpen: () => setOpenId(photo.id),
        onVote: () => onVote(photo.id),
    });

    return (
        <>
            <div className="flex gap-2 overflow-x-auto no-scrollbar overscroll-x-contain pb-1">
                {ranked.map((photo) => (
                    <PhotoCard key={photo.id} {...cardProps(photo)} />
                ))}
            </div>
            <dialog
                ref={dialogRef}
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
                        <img src={opened.url} alt="" className="max-h-[82vh] max-w-[92vw] rounded-xl object-contain" />
                    )}
                </div>
            </dialog>
        </>
    );
};
