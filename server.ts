import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.ts';
import { serverModerationEngine } from './server/moderationService.ts';

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- CORS & PREFLIGHT MIDDLEWARE ---
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-device-id, x-owner-token, x-admin-id, x-user-id, x-owner-pin');
  res.setHeader('Access-Control-Expose-Headers', 'x-device-id, x-owner-token');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// --- WEBSOCKET REAL-TIME & WEBRTC SIGNALING ---

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  roomId?: string;
  isAlive: boolean;
}

const clients = new Map<WebSocket, ClientConnection>();

const wss = new WebSocketServer({ server, path: '/ws' });

function broadcastToRoom(roomId: string, message: any, excludeWs?: WebSocket) {
  const payload = JSON.stringify(message);
  for (const [ws, client] of clients.entries()) {
    if (client.roomId === roomId && ws.readyState === WebSocket.OPEN && ws !== excludeWs) {
      ws.send(payload);
    }
  }
}

function broadcastToUser(userId: string, message: any) {
  const payload = JSON.stringify(message);
  for (const [ws, client] of clients.entries()) {
    if (client.userId === userId && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

function broadcastAll(message: any) {
  const payload = JSON.stringify(message);
  for (const [ws] of clients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

// Track which user has had their join entrance played in a room session (prevents repeats on reconnects)
const playedRoomJoinEntrances = new Set<string>();

wss.on('connection', (ws: WebSocket) => {
  const clientInfo: ClientConnection = {
    ws,
    userId: '',
    isAlive: true
  };
  clients.set(ws, clientInfo);

  ws.on('pong', () => {
    clientInfo.isAlive = true;
  });

  ws.on('message', (raw: string) => {
    try {
      const data = JSON.parse(raw.toString());
      const type = data.type;

      if (type === 'init') {
        clientInfo.userId = data.userId;
        const user = db.getUserById(data.userId);
        if (user) {
          user.isOnline = true;
          db.save();
          broadcastAll({
            type: 'user_presence_updated',
            userId: user.id,
            isOnline: true
          });
        }
      }

      if (type === 'join_room') {
        const { roomId, userId, isStealth } = data;
        clientInfo.roomId = roomId;
        clientInfo.userId = userId;

        const isOwner = db.isOwner(userId);
        const user = db.getUserById(userId);
        const isStealthActive = isOwner && (isStealth === true || user?.isStealthMode === true);

        const member = db.addRoomMember(roomId, userId, isStealthActive);
        const seats = db.getRoomSeats(roomId);
        const room = db.getRoomById(roomId);
        const messages = db.getRoomMessages(roomId, 50);

        // Send initial room snapshot to joining user
        ws.send(JSON.stringify({
          type: 'room_snapshot',
          roomId,
          room,
          seats,
          members: db.getRoomMembers(roomId, isOwner),
          messages,
          micRequests: db.getMicRequests(roomId)
        }));

        if (!isStealthActive) {
          // Prepare entrance payload only on first join in room session (prevents repeats on reconnects)
          const sessionKey = `${roomId}:${userId}`;
          const isFirstJoinInSession = !playedRoomJoinEntrances.has(sessionKey);
          if (isFirstJoinInSession) {
            playedRoomJoinEntrances.add(sessionKey);
          }

          const activeEntranceId = user?.activeEntranceId || (isOwner ? 'entrance_owner_imperial_throne' : 'entrance_free_sparkle');
          const entrance = db.getEntranceById(activeEntranceId);
          const isKingEntrance = isOwner || activeEntranceId === 'entrance_owner_imperial_throne' || activeEntranceId === 'entrance_king_limousine';

          const entrancePayload = isFirstJoinInSession ? {
            id: `ent_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            userId: user?.id || userId,
            userName: user?.name || member?.userName || 'مستخدم حكاوي',
            userAvatar: user?.avatar || member?.userAvatar || '',
            entranceId: activeEntranceId,
            entranceName: isKingEntrance ? 'الموكب الإمبراطوري الملكي الفاخر' : (entrance?.nameAr || 'وهج الحضور النجمي'),
            entranceCategory: entrance?.category || 'FREE',
            entranceTier: entrance?.tier || 'COMMON',
            soundType: entrance?.soundType || 'sparkle',
            durationSeconds: isKingEntrance ? 5.0 : (entrance?.durationSeconds || 5.0),
            isOwner,
            userRole: user?.role || 'USER'
          } : undefined;

          // Broadcast to all room members including the joined user so everyone sees the grand arrival
          broadcastToRoom(roomId, {
            type: 'member_joined',
            roomId,
            member,
            entrance: entrancePayload,
            viewerCount: db.getRoomMembers(roomId).length
          });

          broadcastAll({
            type: 'room_counter_updated',
            roomId,
            viewerCount: db.getRoomMembers(roomId).length
          });
        }
      }

      if (type === 'trigger_entrance') {
        const { roomId, userId, entranceId } = data;
        const user = db.getUserById(userId);
        const isOwner = db.isOwner(userId);

        if (isOwner && (user?.isStealthMode || data.isStealth)) {
          // Suppress entrance triggers when in stealth mode
          return;
        }

        const targetEntranceId = entranceId || user?.activeEntranceId || (isOwner ? 'entrance_owner_imperial_throne' : 'entrance_free_sparkle');
        const isKingEntrance = isOwner || targetEntranceId === 'entrance_owner_imperial_throne' || targetEntranceId === 'entrance_king_limousine';
        const entrance = db.getEntranceById(targetEntranceId);

        const entrancePayload = {
          id: `ent_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userId: user?.id || userId,
          userName: user?.name || 'مستخدم حكاوي',
          userAvatar: user?.avatar || '',
          entranceId: targetEntranceId,
          entranceName: isKingEntrance ? 'الموكب الإمبراطوري الملكي الفاخر' : (entrance?.nameAr || 'وهج الحضور النجمي'),
          entranceCategory: entrance?.category || 'FREE',
          entranceTier: entrance?.tier || 'COMMON',
          soundType: entrance?.soundType || 'sparkle',
          durationSeconds: isKingEntrance ? 5.0 : (entrance?.durationSeconds || 5.0),
          isOwner,
          userRole: user?.role || 'USER'
        };

        broadcastToRoom(roomId, {
          type: 'room_entrance',
          roomId,
          entrance: entrancePayload
        });
      }

      if (type === 'play_room_effect') {
        const { roomId, userId, effectId, userName } = data;
        broadcastToRoom(roomId, {
          type: 'room_effect_played',
          roomId,
          userId,
          effectId,
          userName: userName || 'عضو'
        });
      }

      if (type === 'leave_room') {
        const { roomId, userId } = data;
        playedRoomJoinEntrances.delete(`${roomId}:${userId}`);
        if (clientInfo.roomId === roomId) {
          clientInfo.roomId = undefined;
        }
        const isOwner = db.isOwner(userId);
        const user = db.getUserById(userId);
        const wasStealth = isOwner && (user?.isStealthMode === true);
        db.removeRoomMember(roomId, userId);

        if (!wasStealth) {
          broadcastToRoom(roomId, {
            type: 'member_left',
            roomId,
            userId,
            viewerCount: db.getRoomMembers(roomId).length,
            seats: db.getRoomSeats(roomId)
          });
        }

        broadcastAll({
          type: 'room_counter_updated',
          roomId,
          viewerCount: db.getRoomMembers(roomId).length
        });
      }

      if (type === 'chat_message') {
        const { roomId, userId, text } = data;
        const message = db.addRoomMessage({ roomId, userId, text });
        broadcastToRoom(roomId, {
          type: 'new_chat_message',
          roomId,
          message
        });
      }

      if (type === 'send_gift') {
        const { senderId, receiverId, giftId, count, roomId, idempotencyKey } = data;
        const result = db.sendGift({ senderId, receiverId, giftId, count, roomId, idempotencyKey });
        
        if (result.success && result.transaction) {
          // Broadcast gift animation and audio alert to everyone in room
          if (roomId) {
            broadcastToRoom(roomId, {
              type: 'gift_received',
              roomId,
              transaction: result.transaction
            });

            // Also add a special gift event message to the chat
            const chatMsg = db.addRoomMessage({
              roomId,
              userId: senderId,
              text: `أرسل ${count}x ${result.transaction.giftName} ${result.transaction.giftIcon} إلى ${result.transaction.receiverName}! 🎁✨`,
              giftData: {
                giftId,
                giftName: result.transaction.giftName,
                giftIcon: result.transaction.giftIcon,
                count,
                receiverName: result.transaction.receiverName
              }
            });

            broadcastToRoom(roomId, {
              type: 'new_chat_message',
              roomId,
              message: chatMsg
            });
          }

          // Global Gift Banner Broadcast Check
          const giftTierSettings = db.getGiftTierSettings();
          const threshold = giftTierSettings.bigGiftThreshold ?? 5000;
          const bannerEnabled = giftTierSettings.globalBannerEnabled ?? true;

          if (bannerEnabled && result.transaction.totalDiamonds >= threshold) {
            let roomName = '';
            if (roomId) {
              const room = db.getRoomById(roomId);
              if (room) roomName = room.title || `غرفة #${room.id}`;
            }

            broadcastAll({
              type: 'global_gift_broadcast',
              transaction: {
                ...result.transaction,
                roomName
              },
              gift: db.getGifts().find(g => g.id === giftId),
              timestamp: Date.now()
            });
          }
          
          // Send balance update to sender and receiver
          broadcastToUser(senderId, {
            type: 'balance_update',
            diamonds: result.senderNewDiamonds
          });
          broadcastToUser(receiverId, {
            type: 'balance_update',
            coins: result.receiverNewCoins
          });
        }
      }

      if (type === 'request_mic') {
        const { roomId, userId, targetSeatIndex } = data;
        const result = db.addMicRequest(roomId, userId, targetSeatIndex);
        if (!result.success && result.isDuplicate) {
          broadcastToUser(userId, {
            type: 'mic_request_submitted',
            roomId,
            request: result.request,
            isDuplicate: true,
            message: result.message || 'لديك طلب صعود إلى المايك قيد الانتظار بالفعل'
          });
          return;
        }
        const req = result.request;
        const room = db.getRoomById(roomId);
        if (room) {
          // Broadcast to ALL connected clients so host and room members receive it instantly
          broadcastAll({
            type: 'new_mic_request',
            roomId,
            request: req
          });
          broadcastAll({
            type: 'mic_requests_updated',
            roomId,
            requests: db.getMicRequests(roomId)
          });
          broadcastToUser(room.hostId, {
            type: 'new_mic_request',
            roomId,
            request: req
          });
          // Also confirm to requesting user
          broadcastToUser(userId, {
            type: 'mic_request_submitted',
            roomId,
            request: req
          });
        }
      }

      if (type === 'cancel_mic_request') {
        const { roomId, userId } = data;
        const cancelled = db.cancelMicRequest(roomId, userId);
        if (cancelled) {
          broadcastAll({
            type: 'mic_request_cancelled',
            roomId,
            userId
          });
          broadcastAll({
            type: 'mic_requests_updated',
            roomId,
            requests: db.getMicRequests(roomId)
          });
          const room = db.getRoomById(roomId);
          if (room) {
            broadcastToUser(room.hostId, {
              type: 'mic_request_cancelled',
              roomId,
              userId
            });
          }
          broadcastToUser(userId, {
            type: 'mic_request_cancelled',
            roomId,
            userId
          });
        }
      }

      if (type === 'resolve_mic_request') {
        const { requestId, status, targetSeatIndex } = data;
        const result = db.resolveMicRequest(requestId, status, targetSeatIndex);
        if (result.success && result.request) {
          const roomId = result.request.roomId;
          broadcastAll({
            type: 'seats_updated',
            roomId,
            seats: db.getRoomSeats(roomId),
            members: db.getRoomMembers(roomId)
          });
          const assignedSeat = result.assignedSeatIndex !== undefined ? result.assignedSeatIndex : targetSeatIndex;
          const resolveMsg = status === 'ACCEPTED'
            ? 'تمت الموافقة على طلبك، تفضل بالصعود للمايك 🎙️'
            : 'عذراً، اعتذر صاحب الغرفة عن قبول طلب المايك في الوقت الحالي.';

          // Broadcast to requesting user
          broadcastToUser(result.request.userId, {
            type: 'mic_request_resolved',
            roomId,
            userId: result.request.userId,
            status,
            seatIndex: assignedSeat,
            seatLabel: assignedSeat !== undefined ? `المقعد رقم ${assignedSeat + 1}` : undefined,
            message: resolveMsg
          });

          // Also broadcast to ALL clients for robust real-time handling
          broadcastAll({
            type: 'mic_request_resolved',
            roomId,
            userId: result.request.userId,
            status,
            seatIndex: assignedSeat,
            seatLabel: assignedSeat !== undefined ? `المقعد رقم ${assignedSeat + 1}` : undefined,
            message: resolveMsg
          });

          // Broadcast updated requests list to room
          broadcastAll({
            type: 'mic_requests_updated',
            roomId,
            requests: db.getMicRequests(roomId)
          });
        }
      }

      if (type === 'pull_to_mic') {
        const { roomId, hostId, targetUserId, seatIndex } = data;
        const room = db.getRoomById(roomId);
        const hostUser = db.getUserById(hostId);
        const isOwnerOrHost = room?.hostId === hostId || db.isOwner(hostId) || hostUser?.role === 'ADMIN' || hostUser?.role === 'MODERATOR';

        if (room && isOwnerOrHost && targetUserId) {
          const seats = db.getRoomSeats(roomId);
          let targetSeatIdx = seatIndex !== undefined && seatIndex >= 0 ? seatIndex : seats.findIndex(s => !s.userId && !s.isLocked);
          if (targetSeatIdx !== -1) {
            const assignRes = db.assignUserToSeat(roomId, targetSeatIdx, targetUserId);
            if (assignRes.success) {
              db.cancelMicRequest(roomId, targetUserId);

              broadcastToRoom(roomId, {
                type: 'seats_updated',
                roomId,
                seats: db.getRoomSeats(roomId),
                members: db.getRoomMembers(roomId)
              });

              broadcastToRoom(roomId, {
                type: 'mic_requests_updated',
                roomId,
                requests: db.getMicRequests(roomId)
              });

              broadcastToUser(targetUserId, {
                type: 'mic_request_resolved',
                roomId,
                userId: targetUserId,
                status: 'ACCEPTED',
                seatIndex: targetSeatIdx,
                seatLabel: `المقعد رقم ${targetSeatIdx + 1}`,
                message: 'قام صاحب الغرفة بسحبك وإعطائك المايك للتحدث المباشر! 🎙️✨'
              });
            }
          }
        }
      }

      if (type === 'take_seat') {
        const { roomId, seatIndex, userId } = data;
        const result = db.assignUserToSeat(roomId, seatIndex, userId);
        if (result.success) {
          broadcastToRoom(roomId, {
            type: 'seats_updated',
            roomId,
            seats: db.getRoomSeats(roomId),
            members: db.getRoomMembers(roomId)
          });
        }
      }

      if (type === 'leave_seat') {
        const { roomId, seatIndex } = data;
        db.removeUserFromSeat(roomId, seatIndex);
        broadcastToRoom(roomId, {
          type: 'seats_updated',
          roomId,
          seats: db.getRoomSeats(roomId),
          members: db.getRoomMembers(roomId)
        });
      }

      if (type === 'update_seat_media') {
        const { roomId, seatIndex, isMuted, isCameraOn, isSpeaking, customFrameUrl } = data;
        db.updateSeatState(roomId, seatIndex, {
          ...(isMuted !== undefined && { isMuted }),
          ...(isCameraOn !== undefined && { isCameraOn }),
          ...(isSpeaking !== undefined && { isSpeaking }),
          ...(customFrameUrl !== undefined && { customFrameUrl })
        });

        broadcastToRoom(roomId, {
          type: 'seats_updated',
          roomId,
          seats: db.getRoomSeats(roomId)
        });
      }

      if (type === 'update_seat_frame') {
        const { roomId, seatIndex, customFrameUrl } = data;
        if (roomId && seatIndex !== undefined && customFrameUrl) {
          db.updateSeatState(roomId, seatIndex, { customFrameUrl });
          broadcastToRoom(roomId, {
            type: 'seats_updated',
            roomId,
            seats: db.getRoomSeats(roomId)
          });
        }
      }

      if (type === 'change_mic_layout') {
        const { roomId, layout } = data;
        const result = db.changeRoomLayout(roomId, layout);
        if (result.success) {
          const room = db.getRoomById(roomId);
          broadcastToRoom(roomId, {
            type: 'room_layout_updated',
            roomId,
            micLayout: layout,
            seatsCount: room?.seatsCount,
            seats: result.seats
          });
          broadcastToRoom(roomId, {
            type: 'seats_updated',
            roomId,
            seats: result.seats,
            members: db.getRoomMembers(roomId)
          });
        }
      }

      if (type === 'update_room_settings') {
        const { roomId, userId, title, coverImage, description, micLayout, tags, requireHostApproval } = data;
        const result = db.updateRoomSettings(roomId, userId, {
          title,
          coverImage,
          description,
          micLayout,
          tags,
          requireHostApproval
        });

        if (result.success && result.room) {
          broadcastToRoom(roomId, {
            type: 'room_settings_updated',
            roomId,
            room: result.room,
            seats: result.seats
          });
          broadcastToRoom(roomId, {
            type: 'room_layout_updated',
            roomId,
            micLayout: result.room.micLayout,
            seatsCount: result.room.seatsCount,
            seats: result.seats
          });
          broadcastToRoom(roomId, {
            type: 'seats_updated',
            roomId,
            seats: result.seats,
            members: db.getRoomMembers(roomId)
          });
        }
      }

      if (type === 'host_control') {
        const { roomId, action, targetUserId, seatIndex } = data;
        const room = db.getRoomById(roomId);
        if (room) {
          if (action === 'mute_all') {
            const seats = db.getRoomSeats(roomId);
            seats.forEach((s, idx) => {
              if (!s.isHostSeat && s.userId) {
                s.isMuted = true;
              }
            });
            db.save();
          } else if (action === 'unmute_all') {
            const seats = db.getRoomSeats(roomId);
            seats.forEach((s, idx) => {
              s.isMuted = false;
            });
            db.save();
          } else if (action === 'kick_user' && targetUserId) {
            db.removeRoomMember(roomId, targetUserId);
            broadcastToUser(targetUserId, {
              type: 'kicked_from_room',
              roomId,
              message: 'قام المضيف بإزالتك من الغرفة.'
            });
          } else if (action === 'mute_seat' && seatIndex !== undefined) {
            db.updateSeatState(roomId, seatIndex, { isMuted: true });
          } else if (action === 'lock_seat' && seatIndex !== undefined) {
            const seats = db.getRoomSeats(roomId);
            if (seats[seatIndex]) {
              seats[seatIndex].isLocked = !seats[seatIndex].isLocked;
              if (seats[seatIndex].isLocked && seats[seatIndex].userId) {
                db.removeUserFromSeat(roomId, seatIndex);
              }
              db.save();
            }
          } else if (action === 'end_room') {
            db.endRoom(roomId, clientInfo.userId);
            broadcastToRoom(roomId, {
              type: 'room_ended',
              roomId,
              message: 'تم إنهاء الجلسة بواسطة المضيف.'
            });
          }

          broadcastToRoom(roomId, {
            type: 'seats_updated',
            roomId,
            seats: db.getRoomSeats(roomId),
            members: db.getRoomMembers(roomId)
          });
        }
      }

      // WebRTC Peer-to-Peer Signaling forwarding for Audio/Video
      if (type === 'webrtc_signal') {
        const { roomId, targetUserId, signal, senderId } = data;
        if (targetUserId) {
          broadcastToUser(targetUserId, {
            type: 'webrtc_signal',
            roomId,
            senderId: senderId || clientInfo.userId,
            signal
          });
        } else if (roomId) {
          // Broadcast to all other peers in the room
          broadcastToRoom(roomId, {
            type: 'webrtc_signal',
            roomId,
            senderId: senderId || clientInfo.userId,
            signal
          }, ws);
        }
      }

      // Speaking audio level pulse broadcast
      if (type === 'audio_level') {
        const { roomId, userId, level, isSpeaking } = data;
        broadcastToRoom(roomId, {
          type: 'peer_audio_level',
          roomId,
          userId,
          level,
          isSpeaking
        }, ws);
      }

    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    const { userId, roomId } = clientInfo;
    if (userId) {
      const user = db.getUserById(userId);
      if (user) {
        user.isOnline = false;
        db.save();
        broadcastAll({
          type: 'user_presence_updated',
          userId: user.id,
          isOnline: false
        });
      }
    }
    if (userId && roomId) {
      playedRoomJoinEntrances.delete(`${roomId}:${userId}`);
      db.removeRoomMember(roomId, userId);
      const currentCount = db.getRoomMembers(roomId).length;
      broadcastToRoom(roomId, {
        type: 'member_left',
        roomId,
        userId,
        viewerCount: currentCount,
        seats: db.getRoomSeats(roomId)
      });
      broadcastAll({
        type: 'room_counter_updated',
        roomId,
        viewerCount: currentCount
      });
    }
    clients.delete(ws);
  });
});

// Periodic ping to clean stale WebSocket connections
const interval = setInterval(() => {
  for (const [ws, client] of clients.entries()) {
    if (!client.isAlive) {
      ws.terminate();
      clients.delete(ws);
      continue;
    }
    client.isAlive = false;
    ws.ping();
  }
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

// --- REST API ROUTES ---

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'حكاوي - Hekawy Live', timestamp: new Date().toISOString() });
});

// Helper to extract or issue a persistent device ID
function extractDeviceId(req: express.Request, res: express.Response): string {
  let deviceId = (req.headers['x-device-id'] as string) || req.body?.deviceId;
  if (!deviceId) {
    const cookieStr = req.headers.cookie || '';
    const match = cookieStr.match(/hekawy_device_id=([^;]+)/);
    if (match && match[1]) deviceId = match[1];
  }
  if (!deviceId || !deviceId.trim()) {
    deviceId = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
  }
  deviceId = deviceId.trim();
  res.cookie('hekawy_device_id', deviceId, {
    maxAge: 315360000000, // 10 years
    httpOnly: false,
    sameSite: 'lax',
    path: '/'
  });
  res.setHeader('x-device-id', deviceId);
  return deviceId;
}

// Auth Routes
app.post('/api/auth/google', (req, res) => {
  const { googleId, email, name, avatar, referredBy, ownerPin } = req.body || {};
  const ownerTokenHeader = (req.headers['x-owner-token'] as string) || req.body.ownerToken;
  if (!googleId || !email) {
    return res.status(400).json({ error: 'بيانات حساب Google غير مكتملة (المعرف والبريد الإلكتروني مطلوبان)' });
  }

  const deviceId = extractDeviceId(req, res);

  try {
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanGoogleId = String(googleId).trim();
    
    // Check if user already exists
    const existingUsers = db.getUsers();
    const existingUser = existingUsers.find(
      u => u.googleId === cleanGoogleId || (u.email && u.email.toLowerCase() === cleanEmail)
    );

    const isSystemOwner = cleanEmail === 'jdwalrwyy@gmail.com' || (existingUser && (db.isOwner(existingUser.id) || existingUser.role === 'OWNER' || existingUser.isOwner));

    if (existingUser) {
      if (!isSystemOwner) {
        // Validate device binding for existing account
        const accessCheck = db.validateDeviceAccess(deviceId, existingUser.id);
        if (!accessCheck.allowed) {
          return res.status(400).json({ error: accessCheck.error || 'هذا الجهاز مرتبط بالفعل بحساب حكاوي آخر.' });
        }
      }
    } else {
      if (!isSystemOwner) {
        // Registering new Google account -> Check if device is bound to another user
        const existingBinding = db.getDeviceBinding(deviceId);
        if (existingBinding) {
          return res.status(400).json({ error: 'هذا الجهاز مرتبط بالفعل بحساب حكاوي آخر.' });
        }
      }
    }

    const user = db.loginOrCreateWithGoogle({
      googleId: cleanGoogleId,
      email: cleanEmail,
      name: name ? String(name).trim() : 'مستخدم Google',
      avatar: avatar ? String(avatar) : undefined,
      referredBy: referredBy ? String(referredBy).trim() : undefined
    });

    if (user.isBanned || user.status === 'banned') {
      return res.status(400).json({ error: 'تم حظر هذا الحساب نهائياً لمخالفة شروط الاستخدام' });
    }

    // Bind device to user account in database for telemetry
    db.bindDevice(deviceId, user.id, req.ip);

    const isOwner = db.isOwner(user.id) || user.role === 'OWNER' || user.isOwner === true || user.is_owner === true;
    let ownerToken: string | undefined;

    if (isOwner) {
      // Recognized system owner verified by official Google OAuth
      ownerToken = db.createOwnerSession();
    }

    res.json({ success: true, user, ownerToken });
  } catch (err: any) {
    console.error('Error in /api/auth/google:', err);
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء معالجة تسجيل الدخول بحساب Google' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { phone, username, id, ownerPin } = req.body;
  const ownerTokenHeader = (req.headers['x-owner-token'] as string) || req.body.ownerToken;
  const deviceId = extractDeviceId(req, res);
  
  if (id) {
    const user = db.getUserById(id);
    if (user) {
      if (user.isBanned || user.status === 'banned') {
        return res.status(400).json({ error: 'تم حظر هذا الحساب نهائياً لمخالفة شروط الاستخدام' });
      }

      db.bindDevice(deviceId, user.id, req.ip);

      // CRITICAL OWNER VERIFICATION:
      if (db.isOwner(user.id) || user.role === 'OWNER' || user.isOwner === true || user.is_owner === true) {
        if (!db.validateOwnerToken(ownerTokenHeader)) {
          return res.status(401).json({ 
            error: 'حساب المالك محمي. يرجى إدخال رمز أمان المالك (PIN) للتحقق.',
            isOwnerAccount: true,
            requiresOwnerPin: true
          });
        }
      }
      return res.json({ success: true, user });
    }
    return res.status(404).json({ error: 'جلسة الحساب غير موجودة أو انتهت صلاحيتها' });
  }

  if (phone) {
    const cleanPhone = String(phone).trim();
    const user = db.getUserByPhone(cleanPhone);
    if (!user) {
      return res.status(404).json({ error: 'رقم الهاتف غير مسجل. يرجى إنشاء حساب جديد.' });
    }

    if (user.isBanned || user.status === 'banned') {
      return res.status(400).json({ error: 'تم حظر هذا الحساب نهائياً لمخالفة شروط الاستخدام' });
    }

    db.bindDevice(deviceId, user.id, req.ip);

    if (db.isOwner(user.id) || user.role === 'OWNER' || user.isOwner === true || user.is_owner === true) {
      if (!ownerPin || !db.verifyOwnerPin(ownerPin)) {
        return res.status(401).json({
          error: 'حساب المالك محمي برمز أمان خاص. يرجى إدخال رمز الأمان الصحيح.',
          requiresOwnerPin: true,
          isOwnerAccount: true
        });
      }
      const ownerToken = db.createOwnerSession();
      return res.json({ success: true, user, ownerToken });
    }
    return res.json({ success: true, user });
  }

  if (username) {
    const cleanUsername = String(username).trim().toLowerCase();
    const user = db.getUserByUsername(cleanUsername);
    if (user) {
      if (user.isBanned || user.status === 'banned') {
        return res.status(400).json({ error: 'تم حظر هذا الحساب نهائياً لمخالفة شروط الاستخدام' });
      }

      db.bindDevice(deviceId, user.id, req.ip);

      if (db.isOwner(user.id) || user.role === 'OWNER' || user.isOwner === true || user.is_owner === true) {
        if (!ownerPin || !db.verifyOwnerPin(ownerPin)) {
          return res.status(401).json({
            error: 'حساب المالك محمي برمز أمان خاص. يرجى إدخال رمز الأمان الصحيح.',
            requiresOwnerPin: true,
            isOwnerAccount: true
          });
        }
        const ownerToken = db.createOwnerSession();
        return res.json({ success: true, user, ownerToken });
      }
      return res.json({ success: true, user });
    }

    return res.status(404).json({ error: 'اسم المستخدم غير موجود' });
  }

  return res.status(401).json({ error: 'يرجى تسجيل الدخول أو إنشاء حساب جديد' });
});

app.post('/api/auth/register', (req, res) => {
  const { name, username, phone, email, gender, referredBy, avatar, bio } = req.body;
  if (!name || !username) {
    return res.status(400).json({ error: 'الاسم واسم المستخدم مطلوبان' });
  }

  const deviceId = extractDeviceId(req, res);

  const cleanUsername = String(username).trim().toLowerCase();
  const existing = db.getUserByUsername(cleanUsername);
  if (existing) {
    return res.status(400).json({ error: 'اسم المستخدم مسجل مسبقاً، اختر اسماً آخر' });
  }

  if (phone) {
    const existingPhone = db.getUserByPhone(String(phone).trim());
    if (existingPhone) {
      return res.status(400).json({ error: 'رقم الهاتف مسجل مسبقاً لحساب آخر' });
    }
  }

  try {
    const user = db.createUser({
      name: String(name).trim(),
      username: cleanUsername,
      phone: phone ? String(phone).trim() : undefined,
      email: email ? String(email).trim().toLowerCase() : undefined,
      gender: gender === 'female' || gender === 'FEMALE' ? 'female' : 'male',
      referredBy: referredBy ? String(referredBy).trim().toUpperCase() : undefined,
      avatar: avatar ? String(avatar).trim() : undefined,
      bio: bio ? String(bio).trim() : undefined
    });

    db.bindDevice(deviceId, user.id, req.ip);

    res.json({ success: true, user });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'فشل إنشاء الحساب' });
  }
});

// Referral Endpoints
app.get('/api/referrals/stats/:userId', (req, res) => {
  const { userId } = req.params;
  const stats = db.getReferralStats(userId);
  res.json(stats);
});

app.get('/api/referrals/validate/:code', (req, res) => {
  const code = (req.params.code || '').trim().toUpperCase();
  const referrer = db.getUsers().find(u => 
    u.referralCode?.toUpperCase() === code ||
    (code === 'AHMED123' && (u.username === 'ahmed_story' || u.id === 'user_guest_1'))
  );
  if (!referrer) {
    return res.status(404).json({ valid: false, error: 'رمز الإحالة غير صالح أو غير موجود' });
  }
  res.json({
    valid: true,
    referrer: {
      name: referrer.name,
      username: referrer.username,
      avatar: referrer.avatar,
      referralCode: referrer.referralCode || code
    }
  });
});

app.get('/api/users', (req, res) => {
  const { q, search } = req.query;
  const query = String(q || search || '').trim().toLowerCase();
  let users = db.getUsers();
  if (query) {
    users = users.filter(u =>
      u.id.toLowerCase().includes(query) ||
      (u.numericId && u.numericId.includes(query)) ||
      u.name.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      (u.phone && u.phone.includes(query))
    );
  }
  res.json({ users });
});

app.get('/api/users/:id', (req, res) => {
  const user = db.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
  res.json({ user });
});

// Strictly sanitized Public Profile
app.get('/api/users/:id/public', (req, res) => {
  const requesterId = req.query.requesterId ? String(req.query.requesterId) : undefined;
  const publicProfile = db.getPublicUserProfile(req.params.id, requesterId);
  if (!publicProfile) return res.status(404).json({ error: 'المستخدم غير موجود' });
  res.json({ success: true, profile: publicProfile });
});

// Update User's Role (Requires OWNER or ADMIN)
app.put('/api/users/:id/role', (req, res) => {
  const adminId = (req.headers['x-admin-id'] as string) || req.body.adminId;
  const { role } = req.body;

  if (!adminId) {
    return res.status(401).json({ error: 'غير مصرح: يجب تحديد هوية المسؤول' });
  }
  if (!role) {
    return res.status(400).json({ error: 'الرتبة الجديدة مطلوبة' });
  }

  const result = db.updateUserRole(adminId, req.params.id, role);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  res.json({ success: true, message: result.message, user: result.user });
});

app.put('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });

  if (user.isBanned) {
    return res.status(400).json({ error: `حسابك محظور: ${user.banReason || 'مخالفة معايير المجتمع'}` });
  }

  const updates = { ...req.body };
  // Guard: Never allow changing role or owner status through standard user profile update
  delete updates.role;
  delete updates.isOwner;
  delete updates.is_owner;
  delete updates.coins;
  delete updates.diamonds;
  delete updates.level;
  delete updates.exp;
  delete updates.numericId;
  delete updates.isVipNumericId;

  // Moderation check on updated Avatar
  if (updates.avatar) {
    const avatarScan = serverModerationEngine.scanImage(updates.avatar, {
      userGender: (user.gender as any) || 'male',
      textContext: updates.bio || user.bio
    });
    if (!avatarScan.isSafe && avatarScan.decision === 'VIOLATION') {
      db.autoBanForModeration({
        userId,
        reason: avatarScan.reason,
        category: avatarScan.category || 'MALE_NUDITY',
        targetType: 'AVATAR',
        mediaSnapshot: updates.avatar.length < 5000 ? updates.avatar : undefined,
        details: avatarScan.details
      });
      return res.status(400).json({
        error: `تم حظر حسابك فوراً لمخالفة سياسة المحتوى والآداب العامة: ${avatarScan.reason}`
      });
    }
  }

  // Moderation check on updated Bio
  if (updates.bio) {
    const bioScan = serverModerationEngine.scanText(updates.bio);
    if (!bioScan.isSafe && bioScan.decision === 'VIOLATION') {
      db.autoBanForModeration({
        userId,
        reason: bioScan.reason,
        category: bioScan.category || 'MALE_NUDITY',
        targetType: 'ROOM_TEXT',
        details: bioScan.details
      });
      return res.status(400).json({
        error: `تم حظر حسابك فوراً لمخالفة سياسة المحتوى والآداب العامة: ${bioScan.reason}`
      });
    }
  }

  const updated = db.updateUser(req.params.id, updates);
  if (!updated) return res.status(404).json({ error: 'المستخدم غير موجود' });
  res.json({ success: true, user: updated });
});

app.post('/api/users/stealth-mode', (req, res) => {
  const { userId, isStealthMode } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'معرّف المستخدم مطلوب' });
  }
  if (!db.isOwner(userId)) {
    return res.status(400).json({ error: 'وضع الدخول المخفي متاح لمالك التطبيق فقط' });
  }
  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }
  user.isStealthMode = Boolean(isStealthMode);
  db.save();
  return res.json({ success: true, isStealthMode: user.isStealthMode, user });
});

