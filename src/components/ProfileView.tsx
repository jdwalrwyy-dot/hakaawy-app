import React, { useState } from 'react';
import { User, isUserOwner } from '../types';
import { API } from '../services/api';
import { RoleBadge, UserRoleBadges } from './RoleBadge';
import { LegalSupportModals, LegalModalType } from './LegalSupportModals';
import { AccountSettingsModal } from './AccountSettingsModal';
import { LevelProgressCard } from './LevelProgressCard';
import { Avatar4DFrame } from './Avatar4DFrame';
import {
  User as UserIcon,
  Crown,
  Coins,
  Gem,
  Sparkles,
  Share2,
  Copy,
  Check,
  Edit3,
  CreditCard,
  Shield,
  LogOut,
  X,
  CheckCircle2,
  Award,
  Mic,
  Briefcase,
  Building,
  Target,
  Trophy,
  Sliders,
  Upload,
  Camera
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

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onUserUpdated,
  onOpenWallet,
  onOpenTasks,
  onOpenFrames,
  onOpenEntrances,
  onOpenAdmin,
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
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [copiedNumericId, setCopiedNumericId] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [legalModal, setLegalModal] = useState<LegalModalType | null>(null);
  const [profileSubView, setProfileSubView] = useState<'profile' | 'settings' | 'frames'>('profile');

  const isOwner = isUserOwner(currentUser);

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

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(currentUser.referralCode || currentUser.username);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  // Dedicated Settings/Frames Sub-Page isolated from any chat/external routes
  if (profileSubView === 'settings' || profileSubView === 'frames') {
    return (
      <div className="max-w-2xl mx-auto p-4 animate-in fade-in duration-150">
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

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col gap-4">
      {/* Profile Header Card */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-5 overflow-hidden shadow-2xl flex flex-col gap-4">
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-600/20 pointer-events-none" />

        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative w-20 h-20 rounded-full border-2 border-amber-400 p-0.5 shadow-xl bg-slate-950 group">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-full h-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
              
              {/* Camera Overlay Button for Avatar Update */}
              <label
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-amber-300"
                title="تغيير الصورة الشخصية"
              >
                <Camera className="w-6 h-6 drop-shadow-md" />
                <span className="text-[8px] font-black mt-0.5 text-white">تغيير</span>
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

              {/* Direct Quick-Camera Badge Button */}
              <label
                className="absolute -top-1 -left-1 p-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full font-black text-[10px] flex items-center justify-center cursor-pointer shadow-lg active:scale-90 transition-all border border-slate-900 z-10"
                title="رفع صورة جديدة من الهاتف"
              >
                <Camera className="w-3.5 h-3.5" />
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

              <span className="absolute -bottom-1 -right-1 p-1 bg-amber-400 text-slate-950 rounded-full font-black text-[10px] flex items-center gap-0.5 shadow-md">
                <Crown className="w-3 h-3" />
                <span>Lv.{currentUser.level}</span>
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <UserRoleBadges user={currentUser} size="sm" />
                <h2 className="font-extrabold text-lg text-slate-100">{currentUser.name}</h2>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    (currentUser.gender || 'MALE') === 'FEMALE'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  }`}
                >
                  <span className="text-xs">{(currentUser.gender || 'MALE') === 'FEMALE' ? '🔴' : '🔵'}</span>
                  <span>{(currentUser.gender || 'MALE') === 'FEMALE' ? 'أنثى' : 'ذكر'}</span>
                </span>
                <UserRoleBadges user={currentUser} size="sm" mode="pills" />
              </div>
              <div className="flex items-center gap-2 flex-wrap my-1">
                <span className="text-xs text-slate-400 font-mono">@{currentUser.username}</span>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentUser.numericId || currentUser.id);
                    setCopiedNumericId(true);
                    setTimeout(() => setCopiedNumericId(false), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-slate-800/90 border border-amber-500/30 hover:border-amber-400/60 text-xs font-mono text-slate-200 transition-all cursor-pointer shadow-sm group"
                  title="انقر لنسخ الـ ID الرقمي"
                >
                  <span className="text-amber-400 font-extrabold flex items-center gap-1">
                    {currentUser.isVipNumericId && <Crown className="w-3 h-3 text-amber-400 animate-pulse" />}
                    <span>ID:</span>
                  </span>
                  <span className="font-extrabold text-amber-200 tracking-wider font-mono">{currentUser.numericId || currentUser.id}</span>
                  {copiedNumericId ? (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 bg-emerald-500/20 px-1 py-0.2 rounded">
                      <Check className="w-2.5 h-2.5" /> تم النسخ
                    </span>
                  ) : (
                    <Copy className="w-2.5 h-2.5 text-slate-400 group-hover:text-amber-300 transition-colors" />
                  )}
                </button>
              </div>
              {currentUser.email && (
                <div className="flex items-center gap-1 mt-1 text-[11px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20 w-fit">
                  <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span className="font-mono text-[10px]">{currentUser.email}</span>
                </div>
              )}
              <p className="text-xs text-slate-300 mt-1 max-w-sm">{currentUser.bio || 'مستخدم مميز في تطبيق حكاوي 🎙️'}</p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-700/60 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تعديل</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800">
          <div
            onClick={onOpenWallet}
            className="bg-slate-800/60 hover:bg-slate-800 p-3 rounded-2xl cursor-pointer border border-slate-700/60 transition-all flex flex-col items-center justify-center"
          >
            <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
              <Coins className="w-3.5 h-3.5" />
              <span>الكونز</span>
            </div>
            <span className="text-base font-black text-slate-100 mt-0.5">
              {currentUser.coins.toLocaleString('ar-EG')}
            </span>
          </div>

          <div
            onClick={onOpenWallet}
            className="bg-slate-800/60 hover:bg-slate-800 p-3 rounded-2xl cursor-pointer border border-slate-700/60 transition-all flex flex-col items-center justify-center"
          >
            <div className="flex items-center gap-1 text-sky-400 text-xs font-bold">
              <Gem className="w-3.5 h-3.5" />
              <span>الماسات</span>
            </div>
            <span className="text-base font-black text-slate-100 mt-0.5">
              {currentUser.diamonds.toLocaleString('ar-EG')}
            </span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>المستوى</span>
            </div>
            <span className="text-base font-black text-slate-100 mt-0.5">
              {currentUser.level}
            </span>
          </div>

          <div
            onClick={handleCopyReferral}
            className="bg-slate-800/60 hover:bg-slate-800 p-3 rounded-2xl cursor-pointer border border-slate-700/60 transition-all flex flex-col items-center justify-center"
            title="كود الدعوة الخاص بك"
          >
            <div className="flex items-center gap-1 text-purple-400 text-xs font-bold">
              <Share2 className="w-3.5 h-3.5" />
              <span>كود الإحالة</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-200 mt-0.5">
              <span>{currentUser.referralCode}</span>
              {copiedReferral ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </div>
          </div>
        </div>
      </div>

      {/* Level & XP Progress Card */}
      <LevelProgressCard
        exp={currentUser.exp || 0}
        level={currentUser.level || 1}
        onOpenFrames={() => setProfileSubView('frames')}
      />

      {/* Shortcuts & Action Rows */}
      <div className="flex flex-col gap-2.5">
        <button
          onClick={onOpenWallet}
          className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-right">
              <span className="font-bold text-xs text-slate-100">محفظة الكونز والماسات</span>
              <span className="text-[11px] text-slate-400">
                {isOwner ? 'إدارة وشحن الأرصدة الفورية' : 'عرض الأرصدة وتحويل الكونز لماسات'}
              </span>
            </div>
          </div>
          <span className="text-xs text-amber-400 font-bold">عرض ←</span>
        </button>

        {/* خيار "إطارات الصور" داخل حسابي */}
        <button
          id="profile-avatar-frames-btn"
          type="button"
          onClick={() => setProfileSubView('frames')}
          className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 flex items-center justify-between transition-all cursor-pointer group shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex flex-col text-right">
              <span className="font-bold text-xs text-slate-100">إطارات الصور الشخصية (4D)</span>
              <span className="text-[11px] text-slate-400">تخصيص ومعاينة إطارات الصورة الشخصية</span>
            </div>
          </div>
          <span className="text-xs text-amber-400 font-bold">عرض ←</span>
        </button>

        {/* خيار "الضبط" داخل حسابي (الدخلات والإطارات) */}
        <button
          id="profile-settings-btn"
          type="button"
          onClick={() => setProfileSubView('settings')}
          className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 flex items-center justify-between transition-all cursor-pointer group shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
              <Sliders className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-right">
              <span className="font-bold text-xs text-slate-100">الضبط والدخلات</span>
              <span className="text-[11px] text-slate-400">تخصيص الدخلات ثلاثية الأبعاد وإعدادات الحساب</span>
            </div>
          </div>
          <span className="text-xs text-amber-400 font-bold">عرض ←</span>
        </button>

        {/* Host & Agency Career Section */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 flex flex-col gap-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>نظام المضيفين والوكالات والتارجت</span>
            </span>
            <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold">
              أرباح وعمولات معتمدة
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Shipping Agent Button (مخفي ومتاح حصرياً للمالك العام أثناء تعطيل الشحن) */}
            {isOwner && onOpenShippingAgent && (
              <button
                onClick={onOpenShippingAgent}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/25 via-yellow-500/15 to-slate-900 border border-amber-500/50 hover:border-amber-400 flex items-center justify-between transition-all group col-span-1 sm:col-span-2 shadow-lg shadow-amber-500/10 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Gem className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex flex-col text-right">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-amber-300 group-hover:text-amber-200">وكيل الشحن</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                        رصيدك: {(currentUser.diamonds || 0).toLocaleString()} 💎
                      </span>
                    </div>
                    <span className="text-[11px] text-amber-200/80 mt-0.5">شحن وتحويل باقات الماسات الفورية لحسابات المستخدمين</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-400 font-extrabold bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 group-hover:bg-amber-500/20">
                  <span>شحن مستخدم</span>
                  <span>←</span>
                </div>
              </button>
            )}

            {/* Host Button (Dashboard or Application) */}
            {currentUser.role === 'HOST' ? (
              <button
                onClick={onOpenHostDashboard}
                className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 hover:border-amber-400 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Target className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="font-bold text-xs text-white group-hover:text-amber-300">لوحة المضيف والتارجت</span>
                    <span className="text-[10px] text-amber-300/80">متابعة الساعات والماسات والمكافأة</span>
                  </div>
                </div>
                <span className="text-xs text-amber-400 font-bold">دخول ←</span>
              </button>
            ) : (
              <button
                onClick={onOpenHostApply}
                className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-amber-500/40 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="font-bold text-xs text-slate-100 group-hover:text-amber-300">التسجيل كمضيف معتمد</span>
                    <span className="text-[10px] text-slate-400">ابدأ البث وحقق تارجت شهري</span>
                  </div>
                </div>
                <span className="text-xs text-amber-400 font-bold">تقديم ←</span>
              </button>
            )}

            {/* Agent Button (Dashboard or Application) */}
            {currentUser.role === 'AGENT' ? (
              <button
                onClick={onOpenAgentDashboard}
                className="p-3 rounded-2xl bg-gradient-to-r from-blue-500/20 to-indigo-500/10 border border-blue-500/40 hover:border-blue-400 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    <Building className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="font-bold text-xs text-white group-hover:text-blue-300">لوحة إدارة الوكالة</span>
                    <span className="text-[10px] text-blue-300/80">متابعة المضيفين وأرباح العمولة</span>
                  </div>
                </div>
                <span className="text-xs text-blue-400 font-bold">دخول ←</span>
              </button>
            ) : (
              <button
                onClick={onOpenAgentApply}
                className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-blue-500/40 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="font-bold text-xs text-slate-100 group-hover:text-blue-300">التسجيل كوكيل رسمي</span>
                    <span className="text-[10px] text-slate-400">أسس وكالتك واستقطب المضيفين</span>
                  </div>
                </div>
                <span className="text-xs text-blue-400 font-bold">تقديم ←</span>
              </button>
            )}
          </div>
        </div>

        <button
          onClick={onOpenTasks}
          className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-right">
              <span className="font-bold text-xs text-slate-100">المهام اليومية والمكافآت</span>
              <span className="text-[11px] text-slate-400">احصل على كونز مجانية بإتمام مهامك</span>
            </div>
          </div>
          <span className="text-xs text-emerald-400 font-bold">المهام ←</span>
        </button>

        {/* Switch Account and Logout Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          <button
            onClick={() => onOpenSwitchAccount ? onOpenSwitchAccount() : onOpenAuth()}
            className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 flex items-center justify-between text-slate-300 hover:text-slate-100 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <UserIcon className="w-5 h-5 text-amber-400" />
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-white">تبديل الحساب</span>
                <span className="text-[10px] text-slate-400">التنقل بين حسابات الجهاز المحفوظة</span>
              </div>
            </div>
            <span className="text-xs text-amber-400 font-bold">تبديل ←</span>
          </button>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="p-3.5 rounded-2xl bg-slate-900 border border-rose-900/30 hover:border-rose-700/60 flex items-center justify-between text-rose-400 hover:text-rose-300 transition-all"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-rose-400" />
              <span className="text-xs font-bold">تسجيل الخروج</span>
            </div>
            <span className="text-[11px] text-rose-400">خروج ←</span>
          </button>
        </div>

        {/* Legal & Support Links Grid */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col gap-2">
          <span className="text-[11px] font-bold text-slate-400 px-1">اللوائح والسياسات والدعم</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setLegalModal('privacy')}
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 text-slate-300 hover:text-blue-400 text-center flex flex-col items-center gap-1 transition-all"
            >
              <span className="text-sm">🔒</span>
              <span className="text-[11px] font-bold">الخصوصية</span>
            </button>

            <button
              onClick={() => setLegalModal('terms')}
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-400 text-center flex flex-col items-center gap-1 transition-all"
            >
              <span className="text-sm">📜</span>
              <span className="text-[11px] font-bold">شروط الاستخدام</span>
            </button>

            <button
              onClick={() => setLegalModal('guidelines')}
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 text-center flex flex-col items-center gap-1 transition-all"
            >
              <span className="text-sm">🛡️</span>
              <span className="text-[11px] font-bold">قواعد المجتمع</span>
            </button>

            <button
              onClick={() => setLegalModal('support')}
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 text-center flex flex-col items-center gap-1 transition-all"
            >
              <span className="text-sm">💬</span>
              <span className="text-[11px] font-bold">الدعم الفني</span>
            </button>
          </div>
        </div>
      </div>

      {/* Legal & Support Modals */}
      <LegalSupportModals
        type={legalModal}
        onClose={() => setLegalModal(null)}
        currentUser={currentUser}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-center">
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
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
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
                className="py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20"
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
                  <h3 className="font-extrabold text-sm text-slate-100">تعديل الملف الشخصي (Edit Profile)</h3>
                  <p className="text-[11px] text-slate-400">تحديث الاسم المستعار، الصورة الشخصية والنبذة</p>
                </div>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
              {/* Live Frame Preview & Phone Avatar Upload Button */}
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
                <p className="text-[10px] text-slate-400 text-center">اختر أي صورة من الهاتف وستنزل فوراً داخل الإطار</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الاسم المستعار (Display Name)</label>
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
                <label className="block text-xs font-bold text-slate-300 mb-1">النبذة الشخصية (Bio / الحالة)</label>
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
                    onClick={() => setGender('MALE')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                      gender === 'MALE'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-md shadow-blue-500/20'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>🔵</span>
                    <span>ذكر (Male)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGender('FEMALE')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                      gender === 'FEMALE'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-500/20'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>🔴</span>
                    <span>أنثى (Female)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 cursor-pointer"
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
