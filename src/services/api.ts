/**
 * REST API Client for Hekawy
 */

import {
  User,
  UserRole,
  PublicUserProfile,
  Room,
  Gift,
  DailyTask,
  Frame,
  Friendship,
  PrivateMessage,
  AppNotification,
  AdminStats,
  Report,
  AuditLog,
  HostApplication,
  AgentApplication,
  Agency,
  HostProfile,
  TargetConfig,
  HostTargetProgress,
  AgencyDashboardData,
  HostDashboardData,
  SystemGiftTierSettings,
  GiftTierConfig,
  GiftTierLevel,
  ReferralStats,
  MicRequest,
  ShippingRechargeLog,
  OfficialMessageTarget
} from '../types';

import { getOrCreateDeviceId } from '../utils/deviceId';

function sanitizeSnippet(text: string): string {
  if (!text) return 'فارغ';
  let clean = text
    .replace(/(access_token|client_secret|bearer|id_token|password|ownerToken|apiKey)=[^&\s"'<]+/gi, '$1=***REDACTED***')
    .replace(/(eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})/g, '***JWT_REDACTED***');
  return clean.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 150);
}

export async function parseJsonResponse(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || 'غير محدد';
  const text = await res.text();
  let urlPath = res.url;
  try {
    urlPath = new URL(res.url, window.location.origin).pathname;
  } catch {}

  if (!contentType.includes('application/json')) {
    const snippet = sanitizeSnippet(text);
    console.error('API Non-JSON Response:', { status: res.status, contentType, url: res.url, snippet });
    throw new Error(
      `[HTTP ${res.status}] المسار: ${urlPath} | Content-Type: ${contentType} | الاستجابة: ${snippet}`
    );
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    const snippet = sanitizeSnippet(text);
    console.error('Failed to parse JSON response:', { status: res.status, contentType, url: res.url, snippet });
    throw new Error(
      `[HTTP ${res.status}] المسار: ${urlPath} | خطأ بنية JSON | الاستجابة: ${snippet}`
    );
  }
}

