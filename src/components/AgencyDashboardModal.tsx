import React, { useState, useEffect } from 'react';
import { User, AgencyDashboardData } from '../types';
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
  Search
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
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadAgencyData = () => {
    if (!currentUser) return;
    setLoading(true);
    setErrorMsg(null);
    API.getAgentDashboard(currentUser.id)
      .then(res => {
        setData(res);
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
    h.hostName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.hostCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyInviteCode = () => {
    if (!agency?.inviteCode) return;
    navigator.clipboard.writeText(agency.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden my-6 text-right">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600/30 via-slate-800 to-slate-900 p-5 border-b border-slate-700/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 justify-end">
                <span>لوحة تحكم الوكيل والوكالة</span>
                <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                  <Briefcase size={18} />
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">إدارة مضيفي الوكالة، متابعة التارجت اليومي، ونسب العمولات والأرباح</p>
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
              {/* Agency Overview Card */}
              <div className="bg-gradient-to-l from-slate-800/90 to-slate-800/50 border border-blue-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-5">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20 shrink-0">
                    <Building size={32} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{agency.agencyName}</h3>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                        وكالة معتمدة
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-300">
                      <span>كود الوكالة: <strong className="text-blue-400 font-mono">{agency.agencyCode}</strong></span>
                      <span>•</span>
                      <span>المالك: <strong className="text-white">{agency.ownerName}</strong></span>
                      <span>•</span>
                      <span className="text-amber-400 font-bold flex items-center gap-0.5">
                        <Percent size={13} />
                        <span>عمولة الوكالة: {agency.commissionPercentage}%</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Invite Code Quick Copy Box */}
                <div className="w-full md:w-auto bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">كود دعوة المضيفين للوكالة:</span>
                    <strong className="text-sm font-bold text-amber-400 font-mono tracking-wider">{agency.inviteCode}</strong>
                  </div>
                  <button
                    onClick={handleCopyInviteCode}
                    className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition flex items-center gap-1.5 text-xs font-bold shrink-0"
                    title="نسخ كود الدعوة"
                  >
                    {copiedCode ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                    <span>{copiedCode ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>
              </div>

              {/* Agency Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-4 text-center">
                  <Users size={20} className="text-blue-400 mx-auto mb-1.5" />
                  <span className="text-xs text-slate-400 block">إجمالي المضيفين</span>
                  <strong className="text-base font-bold text-white font-mono">
                    {data.summary.totalHosts}
                  </strong>
                </div>

                <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-4 text-center">
                  <Gem size={20} className="text-sky-400 mx-auto mb-1.5" />
                  <span className="text-xs text-slate-400 block">ماسات الوكالة</span>
                  <strong className="text-base font-bold text-white font-mono">
                    {data.summary.totalDiamonds.toLocaleString()}
                  </strong>
                </div>

                <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-4 text-center">
                  <TrendingUp size={20} className="text-amber-400 mx-auto mb-1.5" />
                  <span className="text-xs text-slate-400 block">متوسط إنجاز التارجت</span>
                  <strong className="text-base font-bold text-amber-400 font-mono">
                    {data.summary.avgTargetCompletion}%
                  </strong>
                </div>

                <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-4 text-center">
                  <Trophy size={20} className="text-emerald-400 mx-auto mb-1.5" />
                  <span className="text-xs text-slate-400 block">تارجت مكتمل</span>
                  <strong className="text-base font-bold text-emerald-400 font-mono">
                    {data.summary.targetsAchieved}
                  </strong>
                </div>
              </div>

              {/* Host List Header & Search */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>قائمة مضيفي الوكالة</span>
                      <span className="px-2 py-0.5 bg-slate-800 rounded-full text-xs text-slate-300 font-mono">
                        ({filteredHosts.length})
                      </span>
                    </h4>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="بحث باسم المضيف أو الكود..."
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 transition text-right pr-8"
                    />
                    <Search size={14} className="absolute right-2.5 top-2.5 text-slate-400" />
                  </div>
                </div>

                {/* Hosts List Table / Cards */}
                {filteredHosts.length === 0 ? (
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-8 text-center text-slate-400 space-y-2">
                    <Users size={32} className="mx-auto text-slate-500" />
                    <p className="text-xs">لا يوجد مضيفين مسجلين في وكالتك بعد.</p>
                    <p className="text-[11px] text-slate-400">
                      شارك كود الدعوة <strong className="text-amber-400 font-mono">{agency.inviteCode}</strong> مع المضيفين لربط حساباتهم بوكالتك تلقائياً عند التسجيل.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {filteredHosts.map(host => (
                      <div
                        key={host.hostUserId}
                        className="bg-slate-800/80 border border-slate-700/70 hover:border-slate-600 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition"
                      >
                        {/* Host Info */}
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <img
                            src={host.hostAvatar}
                            alt={host.hostName}
                            className="w-12 h-12 rounded-full object-cover border border-amber-500/40"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-bold text-white">{host.hostName}</h5>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                host.status === 'ACTIVE'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}>
                                {host.status === 'ACTIVE' ? 'نشط' : 'موقوف'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                              <span className="font-mono text-amber-400 font-bold">{host.hostCode}</span>
                              <span>•</span>
                              <span>{host.category}</span>
                            </div>
                          </div>
                        </div>

                        {/* Performance & Target Progress */}
                        <div className="w-full sm:w-72 space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-mono font-bold text-amber-400">{host.targetCompletionPercent}%</span>
                            <span className="text-slate-300 flex items-center gap-1">
                              <Gem size={12} className="text-sky-400" />
                              <span className="font-mono font-bold text-white">{host.currentDiamonds.toLocaleString()}</span>
                              <span className="text-slate-400">/ {host.targetGoalDiamonds.toLocaleString()}</span>
                            </span>
                          </div>

                          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-700/50">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(3, host.targetCompletionPercent))}%` }}
                            ></div>
                          </div>

                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>ساعات البث: <strong className="text-slate-200 font-mono">{Math.round(host.liveMinutes / 60)} س</strong></span>
                            <span>{host.targetCompletionPercent >= 100 ? '✅ التارجت محقق' : 'جاري العمل'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
