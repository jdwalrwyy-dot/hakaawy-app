import React, { useState, useEffect, useRef } from 'react';
import { RoomSeat, User, Gift } from '../types';
import { X, Video, Mic, MicOff, Gem, Gift as GiftIcon, Sparkles, Maximize2, Minimize2, Shield, RefreshCw } from 'lucide-react';
import { Avatar4DFrame } from './Avatar4DFrame';

interface ExpandedVideoSeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  seat: RoomSeat;
  currentUser: User;
  onSendGiftClick?: () => void;
  localStream?: MediaStream | null;
}

export const ExpandedVideoSeatModal: React.FC<ExpandedVideoSeatModalProps> = ({
  isOpen,
  onClose,
  seat,
  currentUser,
  onSendGiftClick,
  localStream
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [quality, setQuality] = useState<'AUTO' | 'HD' | 'SD'>('AUTO');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      if (localStream) {
        videoRef.current.srcObject = localStream;
        videoRef.current.play().catch(console.warn);
      }
    }
  }, [isOpen, localStream]);

  if (!isOpen || !seat) return null;

  const isLocalUser = seat.userId === currentUser.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col dir-rtl">
        {/* Top Header */}
        <div className="absolute top-0 inset-x-0 z-20 p-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={seat.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${seat.userId}`}
              alt={seat.userName}
              className="w-9 h-9 rounded-full object-cover border border-amber-400"
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
                <span>{seat.userName}</span>
                <span className="px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] font-bold flex items-center gap-0.5">
                  <Video className="w-2.5 h-2.5" />
                  <span>فيديو مباشر</span>
                </span>
              </h3>
              <p className="text-[10px] text-slate-300">مايك رقم {seat.seatIndex + 1}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Resolution Selector */}
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value as any)}
              className="bg-black/60 border border-slate-700 text-slate-200 text-[10px] font-bold rounded-xl px-2 py-1 focus:outline-none"
            >
              <option value="AUTO">تلقائي (Auto Adaptive)</option>
              <option value="HD">1080p HD جودة فائقة</option>
              <option value="SD">480p موفر للبيانات</option>
            </select>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-black/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Display Container */}
        <div className="relative w-full aspect-[4/3] sm:aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
          {localStream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isLocalUser}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/40">
              {/* Simulated HD Live Stream Surface */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent animate-pulse" />
              <Avatar4DFrame
                avatarUrl={seat.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${seat.userId}`}
                frameId={seat.userFrameId || null}
                size="lg"
                showEffects
              />
              <div className="mt-3 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-extrabold text-xs shadow-lg flex items-center gap-1.5 animate-pulse">
                <Video className="w-4 h-4" />
                <span>عرض البث المباشر المباشر ({quality})</span>
              </div>
            </div>
          )}

          {/* Mic Status Badge */}
          <div className="absolute bottom-3 right-3 z-20 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5">
            {seat.isMuted ? (
              <>
                <MicOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-300">المايك مكتوم</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-emerald-300">يتحدث الآن</span>
              </>
            )}
          </div>

          {/* Support Diamonds Score Badge */}
          <div className="absolute bottom-3 left-3 z-20 px-3 py-1 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs font-black flex items-center gap-1 shadow-md">
            <Gem className="w-3.5 h-3.5 text-sky-400" />
            <span>{(seat as any).giftPoints || 0} ماسة دعم</span>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>بث محمي ومشفّر بجودة تكيفية</span>
          </div>

          {onSendGiftClick && (
            <button
              onClick={() => {
                onClose();
                onSendGiftClick();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <GiftIcon className="w-4 h-4" />
              <span>إرسال هدية إلى {seat.userName}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
