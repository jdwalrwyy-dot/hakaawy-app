import React, { useState, useEffect, useRef } from 'react';
import { Crown, ExternalLink, X } from 'lucide-react';
import { socketService } from '../services/socketService';
import { soundEffects } from '../services/soundEffects';

interface GlobalGiftBannerProps {
  onNavigateToRoom?: (roomId: string) => void;
}

export interface GlobalGiftPayload {
  id: string;
  senderName: string;
  senderAvatar?: string;
  receiverName: string;
  receiverAvatar?: string;
  giftName: string;
  giftIcon: string;
  count: number;
  totalDiamonds: number;
  roomId?: string;
  roomName?: string;
  timestamp: number;
}

export const GlobalGiftBanner: React.FC<GlobalGiftBannerProps> = ({ onNavigateToRoom }) => {
  const [queue, setQueue] = useState<GlobalGiftPayload[]>([]);
  const [currentEvent, setCurrentEvent] = useState<GlobalGiftPayload | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    // Listen to real-time global gift broadcast event
    const unsubscribe = socketService.on('global_gift_broadcast', (data: any) => {
      if (!data || !data.transaction) return;
      const tx = data.transaction;
      const payload: GlobalGiftPayload = {
        id: tx.id || `gg_${Date.now()}_${Math.random()}`,
        senderName: tx.senderName || 'مستخدم',
        senderAvatar: tx.senderAvatar,
        receiverName: tx.receiverName || 'مستخدم',
        receiverAvatar: tx.receiverAvatar,
        giftName: tx.giftName || data.gift?.nameAr || 'هدية فاخرة',
        giftIcon: tx.giftIcon || data.gift?.icon || '🎁',
        count: tx.count || 1,
        totalDiamonds: tx.totalDiamonds || 0,
        roomId: tx.roomId,
        roomName: tx.roomName,
        timestamp: data.timestamp || Date.now()
      };

      setQueue(prev => [...prev, payload]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Process event queue
  useEffect(() => {
    if (!currentEvent && queue.length > 0) {
      const nextEvent = queue[0];
      setQueue(prev => prev.slice(1));
      setCurrentEvent(nextEvent);
      setIsVisible(true);

      // Play VIP fanfare sound for global gift
      try {
        soundEffects.playGiftSound('VIP');
      } catch {
        // Fallback if sound blocked
      }

      // Auto dismiss after 10 seconds
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          setCurrentEvent(null);
        }, 400); // fade out transition
      }, 10000);
    }
  }, [queue, currentEvent]);

  if (!currentEvent || !isVisible) return null;

  return (
    <div
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none w-[94%] max-w-2xl transition-all duration-500 ease-out animate-in fade-in slide-in-from-top-6"
      dir="rtl"
    >
      {/* Royal Ambient Glow Background */}
      <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/50 via-yellow-400/60 to-purple-600/50 rounded-full blur-md animate-pulse" />

      {/* Main Luxury Banner Container */}
      <div className="relative bg-gradient-to-r from-slate-950/95 via-amber-950/90 to-slate-950/95 border-2 border-amber-400/90 shadow-[0_0_35px_rgba(251,191,36,0.6)] rounded-full p-2.5 px-4 flex items-center justify-between gap-3 overflow-hidden backdrop-blur-2xl">
        
        {/* Shimmer Light Ray */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/15 to-transparent animate-shimmer-slide pointer-events-none" />

        {/* Left Crown Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/40 border border-yellow-200 shrink-0">
            <Crown className="w-5 h-5 fill-slate-950 animate-bounce" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-[10px] font-black text-amber-300 tracking-wider uppercase leading-none">
              إعلان هدية عالمي
            </span>
            <span className="text-[9px] text-amber-200/80 font-extrabold mt-0.5">
              GLOBAL GIFT
            </span>
          </div>
        </div>

        {/* Middle Content Banner with Right-to-Left Marquee Motion */}
        <div className="flex-1 overflow-hidden relative flex items-center min-w-0 h-9">
          <div className="w-full flex items-center gap-2 text-xs sm:text-sm text-slate-100 font-extrabold whitespace-nowrap animate-marquee-rtl py-0.5">
            {/* Sender */}
            <span className="text-amber-300 font-black flex items-center gap-1">
              👑 <span className="underline decoration-amber-400/60">{currentEvent.senderName}</span>
            </span>

            <span className="text-slate-200 font-medium">أرسل</span>

            {/* Gift Icon & Name */}
            <span className="inline-flex items-center gap-1.5 bg-amber-500/25 text-amber-200 px-2.5 py-0.5 rounded-full border border-amber-400/40 font-black shadow-sm">
              <span className="text-base sm:text-lg leading-none drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">
                {currentEvent.giftIcon}
              </span>
              <span>{currentEvent.count > 1 ? `${currentEvent.count}x ` : ''}{currentEvent.giftName}</span>
            </span>

            <span className="text-slate-200 font-medium">إلى</span>

            {/* Receiver */}
            <span className="text-purple-300 font-black underline decoration-purple-400/60">
              {currentEvent.receiverName}
            </span>

            <span className="text-slate-200 font-medium">بقيمة</span>

            {/* Diamond Value */}
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black px-3 py-0.5 rounded-full shadow-md text-xs sm:text-sm">
              <span>{currentEvent.totalDiamonds.toLocaleString('ar-EG')}</span>
              <span>💎</span>
            </span>

            {currentEvent.roomName && (
              <span className="text-[11px] bg-purple-900/80 text-purple-200 px-2.5 py-0.5 rounded-full border border-purple-400/50">
                غرفة: {currentEvent.roomName}
              </span>
            )}
          </div>
        </div>

        {/* Right Actions: Optional Enter Room & Dismiss Button */}
        <div className="flex items-center gap-1.5 shrink-0 pointer-events-auto">
          {currentEvent.roomId && onNavigateToRoom && (
            <button
              onClick={() => onNavigateToRoom(currentEvent.roomId!)}
              className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-slate-950 font-black text-[10px] sm:text-xs flex items-center gap-1 shadow-md shadow-amber-500/30 active:scale-95 transition-all cursor-pointer"
              title="الانتقال لغرفة الهدية"
            >
              <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>دخول</span>
            </button>
          )}

          <button
            onClick={() => setIsVisible(false)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="إغلاق الإعلان"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Timer Countdown Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-900/90 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 animate-banner-timer" />
        </div>
      </div>
    </div>
  );
};
