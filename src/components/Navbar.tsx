import React from 'react';
import { User, isUserOwner } from '../types';
import { Sparkles, Coins, Gem, Bell, Shield, Crown, Search } from 'lucide-react';
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
  onGoToHome?: () => void;
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
  onOpenShippingAgent,
  onGoToHome
}) => {
  const isOwner = isUserOwner(currentUser);
  const isAdminOrOwner = currentUser?.role === 'ADMIN' || isOwner;
  // Shipping Agent panel accessible to Owner and designated Shipping Agents
  const showShippingAgent = Boolean((isOwner || currentUser?.isShippingAgent === true || currentUser?.role === 'AGENT') && onOpenShippingAgent);

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#fffbeb]/95 via-[#fef3c7]/95 to-[#fde68a]/95 backdrop-blur-md border-b-2 border-amber-600/70 px-4 py-2.5 transition-all text-amber-950 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo & Return to Royal Home Button */}
        <div className="flex items-center gap-2.5">
          {onGoToHome && (
            <button
              onClick={onGoToHome}
              title="العودة للرئيسية الملكية"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 text-amber-100 font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border border-amber-300"
            >
              <Crown className="w-3.5 h-3.5 text-amber-300 fill-current" />
              <span>الرئيسية الملكية</span>
            </button>
          )}

          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-tr from-amber-400 to-emerald-700 border-2 border-amber-500 shadow-md">
            <img
              src="/hekawy_cover.svg"
              alt="شعار حكاوي"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xl tracking-tight text-amber-950">
                حكاوي
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.5 bg-emerald-700 text-amber-100 border border-amber-400 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping"></span>
                مباشر
              </span>
            </div>
            <p className="text-[11px] text-amber-900 font-bold">غرف صوتية وبث تفاعلي</p>
          </div>
        </div>

        {/* Search trigger */}
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#fffbeb] hover:bg-amber-100 text-amber-950 text-xs font-bold border border-amber-600/60 transition-colors shadow-sm"
        >
          <Search className="w-3.5 h-3.5 text-emerald-800" />
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
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-700 text-amber-100 border border-amber-400 text-xs font-black transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden md:inline">المهام</span>
              </button>

              {/* Coins Pill */}
              <button
                onClick={onOpenWallet}
                title="رصيد الكونز"
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#fffbeb] border-2 border-amber-600/70 text-amber-950 text-xs font-black transition-all active:scale-95 shadow-sm"
              >
                <Coins className="w-3.5 h-3.5 text-amber-600" />
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
