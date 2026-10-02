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

  // Seated users (Microphones 1 to N)
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

  const isAllMicsSelected = activeReceiverId === 'ALL_MICS';
  const allMicsTargetIds = potentialReceivers.filter(r => r.id !== currentUser.id).map(r => r.id);

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

    const isCoinGift = (gift as any).currency === 'COIN' || gift.diamondCost === 0;
    const unitCost = isCoinGift ? ((gift as any).coinCost || gift.coinReward || 10) : gift.diamondCost;
    const totalCost = unitCost * countToSend * recipientsMultiplier;

    if (isCoinGift) {
      if ((currentUser.coins || 0) < totalCost) {
        setErrorMsg('رصيدك غير كافٍ، يرجى الشحن');
        soundEffects.playError();
        return;
      }
    } else {
      if ((currentUser.diamonds || 0) < totalCost) {
        setErrorMsg('رصيدك غير كافٍ، يرجى الشحن');
        soundEffects.playError();
        return;
      }
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
          } else if (res.senderNewDiamonds !== undefined || res.senderNewCoins !== undefined) {
            latestUser = {
              ...latestUser,
              ...(res.senderNewDiamonds !== undefined && { diamonds: res.senderNewDiamonds }),
              ...(res.senderNewCoins !== undefined && { coins: res.senderNewCoins })
            };
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

        if (res.user && onUserUpdated) {
          onUserUpdated(res.user);
        } else if ((res.senderNewDiamonds !== undefined || res.senderNewCoins !== undefined) && onUserUpdated) {
          onUserUpdated({
            ...currentUser,
            ...(res.senderNewDiamonds !== undefined && { diamonds: res.senderNewDiamonds }),
            ...(res.senderNewCoins !== undefined && { coins: res.senderNewCoins })
          });
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

      setTimeout(() => {
        setSuccessMsg(null);
      }, 2500);

    } catch (err: any) {
      setErrorMsg(err?.message || 'رصيدك غير كافٍ، يرجى الشحن');
      soundEffects.playError();
    } finally {
      setIsSending(false);
      setComboCount(0);
      pendingTapsRef.current = 0;
    }
  };

  const handleQuickSend = (count: number) => {
    if (!selectedGift) return;
    executeSendGiftBatch(selectedGift, count, activeReceiverId);
  };

  const handleTap = () => {
    if (!selectedGift || isSending) return;

    if (comboTimerRef.current) {
      clearTimeout(comboTimerRef.current);
    }

    pendingTapsRef.current += 1;
    setComboCount(pendingTapsRef.current);
    soundEffects.playPop();

    comboTimerRef.current = setTimeout(() => {
      const finalCount = pendingTapsRef.current;
      executeSendGiftBatch(selectedGift, finalCount, activeReceiverId);
    }, 450);
  };

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
      {/* Semi-transparent backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Main Gifts Window Container with Exact Proportions: 10% Sleek Header, 75% Gift Grid, 15% Bottom Control Bar */}
      <div
        className="fixed bottom-0 inset-x-0 z-50 max-w-lg mx-auto bg-slate-950/98 backdrop-blur-2xl border-t-2 border-amber-500/40 rounded-t-3xl shadow-[0_-10px_35px_rgba(0,0,0,0.9)] p-2.5 sm:p-3 flex flex-col h-[62vh] max-h-[500px] overflow-hidden animate-in slide-in-from-bottom duration-200 select-none"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Drag Handle Bar */}
        <div
          className="w-10 h-1 bg-slate-700/80 hover:bg-amber-400/80 rounded-full mx-auto cursor-pointer transition-colors shrink-0 mb-1"
          onClick={onClose}
          title="إغلاق اللوحة"
        />

        {/* 1. COMPACT SLEEK HEADER (10% Height): Max 36px-40px per row, ultra-thin padding <= 4px */}
        <div className="shrink-0 flex flex-col gap-1 border-b border-slate-800/90 pb-1.5">
          {/* Top Row: Title + Recipient Chips + Balance & Close */}
          <div className="flex items-center justify-between gap-1.5 min-h-[36px]">
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
                <GiftIcon className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-xs text-slate-100 whitespace-nowrap">متجر الهدايا</span>
                {comboCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 text-[9px] font-black animate-bounce flex items-center gap-0.5">
                    <Flame className="w-2.5 h-2.5 fill-current" />
                    <span>x{comboCount}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Recipient Chips (Compact Scroll) */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 max-w-[180px] sm:max-w-[240px]">
              {potentialReceivers.map(rec => {
                const isSelected = activeReceiverId === rec.id;
                return (
                  <button
                    key={rec.id}
                    onClick={() => handleSelectReceiver(rec.id)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black shadow-sm'
                        : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                    }`}
                  >
                    <img
                      src={rec.avatar}
                      alt={rec.name}
                      className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <span className="truncate max-w-[60px]">{rec.name}</span>
                  </button>
                );
              })}

              {potentialReceivers.length > 1 && (
                <button
                  onClick={() => handleSelectReceiver('ALL_MICS')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    isAllMicsSelected
                      ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                      : 'bg-purple-950/70 text-purple-300 border border-purple-500/40'
                  }`}
                >
                  <Users className="w-3 h-3 text-purple-300" />
                  <span>الكل ({allMicsTargetIds.length})</span>
                </button>
              )}
            </div>

            {/* Balance & Close */}
            <div className="flex items-center gap-1 shrink-0">
              <div
                title="رصيدك من الماسات"
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700/80 text-sky-300 text-[11px] font-extrabold shadow-sm"
              >
                <Gem className="w-3 h-3 text-sky-400" />
                <span>{currentUser.diamonds.toLocaleString('ar-EG')}</span>
              </div>

              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                title="إغلاق"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Category Filter Tabs (Sleek, compact row) */}
          <div className="flex items-center justify-between gap-1 py-0.5">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
              {[
                { id: 'all' as const, label: 'الكل' },
                { id: 'common' as const, label: 'عادية (5-100 💎)' },
                { id: 'pretty' as const, label: 'مميزة (200-5K 💎)' },
                { id: 'luxury' as const, label: 'فاخرة (8K-30K 💎)' },
                { id: 'legendary' as const, label: 'أسطورية (40K-80K 💎)' },
                { id: 'vip' as const, label: 'VIP (90K-100K 💎)' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat.id
                      ? cat.id === 'vip'
                        ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-extrabold shadow-sm ring-1 ring-yellow-300'
                        : cat.id === 'legendary'
                        ? 'bg-gradient-to-r from-purple-700 to-amber-500 text-white font-extrabold shadow-sm'
                        : 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-900/80'
                  }`}
                >
                  {cat.id === 'vip' && <Crown className="w-2.5 h-2.5 text-amber-300 fill-amber-300 shrink-0" />}
                  {cat.id === 'legendary' && <Sparkles className="w-2.5 h-2.5 text-amber-300 shrink-0" />}
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            <span className="text-[9px] text-slate-500 font-bold shrink-0 hidden sm:inline">
              {filteredGifts.length} هدية
            </span>
          </div>
        </div>

        {/* 2. GIFT CONTAINER & GRID (75% Height): Wide, open, neatly proportioned cards with pristine borders */}
        <div className="flex-1 overflow-y-auto p-1 scrollbar-thin my-0.5">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2 auto-rows-fr">
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
                  className={`relative flex flex-col items-center justify-between p-1.5 rounded-xl cursor-pointer transition-all min-h-[92px] group select-none ${
                    isSelected
                      ? isVip
                        ? 'bg-gradient-to-b from-purple-900/80 via-amber-950/60 to-slate-900 border-2 border-yellow-300 shadow-md shadow-yellow-500/20 scale-102 ring-1 ring-yellow-400'
                        : isLegendary
                        ? 'bg-gradient-to-b from-amber-500/30 to-purple-950/60 border-2 border-amber-400 shadow-md shadow-amber-500/20 scale-102 ring-1 ring-amber-400'
                        : 'bg-gradient-to-b from-amber-500/25 to-yellow-500/10 border-2 border-amber-400 shadow-md shadow-amber-500/20 scale-102 ring-1 ring-amber-400'
                      : isVip
                      ? 'bg-slate-900/90 hover:bg-slate-800/90 border border-yellow-400/40 text-slate-200'
                      : isLegendary
                      ? 'bg-slate-900/90 hover:bg-slate-800/90 border border-amber-500/40 text-slate-200'
                      : isLuxury
                      ? 'bg-slate-900/90 hover:bg-slate-800/90 border border-amber-500/30 text-slate-300'
                      : 'bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800/90 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {/* Sleek Vector Tier Badges */}
                  {isVip && (
                    <span className="absolute top-1 right-1 px-1 py-0.2 rounded bg-amber-400 text-slate-950 text-[7px] font-black shadow-sm flex items-center gap-0.5">
                      <Crown className="w-2 h-2 text-slate-950 fill-current" />
                      <span>VIP</span>
                    </span>
                  )}
                  {isLegendary && !isVip && (
                    <span className="absolute top-1 right-1 px-1 py-0.2 rounded bg-purple-600 text-amber-200 text-[7px] font-black shadow-sm flex items-center gap-0.5">
                      <Sparkles className="w-2 h-2 text-amber-300" />
                      <span>أسطورة</span>
                    </span>
                  )}

                  {/* Gift 3D Renderer / Image Showcase */}
                  <div className="relative w-full h-[46px] flex items-center justify-center group-hover:scale-105 transition-transform mt-0.5">
                    <GiftVisualRenderer
                      giftId={gift.id}
                      icon={gift.icon}
                      giftName={gift.nameAr}
                      tier={isVip ? 'VIP' : isLegendary ? 'LEGENDARY' : isLuxury ? 'LUXURY' : isPretty ? 'PRETTY' : 'COMMON'}
                      size="store"
                      showAura={false}
                    />
                  </div>

                  {/* Gift Name & Price - Clear without clipping or overlap */}
                  <div className="w-full flex flex-col items-center justify-end mt-1">
                    <span className="text-[10px] font-black text-slate-100 text-center truncate w-full px-0.5 leading-tight">
                      {gift.nameAr}
                    </span>

                    <div className="flex items-center gap-0.5 text-[9px] font-bold text-sky-400 mt-0.5">
                      <Gem className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                      <span>{gift.diamondCost.toLocaleString('ar-EG')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-1.5 px-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[10px] font-bold flex items-center justify-between gap-1.5 shrink-0 animate-in fade-in">
            <div className="flex items-center gap-1.5 truncate">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span className="truncate">{errorMsg}</span>
            </div>
            {errorMsg.includes('رصيدك غير كافٍ') && (
              <button
                onClick={onOpenWallet}
                className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-[10px] shrink-0 transition-all shadow-sm cursor-pointer"
              >
                شحن الآن 💎
              </button>
            )}
          </div>
        )}

        {successMsg && (
          <div className="p-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-black flex items-center gap-1 shrink-0 animate-in fade-in">
            <CheckCircle className="w-3 h-3 shrink-0 text-emerald-400" />
            <span className="truncate">{successMsg}</span>
          </div>
        )}

        {/* 3. BOTTOM CONTROL BAR (15% Height): Multiplier Presets + Interactive Send Button */}
        <div className="shrink-0 flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-800/90">
          {/* Multiplier Presets */}
          <div className="flex items-center gap-0.5 bg-slate-800/90 p-0.5 rounded-xl border border-slate-700/70 shrink-0">
            {[1, 5, 10, 66, 99, 520].map(num => (
              <button
                key={num}
                onClick={() => setSelectedMultiplier(num)}
                disabled={!selectedGift || isSending}
                className={`px-1.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  selectedMultiplier === num && comboCount === 0 && !isCharging
                    ? 'bg-amber-400 text-slate-950 font-extrabold shadow-sm'
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
            className={`relative overflow-hidden flex-1 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl font-black text-xs transition-all select-none touch-none cursor-pointer ${
              !isAffordable
                ? 'bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300'
                : isCharging
                ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 text-slate-950 scale-102 ring-2 ring-amber-400 shadow-lg shadow-amber-500/30 animate-pulse'
                : comboCount > 0
                ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 ring-1 ring-amber-400 shadow-md'
                : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
            }`}
          >
            {isCharging ? (
              <div className="flex items-center gap-1 animate-pulse truncate">
                <Zap className="w-3.5 h-3.5 text-slate-950 fill-current animate-bounce shrink-0" />
                <span className="truncate">
                  جارِ الشحن: x{chargedCount} ({totalCostPreview.toLocaleString('ar-EG')} 💎)
                </span>
              </div>
            ) : comboCount > 0 ? (
              <div className="flex items-center gap-1 truncate">
                <Flame className="w-3.5 h-3.5 text-orange-700 fill-current animate-bounce shrink-0" />
                <span className="truncate">
                  كومبو x{comboCount} ({totalCostPreview.toLocaleString('ar-EG')} 💎)
                </span>
              </div>
            ) : isSending ? (
              <span className="text-[10px] text-slate-900 flex items-center gap-1 font-bold truncate">
                <Sparkles className="w-3 h-3 animate-spin shrink-0" />
                <span>جارِ الإرسال...</span>
              </span>
            ) : !isAffordable ? (
              <div className="flex items-center gap-1 truncate">
                <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="truncate">الرصيد غير كافٍ ({totalCostPreview.toLocaleString('ar-EG')} 💎)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 truncate">
                <Send className="w-3 h-3 rotate-180 shrink-0" />
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
