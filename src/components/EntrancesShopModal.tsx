import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Gem, Check, Eye, ShieldCheck, Car, Bird, Plane, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { Entrance, User } from '../types';
import { EntranceVisualRenderer } from './EntranceVisualRenderer';
import { RoomEntranceOverlay, RoomEntranceEventPayload } from './RoomEntranceOverlay';
import { soundEffects } from '../services/soundEffects';
import { parseJsonResponse } from '../services/api';

interface EntrancesShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserUpdated?: (user: User) => void;
  onOpenRechargeModal?: () => void;
  onTriggerLiveEntrance?: (entranceId: string) => void;
}

export const EntrancesShopModal: React.FC<EntrancesShopModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
  onOpenRechargeModal,
  onTriggerLiveEntrance
}) => {
  const [entrances, setEntrances] = useState<Entrance[]>([]);
  const [ownedIds, setOwnedIds] = useState<string[]>([]);
  const [activeEntranceId, setActiveEntranceId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [previewEvent, setPreviewEvent] = useState<RoomEntranceEventPayload | null>(null);
  const [isEntranceSoundMuted, setIsEntranceSoundMuted] = useState<boolean>(soundEffects.getIsEntranceSoundMuted());
  const [renderMode, setRenderMode] = useState<'3D' | '5D'>('5D');

  const handleToggleSoundMute = () => {
    const nextVal = soundEffects.toggleEntranceSoundMute();
    setIsEntranceSoundMuted(nextVal);
  };

  const isOwner = currentUser?.role === 'OWNER' || !!currentUser?.isOwner;

  // Fetch Entrances and User Owned Entrances
  const loadEntrancesData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // 1. Fetch available entrances
      const res = await fetch(`/api/entrances?userId=${currentUser.id}`);
      const data = await parseJsonResponse(res);
      if (data.entrances) {
        setEntrances(data.entrances);
      }

      // 2. Fetch owned entrance IDs
      const ownedRes = await fetch(`/api/entrances/user/${currentUser.id}`);
      const ownedData = await parseJsonResponse(ownedRes);
      if (ownedData.ownedEntranceIds) {
        setOwnedIds(ownedData.ownedEntranceIds);
      }

      // 3. Current active entrance
      if (currentUser.activeEntranceId) {
        setActiveEntranceId(currentUser.activeEntranceId);
      } else {
        setActiveEntranceId('');
      }
    } catch (err) {
      console.error('Failed to load entrances data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      loadEntrancesData();
    }
  }, [isOpen, currentUser?.id]);

  if (!isOpen || !currentUser) return null;

  // Handle Purchase Entrance
  const handlePurchase = async (entrance: Entrance) => {
    if (purchasingId) return;

    if (currentUser.diamonds < entrance.diamondPrice) {
      setFeedbackMsg({
        text: `رصيدك الحالي (${currentUser.diamonds.toLocaleString('ar-EG')} ماسة) لا يكفي لشراء هذه الدخلة (${entrance.diamondPrice.toLocaleString('ar-EG')} ماسة). اضغط على زر شحن الماسات لإضافة رصيد.`,
        isError: true
      });
      return;
    }

    setPurchasingId(entrance.id);
    setFeedbackMsg(null);

    try {
      const res = await fetch('/api/entrances/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          entranceId: entrance.id
        })
      });

      const data = await parseJsonResponse(res);
      if (res.ok && data.success) {
        setFeedbackMsg({ text: data.message, isError: false });
        setOwnedIds(prev => [...new Set([...prev, entrance.id])]);
        setActiveEntranceId(entrance.id);

        if (data.user && onUserUpdated) {
          onUserUpdated(data.user);
        }

        // Trigger cinematic preview of newly acquired entrance
        triggerPreview(entrance);
      } else {
        setFeedbackMsg({ text: data.error || 'فشلت عملية الشراء', isError: true });
      }
    } catch (err) {
      setFeedbackMsg({ text: 'حدث خطأ في الاتصال بالخادم', isError: true });
    } finally {
      setPurchasingId(null);
    }
  };

  // Handle Activate Entrance
  const handleActivate = async (entranceId: string) => {
    if (activatingId) return;
    setActivatingId(entranceId);
    setFeedbackMsg(null);

    try {
      const res = await fetch('/api/entrances/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          entranceId
        })
      });

      const data = await parseJsonResponse(res);
      if (res.ok && data.success) {
        setActiveEntranceId(entranceId);
        setFeedbackMsg({ text: 'تم تفعيل الدخلة بنجاح!', isError: false });

        const updatedUser = { ...currentUser, activeEntranceId: entranceId };
        if (onUserUpdated) {
          onUserUpdated(updatedUser);
        }

        const chosen = entrances.find(e => e.id === entranceId);
        if (chosen) {
          triggerPreview(chosen);
        }
      } else {
        setFeedbackMsg({ text: data.error || 'تعذر تفعيل الدخلة', isError: true });
      }
    } catch (err) {
      setFeedbackMsg({ text: 'حدث خطأ في تفعيل الدخلة', isError: true });
    } finally {
      setActivatingId(null);
    }
  };

  // Trigger Live Test Preview
  const triggerPreview = (entrance: Entrance) => {
    const isKing = entrance.id === 'entrance_owner_imperial_throne' ||
      entrance.id === 'entrance_king_limousine' ||
      entrance.category === 'OWNER' ||
      (isOwner && Boolean(entrance.isExclusiveOwner));

    setPreviewEvent({
      id: `preview_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      entranceId: entrance.id,
      entranceName: entrance.nameAr,
      entranceCategory: entrance.category,
      entranceTier: entrance.tier,
      soundType: entrance.soundType,
      durationSeconds: isKing ? 5.0 : (entrance.durationSeconds || 6.0),
      isOwner: isKing,
      userRole: currentUser.role,
      renderMode: renderMode
    });
  };

  // Filter Entrances
  const filteredEntrances = entrances.filter(e => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'OWNED') return ownedIds.includes(e.id);
    if (selectedCategory === 'VEHICLE') return e.category === 'VEHICLE';
    if (selectedCategory === 'CREATURE') return e.category === 'CREATURE';
    if (selectedCategory === 'AERIAL') return e.category === 'AERIAL' || e.category === 'MYTHIC';
    return true;
  });

  const activeEntrance = entrances.find(e => e.id === activeEntranceId);

  return (
    <div
      id="entrances-shop-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
    >
      {/* Live Cinematic Preview Overlay */}
      <RoomEntranceOverlay
        currentEvent={previewEvent}
        isPreviewMode={true}
        onClose={() => setPreviewEvent(null)}
        onAnimationComplete={() => setPreviewEvent(null)}
        roomCoverImage="https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1600&auto=format&fit=crop&q=85"
      />

      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Top Bar */}
        <div className="relative flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>متجر وخزانة الدخولات الفاخرة</span>
                <span className="text-xs font-normal text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  3D Animations
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                اختر دخلتك الثلاثية الأبعاد لتظهر بحضور سينمائي فخم فور دخول أي غرفة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Entrance Audio Mute / Unmute Button */}
            <button
              onClick={handleToggleSoundMute}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-bold transition-all active:scale-95 ${
                isEntranceSoundMuted
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-300 hover:bg-rose-500/20'
                  : 'bg-amber-500/10 border-amber-400/40 text-amber-300 hover:bg-amber-500/20'
              }`}
              title={isEntranceSoundMuted ? 'إلغاء كتم صوت الدخلات' : 'كتم صوت الدخلات'}
            >
              {isEntranceSoundMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-rose-400" />
                  <span className="hidden sm:inline">الصوت مكتوم</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">الصوت مفعّل</span>
                </>
              )}
            </button>

            {/* User Diamond Balance Pill */}
            <div className="flex items-center gap-2 bg-slate-800/90 border border-sky-500/30 px-3.5 py-1.5 rounded-2xl shadow-inner">
              <Gem className="w-4 h-4 text-sky-400" />
              <div className="text-right">
                <span className="text-xs text-slate-400 block -mb-0.5">رصيدك</span>
                <span className="text-sm font-bold text-sky-300">
                  {currentUser.diamonds.toLocaleString('ar-EG')}
                </span>
              </div>
              {onOpenRechargeModal && (
                <button
                  onClick={onOpenRechargeModal}
                  className="mr-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold px-2 py-1 rounded-lg transition-colors shadow-sm"
                >
                  شحن +
                </button>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Message */}
        {feedbackMsg && (
          <div
            className={`mx-6 mt-4 p-3 rounded-2xl text-xs font-bold flex items-center justify-between ${
              feedbackMsg.isError
                ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Active Entrance Hero Card */}
        {activeEntrance && (
          <div className="px-6 pt-4 pb-2">
            <div
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                activeEntrance.isExclusiveOwner
                  ? 'bg-gradient-to-r from-amber-950/70 via-red-950/60 to-amber-950/70 border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                  : 'bg-slate-800/60 border-slate-700/60'
              }`}
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="w-24 h-16 rounded-xl bg-slate-950/70 border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <EntranceVisualRenderer entranceId={activeEntrance.id} size="sm" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> الدخلة المفعلة حالياً
                    </span>
                    {activeEntrance.isExclusiveOwner && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-400/30">
                        موكب المالك العام 👑
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-extrabold text-white mt-0.5">
                    {activeEntrance.nameAr}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md line-clamp-1">
                    {activeEntrance.descriptionAr}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => triggerPreview(activeEntrance)}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-700/80 hover:bg-slate-600 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-sky-400" />
                  <span>معاينة العرض والصوت</span>
                </button>

                {onTriggerLiveEntrance && (
                  <button
                    onClick={() => {
                      onTriggerLiveEntrance(activeEntrance.id);
                      onClose();
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black hover:brightness-110 active:scale-95 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>استعراض الدخلة في الغرفة 🚀</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs & 3D / 5D Mode Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'ALL', label: 'الكل (المتجر)', icon: Sparkles },
              { id: 'OWNED', label: 'دخولاتي الممتلكة', icon: ShieldCheck },
              { id: 'VEHICLE', label: 'مركبات وسيارات', icon: Car },
              { id: 'CREATURE', label: 'كائنات وصقور', icon: Bird },
              { id: 'AERIAL', label: 'طائرات وفضاء', icon: Plane }
            ].map(tab => {
              const Icon = tab.icon;
              const isSelected = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-750'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* 3D vs 5D Selector Switch */}
          <div className="flex items-center justify-between sm:justify-end gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800 shrink-0">
            <span className="text-[11px] text-slate-400 font-bold px-2">نظام المعاينة:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setRenderMode('3D')}
                className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  renderMode === '3D'
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200 font-bold'
                }`}
              >
                3D
              </button>
              <button
                type="button"
                onClick={() => setRenderMode('5D')}
                className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                  renderMode === '5D'
                    ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-amber-400/80 hover:text-amber-300 font-bold'
                }`}
              >
                <span>5D</span>
                <span className="text-[9px] px-1 rounded bg-slate-950/40 text-slate-950">جديد 🔥</span>
              </button>
            </div>
          </div>
        </div>

        {/* Entrances Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-7 h-7 animate-spin text-amber-400" />
              <span className="text-sm">جاري تحميل قائمة الدخولات...</span>
            </div>
          ) : filteredEntrances.length === 0 ? (
            <div className="py-20 text-center bg-slate-950/40 border border-slate-800/80 rounded-3xl flex flex-col items-center justify-center gap-3 p-6">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Car className="w-8 h-8 text-amber-400" />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-base font-bold text-slate-200">لا توجد دخلات متاحة حالياً</h4>
                <p className="text-xs text-slate-400">قائمة الدخلات فارغة تماماً. يمكنك إضافة دخلات جديدة من لوحة الإدارة.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEntrances.map(entrance => {
                const isOwned = ownedIds.includes(entrance.id);
                const isActive = activeEntranceId === entrance.id;
                const isItemOwnerExclusive = entrance.isExclusiveOwner;

                return (
                  <motion.div
                    key={entrance.id}
                    layout
                    className={`relative rounded-2xl border p-4 flex flex-col justify-between transition-all group overflow-hidden ${
                      isItemOwnerExclusive
                        ? 'bg-gradient-to-b from-amber-950/40 to-slate-900 border-amber-400/60 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                        : isActive
                        ? 'bg-slate-850 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                        : 'bg-slate-850/60 hover:bg-slate-800 border-slate-750 hover:border-slate-600'
                    }`}
                  >
                    {/* Tier / Badge Tag */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          isItemOwnerExclusive
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                            : entrance.tier === 'ROYAL_VIP'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-400/40'
                            : entrance.tier === 'LEGENDARY'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                            : entrance.tier === 'LUXURY'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                            : 'bg-slate-700/50 text-slate-300 border-slate-600'
                        }`}
                      >
                        {entrance.badgeLabel || entrance.tier}
                      </span>

                      {/* Live Test Preview Button */}
                      <button
                        onClick={() => triggerPreview(entrance)}
                        className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-sky-300 bg-slate-800/80 hover:bg-slate-700 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                        title={`معاينة بنظام ${renderMode}`}
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-400" />
                        <span>معاينة {renderMode}</span>
                      </button>
                    </div>

                    {/* 3D Visual Rendering Card */}
                    <div
                      onClick={() => triggerPreview(entrance)}
                      className="cursor-pointer my-2 h-36 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-center overflow-hidden relative group-hover:border-slate-700 transition-colors"
                    >
                      <EntranceVisualRenderer entranceId={entrance.id} size="sm" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="bg-black/70 text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20 flex items-center gap-1">
                          <Eye className="w-3 h-3 text-sky-400" />
                          اضغط لمعاينة الحركة
                        </span>
                      </div>
                    </div>

                    {/* Entrance Details */}
                    <div>
                      <div className="flex items-baseline justify-between mt-1">
                        <h4 className="text-sm font-black text-white">{entrance.nameAr}</h4>
                        <span className="text-[10px] text-slate-400">{entrance.nameEn}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                        {entrance.descriptionAr}
                      </p>
                    </div>

                    {/* Price & Action Area */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      {/* Price */}
                      <div>
                        {isItemOwnerExclusive ? (
                          <span className="text-xs font-bold text-amber-300">
                            حصري لحساب الملك
                          </span>
                        ) : entrance.diamondPrice === 0 ? (
                          <span className="text-xs font-bold text-emerald-400">
                            مجانية للجميع
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 text-sky-300 font-extrabold text-sm">
                            <Gem className="w-4 h-4 text-sky-400" />
                            <span>{entrance.diamondPrice.toLocaleString('ar-EG')}</span>
                            <span className="text-[10px] text-slate-400 font-normal">ماسة</span>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div>
                        {isItemOwnerExclusive ? (
                          <button
                            disabled={!isOwner}
                            onClick={() => handleActivate(entrance.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isActive
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                                : 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 hover:brightness-110 shadow-md'
                            }`}
                          >
                            {isActive ? 'مفعلة للملك ✓' : 'تفعيل موكب الملك'}
                          </button>
                        ) : isOwned ? (
                          isActive ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                              <Check className="w-3.5 h-3.5" /> مفعلة حالياً
                            </span>
                          ) : (
                            <button
                              disabled={activatingId === entrance.id}
                              onClick={() => handleActivate(entrance.id)}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white transition-colors flex items-center gap-1"
                            >
                              {activatingId === entrance.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : null}
                              <span>تفعيل الآن</span>
                            </button>
                          )
                        ) : (
                          <button
                            disabled={purchasingId === entrance.id}
                            onClick={() => handlePurchase(entrance)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white transition-all shadow-md flex items-center gap-1"
                          >
                            {purchasingId === entrance.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Gem className="w-3.5 h-3.5" />
                            )}
                            <span>امتلاك وتفعيل</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>جميع الدخولات ثلاثية الأبعاد مرخصة ومجسمة مع مؤثرات صوتية استريو</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>
      </motion.div>
    </div>
  );
};
