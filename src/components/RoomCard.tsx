import React from 'react';
import { Room } from '../types';
import { Users, Lock, Mic, Video, Volume2 } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  onJoin: (room: Room) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onJoin }) => {
  return (
    <div
      onClick={() => onJoin(room)}
      className="group relative bg-slate-900/80 hover:bg-slate-800/90 rounded-2xl overflow-hidden border border-slate-800 hover:border-amber-500/40 shadow-lg hover:shadow-amber-500/10 transition-all duration-300 cursor-pointer flex flex-col justify-between"
    >
      {/* Cover Image & Live Overlay */}
      <div className="relative w-full h-36 overflow-hidden bg-slate-950">
        <img
          src={room.coverImage}
          alt={room.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
          {/* Live Indicator */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-600/90 backdrop-blur-sm text-white text-[10px] font-bold shadow-md shadow-rose-900/40">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
            <span>مباشر</span>
          </div>

          {/* Viewers & Media Badges */}
          <div className="flex items-center gap-1">
            {room.type === 'PRIVATE' && (
              <span className="p-1 rounded-full bg-slate-900/80 text-amber-400 border border-slate-700/60" title="غرفة خاصة">
                <Lock className="w-3 h-3" />
              </span>
            )}
            {room.allowVideo && (
              <span className="p-1 rounded-full bg-slate-900/80 text-cyan-400 border border-slate-700/60" title="فيديو مباشر متاح">
                <Video className="w-3 h-3" />
              </span>
            )}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-sm text-slate-200 text-[10px] font-semibold border border-slate-700/60">
              <Users className="w-3 h-3 text-amber-400" />
              <span>{room.viewerCount}</span>
            </div>
          </div>
        </div>

        {/* Host Avatar & Category */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2">
          <div className="relative">
            <img
              src={room.hostAvatar}
              alt={room.hostName}
              className="w-8 h-8 rounded-full object-cover border-2 border-amber-400/80 shadow-md"
              referrerPolicy="no-referrer"
            />
            <span className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950"></span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-100 line-clamp-1 drop-shadow-md">
              {room.hostName}
            </span>
            <span className="text-[10px] text-amber-300/90 font-medium">
              {room.currentCategory}
            </span>
          </div>
        </div>
      </div>

      {/* Room Details & Join CTA */}
      <div className="p-3 flex flex-col justify-between flex-1 gap-2">
        <h3 className="font-bold text-sm text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-1">
          {room.title}
        </h3>

        <p className="text-xs text-slate-400 line-clamp-1">
          {room.description}
        </p>

        {/* Tags & Join Button */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 mt-auto">
          <div className="flex items-center gap-1 overflow-hidden">
            {room.tags.slice(0, 2).map((tag, idx) => (
              <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded-md">
                #{tag}
              </span>
            ))}
          </div>

          <button className="px-3 py-1 bg-amber-500/20 group-hover:bg-amber-500 text-amber-300 group-hover:text-slate-950 text-xs font-bold rounded-xl border border-amber-500/40 transition-all">
            دخول
          </button>
        </div>
      </div>
    </div>
  );
};