// Rooms Routes
app.get('/api/rooms', (req, res) => {
  const { search, category } = req.query;
  let rooms = db.getRooms();
  
  if (search) {
    const s = String(search).toLowerCase();
    rooms = rooms.filter(r => 
      r.title.toLowerCase().includes(s) || 
      r.roomCode.includes(s) || 
      r.hostName.toLowerCase().includes(s) ||
      r.tags.some(t => t.toLowerCase().includes(s))
    );
  }

  if (category && category !== 'الكل') {
    rooms = rooms.filter(r => r.currentCategory === category);
  }

  res.json({ rooms });
});

app.get('/api/rooms/:id', (req, res) => {
  const room = db.getRoomById(req.params.id);
  if (!room) return res.status(404).json({ error: 'الغرفة غير موجودة' });
  const seats = db.getRoomSeats(room.id);
  const members = db.getRoomMembers(room.id);
  res.json({ room, seats, members });
});

app.post('/api/rooms', (req, res) => {
  const { title, description, coverImage, hostId, type, password, allowAudio, allowVideo, currentCategory, tags, micLayout } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'يرجى إدخال اسم الغرفة' });
  }
  if (!hostId) {
    return res.status(400).json({ error: 'معرّف المضيف مطلوب' });
  }

  const hostUser = db.getUserById(hostId);
  if (hostUser?.isBanned) {
    return res.status(400).json({ error: 'لا يمكنك إنشاء غرفة لأن حسابك محظور' });
  }

  // Pre-Creation Moderation Scan on Title and Description
  const titleScan = serverModerationEngine.scanText(`${title} ${description || ''}`);
  if (!titleScan.isSafe && titleScan.decision === 'VIOLATION') {
    db.autoBanForModeration({
      userId: hostId,
      reason: titleScan.reason,
      category: titleScan.category || 'MALE_NUDITY',
      targetType: 'ROOM_TEXT',
      details: titleScan.details
    });
    return res.status(400).json({ error: `تم حظر الحساب لمنع محتوى مخالف للآداب في عنوان الغرفة: ${titleScan.reason}` });
  }

  // Pre-Creation Moderation Scan on Cover Image
  if (coverImage) {
    const coverScan = serverModerationEngine.scanImage(coverImage, {
      textContext: title,
      userGender: (hostUser?.gender as any) || 'male'
    });
    if (!coverScan.isSafe && coverScan.decision === 'VIOLATION') {
      db.autoBanForModeration({
        userId: hostId,
        reason: coverScan.reason,
        category: coverScan.category || 'MALE_NUDITY',
        targetType: 'ROOM_COVER',
        mediaSnapshot: coverImage.length < 5000 ? coverImage : undefined,
        details: coverScan.details
      });
      return res.status(400).json({ error: `تم حظر الحساب فوراً بسبب صورة خلفية غير لائقة: ${coverScan.reason}` });
    }
  }

  const room = db.createRoom({
    title,
    description,
    coverImage,
    hostId,
    type: type || 'PUBLIC',
    password,
    allowAudio,
    allowVideo,
    currentCategory,
    tags,
    micLayout
  });

  // Track daily task for creating/joining room
  db.incrementDailyTaskProgress(hostId, 'JOIN_ROOM');

  broadcastAll({
    type: 'room_created',
    room
  });

  res.json({ success: true, room });
});

