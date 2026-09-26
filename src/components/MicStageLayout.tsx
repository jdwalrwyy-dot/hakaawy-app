import React from 'react';
import { RoomSeat, User, MicLayoutType } from '../types';
import { MicSeat } from './MicSeat';
import { Users, X, Sparkles, Mic } from 'lucide-react';

interface MicStageLayoutProps {
  seats: RoomSeat[];
  layoutMode?: MicLayoutType;
  currentUser: User | null;
  isHost: boolean;
  celebratingUserIds: string[];
  selectedGiftReceiverId?: string;
  isGiftsOpen: boolean;
  isCameraActive: boolean;
  onSeatClick: (seat: RoomSeat) => void;
  onHostAction?: (action: 'mute_seat' | 'kick_seat' | 'lock_seat', seat: RoomSeat) => void;
  localVideoElement?: React.ReactNode;
  onLayoutChange?: (newLayout: MicLayoutType) => void;
  viewerCount?: number;
  onOpenMembers?: () => void;
  onExitClick?: () => void;
  onChangeFrameUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  pendingMicRequestsCount?: number;
  onOpenMicRequests?: () => void;
  roomTitle?: string;
}

export const MicStageLayout: React.FC<MicStageLayoutProps> = ({
  seats,
  layoutMode = '2+10',
  currentUser,
  isHost,
  celebratingUserIds,
  selectedGiftReceiverId,
  isGiftsOpen,
  isCameraActive,
  onSeatClick,
  onHostAction,
  localVideoElement,
  onLayoutChange,
  viewerCount,
  onOpenMembers,
  onExitClick,
  onChangeFrameUpload,
  pendingMicRequestsCount,
  onOpenMicRequests,
  roomTitle
}) => {
  // Determine effective layout mode (defaulting to 2+15 for 17 seats)
  let effectiveMode: MicLayoutType = (layoutMode as MicLayoutType) || '2+15';
  if (effectiveMode === 'auto' || !effectiveMode) {
    if (seats.length >= 17) effectiveMode = '2+15';
    else if (seats.length >= 12) effectiveMode = '2+10';
    else if (seats.length === 15) effectiveMode = '15';
    else if (seats.length === 10) effectiveMode = '10';
    else if (seats.length === 8) effectiveMode = '8';
    else if (seats.length === 4) effectiveMode = '4';
    else if (seats.length <= 5) effectiveMode = '5';
    else effectiveMode = '2+15';
  }

  // Normalize seats array to ensure required count of seats exist
  const normalizedSeats: RoomSeat[] = [...seats];
  const requiredCount =
    effectiveMode === '2+15' ? 17 :
    effectiveMode === '2+10' || effectiveMode === '12' ? 12 :
    effectiveMode === '15' ? 15 :
    effectiveMode === '10' ? 10 :
    effectiveMode === '8' ? 8 :
    effectiveMode === '5' ? 5 : 4;

  while (normalizedSeats.length < requiredCount) {
    const idx = normalizedSeats.length;
    const isVipLayout = effectiveMode === '2+15' || effectiveMode === '2+10' || effectiveMode === '12';
    const displayIndex = isVipLayout ? (idx === 1 ? 'VIP' : idx - 1) : idx + 1;
    
    normalizedSeats.push({
      seatIndex: idx,
      userId: null,
      isMuted: false,
      isCameraOn: false,
      isSpeaking: false,
      isLocked: false,
      isHostSeat: idx === 0,
      isVipSeat: isVipLayout && idx === 1,
      seatLabel: idx === 0 ? 'المضيف 👑' : (isVipLayout && idx === 1) ? 'VIP 🌟' : `مايك ${displayIndex}`
    });
  }

  // Helper to render a seat safely
  const renderSeat = (seat: RoomSeat, variant: 'vip' | 'standard' | 'compact' = 'standard') => {
    return (
      <MicSeat
        key={seat.seatIndex}
        seat={seat}
        currentUser={currentUser}
        isHost={isHost}
        variant={variant}
        isCurrentUserSeatedHere={seat.userId === currentUser?.id}
        isCelebrating={Boolean(seat.userId && celebratingUserIds.includes(seat.userId))}
        isSelectedRecipient={Boolean(isGiftsOpen && seat.userId && selectedGiftReceiverId === seat.userId)}
        onSeatClick={onSeatClick}
        onHostAction={onHostAction}
        localVideoElement={
          isCameraActive && seat.userId === currentUser?.id ? localVideoElement : null
        }
      />
    );
  };

  const occupiedSeatsCount = normalizedSeats.filter(s => s.userId).length;

  return (
    <div className="w-full bg-slate-900/75 sm:bg-slate-900/65 backdrop-blur-md rounded-2xl sm:rounded-3xl p-1.5 xs:p-2 sm:p-2.5 border border-blue-500/30 shadow-2xl shadow-blue-950/20 flex flex-col gap-0.5 xs:gap-1 sm:gap-1.5 transition-all">
      {/* --- SEATS RENDERING BY LAYOUT MODE --- */}

      {/* CASE 1: 2 VIP TOP ROW + 3 ROWS OF 5 MICS (17 Seats Total) OR 2+10 (12 Seats) */}
      {(effectiveMode === '2+10' || effectiveMode === '12' || effectiveMode === '2+15') && (
        <div className="flex flex-col gap-0.5 xs:gap-1 sm:gap-1.5 w-full">
          {/* VIP Top Row: Pure 2 VIP Mics without side control icons */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 w-full py-0.5">
            {normalizedSeats[0] && renderSeat(normalizedSeats[0], 'vip')}
            {normalizedSeats[1] && renderSeat(normalizedSeats[1], 'vip')}
          </div>

          {/* Row 1 of 5 (Seats 2 to 6 -> مايك 1 إلى مايك 5) */}
          <div className="grid grid-cols-5 gap-0.5 xs:gap-1 sm:gap-1.5 justify-items-center items-start w-full">
            {normalizedSeats.slice(2, 7).map(seat => renderSeat(seat, 'compact'))}
          </div>

          {/* Row 2 of 5 (Seats 7 to 11 -> مايك 6 إلى مايك 10) */}
          <div className="grid grid-cols-5 gap-0.5 xs:gap-1 sm:gap-1.5 justify-items-center items-start w-full">
            {normalizedSeats.slice(7, 12).map(seat => renderSeat(seat, 'compact'))}
          </div>

          {/* Row 3 of 5 (Seats 12 to 16 -> مايك 11 إلى مايك 15) */}
          {effectiveMode === '2+15' && (
            <div className="grid grid-cols-5 gap-0.5 xs:gap-1 sm:gap-1.5 justify-items-center items-start w-full">
              {normalizedSeats.slice(12, 17).map(seat => renderSeat(seat, 'compact'))}
            </div>
          )}
        </div>
      )}

      {/* CASE 2: 10 SEATS (5 + 5 Layout) */}
      {effectiveMode === '10' && (
        <div className="flex flex-col gap-1.5 sm:gap-2.5 w-full">
          {/* Row 1 (Seats 0 to 4) */}
          <div className="grid grid-cols-5 gap-0.5 xs:gap-1 sm:gap-2 justify-items-center items-start w-full">
            {normalizedSeats.slice(0, 5).map(seat => renderSeat(seat, 'standard'))}
          </div>

          {/* Row 2 (Seats 5 to 9) */}
          <div className="grid grid-cols-5 gap-0.5 xs:gap-1 sm:gap-2 justify-items-center items-start w-full">
            {normalizedSeats.slice(5, 10).map(seat => renderSeat(seat, 'standard'))}
          </div>
        </div>
      )}

      {/* CASE 3: 15 SEATS (5 + 5 + 5 Layout) */}
      {effectiveMode === '15' && (
        <div className="flex flex-col gap-2 sm:gap-2.5 w-full">
          {/* Row 1 (Seats 0 to 4) */}
          <div className="grid grid-cols-5 gap-1 xs:gap-1.5 sm:gap-2.5 justify-items-center items-start w-full">
            {seats.slice(0, 5).map(seat => renderSeat(seat, 'standard'))}
          </div>

          {/* Row 2 (Seats 5 to 9) */}
          <div className="grid grid-cols-5 gap-1 xs:gap-1.5 sm:gap-2.5 justify-items-center items-start w-full">
            {seats.slice(5, 10).map(seat => renderSeat(seat, 'standard'))}
          </div>

          {/* Row 3 (Seats 10 to 14) */}
          <div className="grid grid-cols-5 gap-1 xs:gap-1.5 sm:gap-2.5 justify-items-center items-start w-full">
            {seats.slice(10, 15).map(seat => renderSeat(seat, 'standard'))}
          </div>
        </div>
      )}

      {/* CASE 4: 5 SEATS (Single 5-Col Row) */}
      {effectiveMode === '5' && (
        <div className="py-1 w-full">
          <div className="grid grid-cols-5 gap-1 xs:gap-1.5 sm:gap-2.5 justify-items-center items-start w-full">
            {seats.slice(0, 5).map(seat => renderSeat(seat, 'standard'))}
          </div>
        </div>
      )}

      {/* CASE 5: 8 SEATS (4 + 4 Classic Layout) */}
      {effectiveMode === '8' && (
        <div className="flex flex-col gap-2 sm:gap-3 w-full">
          {/* Row 1 (Seats 0 to 3) */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 justify-items-center items-start w-full">
            {seats.slice(0, 4).map(seat => renderSeat(seat, 'standard'))}
          </div>

          {/* Row 2 (Seats 4 to 7) */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 justify-items-center items-start w-full">
            {seats.slice(4, 8).map(seat => renderSeat(seat, 'standard'))}
          </div>
        </div>
      )}

      {/* CASE 6: 4 SEATS (Single 4-Col Row) */}
      {effectiveMode === '4' && (
        <div className="py-1 w-full">
          <div className="grid grid-cols-4 gap-2 sm:gap-3 justify-items-center items-start w-full">
            {seats.slice(0, 4).map(seat => renderSeat(seat, 'standard'))}
          </div>
        </div>
      )}
    </div>
  );
};
