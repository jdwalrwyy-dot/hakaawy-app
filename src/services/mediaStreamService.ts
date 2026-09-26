/**
 * Real-Time Media Stream & Audio Analyzer Service
 * Controls microphone capture, camera video streams, speaking level detection,
 * front/back camera toggles, and safe media teardown.
 */

export interface AudioLevelCallback {
  (level: number, isSpeaking: boolean): void;
}

class MediaStreamService {
  private localAudioStream: MediaStream | null = null;
  private localVideoStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphoneSource: MediaStreamAudioSourceNode | null = null;
  private animFrameId: number | null = null;
  private currentFacingMode: 'user' | 'environment' = 'user';

  // Request & start real microphone stream
  async startMicrophone(onLevelChange?: AudioLevelCallback): Promise<{ success: boolean; stream?: MediaStream; error?: string }> {
    try {
      if (this.localAudioStream) {
        this.stopMicrophone();
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
          success: false,
          error: 'المتصفح الحالي لا يدعم الوصول إلى الميكروفون المباشر.'
        };
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      this.localAudioStream = stream;
      this.initAudioAnalyser(stream, onLevelChange);

      return { success: true, stream };
    } catch (err: any) {
      console.warn('Microphone permission request error:', err);
      let errorMsg = 'تعذر الوصول إلى الميكروفون، يرجى منح الإذن في المتصفح.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'تم رفض إذن الميكروفون. يرجى السماح بالوصول للتحدث داخل الغرفة.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'لم يتم العثور على ميكروفون متصل بجهازك.';
      }
      return { success: false, error: errorMsg };
    }
  }

  // Set up audio frequency analyser to track speaking volume
  private initAudioAnalyser(stream: MediaStream, onLevelChange?: AudioLevelCallback) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.4;

      this.microphoneSource = this.audioContext.createMediaStreamSource(stream);
      this.microphoneSource.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let lastSpeaking = false;
      let throttleCounter = 0;

      const checkLevel = () => {
        if (!this.analyser || !this.localAudioStream || !this.localAudioStream.active) return;

        // Check if track is enabled
        const audioTrack = this.localAudioStream.getAudioTracks()[0];
        if (!audioTrack || !audioTrack.enabled) {
          if (onLevelChange && lastSpeaking) {
            onLevelChange(0, false);
            lastSpeaking = false;
          }
          this.animFrameId = requestAnimationFrame(checkLevel);
          return;
        }

        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        const isSpeaking = normalized > 12;

        throttleCounter++;
        if (throttleCounter % 3 === 0 || isSpeaking !== lastSpeaking) {
          if (onLevelChange) {
            onLevelChange(normalized, isSpeaking);
          }
          lastSpeaking = isSpeaking;
        }

        this.animFrameId = requestAnimationFrame(checkLevel);
      };

      this.animFrameId = requestAnimationFrame(checkLevel);
    } catch (e) {
      console.warn('Audio analyser init error:', e);
    }
  }

  // Mute / Unmute microphone track
  setMicrophoneMuted(muted: boolean): boolean {
    if (!this.localAudioStream) return false;
    const tracks = this.localAudioStream.getAudioTracks();
    tracks.forEach(track => {
      track.enabled = !muted;
    });
    return true;
  }

  // Stop & teardown microphone stream completely
  stopMicrophone() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.microphoneSource) {
      try { this.microphoneSource.disconnect(); } catch {}
      this.microphoneSource = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try { this.audioContext.close(); } catch {}
      this.audioContext = null;
    }
    if (this.localAudioStream) {
      this.localAudioStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localAudioStream = null;
    }
  }

  // Request & start real Camera video stream
  async startCamera(facingMode: 'user' | 'environment' = 'user'): Promise<{ success: boolean; stream?: MediaStream; error?: string }> {
    try {
      if (this.localVideoStream) {
        this.stopCamera();
      }

      this.currentFacingMode = facingMode;

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
          success: false,
          error: 'المتصفح الحالي لا يدعم الكاميرا.'
        };
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 24 }
        },
        audio: false
      });

      this.localVideoStream = stream;
      return { success: true, stream };
    } catch (err: any) {
      console.warn('Camera permission request error:', err);
      let errorMsg = 'تعذر تشغيل الكاميرا، يرجى منح الإذن في المتصفح.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'تم رفض إذن الكاميرا. يرجى السماح بالوصول لتشغيل البث المرئي.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'لم يتم العثور على كاميرا في جهازك.';
      }
      return { success: false, error: errorMsg };
    }
  }

  // Toggle Front / Back Camera
  async switchCamera(): Promise<{ success: boolean; stream?: MediaStream; facingMode?: 'user' | 'environment'; error?: string }> {
    const nextMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
    const result = await this.startCamera(nextMode);
    return {
      ...result,
      facingMode: nextMode
    };
  }

  // Stop & teardown camera completely
  stopCamera() {
    if (this.localVideoStream) {
      this.localVideoStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localVideoStream = null;
    }
  }

  // Teardown all active media when leaving room or unmounting
  cleanupAllMedia() {
    this.stopMicrophone();
    this.stopCamera();
  }

  getLocalAudioStream(): MediaStream | null {
    return this.localAudioStream;
  }

  getLocalVideoStream(): MediaStream | null {
    return this.localVideoStream;
  }

  getCurrentFacingMode(): 'user' | 'environment' {
    return this.currentFacingMode;
  }
}

export const mediaStreamService = new MediaStreamService();
