import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Sparkles, Gem, Coins, ShieldCheck, RefreshCw, Trash2 } from 'lucide-react';
import { User, Frame } from '../types';
import { API } from '../services/api';
import { soundEffects } from '../services/soundEffects';
import { Avatar4DFrame } from './Avatar4DFrame';
import { STORE_FRAMES, cacheFrameImageLocally } from '../utils/frameCache';

interface FramesShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserUpdated: (user: User) => void;
  onOpenRechargeModal?: () => void;
}

export const FramesShopModal: React.FC<FramesShopModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
  onOpenRechargeModal
}) => {
  const [framesList, setFramesList] = useState<Frame[]>(STORE_FRAMES);
  const [ownedFrameIds, setOwnedFrameIds] = useState<string[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<Frame>(STORE_FRAMES[0]);
  const [activeFrameId, setActiveFrameId] = useState<string | null>(currentUser.activeFrameId || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Load frames from server & sync owned frames
  useEffect(() => {
    if (isOpen) {
      setActiveFrameId(currentUser.activeFrameId || null);
      loadFramesData();
    }
  }, [isOpen, currentUser.id, currentUser.activeFrameId]);

  const loadFramesData = async () => {
    setIsLoading(true);
    try {
      const [serverFrames, ownedIds] = await Promise.all([
        API.getFrames().catch(() => []),
        API.getUserFrames(currentUser.id).catch(() => [])
      ]);

      // Merge server frames with built-in store frames to guarantee requested frames exist
      const mergedMap = new Map<string, Frame>();
      STORE_FRAMES.forEach(f => mergedMap.set(f.id, f));
      if (Array.isArray(serverFrames)) {
        serverFrames.forEach(sf => {
          if (sf && sf.id) mergedMap.set(sf.id, { ...mergedMap.get(sf.id), ...sf });
        });
      }

      const mergedList = Array.from(mergedMap.values());
      const isOwner = currentUser.role === 'OWNER' || currentUser.isOwner === true;
      // Filter out exclusive owner frames from public store catalog for regular users
      const publicShopCatalog = mergedList.filter(f => {
        if (f.isExclusiveOwner || f.id === 'frame_owner_king' || f.id === 'frame_king' || f.id === 'frame_owner_exclusive') {
          return isOwner;
        }
        return true;
      });

      setFramesList(publicShopCatalog);
      setOwnedFrameIds(Array.isArray(ownedIds) ? ownedIds : []);

      // Pre-cache all frame images into LocalStorage
      mergedList.forEach(f => {
        if (f.imageUrl) cacheFrameImageLocally(f.imageUrl).catch(() => {});
      });

      // Select active frame or first frame
      const currentActive = mergedList.find(f => f.id === currentUser.activeFrameId);
      if (currentActive) {
        setSelectedFrame(currentActive);
      } else if (mergedList.length > 0) {
        setSelectedFrame(mergedList[0]);
      }
    } catch (err) {
      console.warn('Error loading frames data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isSelectedActive = activeFrameId === selectedFrame.id;
  const isSelectedOwned =
    ownedFrameIds.includes(selectedFrame.id) ||
    selectedFrame.diamondPrice === 0 ||
    (selectedFrame.isExclusiveOwner && (currentUser.role === 'OWNER' || currentUser.isOwner));

  // Equip Frame
  const handleEquipFrame = async (frame: Frame) => {
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      await API.setActiveFrame(currentUser.id, frame.id);
      setActiveFrameId(frame.id);
      soundEffects.playNotification();

      const updatedUser = {
        ...currentUser,
        activeFrameId: frame.id,
        customFrameUrl: null
      };

      onUserUpdated(updatedUser);
      setFeedbackMsg({ text: `تم تفعيل ${frame.nameAr} بنجاح! ✨`, isError: false });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      soundEffects.playError();
      setFeedbackMsg({ text: err.message || 'تعذر تفعيل الإطار', isError: true });
    } finally {
      setActionLoading(false);
    }
  };

  // Unequip Frame
  const handleRemoveActiveFrame = async () => {
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      await API.setActiveFrame(currentUser.id, null);
      setActiveFrameId(null);
      soundEffects.playNotification();

      const updatedUser = {
        ...currentUser,
        activeFrameId: undefined,
        customFrameUrl: null
      };

      onUserUpdated(updatedUser);
      setFeedbackMsg({ text: 'تم إزالة الإطار بنجاح والعودة للصورة الشخصية العادية', isError: false });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      soundEffects.playError();
      setFeedbackMsg({ text: err.message || 'تعذر إزالة الإطار', isError: true });
    } finally {
      setActionLoading(false);
    }
  };

  // Purchase Frame
  const handlePurchaseFrame = async (frame: Frame) => {
    if (currentUser.diamonds < frame.diamondPrice) {
      soundEffects.playError();
      setFeedbackMsg({ text: 'رصيد الماس غير كاف لشراء هذا الإطار!', isError: true });
      if (onOpenRechargeModal) {
        setTimeout(() => onOpenRechargeModal(), 1200);
      }
      return;
    }

    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await API.purchaseFrame(currentUser.id, frame.id);
      soundEffects.playCoinSound();
      setOwnedFrameIds(prev => [...prev, frame.id]);

      // Automatically equip after purchase
      await API.setActiveFrame(currentUser.id, frame.id);
      setActiveFrameId(frame.id);

      const updatedUser = {
        ...currentUser,
        diamonds: Math.max(0, currentUser.diamonds - frame.diamondPrice),
        activeFrameId: frame.id,
        customFrameUrl: null
      };

      onUserUpdated(updatedUser);
      setFeedbackMsg({ text: `مبارك! تم شراء ${frame.nameAr} وتفعيله مباشرة 🎉`, isError: false });
      setTimeout(() => setFeedbackMsg(null), 3500);
    } catch (err: any) {
      soundEffects.playError();
      setFeedbackMsg({ text: err.message || 'فشلت عملية الشراء', isError: true });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-100 text-base">متجر إطارات الحساب</h3>
                <p className="text-xs text-slate-400">اختر إطارك المميز لليظهر في الغرف وعلى بروفايلك</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Wallet Balance Display */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-cyan-400">
                <Gem className="w-3.5 h-3.5" />
                <span>{(currentUser.diamonds || 0).toLocaleString()}</span>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Live Preview Area */}
            <div className="relative p-5 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-950 border border-slate-700/80 flex flex-col items-center justify-center gap-3">
              <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>المعاينة المباشرة على صورتك الشخصية</span>
              </div>

              <div className="my-2">
                <Avatar4DFrame
                  avatarUrl={currentUser.avatar}
                  frameId={selectedFrame.id}
                  size={88}
                  showEffects={true}
                />
              </div>

              <div className="text-center">
                <h4 className="font-bold text-amber-400 text-sm">{selectedFrame.nameAr}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{selectedFrame.descriptionAr}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-1 w-full max-w-xs">
                {isSelectedActive ? (
                  <button
                    onClick={handleRemoveActiveFrame}
                    disabled={actionLoading}
                    className="w-full py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>إزالة الإطار الحالى</span>
                  </button>
                ) : isSelectedOwned ? (
                  <button
                    onClick={() => handleEquipFrame(selectedFrame)}
                    disabled={actionLoading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>تفعيل هذا الإطار الان</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handlePurchaseFrame(selectedFrame)}
                    disabled={actionLoading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
                  >
                    <Gem className="w-4 h-4" />
                    <span>شراء الإطار بـ {selectedFrame.diamondPrice.toLocaleString()} ماسة</span>
                  </button>
                )}
              </div>
            </div>

            {/* Feedback Message */}
            {feedbackMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold text-center border animate-in fade-in ${
                  feedbackMsg.isError
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                {feedbackMsg.text}
              </div>
            )}

            {/* Frames Grid Catalog */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-300">تشكيلة الإطارات المتاحة</span>
                <span className="text-[11px] text-slate-500">تحميل الكاش سريع وفوري</span>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                  <span className="text-xs">جاري جلب إطارات المتجر...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {framesList.map(frame => {
                    const isSelected = selectedFrame.id === frame.id;
                    const isActive = activeFrameId === frame.id;
                    const isOwned =
                      ownedFrameIds.includes(frame.id) ||
                      frame.diamondPrice === 0 ||
                      (frame.isExclusiveOwner && (currentUser.role === 'OWNER' || currentUser.isOwner));

                    return (
                      <div
                        key={frame.id}
                        onClick={() => setSelectedFrame(frame)}
                        className={`relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-2 select-none ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                            : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/70'
                        }`}
                      >
                        {/* Status Badges */}
                        {isActive && (
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] z-20">
                            مُفعل
                          </div>
                        )}

                        {/* Avatar Frame Item Preview */}
                        <div className="my-1">
                          <Avatar4DFrame
                            avatarUrl={currentUser.avatar}
                            frameId={frame.id}
                            size={56}
                          />
                        </div>

                        <div className="text-center w-full">
                          <p className="font-bold text-slate-200 text-xs truncate">{frame.nameAr}</p>
                          <div className="flex items-center justify-center gap-1 mt-1 text-[11px] font-bold">
                            {isOwned ? (
                              <span className="text-emerald-400">مملوك</span>
                            ) : (
                              <div className="flex items-center gap-1 text-amber-400">
                                <Gem className="w-3 h-3" />
                                <span>{frame.diamondPrice.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
