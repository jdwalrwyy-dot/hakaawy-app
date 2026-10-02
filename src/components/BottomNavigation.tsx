import React from 'react';
import {
  Compass,
  Scroll,
  Gamepad2,
  Building2,
  Crown
} from 'lucide-react';

export type TabType = 'home' | 'rooms' | 'messages' | 'games' | 'profile';

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  unreadMessagesCount?: number;
  unreadNotifsCount?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  unreadMessagesCount = 0
}) => {
  const tabs = [
    {
      id: 'home' as TabType,
      label: 'الرئيسية',
      badge: 0,
      customIcon: (active: boolean) => (
        <div className={`relative w-[36px] sm:w-[42px] h-[36px] sm:h-[42px] rounded-full flex items-center justify-center border-2 transition-all ${
          active
            ? 'bg-gradient-to-tr from-[#045227] via-[#023a1a] to-[#012210] text-amber-300 border-[#facc15] shadow-[0_0_12px_rgba(4,120,87,0.8)] scale-105'
            : 'bg-white/90 text-amber-900 border-amber-400 hover:border-amber-600'
        }`}>
          <Crown className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
        </div>
      )
    },
    {
      id: 'rooms' as TabType,
      label: 'البث المباشر',
      badge: 28,
      customIcon: (active: boolean) => (
        <div className={`relative w-[36px] sm:w-[42px] h-[36px] sm:h-[42px] rounded-full flex items-center justify-center border-2 transition-all ${
          active
            ? 'bg-gradient-to-tr from-[#045227] via-[#023a1a] to-[#012210] text-amber-300 border-[#facc15] shadow-[0_0_12px_rgba(4,120,87,0.8)] scale-105'
            : 'bg-white/90 text-amber-900 border-amber-400 hover:border-amber-600'
        }`}>
          <Scroll className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      )
    },
    {
      id: 'messages' as TabType,
      label: 'الرسائل',
      badge: unreadMessagesCount,
      customIcon: (active: boolean) => (
        <div className={`relative w-[36px] sm:w-[42px] h-[36px] sm:h-[42px] rounded-full flex items-center justify-center border-2 transition-all ${
          active
            ? 'bg-gradient-to-tr from-[#045227] via-[#023a1a] to-[#012210] text-amber-300 border-[#facc15] shadow-[0_0_12px_rgba(4,120,87,0.8)] scale-105'
            : 'bg-white/90 text-amber-900 border-amber-400 hover:border-amber-600'
        }`}>
          <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      )
    },
    {
      id: 'games' as TabType,
      label: 'الألعاب',
      badge: 0,
      customIcon: (active: boolean) => (
        <div className={`relative w-[36px] sm:w-[42px] h-[36px] sm:h-[42px] rounded-full flex items-center justify-center border-2 transition-all ${
          active
            ? 'bg-gradient-to-tr from-[#045227] via-[#023a1a] to-[#012210] text-amber-300 border-[#facc15] shadow-[0_0_12px_rgba(4,120,87,0.8)] scale-105'
            : 'bg-white/90 text-amber-900 border-amber-400 hover:border-amber-600'
        }`}>
          <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      )
    },
    {
      id: 'profile' as TabType,
      label: 'حسابي',
      badge: 0,
      customIcon: (active: boolean) => (
        <div className={`relative w-[36px] sm:w-[42px] h-[36px] sm:h-[42px] rounded-full flex items-center justify-center border-2 transition-all ${
          active
            ? 'bg-gradient-to-tr from-[#045227] via-[#023a1a] to-[#012210] text-amber-300 border-[#facc15] shadow-[0_0_12px_rgba(4,120,87,0.8)] scale-105'
            : 'bg-white/90 text-amber-900 border-amber-400 hover:border-amber-600'
        }`}>
          <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      )
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-b from-[#fffbeb] via-[#fef3c7] to-[#fde68a] border-t-2 border-[#d97706] shadow-[0_-10px_30px_rgba(217,119,6,0.3)] px-1 py-1 backdrop-blur-2xl" dir="rtl">
      <div className="max-w-[480px] mx-auto flex items-center justify-around h-[56px]">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-0.5 px-0.5 transition-all duration-200 cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-[#78350f] font-black'
                  : 'text-amber-900/70 hover:text-amber-900 font-bold'
              }`}
            >
              <div className="relative">
                {tab.customIcon(isActive)}
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center border border-white shadow-md">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 whitespace-nowrap font-extrabold tracking-tight">
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#d97706] mt-0.5 shadow-[0_0_8px_#d97706] animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
