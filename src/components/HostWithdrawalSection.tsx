import React, { useState, useEffect } from 'react';
import { User, HostWithdrawalRequest } from '../types';
import { API } from '../services/api';
import {
  CreditCard,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Gem,
  Send,
  Building,
  ShieldCheck,
  Calendar,
  Sparkles,
  DollarSign,
  Coins
} from 'lucide-react';

interface HostWithdrawalSectionProps {
  currentUser: User;
  onUserUpdated?: (user: User) => void;
  isOwnerAdmin?: boolean;
}

export const HostWithdrawalSection: React.FC<HostWithdrawalSectionProps> = ({
  currentUser,
  onUserUpdated,
  isOwnerAdmin = false
}) => {
  const [requests, setRequests] = useState<HostWithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestedDiamonds, setRequestedDiamonds] = useState<number>(currentUser.diamonds || 0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Vodafone Cash');
  const [paymentAccountDetails, setPaymentAccountDetails] = useState<string>(currentUser.phone || '');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [overrideDate, setOverrideDate] = useState(false);

  const now = new Date();
  const todayDay = now.getDate();
  const isDay15 = todayDay === 15;

  // Calculate days remaining until 15th
  const daysUntil15 = todayDay < 15
    ? 15 - todayDay
    : Math.ceil((new Date(now.getFullYear(), now.getMonth() + 1, 15).getTime() - now.getTime()) / (1000 * 3600 * 24));

  const loadRequests = async () => {
    try {
      setLoading(true);
      const reqs = await API.getUserWithdrawalRequests(currentUser.id);
      setRequests(reqs);
    } catch (e) {
      console.warn('Failed to fetch withdrawal requests:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      loadRequests();
      setRequestedDiamonds(currentUser.diamonds || 0);
    }
  }, [currentUser?.id, currentUser?.diamonds]);

  const activePendingRequest = requests.find(r => r.status === 'PENDING');

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!isDay15 && !overrideDate) {
      setMsg({ type: 'error', text: 'فترة طلبات السحب تفتح حصرياً يوم 15 من كل شهر ميلادي' });
      return;
    }

    if (requestedDiamonds <= 0) {
      setMsg({ type: 'error', text: 'يرجى تحديد عدد ماسات إيجابي للسحب' });
      return;
    }

    if (currentUser.diamonds < requestedDiamonds) {
      setMsg({ type: 'error', text: `رصيد الماسات غير كافٍ. رصيدك الحالي: ${currentUser.diamonds.toLocaleString()} 💎` });
      return;
    }

    if (!paymentAccountDetails.trim()) {
      setMsg({ type: 'error', text: 'يرجى كتابة رقم الحساب أو المحفظة الإلكترونية' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await API.submitWithdrawalRequest({
        userId: currentUser.id,
        requestedDiamonds,
        paymentMethod,
        paymentAccountDetails,
        overrideDateCheck: overrideDate
      });

      if (res.success) {
        setMsg({ type: 'success', text: res.message });
        if (res.user && onUserUpdated) {
          onUserUpdated(res.user);
        }
        await loadRequests();
      } else {
        setMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'فشل إرسال طلب السحب' });
    } finally {
      setSubmitting(false);
    }
  };

  // Estimate EGP equivalent
  const estimatedEgp = Math.round((requestedDiamonds / 100) * 10) / 10;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl text-right dir-rtl font-sans">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-100">نظام سحب الأرباح والتارجت الشهري</h3>
            <p className="text-[11px] text-slate-400">مواعيد سحب رسمية معتمدة عبر الإدارة</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>موعد السحب: يوم 15 شهرياً</span>
        </div>
      </div>

      {/* Owner/Admin Test Mode Toggle */}
      {isOwnerAdmin && (
        <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs flex items-center justify-between">
          <span className="font-bold">وضع اختبار الإدارة (تجاوز شرط يوم 15):</span>
          <label className="flex items-center gap-2 cursor-pointer font-extrabold text-amber-300">
            <input
              type="checkbox"
              checked={overrideDate}
              onChange={(e) => setOverrideDate(e.target.checked)}
              className="accent-amber-500 w-4 h-4 cursor-pointer"
            />
            <span>تفعيل تجربة إرسال طلب السحب الآن</span>
          </label>
        </div>
      )}

      {/* ACTIVE PENDING REQUEST BADGE & STATUS DISPLAY */}
      {activePendingRequest ? (
        <div className="p-4 rounded-2xl bg-amber-950/40 border-2 border-amber-500/60 text-slate-200 space-y-3 shadow-lg animate-in fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-amber-500/30 pb-2.5">
            <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-md">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>[قيد المراجعة الإدارية]</span>
            </span>
            <span className="text-xs text-amber-300 font-mono font-bold">
              تاريخ الطلب: {new Date(activePendingRequest.requestedAt).toLocaleDateString('ar-EG')}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 text-xs leading-relaxed space-y-1">
            <p className="font-extrabold text-amber-300 text-sm flex items-center gap-1">
              <span>⏳ تم استلام طلب السحب بنجاح وهو قيد المراجعة من قِبل الإدارة، يرجى الانتظار حتى تتم الموافقة والتحويل</span>
            </p>
            <p className="text-slate-400 text-[11px]">
              تم تجميد رصيدك المطلوب مؤقتاً لضمان عدم تكرار الصرف وسيقوم فريق الماليات باعتماد التحويل فوراً.
            </p>
          </div>

          {/* Frozen Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">المبلغ المجمد</span>
              <strong className="text-amber-300 font-mono text-xs">{activePendingRequest.requestedDiamonds.toLocaleString()} 💎</strong>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">القيمة التقديرية</span>
              <strong className="text-emerald-400 font-mono text-xs">{activePendingRequest.requestedAmountUsdOrEgp.toLocaleString()} جنيه</strong>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-400 block">وسيلة التحويل</span>
              <strong className="text-slate-200 text-xs truncate block">{activePendingRequest.paymentMethod} ({activePendingRequest.paymentAccountDetails})</strong>
            </div>
          </div>
        </div>
      ) : (
        /* WITHDRAWAL FORM & SCHEDULE BANNER */
        <div className="space-y-3">
          {/* Day 15 Schedule Banner */}
          {!isDay15 && !overrideDate && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
                <span>فترة طلبات السحب تفتح حصرياً يوم 15 من كل شهر ميلادي</span>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/30 text-[11px] font-mono text-amber-200 whitespace-nowrap">
                متبقي {daysUntil15} أيام
              </span>
            </div>
          )}

          {msg && (
            <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              msg.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}>
              {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{msg.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmitRequest} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Requested Diamonds Amount */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">عدد الماسات المراد سحبها:</label>
                <div className="relative">
                  <input
                    type="number"
                    value={requestedDiamonds}
                    onChange={(e) => setRequestedDiamonds(Number(e.target.value))}
                    max={currentUser.diamonds}
                    min={1000}
                    disabled={(!isDay15 && !overrideDate) || submitting}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-none disabled:opacity-50"
                  />
                  <Gem className="w-4 h-4 text-sky-400 absolute left-3 top-2.5" />
                </div>
                <span className="text-[10px] text-slate-400 block font-mono">
                  القيمة المعتمدة: ~{estimatedEgp.toLocaleString('ar-EG')} جنيه مصري
                </span>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">وسيلة الاستلام:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={(!isDay15 && !overrideDate) || submitting}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none disabled:opacity-50"
                >
                  <option value="Vodafone Cash">فودافون كاش (Vodafone Cash)</option>
                  <option value="Instapay">إنستاباي (Instapay)</option>
                  <option value="Bank Transfer">تحويل بنكي (Bank Transfer / IBAN)</option>
                  <option value="USDT (TRC20)">عملة USDT المشفرة (TRC20 Network)</option>
                  <option value="STC Pay">STC Pay (السعودية)</option>
                  <option value="Binance Pay">Binance Pay ID</option>
                </select>
              </div>
            </div>

            {/* Account Details Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">رقم الحساب / المحفظة أو العنوان الرقمي:</label>
              <input
                type="text"
                value={paymentAccountDetails}
                onChange={(e) => setPaymentAccountDetails(e.target.value)}
                placeholder="أدخل رقم المحفظة أو IBAN أو عنوان التحويل..."
                disabled={(!isDay15 && !overrideDate) || submitting}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-100 focus:outline-none placeholder:text-slate-600 disabled:opacity-50"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={(!isDay15 && !overrideDate) || submitting || currentUser.diamonds <= 0}
              className={`w-full py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                (!isDay15 && !overrideDate) || currentUser.diamonds <= 0
                  ? 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/20 active:scale-98'
              }`}
            >
              <Send className="w-4 h-4 rotate-180" />
              <span>
                {submitting
                  ? 'جاري إرسال الطلب...'
                  : (!isDay15 && !overrideDate)
                  ? 'زر السحب غير نشط (متاح يوم 15 فقط)'
                  : 'تقديم طلب السحب للإدارة الماليّة'}
              </span>
            </button>
          </form>
        </div>
      )}

      {/* PAST REQUESTS HISTORY LIST */}
      {requests.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>سجل طلبات السحب السابقة:</span>
          </h4>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
            {requests.map(req => (
              <div
                key={req.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs gap-2"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-amber-300 font-mono">{req.requestedDiamonds.toLocaleString()} 💎</span>
                    <span className="text-[10px] text-slate-400">({req.requestedAmountUsdOrEgp.toLocaleString()} جنيه)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {req.paymentMethod} • {req.paymentAccountDetails}
                  </span>
                  {req.rejectionReason && (
                    <span className="text-[10px] text-rose-400 font-bold">سبب الرفض: {req.rejectionReason}</span>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                    req.status === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : req.status === 'REJECTED'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {req.status === 'APPROVED' ? 'تمت الموافقة والتحويل ✅' : req.status === 'REJECTED' ? 'مرفوض ❌' : 'قيد المراجعة ⏳'}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    {new Date(req.requestedAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
