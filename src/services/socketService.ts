/**
 * WebSocket & WebRTC Real-Time Signaling Client
 */

type SocketEventListener = (data: any) => void;

class SocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<SocketEventListener>> = new Map();
  private reconnectTimeout: any = null;
  private currentUserId: string = '';
  private currentRoomId: string | null = null;
  private isExplicitlyClosed: boolean = false;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();

  connect(userId: string) {
    this.currentUserId = userId;
    this.isExplicitlyClosed = false;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.send({ type: 'init', userId });
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('🔗 متصل بسيرفر حكاوي اللحظي (WebSocket Connected)');
        this.emit('connection_change', { status: 'connected' });
        this.send({ type: 'init', userId });

        if (this.currentRoomId) {
          this.send({ type: 'join_room', roomId: this.currentRoomId, userId: this.currentUserId });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const type = data.type;
          this.emit(type, data);
          this.emit('*', data);
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      this.ws.onclose = () => {
        console.log('⚠️ تم قطع الاتصال بالسيرفر اللحظي (Disconnected)');
        this.emit('connection_change', { status: 'disconnected' });
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket connection notice:', err);
      };
    } catch (e) {
      console.warn('Socket connect failed:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      if (this.currentUserId && !this.isExplicitlyClosed) {
        this.connect(this.currentUserId);
      }
    }, 3000);
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private isStealthMode: boolean = false;

  joinRoom(roomId: string, userId: string, isStealth?: boolean) {
    this.currentRoomId = roomId;
    if (isStealth !== undefined) {
      this.isStealthMode = isStealth;
    }
    this.send({ type: 'join_room', roomId, userId, isStealth: this.isStealthMode });
  }

  leaveRoom(roomId: string, userId: string) {
    if (this.currentRoomId === roomId) {
      this.currentRoomId = null;
    }
    this.send({ type: 'leave_room', roomId, userId });
    this.cleanupPeerConnections();
  }

  sendChatMessage(roomId: string, userId: string, text: string) {
    this.send({ type: 'chat_message', roomId, userId, text });
  }

  sendGift(params: { senderId: string; receiverId: string; giftId: string; count: number; roomId?: string; idempotencyKey?: string }) {
    this.send({ type: 'send_gift', ...params });
  }

  requestMic(roomId: string, userId: string, targetSeatIndex?: number) {
    this.send({ type: 'request_mic', roomId, userId, targetSeatIndex });
  }

  cancelMicRequest(roomId: string, userId: string) {
    this.send({ type: 'cancel_mic_request', roomId, userId });
  }

  resolveMicRequest(requestId: string, status: 'ACCEPTED' | 'REJECTED', targetSeatIndex?: number) {
    this.send({ type: 'resolve_mic_request', requestId, status, targetSeatIndex });
  }

  takeSeat(roomId: string, seatIndex: number, userId: string) {
    this.send({ type: 'take_seat', roomId, seatIndex, userId });
  }

  leaveSeat(roomId: string, seatIndex: number) {
    this.send({ type: 'leave_seat', roomId, seatIndex });
  }

  updateSeatMedia(roomId: string, seatIndex: number, isMuted?: boolean, isCameraOn?: boolean, isSpeaking?: boolean) {
    this.send({ type: 'update_seat_media', roomId, seatIndex, isMuted, isCameraOn, isSpeaking });
  }

  hostControl(roomId: string, action: 'mute_all' | 'unmute_all' | 'kick_user' | 'mute_seat' | 'lock_seat' | 'end_room', targetUserId?: string, seatIndex?: number) {
    this.send({ type: 'host_control', roomId, action, targetUserId, seatIndex });
  }

  changeMicLayout(roomId: string, layout: string) {
    this.send({ type: 'change_mic_layout', roomId, layout });
  }

  updateRoomSettings(roomId: string, userId: string, settings: {
    title?: string;
    coverImage?: string;
    description?: string;
    micLayout?: string;
    tags?: string[];
  }) {
    this.send({ type: 'update_room_settings', roomId, userId, ...settings });
  }

  sendAudioLevel(roomId: string, userId: string, level: number, isSpeaking: boolean) {
    this.send({ type: 'audio_level', roomId, userId, level, isSpeaking });
  }

  // WebRTC Signaling
  sendWebRTCSignal(roomId: string, targetUserId: string | null, signal: any) {
    this.send({
      type: 'webrtc_signal',
      roomId,
      targetUserId,
      signal,
      senderId: this.currentUserId
    });
  }

  // 3D Entrance Trigger
  triggerEntrance(roomId: string, userId: string, entranceId?: string) {
    this.send({
      type: 'trigger_entrance',
      roomId,
      userId,
      entranceId
    });
  }

  // Room Soundboard Effect Trigger
  playRoomEffect(roomId: string, userId: string, effectId: string, userName: string) {
    this.send({
      type: 'play_room_effect',
      roomId,
      userId,
      effectId,
      userName
    });
  }

  private cleanupPeerConnections() {
    this.peerConnections.forEach(pc => {
      try { pc.close(); } catch {}
    });
    this.peerConnections.clear();
  }

  // Event subscription
  on(event: string, listener: SocketEventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  off(event: string, listener: SocketEventListener) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
    }
  }

  private emit(event: string, data: any) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach(cb => {
        try { cb(data); } catch (err) { console.error('Socket event error:', err); }
      });
    }
  }

  disconnect() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.cleanupPeerConnections();
  }
}

export const socketService = new SocketService();
