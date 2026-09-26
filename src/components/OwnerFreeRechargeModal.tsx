import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Gem, X, Check, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import { User, isUserOwner } from '../types';
import { API } from '../services/api';
import { soundEffects } from '../services/soundEffects';
import confetti from 'canvas-confetti';

interface OwnerFreeRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserUpdated: (user: User) => void;
}

const PRESET_AMOUNTS = [
  10000,
  50000,
  100000,
  500000,
  1000000,
  10000000
];

export const OwnerFreeRechargeModal: React.FC<OwnerFreeRechargeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated
}) => {
  const [amountInput, setAmountInput] = useState<string>('100000');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  // STRICT FRONTEND CHECK: Owner Only
  const isOwner = isUserOwner(currentUser);
  if (!isOwner) {
    return null;
  }

  const handleAddDiamonds = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const amount = parseInt(amountInput.replace(/,/g, ''), 10);

    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('يرجى إدخال كمية مَسّات صالحة أكبر من صفر');
      return;
    }

    if (amount > 1000000000) {
      setErrorMsg('الحد الأقصى للشحن في المرة الواحدة هو 1,000,000,000 مَسّة');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await API.ownerFreeRecharge(currentUser.id, amount);
      if (res.success && res.user) {
        soundEffects.playCoinSound();
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });

        const formattedAmt = amount.toLocaleString('ar-EG');
        setSuccessMsg(`تم إضافة ${formattedAmt} مَسّة إلى رصيد المالك مجاناً بنجاح! 🎉`);
        onUserUpdated(res.user);

        setTimeout(() => {
          setSuccessMsg(null);
        }, 4000);
      } else {
        setErrorMsg(res.message || 'تعذر إضافة المَسّات');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/40 rounded-3xl p-6 shadow-2xl shadow-amber-500/10 text-right text-slate-100 overflow-hidden"
          dir="rtl"
        >
          {/* Top Decorative Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-amber-500/20 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Crown className="w-6 h-6 text-amber-400 animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-black text-amber-300 flex items-center gap-1.5">
                  <span>شحن المَسّات مجاناً</span>
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                    خاص بالمالك
                  </span>
                </h3>
                <p className="text-xs text-slate-400">إضافة المَسّات فوراً إلى رصيدك دون دفع أو خصم أموال</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Balance Indicator */}
          <div className="mb-5 p-3.5 rounded-2xl bg-slate-950/60 border border-amber-500/30 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Gem className="w-4 h-4 text-sky-400" />
              <span>رصيد المَسّات الحالي:</span>
            </span>
            <span className="text-base font-black text-sky-300">
              {(currentUser.diamonds || 0).toLocaleString('ar-EG')} مَسّة
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleAddDiamonds} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-amber-200 mb-2">
                كمية المَسّات المراد إضافتها:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={amountInput}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9]/g, '');
                    setAmountInput(clean);
                  }}
                  placeholder="أدخل عدد المَسّات"
                  className="w-full bg-slate-950/80 border border-amber-500/40 rounded-2xl px-4 py-3 pl-12 text-left font-mono text-lg font-black text-amber-200 placeholder-slate-600 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
                  dir="ltr"
                />
                <Gem className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <span className="block text-[11px] font-bold text-slate-400 mb-2">اختر كمية سريعة:</span>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmountInput(preset.toString())}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      amountInput === preset.toString()
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md shadow-amber-500/20'
                        : 'bg-slate-950/60 text-amber-300 border-amber-500/20 hover:border-amber-500/50 hover:bg-slate-800/50'
                    }`}
                  >
                    +{preset >= 1000000 ? `${preset / 1000000}M` : `${preset / 1000}K`}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 flex gap-3">
              <button
                type="submit"
                disabled={isLoading || !amountInput || parseInt(amountInput, 10) <= 0}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>جاري الشحن...</span>
                  </span>
                ) : (
                  <>
                    <Crown className="w-4 h-4 fill-slate-950" />
                    <span>إضافة المَسّات</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-3.5 px-5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-bold text-sm transition-colors"
              >
                إلغاء
              </button>
            </div>
          </form>

          {/* Footer Security Note */}
          <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-center gap-1.5 text-[10px] text-amber-400/80">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>عملية إدارية مسجلة بنجاح في سجل المالك والسجل الإداري</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
