import React from 'react';
import { UserRole, isUserOwner } from '../types';
import { Crown, Shield, ShieldCheck, Briefcase, Zap, Mic, User as UserIcon, Sparkles, Star, Gem } from 'lucide-react';

export interface RoleBadgeItem {
  key: string;
  label: string;
  emoji: string;
  icon: React.ReactNode;
  bgClass: string;
  textClass: string;
  title: string;
  priority: number;
}

/**
 * Calculates and returns all active real roles for a given user object.
 * Returns badges in strict priority order: Owner (👑) -> Admin (🛡️) -> Agent (⭐) -> Host (🎙️) -> Supporter (💎) -> Unregistered (👤).
 */
export function getUserActiveRoleBadges(user?: any, fallbackRole?: UserRole): RoleBadgeItem[] {
  if (!user && !fallbackRole) {
    return [{
      key: 'GUEST',
      label: 'غير مسجل',
      emoji: '👤',
      icon: <UserIcon className="w-3 h-3 text-slate-400" />,
      bgClass: 'bg-slate-800/80 text-slate-300 border border-slate-700/60 font-medium',
      textClass: 'text-slate-400',
      title: 'غير مسجل',
      priority: 6
    }];
  }

  const role = user?.role || user?.userRole || fallbackRole;
  const badges: RoleBadgeItem[] = [];

  // 1. 👑 המالك (Owner)
  const isOwner = (
    isUserOwner(user) ||
    role === 'OWNER' ||
    user?.isOwner === true ||
    user?.is_owner === true
  );
  if (isOwner) {
    badges.push({
      key: 'OWNER',
      label: 'المالك',
      emoji: '👑',
      icon: <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]" />,
      bgClass: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40 font-black shadow-sm',
      textClass: 'text-amber-400 font-bold',
      title: 'المالك 👑',
      priority: 1
    });
  }

  // 2. 🛡️ الإداري (Admin / Staff / Moderator)
  const isAdmin = (
    role === 'ADMIN' ||
    role === 'STAFF' ||
    role === 'MODERATOR' ||
    user?.isAdmin === true ||
    user?.is_admin === true ||
    user?.isStaff === true
  );
  if (isAdmin) {
    badges.push({
      key: 'ADMIN',
      label: 'إداري',
      emoji: '🛡️',
      icon: <Shield className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20 shrink-0" />,
      bgClass: 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold',
      textClass: 'text-rose-400 font-bold',
      title: 'إداري 🛡️',
      priority: 2
    });
  }

  // 3. ⭐ الوكيل (Agent / Agency Owner / Shipping Agent)
  const isAgent = (
    role === 'AGENT' ||
    user?.isAgent === true ||
    user?.is_agent === true ||
    user?.isAgency === true ||
    user?.isAgencyOwner === true ||
    user?.isShippingAgent === true ||
    !!user?.agencyId ||
    !!user?.agencyCode
  );
  if (isAgent) {
    badges.push({
      key: 'AGENT',
      label: 'وكيل',
      emoji: '⭐',
      icon: <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0 drop-shadow-[0_0_3px_rgba(252,211,77,0.5)]" />,
      bgClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold',
      textClass: 'text-amber-300 font-bold',
      title: 'وكيل ⭐',
      priority: 3
    });
  }

  // 4. 🎙️ المضيف (Host)
  const isHost = (
    role === 'HOST' ||
    user?.isHost === true ||
    user?.is_host === true ||
    user?.currentRoomRole === 'HOST' ||
    user?.roleInRoom === 'HOST' ||
    !!user?.hostAgencyId ||
    !!user?.hostProfileId ||
    user?.isApprovedHost === true
  );
  if (isHost) {
    badges.push({
      key: 'HOST',
      label: 'مضيف',
      emoji: '🎙️',
      icon: <Mic className="w-3.5 h-3.5 text-cyan-400 shrink-0" />,
      bgClass: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold',
      textClass: 'text-cyan-400 font-bold',
      title: 'مضيف 🎙️',
      priority: 4
    });
  }

  // 5. 💎 الداعم (Supporter / Sponsor)
  const isSupporter = (
    user?.isSupporter === true ||
    user?.is_supporter === true ||
    user?.isSponsor === true ||
    role === 'SUPPORTER' ||
    user?.isVipNumericId === true ||
    (typeof user?.diamonds === 'number' && user.diamonds >= 50000) ||
    (typeof user?.level === 'number' && user.level >= 5) ||
    (typeof user?.exp === 'number' && user.exp >= 5000)
  );
  if (isSupporter) {
    badges.push({
      key: 'SUPPORTER',
      label: 'داعم',
      emoji: '💎',
      icon: <Gem className="w-3.5 h-3.5 text-sky-400 fill-sky-400/30 shrink-0" />,
      bgClass: 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold',
      textClass: 'text-sky-400 font-bold',
      title: 'داعم 💎',
      priority: 5
    });
  }

  // 6. 👤 غير المسجل (Unregistered / Guest)
  const isGuest = (
    user?.isGuest === true ||
    user?.is_guest === true ||
    role === 'GUEST' ||
    (user?.id && String(user.id).startsWith('guest_')) ||
    user?.isUnregistered === true
  );
  if (isGuest) {
    badges.push({
      key: 'GUEST',
      label: 'غير مسجل',
      emoji: '👤',
      icon: <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
      bgClass: 'bg-slate-800/80 text-slate-300 border border-slate-700/60 font-medium',
      textClass: 'text-slate-400 font-medium',
      title: 'غير مسجل 👤',
      priority: 6
    });
  }

  return badges;
}

