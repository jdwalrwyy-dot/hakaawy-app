import React from 'react';
import { Room } from '../types';
import { Users, Lock, Mic, Video, Volume2 } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  onJoin: (room: Room) => void;
  layout?: 'grid' | 'list';
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onJoin, layout = 'grid' }) => {
  if (layout === 'list') {
    return (
      <div
        onClick={() => onJoin(room)}
        className="group relative bg-gradient-to-r from-[#fffbeb] via-[#fef3c7] to-[#fde68a] p-2.5 rounded-2xl border-2 border-amber-600/70 hover:border-amber-500 shadow-lg shadow-amber-500/20 transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 w-full"
      >
        {/* Left: Cover Image */}
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-amber-950 shrink-0 border border-amber-500/60">
          <img
            src={room.coverImage || room.hostAvatar}
            alt={room.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          <div className="absolute bottom-1 left-1 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-950/90 text-amber-300 text-[9px] font-black border border-amber-500/80">
            <Users className="w-2.5 h-2.5" />
            <span>{room.viewerCount || 1}</span>
          </div>
        </div>

        {/* Center: Avatar + Room Title Only */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <img
            src={room.hostAvatar}
            alt="رمز الغرفة"
            className="w-6 h-6 rounded-full object-cover border border-amber-600 shrink-0"
            referrerPolicy="no-referrer"
          />
          <h3 className="font-black text-xs sm:text-sm text-amber-950 group-hover:text-emerald-800 transition-colors truncate">
            {room.title}
          </h3>
        </div>

        {/* Right: Join CTA */}
        <div className="shrink-0">
          <button className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-800 text-amber-100 font-black text-xs border border-amber-300 shadow-md group-hover:scale-105 active:scale-95 transition-all flex items-center gap-1">
            <span>دخول</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onJoin(room)}
      className="group relative w-full aspect-[4/3] sm:aspect-[16/11] rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-amber-600/70 hover:border-amber-400 shadow-xl shadow-amber-600/15 transition-all duration-300 cursor-pointer select-none active:scale-98"
    >
      {/* 1. Full Cover Image */}
      <img
        src={room.coverImage || room.hostAvatar}
        alt={room.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        referrerPolicy="no-referrer"
      />

      {/* 2. Soft Dark Gradient Overlay for Crystal Clear Text Readability */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent pointer-events-none z-10" />

      {/* 3. Top Corner: Viewers Count Badge ONLY */}
      <div className="absolute top-2 left-2 z-20 pointer-events-none">
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-sm text-amber-200 text-[10px] font-black border border-amber-500/80 shadow">
          <Users className="w-3 h-3 text-amber-400" />
          <span>{room.viewerCount || 1}</span>
        </div>
      </div>

      {/* 4. Bottom: Avatar + Room Title ONLY */}
      <div className="absolute bottom-2.5 inset-x-2.5 z-20 flex items-center gap-2 text-right">
        {/* Small Circular Avatar */}
        <div className="relative shrink-0">
          <img
            src={room.hostAvatar}
            alt="رمز الغرفة"
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-amber-400 shadow-sm"
            referrerPolicy="no-referrer"
          />
          <span className="absolute -bottom-0.5 -left-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-slate-950" />
        </div>

        {/* Room Title Only */}
        <h3 className="font-black text-xs sm:text-sm text-amber-100 group-hover:text-amber-300 transition-colors line-clamp-1 drop-shadow-md leading-tight flex-1 min-w-0">
          {room.title}
        </h3>
      </div>
    </div>
  );
};

export const AudioRoomCard: React.FC<{ room: Room; onJoin?: (room: Room) => void }> = ({ room, onJoin }) => {
  return <RoomCard room={room} onJoin={onJoin || (() => {})} layout="list" />;
};
