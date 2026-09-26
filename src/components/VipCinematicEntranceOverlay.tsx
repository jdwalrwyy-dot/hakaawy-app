import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, FastForward, Sparkles } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

/**
 * 🏎️ رابط فيديو دخلة السيارة المباشر (Direct Car Video URL)
 */
export const carVideoUrl = "https://files.catbox.moe/aa337q.mp4";

/**
 * 🏮 رابط خلفية أجواء المولد والأنوار الاحتفالية (Mawlid Lights & Festive Background)
 * يمكنك استبدال هذا الرابط برابط صورتك الخاصة في أي وقت بسهولة!
 */
export const entranceBgImage = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1080";

export interface VipCinematicAssetsConfig {
  videoUrl?: string;
  bgImageUrl?: string;
  totalDurationSeconds?: number;
  playbackRate?: number;
}

export const VIP_CINEMATIC_CONFIG: VipCinematicAssetsConfig = {
  videoUrl: carVideoUrl,
  bgImageUrl: entranceBgImage,
  totalDurationSeconds: 18,
  playbackRate: 0.8,
};

interface VipCinematicEntranceOverlayProps {
  userName?: string;
  userAvatar?: string;
  numericId?: string;
  isOwner?: boolean;
  entranceName?: string;
  roomCoverImage?: string;
  customConfig?: Partial<VipCinematicAssetsConfig>;
  onComplete?: () => void;
  onSkip?: () => void;
}

export const VipCinematicEntranceOverlay: React.FC<VipCinematicEntranceOverlayProps> = ({
  userName,
  customConfig,
  onComplete,
  onSkip
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEffects.getIsEntranceSoundMuted());
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeVideoUrl = carVideoUrl || customConfig?.videoUrl || VIP_CINEMATIC_CONFIG.videoUrl || '';
  const activeBgImage = customConfig?.bgImageUrl || entranceBgImage;
  const playbackRate = customConfig?.playbackRate || VIP_CINEMATIC_CONFIG.playbackRate || 0.8;

  // Auto complete safely after 4000ms (4 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      handleComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = 1.0;
    video.muted = isMuted;
    video.playbackRate = playbackRate;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Video playback interaction required:', err);
        const handleUserInteraction = () => {
          if (videoRef.current) {
            videoRef.current.playbackRate = playbackRate;
            videoRef.current.play().catch(() => {});
          }
          window.removeEventListener('click', handleUserInteraction);
          window.removeEventListener('touchstart', handleUserInteraction);
        };
        window.addEventListener('click', handleUserInteraction, { once: true });
        window.addEventListener('touchstart', handleUserInteraction, { once: true });
      });
    }
  }, [activeVideoUrl, isMuted, playbackRate]);

  const handleComplete = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (onComplete) onComplete();
    else if (onSkip) onSkip();
  };

  const handleSkipClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (onSkip) {
      onSkip();
    } else if (onComplete) {
      onComplete();
    }
  };

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = soundEffects.toggleEntranceSoundMute();
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
      if (!nextMuted) {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  return (
    <div
      id="carLayer"
      className="car-entrance-container entrance-overlay select-none"
      dir="rtl"
    >
      {/* Top Header Controls (interactive) */}
      <div className="absolute top-0 inset-x-0 z-50 p-3 sm:p-4 flex items-center justify-between pointer-events-auto bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-transparent">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-amber-300 bg-amber-500/20 border border-amber-400/40 px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>دخلة السيارة الفاخرة</span>
          </span>
          {userName && (
            <span className="text-xs font-bold text-white bg-black/40 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
              • {userName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleToggleSound}
            className="px-3.5 py-2 rounded-2xl bg-black/60 hover:bg-black/80 border border-amber-500/30 text-amber-300 text-xs font-bold backdrop-blur-xl flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
            title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            <span className="text-[11px]">{isMuted ? 'مكتوم' : 'صوت'}</span>
          </button>

          <button
            type="button"
            onClick={handleSkipClick}
            className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-2 cursor-pointer shadow-xl border border-amber-300/50 transition-transform active:scale-95"
            title="تخطي العرض وإغلاق الفيديو"
          >
            <span>تخطي العرض (Skip)</span>
            <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ✨ Sparkles & Particles Visual Effect Layer */}
      <div className="finish-line-glow" />
      <div className="car-sparks-container">
        <div className="spark-particle" />
        <div className="spark-particle" />
        <div className="spark-particle" />
        <div className="spark-particle" />
        <div className="spark-particle" />
        <div className="spark-particle" />
        <div className="spark-particle" />
        <div className="spark-particle" />
      </div>

      {/* 🏎️ Native Direct HTML5 Video Player Layer (Blend mode screen for zero-latency execution) */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {activeVideoUrl && (
          <video
            ref={videoRef}
            src={activeVideoUrl}
            autoPlay
            playsInline
            controls={false}
            className="w-full h-full object-cover mix-blend-screen"
            onEnded={handleComplete}
            onError={handleComplete}
          />
        )}
      </div>
    </div>
  );
};
