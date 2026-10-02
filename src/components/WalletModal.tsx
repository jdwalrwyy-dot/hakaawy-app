import React, { useState, useEffect } from 'react';
import { User, WalletTransaction, isUserOwner, OFFICIAL_COIN_PACKAGES, StorePackage } from '../types';
import { API } from '../services/api';
import { soundEffects } from '../services/soundEffects';
import { HostWithdrawalSection } from './HostWithdrawalSection';
import confetti from 'canvas-confetti';
import {
  Coins,
  Gem,
  ArrowRightLeft,
  History,
  X,
  CheckCircle,
  AlertCircle,
  Crown,
  ShieldCheck,
  Wallet,
  Copy,
  CreditCard,
  Headphones,
  Sparkles,
  Zap,
  Check,
  ShoppingBag
} from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserUpdated: (user: User) => void;
  onOpenShippingAgent?: () => void;
}

interface ShippingAgentItem {
  id: string;
  numericId: string;
  name: string;
  username: string;
  avatar: string;
  phone: string;
  role: string;
  isOwner?: boolean;
  isShippingAgent: boolean;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
  onOpenShippingAgent
}) => {
  const isOwner = isUserOwner(currentUser);
  const isAgent = currentUser.isShippingAgent === true || currentUser.role === 'AGENT';

  const [activeTab, setActiveTab] = useState<'packages' | 'balance' | 'withdraw' | 'convert' | 'agencies' | 'history'>('packages');

  // Convert tab state
  const [convertAmount, setConvertAmount] = useState<string>('100');

  // Customer Service & Certified Agents Modal State
  const [isCustomerServiceModalOpen, setIsCustomerServiceModalOpen] = useState(false);

  // Agencies tab state
  const [shippingAgents, setShippingAgents] = useState<ShippingAgentItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Shared state
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      API.getWalletTransactions(currentUser.id)
        .then(data => setTransactions(data))
        .catch(() => {});

      API.getShippingAgentsList()
        .then(agents => setShippingAgents(agents))
        .catch(() => {});

      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Handle converting coins to diamonds (100 coins -> 50 diamonds)
  const handleConvert = async () => {
    const amount = Number(convertAmount);
    if (!amount || amount <= 0) {
      setErrorMsg('يرجى إدخال عدد صحيح من الكونز');
      return;
    }
    if (amount > currentUser.coins) {
      setErrorMsg('رصيدك من الكونز غير كافٍ');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await API.convertCoinsToDiamonds(currentUser.id, amount);
      soundEffects.playCoinSound();
      confetti({ particleCount: 50, spread: 60 });
      setSuccessMsg(res.message);
      onUserUpdated(res.user);
      const txs = await API.getWalletTransactions(currentUser.id);
      setTransactions(txs);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل التحويل');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAgentId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200" dir="rtl">
      <div
        className="w-full max-w-xl bg-gradient-to-b from-[#1c0d02] via-[#0b2416] to-[#04140b] border-3 border-[#facc15] rounded-3xl p-4 sm:p-5 shadow-[0_12px_40px_rgba(217,119,6,0.45)] flex flex-col gap-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#d97706] via-[#fbbf24] to-[#fef08a] text-amber-950 shadow-md border border-amber-200">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-black text-base text-amber-200">متجر شحن الكونز الفاخر</h2>
                {isOwner ? (
                  <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Crown className="w-3 h-3 text-amber-400" />
                    المالك العام 👑
                  </span>
                ) : isAgent ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                    وكيل معتمد
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] text-amber-100/70">الباقات الرسمية والأسعار الفورية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-amber-500/20 text-amber-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TOP GOLDEN PROMINENT AGENTS BUTTON */}
        <button
          onClick={() => setIsCustomerServiceModalOpen(true)}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#d97706] border-2 border-[#fef08a] shadow-[0_6px_22px_rgba(217,119,6,0.45)] text-amber-950 font-black text-xs sm:text-sm flex items-center justify-between gap-2 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#022612] text-amber-300 border border-amber-400/50 shadow-sm shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div className="text-right">
              <span className="block font-black text-amber-950 text-xs sm:text-sm leading-tight">
                وكلاء الشحن المعتمدين - عروض حصرية 👑
              </span>
              <span className="block text-[10px] text-amber-900 font-bold -mt-0.5">
                تواصل مع خدمة العملاء والوكيل المعتمد لاستلام رصيدك فورياً
              </span>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-950 text-amber-200 font-black text-[11px] flex items-center gap-1 border border-amber-300/40 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
            <span>طلب فوري</span>
          </div>
        </button>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-black/50 p-1 rounded-2xl border border-amber-500/30 overflow-x-auto scrollbar-none">
          {[
            { id: 'packages' as const, label: 'باقات الكونز', icon: Zap },
            { id: 'balance' as const, label: 'محفظتي', icon: Coins },
            { id: 'withdraw' as const, label: 'سحب الأرباح', icon: CreditCard },
            { id: 'convert' as const, label: 'تحويل العملات', icon: ArrowRightLeft },
            { id: 'agencies' as const, label: 'الوكلاء المعتمدون', icon: ShieldCheck },
            { id: 'history' as const, label: 'سجل العمليات', icon: History }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-[#d97706] to-[#f59e0b] text-white shadow-md font-black border border-amber-200'
                    : 'text-amber-200/70 hover:text-amber-200 hover:bg-amber-500/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: OFFICIAL COIN STORE PACKAGES (3D LUXURY CARDS) */}
        {activeTab === 'packages' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1 border-b border-amber-500/20">
              <span className="text-xs font-black text-amber-200">باقات الكونز الرسمية المتاحة:</span>
              <span className="text-[10px] text-amber-300 font-mono">الأسعار بالدولار والعملة المحلية</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {OFFICIAL_COIN_PACKAGES.map((pkg: StorePackage) => (
                <div
                  key={pkg.id}
                  className="p-4 rounded-2xl bg-gradient-to-b from-[#241003] via-[#142e1b] to-[#06180e] border-2 border-[#facc15] flex flex-col justify-between gap-3 shadow-[0_6px_20px_rgba(217,119,6,0.25)] relative overflow-hidden group hover:brightness-105 transition-all"
                >
                  {/* Glowing Corner Badge */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.3),_transparent_70%)] pointer-events-none" />

                  {/* Coins Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#d97706] via-[#fbbf24] to-[#fef08a] text-amber-950 flex items-center justify-center font-black text-lg shadow-sm border border-yellow-200 shrink-0">
                        🪙
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-amber-100 font-mono tracking-wide">
                          {pkg.coins.toLocaleString()} كوينز
                        </h3>
                        <span className="text-[10px] text-emerald-400 font-extrabold block">تسليم فوري مباشر</span>
                      </div>
                    </div>
                  </div>

                  {/* Price Tags */}
                  <div className="p-2.5 rounded-xl bg-black/50 border border-amber-500/30 flex items-center justify-between font-mono">
                    <div className="flex items-center gap-1 text-amber-300 font-black text-sm">
                      <span>${pkg.priceUsd}</span>
                    </div>
                    <div className="text-[11px] font-extrabold text-amber-200/80 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-400/30">
                      (~{pkg.approxEgp.toLocaleString()} EGP)
                    </div>
                  </div>

                  {/* Order Button */}
                  <button
                    onClick={() => setIsCustomerServiceModalOpen(true)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#d97706] border border-[#fef08a] text-amber-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    <span>شحن عبر الوكيل المعتمد</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: BALANCE CARDS */}
        {activeTab === 'balance' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Coins Card */}
              <div className="bg-gradient-to-br from-[#1c0d02] via-[#2a1303] to-[#042612] border-2 border-amber-500/40 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-300">رصيد الكونز (Coins)</span>
                  <Coins className="w-5 h-5 text-amber-400" />
                </div>
                <div className="my-2">
                  <span className="text-2xl font-black text-amber-200 font-mono">
                    {currentUser.coins.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('convert')}
                  className="text-[11px] font-bold text-amber-400 hover:underline text-right cursor-pointer"
                >
                  تحويل إلى ماسات ←
                </button>
              </div>

              {/* Diamonds Card */}
              <div className="bg-gradient-to-br from-[#021f38] via-[#043358] to-[#011424] border-2 border-sky-500/40 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-sky-300">رصيد الماسات (Diamonds)</span>
                  <Gem className="w-5 h-5 text-sky-400" />
                </div>
                <div className="my-2">
                  <span className="text-2xl font-black text-sky-200 font-mono">
                    {currentUser.diamonds.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('packages')}
                  className="text-[11px] font-bold text-sky-400 hover:underline text-right cursor-pointer"
                >
                  عرض باقات المتجر ←
                </button>
              </div>
            </div>

            {/* Quick Info Box */}
            <div className="p-3.5 rounded-2xl bg-[#042211] border border-amber-500/30 text-xs text-amber-100/90 leading-relaxed space-y-2">
              <div className="flex items-center gap-2 font-black text-amber-300 text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>الشحن المعتمد والتسليم الفوري:</span>
              </div>
              <p className="text-[11px] text-amber-100/80 leading-normal">
                تأكد من شحن حسابك عبر <b>وكلاء الشحن المعتمدين</b> للحصول على الرصيد فورياً برقم مرجعي إلكتروني رسمي.
              </p>
              <div className="pt-2 flex items-center justify-between border-t border-amber-500/20">
                <button
                  onClick={() => setActiveTab('packages')}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#d97706] to-[#f59e0b] text-white font-black text-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>استعراض باقات المتجر</span>
                  <Zap className="w-3.5 h-3.5" />
                </button>

                {(isOwner || isAgent) && onOpenShippingAgent && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenShippingAgent();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>لوحة تحويل الوكالة 💎</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WITHDRAWAL */}
        {activeTab === 'withdraw' && (
          <div>
            <HostWithdrawalSection
              currentUser={currentUser}
              onUserUpdated={onUserUpdated}
              isOwnerAdmin={isOwner}
            />
          </div>
        )}

        {/* TAB 4: CONVERT */}
        {activeTab === 'convert' && (
          <div className="flex flex-col gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
              <span>سعر التحويل المعتمد:</span>
              <span className="font-black font-mono">100 كونز = 50 ماسة</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-200 mb-1.5">
                الكمية المراد تحويلها من الكونز:
              </label>
              <input
                type="number"
                min="100"
                step="100"
                value={convertAmount}
                onChange={(e) => setConvertAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-amber-500/40 focus:border-amber-400 focus:outline-none text-amber-100 font-bold text-base font-mono"
              />
            </div>

            <button
              onClick={handleConvert}
              disabled={isLoading || !convertAmount}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#d97706] to-[#f59e0b] text-white font-black text-xs shadow-md cursor-pointer active:scale-95 transition-transform"
            >
              {isLoading ? 'جاري التحويل...' : 'تأكيد التحويل الآن 🔄'}
            </button>
          </div>
        )}

        {/* TAB 5: AGENCIES LIST */}
        {activeTab === 'agencies' && (
          <div className="flex flex-col gap-3">
            <div className="text-xs text-amber-200/80">
              قائمة وكلاء الشحن المعتمدين والموثقين رسمياً لتغذية المحفظة:
            </div>

            {shippingAgents.length === 0 ? (
              <div className="py-8 text-center text-xs text-amber-200/60">
                جاري جلب قائمة الوكلاء المعتمدين...
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {shippingAgents.map(ag => (
                  <div
                    key={ag.id}
                    className="p-3 rounded-2xl bg-black/40 border border-amber-500/30 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={ag.avatar}
                        alt={ag.name}
                        className="w-10 h-10 rounded-full object-cover border border-amber-400"
                      />
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-extrabold text-xs text-amber-100">{ag.name}</span>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <span className="text-[10px] text-amber-200/60 font-mono">
                          ID: {ag.numericId || ag.id}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopyAgentId(ag.numericId || ag.id)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-amber-500/30"
                    >
                      {copiedId === (ag.numericId || ag.id) ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ الـ ID</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: HISTORY */}
        {activeTab === 'history' && (
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
            {transactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-amber-200/60">
                لا توجد عمليات مالية سابقة في سجلك
              </div>
            ) : (
              transactions.map(tx => (
                <div
                  key={tx.id}
                  className="p-2.5 rounded-xl bg-black/40 border border-amber-500/20 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-amber-200 block">{tx.description}</span>
                    <span className="text-[9px] text-amber-200/60">
                      {new Date(tx.createdAt).toLocaleString('ar-EG')}
                    </span>
                  </div>
                  <span className={`font-mono font-black ${tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} {tx.type === 'COIN' ? '🪙' : '💎'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* CUSTOMER SERVICE & CERTIFIED AGENTS POPUP MODAL */}
      {isCustomerServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="w-full max-w-md bg-gradient-to-b from-[#1c0d02] via-[#082315] to-[#04140b] border-3 border-[#facc15] rounded-3xl p-5 shadow-[0_12px_40px_rgba(217,119,6,0.5)] flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-slate-100 relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/30">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-amber-950 shadow-md">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-amber-200">وكلاء الشحن المعتمدين - عروض حصرية</h3>
                  <p className="text-[10px] text-amber-100/70">مركز الدعم والعروض المباشرة</p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomerServiceModalOpen(false)}
                className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center cursor-pointer hover:bg-rose-600 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Message */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-200 text-xs leading-relaxed space-y-2">
              <p className="font-extrabold text-amber-300">
                👑 للحصول على باقات الكونز بعروض حصرية وتسليم فوري:
              </p>
              <p className="text-[11px] text-amber-100/80">
                يرجى تزويد الوكيل المعتمد بالـ ID الرقمي الخاص بك لشحن رصيدك في الحساب مباشرة وبشكل إلكتروني آمن.
              </p>
            </div>

            {/* Agent Options */}
            <div className="flex flex-col gap-2.5">
              {shippingAgents.slice(0, 3).map(ag => (
                <div
                  key={ag.id}
                  className="p-3 rounded-2xl bg-black/50 border border-amber-500/40 flex items-center justify-between gap-2 shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={ag.avatar}
                      alt={ag.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-amber-400"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-black text-xs text-amber-100">{ag.name}</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="text-[10px] text-amber-300 font-mono">
                        ID: {ag.numericId || ag.id}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyAgentId(ag.numericId || ag.id)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#d97706] to-[#f59e0b] text-amber-950 font-black text-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-transform shadow-sm"
                  >
                    {copiedId === (ag.numericId || ag.id) ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-amber-950" />
                        <span>تم نسخ الـ ID</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ الـ ID</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsCustomerServiceModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 font-black text-xs cursor-pointer hover:bg-amber-500/30 transition-colors"
            >
              إغلاق النافذة
            </button>

          </div>
        </div>
      )}

    </div>
  );
};
