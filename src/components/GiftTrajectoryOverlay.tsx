import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { RoomSeat } from '../types';
import { GiftVisualRenderer } from './GiftVisualRenderer';
import { Sparkles, Star } from 'lucide-react';

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

interface Coordinates {
  x: number;
  y: number;
}

/**
 * Calculates relative X, Y coordinates inside the room container
 */
function getElementCoordinates(
  targetUserId: string,
  containerEl: HTMLDivElement | null,
  isSender: boolean
): Coordinates {
  if (!containerEl) {
    return {
      x: typeof window !== 'undefined' ? window.innerWidth / 2 : 200,
      y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300
    };
  }

  const containerRect = containerEl.getBoundingClientRect();

  if (targetUserId && targetUserId !== 'ALL_MICS') {
    const targetEl =
      containerEl.querySelector(`[data-seat-user-id="${targetUserId}"]`) ||
      containerEl.querySelector(`[data-user-id="${targetUserId}"]`);

    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top + rect.height / 2 - containerRect.top
      };
    }
  }

  // Fallbacks if user is a listener / not seated on mic
  if (isSender) {
    return {
      x: containerRect.width / 2,
      y: containerRect.height - 70 // Bottom of room screen
    };
  }

  return {
    x: containerRect.width / 2,
    y: containerRect.height * 0.38 // Stage area
  };
}

/**
 * Single Continuous Arc Flight Trajectory Item
 * Smooth 1.35s parabolic curve passing through center (scaled to 1.5x) with zero pauses,
 * concluding with an instant sparkle impact on the receiver seat and immediate memory cleanup.
 */
const SingleTrajectoryItem: React.FC<{
  item: GiftTrajectoryItem;
  containerEl: HTMLDivElement | null;
  onItemFinished: (id: string) => void;
  onArrivalImpact?: (receiverId: string) => void;
}> = ({ item, containerEl, onItemFinished, onArrivalImpact }) => {
  const [showBurst, setShowBurst] = useState(false);

  // Measure start, mid (arc apex), and end coordinates
  const startCoords = useRef<Coordinates>(
    getElementCoordinates(item.senderId, containerEl, true)
  );

  const endCoords = useRef<Coordinates>(
    getElementCoordinates(item.receiverId, containerEl, false)
  );

  const containerRect = containerEl?.getBoundingClientRect();
  const containerH = containerRect?.height || (typeof window !== 'undefined' ? window.innerHeight : 600);

  // Calculate arc midpoint (curving upward through center)
  const midArcCoords = useRef<Coordinates>({
    x: (startCoords.current.x + endCoords.current.x) / 2,
    y: Math.min(startCoords.current.y, endCoords.current.y) > containerH * 0.45
      ? containerH * 0.32
      : Math.max(60, Math.min(startCoords.current.y, endCoords.current.y) - 110)
  });

  const handleFlightComplete = () => {
    setShowBurst(true);
    if (onArrivalImpact) {
      onArrivalImpact(item.receiverId);
    }

    // Clean up completely from DOM/memory immediately after quick 180ms burst
    setTimeout(() => {
      onItemFinished(item.id);
    }, 180);
  };

  return (
    <>
      {/* 1. Continuous Arc Flight Motion */}
      {!showBurst && (
        <motion.div
          key={`arc_${item.id}`}
          initial={{
            x: startCoords.current.x,
            y: startCoords.current.y,
            scale: 0.6,
            opacity: 0.3
          }}
          animate={{
            x: [startCoords.current.x, midArcCoords.current.x, endCoords.current.x],
            y: [startCoords.current.y, midArcCoords.current.y, endCoords.current.y],
            scale: [0.6, 1.5, 0.7],
            opacity: [0.3, 1, 0.95]
          }}
          transition={{
            duration: 1.35, // Smooth, agile 1.35-second continuous arc flight
            ease: [0.25, 0.1, 0.25, 1],
            times: [0, 0.5, 1]
          }}
          onAnimationComplete={handleFlightComplete}
          className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 flex flex-col items-center justify-center"
        >
          {/* Subtle Ambient Arc Light Halo */}
          <div className="absolute w-28 h-28 rounded-full bg-gradient-to-r from-amber-400/30 via-yellow-300/20 to-amber-500/30 blur-lg -z-10" />

          {/* Gift 3D / Visual Renderer */}
          <div className="filter drop-shadow-[0_8px_20px_rgba(251,191,36,0.7)]">
            <GiftVisualRenderer
              icon={item.giftIcon}
              giftName={item.giftName}
              size="hero"
            />
          </div>

          {/* Sleek Flying Tag Banner */}
          <div className="mt-1 px-2.5 py-0.5 rounded-full bg-slate-950/90 border border-amber-400/70 text-amber-300 font-extrabold text-[10px] shadow-lg flex items-center gap-1 whitespace-nowrap dir-rtl">
            <span className="text-white font-bold">{item.senderName}</span>
            <span className="text-amber-400">←</span>
            <span className="text-yellow-300 font-black">{item.count > 1 ? `${item.count}x ` : ''}{item.giftName}</span>
            <span className="text-amber-400">→</span>
            <span className="text-white font-bold">{item.receiverName}</span>
          </div>
        </motion.div>
      )}

      {/* 2. Quick Target Arrival Sparkle Burst (180ms) */}
      {showBurst && (
        <motion.div
          initial={{ opacity: 1, scale: 0.6 }}
          animate={{ opacity: 0, scale: 1.4 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          style={{
            left: endCoords.current.x,
            top: endCoords.current.y
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 flex items-center justify-center"
        >
          <div className="relative w-12 h-12 flex items-center justify-center">
            <Star className="w-10 h-10 text-amber-300 fill-amber-300" />
            <Sparkles className="absolute w-12 h-12 text-yellow-200 animate-ping" />
          </div>
        </motion.div>
      )}
    </>
  );
};

export const GiftTrajectoryOverlay: React.FC<GiftTrajectoryOverlayProps> = ({
  containerRef,
  queue,
  onItemFinished,
  onArrivalImpact
}) => {
  if (!queue || queue.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {queue.map(item => (
        <SingleTrajectoryItem
          key={item.id}
          item={item}
          containerEl={containerRef.current}
          onItemFinished={onItemFinished}
          onArrivalImpact={onArrivalImpact}
        />
      ))}
    </div>
  );
};
