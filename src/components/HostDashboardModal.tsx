import React, { useState, useEffect } from 'react';
import { User, HostDashboardData } from '../types';
import { API } from '../services/api';
import {
  Mic,
  Trophy,
  Target,
  Gem,
  Clock,
  Calendar,
  Building,
  CheckCircle2,
  Gift,
  AlertCircle,
  X,
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  Coins
} from 'lucide-react';

interface HostDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onOpenLive?: () => void;
}

export const HostDashboardModal: React.FC<HostDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenLive
}) => {
  const [data, setData] = useState<HostDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [claiming, setClaiming] = useState<boolean>(false);
  const [claimMsg, setClaimMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadDashboard = () => {
    if (!currentUser) return;
    setLoading(true);
    API.getHostDashboard(currentUser.id)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load host dashboard:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      loadDashboard();
      setClaimMsg(null);
    }
  }, [isOpen, currentUser.id]);

  if (!isOpen) return null;

  const handleClaimReward = async (targetConfigId: string) => {
    setClaiming(true);
    setClaimMsg(null);
    try {
      const res = await API.claimHostTarget(currentUser.id, targetConfigId);
      if (res.success) {
        setClaimMsg({ type: 'success', text: res.message });
        loadDashboard();
      } else {
        setClaimMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setClaimMsg({ type: 'error', text: err.message || 'فشل استلام المكافأة' });
    } finally {
      setClaiming(false);
    }
  };

  const progress = data?.targetProgress;
  const profile = data?.hostProfile;
  const agency = data?.agency;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden my-6 text-right">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-600/30 via-slate-800 to-slate-900 p-5 border-b border-slate-700/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 justify-end">
                <span>لوحة تحكم المضيف والتارجت</span>
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <Mic size={18} />
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">متابعة دقيقة للأداء اليومي، ساعات البث، وإنجاز التارجت والماسات</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <span>جاري مزامنة بيانات البث والتارجت من السيرفر...</span>
            </div>
          ) : !data ? (
            <div className="py-12 text-center text-slate-400">
              <AlertCircle size={36} className="mx-auto text-rose-400 mb-2" />
              <p>تعذر تحميل بيانات المضيف. يرجى التأكد من تسجيلك كمضيف معتمد.</p>
            </div>
          ) : (
            <>
              {/* Host Profile Info Card */}
              <div className="relative bg-gradient-to-l from-slate-800/90 to-slate-800/40 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 w-full sm:w-auto">
                  <div className="relative">
                    <img
                      src={profile?.userAvatar || currentUser.avatar}
                      alt={profile?.userName || currentUser.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 shadow-md shadow-amber-500/10"
                    />
                    <span className="absolute -bottom-1 -right-1 p-1 bg-amber-500 text-slate-950 rounded-full">
                      <Mic size={12} />
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{profile?.userName || currentUser.name}</h3>
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-bold">
                        مضيف معتمد
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-300">
                      <span className="text-amber-400 font-mono font-bold">{profile?.hostCode || 'HOST-NEW'}</span>
                      <span>•</span>
                      <span className="text-slate-400">{profile?.category || 'ترفيه وصوتيات'}</span>
                    </div>
                  </div>
                </div>

                {/* Agency Status Badge */}
                <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between gap-1.5 bg-slate-900/60 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border border-slate-700/50 sm:border-0">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Building size={14} className="text-amber-400" />
                    <span>الوكالة التابعة:</span>
                  </span>
                  {agency ? (
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-400">{agency.agencyName}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">({agency.agencyCode})</span>
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      مضيف مستقل
                    </span>
                  )}
                </div>
              </div>

              {/* Claim Feedback Banner */}
              {claimMsg && (
                <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 border ${
                  claimMsg.type === 'success'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                }`}>
                  {claimMsg.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
                  <span>{claimMsg.text}</span>
                </div>
              )}

              {/* Current Active Target Card */}
              {progress && (
                <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                      progress.isAchieved
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {progress.isAchieved ? <CheckCircle2 size={14} /> : <TrendingUp size={14} />}
                      <span>{progress.isAchieved ? 'تم إنجاز التارجت بنجاح! 🏆' : 'قيد التقدم نحو التارجت'}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{progress.targetTitle}</h4>
                      <Target size={16} className="text-amber-400" />
                    </div>
                  </div>

                  {/* Main Diamonds Target Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-amber-400 font-bold font-mono">
                        {progress.progressPercentage}%
                      </span>
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <span>الماسات المحققة:</span>
                        <span className="text-white font-bold font-mono">
                          {progress.currentDiamonds.toLocaleString()} / {progress.targetDiamonds.toLocaleString()}
                        </span>
                        <Gem size={14} className="text-sky-400" />
                      </span>
                    </div>

                    <div className="w-full bg-slate-950 rounded-full h-3.5 p-0.5 overflow-hidden border border-slate-700/60">
                      <div
                        className="bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, Math.max(3, progress.progressPercentage))}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
                      <span>المتبقي للهدف: <strong className="text-amber-300 font-mono">{progress.remainingDiamonds.toLocaleString()}</strong> ماسة</span>
                      <span>تحديث فوري من الهدايا المباشرة ⚡</span>
                    </div>
                  </div>

                  {/* Secondary Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                      <div className="text-left font-mono">
                        <span className="text-xs font-bold text-white block">
                          {Math.round(progress.currentLiveMinutes / 60)} / {Math.round(progress.targetLiveMinutes / 60)} س
                        </span>
                        <span className="text-[10px] text-slate-400">ساعات البث المطلوبة</span>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        <Clock size={16} />
                      </div>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                      <div className="text-left font-mono">
                        <span className="text-xs font-bold text-white block">
                          {progress.currentActiveDays} / {progress.targetActiveDays} يوم
                        </span>
                        <span className="text-[10px] text-slate-400">الأيام النشطة المؤهلة</span>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                        <Calendar size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Claim Reward Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleClaimReward(progress.targetConfigId)}
                      disabled={!progress.isAchieved || claiming}
                      className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg ${
                        progress.isAchieved
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 shadow-emerald-500/20 animate-pulse'
                          : 'bg-slate-800 border border-slate-700 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Trophy size={16} />
                      <span>
                        {progress.isAchieved
                          ? (claiming ? 'جاري استلام المكافأة...' : 'استلام مكافأة التارجت الآن 🎉')
                          : 'المكافأة تتاح فور تحقيق هدف الماسات والساعات'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Lifetime Performance Stats */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <TrendingUp size={15} className="text-amber-400" />
                  <span>إجمالي إحصائيات المضيف التراكمية</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-center">
                    <Gem size={18} className="text-sky-400 mx-auto mb-1" />
                    <span className="text-xs text-slate-400 block">إجمالي الماسات</span>
                    <strong className="text-sm font-bold text-white font-mono">
                      {(profile?.totalDiamondsReceived || 0).toLocaleString()}
                    </strong>
                  </div>

                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-center">
                    <Clock size={18} className="text-amber-400 mx-auto mb-1" />
                    <span className="text-xs text-slate-400 block">ساعات البث</span>
                    <strong className="text-sm font-bold text-white font-mono">
                      {data.eligibleLiveHours} س
                    </strong>
                  </div>

                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-center">
                    <Gift size={18} className="text-rose-400 mx-auto mb-1" />
                    <span className="text-xs text-slate-400 block">الهدايا المستلمة</span>
                    <strong className="text-sm font-bold text-white font-mono">
                      {data.eligibleGiftsCount}
                    </strong>
                  </div>

                  <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-center">
                    <Calendar size={18} className="text-emerald-400 mx-auto mb-1" />
                    <span className="text-xs text-slate-400 block">أيام البث</span>
                    <strong className="text-sm font-bold text-white font-mono">
                      {profile?.totalValidDays || 1} يوم
                    </strong>
                  </div>
                </div>
              </div>

              {/* Host Tips & Rules */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-2 text-xs text-slate-300">
                <h5 className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles size={15} />
                  <span>شروط وقواعد احتساب التارجت في حكاوي:</span>
                </h5>
                <ul className="space-y-1.5 text-[11px] text-slate-400 list-disc list-inside">
                  <li>يتم احتساب الماسات تلقائياً ومباشرة مع كل هدية يستلمها المضيف على المايك.</li>
                  <li>اليوم الصالح للبث يحتسب عند التواجد على المايك لمدة 60 دقيقة على الأقل في اليوم.</li>
                  <li>الالتزام التام بقوانين الحشمة والآداب وعدم التلفظ أو فتح كاميرا مخالفة.</li>
                  <li>تُصرف مكافآت التارجت فور الإنجاز مباشرة في محفظتك.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
