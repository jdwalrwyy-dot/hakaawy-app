import React, { useState, useEffect } from 'react';
import { User, Room, isUserOwner, DeviceSavedAccount } from './types';
import { API } from './services/api';
import { socketService } from './services/socketService';
import { soundEffects } from './services/soundEffects';

// Components
import { Navbar } from './components/Navbar';
import { BottomNavigation, TabType } from './components/BottomNavigation';
import { RoomCard } from './components/RoomCard';
import { LiveRoomView } from './components/LiveRoomView';
import { SoloLiveStreamView } from './components/SoloLiveStreamView';
import { FloatingAdminButton } from './components/FloatingAdminButton';
import { CreateRoomModal } from './components/CreateRoomModal';
import { WalletModal } from './components/WalletModal';
import { DailyTasksModal } from './components/DailyTasksModal';
import { FramesShopModal } from './components/FramesShopModal';
import { EntrancesShopModal } from './components/EntrancesShopModal';
import { DirectMessagesView } from './components/DirectMessagesView';
import { NotificationsView } from './components/NotificationsView';
import { ProfileView } from './components/ProfileView';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { HostApplicationModal } from './components/HostApplicationModal';
import { AgentApplicationModal } from './components/AgentApplicationModal';
import { HostDashboardModal } from './components/HostDashboardModal';
import { AgencyDashboardModal } from './components/AgencyDashboardModal';
import { ShippingAgentModal } from './components/ShippingAgentModal';
import { AuthModal } from './components/AuthModal';
import { AccountSwitchModal } from './components/AccountSwitchModal';
import { ReportModal } from './components/ReportModal';
import { SecurityShieldOverlay } from './components/SecurityShieldOverlay';
import { LuckyWheelArena } from './components/LuckyWheelArena';
import { LuckyFarmArena } from './components/LuckyFarmArena';
import { OwnerFreeRechargeModal } from './components/OwnerFreeRechargeModal';
import { HekawyCoverBanner } from './components/HekawyCoverBanner';
import { OwnerStealthFloatingButton } from './components/OwnerStealthFloatingButton';
import { GlobalGiftBanner } from './components/GlobalGiftBanner';
import { TestSandboxView } from './components/TestSandboxView';
import { saveDeviceAccount, activateAccountSession } from './utils/deviceAccounts';

import {
  Radio,
  Plus,
  Sparkles,
  Search,
  Users,
  Flame,
  Crown,
  Filter,
  RefreshCw,
  Compass,
  X,
  Minimize2,
  LayoutGrid,
  List,
  Mic,
  Video,
  Globe,
  Gamepad2,
  Shield,
  Trophy,
  Gem,
  Zap
} from 'lucide-react';

const CATEGORIES = ['الكل', 'سوالف', 'شعر وموسيقى', 'تقنية', 'ألعاب ومسابقات', 'ثقافة وتطوير', 'عام'];

// Helper to load room list from local storage safely
const getStoredRoomsList = (): Room[] => {
  try {
    const c1 = localStorage.getItem('roomsList');
    const c2 = localStorage.getItem('hekawy_persistent_rooms');
    const list1: Room[] = c1 ? JSON.parse(c1) : [];
    const list2: Room[] = c2 ? JSON.parse(c2) : [];
    const map = new Map<string, Room>();
    [...list1, ...list2].forEach(r => {
      if (r && r.id && r.status !== 'ENDED') {
        map.set(r.id, r);
      }
    });
    return Array.from(map.values());
  } catch {
    return [];
  }
};

