import React, { useState, useRef } from 'react';

interface TestSandboxViewProps {
  onBackToHome: () => void;
  onOpenCreateRoom?: () => void;
  onOpenDailyTasks?: () => void;
  onOpenFrames?: () => void;
  onOpenEntrances?: () => void;
  onOpenAdmin?: () => void;
  onOpenWallet?: () => void;
  onSelectTab?: (tab: string) => void;
}

export interface TouchZone {
  id: string;
  label: string;
  top: number;    // Percentage 0-100
  left: number;   // Percentage 0-100
  width: number;  // Percentage 0-100
  height: number; // Percentage 0-100
  color: string;  // Border & tint color
  actionKey?: string;
}

const DEFAULT_TOUCH_ZONES: TouchZone[] = [
  // 1. Top Bar
  { id: 'coins', label: 'شحن رصيد الكوينز (+)', top: 2, left: 64, width: 34, height: 5, color: 'border-amber-400 bg-amber-500/20 text-amber-200', actionKey: 'wallet' },
  { id: 'gifts', label: 'الهدايا', top: 2, left: 52, width: 10, height: 5, color: 'border-emerald-400 bg-emerald-500/20 text-emerald-200', actionKey: 'wallet' },
  { id: 'notifs', label: 'التنبيهات (3)', top: 2, left: 40, width: 10, height: 5, color: 'border-blue-400 bg-blue-500/20 text-blue-200', actionKey: 'notif' },
  { id: 'quick_mic', label: 'البث السريع', top: 2, left: 14, width: 10, height: 5, color: 'border-purple-400 bg-purple-500/20 text-purple-200', actionKey: 'create_room' },

  // 2. Center Platform
  { id: 'crown_mic', label: 'المايك الأخضر والتاج', top: 9.89, left: 40.92, width: 5.27, height: 3.74, color: 'border-emerald-300 bg-emerald-400/20 text-emerald-100', actionKey: 'create_room' },
  { id: 'admin_banner', label: 'إدارة حكاوي والوكالة', top: 92.64, left: 0, width: 100, height: 7.36, color: 'border-yellow-400 bg-yellow-500/20 text-yellow-100', actionKey: 'admin' },

  // 3. Control Buttons
  { id: 'create_room', label: 'إنشاء غرفة صوتية جديدة', top: 56.56, left: 50.89, width: 43.95, height: 5.69, color: 'border-orange-400 bg-orange-500/20 text-orange-200', actionKey: 'create_room' },
  { id: 'daily_tasks', label: 'المكافآت والمهام اليومية', top: 56.99, left: 6.13, width: 39.92, height: 5.77, color: 'border-emerald-400 bg-emerald-500/20 text-emerald-200', actionKey: 'tasks' },
  { id: 'friends', label: 'قائمة الأصدقاء', top: 64.52, left: 71.03, width: 23.53, height: 7.8, color: 'border-cyan-400 bg-cyan-500/20 text-cyan-200', actionKey: 'friends' },
  { id: 'active_rooms', label: 'الغرف النشطة', top: 64.95, left: 46.22, width: 22.55, height: 12.98, color: 'border-indigo-400 bg-indigo-500/20 text-indigo-200', actionKey: 'rooms_tab' },
  { id: 'frames', label: 'الإطارات والمدخلات', top: 65.47, left: 5.17, width: 36.44, height: 5.81, color: 'border-pink-400 bg-pink-500/20 text-pink-200', actionKey: 'frames' },
  { id: 'security', label: 'الحماية والدرع الملكي', top: 10.53, left: 31.22, width: 5.92, height: 2, color: 'border-teal-400 bg-teal-500/20 text-teal-200', actionKey: 'security' },
  { id: 'power_off', label: 'إطعام / إطفاء الشاشة (OFF)', top: 16.84, left: 6.75, width: 87.7, height: 36.19, color: 'border-red-400 bg-red-500/20 text-red-200', actionKey: 'power' },

  // 4. Bottom Nav Bar
  { id: 'nav_home', label: 'وليد', top: 82.26, left: 80, width: 12.08, height: 6.77, color: 'border-emerald-400 bg-emerald-500/30 text-emerald-100', actionKey: 'home_tab' },
  { id: 'nav_moments', label: 'اللحظات', top: 81.48, left: 61.67, width: 17.08, height: 8.23, color: 'border-blue-400 bg-blue-500/30 text-blue-100', actionKey: 'moments_tab' },
  { id: 'nav_messages', label: 'رسالة (28)', top: 81.66, left: 41.53, width: 14.16, height: 6.41, color: 'border-rose-400 bg-rose-500/30 text-rose-100', actionKey: 'messages_tab' },
  { id: 'nav_games', label: 'لعبة', top: 81.57, left: 22.08, width: 15.83, height: 6.33, color: 'border-amber-400 bg-amber-500/30 text-amber-100', actionKey: 'games_tab' },
  { id: 'nav_profile', label: 'أنا (حسابي)', top: 81.65, left: 4.86, width: 14.31, height: 7.54, color: 'border-yellow-400 bg-yellow-500/30 text-yellow-100', actionKey: 'profile_tab' },
];

