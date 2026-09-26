/**
 * Real Web Audio API Sound Synthesizer for Hekawy Live
 * Provides instant, licensed, commercial-safe sound effects for gifts, fanfares, mic toggles, and room events
 * without depending on external asset downloads. Fully supports independent Gift sound mute and master volume control.
 */

export type GiftTierSoundLevel = 'COMMON' | 'PRETTY' | 'LUXURY' | 'LEGENDARY' | 'VIP' | 'STANDARD' | 'FEATURED' | 'RARE';

class SoundEffectsService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private giftSoundMuted: boolean = false;
  private entranceSoundMuted: boolean = false;
  private masterVolume: number = 0.8;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('hekawy_sound_muted');
      if (savedMute === 'true') {
        this.isMuted = true;
      }
      const savedGiftMute = localStorage.getItem('hekawy_gift_sound_muted');
      if (savedGiftMute === 'true') {
        this.giftSoundMuted = true;
      }
      const savedEntranceMute = localStorage.getItem('hekawy_entrance_sound_muted');
      if (savedEntranceMute === 'true') {
        this.entranceSoundMuted = true;
      }
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('hekawy_sound_muted', String(muted));
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public setGiftSoundMuted(muted: boolean) {
    this.giftSoundMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('hekawy_gift_sound_muted', String(muted));
    }
  }

  public getIsGiftSoundMuted(): boolean {
    return this.giftSoundMuted;
  }

  public toggleGiftSoundMute(): boolean {
    this.setGiftSoundMuted(!this.giftSoundMuted);
    return this.giftSoundMuted;
  }

  public setEntranceSoundMuted(muted: boolean) {
    this.entranceSoundMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('hekawy_entrance_sound_muted', String(muted));
    }
  }

  public getIsEntranceSoundMuted(): boolean {
    return this.entranceSoundMuted;
  }

  public toggleEntranceSoundMute(): boolean {
    this.setEntranceSoundMuted(!this.entranceSoundMuted);
    return this.entranceSoundMuted;
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  private getContext(): AudioContext | null {
    if (this.isMuted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Chime when turning on mic
  playMicOn() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(0.15 * this.masterVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  }

  // Low tone when turning off mic
  playMicOff() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.12 * this.masterVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  }

  // Coin and diamond sound
  playCoinSound() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
      osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08); // E6

      gain.gain.setValueAtTime(0.2 * this.masterVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  }

  /**
   * Professional Tier-Based Gift Audio Engine for 5 Tiers:
   * 1. COMMON (عادية): Gentle soft ping with tender sparkle
   * 2. PRETTY (جميلة): Crystal harmonic arpeggio
   * 3. LUXURY (فخمة): Radiant celebratory brass fanfare
   * 4. LEGENDARY (أسطورية): Cinematic sub-bass boom + triumphant brass chords + star harmonics
   * 5. VIP: Royal imperial coronation fanfare + grand royal chimes
   */
  /**
   * Simple, gentle gift sound effect (بدون أي موسيقى أو فخامة صاخبة)
   * A soft, subtle crystal chime that lasts only ~0.18s
   */
  playGiftSound(_tier: GiftTierSoundLevel, _diamondCost: number = 0, _soundType: string = 'none') {
    if (this.isMuted || this.giftSoundMuted) return;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      // Very simple, gentle, subtle chime (مؤثر صوتي بسيط جداً بدون موسيقى)
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.08); // D6
      gain.gain.setValueAtTime(0.06 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {}
  }

  /**
   * Common Gift Sound (عادية): Soft, delicate warm chime
   */
  public playCommonGiftSound() {
    this.playGiftSound('COMMON');
  }

  /**
   * Pretty Gift Sound (جميلة): Crisp crystal soft chime
   */
  public playPrettyGiftSound() {
    this.playGiftSound('PRETTY');
  }

  /**
   * VIP Imperial Fanfare - Silenced into simple gentle chime (no background fanfare music)
   */
  public playVipImperialFanfare() {
    this.playGiftSound('VIP');
  }

  /**
   * Legendary Fanfare - Silenced into simple gentle chime (no background fanfare music)
   */
  public playLegendaryGrandFanfare() {
    this.playGiftSound('LEGENDARY');
  }

  /**
   * Luxury Fanfare - Silenced into simple gentle chime (no background fanfare music)
   */
  public playLuxuryFanfare() {
    this.playGiftSound('LUXURY');
  }

  /**
   * Rare Crystal Harmonic Chime (5,000 - 19,999 Diamonds)
   * A delicate, crisp 3-note harmonic arpeggio
   */
  public playRareHarmonicChime() {
    if (this.isMuted || this.giftSoundMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const freqs = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.07);
        gain.gain.setValueAtTime(0.12 * this.masterVolume, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.002, now + i * 0.07 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.4);
      });
    } catch {}
  }

  /**
   * Arrival Impact Sound at Recipient Microphone / Seat
   * Produces a distinct landing chime for each tier
   */
  public playArrivalImpact(tier: GiftTierSoundLevel) {
    if (this.isMuted || this.giftSoundMuted) return;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      const baseFreq =
        tier === 'VIP'
          ? 1318.51 // E6
          : tier === 'LEGENDARY'
          ? 1046.50 // C6
          : tier === 'LUXURY'
          ? 880 // A5
          : tier === 'PRETTY' || tier === 'RARE'
          ? 783.99 // G5
          : 659.25; // E5

      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, now + 0.12);

      const vol =
        tier === 'VIP'
          ? 0.24
          : tier === 'LEGENDARY'
          ? 0.18
          : tier === 'LUXURY'
          ? 0.14
          : tier === 'PRETTY' || tier === 'RARE'
          ? 0.08
          : 0.04;

      gain.gain.setValueAtTime(vol * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (tier === 'VIP' ? 0.5 : 0.35));

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + (tier === 'VIP' ? 0.5 : 0.35));
    } catch {}
  }

  // Fast Tap / Combo Sound with Escalating Pitch
  playComboHit(comboCount: number = 1) {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      
      // Pitch increases smoothly with combo streak
      const baseFreq = 440 * Math.pow(1.05, Math.min(24, comboCount));
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, ctx.currentTime + 0.06);
      
      gain.gain.setValueAtTime(0.15 * this.masterVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } catch {}
  }

  // Notification bell
  playNotification() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15 * this.masterVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }

  playTap(pitchMultiplier: number = 1) {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const baseFreq = 500 * Math.min(2.5, pitchMultiplier);
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.12 * this.masterVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }

  playPop() {
    this.playTap(1.1);
  }

  // Error buzz sound
  playError() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.setValueAtTime(120, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15 * this.masterVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  }

  // Room entry sound
  playJoinRoom() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      [440, 554.37, 659.25].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.07);
        gain.gain.setValueAtTime(0.1 * this.masterVolume, ctx.currentTime + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.07);
        osc.stop(ctx.currentTime + 0.4);
      });
    } catch {}
  }

  // --- LIVE ROOM SOUNDBOARD EFFECTS ---
  // 1. Warm Crowd Applause (تصفيق حار)
  playApplause() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const vol = this.masterVolume * 0.4;
      // 12 rapid clapping noise bursts scattered over 1.8 seconds
      for (let i = 0; i < 14; i++) {
        const t = now + i * 0.09 + (Math.random() * 0.04);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180 + Math.random() * 120, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.06);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(900 + Math.random() * 500, t);
        filter.Q.setValueAtTime(1.8, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(vol * (0.6 + Math.random() * 0.4), t + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.08);
      }
    } catch {}
  }

  // 2. Playful Laughter (ضحك ومرح)
  playLaughter() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const vol = this.masterVolume * 0.35;
      const notes = [380, 420, 390, 430, 370, 400, 360];
      notes.forEach((freq, idx) => {
        const t = now + idx * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.9, t + 0.09);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.11);
      });
    } catch {}
  }

  // 3. Suspense Drum Roll (دقة طبل وتشويق)
  playDrumRoll() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const vol = this.masterVolume * 0.4;
      // 16 snare taps building in tempo
      for (let i = 0; i < 16; i++) {
        const progress = i / 16;
        const t = now + i * (0.09 - progress * 0.04);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140 + progress * 40, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(vol * (0.2 + progress * 0.8), t + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.05);
      }
      // Final hit + cymbal crash at 1.1s
      const hitTime = now + 1.05;
      const hitOsc = ctx.createOscillator();
      const hitGain = ctx.createGain();
      hitOsc.type = 'sawtooth';
      hitOsc.frequency.setValueAtTime(90, hitTime);
      hitOsc.frequency.exponentialRampToValueAtTime(40, hitTime + 0.4);
      hitGain.gain.setValueAtTime(vol * 1.2, hitTime);
      hitGain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.5);
      hitOsc.connect(hitGain);
      hitGain.connect(ctx.destination);
      hitOsc.start(hitTime);
      hitOsc.stop(hitTime + 0.5);
    } catch {}
  }

  // 4. Celebratory Horn / Fanfare (بوق احتفالي)
  playHorn() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const vol = this.masterVolume * 0.35;
      const hornNotes = [
        { f: 392, start: 0, dur: 0.16 },     // G4
        { f: 523.25, start: 0.18, dur: 0.16 }, // C5
        { f: 659.25, start: 0.36, dur: 0.16 }, // E5
        { f: 783.99, start: 0.54, dur: 0.45 }  // G5
      ];
      hornNotes.forEach(({ f, start, dur }) => {
        const t = now + start;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, t);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(f * 2.5, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + dur);
      });
    } catch {}
  }

  // 5. Golden Chime / Bell (رنين ذهبي)
  playBell() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const vol = this.masterVolume * 0.3;
      [1046.5, 1318.5, 1567.98, 2093.0].forEach((freq, i) => {
        const t = now + i * 0.07;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.85);
      });
    } catch {}
  }

  // 6. Crowd Cheers (هتاف وحماس)
  playCheer() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const vol = this.masterVolume * 0.3;
      // Rising warm chord progression
      [440, 554.37, 659.25, 880].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq * 0.95, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.08, now + 0.8);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(vol * 0.8, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.25);
      });
    } catch {}
  }

  // 7. Dramatic Stinger / Shock (صدمة درامية)
  playDramaticHit() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const vol = this.masterVolume * 0.45;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.7);

      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.8);
    } catch {}
  }

  // 8. Cheerful Whistle (صفير وتشجيع)
  playWhistle() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const vol = this.masterVolume * 0.35;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(1300, now + 0.35);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch {}
  }

  // Router for soundboard effects
  playRoomEffect(effectId: string) {
    switch (effectId) {
      case 'applause':
        this.playApplause();
        break;
      case 'laughter':
        this.playLaughter();
        break;
      case 'drumroll':
        this.playDrumRoll();
        break;
      case 'horn':
        this.playHorn();
        break;
      case 'bell':
        this.playBell();
        break;
      case 'cheer':
        this.playCheer();
        break;
      case 'drama':
        this.playDramaticHit();
        break;
      case 'whistle':
        this.playWhistle();
        break;
      default:
        this.playPop();
    }
  }

  // 3D Cinematic Entrance Sound Effects
  playEntranceSound(soundType: string, isOwner?: boolean) {
    if (this.isMuted || this.entranceSoundMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const vol = this.masterVolume;

      // 1. Owner Royal Fanfare - (Silenced, no entrance music)
      if (isOwner || soundType === 'royal_fanfare') {
        return;
      }

      // 2. Supercar / Hypercar - Deep V12 Engine Roar & Turbo Whistle
      if (soundType === 'supercar') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(65, now);
        osc.frequency.exponentialRampToValueAtTime(190, now + 1.2);
        osc.frequency.exponentialRampToValueAtTime(140, now + 2.2);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(1200, now + 1.2);
        filter.frequency.exponentialRampToValueAtTime(450, now + 2.4);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.24 * vol, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 2.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 2.5);
        return;
      }

      // 3. Superbike / Chopper - Throaty Twin Rumble
      if (soundType === 'bike') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(55, now);
        osc.frequency.linearRampToValueAtTime(120, now + 0.9);
        osc.frequency.linearRampToValueAtTime(90, now + 2.0);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.22 * vol, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 2.0);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.1);
        return;
      }

      // 4. Jet / Helicopter - Aviation Turbine & Flight Whoosh
      if (soundType === 'jet' || soundType === 'helicopter') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 1.5);
        osc.frequency.exponentialRampToValueAtTime(260, now + 2.5);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.linearRampToValueAtTime(1800, now + 1.5);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.18 * vol, now + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 2.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.6);
        return;
      }

      // 5. Mega Yacht - Deep Nautical Ship Horn
      if (soundType === 'yacht') {
        [110, 138.59, 164.81].forEach(f => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, now);

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(400, now);

          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(0.14 * vol, now + 0.3);
          gain.gain.exponentialRampToValueAtTime(0.005, now + 2.2);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 2.3);
        });
        return;
      }

      // 6. Falcon & Eagle - Soaring Raptor Screech & Wind
      if (soundType === 'falcon' || soundType === 'eagle') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(2800, now + 0.35);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 1.2);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.16 * vol, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 1.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.4);
        return;
      }

      // 7. Luminous Dove - Celestial Melodic Bells
      if (soundType === 'dove') {
        const notes = [659.25, 783.99, 987.77, 1318.51, 1567.98];
        notes.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + idx * 0.12);

          gain.gain.setValueAtTime(0.01, now + idx * 0.12);
          gain.gain.linearRampToValueAtTime(0.15 * vol, now + idx * 0.12 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.002, now + idx * 0.12 + 0.9);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 1.0);
        });
        return;
      }

      // 8. Arabian Steed - Gallop & Noble Fanfare
      if (soundType === 'steed') {
        const fanfare = [392.00, 523.25, 659.25, 783.99];
        fanfare.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + idx * 0.14);

          gain.gain.setValueAtTime(0.01, now + idx * 0.14);
          gain.gain.linearRampToValueAtTime(0.16 * vol, now + idx * 0.14 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.14 + 0.8);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.14);
          osc.stop(now + idx * 0.14 + 0.9);
        });
        return;
      }

      // 9. Galactic Star Cruiser - Sci-Fi Warp Pulse
      if (soundType === 'space') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 1.0);
        osc.frequency.exponentialRampToValueAtTime(180, now + 2.0);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.16 * vol, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 2.0);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.1);
        return;
      }

      // 10. Obsidian Dragon - Mythic Sub-bass & Flame
      if (soundType === 'dragon') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(70, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.6);
        osc.frequency.exponentialRampToValueAtTime(45, now + 2.2);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.22 * vol, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 2.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.4);
        return;
      }

      // 11. Free Starlight Sparkle (Default)
      const sparkleNotes = [880, 1174.66, 1396.91, 1760];
      sparkleNotes.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.09);

        gain.gain.setValueAtTime(0.01, now + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.12 * vol, now + idx * 0.09 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.09 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.7);
      });
    } catch {}
  }

  // --- 4D CINEMATIC ROYAL CAR ENTRANCE SOUNDS ---

  // 0. Powerful Cinematic Opening Hit & Hans-Zimmer-style Sub-Bass Braam
  playCinematicCarAppearanceImpact() {
    if (this.isMuted || this.entranceSoundMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const vol = this.masterVolume;

      // Deep cinematic sub-bass braam boom
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(80, now);
      subOsc.frequency.exponentialRampToValueAtTime(32, now + 1.6);

      const subFilter = ctx.createBiquadFilter();
      subFilter.type = 'lowpass';
      subFilter.frequency.setValueAtTime(160, now);
      subFilter.frequency.exponentialRampToValueAtTime(60, now + 1.6);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.24 * vol, now + 0.08);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      subOsc.connect(subFilter);
      subFilter.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 1.9);

      // Regal low brass chord swell
      [55.0, 110.0, 164.81].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.04);
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.12 * vol, now + 0.2);
        g.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.3);
      });
    } catch {}
  }

  // 0.1 Majestic Royal Cinematic Orchestral Score Progression - (Silenced, no entrance music)
  playCinematicRoyalScore() {
    // Entrance music deleted completely as requested
    return;
  }

  // 1. Luxury Limousine Approach (Velvet V12 Purr & Tire Glide)
  playCinematicCarApproach() {
    if (this.isMuted || this.entranceSoundMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const vol = this.masterVolume;

      // Low V12 hum
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(48, now);
      osc.frequency.linearRampToValueAtTime(70, now + 0.6);
      osc.frequency.linearRampToValueAtTime(42, now + 1.2);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, now);
      filter.frequency.linearRampToValueAtTime(240, now + 0.6);
      filter.frequency.linearRampToValueAtTime(90, now + 1.2);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18 * vol, now + 0.3);
      gain.gain.linearRampToValueAtTime(0.12 * vol, now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.3);
    } catch {}
  }

  // 1.1 Smooth Car Turn & Pneumatic Deceleration
  playCinematicCarTurnAndDecelerate() {
    if (this.isMuted || this.entranceSoundMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const vol = this.masterVolume;

      // Air suspension & gentle tire grip glide
      const noise = ctx.createOscillator();
      const noiseFilter = ctx.createBiquadFilter();
      const noiseGain = ctx.createGain();

      noise.type = 'sawtooth';
      noise.frequency.setValueAtTime(65, now);
      noise.frequency.exponentialRampToValueAtTime(35, now + 0.5);

      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(220, now);
      noiseFilter.frequency.linearRampToValueAtTime(80, now + 0.5);

      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.linearRampToValueAtTime(0.10 * vol, now + 0.1);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.6);
    } catch {}
  }

  // 1.2 Smooth Velvet Car Acceleration & Departure
  playCinematicCarDeparture() {
    if (this.isMuted || this.entranceSoundMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const vol = this.masterVolume;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(45, now);
      osc.frequency.linearRampToValueAtTime(75, now + 0.6);
      osc.frequency.exponentialRampToValueAtTime(30, now + 1.2);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, now);
      filter.frequency.linearRampToValueAtTime(280, now + 0.6);
      filter.frequency.exponentialRampToValueAtTime(50, now + 1.2);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.14 * vol, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.3);
    } catch {}
  }

  // 1.3 Smooth Door Close Soft Click
  playCinematicDoorClose() {
    if (this.isMuted || this.entranceSoundMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const vol = this.masterVolume;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.08);

      gain.gain.setValueAtTime(0.18 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }

  // 2. High-intensity Laser Headlights Flash & Beam Ignition
  playCinematicHeadlights() {
    if (this.isMuted || this.entranceSoundMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const vol = this.masterVolume;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(1480, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.6);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.16 * vol, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.002, now + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.75);
    } catch {}
  }

  // 3. Motorized Latch Release & Soft Hydraulic Door Open
  playCinematicDoorOpen() {
    if (this.isMuted || this.entranceSoundMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const vol = this.masterVolume;

      // Click/latch
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(680, now);
      osc1.frequency.exponentialRampToValueAtTime(220, now + 0.08);
      gain1.gain.setValueAtTime(0.20 * vol, now);
      gain1.gain.exponentialRampToValueAtTime(0.005, now + 0.1);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      // Smooth pneumatic glide
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      const filter2 = ctx.createBiquadFilter();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(110, now + 0.08);
      osc2.frequency.linearRampToValueAtTime(85, now + 0.6);

      filter2.type = 'bandpass';
      filter2.frequency.setValueAtTime(350, now + 0.08);

      gain2.gain.setValueAtTime(0.001, now + 0.08);
      gain2.gain.linearRampToValueAtTime(0.12 * vol, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc2.connect(filter2);
      filter2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.7);
    } catch {}
  }

  // 3.1 Dramatic Man Emergence Cinematic Impact & Brass Hit
  playCinematicManStepImpact() {
    if (this.isMuted || this.entranceSoundMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const vol = this.masterVolume;

      // Resonant floor presence hit
      const impactOsc = ctx.createOscillator();
      const impactGain = ctx.createGain();
      impactOsc.type = 'sine';
      impactOsc.frequency.setValueAtTime(140, now);
      impactOsc.frequency.exponentialRampToValueAtTime(38, now + 0.6);

      impactGain.gain.setValueAtTime(0.24 * vol, now);
      impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      impactOsc.connect(impactGain);
      impactGain.connect(ctx.destination);
      impactOsc.start(now);
      impactOsc.stop(now + 0.75);

      // Shimmering royal brass accent
      [440.0, 659.25, 880.0].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.001, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.14 * vol, now + idx * 0.04 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.002, now + idx * 0.04 + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 1.3);
      });
    } catch {}
  }

  // 4. Subtle, Resonant Royal Step Resonance
  playCinematicKingSteps() {
    if (this.isMuted || this.entranceSoundMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const vol = this.masterVolume;

      // Soft low thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);

      gain.gain.setValueAtTime(0.15 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  // 5. Imperial Mic Arrival Crest & Brass Chime
  playCinematicMicArrival() {
    if (this.isMuted || this.entranceSoundMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const vol = this.masterVolume;

      const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.001, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.18 * vol, now + idx * 0.06 + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.002, now + idx * 0.06 + 1.05);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 1.1);
      });
    } catch {}
  }

  // 6. Multi-Stage 20-Second VIP Cinematic Soundtrack Synthesizer
  playCinematic20sVipTrack() {
    if (this.isMuted || this.entranceSoundMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const vol = this.masterVolume;

      // Stage 1: Sub-Bass Impact & Engine Ignition
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(40, now);
      subOsc.frequency.exponentialRampToValueAtTime(140, now + 2.5);
      subGain.gain.setValueAtTime(0.25 * vol, now);
      subGain.gain.linearRampToValueAtTime(0.15 * vol, now + 5.0);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 18.0);
      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 18.5);

      // Stage 2: Laser Ignition Pulse at 3.0s
      setTimeout(() => {
        this.playCinematicHeadlights();
      }, 3000);

      // Stage 3: Door Latch Release at 8.0s
      setTimeout(() => {
        this.playCinematicDoorOpen();
      }, 8000);

      // Stage 4: Imperial Royal Fanfare Chord at 12.0s
      setTimeout(() => {
        this.playCinematicMicArrival();
        this.playCinematicManStepImpact();
      }, 12000);
    } catch {}
  }

  /**
   * 🏎️ Web Audio API Real-time Supercar Engine Roar & Motion Synthesizer
   * Synchronizes V12/V10 engine rumble, revs, gear shifts, deceleration pops,
   * and idling hum directly with 5D car entrance animation stages.
   */
  public createSupercarEngineRoarController() {
    if (this.isMuted || this.entranceSoundMuted) {
      return {
        setStage: () => {},
        setMuted: () => {},
        stop: () => {}
      };
    }

    const ctx = this.getContext();
    if (!ctx) {
      return {
        setStage: () => {},
        setMuted: () => {},
        stop: () => {}
      };
    }

    try {
      const now = ctx.currentTime;
      const masterVol = this.masterVolume;

      // Master Gain Node for Engine Controller
      const engineGainNode = ctx.createGain();
      engineGainNode.gain.setValueAtTime(0.001, now);
      engineGainNode.gain.linearRampToValueAtTime(0.35 * masterVol, now + 0.3);

      // Main Filter for Engine Throttle & Resonance
      const engineFilter = ctx.createBiquadFilter();
      engineFilter.type = 'lowpass';
      engineFilter.frequency.setValueAtTime(250, now);
      engineFilter.Q.setValueAtTime(3.5, now);

      // Panner Node for Spatial Left -> Center -> Right Stereo Glides
      let pannerNode: StereoPannerNode | null = null;
      if (typeof ctx.createStereoPanner === 'function') {
        pannerNode = ctx.createStereoPanner();
        pannerNode.pan.setValueAtTime(-0.6, now); // Starts left as car approaches
        engineGainNode.connect(engineFilter);
        engineFilter.connect(pannerNode);
        pannerNode.connect(ctx.destination);
      } else {
        engineGainNode.connect(engineFilter);
        engineFilter.connect(ctx.destination);
      }

      // 1. Primary Engine V12 Fundamental Oscillator (Sawtooth)
      const oscV12 = ctx.createOscillator();
      oscV12.type = 'sawtooth';
      oscV12.frequency.setValueAtTime(42, now); // Base idle RPM

      // 2. Secondary Harmonic Sub-Oscillator (Square for deep rumble)
      const oscSub = ctx.createOscillator();
      oscSub.type = 'square';
      oscSub.frequency.setValueAtTime(21, now); // Sub-octave

      // 3. High Turbo Spool Whine (Sine Wave)
      const oscTurbo = ctx.createOscillator();
      const turboGain = ctx.createGain();
      oscTurbo.type = 'sine';
      oscTurbo.frequency.setValueAtTime(950, now);
      turboGain.gain.setValueAtTime(0.02 * masterVol, now);

      oscV12.connect(engineGainNode);
      oscSub.connect(engineGainNode);
      oscTurbo.connect(turboGain);
      turboGain.connect(engineGainNode);

      oscV12.start(now);
      oscSub.start(now);
      oscTurbo.start(now);

      let isStopped = false;

      return {
        /**
         * Dynamic Stage Pitch & Throttle Sync
         */
        setStage: (stageName: string) => {
          if (isStopped || !ctx) return;
          const t = ctx.currentTime;

          switch (stageName) {
            case 'ESTABLISHING':
            case 'IGNITION':
              // Ignition Rumble
              oscV12.frequency.cancelScheduledValues(t);
              engineFilter.frequency.cancelScheduledValues(t);
              oscV12.frequency.setValueAtTime(35, t);
              oscV12.frequency.exponentialRampToValueAtTime(120, t + 0.4);
              engineFilter.frequency.setValueAtTime(300, t);
              engineFilter.frequency.exponentialRampToValueAtTime(900, t + 0.4);
              if (pannerNode) pannerNode.pan.linearRampToValueAtTime(-0.4, t + 0.5);
              break;

            case 'HEADLIGHTS_APPROACH':
            case 'CAR_APPROACH':
              // Full Acceleration & High Revs
              oscV12.frequency.cancelScheduledValues(t);
              oscSub.frequency.cancelScheduledValues(t);
              engineFilter.frequency.cancelScheduledValues(t);
              oscTurbo.frequency.cancelScheduledValues(t);

              oscV12.frequency.linearRampToValueAtTime(185, t + 0.8);
              oscSub.frequency.linearRampToValueAtTime(92.5, t + 0.8);
              engineFilter.frequency.exponentialRampToValueAtTime(1850, t + 0.8);
              oscTurbo.frequency.exponentialRampToValueAtTime(2400, t + 0.8);
              if (pannerNode) pannerNode.pan.linearRampToValueAtTime(-0.1, t + 0.8);
              break;

            case 'CAR_EMERGE':
            case 'GEAR_SHIFT':
              // Gear Shift Drop & Secondary Throttle Burst
              oscV12.frequency.cancelScheduledValues(t);
              engineFilter.frequency.cancelScheduledValues(t);
              oscV12.frequency.setValueAtTime(115, t); // Drop on clutch
              oscV12.frequency.exponentialRampToValueAtTime(195, t + 0.7); // Secondary rev
              engineFilter.frequency.setValueAtTime(800, t);
              engineFilter.frequency.exponentialRampToValueAtTime(2100, t + 0.7);
              if (pannerNode) pannerNode.pan.linearRampToValueAtTime(0.0, t + 0.7);
              break;

            case 'HERO_MANEUVER':
            case 'CAR_TURN':
              // Tire Friction + Engine Brake Deceleration
              oscV12.frequency.cancelScheduledValues(t);
              engineFilter.frequency.cancelScheduledValues(t);
              oscV12.frequency.linearRampToValueAtTime(130, t + 0.9);
              engineFilter.frequency.linearRampToValueAtTime(950, t + 0.9);
              if (pannerNode) pannerNode.pan.linearRampToValueAtTime(0.2, t + 0.9);
              break;

            case 'HERO_HALT_LIGHTSWEEP':
            case 'CAR_HALT':
              // Full Halt to Deep V12 Idling Rumble
              oscV12.frequency.cancelScheduledValues(t);
              oscSub.frequency.cancelScheduledValues(t);
              engineFilter.frequency.cancelScheduledValues(t);
              oscTurbo.frequency.cancelScheduledValues(t);

              oscV12.frequency.exponentialRampToValueAtTime(52, t + 0.8);
              oscSub.frequency.exponentialRampToValueAtTime(26, t + 0.8);
              engineFilter.frequency.exponentialRampToValueAtTime(380, t + 0.8);
              oscTurbo.frequency.exponentialRampToValueAtTime(800, t + 0.8);
              if (pannerNode) pannerNode.pan.linearRampToValueAtTime(0.0, t + 0.8);
              break;

            case 'DOOR_OPEN_REVEAL':
            case 'DOOR_OPEN':
              // Background Idle Hum during Door Open
              engineGainNode.gain.cancelScheduledValues(t);
              engineGainNode.gain.linearRampToValueAtTime(0.12 * masterVol, t + 0.5);
              oscV12.frequency.linearRampToValueAtTime(46, t + 0.5);
              engineFilter.frequency.linearRampToValueAtTime(320, t + 0.5);
              break;

            case 'OUTRO':
            case 'EXIT':
              // Smooth Fade-out
              engineGainNode.gain.cancelScheduledValues(t);
              engineGainNode.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
              break;

            default:
              break;
          }
        },

        setMuted: (muted: boolean) => {
          if (isStopped || !ctx) return;
          const t = ctx.currentTime;
          engineGainNode.gain.cancelScheduledValues(t);
          if (muted) {
            engineGainNode.gain.linearRampToValueAtTime(0, t + 0.05);
          } else {
            engineGainNode.gain.linearRampToValueAtTime(0.25 * masterVol, t + 0.1);
          }
        },

        stop: () => {
          if (isStopped || !ctx) return;
          isStopped = true;
          try {
            const t = ctx.currentTime;
            engineGainNode.gain.cancelScheduledValues(t);
            engineGainNode.gain.linearRampToValueAtTime(0.0001, t + 0.1);
            setTimeout(() => {
              try {
                oscV12.stop();
                oscSub.stop();
                oscTurbo.stop();
              } catch {}
            }, 120);
          } catch {}
        }
      };
    } catch {
      return {
        setStage: () => {},
        setMuted: () => {},
        stop: () => {}
      };
    }
  }
}

export const soundEffects = new SoundEffectsService();

