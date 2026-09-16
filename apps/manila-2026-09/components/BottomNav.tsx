import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BottomNavProps {
  activePath: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ activePath }) => {
  const navigate = useNavigate();
  const navItems = [
    { path: '/', icon: 'spa', label: '首頁' },
    { path: '/discovery', icon: 'map', label: '行程' },
    { path: '/map-budget', icon: 'account_balance_wallet', label: '記帳' },
    { path: '/itinerary', icon: 'local_library', label: '攻略' },
    { path: '/reminder', icon: 'notifications', label: '提醒' },
  ];

  return (
    <nav className="absolute bottom-5 left-5 right-5 z-[9999]">
      <div className="relative bg-[#fffdf8]/95 backdrop-blur-md border-2 border-zen-moss rounded-full shadow-float h-[72px] flex items-center px-1.5">
        {navItems.map((item) => {
          const isActive = item.path === '/' ? activePath === '/' : activePath === item.path;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`flex-1 h-[60px] rounded-full flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                isActive ? 'text-zen-moss bg-zen-moss/10' : 'text-zen-text-light'
              }`}
            >
              <span className={`material-symbols-outlined text-[24px] ${isActive ? 'material-symbols-filled text-cta' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
