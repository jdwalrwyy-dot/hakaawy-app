import React, { useState } from 'react';
import { User, SHIPPING_PACKAGES, ShippingPackage, isUserOwner, ShippingRechargeLog } from '../types';
import { API } from '../services/api';
import { soundEffects } from '../services/soundEffects';
import confetti from 'canvas-confetti';
import {
  Gem,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  Search,
  ShieldCheck,
  UserCheck,
  Printer,
  Copy,
  Check,
  FileText
} from 'lucide-react';

interface ShippingAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserUpdated: (user: User) => void;
}

export const ShippingAgentModal: React.FC<ShippingAgentModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated
}) => {
  const [targetIdentifier, setTargetIdentifier] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>(SHIPPING_PACKAGES[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [verifyingUser, setVerifyingUser] = useState(false);
  const [targetPreview, setTargetPreview] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ShippingRechargeLog | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  const isOwner = isUserOwner(currentUser);
  const isAgent = currentUser.isShippingAgent === true || currentUser.role === 'AGENT' || isOwner;

  if (!isOpen || !isAgent) return null;

  const selectedPackage = SHIPPING_PACKAGES.find(p => p.id === selectedPackageId) || SHIPPING_PACKAGES[0];
  const currentDiamonds = currentUser.diamonds || 0;
  // Owners can transfer unlimited diamonds if needed or use agent balance
  const hasEnoughDiamonds = isOwner || currentDiamonds >= selectedPackage.diamonds;

  // Verify target user when user types ID
  const handleVerifyTarget = async () => {
    const clean = targetIdentifier.trim();
    if (!clean) return;
    setVerifyingUser(true);
    setErrorMsg(null);
    try {
      const users = await API.getUsers();
      const found = users.find(
        u => u.id === clean || (u.numericId && u.numericId === clean) || u.username.toLowerCase() === clean.toLowerCase() || u.phone === clean
      );
      if (found) {
        if (found.id === currentUser.id) {
          setErrorMsg('الوكيل لا يستطيع شحن رصيده بنفسه');
          setTargetPreview(null);
        } else {
          setTargetPreview(found);
          setErrorMsg(null);
        }
      } else {
        setTargetPreview(null);
        setErrorMsg('لم يتم العثور على مستخدم بهذا الـ ID الرقمي أو اسم المستخدم');
      }
    } catch {
      setTargetPreview(null);
    } finally {
      setVerifyingUser(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const clean = targetIdentifier.trim();
    if (!clean) {
      setErrorMsg('يرجى كتابة ID المستخدم المستهدف');
      return;
    }

    if (!hasEnoughDiamonds) {
      setErrorMsg('رصيدك من الماسات غير كافٍ لإتمام العملية');
      soundEffects.playJoinRoom();
      return;
    }

    setIsLoading(true);
    try {
      const res = await API.transferDiamondsAsAgent(
        currentUser.id,
        clean,
        selectedPackageId
      );

      soundEffects.playCoinSound();
      confetti({ particleCount: 80, spread: 80 });
      setSuccessMsg(res.message);

      if (res.receipt) {
        setReceipt(res.receipt);
      }

      // Refresh current user data
      const updated = await API.getUser(currentUser.id);
      onUserUpdated(updated);

      setTargetIdentifier('');
      setTargetPreview(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشلت عملية التحويل');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyReceipt = () => {
    if (!receipt) return;
    const text = `🧾 *إيصال شحن حكاوي رسمي* 💎
رقم المرجع: ${receipt.referenceId}
المستخدم: ${receipt.userName} (ID: ${receipt.userNumericId})
القيمة: ${receipt.amountEgp} جنيه مصري
الماسات: ${receipt.diamonds.toLocaleString('ar-EG')} 💎
الوكيل: ${receipt.agentName}
التاريخ: ${new Date(receipt.createdAt).toLocaleString('ar-EG')}
الحالة: تم الشحن بنجاح ✅`;

    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 text-amber-400 border border-amber-500/30">
              <Gem className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-slate-100">لوحة وكيل الشحن</h2>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  معتمد 🛡️
                </span>
              </div>
              <p className="text-[11px] text-slate-400">نظام شحن الماسات الخارجي وإصدار الإيصالات الرسمية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Agent Diamond Balance Display */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-800/80 to-slate-900 border border-amber-500/25 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Gem className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-400">رصيد الوكالة الحالي:</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-amber-300 font-mono tracking-tight">
                  {currentDiamonds.toLocaleString('ar-EG')}
                </span>
                <span className="text-xs font-bold text-amber-400/80">ماسة 💎</span>
              </div>
            </div>
          </div>

          <div className="text-left">
            <span className="text-[10px] text-slate-400 block">حالة الوكالة:</span>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 inline-block mt-0.5">
              نشطة وموثوقة ✅
            </span>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-bold">{errorMsg}</span>
          </div>
        )}

        {/* RECEIPT POPUP / CARD */}
        {receipt && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-3 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-amber-400 font-black text-xs">
                <FileText className="w-4 h-4" />
                <span>إيصال عملية شحن ناجحة 🧾</span>
              </div>
              <button
                onClick={() => setReceipt(null)}
                className="text-slate-500 hover:text-slate-300 text-xs"
              >
                إغلاق الإيصال ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">رقم المرجع:</span>
                <span className="text-amber-300 font-bold">{receipt.referenceId}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">المبلغ المدفوع:</span>
                <span className="text-emerald-400 font-bold">{receipt.amountEgp} EGP</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">اسم المستلم:</span>
                <span className="text-slate-200 font-bold">{receipt.userName}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">ID المستلم الرقمي:</span>
                <span className="text-amber-300 font-bold">{receipt.userNumericId}</span>
              </div>
              <div className="col-span-2 bg-slate-900 p-2 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">الماسات المشحونة:</span>
                  <span className="text-sky-300 font-black text-base">{receipt.diamonds.toLocaleString('ar-EG')} 💎</span>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block">التاريخ:</span>
                  <span className="text-[10px] text-slate-400">{new Date(receipt.createdAt).toLocaleString('ar-EG')}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCopyReceipt}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md"
            >
              {copiedReceipt ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>تم نسخ بيانات الإيصال!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>نسخ الإيصال لإرساله للعميل</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Transfer Form */}
        <form onSubmit={handleTransfer} className="flex flex-col gap-4">
          {/* Target User ID Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              معرف المستخدم (الـ ID الرقمي أو اسم المستخدم) <span className="text-rose-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  required
                  placeholder="اكتب الـ ID الرقمي مثل: 100001"
                  value={targetIdentifier}
                  onChange={(e) => {
                    setTargetIdentifier(e.target.value);
                    setTargetPreview(null);
                    setErrorMsg(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono focus:border-amber-400 focus:outline-none pr-3"
                />
              </div>
              <button
                type="button"
                onClick={handleVerifyTarget}
                disabled={verifyingUser || !targetIdentifier.trim()}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{verifyingUser ? 'فحص...' : 'فحص ID'}</span>
              </button>
            </div>

            {/* Target Preview Card */}
            {targetPreview && (
              <div className="mt-2 p-2.5 rounded-xl bg-slate-800/80 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={targetPreview.avatar}
                    alt={targetPreview.name}
                    className="w-8 h-8 rounded-full object-cover border border-emerald-500/40"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-100">{targetPreview.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID الرقمي: <span className="text-amber-300 font-bold">{targetPreview.numericId || targetPreview.id}</span>
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  مستخدم مؤكد
                </span>
              </div>
            )}
          </div>

          {/* Packages Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-300">
                اختر باقة الشحن الخارجية:
              </label>
              <span className="text-[11px] text-slate-400">
                المطلوب: <b className="text-amber-400 font-mono">{selectedPackage.diamonds.toLocaleString('ar-EG')}</b> ماسة
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SHIPPING_PACKAGES.map((pkg: ShippingPackage) => {
                const isSelected = pkg.id === selectedPackageId;
                const canAfford = isOwner || currentDiamonds >= pkg.diamonds;

                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`p-3 rounded-2xl border cursor-pointer flex flex-col gap-1 transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 shadow-md shadow-amber-500/10 scale-[1.01]'
                        : canAfford
                        ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80'
                        : 'bg-slate-900/50 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100">{pkg.priceEgp} جنيه مصري</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {pkg.priceEgp} EGP
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-amber-300 font-mono text-xs font-black">
                      <Gem className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{pkg.diamonds.toLocaleString('ar-EG')} ماسة</span>
                    </div>

                    {!canAfford && (
                      <span className="text-[9px] text-rose-400 font-bold">
                        رصيد الوكالة غير كافٍ
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Transfer Button */}
          <button
            type="submit"
            disabled={isLoading || (!isOwner && !hasEnoughDiamonds) || !targetIdentifier.trim()}
            className={`w-full py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 cursor-pointer ${
              (isOwner || hasEnoughDiamonds) && targetIdentifier.trim()
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/20'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{isLoading ? 'جاري تنفيذ عملية الشحن...' : `شحن الآن (${selectedPackage.diamonds.toLocaleString('ar-EG')} ماسة)`}</span>
          </button>

          <p className="text-[10px] text-center text-slate-500">
            * تتم إضافة الماسات فورياً لرصيد الحساب ويتم تسجيل العملية برقم مرجع رسمي في قاعدة البيانات.
          </p>
        </form>
      </div>
    </div>
  );
};
