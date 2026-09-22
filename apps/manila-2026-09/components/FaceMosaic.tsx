import React, { useState } from 'react';

const MOSAIC_FACES = [
    '/travelers/meihui.jpg',
    '/travelers/zhihao.jpg',
    '/travelers/haru.jpg',
    '/travelers/farong.jpg',
    '/travelers/zichen.jpg',
    '/travelers/junxuan.jpg',
    '/travelers/weishao.jpg',
    '/travelers/yuxin.jpg',
    '/travelers/chenghong.jpg',
    '/guests/a.png',
    '/guests/b.png',
    '/guests/c.png',
    '/guests/d.png',
];

const WALLPAPER_COLS = 6;
const WALLPAPER_ROWS = 12;

function shuffle<T>(items: T[]): T[] {
    const next = [...items];
    for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
}

function wallpaperStyle(index: number) {
    const col = index % WALLPAPER_COLS;
    const brick = col % 2 === 0 ? 0 : 20;
    const x = ((index * 47) % 33) - 16;
    const y = brick + ((index * 31) % 41) - 20;
    const rot = ((index * 19) % 29) - 14;
    return {
        transform: `translate(${x}px, ${y}px) rotate(${rot}deg)`,
    };
}

function buildMosaic() {
    const count = WALLPAPER_ROWS * WALLPAPER_COLS;
    const faces: string[] = [];
    while (faces.length < count) {
        faces.push(...shuffle(MOSAIC_FACES));
    }
    return faces.slice(0, count);
}

export function FaceMosaic({ children }: { children: React.ReactNode }) {
    const [faces] = useState(buildMosaic);
    return (
        <div className="relative flex h-full min-h-0 items-center justify-center overflow-hidden bg-zen-dark px-6">
            <div className="absolute -inset-14 grid grid-cols-6 gap-x-4 gap-y-5" aria-hidden="true">
                {faces.map((src, i) => (
                    <img
                        key={`${src}-${i}`}
                        src={src}
                        alt=""
                        style={wallpaperStyle(i)}
                        className="size-[4.5rem] justify-self-center object-contain"
                    />
                ))}
            </div>
            <div className="absolute inset-0 bg-zen-dark/40" aria-hidden="true" />
            <div className="relative z-10 w-full max-w-[20rem]">{children}</div>
        </div>
    );
}