interface UserRoleBadgesProps {
  user?: any;
  role?: UserRole;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  mode?: 'icons' | 'pills';
  showTextLabels?: boolean;
  className?: string;
}

/**
 * Component to display all role badges belonging to a user side by side.
 * E.g., if a user is an Agent and a Host, it displays ⭐ 🎙️ beside their name.
 */
export const UserRoleBadges: React.FC<UserRoleBadgesProps> = ({
  user,
  role,
  size = 'sm',
  mode = 'icons',
  showTextLabels = false,
  className = ''
}) => {
  const activeBadges = getUserActiveRoleBadges(user, role);

  if (activeBadges.length === 0) return null;

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const pillSizes = {
    xs: 'text-[9px] px-1 py-0.2 gap-0.5 rounded',
    sm: 'text-[10px] px-1.5 py-0.5 gap-1 rounded-md',
    md: 'text-[11px] px-2 py-0.5 gap-1.5 rounded-lg',
    lg: 'text-xs px-2.5 py-1 gap-1.5 rounded-xl'
  };

  if (mode === 'pills' || showTextLabels) {
    return (
      <span className={`inline-flex items-center gap-1 shrink-0 select-none ${className}`}>
        {activeBadges.map(b => (
          <span
            key={b.key}
            title={b.title}
            className={`inline-flex items-center justify-center shrink-0 ${pillSizes[size]} ${b.bgClass}`}
          >
            {b.icon}
            <span>{b.label}</span>
          </span>
        ))}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 shrink-0 select-none ${className}`}>
      {activeBadges.map(b => (
        <span
          key={b.key}
          title={b.title}
          className="inline-flex items-center justify-center shrink-0 hover:scale-110 transition-transform duration-150 cursor-help"
        >
          {b.icon}
        </span>
      ))}
    </span>
  );
};

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = 'md',
  showIcon = true,
  className = ''
}) => {
  const getRoleConfig = (r: UserRole) => {
    switch (r) {
      case 'OWNER':
        return {
          label: 'المالك',
          icon: <Crown className={size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />,
          bg: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 font-black border border-amber-300/80 shadow-[0_0_12px_rgba(251,191,36,0.5)]',
          sparkle: true
        };
      case 'ADMIN':
        return {
          label: 'إداري',
          icon: <Shield className={size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />,
          bg: 'bg-gradient-to-r from-rose-500/20 to-red-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/20 font-bold',
          sparkle: false
        };
      case 'STAFF':
        return {
          label: 'موظف رسمي',
          icon: <ShieldCheck className={size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />,
          bg: 'bg-gradient-to-r from-indigo-500/25 to-blue-500/25 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/20 font-bold',
          sparkle: false
        };
      case 'AGENT':
        return {
          label: 'وكيل',
          icon: <Briefcase className={size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />,
          bg: 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20 font-bold',
          sparkle: false
        };
      case 'MODERATOR':
        return {
          label: 'مشرف',
          icon: <Zap className={size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />,
          bg: 'bg-gradient-to-r from-purple-500/25 to-pink-500/25 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/20 font-bold',
          sparkle: false
        };
      case 'HOST':
        return {
          label: 'مضيف',
          icon: <Mic className={size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />,
          bg: 'bg-gradient-to-r from-amber-500/25 to-yellow-500/25 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20 font-bold',
          sparkle: false
        };
      case 'USER':
      default:
        return {
          label: 'مستخدم',
          icon: <UserIcon className={size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />,
          bg: 'bg-slate-800/90 text-slate-300 border border-slate-700/80 font-semibold',
          sparkle: false
        };
    }
  };

  const config = getRoleConfig(role);

  const sizeStyles = {
    sm: 'text-[9px] px-1.5 py-0.2 gap-1 rounded-md',
    md: 'text-[11px] px-2.5 py-0.5 gap-1.5 rounded-lg',
    lg: 'text-xs px-3 py-1 gap-2 rounded-xl'
  };

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 tracking-wide select-none ${sizeStyles[size]} ${config.bg} ${className}`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
      {config.sparkle && size !== 'sm' && <Sparkles className="w-2.5 h-2.5 text-amber-900 animate-spin" style={{ animationDuration: '3s' }} />}
    </span>
  );
};

