import React, { useState, useEffect, useRef } from 'react';
import { Room, RoomSeat, RoomMember, RoomMessage, User, Gift, MicRequest, isUserOwner } from '../types';
import { API } from '../services/api';
import { socketService } from '../services/socketService';
import { mediaStreamService } from '../services/mediaStreamService';
import { soundEffects } from '../services/soundEffects';
import { MicStageLayout } from './MicStageLayout';
import { GiftsDrawer } from './GiftsDrawer';
import { PublicProfileModal } from './PublicProfileModal';
import { RoomSettingsModal } from './RoomSettingsModal';
import { DirectMessagesView } from './DirectMessagesView';
import { RoleBadge, UserRoleBadges } from './RoleBadge';
import { GiftTrajectoryOverlay, GiftTrajectoryItem } from './GiftTrajectoryOverlay';
import { RoomEntranceOverlay, RoomEntranceEventPayload } from './RoomEntranceOverlay';
import { EntrancesShopModal } from './EntrancesShopModal';
import {
  HostMicRequestNotification,
  HostMicRequestsModal,
  UserRequestMicModal
} from './MicRequestsManager';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  Gift as GiftIcon,
  Send,
  Users,
  LogOut,
  Share2,
  Copy,
  Check,
  Shield,
  Volume2,
  VolumeX,
  FlipHorizontal,
  Lock,
  Trash2,
  AlertTriangle,
  Radio,
  Sparkles,
  MessageSquare,
  ChevronDown,
  X,
  User as UserIcon,
  Gem,
  Settings,
  Sliders,
  ArrowRight,
  Minimize2,
  Image as ImageIcon,
  Camera
} from 'lucide-react';

interface LiveRoomViewProps {
  room: Room;
  currentUser: User;
  onLeaveRoom: () => void;
  onMinimizeRoom?: () => void;
  onOpenWallet: () => void;
  onOpenReport: (targetType: 'ROOM' | 'USER' | 'MESSAGE', targetId: string, targetName: string) => void;
  onUserUpdated?: (user: User) => void;
  isStealthMode?: boolean;
}

interface GiftBannerItem {
  id: string;
  icon: string;
  name: string;
  senderName: string;
  senderAvatar?: string;
  receiverName: string;
  receiverAvatar?: string;
  count: number;
}

