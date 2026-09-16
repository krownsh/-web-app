import React from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { HomeScreen } from './screens/HomeScreen';
import ItineraryScreen from './screens/ItineraryScreen';
import MapBudgetScreen from './screens/MapBudgetScreen';
import DiscoveryScreen from './screens/DiscoveryScreen';
import { ReminderScreen } from './screens/ReminderScreen';
import PreparationScreen from './screens/PreparationScreen';
import BottomNav from './components/BottomNav';
import { SessionProvider, TripProvider } from './context/AppState';
import Gate from './components/Gate';

const AppContent: React.FC = () => {
  const location = useLocation();

  return (
    <div className="relative h-screen w-full max-w-md mx-auto shadow-2xl shadow-gray-200/50 overflow-hidden bg-zen-bg flex flex-col font-display text-zen-text">
      <div className="flex-1 relative z-0 h-full overflow-hidden">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/itinerary" element={<ItineraryScreen />} />
          <Route path="/map-budget" element={<MapBudgetScreen />} />
          <Route path="/discovery" element={<DiscoveryScreen />} />
          <Route path="/preparation" element={<PreparationScreen />} />
          <Route path="/reminder" element={<ReminderScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BottomNav activePath={location.pathname} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <SessionProvider>
        <TripProvider>
          <Gate>
            <AppContent />
          </Gate>
        </TripProvider>
      </SessionProvider>
    </HashRouter>
  );
};

export default App;