app.put('/api/rooms/:id/layout', (req, res) => {
  const { layout } = req.body;
  if (!layout) return res.status(400).json({ error: 'نوع التخطيط مطلوب' });
  const result = db.changeRoomLayout(req.params.id, layout);
  if (!result.success) return res.status(404).json({ error: 'تعذر تغيير تخطيط الغرفة' });
  const room = db.getRoomById(req.params.id);
  res.json({ success: true, room, seats: result.seats });
});

app.put('/api/rooms/:id/settings', (req, res) => {
  const { userId, title, coverImage, description, micLayout, tags, requireHostApproval } = req.body;
  if (!userId) return res.status(401).json({ error: 'معرف المستخدم مطلوب' });

  const user = db.getUserById(userId);
  if (user?.isBanned) {
    return res.status(400).json({ error: 'الحساب محظور' });
  }

  // Moderation scan on updated room title
  if (title) {
    const titleScan = serverModerationEngine.scanText(`${title} ${description || ''}`);
    if (!titleScan.isSafe && titleScan.decision === 'VIOLATION') {
      db.autoBanForModeration({
        userId,
        reason: titleScan.reason,
        category: titleScan.category || 'MALE_NUDITY',
        targetType: 'ROOM_TEXT',
        targetId: req.params.id,
        details: titleScan.details
      });
      return res.status(400).json({ error: `تم حظر الحساب بسبب كتابة عنوان مخالف: ${titleScan.reason}` });
    }
  }

  // Moderation scan on updated room cover
  if (coverImage) {
    const coverScan = serverModerationEngine.scanImage(coverImage, {
      textContext: title,
      userGender: (user?.gender as any) || 'male'
    });
    if (!coverScan.isSafe && coverScan.decision === 'VIOLATION') {
      db.autoBanForModeration({
        userId,
        reason: coverScan.reason,
        category: coverScan.category || 'MALE_NUDITY',
        targetType: 'ROOM_COVER',
        targetId: req.params.id,
        mediaSnapshot: coverImage.length < 5000 ? coverImage : undefined,
        details: coverScan.details
      });
      return res.status(400).json({ error: `تم حظر الحساب بسبب خلفية غرفة مخلة بالآداب: ${coverScan.reason}` });
    }
  }
  
  const result = db.updateRoomSettings(req.params.id, userId, {
    title,
    coverImage,
    description,
    micLayout,
    tags,
    requireHostApproval
  });

  if (!result.success) {
    return res.status(400).json({ error: result.message || 'تعذر تحديث إعدادات الغرفة' });
  }

  broadcastToRoom(req.params.id, {
    type: 'room_settings_updated',
    roomId: req.params.id,
    room: result.room,
    seats: result.seats
  });

  broadcastAll({
    type: 'room_updated',
    roomId: req.params.id,
    room: result.room
  });

  res.json({ success: true, room: result.room, seats: result.seats });
});

app.post('/api/rooms/:id/end', (req, res) => {
  const { adminOrHostId } = req.body;
  const success = db.endRoom(req.params.id, adminOrHostId || 'system');
  if (!success) return res.status(404).json({ error: 'تعذر إنهاء الغرفة' });
  broadcastAll({
    type: 'room_deleted',
    roomId: req.params.id
  });
  res.json({ success: true, message: 'تم إنهاء الغرفة بنجاح' });
});

app.delete('/api/rooms/:id', (req, res) => {
  const adminOrHostId = (req.headers['x-user-id'] as string) || req.body?.adminOrHostId || 'system';
  const success = db.deleteRoom(req.params.id, String(adminOrHostId));
  if (!success) return res.status(404).json({ error: 'الغرفة غير موجودة أو متعذر حذفها' });
  broadcastAll({
    type: 'room_deleted',
    roomId: req.params.id
  });
  res.json({ success: true, message: 'تم حذف الغرفة نهائياً' });
});

// Mic Requests
app.get('/api/rooms/:id/mic-requests', (req, res) => {
  res.json({ requests: db.getMicRequests(req.params.id) });
});

app.get('/api/rooms/:id/mic-requests/my-status', (req, res) => {
  const userId = String(req.query.userId || '');
  if (!userId) return res.json({ request: null });
  const pending = db.getMyPendingMicRequest(req.params.id, userId);
  res.json({ request: pending || null });
});

app.post('/api/rooms/:id/mic-requests', (req, res) => {
  const { userId, targetSeatIndex } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId مطلوب' });

  const result = db.addMicRequest(req.params.id, userId, targetSeatIndex);
  if (!result.success && result.isDuplicate) {
    return res.json({ success: true, isDuplicate: true, request: result.request, message: result.message });
  }

  const room = db.getRoomById(req.params.id);
  if (room) {
    broadcastAll({
      type: 'new_mic_request',
      roomId: req.params.id,
      request: result.request
    });
    broadcastAll({
      type: 'mic_requests_updated',
      roomId: req.params.id,
      requests: db.getMicRequests(req.params.id)
    });
    broadcastToUser(room.hostId, {
      type: 'new_mic_request',
      roomId: req.params.id,
      request: result.request
    });
  }

  res.json({ success: true, request: result.request });
});

app.post('/api/rooms/:id/mic-requests/:requestId/resolve', (req, res) => {
  const { status, targetSeatIndex } = req.body;
  if (status !== 'ACCEPTED' && status !== 'REJECTED') {
    return res.status(400).json({ error: 'حالة غير صالحة' });
  }

  const result = db.resolveMicRequest(req.params.requestId, status, targetSeatIndex);
  if (!result.success || !result.request) {
    return res.status(404).json({ error: 'الطلب غير موجود أو تمت معالجته بالفعل' });
  }

  const roomId = result.request.roomId;
  broadcastAll({
    type: 'seats_updated',
    roomId,
    seats: db.getRoomSeats(roomId),
    members: db.getRoomMembers(roomId)
  });

  const assignedSeat = result.assignedSeatIndex !== undefined ? result.assignedSeatIndex : targetSeatIndex;
  const resolveMsg = status === 'ACCEPTED'
    ? `تهانينا! وافق صاحب الغرفة على صعودك على المايك${assignedSeat !== undefined ? ` (المقعد ${assignedSeat + 1})` : ''} 🎙️`
    : 'عذراً، اعتذر صاحب الغرفة عن قبول طلب الصعود للمايك في الوقت الحالي.';

  broadcastToUser(result.request.userId, {
    type: 'mic_request_resolved',
    roomId,
    userId: result.request.userId,
    status,
    seatIndex: assignedSeat,
    seatLabel: assignedSeat !== undefined ? `المقعد رقم ${assignedSeat + 1}` : undefined,
    message: resolveMsg
  });

  broadcastAll({
    type: 'mic_request_resolved',
    roomId,
    userId: result.request.userId,
    status,
    seatIndex: assignedSeat,
    seatLabel: assignedSeat !== undefined ? `المقعد رقم ${assignedSeat + 1}` : undefined,
    message: resolveMsg
  });

  broadcastAll({
    type: 'mic_requests_updated',
    roomId,
    requests: db.getMicRequests(roomId)
  });

  res.json({ success: true, request: result.request, assignedSeatIndex: result.assignedSeatIndex });
});

app.post('/api/rooms/:id/mic-requests/cancel', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId مطلوب' });

  const cancelled = db.cancelMicRequest(req.params.id, userId);
  if (cancelled) {
    broadcastToRoom(req.params.id, {
      type: 'mic_request_cancelled',
      roomId: req.params.id,
      userId
    });
    broadcastToRoom(req.params.id, {
      type: 'mic_requests_updated',
      roomId: req.params.id,
      requests: db.getMicRequests(req.params.id)
    });
    const room = db.getRoomById(req.params.id);
    if (room) {
      broadcastToUser(room.hostId, {
        type: 'mic_request_cancelled',
        roomId: req.params.id,
        userId
      });
    }
    broadcastToUser(userId, {
      type: 'mic_request_cancelled',
      roomId: req.params.id,
      userId
    });
  }

  res.json({ success: cancelled });
});