export const LiveRoomView: React.FC<LiveRoomViewProps> = ({
  room,
  currentUser,
  onLeaveRoom,
  onMinimizeRoom,
  onOpenWallet,
  onOpenReport,
  onUserUpdated,
  isStealthMode = false
}) => {
  const [currentRoom, setCurrentRoom] = useState<Room>(room);
  const [seats, setSeats] = useState<RoomSeat[]>([]);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('user');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false);
  const [isGiftsOpen, setIsGiftsOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isHostControlsOpen, setIsHostControlsOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [celebratingUserIds, setCelebratingUserIds] = useState<string[]>([]);
  const [giftTrajectoryQueue, setGiftTrajectoryQueue] = useState<GiftTrajectoryItem[]>([]);
  const [selectedGiftReceiverId, setSelectedGiftReceiverId] = useState<string>(room.hostId);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState(false);
  const [isMessagesDrawerOpen, setIsMessagesDrawerOpen] = useState(false);
  const [showExitConfirmDialog, setShowExitConfirmDialog] = useState(false);
  const [pendingMicRequests, setPendingMicRequests] = useState<MicRequest[]>([]);
  const [incomingRequestForAlert, setIncomingRequestForAlert] = useState<MicRequest | null>(null);
  const [isHostMicRequestsModalOpen, setIsHostMicRequestsModalOpen] = useState(false);
  const [isUserMicRequestModalOpen, setIsUserMicRequestModalOpen] = useState(false);
  const [selectedTargetSeatForRequest, setSelectedTargetSeatForRequest] = useState<number | undefined>(undefined);
  const [myPendingRequest, setMyPendingRequest] = useState<MicRequest | null>(null);
  const [entranceEvent, setEntranceEvent] = useState<RoomEntranceEventPayload | null>(null);
  const [isEntrancesShopOpen, setIsEntrancesShopOpen] = useState(false);

  const roomContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const currentRoomRef = useRef<Room>(currentRoom);
  currentRoomRef.current = currentRoom;
  const membersRef = useRef<RoomMember[]>(members);
  membersRef.current = members;

  const isHost = currentRoom.hostId === currentUser.id || room.hostId === currentUser.id;
  const isModerator = currentUser.role === 'MODERATOR' || currentUser.role === 'ADMIN' || currentUser.role === 'OWNER';

  const isUserHostOrMod = () => {
    const hId = currentRoomRef.current?.hostId || room.hostId;
    if (hId === currentUser.id) return true;
    if (currentUser.role === 'MODERATOR' || currentUser.role === 'ADMIN' || currentUser.role === 'OWNER') return true;
    return membersRef.current.some(m => m.userId === currentUser.id && m.roleInRoom === 'MODERATOR');
  };
  
  // Find which seat current user occupies (if any)
  const mySeat = seats.find(s => s.userId === currentUser.id);
  const isSeated = Boolean(mySeat);

  // Trigger floating grand luxury gift centerpiece animation
  const triggerGiftTrajectoryAnimation = (data: {
    id?: string;
    giftId?: string;
    icon: string;
    name: string;
    diamondCost?: number;
    category?: any;
    senderId?: string;
    senderName: string;
    senderAvatar?: string;
    receiverName: string;
    receiverAvatar?: string;
    receiverId?: string;
    count: number;
  }) => {
    const id = data.id || `traj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setGiftTrajectoryQueue(prev => {
      // Prevent duplicate queue entries for the same transaction
      if (prev.some(item => item.id === id)) {
        return prev;
      }
      const newItem: GiftTrajectoryItem = {
        id,
        giftId: data.giftId,
        giftIcon: data.icon,
        giftName: data.name,
        diamondCost: data.diamondCost,
        category: data.category,
        senderId: data.senderId || currentUser.id,
        senderName: data.senderName,
        senderAvatar: data.senderAvatar,
        receiverId: data.receiverId || currentRoom.hostId,
        receiverName: data.receiverName,
        receiverAvatar: data.receiverAvatar,
        count: data.count || 1
      };
      return [...prev, newItem];
    });
  };

  // Handle celebration arrival impact on target avatar
  const handleArrivalImpact = (receiverId: string) => {
    if (!receiverId) return;
    if (receiverId === 'ALL_MICS') {
      const allSeated = seats.filter(s => s.userId).map(s => s.userId as string);
      setCelebratingUserIds(prev => [...new Set([...prev, ...allSeated, currentRoom.hostId])]);
      setTimeout(() => {
        setCelebratingUserIds(prev => prev.filter(uid => !allSeated.includes(uid) && uid !== currentRoom.hostId));
      }, 2500);
    } else {
      setCelebratingUserIds(prev => [...new Set([...prev, receiverId])]);
      setTimeout(() => {
        setCelebratingUserIds(prev => prev.filter(uid => uid !== receiverId));
      }, 2500);
    }
  };

  // Auto-persist currentRoom state into localStorage so room is never lost
  useEffect(() => {
    if (currentRoom && currentRoom.id) {
      try {
        const c1 = localStorage.getItem('roomsList');
        const c2 = localStorage.getItem('hekawy_persistent_rooms');
        const list1: Room[] = c1 ? JSON.parse(c1) : [];
        const list2: Room[] = c2 ? JSON.parse(c2) : [];
        const map = new Map<string, Room>();
        [...list1, ...list2].forEach(r => { if (r && r.id) map.set(r.id, r); });
        map.set(currentRoom.id, currentRoom);
        const updated = Array.from(map.values());
        localStorage.setItem('roomsList', JSON.stringify(updated));
        localStorage.setItem('hekawy_persistent_rooms', JSON.stringify(updated));
      } catch {}
    }
  }, [currentRoom]);

  // Intercept back button to show exit modal
  useEffect(() => {
    // 1. إضافة حالة في الـ history بمجرد دخول الغرفة
    try {
      window.history.pushState({ inRoom: true }, "");
    } catch {
      // Ignore security errors in sandboxes
    }

    // 2. الاستماع لزر الرجوع في الهاتف/المتصفح
    const handlePopState = (event: PopStateEvent) => {
      // منع الخروج المباشر وفتح النافذة
      setShowExitConfirmDialog(true);
      // إعادة إضافة الحالة لمنع المتصفح من الخروج إذا ضغط رجوع مرة ثانية
      try {
        window.history.pushState({ inRoom: true }, "");
      } catch {}
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Synchronize currentUser's seat name, avatar, and custom frame instantly when updated
  useEffect(() => {
    if (currentUser) {
      setSeats(prevSeats =>
        prevSeats.map(seat => {
          if (seat.userId === currentUser.id) {
            return {
              ...seat,
              userName: currentUser.name,
              userAvatar: currentUser.avatar,
              customFrameUrl: currentUser.customFrameUrl || seat.customFrameUrl,
              userGender: currentUser.gender
            };
          }
          return seat;
        })
      );
    }
  }, [currentUser?.name, currentUser?.avatar, currentUser?.customFrameUrl, currentUser?.gender]);

  // Initialize room socket & state
  useEffect(() => {
    const isOwner = isUserOwner(currentUser);
    const isStealthActive = isOwner && (isStealthMode || currentUser.isStealthMode === true);

    if (!isStealthActive) {
      soundEffects.playJoinRoom();
    }
    socketService.joinRoom(room.id, currentUser.id, isStealthActive);

    // Initial fetch of room data & seats
    API.getRoom(room.id).then(data => {
      setCurrentRoom(data.room);
      setSeats(data.seats || []);
      setMembers(data.members || []);
    }).catch(() => {});

    // Listen to real-time room events
    const unsubSnapshot = socketService.on('room_snapshot', (data) => {
      if (data.roomId === room.id) {
        if (data.room) setCurrentRoom(data.room);
        if (data.seats) setSeats(data.seats);
        if (data.members) setMembers(data.members);
        if (data.messages) setMessages(data.messages);
      }
    });

    const unsubSeats = socketService.on('seats_updated', (data) => {
      if (data.roomId === room.id) {
        if (data.seats) setSeats(data.seats);
        if (data.members) setMembers(data.members);
      }
    });

    const unsubChat = socketService.on('new_chat_message', (data) => {
      if (data.roomId === room.id) {
        setMessages(prev => [...prev, data.message]);
      }
    });

    // 3D Entrance Animation Event Listeners
    const unsubMemberJoined = socketService.on('member_joined', (data) => {
      if (data.roomId === room.id) {
        if (data.member) {
          setMembers(prev => [...prev.filter(m => m.userId !== data.member.userId), data.member]);
        }
        if (data.entrance) {
          setEntranceEvent(data.entrance);
        }
        if (data.viewerCount !== undefined) {
          setCurrentRoom(prev => ({ ...prev, viewerCount: data.viewerCount }));
        }
      }
    });

    const unsubMemberLeft = socketService.on('member_left', (data) => {
      if (data.roomId === room.id) {
        if (data.userId) {
          setMembers(prev => prev.filter(m => m.userId !== data.userId));
        }
        if (data.seats) {
          setSeats(data.seats);
        }
        if (data.viewerCount !== undefined) {
          setCurrentRoom(prev => ({ ...prev, viewerCount: data.viewerCount }));
        }
      }
    });

    const unsubRoomEntrance = socketService.on('room_entrance', (data) => {
      if (data.roomId === room.id && data.entrance) {
        setEntranceEvent(data.entrance);
      }
    });

    const unsubGift = socketService.on('gift_received', (data) => {
      if (data.roomId === room.id && data.transaction) {
        const tx = data.transaction;
        triggerGiftTrajectoryAnimation({
          id: tx.id,
          giftId: data.gift?.id || (tx as any).giftId,
          icon: tx.giftIcon,
          name: tx.giftName,
          diamondCost: data.gift?.diamondCost || (tx.totalDiamonds ? Math.round(tx.totalDiamonds / (tx.count || 1)) : undefined),
          category: data.gift?.category,
          senderId: tx.senderId,
          senderName: tx.senderName,
          senderAvatar: tx.senderAvatar,
          receiverName: tx.receiverName,
          receiverAvatar: tx.receiverAvatar,
          receiverId: tx.receiverId,
          count: tx.count
        });
      }
    });

    const unsubPeerAudio = socketService.on('peer_audio_level', (data) => {
      if (data.roomId === room.id) {
        setSeats(prev => prev.map(s => {
          if (s.userId === data.userId) {
            return { ...s, isSpeaking: data.isSpeaking };
          }
          return s;
        }));
      }
    });

    const unsubEnd = socketService.on('room_ended', (data) => {
      if (data.roomId === room.id) {
        alert('تم إنهاء الغرفة بواسطة المضيف.');
        handleSafeLeave();
      }
    });

    const unsubKick = socketService.on('kicked_from_room', (data) => {
      if (data.roomId === room.id) {
        alert('قام المضيف بإزالتك من الغرفة.');
        handleSafeLeave();
      }
    });

    const unsubAutoBan = socketService.on('user_auto_banned', (data) => {
      if (data.roomId === room.id) {
        if (data.userId === currentUser.id) {
          alert(`⛔ تم حظر حسابك فوراً من قِبل نظام الرقابة الآلي!\nالسبب: ${data.reason || 'مخالفة معايير الآداب والملابس والحشمة'}\nفك الحظر متاح من خلال لوحة الإدارة فقط.`);
          handleSafeLeave();
        } else {
          // System message about auto-ban
          setMessages(prev => [
            ...prev,
            {
              id: `sys-ban-${Date.now()}`,
              roomId: room.id,
              userId: 'SYSTEM',
              userName: '🛡️ نظام الرقابة الذكي',
              userAvatar: '',
              content: `⚠️ تم حظر المستخدم ${data.userName || ''} وحجبه تلقائياً لمخالفة سياسة المحتوى والآداب.`,
              createdAt: new Date().toISOString()
            }
          ]);
          setSeats(prev => prev.map(s => s.userId === data.userId ? { ...s, userId: null, userName: null, userAvatar: null, isMuted: true, isVideoOn: false, isSpeaking: false } : s));
          setMembers(prev => prev.filter(m => m.userId !== data.userId));
        }
      }
    });

    const unsubCensored = socketService.on('content_censored', (data) => {
      if (data.roomId === room.id) {
        setMessages(prev => [
          ...prev,
          {
            id: `sys-censor-${Date.now()}`,
            roomId: room.id,
            userId: 'SYSTEM',
            userName: '🛡️ الرقابة الآلية',
            userAvatar: '',
            content: `🚫 تم حجب محتوى مخالف في الغرفة فوراً: ${data.reason || 'مخالفة معايير الحشمة'}`,
            createdAt: new Date().toISOString()
          }
        ]);
      }
    });

    // Fetch pending mic requests from DB (preserved even if host was offline)
    if (isHost || isModerator) {
      API.getMicRequests(room.id).then(reqs => {
        if (reqs && reqs.length > 0) {
          setPendingMicRequests(reqs);
        }
      }).catch(err => console.warn('Error fetching mic requests:', err));
    } else {
      API.getMyMicRequestStatus(room.id, currentUser.id).then(req => {
        if (req && req.status === 'PENDING') {
          setMyPendingRequest(req);
        }
      }).catch(err => console.warn('Error fetching user mic request status:', err));
    }

    const unsubMicReq = socketService.on('new_mic_request', (data) => {
      if (data.roomId === room.id && isUserHostOrMod()) {
        setPendingMicRequests(prev => [...prev.filter(r => r.id !== data.request.id), data.request]);
        setIncomingRequestForAlert(data.request);
        soundEffects.playNotification();
      }
    });

    const unsubMicReqsUpdated = socketService.on('mic_requests_updated', (data) => {
      if (data.roomId === room.id && isUserHostOrMod()) {
        setPendingMicRequests(data.requests || []);
      }
    });

    const unsubMicReqSubmitted = socketService.on('mic_request_submitted', (data) => {
      if (data.roomId === room.id && data.request.userId === currentUser.id) {
        setMyPendingRequest(data.request);
      }
    });

    const unsubMicReqCancelled = socketService.on('mic_request_cancelled', (data) => {
      if (data.roomId === room.id) {
        setPendingMicRequests(prev => prev.filter(r => r.userId !== data.userId));
        setIncomingRequestForAlert(prev => prev?.userId === data.userId ? null : prev);
        if (data.userId === currentUser.id) {
          setMyPendingRequest(null);
        }
      }
    });

    const unsubMicReqError = socketService.on('mic_request_error', (data) => {
      if (data.roomId === room.id) {
        alert(data.message || 'حدث خطأ في طلب المايك');
      }
    });

    const unsubMicReqResolved = (data: any) => {
      if (data.roomId === room.id) {
        if (!data.userId || data.userId === currentUser.id) {
          setMyPendingRequest(null);
          if (data.status === 'ACCEPTED') {
            soundEffects.playMicOn();
            soundEffects.playNotification();
            handleStartMic(data.seatIndex);
            alert(data.message || 'تهانينا! وافق صاحب الغرفة على صعودك على المايك 🎙️');
          } else if (data.status === 'REJECTED') {
            alert(data.message || 'عذراً، اعتذر صاحب الغرفة عن قبول طلب المايك في الوقت الحالي.');
          }
        }
      }
    };
    const unsubResolved = socketService.on('mic_request_resolved', unsubMicReqResolved);

    const unsubLayout = socketService.on('room_layout_updated', (data) => {
      if (data.roomId === room.id) {
        if (data.micLayout) {
          setCurrentRoom(prev => ({
            ...prev,
            micLayout: data.micLayout,
            seatsCount: data.seatsCount || prev.seatsCount
          }));
        }
        if (data.seats) setSeats(data.seats);
      }
    });

    const unsubSettings = socketService.on('room_settings_updated', (data) => {
      if (data.roomId === room.id && data.room) {
        setCurrentRoom(prev => ({
          ...prev,
          ...data.room
        }));
        if (data.seats) setSeats(data.seats);
      }
    });

    const unsubRoomEffect = socketService.on('room_effect_played', (data) => {
      if (data.roomId === room.id) {
        if (data.userId !== currentUser.id && data.effectId) {
          soundEffects.playRoomEffect(data.effectId);
        }
      }
    });

    return () => {
      unsubSnapshot();
      unsubSeats();
      unsubChat();
      unsubMemberJoined();
      unsubMemberLeft();
      unsubRoomEntrance();
      unsubGift();
      unsubPeerAudio();
      unsubEnd();
      unsubKick();
      unsubAutoBan();
      unsubCensored();
      unsubMicReq();
      unsubMicReqsUpdated();
      unsubMicReqSubmitted();
      unsubMicReqCancelled();
      unsubMicReqError();
      unsubResolved();
      unsubLayout();
      unsubSettings();
      unsubRoomEffect();
      mediaStreamService.cleanupAllMedia();
      socketService.leaveRoom(room.id, currentUser.id);
    };
  }, [room.id, currentUser.id]);

  const handleLayoutChange = async (newLayout: any) => {
    socketService.changeMicLayout(currentRoom.id, newLayout);
    try {
      await API.updateRoomLayout(currentRoom.id, newLayout);
    } catch (err) {
      console.warn('API layout update error:', err);
    }
  };

  // Scroll chat to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sync local camera stream to video tag
  useEffect(() => {
    if (localVideoRef.current && isCameraActive) {
      const stream = mediaStreamService.getLocalVideoStream();
      if (stream) {
        localVideoRef.current.srcObject = stream;
      }
    }
  }, [isCameraActive]);

  // Start microphone directly (called when accepted onto stage)
  const handleStartMic = async (seatIdx?: number) => {
    try {
      const res = await mediaStreamService.startMicrophone((level, isSpeaking) => {
        setAudioLevel(level);
        setIsSpeakingLocal(isSpeaking);
        const s = seatIdx !== undefined ? seatIdx : (mySeat?.seatIndex ?? 0);
        socketService.sendAudioLevel(room.id, currentUser.id, level, isSpeaking);
      });

      if (res.success) {
        setIsMicActive(true);
        setIsMuted(false);
        soundEffects.playMicOn();
        const s = seatIdx !== undefined ? seatIdx : (mySeat?.seatIndex ?? 0);
        socketService.updateSeatMedia(room.id, s, false, isCameraActive, true);
      }
    } catch (e) {
      console.warn('Microphone auto-start note:', e);
    }
  };

  // Real-time synchronization polling fallback for mic requests (every 2.5s)
  useEffect(() => {
    let isCancelled = false;

    const interval = setInterval(async () => {
      if (isCancelled) return;
      const isCurrentlyHostOrMod = isUserHostOrMod();

      if (isCurrentlyHostOrMod) {
        try {
          const reqs = await API.getMicRequests(room.id);
          if (!isCancelled && Array.isArray(reqs)) {
            setPendingMicRequests(reqs);
            // If there's an active request and no alert currently shown, pop up alert
            if (reqs.length > 0 && !incomingRequestForAlert) {
              setIncomingRequestForAlert(reqs[0]);
            }
          }
        } catch {}
      } else if (!isSeated) {
        try {
          const myReq = await API.getMyMicRequestStatus(room.id, currentUser.id);
          if (!isCancelled) {
            if (myReq && myReq.status === 'PENDING') {
              setMyPendingRequest(myReq);
            } else if (myPendingRequest && myPendingRequest.status === 'PENDING') {
              setMyPendingRequest(null);
            }
          }
        } catch {}
      }
    }, 2500);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [room.id, currentUser.id, isSeated, incomingRequestForAlert, myPendingRequest]);

  // Handle Real Mic Toggle
  const handleToggleMic = async () => {
    if (!isSeated && !isHost) {
      alert('يجب أن تكون على أحد المايكات الثمانية أولاً لتشغيل الصوت.');
      return;
    }

    if (!isMicActive) {
      // Start microphone
      const res = await mediaStreamService.startMicrophone((level, isSpeaking) => {
        setAudioLevel(level);
        setIsSpeakingLocal(isSpeaking);
        if (mySeat) {
          socketService.sendAudioLevel(room.id, currentUser.id, level, isSpeaking);
        }
      });

      if (!res.success) {
        alert(res.error || 'تعذر تشغيل الميكروفون');
        return;
      }

      setIsMicActive(true);
      setIsMuted(false);
      soundEffects.playMicOn();

      if (mySeat) {
        socketService.updateSeatMedia(room.id, mySeat.seatIndex, false, isCameraActive, true);
      }
    } else if (!isMuted) {
      // Mute microphone
      mediaStreamService.setMicrophoneMuted(true);
      setIsMuted(true);
      soundEffects.playMicOff();
      if (mySeat) {
        socketService.updateSeatMedia(room.id, mySeat.seatIndex, true, isCameraActive, false);
      }
    } else {
      // Unmute microphone
      mediaStreamService.setMicrophoneMuted(false);
      setIsMuted(false);
      soundEffects.playMicOn();
      if (mySeat) {
        socketService.updateSeatMedia(room.id, mySeat.seatIndex, false, isCameraActive, true);
      }
    }
  };

  // Turn off mic completely
  const handleStopMic = () => {
    mediaStreamService.stopMicrophone();
    setIsMicActive(false);
    setIsMuted(false);
    setAudioLevel(0);
    setIsSpeakingLocal(false);
    soundEffects.playMicOff();
    if (mySeat) {
      socketService.updateSeatMedia(room.id, mySeat.seatIndex, false, isCameraActive, false);
    }
  };

  // Handle Real Camera Toggle
  const handleToggleCamera = async () => {
    if (!currentRoom.allowVideo) {
      alert('هذه الغرفة صوتية فقط، الكاميرا غير مفعلة من قِبل المضيف.');
      return;
    }
    if (!isSeated && !isHost) {
      alert('يجب أن تكون على المايك لتشغيل الكاميرا.');
      return;
    }

    if (!isCameraActive) {
      const res = await mediaStreamService.startCamera(currentFacingMode);
      if (!res.success) {
        alert(res.error || 'تعذر تشغيل الكاميرا');
        return;
      }
      setIsCameraActive(true);
      if (mySeat) {
        socketService.updateSeatMedia(room.id, mySeat.seatIndex, isMuted, true, isSpeakingLocal);
      }
    } else {
      mediaStreamService.stopCamera();
      setIsCameraActive(false);
      if (mySeat) {
        socketService.updateSeatMedia(room.id, mySeat.seatIndex, isMuted, false, isSpeakingLocal);
      }
    }
  };

  // Switch Front/Back Camera
  const handleSwitchCamera = async () => {
    if (!isCameraActive) return;
    const res = await mediaStreamService.switchCamera();
    if (res.success && res.facingMode) {
      setCurrentFacingMode(res.facingMode);
    }
  };

  // Request Mic Actions
  const handleOpenUserMicModal = (targetSeatIndex?: number) => {
    setSelectedTargetSeatForRequest(targetSeatIndex);
    setIsUserMicRequestModalOpen(true);
  };

  const handleSubmitMicRequest = async (targetSeatIndex?: number) => {
    if (myPendingRequest && myPendingRequest.status === 'PENDING') {
      alert('لديك طلب صعود إلى المايك قيد الانتظار بالفعل.');
      return;
    }

    const optimisticReq: MicRequest = {
      id: `req_temp_${Date.now()}`,
      roomId: room.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      targetSeatIndex,
      seatLabel: targetSeatIndex !== undefined ? `المقعد رقم ${targetSeatIndex + 1}` : 'أي مقعد متاح',
      requestedAt: new Date().toISOString(),
      status: 'PENDING'
    };
    setMyPendingRequest(optimisticReq);

    // Send via socket and fallback API
    socketService.requestMic(room.id, currentUser.id, targetSeatIndex);
    try {
      const res = await API.requestMic(room.id, currentUser.id, targetSeatIndex);
      if (!res.success && res.error) {
        setMyPendingRequest(null);
        alert(res.error);
      } else if (res.request) {
        setMyPendingRequest(res.request);
      }
    } catch (err) {
      console.warn('API requestMic fallback error:', err);
    }
    soundEffects.playNotification();
  };

  const handleCancelMicRequest = async () => {
    socketService.cancelMicRequest(room.id, currentUser.id);
    setMyPendingRequest(null);
    try {
      await API.cancelMicRequest(room.id, currentUser.id);
    } catch (err) {
      console.warn('API cancelMicRequest fallback error:', err);
    }
  };

  const handleAcceptMicRequest = (requestId: string, targetSeatIndex?: number) => {
    socketService.resolveMicRequest(requestId, 'ACCEPTED', targetSeatIndex);
    setPendingMicRequests(prev => prev.filter(r => r.id !== requestId));
    if (incomingRequestForAlert?.id === requestId) {
      setIncomingRequestForAlert(null);
    }
    API.resolveMicRequest(room.id, requestId, 'ACCEPTED', targetSeatIndex).catch(console.warn);
  };

  const handleRejectMicRequest = (requestId: string) => {
    socketService.resolveMicRequest(requestId, 'REJECTED');
    setPendingMicRequests(prev => prev.filter(r => r.id !== requestId));
    if (incomingRequestForAlert?.id === requestId) {
      setIncomingRequestForAlert(null);
    }
    API.resolveMicRequest(room.id, requestId, 'REJECTED').catch(console.warn);
  };

  // Click on empty seat to take it (or request if listener)
  const handleSeatClick = (seat: RoomSeat) => {
    if (seat.userId === currentUser.id) {
      // Already on this seat -> option to leave seat
      if (confirm('هل ترغب في مغادرة المايك؟')) {
        handleStopMic();
        if (isCameraActive) mediaStreamService.stopCamera();
        socketService.leaveSeat(room.id, seat.seatIndex);
      }
      return;
    }

    if (seat.isLocked) {
      alert('هذا المقعد مقفل بواسطة المضيف.');
      return;
    }

    if (seat.userId) {
      // Clicked on an occupied seat -> Open the user's Public Profile Card!
      setSelectedProfileUserId(seat.userId);
      setIsProfileOpen(true);
      return;
    }

    if (isHost || isModerator) {
      // Host or mod can directly sit
      socketService.takeSeat(room.id, seat.seatIndex, currentUser.id);
    } else {
      // Listener clicked on empty seat -> Open Request Mic Modal pre-selecting this seat!
      handleOpenUserMicModal(seat.seatIndex);
    }
  };

  // Host seat actions
  const handleHostAction = (action: 'mute_seat' | 'kick_seat' | 'lock_seat', seat: RoomSeat) => {
    if (action === 'mute_seat') {
      socketService.hostControl(room.id, 'mute_seat', undefined, seat.seatIndex);
    } else if (action === 'kick_seat') {
      socketService.leaveSeat(room.id, seat.seatIndex);
    } else if (action === 'lock_seat') {
      socketService.hostControl(room.id, 'lock_seat', undefined, seat.seatIndex);
    }
  };

  // Send Chat Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socketService.sendChatMessage(room.id, currentUser.id, chatInput.trim());
    setChatInput('');
  };

  // Safe Leave Room (stops media tracks completely)
  const handleSafeLeave = () => {
    mediaStreamService.cleanupAllMedia();
    socketService.leaveRoom(room.id, currentUser.id);
    onLeaveRoom();
  };

  // Copy Room Share Link & Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentRoom.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Upload Room Cover Image (Host / Owner only)
  const handleRoomCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('حجم الصورة كبير، يرجى اختيار صورة أقل من 8 ميجابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64Url = ev.target?.result as string;
      if (!base64Url) return;

      try {
        const res = await API.updateRoomSettings(room.id, currentUser.id, {
          coverImage: base64Url
        });

        if (res.room) {
          setCurrentRoom(prev => ({ ...prev, coverImage: res.room.coverImage }));
        }

        socketService.updateRoomSettings(room.id, currentUser.id, {
          coverImage: base64Url
        });

        alert('تم تحديث صورة الغرفة بنجاح وبشكل فوري! 🖼️✨');
      } catch (err: any) {
        alert(err.message || 'تعذر تحديث صورة الغرفة');
      }
    };
    reader.readAsDataURL(file);
  };

  // Upload Custom Mic Frame (Host / Seated User)
  const handleCustomFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('حجم الملف كبير، يرجى اختيار ملف أقل من 15 ميجابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64Url = ev.target?.result as string;
      if (!base64Url) return;

      try {
        localStorage.setItem('user_custom_mic_frame', base64Url);

        // Find user seat index or host seat
        const mySeatIdx = seats.findIndex(s => s.userId === currentUser.id);
        const targetSeatIndex = mySeatIdx !== -1 ? mySeatIdx : (isHost ? 0 : -1);

        if (targetSeatIndex !== -1) {
          socketService.send({
            type: 'update_seat_frame',
            roomId: room.id,
            seatIndex: targetSeatIndex,
            customFrameUrl: base64Url
          });

          setSeats(prev => prev.map(s => s.seatIndex === targetSeatIndex ? { ...s, customFrameUrl: base64Url } : s));
        }

        alert('تم رفع وتفعيل إطار المايك الجديد بنجاح! 🖼️✨');
      } catch (err: any) {
        alert(err.message || 'تعذر رفع الإطار');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      ref={roomContainerRef}
      id="live-room-container"
      className="relative h-screen max-h-screen w-full bg-slate-950 flex flex-col justify-between select-none overflow-hidden"
    >
      {/* Real-time Dynamic Gift Trajectory Overlay (Sender Mic -> Continuous Slow Path -> Receiver Mic Center) */}
      <GiftTrajectoryOverlay
        containerRef={roomContainerRef}
        queue={giftTrajectoryQueue}
        seats={seats}
        onItemFinished={(finishedId) => {
          setGiftTrajectoryQueue(prev => prev.filter(item => item.id !== finishedId));
        }}
        onArrivalImpact={handleArrivalImpact}
        currentUserId={currentUser.id}
        hostUserId={currentRoom.hostId}
      />



      {/* 3. ULTRA-COMPACT HEADER (Single ultra-thin, transparent line) */}
      <div className="relative z-30 h-10 px-3 py-1 flex items-center justify-between gap-2 w-full shrink-0 bg-slate-950/50 backdrop-blur-md border-b border-slate-800/40 select-none">
        {/* Right Side (RTL): Viewers count + Host small avatar */}
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={() => setIsMembersOpen(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-amber-300 text-[10px] font-bold border border-slate-800 transition-all active:scale-95 cursor-pointer shadow-sm shrink-0"
            title="المتواجدون في الغرفة"
          >
            <Users className="w-3 h-3 text-amber-400" />
            <span>{Math.max(1, members.length, currentRoom.viewerCount || 0, seats.filter(s => s.userId).length)}</span>
          </button>

          <div
            onClick={() => {
              setSelectedProfileUserId(currentRoom.hostId);
              setIsProfileOpen(true);
            }}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-900/70 border border-slate-800/80 cursor-pointer hover:bg-slate-800/80 transition-colors shrink-0"
            title="عرض ملف المضيف"
          >
            <img
              src={currentRoom.hostAvatar}
              alt={currentRoom.hostName}
              className="w-5 h-5 rounded-full object-cover border border-amber-400/80 shrink-0"
              referrerPolicy="no-referrer"
            />
            <span className="text-[10px] font-bold text-slate-200 truncate max-w-[65px] hidden xs:inline">
              {currentRoom.hostName}
            </span>
          </div>
        </div>

        {/* Center: Room Name & ID Code */}
        <div className="flex flex-col items-center justify-center min-w-0 px-1">
          <h1 className="text-xs font-black text-amber-300 truncate max-w-[140px] sm:max-w-[220px] leading-tight">
            {currentRoom.title}
          </h1>
          <button
            onClick={handleCopyCode}
            className="text-[9px] text-slate-400 hover:text-amber-300 font-mono flex items-center gap-0.5"
            title="نسخ كود الغرفة"
          >
            <span>ID: {currentRoom.roomCode}</span>
            {copiedCode ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
          </button>
        </div>

        {/* Left Side (RTL): Close (X) & Minimize button */}
        <div className="flex items-center gap-1 shrink-0">
          {onMinimizeRoom && (
            <button
              onClick={onMinimizeRoom}
              className="p-1 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all active:scale-95 cursor-pointer"
              title="تصغير الغرفة"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setShowExitConfirmDialog(true)}
            className="p-1 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
            title="خروج من الغرفة"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Host Controls Dropdown Sheet */}
      {isHostControlsOpen && (isHost || isModerator) && (
        <div className="bg-slate-900 border-b border-purple-500/30 p-2.5 flex flex-wrap items-center justify-between gap-2 z-20 animate-in slide-in-from-top duration-150">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-purple-200">إدارة الغرفة والمايكات</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <label className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold cursor-pointer transition-colors active:scale-95">
              <ImageIcon className="w-3 h-3 text-emerald-400" />
              <span>تعديل غلاف الغرفة</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleRoomCoverUpload}
                className="hidden"
              />
            </label>

            <button
              id="host-sheet-settings-btn"
              onClick={() => {
                setIsRoomSettingsOpen(true);
                setIsHostControlsOpen(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold"
            >
              <Settings className="w-3 h-3 text-amber-400" />
              <span>إعدادات الغرفة</span>
            </button>

            <button
              onClick={() => socketService.hostControl(room.id, 'mute_all')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold"
            >
              <VolumeX className="w-3 h-3 text-amber-400" />
              <span>كتم الكل</span>
            </button>

            <button
              onClick={() => socketService.hostControl(room.id, 'unmute_all')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold"
            >
              <Volume2 className="w-3 h-3 text-emerald-400" />
              <span>فتح الكل</span>
            </button>

            <button
              onClick={async () => {
                if (confirm('هل أنت متأكد من حذف الغرفة نهائياً؟ لا يمكن الاستعادة بعد الحذف.')) {
                  try {
                    await API.deleteRoom(room.id, currentUser.id);
                  } catch (e) {
                    socketService.hostControl(room.id, 'end_room');
                  }
                  handleSafeLeave();
                }
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/50 text-[11px] font-bold cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>حذف الغرفة</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. CENTER STAGE: 5-COL GRID COMPACT MIC STAGE */}
      <div className="flex-1 overflow-y-auto min-h-0 w-full max-w-4xl mx-auto px-2 pt-2 sm:pt-3 pb-2 flex flex-col items-center justify-start gap-2 custom-scrollbar">
        {/* Real Camera Video Preview if active */}
        {isCameraActive && (
          <div className="relative w-full max-w-xs h-36 sm:h-44 rounded-2xl overflow-hidden bg-slate-900 border-2 border-cyan-400 shadow-xl">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${currentFacingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
            <div className="absolute top-1.5 inset-x-1.5 flex items-center justify-between">
              <span className="px-2 py-0.5 bg-cyan-500/80 text-slate-950 font-extrabold text-[9px] rounded-full">
                📹 بث الكاميرا الحقيقي
              </span>
              <button
                onClick={handleSwitchCamera}
                className="p-1 bg-slate-900/80 hover:bg-slate-900 text-cyan-300 rounded-full border border-cyan-500/40"
                title="تبديل الكاميرا"
              >
                <FlipHorizontal className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* RESPONSIVE MICROPHONE STAGE */}
        <MicStageLayout
          seats={seats}
          layoutMode={currentRoom.micLayout || '2+15'}
          currentUser={currentUser}
          isHost={isHost}
          celebratingUserIds={celebratingUserIds}
          selectedGiftReceiverId={selectedGiftReceiverId}
          isGiftsOpen={isGiftsOpen}
          isCameraActive={isCameraActive}
          onSeatClick={handleSeatClick}
          onHostAction={handleHostAction}
          onLayoutChange={isHost ? handleLayoutChange : undefined}
          viewerCount={Math.max(1, members.length, currentRoom.viewerCount || 0, seats.filter(s => s.userId).length)}
          onOpenMembers={() => setIsMembersOpen(!isMembersOpen)}
          onExitClick={() => setShowExitConfirmDialog(true)}
          onChangeFrameUpload={handleCustomFrameUpload}
          pendingMicRequestsCount={pendingMicRequests.length}
          onOpenMicRequests={() => setIsHostMicRequestsModalOpen(true)}
          roomTitle={currentRoom.title}
          localVideoElement={
            isCameraActive ? (
              <video
                autoPlay
                playsInline
                muted
                ref={(el) => {
                  if (el) {
                    const stream = mediaStreamService.getLocalVideoStream();
                    if (stream) el.srcObject = stream;
                  }
                }}
                className="w-full h-full object-cover"
              />
            ) : null
          }
        />

        {/* Real Audio Volume Meter */}
        {isMicActive && (
          <div className="w-full max-w-xs flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800">
            <Volume2 className={`w-3.5 h-3.5 ${audioLevel > 15 ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-75"
                style={{ width: `${audioLevel}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-slate-400">{audioLevel}%</span>
          </div>
        )}
      </div>

      {/* 2. REAL-TIME FLOATING LIVE STREAM CHAT AREA (Sleek floating chat directly under 17 mics stage) */}
      <div className="w-full max-w-lg mx-auto px-3 shrink-0 my-1 z-20">
        <div className="h-[70px] xs:h-[80px] sm:h-[90px] max-h-[90px] overflow-y-auto rounded-2xl bg-slate-950/25 backdrop-blur-xs p-1 flex flex-col gap-1 custom-scrollbar">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-xl transition-colors self-start max-w-[95%] ${
                msg.giftData
                  ? 'bg-amber-500/20 border border-amber-500/30'
                  : 'bg-slate-900/60 border border-slate-800/50 hover:bg-slate-900/80'
              }`}
            >
              <img
                src={msg.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.userId}`}
                alt={msg.userName}
                onClick={() => {
                  if (msg.userId) {
                    setSelectedProfileUserId(msg.userId);
                    setIsProfileOpen(true);
                  }
                }}
                className="w-3.5 h-3.5 rounded-full object-cover mt-0.5 cursor-pointer hover:opacity-80 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="leading-tight min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    if (msg.userId) {
                      setSelectedProfileUserId(msg.userId);
                      setIsProfileOpen(true);
                    }
                  }}
                  className="font-black text-amber-300 ml-1 hover:underline cursor-pointer text-right inline"
                >
                  {msg.userName}:
                </button>
                <span className={msg.giftData ? 'font-bold text-amber-200' : 'text-slate-100 font-medium'}>
                  {msg.text}
                </span>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* 4. COMPACT FLOATING BOTTOM CONTROLS BAR */}
      <div className="shrink-0 z-30 pb-2 px-3 pt-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent">
        <div className="max-w-md mx-auto flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 shadow-2xl">
          {/* Quick Chat Input Field */}
          <form onSubmit={handleSendMessage} className="flex-1 min-w-0 flex items-center gap-1 bg-slate-950/70 rounded-xl px-2.5 py-1 border border-slate-800 focus-within:border-amber-400">
            <input
              type="text"
              placeholder="اكتب رسالة..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="w-full bg-transparent text-slate-100 text-xs focus:outline-none placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="p-1 text-amber-400 hover:text-amber-300 disabled:text-slate-600 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 rotate-180" />
            </button>
          </form>

          {/* Action Buttons: 1. Messages counter | 2. Golden Gifts Box | 3. Mic Toggle | 4. More/Shield */}
          <div className="flex items-center gap-1 shrink-0">
            {/* 1. الرسائل (Messages) */}
            <button
              onClick={() => setIsMessagesDrawerOpen(true)}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 hover:text-amber-300 border border-slate-700/80 active:scale-95 transition-all cursor-pointer relative"
              title="الرسائل والمحادثات الخاصة"
            >
              <MessageSquare className="w-4 h-4 text-amber-400" />
            </button>

            {/* 2. الهدايا الذهبية (Golden Gifts Box) */}
            <button
              id="bottom-gift-btn"
              onClick={() => setIsGiftsOpen(true)}
              className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
              title="صندوق الهدايا الذهبي"
            >
              <GiftIcon className="w-4 h-4 animate-bounce" />
            </button>

            {/* 3. المايك (Mic) */}
            {isSeated || isHost ? (
              <button
                id="bottom-seated-mic-btn"
                onClick={handleToggleMic}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isMicActive
                    ? isMuted
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                    : 'bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
                title={isMicActive ? (isMuted ? 'إلغاء الكتم' : 'كتم المايك') : 'تشغيل المايك'}
              >
                {isMicActive ? (isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 animate-pulse" />) : <Mic className="w-4 h-4" />}
              </button>
            ) : myPendingRequest ? (
              <button
                id="bottom-mic-pending-btn"
                onClick={() => setIsUserMicRequestModalOpen(true)}
                className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/80 transition-all shadow-md animate-pulse cursor-pointer"
                title="طلبك قيد الانتظار"
              >
                <Hand className="w-4 h-4 text-amber-400" />
              </button>
            ) : (
              <button
                id="bottom-request-mic-btn"
                onClick={() => handleOpenUserMicModal(undefined)}
                className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-amber-400 border border-amber-500/30 transition-all cursor-pointer"
                title="طلب الصعود للمايك"
              >
                <Hand className="w-4 h-4" />
              </button>
            )}

            {/* 4. المزيد / الإعدادات (More / Shield) */}
            {(isHost || isModerator) && (
              <button
                onClick={() => setIsHostControlsOpen(!isHostControlsOpen)}
                className="p-2 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-purple-300 transition-all active:scale-95 cursor-pointer"
                title="أدوات الإدارة والمزيد"
              >
                <Shield className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* In-Room Direct Messages Drawer / Modal */}
      {isMessagesDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsMessagesDrawerOpen(false)} />
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/95 shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black text-slate-100">الرسائل والمحادثات الخاصة</h3>
                <span className="text-[11px] text-slate-400 font-normal">
                  (داخل الغرفة دون انقطاع الصوت)
                </span>
              </div>
              <button
                onClick={() => setIsMessagesDrawerOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="إغلاق والعودة للغرفة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct Messages Body */}
            <div className="flex-1 overflow-y-auto">
              <DirectMessagesView
                currentUser={currentUser}
                onOpenReport={onOpenReport}
              />
            </div>
          </div>
        </div>
      )}

      {/* Exit / Minimize Room Confirmation Modal */}
      {showExitConfirmDialog && (
        <div id="exitModal" className="exit-modal-overlay">
          <div className="exit-modal-box">
            <h3>مغادرة الغرفة</h3>
            <p>هل تريد تصغير الغرفة أم الخروج منها نهائياً؟</p>

            <div className="exit-modal-actions">
              {/* خيار تصغير الغرفة */}
              {onMinimizeRoom && (
                <button
                  id="modal-minimize-room-btn"
                  className="btn-minimize"
                  onClick={() => {
                    setShowExitConfirmDialog(false);
                    onMinimizeRoom();
                  }}
                >
                  <span className="icon">🗗</span>
                  <span>تصغير الغرفة</span>
                </button>
              )}

              {/* خيار الخروج العادي (لا يحذف الغرفة) */}
              <button
                id="modal-confirm-leave-btn"
                className="btn-leave"
                onClick={() => {
                  setShowExitConfirmDialog(false);
                  handleSafeLeave();
                }}
              >
                <span className="icon">🚪</span>
                <span>خروج من الغرفة (تبقى الغرفة محفوظة)</span>
              </button>

              {/* خيار حذف الغرفة نهائياً للمالك فقط */}
              {isHost && (
                <button
                  id="modal-delete-room-btn"
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-950/90 hover:bg-rose-900 border border-rose-700/60 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all mt-1 shadow-md"
                  onClick={async () => {
                    if (confirm('هل أنت متأكد من حذف الغرفة نهائياً؟ سيتم مسح الغرفة تماماً من قائمة الغرف.')) {
                      try {
                        await API.deleteRoom(room.id, currentUser.id);
                        setShowExitConfirmDialog(false);
                        handleSafeLeave();
                      } catch (err: any) {
                        alert(err.message || 'تعذر حذف الغرفة');
                      }
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>حذف الغرفة نهائياً (مسح دائك)</span>
                </button>
              )}

              {/* زر الإلغاء والبقاء */}
              <button
                id="modal-cancel-leave-btn"
                className="btn-cancel"
                onClick={() => setShowExitConfirmDialog(false)}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gifts Drawer Modal */}
      <GiftsDrawer
        isOpen={isGiftsOpen}
        onClose={() => setIsGiftsOpen(false)}
        currentUser={currentUser}
        roomId={currentRoom.id}
        roomSeats={seats}
        roomMembers={members}
        hostUser={{
          id: currentRoom.hostId,
          name: currentRoom.hostName,
          avatar: currentRoom.hostAvatar
        }}
        selectedReceiverId={selectedGiftReceiverId}
        onReceiverChange={setSelectedGiftReceiverId}
        onGiftSentSuccess={(gift, count, receiverName, receiverId, transactionId, receiverAvatar) => {
          triggerGiftTrajectoryAnimation({
            id: transactionId,
            giftId: gift.id,
            icon: gift.icon,
            name: gift.nameAr,
            diamondCost: gift.diamondCost,
            category: gift.category,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderAvatar: currentUser.avatar,
            receiverName: receiverName,
            receiverAvatar: receiverAvatar,
            receiverId: receiverId,
            count: count
          });
        }}
        onUserUpdated={onUserUpdated}
        onOpenWallet={onOpenWallet}
      />

      {/* Room Members Drawer (Sheet) */}
      {isMembersOpen && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsMembersOpen(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black text-slate-100">المتواجدون في الغرفة ({members.length})</h3>
              </div>
              <button
                onClick={() => setIsMembersOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="p-3 overflow-y-auto flex flex-col gap-1.5 divide-y divide-slate-800/40">
              {/* Host Item First */}
              <div
                onClick={() => {
                  setIsMembersOpen(false);
                  setSelectedProfileUserId(currentRoom.hostId);
                  setIsProfileOpen(true);
                }}
                className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-800/60 cursor-pointer transition-colors pt-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={currentRoom.hostAvatar}
                      alt={currentRoom.hostName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shadow-md"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute -top-1 -right-1 p-0.5 bg-amber-400 text-slate-950 rounded-full">
                      <Sparkles className="w-2.5 h-2.5" />
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <UserRoleBadges user={{ id: currentRoom.hostId, name: currentRoom.hostName, isHost: true }} size="sm" />
                      <span className="font-bold text-xs text-slate-100 truncate">{currentRoom.hostName}</span>
                    </div>
                    <span className="text-[10px] text-amber-400 font-semibold">مضيف الغرفة 👑</span>
                  </div>
                </div>

                <button className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 text-[11px] font-bold border border-slate-700 hover:border-amber-400">
                  عرض الملف
                </button>
              </div>

              {/* Other Members */}
              {members.filter(m => m.userId !== currentRoom.hostId).map(member => {
                const memberSeat = seats.find(s => s.userId === member.userId);
                return (
                  <div
                    key={member.id || member.userId}
                    onClick={() => {
                      setIsMembersOpen(false);
                      setSelectedProfileUserId(member.userId);
                      setIsProfileOpen(true);
                    }}
                    className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-800/60 cursor-pointer transition-colors pt-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={member.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.userId}`}
                        alt={member.userName}
                        className="w-10 h-10 rounded-full object-cover bg-slate-800 border border-slate-700 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <UserRoleBadges user={member} size="sm" />
                          <span className="font-bold text-xs text-slate-200 truncate">{member.userName}</span>
                        </div>
                        {memberSeat ? (
                          <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                            <Radio className="w-2.5 h-2.5 animate-pulse" />
                            على المايك {memberSeat.seatIndex + 1}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">مستمع 🎧</span>
                        )}
                      </div>
                    </div>

                    <button className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 text-[11px] font-bold border border-slate-700 hover:border-amber-400">
                      عرض الملف
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Public User Profile Card Modal / Bottom Sheet */}
      <PublicProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userId={selectedProfileUserId}
        currentUser={currentUser}
        roomId={currentRoom.id}
        roomSeats={seats}
        isCurrentHost={isHost || isModerator}
        onSendGiftToUser={(targetUid) => {
          setIsProfileOpen(false);
          setSelectedGiftReceiverId(targetUid);
          setIsGiftsOpen(true);
        }}
        onHostSeatAction={handleHostAction}
        onOpenReport={onOpenReport}
        onUserUpdated={onUserUpdated}
      />

      {/* Room Host Settings Modal */}
      <RoomSettingsModal
        isOpen={isRoomSettingsOpen}
        onClose={() => setIsRoomSettingsOpen(false)}
        room={currentRoom}
        currentUser={currentUser}
        onRoomUpdated={(updatedRoom, updatedSeats) => {
          setCurrentRoom(updatedRoom);
          if (updatedSeats) setSeats(updatedSeats);
        }}
        onOpenEntrancesShop={() => setIsEntrancesShopOpen(true)}
        onTriggerLiveEntrance={(entranceId) => {
          socketService.triggerEntrance(currentRoom.id, currentUser.id, entranceId);
        }}
      />

      {/* Host Instant Floating Alert on Incoming Mic Request */}
      {incomingRequestForAlert && (isHost || isModerator) && (
        <HostMicRequestNotification
          request={incomingRequestForAlert}
          pendingCount={pendingMicRequests.length}
          onAccept={handleAcceptMicRequest}
          onReject={handleRejectMicRequest}
          onDismiss={() => setIncomingRequestForAlert(null)}
          onOpenAllRequests={() => {
            setIncomingRequestForAlert(null);
            setIsHostMicRequestsModalOpen(true);
          }}
        />
      )}

      {/* Host All Pending Mic Requests Modal (Preserved from DB) */}
      <HostMicRequestsModal
        isOpen={isHostMicRequestsModalOpen}
        onClose={() => setIsHostMicRequestsModalOpen(false)}
        requests={pendingMicRequests}
        roomSeats={seats}
        onAccept={handleAcceptMicRequest}
        onReject={handleRejectMicRequest}
      />

      {/* User Request Mic Modal (Seat picker, active status, cancel) */}
      <UserRequestMicModal
        isOpen={isUserMicRequestModalOpen}
        onClose={() => setIsUserMicRequestModalOpen(false)}
        roomSeats={seats}
        currentPendingRequest={myPendingRequest}
        initialSeatIndex={selectedTargetSeatForRequest}
        onSubmitRequest={handleSubmitMicRequest}
        onCancelRequest={handleCancelMicRequest}
      />

      {/* 3D Cinematic Entrance Overlay (Cars, Jets, Raptors, Throne, etc.) */}
      <RoomEntranceOverlay
        currentEvent={entranceEvent}
        onAnimationComplete={() => setEntranceEvent(null)}
        containerRef={roomContainerRef}
        roomCoverImage={currentRoom.coverImage}
      />

      {/* 3D Entrances Shop & Wardrobe Modal */}
      <EntrancesShopModal
        isOpen={isEntrancesShopOpen}
        onClose={() => setIsEntrancesShopOpen(false)}
        currentUser={currentUser}
        onUserUpdated={onUserUpdated}
        onTriggerLiveEntrance={(entranceId) => {
          socketService.triggerEntrance(currentRoom.id, currentUser.id, entranceId);
        }}
      />
    </div>
  );
};
