import React, { useState, useEffect } from 'react';
import { User, AgencyDashboardData, HostAgencyRequest } from '../types';
import { API } from '../services/api';
import {
  Briefcase,
  Users,
  Gem,
  Trophy,
  Copy,
  Check,
  Building,
  Clock,
  Sparkles,
  TrendingUp,
  AlertCircle,
  X,
  Target,
  Percent,
  Search,
  CheckCircle2,
  XCircle,
  Phone,
  UserCheck,
  Unlink,
  Handshake
} from 'lucide-react';

interface AgencyDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

export const AgencyDashboardModal: React.FC<AgencyDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [data, setData] = useState<AgencyDashboardData | null>(null);
  const [pendingRequests, setPendingRequests] = useState<HostAgencyRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'hosts' | 'requests'>('requests');
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadAgencyData = () => {
    if (!currentUser) return;
    setLoading(true);
    setErrorMsg(null);

    Promise.all([
      API.getAgentDashboard(currentUser.id).catch(() => null),
      API.getAgencyHostRequests(currentUser.id).catch(() => [])
    ])
      .then(([dashRes, requestsRes]) => {
        setData(dashRes);
        setPendingRequests(requestsRes.filter(r => r.status === 'PENDING'));
        if (requestsRes.filter(r => r.status === 'PENDING').length > 0) {
          setActiveTab('requests');
        } else {
          setActiveTab('hosts');
        }
        setLoading(false);
      })
      .catch(err => {
        setErrorMsg(err.message || 'تعذر تحميل بيانات الوكالة أو الحساب غير مصرح');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      loadAgencyData();
    }
  }, [isOpen, currentUser.id]);

  if (!isOpen) return null;

  const agency = data?.agency;
  const hosts = data?.hosts || [];

  const filteredHosts = hosts.filter(h =>
    (h.hostName || (h as any).userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (h.hostCode || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyInviteCode = () => {
    if (!agency?.agencyCode && !agency?.inviteCode) return;
    const codeToCopy = agency.agencyCode || agency.inviteCode;
    navigator.clipboard.writeText(codeToCopy);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Review Host Request (Accept / Reject)
  const handleReviewRequest = async (requestId: string, action: 'ACCEPTED' | 'REJECTED') => {
    setActionLoadingId(requestId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await API.reviewHostAgencyRequest({
        agencyOwnerUserId: currentUser.id,
        requestId,
        action
      });

      if (res.success) {
        setSuccessMsg(res.message);
        loadAgencyData();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشلت معالجة الطلب');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Terminate Host Agency Contract (Mutual Release)
  const handleTerminateContract = async (hostUserId: string, hostName: string) => {
    if (!confirm(`هل أنت متاكد من الموافقة على إنهاء العقد وفك الارتباط الودي مع المضيف [${hostName}]؟`)) return;

    setActionLoadingId(hostUserId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await API.terminateHostAgencyContract({
        agencyOwnerUserId: currentUser.id,
        hostUserId
      });

      if (res.success) {
        setSuccessMsg(res.message);
        loadAgencyData();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشلت معالجة إنهاء العقد');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-blue-500/30 rounded-3xl shadow-2xl overflow-hidden my-6 text-right">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600/30 via-slate-800 to-slate-900 p-5 border-b border-slate-700/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 justify-end">
                <span>لوحة تحكم الوكيل والوكالة</span>
                <span className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400">
                  <Briefcase size={18} />
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">قبول طلبات المضيفين الجدد، متابعة ساعات التارجت، ونسب العمولات والأرباح</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {loading ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>جاري تحميل بيانات الوكالة والمضيفين...</span>
            </div>
          ) : errorMsg || !agency ? (
            <div className="py-14 text-center text-slate-300 space-y-3">
              <AlertCircle size={40} className="mx-auto text-amber-400" />
              <h3 className="text-base font-bold text-white">لا توجد وكالة نشطة مرتبطة بحسابك</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {errorMsg || 'يجب تقديم طلب تسجيل وكالة والحصول على موافقة الإدارة قبل فتح لوحة الوكيل.'}
              </p>
            </div>
          ) : (
            <>
              {successMsg && (
                <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Agency Overview Card */}
              <div className="bg-gradient-to-l from-slate-800/90 to-slate-800/50 border border-blue-500/30 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-5">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20 shrink-0">
                    <Building size={32} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{agency.agencyName}</h3>
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                        وكالة معتمدة
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-300">
                      <span>كود الوكالة: <strong className="text-blue-400 font-mono">{agency.agencyCode}</strong></span>
                      <span>•</span>
                      <span>المالك: <strong className="text-white">{agency.ownerName}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Agency Code Quick Copy Box */}
                <div className="w-full md:w-auto bg-slate-950/80 border border-slate-700/80 rounded-2xl p-3 flex items-center justify-between gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">كود الوكالة لمنح الانضمام المباشر للمضيفين:</span>
                    <strong className="text-sm font-bold text-amber-400 font-mono tracking-wider">{agency.agencyCode}</strong>
                  </div>
                  <button
                    onClick={handleCopyInviteCode}
                    className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer"
                    title="نسخ كود الوكالة"
                  >
                    {copiedCode ? <Check size={15} className="text-emerald-300" /> : <Copy size={15} />}
                    <span>{copiedCode ? 'تم النسخ' : 'نسخ الكود'}</span>
                  </button>
                </div>
              </div>

              {/* Navigation Sub-Tabs */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('requests')}
                    className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      activeTab === 'requests'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
                        : 'bg-slate-800/80 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Clock size={15} />
                    <span>طلبات المضيفين الجدد</span>
                    {pendingRequests.length > 0 && (
                      <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-black animate-pulse">
                        {pendingRequests.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('hosts')}
                    className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      activeTab === 'hosts'
                        ? 'bg-blue-600 text-white font-black shadow-lg'
                        : 'bg-slate-800/80 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Users size={15} />
                    <span>المضيفين الحاليين ({hosts.length})</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: NEW HOST JOIN REQUESTS */}
              {activeTab === 'requests' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Clock size={16} />
                    <span>طلبات المضيفين الراغبين بالانضمام بكود وكالتك ({pendingRequests.length})</span>
                  </h4>

                  {pendingRequests.length === 0 ? (
                    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-8 text-center text-slate-400 space-y-2">
                      <UserCheck size={32} className="mx-auto text-slate-500 opacity-60" />
                      <p className="text-xs">لا توجد طلبات انضمام جديدة قيد الانتظار حالياً.</p>
                      <p className="text-[11px] text-slate-500">
                        شارك كود وكالتك <strong className="text-amber-400 font-mono">{agency.agencyCode}</strong> مع المضيفين ليقوموا بإرسال طلب انضمام يظهر هنا فوراً.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {pendingRequests.map(req => (
                        <div
                          key={req.id}
                          className="bg-slate-950 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-inner"
                        >
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <img
                              src={req.userAvatar}
                              alt={req.userName}
                              className="w-12 h-12 rounded-full object-cover border-2 border-amber-400"
                            />
                            <div className="text-right">
                              <h5 className="text-sm font-black text-white">{req.userName}</h5>
                              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                <span className="flex items-center gap-1 font-mono text-amber-300">
                                  <Phone size={13} /> {req.phone}
                                </span>
                                <span>•</span>
                                <span>{new Date(req.createdAt).toLocaleDateString('ar-EG')}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons: Accept / Reject */}
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => handleReviewRequest(req.id, 'REJECTED')}
                              disabled={actionLoadingId === req.id}
                              className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1"
                            >
                              <XCircle size={15} />
                              <span>رفض ❌</span>
                            </button>

                            <button
                              onClick={() => handleReviewRequest(req.id, 'ACCEPTED')}
                              disabled={actionLoadingId === req.id}
                              className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle2 size={15} />
                              <span>قبول وانضمام ✅</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CURRENT HOSTS LIST */}
              {activeTab === 'hosts' && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="بحث باسم المضيف أو الكود..."
                        className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition text-right pr-8"
                      />
                      <Search size={14} className="absolute right-2.5 top-3 text-slate-400" />
                    </div>
                  </div>

                  {filteredHosts.length === 0 ? (
                    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-8 text-center text-slate-400 space-y-2">
                      <Users size={32} className="mx-auto text-slate-500" />
                      <p className="text-xs">لا يوجد مضيفين مسجلين في وكالتك حالياً.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {filteredHosts.map(host => {
                        const hostUser = (host as any).user || {};
                        const hostProf = (host as any).hostProfile || host;
                        const targetProg = (host as any).targetProgress;

                        return (
                          <div
                            key={hostProf.id || hostUser.id}
                            className="bg-slate-800/80 border border-slate-700/70 hover:border-slate-600 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition"
                          >
                            {/* Host Details */}
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                              <img
                                src={hostProf.userAvatar || hostUser.avatar}
                                alt={hostProf.userName || hostUser.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-amber-400"
                              />
                              <div className="text-right">
                                <div className="flex items-center gap-2">
                                  <h5 className="text-sm font-bold text-white">{hostProf.userName || hostUser.name}</h5>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300">
                                    مضيف معتمد
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                  <span className="font-mono text-amber-400 font-bold">{hostProf.hostCode}</span>
                                  <span>•</span>
                                  <span>{hostProf.category || 'صوتي وتفاعلي'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Actions: Terminate Contract (Mutual Release) */}
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                              <button
                                onClick={() => handleTerminateContract(hostProf.userId || hostUser.id, hostProf.userName || hostUser.name)}
                                disabled={actionLoadingId === (hostProf.userId || hostUser.id)}
                                className="px-3.5 py-2 bg-slate-900 hover:bg-rose-500/20 text-rose-300 border border-slate-700 hover:border-rose-500/40 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                                title="فك الارتباط الودي وإنهاء العقد"
                              >
                                <Handshake size={15} className="text-rose-400" />
                                <span>إنهاء العقد / فك ارتباط ودي 🤝</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