export const API = {
  // Auth
  async loginWithGoogle(payload: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
    referredBy?: string;
  }): Promise<{ success: boolean; user: User; ownerToken?: string }> {
    const deviceId = getOrCreateDeviceId();
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId
      },
      body: JSON.stringify({ ...payload, deviceId })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر تسجيل الدخول بحساب Google');
    return data;
  },

  async login(payload: { phone?: string; username?: string; id?: string; role?: string; ownerPin?: string; ownerToken?: string }): Promise<{ success: boolean; user: User; ownerToken?: string }> {
    const ownerToken = payload.ownerToken || localStorage.getItem('hekawy_owner_token') || undefined;
    const deviceId = getOrCreateDeviceId();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-device-id': deviceId,
        ...(ownerToken ? { 'x-owner-token': ownerToken } : {})
      },
      body: JSON.stringify({ ...payload, deviceId })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) {
      const err: any = new Error(data.error || 'تعذر تسجيل الدخول');
      err.requiresOwnerPin = data.requiresOwnerPin;
      err.isOwnerAccount = data.isOwnerAccount;
      throw err;
    }
    return data;
  },

  async register(payload: { name: string; username: string; phone?: string; email?: string; gender?: 'male' | 'female'; referredBy?: string; bio?: string; avatar?: string }): Promise<{ success: boolean; user: User }> {
    const deviceId = getOrCreateDeviceId();
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId
      },
      body: JSON.stringify({ ...payload, deviceId })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر إنشاء الحساب');
    return data;
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/users');
    const data = await parseJsonResponse(res);
    return data.users || [];
  },

  async getUser(id: string): Promise<User> {
    const res = await fetch(`/api/users/${id}`);
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'المستخدم غير موجود');
    return data.user;
  },

  async getPublicUser(id: string, requesterId?: string): Promise<PublicUserProfile> {
    const url = requesterId ? `/api/users/${id}/public?requesterId=${requesterId}` : `/api/users/${id}/public`;
    const res = await fetch(url);
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'المستخدم غير موجود');
    return data.profile;
  },

  async updateUserRole(adminId: string, targetUserId: string, role: UserRole): Promise<{ success: boolean; message: string; user?: User }> {
    const res = await fetch(`/api/users/${targetUserId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId
      },
      body: JSON.stringify({ role })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر تعديل الرتبة');
    return data;
  },

  async assignVipNumericId(adminId: string, targetUserId: string, newNumericId: string): Promise<{ success: boolean; message: string; user?: User }> {
    const res = await fetch('/api/admin/users/assign-numeric-id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId
      },
      body: JSON.stringify({ adminId, targetUserId, newNumericId })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر تخصيص الـ ID المميز');
    return data;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر تحديث البيانات');
    return data.user;
  },

  async setStealthMode(userId: string, isStealthMode: boolean): Promise<{ success: boolean; isStealthMode: boolean; user?: User }> {
    const res = await fetch('/api/users/stealth-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isStealthMode })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'فشلت عملية تغيير وضع التخفي');
    return data;
  },

  // Rooms
  async getRooms(params?: { search?: string; category?: string }): Promise<Room[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    const res = await fetch(`/api/rooms?${query.toString()}`);
    const data = await parseJsonResponse(res);
    return data.rooms || [];
  },

  async getRoom(id: string): Promise<{ room: Room; seats: any[]; members: any[] }> {
    const res = await fetch(`/api/rooms/${id}`);
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'الغرفة غير موجودة');
    return data;
  },

  async createRoom(payload: {
    title: string;
    description?: string;
    coverImage?: string;
    hostId: string;
    type?: 'PUBLIC' | 'PRIVATE';
    password?: string;
    allowAudio?: boolean;
    allowVideo?: boolean;
    currentCategory?: string;
    tags?: string[];
    micLayout?: string;
  }): Promise<Room> {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر إنشاء الغرفة');
    if (data.room) {
      try {
        const c1 = localStorage.getItem('roomsList');
        const l1 = c1 ? JSON.parse(c1) : [];
        const map = new Map<string, Room>();
        map.set(data.room.id, data.room);
        l1.forEach((r: any) => { if (r && r.id) map.set(r.id, r); });
        const updated = Array.from(map.values());
        localStorage.setItem('roomsList', JSON.stringify(updated));
        localStorage.setItem('hekawy_persistent_rooms', JSON.stringify(updated));
      } catch {}
    }
    return data.room;
  },

  async updateRoomLayout(roomId: string, layout: string): Promise<{ room: Room; seats: any[] }> {
    const res = await fetch(`/api/rooms/${roomId}/layout`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layout })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر تحديث تخطيط الغرفة');
    if (data.room) {
      try {
        const c1 = localStorage.getItem('roomsList');
        if (c1) {
          const l1 = JSON.parse(c1).map((r: any) => r.id === data.room.id ? { ...r, ...data.room } : r);
          localStorage.setItem('roomsList', JSON.stringify(l1));
          localStorage.setItem('hekawy_persistent_rooms', JSON.stringify(l1));
        }
      } catch {}
    }
    return data;
  },

  async updateRoomSettings(roomId: string, userId: string, settings: {
    title?: string;
    coverImage?: string;
    description?: string;
    micLayout?: string;
    tags?: string[];
  }): Promise<{ room: Room; seats: any[] }> {
    const res = await fetch(`/api/rooms/${roomId}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...settings })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر تحديث إعدادات الغرفة');
    if (data.room) {
      try {
        const c1 = localStorage.getItem('roomsList');
        if (c1) {
          const l1 = JSON.parse(c1).map((r: any) => r.id === data.room.id ? { ...r, ...data.room } : r);
          localStorage.setItem('roomsList', JSON.stringify(l1));
          localStorage.setItem('hekawy_persistent_rooms', JSON.stringify(l1));
        }
      } catch {}
    }
    return data;
  },

  async endRoom(roomId: string, adminOrHostId: string): Promise<boolean> {
    const res = await fetch(`/api/rooms/${roomId}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminOrHostId })
    });
    const data = await parseJsonResponse(res);
    return data.success;
  },

  async deleteRoom(roomId: string, adminOrHostId: string): Promise<boolean> {
    const res = await fetch(`/api/rooms/${roomId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': adminOrHostId
      },
      body: JSON.stringify({ adminOrHostId })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر حذف الغرفة');

    try {
      const c1 = localStorage.getItem('roomsList');
      if (c1) {
        const l1 = JSON.parse(c1).filter((r: any) => r && r.id !== roomId);
        localStorage.setItem('roomsList', JSON.stringify(l1));
      }
      const c2 = localStorage.getItem('hekawy_persistent_rooms');
      if (c2) {
        const l2 = JSON.parse(c2).filter((r: any) => r && r.id !== roomId);
        localStorage.setItem('hekawy_persistent_rooms', JSON.stringify(l2));
      }
    } catch {}

    return data.success;
  },

  // Mic Requests
  async getMicRequests(roomId: string): Promise<MicRequest[]> {
    const res = await fetch(`/api/rooms/${roomId}/mic-requests`);
    const data = await parseJsonResponse(res);
    return data.requests || [];
  },

  async getMyMicRequestStatus(roomId: string, userId: string): Promise<MicRequest | null> {
    const res = await fetch(`/api/rooms/${roomId}/mic-requests/my-status?userId=${encodeURIComponent(userId)}`);
    const data = await parseJsonResponse(res);
    return data.request || null;
  },

  async requestMic(roomId: string, userId: string, targetSeatIndex?: number): Promise<{ success: boolean; request?: MicRequest; error?: string }> {
    const res = await fetch(`/api/rooms/${roomId}/mic-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, targetSeatIndex })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) {
      return { success: false, error: data.error || 'تعذر إرسال طلب المايك' };
    }
    return { success: true, request: data.request };
  },

  async resolveMicRequest(roomId: string, requestId: string, status: 'ACCEPTED' | 'REJECTED', targetSeatIndex?: number): Promise<{ success: boolean; request?: MicRequest; assignedSeatIndex?: number }> {
    const res = await fetch(`/api/rooms/${roomId}/mic-requests/${requestId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, targetSeatIndex })
    });
    const data = await parseJsonResponse(res);
    return data;
  },

  async cancelMicRequest(roomId: string, userId: string): Promise<boolean> {
    const res = await fetch(`/api/rooms/${roomId}/mic-requests/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    const data = await parseJsonResponse(res);
    return !!data.success;
  },

  // Gifts & Wallet
  async getGifts(): Promise<Gift[]> {
    const res = await fetch('/api/gifts');
    const data = await parseJsonResponse(res);
    return data.gifts || [];
  },

  async sendGift(payload: {
    senderId: string;
    receiverId: string;
    giftId: string;
    count: number;
    roomId?: string;
    idempotencyKey?: string;
  }): Promise<any> {
    const res = await fetch('/api/gifts/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر إرسال الهدية');
    return data;
  },

  async getWalletTransactions(userId: string): Promise<any[]> {
    const res = await fetch(`/api/wallet/transactions/${userId}`);
    const data = await parseJsonResponse(res);
    return data.transactions || [];
  },

  async convertCoinsToDiamonds(userId: string, coinsAmount: number): Promise<{ success: boolean; message: string; user: User }> {
    const res = await fetch('/api/wallet/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, coinsAmount })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'فشل التحويل');
    return data;
  },

  async freeTopUp(userId: string, type: 'COIN' | 'DIAMOND', amount: number, reason?: string): Promise<{ success: boolean; message: string; user: User }> {
    const ownerToken = localStorage.getItem('hekawy_owner_token');
    const res = await fetch('/api/wallet/free-topup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        'x-owner-id': userId,
        ...(ownerToken ? { 'x-owner-token': ownerToken } : {})
      },
      body: JSON.stringify({ userId, type, amount, reason })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'فشل الشحن المجاني');
    return data;
  },

  async paidTopUp(params: {
    userId: string;
    amount: number;
    price: string;
    paymentMethod: string;
    packageName?: string;
  }): Promise<{ success: boolean; message: string; user: User; receipt?: any }> {
    const res = await fetch('/api/wallet/paid-topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'فشلت عملية الدفع والشحن');
    return data;
  },

  async topUpBalance(userId: string, type: 'COIN' | 'DIAMOND', amount: number, reason?: string): Promise<{ success: boolean; user: User }> {
    const ownerToken = localStorage.getItem('hekawy_owner_token');
    const res = await fetch('/api/wallet/topup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        'x-owner-id': userId,
        ...(ownerToken ? { 'x-owner-token': ownerToken } : {})
      },
      body: JSON.stringify({ userId, type, amount, reason })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'فشل الشحن');
    return data;
  },

  // Tasks
  async getTasks(userId: string): Promise<DailyTask[]> {
    const res = await fetch(`/api/tasks/${userId}`);
    const data = await parseJsonResponse(res);
    return data.tasks || [];
  },

  async claimTask(userId: string, taskId: string): Promise<{ success: boolean; message: string; rewardCoins: number }> {
    const res = await fetch('/api/tasks/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, taskId })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'فشل استلام المكافأة');
    return data;
  },

  // Referrals
  async getReferralStats(userId: string): Promise<ReferralStats> {
    const res = await fetch(`/api/referrals/stats/${userId}`);
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'فشل جلب إحصائيات الإحالة');
    return data;
  },

  async validateReferralCode(code: string): Promise<{ valid: boolean; referrer?: { name: string; username: string; avatar: string; referralCode: string } }> {
    const res = await fetch(`/api/referrals/validate/${encodeURIComponent(code)}`);
    const data = await parseJsonResponse(res);
    return data;
  },

  // Frames
  async getFrames(): Promise<Frame[]> {
    const res = await fetch('/api/frames');
    const data = await parseJsonResponse(res);
    return data.frames || [];
  },

  async getUserFrames(userId: string): Promise<string[]> {
    const res = await fetch(`/api/frames/user/${userId}`);
    const data = await parseJsonResponse(res);
    return data.ownedFrameIds || [];
  },

  async purchaseFrame(userId: string, frameId: string): Promise<{ success: boolean; message: string; frame: Frame }> {
    const res = await fetch('/api/frames/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, frameId })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'فشل الشراء');
    return data;
  },

  async setActiveFrame(userId: string, frameId: string | null): Promise<boolean> {
    const res = await fetch('/api/frames/active', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, frameId })
    });
    const data = await parseJsonResponse(res);
    return data.success;
  },

  // Friends & Follows
  async getFriends(userId: string): Promise<{ friends: Friendship[]; pendingRequests: Friendship[] }> {
    const res = await fetch(`/api/friends/${userId}`);
    const data = await parseJsonResponse(res);
    return data;
  },

  async sendFriendRequest(senderId: string, receiverId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId, receiverId })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'فشل إرسال طلب الصداقة');
    return data;
  },

  async respondFriendRequest(requestId: string, accept: boolean): Promise<boolean> {
    const res = await fetch('/api/friends/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, accept })
    });
    const data = await parseJsonResponse(res);
    return data.success;
  },

  async toggleFollow(followerId: string, followingId: string): Promise<{ isFollowing: boolean }> {
    const res = await fetch('/api/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId, followingId })
    });
    const data = await parseJsonResponse(res);
    return data;
  },

  // Private Messages & Official Hekawy Messages
  async getPrivateMessages(user1Id: string, user2Id: string): Promise<PrivateMessage[]> {
    const res = await fetch(`/api/messages/private?user1Id=${user1Id}&user2Id=${user2Id}`);
    const data = await parseJsonResponse(res);
    return data.messages || [];
  },

  async sendPrivateMessage(senderId: string, receiverId: string, text: string): Promise<PrivateMessage> {
    const res = await fetch('/api/messages/private', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId, receiverId, text })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'فشل إرسال الرسالة');
    return data.message;
  },

  async sendOfficialHekawyMessage(payload: {
    senderUserId: string;
    targetCategory: OfficialMessageTarget;
    targetUserId?: string;
    text: string;
  }): Promise<{ success: boolean; sentCount: number; targetCategoryLabel: string; message: string }> {
    const ownerToken = localStorage.getItem('hekawy_owner_token') || undefined;
    const res = await fetch('/api/messages/official/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ownerToken ? { 'x-owner-token': ownerToken } : {})
      },
      body: JSON.stringify({ ...payload, ownerToken })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'فشل إرسال الرسالة الرسمية');
    return data;
  },

  async getOfficialHekawyMessages(userId: string): Promise<PrivateMessage[]> {
    const res = await fetch(`/api/messages/official/${userId}`);
    const data = await parseJsonResponse(res);
    return data.messages || [];
  },

  // Notifications
  async getNotifications(userId: string): Promise<AppNotification[]> {
    const res = await fetch(`/api/notifications/${userId}`);
    const data = await parseJsonResponse(res);
    return data.notifications || [];
  },

  async markNotificationRead(id: string): Promise<boolean> {
    const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    const data = await parseJsonResponse(res);
    return data.success;
  },

  // Reports
  async submitReport(payload: {
    reporterId: string;
    targetType: 'USER' | 'ROOM' | 'MESSAGE' | 'STREAM';
    targetId: string;
    targetName: string;
    reason: string;
    details?: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر إرسال البلاغ');
    return data;
  },

  // Admin APIs
  async getAdminStats(adminId: string): Promise<AdminStats> {
    const res = await fetch('/api/admin/stats', {
      headers: { 'x-admin-id': adminId }
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'غير مصرح');
    return data.stats;
  },

  async getAdminReports(adminId: string): Promise<Report[]> {
    const res = await fetch('/api/admin/reports', {
      headers: { 'x-admin-id': adminId }
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'غير مصرح');
    return data.reports || [];
  },

  async resolveAdminReport(adminId: string, reportId: string, status: 'RESOLVED' | 'DISMISSED'): Promise<boolean> {
    const res = await fetch('/api/admin/reports/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId },
      body: JSON.stringify({ adminId, reportId, status })
    });
    const data = await parseJsonResponse(res);
    return data.success;
  },

  async getAdminUsers(adminId: string): Promise<User[]> {
    const res = await fetch('/api/admin/users', {
      headers: { 'x-admin-id': adminId }
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'غير مصرح');
    return data.users || [];
  },

  async banUser(adminId: string, userId: string, reason: string, days?: number): Promise<boolean> {
    const res = await fetch('/api/admin/users/ban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId },
      body: JSON.stringify({ adminId, userId, bannedBy: adminId, reason, days })
    });
    const data = await parseJsonResponse(res);
    return data.success;
  },

  async unbanUser(adminId: string, userId: string): Promise<boolean> {
    const res = await fetch('/api/admin/users/unban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId },
      body: JSON.stringify({ adminId, userId })
    });
    const data = await parseJsonResponse(res);
    return data.success;
  },

  async getAuditLogs(adminId: string): Promise<AuditLog[]> {
    const res = await fetch('/api/admin/audit-logs', {
      headers: { 'x-admin-id': adminId }
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'غير مصرح');
    return data.logs || [];
  },

  async ownerFreeRecharge(ownerId: string, amount: number): Promise<{ success: boolean; message: string; user: User; amount: number }> {
    const res = await fetch('/api/owner/free-diamonds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-owner-id': ownerId
      },
      body: JSON.stringify({ ownerId, amount })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'فشلت عملية الشحن المجاني للمالك');
    return data;
  },

  // Content Moderation & AI Shield APIs
  async scanContentModeration(payload: {
    userId: string;
    targetType: 'AVATAR' | 'ROOM_COVER' | 'LIVE_STREAM' | 'CHAT_MEDIA' | 'VIDEO' | 'ROOM_TEXT';
    targetId?: string;
    mediaUrl?: string;
    text?: string;
    skinRatio?: number;
    torsoExposureRatio?: number;
    roomId?: string;
  }): Promise<{
    allowed: boolean;
    decision: 'SAFE' | 'VIOLATION' | 'NEEDS_REVIEW';
    reason: string;
    action: string;
    incident?: any;
  }> {
    const res = await fetch('/api/moderation/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await parseJsonResponse(res);
    return data;
  },

  async getAdminModerationIncidents(adminId: string): Promise<any[]> {
    const res = await fetch('/api/admin/moderation/incidents', {
      headers: { 'x-admin-id': adminId }
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'غير مصرح');
    return data.incidents || [];
  },

  async resolveModerationIncident(
    adminId: string,
    incidentId: string,
    action: 'CONFIRM_BAN' | 'UNBAN_RESTORE' | 'APPROVE_CONTENT' | 'DISMISS'
  ): Promise<boolean> {
    const res = await fetch('/api/admin/moderation/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId },
      body: JSON.stringify({ adminId, incidentId, action })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'فشلت معالجة بلاغ الرقابة');
    return data.success;
  },

  async assignKingFrame(ownerId: string, targetUserId: string): Promise<{ success: boolean; message: string; user?: User }> {
    const res = await fetch('/api/admin/frames/assign-king', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': ownerId },
      body: JSON.stringify({ ownerId, targetUserId })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر تخصيص إطار الملك');
    return data;
  },

  async adjustUserBalance(
    adminId: string,
    targetUserId: string,
    type: 'COIN' | 'DIAMOND',
    amount: number,
    reason: string
  ): Promise<{ success: boolean; message: string; user?: User }> {
    const ownerToken = localStorage.getItem('hekawy_owner_token');
    const res = await fetch('/api/admin/users/adjust-balance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': adminId,
        'x-owner-id': adminId,
        ...(ownerToken ? { 'x-owner-token': ownerToken } : {})
      },
      body: JSON.stringify({ adminId, targetUserId, type, amount, reason })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر تعديل الرصيد');
    return data;
  },

  async getOwnerOverview(ownerId: string): Promise<any> {
    const res = await fetch('/api/admin/owner', {
      headers: { 'x-owner-id': ownerId, 'x-admin-id': ownerId }
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'غير مصرح للوصول لصلاحيات المالك');
    return data;
  },

  async submitSupportTicket(payload: {
    userId?: string;
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<{ success: boolean; message: string; ticketId?: string }> {
    const res = await fetch('/api/support/ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر إرسال تذكرة الدعم');
    return data;
  },

  // ==========================================
  // --- HOST, AGENT, AGENCY & TARGET APIS ---
  // ==========================================

  // Host Registration & Dashboard
  async applyAsHost(payload: {
    userId: string;
    phone: string;
    country?: string;
    experienceBio: string;
    specialTalent: string;
    sampleLink?: string;
    agentInviteCode?: string;
  }): Promise<{ success: boolean; message: string; application?: HostApplication }> {
    const res = await fetch('/api/hosts/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر تقديم طلب الانضمام كمضيف');
    return data;
  },

  async getHostApplication(userId: string): Promise<HostApplication | null> {
    const res = await fetch(`/api/hosts/application/${userId}`);
    const data = await parseJsonResponse(res);
    return data.application || null;
  },

  async getHostDashboard(userId: string): Promise<HostDashboardData> {
    const res = await fetch(`/api/hosts/dashboard/${userId}`);
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر تحميل لوحة المضيف');
    return data;
  },

  async claimHostTarget(userId: string, targetConfigId: string): Promise<{ success: boolean; message: string; rewardCoins?: number; rewardDiamonds?: number }> {
    const res = await fetch('/api/hosts/claim-target', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, targetConfigId })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر استلام مكافأة التارجت');
    return data;
  },

  // Agent Registration & Dashboard
  async applyAsAgent(payload: {
    userId: string;
    agencyName: string;
    phone: string;
    country: string;
    expectedHostsCount: number;
    experienceBio: string;
  }): Promise<{ success: boolean; message: string; application?: AgentApplication }> {
    const res = await fetch('/api/agents/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر تقديم طلب تأسيس الوكالة');
    return data;
  },

  async getAgentApplication(userId: string): Promise<AgentApplication | null> {
    const res = await fetch(`/api/agents/application/${userId}`);
    const data = await parseJsonResponse(res);
    return data.application || null;
  },

  async getAgentDashboard(userId: string): Promise<AgencyDashboardData> {
    const res = await fetch(`/api/agents/dashboard/${userId}`);
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر تحميل لوحة الوكيل');
    return data;
  },

  async getAgencyByCode(code: string): Promise<{ agency: Partial<Agency> }> {
    const res = await fetch(`/api/agencies/code/${encodeURIComponent(code)}`);
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'الوكالة غير موجودة');
    return data;
  },

  async getTargetConfigs(): Promise<TargetConfig[]> {
    const res = await fetch('/api/targets/configs');
    const data = await parseJsonResponse(res);
    return data.targetConfigs || [];
  },

  // Admin Host, Agent, Agency & Target Management
  async getAdminHostApplications(adminId: string): Promise<HostApplication[]> {
    const res = await fetch('/api/admin/host-applications', {
      headers: { 'x-admin-id': adminId }
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'غير مصرح');
    return data.applications || [];
  },

  async reviewHostApplication(
    adminId: string,
    applicationId: string,
    action: 'APPROVE' | 'REJECT',
    rejectionReason?: string,
    assignedAgencyId?: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/admin/host-applications/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId },
      body: JSON.stringify({ adminId, applicationId, action, rejectionReason, assignedAgencyId })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر معالجة طلب المضيف');
    return data;
  },

  async getAdminAgentApplications(adminId: string): Promise<AgentApplication[]> {
    const res = await fetch('/api/admin/agent-applications', {
      headers: { 'x-admin-id': adminId }
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'غير مصرح');
    return data.applications || [];
  },

  async reviewAgentApplication(
    adminId: string,
    applicationId: string,
    action: 'APPROVE' | 'REJECT',
    rejectionReason?: string,
    commissionPercentage?: number
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/admin/agent-applications/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId },
      body: JSON.stringify({ adminId, applicationId, action, rejectionReason, commissionPercentage })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر معالجة طلب الوكالة');
    return data;
  },

  async getAdminAgencies(adminId: string): Promise<Agency[]> {
    const res = await fetch('/api/admin/agencies', {
      headers: { 'x-admin-id': adminId }
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'غير مصرح');
    return data.agencies || [];
  },

  async updateAdminAgencyStatus(
    adminId: string,
    agencyId: string,
    status: 'ACTIVE' | 'SUSPENDED',
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/admin/agencies/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId },
      body: JSON.stringify({ adminId, agencyId, status, reason })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر تحديث حالة الوكالة');
    return data;
  },

  async getAdminHostProfiles(adminId: string): Promise<HostProfile[]> {
    const res = await fetch('/api/admin/host-profiles', {
      headers: { 'x-admin-id': adminId }
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'غير مصرح');
    return data.hostProfiles || [];
  },

  async linkHostToAgency(
    adminId: string,
    hostUserId: string,
    agencyId: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/admin/hosts/link-agency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId },
      body: JSON.stringify({ adminId, hostUserId, agencyId })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر ربط المضيف بالوكالة');
    return data;
  },

  async unlinkHostFromAgency(
    adminId: string,
    hostUserId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/admin/hosts/unlink-agency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId },
      body: JSON.stringify({ adminId, hostUserId, reason })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر فك ارتباط المضيف');
    return data;
  },

  async transferHostAgency(
    adminId: string,
    hostUserId: string,
    newAgencyId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/admin/hosts/transfer-agency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId },
      body: JSON.stringify({ adminId, hostUserId, newAgencyId, reason })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر نقل المضيف');
    return data;
  },

  async updateAdminHostStatus(
    adminId: string,
    hostUserId: string,
    status: 'ACTIVE' | 'SUSPENDED',
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/admin/hosts/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId },
      body: JSON.stringify({ adminId, hostUserId, status, reason })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر تحديث حالة المضيف');
    return data;
  },

  async getAdminTargetConfigs(adminId: string): Promise<TargetConfig[]> {
    const res = await fetch('/api/admin/target-configs', {
      headers: { 'x-admin-id': adminId }
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'غير مصرح');
    return data.targetConfigs || [];
  },

  async createAdminTargetConfig(
    adminId: string,
    config: Omit<TargetConfig, 'id' | 'createdAt'>
  ): Promise<{ success: boolean; message: string; targetConfig?: TargetConfig }> {
    const res = await fetch('/api/admin/target-configs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId },
      body: JSON.stringify({ adminId, ...config })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر إنشاء التارجت');
    return data;
  },

  async updateAdminTargetConfig(
    adminId: string,
    id: string,
    updates: Partial<TargetConfig>
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/admin/target-configs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId },
      body: JSON.stringify({ adminId, updates })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر تعديل التارجت');
    return data;
  },

  // Gift Tiers & Sound Configurations
  async getGiftTierSettings(): Promise<SystemGiftTierSettings> {
    const res = await fetch('/api/gift-tiers');
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر جلب إعدادات فئات الهدايا');
    return data.settings;
  },

  async updateAdminGiftTierSettings(
    adminId: string,
    payload: {
      tiers?: GiftTierConfig[];
      globalSoundEnabled?: boolean;
      bigGiftThreshold?: number;
      globalBannerEnabled?: boolean;
      globalBannerDurationMs?: number;
    }
  ): Promise<{ success: boolean; message: string; settings: SystemGiftTierSettings }> {
    const res = await fetch('/api/admin/gift-tiers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': adminId },
      body: JSON.stringify({ adminId, ...payload })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر حفظ إعدادات فئات الهدايا');
    return data;
  },

  // Shipping Agent System
  async assignShippingAgent(
    ownerId: string,
    targetUserId: string,
    isAgent: boolean
  ): Promise<{ success: boolean; message: string; user?: User }> {
    const res = await fetch('/api/shipping-agent/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-id': ownerId },
      body: JSON.stringify({ targetUserId, isAgent })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر تحديث صلاحية وكيل الشحن');
    return data;
  },

  async transferDiamondsAsAgent(
    agentId: string,
    targetUserIdentifier: string,
    packageId: string
  ): Promise<{ success: boolean; message: string; agentDiamonds?: number; targetUser?: Partial<User>; receipt?: ShippingRechargeLog }> {
    const res = await fetch('/api/shipping-agent/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, targetUserIdentifier, packageId })
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'فشلت عملية تحويل الماسات');
    return data;
  },

  async getShippingAgentsList(): Promise<{ id: string; numericId: string; name: string; username: string; avatar: string; phone: string; role: string; isOwner?: boolean; isShippingAgent: boolean }[]> {
    const res = await fetch('/api/shipping-agents/list');
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر جلب قائمة وكلاء الشحن');
    return data.agents || [];
  },

  async getAdminRechargeLogs(adminId: string): Promise<ShippingRechargeLog[]> {
    const res = await fetch('/api/admin/recharge-logs', {
      headers: { 'x-admin-id': adminId }
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'تعذر جلب سجلات الشحن');
    return data.logs || [];
  }
};
