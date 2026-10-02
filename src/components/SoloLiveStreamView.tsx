import React, { useState, useEffect, useRef } from 'react';
import { User, Room, RoomMessage, Gift } from '../types';
import { API } from '../services/api';
import { socketService } from '../services/socketService';
import { GiftsDrawer } from './GiftsDrawer';
import { GiftTrajectoryOverlay, GiftTrajectoryItem } from './GiftTrajectoryOverlay';
import {
  Video,
  Mic,
  MicOff,
  SwitchCamera,
  X,
  Send,
  Gift as GiftIcon,
  Eye,
  Heart,
  Sparkles,
  Share2,
  Plus,
  Check,
  Gem,
  MessageSquare,
  Smile,
  Volume2
} from 'lucide-react';

interface SoloLiveStreamViewProps {
  room: Room;
  currentUser: User;
  onClose: () => void;
  onUserUpdated?: (user: User) => void;
}

interface FloatingHeart {
  id: string;
  x: number;
  color: string;
  size: number;
  speed: number;
}

// Simulated active supporters for TikTok Live vibe
const MOCK_TOP_SUPPORTERS = [
  { id: 'sup1', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
  { id: 'sup2', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
  { id: 'sup3', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' }
];

const HEART_COLORS = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#3b82f6', '#f59e0b', '#10b981'];

export const SoloLiveStreamView: React.FC<SoloLiveStreamViewProps> = ({
  room,
  currentUser,
  onClose,
  onUserUpdated
}) => {
  const isHost = room.hostId === currentUser.id;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Camera & Stream State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMuted, setIsMuted] = useState(false);
  const [quality, setQuality] = useState<'AUTO' | 'HD' | 'SD'>('AUTO');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Follow State
  const [isFollowingHost, setIsFollowingHost] = useState(false);

  // Chat & Messages State
  const [messages, setMessages] = useState<RoomMessage[]>([
    {
      id: 'welcome_msg',
      roomId: room.id,
      userId: 'system',
      userName: 'تنبيه النظام',
      userAvatar: '',
      userRole: 'MODERATOR',
      text: 'مرحباً بكم في البث المباشر المباشر للفيديو! احترم معايير المجتمع واستمتع باللايف ✨',
      createdAt: new Date().toISOString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [viewerCount, setViewerCount] = useState(room.viewerCount || 1420);
  const [totalDiamonds, setTotalDiamonds] = useState(12850);
  const [likeCount, setLikeCount] = useState(2480);

  // Floating Hearts Animation State
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);

  // Gifts Drawer & Trajectory
  const [isGiftsOpen, setIsGiftsOpen] = useState(false);
  const [giftQueue, setGiftQueue] = useState<GiftTrajectoryItem[]>([]);

  // Share Toast
  const [shareToast, setShareToast] = useState(false);

  // Start Camera Stream for Broadcaster
  const startCamera = async (mode: 'user' | 'environment') => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setCameraError(null);

      const constraints: MediaStreamConstraints = {
        audio: true,
        video: {
          facingMode: mode,
          width: quality === 'HD' ? { ideal: 1280 } : { ideal: 640 },
          height: quality === 'HD' ? { ideal: 720 } : { ideal: 480 }
        }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(console.warn);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('تعذر فتح الكاميرا، جاري عرض واجهة البث التفاعلي التكيفية.');
    }
  };

  useEffect(() => {
    if (isHost) {
      startCamera(facingMode);
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode, quality, isHost]);

  // Auto Scroll Chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate incoming live chat messages for interactive TikTok feel
  useEffect(() => {
    const chatInterval = setInterval(() => {
      const mockComments = [
        'أهلاً بالمذيع الرائع 🔥',
        'ما شاء الله إضاءة وصوت زبطت 👏',
        'تحياتي من الرياض 🇸🇦',
        'لايف أسطوري! استمر 🎉',
        'أحلى بث اليوم والله 💖',
        'مساء الخير للجميع ✨'
      ];
      const mockUserNames = ['أحمد العتيبي', 'سارة الماجد', 'محمد الشمري', 'نورا الفهد', 'خالد الدوسري'];

      const randomComment = mockComments[Math.floor(Math.random() * mockComments.length)];
      const randomUser = mockUserNames[Math.floor(Math.random() * mockUserNames.length)];

      const incomingMsg: RoomMessage = {
        id: `msg_sim_${Date.now()}_${Math.random()}`,
        roomId: room.id,
        userId: `usr_sim_${Math.random()}`,
        userName: randomUser,
        userAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${randomUser}`,
        userRole: 'USER',
        text: randomComment,
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [...prev.slice(-40), incomingMsg]);
    }, 4500);

    return () => clearInterval(chatInterval);
  }, [room.id]);

  // Flip Camera
  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
  };

  // Toggle Mute Audio
  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  // Send Chat Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: RoomMessage = {
      id: `msg_${Date.now()}`,
      roomId: room.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      userRole: currentUser.role,
      text: inputText.trim(),
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
  };

  // Trigger Floating Animated Heart
  const handleAddHeart = () => {
    setLikeCount(prev => prev + 1);

    const newHeart: FloatingHeart = {
      id: `heart_${Date.now()}_${Math.random()}`,
      x: Math.floor(Math.random() * 80) - 40, // random offset
      color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
      size: Math.floor(Math.random() * 12) + 24, // 24px - 36px
      speed: Math.random() * 1 + 1.8 // float speed
    };

    setFloatingHearts(prev => [...prev, newHeart]);

    // Clean up heart after 2.2s animation
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 2200);
  };

  // Double tap screen for hearts
  const handleDoubleTapScreen = (e: React.MouseEvent) => {
    handleAddHeart();
    handleAddHeart();
  };

  // Handle Share Stream
  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2000);
  };

  // Gift Sent Success Callback
  const handleGiftSentSuccess = (
    gift: Gift,
    count: number,
    receiverName: string,
    receiverId: string
  ) => {
    const addedDiamonds = (gift.diamondCost || 10) * count;
    setTotalDiamonds(prev => prev + addedDiamonds);

    const trajectoryItem: GiftTrajectoryItem = {
      id: `gft_${Date.now()}_${Math.random()}`,
      giftId: gift.id,
      giftIcon: gift.icon,
      giftName: gift.nameAr,
      diamondCost: gift.diamondCost,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      receiverId: room.hostId,
      receiverName: room.hostName || 'المذيع',
      count
    };

    setGiftQueue(prev => [...prev, trajectoryItem]);

    // Add chat system announcement
    const giftAnnouncementMsg: RoomMessage = {
      id: `msg_gift_${Date.now()}`,
      roomId: room.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      userRole: currentUser.role,
      text: `🎁 أرسل [${gift.nameAr} x${count}] للمذيع! 🎉`,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, giftAnnouncementMsg]);
  };

  const hostUserObj = {
    id: room.hostId,
    name: room.hostName || 'المذيع المباشر',
    avatar: room.hostAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${room.hostId}`
  };

  return (
    <div
      ref={containerRef}
      onDoubleClick={handleDoubleTapScreen}
      className="fixed inset-0 z-50 bg-gradient-to-b from-[#fffbeb] via-[#fef3c7] to-[#fde68a] text-amber-950 font-sans selection:bg-emerald-600 selection:text-amber-100 flex flex-col justify-between overflow-hidden select-none dir-rtl h-screen w-screen"
    >
      {/* 1. Full Screen Video Layer (100% Edge-to-Edge) */}
      <div className="absolute inset-0 z-0 bg-[#fef3c7] flex items-center justify-center overflow-hidden">
        {stream && !cameraError ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isMuted || isHost}
            className="w-full h-full object-cover scale-x-[-1]"
          />
        ) : (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fde68a]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-400/30 via-transparent to-transparent animate-pulse" />
            <img
              src={room.hostAvatar || room.coverImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800'}
              alt={room.title}
              className="w-36 h-36 rounded-full object-cover border-4 border-amber-600 shadow-2xl shadow-amber-600/30 animate-pulse"
              referrerPolicy="no-referrer"
            />
            <div className="mt-5 px-5 py-2 rounded-full bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-800 text-amber-100 border-2 border-amber-400 font-black text-xs shadow-2xl flex items-center gap-2">
              <Video className="w-4 h-4 text-amber-300 animate-bounce" />
              <span>البث المباشر الفردي 🎥 (Full-Screen Live Stream)</span>
            </div>
          </div>
        )}

        {/* Ambient Top & Bottom Gradients for Contrast */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-amber-950/30 via-amber-950/10 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-amber-950/40 via-amber-950/15 to-transparent pointer-events-none z-10" />
      </div>

      {/* 2. Top Floating Bar (TikTok Style Royal Layout) */}
      <div className="relative z-20 p-3 pt-4 flex items-center justify-between gap-2">
        {/* RIGHT SIDE: Host Info Pill + Follow + Diamonds Counter */}
        <div className="flex items-center gap-2">
          {/* Host Card Pill */}
          <div className="bg-gradient-to-r from-[#fffbeb] via-[#fef3c7] to-[#fde68a] backdrop-blur-xl border-2 border-amber-600/80 rounded-full pl-3 pr-1 py-1 flex items-center gap-2 shadow-2xl shadow-amber-600/20 text-amber-950">
            <div className="relative shrink-0">
              <img
                src={hostUserObj.avatar}
                alt={hostUserObj.name}
                className="w-9 h-9 rounded-full object-cover border-2 border-amber-600"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            </div>

            <div className="flex flex-col min-w-0">
              <span className="font-black text-xs text-amber-950 truncate max-w-[90px] sm:max-w-[130px]">
                {hostUserObj.name}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-emerald-800 font-black">
                <Gem className="w-3 h-3 text-amber-600" />
                <span>{totalDiamonds.toLocaleString()}</span>
              </div>
            </div>

            {/* Follow Button if not host */}
            {!isHost && (
              <button
                onClick={() => setIsFollowingHost(!isFollowingHost)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer flex items-center gap-0.5 shadow-md ${
                  isFollowingHost
                    ? 'bg-emerald-700 text-amber-100 border border-amber-300'
                    : 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-800 text-amber-100 font-black border border-amber-300'
                }`}
              >
                {isFollowingHost ? (
                  <>
                    <Check className="w-3 h-3 text-amber-300" />
                    <span>متابع</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 text-amber-300" />
                    <span>متابعة</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* LEFT SIDE: Live Viewers + Top Supporters + Close Button */}
        <div className="flex items-center gap-2">
          {/* Top Supporters Overlapping Avatars */}
          <div className="hidden sm:flex items-center -space-x-2 space-x-reverse bg-[#fffbeb]/90 backdrop-blur-md px-2 py-1 rounded-full border-2 border-amber-600/60 shadow-md">
            {MOCK_TOP_SUPPORTERS.map(sup => (
              <img
                key={sup.id}
                src={sup.avatar}
                alt="داعم"
                className="w-6 h-6 rounded-full border-2 border-amber-500 object-cover"
                referrerPolicy="no-referrer"
              />
            ))}
          </div>

          {/* Live Viewers Counter */}
          <div className="px-2.5 py-1.5 rounded-full bg-[#fffbeb]/90 backdrop-blur-md border-2 border-amber-600/70 text-amber-950 font-black text-xs flex items-center gap-1.5 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <Eye className="w-3.5 h-3.5 text-emerald-800" />
            <span>{viewerCount.toLocaleString()}</span>
          </div>

          {/* Close Live Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#fffbeb]/90 hover:bg-rose-600 hover:text-white text-amber-950 border-2 border-amber-600/70 shadow-xl cursor-pointer transition-transform active:scale-95"
            title="مغادرة البث"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3. Gift Flying Trajectory Overlay */}
      <GiftTrajectoryOverlay
        containerRef={containerRef}
        queue={giftQueue}
        onItemFinished={(id) => setGiftQueue(prev => prev.filter(q => q.id !== id))}
        currentUserId={currentUser.id}
        hostUserId={room.hostId}
      />

      {/* 4. Floating Hearts Renderer */}
      <div className="absolute right-6 bottom-24 z-30 pointer-events-none w-24 h-80 overflow-hidden">
        {floatingHearts.map(heart => (
          <div
            key={heart.id}
            style={{
              transform: `translateX(${heart.x}px)`,
              color: heart.color,
              fontSize: `${heart.size}px`
            }}
            className="absolute bottom-0 right-4 animate-float-up pointer-events-none opacity-90 drop-shadow-md"
          >
            ❤️
          </div>
        ))}
      </div>

      {/* Share Toast Feedback */}
      {shareToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-800 text-amber-100 font-black text-xs border border-amber-300 shadow-2xl animate-in zoom-in-75 duration-150">
          تم نسخ رابط البث المباشر بنجاح! ↗️
        </div>
      )}

      {/* 5. Bottom Floating Interactive Layer */}
      <div className="relative z-20 p-3 pb-6 space-y-3">
        {/* Floating Transparent Chat Stream */}
        <div className="w-80 max-w-[85vw] max-h-60 overflow-y-auto space-y-2 scrollbar-none pr-1">
          {messages.map(msg => {
            const isSystem = msg.userId === 'system';
            const isGift = msg.text.includes('🎁 أرسل');

            return (
              <div
                key={msg.id}
                className={`px-3 py-1.5 rounded-2xl backdrop-blur-md border-2 text-xs leading-relaxed transition-all shadow-xl w-max max-w-full animate-in slide-in-from-bottom-2 duration-200 ${
                  isSystem
                    ? 'bg-amber-200/90 border-amber-600 text-amber-950 font-black'
                    : isGift
                    ? 'bg-gradient-to-r from-emerald-800 to-emerald-700 border-amber-400 text-amber-100 font-black'
                    : 'bg-[#fffbeb]/95 border-amber-600/70 text-amber-950 font-bold'
                }`}
              >
                {!isSystem && (
                  <span className="font-black text-emerald-800 ml-1.5 shrink-0">
                    {msg.userName}:
                  </span>
                )}
                <span className="break-words">{msg.text}</span>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Bottom Interactive Action Controls Bar */}
        <div className="flex items-center gap-2">
          {/* Chat Comment Input Pill */}
          <form
            onSubmit={handleSendMessage}
            className="flex-1 flex items-center gap-2 bg-[#fffbeb] backdrop-blur-xl border-2 border-amber-600/80 rounded-full px-4 py-2 shadow-2xl focus-within:border-emerald-700"
          >
            <input
              type="text"
              placeholder="إضافة تعليق..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-transparent border-none text-amber-950 font-bold text-xs focus:outline-none placeholder:text-amber-800/70"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`p-1.5 rounded-full transition-transform active:scale-95 cursor-pointer ${
                inputText.trim()
                  ? 'bg-emerald-700 text-amber-100 font-black'
                  : 'text-amber-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5 rotate-180" />
            </button>
          </form>

          {/* Broadcaster Quick Camera Controls (Flip & Mute) */}
          {isHost && (
            <>
              <button
                onClick={toggleCameraFacing}
                className="p-2.5 rounded-full bg-[#fffbeb] hover:bg-amber-100 text-amber-950 border-2 border-amber-600/70 shadow-xl cursor-pointer transition-transform active:scale-95 shrink-0"
                title="تبديل الكاميرا"
              >
                <SwitchCamera className="w-4 h-4 text-emerald-800" />
              </button>

              <button
                onClick={toggleMute}
                className={`p-2.5 rounded-full backdrop-blur-md shadow-xl cursor-pointer transition-transform active:scale-95 shrink-0 ${
                  isMuted
                    ? 'bg-rose-600 text-white ring-2 ring-amber-400'
                    : 'bg-[#fffbeb] text-emerald-800 border-2 border-amber-600/70'
                }`}
                title={isMuted ? 'إلغاء كتم المايك' : 'كتم المايك'}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </>
          )}

          {/* Share Stream Button */}
          <button
            onClick={handleShare}
            className="p-2.5 rounded-full bg-[#fffbeb] hover:bg-amber-100 text-amber-950 border-2 border-amber-600/70 shadow-xl cursor-pointer transition-transform active:scale-95 shrink-0"
            title="مشاركة البث"
          >
            <Share2 className="w-4 h-4 text-emerald-800" />
          </button>

          {/* Gifts Drawer Toggle Button */}
          <button
            onClick={() => setIsGiftsOpen(true)}
            className="p-2.5 rounded-full bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-800 text-amber-100 shadow-xl border border-amber-300 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
            title="إرسال هدية"
          >
            <GiftIcon className="w-4 h-4 text-amber-300" />
          </button>

          {/* Animated Like Heart Button */}
          <button
            onClick={handleAddHeart}
            className="p-2.5 rounded-full bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-xl shadow-rose-600/30 active:scale-125 transition-transform cursor-pointer shrink-0 relative"
            title="إعجاب بالبث"
          >
            <Heart className="w-4 h-4 fill-current text-white" />
            {likeCount > 0 && (
              <span className="absolute -top-2 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-slate-950">
                {likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Gifts Drawer Component */}
      <GiftsDrawer
        isOpen={isGiftsOpen}
        onClose={() => setIsGiftsOpen(false)}
        currentUser={currentUser}
        roomId={room.id}
        roomSeats={[]}
        roomMembers={[]}
        hostUser={hostUserObj}
        onGiftSentSuccess={handleGiftSentSuccess}
        onUserUpdated={onUserUpdated}
        onOpenWallet={() => {}}
      />
    </div>
  );
};
