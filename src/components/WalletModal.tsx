import React, { useState, useEffect } from 'react';
import { User, WalletTransaction, isUserOwner } from '../types';
import { API } from '../services/api';
import { soundEffects } from '../services/soundEffects';
import { OwnerFreeRechargeModal } from './OwnerFreeRechargeModal';
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
  Phone,
  Copy,
  Check,
  ExternalLink
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

  const [activeTab, setActiveTab] = useState<'balance' | 'convert' | 'agencies' | 'history'>('balance');

  // Convert tab state
  const [convertAmount, setConvertAmount] = useState<string>('100');

  // Agencies tab state
  const [shippingAgents, setShippingAgents] = useState<ShippingAgentItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Shared state
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isFreeRechargeOpen, setIsFreeRechargeOpen] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-black text-base text-slate-100">المحفظة والرصيد</h2>
                {isOwner ? (
                  <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Crown className="w-3 h-3 text-amber-400" />
                    المالك العام 👑
                  </span>
                ) : isAgent ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                    وكيل شحن معتمد
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    شحن خارجي 🛡️
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">إدارة الكونز، الماسات وسجل العمليات المالية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60">
          {[
            { id: 'balance' as const, label: 'الرصيد', icon: Coins },
            { id: 'convert' as const, label: 'تحويل العملات', icon: ArrowRightLeft },
            { id: 'agencies' as const, label: 'وكالات الشحن', icon: ShieldCheck },
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
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: BALANCE CARDS */}
        {activeTab === 'balance' && (
          <div className="flex flex-col gap-3">
            {/* Exclusive Owner Free Recharge Button */}
            {isOwner && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/90 via-yellow-950/60 to-amber-950/90 border border-amber-500/50 flex items-center justify-between shadow-xl shadow-amber-500/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/30">
                    <Crown className="w-5 h-5 fill-slate-950" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-300 flex items-center gap-1">
                      <span>شحن المَسّات مجاناً</span>
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                        خاص بالمالك
                      </span>
                    </h4>
                    <p className="text-[10px] text-amber-200/80">إضافة مَسّات إلى رصيد المالك دون دفع</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFreeRechargeOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Crown className="w-3.5 h-3.5 fill-slate-950" />
                  <span>👑 شحن المَسّات — المالك</span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {/* Coins Card */}
              <div className="bg-gradient-to-br from-amber-950/80 to-amber-900/40 border border-amber-500/30 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">الكونز (Coins)</span>
                  <Coins className="w-5 h-5 text-amber-400" />
                </div>
                <div className="my-2">
                  <span className="text-2xl font-black text-amber-200">
                    {currentUser.coins.toLocaleString('ar-EG')}
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('convert')}
                  className="text-[11px] font-bold text-amber-400 hover:underline text-right"
                >
                  تحويل إلى ماسات ←
                </button>
              </div>

              {/* Diamonds Card */}
              <div className="bg-gradient-to-br from-sky-950/80 to-sky-900/40 border border-sky-500/30 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-300">الماسات (Diamonds)</span>
                  <Gem className="w-5 h-5 text-sky-400" />
                </div>
                <div className="my-2">
                  <span className="text-2xl font-black text-sky-200">
                    {currentUser.diamonds.toLocaleString('ar-EG')}
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('agencies')}
                  className="text-[11px] font-bold text-sky-400 hover:underline text-right"
                >
                  الشحن عبر وكيل ←
                </button>
              </div>
            </div>

            {/* Official Agency Policy Card */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-amber-500/30 text-xs text-slate-300 leading-relaxed space-y-2">
              <div className="flex items-center gap-2 font-black text-amber-300 text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>سياسة الشحن الرسمي للتطبيق:</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                تم اعتماد الشحن الخارجي فقط عن طريق <b>«وكلاء الشحن المعتمدين»</b> للحفاظ على أمان معاملاتك وسرعة التغذية. الشحن الداخلي وبوابات الدفع الإلكترونية المباشرة معطلة تماماً لتوفير أعلى مستويات الأمان.
              </p>
              <div className="pt-1 flex items-center justify-between border-t border-slate-700/60">
                <button
                  onClick={() => setActiveTab('agencies')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 transition-all"
                >
                  <span>عرض وكالات الشحن المعتمدة</span>
                  <ExternalLink className="w-3 h-3" />
                </button>

                {(isOwner || isAgent) && onOpenShippingAgent && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenShippingAgent();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-1 transition-all"
                  >
                    <span>فتح لوحة الوكالة</span>
                    <Gem className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONVERT COINS TO DIAMONDS */}
        {activeTab === 'convert' && (
          <div className="flex flex-col gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
              <span>سعر التحويل الحالي:</span>
              <span className="font-black font-mono">100 كونز = 50 ماسة</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                الكمية المراد تحويلها من الكونز:
              </label>
              <input
                type="number"
                min="100"
                step="100"
                value={convertAmount}
                onChange={(e) => setConvertAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 focus:border-amber-400 focus:outline-none text-slate-100 font-bold text-base"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs">
              <span className="text-slate-400">ستحصل على:</span>
              <span className="font-extrabold text-sky-300 text-sm">
                {Math.floor(Number(convertAmount) / 2)} ماسة 💎
              </span>
            </div>

            <button
              onClick={handleConvert}
              disabled={isLoading || Number(convertAmount) <= 0 || Number(convertAmount) > currentUser.coins || Number(convertAmount) % 100 !== 0}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-extrabold text-sm shadow-lg shadow-amber-500/20 active:scale-98 transition-all"
            >
              {isLoading ? 'جاري التحويل...' : 'تأكيد عملية التحويل'}
            </button>
          </div>
        )}

        {/* TAB 3: SHIPPING AGENCIES LIST */}
        {activeTab === 'agencies' && (
          <div className="flex flex-col gap-3">
            <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-200">
              <span className="font-bold block text-sky-300 mb-0.5">كيف تشحن رصيدك عبر وكيل الشحن؟</span>
              <span>تواصل مع أحد الوكلاء المعتمدين أدناه، وقدم له ID حسابك الرقمي لتقوم بالدفع الخارجي ويقوم الوكيل بشحن الماسات لحسابك مباشرة.</span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {shippingAgents.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">جاري تحميل قائمة الوكلاء المعتمدين...</div>
              ) : (
                shippingAgents.map(agent => (
                  <div
                    key={agent.id}
                    className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={agent.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${agent.username}`}
                        alt={agent.name}
                        className="w-10 h-10 rounded-full border border-amber-500/40 object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-100">{agent.name}</span>
                          <span className="text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-full">
                            وكيل معتمد 🛡️
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          ID: <span className="text-amber-300 font-bold">{agent.numericId || agent.id}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyAgentId(agent.numericId || agent.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold flex items-center gap-1 transition-colors"
                        title="نسخ ID الوكيل"
                      >
                        {copiedId === (agent.numericId || agent.id) ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ ID</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: TRANSACTION HISTORY */}
        {activeTab === 'history' && (
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">لا توجد عمليات سابقة حتى الآن.</div>
            ) : (
              transactions.map(tx => (
                <div key={tx.id} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-200 block">{tx.description}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(tx.createdAt).toLocaleDateString('ar-EG')} - {new Date(tx.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className={`font-extrabold ${tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.amount > 0 ? `+${tx.amount.toLocaleString('ar-EG')}` : tx.amount.toLocaleString('ar-EG')} {tx.type === 'COIN' ? 'كونز' : 'ماسة'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Owner Free Recharge Modal */}
        <OwnerFreeRechargeModal
          isOpen={isFreeRechargeOpen}
          onClose={() => setIsFreeRechargeOpen(false)}
          currentUser={currentUser}
          onUserUpdated={onUserUpdated}
        />
      </div>
    </div>
  );
};
