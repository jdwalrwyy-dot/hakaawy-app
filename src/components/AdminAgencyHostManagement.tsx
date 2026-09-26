import React, { useState, useEffect } from 'react';
import { UserRoleBadges } from './RoleBadge';
import {
  User,
  HostApplication,
  AgentApplication,
  Agency,
  HostProfile,
  TargetConfig
} from '../types';
import { API } from '../services/api';
import {
  Briefcase,
  Users,
  Mic,
  Target,
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Gem,
  Plus,
  Edit2,
  Trash2,
  Link,
  Unlink,
  ArrowRightLeft,
  Percent,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface AdminAgencyHostManagementProps {
  currentUser: User;
}

export const AdminAgencyHostManagement: React.FC<AdminAgencyHostManagementProps> = ({ currentUser }) => {
  const [subTab, setSubTab] = useState<
    'host_apps' | 'agent_apps' | 'agencies' | 'hosts' | 'targets'
  >('host_apps');

  const [loading, setLoading] = useState<boolean>(true);
  const [hostApps, setHostApps] = useState<HostApplication[]>([]);
  const [agentApps, setAgentApps] = useState<AgentApplication[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [hosts, setHosts] = useState<HostProfile[]>([]);
  const [targetConfigs, setTargetConfigs] = useState<TargetConfig[]>([]);

  // Search
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Host App Review Modal State
  const [selectedHostApp, setSelectedHostApp] = useState<HostApplication | null>(null);
  const [assignAgencyId, setAssignAgencyId] = useState<string>('');
  const [hostRejectReason, setHostRejectReason] = useState<string>('عدم استيفاء شروط جودة البث الصوتي');

  // Agent App Review Modal State
  const [selectedAgentApp, setSelectedAgentApp] = useState<AgentApplication | null>(null);
  const [quickRejectApp, setQuickRejectApp] = useState<AgentApplication | null>(null);
  const [quickRejectReason, setQuickRejectReason] = useState<string>('عدم كفاية بيانات الخبرة والإدارة');
  const [commissionPct, setCommissionPct] = useState<number>(15);
  const [agentRejectReason, setAgentRejectReason] = useState<string>('عدم كفاية بيانات الخبرة والإدارة');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Host Action State (Link / Transfer / Unlink)
  const [selectedHostProfile, setSelectedHostProfile] = useState<HostProfile | null>(null);
  const [hostActionType, setHostActionType] = useState<'LINK' | 'TRANSFER' | 'UNLINK' | null>(null);
  const [targetAgencyId, setTargetAgencyId] = useState<string>('');

  // Target Config Form State
  const [showTargetModal, setShowTargetModal] = useState<boolean>(false);
  const [targetTitle, setTargetTitle] = useState<string>('تارجت الشهر الفضي 🌟');
  const [targetPeriod, setTargetPeriod] = useState<'MONTHLY' | 'WEEKLY'>('MONTHLY');
  const [reqDiamonds, setReqDiamonds] = useState<number>(50000);
  const [reqLiveHours, setReqLiveHours] = useState<number>(30);
  const [reqActiveDays, setReqActiveDays] = useState<number>(15);
  const [rewardCoins, setRewardCoins] = useState<number>(20000);
  const [rewardDiamonds, setRewardDiamonds] = useState<number>(10000);
  const [agentCommPct, setAgentCommPct] = useState<number>(15);

  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAll = () => {
    if (!currentUser) return;
    setLoading(true);
    setActionMsg(null);

    Promise.all([
      API.getAdminHostApplications(currentUser.id),
      API.getAdminAgentApplications(currentUser.id),
      API.getAdminAgencies(currentUser.id),
      API.getAdminHostProfiles(currentUser.id),
      API.getAdminTargetConfigs(currentUser.id)
    ])
      .then(([hApps, aApps, ags, hsts, targets]) => {
        setHostApps(hApps);
        setAgentApps(aApps);
        setAgencies(ags);
        setHosts(hsts);
        setTargetConfigs(targets);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading admin agency data:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAll();
  }, [currentUser.id]);

  // Host Application Review
  const handleReviewHost = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedHostApp) return;
    try {
      const res = await API.reviewHostApplication(
        currentUser.id,
        selectedHostApp.id,
        action,
        action === 'REJECT' ? hostRejectReason : undefined,
        action === 'APPROVE' ? (assignAgencyId || undefined) : undefined
      );

      setActionMsg({ type: 'success', text: res.message });
      setSelectedHostApp(null);
      loadAll();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'فشلت معالجة الطلب' });
    }
  };

  // Agent Application Review
  const handleReviewAgent = async (
    action: 'APPROVE' | 'REJECT',
    targetAppOverride?: AgentApplication,
    customReason?: string,
    customCommPct?: number
  ) => {
    const targetApp = targetAppOverride || selectedAgentApp;
    if (!targetApp) return;
    setIsSubmittingReview(true);
    try {
      const res = await API.reviewAgentApplication(
        currentUser.id,
        targetApp.id,
        action,
        action === 'REJECT' ? (customReason ?? agentRejectReason) : undefined,
        action === 'APPROVE' ? (customCommPct ?? commissionPct ?? 15) : undefined
      );

      setActionMsg({
        type: 'success',
        text: action === 'APPROVE'
          ? `تم قبول طلب وكالة [${targetApp.agencyName}] وتعيين المستخدم [${targetApp.userName}] كوكيل رسمياً ⭐`
          : `تم رفض طلب وكالة [${targetApp.agencyName}] بنجاح (تم الرفض ❌)`
      });
      setSelectedAgentApp(null);
      setQuickRejectApp(null);
      loadAll();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'فشلت معالجة الطلب' });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Agency Status Toggle
  const handleToggleAgencyStatus = async (agency: Agency) => {
    const newStatus = agency.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await API.updateAdminAgencyStatus(currentUser.id, agency.id, newStatus, 'تحديث إداري');
      setActionMsg({ type: 'success', text: res.message });
      loadAll();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'فشل تعديل حالة الوكالة' });
    }
  };

  // Host Link / Transfer / Unlink
  const handleHostAgencyAction = async () => {
    if (!selectedHostProfile || !hostActionType) return;
    try {
      if (hostActionType === 'LINK') {
        if (!targetAgencyId) {
          setActionMsg({ type: 'error', text: 'يرجى اختيار الوكالة للربط' });
          return;
        }
        const res = await API.linkHostToAgency(currentUser.id, selectedHostProfile.userId, targetAgencyId);
        setActionMsg({ type: 'success', text: res.message });
      } else if (hostActionType === 'TRANSFER') {
        if (!targetAgencyId) {
          setActionMsg({ type: 'error', text: 'يرجى اختيار الوكالة الجديدة' });
          return;
        }
        const res = await API.transferHostAgency(currentUser.id, selectedHostProfile.userId, targetAgencyId, 'نقل إداري');
        setActionMsg({ type: 'success', text: res.message });
      } else if (hostActionType === 'UNLINK') {
        const res = await API.unlinkHostFromAgency(currentUser.id, selectedHostProfile.userId, 'فك ارتباط إداري');
        setActionMsg({ type: 'success', text: res.message });
      }

      setSelectedHostProfile(null);
      setHostActionType(null);
      loadAll();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'فشلت العملية' });
    }
  };

  // Create Target Config
  const handleCreateTargetConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await API.createAdminTargetConfig(currentUser.id, {
        title: targetTitle,
        period: targetPeriod,
        monthYear: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
        requiredDiamonds: Number(reqDiamonds),
        requiredLiveMinutes: Number(reqLiveHours) * 60,
        requiredActiveDays: Number(reqActiveDays),
        rewardCoins: Number(rewardCoins),
        rewardDiamonds: Number(rewardDiamonds),
        agentCommissionPct: Number(agentCommPct),
        isActive: true
      });

      setActionMsg({ type: 'success', text: res.message });
      setShowTargetModal(false);
      loadAll();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'فشل إنشاء خطة التارجت' });
    }
  };

  const pendingHostApps = hostApps.filter(a => a.status === 'PENDING').length;
  const pendingAgentApps = agentApps.filter(a => a.status === 'PENDING').length;

  return (
    <div className="space-y-4 font-sans text-right">
      {/* Sub Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800">
        {[
          { id: 'host_apps' as const, label: 'طلبات المضيفين', icon: Mic, badge: pendingHostApps },
          { id: 'agent_apps' as const, label: 'طلبات الوكلاء', icon: Briefcase, badge: pendingAgentApps },
          { id: 'agencies' as const, label: 'إدارة الوكالات', icon: Building, count: agencies.length },
          { id: 'hosts' as const, label: 'إدارة المضيفين والتوزيع', icon: Users, count: hosts.length },
          { id: 'targets' as const, label: 'خطط التارجت والمكافآت', icon: Target, count: targetConfigs.length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {Boolean(tab.badge && tab.badge > 0) && (
                <span className="min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
              {tab.count !== undefined && (
                <span className="text-[10px] opacity-75 font-mono">({tab.count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Action Feedback Banner */}
      {actionMsg && (
        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
          actionMsg.type === 'success'
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
        }`}>
          {actionMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs">جاري تحميل البيانات...</span>
        </div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* TAB 1: HOST APPLICATIONS */}
          {/* ======================================================== */}
          {subTab === 'host_apps' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  إجمالي طلبات الانضمام: <strong>{hostApps.length}</strong> (المعلقة: <strong className="text-amber-400">{pendingHostApps}</strong>)
                </span>
              </div>

              {hostApps.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs bg-slate-800/40 rounded-xl border border-slate-700/50">
                  لا توجد طلبات انضمام مضيفين حالياً.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {hostApps.map(app => (
                    <div
                      key={app.id}
                      className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={app.userAvatar}
                          alt={app.userName}
                          className="w-12 h-12 rounded-full object-cover border border-amber-500/40"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <UserRoleBadges user={{ id: app.userId, name: app.userName, isHost: true }} size="sm" />
                            <h5 className="text-sm font-bold text-white">{app.userName}</h5>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              app.status === 'PENDING'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : app.status === 'APPROVED'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {app.status === 'PENDING' ? 'قيد المراجعة ⏳' : app.status === 'APPROVED' ? 'مقبول ومفعل ✅' : 'مرفوض ❌'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-2">
                            <span>📞 {app.phone}</span>
                            <span>•</span>
                            <span>🌍 {app.country || 'المملكة'}</span>
                            <span>•</span>
                            <span>🎙️ {app.specialTalent}</span>
                            {app.agentInviteCode && (
                              <>
                                <span>•</span>
                                <span className="text-amber-400 font-medium">كود الوكالة: {app.agentInviteCode}</span>
                              </>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 mt-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                            {app.experienceBio}
                          </p>
                        </div>
                      </div>

                      {app.status === 'PENDING' && (
                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                          <button
                            onClick={() => {
                              setSelectedHostApp(app);
                              setAssignAgencyId(app.agencyId || '');
                            }}
                            className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 size={14} />
                            <span>مراجعة واعتماد</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: AGENT APPLICATIONS */}
          {/* ======================================================== */}
          {subTab === 'agent_apps' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  إجمالي طلبات تأسيس الوكالات: <strong>{agentApps.length}</strong> (المعلقة / جاري المراجعة: <strong className="text-amber-400">{pendingAgentApps}</strong>)
                </span>
              </div>

              {agentApps.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs bg-slate-800/40 rounded-xl border border-slate-700/50">
                  لا توجد طلبات وكالات حالياً.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {agentApps.map(app => (
                    <div
                      key={app.id}
                      className="bg-slate-800/70 border border-slate-700/70 hover:border-blue-500/40 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <img
                          src={app.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={app.userName}
                          className="w-12 h-12 rounded-full object-cover border border-blue-500/40 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <UserRoleBadges user={{ id: app.userId, name: app.userName, role: app.status === 'APPROVED' ? 'AGENT' : undefined }} size="sm" />
                            <h5 className="text-sm font-bold text-white">{app.agencyName}</h5>
                            <span className="text-xs text-slate-300">({app.userName})</span>
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                              app.status === 'PENDING'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                                : app.status === 'APPROVED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}>
                              {app.status === 'PENDING' ? 'جاري المراجعة ⏳' : app.status === 'APPROVED' ? 'تم القبول ✅' : 'تم الرفض ❌'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-2 items-center">
                            <span>📞 {app.phone}</span>
                            <span>•</span>
                            <span>🌍 {app.country}</span>
                            <span>•</span>
                            <span>👥 عدد المضيفين المتوقع: {app.expectedHostsCount}</span>
                          </div>
                          {app.experienceBio && (
                            <p className="text-xs text-slate-300 mt-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800 line-clamp-2">
                              {app.experienceBio}
                            </p>
                          )}
                          {app.status === 'REJECTED' && app.rejectionReason && (
                            <p className="text-xs text-rose-300 mt-1.5 font-medium">
                              سبب الرفض: {app.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Explicit Action Buttons */}
                      <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-700/60 flex-wrap justify-end">
                        {app.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleReviewAgent('APPROVE', app, undefined, 15)}
                              disabled={isSubmittingReview}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                              title="قبول طلب الوكالة وتعيين المستخدم كوكيل"
                            >
                              <CheckCircle2 size={15} />
                              <span>قبول الطلب ✅</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setQuickRejectApp(app);
                                setQuickRejectReason('عدم كفاية بيانات الخبرة والإدارة');
                              }}
                              disabled={isSubmittingReview}
                              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20"
                              title="رفض طلب الوكالة"
                            >
                              <XCircle size={15} />
                              <span>رفض الطلب ❌</span>
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAgentApp(app);
                            setCommissionPct(15);
                            setAgentRejectReason(app.rejectionReason || 'عدم كفاية بيانات الخبرة والإدارة');
                          }}
                          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                        >
                          <Briefcase size={14} />
                          <span>التفاصيل</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: AGENCIES MANAGEMENT */}
          {/* ======================================================== */}
          {subTab === 'agencies' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {agencies.map(agency => (
                  <div
                    key={agency.id}
                    className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                          <Building size={20} />
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-white">{agency.agencyName}</h5>
                          <span className="text-xs font-mono text-blue-400">{agency.agencyCode}</span>
                        </div>
                      </div>

                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        agency.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {agency.status === 'ACTIVE' ? 'نشطة' : 'موقوفة'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center bg-slate-900/60 p-2 rounded-lg text-xs border border-slate-800">
                      <div>
                        <span className="text-slate-400 block text-[10px]">المضيفين</span>
                        <strong className="text-white font-mono">{agency.hostsCount}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">الماسات</span>
                        <strong className="text-sky-400 font-mono">{agency.totalDiamondsEarned.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">العمولة</span>
                        <strong className="text-amber-400 font-mono">{agency.commissionPercentage}%</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-slate-400">
                        كود الدعوة: <strong className="text-amber-400 font-mono">{agency.inviteCode}</strong>
                      </span>
                      <button
                        onClick={() => handleToggleAgencyStatus(agency)}
                        className={`px-3 py-1 rounded-lg font-bold text-[11px] transition ${
                          agency.status === 'ACTIVE'
                            ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {agency.status === 'ACTIVE' ? 'تجميد الوكالة' : 'تفعيل الوكالة'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: HOSTS MANAGEMENT & LINKING */}
          {/* ======================================================== */}
          {subTab === 'hosts' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  إجمالي المضيفين المعتمدين: <strong>{hosts.length}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {hosts.map(host => (
                  <div
                    key={host.id}
                    className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <img
                        src={host.userAvatar}
                        alt={host.userName}
                        className="w-12 h-12 rounded-full object-cover border border-amber-500/40"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-white">{host.userName}</h5>
                          <span className="text-xs font-mono text-amber-400 font-bold">{host.hostCode}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>الوكالة:</span>
                          {host.agencyName ? (
                            <strong className="text-emerald-400">{host.agencyName} ({host.agencyCode})</strong>
                          ) : (
                            <strong className="text-amber-300">مستقل بدون وكالة</strong>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex gap-3 font-mono">
                          <span>💎 {host.totalDiamondsReceived.toLocaleString()}</span>
                          <span>⏳ {Math.round(host.totalLiveMinutes / 60)} س</span>
                          <span>📅 {host.totalValidDays} يوم</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                      {host.agencyId ? (
                        <>
                          <button
                            onClick={() => {
                              setSelectedHostProfile(host);
                              setHostActionType('TRANSFER');
                              setTargetAgencyId('');
                            }}
                            className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <ArrowRightLeft size={13} />
                            <span>نقل لوكالة</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedHostProfile(host);
                              setHostActionType('UNLINK');
                            }}
                            className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <Unlink size={13} />
                            <span>فك الارتباط</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedHostProfile(host);
                            setHostActionType('LINK');
                            setTargetAgencyId(agencies[0]?.id || '');
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <Link size={13} />
                          <span>ربط بوكالة</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: TARGET CONFIGS MANAGEMENT */}
          {/* ======================================================== */}
          {subTab === 'targets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  إجمالي خطط التارجت النشطة: <strong>{targetConfigs.length}</strong>
                </span>
                <button
                  onClick={() => setShowTargetModal(true)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1 shadow-md shadow-amber-500/20"
                >
                  <Plus size={14} />
                  <span>إضافة خطة تارجت جديدة</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {targetConfigs.map(cfg => (
                  <div
                    key={cfg.id}
                    className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Target size={16} className="text-amber-400" />
                        <span>{cfg.title}</span>
                      </h5>
                      <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full font-bold">
                        {cfg.period === 'MONTHLY' ? 'شهري' : 'أسبوعي'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2.5 rounded-lg text-center text-xs border border-slate-800">
                      <div>
                        <span className="text-slate-400 block text-[10px]">الماسات المطلوبة</span>
                        <strong className="text-sky-400 font-mono">{cfg.requiredDiamonds.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">ساعات البث</span>
                        <strong className="text-amber-400 font-mono">{Math.round(cfg.requiredLiveMinutes / 60)} س</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">أيام صالحة</span>
                        <strong className="text-emerald-400 font-mono">{cfg.requiredActiveDays} يوم</strong>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-slate-300 pt-1 border-t border-slate-700/50">
                      <span>مكافأة المضيف: <strong className="text-amber-400 font-mono">+{cfg.rewardCoins.toLocaleString()} كوينز</strong></span>
                      <span>عمولة الوكالة: <strong className="text-blue-400 font-mono">{cfg.agentCommissionPct}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Host Review Modal */}
      {selectedHostApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 text-right">
            <h4 className="text-base font-bold text-white">مراجعة طلب المضيف: {selectedHostApp.userName}</h4>
            
            <div>
              <label className="block text-xs text-slate-400 mb-1">تعيين وكالة للمضيف (اختياري):</label>
              <select
                value={assignAgencyId}
                onChange={e => setAssignAgencyId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white"
              >
                <option value="">بدون وكالة (مضيف مستقل)</option>
                {agencies.filter(a => a.status === 'ACTIVE').map(ag => (
                  <option key={ag.id} value={ag.id}>
                    {ag.agencyName} ({ag.agencyCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">سبب الرفض (في حال الرفض):</label>
              <input
                type="text"
                value={hostRejectReason}
                onChange={e => setHostRejectReason(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedHostApp(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleReviewHost('REJECT')}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold"
              >
                رفض الطلب
              </button>
              <button
                onClick={() => handleReviewHost('APPROVE')}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
              >
                قبول واعتماد المضيف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Reject Modal */}
      {quickRejectApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-2xl p-5 space-y-4 text-right font-sans shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <button
                onClick={() => setQuickRejectApp(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <XCircle size={20} />
              </button>
              <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                <span>رفض طلب تسجيل الوكالة</span>
                <XCircle size={18} />
              </h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              أنت على وشك تغيير حالة طلب وكالة [<strong>{quickRejectApp.agencyName}</strong>] للمستخدم [<strong>{quickRejectApp.userName}</strong>] إلى «تم الرفض ❌».
            </p>

            <div>
              <label className="block text-xs text-slate-300 mb-1.5 font-medium">سبب الرفض (اختياري):</label>
              <textarea
                value={quickRejectReason}
                onChange={e => setQuickRejectReason(e.target.value)}
                placeholder="اكتب سبب الرفض الموجه لصاحب الطلب..."
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:border-rose-500 outline-none resize-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">يمكن للمستخدم التقديم بطلب جديد لاحقاً فور تعديل بياناته.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setQuickRejectApp(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleReviewAgent('REJECT', quickRejectApp, quickRejectReason)}
                disabled={isSubmittingReview}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-600/20"
              >
                <XCircle size={15} />
                <span>تأكيد رفض الطلب ❌</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedAgentApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl p-6 space-y-5 text-right font-sans my-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <button
                onClick={() => setSelectedAgentApp(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <XCircle size={22} />
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                  selectedAgentApp.status === 'PENDING'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : selectedAgentApp.status === 'APPROVED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {selectedAgentApp.status === 'PENDING' ? 'قيد المراجعة ⏳' : selectedAgentApp.status === 'APPROVED' ? 'وكالة معتمدة ✅' : 'طلب مرفوض ❌'}
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>تفاصيل طلب فتح الوكالة</span>
                  <Building size={18} className="text-blue-400" />
                </h3>
              </div>
            </div>

            {/* Applicant Profile Card */}
            <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-4 flex items-center gap-4">
              <img
                src={selectedAgentApp.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={selectedAgentApp.userName}
                className="w-14 h-14 rounded-full object-cover border-2 border-blue-500/50 shadow-md shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{selectedAgentApp.userName}</h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {selectedAgentApp.userId}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  تاريخ تقديم الطلب: {selectedAgentApp.createdAt ? new Date(selectedAgentApp.createdAt).toLocaleDateString('ar-EG') : 'اليوم'}
                </p>
              </div>
            </div>

            {/* Application Data Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">🏢 اسم الوكالة المطلوب:</span>
                <strong className="text-white text-sm font-bold">{selectedAgentApp.agencyName}</strong>
              </div>

              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">📞 رقم الهاتف والتواصل:</span>
                <strong className="text-blue-300 text-sm font-mono">{selectedAgentApp.phone}</strong>
              </div>

              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">🌍 دولة الوكالة:</span>
                <strong className="text-slate-200">{selectedAgentApp.country}</strong>
              </div>

              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">👥 عدد المضيفين المتوقع:</span>
                <strong className="text-amber-300 font-bold">{selectedAgentApp.expectedHostsCount} مضيف</strong>
              </div>
            </div>

            {/* Experience & Plan Details */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">📝 خبرة الوكالة وخطة الإدارة:</label>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                {selectedAgentApp.experienceBio || 'لا توجد تفاصيل إضافية مضافة.'}
              </div>
            </div>

            {/* Review Controls (for PENDING status) */}
            {selectedAgentApp.status === 'PENDING' ? (
              <div className="bg-slate-950/80 p-4 rounded-xl border border-blue-500/30 space-y-3.5">
                <h5 className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  <span>اتخاذ القرار وإدارة اعتماد الوكالة</span>
                </h5>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">نسبة عمولة الوكالة (%):</label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={commissionPct}
                    onChange={e => setCommissionPct(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono focus:border-blue-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">تحدد هذه النسبة عمولة الوكيل الرسمية من إنتاج المضيفين.</p>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">سبب الرفض (في حال اختيار رفض الطلب):</label>
                  <input
                    type="text"
                    value={agentRejectReason}
                    onChange={e => setAgentRejectReason(e.target.value)}
                    placeholder="اكتب سبب الرفض لوكيل الوكالة..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:border-rose-500 outline-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setSelectedAgentApp(null)}
                    disabled={isSubmittingReview}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => handleReviewAgent('REJECT')}
                    disabled={isSubmittingReview}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <XCircle size={15} />
                    <span>رفض الطلب</span>
                  </button>
                  <button
                    onClick={() => handleReviewAgent('APPROVE')}
                    disabled={isSubmittingReview}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                  >
                    <CheckCircle2 size={15} />
                    <span>موافقة وتأسيس الوكالة</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                {selectedAgentApp.status === 'APPROVED' ? (
                  <div className="text-emerald-400 font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>تم اعتماد هذه الوكالة وتأسيسها بنجاح (كود الوكالة: {selectedAgentApp.agencyCode || 'معتمد'})</span>
                  </div>
                ) : (
                  <div className="text-rose-400 font-bold space-y-1">
                    <div className="flex items-center gap-2">
                      <XCircle size={16} />
                      <span>تم رفض هذا الطلب</span>
                    </div>
                    {selectedAgentApp.rejectionReason && (
                      <p className="text-slate-400 font-normal text-[11px] bg-slate-900 p-2 rounded-lg">
                        السبب: {selectedAgentApp.rejectionReason}
                      </p>
                    )}
                  </div>
                )}
                {selectedAgentApp.reviewedByName && (
                  <p className="text-[10px] text-slate-500">تمت المراجعة بواسطة: {selectedAgentApp.reviewedByName}</p>
                )}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedAgentApp(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Host Agency Link/Transfer Modal */}
      {selectedHostProfile && hostActionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 text-right">
            <h4 className="text-base font-bold text-white">
              {hostActionType === 'LINK' && `ربط المضيف ${selectedHostProfile.userName} بوكالة`}
              {hostActionType === 'TRANSFER' && `نقل المضيف ${selectedHostProfile.userName} إلى وكالة أخرى`}
              {hostActionType === 'UNLINK' && `تأكيد فك ارتباط المضيف ${selectedHostProfile.userName}`}
            </h4>

            {hostActionType !== 'UNLINK' ? (
              <div>
                <label className="block text-xs text-slate-400 mb-1">اختر الوكالة:</label>
                <select
                  value={targetAgencyId}
                  onChange={e => setTargetAgencyId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white"
                >
                  <option value="">-- اختر الوكالة --</option>
                  {agencies.filter(a => a.status === 'ACTIVE').map(ag => (
                    <option key={ag.id} value={ag.id}>
                      {ag.agencyName} ({ag.agencyCode})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-xs text-slate-300">
                هل أنت متأكد من فك ارتباط هذا المضيف؟ سيصبح مضيفاً مستقلاً ويمكن إعادة ربطه لاحقاً.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedHostProfile(null);
                  setHostActionType(null);
                }}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleHostAgencyAction}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold"
              >
                تأكيد العملية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Target Config Creation Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-2xl p-5 space-y-4 text-right">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Target size={18} className="text-amber-400" />
              <span>إنشاء خطة تارجت جديدة للمضيفين</span>
            </h4>

            <form onSubmit={handleCreateTargetConfig} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">اسم الخطة / العنوان *</label>
                <input
                  type="text"
                  value={targetTitle}
                  onChange={e => setTargetTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">نوع الفترة</label>
                  <select
                    value={targetPeriod}
                    onChange={e => setTargetPeriod(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  >
                    <option value="MONTHLY">شهري (Monthly)</option>
                    <option value="WEEKLY">أسبوعي (Weekly)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">الماسات المطلوبة (Diamonds) *</label>
                  <input
                    type="number"
                    value={reqDiamonds}
                    onChange={e => setReqDiamonds(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">ساعات البث المطلوبة (ساعة) *</label>
                  <input
                    type="number"
                    value={reqLiveHours}
                    onChange={e => setReqLiveHours(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">الأيام الصالحة المطلوبة (يوم) *</label>
                  <input
                    type="number"
                    value={reqActiveDays}
                    onChange={e => setReqActiveDays(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">مكافأة كوينز للمضيف *</label>
                  <input
                    type="number"
                    value={rewardCoins}
                    onChange={e => setRewardCoins(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">مكافأة ماسات للمضيف *</label>
                  <input
                    type="number"
                    value={rewardDiamonds}
                    onChange={e => setRewardDiamonds(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">عمولة الوكيل (%) *</label>
                  <input
                    type="number"
                    value={agentCommPct}
                    onChange={e => setAgentCommPct(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTargetModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold"
                >
                  حفظ وتفعيل الخطة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
