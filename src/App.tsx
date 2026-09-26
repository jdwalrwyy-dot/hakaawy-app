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
import { OwnerFreeRechargeModal } from './components/OwnerFreeRechargeModal';
import { HekawyCoverBanner } from './components/HekawyCoverBanner';
import { OwnerStealthFloatingButton } from './components/OwnerStealthFloatingButton';
import { GlobalGiftBanner } from './components/GlobalGiftBanner';
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
  Minimize2
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
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  // Modals state
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
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

    return () => {
      unsubBalance();
      unsubCounter();
      unsubDeleted();
      unsubRoomUpdated();
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
        if (r && r.id) map.set(r.id, r);
      });

      // 2. Add/Merge server rooms
      if (Array.isArray(serverRooms)) {
        serverRooms.forEach(sr => {
          if (sr && sr.id) {
            map.set(sr.id, sr);
          }
        });
      }

      const allCombined = Array.from(map.values());
      saveStoredRoomsList(allCombined);

      // Apply category and search filters if active
      let filtered = allCombined;
      if (selectedCategory && selectedCategory !== 'الكل') {
        filtered = filtered.filter(r => r.currentCategory === selectedCategory);
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        filtered = filtered.filter(r =>
          r.title.toLowerCase().includes(q) ||
          r.roomCode.toLowerCase().includes(q) ||
          r.hostName.toLowerCase().includes(q)
        );
      }

      setRooms(filtered);
    } catch (err) {
      console.error('Failed to load rooms from server, using local storage:', err);
      if (localSaved.length > 0) {
        setRooms(localSaved);
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

  // If inside an active live room and not minimized, render the full screen LiveRoomView
  if (activeRoom && currentUser && !isRoomMinimized) {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between pb-20 selection:bg-amber-500 selection:text-slate-950" dir="rtl">
      {/* Top Navbar */}
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
      />

      {/* Main Content Body */}
      <main className="max-w-6xl mx-auto w-full px-4 py-4 flex-1">
        {/* TAB 1: HOME (الرئيسية) */}
        {activeTab === 'home' && (
          <div className="flex flex-col gap-5">
            {/* Official Hekawy Cover / App Banner */}
            <div className="flex flex-col gap-3">
              <HekawyCoverBanner />

              {/* Quick Action Bar Below Cover */}
              <div className="flex items-center justify-between gap-2.5 px-1">
                <button
                  id="create-room-home-btn"
                  onClick={() => {
                    if (!currentUser) setIsAuthOpen(true);
                    else setIsCreateRoomOpen(true);
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 stroke-[3px]" />
                  <span>إنشاء غرفة جديدة</span>
                </button>

                <button
                  id="daily-rewards-home-btn"
                  onClick={() => setIsTasksOpen(true)}
                  className="py-3 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 text-amber-300 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>المكافآت اليومية</span>
                </button>
              </div>
            </div>

            {/* Search & Categories Bar */}
            <div className="flex flex-col gap-3">
              <div className="relative">
                <input
                  id="search-input"
                  type="text"
                  placeholder="ابحث عن غرفة بالاسم، الكود، اسم المضيف أو الهاشتاج..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-2xl bg-slate-900 border border-slate-800 focus:border-amber-400 focus:outline-none text-slate-100 text-xs sm:text-sm transition-colors"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-105'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Rooms Header & Refresh */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-slate-100 font-extrabold text-base">
                  <Flame className="w-5 h-5 text-rose-500" />
                  <span>الغرف المباشرة الآن</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">({rooms.length})</span>
              </div>

              <button
                onClick={loadRooms}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs border border-slate-800 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">تحديث</span>
              </button>
            </div>

            {/* Live Rooms Grid */}
            {rooms.length === 0 ? (
              <div className="py-16 bg-slate-900/40 rounded-3xl border border-slate-800/80 flex flex-col items-center justify-center gap-3 text-center p-4">
                <Compass className="w-12 h-12 text-slate-600 animate-pulse" />
                <h3 className="font-bold text-slate-300 text-sm">لا توجد غرف مطابقة لبحثك حالياً</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  كن أول من يبدأ مساحة صوتية الآن وادعُ أصدقاءك للمشاركة!
                </p>
                <button
                  onClick={() => setIsCreateRoomOpen(true)}
                  className="mt-2 px-5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20"
                >
                  إنشاء غرفة الآن 🎙️
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map(room => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onJoin={handleJoinRoom}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ROOMS DISCOVERY (الغرف) */}
        {activeTab === 'rooms' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-lg text-slate-100">دليل الغرف المباشرة</h2>
                <p className="text-xs text-slate-400">استكشف جميع المساحات الصوتية والبث المباشر</p>
              </div>

              <button
                onClick={() => setIsCreateRoomOpen(true)}
                className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                <Plus className="w-4 h-4 stroke-[3px]" />
                <span>غرفة جديدة</span>
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onJoin={handleJoinRoom}
                />
              ))}
            </div>
          </div>
        )}

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

        {/* TAB 4: NOTIFICATIONS (الإشعارات) */}
        {activeTab === 'notifications' && (
          currentUser ? (
            <NotificationsView
              currentUser={currentUser}
              onRefreshUnreadCount={() => fetchUnreadCount(currentUser.id)}
            />
          ) : (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-4 bg-slate-900/40 rounded-3xl border border-slate-800 p-6 max-w-md mx-auto my-8">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-100">مركز الإشعارات</h3>
                <p className="text-xs text-slate-400 mt-1">سجّل دخولك لمتابعة إشعارات الهدايا، طلبات الصداقة وتحديثات الغرف.</p>
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

      {/* Floating Action Button (+ إنشاء غرفة) on Home and Rooms */}
      {(activeTab === 'home' || activeTab === 'rooms') && (
        <div className="fixed bottom-20 right-4 z-40">
          <button
            onClick={() => {
              if (!currentUser) setIsAuthOpen(true);
              else setIsCreateRoomOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-2xl shadow-amber-500/40 active:scale-95 transition-all group"
          >
            <Plus className="w-5 h-5 stroke-[3px] group-hover:rotate-90 transition-transform" />
            <span className="hidden sm:inline">إنشاء غرفة</span>
          </button>
        </div>
      )}

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

      {/* Floating Admin Button for ADMIN / OWNER roles */}
      <FloatingAdminButton
        currentUser={currentUser}
        onOpenAdminModal={handleOpenAdminWithTab}
      />

      {/* Fixed Bottom Navigation Tabs */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadNotifsCount={unreadNotifsCount}
      />

      {/* GLOBAL MODALS */}
      {currentUser && (
        <>
          <CreateRoomModal
            isOpen={isCreateRoomOpen}
            onClose={() => setIsCreateRoomOpen(false)}
            currentUser={currentUser}
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

      {/* Owner Stealth Mode Floating Button */}
      {currentUser && isUserOwner(currentUser) && (
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
