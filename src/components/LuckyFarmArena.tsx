import React, { useState, useEffect } from 'react';
import { User, LuckyFarmRoundState, LuckyFarmGlobalWinBanner } from '../types';
import { API } from '../services/api';
import { socketService } from '../services/socketService';
import { soundEffects } from '../services/soundEffects';
import {
  Gem,
  RefreshCw,
  Clock,
  Volume2,
  VolumeX,
  X,
  PartyPopper,
  DoorOpen,
  Plus,
  Trophy,
  Zap,
  Crown,
  History
} from 'lucide-react';

interface LuckyFarmArenaProps {
  currentUser: User;
  onUserUpdated: (user: User) => void;
  onOpenWallet: () => void;
  onExitGame?: () => void;
  isEmbeddedInRoom?: boolean;
}

// 8 Items matching server IDs & SVG slices
// Slices start at 0 deg (3 o'clock) in SVG space and span 45 deg each
export const LUCKY_FARM_ITEMS = [
  { id: 'apple', nameAr: 'تفاح', icon: '🍎', group: 'fruit', multiplier: 2, sliceIndex: 0, fill1: '#ef4444', fill2: '#b91c1c', badgeBg: 'bg-red-600 text-white' },
  { id: 'banana', nameAr: 'موز', icon: '🍌', group: 'fruit', multiplier: 3, sliceIndex: 1, fill1: '#eab308', fill2: '#ca8a04', badgeBg: 'bg-yellow-500 text-amber-950 font-black' },
  { id: 'strawberry', nameAr: 'فراولة', icon: '🍓', group: 'fruit', multiplier: 4, sliceIndex: 2, fill1: '#ec4899', fill2: '#be123c', badgeBg: 'bg-pink-600 text-white' },
  { id: 'orange', nameAr: 'عنب', icon: '🍇', group: 'fruit', multiplier: 5, sliceIndex: 3, fill1: '#a855f7', fill2: '#6b21a8', badgeBg: 'bg-purple-600 text-white' },
  { id: 'chicken', nameAr: 'دجاجة', icon: '🐔', group: 'meat', multiplier: 8, sliceIndex: 4, fill1: '#38bdf8', fill2: '#0369a1', badgeBg: 'bg-sky-600 text-white' },
  { id: 'buffalo', nameAr: 'سمك', icon: '🐟', group: 'meat', multiplier: 10, sliceIndex: 5, fill1: '#06b6d4', fill2: '#0f766e', badgeBg: 'bg-cyan-600 text-white' },
  { id: 'steak', nameAr: 'كريسبي', icon: '🍗', group: 'meat', multiplier: 15, sliceIndex: 6, fill1: '#f97316', fill2: '#c2410c', badgeBg: 'bg-orange-600 text-white' },
  { id: 'goat', nameAr: 'بقرة', icon: '🐄', group: 'meat', multiplier: 25, sliceIndex: 7, fill1: '#22c55e', fill2: '#15803d', badgeBg: 'bg-emerald-600 text-white' }
];

const CHIP_OPTIONS = [
  { amount: 100, label: '100' },
  { amount: 500, label: '500' },
  { amount: 1000, label: '1,000' },
  { amount: 5000, label: '5,000' },
  { amount: 10000, label: '10,000' },
  { amount: 50000, label: '50,000' }
];

