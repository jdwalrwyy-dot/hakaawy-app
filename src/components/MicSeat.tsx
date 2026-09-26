import React, { useState } from 'react';
import { RoomSeat, User } from '../types';
import { Mic, MicOff, Lock, Crown, Plus, Video, Volume2, ShieldAlert, VolumeX, Ban, UserX, Sparkles, Star } from 'lucide-react';
import { Avatar4DFrame } from './Avatar4DFrame';
import { UserRoleBadges } from './RoleBadge';

interface MicSeatProps {
  seat: RoomSeat;
  currentUser: User | null;
  isHost: boolean;
  isCurrentUserSeatedHere: boolean;
  frameStyle?: string;
  isCelebrating?: boolean;
  isSelectedRecipient?: boolean;
  variant?: 'vip' | 'standard' | 'compact';
  onSeatClick: (seat: RoomSeat) => void;
  onHostAction?: (action: 'mute_seat' | 'kick_seat' | 'lock_seat', seat: RoomSeat) => void;
  onUpdateFrame?: (url: string) => void;
  localVideoElement?: React.ReactNode;
}

export const MicSeat: React.FC<MicSeatProps> = ({
  seat,
  currentUser,
  isHost,
  isCurrentUserSeatedHere,
  frameStyle,
  isCelebrating,
  isSelectedRecipient,
  variant = 'standard',
  onSeatClick,
  onHostAction,
  localVideoElement
}) => {
  const [showHostMenu, setShowHostMenu] = useState(false);
  const isOccupied = Boolean(seat.userId);
  const isVip = variant === 'vip' || seat.isVipSeat || seat.isHostSeat;

  // Responsive circle dimension classes (Uniform & Compact for 17 seats layout)
  const circleSizeClass =
    variant === 'vip'
      ? 'w-11 h-11 xs:w-12 xs:h-12 sm:w-13 sm:h-13'
      : variant === 'compact'
      ? 'w-[38px] h-[38px] xs:w-[42px] xs:h-[42px] sm:w-11 sm:h-11'
      : 'w-10 h-10 xs:w-[44px] xs:h-[44px] sm:w-12 sm:h-12';

  const maxTextWidth = 'max-w-[48px] xs:max-w-[56px] sm:max-w-[70px]';

  return (
    <div
      id={`mic-seat-wrapper-${seat.seatIndex}`}
      data-seat-index={seat.seatIndex}
      data-seat-user-id={seat.userId || ''}
      data-user-id={seat.userId || ''}
      className="relative flex flex-col items-center justify-center group flex-shrink-0 my-0.5"
    >
      {/* Seat Circular Container */}
      <div
        id={`mic-seat-circle-${seat.seatIndex}`}
        data-seat-user-id={seat.userId || ''}
        onClick={() => onSeatClick(seat)}
        onContextMenu={(e) => {
          if (isHost && isOccupied && onHostAction) {
            e.preventDefault();
            setShowHostMenu(true);
          }
        }}
        className={`relative ${circleSizeClass} rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 select-none ${
          isOccupied
            ? isCelebrating
              ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-slate-950 scale-105 shadow-[0_0_15px_rgba(250,204,21,0.8)] animate-pulse z-10'
              : isSelectedRecipient
              ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-950 scale-105 shadow-[0_0_12px_rgba(251,191,36,0.8)] z-10'
              : seat.isSpeaking && !seat.isMuted
              ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-950 scale-105 shadow-[0_0_10px_rgba(251,191,36,0.6)] z-10'
              : isVip
              ? 'ring-2 ring-amber-500/80 hover:ring-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
              : 'ring-1.5 ring-slate-700/80 hover:ring-amber-400/60'
            : seat.isLocked
            ? 'bg-slate-900/60 border border-slate-800 border-dashed text-slate-600'
            : isVip
            ? 'bg-gradient-to-b from-slate-900/90 to-amber-950/40 hover:bg-slate-800 border border-amber-500/40 hover:border-amber-400 text-amber-400/70 hover:text-amber-300'
            : 'bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-400 text-slate-400 hover:text-amber-300'
        }`}
      >
        {isOccupied ? (
          <>
            {/* Camera Video Stream or User Avatar */}
            {seat.isCameraOn && isCurrentUserSeatedHere && localVideoElement ? (
              <div className="w-full h-full rounded-full overflow-hidden">
                {localVideoElement}
              </div>
            ) : (
              <Avatar4DFrame
                avatarUrl={seat.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${seat.userId}`}
                frameId={seat.userFrameId || null}
                customFrameUrl={(seat as any).customFrameUrl || (seat.userFrameId?.startsWith('data:') ? seat.userFrameId : null) || (seat.userId === currentUser?.id ? (localStorage.getItem('user_custom_mic_frame') || null) : null)}
                size={variant === 'vip' ? 'lg' : variant === 'compact' ? 'sm' : 'md'}
                showEffects={Boolean(seat.isSpeaking || isCelebrating || isSelectedRecipient)}
                isMuted={Boolean(seat.isMuted)}
              />
            )}

            {/* Selected Recipient Target Badge */}
            {isSelectedRecipient && (
              <div className="absolute -top-2.5 inset-x-0 mx-auto w-max px-1.5 py-0.2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 rounded-full font-black text-[9px] shadow-lg flex items-center gap-0.5 animate-pulse z-20">
                <span>🎯 المستلم</span>
              </div>
            )}

            {/* Speaking animated wave ring */}
            {seat.isSpeaking && !seat.isMuted && (
              <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-60 pointer-events-none" />
            )}

            {/* VIP Star Badge for Co-Host / VIP seat (when not host) */}
            {!seat.isHostSeat && seat.isVipSeat && (
              <div className="absolute -top-1.5 -right-1 p-0.5 sm:p-1 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full text-white shadow-md z-20">
                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
              </div>
            )}

            {/* Gift Celebration Sparkle Badge */}
            {isCelebrating && (
              <div className="absolute -top-3 -left-1 text-base animate-bounce shadow-lg z-20" title="تلقى هدية!">
                🎁✨
              </div>
            )}

            {/* Camera On Badge */}
            {seat.isCameraOn && !isCelebrating && (
              <div className="absolute -top-1 -left-1 p-0.5 sm:p-1 bg-cyan-500 rounded-full text-slate-950 shadow-md z-20" title="الكاميرا تعمل">
                <Video className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </div>
            )}

            {/* Mic Status Icon Badge & Interactive Seat Mute/Unmute Button */}
            <div className="absolute -bottom-1 inset-x-0 mx-auto w-max flex items-center justify-center z-30">
              {seat.isMuted ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isCurrentUserSeatedHere || isHost) {
                      onHostAction ? onHostAction('mute_seat', seat) : null;
                    }
                  }}
                  className="p-1 rounded-full bg-rose-600 text-white shadow-lg ring-2 ring-rose-500 animate-pulse hover:scale-110 transition-transform cursor-pointer flex items-center justify-center"
                  title="المايك مكتوم (انقر لإلغاء كتم المايك)"
                >
                  <MicOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </button>
              ) : seat.isSpeaking ? (
                <div className="p-0.5 sm:p-1 rounded-full bg-emerald-500 text-slate-950 shadow-md animate-bounce" title="يتحدث الآن">
                  <Volume2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    if (isCurrentUserSeatedHere || isHost) {
                      e.stopPropagation();
                      onHostAction ? onHostAction('mute_seat', seat) : null;
                    }
                  }}
                  className="p-0.5 sm:p-1 rounded-full bg-slate-900/90 text-emerald-400 border border-slate-700 hover:border-amber-400 shadow-md hover:scale-110 transition-transform cursor-pointer"
                  title="المايك يعمل (انقر لكتم المايك)"
                >
                  <Mic className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </button>
              )}
            </div>
          </>
        ) : seat.isLocked ? (
          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
        ) : (
          <div className="flex flex-col items-center justify-center">
            <Plus className={`${variant === 'vip' ? 'w-5 h-5 text-amber-400' : 'w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400'} group-hover:text-amber-400 group-hover:scale-110 transition-transform`} />
            <span className={`text-[9px] sm:text-[10px] font-bold ${variant === 'vip' ? 'text-amber-300' : 'text-slate-400'} group-hover:text-amber-300 mt-0.5`}>
              {seat.seatLabel || (variant === 'vip' ? (seat.seatIndex === 0 ? 'المضيف' : 'VIP') : `مايك ${seat.seatIndex + 1}`)}
            </span>
          </div>
        )}
      </div>

      {/* Support / Gift Points Pill directly under Avatar */}
      {isOccupied && (
        <div className="mt-0.5 px-1.5 py-0.2 rounded-full bg-slate-950/80 text-amber-300 border border-amber-500/30 text-[8px] sm:text-[9px] font-black flex items-center gap-0.5 shadow-sm">
          <span>💎</span>
          <span>{(seat as any).giftPoints || 0}</span>
        </div>
      )}

      {/* User Name & Badges */}
      <div className={`mt-0.5 flex flex-col items-center ${maxTextWidth}`}>
        <div className="flex items-center justify-center gap-0.5 w-full">
          {isOccupied && (
            <UserRoleBadges
              user={{
                id: seat.userId,
                name: seat.userName,
                isHost: seat.isHostSeat,
                roleInRoom: seat.isHostSeat ? 'HOST' : undefined
              }}
              size="xs"
            />
          )}
          <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-100 truncate text-center leading-tight">
            {isOccupied ? seat.userName : (seat.seatLabel || `مايك ${seat.seatIndex + 1}`)}
          </span>
          {isOccupied && seat.userGender && (
            <span
              className={`inline-flex items-center justify-center w-2.5 h-2.5 rounded-full shrink-0 text-[7px] font-black shadow-sm ${
                seat.userGender === 'male'
                  ? 'bg-blue-500 text-white'
                  : 'bg-rose-500 text-white'
              }`}
              title={seat.userGender === 'male' ? 'ذكر 🔵' : 'أنثى 🔴'}
            >
              {seat.userGender === 'male' ? '♂' : '♀'}
            </span>
          )}
        </div>
        {isOccupied && seat.isHostSeat && (
          <span className="text-[7px] font-extrabold text-amber-300 bg-amber-500/15 px-1 rounded border border-amber-500/30 mt-0.5 truncate max-w-full">
            مالك 👑
          </span>
        )}
        {isOccupied && !seat.isHostSeat && seat.isVipSeat && (
          <span className="text-[7px] font-extrabold text-purple-300 bg-purple-500/15 px-1 rounded border border-purple-500/30 mt-0.5 truncate max-w-full">
            VIP 🌟
          </span>
        )}
      </div>

      {/* Host Control Quick Popover for this Seat */}
      {showHostMenu && isHost && onHostAction && isOccupied && (
        <div className="absolute -top-24 z-50 bg-slate-900 border border-amber-500/40 rounded-xl p-1.5 shadow-2xl shadow-slate-950 flex flex-col gap-1 min-w-[130px] animate-in fade-in zoom-in-95 duration-150">
          <div className="text-[10px] text-amber-300 font-bold px-1.5 py-0.5 border-b border-slate-800 flex items-center justify-between">
            <span className="truncate">{seat.userName}</span>
            <button onClick={() => setShowHostMenu(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setShowHostMenu(false); onHostAction('mute_seat', seat); }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-800 text-xs text-slate-200 text-right"
          >
            <VolumeX className="w-3.5 h-3.5 text-amber-400" />
            <span>كتم المايك</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowHostMenu(false); onHostAction('kick_seat', seat); }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-rose-950 text-xs text-rose-300 text-right"
          >
            <UserX className="w-3.5 h-3.5 text-rose-400" />
            <span>إنزال من المايك</span>
          </button>
        </div>
      )}
    </div>
  );
};
