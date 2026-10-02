import React, { useState, useEffect, useRef } from 'react';
import { User, LuckyWheelMatch } from '../types';
import { API } from '../services/api';
import {
  Gamepad2,
  Trophy,
  Coins,
  Gem,
  Sparkles,
  RefreshCw,
  Clock,
  UserCheck,
  Bot,
  Flame,
  Award,
  Crown,
  Zap,
  ArrowRight,
  Volume2,
  VolumeX,
  AlertTriangle,
  Radio,
  Shield,
  CheckCircle2,
  X,
  PartyPopper,
  LogOut,
  DoorOpen,
  Play
} from 'lucide-react';

interface LuckyWheelArenaProps {
  currentUser: User;
  onUserUpdated: (user: User) => void;
  onOpenWallet: () => void;
  onExitGame?: () => void;
}

interface BetCategory {
  title: string;
  badge: string;
  color: string;
  tiers: { amount: number; formatted: string }[];
}

const BET_CATEGORIES: BetCategory[] = [
  {
    title: 'فئات المبتدئين',
    badge: '🌱',
    color: 'from-blue-600/30 via-indigo-600/20 to-slate-900 border-blue-500/40',
    tiers: [
      { amount: 100, formatted: '100' },
      { amount: 200, formatted: '200' },
      { amount: 300, formatted: '300' },
      { amount: 400, formatted: '400' },
      { amount: 500, formatted: '500' }
    ]
  },
  {
    title: 'الفئات المتوسطة',
    badge: '🔥',
    color: 'from-purple-600/30 via-rose-600/20 to-slate-900 border-purple-500/40',
    tiers: [
      { amount: 1000, formatted: '1,000' },
      { amount: 2000, formatted: '2,000' },
      { amount: 3000, formatted: '3,000' },
      { amount: 4000, formatted: '4,000' },
      { amount: 5000, formatted: '5,000' }
    ]
  },
  {
    title: 'فئات كبار الشخصيات VIP',
    badge: '👑',
    color: 'from-amber-600/30 via-yellow-500/20 to-slate-900 border-amber-500/40',
    tiers: [
      { amount: 10000, formatted: '10,000' },
      { amount: 20000, formatted: '20,000' },
      { amount: 30000, formatted: '30,000' },
      { amount: 40000, formatted: '40,000' },
      { amount: 50000, formatted: '50,000' }
    ]
  }
];

