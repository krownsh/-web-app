import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { HomeScreen } from './screens/HomeScreen';
import ItineraryScreen from './screens/ItineraryScreen';
import MapBudgetScreen from './screens/MapBudgetScreen';
import DiscoveryScreen from './screens/DiscoveryScreen';
import { ReminderScreen } from './screens/ReminderScreen';
import PreparationScreen from './screens/PreparationScreen';
import GameScreen from './screens/GameScreen';
import { ClaimTravelerScreen } from './screens/ClaimTravelerScreen';
import BottomNav from './components/BottomNav';
import { SessionProvider, TripProvider, useTrip } from './context/AppState';
import Gate from './components/Gate';
import { Toaster } from './components/ui/sonner';

const AppContent: React.FC = () => {
  const location = useLocation();
  const { trip, gameClaim, claimReady, refreshClaim } = useTrip();

  if (!trip?.id || !claimReady) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zen-text-light">載入中…</div>
    );
  }

  if (!gameClaim) {
    return <ClaimTravelerScreen tripId={trip.id} onClaimed={() => refreshClaim()} />;
  }

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col isolate">
      <div className="relative z-0 min-h-0 flex-1 overflow-hidden">
        <Routes location={location}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/itinerary" element={<ItineraryScreen />} />
          <Route path="/map-budget" element={<MapBudgetScreen />} />
          <Route path="/discovery" element={<DiscoveryScreen />} />
          <Route path="/preparation" element={<PreparationScreen />} />
          <Route path="/reminder" element={<ReminderScreen />} />
          <Route path="/game" element={<GameScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BottomNav activePath={location.pathname} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <SessionProvider>
        <TripProvider>
          <Toaster />
          <div className="min-h-dvh bg-[#e8dcc8] flex justify-center">
            <div className="relative h-[100dvh] w-full max-w-md overflow-hidden bg-zen-bg flex flex-col font-display text-zen-text shadow-2xl shadow-[#1c3d4a]/15">
              <Gate>
                <AppContent />
              </Gate>
            </div>
          </div>
        </TripProvider>
      </SessionProvider>
    </BrowserRouter>
  );
};

export default App;
