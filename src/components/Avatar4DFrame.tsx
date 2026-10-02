import React, { useMemo } from 'react';
import { resolveFrameImageUrl, OWNER_FRAME_URL } from '../utils/frameCache';

export function isVideoUrl(_url?: string | null): boolean {
  return false;
}

export interface Avatar4DFrameProps {
  avatarUrl?: string;
  frameId?: string | null;
  customFrameUrl?: string | null;
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showEffects?: boolean;
  name?: string;
  isOwner?: boolean;
  isMuted?: boolean;
  onClick?: () => void;
  badge?: React.ReactNode;
}

export const Avatar4DFrame: React.FC<Avatar4DFrameProps> = ({
  avatarUrl,
  frameId,
  customFrameUrl,
  size = 'md',
  className = '',
  showEffects = false,
  isOwner = false,
  isMuted = false,
  onClick,
  badge
}) => {
  // Determine pixel size if size prop is given as number or standard preset
  let avatarPx: number | null = null;
  if (typeof size === 'number') {
    avatarPx = size;
  } else {
    switch (size) {
      case 'xs': avatarPx = 32; break;
      case 'sm': avatarPx = 40; break;
      case 'md': avatarPx = 48; break;
      case 'lg': avatarPx = 64; break;
      case 'xl': avatarPx = 80; break;
      case '2xl': avatarPx = 96; break;
      default: avatarPx = 48;
    }
  }

  const fallbackAvatar = avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';

  // Resolve frame image URL from cache / store or default to Owner frame if user is owner
  const frameImgUrl = useMemo(() => {
    if (isOwner && (!frameId || frameId === 'frame_owner_king' || frameId === 'frame_king' || frameId === 'frame_owner_exclusive')) {
      return OWNER_FRAME_URL;
    }
    const resolved = resolveFrameImageUrl(frameId, customFrameUrl);
    if (!resolved && isOwner) {
      return OWNER_FRAME_URL;
    }
    return resolved;
  }, [frameId, customFrameUrl, isOwner]);

  const sizeStyles: React.CSSProperties = avatarPx
    ? { width: `${avatarPx}px`, height: `${avatarPx}px`, position: 'relative' }
    : { width: '100%', height: '100%', position: 'relative' };

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-visible ${
        onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''
      } ${className}`}
      style={sizeStyles}
    >
      {/* 1. Inner User Avatar Circle - Sized at 78% so full face fits cleanly in frame's inner opening */}
      <div
        className={`w-[78%] h-[78%] rounded-full overflow-hidden relative z-0 flex items-center justify-center shrink-0 ${
          showEffects && !isMuted ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-950' : 'ring-1 ring-slate-700/60'
        }`}
        style={{
          width: '78%',
          height: '78%',
          borderRadius: '50%',
          overflow: 'hidden'
        }}
      >
        <img
          src={fallbackAvatar}
          alt="avatar"
          className="w-full h-full rounded-full object-cover z-0"
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover'
          }}
          loading="eager"
          decoding="async"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/bottts/svg?seed=fallback';
          }}
        />
      </div>

      {/* 2. Outer Frame Overlay Image - Scaled at 1.22 and positioned absolute inset-0 around the seat */}
      {frameImgUrl && (
        <img
          src={frameImgUrl}
          alt="frame"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transform: 'scale(1.22)',
            transformOrigin: 'center center',
            maxWidth: 'none',
            maxHeight: 'none',
            pointerEvents: 'none',
            zIndex: 10,
            mixBlendMode: frameImgUrl.endsWith('.jpg') || frameImgUrl.endsWith('.jpeg') ? 'screen' : 'normal',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.6))'
          }}
          loading="eager"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}

      {badge && <div className="absolute -bottom-1 -right-1 z-20">{badge}</div>}
    </div>
  );
};