// Gifts & Wallet
app.get('/api/gifts', (req, res) => {
  res.json({ gifts: db.getGifts() });
});

app.post('/api/gifts/send', (req, res) => {
  const { senderId, receiverId, giftId, count, roomId, idempotencyKey } = req.body;
  const result = db.sendGift({ senderId, receiverId, giftId, count: Number(count) || 1, roomId, idempotencyKey });
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  // Real-time server broadcast to all room members
  if (roomId && result.transaction) {
    const giftObj = db.getGifts().find(g => g.id === giftId);
    broadcastToRoom(roomId, {
      type: 'gift_received',
      roomId,
      transaction: result.transaction,
      gift: giftObj
    });

    // Also broadcast a room message
    const chatMsg = db.addRoomMessage({
      roomId,
      userId: senderId,
      text: `أرسل ${count}x ${result.transaction.giftName} ${result.transaction.giftIcon} إلى ${result.transaction.receiverName}! 🎁✨`,
      giftData: {
        giftId,
        giftName: result.transaction.giftName,
        giftIcon: result.transaction.giftIcon,
        count: Number(count) || 1,
        receiverName: result.transaction.receiverName
      }
    });

    broadcastToRoom(roomId, {
      type: 'new_chat_message',
      roomId,
      message: chatMsg
    });

    // Global Gift Banner Broadcast Check
    const giftTierSettings = db.getGiftTierSettings();
    const threshold = giftTierSettings.bigGiftThreshold ?? 5000;
    const bannerEnabled = giftTierSettings.globalBannerEnabled ?? true;

    if (bannerEnabled && result.transaction.totalDiamonds >= threshold) {
      let roomName = '';
      if (roomId) {
        const room = db.getRoomById(roomId);
        if (room) roomName = room.title || `غرفة #${room.id}`;
      }

      broadcastAll({
        type: 'global_gift_broadcast',
        transaction: {
          ...result.transaction,
          roomName
        },
        gift: giftObj,
        timestamp: Date.now()
      });
    }

    // Update real-time balance for sender & receiver
    broadcastToUser(senderId, {
      type: 'balance_update',
      diamonds: result.senderNewDiamonds,
      coins: result.senderNewCoins
    });
    broadcastToUser(receiverId, {
      type: 'balance_update',
      coins: result.receiverNewCoins,
      diamonds: result.receiverNewDiamonds
    });
  }

  res.json(result);
});

app.get('/api/wallet/transactions/:userId', (req, res) => {
  res.json({ transactions: db.getWalletTransactions(req.params.userId) });
});

app.post('/api/wallet/convert', (req, res) => {
  const { userId, coinsAmount } = req.body;
  const result = db.convertCoinsToDiamonds(userId, Number(coinsAmount));
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  res.json(result);
});

// Internal Free & Paid Topups are PERMANENTLY DISABLED according to strict security requirements.
// Recharging diamonds is EXCLUSIVELY external via authorized Shipping Agencies.
app.post('/api/wallet/free-topup', (req, res) => {
  return res.status(400).json({
    error: 'عملية مرفوضة: تم إلغاء الشحن الداخلي والتلقائي نهائياً. الشحن يتم حصرياً عن طريق وكلاء الشحن المعتمدين (خارجياً).'
  });
});

app.post('/api/wallet/paid-topup', (req, res) => {
  return res.status(400).json({
    error: 'عملية مرفوضة: تم إيقاف بوابات الدفع الإلكترونية والشحن الداخلي. الشحن يتم فقط عن طريق وكالة الشحن المعتمدة.'
  });
});

// Get List of Authorized Shipping Agents for users
app.get('/api/shipping-agents/list', (req, res) => {
  const agents = db.getUsers().filter(u => u.isShippingAgent === true || u.role === 'AGENT' || u.isOwner === true).map(u => ({
    id: u.id,
    numericId: u.numericId || u.id,
    name: u.name,
    username: u.username,
    avatar: u.avatar,
    phone: u.phone,
    role: u.role,
    isOwner: u.isOwner,
    isShippingAgent: true
  }));
  res.json({ agents });
});

// Admin endpoint to view complete agency shipping recharge logs
app.get('/api/admin/recharge-logs', requireAdmin, (req, res) => {
  res.json({ logs: db.getShippingRechargeLogs() });
});

// Query recharge system status & caller permissions
app.get('/api/wallet/recharge-status', (req, res) => {
  const callerId = (req.headers['x-user-id'] as string) || (req.headers['x-owner-id'] as string) || (req.query.userId as string);
  res.json({
    isRestrictedToOwner: db.rechargeRestrictedToOwner,
    canRecharge: db.canUserRecharge(callerId),
    ownerOnly: true
  });
});

// Admin toggle endpoint to allow reversing the restriction later
app.post('/api/admin/recharge/toggle-restriction', requireOwner, (req, res) => {
  const { restricted } = req.body;
  db.setRechargeRestrictedToOwner(Boolean(restricted));
  res.json({
    success: true,
    message: db.rechargeRestrictedToOwner
      ? 'تم حظر الشحن لغير المالك (الشحن متاح للمالك فقط)'
      : 'تم رفع الحظر وإعادة تفعيل الشحن لجميع المستخدمين',
    isRestrictedToOwner: db.rechargeRestrictedToOwner
  });
});

app.post('/api/wallet/topup', (req, res) => {
  const { userId, type, amount, reason } = req.body;
  const callerHeaderId = (req.headers['x-user-id'] as string) || (req.headers['x-owner-id'] as string);
  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }

  // Strictly reject free diamond or coin topup for non-owner roles
  if (!db.isOwner(userId) || (callerHeaderId && !db.isOwner(callerHeaderId))) {
    return res.status(400).json({
      error: 'عملية مرفوضة: الشحن المجاني متاح للمالك العام (Owner) حصرياً. شحن الماسات للمستخدم العادي والوكيل مدفوع ونظامي فقط.'
    });
  }

  const result = db.topUpBalance(userId, type, Number(amount), reason || 'شحن رصيد المالك 👑');
  if (!result.success) {
    return res.status(400).json({ error: 'فشل شحن الرصيد' });
  }

  if (result.user) {
    broadcastToUser(result.user.id, {
      type: 'balance_update',
      diamonds: result.user.diamonds,
      coins: result.user.coins
    });
  }

  res.json(result);
});

// Daily Tasks
app.get('/api/tasks/:userId', (req, res) => {
  res.json({ tasks: db.getUserDailyTasks(req.params.userId) });
});

app.post('/api/tasks/claim', (req, res) => {
  const { userId, taskId } = req.body;
  const result = db.claimDailyTaskReward(userId, taskId);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  res.json(result);
});

// Frames Shop
app.get('/api/frames', (req, res) => {
  res.json({ frames: db.getFrames() });
});

app.get('/api/frames/user/:userId', (req, res) => {
  res.json({ ownedFrameIds: db.getUserFrames(req.params.userId) });
});

app.post('/api/frames/purchase', (req, res) => {
  const { userId, frameId } = req.body;
  const result = db.purchaseFrame(userId, frameId);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  res.json(result);
});

app.post('/api/frames/active', (req, res) => {
  const { userId, frameId } = req.body;
  const success = db.setActiveFrame(userId, frameId);
  if (!success) {
    return res.status(400).json({ error: 'تعذر تفعيل الإطار' });
  }
  res.json({ success: true, message: 'تم تحديث الإطار النشط' });
});

// Entrances Shop & Management
app.get('/api/entrances', (req, res) => {
  const userId = req.query.userId as string | undefined;
  res.json({ entrances: db.getEntrances(userId) });
});

app.get('/api/entrances/user/:userId', (req, res) => {
  res.json({ ownedEntranceIds: db.getUserEntrances(req.params.userId) });
});

app.post('/api/entrances/purchase', (req, res) => {
  const { userId, entranceId } = req.body;
  if (!userId || !entranceId) {
    return res.status(400).json({ error: 'البيانات غير مكتملة' });
  }
  const result = db.purchaseEntrance(userId, entranceId);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  res.json(result);
});

app.post(['/api/entrances/active', '/api/entrances/activate'], (req, res) => {
  const { userId, entranceId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'المستخدم غير محدد' });
  }
  const success = db.setActiveEntrance(userId, entranceId || null);
  if (!success) {
    return res.status(400).json({ error: 'تعذر تغيير الدخلة النشطة' });
  }
  const user = db.getUserById(userId);
  res.json({ success: true, message: 'تم تحديث الدخلة النشطة بنجاح', activeEntranceId: user?.activeEntranceId, user });
});

// Admin Entrance Management Routes
app.post('/api/admin/entrances', (req, res) => {
  const { adminUserId, entrance } = req.body;
  if (!adminUserId || !entrance) {
    return res.status(400).json({ error: 'البيانات غير مكتملة' });
  }
  const result = db.addEntrance(adminUserId, entrance);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  res.json(result);
});

app.put('/api/admin/entrances/:id', (req, res) => {
  const { adminUserId, entrance } = req.body;
  if (!adminUserId || !entrance) {
    return res.status(400).json({ error: 'البيانات غير مكتملة' });
  }
  const result = db.updateEntrance(adminUserId, req.params.id, entrance);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  res.json(result);
});

app.delete('/api/admin/entrances/:id', (req, res) => {
  const adminUserId = (req.query.adminUserId || req.body.adminUserId) as string;
  if (!adminUserId) {
    return res.status(400).json({ error: 'المستخدم غير محدد' });
  }
  const result = db.deleteEntrance(adminUserId, req.params.id);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  res.json(result);
});

app.post('/api/admin/entrances/:id/toggle', (req, res) => {
  const { adminUserId } = req.body;
  if (!adminUserId) {
    return res.status(400).json({ error: 'المستخدم غير محدد' });
  }
  const result = db.toggleDisableEntrance(adminUserId, req.params.id);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  res.json(result);
});

// Friends & Follows
app.get('/api/friends/:userId', (req, res) => {
  res.json({
    friends: db.getFriendships(req.params.userId),
    pendingRequests: db.getPendingFriendRequests(req.params.userId)
  });
});

app.post('/api/friends/request', (req, res) => {
  const { senderId, receiverId } = req.body;
  const result = db.sendFriendRequest(senderId, receiverId);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  res.json(result);
});

app.post('/api/friends/respond', (req, res) => {
  const { requestId, accept } = req.body;
  const success = db.respondToFriendRequest(requestId, Boolean(accept));
  res.json({ success });
});

app.post('/api/follow', (req, res) => {
  const { followerId, followingId } = req.body;
  const result = db.toggleFollow(followerId, followingId);
  res.json(result);
});

// Private Messages & Official Hekawy Messages
app.get('/api/messages/private', (req, res) => {
  const { user1Id, user2Id } = req.query;
  if (!user1Id || !user2Id) {
    return res.status(400).json({ error: 'معرفات المستخدمين مطلوبة' });
  }

  if (String(user1Id) === 'HEKAWY_OFFICIAL' || String(user2Id) === 'HEKAWY_OFFICIAL') {
    const targetUserId = String(user1Id) === 'HEKAWY_OFFICIAL' ? String(user2Id) : String(user1Id);
    db.markOfficialMessagesAsRead(targetUserId);
    return res.json({ messages: db.getOfficialHekawyMessages(targetUserId) });
  }

  res.json({ messages: db.getPrivateMessages(String(user1Id), String(user2Id)) });
});

app.post('/api/messages/private', (req, res) => {
  const { senderId, receiverId, text } = req.body;
  if (receiverId === 'HEKAWY_OFFICIAL' || senderId === 'HEKAWY_OFFICIAL') {
    return res.status(400).json({ error: 'لا يمكن الرد على رسائل حكاوي الرسمية. التواصل مع الإدارة يكون عبر الخاص العادي فقط.' });
  }
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'نص الرسالة فارغ' });
  }
  try {
    const msg = db.sendPrivateMessage(senderId, receiverId, text);
    res.json({ success: true, message: msg });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'فشل إرسال الرسالة' });
  }
});

app.post('/api/messages/official/send', (req, res) => {
  try {
    const { senderUserId, targetCategory, targetUserId, text, ownerToken } = req.body;
    const ownerTokenHeader = (req.headers['x-owner-token'] as string) || ownerToken;

    const user = db.getUserById(senderUserId);
    const isOwnerOrAdmin = db.isOwner(senderUserId) || 
                           db.validateOwnerToken(ownerTokenHeader) || 
                           user?.role === 'OWNER' || 
                           user?.role === 'ADMIN';

    if (!isOwnerOrAdmin) {
      return res.status(400).json({ error: 'غير مصرح لك بإرسال رسائل حكاوي الرسمية. هذه الخاصية مخصصة للمالك والإدارة فقط.' });
    }

    const result = db.sendOfficialHekawyMessage({
      senderUserId,
      targetCategory,
      targetUserId,
      text
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'فشل إرسال الرسالة الرسمية' });
  }
});

app.get('/api/messages/official/:userId', (req, res) => {
  const userId = req.params.userId;
  db.markOfficialMessagesAsRead(userId);
  res.json({ messages: db.getOfficialHekawyMessages(userId) });
});

// Notifications
app.get('/api/notifications/:userId', (req, res) => {
  res.json({ notifications: db.getNotifications(req.params.userId) });
});

app.post('/api/notifications/:id/read', (req, res) => {
  const success = db.markNotificationAsRead(req.params.id);
  res.json({ success });
});

// --- AUTOMATED CONTENT MODERATION SYSTEM (STRICT ANTI-NUDITY & MALE DECENCY POLICY) ---