// Helper to save room list to local storage safely
const saveStoredRoomsList = (roomsList: Room[]) => {
  try {
    const valid = roomsList.filter(r => r && r.id && r.status !== 'ENDED');
    localStorage.setItem('roomsList', JSON.stringify(valid));
    localStorage.setItem('hekawy_persistent_rooms', JSON.stringify(valid));
  } catch (err) {
    console.warn('Failed to save rooms to localStorage:', err);
  }
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isStealthMode, setIsStealthMode] = useState<boolean>(() => {
    return localStorage.getItem('hekawy_owner_stealth_mode') === 'true';
  });
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [isRoomMinimized, setIsRoomMinimized] = useState(false);
  const [rooms, setRooms] = useState<Room[]>(() => getStoredRoomsList());
  const [roomViewLayout, setRoomViewLayout] = useState<'grid' | 'list'>('grid');
  const [streamTypeFilter, setStreamTypeFilter] = useState<'ALL' | 'AUDIO' | 'VIDEO'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [activeGameSubTab, setActiveGameSubTab] = useState<'farm' | 'wheel'>('farm');

  // Modals state
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [createRoomMode, setCreateRoomMode] = useState<'audio' | 'video'>('audio');
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  const handleOpenCreateRoom = (mode: 'audio' | 'video' = 'audio') => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    setCreateRoomMode(mode);
    setIsCreateRoomOpen(true);
  };
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isLuckyFarmModalOpen, setIsLuckyFarmModalOpen] = useState(false);
  const [isLuckyWheelModalOpen, setIsLuckyWheelModalOpen] = useState(false);
  const [isFramesOpen, setIsFramesOpen] = useState(false);
  const [isEntrancesOpen, setIsEntrancesOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isOwnerFreeRechargeOpen, setIsOwnerFreeRechargeOpen] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState<'overview' | 'agency_host' | 'moderation' | 'users' | 'rooms' | 'reports' | 'logs' | 'roles_and_king'>('overview');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAccountSwitchOpen, setIsAccountSwitchOpen] = useState(false);

  // Agency & Host Modals State
  const [isHostApplyOpen, setIsHostApplyOpen] = useState(false);
  const [isAgentApplyOpen, setIsAgentApplyOpen] = useState(false);
  const [isHostDashboardOpen, setIsHostDashboardOpen] = useState(false);
  const [isAgencyDashboardOpen, setIsAgencyDashboardOpen] = useState(false);
  const [isShippingAgentOpen, setIsShippingAgentOpen] = useState(false);
  const [reportState, setReportState] = useState<{
    isOpen: boolean;
    targetType: 'USER' | 'ROOM' | 'MESSAGE' | 'STREAM';
    targetId: string;
    targetName: string;
  }>({
    isOpen: false,
    targetType: 'ROOM',
    targetId: '',
    targetName: ''
  });

  // Isolated in-app navigation: NO browser history manipulation to ensure complete preview stability
  // and prevent any automated redirects to chat or external tabs.

  // Initial Auth, Referral URL Capture & Rooms loading
  useEffect(() => {
    // 1. Capture referral code from URL if present (?ref=CODE or ?r=CODE)
    let isFromReferral = false;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const refParam = urlParams.get('ref') || urlParams.get('r');
      if (refParam && refParam.trim()) {
        isFromReferral = true;
        const cleanRef = refParam.trim().toUpperCase();
        sessionStorage.setItem('hekawy_pending_ref_code', cleanRef);
        localStorage.setItem('hekawy_pending_ref_code', cleanRef);

        // Arrived via referral URL -> Save referral code and open Auth Modal!
        sessionStorage.setItem('hekawy_pending_ref_code', cleanRef);
        localStorage.setItem('hekawy_pending_ref_code', cleanRef);

        localStorage.removeItem('hekawy_auth_user_id');
        localStorage.removeItem('hekawy_owner_token');
        setCurrentUser(null);
        setIsAuthOpen(true);
        loadRooms();
        return;
      }
    } catch (e) {
      console.warn('Failed to parse referral code from URL:', e);
    }

    // 2. Check saved session in localStorage for this specific device/browser
    const rawSavedUser = localStorage.getItem('currentUser') || localStorage.getItem('hekawy_current_user');
    let initialUser: User | null = null;
    if (rawSavedUser) {
      try {
        initialUser = JSON.parse(rawSavedUser);
      } catch {
        initialUser = null;
      }
    }

    const savedUserId = initialUser?.id || localStorage.getItem('hekawy_auth_user_id');
    const ownerToken = localStorage.getItem('hekawy_owner_token');
    
    // Fast path: if user is logged in, immediately load app screen and bypass auth modal
    if (initialUser && savedUserId) {
      setCurrentUser(initialUser);
      setIsAuthOpen(false);
      socketService.connect(initialUser.id);
      fetchUnreadCount(initialUser.id);
    }

    // Strict Owner Gate: If the saved user is either owner, but there is no verified ownerToken:
    if ((savedUserId === 'user_admin' || savedUserId === 'user_owner_waled') && !ownerToken) {
      console.warn('Unverified owner session detected without token. Resetting to guest.');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('hekawy_current_user');
      localStorage.removeItem('hekawy_auth_user_id');
      localStorage.removeItem('hekawy_owner_token');
      setCurrentUser(null);
      setIsAuthOpen(true); // Always display AuthModal for unauthenticated state
      loadRooms();
      return;
    }

    if (savedUserId && savedUserId.trim()) {
      API.login({ id: savedUserId.trim(), ownerToken: ownerToken || undefined })
        .then(res => {
          if (res.user) {
            // Extra security check: if user returned is OWNER, but no ownerToken was verified:
            if (isUserOwner(res.user) && !ownerToken && !res.ownerToken) {
              localStorage.removeItem('currentUser');
              localStorage.removeItem('hekawy_current_user');
              localStorage.removeItem('hekawy_auth_user_id');
              localStorage.removeItem('hekawy_owner_token');
              setCurrentUser(null);
              setIsAuthOpen(true);
              return;
            }
            if (res.ownerToken) {
              localStorage.setItem('hekawy_owner_token', res.ownerToken);
            }
            setCurrentUser(res.user);
            saveDeviceAccount(res.user, res.ownerToken || ownerToken || undefined);
            localStorage.setItem('currentUser', JSON.stringify(res.user));
            localStorage.setItem('hekawy_current_user', JSON.stringify(res.user));
            localStorage.setItem('hekawy_auth_user_id', res.user.id);
            socketService.connect(res.user.id);
            fetchUnreadCount(res.user.id);

            // If navigating directly to /admin/owner or #admin/owner, open dashboard if authorized
            if (window.location.pathname.includes('/admin') || window.location.hash.includes('owner') || window.location.hash.includes('admin')) {
              if (res.user.role === 'OWNER' || res.user.role === 'ADMIN' || res.user.isOwner) {
                setIsAdminOpen(true);
                setAdminInitialTab('overview');
              }
            }
          } else {
            // Invalid user object returned, clear session and open auth modal
            localStorage.removeItem('currentUser');
            localStorage.removeItem('hekawy_current_user');
            localStorage.removeItem('hekawy_auth_user_id');
            localStorage.removeItem('hekawy_owner_token');
            setCurrentUser(null);
            setIsAuthOpen(true);
          }
        })
        .catch(() => {
          // Stale session or unauthorized owner -> clear session and open auth modal
          localStorage.removeItem('currentUser');
          localStorage.removeItem('hekawy_current_user');
          localStorage.removeItem('hekawy_auth_user_id');
          localStorage.removeItem('hekawy_owner_token');
          setCurrentUser(null);
          setIsAuthOpen(true);
        });
    } else {
      // New visitor on this device -> strictly Guest, display AuthModal!
      localStorage.removeItem('currentUser');
      localStorage.removeItem('hekawy_current_user');
      localStorage.removeItem('hekawy_auth_user_id');
      localStorage.removeItem('hekawy_owner_token');
      setCurrentUser(null);
      setIsAuthOpen(true);
    }

    loadRooms();

    // Listen to real-time balance updates
    const unsubBalance = socketService.on('balance_update', (data) => {
      setCurrentUser(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          ...(data.diamonds !== undefined && { diamonds: data.diamonds }),
          ...(data.coins !== undefined && { coins: data.coins })
        };
      });
    });

    // Listen to real-time room counter updates
    const unsubCounter = socketService.on('room_counter_updated', (data) => {
      if (data.roomId) {
        setRooms(prev => {
          const updated = prev.map(r => r.id === data.roomId ? { ...r, viewerCount: data.viewerCount } : r);
          saveStoredRoomsList(updated);
          return updated;
        });
      }
    });

    // Listen to real-time room deletion
    const unsubDeleted = socketService.on('room_deleted', (data) => {
      if (data.roomId) {
        setRooms(prev => {
          const updated = prev.filter(r => r.id !== data.roomId);
          saveStoredRoomsList(updated);
          return updated;
        });
        if (activeRoom?.id === data.roomId) {
          setActiveRoom(null);
          setIsRoomMinimized(false);
        }
      }
    });

    // Listen to real-time room updates (coverImage, title, etc.)
    const unsubRoomUpdated = socketService.on('room_updated', (data) => {
      if (data.roomId && data.room) {
        setRooms(prev => {
          const updated = prev.map(r => r.id === data.roomId ? { ...r, ...data.room } : r);
          saveStoredRoomsList(updated);
          return updated;
        });
        if (activeRoom?.id === data.roomId) {
          setActiveRoom(prev => prev ? { ...prev, ...data.room } : prev);
        }
      }
    });

    // Listen to real-time room creation
    const unsubRoomCreated = socketService.on('room_created', (data) => {
      if (data.room) {
        setRooms(prev => {
          if (prev.some(r => r.id === data.room.id)) return prev;
          const updated = [data.room, ...prev];
          saveStoredRoomsList(updated);
          return updated;
        });
      }
    });

    // Listen to force logout on permanent account ban
    const unsubForceLogout = socketService.on('force_logout_banned', (data) => {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('hekawy_current_user');
      localStorage.removeItem('hekawy_auth_user_id');
      localStorage.removeItem('hekawy_owner_token');
      setCurrentUser(null);
      setIsAuthOpen(true);
      alert(data.reason || 'تم حظر هذا الحساب نهائياً لمخالفة شروط الاستخدام');
    });

    return () => {
      unsubBalance();
      unsubCounter();
      unsubDeleted();
      unsubRoomUpdated();
      unsubRoomCreated();
      unsubForceLogout();
      socketService.disconnect();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('hekawy_current_user');
    localStorage.removeItem('hekawy_auth_user_id');
    localStorage.removeItem('hekawy_owner_token');
    socketService.disconnect();
    setCurrentUser(null);
    setActiveTab('home');
    setIsAuthOpen(true);
    window.location.reload(); // إعادة التحميل ليعود لشاشة الدخول
  };

  const handleLoginSuccess = (user: User, ownerToken?: string) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('hekawy_current_user', JSON.stringify(user));
    localStorage.setItem('hekawy_auth_user_id', user.id);
    if (ownerToken) {
      localStorage.setItem('hekawy_owner_token', ownerToken);
    } else {
      localStorage.removeItem('hekawy_owner_token');
    }
    // Save to device's saved accounts list for fast account switching
    saveDeviceAccount(user, ownerToken);

    localStorage.removeItem('hekawy_pending_ref_code');
    sessionStorage.removeItem('hekawy_pending_ref_code');
    socketService.connect(user.id);
    fetchUnreadCount(user.id);
    setIsAuthOpen(false);
    setIsAccountSwitchOpen(false);
  };

  const handleSwitchAccount = async (targetAccount: DeviceSavedAccount) => {
    // 1. Save current active user session to device list
    if (currentUser) {
      saveDeviceAccount(currentUser);
    }

    // 2. Activate target session
    activateAccountSession(targetAccount);

    // 3. Reconnect socket for new user
    socketService.disconnect();

    try {
      const res = await API.login({
        id: targetAccount.id,
        ownerToken: targetAccount.ownerToken
      });

      if (res.user) {
        if (res.ownerToken) {
          localStorage.setItem('hekawy_owner_token', res.ownerToken);
        }
        setCurrentUser(res.user);
        saveDeviceAccount(res.user, res.ownerToken || targetAccount.ownerToken);
        socketService.connect(res.user.id);
        fetchUnreadCount(res.user.id);
      } else {
        // Fallback using targetAccount
        socketService.connect(targetAccount.id);
      }
    } catch (err) {
      console.warn('Failed to switch user account from server:', err);
      socketService.connect(targetAccount.id);
    } finally {
      setIsAccountSwitchOpen(false);
    }
  };

  const fetchUnreadCount = async (userId: string) => {
    try {
      const notifs = await API.getNotifications(userId);
      setUnreadNotifsCount(notifs.filter(n => !n.isRead).length);
    } catch {}
  };

  const loadRooms = async () => {
    const localSaved = getStoredRoomsList();

    try {
      const serverRooms = await API.getRooms({
        search: searchQuery.trim() || undefined,
        category: selectedCategory !== 'الكل' ? selectedCategory : undefined
      });

      const map = new Map<string, Room>();

      // 1. Add all local saved rooms first
      localSaved.forEach(r => {
        if (r && r.id && r.status !== 'ENDED') map.set(r.id, r);
      });

      // 2. Add/Merge server rooms
      if (Array.isArray(serverRooms)) {
        serverRooms.forEach(sr => {
          if (sr && sr.id && sr.status !== 'ENDED') {
            map.set(sr.id, sr);
          }
        });
      }

      const allCombined = Array.from(map.values());
      saveStoredRoomsList(allCombined);
      setRooms(allCombined);
    } catch {
      if (localSaved.length > 0) {
        setRooms(localSaved.filter(r => r.status !== 'ENDED'));
      }
    }
  };

  useEffect(() => {
    loadRooms();
  }, [selectedCategory, searchQuery]);

  const handleJoinRoom = (room: Room) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    if (room.type === 'PRIVATE') {
      const pwd = prompt('هذه الغرفة خاصة، يرجى إدخال كلمة المرور:');
      if (pwd !== room.password) {
        alert('كلمة المرور غير صحيحة');
        return;
      }
    }
    setActiveRoom(room);
    setIsRoomMinimized(false);
  };

  const handleNavigateToRoomById = async (roomId: string) => {
    if (!roomId) return;
    try {
      const room = rooms.find(r => r.id === roomId);
      if (room) {
        handleJoinRoom(room);
        return;
      }
      const data = await API.getRoom(roomId);
      if (data && data.room) {
        handleJoinRoom(data.room);
      }
    } catch (err) {
      console.error('Failed to join room from global gift banner:', err);
    }
  };

  const handleLeaveRoom = () => {
    setActiveRoom(null);
    setIsRoomMinimized(false);
    loadRooms();
  };

  const handleOpenMyRoom = async () => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    // 1. Check if user already has an active STRICT AUDIO room (no video)
    const existingAudioRoom = rooms.find(
      r => r.status !== 'ENDED' &&
           (r.hostId === currentUser.id || r.hostName === currentUser.name) &&
           !r.allowVideo &&
           !(r as any).type?.includes('video') &&
           !r.currentCategory?.includes('Solo Live') &&
           !r.currentCategory?.includes('بث فيديو') &&
           !r.currentCategory?.includes('بث مباشر') &&
           !r.tags?.includes('SOLO_LIVE')
    );

    if (existingAudioRoom) {
      const sanitizedAudioRoom: Room = {
        ...existingAudioRoom,
        allowVideo: false,
        tags: (existingAudioRoom.tags || []).filter(t => t !== 'SOLO_LIVE')
      };
      handleJoinRoom(sanitizedAudioRoom);
      return;
    }

    // 2. Otherwise create a permanent personal audio voice room for the user immediately
    const isWaled = currentUser.name === 'وليد' || currentUser.id === 'user_owner_waled';
    try {
      const newRoom = await API.createRoom({
        title: isWaled ? 'غرفة وليد الملكية 👑' : `غرفة ${currentUser.name || 'المستخدم'} 🎙️`,
        description: `الغرفة الصوتية الدائمة الخاصة بـ ${currentUser.name || 'المستخدم'}`,
        coverImage: currentUser.avatar || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
        hostId: currentUser.id,
        type: 'PUBLIC',
        allowAudio: true,
        allowVideo: false,
        currentCategory: 'سوالف',
        tags: ['غرفتي', 'حكاوي', 'صوت'],
        micLayout: '2+15'
      });
      const cleanAudioRoom: Room = {
        ...newRoom,
        allowVideo: false,
        tags: ['غرفتي', 'حكاوي', 'صوت']
      };
      handleRoomCreated(cleanAudioRoom);
    } catch (err) {
      console.error('Failed to create personal room:', err);
    }
  };

  const handleOpenMyLiveStream = async () => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    // 1. Check if user already has an active live video room
    const existingLive = rooms.find(
      r => r.status !== 'ENDED' &&
           (r.hostId === currentUser.id || r.hostName === currentUser.name) &&
           (r.allowVideo === true || r.tags?.includes('SOLO_LIVE') || r.currentCategory?.includes('بث مباشر') || (r as any).type === 'video')
    );

    if (existingLive) {
      const sanitizedLiveRoom: Room = {
        ...existingLive,
        allowVideo: true,
        currentCategory: 'بث مباشر',
        tags: Array.from(new Set([...(existingLive.tags || []), 'SOLO_LIVE']))
      };
      handleJoinRoom(sanitizedLiveRoom);
      return;
    }

    // 2. Otherwise create a personal live broadcast for the user immediately
    const isWaled = currentUser.name === 'وليد' || currentUser.id === 'user_owner_waled';
    try {
      const newLiveRoom = await API.createRoom({
        title: isWaled ? 'بث وليد المباشر 🎥' : `بث ${currentUser.name || 'المستخدم'} المباشر 🎥`,
        description: `البث الشخصي المباشر لـ ${currentUser.name || 'المستخدم'}`,
        coverImage: currentUser.avatar || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80',
        hostId: currentUser.id,
        type: 'PUBLIC',
        allowAudio: true,
        allowVideo: true,
        currentCategory: 'بث مباشر',
        tags: ['SOLO_LIVE', 'بث_مباشر', 'لايف'],
        micLayout: '2+15'
      });
      const cleanLiveRoom: Room = {
        ...newLiveRoom,
        allowVideo: true,
        tags: ['SOLO_LIVE', 'بث_مباشر', 'لايف']
      };
      handleRoomCreated(cleanLiveRoom);
    } catch (err) {
      console.error('Failed to create personal live stream:', err);
    }
  };

  const handleOpenOfficialAdminRoom = async () => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    // 1. Search for existing official admin voice room
    const existingAdminRoom = rooms.find(
      r => r.status !== 'ENDED' &&
           !r.allowVideo &&
           (r.id === 'room_official_admin' ||
            r.tags?.includes('OFFICIAL_ADMIN') ||
            r.title?.includes('الإدارة والدعم الفني') ||
            r.title?.includes('غرفة الإدارة'))
    );

    if (existingAdminRoom) {
      const sanitizedAdminRoom: Room = {
        ...existingAdminRoom,
        allowVideo: false,
        tags: (existingAdminRoom.tags || []).filter(t => t !== 'SOLO_LIVE')
      };
      handleJoinRoom(sanitizedAdminRoom);
      return;
    }

    // 2. Otherwise create or join the official voice room
    try {
      const adminRoom = await API.createRoom({
        title: 'غرفة الإدارة والدعم الفني 🎙️👑',
        description: 'الغرفة الصوتية الرسمية للإدارة والرد على استفسارات وحاجات المستخدمين والدعم الفني المباشر',
        coverImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
        hostId: currentUser.id,
        type: 'PUBLIC',
        allowAudio: true,
        allowVideo: false,
        currentCategory: 'عام',
        tags: ['OFFICIAL_ADMIN', 'رسمية', 'إدارة', 'دعم_فني'],
        micLayout: '2+15'
      });
      const cleanAdminRoom: Room = {
        ...adminRoom,
        allowVideo: false,
        tags: ['OFFICIAL_ADMIN', 'رسمية', 'إدارة', 'دعم_فني']
      };
      handleRoomCreated(cleanAdminRoom);
    } catch (err) {
      console.error('Failed to create official admin room:', err);
      // Fallback local room object
      const fallbackAdminRoom: Room = {
        id: 'room_official_admin',
        roomCode: 'ADM-999',
        title: 'غرفة الإدارة والدعم الفني 🎙️👑',
        description: 'الغرفة الصوتية الرسمية للإدارة للرد على الاستفسارات والتواصل مع المستخدمين',
        coverImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
        hostId: currentUser.id,
        hostName: 'الإدارة الرسمية 🛡️',
        hostAvatar: currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        viewerCount: 22,
        status: 'LIVE',
        type: 'PUBLIC',
        allowAudio: true,
        allowVideo: false,
        currentCategory: 'عام',
        tags: ['OFFICIAL_ADMIN', 'رسمية', 'إدارة', 'دعم_فني'],
        createdAt: new Date().toISOString(),
        micLayout: '2+15'
      };
      handleJoinRoom(fallbackAdminRoom);
    }
  };

  const handleRoomCreated = (newRoom: Room) => {
    setIsCreateRoomOpen(false);

    setRooms(prev => {
      const existingMap = new Map<string, Room>();
      existingMap.set(newRoom.id, newRoom);
      prev.forEach(r => {
        if (r && r.id) existingMap.set(r.id, r);
      });
      const updated = Array.from(existingMap.values());
      saveStoredRoomsList(updated);
      return updated;
    });

    setActiveRoom(newRoom);
    setIsRoomMinimized(false);
  };

  const handleOpenReport = (targetType: 'USER' | 'ROOM' | 'MESSAGE' | 'STREAM', targetId: string, targetName: string) => {
    setReportState({
      isOpen: true,
      targetType,
      targetId,
      targetName
    });
  };

  const handleOpenAdminWithTab = (tab?: 'overview' | 'agency_host' | 'moderation' | 'users' | 'rooms' | 'reports' | 'logs' | 'roles_and_king') => {
    if (tab) setAdminInitialTab(tab);
    setIsAdminOpen(true);
  };

  // If inside an active live room and not minimized, render the full screen LiveRoomView or SoloLiveStreamView
  if (activeRoom && currentUser && !isRoomMinimized) {
    const isSoloLiveRoom =
      activeRoom.allowVideo === true &&
      (activeRoom.tags?.includes('SOLO_LIVE') ||
       activeRoom.currentCategory?.includes('Solo Live') ||
       activeRoom.currentCategory?.includes('بث فيديو') ||
       activeRoom.currentCategory === 'بث مباشر');

    if (isSoloLiveRoom) {
      return (
        <SoloLiveStreamView
          room={activeRoom}
          currentUser={currentUser}
          onClose={handleLeaveRoom}
          onUserUpdated={setCurrentUser}
        />
      );
    }

    return (
      <div className="h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden" dir="rtl">
        <LiveRoomView
          room={activeRoom}
          currentUser={currentUser}
          onLeaveRoom={handleLeaveRoom}
          onMinimizeRoom={() => setIsRoomMinimized(true)}
          onOpenWallet={() => setIsWalletOpen(true)}
          onOpenReport={handleOpenReport}
          onUserUpdated={setCurrentUser}
          isStealthMode={isStealthMode}
        />

        {/* Floating stealth mode toggle for owner */}
        {isUserOwner(currentUser) && (
          <OwnerStealthFloatingButton
            currentUser={currentUser}
            isStealthMode={isStealthMode}
            onToggleStealthMode={(mode) => {
              setIsStealthMode(mode);
              setCurrentUser({ ...currentUser, isStealthMode: mode });
            }}
          />
        )}

        {/* Global Modals available from room */}
        <WalletModal
          isOpen={isWalletOpen}
          onClose={() => setIsWalletOpen(false)}
          currentUser={currentUser}
          onUserUpdated={setCurrentUser}
        />

        <ReportModal
          isOpen={reportState.isOpen}
          onClose={() => setReportState(prev => ({ ...prev, isOpen: false }))}
          currentUser={currentUser}
          targetType={reportState.targetType}
          targetId={reportState.targetId}
          targetName={reportState.targetName}
        />

        {/* Global Gift Banner Application-Wide Overlay */}
        <GlobalGiftBanner onNavigateToRoom={handleNavigateToRoomById} />
      </div>
    );
  }

  // HARD AUTH GATE: No content, rooms, or broadcast can be opened before authenticating!
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden" dir="rtl">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <AuthModal
          isOpen={true}
          onClose={() => {}}
          onLoginSuccess={handleLoginSuccess}
          currentUser={null}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffbeb] via-[#fef3c7] to-[#fde68a] text-amber-950 font-sans flex flex-col justify-between selection:bg-emerald-600 selection:text-amber-100 pb-20 overflow-y-auto" dir="rtl">
      {/* Top Navbar for non-home tabs */}
      {activeTab !== 'home' && (
        <Navbar
          currentUser={currentUser}
          unreadNotifsCount={unreadNotifsCount}
          onOpenWallet={() => setIsWalletOpen(true)}
          onOpenNotifications={() => setActiveTab('notifications')}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenSearch={() => {
            const el = document.getElementById('search-input');
            el?.focus();
          }}
          onOpenAdmin={() => handleOpenAdminWithTab('overview')}
          onOpenTasks={() => setIsTasksOpen(true)}
          onOpenShippingAgent={() => setIsShippingAgentOpen(true)}
          onGoToHome={() => setActiveTab('home')}
        />
      )}

      {/* Main Content Body */}
      <main className="max-w-6xl mx-auto w-full px-1 py-1 flex-1 overflow-y-auto">
        {/* TAB 1: HOME (الرئيسية - الواجهة الملكية الافتراضية) */}
        {activeTab === 'home' && (
          <TestSandboxView
            onBackToHome={() => setActiveTab('home')}
            onOpenCreateRoom={() => setIsCreateRoomOpen(true)}
            onOpenDailyTasks={() => setIsTasksOpen(true)}
            onOpenFrames={() => setIsFramesOpen(true)}
            onOpenEntrances={() => setIsEntrancesOpen(true)}
            onOpenAdmin={() => handleOpenAdminWithTab('agency_host')}
            onOpenWallet={() => setIsWalletOpen(true)}
            onSelectTab={(tab) => setActiveTab(tab as any)}
          />
        )}

        {/* TAB 2: AUDIO VOICE ROOMS (الغرف الصوتية - شبكة من عمودين) */}
        {activeTab === 'rooms' && (() => {
          const audioRooms = rooms.filter(r => {
            if (r.status === 'ENDED') return false;
            return true;
          });

          return (
            <div className="flex flex-col gap-3 pb-20">
              {/* Slim Split Top Section - Personal Shortcuts (غرفتي & بثي المباشر & مزرعة الحظ) */}
              <div className="grid grid-cols-3 gap-2">
                {/* Right Side - غرفتي */}
                <div
                  onClick={handleOpenMyRoom}
                  className="group relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#fffbeb] via-[#fef3c7] to-[#fde68a] border-2 border-amber-600/70 hover:border-amber-500 shadow-md shadow-amber-500/10 active:scale-95 transition-all cursor-pointer overflow-hidden min-h-[42px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-l from-amber-400/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 text-amber-200 border border-amber-400 shrink-0 group-hover:scale-105 transition-transform shadow">
                    <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
                  </div>
                  <div className="flex flex-col justify-center min-w-0 z-10 flex-1">
                    <span className="font-black text-[11px] sm:text-xs text-amber-950 whitespace-nowrap leading-tight">غرفتي</span>
                    <span className="text-[8.5px] sm:text-[9.5px] text-amber-900 font-bold whitespace-nowrap leading-tight">غرفتك الصوتية</span>
                  </div>
                </div>

                {/* Middle Side - بثي المباشر */}
                <div
                  onClick={handleOpenMyLiveStream}
                  className="group relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#fffbeb] via-[#fef3c7] to-[#fde68a] border-2 border-amber-600/70 hover:border-amber-500 shadow-md shadow-amber-500/10 active:scale-95 transition-all cursor-pointer overflow-hidden min-h-[42px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-l from-emerald-400/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 text-amber-200 border border-amber-400 shrink-0 group-hover:scale-105 transition-transform shadow">
                    <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
                  </div>
                  <div className="flex flex-col justify-center min-w-0 z-10 flex-1">
                    <span className="font-black text-[11px] sm:text-xs text-amber-950 whitespace-nowrap leading-tight">بثي المباشر</span>
                    <span className="text-[8.5px] sm:text-[9.5px] text-amber-900 font-bold whitespace-nowrap leading-tight">البث المباشر</span>
                  </div>
                </div>

                {/* Left Side - مزرعة الحظ */}
                <div
                  onClick={() => {
                    if (!currentUser) {
                      setIsAuthOpen(true);
                    } else {
                      setIsLuckyFarmModalOpen(true);
                    }
                  }}
                  className="group relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#fffbeb] via-[#fef3c7] to-[#fde68a] border-2 border-amber-600 hover:border-amber-500 shadow-md shadow-amber-500/10 active:scale-95 transition-all cursor-pointer overflow-hidden min-h-[42px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-l from-amber-400/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 text-amber-200 border border-amber-400 shrink-0 group-hover:scale-105 transition-transform shadow">
                    <span className="text-sm">🎡</span>
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
                  </div>
                  <div className="flex flex-col justify-center min-w-0 z-10 flex-1">
                    <span className="font-black text-[11px] sm:text-xs text-amber-950 whitespace-nowrap leading-tight">ساقية الحظ</span>
                    <span className="text-[8.5px] sm:text-[9.5px] text-emerald-800 font-bold whitespace-nowrap leading-tight">فواكه ولحوم 🌾</span>
                  </div>
                </div>
              </div>

              {/* Sticky Official Administration Voice Room Card (غرفة الإدارة والدعم الفني) */}
              <div className="sticky top-0 z-20 py-1 bg-[#fef3c7]/95 backdrop-blur-md">
                <div
                  onClick={handleOpenOfficialAdminRoom}
                  className="group relative flex flex-col sm:flex-row items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-[#fffbeb] via-[#fef3c7] to-[#fde68a] border-2 border-amber-600 hover:border-amber-500 shadow-xl shadow-amber-600/20 active:scale-98 transition-all cursor-pointer overflow-hidden w-full gap-2.5"
                >
                  {/* Glowing golden background animation */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-amber-300/10 to-amber-400/20 opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-400/30 rounded-full blur-2xl group-hover:scale-125 transition-transform" />

                  {/* Left info area (RTL: right side) */}
                  <div className="flex items-center gap-3 z-10 w-full sm:w-auto">
                    <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 text-amber-100 font-black border-2 border-amber-400 shadow-lg shadow-emerald-900/30 shrink-0 group-hover:scale-110 transition-transform">
                      <Shield className="w-5 h-5 stroke-[2.5]" />
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-emerald-900 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                      </span>
                    </div>

                    <div className="flex flex-col text-right flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm sm:text-base text-amber-950 tracking-wide drop-shadow-sm">
                          غرفة الإدارة والدعم الفني
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-amber-100 text-[10px] font-black border border-amber-400 flex items-center gap-1 shadow-sm">
                          <Crown className="w-3 h-3 text-amber-300" />
                          <span>رسمي 👑</span>
                        </span>
                      </div>

                      {/* Badge / Subtitle */}
                      <div className="flex items-center gap-1.5 mt-0.5 text-amber-900 font-bold text-[11px] sm:text-xs flex-wrap">
                        <span className="text-emerald-800 font-black">🎙️ غرفة صوتية رسمية</span>
                        <span className="text-amber-600">•</span>
                        <span className="text-amber-950 font-bold">استفسارات ومساعدة مباشرة</span>
                      </div>
                    </div>
                  </div>

                  {/* Right side (RTL: left side) join action badge */}
                  <div className="z-10 flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-800 text-amber-100 font-black text-xs border border-amber-300 shadow-md shadow-emerald-950/20 shrink-0 group-hover:from-emerald-600 group-hover:to-emerald-700 transition-all w-full sm:w-auto">
                    <Mic className="w-3.5 h-3.5 text-amber-300" />
                    <span>دخول الغرفة الصوتية</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                </div>
              </div>

              {/* Audio Rooms 2-Column Grid with Vertical Scrolling */}
              {audioRooms.length === 0 ? (
                <div className="py-16 bg-[#fffbeb]/90 rounded-3xl border-2 border-amber-600/60 shadow-xl flex flex-col items-center justify-center gap-3 text-center p-6 text-amber-950">
                  <div className="p-4 rounded-3xl bg-amber-500/20 border border-amber-600/40 text-emerald-800">
                    <Mic className="w-10 h-10 animate-pulse" />
                  </div>
                  <h3 className="font-black text-amber-950 text-base">لا توجد غرف صوتية نشطة حالياً</h3>
                  <p className="text-xs text-amber-900 font-bold max-w-md">
                    أنشئ غرفتك الصوتية الخاصة واستضف أصدقاءك ومتابعيك على المايكات للتحدث والتفاعل!
                  </p>
                  <button
                    onClick={() => handleOpenCreateRoom('audio')}
                    className="mt-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 text-amber-100 font-black text-xs transition-all shadow-lg border border-amber-300 active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <Mic className="w-4 h-4 text-amber-300" />
                    <span>إنشاء غرفة صوتية الآن 🎙️</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 overflow-y-auto">
                  {audioRooms.map(room => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onJoin={handleJoinRoom}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 3: DIRECT MESSAGES & FRIENDS (الرسائل) */}
        {activeTab === 'messages' && (
          currentUser ? (
            <DirectMessagesView
              currentUser={currentUser}
              onOpenReport={handleOpenReport}
            />
          ) : (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-4 bg-slate-900/40 rounded-3xl border border-slate-800 p-6 max-w-md mx-auto my-8">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-100">الرسائل والمحادثات الخاصة</h3>
                <p className="text-xs text-slate-400 mt-1">سجّل دخولك أو أنشئ حسابك للتواصل مع المضيفين والأصدقاء وتبادل الرسائل المباشرة.</p>
              </div>
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
              >
                تسجيل الدخول / إنشاء حساب
              </button>
            </div>
          )
        )}

        {/* TAB 4: GAMES (قسم الألعاب - شبكة مكونة من 10 كروت مربعة أنيقة) */}
        {activeTab === 'games' && (
          currentUser ? (
            <div className="flex flex-col gap-3.5 pb-20 dir-rtl max-w-xl mx-auto w-full">
              {/* Header Title */}
              <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-gradient-to-r from-[#fffbeb] via-[#fef3c7] to-[#fde68a] border-2 border-amber-600/70 shadow-md text-amber-950">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 text-amber-200 border border-amber-400 flex items-center justify-center text-lg shadow">
                    🎮
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-xs sm:text-sm font-black text-amber-950">صالة الألعاب التنافسية</h2>
                    <span className="text-[9px] text-amber-900 font-bold">10 ألعاب حصرية ومباشرة للربح والتحدي</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-amber-200/90 px-2.5 py-1 rounded-xl border border-amber-600/60 shadow-inner">
                  <Gem className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                  <span>{(currentUser.diamonds || 0).toLocaleString()} 💎</span>
                </div>
              </div>

              {/* 10 SQUARE GAME CARDS GRID (2 Columns) */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
                
                {/* CARD 1: مزرعة الحظ (فواكه ولحوم) */}
                <div
                  onClick={() => setIsLuckyFarmModalOpen(true)}
                  className="group relative bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fde68a] border-2 border-amber-600 hover:border-amber-500 rounded-3xl p-3 flex flex-col items-center justify-between text-center shadow-lg hover:shadow-2xl active:scale-95 transition-all cursor-pointer aspect-square overflow-hidden"
                >
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-700 text-amber-100 text-[8.5px] font-black border border-amber-300 shadow">
                    مباشر 🔥
                  </span>

                  <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 text-amber-200 border-2 border-amber-400 flex items-center justify-center text-3xl sm:text-4xl shadow-md group-hover:scale-110 transition-transform mt-2">
                    🎡
                  </div>

                  <div className="my-1 text-center w-full">
                    <h3 className="font-black text-xs sm:text-sm text-amber-950 truncate leading-tight">
                      مزرعة الحظ
                    </h3>
                    <span className="text-[9px] sm:text-[9.5px] font-extrabold text-emerald-800 block truncate mt-0.5">
                      فواكه ولحوم 🌾
                    </span>
                  </div>

                  <div className="w-full py-1 rounded-xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-800 text-amber-100 text-[10px] font-black border border-amber-300 shadow group-hover:from-emerald-600 group-hover:to-emerald-700 transition-all flex items-center justify-center gap-1">
                    <span>العب الآن</span>
                    <Sparkles className="w-3 h-3 text-amber-300" />
                  </div>
                </div>

                {/* CARD 2: عجلة التحدي 1v1 */}
                <div
                  onClick={() => setIsLuckyWheelModalOpen(true)}
                  className="group relative bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fde68a] border-2 border-amber-600 hover:border-amber-500 rounded-3xl p-3 flex flex-col items-center justify-between text-center shadow-lg hover:shadow-2xl active:scale-95 transition-all cursor-pointer aspect-square overflow-hidden"
                >
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-600 text-amber-100 text-[8.5px] font-black border border-amber-300 shadow">
                    تحدي 1v1 🏆
                  </span>

                  <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-600 via-yellow-500 to-amber-700 text-amber-950 border-2 border-amber-300 flex items-center justify-center text-3xl sm:text-4xl shadow-md group-hover:scale-110 transition-transform mt-2">
                    ⚔️
                  </div>

                  <div className="my-1 text-center w-full">
                    <h3 className="font-black text-xs sm:text-sm text-amber-950 truncate leading-tight">
                      عجلة التحدي
                    </h3>
                    <span className="text-[9px] sm:text-[9.5px] font-extrabold text-amber-900 block truncate mt-0.5">
                      مواجهة 1 ضد 1 🎡
                    </span>
                  </div>

                  <div className="w-full py-1 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 text-amber-950 text-[10px] font-black border border-amber-300 shadow group-hover:from-amber-500 group-hover:to-amber-600 transition-all flex items-center justify-center gap-1">
                    <span>دخول التحدي</span>
                    <Trophy className="w-3 h-3 text-amber-950" />
                  </div>
                </div>

                {/* CARD 3: سباق الخيول الملكي */}
                <div
                  onClick={() => setIsLuckyFarmModalOpen(true)}
                  className="group relative bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fde68a] border-2 border-amber-600/70 hover:border-amber-500 rounded-3xl p-3 flex flex-col items-center justify-between text-center shadow-lg hover:shadow-2xl active:scale-95 transition-all cursor-pointer aspect-square overflow-hidden"
                >
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-purple-700 text-amber-100 text-[8.5px] font-black border border-amber-300 shadow">
                    جديد ✨
                  </span>

                  <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-purple-800 via-purple-700 to-indigo-900 text-amber-200 border-2 border-amber-400 flex items-center justify-center text-3xl sm:text-4xl shadow-md group-hover:scale-110 transition-transform mt-2">
                    🏇
                  </div>

                  <div className="my-1 text-center w-full">
                    <h3 className="font-black text-xs sm:text-sm text-amber-950 truncate leading-tight">
                      سباق الخيول
                    </h3>
                    <span className="text-[9px] sm:text-[9.5px] font-extrabold text-purple-900 block truncate mt-0.5">
                      تحدي المضمار الملكي
                    </span>
                  </div>

                  <div className="w-full py-1 rounded-xl bg-slate-900 text-amber-300 text-[10px] font-black border border-amber-400/60 shadow group-hover:bg-slate-800 transition-all flex items-center justify-center gap-1">
                    <span>السباق المباشر</span>
                    <Crown className="w-3 h-3 text-amber-300" />
                  </div>
                </div>

                {/* CARD 4: صندوق الحظ الأسطوري */}
                <div
                  onClick={() => setIsLuckyFarmModalOpen(true)}
                  className="group relative bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fde68a] border-2 border-amber-600/70 hover:border-amber-500 rounded-3xl p-3 flex flex-col items-center justify-between text-center shadow-lg hover:shadow-2xl active:scale-95 transition-all cursor-pointer aspect-square overflow-hidden"
                >
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-rose-700 text-amber-100 text-[8.5px] font-black border border-amber-300 shadow">
                    جوائز 🎁
                  </span>

                  <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-rose-700 via-rose-600 to-pink-800 text-amber-200 border-2 border-amber-400 flex items-center justify-center text-3xl sm:text-4xl shadow-md group-hover:scale-110 transition-transform mt-2">
                    📦
                  </div>

                  <div className="my-1 text-center w-full">
                    <h3 className="font-black text-xs sm:text-sm text-amber-950 truncate leading-tight">
                      صندوق الحظ
                    </h3>
                    <span className="text-[9px] sm:text-[9.5px] font-extrabold text-rose-900 block truncate mt-0.5">
                      الكنز الأسطوري
                    </span>
                  </div>

                  <div className="w-full py-1 rounded-xl bg-rose-700 text-amber-100 text-[10px] font-black border border-amber-300 shadow group-hover:bg-rose-600 transition-all flex items-center justify-center gap-1">
                    <span>فتح الصندوق</span>
                    <Sparkles className="w-3 h-3 text-amber-300" />
                  </div>
                </div>

                {/* CARD 5: نرد الملوك */}
                <div
                  onClick={() => setIsLuckyFarmModalOpen(true)}
                  className="group relative bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fde68a] border-2 border-amber-600/70 hover:border-amber-500 rounded-3xl p-3 flex flex-col items-center justify-between text-center shadow-lg hover:shadow-2xl active:scale-95 transition-all cursor-pointer aspect-square overflow-hidden"
                >
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-sky-700 text-amber-100 text-[8.5px] font-black border border-amber-300 shadow">
                    شعبي 🌟
                  </span>

                  <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-sky-700 via-sky-600 to-blue-800 text-amber-200 border-2 border-amber-400 flex items-center justify-center text-3xl sm:text-4xl shadow-md group-hover:scale-110 transition-transform mt-2">
                    🎲
                  </div>

                  <div className="my-1 text-center w-full">
                    <h3 className="font-black text-xs sm:text-sm text-amber-950 truncate leading-tight">
                      نرد الملوك
                    </h3>
                    <span className="text-[9px] sm:text-[9.5px] font-extrabold text-sky-900 block truncate mt-0.5">
                      توقع رقم النرد
                    </span>
                  </div>

                  <div className="w-full py-1 rounded-xl bg-sky-700 text-amber-100 text-[10px] font-black border border-amber-300 shadow group-hover:bg-sky-600 transition-all flex items-center justify-center gap-1">
                    <span>رمي النرد</span>
                    <Flame className="w-3 h-3 text-amber-300" />
                  </div>
                </div>

                {/* CARD 6: الماسة المفقودة */}
                <div
                  onClick={() => setIsLuckyFarmModalOpen(true)}
                  className="group relative bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fde68a] border-2 border-amber-600/70 hover:border-amber-500 rounded-3xl p-3 flex flex-col items-center justify-between text-center shadow-lg hover:shadow-2xl active:scale-95 transition-all cursor-pointer aspect-square overflow-hidden"
                >
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-teal-700 text-amber-100 text-[8.5px] font-black border border-amber-300 shadow">
                    تحدي 🎯
                  </span>

                  <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-900 text-amber-200 border-2 border-amber-400 flex items-center justify-center text-3xl sm:text-4xl shadow-md group-hover:scale-110 transition-transform mt-2">
                    💎
                  </div>

                  <div className="my-1 text-center w-full">
                    <h3 className="font-black text-xs sm:text-sm text-amber-950 truncate leading-tight">
                      الماسة المفقودة
                    </h3>
                    <span className="text-[9px] sm:text-[9.5px] font-extrabold text-teal-900 block truncate mt-0.5">
                      البحث في الخزينة
                    </span>
                  </div>

                  <div className="w-full py-1 rounded-xl bg-teal-700 text-amber-100 text-[10px] font-black border border-amber-300 shadow group-hover:bg-teal-600 transition-all flex items-center justify-center gap-1">
                    <span>بدء البحث</span>
                    <Sparkles className="w-3 h-3 text-amber-300" />
                  </div>
                </div>

                {/* CARD 7: عالم الفواكه x50 */}
                <div
                  onClick={() => setIsLuckyFarmModalOpen(true)}
                  className="group relative bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fde68a] border-2 border-amber-600/70 hover:border-amber-500 rounded-3xl p-3 flex flex-col items-center justify-between text-center shadow-lg hover:shadow-2xl active:scale-95 transition-all cursor-pointer aspect-square overflow-hidden"
                >
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-red-600 text-white text-[8.5px] font-black border border-amber-300 shadow">
                    مضاعف x50 ⚡
                  </span>

                  <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-red-800 text-amber-200 border-2 border-amber-400 flex items-center justify-center text-3xl sm:text-4xl shadow-md group-hover:scale-110 transition-transform mt-2">
                    🍎
                  </div>

                  <div className="my-1 text-center w-full">
                    <h3 className="font-black text-xs sm:text-sm text-amber-950 truncate leading-tight">
                      عالم الفواكه
                    </h3>
                    <span className="text-[9px] sm:text-[9.5px] font-extrabold text-red-900 block truncate mt-0.5">
                      السلات الفاخرة
                    </span>
                  </div>

                  <div className="w-full py-1 rounded-xl bg-red-600 text-white text-[10px] font-black border border-amber-300 shadow group-hover:bg-red-500 transition-all flex items-center justify-center gap-1">
                    <span>جمع السلات</span>
                    <Zap className="w-3 h-3 text-amber-300" />
                  </div>
                </div>

                {/* CARD 8: برج الحظ التنافسي */}
                <div
                  onClick={() => setIsLuckyFarmModalOpen(true)}
                  className="group relative bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fde68a] border-2 border-amber-600/70 hover:border-amber-500 rounded-3xl p-3 flex flex-col items-center justify-between text-center shadow-lg hover:shadow-2xl active:scale-95 transition-all cursor-pointer aspect-square overflow-hidden"
                >
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-700 text-amber-100 text-[8.5px] font-black border border-amber-300 shadow">
                    تحدي البرج 🏆
                  </span>

                  <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-700 via-yellow-600 to-amber-900 text-amber-200 border-2 border-amber-400 flex items-center justify-center text-3xl sm:text-4xl shadow-md group-hover:scale-110 transition-transform mt-2">
                    🏰
                  </div>

                  <div className="my-1 text-center w-full">
                    <h3 className="font-black text-xs sm:text-sm text-amber-950 truncate leading-tight">
                      برج الحظ
                    </h3>
                    <span className="text-[9px] sm:text-[9.5px] font-extrabold text-amber-900 block truncate mt-0.5">
                      تسلق الطبقات
                    </span>
                  </div>

                  <div className="w-full py-1 rounded-xl bg-amber-700 text-amber-100 text-[10px] font-black border border-amber-300 shadow group-hover:bg-amber-600 transition-all flex items-center justify-center gap-1">
                    <span>صعود البرج</span>
                    <Crown className="w-3 h-3 text-amber-300" />
                  </div>
                </div>

                {/* CARD 9: عجلة الحظ الذهبية */}
                <div
                  onClick={() => setIsLuckyFarmModalOpen(true)}
                  className="group relative bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fde68a] border-2 border-amber-600/70 hover:border-amber-500 rounded-3xl p-3 flex flex-col items-center justify-between text-center shadow-lg hover:shadow-2xl active:scale-95 transition-all cursor-pointer aspect-square overflow-hidden"
                >
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-yellow-600 text-amber-950 text-[8.5px] font-black border border-amber-300 shadow">
                    ذهبي 👑
                  </span>

                  <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-yellow-500 via-amber-400 to-yellow-700 text-amber-950 border-2 border-amber-300 flex items-center justify-center text-3xl sm:text-4xl shadow-md group-hover:scale-110 transition-transform mt-2">
                    🌟
                  </div>

                  <div className="my-1 text-center w-full">
                    <h3 className="font-black text-xs sm:text-sm text-amber-950 truncate leading-tight">
                      العجلة الذهبية
                    </h3>
                    <span className="text-[9px] sm:text-[9.5px] font-extrabold text-amber-900 block truncate mt-0.5">
                      مكافآت مجانية
                    </span>
                  </div>

                  <div className="w-full py-1 rounded-xl bg-amber-500 text-amber-950 text-[10px] font-black border border-amber-600 shadow group-hover:bg-amber-400 transition-all flex items-center justify-center gap-1">
                    <span>دوران اليوم</span>
                    <Sparkles className="w-3 h-3 text-amber-950" />
                  </div>
                </div>

                {/* CARD 10: تحدي الفرسان المباشر */}
                <div
                  onClick={() => setIsLuckyWheelModalOpen(true)}
                  className="group relative bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fde68a] border-2 border-amber-600/70 hover:border-amber-500 rounded-3xl p-3 flex flex-col items-center justify-between text-center shadow-lg hover:shadow-2xl active:scale-95 transition-all cursor-pointer aspect-square overflow-hidden"
                >
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-indigo-700 text-amber-100 text-[8.5px] font-black border border-amber-300 shadow">
                    بطولات ⚔️
                  </span>

                  <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-800 via-indigo-700 to-slate-900 text-amber-200 border-2 border-amber-400 flex items-center justify-center text-3xl sm:text-4xl shadow-md group-hover:scale-110 transition-transform mt-2">
                    🛡️
                  </div>

                  <div className="my-1 text-center w-full">
                    <h3 className="font-black text-xs sm:text-sm text-amber-950 truncate leading-tight">
                      تحدي الفرسان
                    </h3>
                    <span className="text-[9px] sm:text-[9.5px] font-extrabold text-indigo-900 block truncate mt-0.5">
                      المواجهات الحاسمة
                    </span>
                  </div>

                  <div className="w-full py-1 rounded-xl bg-indigo-800 text-amber-100 text-[10px] font-black border border-amber-300 shadow group-hover:bg-indigo-700 transition-all flex items-center justify-center gap-1">
                    <span>دخول الحلبة</span>
                    <Shield className="w-3 h-3 text-amber-300" />
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-4 bg-[#fffbeb]/90 rounded-3xl border-2 border-amber-600/60 p-6 max-w-md mx-auto my-8 text-amber-950 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-600/40 text-emerald-800 flex items-center justify-center">
                <Gamepad2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-amber-950">قسم الألعاب التنافسية</h3>
                <p className="text-xs text-amber-900 mt-1 font-bold">سجّل دخولك لدخول جولات مزرعة الحظ وعجلة الحظ والمنافسة على الماسات.</p>
              </div>
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 text-amber-100 font-black text-xs shadow-lg border border-amber-300 active:scale-95 transition-all cursor-pointer"
              >
                تسجيل الدخول / إنشاء حساب
              </button>
            </div>
          )
        )}

        {/* TAB 5: PROFILE (حسابي) */}
        {activeTab === 'profile' && (
          currentUser ? (
            <ProfileView
              currentUser={currentUser}
              onUserUpdated={setCurrentUser}
              onOpenWallet={() => setIsWalletOpen(true)}
              onOpenTasks={() => setIsTasksOpen(true)}
              onOpenFrames={() => setIsFramesOpen(true)}
              onOpenEntrances={() => setIsEntrancesOpen(true)}
              onOpenAdmin={() => handleOpenAdminWithTab('agency_host')}
              onOpenAuth={() => setIsAuthOpen(true)}
              onOpenSwitchAccount={() => setIsAccountSwitchOpen(true)}
              onLogout={handleLogout}
              onOpenHostDashboard={() => setIsHostDashboardOpen(true)}
              onOpenHostApply={() => setIsHostApplyOpen(true)}
              onOpenAgentDashboard={() => setIsAgencyDashboardOpen(true)}
              onOpenAgentApply={() => setIsAgentApplyOpen(true)}
              onOpenShippingAgent={() => setIsShippingAgentOpen(true)}
            />
          ) : (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-4 bg-slate-900/40 rounded-3xl border border-slate-800 p-6 max-w-md mx-auto my-8">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-100">الملف الشخصي وحسابي</h3>
                <p className="text-xs text-slate-400 mt-1">سجّل دخولك لإدارة حسابك، تخصيص الدخلات والإطارات، ومعاينة الرصيد والكونز.</p>
              </div>
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
              >
                تسجيل الدخول / إنشاء حساب
              </button>
            </div>
          )
        )}
      </main>

      {/* Floating Admin Button for ADMIN / OWNER roles */}
      <FloatingAdminButton
        currentUser={currentUser}
        onOpenAdminModal={handleOpenAdminWithTab}
      />

      {/* Floating Stealth Mode Toggle for OWNER role */}
      <OwnerStealthFloatingButton
        currentUser={currentUser}
        isStealthMode={isStealthMode}
        onToggleStealthMode={(newMode) => {
          setIsStealthMode(newMode);
          localStorage.setItem('hekawy_owner_stealth_mode', String(newMode));
        }}
      />

      {/* Minimized Live Room Floating Bar (Allows user to stay in room while exploring app) */}
      {activeRoom && currentUser && isRoomMinimized && (
        <div
          id="minimized-live-room-pill"
          className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-50 bg-slate-900/95 backdrop-blur-xl border border-amber-500/50 rounded-2xl p-2.5 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200 cursor-pointer hover:border-amber-400 transition-all"
        >
          <div
            onClick={() => setIsRoomMinimized(false)}
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
          >
            <div className="relative shrink-0">
              <img
                src={activeRoom.hostAvatar}
                alt={activeRoom.hostName}
                className="w-10 h-10 rounded-full object-cover border-2 border-amber-400"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-extrabold text-xs text-slate-100 truncate">{activeRoom.title}</span>
                <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-400 text-[9px] font-bold rounded-full">
                  مباشر
                </span>
              </div>
              <span className="text-[11px] text-amber-400 font-semibold truncate flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>انقر للعودة إلى الغرفة</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsRoomMinimized(false)}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all active:scale-95 cursor-pointer"
            >
              عرض الغرفة
            </button>
            <button
              onClick={handleLeaveRoom}
              className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 transition-all active:scale-95 cursor-pointer"
              title="مغادرة الغرفة نهائياً"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hidden mounted instance of LiveRoomView while minimized to maintain audio streams & socket connection */}
      {activeRoom && currentUser && isRoomMinimized && (
        <div className="hidden" aria-hidden="true">
          <LiveRoomView
            room={activeRoom}
            currentUser={currentUser}
            onLeaveRoom={handleLeaveRoom}
            onMinimizeRoom={() => setIsRoomMinimized(true)}
            onOpenWallet={() => setIsWalletOpen(true)}
            onOpenReport={handleOpenReport}
            onUserUpdated={setCurrentUser}
            isStealthMode={isStealthMode}
          />
        </div>
      )}

      {/* GLOBAL MODALS */}
      {currentUser && (
        <>
          <CreateRoomModal
            isOpen={isCreateRoomOpen}
            onClose={() => setIsCreateRoomOpen(false)}
            currentUser={currentUser}
            defaultMode={createRoomMode}
            onRoomCreated={handleRoomCreated}
          />

          <WalletModal
            isOpen={isWalletOpen}
            onClose={() => setIsWalletOpen(false)}
            currentUser={currentUser}
            onUserUpdated={setCurrentUser}
          />

          <DailyTasksModal
            isOpen={isTasksOpen}
            onClose={() => setIsTasksOpen(false)}
            currentUser={currentUser}
            onUserUpdated={setCurrentUser}
          />

          <FramesShopModal
            isOpen={isFramesOpen}
            onClose={() => setIsFramesOpen(false)}
            currentUser={currentUser}
            onUserUpdated={setCurrentUser}
            onOpenRechargeModal={() => setIsWalletOpen(true)}
          />

          <EntrancesShopModal
            isOpen={isEntrancesOpen}
            onClose={() => setIsEntrancesOpen(false)}
            currentUser={currentUser}
            onUserUpdated={setCurrentUser}
            onOpenRechargeModal={() => setIsWalletOpen(true)}
          />

          <AdminDashboardModal
            isOpen={isAdminOpen}
            onClose={() => setIsAdminOpen(false)}
            currentUser={currentUser}
            initialTab={adminInitialTab}
            onJoinRoom={handleJoinRoom}
          />

          {/* Host & Agency Career Modals */}
          <HostApplicationModal
            isOpen={isHostApplyOpen}
            onClose={() => setIsHostApplyOpen(false)}
            currentUser={currentUser}
            onSubmitted={() => {
              // Refresh user data if needed
            }}
          />

          <AgentApplicationModal
            isOpen={isAgentApplyOpen}
            onClose={() => setIsAgentApplyOpen(false)}
            currentUser={currentUser}
            onSubmitted={() => {
              // Refresh user data if needed
            }}
          />

          <HostDashboardModal
            isOpen={isHostDashboardOpen}
            onClose={() => setIsHostDashboardOpen(false)}
            currentUser={currentUser}
            onUserUpdated={setCurrentUser}
          />

          <AgencyDashboardModal
            isOpen={isAgencyDashboardOpen}
            onClose={() => setIsAgencyDashboardOpen(false)}
            currentUser={currentUser}
          />

          <ShippingAgentModal
            isOpen={isShippingAgentOpen}
            onClose={() => setIsShippingAgentOpen(false)}
            currentUser={currentUser}
            onUserUpdated={setCurrentUser}
          />

          {/* Lucky Farm Wheel Game Popup Modal Overlay */}
          {isLuckyFarmModalOpen && (
            <div className="fixed inset-0 z-50 bg-amber-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="relative max-w-md w-full max-h-[96vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-[#fffbeb] via-[#fef3c7] to-[#fde68a] border-4 border-amber-600 shadow-2xl p-1">
                <LuckyFarmArena
                  currentUser={currentUser}
                  onUserUpdated={setCurrentUser}
                  onOpenWallet={() => setIsWalletOpen(true)}
                  onExitGame={() => setIsLuckyFarmModalOpen(false)}
                  isEmbeddedInRoom={false}
                />
              </div>
            </div>
          )}

          {/* Lucky Wheel 1v1 Game Popup Modal Overlay */}
          {isLuckyWheelModalOpen && (
            <div className="fixed inset-0 z-50 bg-amber-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="relative max-w-md w-full max-h-[96vh] overflow-y-auto rounded-3xl bg-[#fffbeb] border-4 border-amber-600 shadow-2xl p-1">
                <LuckyWheelArena
                  currentUser={currentUser}
                  onUserUpdated={setCurrentUser}
                  onOpenWallet={() => setIsWalletOpen(true)}
                  onExitGame={() => setIsLuckyWheelModalOpen(false)}
                />
              </div>
            </div>
          )}
        </>
      )}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
      />

      <AccountSwitchModal
        isOpen={isAccountSwitchOpen}
        onClose={() => setIsAccountSwitchOpen(false)}
        currentUser={currentUser}
        onSelectAccountToSwitch={handleSwitchAccount}
        onOpenNewAuthModal={(mode) => {
          setIsAccountSwitchOpen(false);
          setIsAuthOpen(true);
        }}
      />

      {currentUser && (
        <ReportModal
          isOpen={reportState.isOpen}
          onClose={() => setReportState(prev => ({ ...prev, isOpen: false }))}
          currentUser={currentUser}
          targetType={reportState.targetType}
          targetId={reportState.targetId}
          targetName={reportState.targetName}
        />
      )}

      {/* Owner Stealth Mode Floating Button (Only rendered on non-home tabs/rooms) */}
      {currentUser && isUserOwner(currentUser) && activeTab !== 'home' && (
        <OwnerStealthFloatingButton
          currentUser={currentUser}
          isStealthMode={isStealthMode}
          onToggleStealthMode={(mode) => {
            setIsStealthMode(mode);
            setCurrentUser({ ...currentUser, isStealthMode: mode });
          }}
        />
      )}

      {/* Owner Free Recharge Modal */}
      {currentUser && isUserOwner(currentUser) && (
        <OwnerFreeRechargeModal
          isOpen={isOwnerFreeRechargeOpen}
          onClose={() => setIsOwnerFreeRechargeOpen(false)}
          currentUser={currentUser}
          onUserUpdated={setCurrentUser}
        />
      )}

      {/* Automatic Screen Capture Protection, Anti-Recording & Dynamic Watermark */}
      <SecurityShieldOverlay currentUser={currentUser} enableWatermark={true} />

      {/* Global Gift Banner Application-Wide Overlay */}
      <GlobalGiftBanner onNavigateToRoom={handleNavigateToRoomById} />
    </div>
  );
}