export const LuckyFarmArena: React.FC<LuckyFarmArenaProps> = ({
  currentUser,
  onUserUpdated,
  onOpenWallet,
  onExitGame,
  isEmbeddedInRoom = false
}) => {
  const [selectedBet, setSelectedBet] = useState<number>(100);
  const [gameState, setGameState] = useState<LuckyFarmRoundState | null>(null);
  const [placedBets, setPlacedBets] = useState<Record<string, number>>({});
  const [isBettingLoading, setIsBettingLoading] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [myRoundWin, setMyRoundWin] = useState<number>(0);
  const [globalBanner, setGlobalBanner] = useState<LuckyFarmGlobalWinBanner | null>(null);
  const [soundMuted, setSoundMuted] = useState(false);

  // Wheel Rotation State
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [isSpinningActive, setIsSpinningActive] = useState<boolean>(false);

  // Smooth 1s Countdown Timer Fallback
  useEffect(() => {
    const timer = setInterval(() => {
      setGameState(prev => {
        if (!prev || prev.remainingSeconds <= 0) return prev;
        return {
          ...prev,
          remainingSeconds: prev.remainingSeconds - 1
        };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial fetch
  useEffect(() => {
    API.getLuckyFarmState(currentUser.id)
      .then(state => {
        setGameState(state);
        setPlacedBets(state.userBets || {});
        if (state.latestBigWin) {
          setGlobalBanner(state.latestBigWin);
        }
        if (state.winningItemId) {
          if (state.status === 'SPINNING') {
            spinWheelToItem(state.winningItemId);
          } else {
            alignWheelToItemImmediate(state.winningItemId);
          }
        }
      })
      .catch(err => console.warn('Lucky Farm fetch state error:', err));
  }, [currentUser.id]);

  // Immediate Alignment Helper without 10s animation (for initial sync)
  const alignWheelToItemImmediate = (winningItemId: string) => {
    const item = LUCKY_FARM_ITEMS.find(i => i.id === winningItemId);
    if (!item) return;
    const sliceIndex = item.sliceIndex;
    const baseTargetAngle = (247.5 - (sliceIndex * 45) + 360) % 360;
    setIsSpinningActive(false);
    setWheelRotation(baseTargetAngle);
  };

  // Physics Spin Helper with 10s smooth deceleration
  const spinWheelToItem = (winningItemId: string) => {
    const item = LUCKY_FARM_ITEMS.find(i => i.id === winningItemId);
    if (!item) return;

    setIsSpinningActive(true);
    const sliceIndex = item.sliceIndex;
    const revolutions = 10; // 10 full rotations
    // Exact target angle to align sliceIndex center at 270 deg (Top Pointer)
    const baseTargetAngle = (247.5 - (sliceIndex * 45) + 360) % 360;

    setWheelRotation(prev => {
      const currentRevolutions = Math.floor(prev / 360);
      return (currentRevolutions + revolutions) * 360 + baseTargetAngle;
    });
  };

  // WebSocket Live Sync
  useEffect(() => {
    const unsubTick = socketService.on('lucky_farm_tick', (data: any) => {
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status: data.status,
          remainingSeconds: data.remainingSeconds,
          roundId: data.roundId,
          winningItemId: data.winningItemId,
          totalBetsPerItem: data.totalBetsPerItem || prev.totalBetsPerItem
        };
      });
    });

    const unsubBets = socketService.on('lucky_farm_bets_updated', (data: any) => {
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          totalBetsPerItem: data.totalBetsPerItem
        };
      });
    });

    const unsubSpin = socketService.on('lucky_farm_spin_started', (data: any) => {
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'SPINNING',
          remainingSeconds: 15,
          winningItemId: data.winningItemId,
          totalBetsPerItem: data.totalBetsPerItem
        };
      });
      setShowResultModal(false);

      // Trigger Mathematical Wheel Rotation Sync
      if (data.winningItemId) {
        spinWheelToItem(data.winningItemId);
      }
    });

    const unsubResult = socketService.on('lucky_farm_result', (data: any) => {
      const winningItemId = data.winningItemId;
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'RESULT',
          remainingSeconds: 5,
          winningItemId,
          recentWinners: data.recentWinners || prev.recentWinners
        };
      });

      // Align Wheel exactly at rest position to prevent drift or extra rotation
      if (winningItemId) {
        alignWheelToItemImmediate(winningItemId);
      }

      // Calculate payouts
      const winningItem = LUCKY_FARM_ITEMS.find(i => i.id === winningItemId);
      if (winningItem) {
        const myBetOnWinning = placedBets[winningItemId] || 0;
        if (myBetOnWinning > 0) {
          const won = Math.floor(myBetOnWinning * winningItem.multiplier);
          setMyRoundWin(won);
          setShowResultModal(true);
          if (!soundMuted) soundEffects.playVictoryFanfare();
          onUserUpdated({
            ...currentUser,
            diamonds: (currentUser.diamonds || 0) + won
          });
        }
      }
    });

    const unsubBettingStarted = socketService.on('lucky_farm_betting_started', (data: any) => {
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'BETTING',
          remainingSeconds: 15,
          winningItemId: null,
          totalBetsPerItem: {
            apple: 0, banana: 0, strawberry: 0, orange: 0,
            chicken: 0, buffalo: 0, steak: 0, goat: 0
          },
          userBets: {}
        };
      });
      setPlacedBets({});
      setShowResultModal(false);
      setMyRoundWin(0);
      setIsSpinningActive(false);
    });

    const unsubGlobalWin = socketService.on('lucky_farm_global_win', (data: any) => {
      if (data.banner) {
        setGlobalBanner(data.banner);
      }
    });

    return () => {
      unsubTick();
      unsubBets();
      unsubSpin();
      unsubResult();
      unsubBettingStarted();
      unsubGlobalWin();
    };
  }, [placedBets, currentUser, soundMuted, onUserUpdated]);

  // Handle Placing Bet
  const handlePlaceBet = async (itemId: string) => {
    if (gameState?.status !== 'BETTING') {
      alert('انتهى وقت الرهان لهذه الجولة، يرجى الانتظار للجولة القادمة!');
      return;
    }

    if ((currentUser.diamonds || 0) < selectedBet) {
      alert(`رصيدك من الماسات (${(currentUser.diamonds || 0).toLocaleString()}) غير كافٍ للرهان بقيمة ${selectedBet.toLocaleString()} ماسة`);
      onOpenWallet();
      return;
    }

    try {
      setIsBettingLoading(true);
      const res = await API.placeLuckyFarmBet({
        userId: currentUser.id,
        itemId,
        amount: selectedBet
      });

      if (res.success) {
        if (!soundMuted) soundEffects.playCoinCollect();
        setPlacedBets(res.state.userBets || {});
        onUserUpdated({
          ...currentUser,
          diamonds: res.userDiamonds
        });
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ في وضع الرهان');
    } finally {
      setIsBettingLoading(false);
    }
  };

  const currentWinningItem = LUCKY_FARM_ITEMS.find(i => i.id === gameState?.winningItemId);

  return (
    <div className={`relative min-h-[90vh] max-h-screen w-full bg-gradient-to-b from-[#fffbeb] via-[#fef3c7] to-[#fde68a] text-amber-950 flex flex-col justify-between font-sans selection:bg-emerald-600 selection:text-amber-100 select-none overflow-hidden ${isEmbeddedInRoom ? 'p-2 rounded-3xl border-2 border-amber-600/80 shadow-2xl' : 'p-2 sm:p-3'}`} dir="rtl">
      
      {/* 1. MINIMAL FLOATING TOP ACTION BAR (بدون البانر الأبيض الكبير) */}
      <div className="flex items-center justify-between gap-2 px-1 pt-0.5 pb-1 shrink-0 z-30">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-800 text-amber-100 font-black text-xs border border-amber-300 shadow-md">
          <span>🎡 ساقية الحظ</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setSoundMuted(!soundMuted)}
            className="p-1.5 rounded-xl bg-amber-200/90 hover:bg-amber-300 text-amber-950 border border-amber-600/70 transition-all cursor-pointer shadow-sm active:scale-95"
            title={soundMuted ? 'تفعيل الصوت' : 'كتم الصوت'}
          >
            {soundMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-600" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-800" />}
          </button>

          {onExitGame && (
            <button
              onClick={onExitGame}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-all cursor-pointer shadow-md border border-amber-300 active:scale-95 shrink-0"
              title="إغلاق الساقية والرجوع"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
              <span>إغلاق</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. GLOBAL WINNER TICKER BANNER */}
      {globalBanner ? (
        <div className="my-0.5 p-1 rounded-xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-800 text-amber-100 border border-amber-300 flex items-center justify-center gap-1.5 text-[10px] font-black shadow shrink-0 animate-pulse">
          <Trophy className="w-3 h-3 text-amber-300 shrink-0" />
          <span className="truncate">
            فاز <strong className="text-amber-200 underline">{globalBanner.userName}</strong> بـ <span className="text-amber-300">{globalBanner.winAmount.toLocaleString()} 💎</span> على ({globalBanner.itemIcon} {globalBanner.itemName})!
          </span>
        </div>
      ) : null}

      {/* 2.5 RECENT WINNERS HISTORY TICKER BAR (سجل الفائزين والدورات السابقة) */}
      <div className="my-0.5 p-1 rounded-2xl bg-amber-950/20 border border-amber-600/40 flex items-center gap-1.5 shrink-0 overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-xl bg-amber-800 text-amber-100 text-[8.5px] font-black shrink-0 shadow-sm border border-amber-400/50">
          <History className="w-3 h-3 text-amber-300" />
          <span>السجل:</span>
        </div>
        {gameState?.recentWinners && gameState.recentWinners.length > 0 ? (
          gameState.recentWinners.map((winner, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1 px-2 py-0.5 rounded-xl bg-[#fffbeb] border border-amber-600/60 text-amber-950 text-[8.5px] font-black shrink-0 shadow-sm"
            >
              <span className="text-xs">{winner.itemIcon}</span>
              <span className="text-emerald-800">+{winner.winAmount.toLocaleString()}💎</span>
            </div>
          ))
        ) : (
          <span className="text-[8.5px] text-amber-900 font-bold px-1">جاري انتظار نتائج الجولات الأولى...</span>
        )}
      </div>

      {/* 3. VERY COMPACT CUSTOM SVG WHEEL (تصغير الساقية جداً مع ربط دقيق 100%) */}
      <div className="relative flex flex-col items-center justify-center my-0.5 py-0.5 shrink-0">
        
        {/* Status Badge & Timer Header (عداد الثواني التنازلي على اليمين في RTL) */}
        <div className="flex items-center justify-between gap-2 w-full max-w-[210px] sm:max-w-[230px] px-1 mb-1 z-20">
          {/* Countdown Timer Badge (First = Right Side in RTL) */}
          <div className="flex items-center gap-1 px-2 py-0.2 rounded-full bg-[#fffbeb] border border-amber-600 text-amber-950 text-[9px] font-black shadow">
            <Clock className="w-2.5 h-2.5 text-emerald-700" />
            <span>{gameState?.remainingSeconds || 0} ث</span>
          </div>

          {/* Round Status Badge */}
          <div className="flex items-center gap-1 px-2 py-0.2 rounded-full bg-emerald-700 text-amber-100 text-[9px] font-black border border-amber-300 shadow">
            {gameState?.status === 'BETTING' && <Zap className="w-2.5 h-2.5 text-amber-300 animate-bounce" />}
            {gameState?.status === 'SPINNING' && <RefreshCw className="w-2.5 h-2.5 text-amber-300 animate-spin" />}
            {gameState?.status === 'RESULT' && <Crown className="w-2.5 h-2.5 text-amber-300" />}
            <span>
              {gameState?.status === 'BETTING' && 'الرهان مفتوح'}
              {gameState?.status === 'SPINNING' && 'جاري الدوران'}
              {gameState?.status === 'RESULT' && 'فائز الجولة!'}
            </span>
          </div>
        </div>

        {/* COMPACT WHEEL CONTAINER (w-190px / w-220px) */}
        <div className="relative w-[190px] h-[190px] sm:w-[220px] sm:h-[220px] rounded-full p-2 bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-700 border-4 border-amber-800 shadow-xl shadow-amber-600/40 flex items-center justify-center">
          
          {/* Top Golden Pointer Arrow (السهم الذهبي العلوي الثابت عند 12 o'clock) */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none filter drop-shadow-xl">
            <div className="w-0 h-0 border-l-[11px] border-l-transparent border-r-[11px] border-r-transparent border-t-[18px] border-t-amber-300 border-b-0 filter drop-shadow-md" />
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-700 to-emerald-900 border border-amber-200 -mt-1 shadow-md" />
          </div>

          {/* Glowing Bulbs around rim */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, idx) => (
            <div
              key={idx}
              className="absolute w-2 h-2 rounded-full bg-amber-200 border border-amber-700 shadow-sm animate-pulse"
              style={{
                transform: `rotate(${deg}deg) translate(0, -92px)`
              }}
            />
          ))}

          {/* ROTATING SVG WHEEL DISK */}
          <div
            className="w-full h-full rounded-full overflow-hidden border-2 border-amber-300 relative shadow-inner bg-slate-950"
            style={{
              transform: `rotate(${wheelRotation}deg)`,
              transition: isSpinningActive ? 'transform 10s cubic-bezier(0.12, 0.85, 0.15, 1)' : 'none'
            }}
          >
            <svg viewBox="0 0 240 240" className="w-full h-full">
              <defs>
                {LUCKY_FARM_ITEMS.map((item) => (
                  <linearGradient key={`grad_${item.id}`} id={`grad_${item.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={item.fill1} />
                    <stop offset="100%" stopColor={item.fill2} />
                  </linearGradient>
                ))}
              </defs>

              {LUCKY_FARM_ITEMS.map((item, i) => {
                const anglePerSlice = 45;
                const a1 = i * anglePerSlice;
                const a2 = (i + 1) * anglePerSlice;
                const r1 = (a1 * Math.PI) / 180;
                const r2 = (a2 * Math.PI) / 180;

                const x1 = 120 + 118 * Math.cos(r1);
                const y1 = 120 + 118 * Math.sin(r1);
                const x2 = 120 + 118 * Math.cos(r2);
                const y2 = 120 + 118 * Math.sin(r2);

                const pathData = `M 120 120 L ${x1} ${y1} A 118 118 0 0 1 ${x2} ${y2} Z`;

                const aMid = i * anglePerSlice + 22.5;
                const rMid = (aMid * Math.PI) / 180;

                // Relative radius positions
                const xIcon = 120 + 74 * Math.cos(rMid);
                const yIcon = 120 + 74 * Math.sin(rMid);

                const xMult = 120 + 42 * Math.cos(rMid);
                const yMult = 120 + 42 * Math.sin(rMid);

                const xName = 120 + 98 * Math.cos(rMid);
                const yName = 120 + 98 * Math.sin(rMid);

                const isWinner = gameState?.status === 'RESULT' && gameState?.winningItemId === item.id;

                return (
                  <g key={item.id}>
                    {/* Slice Shape */}
                    <path
                      d={pathData}
                      fill={isWinner ? '#f59e0b' : `url(#grad_${item.id})`}
                      stroke={isWinner ? '#ffffff' : '#fde68a'}
                      strokeWidth={isWinner ? '4' : '2'}
                      className={isWinner ? 'animate-pulse' : ''}
                    />

                    {/* Emoji Icon */}
                    <text
                      x={xIcon}
                      y={yIcon}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="20"
                      className="select-none filter drop-shadow-md"
                    >
                      {item.icon}
                    </text>

                    {/* Multiplier Badge */}
                    <text
                      x={xMult}
                      y={yMult}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="10.5"
                      fontWeight="900"
                      fill="#ffffff"
                      className="select-none filter drop-shadow"
                    >
                      x{item.multiplier}
                    </text>

                    {/* Short Name */}
                    <text
                      x={xName}
                      y={yName}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="8"
                      fontWeight="900"
                      fill="#ffffff"
                      className="select-none opacity-90 filter drop-shadow"
                    >
                      {item.nameAr}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Center Golden Cap Hub */}
          <div className="absolute w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-600 border-2 border-amber-100 shadow-xl z-30 flex flex-col items-center justify-center text-amber-950 pointer-events-none">
            <span className="text-base leading-none">🌾</span>
            <span className="text-[7.5px] font-black text-amber-950">مزرعة</span>
          </div>

        </div>

        {/* WINNER ANNOUNCEMENT BADGE BELOW WHEEL */}
        {gameState?.status === 'RESULT' && currentWinningItem && (
          <div className="mt-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 text-amber-950 border-2 border-amber-600 font-black text-xs shadow-xl animate-bounce flex items-center gap-1.5 z-30 ring-2 ring-emerald-600">
            <span>🎉 الفائز هو:</span>
            <span className="text-base">{currentWinningItem.icon}</span>
            <span>"{currentWinningItem.nameAr}" (مضاعف x{currentWinningItem.multiplier})</span>
          </div>
        )}
      </div>

      {/* 4. COMPACT 4x2 BETTING CARDS GRID (كافة الخانات الـ 8 المكتملة والمندمجة) */}
      <div className="shrink-0 my-0.5">
        <div className="grid grid-cols-4 gap-1">
          {LUCKY_FARM_ITEMS.map((item) => {
            const myBet = placedBets[item.id] || 0;
            const totalBets = gameState?.totalBetsPerItem[item.id] || 0;
            const isWinner = gameState?.status === 'RESULT' && gameState?.winningItemId === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handlePlaceBet(item.id)}
                disabled={gameState?.status !== 'BETTING' || isBettingLoading}
                className={`relative p-0.5 rounded-xl border-2 transition-all flex flex-col items-center justify-between cursor-pointer disabled:cursor-not-allowed select-none text-center min-h-[42px] ${
                  isWinner
                    ? 'bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 border-amber-600 ring-2 ring-emerald-600 scale-105 shadow-xl z-10 text-amber-950 font-black animate-pulse'
                    : myBet > 0
                    ? 'bg-emerald-700 text-amber-100 border-amber-300 shadow-md'
                    : 'bg-[#fffbeb] hover:bg-amber-100 text-amber-950 border-amber-600/70 shadow-sm'
                }`}
              >
                {/* Multiplier / Winner Badge */}
                <span className={`absolute -top-1.5 -right-0.5 px-1 py-0 rounded-full font-black text-[7.5px] border border-amber-700 shadow-sm ${isWinner ? 'bg-emerald-700 text-amber-100 font-black ring-1 ring-amber-300' : item.badgeBg}`}>
                  {isWinner ? `🏆 x${item.multiplier}` : `x${item.multiplier}`}
                </span>

                {/* Emoji + Name */}
                <div className="text-sm sm:text-base leading-none mt-0.5">{item.icon}</div>
                <span className="font-black text-[9px] truncate w-full leading-tight">{item.nameAr}</span>

                {/* My Bet vs Total Bets */}
                <div className="w-full pt-0.5 border-t border-amber-600/30 flex items-center justify-center text-[7.5px] font-bold">
                  {myBet > 0 ? (
                    <span className="text-amber-200 font-black truncate">{myBet.toLocaleString()}💎</span>
                  ) : (
                    <span className="text-amber-900 opacity-80 truncate">{totalBets > 0 ? `${totalBets.toLocaleString()}💎` : '0💎'}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. BOTTOM BAR: BET CHIPS SELECTOR & USER BALANCE */}
      <div className="p-1.5 rounded-2xl bg-[#fffbeb]/95 border-2 border-amber-600/80 shadow-md shrink-0 mt-0.5 flex flex-col gap-1 text-amber-950">
        {/* Top: Chips Options */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto custom-scrollbar">
          <span className="text-[9px] font-black text-amber-950 shrink-0 ml-0.5">الفئة:</span>
          {CHIP_OPTIONS.map((chip) => {
            const isSelected = selectedBet === chip.amount;
            return (
              <button
                key={chip.amount}
                onClick={() => setSelectedBet(chip.amount)}
                className={`px-1.5 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer shrink-0 active:scale-95 shadow-sm ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-800 text-amber-100 border border-amber-300 scale-105 shadow-md'
                    : 'bg-amber-200/80 hover:bg-amber-300 text-amber-950 border border-amber-600/60'
                }`}
              >
                <span>{chip.label} 💎</span>
              </button>
            );
          })}
        </div>

        {/* Bottom: User Diamond Balance */}
        <div className="flex items-center justify-between px-2 py-0.5 rounded-xl bg-amber-200/90 border border-amber-600/70 shadow-inner">
          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-950">
            <span className="text-amber-900 font-extrabold">الرصيد:</span>
            <Gem className="w-3 h-3 text-amber-700 animate-pulse" />
            <span className="font-black text-xs text-amber-950">
              {(currentUser.diamonds || 0).toLocaleString()} 💎
            </span>
          </div>

          <button
            onClick={onOpenWallet}
            className="px-2 py-0.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-amber-100 flex items-center gap-1 font-black text-[10px] cursor-pointer shadow-sm border border-amber-300 active:scale-95 transition-all"
            title="شحن الماسات"
          >
            <Plus className="w-2.5 h-2.5 stroke-[3]" />
            <span>شحن +</span>
          </button>
        </div>
      </div>

      {/* 6. RESULT WINNER MODAL OVERLAY */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 bg-amber-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-[#fffbeb] border-4 border-amber-600 rounded-3xl p-5 max-w-xs w-full text-center shadow-2xl text-amber-950 relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-800 text-amber-200 border-2 border-amber-400 flex items-center justify-center mx-auto mb-2 shadow-lg animate-bounce">
              <PartyPopper className="w-7 h-7 text-amber-300" />
            </div>

            <h2 className="text-lg font-black text-amber-950 mb-1">مبروك الفوز في الساقية! 🏆</h2>
            <p className="text-xs text-amber-900 font-bold mb-3">
              استقرت الساقية على ({currentWinningItem?.icon} {currentWinningItem?.nameAr}) بمضاعف x{currentWinningItem?.multiplier}!
            </p>

            <div className="bg-amber-200/90 border-2 border-amber-600 rounded-2xl p-3 mb-4 shadow-inner">
              <span className="text-[10px] text-amber-900 font-bold block mb-0.5">إجمالي الماسات المربوحة:</span>
              <span className="text-2xl font-black text-emerald-800">
                +{myRoundWin.toLocaleString()} 💎
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowResultModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 text-amber-100 font-black text-xs flex items-center justify-center gap-1.5 shadow-md border border-amber-300 cursor-pointer active:scale-95 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
                <span>جولة جديدة 🔄</span>
              </button>

              {onExitGame && (
                <button
                  onClick={onExitGame}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center justify-center gap-1 shadow-md cursor-pointer active:scale-95 transition-all"
                >
                  <DoorOpen className="w-3.5 h-3.5" />
                  <span>خروج</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
