import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { travelerPhotoSrc } from '../lib/travelerPhoto';
import type { Traveler } from '../types';

export type CodeMember = string;

type Member = {
    name: string;
    photoUrl: string | null;
};

const DEFAULT_STARTS = ['靜瑩', '彥文', '宇庭', '庭宇'];
const GUEST_FACES: Member[] = [
    { name: '彥文', photoUrl: '/guests/a.png' },
    { name: '靜瑩', photoUrl: '/guests/b.png' },
    { name: '宇庭', photoUrl: '/guests/c.png' },
    { name: '庭宇', photoUrl: '/guests/d.png' },
];

type Props = {
    sequence: CodeMember[];
    travelers: Traveler[];
    onValidChange: (valid: boolean) => void;
};

function wrapIndex(length: number, value: number) {
    return ((value % length) + length) % length;
}

function mergeMembers(travelers: Traveler[]): Member[] {
    const fromApi = travelers
        .filter((traveler) => traveler.display_name !== 'Haru' && traveler.display_name !== '共用訪客')
        .map((traveler) => ({
            name: traveler.display_name,
            photoUrl: traveler.photo_url,
        }));
    const seen = new Set(fromApi.map((member) => member.name));
    return [...fromApi, ...GUEST_FACES.filter((guest) => !seen.has(guest.name))];
}

