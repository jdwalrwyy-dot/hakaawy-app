import React from 'react';
import { Sparkles } from 'lucide-react';

interface EntranceVisualRendererProps {
  entranceId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
}

/**
 * 🧹 Clean Baseline Entrance Visual Renderer
 */
export const EntranceVisualRenderer: React.FC<EntranceVisualRendererProps> = ({
  className = '',
  size = 'md'
}) => {
  const dimMap = {
    sm: 'w-24 h-16 text-xs',
    md: 'w-36 h-24 text-sm',
    lg: 'w-48 h-32 text-base',
    hero: 'w-64 h-40 text-lg'
  };

  const sizeClass = dimMap[size] || dimMap.md;

  return (
    <div className={`relative flex flex-col items-center justify-center rounded-2xl bg-slate-900/80 border border-amber-500/30 text-amber-300 p-2 select-none ${sizeClass} ${className}`}>
      <Sparkles className="w-6 h-6 text-amber-400 mb-1" />
      <span className="font-bold text-center">دخلة جديدة</span>
    </div>
  );
};