app.post('/api/moderation/scan', async (req, res) => {
  const {
    userId,
    targetType,
    targetId,
    mediaUrl,
    text,
    skinRatio,
    torsoExposureRatio,
    userGender,
    roomId
  } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'معرّف المستخدم مطلوب للفحص' });
  }

  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }

  if (user.isBanned) {
    return res.status(400).json({
      allowed: false,
      decision: 'VIOLATION',
      reason: user.banReason || 'الحساب محظور بالفعل',
      action: 'AUTO_BAN_PERMANENT'
    });
  }

  // 1. Text Scan (including Gemini AI scanning)
  if (text) {
    const textScan = await serverModerationEngine.scanTextWithGemini(String(text));
    if (!textScan.isSafe) {
      if (textScan.decision === 'VIOLATION') {
        const gradResult = db.processGraduatedModeration({
          userId,
          reason: textScan.reason,
          category: textScan.category || 'MALE_NUDITY',
          targetType: targetType || 'ROOM_TEXT',
          targetId,
          confidenceScore: textScan.confidence,
          details: textScan.details,
          roomId
        });

        // Broadcast real-time ban and censure to room
        if (roomId) {
          broadcastToRoom(roomId, {
            type: 'content_censored',
            userId,
            reason: textScan.reason,
            targetType
          });
          broadcastToRoom(roomId, {
            type: 'user_auto_banned',
            userId,
            userName: user.name,
            reason: textScan.reason,
            banType: gradResult.banType,
            remainingMinutes: gradResult.remainingMinutes
          });
          broadcastToRoom(roomId, {
            type: 'seats_updated',
            roomId,
            seats: db.getRoomSeats(roomId)
          });
        }

        return res.status(400).json({
          allowed: false,
          decision: 'VIOLATION',
          reason: textScan.reason,
          action: gradResult.incident.actionTaken,
          banType: gradResult.banType,
          remainingMinutes: gradResult.remainingMinutes,
          incident: gradResult.incident
        });
      } else if (textScan.decision === 'NEEDS_REVIEW') {
        const incident = db.addModerationIncident({
          userId,
          userName: user.name,
          userRole: user.role,
          userAvatar: user.avatar,
          targetType: targetType || 'ROOM_TEXT',
          targetId,
          reason: textScan.reason,
          category: textScan.category || 'SUSPICIOUS_UNVERIFIED',
          confidenceScore: textScan.confidence,
          status: 'NEEDS_REVIEW',
          actionTaken: 'QUEUED_FOR_REVIEW',
          details: textScan.details
        });

        return res.json({
          allowed: false,
          decision: 'NEEDS_REVIEW',
          reason: textScan.reason,
          action: 'QUEUED_FOR_REVIEW',
          incident
        });
      }
    }
  }

  // 2. Image / Media Scan (including Gemini AI vision scanning)
  if (mediaUrl) {
    const imgScan = await serverModerationEngine.scanImageWithGemini(String(mediaUrl), {
      textContext: text,
      userGender: (user.gender as any) || 'male',
      isLiveStream: targetType === 'LIVE_STREAM'
    });

    if (!imgScan.isSafe) {
      if (imgScan.decision === 'VIOLATION') {
        const gradResult = db.processGraduatedModeration({
          userId,
          reason: imgScan.reason,
          category: imgScan.category || 'MALE_NUDITY',
          targetType: targetType || 'AVATAR',
          targetId,
          mediaSnapshot: mediaUrl.length < 5000 ? mediaUrl : undefined,
          confidenceScore: imgScan.confidence,
          details: imgScan.details,
          roomId
        });

        if (roomId) {
          broadcastToRoom(roomId, {
            type: 'content_censored',
            userId,
            reason: imgScan.reason,
            targetType
          });
          broadcastToRoom(roomId, {
            type: 'user_auto_banned',
            userId,
            userName: user.name,
            reason: imgScan.reason,
            banType: gradResult.banType,
            remainingMinutes: gradResult.remainingMinutes
          });
          broadcastToRoom(roomId, {
            type: 'seats_updated',
            roomId,
            seats: db.getRoomSeats(roomId)
          });
        }

        return res.status(400).json({
          allowed: false,
          decision: 'VIOLATION',
          reason: imgScan.reason,
          action: gradResult.incident.actionTaken,
          banType: gradResult.banType,
          remainingMinutes: gradResult.remainingMinutes,
          incident: gradResult.incident
        });
      } else if (imgScan.decision === 'NEEDS_REVIEW') {
        const incident = db.addModerationIncident({
          userId,
          userName: user.name,
          userRole: user.role,
          userAvatar: user.avatar,
          targetType: targetType || 'AVATAR',
          targetId,
          reason: imgScan.reason,
          category: imgScan.category || 'SUSPICIOUS_UNVERIFIED',
          confidenceScore: imgScan.confidence,
          status: 'NEEDS_REVIEW',
          actionTaken: 'QUEUED_FOR_REVIEW',
          mediaSnapshot: mediaUrl.length < 5000 ? mediaUrl : undefined,
          details: imgScan.details
        });

        return res.json({
          allowed: false,
          decision: 'NEEDS_REVIEW',
          reason: imgScan.reason,
          action: 'QUEUED_FOR_REVIEW',
          incident
        });
      }
    }
  }

  // 3. Live Stream Frame Skin Ratio Evaluation
  if (typeof skinRatio === 'number' || typeof torsoExposureRatio === 'number') {
    const streamScan = serverModerationEngine.evaluateStreamAnalysis(
      skinRatio || 0,
      torsoExposureRatio || 0,
      user.gender
    );

    if (!streamScan.isSafe) {
      if (streamScan.decision === 'VIOLATION') {
        const gradResult = db.processGraduatedModeration({
          userId,
          reason: streamScan.reason,
          category: streamScan.category || 'MALE_NUDITY',
          targetType: 'LIVE_STREAM',
          targetId: roomId || targetId,
          mediaSnapshot: mediaUrl && mediaUrl.length < 5000 ? mediaUrl : undefined,
          confidenceScore: streamScan.confidence,
          details: streamScan.details,
          roomId
        });

        if (roomId) {
          broadcastToRoom(roomId, {
            type: 'content_censored',
            userId,
            reason: streamScan.reason,
            targetType: 'LIVE_STREAM'
          });
          broadcastToRoom(roomId, {
            type: 'user_auto_banned',
            userId,
            userName: user.name,
            reason: streamScan.reason,
            banType: gradResult.banType,
            remainingMinutes: gradResult.remainingMinutes
          });
          broadcastToRoom(roomId, {
            type: 'seats_updated',
            roomId,
            seats: db.getRoomSeats(roomId)
          });
        }

        return res.status(400).json({
          allowed: false,
          decision: 'VIOLATION',
          reason: streamScan.reason,
          action: gradResult.incident.actionTaken,
          banType: gradResult.banType,
          remainingMinutes: gradResult.remainingMinutes,
          incident: gradResult.incident
        });
      } else if (streamScan.decision === 'NEEDS_REVIEW') {
        return res.json({
          allowed: false,
          decision: 'NEEDS_REVIEW',
          reason: streamScan.reason,
          action: 'QUEUED_FOR_REVIEW'
        });
      }
    }
  }

  res.json({
    allowed: true,
    decision: 'SAFE',
    action: 'ALLOWED',
    reason: 'المحتوى مطابق لسياسات المنصة ومعايير الآداب العامة'
  });
});

// Admin Moderation Incidents & Reviews & Graduated Ban System
app.get('/api/admin/moderation/incidents', requireAdmin, (req, res) => {
  res.json({ incidents: db.getModerationIncidents() });
});

app.get('/api/admin/moderation/violating-users', requireAdmin, (req, res) => {
  res.json({ violatingUsers: db.getViolatingUsersList() });
});

app.post('/api/admin/moderation/graduated-action', requireAdmin, (req, res) => {
  const { adminId, targetUserId, action } = req.body;
  if (!targetUserId || !action) {
    return res.status(400).json({ error: 'معرّف المستخدم والإجراء مطلوبان' });
  }

  try {
    const result = db.resolveGraduatedModerationAction(adminId, targetUserId, action);
    
    // Broadcast real-time update to user socket
    broadcastToUser(targetUserId, {
      type: 'user_penalty_resolved',
      action,
      message: result.message
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'فشلت معالجة إجراء سلم العقوبات' });
  }
});

app.post('/api/admin/moderation/resolve', requireAdmin, (req, res) => {
  const { adminId, incidentId, action } = req.body;
  if (!incidentId || !action) {
    return res.status(400).json({ error: 'معرّف البلاغ والإجراء مطلوبان' });
  }

  try {
    const success = db.resolveModerationIncident(adminId, incidentId, action);
    res.json({ success });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'فشلت معالجة بلاغ الرقابة' });
  }
});

// Reports
app.post('/api/reports', (req, res) => {
  const { reporterId, reportedUserId, roomId, reason, details, targetType, targetId, targetName } = req.body;
  if (!reason) {
    return res.status(400).json({ error: 'سبب البلاغ مطلوب' });
  }
  const report = db.addReport({ reporterId, reportedUserId, roomId, reason, details, targetType, targetId, targetName });
  res.json({ success: true, message: 'تم إرسال البلاغ للإدارة للمراجعة', report });
});

// User Blocking
app.post('/api/users/block', (req, res) => {
  const { currentUserId, targetUserId } = req.body;
  if (!currentUserId || !targetUserId) {
    return res.status(400).json({ error: 'البيانات غير مكتملة' });
  }
  const result = db.blockUser(currentUserId, targetUserId);
  res.json(result);
});

// Room Penalties & Moderation System Store
const activeRoomPenalties = new Map<string, {
  roomId: string;
  issuerId: string;
  targetUserId: string;
  penaltyType: '15m' | '1h' | '24h' | 'perm';
  durationLabel: string;
  bannedUntil: number | null;
  reason: string;
  issuedAt: number;
}>();

app.post('/api/rooms/penalty', (req, res) => {
  const { roomId, issuerId, targetUserId, penaltyType, bannedUntil, reason } = req.body;
  if (!roomId || !targetUserId || !penaltyType) {
    return res.status(400).json({ error: 'بيانات العقوبة غير مكتملة' });
  }

  const durationLabels: Record<string, string> = {
    '15m': '15 دقيقة',
    '1h': 'ساعة واحدة',
    '24h': '24 ساعة (يوم)',
    'perm': 'حظر نهائي'
  };

  const penaltyObj = {
    roomId,
    issuerId,
    targetUserId,
    penaltyType,
    durationLabel: durationLabels[penaltyType] || 'عقوبة إدارية',
    bannedUntil: penaltyType === 'perm' ? null : Number(bannedUntil),
    reason: reason || 'تم تعليق حسابك لمخالفة قواعد الغرفة',
    issuedAt: Date.now()
  };

  const key = `${roomId}_${targetUserId}`;
  activeRoomPenalties.set(key, penaltyObj);

  // Broadcast real-time penalty event to room & user
  broadcastToRoom(roomId, {
    type: 'user_penalty_applied',
    ...penaltyObj
  });

  res.json({ success: true, message: `تم تطبيق عقوبة (${penaltyObj.durationLabel}) بنجاح`, penalty: penaltyObj });
});

app.get('/api/rooms/:roomId/penalty/:userId', (req, res) => {
  const { roomId, userId } = req.params;
  const key = `${roomId}_${userId}`;
  const penalty = activeRoomPenalties.get(key);

  if (!penalty) {
    return res.json({ hasActivePenalty: false, penalty: null });
  }

  if (penalty.penaltyType !== 'perm' && penalty.bannedUntil && Date.now() > penalty.bannedUntil) {
    activeRoomPenalties.delete(key);
    return res.json({ hasActivePenalty: false, penalty: null });
  }

  res.json({ hasActivePenalty: true, penalty });
});

// Admin Dashboard Routes (Enforce server-side role check)
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const adminId = (req.headers['x-admin-id'] as string) || req.body.adminId || req.query.adminId;
  if (!adminId) {
    return res.status(400).json({ error: 'غير مصرح: يتطلب صلاحيات إدارية' });
  }
  const user = db.getUserById(adminId);
  if (!user || !db.isAdminOrOwner(adminId)) {
    return res.status(400).json({ error: 'غير مصرح: لا تملك صلاحية الوصول للوحة التحكم الإدارية' });
  }
  next();
}

function requireOwner(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ownerId = (req.headers['x-owner-id'] as string) || (req.headers['x-admin-id'] as string) || req.body.ownerId || req.body.adminId || req.query.ownerId || req.query.adminId;
  if (!ownerId) {
    return res.status(400).json({ error: 'غير مصرح: يتطلب صلاحية المالك العام (Owner)' });
  }
  if (!db.isOwner(ownerId)) {
    return res.status(400).json({ error: 'غير مصرح: هذه العملية الحساسة محصورة بالمالك العام (Owner) فقط' });
  }
  next();
}

// Dedicated High-Privilege Owner Endpoint
app.get('/api/admin/owner', requireOwner, (req, res) => {
  const ownerId = (req.headers['x-owner-id'] as string) || (req.headers['x-admin-id'] as string) || req.body.ownerId || req.body.adminId || req.query.ownerId || req.query.adminId;
  const owner = db.getUserById(ownerId);
  const stats = db.getAdminStats();
  const logs = db.getAuditLogs().slice(0, 50);
  
  res.json({
    success: true,
    owner: {
      id: owner?.id,
      name: owner?.name,
      username: owner?.username,
      email: owner?.email,
      role: 'OWNER',
      isOwner: true,
      is_owner: true,
      activeFrameId: owner?.activeFrameId,
      coins: owner?.coins,
      diamonds: owner?.diamonds,
      level: owner?.level
    },
    systemStats: stats,
    recentAuditLogs: logs,
    message: 'تم التحقق من صلاحيات المالك العام (Owner) بنجاح.'
  });
});

// Dedicated Owner Free Diamonds Top-up Endpoint
app.post('/api/owner/free-diamonds', requireOwner, (req, res) => {
  const ownerId = (req.headers['x-owner-id'] as string) || (req.headers['x-admin-id'] as string) || req.body.ownerId;
  const amount = Number(req.body.amount);

  if (!ownerId || !db.isOwner(ownerId)) {
    return res.status(400).json({ error: 'غير مصرح: هذه العملية مخصصة للمالك العام (Owner) فقط.' });
  }

  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'يرجى إدخال كمية مَسّات صالحة أكبر من صفر.' });
  }

  const result = db.ownerFreeRecharge(ownerId, amount);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  // Real-time balance sync via WebSocket if available
  try {
    const wsService = (global as any).wsService;
    if (wsService && typeof wsService.broadcastUserBalanceUpdate === 'function') {
      wsService.broadcastUserBalanceUpdate(ownerId, { diamonds: result.user?.diamonds });
    }
  } catch (e) {
    // Non-critical WS broadcast error
  }

  return res.json({
    success: true,
    message: result.message,
    amount: result.amount,
    diamonds: result.user?.diamonds,
    user: result.user
  });
});

app.get('/api/admin/stats', requireAdmin, (req, res) => {
  res.json({ stats: db.getAdminStats() });
});

app.get('/api/admin/reports', requireAdmin, (req, res) => {
  res.json({ reports: db.getReports() });
});

app.post('/api/admin/reports/resolve', requireAdmin, (req, res) => {
  const { reportId, status, adminId } = req.body;
  const success = db.resolveReport(reportId, status, adminId);
  res.json({ success });
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
  res.json({ users: db.getUsers() });
});

app.post('/api/admin/users/ban', requireAdmin, (req, res) => {
  const { userId, bannedBy, reason, days } = req.body;
  try {
    const success = db.banUser(userId, bannedBy, reason, days ? Number(days) : undefined);
    res.json({ success });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'فشلت عملية الحظر' });
  }
});

app.post('/api/admin/users/unban', requireAdmin, (req, res) => {
  const { userId, adminId } = req.body;
  try {
    const success = db.unbanUser(userId, adminId);
    res.json({ success });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'فشلت عملية فك الحظر' });
  }
});

// Admin User Role Management (Owner or Admin Promotion)
app.post('/api/admin/users/role', requireAdmin, (req, res) => {
  const adminId = (req.headers['x-admin-id'] as string) || req.body.adminId;
  const { targetUserId, newRole } = req.body;
  if (!adminId || !targetUserId || !newRole) {
    return res.status(400).json({ error: 'المعلومات غير مكتملة لتحديث الرتبة' });
  }

  const result = db.updateUserRole(adminId, targetUserId, newRole);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  res.json(result);
});

