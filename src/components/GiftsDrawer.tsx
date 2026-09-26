import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Gift, RoomMember, RoomSeat, User } from '../types';
import { API } from '../services/api';
import { soundEffects } from '../services/soundEffects';
import confetti from 'canvas-confetti';
import { Gem, Gift as GiftIcon, Send, X, CheckCircle, AlertCircle, Users, Zap, Flame, Crown, Sparkles, Trophy } from 'lucide-react';
import { GiftVisualRenderer } from './GiftVisualRenderer';

interface GiftsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  roomId?: string;
  roomSeats: RoomSeat[];
  roomMembers: RoomMember[];
  hostUser: { id: string; name: string; avatar: string };
  selectedReceiverId?: string;
  onReceiverChange?: (receiverId: string) => void;
  onGiftSentSuccess?: (gift: Gift, count: number, receiverName: string, receiverId: string, transactionId?: string, receiverAvatar?: string) => void;
  onUserUpdated?: (user: User) => void;
  onOpenWallet: () => void;
}

type GiftCategoryTab = 'all' | 'common' | 'pretty' | 'luxury' | 'legendary' | 'vip';

export const GiftsDrawer: React.FC<GiftsDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  roomId,
  roomSeats,
  roomMembers,
  hostUser,
  selectedReceiverId: controlledReceiverId,
  onReceiverChange,
  onGiftSentSuccess,
  onUserUpdated,
  onOpenWallet
}) => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<GiftCategoryTab>('all');

  const isOwner = currentUser.role === 'OWNER' ||
    currentUser.isOwner === true ||
    currentUser.is_owner === true ||
    currentUser.id === 'user_admin' ||
    currentUser.username?.toLowerCase() === 'jdwalrwyy';
  
  // Recipient selection
  const [localReceiverId, setLocalReceiverId] = useState<string>(hostUser.id);
  const activeReceiverId = controlledReceiverId || localReceiverId;

  // Multiplier / Quantity
  const [selectedMultiplier, setSelectedMultiplier] = useState<number>(1);

  // Tap & Combo state
  const [comboCount, setComboCount] = useState<number>(0);
  const [isSending, setIsSending] = useState(false);
  
  // Long-press charge state
  const [isCharging, setIsCharging] = useState(false);
  const [chargedCount, setChargedCount] = useState<number>(0);
  
  // Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Refs for timers
  const comboTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingTapsRef = useRef<number>(0);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chargeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef<boolean>(false);
  const pressStartTimestampRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      API.getGifts().then(data => {
        setGifts(data);
        if (data.length > 0 && !selectedGift) {
          setSelectedGift(data[0]);
        }
      }).catch(() => {});
      setErrorMsg(null);
      setSuccessMsg(null);
      pendingTapsRef.current = 0;
      setComboCount(0);
      setSelectedMultiplier(1);
    } else {
      // Clear timers on close
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
      if (chargeIntervalRef.current) clearInterval(chargeIntervalRef.current);
      setIsCharging(false);
    }
  }, [isOpen]);

  const handleSelectReceiver = (id: string) => {
    setLocalReceiverId(id);
    if (onReceiverChange) {
      onReceiverChange(id);
    }
    setErrorMsg(null);
  };

  // Build list of active potential recipients in the room (Host + Seated Users)
  const potentialReceivers: { id: string; name: string; avatar: string; badge: string; gender?: 'male' | 'female' }[] = [];
  
  // Host first
  potentialReceivers.push({
    id: hostUser.id,
    name: hostUser.name,
    avatar: hostUser.avatar,
    badge: '👑 المضيف'
  });

  // Seated users (Microphones 1 to 8)
  roomSeats.forEach(s => {
    if (s.userId && s.userId !== hostUser.id) {
      potentialReceivers.push({
        id: s.userId,
        name: s.userName || `مايك ${s.seatIndex + 1}`,
        avatar: s.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${s.userId}`,
        badge: `🎙️ مايك ${s.seatIndex + 1}`,
        gender: s.userGender
      });
    }
  });

  // If there are multiple people on mic, allow "All Mics" option
  const isAllMicsSelected = activeReceiverId === 'ALL_MICS';
  const allMicsTargetIds = potentialReceivers.filter(r => r.id !== currentUser.id).map(r => r.id);

  // Active receiver object
  const activeReceiverObj = useMemo(() => {
    if (isAllMicsSelected) {
      return { id: 'ALL_MICS', name: `جميع المايكات (${allMicsTargetIds.length})`, avatar: '', badge: '🌟 الكل' };
    }
    return potentialReceivers.find(r => r.id === activeReceiverId) || potentialReceivers[0];
  }, [activeReceiverId, potentialReceivers, isAllMicsSelected, allMicsTargetIds.length]);

  // Filter gifts by 5 tiers
  const filteredGifts = useMemo(() => {
    return gifts.filter(g => {
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'common') {
        return g.category === 'common' || (g.diamondCost >= 5 && g.diamondCost <= 100);
      }
      if (selectedCategory === 'pretty') {
        return g.category === 'pretty' || (g.diamondCost >= 200 && g.diamondCost <= 5000);
      }
      if (selectedCategory === 'luxury') {
        return g.category === 'luxury' || (g.diamondCost >= 8000 && g.diamondCost <= 30000);
      }
      if (selectedCategory === 'legendary') {
        return g.category === 'legendary' || (g.diamondCost >= 40000 && g.diamondCost <= 80000);
      }
      if (selectedCategory === 'vip') {
        return g.category === 'vip' || g.diamondCost >= 90000;
      }
      return true;
    });
  }, [gifts, selectedCategory]);

  const recipientsMultiplier = isAllMicsSelected ? Math.max(1, allMicsTargetIds.length) : 1;
  const currentCount = isCharging ? Math.max(1, chargedCount) : comboCount > 0 ? comboCount : selectedMultiplier;
  const totalCostPreview = selectedGift ? selectedGift.diamondCost * currentCount * recipientsMultiplier : 0;
  const isAffordable = currentUser.diamonds >= totalCostPreview;

  // Core Send Logic that executes the API and UI animations
  const executeSendGiftBatch = async (gift: Gift, countToSend: number, targetId: string) => {
    if (countToSend <= 0 || !gift || isSending) return;

    const totalCost = gift.diamondCost * countToSend * recipientsMultiplier;
    if (currentUser.diamonds < totalCost) {
      setErrorMsg('رصيد الماسات غير كافٍ');
      soundEffects.playError();
      return;
    }

    setIsSending(true);
    setErrorMsg(null);

    try {
      if (targetId === 'ALL_MICS') {
        let latestUser: User = currentUser;
        for (const recId of allMicsTargetIds) {
          const idempotencyKey = `gift_${currentUser.id}_${recId}_${gift.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const res = await API.sendGift({
            senderId: currentUser.id,
            receiverId: recId,
            giftId: gift.id,
            count: countToSend,
            roomId,
            idempotencyKey
          });

          if (res.user) {
            latestUser = res.user;
          } else if (res.senderNewDiamonds !== undefined) {
            latestUser = { ...latestUser, diamonds: res.senderNewDiamonds };
          }
        }

        if (onUserUpdated) {
          onUserUpdated(latestUser);
        }

        soundEffects.playGiftSound((gift as any).tierLevel || 'STANDARD', (gift.diamondCost || 0) * countToSend, gift.soundKey);
        confetti({
          particleCount: Math.min(120, countToSend * 20),
          spread: 80,
          origin: { y: 0.7 }
        });
        setSuccessMsg(`تم إرسال ${countToSend}x ${gift.nameAr} لجميع المايكات! 🎉`);
        if (onGiftSentSuccess) {
          onGiftSentSuccess(gift, countToSend, 'جميع المايكات 🌟', 'ALL_MICS', `all_mics_${Date.now()}`);
        }
      } else {
        const idempotencyKey = `gift_${currentUser.id}_${targetId}_${gift.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const receiver = potentialReceivers.find(r => r.id === targetId) || potentialReceivers[0];

        const res = await API.sendGift({
          senderId: currentUser.id,
          receiverId: targetId,
          giftId: gift.id,
          count: countToSend,
          roomId,
          idempotencyKey
        });

        // Immediately update diamonds balance in app state
        if (res.user && onUserUpdated) {
          onUserUpdated(res.user);
        } else if (res.senderNewDiamonds !== undefined && onUserUpdated) {
          onUserUpdated({ ...currentUser, diamonds: res.senderNewDiamonds });
        }

        soundEffects.playGiftSound((gift as any).tierLevel || 'STANDARD', (gift.diamondCost || 0) * countToSend, gift.soundKey);

        if (countToSend >= 10 || gift.diamondCost >= 5000) {
          confetti({
            particleCount: Math.min(150, countToSend * 15),
            spread: 75,
            origin: { y: 0.7 }
          });
        }

        setSuccessMsg(`تم إرسال ${countToSend}x ${gift.nameAr} إلى ${receiver.name}! 🎉`);
        if (onGiftSentSuccess) {
          onGiftSentSuccess(gift, countToSend, receiver.name, receiver.id, res.transaction?.id, receiver.avatar);
        }
      }

      // Auto-clear success message after 2.5s
      setTimeout(() => {
        setSuccessMsg(null);
      }, 2500);

    } catch (err: any) {
      setErrorMsg(err?.message || 'تعذر إرسال الهدية. يرجى المحاولة لاحقاً');
      soundEffects.playError();
    } finally {
      setIsSending(false);
      setComboCount(0);
      pendingTapsRef.current = 0;
    }
  };

  // Direct Send Single / Multiplier click
  const handleQuickSend = (count: number) => {
    if (!selectedGift) return;
    executeSendGiftBatch(selectedGift, count, activeReceiverId);
  };

  // Tap or Fast Combo Click
  const handleTap = () => {
    if (!selectedGift || isSending) return;

    if (comboTimerRef.current) {
      clearTimeout(comboTimerRef.current);
    }

    pendingTapsRef.current += 1;
    setComboCount(pendingTapsRef.current);
    soundEffects.playPop();

    // Debounce fast taps: after 450ms of quiet, send the accumulated combo batch
    comboTimerRef.current = setTimeout(() => {
      const finalCount = pendingTapsRef.current;
      executeSendGiftBatch(selectedGift, finalCount, activeReceiverId);
    }, 450);
  };

  // Long press / Charge logic
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!selectedGift || isSending) return;
    isLongPressRef.current = false;
    pressStartTimestampRef.current = Date.now();

    pressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setIsCharging(true);
      setChargedCount(1);
      soundEffects.playPop();

      chargeIntervalRef.current = setInterval(() => {
        setChargedCount(prev => {
          const next = prev + 1;
          const cost = selectedGift.diamondCost * next * recipientsMultiplier;
          if (cost > currentUser.diamonds || next >= 99) {
            if (chargeIntervalRef.current) clearInterval(chargeIntervalRef.current);
            return prev;
          }
          if (next % 5 === 0) soundEffects.playPop();
          return next;
        });
      }, 70);
    }, 280);
  };

  const handlePointerUpOrCancel = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }

    if (chargeIntervalRef.current) {
      clearInterval(chargeIntervalRef.current);
    }

    if (isCharging) {
      setIsCharging(false);
      const finalCharged = Math.max(1, chargedCount);
      if (selectedGift) {
        executeSendGiftBatch(selectedGift, finalCharged, activeReceiverId);
      }
      setChargedCount(0);
      isLongPressRef.current = false;
    } else {
      const pressDuration = Date.now() - pressStartTimestampRef.current;
      if (pressDuration < 280 && !isLongPressRef.current) {
        if (selectedMultiplier > 1) {
          handleQuickSend(selectedMultiplier);
        } else {
          handleTap();
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Semi-transparent backdrop - lets upper 8 mics and room view stay visible and clear */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Compact Bottom Sheet Overlay (Sitting cleanly at bottom without covering room or 8 mic seats) */}
      <div
        className="fixed bottom-0 inset-x-0 z-50 max-w-lg mx-auto bg-slate-900/98 backdrop-blur-2xl border-t-2 border-amber-500/40 rounded-t-3xl shadow-[0_-10px_35px_rgba(0,0,0,0.8)] p-3 sm:p-4 flex flex-col gap-2.5 max-h-[58vh] sm:max-h-[480px] overflow-hidden animate-in slide-in-from-bottom duration-200 select-none"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Drag Handle Bar */}
        <div
          className="w-10 h-1 bg-slate-700/80 hover:bg-amber-400/80 rounded-full mx-auto cursor-pointer transition-colors"
          onClick={onClose}
          title="إغلاق اللوحة"
        />

        {/* Header Bar: Title + Diamonds Balance & Recharge */}
        <div className="flex items-center justify-between border-b border-slate-800/90 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-gradient-to-tr from-amber-500/20 to-yellow-400/10 text-amber-400 border border-amber-500/30">
              <GiftIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-100">إرسال الهدايا</h3>
                {comboCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 text-[10px] font-black animate-bounce flex items-center gap-0.5 shadow-sm shadow-orange-500/50">
                    <Flame className="w-3 h-3 fill-current" />
                    <span>x{comboCount}</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">اختر المستلم والهدية • ضغطات سريعة لتكرار الإرسال</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Real-time Diamonds Balance (+ Top-up Button only for Owner) */}
            <div
              title="رصيدك من الماسات"
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-700/80 text-sky-300 text-xs font-black shadow-sm"
            >
              <Gem className="w-3.5 h-3.5 text-sky-400" />
              <span>{currentUser.diamonds.toLocaleString('ar-EG')}</span>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Recipient Selector Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0">
          <span className="text-[11px] text-amber-400 font-extrabold whitespace-nowrap ml-1">المستلم:</span>

          {potentialReceivers.map(rec => {
            const isSelected = activeReceiverId === rec.id;
            return (
              <button
                key={rec.id}
                onClick={() => handleSelectReceiver(rec.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/25 scale-102 ring-2 ring-amber-300 font-black'
                    : 'bg-slate-800/90 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                <img
                  src={rec.avatar}
                  alt={rec.name}
                  className="w-4 h-4 rounded-full object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
                <span className="truncate max-w-[80px]">{rec.name}</span>
                <span className={`text-[9px] px-1 rounded ${isSelected ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-700/60 text-amber-300'}`}>
                  {rec.badge}
                </span>
              </button>
            );
          })}

          {/* All Mics Option */}
          {potentialReceivers.length > 1 && (
            <button
              onClick={() => handleSelectReceiver('ALL_MICS')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                isAllMicsSelected
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/25 scale-102 ring-2 ring-amber-300 font-black'
                  : 'bg-purple-950/70 hover:bg-purple-900/80 text-purple-300 border border-purple-500/40'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-purple-300" />
              <span>جميع المايكات ({allMicsTargetIds.length})</span>
            </button>
          )}
        </div>

        {/* Category Filter Tabs (Clean luxury styling, no emojis) */}
        <div className="flex items-center justify-between gap-1 border-b border-slate-800/80 pb-1.5 shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
            {[
              { id: 'all' as const, label: 'الكل' },
              { id: 'common' as const, label: 'كلاسيكية (5-100 💎)' },
              { id: 'pretty' as const, label: 'مميزة (200-5K 💎)' },
              { id: 'luxury' as const, label: 'فاخرة (8K-30K 💎)' },
              { id: 'legendary' as const, label: 'أسطورية (40K-80K 💎)' },
              { id: 'vip' as const, label: 'VIP النخبة (90K-100K 💎)' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-black transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? cat.id === 'vip'
                      ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/30 ring-2 ring-yellow-300'
                      : cat.id === 'legendary'
                      ? 'bg-gradient-to-r from-purple-700 to-amber-500 text-white shadow-md ring-1 ring-amber-400'
                      : 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-800/50'
                }`}
              >
                {cat.id === 'vip' && <Crown className="w-3 h-3 text-amber-300 fill-amber-300 shrink-0" />}
                {cat.id === 'legendary' && <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          <span className="text-[10px] text-slate-500 font-bold shrink-0 hidden sm:inline">
            {filteredGifts.length} هدية
          </span>
        </div>

        {/* Luxury Boutique Gifts Grid with 3D Presentation Showrooms */}
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 overflow-y-auto max-h-[195px] sm:max-h-[225px] p-1 scrollbar-thin">
          {filteredGifts.map(gift => {
            const isSelected = selectedGift?.id === gift.id;
            const isVip = gift.diamondCost >= 90000 || gift.category === 'vip';
            const isLegendary = (gift.diamondCost >= 40000 && gift.diamondCost < 90000) || gift.category === 'legendary';
            const isLuxury = (gift.diamondCost >= 8000 && gift.diamondCost < 40000) || gift.category === 'luxury';
            const isPretty = (gift.diamondCost >= 200 && gift.diamondCost < 8000) || gift.category === 'pretty';

            return (
              <div
                key={gift.id}
                onClick={() => {
                  setSelectedGift(gift);
                  setErrorMsg(null);
                }}
                className={`relative flex flex-col items-center justify-between p-1.5 rounded-2xl cursor-pointer transition-all min-h-[106px] group ${
                  isSelected
                    ? isVip
                      ? 'bg-gradient-to-b from-purple-900/70 via-amber-950/50 to-slate-900 border-2 border-yellow-300 shadow-xl shadow-yellow-500/30 scale-102 ring-2 ring-yellow-400'
                      : isLegendary
                      ? 'bg-gradient-to-b from-amber-500/30 to-purple-950/50 border-2 border-amber-400 shadow-lg shadow-amber-500/25 scale-102 ring-2 ring-amber-400/50'
                      : 'bg-gradient-to-b from-amber-500/25 to-yellow-500/10 border-2 border-amber-400 shadow-lg shadow-amber-500/25 scale-102 ring-2 ring-amber-400/40'
                    : isVip
                    ? 'bg-gradient-to-b from-purple-950/40 via-slate-900/90 to-slate-950 hover:bg-slate-800/90 border border-yellow-400/50 text-slate-200'
                    : isLegendary
                    ? 'bg-gradient-to-b from-slate-900 via-slate-900/90 to-amber-950/40 hover:bg-slate-800/90 border border-amber-500/40 text-slate-200'
                    : isLuxury
                    ? 'bg-slate-900/90 hover:bg-slate-800/90 border border-amber-500/30 text-slate-300'
                    : 'bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/60 text-slate-300 hover:border-slate-500'
                }`}
              >
                {/* Sleek Vector Tier Badges (No Emojis) */}
                {isVip && (
                  <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-[8px] font-black shadow-md border border-white flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5 text-slate-950 fill-current" />
                    <span>VIP</span>
                  </span>
                )}
                {isLegendary && !isVip && (
                  <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full bg-purple-600 text-amber-200 text-[8px] font-black shadow-md border border-amber-400/50 flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                    <span>أسطوري</span>
                  </span>
                )}
                {isLuxury && (
                  <span className="absolute -top-1.5 -right-1 px-1 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[8px] font-black border border-amber-500/40 flex items-center gap-0.5">
                    <Trophy className="w-2 h-2 text-amber-400" />
                    <span>فاخر</span>
                  </span>
                )}

                {/* 3D Realistic Showcase Podium & Model */}
                <div className="relative w-full h-[52px] flex items-center justify-center group-hover:scale-108 transition-transform">
                  {/* Subtle 3D Glass Pedestal Glow */}
                  <div className="absolute inset-x-2 bottom-0 h-1.5 rounded-full bg-gradient-to-r from-transparent via-amber-400/20 to-transparent blur-[2px]" />
                  <GiftVisualRenderer
                    giftId={gift.id}
                    icon={gift.icon}
                    giftName={gift.nameAr}
                    tier={isVip ? 'VIP' : isLegendary ? 'LEGENDARY' : isLuxury ? 'LUXURY' : isPretty ? 'PRETTY' : 'COMMON'}
                    size="store"
                    showAura={false}
                  />
                </div>

                {/* Gift Arabic Name & Diamond Cost */}
                <div className="w-full flex flex-col items-center mt-1">
                  <span className="text-[10px] font-black text-slate-100 text-center truncate w-full px-0.5 leading-tight">
                    {gift.nameAr}
                  </span>

                  <div className="flex items-center gap-0.5 text-[9px] font-black text-sky-400 mt-0.5">
                    <Gem className="w-2.5 h-2.5 text-sky-400" />
                    <span>{gift.diamondCost.toLocaleString('ar-EG')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[11px] font-bold flex items-center justify-between gap-2 shrink-0 animate-in fade-in">
            <div className="flex items-center gap-1.5 truncate">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span className="truncate">{errorMsg}</span>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[11px] font-black flex items-center gap-1.5 shrink-0 animate-in fade-in">
            <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            <span className="truncate">{successMsg}</span>
          </div>
        )}

        {/* Bottom Actions Bar (Multiplier Presets + Send Confirmation Button) */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/90 shrink-0">
          {/* Multiplier Presets */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-0.5 rounded-xl border border-slate-700/70 shrink-0">
            {[1, 5, 10, 66, 99, 520].map(num => (
              <button
                key={num}
                onClick={() => setSelectedMultiplier(num)}
                disabled={!selectedGift || isSending}
                className={`px-1.5 sm:px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-black transition-all ${
                  selectedMultiplier === num && comboCount === 0 && !isCharging
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-amber-400 hover:bg-slate-700/60'
                }`}
                title={`تحديد الكمية x${num}`}
              >
                {num}x
              </button>
            ))}
          </div>

          {/* Interactive Send Confirmation Button */}
          <button
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUpOrCancel}
            onPointerCancel={handlePointerUpOrCancel}
            onPointerLeave={handlePointerUpOrCancel}
            disabled={!selectedGift || isSending}
            className={`relative overflow-hidden flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm transition-all select-none touch-none cursor-pointer ${
              !isAffordable
                ? 'bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300'
                : isCharging
                ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 text-slate-950 scale-102 ring-4 ring-amber-400 shadow-xl shadow-amber-500/40 animate-pulse'
                : comboCount > 0
                ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 ring-2 ring-amber-400 shadow-lg'
                : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/25 active:scale-95'
            }`}
          >
            {isCharging ? (
              <div className="flex items-center gap-1.5 animate-pulse">
                <Zap className="w-4 h-4 text-slate-950 fill-current animate-bounce" />
                <span>
                  جارِ الشحن: x{chargedCount} ({totalCostPreview.toLocaleString('ar-EG')} 💎) • ارفع للإرسال!
                </span>
              </div>
            ) : comboCount > 0 ? (
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-700 fill-current animate-bounce" />
                <span>
                  كومبو x{comboCount} ({totalCostPreview.toLocaleString('ar-EG')} 💎)
                </span>
              </div>
            ) : isSending ? (
              <span className="text-[11px] text-slate-900 flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>جارِ الإرسال والخصم...</span>
              </span>
            ) : !isAffordable ? (
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>الرصيد غير كافٍ ({totalCostPreview.toLocaleString('ar-EG')} 💎)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 truncate">
                <Send className="w-3.5 h-3.5 rotate-180 shrink-0" />
                <span className="truncate">
                  إرسال إلى {activeReceiverObj.name}: {selectedGift?.nameAr} ({totalCostPreview.toLocaleString('ar-EG')} 💎)
                </span>
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  );
};
