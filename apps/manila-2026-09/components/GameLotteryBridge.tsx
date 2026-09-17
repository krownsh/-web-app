import React, { useEffect, useRef, useState } from 'react';

type Props = {
    busy?: boolean;
    error?: string;
    onFinished: () => void;
};

export const GameLotteryBridge: React.FC<Props> = ({ busy, error, onFinished }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);

    useEffect(() => {
        if (!playing) return;
        const el = videoRef.current;
        if (!el) return;
        el.play().catch(() => setPlaying(false));
    }, [playing]);

    return (
        <div className="absolute inset-0 z-[10050] bg-zen-dark text-white flex flex-col items-center justify-center px-6">
            {playing && (
                <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    src="/videos/hero-pre.mp4"
                    playsInline
                    preload="auto"
                    onEnded={onFinished}
                />
            )}
            <div className="relative z-10 text-center max-w-xs">
                {!playing && (
                    <>
                        <p className="text-[10px] tracking-[0.35em] uppercase text-white/70">任務</p>
                        <h1 className="font-serif text-4xl mt-2">抽籤</h1>
                        <p className="text-sm text-white/80 mt-3">按下後會播放抽籤影片，播完才能進入天使與惡魔。</p>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => setPlaying(true)}
                            className="mt-8 w-full py-4 rounded-full bg-cta text-white font-bold text-lg"
                        >
                            {busy ? '抽籤中…' : '開始抽籤'}
                        </button>
                        {error && <p className="mt-3 text-sm text-cta">{error}</p>}
                    </>
                )}
            </div>
        </div>
    );
};
