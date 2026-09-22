import React, { useEffect, useRef, useState } from 'react';
import { travelerPhotoSrc } from '../lib/travelerPhoto';
import { AvatarCodeWheel, CodeMember } from './AvatarCodeWheel';
import type { Traveler } from '../types';

export type LotteryDraw = {
    angel_name: string;
    devil_name: string;
    angel_photo: string | null;
    devil_photo: string | null;
};

type Props = {
    busy?: boolean;
    error?: string;
    onFinished: () => Promise<LotteryDraw | null>;
    onEnterGame: () => void;
    travelers: Traveler[];
};

const LOTTERY_VIDEO = '/videos/lottery.mp4';

function ResultCard({
    label,
    name,
    photo,
    accent,
}: {
    label: string;
    name: string;
    photo: string | null;
    accent: string;
}) {
    return (
        <div className="flex w-[42%] flex-col items-center">
            <p className={`text-[10px] tracking-[0.28em] uppercase ${accent}`}>{label}</p>
            <div className="relative mt-2 flex size-28 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-zen-moss/80" />
                {photo ? (
                    <img src={travelerPhotoSrc(photo)} alt="" className="relative z-10 h-24 w-auto object-contain" />
                ) : (
                    <p className="relative z-10 font-serif text-4xl text-white">{name.slice(0, 1)}</p>
                )}
            </div>
            <p className="mt-1 font-serif text-xl text-white">{name}</p>
        </div>
    );
}

export const GameLotteryBridge: React.FC<Props> = ({ busy, error, onFinished, onEnterGame, travelers }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const curtainRef = useRef<HTMLDivElement>(null);
    const [curtainUp, setCurtainUp] = useState(false);
    const [result, setResult] = useState<LotteryDraw | null>(null);
    const [loadError, setLoadError] = useState(error || '');
    const [lotteryCodeValid, setLotteryCodeValid] = useState(false);
    const [codeError, setCodeError] = useState('');

    const startedRef = useRef(false);

    useEffect(() => {
        setLoadError(error || '');
    }, [error]);

    useEffect(() => {
        const el = videoRef.current;
        if (!el) return;
        el.loop = false;
        el.muted = true;
        el.volume = 0;
        el.pause();
        el.currentTime = 0;
    }, []);

    useEffect(() => {
        if (!curtainUp) return;
        const curtain = curtainRef.current;
        const video = videoRef.current;
        if (!curtain || !video) return;

        const playAfterLift = () => {
            if (startedRef.current) return;
            startedRef.current = true;
            video.loop = false;
            video.muted = true;
            video.volume = 0;
            video.play().catch(() => undefined);
        };

        curtain.addEventListener('transitionend', playAfterLift, { once: true });
        const fallback = window.setTimeout(playAfterLift, 780);
        return () => {
            curtain.removeEventListener('transitionend', playAfterLift);
            window.clearTimeout(fallback);
        };
    }, [curtainUp]);

    const onVideoEnded = async () => {
        try {
            const draw = await onFinished();
            setResult(draw);
        } catch (err: any) {
            setLoadError(err.message || '抽籤失敗');
        }
    };

    return (
        <div className="absolute inset-0 z-[10050] overflow-hidden bg-zen-dark text-white">
            <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-contain object-center"
                src={LOTTERY_VIDEO}
                loop={false}
                muted
                playsInline
                preload="auto"
                onLoadedMetadata={(e) => {
                    e.currentTarget.loop = false;
                    e.currentTarget.muted = true;
                    e.currentTarget.volume = 0;
                    if (!startedRef.current) {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                    }
                }}
                onEnded={(e) => {
                    e.currentTarget.pause();
                    void onVideoEnded();
                }}
            />

            <div
                ref={curtainRef}
                className={`absolute inset-0 z-10 flex flex-col items-center justify-center bg-zen-dark px-6 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    curtainUp ? '-translate-y-full' : 'translate-y-0'
                }`}
            >
                <h1 className="font-serif text-4xl">抽籤</h1>
                <div className="mt-6 w-full max-w-xs">
                    <AvatarCodeWheel
                        sequence={['韋劭', '韋劭', '郁欣', '郁欣'] as CodeMember[]}
                        travelers={travelers}
                        onValidChange={(valid) => {
                            setLotteryCodeValid(valid);
                            if (valid) setCodeError('');
                        }}
                    />
                </div>
                <button
                    type="button"
                    disabled={busy || curtainUp}
                    onClick={() => {
                        if (!lotteryCodeValid) {
                            setCodeError('排列錯誤');
                            return;
                        }
                        setCodeError('');
                        setCurtainUp(true);
                    }}
                    className="mt-5 w-full max-w-xs py-4 rounded-full bg-cta text-white font-bold text-lg disabled:cursor-not-allowed disabled:opacity-45"
                >
                    {busy ? '抽籤中…' : '開始抽籤'}
                </button>
                {codeError && !curtainUp && <p className="mt-3 text-sm text-cta">{codeError}</p>}
                {loadError && !result && <p className="mt-3 text-sm text-cta">{loadError}</p>}
            </div>

            {result && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zen-dark/55 px-5 animate-fade-in">
                    <p className="text-[10px] tracking-[0.35em] uppercase text-white/80">你抽中了</p>
                    <div className="mt-6 flex w-full justify-center gap-3">
                        <ResultCard label="你的天使" name={result.angel_name} photo={result.angel_photo} accent="text-cta" />
                        <ResultCard label="你的惡魔" name={result.devil_name} photo={result.devil_photo} accent="text-cta" />
                    </div>
                    <button
                        type="button"
                        onClick={onEnterGame}
                        className="mt-10 w-full max-w-xs py-4 rounded-full bg-cta text-white font-bold text-lg"
                    >
                        進入任務
                    </button>
                </div>
            )}
        </div>
    );
};
