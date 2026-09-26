import React, { useState, useEffect } from 'react';
import { User, Room, Report, AuditLog, AdminStats, ModerationIncident, isUserOwner, ShippingRechargeLog } from '../types';
import { API } from '../services/api';
import { RoleBadge, UserRoleBadges } from './RoleBadge';
import { AdminAgencyHostManagement } from './AdminAgencyHostManagement';
import { AdminGiftTierSettings } from './AdminGiftTierSettings';
import { OwnerFreeRechargeModal } from './OwnerFreeRechargeModal';
import {
  Shield,
  Users,
  Radio,
  AlertTriangle,
  FileText,
  Ban,
  CheckCircle,
  XCircle,
  Trash2,
  Search,
  X,
  TrendingUp,
  Coins,
  Gem,
  EyeOff,
  Sparkles,
  Lock,
  Unlock,
  AlertOctagon,
  Crown,
  Briefcase,
  Zap
} from 'lucide-react';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  initialTab?: 'overview' | 'gift_tiers' | 'agency_host' | 'moderation' | 'users' | 'rooms' | 'reports' | 'logs' | 'roles_and_king';
  onJoinRoom?: (room: Room) => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialTab = 'overview',
  onJoinRoom
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'gift_tiers' | 'agency_host' | 'moderation' | 'users' | 'rooms' | 'reports' | 'logs' | 'roles_and_king'>(initialTab);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [rechargeLogs, setRechargeLogs] = useState<ShippingRechargeLog[]>([]);
  const [moderationIncidents, setModerationIncidents] = useState<ModerationIncident[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [banReason, setBanReason] = useState('مخالفة سياسة المحتوى والآداب العامة');
  const [selectedUserToBan, setSelectedUserToBan] = useState<User | null>(null);

  // King Frame & Role Management State
  const [selectedTargetUserId, setSelectedTargetUserId] = useState<string>('');
  const [newRoleSelection, setNewRoleSelection] = useState<string>('HOST');
  const [balanceType, setBalanceType] = useState<'COIN' | 'DIAMOND'>('COIN');
  const [balanceAmount, setBalanceAmount] = useState<number>(1000);
  const [balanceReason, setBalanceReason] = useState<string>('مكافأة نشاط إدارية');
  const [isFreeRechargeOpen, setIsFreeRechargeOpen] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // VIP ID State
  const [vipModalUser, setVipModalUser] = useState<User | null>(null);
  const [vipNumericIdInput, setVipNumericIdInput] = useState('');
  const [isAssigningVip, setIsAssigningVip] = useState(false);

  const handleAssignVipNumericId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vipModalUser || !vipNumericIdInput.trim()) return;
    setIsAssigningVip(true);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    try {
      const res = await API.assignVipNumericId(currentUser.id, vipModalUser.id, vipNumericIdInput.trim());
      setActionSuccessMsg(res.message);
      setVipModalUser(null);
      setVipNumericIdInput('');
      loadData();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'فشل تخصيص الـ ID المميز');
    } finally {
      setIsAssigningVip(false);
    }
  };

  const isOwner = isUserOwner(currentUser);

  const handleAdjustBalanceForOwner = async (amount: number) => {
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    try {
      const res = await API.adjustUserBalance(
        currentUser.id,
        currentUser.id,
        'DIAMOND',
        amount,
        'شحن مباشر لحساب المالك العام 👑'
      );
      setActionSuccessMsg(`تم بنجاح إضافة ${amount.toLocaleString('ar-EG')} 💎 لحساب المالك!`);
      loadData();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'فشل شحن الماسات للمالك');
    }
  };

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const loadData = () => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'OWNER')) return;

    API.getAdminStats(currentUser.id).then(setStats).catch(() => {});
    API.getAdminUsers(currentUser.id).then(setUsers).catch(() => {});
    API.getRooms().then(setRooms).catch(() => {});
    API.getAdminReports(currentUser.id).then(setReports).catch(() => {});
    API.getAuditLogs(currentUser.id).then(setAuditLogs).catch(() => {});
    API.getAdminRechargeLogs(currentUser.id).then(setRechargeLogs).catch(() => {});
    API.getAdminModerationIncidents(currentUser.id).then(setModerationIncidents).catch(() => {});
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, currentUser.id]);

  if (!isOpen) return null;

  const handleBanUser = async () => {
    if (!selectedUserToBan) return;
    try {
      await API.banUser(currentUser.id, selectedUserToBan.id, banReason);
      alert(`تم حظر المستخدم ${selectedUserToBan.name} بنجاح.`);
      setSelectedUserToBan(null);
      loadData();
    } catch {
      alert('تعذر تنفيذ الحظر');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await API.unbanUser(currentUser.id, userId);
      alert('تم رفع الحظر بنجاح.');
      loadData();
    } catch (err: any) {
      alert(err.message || 'تعذر رفع الحظر');
    }
  };

  const handleResolveModeration = async (
    incidentId: string,
    action: 'CONFIRM_BAN' | 'UNBAN_RESTORE' | 'APPROVE_CONTENT' | 'DISMISS'
  ) => {
    try {
      await API.resolveModerationIncident(currentUser.id, incidentId, action);
      loadData();
    } catch (err: any) {
      alert(err.message || 'تعذر اتخاذ هذا الإجراء');
    }
  };

  const handleEndRoom = async (roomId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الغرفة نهائياً؟')) return;
    try {
      await API.deleteRoom(roomId, currentUser.id);
      alert('تم حذف الغرفة بنجاح.');
      loadData();
    } catch {
      alert('تعذر حذف الغرفة');
    }
  };

  const handleResolveReport = async (reportId: string, status: 'RESOLVED' | 'DISMISSED') => {
    try {
      await API.resolveAdminReport(currentUser.id, reportId, status);
      loadData();
    } catch {
      alert('تعذر معالجة البلاغ');
    }
  };

  const handleAssignKingFrame = async (targetUserId: string) => {
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    try {
      const res = await API.assignKingFrame(currentUser.id, targetUserId);
      setActionSuccessMsg(res.message);
      loadData();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'فشل تخصيص إطار الملك');
    }
  };

  const handleUpdateRole = async (targetUserId: string, role: any) => {
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    try {
      const res = await API.updateUserRole(currentUser.id, targetUserId, role);
      setActionSuccessMsg(res.message || 'تم تحديث الرتبة بنجاح!');
      loadData();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'فشل تحديث الرتبة');
    }
  };

  const handleToggleShippingAgent = async (targetUserId: string, isAgent: boolean) => {
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    try {
      const res = await API.assignShippingAgent(currentUser.id, targetUserId, isAgent);
      setActionSuccessMsg(res.message);
      loadData();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'فشل تحديث حالة وكيل الشحن');
    }
  };

  const handleAdjustBalance = async (targetUserId: string) => {
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    if (!balanceAmount || balanceAmount <= 0) {
      setActionErrorMsg('يرجى تحديد مبلغ صحيح');
      return;
    }
    try {
      const res = await API.adjustUserBalance(
        currentUser.id,
        targetUserId,
        balanceType,
        Number(balanceAmount),
        balanceReason
      );
      setActionSuccessMsg(res.message || 'تم تعديل الرصيد بنجاح!');
      loadData();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'فشل تعديل الرصيد');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.numericId && u.numericId.includes(userSearch)) ||
    u.phone?.includes(userSearch)
  );

  const pendingIncidentsCount = moderationIncidents.filter(i => i.status === 'NEEDS_REVIEW' || i.status === 'BLOCKED_BANNED').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-slate-900 border border-purple-500/40 rounded-3xl p-5 shadow-2xl shadow-purple-950 flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-slate-100">لوحة التحكم والرقابة الإدارية</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">إدارة الرقابة الآلية، الحظر، الغرف، البلاغات وسجلات الأمان</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isUserOwner(currentUser) && (
              <button
                onClick={() => setIsFreeRechargeOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 fill-slate-950" />
                <span>👑 شحن المَسّات — المالك</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-slate-800/60 p-1.5 rounded-2xl border border-slate-700/60">
          {[
            { id: 'overview' as const, label: 'الإحصائيات', icon: TrendingUp },
            { id: 'gift_tiers' as const, label: '🎁 فئات وأصوات الهدايا', icon: Sparkles },
            { id: 'agency_host' as const, label: '🏢 الوكلاء والمضيفين والتارجت', icon: Briefcase },
            { id: 'moderation' as const, label: 'الرقابة والحشمة الآلية', icon: AlertOctagon, badge: pendingIncidentsCount },
            { id: 'roles_and_king' as const, label: '👑 إطار الملك والرتب والرصيد', icon: Crown },
            { id: 'rooms' as const, label: 'مراقبة الغرف', icon: Radio },
            { id: 'users' as const, label: 'المستخدمين والحظر', icon: Users },
            { id: 'reports' as const, label: 'مركز البلاغات', icon: AlertTriangle, badge: stats?.pendingReports },
            { id: 'logs' as const, label: 'سجل العمليات', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB: GIFT TIERS & SOUND SETTINGS */}
        {activeTab === 'gift_tiers' && (
          <div className="animate-in fade-in duration-200">
            <AdminGiftTierSettings currentUser={currentUser} />
          </div>
        )}

        {/* TAB: AGENCY, HOST & TARGET SYSTEM */}
        {activeTab === 'agency_host' && (
          <div className="animate-in fade-in duration-200">
            <AdminAgencyHostManagement currentUser={currentUser} />
          </div>
        )}

        {/* TAB 1: OVERVIEW METRICS */}
        {activeTab === 'overview' && stats && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col gap-1">
                <span className="text-xs text-slate-400">إجمالي المستخدمين</span>
                <span className="text-2xl font-black text-slate-100">{stats.totalUsers}</span>
                <span className="text-[10px] text-emerald-400 font-bold">{stats.activeUsers} متصل الآن</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col gap-1">
                <span className="text-xs text-slate-400">الغرف المباشرة</span>
                <span className="text-2xl font-black text-amber-400">{stats.liveRooms}</span>
                <span className="text-[10px] text-amber-300 font-bold">بث صوتي وفيديو</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col gap-1">
                <span className="text-xs text-slate-400">حالات الرقابة الآلية</span>
                <span className="text-2xl font-black text-rose-400">{moderationIncidents.length}</span>
                <span className="text-[10px] text-rose-300 font-bold">فحص صارم ونشط</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col gap-1">
                <span className="text-xs text-slate-400">البلاغات المعلقة</span>
                <span className="text-2xl font-black text-yellow-400">{stats.pendingReports}</span>
                <span className="text-[10px] text-yellow-300 font-bold">تتطلب المراجعة</span>
              </div>
            </div>

            {/* AI Moderation Policy Banner */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-rose-500/30 flex items-start gap-3">
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-xs font-black text-rose-300">سياسة منع المحتوى غير اللائق وعري الرجال الصارمة</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  نظام الرقابة الآلية يعمل تلقائياً لفحص الصور والفيديو والبث المباشر. أي عري أو كشف للأعضاء الخاصة أو ظهور بملابس داخلية مخلة يتم حجبه فوراً مع حظر المستخدم بصورة دائمة، وفك الحظر مقتصر حصراً على هذه اللوحة من قبل المالك.
                </p>
              </div>
            </div>

            {/* Quick Live Surveillance Glance */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-300">نظرة عامة على الغرف النشطة:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {rooms.slice(0, 4).map(room => (
                  <div key={room.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={room.coverImage} alt={room.title} className="w-8 h-8 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      <div>
                        <span className="text-xs font-bold text-slate-100 block truncate">{room.title}</span>
                        <span className="text-[10px] text-slate-400">المضيف: {room.hostName} ({room.viewerCount} مشاهد)</span>
                      </div>
                    </div>
                    {onJoinRoom && (
                      <button
                        onClick={() => { onClose(); onJoinRoom(room); }}
                        className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold"
                      >
                        دخول ومراقبة
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI MODERATION QUEUE */}
        {activeTab === 'moderation' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                سجل الرقابة الآلية والحظر الذاتي ({moderationIncidents.length}):
              </span>
              <span className="text-[10px] text-rose-400 font-mono bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                🛡️ AI Shield Enforcement Active
              </span>
            </div>

            <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto">
              {moderationIncidents.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500 flex flex-col items-center gap-2">
                  <Shield className="w-8 h-8 text-emerald-400/40" />
                  <span>لا توجد انتهاكات رقابية مسجلة حالياً - جميع الأنشطة مطابقة لمعايير الحشمة.</span>
                </div>
              ) : (
                moderationIncidents.map(inc => (
                  <div
                    key={inc.id}
                    className="p-3.5 rounded-2xl bg-slate-800/90 border border-rose-500/30 flex flex-col gap-2.5 shadow-lg shadow-black/40"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-600/30 text-rose-300 border border-rose-500/40">
                          {inc.category}
                        </span>
                        <span className="text-xs font-bold text-slate-200">
                          المستخدم: {inc.userName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          [{inc.targetType}]
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          inc.status === 'BLOCKED_BANNED'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : inc.status === 'NEEDS_REVIEW'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {inc.status === 'BLOCKED_BANNED' ? '⛔ محظور ومحجوب تلقائياً' : inc.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-rose-200 font-semibold leading-relaxed">
                      السبب: {inc.reason}
                    </p>

                    {inc.details && (
                      <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-xl font-mono">
                        تفاصيل الرصد: {inc.details} (نسبة الدقة: {Math.round((inc.confidenceScore || 0.9) * 100)}%)
                      </p>
                    )}

                    {inc.mediaSnapshot && (
                      <div className="mt-1 flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400">لقطة المحتوى المخالف (تم حجبها تلقائياً):</span>
                        <img
                          src={inc.mediaSnapshot}
                          alt="Snapshot"
                          className="w-12 h-12 object-cover rounded-lg blur-md hover:blur-none transition-all cursor-pointer border border-rose-500/40"
                          referrerPolicy="no-referrer"
                          title="مرر المؤشر لإلغاء التعتيم للمراجعة"
                        />
                      </div>
                    )}

                    {/* Admin Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-[11px]">
                      <span className="text-slate-500 text-[10px]">
                        رُصد في: {new Date(inc.detectedAt).toLocaleString('ar-EG')}
                        {inc.reviewedBy && ` • تم الفحص بواسطة: ${inc.reviewedBy}`}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {inc.status === 'BLOCKED_BANNED' && (
                          <button
                            onClick={() => handleResolveModeration(inc.id, 'UNBAN_RESTORE')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1"
                          >
                            <Unlock className="w-3 h-3" />
                            <span>فك الحظر واستعادة الحساب</span>
                          </button>
                        )}

                        {inc.status === 'NEEDS_REVIEW' && (
                          <>
                            <button
                              onClick={() => handleResolveModeration(inc.id, 'CONFIRM_BAN')}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold flex items-center gap-1"
                            >
                              <Lock className="w-3 h-3" />
                              <span>تأكيد الحظر النهائي</span>
                            </button>
                            <button
                              onClick={() => handleResolveModeration(inc.id, 'APPROVE_CONTENT')}
                              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl"
                            >
                              قبول وتمرير
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ROOMS SURVEILLANCE */}
        {activeTab === 'rooms' && (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-300">جميع الغرف المفتوحة حالياً ({rooms.length}):</span>
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {rooms.map(room => (
                <div key={room.id} className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src={room.coverImage} alt={room.title} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{room.title}</h4>
                      <span className="text-[11px] text-slate-400 block">
                        المضيف: {room.hostName} • كود: {room.roomCode} • التصنيف: {room.currentCategory}
                      </span>
                      <span className="text-[10px] text-amber-400 font-bold">
                        {room.viewerCount} مستمع • {room.type === 'PRIVATE' ? 'خاصة 🔒' : 'عامة 🌐'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onJoinRoom && (
                      <button
                        onClick={() => { onClose(); onJoinRoom(room); }}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl"
                      >
                        دخول
                      </button>
                    )}
                    <button
                      onClick={() => handleEndRoom(room.id)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>إنهاء فوري</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: USERS & BAN MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="ابحث عن مستخدم بالاسم أو المعرف أو رقم الهاتف..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:border-purple-400 focus:outline-none"
            />

            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {filteredUsers.map(u => (
                <div key={u.id} className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <div className="flex items-center gap-2">
                        <UserRoleBadges user={u} size="sm" />
                        <span className="text-xs font-bold text-slate-100">{u.name}</span>
                        <UserRoleBadges user={u} size="sm" mode="pills" />
                        {u.isBanned && (
                          <span className="text-[9px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-bold border border-rose-500/30">
                            محظور
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-mono">@{u.username}</span>
                        <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded-lg border border-amber-500/30 font-mono text-amber-300 font-bold flex items-center gap-1">
                          {u.isVipNumericId && <Crown className="w-2.5 h-2.5 text-amber-400" />}
                          <span>ID: {u.numericId || u.id}</span>
                        </span>
                        {u.phone && <span className="text-[10px] text-slate-500 font-mono">{u.phone}</span>}
                      </div>
                      {u.banReason && (
                        <span className="text-[9px] text-rose-300 block">سبب الحظر: {u.banReason}</span>
                      )}
                    </div>
                  </div>

                  {u.role !== 'OWNER' && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => {
                          setVipModalUser(u);
                          setVipNumericIdInput(u.numericId || '');
                        }}
                        className="px-2 py-1 rounded-xl text-xs font-bold flex items-center gap-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer"
                        title="تخصيص ID رقمي مميز لهذا الحساب"
                      >
                        <Crown className="w-3 h-3 text-amber-400" />
                        <span>ID مميز</span>
                      </button>
                      {isOwner && (
                        <button
                          onClick={() => handleToggleShippingAgent(u.id, !u.isShippingAgent)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                            u.isShippingAgent
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                              : 'bg-slate-700/60 text-slate-300 border-slate-600 hover:bg-slate-700'
                          }`}
                          title={u.isShippingAgent ? 'إلغاء صلاحية وكيل الشحن' : 'تعيين المستخدم كـ وكيل شحن'}
                        >
                          <Gem className="w-3 h-3 text-amber-400" />
                          <span>{u.isShippingAgent ? 'وكيل شحن ✓' : 'تعيين كوكيل شحن'}</span>
                        </button>
                      )}

                      {u.isBanned ? (
                        <button
                          onClick={() => handleUnbanUser(u.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Unlock className="w-3 h-3" />
                          <span>فك الحظر</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedUserToBan(u)}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Ban className="w-3 h-3" />
                          <span>حظر الحساب</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: REPORTS CENTER */}
        {activeTab === 'reports' && (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-300">البلاغات الواردة من المستخدمين:</span>
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {reports.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">لا توجد بلاغات معلقة حالياً 🎉</div>
              ) : (
                reports.map(rep => (
                  <div key={rep.id} className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-400">
                        بلاغ على {rep.targetType}: {rep.targetName}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rep.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {rep.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200">السبب: {rep.reason}</p>
                    {rep.details && <p className="text-[11px] text-slate-400">تفاصيل: {rep.details}</p>}

                    {rep.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
                        <button
                          onClick={() => handleResolveReport(rep.id, 'DISMISSED')}
                          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-xl"
                        >
                          تجاهل
                        </button>
                        <button
                          onClick={() => handleResolveReport(rep.id, 'RESOLVED')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
                        >
                          حل البلاغ
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 6: AUDIT & RECHARGE LOGS */}
        {activeTab === 'logs' && (
          <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
            {/* Shipping Agency Recharge Logs */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Gem className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-xs text-amber-300">سجلات الشحن الخارجي عبر وكالات الشحن ({rechargeLogs.length})</h4>
                </div>
                <span className="text-[10px] text-slate-400">توثيق الشحن برقم مرجع</span>
              </div>

              {rechargeLogs.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">لا توجد عمليات شحن مسجلة حتى الآن.</p>
              ) : (
                <div className="flex flex-col gap-2 font-mono text-xs">
                  {rechargeLogs.map(log => (
                    <div key={log.id} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-amber-300 font-bold">
                        <span>المرجع: {log.referenceId}</span>
                        <span className="text-emerald-400">{log.amountEgp} EGP • {log.diamonds.toLocaleString('ar-EG')} 💎</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-300">
                        <span>المستلم: <b>{log.userName}</b> (ID: <span className="text-amber-400">{log.userNumericId}</span>)</span>
                        <span>الوكيل: <b>{log.agentName}</b></span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-700/40">
                        <span>{new Date(log.createdAt).toLocaleString('ar-EG')}</span>
                        <span className="text-emerald-400 font-bold">مكتملة ✅</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* General System Audit Logs */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-2">
              <h4 className="font-bold text-xs text-slate-200 border-b border-slate-800 pb-2">سجلات عمليات النظام والرقابة</h4>
              <div className="flex flex-col gap-1.5 font-mono text-[11px]">
                {auditLogs.map(log => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-slate-300">
                    <div>
                      <span className="text-purple-300 font-bold">[{log.action}]</span> {log.details}
                    </div>
                    <span className="text-slate-500 text-[10px]">
                      {new Date(log.createdAt).toLocaleTimeString('ar-EG')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: KING FRAME & ROLES & BALANCE MANAGEMENT */}
        {activeTab === 'roles_and_king' && (
          <div className="flex flex-col gap-4">
            {actionSuccessMsg && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{actionSuccessMsg}</span>
              </div>
            )}

            {actionErrorMsg && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{actionErrorMsg}</span>
              </div>
            )}

            {/* King Frame Direct Assignment */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-slate-900 border border-amber-500/30 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm text-amber-300">👑 تخصيص وتعيين إطار «الملك» الحصري</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                هذه الميزة حصرية لمالك التطبيق. يمكنك البحث عن أي مستخدم وتعيين وتفعيل إطار الملك المذهب فوراً على حسابه ليظهر في الغرف والبث المباشر.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">اختر المستخدم لمنحه إطار الملك:</label>
                  <select
                    value={selectedTargetUserId}
                    onChange={(e) => setSelectedTargetUserId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:border-amber-400 focus:outline-none"
                  >
                    <option value="">-- اختر مستخدماً من القائمة --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} (@{u.username}) {u.activeFrameId === 'frame_owner_king' ? '👑 [يملك الملك]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    disabled={!selectedTargetUserId}
                    onClick={() => handleAssignKingFrame(selectedTargetUserId)}
                    className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    <Crown className="w-4 h-4" />
                    <span>منح وتفعيل إطار الملك الآن</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Role & Permissions Assignment */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <h3 className="font-extrabold text-sm text-purple-300">ترقية الرتب وتعيين الصلاحيات</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">المستخدم المستهدف:</label>
                  <select
                    value={selectedTargetUserId}
                    onChange={(e) => setSelectedTargetUserId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-purple-400 focus:outline-none"
                  >
                    <option value="">-- اختر مستخدماً --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">الرتبة الجديدة:</label>
                  <select
                    value={newRoleSelection}
                    onChange={(e) => setNewRoleSelection(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-purple-400 focus:outline-none"
                  >
                    <option value="USER">مستخدم عادي (USER)</option>
                    <option value="HOST">مضيف معتمد (HOST)</option>
                    <option value="MODERATOR">مشرف غرف (MODERATOR)</option>
                    <option value="AGENT">وكيل شحن وموزع (AGENT)</option>
                    <option value="STAFF">طاقم إدارة (STAFF)</option>
                    <option value="ADMIN">مشرف عام (ADMIN)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    disabled={!selectedTargetUserId}
                    onClick={() => handleUpdateRole(selectedTargetUserId, newRoleSelection)}
                    className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs active:scale-98 transition-all"
                  >
                    تحديث الرتبة والصلاحيات
                  </button>
                </div>
              </div>
            </div>

            {/* EXCLUSIVE OWNER DIAMONDS RECHARGE */}
            {isOwner && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/40 border-2 border-amber-500/60 flex flex-col gap-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-400 animate-pulse" />
                    <h3 className="font-black text-sm text-amber-300">
                      لوحة المالك 👑: شحن وإضافة ماسات لحسابي مباشرة
                    </h3>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    شحن مجاني للمالك فقط
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  بصفتك المالك العام للتطبيق، الشحن مجاني لك بالكامل. يمكنك إضافة أي كمية من الماسات لحسابك الشخصي فوراً بدون قيود.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-bold text-slate-400">إضافة سريعة لحسابي:</span>
                  {[
                    { amt: 10000, label: '+10,000 💎' },
                    { amt: 50000, label: '+50,000 💎' },
                    { amt: 100000, label: '+100,000 💎' },
                    { amt: 500000, label: '+500,000 💎' },
                    { amt: 1000000, label: '+1,000,000 💎' }
                  ].map(p => (
                    <button
                      key={p.amt}
                      type="button"
                      onClick={() => handleAdjustBalanceForOwner(p.amt)}
                      className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* User Balance Credit/Debit */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-extrabold text-sm text-emerald-300">تعديل الأرصدة الإدارية (كونز / ماسات)</h3>
                </div>
                {!isOwner && (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    إضافة الماسات محصورة بالمالك 👑
                  </span>
                )}
              </div>

              {!isOwner && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>تنبيه نظام الأمان: توليد وإضافة الماسات محصورة بحساب المالك العام حصرياً. أي عملية إضافة ماسات من رتب أخرى يتم رفضها فوراً في السيرفر.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">نوع الرصيد:</label>
                  <select
                    value={balanceType}
                    onChange={(e) => setBalanceType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="COIN">🟡 كونز (Coins)</option>
                    <option value="DIAMOND" disabled={!isOwner}>
                      💎 ماسات (Diamonds) {!isOwner ? '— [للمالك فقط 👑]' : ''}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">المبلغ (إضافة أو خصم):</label>
                  <input
                    type="number"
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-emerald-400 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">سبب التعديل:</label>
                  <input
                    type="text"
                    value={balanceReason}
                    onChange={(e) => setBalanceReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    disabled={!selectedTargetUserId || (!isOwner && balanceType === 'DIAMOND' && balanceAmount > 0)}
                    onClick={() => handleAdjustBalance(selectedTargetUserId)}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs active:scale-98 transition-all"
                  >
                    تطبيق تعديل الرصيد
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIP Numeric ID Assignment Dialog */}
        {vipModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <form onSubmit={handleAssignVipNumericId} className="w-full max-w-sm bg-slate-900 border border-amber-500/50 rounded-3xl p-5 shadow-2xl shadow-amber-950/50 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm border-b border-slate-800 pb-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <h3>تعيين ID رقمي مميز (VIP ID)</h3>
              </div>
              <p className="text-xs text-slate-300">
                تخصيص ID رقمي خاص للحساب: <span className="font-bold text-slate-100">{vipModalUser.name}</span> (@{vipModalUser.username})
              </p>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-400">الـ ID الرقمي الجديد (أرقام فقط):</label>
                <input
                  type="text"
                  value={vipNumericIdInput}
                  onChange={(e) => setVipNumericIdInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="مثال: 888888 أو 777777"
                  maxLength={12}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-amber-500/40 text-amber-300 font-mono text-sm font-extrabold focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                👑 سينقل هذا الـ ID إلى فئة الحسابات المميزة ويكون فريداً وغير قابل للتكرار.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVipModalUser(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isAssigningVip || !vipNumericIdInput.trim()}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>{isAssigningVip ? 'جاري التعيين...' : 'حفظ الـ ID المميز'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Ban User Confirmation Dialog */}
        {selectedUserToBan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-rose-500/40 rounded-3xl p-5 shadow-2xl flex flex-col gap-3">
              <h3 className="font-bold text-sm text-rose-300">حظر المستخدم: {selectedUserToBan.name}</h3>
              <p className="text-xs text-slate-300">يرجى كتابة سبب الحظر الإداري:</p>
              <input
                type="text"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:border-rose-400 focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setSelectedUserToBan(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleBanUser}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                >
                  تأكيد الحظر
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Owner Free Recharge Modal */}
        <OwnerFreeRechargeModal
          isOpen={isFreeRechargeOpen}
          onClose={() => setIsFreeRechargeOpen(false)}
          currentUser={currentUser}
          onUserUpdated={(updatedUser) => {
            // refresh data if needed
          }}
        />
      </div>
    </div>
  );
};
