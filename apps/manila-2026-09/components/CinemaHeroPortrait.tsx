import React, { useEffect, useRef } from 'react';
import { MotionLink } from './MotionLink';
import type { TripPhase } from '../lib/heroSchedule';

const HERO_VIDEO_SRC = '/videos/hero.mp4';

interface CinemaHeroPortraitProps {
  tripTitle: string;
  tripState: TripPhase;
}

export const CinemaHeroPortrait: React.FC<CinemaHeroPortraitProps> = ({ tripTitle, tripState }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    const video = videoRef.current;
    if (!el || !video) return undefined;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.muted = true;
          video.volume = 0;
          video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const headline =
    tripState.type === 'countdown'
      ? String(tripState.value)
      : tripState.type === 'ended'
        ? '回憶'
        : `D${tripState.value}`;

  const kicker =
    tripState.type === 'countdown'
      ? 'DAYS LEFT'
      : tripState.type === 'ended'
        ? 'TRIP COMPLETE'
        : 'TODAY';

  const caption =
    tripState.type === 'countdown'
      ? `還有 ${tripState.value} 天`
      : tripState.type === 'ended'
        ? '旅程結束'
        : `今天 · 第 ${tripState.value} 日`;

  return (
    <section
      ref={rootRef}
      className="mx-5 mt-4 flex items-stretch overflow-hidden rounded-[1.75rem] bg-white shadow-mist"
      aria-label={`${caption}，${tripTitle}`}
    >
      <div className="@container flex w-[38%] shrink-0 flex-col justify-center overflow-hidden bg-zen-text px-3.5 py-5">
        {tripState.type === 'day' && (
          <span className="mb-2 inline-block w-fit rounded-full bg-cta px-2.5 py-0.5 text-[11px] font-bold tracking-widest text-white">
            進行中
          </span>
        )}
        <p className="text-xs font-bold tracking-[0.2em] text-cta">{kicker}</p>
        <p
          className={`mt-1 w-full min-w-0 overflow-hidden font-serif leading-[0.85] tracking-tighter text-white tabular-nums whitespace-nowrap ${
            tripState.type === 'ended' ? 'text-[40cqw]' : 'text-[80cqw]'
          }`}
        >
          {headline}
        </p>
        <p className="mt-3 text-lg font-bold leading-snug text-white">{caption}</p>
        <p className="mt-1.5 text-sm font-medium text-zen-bg">{tripTitle}</p>
        {tripState.type === 'countdown' && (
          <MotionLink to="/preparation" className="mt-4 inline-block text-sm font-bold text-cta">
            行前準備 →
          </MotionLink>
        )}
      </div>

      <div className="flex w-[62%] items-center justify-start bg-white">
        <video
          ref={videoRef}
          className="h-auto w-full object-contain object-left"
          src={HERO_VIDEO_SRC}
          muted
          loop
          autoPlay
          playsInline
          preload="auto"
          onLoadedMetadata={(e) => {
            e.currentTarget.muted = true;
            e.currentTarget.volume = 0;
          }}
          onCanPlay={(e) => {
            e.currentTarget.muted = true;
            e.currentTarget.volume = 0;
            e.currentTarget.play().catch(() => undefined);
          }}
          aria-hidden="true"
        />
      </div>
    </section>
  );
};
