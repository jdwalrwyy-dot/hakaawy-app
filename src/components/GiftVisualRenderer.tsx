import React from 'react';
import { GiftTierLevel } from '../types';

interface GiftVisualRendererProps {
  giftId?: string;
  icon?: string;
  giftName?: string;
  tier: GiftTierLevel;
  size?: 'sm' | 'md' | 'store' | 'lg' | 'hero';
  showAura?: boolean;
}

export const GiftVisualRenderer: React.FC<GiftVisualRendererProps> = ({
  giftId = 'gift_crystal_rose',
  tier,
  size = 'hero',
  showAura = true
}) => {
  const isVip = tier === 'VIP';
  const isLegendary = tier === 'LEGENDARY';
  const isLuxury = tier === 'LUXURY';
  const isPretty = tier === 'PRETTY' || tier === 'RARE';

  // Dimension scaling for crisp rendering at every size
  const dim =
    size === 'sm'
      ? 44
      : size === 'md'
      ? 54
      : size === 'store'
      ? 64
      : size === 'lg'
      ? 96
      : 170;

  return (
    <div
      className="relative flex flex-col items-center justify-center select-none pointer-events-none"
      style={{ width: dim, height: dim }}
    >
      {/* 1. Cinematic Luxury Auras & Volumetric Glows (Active in full-screen showcase & hero) */}
      {showAura && (
        <>
          {isVip && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute w-[185%] h-[185%] rounded-full bg-gradient-to-tr from-amber-500/80 via-yellow-400/90 to-amber-600/80 blur-2xl opacity-80 animate-pulse" />
              <div className="absolute w-[160%] h-[160%] rounded-full bg-purple-700/40 blur-xl animate-spin [animation-duration:14s]" />
              <div className="absolute w-[140%] h-[140%] rounded-full border border-yellow-300/70 border-dashed animate-spin [animation-duration:9s]" />
            </div>
          )}

          {isLegendary && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute w-[165%] h-[165%] rounded-full bg-gradient-to-r from-amber-400/70 via-rose-500/50 to-purple-600/70 blur-xl opacity-75 animate-pulse" />
              <div className="absolute w-[135%] h-[135%] rounded-full border border-amber-400/60 border-dotted animate-spin [animation-duration:12s]" />
            </div>
          )}

          {isLuxury && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute w-[150%] h-[150%] rounded-full bg-gradient-to-r from-amber-400/60 to-yellow-300/60 blur-lg opacity-65 animate-pulse" />
            </div>
          )}

          {isPretty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute w-[135%] h-[135%] rounded-full bg-sky-400/45 blur-md opacity-60" />
            </div>
          )}
        </>
      )}

      {/* 2. Realistic 3D Model Artwork */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {render3DAsset(giftId, dim)}
      </div>

      {/* 3. High-Tier Specular Flare Bursts (Showcase Hero Mode) */}
      {showAura && (isVip || isLegendary) && size === 'hero' && (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-visible">
          <svg className="absolute -top-3 left-1 w-5 h-5 text-yellow-300 animate-ping" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
          </svg>
          <svg className="absolute -bottom-2 right-2 w-5 h-5 text-amber-300 animate-ping [animation-delay:0.5s]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
          </svg>
          <svg className="absolute top-1/2 -right-4 w-4 h-4 text-yellow-200 animate-ping [animation-delay:0.9s]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
          </svg>
        </div>
      )}
    </div>
  );
};

/**
 * 3D High-Fidelity Photorealistic Vector Engine for the 24 Unique Luxury Gifts
 * Crafted with multi-layered specular reflections, ambient occlusion, metallic bevels, and depth geometry.
 */