/**
 * TestSandboxView — Interactive Touch Overlay with Visual Drag & Drop Calibration Mode
 */
export const TestSandboxView: React.FC<TestSandboxViewProps> = ({
  onBackToHome,
  onOpenCreateRoom,
  onOpenDailyTasks,
  onOpenFrames,
  onOpenAdmin,
  onOpenWallet,
  onSelectTab,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [zones, setZones] = useState<TouchZone[]>(DEFAULT_TOUCH_ZONES);
  const [showBorders, setShowBorders] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<string | null>(null);
  const [isPowerOff, setIsPowerOff] = useState<boolean>(false);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  // Dragging & Resizing State Tracking
  const dragInfo = useRef<{
    isDragging: boolean;
    isResizing: boolean;
    zoneId: string;
    startX: number;
    startY: number;
    startTop: number;
    startLeft: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const showToast = (message: string) => {
    setActiveToast(message);
    setTimeout(() => {
      setActiveToast((prev) => (prev === message ? null : prev));
    }, 2200);
  };

  const executeAction = (zone: TouchZone) => {
    showToast(`تم ضغط: ${zone.label}`);
    switch (zone.actionKey) {
      case 'wallet':
        onOpenWallet?.();
        break;
      case 'create_room':
        onOpenCreateRoom?.();
        break;
      case 'admin':
        onOpenAdmin?.();
        break;
      case 'tasks':
        onOpenDailyTasks?.();
        break;
      case 'frames':
        onOpenFrames?.();
        break;
      case 'power':
        setIsPowerOff((prev) => !prev);
        break;
      case 'home_tab':
        onSelectTab?.('home');
        break;
      case 'games_tab':
        onSelectTab?.('games');
        break;
      case 'messages_tab':
        onSelectTab?.('messages');
        break;
      case 'profile_tab':
        onSelectTab?.('profile');
        break;
      case 'moments_tab':
      case 'rooms_tab':
        onSelectTab?.('rooms');
        break;
      default:
        break;
    }
  };

  // Handle Drag Start
  const handlePointerDownDrag = (e: React.PointerEvent, zone: TouchZone) => {
    if (!showBorders) return; // In invisible mode, standard tap behavior occurs
    e.stopPropagation();
    setSelectedZoneId(zone.id);

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    dragInfo.current = {
      isDragging: true,
      isResizing: false,
      zoneId: zone.id,
      startX: e.clientX,
      startY: e.clientY,
      startTop: zone.top,
      startLeft: zone.left,
      startWidth: zone.width,
      startHeight: zone.height,
    };
  };

  // Handle Resize Start
  const handlePointerDownResize = (e: React.PointerEvent, zone: TouchZone) => {
    if (!showBorders) return;
    e.stopPropagation();
    setSelectedZoneId(zone.id);

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    dragInfo.current = {
      isDragging: false,
      isResizing: true,
      zoneId: zone.id,
      startX: e.clientX,
      startY: e.clientY,
      startTop: zone.top,
      startLeft: zone.left,
      startWidth: zone.width,
      startHeight: zone.height,
    };
  };

  // Handle Pointer Move for Drag or Resize
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragInfo.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dxPx = e.clientX - dragInfo.current.startX;
    const dyPx = e.clientY - dragInfo.current.startY;

    const dxPct = (dxPx / rect.width) * 100;
    const dyPct = (dyPx / rect.height) * 100;

    const id = dragInfo.current.zoneId;

    if (dragInfo.current.isDragging) {
      const newLeft = Math.max(0, Math.min(100 - dragInfo.current.startWidth, dragInfo.current.startLeft + dxPct));
      const newTop = Math.max(0, Math.min(100 - dragInfo.current.startHeight, dragInfo.current.startTop + dyPct));

      setZones((prev) =>
        prev.map((z) =>
          z.id === id
            ? {
                ...z,
                left: Number(newLeft.toFixed(2)),
                top: Number(newTop.toFixed(2)),
              }
            : z
        )
      );
    } else if (dragInfo.current.isResizing) {
      const newWidth = Math.max(3, Math.min(100 - dragInfo.current.startLeft, dragInfo.current.startWidth + dxPct));
      const newHeight = Math.max(2, Math.min(100 - dragInfo.current.startTop, dragInfo.current.startHeight + dyPct));

      setZones((prev) =>
        prev.map((z) =>
          z.id === id
            ? {
                ...z,
                width: Number(newWidth.toFixed(2)),
                height: Number(newHeight.toFixed(2)),
              }
            : z
        )
      );
    }
  };

  // Handle Pointer Up / Release
  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragInfo.current) {
      try {
        const target = e.currentTarget as HTMLElement;
        if (target.hasPointerCapture(e.pointerId)) {
          target.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore capture release errors
      }
      dragInfo.current = null;
    }
  };

  // Generate CSS/React code string for export
  const getExportCode = () => {
    return JSON.stringify(
      zones.map((z) => ({
        id: z.id,
        label: z.label,
        top: `${z.top}%`,
        left: `${z.left}%`,
        width: `${z.width}%`,
        height: `${z.height}%`,
      })),
      null,
      2
    );
  };

  const handleSaveCoordinates = () => {
    console.log('--- Coordinates Calibration Export ---');
    console.log(zones);
    setShowSaveModal(true);
    showToast('💾 تم حفظ وطباعة الإحداثيات بنجاح!');
  };

  const handleResetPositions = () => {
    setZones(DEFAULT_TOUCH_ZONES);
    showToast('🔄 تم إعادة ضبط الأماكن الافتراضية');
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="fixed inset-0 z-50 w-screen h-screen m-0 p-0 overflow-hidden select-none bg-black touch-none"
      style={{
        backgroundImage: "url('https://i.postimg.cc/4y462dKn/file-000000003678820ab35f446f01e49b5d.png')",
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      }}
      dir="rtl"
    >
      {/* CALIBRATION CONTROL TOOLBAR (TOP BAR) */}
      <div className="absolute top-2 left-2 right-2 z-50 flex items-center justify-between gap-1.5 pointer-events-auto">
        {/* Back Button */}
        <button
          onClick={onBackToHome}
          aria-label="رجوع للشاشة الرئيسية"
          title="رجوع للشاشة الرئيسية"
          className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-amber-300 border border-amber-500/40 backdrop-blur-md transition-all active:scale-90 cursor-pointer shadow-xl flex items-center justify-center font-bold text-lg leading-none shrink-0"
        >
          <span className="text-xl font-bold select-none leading-none">‹</span>
        </button>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 no-scrollbar">
          {/* Toggle Invisible / Show Borders */}
          <button
            onClick={() => {
              setShowBorders(!showBorders);
              showToast(showBorders ? '🙈 تم إخفاء الحدود (وضع المعاينة المعتمة)' : '👁️ تم إظهار الحدود (وضع التعديل بالسحب)');
            }}
            className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold backdrop-blur-md border transition-all active:scale-95 shadow-md flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              showBorders
                ? 'bg-amber-500/90 text-amber-950 border-amber-300 shadow-amber-500/20'
                : 'bg-black/70 text-amber-200 border-amber-500/40'
            }`}
          >
            <span>{showBorders ? '👁️ إخفاء الحدود' : '✏️ تعديل بالسحب'}</span>
          </button>

          {/* Save Coordinates Button */}
          {showBorders && (
            <button
              onClick={handleSaveCoordinates}
              className="px-3 py-1.5 rounded-full bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-300 text-[11px] font-extrabold backdrop-blur-md transition-all active:scale-95 shadow-lg flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>💾 حفظ ومطابقة</span>
            </button>
          )}

          {/* Reset Button */}
          {showBorders && (
            <button
              onClick={handleResetPositions}
              className="px-2.5 py-1.5 rounded-full bg-red-950/70 text-red-200 border border-red-500/40 text-[10px] font-bold backdrop-blur-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span>🔄 إعادة ضبط</span>
            </button>
          )}
        </div>
      </div>

      {/* TOAST FEEDBACK */}
      {activeToast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-amber-950/95 text-amber-200 border border-amber-400/60 backdrop-blur-md px-5 py-2 rounded-full shadow-2xl text-xs font-bold animate-in fade-in zoom-in duration-150 flex items-center gap-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{activeToast}</span>
        </div>
      )}

      {/* POWER OFF OVERLAY STATE */}
      {isPowerOff && (
        <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200 pointer-events-auto">
          <div className="bg-amber-950/90 border border-amber-500/50 p-6 rounded-3xl shadow-2xl max-w-xs text-amber-100">
            <h3 className="font-extrabold text-base mb-2 text-amber-300">الشاشة مطفأة مؤقتاً (OFF)</h3>
            <p className="text-xs text-amber-200/80 mb-4">انقر فوق زر التشغيل لإعادة تفعيل الواجهة الملكية.</p>
            <button
              onClick={() => setIsPowerOff(false)}
              className="px-6 py-2 rounded-xl bg-amber-500 text-amber-950 font-black text-xs shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              تشغيل الواجهة (ON)
            </button>
          </div>
        </div>
      )}

      {/* TOUCH ZONES OVERLAY LAYER */}
      <div className="relative w-full h-full pointer-events-auto">
        {zones.map((zone) => {
          const isSelected = selectedZoneId === zone.id && showBorders;

          return (
            <div
              key={zone.id}
              onPointerDown={(e) => handlePointerDownDrag(e, zone)}
              onClick={(e) => {
                if (!showBorders) {
                  executeAction(zone);
                } else {
                  e.stopPropagation();
                  setSelectedZoneId(zone.id);
                }
              }}
              style={{
                top: `${zone.top}%`,
                left: `${zone.left}%`,
                width: `${zone.width}%`,
                height: `${zone.height}%`,
              }}
              className={`absolute transition-colors cursor-move flex items-center justify-center text-center p-0.5 rounded-lg touch-none ${
                showBorders
                  ? `border-2 ${zone.color} ${isSelected ? 'ring-2 ring-white ring-offset-1 z-30 shadow-2xl' : 'z-20'}`
                  : 'bg-transparent border-0 active:bg-white/20 active:scale-95 cursor-pointer z-20'
              }`}
            >
              {/* LABEL INSIDE BOX (VISIBLE ONLY WHEN BORDERS SHOW) */}
              {showBorders && (
                <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden px-1 pointer-events-none">
                  <span className="text-[10px] sm:text-[11px] font-black leading-tight drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.9)] truncate max-w-full">
                    {zone.label}
                  </span>
                  <span className="text-[8px] opacity-80 font-mono font-bold leading-none mt-0.5">
                    {zone.width}%×{zone.height}%
                  </span>
                </div>
              )}

              {/* RESIZE HANDLE (BOTTOM-LEFT CORNER FOR RTL REPOSITIONING) */}
              {showBorders && (
                <div
                  onPointerDown={(e) => handlePointerDownResize(e, zone)}
                  title="سحب للتكبير والتصغير"
                  className="absolute bottom-0 left-0 w-4 h-4 bg-amber-300 border border-black/80 rounded-tr-md shadow-md cursor-se-resize z-40 flex items-center justify-center active:scale-125 transition-transform"
                >
                  <span className="block w-1.5 h-1.5 border-b-2 border-r-2 border-amber-950" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SAVE COORDINATES MODAL */}
      {showSaveModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 dir-rtl animate-in fade-in duration-200 pointer-events-auto">
          <div className="bg-amber-950 border border-amber-500/60 rounded-2xl p-5 max-w-md w-full text-amber-100 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/30 mb-3">
              <h3 className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                <span>💾 الإحداثيات والنسب المئوية المستخرجة</span>
              </h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-amber-400 hover:text-white text-lg font-bold w-7 h-7 flex items-center justify-center rounded-full bg-amber-900/50"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-amber-200/80 mb-3 leading-relaxed">
              تمت مطابقة وحفظ الإحداثيات بنجاح! يمكنك نسخ الأكواد لاستخدامها وتثبيتها برمجياً:
            </p>

            <pre className="bg-black/80 border border-amber-500/30 text-emerald-400 text-[10px] font-mono p-3 rounded-xl overflow-y-auto flex-1 mb-4 select-all text-left dir-ltr">
              {getExportCode()}
            </pre>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(getExportCode());
                  showToast('📋 تم نسخ الإحداثيات للحافظة!');
                }}
                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs shadow-lg active:scale-95 transition-all cursor-pointer text-center"
              >
                نسخ الإحداثيات 📋
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 rounded-xl bg-amber-900/60 hover:bg-amber-800 text-amber-200 font-bold text-xs border border-amber-500/40 active:scale-95 transition-all cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
