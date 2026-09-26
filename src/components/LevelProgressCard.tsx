import React from 'react';
import { Crown, Zap, Sparkles, ChevronLeft } from 'lucide-react';
import { getLevelProgressInfo } from '../utils/levelUtils';

interface LevelProgressCardProps {
  exp: number;
  level: number;
  onOpenFrames?: () => void;
  className?: string;
}

export const LevelProgressCard: React.FC<LevelProgressCardProps> = ({
  exp,
  level,
  onOpenFrames,
  className = ''
}) => {
  const info = getLevelProgressInfo(exp, level);

  return (
    <div className={`p-4 rounded-3xl bg-slate-900/90 border border-amber-500/30 shadow-xl flex flex-col gap-3 relative overflow-hidden ${className}`}>
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-slate-100 text-sm sm:text-base">المستوى الحالي</h3>
              <span className="text-xs font-black font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                Lvl {info.currentLevel}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              نقاط الخبرة تُكتسب حصرياً من الشحن والدعم 💎
            </span>
          </div>
        </div>

        {onOpenFrames && (
          <button
            type="button"
            onClick={onOpenFrames}
            className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700/80 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>الإطارات</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Progress Bar Container */}
      <div className="flex flex-col gap-1.5 mt-1">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-300 font-mono">
            {info.currentExp.toLocaleString('ar-EG')} / {info.nextLevelXP.toLocaleString('ar-EG')} XP
          </span>
          <span className="text-amber-400 font-mono font-black">
            {info.progressPercent}%
          </span>
        </div>

        {/* Outer Bar */}
        <div className="w-full h-3 bg-slate-950 rounded-full p-0.5 border border-slate-800 relative overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full transition-all duration-500 shadow-sm shadow-amber-500/50"
            style={{ width: `${info.progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold mt-0.5 flex-wrap gap-1">
          <span className="flex items-center gap-1 text-slate-300">
            <Zap className="w-3 h-3 text-amber-400 shrink-0" />
            <span>متبقي للمستوى التالي:</span>
            <strong className="text-amber-300 font-mono font-extrabold">
              {info.remainingExpForNextLevel.toLocaleString('ar-EG')} XP
            </strong>
          </span>
          <span className="text-slate-400 font-mono">
            المستوى القادم: Lvl {info.currentLevel + 1}
          </span>
        </div>
      </div>

      {/* Next Frame Milestone Box */}
      {info.nextUnlockFrame && (
        <div className="p-3 rounded-2xl bg-slate-950/70 border border-amber-500/20 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold">الإطار القادم المغلق</span>
              <span className="font-extrabold text-slate-200">
                {info.nextUnlockFrame.nameAr}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-black text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-xl border border-amber-500/30 shrink-0 font-mono">
            🔒 يتطلب Level {info.nextUnlockFrame.requiredLevel}
          </span>
        </div>
      )}
    </div>
  );
};
