import React from 'react';
import { motion } from 'motion/react';

interface RoyalPalaceChamberProps {
  roomCoverImage?: string;
  phase?: string;
}

/**
 * Royal Palace Chamber Background (خلفية قصر الملك الملكية الفاخرة)
 * Exactly reproduces the magnificent royal palace hall:
 * - Towering gilded Corinthian columns with glowing crown medallions
 * - Two majestic golden lions sitting on royal pedestals
 * - Central ornate golden Baroque arch with the imperial golden Crown
 * - Sculpted 3D golden Arabic calligraphy: "الملك"
 * - Mirror-polished dark obsidian marble floor reflecting the entire palace
 */
export const RoyalPalaceChamber: React.FC<RoyalPalaceChamberProps> = ({
  roomCoverImage
}) => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
      {/* If custom room cover image is provided, display it full screen with cover fit */}
      {roomCoverImage ? (
        <div
          className="absolute inset-0 w-[100vw] h-[100vh] bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${roomCoverImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            width: '100vw',
            height: '100vh'
          }}
        />
      ) : null}

      {/* Complete Vector Render of the Royal Palace Hall */}
      <svg
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
      >
        <defs>
          {/* Metallic Gold Gradients */}
          <linearGradient id="palaceGoldRich" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="20%" stopColor="#FCD34D" />
            <stop offset="45%" stopColor="#F59E0B" />
            <stop offset="75%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          <linearGradient id="palaceGoldBright" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="35%" stopColor="#FDE047" />
            <stop offset="70%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>

          <linearGradient id="palaceGoldDeep" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#451A03" />
            <stop offset="25%" stopColor="#B45309" />
            <stop offset="50%" stopColor="#FCD34D" />
            <stop offset="75%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#2E1065" />
          </linearGradient>

          {/* Wall Background Radial Vignette */}
          <radialGradient id="palaceWallAtmosphere" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#2A1705" />
            <stop offset="45%" stopColor="#140902" />
            <stop offset="85%" stopColor="#080401" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>

          {/* Polished Obsidian Floor Gradient */}
          <linearGradient id="palaceObsidianFloor" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#080503" />
            <stop offset="25%" stopColor="#0B0907" />
            <stop offset="60%" stopColor="#030202" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>

          {/* Golden Lamp Glow Filter */}
          <filter id="royalWarmGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="royalCrownGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. PALACE WALL BACKDROP & AMBIENT SHADOWS */}
        <rect x="0" y="0" width="1600" height="660" fill="url(#palaceWallAtmosphere)" />

        {/* Ornate Wall Damask Filigree Pattern Accents */}
        <g opacity="0.15" stroke="url(#palaceGoldBright)" strokeWidth="1" fill="none">
          {[...Array(9)].map((_, i) => (
            <path
              key={`wall-arch-${i}`}
              d={`M ${120 + i * 170} 600 C ${140 + i * 170} 250, ${220 + i * 170} 250, ${240 + i * 170} 600`}
            />
          ))}
        </g>

        {/* 2. GRAND SOARING CORINTHIAN GOLDEN COLUMNS */}
        {/* Leftmost Outer Column */}
        <g transform="translate(40, 0)">
          <rect x="0" y="0" width="90" height="680" fill="url(#palaceGoldRich)" />
          {/* Column Fluting */}
          <line x1="18" y1="60" x2="18" y2="660" stroke="#451A03" strokeWidth="3" opacity="0.6" />
          <line x1="36" y1="60" x2="36" y2="660" stroke="#FEF08A" strokeWidth="3" opacity="0.5" />
          <line x1="54" y1="60" x2="54" y2="660" stroke="#451A03" strokeWidth="3" opacity="0.6" />
          <line x1="72" y1="60" x2="72" y2="660" stroke="#FEF08A" strokeWidth="3" opacity="0.5" />
          {/* Corinthian Capital */}
          <path d="M -15 0 L 105 0 L 95 65 L -5 65 Z" fill="url(#palaceGoldBright)" stroke="#78350F" strokeWidth="2" />
          {/* Column Plinth Base */}
          <rect x="-10" y="640" width="110" height="35" fill="url(#palaceGoldBright)" />
        </g>

        {/* Left Inner Column with Glowing Crown Medallion Sconce */}
        <g transform="translate(240, 0)">
          <rect x="0" y="0" width="80" height="680" fill="url(#palaceGoldRich)" />
          <line x1="16" y1="60" x2="16" y2="660" stroke="#451A03" strokeWidth="2.5" opacity="0.6" />
          <line x1="32" y1="60" x2="32" y2="660" stroke="#FEF08A" strokeWidth="2.5" opacity="0.5" />
          <line x1="48" y1="60" x2="48" y2="660" stroke="#451A03" strokeWidth="2.5" opacity="0.6" />
          <line x1="64" y1="60" x2="64" y2="660" stroke="#FEF08A" strokeWidth="2.5" opacity="0.5" />
          <path d="M -12 0 L 92 0 L 85 60 L -5 60 Z" fill="url(#palaceGoldBright)" />
          <rect x="-8" y="640" width="96" height="35" fill="url(#palaceGoldBright)" />

          {/* Royal Sconce Lamp with Crown Medallion */}
          <g transform="translate(40, 310)">
            <circle cx="0" cy="0" r="52" fill="#78350F" stroke="url(#palaceGoldBright)" strokeWidth="3" />
            <circle cx="0" cy="0" r="44" fill="none" stroke="#FEF08A" strokeWidth="1.5" strokeDasharray="4 3" />
            <circle cx="0" cy="0" r="28" fill="#F59E0B" filter="url(#royalWarmGlow)" opacity="0.8" />
            {/* Crown icon inside medallion */}
            <path
              d="M -14 6 L -18 -8 L -6 -1 L 0 -12 L 6 -1 L 18 -8 L 14 6 Z"
              fill="url(#palaceGoldBright)"
              stroke="#FFF"
              strokeWidth="1"
            />
          </g>
        </g>

        {/* Right Inner Column with Glowing Crown Medallion Sconce */}
        <g transform="translate(1280, 0)">
          <rect x="0" y="0" width="80" height="680" fill="url(#palaceGoldRich)" />
          <line x1="16" y1="60" x2="16" y2="660" stroke="#451A03" strokeWidth="2.5" opacity="0.6" />
          <line x1="32" y1="60" x2="32" y2="660" stroke="#FEF08A" strokeWidth="2.5" opacity="0.5" />
          <line x1="48" y1="60" x2="48" y2="660" stroke="#451A03" strokeWidth="2.5" opacity="0.6" />
          <line x1="64" y1="60" x2="64" y2="660" stroke="#FEF08A" strokeWidth="2.5" opacity="0.5" />
          <path d="M -12 0 L 92 0 L 85 60 L -5 60 Z" fill="url(#palaceGoldBright)" />
          <rect x="-8" y="640" width="96" height="35" fill="url(#palaceGoldBright)" />

          {/* Royal Sconce Lamp with Crown Medallion */}
          <g transform="translate(40, 310)">
            <circle cx="0" cy="0" r="52" fill="#78350F" stroke="url(#palaceGoldBright)" strokeWidth="3" />
            <circle cx="0" cy="0" r="44" fill="none" stroke="#FEF08A" strokeWidth="1.5" strokeDasharray="4 3" />
            <circle cx="0" cy="0" r="28" fill="#F59E0B" filter="url(#royalWarmGlow)" opacity="0.8" />
            <path
              d="M -14 6 L -18 -8 L -6 -1 L 0 -12 L 6 -1 L 18 -8 L 14 6 Z"
              fill="url(#palaceGoldBright)"
              stroke="#FFF"
              strokeWidth="1"
            />
          </g>
        </g>

        {/* Rightmost Outer Column */}
        <g transform="translate(1470, 0)">
          <rect x="0" y="0" width="90" height="680" fill="url(#palaceGoldRich)" />
          <line x1="18" y1="60" x2="18" y2="660" stroke="#451A03" strokeWidth="3" opacity="0.6" />
          <line x1="36" y1="60" x2="36" y2="660" stroke="#FEF08A" strokeWidth="3" opacity="0.5" />
          <line x1="54" y1="60" x2="54" y2="660" stroke="#451A03" strokeWidth="3" opacity="0.6" />
          <line x1="72" y1="60" x2="72" y2="660" stroke="#FEF08A" strokeWidth="3" opacity="0.5" />
          <path d="M -15 0 L 105 0 L 95 65 L -5 65 Z" fill="url(#palaceGoldBright)" stroke="#78350F" strokeWidth="2" />
          <rect x="-10" y="640" width="110" height="35" fill="url(#palaceGoldBright)" />
        </g>

        {/* 3. CENTRAL GRAND ROYAL THRONE NICHE & ARCH */}
        <g transform="translate(800, 320)">
          {/* Huge Ornate Baroque Portal Arch Frame */}
          <path
            d="M -260 340 L -260 0 C -260 -210, 260 -210, 260 0 L 260 340 Z"
            fill="#120904"
            stroke="url(#palaceGoldBright)"
            strokeWidth="14"
          />
          {/* Inner Golden Beaded Border */}
          <path
            d="M -235 340 L -235 0 C -235 -185, 235 -185, 235 0 L 235 340 Z"
            fill="none"
            stroke="url(#palaceGoldRich)"
            strokeWidth="4"
          />

          {/* Arch Ambient Warm Glow */}
          <circle cx="0" cy="-60" r="180" fill="#B45309" opacity="0.3" filter="url(#royalWarmGlow)" />

          {/* ============================================================== */}
          {/* THE IMPERIAL GOLDEN CROWN (التاج الملكي الفخم المرصع) */}
          {/* ============================================================== */}
          <g transform="translate(0, -90) scale(1.35)">
            {/* Crown Base Circlet */}
            <path
              d="M -65 24 Q 0 32 65 24 L 62 12 Q 0 18 -62 12 Z"
              fill="url(#palaceGoldBright)"
              stroke="#78350F"
              strokeWidth="1.5"
              filter="url(#royalCrownGlow)"
            />
            {/* Circlet Jewels */}
            <circle cx="-42" cy="18" r="3" fill="#DC2626" stroke="#FEF08A" strokeWidth="1" />
            <circle cx="-21" cy="20" r="3.5" fill="#2563EB" stroke="#FEF08A" strokeWidth="1" />
            <circle cx="0" cy="21" r="4.5" fill="#DC2626" stroke="#FEF08A" strokeWidth="1.2" />
            <circle cx="21" cy="20" r="3.5" fill="#2563EB" stroke="#FEF08A" strokeWidth="1" />
            <circle cx="42" cy="18" r="3" fill="#DC2626" stroke="#FEF08A" strokeWidth="1" />

            {/* Main Crown Spikes & Fleur-de-lis Arches */}
            <path
              d="M -62 12 
                 C -70 -10, -55 -25, -45 -12 
                 C -40 -35, -22 -42, -18 -15 
                 C -10 -55, 0 -68, 0 -68 
                 C 0 -68, 10 -55, 18 -15 
                 C 22 -42, 40 -35, 45 -12 
                 C 55 -25, 70 -10, 62 12 
                 Z"
              fill="url(#palaceGoldRich)"
              stroke="url(#palaceGoldBright)"
              strokeWidth="2.5"
            />

            {/* Central High Fleur-de-lis Cross & Ruby Core */}
            <g transform="translate(0, -68)">
              <circle cx="0" cy="-6" r="6" fill="url(#palaceGoldBright)" stroke="#78350F" strokeWidth="1.5" />
              <path d="M 0 -16 L 0 4 M -7 -7 L 7 -7" stroke="url(#palaceGoldBright)" strokeWidth="3" strokeLinecap="round" />
            </g>

            {/* Crown Inner Velvet Cap Glow */}
            <path
              d="M -50 12 C -45 -20, -20 -35, 0 -35 C 20 -35, 45 -20, 50 12 Z"
              fill="#7F1D1D"
              opacity="0.8"
            />

            {/* Crown Gem Orbs */}
            <circle cx="-45" cy="-12" r="3.5" fill="#FEF08A" />
            <circle cx="-18" cy="-15" r="4" fill="#FEF08A" />
            <circle cx="18" cy="-15" r="4" fill="#FEF08A" />
            <circle cx="45" cy="-12" r="3.5" fill="#FEF08A" />
          </g>

          {/* ============================================================== */}
          {/* SCULPTED 3D GOLDEN CALLIGRAPHY: "الملك" (خط عربي ملكي مذهب) */}
          {/* ============================================================== */}
          <g transform="translate(0, 38) scale(1.65)">
            {/* Soft Back Shadow for 3D depth */}
            <text
              x="0"
              y="0"
              textAnchor="middle"
              className="font-black"
              style={{
                fontFamily: "'Amiri', 'Traditional Arabic', 'Scheherazade New', serif",
                fontSize: '84px',
                fontWeight: 900,
                fill: '#240E02',
                stroke: '#1A0701',
                strokeWidth: '16',
                strokeLinejoin: 'round'
              }}
            >
              الملك
            </text>
            {/* Deep Metallic Bevel */}
            <text
              x="0"
              y="0"
              textAnchor="middle"
              className="font-black"
              style={{
                fontFamily: "'Amiri', 'Traditional Arabic', 'Scheherazade New', serif",
                fontSize: '84px',
                fontWeight: 900,
                fill: 'url(#palaceGoldDeep)',
                stroke: '#78350F',
                strokeWidth: '10',
                strokeLinejoin: 'round'
              }}
            >
              الملك
            </text>
            {/* Front Pure Gold Luster */}
            <text
              x="0"
              y="0"
              textAnchor="middle"
              className="font-black"
              filter="url(#royalCrownGlow)"
              style={{
                fontFamily: "'Amiri', 'Traditional Arabic', 'Scheherazade New', serif",
                fontSize: '84px',
                fontWeight: 900,
                fill: 'url(#palaceGoldBright)',
                stroke: '#FEF08A',
                strokeWidth: '2.5'
              }}
            >
              الملك
            </text>
          </g>
        </g>

        {/* 4. THE TWO SCULPTED GOLDEN LIONS (الأسود الملكية المذهبة الفخمة) */}
        {/* Left Guardian Lion */}
        <g transform="translate(420, 480) scale(1.4)">
          {/* Marble Pedestal Plinth */}
          <rect x="-95" y="85" width="190" height="35" fill="url(#palaceGoldBright)" stroke="#451A03" strokeWidth="2" />
          <rect x="-85" y="70" width="170" height="18" fill="#1C1008" stroke="url(#palaceGoldBright)" strokeWidth="1.5" />

          {/* Lion Body (Majestic Sitting Stance) */}
          <path
            d="M -70 70 
               C -75 40, -60 10, -35 0 
               C -25 -10, -10 -25, 0 -35 
               C 15 -45, 35 -40, 45 -25 
               C 55 -10, 60 15, 65 45 
               C 70 65, 60 70, 50 70 
               L -70 70 Z"
            fill="url(#palaceGoldRich)"
            stroke="#78350F"
            strokeWidth="3"
          />
          {/* Mane Sculptural Waves */}
          <path
            d="M -20 -15 C -35 -40, -10 -60, 15 -60 C 35 -60, 45 -45, 45 -25 C 40 5, 20 20, -5 20 Z"
            fill="url(#palaceGoldBright)"
            stroke="#78350F"
            strokeWidth="2"
          />
          {/* Lion Crown/Head Profile */}
          <circle cx="20" cy="-45" r="18" fill="url(#palaceGoldBright)" />
          <polygon points="12,-68 18,-58 24,-68 30,-58 36,-68 34,-52 10,-52" fill="url(#palaceGoldBright)" stroke="#78350F" strokeWidth="1" />
          {/* Forepaws */}
          <rect x="25" y="45" width="22" height="28" rx="6" fill="url(#palaceGoldBright)" stroke="#78350F" strokeWidth="1.5" />
          <rect x="-5" y="45" width="22" height="28" rx="6" fill="url(#palaceGoldBright)" stroke="#78350F" strokeWidth="1.5" />
        </g>

        {/* Right Guardian Lion */}
        <g transform="translate(1180, 480) scale(-1.4, 1.4)">
          <rect x="-95" y="85" width="190" height="35" fill="url(#palaceGoldBright)" stroke="#451A03" strokeWidth="2" />
          <rect x="-85" y="70" width="170" height="18" fill="#1C1008" stroke="url(#palaceGoldBright)" strokeWidth="1.5" />

          <path
            d="M -70 70 
               C -75 40, -60 10, -35 0 
               C -25 -10, -10 -25, 0 -35 
               C 15 -45, 35 -40, 45 -25 
               C 55 -10, 60 15, 65 45 
               C 70 65, 60 70, 50 70 
               L -70 70 Z"
            fill="url(#palaceGoldRich)"
            stroke="#78350F"
            strokeWidth="3"
          />
          <path
            d="M -20 -15 C -35 -40, -10 -60, 15 -60 C 35 -60, 45 -45, 45 -25 C 40 5, 20 20, -5 20 Z"
            fill="url(#palaceGoldBright)"
            stroke="#78350F"
            strokeWidth="2"
          />
          <circle cx="20" cy="-45" r="18" fill="url(#palaceGoldBright)" />
          <polygon points="12,-68 18,-58 24,-68 30,-58 36,-68 34,-52 10,-52" fill="url(#palaceGoldBright)" stroke="#78350F" strokeWidth="1" />
          <rect x="25" y="45" width="22" height="28" rx="6" fill="url(#palaceGoldBright)" stroke="#78350F" strokeWidth="1.5" />
          <rect x="-5" y="45" width="22" height="28" rx="6" fill="url(#palaceGoldBright)" stroke="#78350F" strokeWidth="1.5" />
        </g>

        {/* 5. POLISHED OBSIDIAN BLACK MARBLE FLOOR WITH MIRROR REFLECTIONS */}
        <rect x="0" y="660" width="1600" height="340" fill="url(#palaceObsidianFloor)" />

        {/* Mirror Reflection Sheen of Columns & Lions onto Floor */}
        <g opacity="0.32" transform="translate(0, 660) scale(1, -0.45)">
          {/* Columns Reflection */}
          <rect x="40" y="0" width="90" height="400" fill="url(#palaceGoldRich)" filter="url(#royalWarmGlow)" />
          <rect x="240" y="0" width="80" height="400" fill="url(#palaceGoldRich)" filter="url(#royalWarmGlow)" />
          <rect x="1280" y="0" width="80" height="400" fill="url(#palaceGoldRich)" filter="url(#royalWarmGlow)" />
          <rect x="1470" y="0" width="90" height="400" fill="url(#palaceGoldRich)" filter="url(#royalWarmGlow)" />
          {/* Central Throne Reflection */}
          <ellipse cx="800" cy="120" rx="220" ry="120" fill="#F59E0B" filter="url(#royalWarmGlow)" opacity="0.5" />
        </g>

        {/* Floor Specular Golden Rim Line dividing wall and floor */}
        <line x1="0" y1="660" x2="1600" y2="660" stroke="url(#palaceGoldBright)" strokeWidth="3.5" />
        <line x1="0" y1="663" x2="1600" y2="663" stroke="#FEF08A" strokeWidth="1" opacity="0.8" />

        {/* Atmospheric Floating Golden Light Flares */}
        <circle cx="280" cy="310" r="140" fill="#F59E0B" opacity="0.12" filter="url(#royalWarmGlow)" />
        <circle cx="1320" cy="310" r="140" fill="#F59E0B" opacity="0.12" filter="url(#royalWarmGlow)" />
        <circle cx="800" cy="220" r="260" fill="#FEF08A" opacity="0.08" filter="url(#royalWarmGlow)" />
      </svg>

      {/* Floating Golden Ambient Dust Motes */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(14)].map((_, idx) => (
          <motion.div
            key={`dust-${idx}`}
            className="absolute rounded-full bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.9)]"
            style={{
              width: idx % 2 === 0 ? 3 : 2,
              height: idx % 2 === 0 ? 3 : 2,
              left: `${10 + ((idx * 67) % 80)}%`,
              top: `${15 + ((idx * 43) % 70)}%`
            }}
            animate={{
              y: [-15, 20, -15],
              x: [-10, 10, -10],
              opacity: [0.2, 0.85, 0.2]
            }}
            transition={{
              duration: 4 + (idx % 3),
              repeat: Infinity,
              ease: 'easeInOut',
              delay: idx * 0.3
            }}
          />
        ))}
      </div>
    </div>
  );
};
