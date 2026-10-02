import React from 'react';
import { GiftTierLevel } from '../types';

interface GiftVisualRendererProps {
  giftId?: string;
  icon?: string;
  giftName?: string;
  tier?: GiftTierLevel;
  size?: 'sm' | 'md' | 'store' | 'lg' | 'hero';
  showAura?: boolean;
}

export const GiftVisualRenderer: React.FC<GiftVisualRendererProps> = ({
  icon = '🎁',
  size = 'md'
}) => {
  const dim =
    size === 'sm'
      ? 28
      : size === 'md'
      ? 36
      : size === 'store'
      ? 48
      : size === 'lg'
      ? 64
      : 80;

  return (
    <div
      className="flex items-center justify-center select-none pointer-events-none shrink-0"
      style={{ width: dim, height: dim }}
    >
      {icon.startsWith('http') || icon.startsWith('/') || icon.startsWith('data:') ? (
        <img src={icon} alt="Gift" className="w-full h-full object-contain" />
      ) : (
        <span style={{ fontSize: `${Math.round(dim * 0.7)}px` }}>{icon}</span>
      )}
    </div>
  );
};
