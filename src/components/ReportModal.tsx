import React, { useState } from 'react';
import { API } from '../services/api';
import { User } from '../types';
import { AlertTriangle, X, CheckCircle, ShieldAlert, Loader2 } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  targetType: 'USER' | 'ROOM' | 'MESSAGE' | 'STREAM';
  targetId: string;
  targetName: string;
}

const REPORT_REASONS = [
  'محتوى غير لائق أو مسيء',
  'تنمر ومضايقات لفظية',
  'انتحال شخصية أو حساب مزيف',
  'احتيال أو طلب معلومات خاصة',
  'سبام وإعلانات مزعجة',
  'أخرى'
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  targetType,
  targetId,
  targetName
}) => {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await API.submitReport({
        reporterId: currentUser.id,
        targetType,
        targetId,
        targetName,
        reason,
        details: details.trim() || undefined
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch {
      alert('تعذر إرسال البلاغ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-100">إرسال بلاغ أمني</h2>
              <p className="text-[11px] text-slate-400">إبلاغ عن مخالفة لقوانين منصة حكاوي</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 animate-bounce" />
            <h3 className="font-bold text-slate-100 text-sm">تم إرسال البلاغ بنجاح</h3>
            <p className="text-xs text-slate-400">سيقوم فريق الرقابة بمراجعة البلاغ واتخاذ الإجراء اللازم.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-300">
              الهدف المبلغ عنه: <b className="text-rose-400">{targetName}</b> ({targetType})
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">سبب البلاغ</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:border-amber-400 focus:outline-none"
              >
                {REPORT_REASONS.map((r, i) => (
                  <option key={i} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">تفاصيل إضافية (اختياري)</label>
              <textarea
                rows={3}
                placeholder="وضح ما حدث للمساعدة في سرعة التحقق..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:border-amber-400 focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 active:scale-98 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                  <span>جاري إرسال البلاغ...</span>
                </>
              ) : (
                <span>إرسال البلاغ للإدارة</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
