import React from 'react';
import { isUserOwner, User } from '../types';

export function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const lower = url.trim().toLowerCase();
  return (
    lower.startsWith('data:video/') ||
    lower.includes('video/mp4') ||
    lower.includes('video/webm') ||
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mov') ||
    lower.includes('.mp4?') ||
    lower.includes('.webm?')
  );
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
  showEffects = true,
  name,
  isOwner = false,
  isMuted = false,
  onClick,
  badge
}) => {
  // Map size to pixel dimensions
  let avatarPx = 48;
  if (typeof size === 'number') {
    avatarPx = size;
  } else {
    switch (size) {
      case 'xs': avatarPx = 32; break;
      case 'sm': avatarPx = 40; break;
      case 'md': avatarPx = 52; break;
      case 'lg': avatarPx = 72; break;
      case 'xl': avatarPx = 96; break;
      case '2xl': avatarPx = 120; break;
      default: avatarPx = 52;
    }
  }

  // Normalize frame ID
  let normalizedId = frameId;
  if (normalizedId === 'frame_owner_king') normalizedId = 'frame_king';
  if (normalizedId === 'frame_royal_gold') normalizedId = 'frame_gold';
  if (normalizedId === 'frame_phoenix_fire') normalizedId = 'frame_dragon';
  if (normalizedId === 'frame_neon_star') normalizedId = 'frame_neon';
  if (normalizedId === 'frame_cyber_violet') normalizedId = 'frame_future';
  if (normalizedId === 'frame_diamond_shield') normalizedId = 'frame_silver';
  if (normalizedId === 'frame_velvet_rose') normalizedId = 'frame_roses';

  // Frame outer scale container size (~1.38x avatar size)
  const containerPx = Math.round(avatarPx * 1.38);
  const frameOffset = Math.round((containerPx - avatarPx) / 2);

  const fallbackAvatar = avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''} ${className}`}
      style={{ width: `${containerPx}px`, height: `${containerPx}px` }}
    >
      {/* CSS Animation Keyframes for Frame Breathing & Golden Glow */}
      <style>{`
        @keyframes frameBreathingPulse {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.4));
          }
          50% {
            transform: scale(1.03) rotate(1deg);
            filter: drop-shadow(0 0 12px rgba(255, 215, 0, 0.8));
          }
        }
        .animate-frame-breathing {
          animation: frameBreathingPulse 3.5s ease-in-out infinite;
          transform-origin: center center;
        }
      `}</style>

      {/* Centered User Avatar */}
      <div
        className="absolute rounded-full overflow-hidden bg-slate-800 shadow-inner z-10 flex items-center justify-center"
        style={{
          width: `${avatarPx}px`,
          height: `${avatarPx}px`,
          top: `${frameOffset}px`,
          left: `${frameOffset}px`
        }}
      >
        <img
          src={fallbackAvatar}
          alt={name || 'صورة الشخصية'}
          className="w-full h-full object-cover rounded-full"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80');
          }}
        />
      </div>

      {/* Custom Frame Image or Video or 4D Vector Overlay & Effects */}
      {(() => {
        const frameSrc = customFrameUrl || (normalizedId && (normalizedId.startsWith('data:') || normalizedId.startsWith('http')) ? normalizedId : null);

        if (frameSrc) {
          const isVid = isVideoUrl(frameSrc);
          return (
            <div
              className={`absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-hidden rounded-full ${showEffects ? 'animate-frame-breathing' : ''}`}
              style={{ width: `${containerPx}px`, height: `${containerPx}px` }}
            >
              {isVid ? (
                <video
                  src={frameSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover pointer-events-none rounded-full"
                />
              ) : (
                <img
                  src={frameSrc}
                  alt="إطار الصورة"
                  className="w-full h-full object-cover pointer-events-none rounded-full"
                />
              )}
            </div>
          );
        }

        if (normalizedId) {
          return (
            <div
              className={`absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-visible ${showEffects ? 'animate-frame-breathing' : ''}`}
              style={{ width: `${containerPx}px`, height: `${containerPx}px` }}
            >
              {render4DFrameGraphic(normalizedId, containerPx, showEffects, isOwner)}
            </div>
          );
        }

        return null;
      })()}

      {/* Red Closed Microphone Badge for Muted Status */}
      {isMuted && (
        <div
          className="absolute top-0 right-0 z-30 p-1 bg-rose-600 text-white rounded-full border-2 border-slate-950 shadow-lg ring-2 ring-rose-500 animate-pulse flex items-center justify-center pointer-events-none"
          title="الصوت مكتوم (صامت) 🔇"
        >
          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
            <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-3 0c0 .55-.09 1.07-.26 1.56l2.12 2.12c.72-1.11 1.14-2.4 1.14-3.68h-3zM4.27 3L3 4.27l3.01 3.01C5.36 8.39 5 9.64 5 11h2c0-1.03.35-1.97.94-2.73l2.03 2.03C9.36 10.63 9 11.27 9 12c0 1.66 1.34 3 3 3 .73 0 1.37-.36 1.7-.97l2.84 2.84c-.87.71-1.95 1.13-3.14 1.13-2.76 0-5.26-1.89-5.83-4.5H5.53C6.15 17.58 9.77 20 14 20c1.55 0 2.98-.32 4.28-.89l1.45 1.45L21 19.27 4.27 3z" />
          </svg>
        </div>
      )}

      {/* Optional Badge */}
      {badge && (
        <div className="absolute -bottom-1 z-30">
          {badge}
        </div>
      )}
    </div>
  );
};

// SVG & CSS 4D Graphic Generator
function render4DFrameGraphic(frameId: string, size: number, showEffects: boolean, isOwner: boolean) {
  const viewBoxSize = 200;
  const center = 100;
  const radius = 62;

  switch (frameId) {
    // 1. King Frame (إطار الإدارة والمالك الملكي)
    case 'frame_king':
      return (
        <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
          {/* Sleek Royal Golden Ring Frame */}
          <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="kingGoldBright" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF9C4" />
                <stop offset="25%" stopColor="#FFD700" />
                <stop offset="60%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#8B6508" />
              </linearGradient>
              <filter id="goldGlow">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Subtle Gold Ring */}
            <circle cx="100" cy="100" r="68" fill="none" stroke="url(#kingGoldBright)" strokeWidth="4" filter="url(#goldGlow)" />
            <circle cx="100" cy="100" r="62" fill="none" stroke="#0F172A" strokeWidth="1.5" />
          </svg>
        </div>
      );

    // 2. Gold Frame (إطار ذهبي)
    case 'frame_gold':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="50%" stopColor="#FCD34D" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
            </defs>
            <circle cx={center} cy={center} r={radius} fill="none" stroke="url(#goldGrad)" strokeWidth="9" />
            <circle cx={center} cy={center} r={radius + 5} fill="none" stroke="#FBBF24" strokeWidth="2" strokeDasharray="6 6" className={showEffects ? "animate-spin-slow" : ""} />
            {/* Crown Top */}
            <g transform="translate(75, 12) scale(0.5)">
              <path d="M 10 60 L 0 20 L 30 40 L 50 10 L 70 40 L 100 20 L 90 60 Z" fill="url(#goldGrad)" stroke="#78350F" strokeWidth="2" />
            </g>
          </svg>
        </div>
      );

    // 3. Silver Frame (إطار فضي)
    case 'frame_silver':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <defs>
              <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E2E8F0" />
                <stop offset="50%" stopColor="#94A3B8" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
            </defs>
            <circle cx={center} cy={center} r={radius} fill="none" stroke="url(#silverGrad)" strokeWidth="9" />
            <circle cx={center} cy={center} r={radius - 5} fill="none" stroke="#F1F5F9" strokeWidth="1.5" />
            {/* Silver Crown Top */}
            <g transform="translate(76, 14) scale(0.48)">
              <path d="M 10 60 L 0 20 L 30 40 L 50 10 L 70 40 L 100 20 L 90 60 Z" fill="url(#silverGrad)" stroke="#334155" strokeWidth="2" />
              <circle cx="50" cy="10" r="5" fill="#38BDF8" />
            </g>
          </svg>
        </div>
      );

    // 4. Dragon Frame (إطار التنين)
    case 'frame_dragon':
      return (
        <div className="relative w-full h-full">
          {showEffects && (
            <div className="absolute inset-1 rounded-full bg-red-600/25 blur-md animate-pulse" />
          )}
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <defs>
              <linearGradient id="dragonFire" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="50%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#FACC15" />
              </linearGradient>
            </defs>
            {/* Coiled Fiery Dragon Body */}
            <circle cx={center} cy={center} r={radius} fill="none" stroke="url(#dragonFire)" strokeWidth="11" />
            <circle cx={center} cy={center} r={radius + 6} fill="none" stroke="#EF4444" strokeWidth="2" strokeDasharray="3 7" className={showEffects ? "animate-spin" : ""} />
            {/* Dragon Head on Top Right */}
            <g transform="translate(130, 20) scale(0.65)">
              <path d="M 10 30 Q 30 10 50 20 Q 70 10 60 40 Q 50 60 20 50 Z" fill="#EF4444" stroke="#FACC15" strokeWidth="2" />
              <circle cx="45" cy="25" r="4" fill="#FACC15" />
              {/* Horns */}
              <path d="M 20 20 L 5 0 L 15 22 Z" fill="#F97316" />
              <path d="M 30 15 L 20 -5 L 28 17 Z" fill="#F97316" />
            </g>
          </svg>
        </div>
      );

    // 5. Angel Frame (إطار الملاك)
    case 'frame_angel':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <defs>
              <linearGradient id="angelBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#818CF8" />
              </linearGradient>
            </defs>
            <circle cx={center} cy={center} r={radius} fill="none" stroke="url(#angelBlue)" strokeWidth="8" />
            {/* Left Angel Wing */}
            <path d="M 40 100 Q 10 60 10 20 Q 35 40 50 70 Z" fill="url(#angelBlue)" opacity="0.9" />
            {/* Right Angel Wing */}
            <path d="M 160 100 Q 190 60 190 20 Q 165 40 150 70 Z" fill="url(#angelBlue)" opacity="0.9" />
            {/* Angel Halo on Top */}
            <ellipse cx={center} cy="22" rx="32" ry="8" fill="none" stroke="#FDE047" strokeWidth="4" className={showEffects ? "animate-pulse" : ""} />
          </svg>
        </div>
      );

    // 6. Flowers Frame (إطار الزهور)
    case 'frame_flowers':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#F472B6" strokeWidth="6" />
            {/* Pink Sakura Flowers along wreath */}
            {[0, 60, 120, 180, 240, 300].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const x = center + radius * Math.cos(rad);
              const y = center + radius * Math.sin(rad);
              return (
                <g key={i} transform={`translate(${x}, ${y}) scale(0.6)`}>
                  <circle cx="0" cy="0" r="8" fill="#FB7185" />
                  <circle cx="-6" cy="-6" r="6" fill="#F472B6" />
                  <circle cx="6" cy="-6" r="6" fill="#F472B6" />
                  <circle cx="-6" cy="6" r="6" fill="#F472B6" />
                  <circle cx="6" cy="6" r="6" fill="#F472B6" />
                  <circle cx="0" cy="0" r="4" fill="#FDE047" />
                </g>
              );
            })}
          </svg>
        </div>
      );

    // 7. Cat Frame (إطار القط)
    case 'frame_cat':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#E879F9" strokeWidth="8" />
            {/* Left Cat Ear */}
            <path d="M 50 50 L 32 15 L 70 36 Z" fill="#F0ABFC" stroke="#D946EF" strokeWidth="3" />
            {/* Right Cat Ear */}
            <path d="M 150 50 L 168 15 L 130 36 Z" fill="#F0ABFC" stroke="#D946EF" strokeWidth="3" />
            {/* Little Pink Heart at Bottom */}
            <path d="M 100 172 Q 90 160 82 166 Q 76 174 100 188 Q 124 174 118 166 Q 110 160 100 172 Z" fill="#EC4899" />
          </svg>
        </div>
      );

    // 8. Lion Frame (إطار الأسد)
    case 'frame_lion':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#CA8A04" strokeWidth="9" />
            {/* Lion Head on Top */}
            <g transform="translate(74, 8) scale(0.52)">
              <circle cx="50" cy="40" r="30" fill="#EAB308" stroke="#854D0E" strokeWidth="3" />
              {/* Lion Mane */}
              <path d="M 10 40 Q 0 10 50 0 Q 100 10 90 40 Q 100 70 50 80 Q 0 70 10 40 Z" fill="#CA8A04" opacity="0.8" />
              <circle cx="38" cy="35" r="4" fill="#1E293B" />
              <circle cx="62" cy="35" r="4" fill="#1E293B" />
              <polygon points="50,45 42,55 58,55" fill="#854D0E" />
            </g>
          </svg>
        </div>
      );

    // 9. Mystery Frame (إطار الغموض)
    case 'frame_mystery':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#8B5CF6" strokeWidth="8" />
            {/* Phantom Hood on Top */}
            <g transform="translate(70, 10) scale(0.6)">
              <path d="M 10 60 Q 50 0 90 60 Q 50 40 10 60 Z" fill="#581C87" stroke="#A855F7" strokeWidth="2" />
              <ellipse cx="50" cy="45" rx="15" ry="8" fill="#000" />
              <circle cx="43" cy="45" r="3" fill="#A855F7" className={showEffects ? "animate-ping" : ""} />
              <circle cx="57" cy="45" r="3" fill="#A855F7" className={showEffects ? "animate-ping" : ""} />
            </g>
          </svg>
        </div>
      );

    // 10. Space Frame (إطار الفضاء)
    case 'frame_space':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#0284C7" strokeWidth="8" />
            {/* Astronaut Helmet on Top */}
            <g transform="translate(72, 8) scale(0.56)">
              <rect x="15" y="10" width="70" height="50" rx="25" fill="#E2E8F0" stroke="#0284C7" strokeWidth="3" />
              <rect x="25" y="20" width="50" height="30" rx="15" fill="#0EA5E9" opacity="0.8" />
            </g>
            {/* Saturn Planet on Right */}
            <g transform="translate(155, 110) scale(0.4)">
              <ellipse cx="20" cy="20" rx="30" ry="8" fill="none" stroke="#F59E0B" strokeWidth="3" transform="rotate(-20 20 20)" />
              <circle cx="20" cy="20" r="14" fill="#3B82F6" />
            </g>
          </svg>
        </div>
      );

    // 11. Love Frame (إطار الحب)
    case 'frame_love':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#F43F5E" strokeWidth="8" />
            {/* Hearts around ring */}
            {[0, 90, 180, 270].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const x = center + radius * Math.cos(rad);
              const y = center + radius * Math.sin(rad);
              return (
                <g key={i} transform={`translate(${x}, ${y}) scale(0.45)`}>
                  <path d="M 0 -10 Q -15 -25 -25 -5 Q -30 15 0 30 Q 30 15 25 -5 Q 15 -25 0 -10 Z" fill="#FB7185" />
                </g>
              );
            })}
            <g transform="translate(82, 12) scale(0.36)">
              <path d="M 10 60 L 0 20 L 30 40 L 50 10 L 70 40 L 100 20 L 90 60 Z" fill="#F59E0B" />
            </g>
          </svg>
        </div>
      );

    // 12. Music Frame (إطار الموسيقى)
    case 'frame_music':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#06B6D4" strokeWidth="8" />
            {/* Headphones */}
            <path d="M 35 100 A 65 65 0 0 1 165 100" fill="none" stroke="#8B5CF6" strokeWidth="10" strokeLinecap="round" />
            <rect x="22" y="85" width="16" height="32" rx="8" fill="#06B6D4" />
            <rect x="162" y="85" width="16" height="32" rx="8" fill="#06B6D4" />
            {/* Musical Notes */}
            <text x="25" y="45" fill="#E879F9" fontSize="22" fontWeight="bold">♪</text>
            <text x="160" y="45" fill="#38BDF8" fontSize="22" fontWeight="bold">♫</text>
          </svg>
        </div>
      );

    // 13. Traveler Frame (إطار الرحالة)
    case 'frame_traveler':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#78350F" strokeWidth="9" strokeDasharray="12 4" />
            {/* Safari Hat */}
            <g transform="translate(110, 10) scale(0.55)">
              <ellipse cx="40" cy="40" rx="38" ry="12" fill="#B45309" />
              <path d="M 20 40 Q 20 10 40 10 Q 60 10 60 40 Z" fill="#D97706" />
            </g>
            {/* Lantern */}
            <g transform="translate(150, 120) scale(0.4)">
              <rect x="10" y="10" width="20" height="30" rx="4" fill="#F59E0B" stroke="#78350F" strokeWidth="2" />
              <circle cx="20" cy="25" r="6" fill="#FEF08A" className={showEffects ? "animate-pulse" : ""} />
            </g>
          </svg>
        </div>
      );

    // 14. Summer Frame (إطار الصيف)
    case 'frame_summer':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#38BDF8" strokeWidth="8" />
            {/* Palms */}
            <g transform="translate(15, 60) scale(0.45)">
              <path d="M 30 80 Q 10 40 0 0 Q 30 10 50 40 Z" fill="#16A34A" />
              <path d="M 30 80 Q 50 30 80 10 Q 60 40 40 70 Z" fill="#22C55E" />
            </g>
            {/* Sunglasses */}
            <g transform="translate(70, 155) scale(0.55)">
              <rect x="0" y="0" width="26" height="18" rx="5" fill="#000" stroke="#F59E0B" strokeWidth="2" />
              <rect x="34" y="0" width="26" height="18" rx="5" fill="#000" stroke="#F59E0B" strokeWidth="2" />
              <line x1="26" y1="6" x2="34" y2="6" stroke="#F59E0B" strokeWidth="3" />
            </g>
          </svg>
        </div>
      );

    // 15. Winter Frame (إطار الشتاء)
    case 'frame_winter':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#7DD3FC" strokeWidth="8" />
            {/* Snowflakes */}
            {[30, 150, 270].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const x = center + radius * Math.cos(rad);
              const y = center + radius * Math.sin(rad);
              return (
                <text key={i} x={x - 8} y={y + 6} fill="#E0F2FE" fontSize="18">❄</text>
              );
            })}
            {/* Red Scarf */}
            <path d="M 50 150 Q 100 185 150 150 Q 120 180 50 150 Z" fill="#EF4444" stroke="#B91C1C" strokeWidth="2" />
          </svg>
        </div>
      );

    // 16. Future / Cyberpunk Frame (إطار المستقبل)
    case 'frame_future':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#3B82F6" strokeWidth="6" />
            <circle cx={center} cy={center} r={radius + 6} fill="none" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="16 8" className={showEffects ? "animate-spin-slow" : ""} />
            <circle cx={center} cy={center} r={radius - 6} fill="none" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="8 4" />
          </svg>
        </div>
      );

    // 17. Nature Frame (إطار الطبيعة)
    case 'frame_nature':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#15803D" strokeWidth="8" />
            {/* Leaves */}
            {[0, 72, 144, 216, 288].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const x = center + radius * Math.cos(rad);
              const y = center + radius * Math.sin(rad);
              return (
                <ellipse key={i} cx={x} cy={y} rx="10" ry="5" fill="#22C55E" transform={`rotate(${deg} ${x} ${y})`} />
              );
            })}
          </svg>
        </div>
      );

    // 18. Luxury Frame (إطار الفخامة)
    case 'frame_luxury':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#B45309" strokeWidth="10" />
            <circle cx={center} cy={center} r={radius - 5} fill="none" stroke="#FBBF24" strokeWidth="2" />
            {/* Luxury Crown */}
            <g transform="translate(72, 10) scale(0.56)">
              <path d="M 10 60 L 0 20 L 30 40 L 50 10 L 70 40 L 100 20 L 90 60 Z" fill="#F59E0B" stroke="#78350F" strokeWidth="2" />
            </g>
          </svg>
        </div>
      );

    // 19. Butterfly Frame (إطار الفراشة)
    case 'frame_butterfly':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#EC4899" strokeWidth="7" />
            {/* Butterflies */}
            {[45, 135, 225, 315].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const x = center + radius * Math.cos(rad);
              const y = center + radius * Math.sin(rad);
              return (
                <text key={i} x={x - 10} y={y + 8} fill="#F472B6" fontSize="20" className={showEffects ? "animate-pulse" : ""}>🦋</text>
              );
            })}
          </svg>
        </div>
      );

    // 20. Gaming Frame (إطار الألعاب)
    case 'frame_gaming':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#6366F1" strokeWidth="8" />
            {/* Controller on bottom */}
            <g transform="translate(62, 155) scale(0.5)">
              <rect x="0" y="0" width="76" height="36" rx="12" fill="#1E1B4B" stroke="#A855F7" strokeWidth="3" />
              <circle cx="20" cy="18" r="6" fill="#6366F1" />
              <circle cx="56" cy="12" r="3" fill="#EC4899" />
              <circle cx="64" cy="20" r="3" fill="#10B981" />
            </g>
          </svg>
        </div>
      );

    // 21. Sports Frame (إطار الرياضة)
    case 'frame_sports':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#16A34A" strokeWidth="8" />
            {/* Football at bottom right */}
            <g transform="translate(142, 140) scale(0.45)">
              <circle cx="20" cy="20" r="18" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />
              <polygon points="20,12 26,17 24,24 16,24 14,17" fill="#000000" />
            </g>
          </svg>
        </div>
      );

    // 22. Elite Frame (إطار النخبة)
    case 'frame_elite':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#EAB308" strokeWidth="9" />
            {/* Gold Laurel Wreath Left & Right */}
            <path d="M 35 100 Q 20 60 55 35" fill="none" stroke="#FACC15" strokeWidth="4" />
            <path d="M 165 100 Q 180 60 145 35" fill="none" stroke="#FACC15" strokeWidth="4" />
          </svg>
        </div>
      );

    // 23. Stars Frame (إطار النجوم)
    case 'frame_stars':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#A855F7" strokeWidth="7" />
            {[0, 60, 120, 180, 240, 300].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const x = center + radius * Math.cos(rad);
              const y = center + radius * Math.sin(rad);
              return (
                <text key={i} x={x - 8} y={y + 6} fill="#FDE047" fontSize="16" className={showEffects ? "animate-pulse" : ""}>⭐</text>
              );
            })}
          </svg>
        </div>
      );

    // 24. Sea Frame (إطار البحر)
    case 'frame_sea':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#0284C7" strokeWidth="8" />
            <text x="135" y="40" fill="#38BDF8" fontSize="26">🐬</text>
          </svg>
        </div>
      );

    // 25. Nautical Frame (إطار البحر والإبحار)
    case 'frame_nautical':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#1E3A8A" strokeWidth="8" />
            {/* Steering Wheel */}
            <text x="140" y="145" fill="#F59E0B" fontSize="24">⚓</text>
          </svg>
        </div>
      );

    // 26. Knowledge Frame (إطار المعرفة)
    case 'frame_knowledge':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#0369A1" strokeWidth="8" />
            <text x="30" y="165" fill="#38BDF8" fontSize="22">📚</text>
          </svg>
        </div>
      );

    // 27. Roses Frame (إطار الورود)
    case 'frame_roses':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#9F1239" strokeWidth="8" />
            {[0, 90, 180, 270].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const x = center + radius * Math.cos(rad);
              const y = center + radius * Math.sin(rad);
              return (
                <text key={i} x={x - 10} y={y + 8} fill="#FB7185" fontSize="20">🌹</text>
              );
            })}
          </svg>
        </div>
      );

    // 28. Wings Frame (إطار الأجنحة)
    case 'frame_wings':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#D97706" strokeWidth="8" />
            {/* Spreading Golden Wings */}
            <path d="M 30 100 C -10 50 20 20 50 60 Z" fill="#F59E0B" />
            <path d="M 170 100 C 210 50 180 20 150 60 Z" fill="#F59E0B" />
          </svg>
        </div>
      );

    // 29. Neon Frame (إطار النيون)
    case 'frame_neon':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#06B6D4" strokeWidth="6" />
            <circle cx={center} cy={center} r={radius + 4} fill="none" stroke="#EC4899" strokeWidth="2" className={showEffects ? "animate-pulse" : ""} />
          </svg>
        </div>
      );

    // 30. Dreams Frame (إطار الأحلام)
    case 'frame_dreams':
      return (
        <div className="relative w-full h-full">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full">
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#F472B6" strokeWidth="6" />
            <text x="80" y="30" fill="#F472B6" fontSize="24">🌈</text>
            <text x="130" y="160" fill="#E0F2FE" fontSize="22">☁️</text>
            <text x="40" y="160" fill="#E0F2FE" fontSize="22">☁️</text>
          </svg>
        </div>
      );

    default:
      return (
        <div className="w-full h-full rounded-full border-2 border-amber-400 shadow-md" />
      );
  }
}
