import React, { useState, useEffect } from 'react';
import { PublicUserProfile, User, RoomSeat, UserRole } from '../types';
import { API } from '../services/api';
import { RoleBadge, UserRoleBadges } from './RoleBadge';
import { AccountSettingsModal } from './AccountSettingsModal';
import { LevelProgressCard } from './LevelProgressCard';
import {
  X,
  UserPlus,
  UserCheck,
  Heart,
  MessageSquare,
  Gift,
  AlertTriangle,
  Mic,
  MicOff,
  UserX,
  VolumeX,
  Radio,
  Clock,
  Sparkles,
  Send,
  Check,
  Copy,
  ShieldAlert,
  Crown,
  Sliders
} from 'lucide-react';

interface PublicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  currentUser: User;
  roomId?: string;
  roomSeats?: RoomSeat[];
  isCurrentHost?: boolean;
  onSendGiftToUser?: (userId: string) => void;
  onHostSeatAction?: (action: 'mute_seat' | 'kick_seat' | 'lock_seat', seat: RoomSeat) => void;
  onOpenReport?: (targetType: 'USER', targetId: string, targetName: string) => void;
  onUserUpdated?: (user: User) => void;
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({
  isOpen,
  onClose,
  userId,
  currentUser,
  roomId,
  roomSeats = [],
  isCurrentHost = false,
  onSendGiftToUser,
  onHostSeatAction,
  onOpenReport,
  onUserUpdated
}) => {
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Interactive social state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [friendshipStatus, setFriendshipStatus] = useState<'NONE' | 'PENDING' | 'ACCEPTED'>('NONE');
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // Quick DM mini state
  const [showQuickDm, setShowQuickDm] = useState(false);
  const [dmText, setDmText] = useState('');
  const [dmSent, setDmSent] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedNumericId, setCopiedNumericId] = useState(false);

  const handleCopyNumericId = () => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.numericId || profile.id);
    setCopiedNumericId(true);
    setTimeout(() => setCopiedNumericId(false), 2000);
  };

  // Owner Role Management
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [roleUpdateMsg, setRoleUpdateMsg] = useState<string | null>(null);

  // Fetch public user data
  useEffect(() => {
    if (!isOpen || !userId) {
      setProfile(null);
      setError(null);
      setShowQuickDm(false);
      setDmSent(false);
      setIsRoleMenuOpen(false);
      setRoleUpdateMsg(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    API.getPublicUser(userId, currentUser.id)
      .then(data => {
        if (isMounted) {
          setProfile(data);
          setIsFollowing(Boolean(data.isFollowing));
          setFollowersCount(data.followersCount || 0);
          setFriendshipStatus(data.friendshipStatus || 'NONE');
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err.message || 'تعذر تحميل الملف العام للمستخدم');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId, currentUser.id]);

  if (!isOpen || !userId) return null;

  const isSelf = currentUser.id === userId;
  const isOwner = currentUser.role === 'OWNER';

  // Find seat if user is on mic
  const userSeat = roomSeats.find(s => s.userId === userId);

  // Handle Follow / Unfollow
  const handleToggleFollow = async () => {
    if (isSelf || isActionLoading || !profile) return;
    setIsActionLoading(true);
    try {
      const res = await API.toggleFollow(currentUser.id, profile.id);
      setIsFollowing(res.isFollowing);
      setFollowersCount(prev => res.isFollowing ? prev + 1 : Math.max(0, prev - 1));
    } catch {
      alert('حدث خطأ أثناء تحديث المتابعة');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Friend Request
  const handleSendFriendRequest = async () => {
    if (isSelf || isActionLoading || !profile || friendshipStatus !== 'NONE') return;
    setIsActionLoading(true);
    try {
      const res = await API.sendFriendRequest(currentUser.id, profile.id);
      if (res.success) {
        setFriendshipStatus('PENDING');
      }
    } catch (err: any) {
      alert(err.message || 'تعذر إرسال طلب الصداقة');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Quick DM
  const handleSendQuickDm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dmText.trim() || !profile) return;
    setIsActionLoading(true);
    try {
      await API.sendPrivateMessage(currentUser.id, profile.id, dmText.trim());
      setDmSent(true);
      setDmText('');
      setTimeout(() => {
        setDmSent(false);
        setShowQuickDm(false);
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'فشل إرسال الرسالة');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Role Change (Owner Only)
  const handleChangeRole = async (newRole: UserRole) => {
    if (!isOwner || !profile) return;
    try {
      const res = await API.updateUserRole(currentUser.id, profile.id, newRole);
      if (res.success) {
        setProfile(prev => prev ? { ...prev, role: newRole } : null);
        setRoleUpdateMsg(`تم تحديث الرتبة إلى ${newRole} بنجاح!`);
        setTimeout(() => setRoleUpdateMsg(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'فشل تعديل الرتبة');
    }
  };

  const handleCopyId = () => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.username || profile.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal / Bottom Sheet Card */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 sm:border-slate-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-slate-950 overflow-hidden z-10 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-250">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">الملف العام للمستخدم</span>
            {profile && (
              <button
                onClick={handleCopyId}
                className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-amber-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700"
                title="نسخ اسم المستخدم"
              >
                <span>@{profile.username}</span>
                {copiedId ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {!isSelf && profile && onOpenReport && (
              <button
                onClick={() => onOpenReport('USER', profile.id, profile.name)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="إبلاغ عن المستخدم"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex flex-col gap-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <span className="text-xs text-slate-400 font-semibold">جاري تحميل بيانات الملف الشخصي...</span>
            </div>
          ) : error || !profile ? (
            <div className="py-8 text-center flex flex-col items-center gap-2">
              <ShieldAlert className="w-10 h-10 text-rose-400" />
              <p className="text-xs text-rose-300 font-bold">{error || 'المستخدم غير متاح'}</p>
            </div>
          ) : (
            <>
              {/* Profile Main Header: Avatar + Info */}
              <div className="flex items-center gap-3.5">
                {/* Avatar with active frame & online dot */}
                <div className="relative shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-lg shadow-amber-500/10">
                    <img
                      src={profile.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}`}
                      alt={profile.name}
                      className="w-full h-full rounded-full object-cover bg-slate-800"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Online dot indicator */}
                  <span
                    className={`absolute bottom-0 right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                      profile.isOnline ? 'bg-emerald-500 shadow-md shadow-emerald-500/50' : 'bg-slate-500'
                    }`}
                    title={profile.isOnline ? 'متصل الآن' : 'غير متصل'}
                  />
                </div>

                {/* Name, Role & Level */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <UserRoleBadges user={profile} size="sm" />
                    <h2 className="font-extrabold text-base sm:text-lg text-slate-100 truncate">
                      {profile.name}
                    </h2>

                    {/* Gender Badge Indicator */}
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        profile.gender === 'female'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`}
                      title={profile.gender === 'female' ? 'أنثى 🔴' : 'ذكر 🔵'}
                    >
                      <span>{profile.gender === 'female' ? '🔴 أنثى' : '🔵 ذكر'}</span>
                    </span>
                  </div>

                  {/* Username & Numeric ID */}
                  <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400 font-mono my-0.5">
                    <span>@{profile.username}</span>
                    <button
                      onClick={handleCopyNumericId}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-800/90 border border-amber-500/30 hover:border-amber-400/60 text-[11px] font-mono text-slate-200 transition-all cursor-pointer shadow-sm group"
                      title="انقر لنسخ الـ ID الرقمي"
                    >
                      <span className="text-amber-400 font-extrabold flex items-center gap-1">
                        {profile.isVipNumericId && <Crown className="w-3 h-3 text-amber-400 animate-pulse" />}
                        <span>ID:</span>
                      </span>
                      <span className="font-extrabold text-amber-200 tracking-wider font-mono">{profile.numericId || profile.id}</span>
                      {copiedNumericId ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400 group-hover:text-amber-300 transition-colors" />
                      )}
                    </button>
                  </div>

                  {/* Badges: Level & Role */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <RoleBadge role={profile.role} size="md" />

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-black">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>المستوى {profile.level}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* In-Room Status Indicator */}
              {userSeat ? (
                <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="text-xs font-bold text-amber-200">
                      متواجد حالياً على المايك ({userSeat.seatIndex + 1})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {userSeat.isMuted ? (
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-bold flex items-center gap-1">
                        <MicOff className="w-2.5 h-2.5" />
                        مكتوم
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                        <Mic className="w-2.5 h-2.5" />
                        المايك يعمل
                      </span>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Bio & Status */}
              <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-800">
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{profile.bio || 'مرحباً بكم في حسابي على حكاوي!'}"
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-2 border-t border-slate-700/50 pt-1.5">
                  <Clock className="w-3 h-3" />
                  <span>عضو منذ: {new Date(profile.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>

              {/* Public Stats Row (Followers, Following, Friends) */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-2.5">
                  <span className="block text-base font-black text-slate-100">{followersCount}</span>
                  <span className="text-[10px] font-bold text-slate-400">المتابعون</span>
                </div>
                <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-2.5">
                  <span className="block text-base font-black text-slate-100">{profile.followingCount || 0}</span>
                  <span className="text-[10px] font-bold text-slate-400">المتابَعون</span>
                </div>
                <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-2.5">
                  <span className="block text-base font-black text-slate-100">{profile.friendsCount || 0}</span>
                  <span className="text-[10px] font-bold text-slate-400">الأصدقاء</span>
                </div>
              </div>

              {/* Level & XP Progress Info */}
              <LevelProgressCard
                exp={profile.exp || 0}
                level={profile.level || 1}
              />

              {/* Quick DM Form Drawer if opened */}
              {showQuickDm && !isSelf && (
                <form onSubmit={handleSendQuickDm} className="bg-slate-800/80 rounded-2xl p-2.5 border border-amber-500/30 flex flex-col gap-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                    <span>إرسال رسالة خاصة إلى {profile.name}</span>
                    <button type="button" onClick={() => setShowQuickDm(false)} className="text-slate-400 hover:text-white">✕</button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="اكتب رسالتك الخاصة هنا..."
                      value={dmText}
                      onChange={(e) => setDmText(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!dmText.trim() || isActionLoading}
                      className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-slate-950 font-bold"
                    >
                      <Send className="w-3.5 h-3.5 rotate-180" />
                    </button>
                  </div>
                  {dmSent && <span className="text-[11px] text-emerald-400 font-bold text-center">✓ تم إرسال الرسالة بنجاح!</span>}
                </form>
              )}

              {/* Primary Interaction Action Buttons (Send Gift, Follow, Add Friend, DM) */}
              {!isSelf ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {/* Send Gift Button */}
                  {onSendGiftToUser && (
                    <button
                      onClick={() => {
                        onClose();
                        onSendGiftToUser(profile.id);
                      }}
                      className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <Gift className="w-4 h-4 animate-bounce" />
                      <span>إرسال هدية</span>
                    </button>
                  )}

                  {/* Follow / Unfollow */}
                  <button
                    onClick={handleToggleFollow}
                    disabled={isActionLoading}
                    className={`py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      isFollowing
                        ? 'bg-slate-800 text-amber-300 border border-amber-500/40 hover:bg-rose-950/40 hover:text-rose-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFollowing ? 'fill-amber-400 text-amber-400' : ''}`} />
                    <span>{isFollowing ? 'متابَع' : 'متابعة'}</span>
                  </button>

                  {/* Add Friend */}
                  <button
                    onClick={handleSendFriendRequest}
                    disabled={isActionLoading || friendshipStatus !== 'NONE'}
                    className={`py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      friendshipStatus === 'ACCEPTED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : friendshipStatus === 'PENDING'
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {friendshipStatus === 'ACCEPTED' ? (
                      <>
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        <span>أصدقاء</span>
                      </>
                    ) : friendshipStatus === 'PENDING' ? (
                      <span>قيد الانتظار</span>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>إضافة صديق</span>
                      </>
                    )}
                  </button>

                  {/* Send Direct Message */}
                  <button
                    onClick={() => setShowQuickDm(!showQuickDm)}
                    className="py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    <span>رسالة</span>
                  </button>
                </div>
              ) : (
                /* خيار "الضبط" داخل حسابي / الملف الشخصي */
                <div className="pt-1">
                  <button
                    id="profile-modal-settings-btn"
                    onClick={() => setIsSettingsOpen(true)}
                    className="w-full p-3 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 flex items-center justify-between transition-all cursor-pointer group shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                        <Sliders className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="font-bold text-xs text-slate-100">الضبط</span>
                        <span className="text-[10px] text-slate-400">الدخلات والإطارات</span>
                      </div>
                    </div>
                    <span className="text-xs text-amber-400 font-bold">عرض ←</span>
                  </button>
                </div>
              )}

              {/* Host & Moderator Mic Management Actions */}
              {isCurrentHost && userSeat && onHostSeatAction && !isSelf && (
                <div className="bg-purple-950/40 border border-purple-500/40 rounded-2xl p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                    <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                    <span>إجراءات المضيف على المايك ({userSeat.seatIndex + 1})</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        onHostSeatAction('mute_seat', userSeat);
                        onClose();
                      }}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                      <span>{userSeat.isMuted ? 'إلغاء الكتم' : 'كتم المايك'}</span>
                    </button>
                    <button
                      onClick={() => {
                        onHostSeatAction('kick_seat', userSeat);
                        onClose();
                      }}
                      className="py-2 px-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-600/40 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <UserX className="w-3.5 h-3.5 text-rose-400" />
                      <span>إنزال من المايك</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Owner Role Management Panel (Strictly Owner Only) */}
              {isOwner && !isSelf && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                      <Crown className="w-3.5 h-3.5 text-yellow-400" />
                      <span>لوحة المالك: ترقية / تعديل الرتبة</span>
                    </div>
                    <button
                      onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                      className="text-[11px] font-bold text-amber-400 hover:underline"
                    >
                      {isRoleMenuOpen ? 'إخفاء' : 'تعديل الرتبة'}
                    </button>
                  </div>

                  {roleUpdateMsg && (
                    <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 p-1 rounded-lg border border-emerald-500/20 text-center">
                      {roleUpdateMsg}
                    </span>
                  )}

                  {isRoleMenuOpen && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                      {(['USER', 'HOST', 'AGENT', 'STAFF', 'MODERATOR', 'ADMIN'] as UserRole[]).map(r => (
                        <button
                          key={r}
                          onClick={() => handleChangeRole(r)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                            profile.role === r
                              ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          }`}
                        >
                          <RoleBadge role={r} size="sm" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* نافذة الضبط (الدخلات والإطارات) عند الفتح من الملف الشخصي */}
      {isSelf && (
        <AccountSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          currentUser={currentUser}
          onUserUpdated={onUserUpdated}
        />
      )}
    </div>
  );
};
