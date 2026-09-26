import React, { useState, useRef, useEffect } from 'react';
import { Shield, Users, Radio, AlertTriangle, FileText, ChevronUp, AlertOctagon, Crown } from 'lucide-react';
import { User } from '../types';

interface FloatingAdminButtonProps {
  currentUser: User | null;
  onOpenAdminModal: (defaultTab?: 'overview' | 'moderation' | 'users' | 'rooms' | 'reports' | 'logs' | 'roles_and_king') => void;
}

export const FloatingAdminButton: React.FC<FloatingAdminButtonProps> = ({
  currentUser,
  onOpenAdminModal
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  const isDraggingRef = useRef(false);
  const startTouchPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startBtnPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize position on mount
  useEffect(() => {
    if (!position && typeof window !== 'undefined') {
      const defaultX = 16;
      const defaultY = Math.max(20, window.innerHeight - 140);
      setPosition({ x: defaultX, y: defaultY });
    }
  }, []);

  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'OWNER')) {
    return null;
  }

  // --- TOUCH HANDLERS ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startTouchPosRef.current = { x: touch.clientX, y: touch.clientY };

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      startBtnPosRef.current = { x: rect.left, y: rect.top };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - startTouchPosRef.current.x;
    const deltaY = touch.clientY - startTouchPosRef.current.y;
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (dist > 5) {
      hasMovedRef.current = true;
    }

    if (hasMovedRef.current) {
      let newX = startBtnPosRef.current.x + deltaX;
      let newY = startBtnPosRef.current.y + deltaY;

      const btnWidth = containerRef.current?.offsetWidth || 140;
      const btnHeight = containerRef.current?.offsetHeight || 44;
      const maxX = Math.max(0, window.innerWidth - btnWidth);
      const maxY = Math.max(0, window.innerHeight - btnHeight);

      newX = Math.min(Math.max(0, newX), maxX);
      newY = Math.min(Math.max(0, newY), maxY);

      setPosition({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // --- MOUSE HANDLERS (for desktop testing/convenience) ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startTouchPosRef.current = { x: e.clientX, y: e.clientY };

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      startBtnPosRef.current = { x: rect.left, y: rect.top };
    }

    const onMouseMove = (moveEvt: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = moveEvt.clientX - startTouchPosRef.current.x;
      const deltaY = moveEvt.clientY - startTouchPosRef.current.y;
      const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (dist > 5) {
        hasMovedRef.current = true;
      }

      if (hasMovedRef.current) {
        let newX = startBtnPosRef.current.x + deltaX;
        let newY = startBtnPosRef.current.y + deltaY;

        const btnWidth = containerRef.current?.offsetWidth || 140;
        const btnHeight = containerRef.current?.offsetHeight || 44;
        const maxX = Math.max(0, window.innerWidth - btnWidth);
        const maxY = Math.max(0, window.innerHeight - btnHeight);

        newX = Math.min(Math.max(0, newX), maxX);
        newY = Math.min(Math.max(0, newY), maxY);

        setPosition({ x: newX, y: newY });
      }
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleMainButtonClick = (e: React.MouseEvent) => {
    // If dragged more than 5px, don't open/toggle menu
    if (hasMovedRef.current) {
      e.stopPropagation();
      e.preventDefault();
      hasMovedRef.current = false;
      return;
    }
    setIsOpen(prev => !prev);
  };

  // Determine popup position depending on screen position
  const isTopHalf = position ? position.y < window.innerHeight / 2 : false;
  const isRightHalf = position ? position.x > window.innerWidth / 2 : false;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed',
        left: position ? `${position.x}px` : '16px',
        top: position ? `${position.y}px` : 'auto',
        bottom: position ? 'auto' : '80px',
        zIndex: 9999,
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
      className="flex flex-col items-start gap-2 select-none"
    >
      {isOpen && (
        <div
          className={`bg-slate-900/95 backdrop-blur-md border border-purple-500/40 rounded-2xl p-2 shadow-2xl shadow-purple-950/80 flex flex-col gap-1 min-w-[200px] animate-in fade-in duration-200 ${
            isTopHalf ? 'top-full mt-2' : 'bottom-full mb-2'
          } ${isRightHalf ? 'right-0' : 'left-0'}`}
        >
          <div className="px-2 py-1 text-[11px] font-bold text-purple-300 border-b border-purple-500/20 flex items-center justify-between">
            <span>لوحة الإدارة والمراقبة</span>
            <span className="text-[9px] bg-purple-500/20 px-1 rounded text-purple-400 font-mono">
              {currentUser.role}
            </span>
          </div>

          <button
            onClick={() => { setIsOpen(false); onOpenAdminModal('overview'); }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-purple-950/60 text-slate-200 hover:text-purple-300 text-xs text-right transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>الإحصائيات العامة</span>
          </button>

          <button
            onClick={() => { setIsOpen(false); onOpenAdminModal('roles_and_king'); }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-amber-950/60 text-amber-200 hover:text-amber-300 text-xs text-right transition-colors"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>👑 إطار الملك والرتب والرصيد</span>
          </button>

          <button
            onClick={() => { setIsOpen(false); onOpenAdminModal('moderation'); }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-purple-950/60 text-slate-200 hover:text-purple-300 text-xs text-right transition-colors"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span>الرقابة ومكافحة العري</span>
          </button>

          <button
            onClick={() => { setIsOpen(false); onOpenAdminModal('rooms'); }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-purple-950/60 text-slate-200 hover:text-purple-300 text-xs text-right transition-colors"
          >
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span>مراقبة الغرف المباشرة</span>
          </button>

          <button
            onClick={() => { setIsOpen(false); onOpenAdminModal('users'); }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-purple-950/60 text-slate-200 hover:text-purple-300 text-xs text-right transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>إدارة المستخدمين والحظر</span>
          </button>

          <button
            onClick={() => { setIsOpen(false); onOpenAdminModal('reports'); }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-purple-950/60 text-slate-200 hover:text-purple-300 text-xs text-right transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>البلاغات والشكاوى</span>
          </button>

          <button
            onClick={() => { setIsOpen(false); onOpenAdminModal('logs'); }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-purple-950/60 text-slate-200 hover:text-purple-300 text-xs text-right transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>سجل العمليات (Audit)</span>
          </button>
        </div>
      )}

      {/* Main floating trigger button */}
      <button
        onClick={handleMainButtonClick}
        title="أدوات الإدارة والرقابة"
        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-purple-600/30 border border-purple-400/40 transition-all active:scale-95 group cursor-grab active:cursor-grabbing"
      >
        <Shield className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline">أدوات الإدارة والمراقبة</span>
        <ChevronUp className={`w-3.5 h-3.5 text-purple-200 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};
