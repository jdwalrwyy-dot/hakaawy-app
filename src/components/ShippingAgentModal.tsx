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
  Copy,
  Check,
  FileText,
  Crown,
  Coins,
  Sparkles,
  Zap
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
  const [rechargeType, setRechargeType] = useState<'COIN' | 'DIAMOND'>('COIN');
  const [customCoinsAmount, setCustomCoinsAmount] = useState<string>('100000');
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
  const currentCoins = currentUser.coins || 0;
  const currentDiamonds = currentUser.diamonds || 0;
  const hasEnoughDiamonds = isOwner || currentDiamonds >= selectedPackage.diamonds;

  // Exact internal coin transfer function logic (UNTOUCHED)
  const handleTransferCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const clean = targetIdentifier.trim();
    if (!clean) {
      setErrorMsg('يرجى كتابة ID المستخدم المستهدف');
      return;
    }

    const coinAmt = Number(customCoinsAmount);
    if (!coinAmt || coinAmt <= 0) {
      setErrorMsg('يرجى كتابة كمية كوينز صحيحة للتحويل');
      return;
    }

    if (!isOwner && currentCoins < coinAmt) {
      setErrorMsg(`رصيد كوينز وكالتك غير كافٍ. المتاح لديك: ${currentCoins.toLocaleString()} 🪙`);
      soundEffects.playJoinRoom();
      return;
    }

    setIsLoading(true);
    try {
      const res = await API.transferCoinsAsAgent(
        currentUser.id,
        clean,
        coinAmt
      );

      soundEffects.playCoinSound();
      confetti({ particleCount: 80, spread: 80 });
      setSuccessMsg(res.message);

      if (res.receipt) {
        setReceipt(res.receipt);
      }

      const updated = await API.getUser(currentUser.id);
      onUserUpdated(updated);

      setTargetIdentifier('');
      setTargetPreview(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشلت عملية تحويل الكونز');
    } finally {
      setIsLoading(false);
    }
  };

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

  // Transfer diamonds function logic (UNTOUCHED)
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
الرصيد المشحون: ${(receipt as any).coins ? `${(receipt as any).coins.toLocaleString()} 🪙` : `${receipt.diamonds.toLocaleString()} 💎`}
الوكيل: ${receipt.agentName}
التاريخ: ${new Date(receipt.createdAt).toLocaleString('ar-EG')}
الحالة: تم الشحن بنجاح ✅`;

    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200" dir="rtl">
      <div
        className="w-full max-w-lg bg-gradient-to-b from-[#180a03] via-[#092014] to-[#04120a] border-3 border-[#facc15] rounded-3xl p-5 shadow-[0_12px_40px_rgba(217,119,6,0.45)] flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#d97706] via-[#fbbf24] to-[#fef08a] text-amber-950 shadow-md border border-yellow-200">
              <Crown className="w-6 h-6 fill-amber-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base text-amber-200 tracking-wide">لوحة الوكالة الملكية</h2>
                <span className="text-[10px] font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300/40 shadow-sm">
                  <ShieldCheck className="w-3 h-3" />
                  وكيل معتمد 🛡️
                </span>
              </div>
              <p className="text-[11px] text-amber-100/70">تحويل الكونز والماسات للمستخدمين وتسليم الفواتير</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-amber-500/20 text-amber-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Agency Balances Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Agency Coins */}
          <div className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
            rechargeType === 'COIN'
              ? 'bg-gradient-to-br from-[#1c0d02] to-[#042612] border-[#facc15] shadow-md shadow-amber-500/20'
              : 'bg-black/40 border-amber-500/30 hover:bg-black/60'
          }`}
          onClick={() => setRechargeType('COIN')}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-amber-300 font-black">رصيد كوينز الوكالة:</span>
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-lg font-black text-amber-200 font-mono block">
              {currentCoins.toLocaleString()} 🪙
            </span>
            <span className="text-[9px] text-amber-100/70 block mt-0.5">وضع تحويل الكونز الفوري</span>
          </div>

          {/* Agency Diamonds */}
          <div className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
            rechargeType === 'DIAMOND'
              ? 'bg-gradient-to-br from-[#021f38] to-[#011424] border-sky-400 shadow-md shadow-sky-500/20'
              : 'bg-black/40 border-sky-500/30 hover:bg-black/60'
          }`}
          onClick={() => setRechargeType('DIAMOND')}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-sky-300 font-black">رصيد ماسات الوكالة:</span>
              <Gem className="w-4 h-4 text-sky-400" />
            </div>
            <span className="text-lg font-black text-sky-200 font-mono block">
              {currentDiamonds.toLocaleString()} 💎
            </span>
            <span className="text-[9px] text-sky-100/70 block mt-0.5">وضع شحن الباقات الماسية</span>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Official Receipt Card */}
        {receipt && (
          <div className="p-4 rounded-2xl bg-black/80 border-2 border-[#facc15] space-y-3 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
              <div className="flex items-center gap-2 text-amber-300 font-black text-xs">
                <FileText className="w-4 h-4" />
                <span>إيصال معاملة وكالة حكاوي الرسمية 🧾</span>
              </div>
              <button
                onClick={() => setReceipt(null)}
                className="text-amber-200/70 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-amber-950/40 p-2 rounded-xl border border-amber-500/30">
                <span className="text-[10px] text-amber-300/70 block">رقم المرجع:</span>
                <span className="text-amber-200 font-bold">{receipt.referenceId}</span>
              </div>
              <div className="bg-amber-950/40 p-2 rounded-xl border border-amber-500/30">
                <span className="text-[10px] text-amber-300/70 block">حالة التسليم:</span>
                <span className="text-emerald-400 font-bold">تم التسليم بنجاح ✅</span>
              </div>
              <div className="bg-amber-950/40 p-2 rounded-xl border border-amber-500/30">
                <span className="text-[10px] text-amber-300/70 block">اسم المستلم:</span>
                <span className="text-slate-100 font-bold">{receipt.userName}</span>
              </div>
              <div className="bg-amber-950/40 p-2 rounded-xl border border-amber-500/30">
                <span className="text-[10px] text-amber-300/70 block">ID المستلم الرقمي:</span>
                <span className="text-amber-300 font-bold">{receipt.userNumericId}</span>
              </div>
            </div>

            <button
              onClick={handleCopyReceipt}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#d97706] text-amber-950 font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 transition-transform"
            >
              {copiedReceipt ? (
                <>
                  <Check className="w-4 h-4 text-amber-950" />
                  <span>تم نسخ الإيصال إلى الحافظة!</span>
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

        {/* Main Transfer Form */}
        <form onSubmit={rechargeType === 'COIN' ? handleTransferCoins : handleTransfer} className="flex flex-col gap-3.5">
          {/* Target ID Input */}
          <div>
            <label className="block text-xs font-black text-amber-200 mb-1.5">
              معرف حساب المستلم (الـ ID الرقمي أو اسم المستخدم) <span className="text-rose-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                placeholder="أدخل الـ ID الرقمي للمستلم مثل: 100001"
                value={targetIdentifier}
                onChange={(e) => {
                  setTargetIdentifier(e.target.value);
                  setTargetPreview(null);
                  setErrorMsg(null);
                }}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/50 border border-amber-500/40 text-amber-100 text-xs font-mono focus:border-amber-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleVerifyTarget}
                disabled={verifyingUser || !targetIdentifier.trim()}
                className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-black flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{verifyingUser ? 'فحص...' : 'فحص ID'}</span>
              </button>
            </div>

            {/* Target Preview Card */}
            {targetPreview && (
              <div className="mt-2 p-3 rounded-2xl bg-black/60 border-2 border-emerald-400 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2.5">
                  <img
                    src={targetPreview.avatar}
                    alt={targetPreview.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-100">{targetPreview.name}</span>
                    <span className="text-[10px] text-amber-300 font-mono">
                      ID الرقمي: <b className="text-amber-200">{targetPreview.numericId || targetPreview.id}</b>
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-400 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  حساب مؤكد ✅
                </span>
              </div>
            )}
          </div>

          {/* Amount Selection */}
          {rechargeType === 'COIN' ? (
            <div className="space-y-2">
              <label className="block text-xs font-black text-amber-200">
                اختر عدد الكونز المراد تحويلها:
              </label>

              <div className="grid grid-cols-3 gap-2">
                {['50000', '100000', '250000', '500000', '1000000', '2500000'].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCustomCoinsAmount(val)}
                    className={`py-2 px-2 rounded-xl text-xs font-black font-mono transition-all border cursor-pointer ${
                      customCoinsAmount === val
                        ? 'bg-gradient-to-r from-[#d97706] to-[#f59e0b] text-white border-amber-300 shadow-md'
                        : 'bg-black/40 hover:bg-black/60 text-amber-200/80 border-amber-500/30'
                    }`}
                  >
                    {Number(val).toLocaleString()} 🪙
                  </button>
                ))}
              </div>

              <div className="mt-2">
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={customCoinsAmount}
                  onChange={(e) => setCustomCoinsAmount(e.target.value)}
                  placeholder="أو اكتب كمية كونز مخصصة..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-amber-500/40 text-amber-100 font-bold text-sm font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-black text-sky-200">
                اختر باقة الماسات المراد تحويلها:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SHIPPING_PACKAGES.map((pkg: ShippingPackage) => {
                  const isSelected = pkg.id === selectedPackageId;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={`p-3 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-sky-500/20 border-sky-400 shadow-md shadow-sky-500/20'
                          : 'bg-black/40 hover:bg-black/60 border-sky-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-mono text-xs font-black text-sky-200">
                        <Gem className="w-4 h-4 text-sky-400" />
                        <span>{pkg.diamonds.toLocaleString()} ماسة</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-300 font-mono">
                        {pkg.priceEgp} EGP
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Instant Transfer Button */}
          <button
            type="submit"
            disabled={isLoading || !targetIdentifier.trim()}
            className={`w-full py-3.5 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-[0_6px_25px_rgba(217,119,6,0.4)] active:scale-98 cursor-pointer ${
              targetIdentifier.trim()
                ? 'bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#d97706] hover:brightness-110 text-amber-950 border-2 border-[#fef08a]'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
            <span>
              {isLoading
                ? 'جاري التنفيذ والتسليم الفوري...'
                : rechargeType === 'COIN'
                ? `تحويل فوري (${Number(customCoinsAmount || 0).toLocaleString()} 🪙)`
                : `تحويل فوري (${selectedPackage.diamonds.toLocaleString()} 💎)`}
            </span>
          </button>

          <p className="text-[10px] text-center text-amber-200/60 font-bold">
            * تتم عملية تحويل الرصيد أتمياً داخل قاعدة البيانات لحظة إرسال الطلب بنجاح.
          </p>
        </form>
      </div>
    </div>
  );
};