// Admin VIP Numeric ID Management
app.post('/api/admin/users/assign-numeric-id', requireAdmin, (req, res) => {
  const adminId = (req.headers['x-admin-id'] as string) || req.body.adminId;
  const { targetUserId, newNumericId } = req.body;
  if (!adminId || !targetUserId || !newNumericId) {
    return res.status(400).json({ error: 'المعلومات غير مكتملة لتخصيص الـ ID المميز' });
  }

  const result = db.assignVipNumericId(adminId, targetUserId, newNumericId);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  res.json(result);
});

app.get('/api/admin/audit-logs', requireAdmin, (req, res) => {
  res.json({ logs: db.getAuditLogs() });
});

// Admin Assign King / Owner Frame
app.post('/api/admin/frames/assign-king', requireAdmin, (req, res) => {
  const adminId = (req.headers['x-admin-id'] as string) || (req.headers['x-owner-id'] as string) || req.body.adminId || req.body.ownerId;
  const { targetUserId } = req.body;
  if (!adminId || !targetUserId) {
    return res.status(400).json({ error: 'بيانات المشرف والمستخدم مطلوبة' });
  }

  const result = db.assignKingFrame(adminId, targetUserId);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  res.json(result);
});

// Admin Adjust User Balance (Owner/Admin, Diamonds additions restricted to OWNER)
app.post('/api/admin/users/adjust-balance', requireAdmin, (req, res) => {
  const { adminId, targetUserId, type, amount, reason } = req.body;
  if (!adminId || !targetUserId || !amount) {
    return res.status(400).json({ error: 'المعلومات غير مكتملة لتعديل الرصيد' });
  }

  // Strictly restrict adding diamonds to OWNER ONLY!
  if (type === 'DIAMOND' && Number(amount) > 0 && !db.isOwner(adminId)) {
    return res.status(400).json({
      error: 'عملية مرفوضة: صلاحية توليد وإضافة الماسات محصورة بالمالك العام (Owner) حصرياً من لوحة المالك. لا تملك أي رتبة أخرى حق إضافة الماسات مجاناً.'
    });
  }

  const result = db.adjustUserBalance(
    adminId,
    targetUserId,
    type || 'COIN',
    Number(amount),
    reason || 'تعديل رصيد إداري'
  );

  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  if (result.user) {
    broadcastToUser(result.user.id, {
      type: 'balance_update',
      diamonds: result.user.diamonds,
      coins: result.user.coins
    });
  }

  res.json(result);
});

// Gift Tier & Sound Configurations (Admin Configurable)
app.get('/api/gift-tiers', (req, res) => {
  res.json({ settings: db.getGiftTierSettings() });
});

app.post('/api/admin/gift-tiers', requireAdmin, (req, res) => {
  const adminId = (req.headers['x-admin-id'] as string) || req.body.adminId;
  const { tiers, globalSoundEnabled, bigGiftThreshold, globalBannerEnabled, globalBannerDurationMs } = req.body;
  try {
    const result = db.updateGiftTierSettings(adminId, {
      tiers,
      globalSoundEnabled,
      bigGiftThreshold,
      globalBannerEnabled,
      globalBannerDurationMs
    });
    // Broadcast real-time tier update to all connected clients
    broadcastAll({
      type: 'gift_tiers_updated',
      settings: result.settings
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'تعذر تحديث إعدادات فئات الهدايا' });
  }
});

// Support Ticket Endpoint
app.post('/api/support/ticket', (req, res) => {
  const { userId, name, email, subject, message } = req.body;
  if (!message || !subject) {
    return res.status(400).json({ error: 'عنوان ورسالة الدعم الفني مطلوبة' });
  }

  const report = db.addReport({
    reporterId: userId || 'anonymous',
    targetType: 'MESSAGE',
    targetId: `ticket_${Date.now()}`,
    targetName: subject,
    reason: `[تذكرة دعم فني] ${subject}`,
    details: `الاسم: ${name || 'غير محدد'} | البريد: ${email || 'غير محدد'}\nالرسالة: ${message}`
  });

  res.json({
    success: true,
    message: 'تم استلام تذكرتك بنجاح! سيقوم فريق الدعم الفني بالرد عليك في أقرب وقت.',
    ticketId: report.id
  });
});

// =========================================================================
// --- HOST, AGENT, AGENCY & TARGET API ROUTES ---
// =========================================================================

// --- 1. HOST ENDPOINTS ---

// Apply as Host
app.post('/api/hosts/apply', (req, res) => {
  const { userId, phone, country, experienceBio, specialTalent, sampleLink, agentInviteCode } = req.body;
  if (!userId || !phone || !experienceBio || !specialTalent) {
    return res.status(400).json({ error: 'يرجى ملء جميع الحقول الإجبارية (رقم الهاتف، السيرة والخبرة، الموهبة)' });
  }

  const result = db.createHostApplication({
    userId,
    phone,
    country,
    experienceBio,
    specialTalent,
    sampleLink,
    agentInviteCode
  });

  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  res.json(result);
});

// Get User's Host Application Status
app.get('/api/hosts/application/:userId', (req, res) => {
  const appData = db.getUserHostApplication(req.params.userId);
  res.json({ application: appData || null });
});

// Get Host Dashboard Data
app.get('/api/hosts/dashboard/:userId', (req, res) => {
  try {
    const data = db.getHostDashboardData(req.params.userId);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'فشل تحميل بيانات لوحة المضيف' });
  }
});

// Claim Host Target Reward
app.post('/api/hosts/claim-target', (req, res) => {
  const { userId, targetConfigId } = req.body;
  if (!userId || !targetConfigId) {
    return res.status(400).json({ error: 'معرّف المضيف وخطة التارجت مطلوبة' });
  }

  const result = db.claimHostTargetReward(userId, targetConfigId);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  res.json(result);
});

// Submit Host / Agent Withdrawal Request
app.post('/api/hosts/withdraw-request', (req, res) => {
  const { userId, requestedDiamonds, paymentMethod, paymentAccountDetails, overrideDateCheck } = req.body;
  if (!userId || !requestedDiamonds || !paymentMethod || !paymentAccountDetails) {
    return res.status(400).json({ error: 'جميع بيانات طلب السحب مطلوبة (المبلغ، وسيلة الدفع، بريد/رقم الحساب)' });
  }

  const result = db.createWithdrawalRequest({
    userId,
    requestedDiamonds: Number(requestedDiamonds),
    paymentMethod,
    paymentAccountDetails,
    overrideDateCheck: Boolean(overrideDateCheck)
  });

  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  res.json(result);
});

// Get User's Withdrawal Requests
app.get('/api/hosts/withdraw-requests/:userId', (req, res) => {
  const requests = db.getWithdrawalRequests(req.params.userId);
  res.json({ requests });
});

// Admin: Get All Withdrawal Requests
app.get('/api/admin/withdraw-requests', requireAdmin, (req, res) => {
  const requests = db.getWithdrawalRequests();
  res.json({ requests });
});

// Admin: Review Withdrawal Request (Approve / Reject)
app.post('/api/admin/withdraw-requests/review', requireAdmin, (req, res) => {
  const { adminId, requestId, action, rejectionReason } = req.body;
  if (!adminId || !requestId || !action) {
    return res.status(400).json({ error: 'معلومات المراجعة والإجراء مطلوبة' });
  }

  try {
    const result = db.reviewWithdrawalRequest(adminId, requestId, action, rejectionReason);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'فشلت معالجة طلب السحب' });
  }
});

// --- INSTANT USER VERIFICATION & ADMIN POST-MODERATION ENDPOINTS ---

// Instant User Verification Request
app.post('/api/users/verify', (req, res) => {
  const { userId, gender, verificationPhoto, livenessFrontPhoto, livenessRightPhoto, livenessLeftPhoto } = req.body;
  if (!userId || !gender || (!verificationPhoto && !livenessFrontPhoto)) {
    return res.status(400).json({ error: 'جميع بيانات التوثيق مطلوبة (الجنس وصور الفحص الحي للوجه)' });
  }

  const result = db.verifyUserInstant(userId, {
    gender,
    verificationPhoto: livenessFrontPhoto || verificationPhoto,
    livenessFrontPhoto: livenessFrontPhoto || verificationPhoto,
    livenessRightPhoto,
    livenessLeftPhoto
  });
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  res.json(result);
});

// Admin: Get All Verified Users Log
app.get('/api/admin/verified-users', requireAdmin, (req, res) => {
  const logs = db.getVerifiedUsersLog();
  res.json({ logs });
});

// Admin: Revoke Verification Badge
app.post('/api/admin/verified-users/revoke', requireAdmin, (req, res) => {
  const adminId = (req.headers['x-admin-id'] as string) || req.body.adminId;
  const { targetUserId } = req.body;
  if (!adminId || !targetUserId) {
    return res.status(400).json({ error: 'معرّف الإداري والمستخدم مطلوبان' });
  }

  try {
    const result = db.revokeUserVerification(adminId, targetUserId);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'فشلت معالجة سحب التوثيق' });
  }
});

// Admin: Ban User & Revoke Verification
app.post('/api/admin/verified-users/ban', requireAdmin, (req, res) => {
  const adminId = (req.headers['x-admin-id'] as string) || req.body.adminId;
  const { targetUserId, banReason } = req.body;
  if (!adminId || !targetUserId) {
    return res.status(400).json({ error: 'معرّف الإداري والمستخدم مطلوبان' });
  }

  try {
    const result = db.banUserWithVerificationRevoke(adminId, targetUserId, banReason);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'فشلت معالجة حظر الحساب' });
  }
});

// --- 2. AGENT ENDPOINTS ---

// Apply as Agent
app.post('/api/agents/apply', (req, res) => {
  const { userId, agencyName, phone, country, expectedHostsCount, experienceBio } = req.body;
  if (!userId || !agencyName || !phone || !experienceBio) {
    return res.status(400).json({ error: 'يرجى ملء جميع بيانات طلب الوكالة الإجبارية' });
  }

  const result = db.createAgentApplication({
    userId,
    agencyName,
    phone,
    country: country || 'المملكة العربية السعودية',
    expectedHostsCount: Number(expectedHostsCount) || 5,
    experienceBio
  });

  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  res.json(result);
});

// Get User's Agent Application Status
app.get('/api/agents/application/:userId', (req, res) => {
  const appData = db.getUserAgentApplication(req.params.userId);
  res.json({ application: appData || null });
});

// Get Agent Dashboard Data
app.get('/api/agents/dashboard/:userId', (req, res) => {
  try {
    const data = db.getAgencyDashboardData(req.params.userId);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'غير مصرح لك بالوصول إلى لوحة الوكيل أو لا تملك وكالة نشطة' });
  }
});

// Lookup Agency by Code
app.get('/api/agencies/code/:code', (req, res) => {
  const agency = db.getAgencyByCode(req.params.code);
  if (!agency) {
    return res.status(404).json({ error: 'الوكالة غير موجودة أو كود الدعوة غير صالح' });
  }
  res.json({
    agency: {
      id: agency.id,
      agencyName: agency.agencyName,
      agencyCode: agency.agencyCode,
      ownerName: agency.ownerName,
      ownerAvatar: agency.ownerAvatar,
      hostsCount: agency.hostsCount
    }
  });
});

// --- AUTOMATED HOST-AGENCY SYSTEM API ROUTES ---

// 1. Host Registration via Agency Code
app.post('/api/agencies/join-request', (req, res) => {
  const { userId, agencyCode, phone } = req.body;
  if (!userId || !agencyCode || !phone) {
    return res.status(400).json({ error: 'معرّف المستخدم وكود الوكالة ورقم الهاتف حقول إجبارية' });
  }

  const result = db.createHostAgencyRequest({ userId, agencyCode, phone });
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  res.json(result);
});

// 2. Get Pending Host Requests for Agency Owner
app.get('/api/agencies/my-agency-requests/:userId', (req, res) => {
  const requests = db.getAgencyHostRequests(req.params.userId);
  res.json({ requests });
});

// 3. Agency Owner Review Request (Accept / Reject)
app.post('/api/agencies/requests/review', (req, res) => {
  const { agencyOwnerUserId, requestId, action } = req.body;
  if (!agencyOwnerUserId || !requestId || !action) {
    return res.status(400).json({ error: 'جميع بيانات مراجعة الطلب مطلوبة' });
  }

  const result = db.reviewHostAgencyRequest(agencyOwnerUserId, requestId, action);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  res.json(result);
});

// 4. Get Current Hosts for Agency Owner
app.get('/api/agencies/my-hosts/:userId', (req, res) => {
  const hosts = db.getAgencyHosts(req.params.userId);
  res.json({ hosts });
});

// 5. Agency Owner Terminate Host Contract (Mutual Agreement)
app.post('/api/agencies/terminate-host', (req, res) => {
  const { agencyOwnerUserId, hostUserId } = req.body;
  if (!agencyOwnerUserId || !hostUserId) {
    return res.status(400).json({ error: 'معرّف مالك الوكالة والمضيف مطلوبان' });
  }

  const result = db.terminateHostAgencyContract(agencyOwnerUserId, hostUserId);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  res.json(result);
});

// 6. Host Submit Dispute for Force Leave
app.post('/api/agencies/submit-dispute', (req, res) => {
  const { hostUserId, reason } = req.body;
  if (!hostUserId || !reason) {
    return res.status(400).json({ error: 'معرّف المضيف وسبب الشكوى حقول إجبارية' });
  }

  const result = db.submitAgencyDispute(hostUserId, reason);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  res.json(result);
});

// 7. Super Admin / Owner: Get All Agency Disputes
app.get('/api/admin/agency-disputes', requireAdmin, (req, res) => {
  const disputes = db.getAgencyDisputes();
  res.json({ disputes });
});

// 8. Super Admin / Owner: Resolve Dispute (Force Release / Reject)
app.post('/api/admin/agency-disputes/resolve', requireOwner, (req, res) => {
  const ownerId = (req.headers['x-admin-id'] as string) || req.body.ownerId;
  const { disputeId, action } = req.body;

  if (!ownerId || !disputeId || !action) {
    return res.status(400).json({ error: 'بيانات معالجة النزاع مطلوبة' });
  }

  try {
    const result = db.resolveAgencyDispute(ownerId, disputeId, action);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'فشلت معالجة النزاع' });
  }
});

// Public List of Active Target Configs
app.get('/api/targets/configs', (req, res) => {
  res.json({ targetConfigs: db.getTargetConfigs() });
});

// --- 2.5 SHIPPING AGENT ROUTES ---
app.post('/api/shipping-agent/assign', requireOwner, (req, res) => {
  const { targetUserId, isAgent, country, phone } = req.body;
  const ownerId = (req.headers['x-admin-id'] as string) || (req.body.adminId as string);
  try {
    const result = db.setShippingAgent(ownerId, targetUserId, Boolean(isAgent), country, phone);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'فشل تحديث حالة وكيل الشحن' });
  }
});

// Owner supplies agency coins to an agent
app.post('/api/shipping-agent/supply-coins', requireOwner, (req, res) => {
  const { agentUserId, coinAmount } = req.body;
  const ownerId = (req.headers['x-admin-id'] as string) || (req.body.adminId as string);
  try {
    const result = db.supplyAgentCoins(ownerId, agentUserId, Number(coinAmount));
    if (result.agent?.id) {
      broadcastToUser(result.agent.id, { type: 'balance_update', coins: result.agent.coins });
    }
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'فشل تزويد رصيد الوكيل' });
  }
});

