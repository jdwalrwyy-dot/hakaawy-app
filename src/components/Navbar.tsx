import React from 'react';
import { User, isUserOwner } from '../types';
import { Sparkles, Coins, Gem, Bell, Shield, Radio, Search } from 'lucide-react';
import { UserRoleBadges } from './RoleBadge';

interface NavbarProps {
  currentUser: User | null;
  unreadNotifsCount: number;
  onOpenWallet: () => void;
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onOpenSearch: () => void;
  onOpenAdmin: () => void;
  onOpenTasks: () => void;
  onOpenShippingAgent?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  unreadNotifsCount,
  onOpenWallet,
  onOpenNotifications,
  onOpenAuth,
  onOpenSearch,
  onOpenAdmin,
  onOpenTasks,
  onOpenShippingAgent
}) => {
  const isOwner = isUserOwner(currentUser);
  const isAdminOrOwner = currentUser?.role === 'ADMIN' || isOwner;
  // Shipping Agent panel accessible to Owner and designated Shipping Agents
  const showShippingAgent = Boolean((isOwner || currentUser?.isShippingAgent === true || currentUser?.role === 'AGENT') && onOpenShippingAgent);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo & Live Badge */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-tr from-amber-500/20 to-purple-500/20 border border-amber-500/40 shadow-lg shadow-amber-500/20">
            <img
              src="/hekawy_cover.svg"
              alt="شعار حكاوي"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-400 bg-clip-text text-transparent">
                حكاوي
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                مباشر
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">غرف صوتية وبث تفاعلي</p>
          </div>
        </div>

        {/* Search trigger */}
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs border border-slate-700/60 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>بحث عن غرفة أو مضيف...</span>
        </button>

        {/* User Balance & Actions */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <>
              {/* Daily Tasks Button */}
              <button
                onClick={onOpenTasks}
                title="المهام اليومية والمكافآت"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">المهام</span>
              </button>

              {/* Coins Pill */}
              <button
                onClick={onOpenWallet}
                title="رصيد الكونز"
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-600/40 text-amber-300 text-xs font-bold transition-all active:scale-95"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentUser.coins.toLocaleString('ar-EG')}</span>
              </button>

              {/* Diamonds Pill */}
              <button
                onClick={onOpenWallet}
                title="رصيد الماسات"
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-950/60 hover:bg-sky-900/60 border border-sky-600/40 text-sky-300 text-xs font-bold transition-all active:scale-95"
              >
                <Gem className="w-3.5 h-3.5 text-sky-400" />
                <span>{currentUser.diamonds.toLocaleString('ar-EG')}</span>
              </button>

              {/* Shipping Agent Button: Only accessible to Owner while recharge is restricted */}
              {showShippingAgent && (
                <button
                  onClick={onOpenShippingAgent}
                  title="لوحة وكيل الشحن"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/50 text-amber-300 text-xs font-extrabold shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <Gem className="w-3.5 h-3.5 text-amber-400" />
                  <span>وكيل الشحن</span>
                </button>
              )}

              {/* Admin Panel Quick Access */}
              {isAdminOrOwner && (
                <button
                  onClick={onOpenAdmin}
                  title="لوحة الإدارة والمراقبة"
                  className="flex items-center gap-1 px-2 py-1 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-600 text-purple-300 text-xs font-bold transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden lg:inline">الإدارة</span>
                </button>
              )}

              {/* Notifications Button */}
              <button
                onClick={onOpenNotifications}
                title="الإشعارات"
                className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center border-2 border-slate-900 animate-pulse">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {/* User Avatar with Profile Switcher */}
              <button
                onClick={onOpenAuth}
                title="تغيير الحساب أو تعديل الملف"
                className="relative group focus:outline-none flex items-center gap-1.5"
              >
                <UserRoleBadges user={currentUser} size="xs" />
                <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-600 group-hover:border-amber-400 transition-colors shrink-0">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </button>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all active:scale-95"
            >
              تسجيل الدخول
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