const SnapReel: React.FC<{
    members: Member[];
    startName: string;
    onIndexChange: (index: number) => void;
}> = ({ members, startName, onIndexChange }) => {
    const viewportRef = useRef<HTMLDivElement>(null);
    const stripRef = useRef<HTMLDivElement>(null);
    const loop = useMemo(() => [...members, ...members, ...members], [members]);
    const xRef = useRef(0);
    const indexRef = useRef(0);
    const widthRef = useRef(0);
    const heightRef = useRef(0);
    const cellRef = useRef(0);
    const dragRef = useRef<{ pointer: number; startX: number; origin: number; lastX: number; lastT: number; velocity: number } | null>(null);
    const onIndexChangeRef = useRef(onIndexChange);
    onIndexChangeRef.current = onIndexChange;

    const metrics = () => {
        const width = widthRef.current || viewportRef.current?.clientWidth || 0;
        const cell = cellRef.current || width / 3;
        return { width, cell };
    };

    const xForLoopIndex = (loopIndex: number, width: number, cell: number) => (
        width / 2 - (loopIndex + 0.5) * cell
    );

    const wrapToMiddle = (x: number, width: number, cell: number) => {
        if (members.length === 0 || cell <= 0) return x;
        const span = members.length * cell;
        let next = x;
        let i = (width / 2 - next) / cell - 0.5;
        while (i < members.length) {
            next -= span;
            i += members.length;
        }
        while (i >= members.length * 2) {
            next += span;
            i -= members.length;
        }
        return next;
    };

    const paint = (x: number, animate: boolean) => {
        const viewport = viewportRef.current;
        const strip = stripRef.current;
        if (!viewport || !strip) return;
        const width = viewport.clientWidth || 1;
        const height = viewport.clientHeight || 1;
        const cell = cellRef.current || width / 3;
        const size = Math.max(48, Math.min(cell, height) * 0.92);
        strip.style.transition = animate ? 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
        strip.style.transform = `translate3d(${x}px,0,0)`;
        Array.from(strip.children).forEach((node, itemIndex) => {
            const el = node as HTMLElement;
            el.style.width = `${cell}px`;
            const center = x + (itemIndex + 0.5) * cell;
            const dist = Math.abs(center - width / 2) / cell;
            const face = el.firstElementChild as HTMLElement | null;
            if (!face) return;
            face.style.width = `${size}px`;
            face.style.height = `${size}px`;
            if (dist < 0.45) {
                face.style.transform = 'scale(1.06)';
                face.style.opacity = '1';
                face.style.filter = 'blur(0px)';
                face.style.zIndex = '3';
            } else if (dist < 1.05) {
                face.style.transform = 'scale(0.82)';
                face.style.opacity = '0.48';
                face.style.filter = 'blur(1.4px)';
                face.style.zIndex = '1';
            } else {
                face.style.transform = 'scale(0.7)';
                face.style.opacity = '0';
                face.style.filter = 'blur(3px)';
                face.style.zIndex = '0';
            }
        });
    };

    const settle = (x: number, velocity: number) => {
        const { width, cell } = metrics();
        if (width < 8 || cell <= 0 || members.length === 0) return;
        const projected = x + velocity * 120;
        const raw = Math.round((width / 2 - projected) / cell - 0.5);
        const loopIndex = Math.max(0, Math.min(members.length * 3 - 1, raw));
        const snapped = xForLoopIndex(loopIndex, width, cell);
        xRef.current = snapped;
        indexRef.current = wrapIndex(members.length, loopIndex);
        paint(snapped, true);
        onIndexChangeRef.current(indexRef.current);
        window.setTimeout(() => {
            const recentered = wrapToMiddle(xRef.current, width, cell);
            if (recentered === xRef.current) return;
            xRef.current = recentered;
            paint(recentered, false);
        }, 340);
    };

    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport || members.length === 0) return;

        const applyStart = (width: number, cell: number) => {
            const found = members.findIndex((member) => member.name === startName);
            const startIndex = found >= 0 ? found : 0;
            indexRef.current = startIndex;
            const x = xForLoopIndex(members.length + startIndex, width, cell);
            xRef.current = x;
            paint(x, false);
            onIndexChangeRef.current(startIndex);
        };

        const syncSize = () => {
            const width = viewport.clientWidth;
            const height = viewport.clientHeight;
            if (width < 8) return;
            const cell = width / 3;
            const first = widthRef.current < 8;
            const changed = width !== widthRef.current || height !== heightRef.current || cell !== cellRef.current;
            widthRef.current = width;
            heightRef.current = height;
            cellRef.current = cell;
            if (first) {
                applyStart(width, cell);
                return;
            }
            if (!changed) return;
            const x = xForLoopIndex(members.length + indexRef.current, width, cell);
            xRef.current = x;
            paint(x, false);
        };

        syncSize();
        const observer = new ResizeObserver(syncSize);
        observer.observe(viewport);
        return () => observer.disconnect();
    }, [members, startName]);

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = {
            pointer: event.pointerId,
            startX: event.clientX,
            origin: xRef.current,
            lastX: event.clientX,
            lastT: performance.now(),
            velocity: 0,
        };
        paint(xRef.current, false);
    };

    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.pointer !== event.pointerId) return;
        const { width, cell } = metrics();
        const now = performance.now();
        const next = drag.origin + (event.clientX - drag.startX);
        const wrapped = wrapToMiddle(next, width, cell);
        if (wrapped !== next) drag.origin += wrapped - next;
        const dt = Math.max(now - drag.lastT, 1);
        drag.velocity = (event.clientX - drag.lastX) / dt;
        drag.lastX = event.clientX;
        drag.lastT = now;
        xRef.current = wrapped;
        paint(wrapped, false);
    };

    const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.pointer !== event.pointerId) return;
        dragRef.current = null;
        settle(xRef.current, drag.velocity);
    };

    return (
        <div
            ref={viewportRef}
            className="relative min-h-0 min-w-0 overflow-clip overscroll-contain touch-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
        >
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1/6 bg-gradient-to-r from-zen-dark to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-1/6 bg-gradient-to-l from-zen-dark to-transparent" />
            <div ref={stripRef} className="absolute inset-y-0 left-0 flex h-full items-center will-change-transform">
                {loop.map((member, memberIndex) => (
                    <div
                        key={`${member.name}-${memberIndex}`}
                        className="grid h-full shrink-0 place-items-center"
                    >
                        <div className="grid place-items-center overflow-visible bg-transparent">
                            {member.photoUrl ? (
                                <img
                                    src={travelerPhotoSrc(member.photoUrl)}
                                    alt=""
                                    draggable={false}
                                    decoding="async"
                                    className="pointer-events-none block h-full w-auto max-w-full object-contain bg-transparent"
                                />
                            ) : (
                                <span className="text-lg font-bold">{member.name.slice(0, 1)}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const AvatarCodeWheel: React.FC<Props> = ({ sequence, travelers, onValidChange }) => {
    const members = useMemo(() => mergeMembers(travelers), [travelers]);
    const selectedRef = useRef<number[]>(sequence.map(() => 0));

    const report = useCallback((values: number[]) => {
        if (members.length === 0) {
            onValidChange(false);
            return;
        }
        onValidChange(values.every((offset, index) => members[wrapIndex(members.length, offset)]?.name === sequence[index]));
    }, [members, onValidChange, sequence]);

    if (members.length === 0) return null;

    return (
        <div
            className="grid h-full min-h-0 w-full"
            style={{ gridTemplateRows: `repeat(${sequence.length}, minmax(0, 1fr))` }}
        >
            {sequence.map((startName, index) => (
                <SnapReel
                    key={`${startName}-${index}`}
                    members={members}
                    startName={DEFAULT_STARTS[index] || members[0].name}
                    onIndexChange={(memberIndex) => {
                        const next = [...selectedRef.current];
                        next[index] = memberIndex;
                        selectedRef.current = next;
                        report(next);
                    }}
                />
            ))}
        </div>
    );
};
