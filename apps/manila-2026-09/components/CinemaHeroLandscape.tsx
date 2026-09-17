import React, { useEffect, useRef } from 'react';
import { MotionLink } from './MotionLink';
import type { TripPhase } from '../lib/heroSchedule';

const HERO_VIDEO_SRC = '/videos/hero-pre.mp4';

interface CinemaHeroLandscapeProps {
  tripTitle: string;
  tripState: TripPhase;
}

export const CinemaHeroLandscape: React.FC<CinemaHeroLandscapeProps> = ({ tripTitle, tripState }) => {
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
      className="mx-5 mt-4 overflow-hidden rounded-[1.75rem] bg-white shadow-mist"
      aria-label={`${caption}，${tripTitle}`}
    >
      <video
        ref={videoRef}
        className="block h-auto w-full object-contain object-center"
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

      <div className="flex items-center gap-3 bg-zen-text px-4 py-3">
        {tripState.type === 'day' && (
          <span className="shrink-0 rounded-full bg-cta px-2.5 py-0.5 text-[11px] font-bold tracking-widest text-white">
            進行中
          </span>
        )}
        <p className="shrink-0 font-serif text-5xl leading-none tracking-tight text-white tabular-nums">
          {headline}
        </p>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold tracking-[0.2em] text-cta">{kicker}</p>
          <p className="mt-0.5 truncate text-base font-bold leading-snug text-white">{caption}</p>
          <p className="mt-0.5 truncate text-xs font-medium text-zen-bg">{tripTitle}</p>
        </div>
        {tripState.type === 'countdown' && (
          <MotionLink to="/preparation" className="shrink-0 text-sm font-bold text-cta">
            行前準備 →
          </MotionLink>
        )}
      </div>
    </section>
  );
};