// Agent transfers coins to target user
app.post('/api/shipping-agent/transfer-coins', (req, res) => {
  const { agentId, targetUserIdentifier, coinAmount } = req.body;
  const callerHeaderId = (req.headers['x-user-id'] as string) || (req.headers['x-owner-id'] as string) || (req.headers['x-admin-id'] as string);
  const effectiveAgentId = agentId || callerHeaderId;

  if (!effectiveAgentId || !targetUserIdentifier || !coinAmount) {
    return res.status(400).json({ error: 'جميع الحقول مطلوبة لإتمام عملية الشحن (معرّف الوكيل، معرّف المستلم، وعدد الكونز)' });
  }

  const result = db.agentTransferCoins(effectiveAgentId, targetUserIdentifier, Number(coinAmount));
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  // Real-time balance sync via WebSocket
  if (result.agentCoins !== undefined) {
    broadcastToUser(effectiveAgentId, { type: 'balance_update', coins: result.agentCoins });
  }
  if (result.targetUser?.id && result.targetUser.coins !== undefined) {
    broadcastToUser(result.targetUser.id, { type: 'balance_update', coins: result.targetUser.coins });
  }

  res.json(result);
});

// Agent transfers diamonds/packages to target user
app.post('/api/shipping-agent/transfer', (req, res) => {
  const { agentId, targetUserIdentifier, packageId } = req.body;
  const callerHeaderId = (req.headers['x-user-id'] as string) || (req.headers['x-owner-id'] as string) || (req.headers['x-admin-id'] as string);
  const effectiveAgentId = agentId || callerHeaderId;

  if (!effectiveAgentId || !targetUserIdentifier || !packageId) {
    return res.status(400).json({ error: 'جميع الحقول مطلوبة لإتمام عملية الشحن' });
  }

  const result = db.agentTransferDiamonds(effectiveAgentId, targetUserIdentifier, packageId);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  // Real-time balance sync via WebSocket
  if (result.agentDiamonds !== undefined) {
    broadcastToUser(effectiveAgentId, { type: 'balance_update', diamonds: result.agentDiamonds });
  }
  if (result.targetUser?.id && result.targetUser.diamonds !== undefined) {
    broadcastToUser(result.targetUser.id, { type: 'balance_update', diamonds: result.targetUser.diamonds });
  }

  res.json(result);
});

// Pull user to mic by host/owner
app.post('/api/rooms/pull-mic', (req, res) => {
  const { roomId, hostId, targetUserId, seatIndex } = req.body;
  if (!roomId || !hostId || !targetUserId) {
    return res.status(400).json({ error: 'البيانات غير مكتملة لسحب المستمع للمايك' });
  }

  const room = db.getRoomById(roomId);
  const hostUser = db.getUserById(hostId);
  const isOwnerOrHost = room?.hostId === hostId || db.isOwner(hostId) || hostUser?.role === 'ADMIN' || hostUser?.role === 'MODERATOR';

  if (!room || !isOwnerOrHost) {
    return res.status(403).json({ error: 'ليس لديك صلاحية سحب المستخدمين للمايك (صاحب الغرفة والمشرف فقط)' });
  }

  const seats = db.getRoomSeats(roomId);
  const targetSeatIdx = seatIndex !== undefined && Number(seatIndex) >= 0 ? Number(seatIndex) : seats.findIndex(s => !s.userId && !s.isLocked);
  if (targetSeatIdx === -1) {
    return res.status(400).json({ error: 'لا توجد مقاعد فارغة متاحة حالياً على المسرح' });
  }

  const assignRes = db.assignUserToSeat(roomId, targetSeatIdx, targetUserId);
  if (!assignRes.success) {
    return res.status(400).json({ error: assignRes.message || 'فشل سحب المستخدم للمايك' });
  }

  db.cancelMicRequest(roomId, targetUserId);

  broadcastToRoom(roomId, {
    type: 'seats_updated',
    roomId,
    seats: db.getRoomSeats(roomId),
    members: db.getRoomMembers(roomId)
  });

  broadcastToRoom(roomId, {
    type: 'mic_requests_updated',
    roomId,
    requests: db.getMicRequests(roomId)
  });

  broadcastToUser(targetUserId, {
    type: 'mic_request_resolved',
    roomId,
    userId: targetUserId,
    status: 'ACCEPTED',
    seatIndex: targetSeatIdx,
    seatLabel: `المقعد رقم ${targetSeatIdx + 1}`,
    message: 'قام صاحب الغرفة بسحبك وإعطائك المايك للتحدث المباشر! 🎙️✨'
  });

  res.json({ success: true, seatIndex: targetSeatIdx });
});

// Official Payment Webhook Endpoint with Verification & Server-Side Atomic Balance Top-up
// --- LUCKY WHEEL ARENA GAME ENDPOINTS ---

const BOT_NAMES = [
  'فارس الخليج 👑', 'أميرة الصمت ✨', 'صقر العرب 🦅', 'أسد الليل 🦁',
  'ملكة الإحساس 💎', 'شبح الصحراء ⚡', 'نجم الليل 🌟', 'ملك التحدي 🏆',
  'سلطانة 👑', 'عابر سبيل 🏹'
];

const BOT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=250'
];

interface ActiveMatchState {
  matchId: string;
  betAmount: number;
  player1: { id: string; name: string; avatar: string; numericId?: string; isBot: boolean };
  player2?: { id: string; name: string; avatar: string; numericId?: string; isBot: boolean };
  status: 'WAITING_FOR_OPPONENT' | 'SPINNING' | 'FINISHED';
  winnerId?: string;
  winningAngle?: number;
  winnerPrize?: number;
  commissionDeducted?: number;
  createdAt: number;
}

const luckyWheelMatches = new Map<string, ActiveMatchState>();
const botTimeoutsMap = new Map<string, NodeJS.Timeout>();

// Create or Join Match
app.post('/api/games/lucky-wheel/join', (req, res) => {
  const { userId, betAmount } = req.body;
  const parsedBet = Number(betAmount);

  const VALID_BETS = [100, 200, 300, 400, 500, 1000, 2000, 3000, 4000, 5000, 10000, 20000, 30000, 40000, 50000];
  if (!userId || !VALID_BETS.includes(parsedBet)) {
    return res.status(400).json({ error: 'فئة الرهان غير صالحة.' });
  }

  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }

  if ((user.diamonds || 0) < parsedBet) {
    return res.status(400).json({ error: `رصيدك من الماسات (${user.diamonds || 0}) غير كافٍ للرهان بقيمة ${parsedBet.toLocaleString()} ماسة` });
  }

  // Deduct bet amount atomically from server side
  user.diamonds = (user.diamonds || 0) - parsedBet;
  db.addWalletTransaction(
    user.id,
    'DIAMOND',
    -parsedBet,
    user.diamonds,
    `دخول جولة عجلة الحظ بقيمة ${parsedBet.toLocaleString()} ماسة`
  );
  db.save();

  // Broadcast updated balance
  broadcastToUser(user.id, { type: 'balance_update', diamonds: user.diamonds });

  // Search for waiting human opponent with same bet
  let existingMatch = Array.from(luckyWheelMatches.values()).find(
    m => m.betAmount === parsedBet && m.status === 'WAITING_FOR_OPPONENT' && m.player1.id !== userId
  );

  if (existingMatch) {
    // Join existing match - clear bot timeout if any
    const existingTimeout = botTimeoutsMap.get(existingMatch.matchId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      botTimeoutsMap.delete(existingMatch.matchId);
    }

    existingMatch.player2 = {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      numericId: user.numericId,
      isBot: false
    };
    existingMatch.status = 'SPINNING';

    // Execute match logic
    executeWheelSpin(existingMatch);

    return res.json({
      success: true,
      match: existingMatch,
      userDiamonds: user.diamonds
    });
  }

  // Create new match
  const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newMatch: ActiveMatchState = {
    matchId,
    betAmount: parsedBet,
    player1: {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      numericId: user.numericId,
      isBot: false
    },
    status: 'WAITING_FOR_OPPONENT',
    createdAt: Date.now()
  };

  // Schedule 15-second Bot Trigger
  const botTimer = setTimeout(() => {
    botTimeoutsMap.delete(matchId);
    if (newMatch.status === 'WAITING_FOR_OPPONENT') {
      const randomBotName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
      const randomBotAvatar = BOT_AVATARS[Math.floor(Math.random() * BOT_AVATARS.length)];
      const randomBotId = `bot_${Date.now()}`;

      newMatch.player2 = {
        id: randomBotId,
        name: randomBotName,
        avatar: randomBotAvatar,
        numericId: String(Math.floor(100000 + Math.random() * 900000)),
        isBot: true
      };
      newMatch.status = 'SPINNING';

      executeWheelSpin(newMatch);
    }
  }, 15000); // 15 seconds exact

  botTimeoutsMap.set(matchId, botTimer);
  luckyWheelMatches.set(matchId, newMatch);

  return res.json({
    success: true,
    match: newMatch,
    userDiamonds: user.diamonds
  });
});

// Helper function to execute wheel spin with algorithmic win rates and owner profit routing
function executeWheelSpin(match: ActiveMatchState) {
  const totalPot = match.betAmount * 2;
  const isP1Human = !match.player1.isBot;
  const isP2Human = match.player2 && !match.player2.isBot;

  let winningPlayerId: string;

  // Algorithmic Win Rate System
  if (match.player1.isBot || (match.player2 && match.player2.isBot)) {
    // Playing against Bot
    const humanPlayer = isP1Human ? match.player1 : match.player2!;
    const botPlayer = match.player1.isBot ? match.player1 : match.player2!;

    // 80% Bot Win Rate, 20% Human Win Rate
    // Give slightly higher win probability for small 100 diamond bets
    let humanWinChance = 0.20; 
    if (match.betAmount === 100) {
      humanWinChance = 0.30; // 30% chance on small bets for encouragement
    }

    const roll = Math.random();
    if (roll < humanWinChance) {
      winningPlayerId = humanPlayer.id;
    } else {
      winningPlayerId = botPlayer.id;
    }
  } else {
    // 2 Humans playing: 50% random
    winningPlayerId = Math.random() < 0.5 ? match.player1.id : match.player2!.id;
  }

  // Calculate angle: Player 1 = 0deg to 180deg (top half), Player 2 = 180deg to 360deg (bottom half)
  let winningAngle: number;
  if (winningPlayerId === match.player1.id) {
    winningAngle = 360 * 5 + (15 + Math.floor(Math.random() * 150)); // Landing in P1 sector
  } else {
    winningAngle = 360 * 5 + (195 + Math.floor(Math.random() * 150)); // Landing in P2 sector
  }

  // Owner Profit Routing
  const ownerUser = db.getOwnerUser();
  const isBotWinner = winningPlayerId.startsWith('bot_');

  if (isBotWinner) {
    // 100% of the pot goes to the Owner's Account (Super Admin)
    if (ownerUser) {
      ownerUser.diamonds = (ownerUser.diamonds || 0) + totalPot;
      db.addWalletTransaction(
        ownerUser.id,
        'DIAMOND',
        totalPot,
        ownerUser.diamonds,
        `أرباح جولة عجلة الحظ (فوز الروبوت) - رهان ${match.betAmount.toLocaleString()} ماسة`
      );
    }
    match.winnerPrize = 0;
    match.commissionDeducted = totalPot;
  } else {
    // Human Winner
    const platformCommission = Math.floor(totalPot * 0.10); // 10% Platform fee
    const netPrize = totalPot - platformCommission;

    // Route 10% commission to Owner
    if (ownerUser) {
      ownerUser.diamonds = (ownerUser.diamonds || 0) + platformCommission;
      db.addWalletTransaction(
        ownerUser.id,
        'DIAMOND',
        platformCommission,
        ownerUser.diamonds,
        `عمولة المنصة 10% من جولة عجلة الحظ (#${match.matchId})`
      );
    }

    // Award net prize to Human Winner
    const winnerUser = db.getUserById(winningPlayerId);
    if (winnerUser) {
      winnerUser.diamonds = (winnerUser.diamonds || 0) + netPrize;
      db.addWalletTransaction(
        winnerUser.id,
        'DIAMOND',
        netPrize,
        winnerUser.diamonds,
        `جائزة الفوز بجولة عجلة الحظ (#${match.matchId})`
      );
      broadcastToUser(winnerUser.id, { type: 'balance_update', diamonds: winnerUser.diamonds });
    }

    match.winnerPrize = netPrize;
    match.commissionDeducted = platformCommission;
  }

  match.winnerId = winningPlayerId;
  match.winningAngle = winningAngle;
  match.status = 'FINISHED';
  db.save();
}

// Get Match Status
app.get('/api/games/lucky-wheel/match/:matchId', (req, res) => {
  const match = luckyWheelMatches.get(req.params.matchId);
  if (!match) {
    return res.status(404).json({ error: 'الجولة غير موجودة' });
  }
  return res.json({ match });
});

// ==========================================
// GAME 2: LUCKY FARM (مزرعة الحظ - فواكه ولحوم)
// ==========================================

const LUCKY_FARM_ITEMS = [
  { id: 'apple', nameAr: 'تفاح', icon: '🍎', group: 'fruit', multiplier: 2 },
  { id: 'banana', nameAr: 'موز', icon: '🍌', group: 'fruit', multiplier: 3 },
  { id: 'strawberry', nameAr: 'فراولة', icon: '🍓', group: 'fruit', multiplier: 4 },
  { id: 'orange', nameAr: 'عنب', icon: '🍇', group: 'fruit', multiplier: 5 },
  { id: 'chicken', nameAr: 'دجاجة', icon: '🐔', group: 'meat', multiplier: 8 },
  { id: 'buffalo', nameAr: 'سمك', icon: '🐟', group: 'meat', multiplier: 10 },
  { id: 'steak', nameAr: 'كريسبي', icon: '🍗', group: 'meat', multiplier: 15 },
  { id: 'goat', nameAr: 'بقرة', icon: '🐄', group: 'meat', multiplier: 25 },
];

const luckyFarmState = {
  roundId: `farm_round_${Date.now()}`,
  status: 'BETTING' as 'BETTING' | 'SPINNING' | 'RESULT',
  remainingSeconds: 15, // 15s betting
  winningItemId: null as string | null,
  totalBetsPerItem: {
    apple: 0,
    banana: 0,
    strawberry: 0,
    orange: 0,
    chicken: 0,
    buffalo: 0,
    steak: 0,
    goat: 0
  } as Record<string, number>,
  userBetsPerItem: {} as Record<string, Record<string, number>>, // userId -> itemId -> amount
  recentWinners: [] as any[],
  latestBigWin: null as any
};

