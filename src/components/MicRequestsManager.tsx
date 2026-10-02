import React, { useState } from 'react';
import { MicRequest, RoomSeat, User } from '../types';
import { Mic, Check, X, Clock, AlertCircle, Sparkles, UserCheck, UserX, ChevronDown } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface HostMicRequestNotificationProps {
  request: MicRequest;
  onAccept: (requestId: string, targetSeatIndex?: number) => void;
  onReject: (requestId: string) => void;
  onDismiss: () => void;
  onOpenAllRequests: () => void;
  pendingCount: number;
}

/**
 * Floating High-Contrast Alert for Room Host
 * Displays: «فلان يطلب الصعود إلى المايك» with avatar, name, requested seat, and 1-click Accept / Reject
 */
export const HostMicRequestNotification: React.FC<HostMicRequestNotificationProps> = ({
  request,
  onAccept,
  onReject,
  onDismiss,
  onOpenAllRequests,
  pendingCount
}) => {
  const seatText = request.targetSeatIndex !== undefined
    ? `المقعد رقم ${request.targetSeatIndex + 1}`
    : (request.seatLabel || 'أي مقعد متاح');

  return (
    <div
      id="host-mic-request-banner"
      className="fixed top-16 sm:top-20 inset-x-3 max-w-lg mx-auto z-50 animate-in fade-in slide-in-from-top duration-300 pointer-events-auto"
      dir="rtl"
    >
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900/98 via-slate-800/98 to-slate-900/98 border-2 border-amber-500/80 shadow-2xl shadow-amber-500/20 backdrop-blur-xl flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={request.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${request.userId}`}
                alt={request.userName}
                className="w-11 h-11 rounded-full object-cover border-2 border-amber-400 shadow-md ring-2 ring-amber-400/30"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 p-1 bg-amber-500 text-slate-950 rounded-full shadow">
                <Mic className="w-2.5 h-2.5" />
              </span>
            </div>

            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-amber-300 truncate">
                  {request.userName}
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-extrabold whitespace-nowrap">
                  {seatText}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-100 mt-0.5">
                يطلب الصعود إلى المايك 🎙️
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {pendingCount > 1 && (
              <button
                type="button"
                onClick={onOpenAllRequests}
                className="px-2 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[10px] font-extrabold transition-all"
                title="عرض جميع الطلبات"
              >
                الكل ({pendingCount})
              </button>
            )}
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Buttons: Accept or Reject */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-700/60">
          <button
            type="button"
            id="host-accept-mic-btn"
            onClick={() => {
              soundEffects.playNotification();
              onAccept(request.id, request.targetSeatIndex);
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-600/30 active:scale-95 transition-all"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>قبول الصعود</span>
          </button>

          <button
            type="button"
            id="host-reject-mic-btn"
            onClick={() => {
              onReject(request.id);
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/40 font-bold text-xs active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
            <span>رفض الطلب</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface HostMicRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: MicRequest[];
  roomSeats: RoomSeat[];
  onAccept: (requestId: string, targetSeatIndex?: number) => void;
  onReject: (requestId: string) => void;
}

function formatRelativeTime(dateString: string): string {
  if (!dateString) return 'الآن';
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 15) return 'الآن';
  if (diffSec < 60) return `منذ ${diffSec} ثانية`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return 'منذ دقيقة';
  if (diffMin === 2) return 'منذ دقيقتين';
  if (diffMin < 11) return `منذ ${diffMin} دقائق`;
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return 'منذ ساعة';
  if (diffHours === 2) return 'منذ ساعتين';
  if (diffHours < 11) return `منذ ${diffHours} ساعات`;
  return `منذ ${diffHours} ساعة`;
}

function formatRoleLabel(role?: string): string {
  if (role === 'HOST') return 'صاحب الغرفة 👑';
  if (role === 'MODERATOR' || role === 'ADMIN') return 'مشرف 🛡️';
  if (role === 'SPEAKER') return 'متحدث 🎙️';
  return 'مستمع 🎧';
}

/**
 * Modal Drawer for Host/Owner listing all pending mic requests
 * Preserved in DB until accepted or rejected
 */
export const HostMicRequestsModal: React.FC<HostMicRequestsModalProps> = ({
  isOpen,
  onClose,
  requests,
  roomSeats,
  onAccept,
  onReject
}) => {
  const [selectedSeatForRequest, setSelectedSeatForRequest] = useState<Record<string, number | undefined>>({});

  if (!isOpen) return null;

  // Filter available empty seats on stage
  const freeSeats = roomSeats.filter(s => !s.userId && !s.isLocked);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 animate-in fade-in duration-200" dir="rtl">
      <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">طلبات الصعود إلى المايك</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black shadow-md">
                  {requests.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-bold">
                قائمة الانتظار الحية - محفوظة حتى تتخذ قراراً بالقبول أو الرفض
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Requests List */}
        <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-3 custom-scrollbar">
          {requests.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center p-4">
              <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-3 animate-pulse">
                <Mic className="w-8 h-8" />
              </div>
              <p className="text-sm font-black text-slate-200">لا توجد طلبات مايك معلقة حالياً</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                عندما يضغط أي مستمع على زر «طلب المايك»، سيظهر اسمه وكارته هنا فوراً وبشكل لحظي.
              </p>
            </div>
          ) : (
            requests.map(req => {
              const requestedSeatNum = req.targetSeatIndex !== undefined ? req.targetSeatIndex + 1 : undefined;
              const chosenSeat = selectedSeatForRequest[req.id] !== undefined
                ? selectedSeatForRequest[req.id]
                : req.targetSeatIndex;

              return (
                <div
                  key={req.id}
                  className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-slate-700/80 hover:border-amber-500/40 shadow-lg flex flex-col gap-2.5 transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* User Avatar & Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0 w-12 h-12 flex items-center justify-center">
                        <img
                          src={req.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${req.userId}`}
                          alt={req.userName}
                          className="w-11 h-11 rounded-full object-cover border-2 border-amber-400 shadow-md ring-1 ring-amber-400/30"
                          referrerPolicy="no-referrer"
                        />
                        {req.customFrameUrl && (
                          <img
                            src={req.customFrameUrl}
                            alt="إطار"
                            className="absolute -inset-1 w-14 h-14 object-contain pointer-events-none z-10"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <span className="absolute -bottom-1 -right-1 p-0.5 bg-amber-500 text-slate-950 rounded-full shadow z-20">
                          <Mic className="w-2.5 h-2.5" />
                        </span>
                      </div>

                      <div className="min-w-0 flex flex-col gap-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-amber-200 truncate max-w-[140px]">
                            {req.userName}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-extrabold whitespace-nowrap">
                            {formatRoleLabel(req.userRole)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap mt-0.5">
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-bold border border-slate-700">
                            🎯 {requestedSeatNum ? `المقعد رقم ${requestedSeatNum}` : (req.seatLabel || 'أي مقعد متاح')}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-slate-400">
                            <Clock className="w-3 h-3 text-amber-400/80" />
                            <span>{formatRelativeTime(req.requestedAt)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seat Selection Dropdown */}
                  {freeSeats.length > 0 && (
                    <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-xs">
                      <span className="text-[11px] font-extrabold text-amber-300 shrink-0">المقعد المخصص:</span>
                      <select
                        value={chosenSeat !== undefined ? chosenSeat : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? undefined : Number(e.target.value);
                          setSelectedSeatForRequest(prev => ({ ...prev, [req.id]: val }));
                        }}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
                      >
                        <option value="">أول مقعد شاغر متاح تلقائياً</option>
                        {freeSeats.map(seat => (
                          <option key={seat.seatIndex} value={seat.seatIndex}>
                            المقعد رقم {seat.seatIndex + 1} {seat.isVipSeat ? '👑 (VIP)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Accept / Reject Control Buttons */}
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      id={`accept-mic-request-${req.id}`}
                      onClick={() => {
                        soundEffects.playNotification();
                        onAccept(req.id, chosenSeat);
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4 stroke-[2.5]" />
                      <span>قبول الصعود</span>
                    </button>

                    <button
                      type="button"
                      id={`reject-mic-request-${req.id}`}
                      onClick={() => {
                        onReject(req.id);
                      }}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/40 font-bold text-xs active:scale-95 transition-all cursor-pointer"
                    >
                      <UserX className="w-4 h-4" />
                      <span>رفض الطلب</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

interface UserRequestMicModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomSeats: RoomSeat[];
  currentPendingRequest?: MicRequest | null;
  initialSeatIndex?: number;
  onSubmitRequest: (targetSeatIndex?: number) => void;
  onCancelRequest: () => void;
}

/**
 * User/Listener Modal to Request Mic
 * - Allows picking specific empty seat or any free seat
 * - Displays active pending state if request is already active
 * - Prevents multiple duplicate requests
 */
export const UserRequestMicModal: React.FC<UserRequestMicModalProps> = ({
  isOpen,
  onClose,
  roomSeats,
  currentPendingRequest,
  initialSeatIndex,
  onSubmitRequest,
  onCancelRequest
}) => {
  const [selectedSeatIndex, setSelectedSeatIndex] = useState<number | undefined>(initialSeatIndex);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initialSeatIndex if passed
  React.useEffect(() => {
    if (initialSeatIndex !== undefined) {
      setSelectedSeatIndex(initialSeatIndex);
    }
  }, [initialSeatIndex]);

  if (!isOpen) return null;

  const emptySeats = roomSeats.filter(s => !s.userId && !s.isLocked);
  const hasActiveRequest = !!currentPendingRequest && currentPendingRequest.status === 'PENDING';

  const handleSend = async () => {
    if (hasActiveRequest || isSubmitting) return;
    setIsSubmitting(true);
    try {
      onSubmitRequest(selectedSeatIndex);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 animate-in fade-in duration-200" dir="rtl">
      <div className="w-full max-w-sm bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">طلب الصعود إلى المايك</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {hasActiveRequest ? 'لديك طلب قيد الانتظار' : 'التحدث والمشاركة الصوتية مع الحضور'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 flex flex-col gap-3">
          {hasActiveRequest ? (
            /* Active Pending State */
            <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 gap-2.5">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/40 animate-pulse">
                  <Mic className="w-6 h-6" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
              </div>

              <div>
                <h4 className="text-xs font-black text-amber-300">
                  طلبك قيد الانتظار حالياً ⏳
                </h4>
                <p className="text-[11px] text-slate-300 mt-1">
                  أنت في قائمة الانتظار لـ{' '}
                  <span className="font-bold text-amber-400">
                    {currentPendingRequest.targetSeatIndex !== undefined
                      ? `المقعد رقم ${currentPendingRequest.targetSeatIndex + 1}`
                      : (currentPendingRequest.seatLabel || 'أي مقعد متاح')}
                  </span>
                  .
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  يصل تنبيه مباشر لصاحب الغرفة، وسيتم فتح المايك لك فور الموافقة.
                </p>
              </div>

              {/* Single Request Restriction Note */}
              <div className="w-full text-center py-1.5 px-2 rounded-xl bg-slate-900/80 border border-slate-700 text-[10px] text-slate-400 font-bold">
                ⚠️ منع تكرار الطلب: لا يمكن إرسال أكثر من طلب فعال في نفس الوقت.
              </div>

              {/* Cancel Request Button */}
              <button
                type="button"
                onClick={() => {
                  onCancelRequest();
                  onClose();
                }}
                className="w-full mt-1 py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold active:scale-95 transition-all"
              >
                إلغاء الطلب الحالي
              </button>
            </div>
          ) : (
            /* New Request Form */
            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                اختر المقعد المفضل لك من المقاعد الشاغرة أو اختر «أي مقعد متاح» ليحدد المضيف مقعدك:
              </p>

              {/* Seat Options */}
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto p-1 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setSelectedSeatIndex(undefined)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                    selectedSeatIndex === undefined
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-md ring-1 ring-amber-400'
                      : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>أي مقعد متاح (توصية سريعة)</span>
                  </div>
                  {selectedSeatIndex === undefined && <Check className="w-4 h-4 text-amber-400" />}
                </button>

                {emptySeats.map(seat => (
                  <button
                    key={seat.seatIndex}
                    type="button"
                    onClick={() => setSelectedSeatIndex(seat.seatIndex)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                      selectedSeatIndex === seat.seatIndex
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-md ring-1 ring-amber-400'
                        : 'bg-slate-800/70 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-slate-400" />
                      <span>المقعد رقم {seat.seatIndex + 1} {seat.isVipSeat ? '👑 (VIP)' : ''}</span>
                    </div>
                    {selectedSeatIndex === seat.seatIndex && <Check className="w-4 h-4 text-amber-400" />}
                  </button>
                ))}
              </div>

              {/* Submit CTA */}
              <button
                type="button"
                id="submit-mic-request-btn"
                disabled={isSubmitting}
                onClick={handleSend}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Mic className="w-4 h-4" />
                <span>إرسال طلب المايك لصاحب الغرفة</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface HostPullUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomSeats: RoomSeat[];
  roomMembers: any[];
  targetSeatIndex?: number;
  onPullUser: (targetUserId: string, seatIndex?: number) => void;
  onTakeSeatMyself?: (seatIndex: number) => void;
}

/**
 * Modal for Host/Owner to directly pull/invite any listener in the room to a mic seat
 * without waiting for them to send a mic request.
 */
export const HostPullUserModal: React.FC<HostPullUserModalProps> = ({
  isOpen,
  onClose,
  roomSeats,
  roomMembers,
  targetSeatIndex,
  onPullUser,
  onTakeSeatMyself
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // Filter listeners who are currently in room but NOT seated
  const seatedUserIds = new Set(roomSeats.map(s => s.userId).filter(Boolean));
  const unseatedMembers = roomMembers.filter(m => m.userId && !seatedUserIds.has(m.userId));

  const filteredMembers = unseatedMembers.filter(m => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.trim().toLowerCase();
    return (
      (m.userName && m.userName.toLowerCase().includes(term)) ||
      (m.userId && m.userId.toLowerCase().includes(term))
    );
  });

  const seatLabel = targetSeatIndex !== undefined ? `المقعد رقم ${targetSeatIndex + 1}` : 'أول مقعد شاغر';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 animate-in fade-in duration-200" dir="rtl">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">إدارة المقعد الشاغر</h3>
              <p className="text-[11px] text-amber-300 font-bold mt-0.5">
                تحديد المستمع في: <span className="underline">{seatLabel}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sit yourself CTA if target seat provided */}
        {targetSeatIndex !== undefined && onTakeSeatMyself && (
          <div className="p-3 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-amber-200">
              أو يمكنك الجلوس على {seatLabel} بنفسك:
            </span>
            <button
              type="button"
              onClick={() => {
                onTakeSeatMyself(targetSeatIndex);
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all shrink-0"
            >
              جلوسي على المقعد
            </button>
          </div>
        )}

        {/* Search */}
        <div className="p-3 bg-slate-900/90 border-b border-slate-800">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث عن اسم المستمع..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Listeners List */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 divide-y divide-slate-800/60">
          {filteredMembers.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center text-center p-4">
              <Sparkles className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs font-bold text-slate-300">لا يوجد مستمعون غير جالسون حالياً</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                جميع الحاضرين في الغرفة صاعدون على المايك أو لم يدخل مستمعون جدد بعد.
              </p>
            </div>
          ) : (
            filteredMembers.map(member => (
              <div key={member.userId} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={member.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.userId}`}
                    alt={member.userName}
                    className="w-10 h-10 rounded-full object-cover border border-amber-400/50 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex flex-col">
                    <span className="text-xs font-black text-slate-100 truncate">
                      {member.userName}
                    </span>
                    <span className="text-[10px] text-slate-400">مستمع في القاعة</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playNotification();
                    onPullUser(member.userId, targetSeatIndex);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-600/30 active:scale-95 transition-all flex items-center gap-1 shrink-0"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>سحب للمايك</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
