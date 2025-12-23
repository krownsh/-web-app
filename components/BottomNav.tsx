import React from 'react';
import { Link } from 'react-router-dom';

interface BottomNavProps {
  activePath: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ activePath }) => {
  const navItems = [
    { path: '/', icon: 'spa', label: '首頁' },
    { path: '/discovery', icon: 'map', label: '行程' },
    { path: '/map-budget', icon: 'account_balance_wallet', label: '記帳' },
    { path: '/itinerary', icon: 'local_library', label: '攻略' },
    { path: '/reminder', icon: 'notifications', label: '提醒' },
  ];

  return (
    <div className="fixed bottom-6 left-6 right-6 z-50 max-w-[400px] mx-auto">
      <div className="bg-zen-moss/85 backdrop-blur-md border border-white/20 rounded-full shadow-[0_20px_40px_-12px_rgba(107,142,136,0.6)] h-[72px] flex items-center justify-between px-6 transition-all duration-300 active:bg-zen-moss/90 active:shadow-[0_25px_50px_-12px_rgba(107,142,136,0.7)] active:-translate-y-0.5 ring-1 ring-white/10">
        {navItems.map((item) => {
          const isActive = activePath === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 active:scale-95 ${isActive ? 'text-white scale-105' : 'text-white/50 active:text-white'
                }`}
            >
              <span className={`material-symbols-outlined text-[26px] drop-shadow-sm ${isActive ? 'material-symbols-filled' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium tracking-wider drop-shadow-sm">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;