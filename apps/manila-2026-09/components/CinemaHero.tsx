import React from 'react';
import { CinemaHeroLandscape } from './CinemaHeroLandscape';
import { CinemaHeroPortrait } from './CinemaHeroPortrait';
import { isPortraitHeroTime, type TripPhase } from '../lib/heroSchedule';

export type { TripPhase };

interface CinemaHeroProps {
  tripTitle: string;
  tripState: TripPhase;
}

export const CinemaHero: React.FC<CinemaHeroProps> = (props) => {
  if (isPortraitHeroTime()) {
    return <CinemaHeroPortrait {...props} />;
  }
  return <CinemaHeroLandscape {...props} />;
};
