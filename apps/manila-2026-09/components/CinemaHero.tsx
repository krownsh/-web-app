import React, { useEffect, useRef, useState } from 'react';
import { MotionLink } from './MotionLink';

export type TripPhase = { type: 'countdown' | 'day' | 'ended'; value: number };

const HERO_VIDEO_SRC = '/videos/hero.mp4';
const HERO_VIDEO_POSTER = '/spots/intramuros.png';

interface CinemaHeroProps {
  tripTitle: string;
  tripState: TripPhase;
}

export const CinemaHero: React.FC<CinemaHeroProps> = ({ tripTitle, tripState }) => {
  const [videoReady, setVideoReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const el = rootRef.current;
    const video = videoRef.current;
    if (!el || !video) return undefined;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduceMotion, videoReady]);

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
      className="relative mx-5 mt-4 aspect-video overflow-hidden rounded-[1.75rem] bg-zen-dark shadow-mist"
      aria-label={`${caption}，${tripTitle}`}
    >
      <img
        src={HERO_VIDEO_POSTER}
        alt=""
        fetchPriority="high"
        className={`absolute inset-0 size-full object-cover object-center ${reduceMotion || !videoReady ? '' : 'opacity-0'} ${reduceMotion ? '' : 'animate-ken-burns'}`}
      />

      {!reduceMotion && (
        <video
          ref={videoRef}
          className={`absolute inset-0 size-full object-cover object-center transition-opacity duration-300 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
          src={HERO_VIDEO_SRC}
          poster={HERO_VIDEO_POSTER}
          muted
          loop
          playsInline
          preload="metadata"
          onCanPlay={() => {
            setVideoReady(true);
            videoRef.current?.play().catch(() => undefined);
          }}
          onError={() => setVideoReady(false)}
          aria-hidden="true"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-zen-dark/85 via-zen-dark/20 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center px-5 pb-4 pt-12 text-white">
        {tripState.type === 'day' && (
          <span className="mb-1.5 rounded-full bg-[#f5c518] px-3 py-0.5 text-[10px] font-bold tracking-widest text-zen-dark">
            進行中
          </span>
        )}
        <p className="text-[10px] font-bold tracking-[0.35em] text-[#f5c518]">{kicker}</p>
        <p className="font-serif text-[4.5rem] leading-none tracking-tight drop-shadow-md">{headline}</p>
        <p className="mt-1 text-sm font-medium">{caption}</p>
        <p className="mt-0.5 text-[11px] text-white/70">{tripTitle}</p>
        {tripState.type === 'countdown' && (
          <MotionLink to="/preparation" className="mt-2 text-[11px] text-[#f5c518]">
            行前準備 →
          </MotionLink>
        )}
        {!videoReady && <p className="mt-2 text-[10px] text-white/70">影片待補 · 橫式 16:9</p>}
      </div>
    </section>
  );
};
