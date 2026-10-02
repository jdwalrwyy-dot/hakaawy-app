import React, { useState } from 'react';
import { User, isUserOwner } from '../types';
import { API } from '../services/api';
import { UserRoleBadges } from './RoleBadge';
import { LegalSupportModals, LegalModalType } from './LegalSupportModals';
import { AccountSettingsModal } from './AccountSettingsModal';
import { LevelProgressCard } from './LevelProgressCard';
import { Avatar4DFrame } from './Avatar4DFrame';
import { UserVerificationSection } from './UserVerificationSection';
import {
  User as UserIcon,
  Crown,
  Coins,
  Gem,
  Copy,
  Edit3,
  LogOut,
  X,
  Camera,
  Upload,
  ChevronRight
} from 'lucide-react';

interface ProfileViewProps {
  currentUser: User;
  onUserUpdated: (user: User) => void;
  onOpenWallet: () => void;
  onOpenTasks: () => void;
  onOpenFrames: () => void;
  onOpenEntrances?: () => void;
  onOpenAdmin?: () => void;
  onOpenAuth: () => void;
  onOpenSwitchAccount?: () => void;
  onLogout?: () => void;
  onOpenHostDashboard?: () => void;
  onOpenHostApply?: () => void;
  onOpenAgentDashboard?: () => void;
  onOpenAgentApply?: () => void;
  onOpenShippingAgent?: () => void;
}

