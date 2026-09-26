import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { soundEffects } from '../services/soundEffects';
import confetti from 'canvas-confetti';
import { Sparkles, Flame, Star, Users } from 'lucide-react';
import { GiftVisualRenderer } from './GiftVisualRenderer';
import { RoomSeat } from '../types';

export interface GiftTrajectoryItem {
  id: string;
  giftId?: string;
  giftIcon: string;
  giftName: string;
  diamondCost?: number;
  category?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
  count: number;
}

interface GiftTrajectoryOverlayProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  queue: GiftTrajectoryItem[];
  seats?: RoomSeat[];
  onItemFinished: (id: string) => void;
  onArrivalImpact?: (receiverId: string) => void;
  currentUserId: string;
  hostUserId: string;
}

interface Point {
  x: number;
  y: number;
}

interface ImpactEffect {
  id: string;
  x: number;
  y: number;
  tier: GiftTierLevel;
  giftId?: string;
  icon: string;
}

type GiftTierLevel = 'COMMON' | 'PRETTY' | 'LUXURY' | 'LEGENDARY' | 'VIP';

interface ActiveFlight {
  item: GiftTrajectoryItem;
  tier: GiftTierLevel;
  coords: {
    start: Point;
    target: Point;
  };
  duration: number;
}

// حركة بطيئة وناعمة مستمرة من مايك المرسل إلى منتصف مايك المستلم بدون توقف في منتصف الطريق
const TIER_DEFAULTS: Record<GiftTierLevel, { duration: number; nameAr: string }> = {
  COMMON: { duration: 3.2, nameAr: 'عادية' },
  PRETTY: { duration: 3.4, nameAr: 'مميزة' },
  LUXURY: { duration: 3.6, nameAr: 'فخمة' },
  LEGENDARY: { duration: 3.8, nameAr: 'أسطورية' },
  VIP: { duration: 4.0, nameAr: '👑 VIP ملكية' }
};