function render3DAsset(giftId: string, size: number): React.ReactNode {
  switch (giftId) {
    // ==========================================
    // 1. عادية (COMMON: 5 - 100 💎)
    // ==========================================

    // وردة كريستالية ملكية
    case 'gift_crystal_rose':
      return (
        <svg viewBox="0 0 120 120" width={size} height={size} className="filter drop-shadow-[0_8px_16px_rgba(244,63,94,0.65)]">
          <defs>
            <linearGradient id="cr_rose_outer" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffe4e6" />
              <stop offset="30%" stopColor="#f43f5e" />
              <stop offset="70%" stopColor="#be123c" />
              <stop offset="100%" stopColor="#881337" />
            </linearGradient>
            <linearGradient id="cr_rose_inner" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#fda4af" />
              <stop offset="80%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#4c0519" />
            </linearGradient>
            <linearGradient id="cr_gold_stem" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="35%" stopColor="#fef08a" />
              <stop offset="65%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
            <linearGradient id="cr_emerald_leaf" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a7f3d0" />
              <stop offset="40%" stopColor="#10b981" />
              <stop offset="80%" stopColor="#047857" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>
          </defs>
          {/* Ground Reflection / Ambient Base */}
          <ellipse cx="60" cy="112" rx="28" ry="5" fill="#000000" opacity="0.4" filter="blur(3px)" />
          {/* 24K Gold Stem with thorns */}
          <path d="M60 62 Q58 88 52 110" stroke="url(#cr_gold_stem)" strokeWidth="5.5" fill="none" strokeLinecap="round" />
          <path d="M60 62 Q59 88 53 110" stroke="#ffffff" strokeWidth="1.2" fill="none" opacity="0.6" strokeLinecap="round" />
          {/* Golden Thorns */}
          <polygon points="56,76 48,73 55,80" fill="url(#cr_gold_stem)" />
          <polygon points="57,92 65,89 58,96" fill="url(#cr_gold_stem)" />
          {/* Emerald Crystal Leaves with Gold Veins */}
          <path d="M57 80 Q32 72 36 58 Q48 68 57 80 Z" fill="url(#cr_emerald_leaf)" stroke="url(#cr_gold_stem)" strokeWidth="1" />
          <path d="M57 80 Q44 70 38 60" stroke="#fef08a" strokeWidth="1.2" fill="none" />
          <path d="M56 90 Q80 82 78 68 Q66 78 56 90 Z" fill="url(#cr_emerald_leaf)" stroke="url(#cr_gold_stem)" strokeWidth="1" />
          <path d="M56 90 Q68 80 76 70" stroke="#fef08a" strokeWidth="1.2" fill="none" />
          {/* 3D Crystal Rose Petals - Layered Facets */}
          <path d="M60 16 C38 16 28 34 38 52 C48 66 72 66 82 52 C92 34 82 16 60 16 Z" fill="url(#cr_rose_outer)" />
          {/* Petal Fold Reflections */}
          <path d="M60 22 C44 22 36 36 44 48 C52 58 68 58 76 48 C84 36 76 22 60 22 Z" fill="url(#cr_rose_inner)" />
          <path d="M52 28 C46 30 44 40 52 46 C60 46 66 40 64 32 C61 27 55 27 52 28 Z" fill="#ffffff" opacity="0.85" />
          <path d="M60 33 C56 35 55 41 60 43 C64 43 66 38 63 34 Z" fill="#be123c" />
          {/* Facet Edge Highlights */}
          <path d="M38 52 Q60 64 82 52" stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.75" />
          <path d="M44 48 Q60 56 76 48" stroke="#fecdd3" strokeWidth="1.5" fill="none" opacity="0.9" />
          {/* Specular Starburst */}
          <circle cx="52" cy="28" r="2.5" fill="#ffffff" />
          <polygon points="52,22 54,27 59,28 54,29 52,34 50,29 45,28 50,27" fill="#ffffff" />
        </svg>
      );

    // ياقوت ملكي متألق (الجوهرة / ألماسة ملكية حمراء)
    case 'gift_ruby_gem':
      return (
        <svg viewBox="0 0 120 120" width={size} height={size} className="filter drop-shadow-[0_10px_22px_rgba(225,29,72,0.85)]">
          <defs>
            <linearGradient id="rb_core" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff1f2" />
              <stop offset="25%" stopColor="#fb7185" />
              <stop offset="60%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#881337" />
            </linearGradient>
            <linearGradient id="rb_deep" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e11d48" />
              <stop offset="50%" stopColor="#9f1239" />
              <stop offset="100%" stopColor="#4c0519" />
            </linearGradient>
            <linearGradient id="rb_plat" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="110" rx="36" ry="6" fill="#000000" opacity="0.5" filter="blur(3px)" />
          {/* Platinum 4-Prong Setting */}
          <path d="M26 44 L18 42 M94 44 L102 42 M60 98 L60 106" stroke="url(#rb_plat)" strokeWidth="5" strokeLinecap="round" />
          {/* Massive 3D Faceted Ruby */}
          {/* Lower Pavilion Facets */}
          <polygon points="60,98 22,46 38,46" fill="url(#rb_deep)" />
          <polygon points="60,98 98,46 82,46" fill="#4c0519" />
          <polygon points="60,98 38,46 60,46" fill="#9f1239" />
          <polygon points="60,98 82,46 60,46" fill="#e11d48" />
          <polygon points="60,98 48,46 72,46" fill="#be123c" />
          {/* Upper Crown Facets */}
          <polygon points="38,24 82,24 98,46 22,46" fill="url(#rb_core)" />
          <polygon points="46,24 74,24 68,36 52,36" fill="#ffffff" opacity="0.8" />
          <polygon points="38,24 46,24 52,36 30,46" fill="#fda4af" />
          <polygon points="82,24 74,24 68,36 90,46" fill="#f43f5e" />
          <polygon points="52,36 68,36 82,46 38,46" fill="#fb7185" />
          {/* Refractive Prismatic Sparkle */}
          <circle cx="50" cy="30" r="3" fill="#ffffff" />
          <polygon points="50,18 53,28 63,30 53,32 50,42 47,32 37,30 47,28" fill="#ffffff" />
          <circle cx="82" cy="46" r="2" fill="#ffffff" />
        </svg>
      );

    // خنجر دمشقي مذهب
    case 'gift_golden_dagger':
      return (
        <svg viewBox="0 0 120 120" width={size} height={size} className="filter drop-shadow-[0_10px_22px_rgba(234,179,8,0.75)]">
          <defs>
            <linearGradient id="gd_steel" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#e2e8f0" />
              <stop offset="70%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="gd_gold_24k" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="60%" stopColor="#eab308" />
              <stop offset="85%" stopColor="#a16207" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
            <linearGradient id="gd_gem_ruby" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fda4af" />
              <stop offset="100%" stopColor="#9f1239" />
            </linearGradient>
          </defs>
          <g transform="rotate(42 60 60)">
            {/* Cast Shadow */}
            <path d="M64 24 Q70 54 54 82" stroke="#000000" strokeWidth="6" opacity="0.3" filter="blur(2px)" />
            {/* Damascus Curved Blade */}
            <path d="M60 20 Q66 52 50 82 Q56 64 60 20 Z" fill="url(#gd_steel)" />
            {/* Central Fuller Spine */}
            <path d="M60 20 Q62 52 53 78" stroke="#ffffff" strokeWidth="1.4" fill="none" opacity="0.9" />
            {/* Damascus Wavy Steel Ripples */}
            <path d="M58 35 Q62 42 57 48 M56 50 Q60 57 54 64" stroke="#64748b" strokeWidth="0.8" fill="none" opacity="0.6" />
            {/* Heavy 24k Gold Guard */}
            <path d="M34 80 Q60 85 86 80 Q80 88 60 90 Q40 88 34 80 Z" fill="url(#gd_gold_24k)" />
            <circle cx="60" cy="85" r="3.5" fill="url(#gd_gem_ruby)" stroke="#ffffff" strokeWidth="0.8" />
            {/* Inlaid Filigree Grip */}
            <rect x="55" y="88" width="10" height="18" rx="3" fill="url(#gd_gold_24k)" />
            <line x1="55" y1="92" x2="65" y2="92" stroke="#451a03" strokeWidth="1.5" />
            <line x1="55" y1="97" x2="65" y2="97" stroke="#451a03" strokeWidth="1.5" />
            <line x1="55" y1="102" x2="65" y2="102" stroke="#451a03" strokeWidth="1.5" />
            {/* Crown Pommel */}
            <path d="M51 106 Q60 112 69 106 L66 112 L54 112 Z" fill="url(#gd_gold_24k)" />
            <circle cx="60" cy="109" r="2" fill="url(#gd_gem_ruby)" />
          </g>
        </svg>
      );

    // صقر الصيد الملكي
    case 'gift_royal_falcon':
      return (
        <svg viewBox="0 0 120 120" width={size} height={size} className="filter drop-shadow-[0_10px_24px_rgba(245,158,11,0.85)]">
          <defs>
            <linearGradient id="rf_gold_body" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="85%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
            <linearGradient id="rf_feather" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="112" rx="34" ry="5" fill="#000000" opacity="0.45" filter="blur(3px)" />
          {/* Falconry Perch Stand */}
          <rect x="24" y="100" width="72" height="8" rx="4" fill="url(#rf_gold_body)" />
          <circle cx="24" cy="104" r="5" fill="#eab308" />
          <circle cx="96" cy="104" r="5" fill="#eab308" />
          {/* Falcon Body & Muscular Breast */}
          <path d="M60 40 Q72 52 70 82 Q64 96 58 102 L52 102 Q48 94 48 76 Q48 54 60 40 Z" fill="url(#rf_gold_body)" />
          {/* Layered Golden Wings */}
          <path d="M58 48 Q32 30 18 42 Q28 66 54 78 Z" fill="url(#rf_feather)" />
          <path d="M62 48 Q88 30 102 42 Q92 66 66 78 Z" fill="url(#rf_feather)" />
          {/* Individual Feather Lines */}
          <path d="M24 45 Q36 60 52 72 M96 45 Q84 60 68 72" stroke="#fef08a" strokeWidth="1.2" fill="none" opacity="0.8" />
          {/* Tail Feathers */}
          <polygon points="56,92 52,108 64,108 60,92" fill="url(#rf_feather)" />
          {/* Regal Head & Hooked Sharp Beak */}
          <path d="M60 40 Q54 28 60 20 Q68 20 72 28 Q70 40 60 40 Z" fill="url(#rf_gold_body)" />
          <path d="M56 24 Q48 26 50 32 Q56 30 57 26 Z" fill="#ffffff" />
          {/* Piercing Ruby Eye */}
          <circle cx="62" cy="25" r="2.8" fill="#e11d48" stroke="#ffffff" strokeWidth="0.8" />
          <circle cx="61.5" cy="24.5" r="1" fill="#ffffff" />
        </svg>
      );

    // مصباح الأساطير الذهبي
    case 'gift_golden_lamp':
      return (
        <svg viewBox="0 0 120 120" width={size} height={size} className="filter drop-shadow-[0_10px_24px_rgba(245,158,11,0.85)]">
          <defs>
            <linearGradient id="gl_gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="55%" stopColor="#eab308" />
              <stop offset="85%" stopColor="#a16207" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
            <linearGradient id="gl_vapor" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="108" rx="36" ry="5" fill="#000000" opacity="0.45" filter="blur(3px)" />
          {/* Ethereal Magic Stardust Vapor */}
          <path d="M96 52 Q108 36 94 22 Q80 8 98 6" stroke="url(#gl_vapor)" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.85" />
          <circle cx="98" cy="6" r="3" fill="#ffffff" />
          <polygon points="98,1 100,5 104,6 100,7 98,11 96,7 92,6 96,5" fill="#38bdf8" />
          {/* Lamp Base Pedestal */}
          <path d="M42 96 Q60 100 78 96 L74 88 L46 88 Z" fill="url(#gl_gold)" />
          {/* Hammered Round Belly */}
          <path d="M44 88 Q28 76 34 62 Q50 56 70 58 Q96 54 100 52 L96 58 Q82 66 74 88 Z" fill="url(#gl_gold)" />
          {/* Highlights on Belly */}
          <ellipse cx="54" cy="68" rx="14" ry="6" fill="#ffffff" opacity="0.5" />
          {/* Ornate Handle */}
          <path d="M34 64 C14 58 12 78 28 84" stroke="url(#gl_gold)" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M34 64 C14 58 12 78 28 84" stroke="#ffffff" strokeWidth="1.2" fill="none" opacity="0.6" strokeLinecap="round" />
          {/* Beveled Spout */}
          <path d="M72 58 Q92 52 100 50 Q96 56 84 64 Z" fill="url(#gl_gold)" />
          {/* Ornate Lid with Finial */}
          <path d="M48 58 Q56 50 64 58 Z" fill="url(#gl_gold)" />
          <circle cx="56" cy="50" r="3.5" fill="url(#gl_gold)" stroke="#ffffff" strokeWidth="0.8" />
        </svg>
      );

    // ==========================================
    // 2. مميزة (PRETTY: 200 - 5,000 💎)
    // ==========================================

    // خاتم ألماس فاخر
    case 'gift_diamond_ring':
      return (
        <svg viewBox="0 0 120 120" width={size} height={size} className="filter drop-shadow-[0_12px_28px_rgba(56,189,248,0.9)]">
          <defs>
            <linearGradient id="dr_plat_shank" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#f1f5f9" />
              <stop offset="60%" stopColor="#cbd5e1" />
              <stop offset="85%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="dr_diamond_facet" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#e0f2fe" />
              <stop offset="55%" stopColor="#7dd3fc" />
              <stop offset="85%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="112" rx="34" ry="5" fill="#000000" opacity="0.45" filter="blur(3px)" />
          {/* Heavy Platinum Ring Shank */}
          <ellipse cx="60" cy="74" rx="34" ry="32" fill="none" stroke="url(#dr_plat_shank)" strokeWidth="9" />
          <ellipse cx="60" cy="74" rx="34" ry="32" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.85" />
          <ellipse cx="60" cy="74" rx="34" ry="32" fill="none" stroke="#000000" strokeWidth="1.2" opacity="0.3" transform="scale(0.97) translate(1.8, 2.2)" />
          {/* Platinum Prongs Holding Diamond */}
          <path d="M52 44 L46 32 M68 44 L74 32 M60 44 L60 30" stroke="url(#dr_plat_shank)" strokeWidth="3.2" strokeLinecap="round" />
          {/* Huge 5-Carat Round Brilliant Diamond */}
          <polygon points="42,30 78,30 92,44 60,72 28,44" fill="url(#dr_diamond_facet)" />
          {/* Table & Star Facets */}
          <polygon points="48,30 72,30 66,38 54,38" fill="#ffffff" opacity="0.95" />
          <polygon points="28,44 42,30 54,38 40,44" fill="#bae6fd" />
          <polygon points="78,30 92,44 80,44 66,38" fill="#0284c7" />
          <polygon points="54,38 66,38 80,44 40,44" fill="#e0f2fe" />
          {/* Lower Pavilion Facets */}
          <polygon points="40,44 60,72 55,44" fill="#38bdf8" />
          <polygon points="80,44 60,72 65,44" fill="#0369a1" />
          <polygon points="55,44 60,72 65,44" fill="#bae6fd" />
          {/* Prismatic Rainbow Spectral Glint & Starburst */}
          <circle cx="60" cy="30" r="3.5" fill="#ffffff" />
          <polygon points="60,16 63,27 74,30 63,33 60,44 57,33 46,30 57,27" fill="#ffffff" />
          <polygon points="60,20 62,28 70,30 62,32 60,40 58,32 50,30 58,28" fill="#fef08a" opacity="0.8" />
        </svg>
      );

    // عقد ألماس ملكي
    case 'gift_diamond_necklace':
      return (
        <svg viewBox="0 0 120 120" width={size} height={size} className="filter drop-shadow-[0_12px_28px_rgba(224,242,254,0.95)]">
          <defs>
            <linearGradient id="dn_chain" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#e2e8f0" />
              <stop offset="80%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="dn_gemstone" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#bae6fd" />
              <stop offset="70%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="112" rx="36" ry="5" fill="#000000" opacity="0.4" filter="blur(3px)" />
          {/* Cascading Double Riviere Chain */}
          <path d="M26 30 Q60 82 94 30" stroke="url(#dn_chain)" strokeWidth="3.5" fill="none" strokeDasharray="5 3" />
          <path d="M32 32 Q60 76 88 32" stroke="#ffffff" strokeWidth="1" fill="none" opacity="0.7" />
          {/* Brilliant Bezel-Set Diamonds along the Curve */}
          {[
            { cx: 32, cy: 40, r: 3.5 },
            { cx: 42, cy: 52, r: 4 },
            { cx: 52, cy: 62, r: 4.5 },
            { cx: 68, cy: 62, r: 4.5 },
            { cx: 78, cy: 52, r: 4 },
            { cx: 88, cy: 40, r: 3.5 }
          ].map((d, i) => (
            <g key={i}>
              <circle cx={d.cx} cy={d.cy} r={d.r} fill="url(#dn_gemstone)" stroke="url(#dn_chain)" strokeWidth="1.2" />
              <circle cx={d.cx - 1} cy={d.cy - 1} r={d.r * 0.4} fill="#ffffff" />
            </g>
          ))}
          {/* Magnificent Center Pear-Cut Diamond Pendant */}
          <g transform="translate(60, 78)">
            <path d="M0 -10 C8 -5 12 5 0 20 C-12 5 -8 -5 0 -10 Z" fill="url(#dn_gemstone)" stroke="#ffffff" strokeWidth="1.5" />
            <polygon points="0,-6 4,4 0,12 -4,4" fill="#ffffff" opacity="0.9" />
            <circle cx="0" cy="5" r="2.5" fill="#ffffff" />
            <polygon points="0,-1 2,4 7,5 2,6 0,11 -2,6 -7,5 -2,4" fill="#ffffff" />
          </g>
        </svg>
      );

    // صندوق مجوهرات فاخر
    case 'gift_jewelry_box':
      return (
        <svg viewBox="0 0 120 120" width={size} height={size} className="filter drop-shadow-[0_14px_30px_rgba(245,158,11,0.9)]">
          <defs>
            <linearGradient id="jb_gold_mount" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="60%" stopColor="#eab308" />
              <stop offset="85%" stopColor="#a16207" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
            <linearGradient id="jb_velvet_body" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9f1239" />
              <stop offset="50%" stopColor="#4c0519" />
              <stop offset="100%" stopColor="#1f0208" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="112" rx="40" ry="6" fill="#000000" opacity="0.5" filter="blur(3px)" />
          {/* Velvet Box Base with 24k Gold Trims */}
          <rect x="20" y="60" width="80" height="42" rx="5" fill="url(#jb_velvet_body)" stroke="url(#jb_gold_mount)" strokeWidth="3.5" />
          <line x1="20" y1="80" x2="100" y2="80" stroke="url(#jb_gold_mount)" strokeWidth="2.5" />
          {/* Open Angled Velvet Lid */}
          <path d="M18 60 L38 26 L102 26 L102 60 Z" fill="url(#jb_velvet_body)" stroke="url(#jb_gold_mount)" strokeWidth="3.5" />
          {/* Internal Golden Glow */}
          <ellipse cx="60" cy="58" rx="32" ry="9" fill="#fde047" opacity="0.9" />
          {/* Overflowing Pearls */}
          <circle cx="38" cy="62" r="4.5" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.8" />
          <circle cx="45" cy="68" r="4.5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8" />
          <circle cx="53" cy="74" r="4.5" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.8" />
          {/* Sparkling Sapphires & Rubies */}
          <polygon points="70,52 80,52 86,60 76,66 66,60" fill="#0284c7" stroke="#ffffff" strokeWidth="0.8" />
          <polygon points="56,50 64,50 68,56 60,60 52,56" fill="#e11d48" stroke="#ffffff" strokeWidth="0.8" />
          {/* Golden Royal Crest Lock */}
          <circle cx="60" cy="74" r="4.5" fill="url(#jb_gold_mount)" />
          <line x1="60" y1="74" x2="60" y2="79" stroke="#000000" strokeWidth="2" />
        </svg>
      );

    // حصان ملكي عربي
    case 'gift_royal_stallion':
      return (
        <svg viewBox="0 0 120 120" width={size} height={size} className="filter drop-shadow-[0_14px_30px_rgba(234,179,8,0.9)]">
          <defs>
            <linearGradient id="rs_gold_stallion" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="30%" stopColor="#fde047" />
              <stop offset="65%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
            <linearGradient id="rs_mane_glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="112" rx="38" ry="6" fill="#000000" opacity="0.45" filter="blur(3px)" />
          {/* Dynamic Galloping Arabian Body & Legs */}
          <path d="M50 54 Q68 50 86 58 Q98 68 96 86 L90 86 Q90 74 78 72 Q66 72 58 78 L50 102 L42 102 L48 76 Q40 78 30 94 L22 94 L32 70 Q28 66 26 54 Z" fill="url(#rs_gold_stallion)" />
          {/* Front Raised Hoof */}
          <path d="M82 66 L94 82 L102 80 L90 62 Z" fill="url(#rs_gold_stallion)" />
          {/* Muscular Arching Neck & Proud Arabian Head */}
          <path d="M36 56 Q42 36 56 26 Q64 22 68 26 L76 32 Q68 38 56 44 Q46 50 42 60 Z" fill="url(#rs_gold_stallion)" />
          {/* Golden Flowing Mane */}
          <path d="M44 32 Q54 30 48 40 Q58 38 50 50 Q60 46 54 58 Q46 56 44 32 Z" fill="url(#rs_mane_glow)" />
          {/* Elevated Flag-Like Tail */}
          <path d="M26 56 Q14 60 12 78 Q22 72 28 64 Z" fill="url(#rs_mane_glow)" />
          {/* Ruby-Studded Ceremonial Bridle */}
          <circle cx="66" cy="28" r="2.2" fill="#ef4444" stroke="#ffffff" strokeWidth="0.8" />
          <line x1="66" y1="28" x2="72" y2="34" stroke="#eab308" strokeWidth="1.5" />
        </svg>
      );

    // طاووس ملكي فاخر
    case 'gift_majestic_peacock':
      return (
        <svg viewBox="0 0 120 120" width={size} height={size} className="filter drop-shadow-[0_14px_30px_rgba(16,185,129,0.9)]">
          <defs>
            <linearGradient id="mp_fan_gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="40%" stopColor="#0284c7" />
              <stop offset="80%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#312e81" />
            </linearGradient>
            <linearGradient id="mp_gold_rim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="112" rx="36" ry="6" fill="#000000" opacity="0.45" filter="blur(3px)" />
          {/* Grand Symmetrical Plume Fan */}
          <path d="M60 90 C18 90 12 30 60 20 C108 30 102 90 60 90 Z" fill="url(#mp_fan_gradient)" opacity="0.95" />
          {/* Ocelli Peacock Eyes with Concentric Rings */}
          {[
            { cx: 34, cy: 44 },
            { cx: 48, cy: 30 },
            { cx: 60, cy: 26 },
            { cx: 72, cy: 30 },
            { cx: 86, cy: 44 },
            { cx: 42, cy: 60 },
            { cx: 78, cy: 60 }
          ].map((pt, i) => (
            <g key={i}>
              <circle cx={pt.cx} cy={pt.cy} r="6" fill="url(#mp_gold_rim)" />
              <circle cx={pt.cx} cy={pt.cy} r="4" fill="#047857" />
              <circle cx={pt.cx} cy={pt.cy} r="2.5" fill="#0284c7" />
              <circle cx={pt.cx} cy={pt.cy} r="1.2" fill="#000000" />
            </g>
          ))}
          {/* Sapphire Blue Peacock Body */}
          <path d="M60 55 Q66 70 64 94 Q56 94 56 70 Q54 55 60 55 Z" fill="#1e40af" stroke="url(#mp_gold_rim)" strokeWidth="1" />
          {/* Slender Royal Neck & Head */}
          <circle cx="60" cy="50" r="5" fill="#1e40af" />
          <polygon points="60,46 60,49 65,49" fill="#f59e0b" />
          {/* Golden Crest Plumes */}
          <line x1="60" y1="46" x2="56" y2="40" stroke="#eab308" strokeWidth="1.2" />
          <circle cx="56" cy="40" r="1.5" fill="#eab308" />
          <line x1="60" y1="46" x2="60" y2="38" stroke="#eab308" strokeWidth="1.2" />
          <circle cx="60" cy="38" r="1.5" fill="#eab308" />
          <line x1="60" y1="46" x2="64" y2="40" stroke="#eab308" strokeWidth="1.2" />
          <circle cx="64" cy="40" r="1.5" fill="#eab308" />
        </svg>
      );

    // ==========================================
    // 3. فخمة (LUXURY: 8,000 - 30,000 💎)
    // ==========================================

    // سيارة رياضية خارقة (3D Hypercar)
    case 'gift_luxury_supercar':
      return (
        <svg viewBox="0 0 120 120" width={size} height={size} className="filter drop-shadow-[0_16px_36px_rgba(234,179,8,0.95)]">
          <defs>
            <linearGradient id="sc_gold_body" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="55%" stopColor="#eab308" />
              <stop offset="85%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="sc_windshield" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          {/* Realistic Ground Shadow */}
          <ellipse cx="60" cy="100" rx="52" ry="9" fill="#000000" opacity="0.6" filter="blur(4px)" />
          {/* Aerodynamic Hypercar Carbon-Gold Chassis in 3/4 Perspective */}
          <path d="M12 78 Q22 62 42 58 Q56 44 80 46 Q100 54 110 74 L106 86 Q92 88 82 86 Q48 86 28 88 L12 78 Z" fill="url(#sc_gold_body)" />
          {/* Carbon Fiber Side Air Intake & Aero Ducts */}
          <path d="M48 64 L36 74 L58 74 Z" fill="#0f172a" />
          {/* Tinted Cockpit Windshield with Sky Glint */}
          <path d="M44 58 Q56 46 76 48 Q82 54 78 62 L42 62 Z" fill="url(#sc_windshield)" />
          <path d="M48 52 Q62 48 74 50" stroke="#ffffff" strokeWidth="1.2" fill="none" opacity="0.75" />
          {/* High-Performance Wheels with 24k Gold Turbine Rims */}
          <circle cx="32" cy="84" r="12" fill="#0f172a" stroke="url(#sc_gold_body)" strokeWidth="3.5" />
          <circle cx="32" cy="84" r="5" fill="#fef08a" />
          <circle cx="88" cy="84" r="12" fill="#0f172a" stroke="url(#sc_gold_body)" strokeWidth="3.5" />
          <circle cx="88" cy="84" r="5" fill="#fef08a" />
          {/* Red Brake Calipers Behind Rims */}
          <circle cx="30" cy="82" r="2.5" fill="#ef4444" />
          <circle cx="86" cy="82" r="2.5" fill="#ef4444" />
          {/* Xenon Laser Light Blades with Beam Flares */}
          <polygon points="106,72 114,74 108,78 100,76" fill="#38bdf8" />
          <polygon points="12,74 16,72 16,76 12,76" fill="#ef4444" />
          {/* Rear Active Carbon Spoiler Wing */}
          <path d="M14 62 L30 60" stroke="#eab308" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    // سيارة ذهبية ملكية (Rolls-Royce Phantom)
    case 'gift_golden_rolls':
      return (
        <svg viewBox="0 0 120 120" width={size} height={size} className="filter drop-shadow-[0_16px_38px_rgba(245,158,11,1)]">
          <defs>
            <linearGradient id="gr_gold_limo" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="60%" stopColor="#eab308" />
              <stop offset="85%" stopColor="#a16207" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="102" rx="52" ry="9" fill="#000000" opacity="0.6" filter="blur(4px)" />
          {/* Regal Rolls-Royce Phantom Coachwork */}
          <path d="M10 76 L20 62 Q30 52 52 50 L84 52 L102 62 L110 76 Q106 88 92 88 L26 88 Z" fill="url(#gr_gold_limo)" />
          {/* Mirror Luxury Finish Highlight */}
          <path d="M22 66 L104 66" stroke="#ffffff" strokeWidth="1.8" fill="none" opacity="0.8" />
          {/* Prestige Tinted Executive Windows */}
          <rect x="42" y="54" width="20" height="12" rx="2" fill="#0f172a" stroke="url(#gr_gold_limo)" strokeWidth="1.2" />
          <rect x="66" y="54" width="20" height="12" rx="2" fill="#0f172a" stroke="url(#gr_gold_limo)" strokeWidth="1.2" />
          {/* Iconic Pantheon Vertical Chrome Grille */}
          <rect x="102" y="62" width="7" height="18" fill="#f8fafc" stroke="#475569" strokeWidth="1" />
          <line x1="104" y1="64" x2="104" y2="78" stroke="#94a3b8" strokeWidth="0.8" />
          <line x1="106" y1="64" x2="106" y2="78" stroke="#94a3b8" strokeWidth="0.8" />
          {/* Spirit of Ecstasy Chrome Mascot */}
          <path d="M105 56 L109 51 L110 56 Z" fill="#ffffff" />
          {/* Floating Luxury Multi-Spoke Dish Wheels */}
          <circle cx="30" cy="86" r="11" fill="#0f172a" stroke="url(#gr_gold_limo)" strokeWidth="3.2" />
          <circle cx="30" cy="86" r="4" fill="#ffffff" />
          <circle cx="90" cy="86" r="11" fill="#0f172a" stroke="url(#gr_gold_limo)" strokeWidth="3.2" />
          <circle cx="90" cy="86" r="4" fill="#ffffff" />
        </svg>
      );

    // يخت ملكي فاخر (100M Mega Yacht)
    case 'gift_luxury_superyacht':
      return (
        <svg viewBox="0 0 120 120" width={size} height={size} className="filter drop-shadow-[0_16px_38px_rgba(14,165,233,0.95)]">
          <defs>
            <linearGradient id="sy_hull_gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#f1f5f9" />
              <stop offset="85%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="sy_teak" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <linearGradient id="sy_waves" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#075985" />
            </linearGradient>
          </defs>
          {/* Dynamic Ocean Spray & Wake Waves */}
          <path d="M6 98 Q30 90 60 98 Q90 106 114 98 L114 112 L6 112 Z" fill="url(#sy_waves)" opacity="0.9" />
          <path d="M6 98 Q30 92 60 98" stroke="#ffffff" strokeWidth="2.5" fill="none" opacity="0.75" />
          {/* Streamlined Tri-Deck Mega Yacht Hull */}
          <path d="M12 84 L26 94 L96 94 L112 76 L90 76 L12 84 Z" fill="url(#sy_hull_gold)" stroke="url(#sy_teak)" strokeWidth="2" />
          {/* 24K Gold Waterline Stripe */}
          <path d="M16 87 L106 87" stroke="url(#sy_teak)" strokeWidth="2" fill="none" />
          {/* Main Deck Salon & Panoramic Tinted Glass */}
          <path d="M34 76 L42 62 L82 62 L90 76 Z" fill="#ffffff" />
          <rect x="44" y="65" width="34" height="8" rx="2" fill="#0284c7" opacity="0.9" />
          {/* Upper Bridge & Flybridge Deck */}
          <path d="M46 62 L52 50 L74 50 L78 62 Z" fill="#ffffff" />
          <rect x="54" y="52" width="16" height="6" rx="1" fill="#0284c7" />
          {/* Private Aft Helipad */}
          <ellipse cx="26" cy="80" rx="7" ry="4" fill="none" stroke="url(#sy_teak)" strokeWidth="1.5" />
          <text x="26" y="82" fontSize="6" fontWeight="900" fill="url(#sy_teak)" textAnchor="middle">H</text>
        </svg>
      );

    // طائرة خاصة فاخرة (Gulfstream VIP Jet)
    case 'gift_private_jet':
      return (
        <svg viewBox="0 0 120 120" width={size} height={size} className="filter drop-shadow-[0_16px_38px_rgba(245,158,11,1)]">
          <defs>
            <linearGradient id="pj_fuselage_white" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#f8fafc" />
              <stop offset="80%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="pj_gold_stripe" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="30%" stopColor="#fef08a" />
              <stop offset="70%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="112" rx="46" ry="6" fill="#000000" opacity="0.35" filter="blur(4px)" />
          <g transform="rotate(-12 60 60)">
            {/* Supersonic Swept Wings with Vertical Winglets */}
            <polygon points="56,60 16,86 30,90 68,70" fill="url(#pj_gold_stripe)" />
            <polygon points="66,54 92,26 102,28 76,58" fill="url(#pj_gold_stripe)" />
            <line x1="16" y1="86" x2="18" y2="78" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="102" y1="28" x2="104" y2="20" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            {/* Aerodynamic Jet Fuselage */}
            <path d="M20 66 Q60 60 102 54 Q106 56 100 62 Q60 70 24 74 Z" fill="url(#pj_fuselage_white)" />
            {/* Dual 24k Gold Speed Livery Stripes */}
            <path d="M26 70 Q60 64 100 58" stroke="url(#pj_gold_stripe)" strokeWidth="2.8" fill="none" />
            {/* Cockpit Canopy Windshield with Reflection */}
            <path d="M96 55 Q102 56 98 60 Z" fill="#0284c7" />
            {/* VIP Oval Cabin Windows with Warm Light */}
            {[42, 52, 62, 72, 82].map((x, i) => (
              <ellipse key={i} cx={x} cy={66 - (x - 42) * 0.1} rx="2" ry="2.8" fill="#fde047" stroke="#0284c7" strokeWidth="0.6" />
            ))}
            {/* T-Tail & Twin Turbofan Jet Engines */}
            <polygon points="20,66 12,46 22,46 28,68" fill="url(#pj_gold_stripe)" />
            <rect x="34" y="68" width="16" height="6.5" rx="3" fill="#334155" stroke="url(#pj_gold_stripe)" strokeWidth="1" />
          </g>
        </svg>
      );

    // قصر الملوك الفاخر
    case 'gift_royal_palace':
      return (
        <svg viewBox="0 0 120 120" width={size} height={size} className="filter drop-shadow-[0_18px_40px_rgba(245,158,11,1)]">
          <defs>
            <linearGradient id="rp_palace_gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="30%" stopColor="#fef08a" />
              <stop offset="70%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <linearGradient id="rp_white_marble" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="112" rx="48" ry="6" fill="#000000" opacity="0.5" filter="blur(4px)" />
          {/* Palace Marble Podium Base */}
          <rect x="18" y="78" width="84" height="28" rx="3" fill="url(#rp_white_marble)" stroke="url(#rp_palace_gold)" strokeWidth="2.5" />
          {/* Illuminated Colonnade Arches */}
          {[26, 40, 54, 68, 82].map((x, i) => (
            <path key={i} d={`M${x} 104 L${x} 88 Q${x + 5} 82 ${x + 10} 88 L${x + 10} 104 Z`} fill="#fde047" stroke="#451a03" strokeWidth="1" />
          ))}
          {/* Monumental Central Golden Ribbed Dome */}
          <path d="M44 62 Q60 34 76 62 Z" fill="url(#rp_palace_gold)" />
          <line x1="60" y1="36" x2="60" y2="62" stroke="#ffffff" strokeWidth="1.5" />
          {/* Crescent Spire Finial */}
          <circle cx="60" cy="32" r="3" fill="url(#rp_palace_gold)" />
          <path d="M60 26 Q63 29 60 32 Q58 29 60 26 Z" fill="#ffffff" />
          {/* Flanking Gilded Minaret Spires */}
          <rect x="16" y="52" width="10" height="38" fill="url(#rp_white_marble)" stroke="url(#rp_palace_gold)" strokeWidth="1" />
          <path d="M15 52 Q21 40 27 52 Z" fill="url(#rp_palace_gold)" />
          <rect x="94" y="52" width="10" height="38" fill="url(#rp_white_marble)" stroke="url(#rp_palace_gold)" strokeWidth="1" />
          <path d="M93 52 Q99 40 105 52 Z" fill="url(#rp_palace_gold)" />
        </svg>
      );

    // ==========================================
    // 4. أسطورية (LEGENDARY: 40,000 - 80,000 💎)
    // ==========================================

    // قلعة ذهبية شامخة
    case 'gift_golden_castle':
      return (
        <svg viewBox="0 0 120 120" width={size} height={size} className="filter drop-shadow-[0_18px_42px_rgba(245,158,11,1)]">
          <defs>
            <linearGradient id="gc_gold_fort" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="85%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="112" rx="46" ry="6" fill="#000000" opacity="0.5" filter="blur(4px)" />
          {/* Main Fortified Citadel Ramparts */}
          <rect x="28" y="70" width="64" height="36" fill="url(#gc_gold_fort)" stroke="#78350f" strokeWidth="1.5" />
          {/* Center Grand Keep Tower */}
          <rect x="46" y="44" width="28" height="42" fill="url(#gc_gold_fort)" />
          {/* Conical Tower Roofs with Fluttering Swallowtail Banners */}
          <polygon points="44,44 60,18 76,44" fill="url(#gc_gold_fort)" stroke="#ffffff" strokeWidth="1" />
          <path d="M60 18 L60 10 L70 14 L60 18 Z" fill="#ef4444" />
          {/* Left & Right Flank Towers */}
          <rect x="22" y="58" width="16" height="46" fill="url(#gc_gold_fort)" />
          <polygon points="20,58 30,36 40,58" fill="url(#gc_gold_fort)" />
          <rect x="82" y="58" width="16" height="46" fill="url(#gc_gold_fort)" />
          <polygon points="80,58 90,36 100,58" fill="url(#gc_gold_fort)" />
          {/* Arched Gateway with Glowing Portcullis */}
          <path d="M52 106 L52 88 Q60 82 68 88 L68 106 Z" fill="#fde047" stroke="#451a03" strokeWidth="1.5" />
        </svg>
      );

    // تنين ذهبي أسطوري (3D Cinematic Celestial Dragon)
    case 'gift_golden_3d_dragon':
      return (
        <svg viewBox="0 0 120 120" width={size} height={size} className="filter drop-shadow-[0_20px_46px_rgba(245,158,11,1)]">
          <defs>
            <linearGradient id="gd_dragon_body" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="55%" stopColor="#f59e0b" />
              <stop offset="85%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
            <linearGradient id="gd_dragon_wings" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#7c2d12" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="112" rx="44" ry="6" fill="#000000" opacity="0.5" filter="blur(4px)" />
          {/* Massive Outspread Draconic Wings */}
          <path d="M60 48 Q30 18 10 32 Q26 62 56 60 Z" fill="url(#gd_dragon_wings)" />
          <path d="M60 48 Q90 18 110 32 Q94 62 64 60 Z" fill="url(#gd_dragon_wings)" />
          <path d="M10 32 Q34 38 60 48 M110 32 Q86 38 60 48" stroke="#ffffff" strokeWidth="1.8" fill="none" opacity="0.8" />
          {/* Coiled Muscular Serpent Dragon Body */}
          <path d="M60 28 Q80 44 76 72 Q68 94 48 94 Q36 86 42 74 Q52 64 66 74 Q74 84 84 88" stroke="url(#gd_dragon_body)" strokeWidth="10" fill="none" strokeLinecap="round" />
          {/* Dragon Dorsal Spines */}
          {[
            { cx: 74, cy: 50 },
            { cx: 72, cy: 65 },
            { cx: 58, cy: 85 }
          ].map((s, i) => (
            <polygon key={i} points={`${s.cx},${s.cy} ${s.cx + 5},${s.cy - 6} ${s.cx + 2},${s.cy + 4}`} fill="#fef08a" />
          ))}
          {/* Horned Dragon Head with Open Jaws */}
          <path d="M60 28 Q52 14 58 10 Q66 12 70 20 Q66 28 60 28 Z" fill="url(#gd_dragon_body)" />
          {/* Dragon Horns */}
          <path d="M64 16 Q76 8 82 12" stroke="url(#gd_dragon_body)" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Glowing Ruby Eye */}
          <circle cx="62" cy="17" r="2.5" fill="#ef4444" stroke="#ffffff" strokeWidth="0.8" />
          {/* Radiant Cosmic Dragon Pearl / Plasma Orb */}
          <circle cx="44" cy="94" r="7.5" fill="#fef08a" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="44" cy="94" r="14" fill="#fbbf24" opacity="0.35" filter="blur(3px)" />
        </svg>
      );

    // نسر ذهبي إمبراطوري
    case 'gift_golden_eagle':
      return (
        <svg viewBox="0 0 120 120" width={size} height={size} className="filter drop-shadow-[0_20px_46px_rgba(245,158,11,1)]">
          <defs>
            <linearGradient id="ge_gold_plumage" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="60%" stopColor="#eab308" />
              <stop offset="85%" stopColor="#a16207" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="112" rx="44" ry="6" fill="#000000" opacity="0.5" filter="blur(4px)" />
          {/* Massive Outstretched Wingspan with Razor Feathers */}
          <path d="M60 48 Q30 14 8 28 Q24 64 56 64 Z" fill="url(#ge_gold_plumage)" />
          <path d="M60 48 Q90 14 112 28 Q96 64 64 64 Z" fill="url(#ge_gold_plumage)" />
          {/* Wing Feather Ranks */}
          <path d="M14 36 L24 46 M22 48 L32 58 M106 36 L96 46 M98 48 L88 58" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          {/* Muscular Eagle Torso */}
          <path d="M60 44 Q68 56 66 84 Q60 92 54 84 Q52 56 60 44 Z" fill="url(#ge_gold_plumage)" />
          {/* Fierce Imperial Head */}
          <path d="M60 44 Q52 30 60 22 Q68 22 72 30 Z" fill="url(#ge_gold_plumage)" />
          <polygon points="72,28 82,32 72,36" fill="#fbbf24" stroke="#78350f" strokeWidth="0.8" />
          <circle cx="65" cy="27" r="2.2" fill="#ef4444" />
          {/* Talons Clutching Lightning Bolts */}
          <path d="M38 96 L60 88 L54 106 L82 92" stroke="#fde047" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      );

    // بوابة كونية أسطورية (Cosmic Stargate)
    case 'gift_cosmic_stargate':
      return (
        <svg viewBox="0 0 120 120" width={size} height={size} className="filter drop-shadow-[0_20px_46px_rgba(99,102,241,1)]">
          <defs>
            <linearGradient id="sg_ring" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <radialGradient id="sg_vortex" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#38bdf8" />
              <stop offset="70%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
          </defs>
          <ellipse cx="60" cy="112" rx="42" ry="6" fill="#000000" opacity="0.5" filter="blur(4px)" />
          {/* Mechanical Heavy Gold Outer Ring */}
          <circle cx="60" cy="60" r="46" fill="none" stroke="url(#sg_ring)" strokeWidth="9" />
          {/* Chevron Runes along Rim */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((ang, i) => (
            <g key={i} transform={`rotate(${ang} 60 60)`}>
              <polygon points="60,10 64,18 56,18" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
            </g>
          ))}
          {/* Swirling Wormhole Event Horizon */}
          <circle cx="60" cy="60" r="38" fill="url(#sg_vortex)" />
          <path d="M60 26 Q80 40 76 60 Q70 80 50 76 Q30 70 40 50 Z" fill="#ffffff" opacity="0.4" filter="blur(2px)" />
        </svg>
      );

    // مجرة كونية متحركة (Spiral Galaxy)
    case 'gift_vortex_galaxy':
      return (
        <svg viewBox="0 0 120 120" width={size} height={size} className="filter drop-shadow-[0_20px_46px_rgba(217,70,239,1)]">
          <defs>
            <radialGradient id="vg_core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="55%" stopColor="#e879f9" />
              <stop offset="85%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
          </defs>
          <ellipse cx="60" cy="112" rx="44" ry="6" fill="#000000" opacity="0.5" filter="blur(4px)" />
          {/* Volumetric Galactic Arms */}
          <ellipse cx="60" cy="60" rx="50" ry="24" fill="url(#vg_core)" transform="rotate(-25 60 60)" />
          {/* Spiral Arms Trails */}
          <path d="M60 60 Q85 45 98 62 Q105 78 88 88" stroke="#fdf4ff" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.85" />
          <path d="M60 60 Q35 75 22 58 Q15 42 32 32" stroke="#bae6fd" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.85" />
          {/* Supermassive Golden Star Core */}
          <circle cx="60" cy="60" r="10" fill="#ffffff" />
          <circle cx="60" cy="60" r="18" fill="#fde047" opacity="0.5" filter="blur(3px)" />
        </svg>
      );

    // ==========================================
    // 5. VIP (VIP: 90,000 - 100,000 💎)
    // ==========================================

    // كوكب ذهبي أسطوري (Golden Gas Giant with Diamond Rings)
    case 'gift_golden_planet':
      return (
        <svg viewBox="0 0 120 120" width={size} height={size} className="filter drop-shadow-[0_22px_50px_rgba(245,158,11,1)]">
          <defs>
            <radialGradient id="gp_sphere" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="20%" stopColor="#fef08a" />
              <stop offset="55%" stopColor="#eab308" />
              <stop offset="85%" stopColor="#a16207" />
              <stop offset="100%" stopColor="#1f1402" />
            </radialGradient>
            <linearGradient id="gp_rings" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#fde047" />
              <stop offset="70%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="112" rx="46" ry="6" fill="#000000" opacity="0.5" filter="blur(4px)" />
          {/* Back Ring Section */}
          <g transform="rotate(-22 60 60)">
            <path d="M6 60 C6 44 114 44 114 60" stroke="url(#gp_rings)" strokeWidth="7" fill="none" opacity="0.75" />
          </g>
          {/* Gilded 3D Planetary Sphere with Atmospheric Bands */}
          <circle cx="60" cy="60" r="34" fill="url(#gp_sphere)" />
          {/* Front Ring Section with Diamond Glints */}
          <g transform="rotate(-22 60 60)">
            <path d="M6 60 C6 76 114 76 114 60" stroke="url(#gp_rings)" strokeWidth="7" fill="none" />
            <path d="M6 60 C6 76 114 76 114 60" stroke="#ffffff" strokeWidth="1.8" fill="none" opacity="0.85" />
          </g>
          {/* Diamond Flare on Ring */}
          <circle cx="94" cy="54" r="3" fill="#ffffff" />
        </svg>
      );

    // صاروخ ملكي فضائي (Imperial Starship Dreadnought)
    case 'gift_luxury_starship':
      return (
        <svg viewBox="0 0 120 120" width={size} height={size} className="filter drop-shadow-[0_22px_50px_rgba(56,189,248,1)]">
          <defs>
            <linearGradient id="ss_hull" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#fef08a" />
              <stop offset="65%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="112" rx="44" ry="6" fill="#000000" opacity="0.45" filter="blur(4px)" />
          {/* Electric Cyan Ion Warp Thruster Exhaust Flames */}
          <polygon points="52,94 60,116 68,94" fill="#38bdf8" />
          <polygon points="56,94 60,112 64,94" fill="#ffffff" />
          <polygon points="36,90 40,106 44,90" fill="#38bdf8" />
          <polygon points="76,90 80,106 84,90" fill="#38bdf8" />
          {/* Futuristic Imperial Wedge Hull */}
          <polygon points="60,12 88,88 32,88" fill="url(#ss_hull)" stroke="#ffffff" strokeWidth="1.5" />
          {/* Command Citadel & Bridge Superstructure */}
          <polygon points="60,34 72,74 48,74" fill="#0f172a" stroke="#eab308" strokeWidth="1.2" />
          <circle cx="60" cy="46" r="3" fill="#38bdf8" />
        </svg>
      );

    // إمبراطورية ذهبية شامخة (Golden Acropolis / Pantheon)
    case 'gift_golden_empire':
      return (
        <svg viewBox="0 0 120 120" width={size} height={size} className="filter drop-shadow-[0_22px_52px_rgba(245,158,11,1)]">
          <defs>
            <linearGradient id="em_gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="60%" stopColor="#eab308" />
              <stop offset="85%" stopColor="#a16207" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="112" rx="50" ry="6" fill="#000000" opacity="0.5" filter="blur(4px)" />
          {/* Sunburst Rays Rising Behind Temple */}
          <g opacity="0.5">
            {[0, 30, 60, 90, 120, 150, 180].map((deg, i) => (
              <line key={i} x1="60" y1="65" x2={60 + 55 * Math.cos((deg * Math.PI) / 180)} y2={65 - 55 * Math.sin((deg * Math.PI) / 180)} stroke="#fde047" strokeWidth="1.5" />
            ))}
          </g>
          {/* Classical Temple Pediment */}
          <polygon points="16,48 60,22 104,48" fill="url(#em_gold)" stroke="#ffffff" strokeWidth="1.5" />
          <polygon points="26,45 60,28 94,45" fill="#451a03" opacity="0.5" />
          {/* Entablature Beam */}
          <rect x="18" y="48" width="84" height="8" fill="url(#em_gold)" />
          {/* Fluted Doric Columns */}
          {[22, 36, 50, 64, 78, 92].map((x, i) => (
            <rect key={i} x={x} y="56" width="6" height="38" fill="url(#em_gold)" rx="1" />
          ))}
          {/* Multi-Tiered Temple Steps (Crepidoma) */}
          <rect x="16" y="94" width="88" height="6" rx="1" fill="url(#em_gold)" />
          <rect x="12" y="100" width="96" height="6" rx="1" fill="url(#em_gold)" />
        </svg>
      );

    // عرش الملوك الأعظم (Imperial Coronation Crown on Golden Throne)
    case 'gift_royal_throne':
    default:
      return (
        <svg viewBox="0 0 120 120" width={size} height={size} className="filter drop-shadow-[0_24px_55px_rgba(245,158,11,1)]">
          <defs>
            <linearGradient id="rt_crown_gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="55%" stopColor="#eab308" />
              <stop offset="85%" stopColor="#a16207" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
            <linearGradient id="rt_royal_purple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#86198f" />
              <stop offset="50%" stopColor="#581c87" />
              <stop offset="100%" stopColor="#2e1065" />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="112" rx="48" ry="6" fill="#000000" opacity="0.55" filter="blur(4px)" />
          {/* High-Backed Imperial Velvet Throne */}
          <path d="M34 50 Q60 30 86 50 L84 104 L36 104 Z" fill="url(#rt_royal_purple)" stroke="url(#rt_crown_gold)" strokeWidth="3" />
          {/* Tufted Diamonds on Velvet */}
          <circle cx="60" cy="56" r="2" fill="#fde047" />
          <circle cx="50" cy="72" r="2" fill="#fde047" />
          <circle cx="70" cy="72" r="2" fill="#fde047" />
          {/* Carved Gold Lion Finials */}
          <circle cx="34" cy="50" r="5" fill="url(#rt_crown_gold)" />
          <circle cx="86" cy="50" r="5" fill="url(#rt_crown_gold)" />
          {/* St. Edward's Imperial Coronation Crown */}
          {/* Ermine Velvet Cap */}
          <path d="M42 48 C42 30 78 30 78 48 Z" fill="url(#rt_royal_purple)" />
          {/* Golden Arched Ribs */}
          <path d="M40 48 Q60 26 80 48" stroke="url(#rt_crown_gold)" strokeWidth="5" fill="none" />
          <path d="M60 26 L60 48" stroke="url(#rt_crown_gold)" strokeWidth="4" />
          {/* Monde Orb & Diamond Cross Pattée */}
          <circle cx="60" cy="22" r="4" fill="url(#rt_crown_gold)" />
          <polygon points="60,10 63,16 67,16 64,19 65,24 60,21 55,24 56,19 53,16 57,16" fill="#ffffff" />
          {/* Crown Circlet Band with Inset Jewels */}
          <rect x="36" y="44" width="48" height="9" rx="2" fill="url(#rt_crown_gold)" stroke="#ffffff" strokeWidth="1" />
          <circle cx="44" cy="48.5" r="2.2" fill="#e11d48" />
          <circle cx="52" cy="48.5" r="2.2" fill="#047857" />
          <circle cx="60" cy="48.5" r="2.5" fill="#38bdf8" />
          <circle cx="68" cy="48.5" r="2.2" fill="#047857" />
          <circle cx="76" cy="48.5" r="2.2" fill="#e11d48" />
          {/* Dazzling Specular Glints */}
          <circle cx="60" cy="18" r="3" fill="#ffffff" />
        </svg>
      );
  }
}