export type ProfileBottomSheetType =
  | 'store_equipment'
  | 'agency_recharge'
  | 'verification_activities'
  | 'settings_security'
  | null;

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onUserUpdated,
  onOpenWallet,
  onOpenTasks,
  onOpenFrames,
  onOpenAuth,
  onOpenSwitchAccount,
  onLogout,
  onOpenHostDashboard,
  onOpenHostApply,
  onOpenAgentDashboard,
  onOpenAgentApply,
  onOpenShippingAgent
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>(currentUser.gender || 'MALE');
  const [copiedNumericId, setCopiedNumericId] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [legalModal, setLegalModal] = useState<LegalModalType | null>(null);
  const [profileSubView, setProfileSubView] = useState<'profile' | 'settings' | 'frames' | 'level'>('profile');
  const [activeSheet, setActiveSheet] = useState<ProfileBottomSheetType>(null);

  const isOwner = isUserOwner(currentUser);

  // Mouse & Touch 2D Drag Panning Handlers
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    // Ignore interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('label') || target.closest('a')) return;
    if (!scrollContainerRef.current) return;
    setIsPanning(true);
    setPanStart({
      x: e.pageX,
      y: e.pageY,
      scrollLeft: scrollContainerRef.current.scrollLeft,
      scrollTop: scrollContainerRef.current.scrollTop
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsPanning(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !scrollContainerRef.current) return;
    e.preventDefault();
    const dx = e.pageX - panStart.x;
    const dy = e.pageY - panStart.y;
    scrollContainerRef.current.scrollLeft = panStart.scrollLeft - dx;
    scrollContainerRef.current.scrollTop = panStart.scrollTop - dy;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await API.updateUser(currentUser.id, { name, bio, avatar, gender });
      onUserUpdated(updated);
      try {
        localStorage.setItem('currentUser', JSON.stringify(updated));
        localStorage.setItem('hekawy_current_user', JSON.stringify(updated));
      } catch {}
      setIsEditing(false);
    } catch {
      alert('تعذر حفظ البيانات');
    } finally {
      setIsSaving(false);
    }
  };

  // Inline Full Sub-Views
  if (profileSubView === 'settings' || profileSubView === 'frames') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 p-3 overflow-y-auto max-w-md mx-auto" dir="rtl">
        <AccountSettingsModal
          isOpen={true}
          isInline={true}
          initialTab={profileSubView === 'frames' ? 'frames' : 'entrances'}
          onClose={() => setProfileSubView('profile')}
          currentUser={currentUser}
          onUserUpdated={onUserUpdated}
          onOpenRechargeModal={onOpenWallet}
        />
      </div>
    );
  }

  if (profileSubView === 'level') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 p-4 overflow-y-auto max-w-md mx-auto flex flex-col gap-4 dir-rtl" dir="rtl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <button
            onClick={() => setProfileSubView('profile')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
            <span>رجوع لتبويب أنا</span>
          </button>
          <span className="text-xs font-extrabold text-amber-400">مستوى الحساب والثروة</span>
        </div>
        <LevelProgressCard
          exp={currentUser.exp || 0}
          level={currentUser.level || 1}
          onOpenFrames={() => setProfileSubView('frames')}
        />
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseUpOrLeave}
      onMouseUp={handleMouseUpOrLeave}
      onMouseMove={handleMouseMove}
      className="relative w-full h-full min-h-[85vh] max-w-xl mx-auto px-3 sm:px-6 py-3 flex flex-col justify-start gap-4 text-slate-100 select-none overflow-x-auto overflow-y-auto touch-pan-x touch-pan-y [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-28 cursor-grab active:cursor-grabbing"
      style={{
        touchAction: 'pan-x pan-y',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
      dir="rtl"
    >
      {/* ==================== 1. ULTRA-COMPACT HEADER SECTION ==================== */}
      <div className="flex flex-col gap-2 shrink-0">
        {/* User Card */}
        <div className="relative bg-slate-900/90 border border-slate-800/90 rounded-2xl p-2.5 shadow-lg flex items-center justify-between gap-2.5 overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-full bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-transparent pointer-events-none" />

          {/* Avatar */}
          <div className="relative shrink-0 flex items-center justify-center">
            <Avatar4DFrame
              avatarUrl={currentUser.avatar}
              frameId={currentUser.activeFrameId}
              customFrameUrl={currentUser.customFrameUrl}
              isOwner={isUserOwner(currentUser)}
              size={48}
              onClick={onOpenFrames}
            />
            <label
              className="absolute -bottom-1 -left-1 p-0.5 bg-amber-500 text-slate-950 rounded-full font-black text-[8px] shadow cursor-pointer border border-slate-900 z-10"
              title="تغيير الصورة"
            >
              <Camera className="w-2.5 h-2.5" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 8 * 1024 * 1024) {
                    alert('حجم الصورة كبير، يرجى اختيار صورة أقل من 8 ميجابايت');
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = async (ev) => {
                    const base64Url = ev.target?.result as string;
                    if (!base64Url) return;
                    try {
                      const updated = await API.updateUser(currentUser.id, { avatar: base64Url });
                      onUserUpdated(updated);
                      try {
                        localStorage.setItem('currentUser', JSON.stringify(updated));
                        localStorage.setItem('hekawy_current_user', JSON.stringify(updated));
                      } catch {}
                    } catch {
                      alert('تعذر تحديث الصورة الشخصية');
                    }
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>

          {/* User Details */}
          <div className="flex flex-col min-w-0 flex-1 justify-center">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="font-extrabold text-xs sm:text-sm text-slate-100 truncate max-w-[130px] sm:max-w-[170px]">
                {currentUser.name}
              </h2>
              <UserRoleBadges user={currentUser} size="xs" />
            </div>

            {/* ID & Gender */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentUser.numericId || currentUser.id);
                  setCopiedNumericId(true);
                  setTimeout(() => setCopiedNumericId(false), 2000);
                }}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-800 border border-amber-500/30 text-[9.5px] font-mono text-amber-200 transition-all cursor-pointer"
                title="نسخ المعرف"
              >
                <span className="text-amber-400 font-extrabold">ID:</span>
                <span className="font-bold tracking-wide">{currentUser.numericId || currentUser.id}</span>
                {copiedNumericId ? (
                  <span className="text-[8px] text-emerald-400 font-bold bg-emerald-500/20 px-0.5 rounded">تم</span>
                ) : (
                  <Copy className="w-2.5 h-2.5 text-slate-400" />
                )}
              </button>

              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {(currentUser.gender || 'MALE') === 'FEMALE' ? '🔴 أنثى' : '🔵 ذكر'}
              </span>
            </div>
          </div>

          {/* Edit Profile Button */}
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-all active:scale-95 cursor-pointer shrink-0"
            title="تعديل البيانات"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Compact Balance Bar */}
        <div className="bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 text-slate-950 rounded-xl px-3 py-1.5 border border-amber-300 shadow-md flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Coins className="w-4 h-4 text-amber-700 shrink-0" />
            <div className="flex items-center gap-1 font-black text-xs text-slate-950 truncate">
              <span>{currentUser.coins.toLocaleString('ar-EG')}</span>
              <span className="text-[9px] text-amber-900 font-bold">كوينز</span>
              <span className="text-[9px] text-amber-900 font-bold mx-0.5">|</span>
              <span>{currentUser.diamonds.toLocaleString('ar-EG')} 💎</span>
            </div>
          </div>

          <button
            onClick={onOpenWallet}
            className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 text-amber-300 font-black text-[10px] rounded-lg shadow active:scale-95 transition-all cursor-pointer border border-amber-400/40 shrink-0"
          >
            شحن +
          </button>
        </div>
      </div>

      {/* ==================== 2. PROMINENT 2x2 MAIN CATEGORY GRID ==================== */}
      <div className="flex-1 my-2 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="grid grid-cols-2 gap-3.5 w-full">

          {/* 1. المتجر والعتاد */}
          <button
            onClick={() => setActiveSheet('store_equipment')}
            className="group bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-900 border-2 border-amber-500/50 hover:border-amber-400 p-4 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center transition-all duration-200 active:scale-95 cursor-pointer min-h-[120px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/10">
              🛍️
            </div>
            <h3 className="font-extrabold text-xs sm:text-sm text-amber-200">المتجر والعتاد</h3>
            <p className="text-[9px] text-amber-300/70 mt-1 font-medium">
              المتجر، الحقيبة، الهدايا، VIP
            </p>
          </button>

          {/* 2. الوكالة والشحن */}
          <button
            onClick={() => setActiveSheet('agency_recharge')}
            className="group bg-gradient-to-br from-blue-950/70 via-slate-900 to-slate-900 border-2 border-blue-500/50 hover:border-blue-400 p-4 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center transition-all duration-200 active:scale-95 cursor-pointer min-h-[120px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/10">
              🏛️
            </div>
            <h3 className="font-extrabold text-xs sm:text-sm text-blue-200">الوكالة والشحن</h3>
            <p className="text-[9px] text-blue-300/70 mt-1 font-medium">
              الوكالة، وكيل الشحن، الشحن
            </p>
          </button>

          {/* 3. التوثيق والأنشطة */}
          <button
            onClick={() => setActiveSheet('verification_activities')}
            className="group bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border-2 border-emerald-500/50 hover:border-emerald-400 p-4 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center transition-all duration-200 active:scale-95 cursor-pointer min-h-[120px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/10">
              🛡️
            </div>
            <h3 className="font-extrabold text-xs sm:text-sm text-emerald-200">التوثيق والأنشطة</h3>
            <p className="text-[9px] text-emerald-300/70 mt-1 font-medium">
              التوثيق الحي، الهوية، الفعاليات
            </p>
          </button>

          {/* 4. الإعدادات والأمان */}
          <button
            onClick={() => setActiveSheet('settings_security')}
            className="group bg-gradient-to-br from-purple-950/70 via-slate-900 to-slate-900 border-2 border-purple-500/50 hover:border-purple-400 p-4 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center transition-all duration-200 active:scale-95 cursor-pointer min-h-[120px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/10">
              ⚙️
            </div>
            <h3 className="font-extrabold text-xs sm:text-sm text-purple-200">الإعدادات والأمان</h3>
            <p className="text-[9px] text-purple-300/70 mt-1 font-medium">
              تبديل الحساب، التقديم، الخروج
            </p>
          </button>

        </div>
      </div>

      {/* ==================== 3. ULTRA-COMPACT FOOTER LINKS ==================== */}
      <div className="shrink-0 flex items-center justify-around px-2 py-1 border-t border-slate-800/80 text-[10px] text-slate-400 font-bold">
        <button onClick={() => setLegalModal('privacy')} className="hover:text-amber-300 transition-colors">🔒 الخخصوصية</button>
        <span>•</span>
        <button onClick={() => setLegalModal('terms')} className="hover:text-amber-300 transition-colors">📜 الشروط</button>
        <span>•</span>
        <button onClick={() => setProfileSubView('level')} className="hover:text-amber-300 transition-colors">🏅 المستويات</button>
        <span>•</span>
        <button onClick={() => setLegalModal('support')} className="hover:text-amber-300 transition-colors">💬 الدعم</button>
      </div>

      {/* ==================== 4. INTERACTIVE POPUP BOTTOM SHEETS ==================== */}

      {/* BOTTOM SHEET 1: المتجر والعتاد */}
      {activeSheet === 'store_equipment' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end justify-center animate-in fade-in duration-150">
          <div className="bg-slate-900 border-t-2 border-amber-500/60 rounded-t-3xl w-full max-w-md p-5 text-right flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom duration-200 dir-rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛍️</span>
                <h3 className="font-black text-sm text-amber-300">المتجر والعتاد والتزيينات</h3>
              </div>
              <button
                onClick={() => setActiveSheet(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  setActiveSheet(null);
                  onOpenFrames();
                }}
                className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-amber-500/30 flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">🏬</div>
                <div className="flex flex-col text-right min-w-0">
                  <span className="font-black text-xs text-slate-100 truncate">المتجر الرسمي</span>
                  <span className="text-[9px] text-slate-400 truncate">إطارات ودخلات ملكية</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveSheet(null);
                  setProfileSubView('frames');
                }}
                className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-amber-500/30 flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">🎒</div>
                <div className="flex flex-col text-right min-w-0">
                  <span className="font-black text-xs text-slate-100 truncate">حقيبة الظهر</span>
                  <span className="text-[9px] text-slate-400 truncate">تجهيزاتك الحالية</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveSheet(null);
                  onOpenWallet();
                }}
                className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-amber-500/30 flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">🎁</div>
                <div className="flex flex-col text-right min-w-0">
                  <span className="font-black text-xs text-slate-100 truncate">معرض الهدايا</span>
                  <span className="text-[9px] text-slate-400 truncate">قائمة الهدايا الثمينة</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveSheet(null);
                  onOpenFrames();
                }}
                className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-amber-500/30 flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">👑</div>
                <div className="flex flex-col text-right min-w-0">
                  <span className="font-black text-xs text-slate-100 truncate">مميزات VIP</span>
                  <span className="text-[9px] text-slate-400 truncate">تفعيل الشارات والشرف</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM SHEET 2: الوكالة والشحن */}
      {activeSheet === 'agency_recharge' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end justify-center animate-in fade-in duration-150">
          <div className="bg-slate-900 border-t-2 border-blue-500/60 rounded-t-3xl w-full max-w-md p-5 text-right flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom duration-200 dir-rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏛️</span>
                <h3 className="font-black text-sm text-blue-300">الوكالة وخدمات الشحن</h3>
              </div>
              <button
                onClick={() => setActiveSheet(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setActiveSheet(null);
                  if (currentUser.role === 'AGENT' && onOpenAgentDashboard) onOpenAgentDashboard();
                  else if (onOpenAgentApply) onOpenAgentApply();
                }}
                className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-blue-500/30 flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">🏛️</div>
                  <div className="flex flex-col text-right">
                    <span className="font-black text-xs text-slate-100">مركز الوكالة والمضيفين</span>
                    <span className="text-[10px] text-slate-400">
                      {currentUser.role === 'AGENT' ? 'دخول لوحة إدارة الوكالة' : 'التقديم لتأسيس وكالة جديدة'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-400">فتح ←</span>
              </button>

              {onOpenShippingAgent && (isOwner || currentUser.role === 'AGENT' || currentUser.isShippingAgent) && (
                <button
                  onClick={() => {
                    setActiveSheet(null);
                    onOpenShippingAgent();
                  }}
                  className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-amber-500/30 flex items-center justify-between transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">💎</div>
                    <div className="flex flex-col text-right">
                      <span className="font-black text-xs text-amber-300">مركز وكيل الشحن المعتمد</span>
                      <span className="text-[10px] text-slate-400">شحن باقات الكوينز والماسات الفورية للمستخدمين</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-400">دخول ←</span>
                </button>
              )}

              <button
                onClick={() => {
                  setActiveSheet(null);
                  onOpenWallet();
                }}
                className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-emerald-500/30 flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">💳</div>
                  <div className="flex flex-col text-right">
                    <span className="font-black text-xs text-slate-100">شحن الكوينز والماسات</span>
                    <span className="text-[10px] text-slate-400">باقات الرصيد الفوري والعروض المتاحة</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400">شحن ←</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM SHEET 3: التوثيق والأنشطة */}
      {activeSheet === 'verification_activities' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end justify-center animate-in fade-in duration-150">
          <div className="bg-slate-900 border-t-2 border-emerald-500/60 rounded-t-3xl w-full max-w-md p-5 text-right flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom duration-200 dir-rtl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <h3 className="font-black text-sm text-emerald-300">التوثيق والأنشطة والفعاليات</h3>
              </div>
              <button
                onClick={() => setActiveSheet(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <UserVerificationSection
                currentUser={currentUser}
                onUserUpdated={onUserUpdated}
              />

              <button
                onClick={() => {
                  setActiveSheet(null);
                  onOpenTasks();
                }}
                className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-emerald-500/30 flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">🚩</div>
                  <div className="flex flex-col text-right">
                    <span className="font-black text-xs text-slate-100">مركز الفعاليات والمهام اليومية</span>
                    <span className="text-[10px] text-slate-400">إنجاز المهام اليومية وحصد المكافآت المجانية</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400">عرض ←</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM SHEET 4: الإعدادات والأمان */}
      {activeSheet === 'settings_security' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end justify-center animate-in fade-in duration-150">
          <div className="bg-slate-900 border-t-2 border-purple-500/60 rounded-t-3xl w-full max-w-md p-5 text-right flex flex-col gap-3.5 shadow-2xl animate-in slide-in-from-bottom duration-200 dir-rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚙️</span>
                <h3 className="font-black text-sm text-purple-300">الإعدادات والأمان والحساب</h3>
              </div>
              <button
                onClick={() => setActiveSheet(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  setActiveSheet(null);
                  if (onOpenSwitchAccount) onOpenSwitchAccount();
                  else onOpenAuth();
                }}
                className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-purple-500/30 flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">👤</div>
                <div className="flex flex-col text-right min-w-0">
                  <span className="font-black text-xs text-slate-100 truncate">تبديل الحساب</span>
                  <span className="text-[9.5px] text-slate-400 truncate">إدارة الحسابات</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveSheet(null);
                  if (currentUser.role === 'HOST' && onOpenHostDashboard) onOpenHostDashboard();
                  else if (onOpenHostApply) onOpenHostApply();
                }}
                className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-purple-500/30 flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">🎙️</div>
                <div className="flex flex-col text-right min-w-0">
                  <span className="font-black text-xs text-slate-100 truncate">تقديم كمضيف</span>
                  <span className="text-[9.5px] text-slate-400 truncate">
                    {currentUser.role === 'HOST' ? 'لوحة المضيف' : 'الطلب والموافقة'}
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveSheet(null);
                  setIsEditing(true);
                }}
                className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-purple-500/30 flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">✏️</div>
                <div className="flex flex-col text-right min-w-0">
                  <span className="font-black text-xs text-slate-100 truncate">تعديل البيانات</span>
                  <span className="text-[9.5px] text-slate-400 truncate">الاسم والصورة والنبذة</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveSheet(null);
                  setLegalModal('privacy');
                }}
                className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-purple-500/30 flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">🔒</div>
                <div className="flex flex-col text-right min-w-0">
                  <span className="font-black text-xs text-slate-100 truncate">الشروط والخصوصية</span>
                  <span className="text-[9.5px] text-slate-400 truncate">أمان الحساب والدعم</span>
                </div>
              </button>
            </div>

            <button
              onClick={() => {
                setActiveSheet(null);
                setShowLogoutConfirm(true);
              }}
              className="mt-1 w-full py-2.5 rounded-2xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج من الحساب</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================== 5. GLOBAL MODALS ==================== */}

      {/* Legal & Support Modals */}
      <LegalSupportModals
        type={legalModal}
        onClose={() => setLegalModal(null)}
        currentUser={currentUser}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-center" dir="rtl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-100">تسجيل الخروج</h3>
              <p className="text-xs text-slate-400 mt-1">هل أنت متأكد من رغبتك في تسجيل الخروج من حسابك؟</p>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  if (onLogout) {
                    onLogout();
                  } else {
                    onOpenAuth();
                  }
                }}
                className="py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 cursor-pointer"
              >
                نعم، خروج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-100">تعديل الملف الشخصي</h3>
                  <p className="text-[11px] text-slate-400">تحديث الاسم المستعار، الصورة الشخصية والنبذة</p>
                </div>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center gap-3">
                <span className="text-xs font-extrabold text-amber-300">معاينة الصورة داخل الإطار الملكي 👑</span>
                <Avatar4DFrame
                  avatarUrl={avatar}
                  frameId={currentUser.activeFrameId || 'frame_king'}
                  customFrameUrl={currentUser.customFrameUrl}
                  size="xl"
                  showEffects={true}
                  isOwner={isOwner || currentUser.role === 'ADMIN'}
                />

                <label className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-md shadow-amber-500/20">
                  <Upload className="w-4 h-4" />
                  <span>رفع صورة جديدة من الهاتف 🖼️</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 8 * 1024 * 1024) {
                        alert('حجم الصورة كبير، يرجى اختيار صورة أقل من 8 ميجابايت');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const base64Url = ev.target?.result as string;
                        if (base64Url) setAvatar(base64Url);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الاسم المستعار</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={24}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">النبذة الشخصية (Bio)</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={120}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:border-amber-400 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">الجنس (النوع)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={currentUser.isVerified}
                    onClick={() => setGender('MALE')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                      gender === 'MALE'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-md shadow-blue-500/20'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>🔵 ذكر</span>
                  </button>

                  <button
                    type="button"
                    disabled={currentUser.isVerified}
                    onClick={() => setGender('FEMALE')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                      gender === 'FEMALE'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-500/20'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>🔴 أنثى</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