export const GiftTrajectoryOverlay: React.FC<GiftTrajectoryOverlayProps> = ({
  containerRef,
  queue,
  seats,
  onItemFinished,
  onArrivalImpact,
  currentUserId,
  hostUserId
}) => {
  const [activeFlights, setActiveFlights] = useState<ActiveFlight[]>([]);
  const [impactList, setImpactList] = useState<ImpactEffect[]>([]);
  const processingRef = useRef(false);

  // Helper to accurately classify into 5 tiers
  const resolveTier = useCallback((item: GiftTrajectoryItem): GiftTierLevel => {
    const cost = item.diamondCost || 0;
    const cat = item.category?.toLowerCase() || '';
    const giftId = item.giftId || '';

    // 1. VIP Tier (90,000 - 100,000 Diamonds)
    if (
      cost >= 90000 ||
      cat === 'vip' ||
      giftId === 'gift_golden_planet' ||
      giftId === 'gift_luxury_starship' ||
      giftId === 'gift_golden_empire' ||
      giftId === 'gift_royal_throne'
    ) {
      return 'VIP';
    }

    // 2. Legendary Tier (40,000 - 80,000 Diamonds)
    if (
      cost >= 40000 ||
      cat === 'legendary' ||
      giftId === 'gift_golden_castle' ||
      giftId === 'gift_golden_3d_dragon' ||
      giftId === 'gift_golden_eagle' ||
      giftId === 'gift_cosmic_stargate' ||
      giftId === 'gift_vortex_galaxy'
    ) {
      return 'LEGENDARY';
    }

    // 3. Luxury Tier (8,000 - 30,000 Diamonds)
    if (
      cost >= 8000 ||
      cat === 'luxury' ||
      giftId === 'gift_luxury_supercar' ||
      giftId === 'gift_golden_rolls' ||
      giftId === 'gift_luxury_superyacht' ||
      giftId === 'gift_private_jet' ||
      giftId === 'gift_royal_palace'
    ) {
      return 'LUXURY';
    }

    // 4. Pretty / Special Tier (200 - 5,000 Diamonds)
    if (
      cost >= 200 ||
      cat === 'pretty' ||
      cat === 'rare' ||
      giftId === 'gift_diamond_ring' ||
      giftId === 'gift_diamond_necklace' ||
      giftId === 'gift_jewelry_box' ||
      giftId === 'gift_royal_stallion' ||
      giftId === 'gift_majestic_peacock'
    ) {
      return 'PRETTY';
    }

    // 5. Common Tier (5 - 100 Diamonds)
    return 'COMMON';
  }, []);

  // Helper to find exact mic center or lower edge within container
  const findMicCenter = useCallback(
    (userId: string, isSender: boolean, container: HTMLElement, containerRect: DOMRect): Point | null => {
      if (!userId) return null;

      let seatElement: HTMLElement | null = null;

      // 1. Search directly in seats array if provided
      if (seats && seats.length > 0) {
        const foundSeat = seats.find(s => s.userId === userId);
        if (foundSeat) {
          seatElement =
            container.querySelector(`#mic-seat-circle-${foundSeat.seatIndex}`) ||
            (container.querySelector(`#mic-seat-wrapper-${foundSeat.seatIndex}`) as HTMLElement | null);
        }
      }

      // 2. Query DOM by seat user ID attribute
      if (!seatElement) {
        seatElement =
          container.querySelector(`[id^="mic-seat-circle-"][data-seat-user-id="${userId}"]`) ||
          container.querySelector(`[data-seat-user-id="${userId}"] [id^="mic-seat-circle-"]`) ||
          (container.querySelector(`[data-seat-user-id="${userId}"]`) as HTMLElement | null) ||
          (container.querySelector(`[data-user-id="${userId}"]`) as HTMLElement | null);
      }

      // 3. Check for host element if user is host
      if (!seatElement && userId === hostUserId) {
        seatElement =
          container.querySelector('#mic-seat-circle-0') ||
          container.querySelector('#room-host-card') ||
          (container.querySelector('[data-host-avatar]') as HTMLElement | null);
      }

      if (seatElement) {
        const circleEl =
          seatElement.querySelector('[id^="mic-seat-circle-"]') ||
          seatElement.querySelector('img') ||
          seatElement;
        const rect = circleEl.getBoundingClientRect();

        // Exact center coordinates inside the container
        const centerX = Math.round(rect.left + rect.width / 2 - containerRect.left);
        // If sender: starts inside/lower part of the mic circle (0.58)
        // If receiver: ends exactly at the center of the mic circle (0.5)
        const centerY = Math.round(
          rect.top + (isSender ? rect.height * 0.58 : rect.height * 0.5) - containerRect.top
        );

        // Clamped inside visible bounds so it never renders off-screen or outside container
        return {
          x: Math.max(26, Math.min(containerRect.width - 26, centerX)),
          y: Math.max(26, Math.min(containerRect.height - 26, centerY))
        };
      }

      return null;
    },
    [hostUserId, seats]
  );

  // Dynamic coordinate resolver for direct trajectory from Sender Mic to Receiver Mic
  const resolveCoordinates = useCallback(
    (item: GiftTrajectoryItem) => {
      const defaultCoords = {
        start: { x: 180, y: 520 },
        target: { x: 180, y: 150 }
      };

      if (!containerRef.current) return defaultCoords;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const width = containerRect.width || 360;
      const height = containerRect.height || 640;

      // 1. Resolve Sender Coordinate (Start Point)
      // Must start from inside/lower portion of the sender's mic
      // Never starts off-screen or from outside
      let startPoint: Point | null = findMicCenter(item.senderId, true, container, containerRect);

      if (!startPoint) {
        if (item.senderId === currentUserId) {
          // Audience member sending gift from bottom gift button
          const giftBtnEl = container.querySelector('#bottom-gift-btn') || container.querySelector('#room-bottom-toolbar');
          if (giftBtnEl) {
            const rect = giftBtnEl.getBoundingClientRect();
            startPoint = {
              x: Math.round(rect.left + rect.width / 2 - containerRect.left),
              y: Math.round(rect.top + rect.height * 0.5 - containerRect.top)
            };
          }
        }
      }

      if (!startPoint) {
        startPoint = { x: Math.round(width * 0.5), y: Math.round(height - 70) };
      }

      // Clamp start point inside container bounds
      startPoint = {
        x: Math.max(28, Math.min(width - 28, startPoint.x)),
        y: Math.max(28, Math.min(height - 28, startPoint.y))
      };

      // 2. Resolve Receiver Coordinate (Target Point)
      // Must end EXACTLY at the center of the receiver's mic
      let targetPoint: Point | null = null;

      if (item.receiverId === 'ALL_MICS') {
        const micStage = container.querySelector('#mic-stage-grid') || container.querySelector('[data-stage-container]');
        if (micStage) {
          const rect = micStage.getBoundingClientRect();
          targetPoint = {
            x: Math.round(rect.left + rect.width / 2 - containerRect.left),
            y: Math.round(rect.top + rect.height * 0.45 - containerRect.top)
          };
        } else {
          targetPoint = {
            x: Math.round(width * 0.5),
            y: Math.round(Math.max(160, height * 0.3))
          };
        }
      } else {
        targetPoint = findMicCenter(item.receiverId, false, container, containerRect);
      }

      if (!targetPoint) {
        // Fallback to host mic if specific receiver mic is not resolved
        const hostSeat = container.querySelector('#mic-seat-circle-0') || container.querySelector('#room-host-card');
        if (hostSeat) {
          const rect = hostSeat.getBoundingClientRect();
          targetPoint = {
            x: Math.round(rect.left + rect.width / 2 - containerRect.left),
            y: Math.round(rect.top + rect.height * 0.5 - containerRect.top)
          };
        } else {
          targetPoint = { x: Math.round(width * 0.5), y: Math.round(height * 0.28) };
        }
      }

      // Clamp target point inside container bounds
      targetPoint = {
        x: Math.max(28, Math.min(width - 28, targetPoint.x)),
        y: Math.max(28, Math.min(height - 28, targetPoint.y))
      };

      return {
        start: startPoint,
        target: targetPoint
      };
    },
    [containerRef, currentUserId, findMicCenter]
  );

  // Priority Queue Manager
  useEffect(() => {
    if (queue.length === 0 || processingRef.current) return;

    // Check if a high-tier gift (VIP / Legendary) is already active
    const isHeroActive = activeFlights.some(f => f.tier === 'VIP' || f.tier === 'LEGENDARY');
    if (isHeroActive) return;

    // Find next gift to schedule
    const nextItem = queue[0];
    const tier = resolveTier(nextItem);

    // Limit concurrent low-tier flights to max 2 for optimal clarity
    if ((tier === 'COMMON' || tier === 'PRETTY') && activeFlights.length >= 2) {
      return;
    }

    // High tiers command singular screen focus
    if ((tier === 'VIP' || tier === 'LEGENDARY' || tier === 'LUXURY') && activeFlights.length > 0) {
      return;
    }

    processingRef.current = true;
    const resolvedCoords = resolveCoordinates(nextItem);
    const tierConfig = TIER_DEFAULTS[tier];

    const newFlight: ActiveFlight = {
      item: nextItem,
      tier,
      coords: resolvedCoords,
      duration: tierConfig.duration
    };

    setActiveFlights(prev => [...prev, newFlight]);

    // Play subtle, quiet gift chime (بدون أي موسيقى خلفية على الإطلاق)
    soundEffects.playGiftSound(tier, nextItem.diamondCost || 0);

    processingRef.current = false;
  }, [queue, activeFlights, resolveTier, resolveCoordinates]);

  // Handle completion of a flight
  const handleFlightComplete = (flight: ActiveFlight) => {
    // 1. Trigger Impact Effect at Recipient's Seat Coordinates
    const impactId = `impact_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setImpactList(prev => [
      ...prev,
      {
        id: impactId,
        x: flight.coords.target.x,
        y: flight.coords.target.y,
        tier: flight.tier,
        giftId: flight.item.giftId,
        icon: flight.item.giftIcon
      }
    ]);

    // 2. Play subtle arrival impact chime
    soundEffects.playArrivalImpact(flight.tier);

    // 3. Trigger recipient seat highlight pulse
    if (onArrivalImpact) {
      onArrivalImpact(flight.item.receiverId);
    }

    // 4. Subtle localized sparkle burst for VIP & Legendary upon landing at recipient mic
    if (flight.tier === 'VIP' || flight.tier === 'LEGENDARY') {
      try {
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const originX = (rect.left + flight.coords.target.x) / window.innerWidth;
          const originY = (rect.top + flight.coords.target.y) / window.innerHeight;
          confetti({
            particleCount: flight.tier === 'VIP' ? 30 : 18,
            spread: 55,
            origin: { x: originX, y: originY },
            colors: ['#FBBF24', '#F59E0B', '#38BDF8', '#FFFFFF'],
            disableForReducedMotion: true
          });
        }
      } catch {}
    }

    // 5. Remove impact effect after 800ms
    setTimeout(() => {
      setImpactList(prev => prev.filter(imp => imp.id !== impactId));
    }, 800);

    // 6. Remove flight from active list & pop queue
    setActiveFlights(prev => prev.filter(f => f.item.id !== flight.item.id));
    onItemFinished(flight.item.id);
  };

  if (activeFlights.length === 0 && impactList.length === 0) {
    return null;
  }

  const GIFT_BOX_SIZE = 54;
  const halfBox = GIFT_BOX_SIZE / 2;

  return (
    <div
      id="grand-luxury-gift-stage"
      className="absolute inset-0 z-50 pointer-events-none overflow-hidden select-none"
    >
      {/* 1. TOP PRESTIGE BANNER (Shown for Luxury, Legendary, and VIP) */}
      <AnimatePresence>
        {activeFlights.map(flight => {
          if (flight.tier === 'COMMON') return null;

          const isVip = flight.tier === 'VIP';
          const isLeg = flight.tier === 'LEGENDARY';
          const isLux = flight.tier === 'LUXURY';
          const senderAvatar =
            flight.item.senderAvatar ||
            `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(flight.item.senderName || 'user')}`;
          const receiverAvatar =
            flight.item.receiverAvatar ||
            `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(flight.item.receiverName || 'receiver')}`;
          const isAllMics = flight.item.receiverId === 'ALL_MICS';

          return (
            <motion.div
              key={`banner_${flight.item.id}`}
              initial={{ y: -50, opacity: 0, scale: 0.9 }}
              animate={{
                y: [-50, 0, 0, -40],
                opacity: [0, 1, 1, 0],
                scale: [0.9, 1, 1, 0.95]
              }}
              transition={{
                duration: flight.duration,
                times: [0, 0.12, 0.88, 1],
                ease: 'easeInOut'
              }}
              className="absolute top-14 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 rounded-full backdrop-blur-xl shadow-xl flex items-center gap-2.5 max-w-[92vw] sm:max-w-sm border"
              style={{
                background: isVip
                  ? 'linear-gradient(135deg, rgba(20, 10, 35, 0.95) 0%, rgba(120, 53, 15, 0.92) 50%, rgba(20, 10, 35, 0.95) 100%)'
                  : isLeg
                  ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(88, 28, 135, 0.92) 50%, rgba(15, 23, 42, 0.95) 100%)'
                  : isLux
                  ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.94) 0%, rgba(120, 53, 15, 0.9) 100%)'
                  : 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.9) 100%)',
                borderColor: isVip ? '#FDE047' : isLeg ? '#FACC15' : isLux ? '#F59E0B' : '#38BDF8',
                boxShadow: isVip
                  ? '0 4px 20px rgba(253, 224, 71, 0.4)'
                  : isLeg
                  ? '0 4px 18px rgba(250, 204, 21, 0.35)'
                  : '0 4px 15px rgba(0, 0, 0, 0.6)'
              }}
            >
              {/* Sender Section */}
              <div className="flex items-center gap-1.5 min-w-0">
                <img
                  src={senderAvatar}
                  alt={flight.item.senderName}
                  className="w-6 h-6 rounded-full object-cover border border-amber-400 shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <span className="text-[11px] font-bold text-amber-300 truncate max-w-[70px]">
                  {flight.item.senderName}
                </span>
              </div>

              {/* Action */}
              <div className="flex items-center gap-1 text-[10px] font-black text-yellow-300 shrink-0">
                <span className="text-slate-400 font-normal">أرسل</span>
                <span className="text-amber-300 font-black">{flight.item.giftName}</span>
                <span className="text-slate-400 font-normal">إلى</span>
              </div>

              {/* Receiver Section */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[11px] font-bold text-yellow-300 truncate max-w-[70px]">
                  {isAllMics ? 'الجميع 🎙️' : flight.item.receiverName}
                </span>
                {!isAllMics ? (
                  <img
                    src={receiverAvatar}
                    alt={flight.item.receiverName}
                    className="w-6 h-6 rounded-full object-cover border border-yellow-400 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-slate-950">
                    <Users className="w-3.5 h-3.5 text-slate-950" />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* 2. CONTINUOUS SMOOTH FLIGHT: DIRECT FROM SENDER MIC TO EXACT CENTER OF RECEIVER MIC */}
      <AnimatePresence>
        {activeFlights.map(flight => {
          const { start, target } = flight.coords;

          return (
            <motion.div
              key={`flight_${flight.item.id}`}
              initial={{
                x: start.x - halfBox,
                y: start.y - halfBox,
                scale: 0.45,
                opacity: 0
              }}
              animate={{
                x: [start.x - halfBox, target.x - halfBox],
                y: [start.y - halfBox, target.y - halfBox],
                // لا تكبر الهدية بشكل مبالغ فيه: تبدأ بـ 0.45 من داخل مايك المرسل وتستقر عند 1.0 وتنتهي عند 0.35 بمنتصف مايك المستلم
                scale: [0.45, 1.0, 1.0, 0.35],
                opacity: [0, 1.0, 1.0, 0]
              }}
              transition={{
                x: {
                  duration: flight.duration,
                  ease: [0.25, 0.1, 0.25, 1.0]
                },
                y: {
                  duration: flight.duration,
                  ease: [0.25, 0.1, 0.25, 1.0]
                },
                scale: {
                  duration: flight.duration,
                  times: [0, 0.12, 0.88, 1.0],
                  ease: 'easeInOut'
                },
                opacity: {
                  duration: flight.duration,
                  times: [0, 0.08, 0.92, 1.0],
                  ease: 'easeInOut'
                }
              }}
              onAnimationComplete={() => handleFlightComplete(flight)}
              className="absolute top-0 left-0 pointer-events-none z-50 flex items-center justify-center select-none"
              style={{ width: GIFT_BOX_SIZE, height: GIFT_BOX_SIZE }}
            >
              {/* Compact 3D Gift Visual (يحافظ على تصميم الهدية الحالي دون تعديل) */}
              <GiftVisualRenderer
                giftId={flight.item.giftId}
                icon={flight.item.giftIcon}
                giftName={flight.item.giftName}
                tier={flight.tier}
                size="md"
                showAura={false}
              />

              {/* Combo Multiplier Badge if count > 1 */}
              {flight.item.count > 1 && (
                <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full font-black text-[9px] bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md border border-white flex items-center gap-0.5">
                  <Flame className="w-2.5 h-2.5 fill-current" />
                  <span>{flight.item.count}x</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* 3. ARRIVAL IMPACT SHOCKWAVES AT RECIPIENT MIC */}
      <AnimatePresence>
        {impactList.map(impact => (
          <motion.div
            key={impact.id}
            initial={{ opacity: 0.9, scale: 0.4 }}
            animate={{
              opacity: 0,
              scale:
                impact.tier === 'VIP'
                  ? 1.9
                  : impact.tier === 'LEGENDARY'
                  ? 1.8
                  : impact.tier === 'LUXURY'
                  ? 1.7
                  : 1.5
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="absolute pointer-events-none z-50 flex items-center justify-center"
            style={{
              left: impact.x - 30,
              top: impact.y - 30,
              width: 60,
              height: 60
            }}
          >
            {/* Expanding Radial Ring Around Target Mic */}
            <div
              className={`w-full h-full rounded-full border-2 ${
                impact.tier === 'VIP'
                  ? 'border-yellow-300 bg-yellow-300/30 shadow-[0_0_20px_rgba(253,224,71,0.8)]'
                  : impact.tier === 'LEGENDARY'
                  ? 'border-yellow-400 bg-yellow-400/25 shadow-[0_0_16px_rgba(250,204,21,0.7)]'
                  : impact.tier === 'LUXURY'
                  ? 'border-amber-400 bg-amber-400/20 shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                  : 'border-amber-400/70 bg-amber-400/10 shadow-[0_0_8px_rgba(251,191,36,0.4)]'
              }`}
            />

            {/* Sparkle particle bursts */}
            <Sparkles className="absolute -top-2 w-3.5 h-3.5 text-yellow-300 animate-ping" />
            <Star className="absolute -bottom-2 w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-ping" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
