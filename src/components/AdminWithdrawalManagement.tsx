import React, { useState, useEffect } from 'react';
import { User, HostWithdrawalRequest } from '../types';
import { API } from '../services/api';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Gem,
  Coins,
  AlertTriangle,
  User as UserIcon,
  Calendar,
  Building,
  DollarSign,
  TrendingUp,
  X,
  Send,
  Award
} from 'lucide-react';

interface AdminWithdrawalManagementProps {
  currentUser: User;
}

export const AdminWithdrawalManagement: React.FC<AdminWithdrawalManagementProps> = ({ currentUser }) => {
  const [requests, setRequests] = useState<HostWithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectModalReq, setRejectModalReq] = useState<HostWithdrawalRequest | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('لم يتم استيفاء شروط التارجت المحددة لهذا الشهر');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const reqs = await API.getAdminWithdrawalRequests(currentUser.id);
      setRequests(reqs);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل جلب طلبات السحب');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [currentUser.id]);

  const handleApprove = async (req: HostWithdrawalRequest) => {
    if (!confirm(`هل أنت متأكد من قبول واعتماد تحويل مبلغ ${req.requestedAmountUsdOrEgp.toLocaleString()} جنيه للمضيف ${req.userName}؟`)) {
      return;
    }

    setActionLoadingId(req.id);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await API.reviewWithdrawalRequest({
        adminId: currentUser.id,
        requestId: req.id,
        action: 'APPROVE'
      });

      if (res.success) {
        setSuccessMsg(res.message);
        await loadRequests();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل اعتماد الطلب');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalReq) return;

    setActionLoadingId(rejectModalReq.id);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await API.reviewWithdrawalRequest({
        adminId: currentUser.id,
        requestId: rejectModalReq.id,
        action: 'REJECT',
        rejectionReason: rejectionReasonInput.trim()
      });

      if (res.success) {
        setSuccessMsg(res.message);
        setRejectModalReq(null);
        await loadRequests();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل رفض الطلب');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        r.userName.toLowerCase().includes(q) ||
        (r.userNumericId && r.userNumericId.includes(q)) ||
        r.paymentAccountDetails.toLowerCase().includes(q) ||
        r.paymentMethod.toLowerCase().includes(q) ||
        (r.agencyName && r.agencyName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="space-y-4 text-right dir-rtl font-sans">
      {/* Header Info */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              <span>إدارة طلبات سحب الأرباح والتحويلات</span>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs animate-pulse">
                  {pendingCount} طلب قيد المراجعة
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">مراجعة أرباح المضيفين والوكلاء واعتماد التحويلات المالية يوم 15 من كل شهر</p>
          </div>
        </div>

        <button
          onClick={loadRequests}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
        >
          تحديث القائمة 🔄
        </button>
      </div>

      {/* Messages Alert */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            { id: 'PENDING' as const, label: `قيد المراجعة (${pendingCount})` },
            { id: 'APPROVED' as const, label: `المقبولة (${requests.filter(r => r.status === 'APPROVED').length})` },
            { id: 'REJECTED' as const, label: `المرفوضة (${requests.filter(r => r.status === 'REJECTED').length})` },
            { id: 'ALL' as const, label: `الكل (${requests.length})` }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === f.id
                  ? f.id === 'PENDING'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-purple-600 text-white font-extrabold shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px] flex-1 sm:flex-initial">
          <input
            type="text"
            placeholder="بحث بالمضيف، الـ ID، وسيلة الدفع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3 py-1.5 pr-8 text-xs text-slate-200 focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs font-bold">جاري تحميل طلبات السحب...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
          <CreditCard className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-xs font-bold text-slate-400">لا توجد طلبات سحب في هذه القائمة حالياً.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map(req => {
            const isLoadingThis = actionLoadingId === req.id;
            return (
              <div
                key={req.id}
                className={`bg-slate-900/90 border rounded-2xl p-4 space-y-3.5 shadow-xl transition-all ${
                  req.status === 'PENDING'
                    ? 'border-amber-500/50 shadow-amber-500/5'
                    : req.status === 'APPROVED'
                    ? 'border-emerald-500/30'
                    : 'border-rose-500/30'
                }`}
              >
                {/* Top Row: User Avatar + Name + ID + Status */}
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={req.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${req.userId}`}
                      alt={req.userName}
                      className="w-11 h-11 rounded-full object-cover border-2 border-amber-400 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-100">{req.userName}</span>
                        <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                          ID: {req.userNumericId || req.userId}
                        </span>
                        <span className="px-2 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                          {req.role}
                        </span>
                        {req.agencyName && (
                          <span className="px-2 py-0.2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                            وكالة: {req.agencyName}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        شهر: {req.monthPeriod} | تاريخ التقديم: {new Date(req.requestedAt).toLocaleString('ar-EG')}
                      </span>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-black shadow-md ${
                    req.status === 'APPROVED'
                      ? 'bg-emerald-500 text-slate-950'
                      : req.status === 'REJECTED'
                      ? 'bg-rose-500 text-white'
                      : 'bg-amber-500 text-slate-950 animate-pulse'
                  }`}>
                    {req.status === 'APPROVED' ? 'تمت الموافقة والتحويل ✅' : req.status === 'REJECTED' ? 'طلب مرفوض ❌' : 'قيد المراجعة الإدارية ⏳'}
                  </span>
                </div>

                {/* DETAILED EARNINGS & TARGET REPORT */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2 text-xs">
                  <h4 className="font-extrabold text-amber-400 flex items-center gap-1.5 text-xs">
                    <Award className="w-4 h-4" />
                    <span>تقرير أرباح وإنجاز المضيف التفصيلي لهذا الشهر:</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">إنجاز التارجت</span>
                      <strong className="text-amber-300 text-xs truncate block">{req.targetAchievedTitle}</strong>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">ماسات التارجت المحققة</span>
                      <strong className="text-sky-300 font-mono text-xs">{req.targetAchievedDiamonds.toLocaleString()} 💎</strong>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">ساعات البث والأيام</span>
                      <strong className="text-slate-200 font-mono text-xs">{Math.round(req.targetLiveMinutes / 60)} س / {req.targetActiveDays} يوم</strong>
                    </div>

                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">كونز الهدايا المستلمة</span>
                      <strong className="text-amber-400 font-mono text-xs">{req.giftCoinsReceived.toLocaleString()} كوينز</strong>
                    </div>
                  </div>
                </div>

                {/* FINANCIAL REQUEST DETAILS & PAYMENT METHOD */}
                <div className="bg-gradient-to-r from-amber-500/10 via-slate-950 to-slate-950 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between flex-wrap gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 block">المبلغ المالي المطلوبة سحبه:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-amber-300 font-mono">{req.requestedDiamonds.toLocaleString()} 💎</span>
                      <span className="text-sm font-extrabold text-emerald-400 font-mono">(= {req.requestedAmountUsdOrEgp.toLocaleString()} جنيه مصري)</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <span className="text-[11px] text-slate-400 block">وسيلة الدفع ورقم الحساب/المحفظة:</span>
                    <span className="text-xs font-black text-slate-100 bg-slate-900 px-3 py-1 rounded-xl border border-slate-700 font-mono inline-block">
                      {req.paymentMethod}: {req.paymentAccountDetails}
                    </span>
                  </div>
                </div>

                {req.rejectionReason && (
                  <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold">
                    سبب الرفض: {req.rejectionReason}
                  </div>
                )}

                {/* ADMIN CONTROL BUTTONS */}
                {req.status === 'PENDING' && (
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800 justify-end">
                    <button
                      onClick={() => setRejectModalReq(req)}
                      disabled={isLoadingThis}
                      className="px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 text-xs font-extrabold transition-all cursor-pointer"
                    >
                      [رفض الطلب ❌]
                    </button>

                    <button
                      onClick={() => handleApprove(req)}
                      disabled={isLoadingThis}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer"
                    >
                      {isLoadingThis ? 'جاري الاعتماد...' : '[قبول واعتماد التحويل ✅]'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-2xl p-5 space-y-4 shadow-2xl text-right dir-rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-extrabold text-sm text-rose-300">رفض طلب السحب وإعادة الرصيد للمضيف</h3>
              <button onClick={() => setRejectModalReq(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed">
              سيتم رفض طلب السحب الخاص بالمضيف <strong className="text-amber-300">{rejectModalReq.userName}</strong> وإرجاع رصيد (<strong className="text-sky-300 font-mono">{rejectModalReq.requestedDiamonds.toLocaleString()} 💎</strong>) إلى محفظته.
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">سبب الرفض الموجه للمضيف:</label>
                <textarea
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-rose-400 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalReq(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg"
                >
                  تأكيد الرفض وإعادة الرصيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
