export type TripPhase = { type: 'countdown' | 'day' | 'ended'; value: number };

/** 此刻起改播直式 hero（9/24 24:00 = 9/25 00:00 +08） */
export const HERO_PORTRAIT_AT = new Date('2026-09-25T00:00:00+08:00');

export function isPortraitHeroTime(now = new Date()) {
  return now.getTime() >= HERO_PORTRAIT_AT.getTime();
}
