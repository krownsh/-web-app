import React from 'react';

export function FaceMosaic({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative flex h-full min-h-0 items-center justify-center overflow-hidden bg-zen-dark px-6">
            <img
                src="/faces/mosaic.webp"
                alt=""
                aria-hidden="true"
                decoding="async"
                className="pointer-events-none absolute -inset-14 h-[calc(100%+7rem)] w-[calc(100%+7rem)] max-w-none object-cover"
            />
            <div className="absolute inset-0 bg-zen-dark/40" aria-hidden="true" />
            <div className="relative z-10 w-full max-w-[20rem]">{children}</div>
        </div>
    );
}