export const LuckyWheelArena: React.FC<LuckyWheelArenaProps> = ({
  currentUser,
  onUserUpdated,
  onOpenWallet,
  onExitGame
}) => {
  const [selectedBet, setSelectedBet] = useState<number>(100);
  const [currentMatch, setCurrentMatch] = useState<LuckyWheelMatch | null>(null);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [matchmakingCountdown, setMatchmakingCountdown] = useState<number>(15);
  
  // Explicit Rotation & Spinning States
  const [rotationDegrees, setRotationDegrees] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinCountdown, setSpinCountdown] = useState<number>(15);
  
  // Game Over State & Winner Modal Details
  const [isGameOver, setIsGameOver] = useState(false);
  const [winnerDetails, setWinnerDetails] = useState<{
    id: string;
    name: string;
    avatar: string;
    prize: number;
    isCurrentHumanWinner: boolean;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const spinCountdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const spinTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
      if (spinCountdownTimerRef.current) clearTimeout(spinCountdownTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    };
  }, []);

  // Matchmaking 15s Countdown timer
  useEffect(() => {
    if (isMatchmaking && matchmakingCountdown > 0) {
      countdownTimerRef.current = setTimeout(() => {
        setMatchmakingCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    };
  }, [isMatchmaking, matchmakingCountdown]);

  // Spin 15s Live Countdown timer
  useEffect(() => {
    if (isSpinning && spinCountdown > 0) {
      spinCountdownTimerRef.current = setTimeout(() => {
        setSpinCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (spinCountdownTimerRef.current) clearTimeout(spinCountdownTimerRef.current);
    };
  }, [isSpinning, spinCountdown]);

  // Poll for match updates when waiting
  useEffect(() => {
    if (currentMatch && (currentMatch.status === 'WAITING_FOR_OPPONENT' || currentMatch.status === 'SPINNING') && !isSpinning && !isGameOver) {
      pollTimerRef.current = setInterval(async () => {
        try {
          const res = await API.getLuckyWheelMatch(currentMatch.matchId);
          if (res.match) {
            setCurrentMatch(res.match);
            if ((res.match.status === 'SPINNING' || res.match.player2) && !isSpinning && res.match.winningAngle !== undefined) {
              triggerWheelSpinAnimation(res.match);
            }
          }
        } catch {}
      }, 1200);
    }
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [currentMatch, isSpinning, isGameOver]);

  const handleStartGame = async (betOverride?: number) => {
    setErrorMessage(null);
    setIsGameOver(false);
    setWinnerDetails(null);
    setRotationDegrees(0);

    const betToUse = betOverride || selectedBet;

    if ((currentUser.diamonds || 0) < betToUse) {
      setErrorMessage(`رصيدك من الماسات (${currentUser.diamonds || 0}) غير كافٍ للرهان بـ ${betToUse.toLocaleString('ar-EG')} ماسة`);
      return;
    }

    try {
      setIsMatchmaking(true);
      setMatchmakingCountdown(15);

      const res = await API.joinLuckyWheelMatch({
        userId: currentUser.id,
        betAmount: betToUse
      });

      if (res.userDiamonds !== undefined) {
        onUserUpdated({ ...currentUser, diamonds: res.userDiamonds });
      }

      setCurrentMatch(res.match);

      if ((res.match.status === 'SPINNING' || res.match.player2) && res.match.winningAngle !== undefined) {
        setIsMatchmaking(false);
        triggerWheelSpinAnimation(res.match);
      }
    } catch (err: any) {
      setIsMatchmaking(false);
      setErrorMessage(err.message || 'حدث خطأ أثناء حجز التحدي');
    }
  };

  const triggerWheelSpinAnimation = (match: LuckyWheelMatch) => {
    setIsMatchmaking(false);
    setIsSpinning(true);
    setSpinCountdown(15);
    setIsGameOver(false);

    // Continuous 15-second ease-out rotation (15 full rotations = 360 * 15 + winningAngle)
    const baseRotations = 360 * 15;
    const targetAngle = baseRotations + (match.winningAngle || 45);
    setRotationDegrees(targetAngle);

    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    spinTimerRef.current = setTimeout(() => {
      setIsSpinning(false);
      setIsGameOver(true);
      
      const isWinnerHuman = match.winnerId === currentUser.id;
      const winnerObj = match.winnerId === match.player1.id
        ? match.player1
        : match.player2 || { id: 'bot', name: 'الروبوت', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250', isBot: true };

      const totalPot = match.betAmount * 2;
      const prizeAmount = isWinnerHuman ? (match.winnerPrize || (totalPot * 0.9)) : totalPot;

      setWinnerDetails({
        id: winnerObj.id,
        name: winnerObj.name,
        avatar: winnerObj.avatar,
        prize: prizeAmount,
        isCurrentHumanWinner: isWinnerHuman
      });

      // Refresh balance for the user
      API.getUser(currentUser.id).then(u => onUserUpdated(u));
    }, 15000); // 15.0 seconds exact spin duration
  };

  const handleResetGame = () => {
    setCurrentMatch(null);
    setIsMatchmaking(false);
    setIsSpinning(false);
    setIsGameOver(false);
    setWinnerDetails(null);
    setErrorMessage(null);
    setRotationDegrees(0);
  };

  const handleExitGame = () => {
    handleResetGame();
    if (onExitGame) {
      onExitGame();
    }
  };

  return (
    <div className="max-w-md mx-auto p-3.5 flex flex-col gap-4 text-center pb-32 animate-in fade-in duration-300" dir="rtl">
      {/* Top Header Banner with Permanent Exit Button */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-4 overflow-hidden shadow-2xl flex flex-col items-center">
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-r from-purple-600/20 via-amber-500/15 to-indigo-600/20 pointer-events-none" />

        {/* Permanent Top Exit Button */}
        {onExitGame && (
          <button
            onClick={handleExitGame}
            className="absolute top-3 right-3 p-2 rounded-2xl bg-slate-800/90 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700/80 transition-all cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5 text-xs font-bold z-20"
            title="خروج من اللعبة"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>خروج</span>
          </button>
        )}

        <div className="relative z-10 flex flex-col items-center gap-2 mt-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-purple-600 p-0.5 shadow-xl shadow-amber-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
              <Gamepad2 className="w-8 h-8 animate-pulse" />
            </div>
          </div>

          <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-purple-200 to-indigo-200">
            عجلة الحظ التنافسية (Lucky Wheel Arena) 🎡✨
          </h1>

          <p className="text-[11px] text-slate-300 max-w-xs leading-relaxed">
            تحدَّ المنافسين في عجلة الحظ الفاخرة! اربح الماسات وضاعف رهانك في جولات تنافسية حية.
          </p>

          <div className="mt-0.5 flex items-center gap-2 px-3.5 py-1.5 bg-slate-950/90 border border-amber-500/40 rounded-full text-amber-300 text-xs font-black shadow-inner">
            <Gem className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>رصيدك الحالي: {(currentUser.diamonds || 0).toLocaleString('ar-EG')} 💎</span>
          </div>
        </div>
      </div>

      {/* Main Wheel Stage Container */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-4 shadow-2xl flex flex-col items-center gap-4 relative overflow-hidden">
        
        {/* Match Players Status Row (Detailed Player Seats) */}
        {currentMatch ? (
          <div className="w-full grid grid-cols-11 gap-1.5 items-center bg-slate-950/90 p-3 rounded-2xl border border-slate-800/80 shadow-inner">
            
            {/* Player 1 Seat */}
            <div className={`col-span-5 flex flex-col items-center p-2 rounded-2xl border transition-all ${
              currentMatch.winnerId === currentMatch.player1.id && isGameOver
                ? 'bg-gradient-to-b from-amber-500/20 to-slate-900 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900/90 border-slate-800'
            }`}>
              <div className="relative">
                <img
                  src={currentMatch.player1.avatar}
                  alt={currentMatch.player1.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-md"
                />
                {currentMatch.winnerId === currentMatch.player1.id && isGameOver && (
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 p-1 rounded-full text-xs font-black shadow-lg animate-bounce">👑</span>
                )}
              </div>
              <span className="text-xs font-black text-slate-100 mt-1 truncate max-w-[90px]">{currentMatch.player1.name}</span>
              <div className="flex items-center gap-1 text-[10px] text-amber-300 font-extrabold mt-0.5">
                <Gem className="w-3 h-3 text-amber-400" />
                <span>{currentMatch.betAmount.toLocaleString('ar-EG')} 💎</span>
              </div>
            </div>

            {/* VS Emblem */}
            <div className="col-span-1 flex flex-col items-center justify-center">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-lg border border-slate-900 animate-pulse">
                VS
              </div>
            </div>

            {/* Player 2 / Bot Seat */}
            <div className={`col-span-5 flex flex-col items-center p-2 rounded-2xl border transition-all ${
              currentMatch.winnerId === currentMatch.player2?.id && isGameOver
                ? 'bg-gradient-to-b from-amber-500/20 to-slate-900 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900/90 border-slate-800'
            }`}>
              {currentMatch.player2 ? (
                <>
                  <div className="relative">
                    <img
                      src={currentMatch.player2.avatar}
                      alt={currentMatch.player2.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-purple-400 shadow-md"
                    />
                    {currentMatch.player2.isBot && (
                      <span className="absolute -bottom-1 -left-1 px-1.5 py-0.2 bg-purple-600 text-white rounded-full text-[8px] font-black border border-purple-400 flex items-center gap-0.5">
                        <Bot className="w-2.5 h-2.5" /> Bot
                      </span>
                    )}
                    {currentMatch.winnerId === currentMatch.player2.id && isGameOver && (
                      <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 p-1 rounded-full text-xs font-black shadow-lg animate-bounce">👑</span>
                    )}
                  </div>
                  <span className="text-xs font-black text-slate-100 mt-1 truncate max-w-[90px]">{currentMatch.player2.name}</span>
                  <div className="flex items-center gap-1 text-[10px] text-purple-300 font-extrabold mt-0.5">
                    <Gem className="w-3 h-3 text-purple-400" />
                    <span>{currentMatch.betAmount.toLocaleString('ar-EG')} 💎</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-1">
                  <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-dashed border-amber-500/60 flex items-center justify-center text-amber-400 animate-spin">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black text-amber-400 mt-1">جاري انضمام منافس...</span>
                  <span className="text-[9px] font-mono text-slate-400 font-bold">({matchmakingCountdown} ثانية)</span>
                </div>
              )}
            </div>

          </div>
        ) : (
          /* Waiting Banner when no match active */
          <div className="w-full bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xs font-extrabold text-slate-100">اختر قيمة الفئة والتحدي</span>
                <span className="text-[10px] text-slate-400">الفائز يحصل على الوعاء بالكامل 💎</span>
              </div>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full font-bold border border-amber-500/30">
              تحدي مباشر ⚡
            </span>
          </div>
        )}

        {/* Live Spinning Countdown Indicator Banner */}
        {isSpinning && (
          <div className="w-full bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-2xl text-amber-300 text-xs font-black flex items-center justify-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span>جاري الدوران: ({spinCountdown}) ثانية 🎡</span>
          </div>
        )}

        {/* 1. The Graphic Wheel Disk with Explicit Rotation State */}
        <div className="relative w-48 h-48 sm:w-52 sm:h-52 my-1 flex items-center justify-center shrink-0">
          
          {/* Top Pointer Indicator Pin */}
          <div className="absolute -top-3.5 z-30 flex flex-col items-center">
            <div className="w-0 h-0 border-x-7 border-x-transparent border-t-[16px] border-t-amber-400 filter drop-shadow-[0_4px_10px_rgba(251,191,36,0.9)]" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-300 shadow-md -mt-1 border border-slate-900" />
          </div>

          {/* Ornate Outer Golden Ring with LED Bulb Lights */}
          <div className="absolute inset-0 rounded-full border-6 border-amber-500/90 shadow-[0_0_30px_rgba(251,191,36,0.4)] pointer-events-none z-20 flex items-center justify-center">
            {/* LED Bulbs around ring */}
            <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-yellow-300 shadow-sm animate-pulse" />
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-yellow-300 shadow-sm animate-pulse" />
            <span className="absolute left-0.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-yellow-300 shadow-sm animate-pulse" />
            <span className="absolute right-0.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-yellow-300 shadow-sm animate-pulse" />
            <span className="absolute top-4 left-4 w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
            <span className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
            <span className="absolute bottom-4 left-4 w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
            <span className="absolute bottom-4 right-4 w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
          </div>

          {/* Rotating Wheel Disk Face (Explicit CSS transform & 15s Transition) */}
          <div
            className="w-full h-full rounded-full border-4 border-amber-300/80 shadow-[0_0_25px_rgba(168,85,247,0.3)] relative overflow-hidden"
            style={{
              transform: `rotate(${rotationDegrees}deg)`,
              transition: isSpinning ? 'transform 15s cubic-bezier(0.1, 0.7, 0.1, 1)' : 'none'
            }}
          >
            {/* Sector 1: Top Half (Player 1 - Gold Sector) */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-400 clip-top-half flex flex-col items-center justify-center" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }}>
              <div className="flex flex-col items-center -mt-16 text-slate-950 font-black">
                <Crown className="w-5 h-5 fill-current" />
                <span className="text-[11px] font-black tracking-wide">القطاع الذهبي 🏆</span>
              </div>
            </div>

            {/* Sector 2: Bottom Half (Player 2 - Purple Sector) */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-800 via-indigo-900 to-purple-950 clip-bottom-half flex flex-col items-center justify-center" style={{ clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)' }}>
              <div className="flex flex-col items-center mt-16 text-purple-200 font-black">
                <span className="text-[11px] font-black tracking-wide">القطاع البنفسجي ⚡</span>
                <Flame className="w-5 h-5 text-amber-400 fill-current" />
              </div>
            </div>

            {/* Center Clean Metallic Golden Pin */}
            <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 border-2 border-slate-950 shadow-2xl flex items-center justify-center z-10">
              <Sparkles className="w-6 h-6 text-slate-950 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Bet Tiers Selector - 3 Categorized Rows (When not in a match) */}
        {!currentMatch && (
          <div className="w-full flex flex-col gap-3 pt-1">
            <span className="text-xs font-extrabold text-slate-200 flex items-center justify-center gap-1">
              <Gem className="w-4 h-4 text-amber-400" />
              <span>اختر فئة الرهان بالماسات للدخول:</span>
            </span>

            {/* 3 Categorized Rows */}
            <div className="flex flex-col gap-2.5 w-full text-right">
              {BET_CATEGORIES.map((category, catIdx) => (
                <div key={catIdx} className="flex flex-col gap-1 w-full bg-slate-950/70 p-2 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="text-xs">{category.badge}</span>
                    <span className="text-[11px] font-black text-slate-300">{category.title}</span>
                  </div>

                  {/* Horizontal Scrollable Row for Tiers */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 max-w-full no-scrollbar">
                    {category.tiers.map(tier => {
                      const isSelected = selectedBet === tier.amount;
                      return (
                        <button
                          key={tier.amount}
                          onClick={() => setSelectedBet(tier.amount)}
                          className={`shrink-0 px-3 py-1.5 rounded-xl border text-center transition-all cursor-pointer flex items-center gap-1 text-xs font-extrabold active:scale-95 ${
                            isSelected
                              ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)] font-black scale-105'
                              : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:border-slate-600 hover:text-white'
                          }`}
                        >
                          <span className="font-mono">{tier.formatted}</span>
                          <span className="text-[10px]">💎</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Bet Indicator & Join Match Button */}
            <div className="flex flex-col gap-1.5 mt-1">
              <div className="flex items-center justify-between px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-bold">
                <span>الفئة المختارة للرهان:</span>
                <span className="font-black text-amber-200 text-sm">{(selectedBet).toLocaleString('en-US')} 💎</span>
              </div>

              <button
                onClick={() => handleStartGame()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 border border-yellow-200"
              >
                <Zap className="w-5 h-5 fill-current text-slate-950" />
                <span>انضمام للجولة ({selectedBet.toLocaleString('en-US')} 💎) 🚀</span>
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="w-full p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={onOpenWallet} className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[10px] font-black shadow-md">شحن 💎</button>
          </div>
        )}
      </div>

      {/* 2. GAME OVER WINNER POPUP MODAL (نافذة نهاية الجولة بعد الـ 15 ثانية) */}
      {isGameOver && winnerDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200" dir="rtl">
          <div
            className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden border-2 ${
              winnerDetails.isCurrentHumanWinner
                ? 'bg-gradient-to-b from-amber-950 via-slate-900 to-slate-950 border-amber-400 shadow-[0_0_60px_rgba(251,191,36,0.6)]'
                : 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-rose-500/50 shadow-rose-950/80'
            }`}
          >
            {/* Animated Background Rays for Winner */}
            {winnerDetails.isCurrentHumanWinner && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-25">
                <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-300 via-amber-500 to-transparent animate-ping" />
              </div>
            )}

            {/* Top Crown/Trophy Icon */}
            <div className="relative z-10 -mt-2 mb-3">
              <div
                className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl border-2 ${
                  winnerDetails.isCurrentHumanWinner
                    ? 'bg-gradient-to-tr from-amber-400 to-yellow-200 text-slate-950 border-yellow-100 animate-bounce'
                    : 'bg-slate-800 text-rose-400 border-slate-700'
                }`}
              >
                {winnerDetails.isCurrentHumanWinner ? (
                  <Crown className="w-11 h-11 fill-current drop-shadow-md" />
                ) : (
                  <Flame className="w-11 h-11" />
                )}
              </div>
            </div>

            {/* Winner Avatar & Name */}
            <div className="relative z-10 flex flex-col items-center gap-1 mb-3">
              <div className="relative">
                <img
                  src={winnerDetails.avatar}
                  alt={winnerDetails.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 shadow-xl"
                />
                <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 p-1.5 rounded-full text-xs font-black shadow-md">👑</span>
              </div>

              <h2 className="text-base font-black text-slate-100 mt-1">{winnerDetails.name}</h2>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                winnerDetails.isCurrentHumanWinner
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {winnerDetails.isCurrentHumanWinner ? '🎉 أنت الفائز بالتحدي!' : '💔 انتصر المنافس في هذه الجولة'}
              </span>
            </div>

            {/* Prize Won Details Box */}
            <div className="relative z-10 w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 mb-5 flex flex-col items-center gap-1 shadow-inner">
              <span className="text-[11px] text-slate-400 font-bold">إجمالي المبلغ المربوح:</span>
              <div className="flex items-center gap-1.5 text-xl font-black text-amber-300">
                <Gem className="w-6 h-6 text-amber-400 animate-pulse" />
                <span>{winnerDetails.prize.toLocaleString('ar-EG')}</span>
                <span className="text-xs font-bold text-amber-400">ماسة 💎</span>
              </div>
            </div>

            {/* 3. Explicit Round Controls */}
            <div className="relative z-10 w-full grid grid-cols-2 gap-2.5">
              {/* Exit Button */}
              <button
                onClick={handleExitGame}
                className="py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-extrabold text-xs border border-slate-700/80 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                <X className="w-4 h-4 text-rose-400" />
                <span>خروج من اللعبة ❌</span>
              </button>

              {/* Another Round Button */}
              <button
                onClick={() => {
                  handleResetGame();
                  setTimeout(() => handleStartGame(selectedBet), 200);
                }}
                className="py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/30 border border-yellow-200 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4 text-slate-950" />
                <span>جولة أخرى 🔄</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