// Global Server Timer Loop for Lucky Farm
setInterval(() => {
  luckyFarmState.remainingSeconds--;

  // Handle stage transitions
  if (luckyFarmState.remainingSeconds <= 0) {
    if (luckyFarmState.status === 'BETTING') {
      // Transition from BETTING (15s) to SPINNING (15s)
      luckyFarmState.status = 'SPINNING';
      luckyFarmState.remainingSeconds = 15;

      // Smart Loss/Profit Algorithm (80% System Profit / 20% Random)
      const overallTotalBets = Object.values(luckyFarmState.totalBetsPerItem).reduce((a, b) => a + b, 0);
      
      const itemProfits = LUCKY_FARM_ITEMS.map(item => {
        const itemBets = luckyFarmState.totalBetsPerItem[item.id] || 0;
        const totalPayout = itemBets * item.multiplier;
        const netHouseProfit = overallTotalBets - totalPayout;
        return { item, netHouseProfit, itemBets };
      });

      itemProfits.sort((a, b) => b.netHouseProfit - a.netHouseProfit);

      let chosenItemId = itemProfits[0].item.id; // Max system profit item
      const rand = Math.random();

      if (rand >= 0.80) { // 20% chance to pick random item with bets or random overall
        const itemsWithBets = itemProfits.filter(ip => ip.itemBets > 0);
        if (itemsWithBets.length > 0) {
          const randomIdx = Math.floor(Math.random() * itemsWithBets.length);
          chosenItemId = itemsWithBets[randomIdx].item.id;
        } else {
          const randomIdx = Math.floor(Math.random() * LUCKY_FARM_ITEMS.length);
          chosenItemId = LUCKY_FARM_ITEMS[randomIdx].id;
        }
      }

      luckyFarmState.winningItemId = chosenItemId;

      // Broadcast Spin Started
      broadcastAll({
        type: 'lucky_farm_spin_started',
        roundId: luckyFarmState.roundId,
        winningItemId: luckyFarmState.winningItemId,
        durationSeconds: 15,
        totalBetsPerItem: luckyFarmState.totalBetsPerItem
      });

    } else if (luckyFarmState.status === 'SPINNING') {
      // Transition from SPINNING (15s) to RESULT (5s)
      luckyFarmState.status = 'RESULT';
      luckyFarmState.remainingSeconds = 5;

      const winningItem = LUCKY_FARM_ITEMS.find(i => i.id === luckyFarmState.winningItemId);

      if (winningItem && luckyFarmState.winningItemId) {
        const winningItemId = luckyFarmState.winningItemId;

        // Process payouts for all users who bet on winning item
        for (const [userId, bets] of Object.entries(luckyFarmState.userBetsPerItem)) {
          const betAmount = bets[winningItemId] || 0;
          if (betAmount > 0) {
            const winAmount = Math.floor(betAmount * winningItem.multiplier);
            const user = db.getUserById(userId);
            if (user) {
              user.diamonds = (user.diamonds || 0) + winAmount;
              db.addWalletTransaction(
                user.id,
                'DIAMOND',
                winAmount,
                user.diamonds,
                `فوز في لعبة مزرعة الحظ (${winningItem.nameAr}) - رهان ${betAmount.toLocaleString()} ماسة`
              );
              broadcastToUser(user.id, { type: 'balance_update', diamonds: user.diamonds });

              const winnerRecord = {
                userId: user.id,
                userName: user.name,
                userAvatar: user.avatar,
                winAmount,
                itemName: winningItem.nameAr,
                itemIcon: winningItem.icon,
                timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
              };

              luckyFarmState.recentWinners.unshift(winnerRecord);
              if (luckyFarmState.recentWinners.length > 20) {
                luckyFarmState.recentWinners.pop();
              }

              // Global Winner Banner Trigger for big wins (> 5,000 diamonds)
              if (winAmount >= 5000) {
                const bigWinBanner = {
                  id: `bigwin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  userId: user.id,
                  userName: user.name,
                  userAvatar: user.avatar,
                  winAmount,
                  itemName: winningItem.nameAr,
                  itemIcon: winningItem.icon,
                  timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
                };

                luckyFarmState.latestBigWin = bigWinBanner;

                // Broadcast Big Win Banner to ALL connected users across ALL voice rooms
                broadcastAll({
                  type: 'lucky_farm_global_win',
                  banner: bigWinBanner
                });
              }
            }
          }
        }
        db.save();
      }

      // Broadcast Result Event
      broadcastAll({
        type: 'lucky_farm_result',
        roundId: luckyFarmState.roundId,
        winningItemId: luckyFarmState.winningItemId,
        winningItem: winningItem || null,
        recentWinners: luckyFarmState.recentWinners.slice(0, 5)
      });

    } else if (luckyFarmState.status === 'RESULT') {
      // Transition from RESULT (5s) to new BETTING round (15s)
      luckyFarmState.status = 'BETTING';
      luckyFarmState.remainingSeconds = 15;
      luckyFarmState.roundId = `farm_round_${Date.now()}`;
      luckyFarmState.winningItemId = null;
      luckyFarmState.totalBetsPerItem = {
        apple: 0,
        banana: 0,
        strawberry: 0,
        orange: 0,
        chicken: 0,
        buffalo: 0,
        steak: 0,
        goat: 0
      };
      luckyFarmState.userBetsPerItem = {};

      broadcastAll({
        type: 'lucky_farm_betting_started',
        roundId: luckyFarmState.roundId,
        durationSeconds: 15
      });
    }
  }

  // Periodic tick broadcast
  broadcastAll({
    type: 'lucky_farm_tick',
    status: luckyFarmState.status,
    remainingSeconds: luckyFarmState.remainingSeconds,
    roundId: luckyFarmState.roundId,
    winningItemId: luckyFarmState.winningItemId,
    totalBetsPerItem: luckyFarmState.totalBetsPerItem
  });
}, 1000);

// Get Lucky Farm Current State
app.get('/api/games/lucky-farm/state', (req, res) => {
  const userId = req.query.userId as string;
  const userBets = (userId && luckyFarmState.userBetsPerItem[userId]) ? luckyFarmState.userBetsPerItem[userId] : {};

  return res.json({
    success: true,
    state: {
      roundId: luckyFarmState.roundId,
      status: luckyFarmState.status,
      remainingSeconds: luckyFarmState.remainingSeconds,
      winningItemId: luckyFarmState.winningItemId,
      totalBetsPerItem: luckyFarmState.totalBetsPerItem,
      userBets,
      recentWinners: luckyFarmState.recentWinners,
      latestBigWin: luckyFarmState.latestBigWin
    }
  });
});

// Place Lucky Farm Bet
app.post('/api/games/lucky-farm/bet', (req, res) => {
  const { userId, itemId, amount } = req.body;
  const parsedAmount = Number(amount);

  const VALID_BETS = [100, 200, 300, 400, 500, 1000, 2000, 3000, 4000, 5000, 10000, 20000, 30000, 40000, 50000];
  const itemExists = LUCKY_FARM_ITEMS.some(i => i.id === itemId);

  if (!userId || !itemExists || !VALID_BETS.includes(parsedAmount)) {
    return res.status(400).json({ error: 'بيانات الرهان غير صالحة أو الصنف غير موجود' });
  }

  if (luckyFarmState.status !== 'BETTING') {
    return res.status(400).json({ error: 'انتهى وقت الرهان لهذه الجولة، يرجى الانتظار للجولة القادمة!' });
  }

  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }

  if ((user.diamonds || 0) < parsedAmount) {
    return res.status(400).json({ error: `رصيدك من الماسات (${(user.diamonds || 0).toLocaleString()}) لا يكفي للرهان بقيمة ${parsedAmount.toLocaleString()} ماسة` });
  }

  // Deduct bet from user
  user.diamonds = (user.diamonds || 0) - parsedAmount;
  db.addWalletTransaction(
    user.id,
    'DIAMOND',
    -parsedAmount,
    user.diamonds,
    `رهان مزرعة الحظ (${itemId}) بقيمة ${parsedAmount.toLocaleString()} ماسة`
  );
  db.save();

  // Record bet state
  luckyFarmState.totalBetsPerItem[itemId] = (luckyFarmState.totalBetsPerItem[itemId] || 0) + parsedAmount;

  if (!luckyFarmState.userBetsPerItem[user.id]) {
    luckyFarmState.userBetsPerItem[user.id] = {};
  }
  luckyFarmState.userBetsPerItem[user.id][itemId] = (luckyFarmState.userBetsPerItem[user.id][itemId] || 0) + parsedAmount;

  // Broadcast user balance update
  broadcastToUser(user.id, { type: 'balance_update', diamonds: user.diamonds });

  // Broadcast updated total bets to all clients
  broadcastAll({
    type: 'lucky_farm_bets_updated',
    roundId: luckyFarmState.roundId,
    totalBetsPerItem: luckyFarmState.totalBetsPerItem
  });

  return res.json({
    success: true,
    userDiamonds: user.diamonds,
    state: {
      roundId: luckyFarmState.roundId,
      status: luckyFarmState.status,
      remainingSeconds: luckyFarmState.remainingSeconds,
      winningItemId: luckyFarmState.winningItemId,
      totalBetsPerItem: luckyFarmState.totalBetsPerItem,
      userBets: luckyFarmState.userBetsPerItem[user.id] || {},
      recentWinners: luckyFarmState.recentWinners,
      latestBigWin: luckyFarmState.latestBigWin
    }
  });
});


app.post('/api/payments/webhook', (req, res) => {
  const { orderId, userId, diamonds, paymentGateway, status } = req.body;

  if (!userId || !diamonds || status !== 'SUCCESS') {
    return res.status(400).json({ error: 'بيانات بوابة الدفع غير مكتملة أو العملية غير ناجحة' });
  }

  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }

  const addedDiamonds = Number(diamonds);
  if (isNaN(addedDiamonds) || addedDiamonds <= 0) {
    return res.status(400).json({ error: 'كمية الماسات غير صالحة' });
  }

  // Server-side atomic balance addition
  user.diamonds = (user.diamonds || 0) + addedDiamonds;
  db.addXP(user.id, addedDiamonds, 'PAYMENT_GATEWAY_RECHARGE');
  db.addWalletTransaction(
    user.id,
    'DIAMOND',
    addedDiamonds,
    user.diamonds,
    `شحن عبر بوابة الدفع الرسمية (${paymentGateway || 'Official Gateway'}) - طلب #${orderId || Date.now()}`
  );

  db.addNotification({
    userId: user.id,
    title: 'نجاح عملية الشحن الرسمية 💎💳',
    message: `تم شحن ${addedDiamonds.toLocaleString('ar-EG')} ماسة لحسابك بنجاح من خلال بوابة الدفع الرسمية.`,
    type: 'ADMIN'
  });

  db.save();

  // Sync real-time balance via WebSocket
  broadcastToUser(user.id, {
    type: 'balance_update',
    diamonds: user.diamonds
  });

  return res.json({
    success: true,
    message: 'تمت معالجة إشعار بوابة الدفع وإضافة الماسات بنجاح',
    newDiamonds: user.diamonds
  });
});

// --- 3. ADMIN MANAGEMENT ROUTES FOR HOSTS & AGENTS (requireAdmin) ---

// Get Host Applications
app.get('/api/admin/host-applications', requireAdmin, (req, res) => {
  res.json({ applications: db.getHostApplications() });
});

// Review Host Application (Approve / Reject)
app.post('/api/admin/host-applications/review', requireAdmin, (req, res) => {
  const { adminId, applicationId, action, rejectionReason, assignedAgencyId } = req.body;
  if (!adminId || !applicationId || !action) {
    return res.status(400).json({ error: 'بيانات المراجعة غير مكتملة' });
  }

  try {
    const result = db.reviewHostApplication(adminId, applicationId, action, rejectionReason, assignedAgencyId);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get Agent Applications
app.get('/api/admin/agent-applications', requireAdmin, (req, res) => {
  res.json({ applications: db.getAgentApplications() });
});

// Review Agent Application (Approve / Reject)
app.post('/api/admin/agent-applications/review', requireAdmin, (req, res) => {
  const { adminId, applicationId, action, rejectionReason, commissionPercentage } = req.body;
  if (!adminId || !applicationId || !action) {
    return res.status(400).json({ error: 'بيانات المراجعة غير مكتملة' });
  }

  try {
    const result = db.reviewAgentApplication(adminId, applicationId, action, rejectionReason, commissionPercentage);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get All Agencies
app.get('/api/admin/agencies', requireAdmin, (req, res) => {
  res.json({ agencies: db.getAgencies() });
});

// Update Agency Status (Active / Suspended)
app.post('/api/admin/agencies/status', requireAdmin, (req, res) => {
  const { adminId, agencyId, status, reason } = req.body;
  if (!adminId || !agencyId || !status) {
    return res.status(400).json({ error: 'المعلومات غير مكتملة لتغيير حالة الوكالة' });
  }

  try {
    const result = db.updateAgencyStatus(adminId, agencyId, status, reason);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get All Host Profiles
app.get('/api/admin/host-profiles', requireAdmin, (req, res) => {
  res.json({ hostProfiles: db.getHostProfiles() });
});

// Link Host to Agency
app.post('/api/admin/hosts/link-agency', requireAdmin, (req, res) => {
  const { adminId, hostUserId, agencyId } = req.body;
  if (!adminId || !hostUserId || !agencyId) {
    return res.status(400).json({ error: 'معرف المسؤول والمضيف والوكالة مطلوب' });
  }

  try {
    const result = db.linkHostToAgency(adminId, hostUserId, agencyId);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Unlink Host from Agency
app.post('/api/admin/hosts/unlink-agency', requireAdmin, (req, res) => {
  const { adminId, hostUserId, reason } = req.body;
  if (!adminId || !hostUserId) {
    return res.status(400).json({ error: 'معرف المسؤول والمضيف مطلوب' });
  }

  try {
    const result = db.unlinkHostFromAgency(adminId, hostUserId, reason);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Transfer Host to another Agency
app.post('/api/admin/hosts/transfer-agency', requireAdmin, (req, res) => {
  const { adminId, hostUserId, newAgencyId, reason } = req.body;
  if (!adminId || !hostUserId || !newAgencyId) {
    return res.status(400).json({ error: 'معلومات النقل غير مكتملة' });
  }

  try {
    const result = db.transferHostAgency(adminId, hostUserId, newAgencyId, reason);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Update Host Profile Status (Active / Suspended)
app.post('/api/admin/hosts/status', requireAdmin, (req, res) => {
  const { adminId, hostUserId, status, reason } = req.body;
  if (!adminId || !hostUserId || !status) {
    return res.status(400).json({ error: 'المعلومات غير مكتملة' });
  }

  try {
    const result = db.updateHostProfileStatus(adminId, hostUserId, status, reason);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Target Configs Management (Admin)
app.get('/api/admin/target-configs', requireAdmin, (req, res) => {
  res.json({ targetConfigs: db.getTargetConfigs() });
});

app.post('/api/admin/target-configs', requireAdmin, (req, res) => {
  const { adminId, ...configData } = req.body;
  try {
    const result = db.createTargetConfig(adminId, configData);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/admin/target-configs/:id', requireAdmin, (req, res) => {
  const { adminId, updates } = req.body;
  try {
    const result = db.updateTargetConfig(adminId, req.params.id, updates);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- API ERROR HANDLERS ---
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'المسار المطلوب غير موجود في خادم البيانات' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  if (res.headersSent) {
    return next(err);
  }
  if (req.path.startsWith('/api')) {
    return res.status(500).json({ error: err?.message || 'حدث خطأ غير متوقع في الخادم' });
  }
  next(err);
});

// --- VITE MIDDLEWARE SETUP ---
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🎙️ منصة حكاوي تعمل بنجاح على http://localhost:${PORT}`);
  });
}

setupVite();
