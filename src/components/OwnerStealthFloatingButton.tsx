import React, { useState, useRef, useEffect } from 'react';
import { User, isUserOwner } from '../types';
import { API } from '../services/api';
import { Eye, EyeOff, Crown } from 'lucide-react';

interface OwnerStealthFloatingButtonProps {
  currentUser: User | null;
  isStealthMode: boolean;
  onToggleStealthMode: (newMode: boolean) => void;
}

export const OwnerStealthFloatingButton: React.FC<OwnerStealthFloatingButtonProps> = ({
  currentUser,
  isStealthMode,
  onToggleStealthMode
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  const isDraggingRef = useRef(false);
  const startTouchPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startBtnPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!position && typeof window !== 'undefined') {
      const defaultX = Math.max(16, window.innerWidth - 220);
      const defaultY = Math.max(20, window.innerHeight - 140);
      setPosition({ x: defaultX, y: defaultY });
    }
  }, []);

  if (!currentUser || !isUserOwner(currentUser)) {
    return null;
  }

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

      const btnWidth = containerRef.current?.offsetWidth || 180;
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

        const btnWidth = containerRef.current?.offsetWidth || 180;
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

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMovedRef.current) {
      hasMovedRef.current = false;
      return;
    }
    if (isUpdating) return;
    const nextMode = !isStealthMode;
    setIsUpdating(true);

    try {
      await API.setStealthMode(currentUser.id, nextMode);
      onToggleStealthMode(nextMode);
      localStorage.setItem('hekawy_owner_stealth_mode', nextMode ? 'true' : 'false');

      const msg = nextMode
        ? '🕵️‍♂️ تم تفعيل "وضع الدخول المخفي": لن يظهر دخولك أو اسمك أو صورتك في الغرف.'
        : '👁️ تم تفعيل "وضع الدخول العادي": سوف يظهر دخولك وشعار المالك كالمعتاد.';
      
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to toggle stealth mode:', err);
      onToggleStealthMode(nextMode);
      localStorage.setItem('hekawy_owner_stealth_mode', nextMode ? 'true' : 'false');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMovedRef.current) {
      hasMovedRef.current = false;
      return;
    }
    setIsExpanded(prev => !prev);
  };

  return (
    <>
      {/* Toast Notification Alert when toggling */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] max-w-md w-11/12 bg-slate-900/95 backdrop-blur-xl border border-amber-500/40 text-amber-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <Crown className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-xs font-bold leading-relaxed">{toastMessage}</p>
        </div>
      )}

      {/* Owner Stealth Floating Button */}
      <div 
        ref={containerRef}
        id="owner-stealth-floating-widget"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        style={{
          position: 'fixed',
          left: position ? `${position.x}px` : 'auto',
          top: position ? `${position.y}px` : 'auto',
          right: position ? 'auto' : '16px',
          bottom: position ? 'auto' : '96px',
          zIndex: 9999,
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
        className="flex flex-col items-end gap-1.5 select-none"
      >
        {/* Expanded Info Tooltip */}
        {isExpanded && (
          <div className="bg-slate-950/95 border border-slate-800 backdrop-blur-xl p-3 rounded-2xl shadow-2xl max-w-xs text-right text-slate-200 text-xs flex flex-col gap-1.5 animate-fadeIn">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" /> وضع المالك الخفي
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isStealthMode ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-300'}`}>
                {isStealthMode ? 'مخفي ON' : 'عادي OFF'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {isStealthMode ? (
                <>
                  <strong className="text-purple-300">الوضع الحالي (مخفي):</strong> عند دخولك لأي غرفة لا يظهر إشعار، لا تُدرج صورتك في القائمة، ولا تُشغّل المايك/الكاميرا تلقائياً.
                </>
              ) : (
                <>
                  <strong className="text-amber-300">الوضع الحالي (عادي):</strong> دخولك يظهر بشعار المالك والموكب الإمبراطوري كالمعتاد.
                </>
              )}
            </p>
          </div>
        )}

        {/* Main Floating Toggle Bar */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-xl border border-amber-500/30 p-1.5 pl-3 rounded-full shadow-2xl hover:border-amber-500/60 transition-all cursor-grab active:cursor-grabbing">
          <button
            onClick={handleExpandClick}
            title="معلومات وضع التخفي"
            className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5" />
          </button>

          <span className="text-[11px] font-bold text-slate-200 hidden sm:inline">
            وضع التخفي:
          </span>

          <button
            onClick={handleToggle}
            disabled={isUpdating}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer shadow-md active:scale-95 ${
              isStealthMode
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 text-white shadow-purple-900/50 border border-purple-400/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {isStealthMode ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
                <span>مخفي (ON)</span>
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping inline-block" />
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>عادي (OFF)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};
