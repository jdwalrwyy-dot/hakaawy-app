import React, { useState } from 'react';
import { Room, User, MicLayoutType } from '../types';
import { API } from '../services/api';
import { socketService } from '../services/socketService';
import { soundEffects } from '../services/soundEffects';
import {
  X,
  Settings,
  Image as ImageIcon,
  Upload,
  CheckCircle,
  Crown,
  Sparkles,
  Sliders,
  Check,
  AlertCircle,
  Minus,
  Plus,
  Volume2,
  VolumeX,
  Car,
  Mic,
  Music,
  Play,
  Zap,
  Flame,
  Shield,
  Trash2
} from 'lucide-react';

interface RoomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  currentUser: User;
  onRoomUpdated?: (updatedRoom: Room, newSeats?: any[]) => void;
  onOpenEntrancesShop?: () => void;
  onTriggerLiveEntrance?: (entranceId?: string) => void;
}

const PRESET_BACKGROUNDS = [
  {
    id: 'stage_night',
    title: 'المسرح الملكي الليلي',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&auto=format&fit=crop&q=80'
  },
  {
    id: 'gold_luxury',
    title: 'الصالون الذهبي الفاخر',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1000&auto=format&fit=crop&q=80'
  },
  {
    id: 'neon_cyber',
    title: 'أضواء النيون الساحرة',
    url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1000&auto=format&fit=crop&q=80'
  },
  {
    id: 'acoustic_lounge',
    title: 'جلسة طرب هادئة',
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1000&auto=format&fit=crop&q=80'
  },
  {
    id: 'deep_space',
    title: 'أفق النجوم والمجرات',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1000&auto=format&fit=crop&q=80'
  },
  {
    id: 'emerald_aurora',
    title: 'الشفق الزمردي',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1000&auto=format&fit=crop&q=80'
  }
];

const LAYOUT_OPTIONS: { id: MicLayoutType; label: string; desc: string; icon: string; count: number; rows: string }[] = [
  { id: '4', label: '4 مايكات', desc: 'صف واحد مدمج (4 مقاعد)', icon: '⚡', count: 4, rows: '4' },
  { id: '8', label: '8 مايكات', desc: 'صفين كلاسيكيين (4 + 4)', icon: '📻', count: 8, rows: '4 + 4' },
  { id: '10', label: '10 مايكات', desc: 'صفين متوازيين (5 + 5)', icon: '🎙️', count: 10, rows: '5 + 5' },
  { id: '2+10', label: '12 مايك', desc: 'مضيف ونائب VIP + 10 مايكات', icon: '👑', count: 12, rows: '2 + 5 + 5' },
  { id: '15', label: '15 مايك', desc: '3 صفوف متوازية (5 + 5 + 5)', icon: '💎', count: 15, rows: '5 + 5 + 5' },
  { id: '2+15', label: '17 مايك', desc: 'مضيف ونائب VIP + 15 مايك', icon: '🌟', count: 17, rows: '2 + 5 + 5 + 5' }
];

const SOUNDBOARD_EFFECTS = [
  { id: 'applause', title: 'تصفيق حار', icon: '👏', desc: 'تشجيع وحرارة للمايك' },
  { id: 'cheer', title: 'هتاف الجمهور', icon: '🎉', desc: 'حماس وتشجيع جماهيري' },
  { id: 'laughter', title: 'ضحك وفكاهة', icon: '😂', desc: 'ضحك ومرح لطيف' },
  { id: 'drumroll', title: 'دقة طبل', icon: '🥁', desc: 'تشويق وإثارة النتيجة' },
  { id: 'horn', title: 'بوق ملكي', icon: '🎺', desc: 'احتفال ومجد ملكي' },
  { id: 'bell', title: 'رنين ذهبي', icon: '🔔', desc: 'رنين بلوري سحري' },
  { id: 'drama', title: 'صدمة درامية', icon: '⚡', desc: 'إثارة ومفاجأة قوية' },
  { id: 'whistle', title: 'صفير تحية', icon: '🎵', desc: 'تحية وتشجيع نشط' }
];

const GARAGE_RIDES = [
  {
    id: 'entrance_king_limousine',
    name: 'سيارة الملك الليموزين الفاخرة 3D',
    badge: 'المركبة الملكية الإمبراطورية',
    icon: '👑',
    desc: 'وصول موكب الليموزين مع إضاءة ليزر وترحيب مهيب (5 ثوانٍ)',
    isVip: true
  },
  {
    id: 'entrance_owner_imperial_throne',
    name: 'العرش الإمبراطوري الذهبي',
    badge: 'عرش السيادة والذهب',
    icon: '🏛️',
    desc: 'هبوط العرش الملكي المرصع بالياقوت والذهب مع موكب شرف',
    isVip: true
  },
  {
    id: 'entrance_royal_stallion',
    name: 'موكب الخيل العربية الأصيلة',
    badge: 'أصالة الملوك',
    icon: '🐎',
    desc: 'موكب الخيول العربية الأصيلة مع حوافر ذهبية وأهازيج الفخر',
    isVip: false
  },
  {
    id: 'entrance_private_jet',
    name: 'طائرة رجال الأعمال النفاثة VIP',
    badge: 'أجنحة السحاب',
    icon: '✈️',
    desc: 'تحليق الطائرة النفاثة الخاصة مع إضاءة المدرج وسحب الدخان',
    isVip: false
  },
  {
    id: 'entrance_golden_yacht',
    name: 'اليخت الملكي الذهبي',
    badge: 'أمواج الذهب',
    icon: '🛥️',
    desc: 'إبحار اليخت الفاخر وسط مياه زمردية وأمواج ذهبية متلألئة',
    isVip: false
  },
  {
    id: 'entrance_legendary_dragon',
    name: 'التنين الذهبي الأسطوري',
    badge: 'أسطورة الشرق',
    icon: '🐉',
    desc: 'هبوط التنين الذهبي مع زفير اللهب والألعاب النارية',
    isVip: true
  }
];

export const RoomSettingsModal: React.FC<RoomSettingsModalProps> = ({
  isOpen,
  onClose,
  room,
  currentUser,
  onRoomUpdated,
  onOpenEntrancesShop,
  onTriggerLiveEntrance
}) => {
  const isHost = room.hostId === currentUser.id || currentUser.role === 'ADMIN' || currentUser.role === 'OWNER';

  // Primary navigation tab inside "الضبط": "التأثيرات" | "الطراج" | "إعدادات الغرفة"
  const [activeTab, setActiveTab] = useState<'effects' | 'garage' | 'room'>('effects');

  // Room host settings
  const [title, setTitle] = useState(room.title);
  const [description, setDescription] = useState(room.description || '');
  const [coverImage, setCoverImage] = useState(room.coverImage);
  const [micLayout, setMicLayout] = useState<MicLayoutType>(room.micLayout || '2+10');
  const [customImageError, setCustomImageError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Audio & Effects states
  const [isGiftSoundMuted, setIsGiftSoundMuted] = useState(soundEffects.getIsGiftSoundMuted());
  const [isEntranceSoundMuted, setIsEntranceSoundMuted] = useState(soundEffects.getIsEntranceSoundMuted());
  const [activeEffectPlaying, setActiveEffectPlaying] = useState<string | null>(null);
  const [echoMode, setEchoMode] = useState<'normal' | 'light' | 'stage' | 'karaoke'>('normal');
  const [effectsVolume, setEffectsVolume] = useState<number>(85);

  // Al-Taraj Tuning & EQ states
  const [tarabPreset, setTarabPreset] = useState<'tarab' | 'broadcast' | 'studio' | 'chat'>('tarab');
  const [bassLevel, setBassLevel] = useState<number>(65);
  const [midLevel, setMidLevel] = useState<number>(50);
  const [trebleLevel, setTrebleLevel] = useState<number>(60);
  const [actionNotice, setActionNotice] = useState<string>('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setCustomImageError('حجم الصورة يجب أن لا يتجاوز 4 ميجابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCoverImage(result);
        setCustomImageError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNextLayout = () => {
    const currentIndex = LAYOUT_OPTIONS.findIndex(l => l.id === micLayout);
    const nextIndex = (currentIndex + 1) % LAYOUT_OPTIONS.length;
    setMicLayout(LAYOUT_OPTIONS[nextIndex].id);
  };

  const handlePrevLayout = () => {
    const currentIndex = LAYOUT_OPTIONS.findIndex(l => l.id === micLayout);
    const prevIndex = (currentIndex - 1 + LAYOUT_OPTIONS.length) % LAYOUT_OPTIONS.length;
    setMicLayout(LAYOUT_OPTIONS[prevIndex].id);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isHost) {
      setErrorMessage('صاحب الغرفة فقط يملك صلاحية تعديل الإعدادات');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('اسم الغرفة مطلوب');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      socketService.updateRoomSettings(room.id, currentUser.id, {
        title: title.trim(),
        coverImage,
        description: description.trim(),
        micLayout
      });

      const result = await API.updateRoomSettings(room.id, currentUser.id, {
        title: title.trim(),
        coverImage,
        description: description.trim(),
        micLayout
      });

      setSuccessMessage('تم حفظ وتطبيق إعدادات الغرفة مباشرة!');
      if (onRoomUpdated && result.room) {
        onRoomUpdated(result.room, result.seats);
      }

      setTimeout(() => {
        setIsSubmitting(false);
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'تعذر حفظ الإعدادات، يرجى المحاولة ثانية');
      setIsSubmitting(false);
    }
  };

  // Play Soundboard effect locally and broadcast to room
  const handlePlaySoundboardEffect = (effectId: string, effectTitle: string) => {
    setActiveEffectPlaying(effectId);
    soundEffects.playRoomEffect(effectId);

    // Broadcast through socket so everyone in room hears it
    socketService.playRoomEffect(room.id, currentUser.id, effectId, currentUser.name);

    setActionNotice(`تم إرسال مؤثر: ${effectTitle} للغرفة 🔊`);
    setTimeout(() => {
      setActiveEffectPlaying(null);
    }, 1200);
    setTimeout(() => {
      setActionNotice('');
    }, 2500);
  };

  // Trigger live entrance preview
  const handlePreviewEntrance = (entranceId?: string) => {
    if (onTriggerLiveEntrance) {
      onTriggerLiveEntrance(entranceId);
      setActionNotice('تم تشغيل تجربة الدخلة الحية في الغرفة! ✨');
      setTimeout(() => setActionNotice(''), 3000);
    } else {
      socketService.triggerEntrance(room.id, currentUser.id, entranceId);
      setActionNotice('تم تشغيل تجربة الدخلة في الغرفة! ✨');
      setTimeout(() => setActionNotice(''), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-right"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-400/10 border border-amber-500/30 text-amber-400">
              <Sliders className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-100 flex items-center gap-1.5">
                <span>أدوات الغرفة والمؤثرات</span>
                {isHost && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    صاحب الغرفة 👑
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">خيارات التأثيرات، الطراج، وضبط نغمات الصوت</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Selection Options: "التأثيرات" | "الطراج" */}
        <div className="p-3 bg-slate-950/70 border-b border-slate-800/80 shrink-0">
          <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
            {/* Option 1: التأثيرات */}
            <button
              type="button"
              id="tab-effects-btn"
              onClick={() => setActiveTab('effects')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs transition-all cursor-pointer ${
                activeTab === 'effects'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/25 scale-[1.02]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>التأثيرات</span>
            </button>

            {/* Option 2: الطراج */}
            <button
              type="button"
              id="tab-garage-btn"
              onClick={() => setActiveTab('garage')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs transition-all cursor-pointer ${
                activeTab === 'garage'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/25 scale-[1.02]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>الطراج</span>
            </button>
          </div>

          {/* Optional Host Tab for Room Settings */}
          {isHost && (
            <div className="mt-2 flex justify-center">
              <button
                type="button"
                id="tab-room-settings-btn"
                onClick={() => setActiveTab('room')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  activeTab === 'room'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-800/60 border border-slate-700/60'
                }`}
              >
                <Settings className="w-3 h-3 text-amber-400" />
                <span>إعدادات الغرفة والخلفية والمايكات (خاص بالمضيف)</span>
              </button>
            </div>
          )}
        </div>

        {/* Action / Feedback Banner */}
        {actionNotice && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
            <Volume2 className="w-4 h-4 animate-pulse text-amber-400" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* =========================================================================
              VIEW 1: التأثيرات (Soundboard & Audio FX Controls)
             ========================================================================= */}
          {activeTab === 'effects' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Soundboard Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>المؤثرات الصوتية الحية</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    اضغط لتشغيل مؤثر صوتي فوري يسمعه جميع الحاضرين في الغرفة
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700 font-bold">
                  بث مباشر 🔊
                </span>
              </div>

              {/* 8 Soundboard Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {SOUNDBOARD_EFFECTS.map((eff) => {
                  const isPlaying = activeEffectPlaying === eff.id;
                  return (
                    <button
                      key={eff.id}
                      type="button"
                      onClick={() => handlePlaySoundboardEffect(eff.id, eff.title)}
                      className={`relative p-3 rounded-2xl border text-right transition-all flex flex-col justify-between h-24 active:scale-95 cursor-pointer ${
                        isPlaying
                          ? 'bg-amber-500/25 border-amber-400 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400'
                          : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-2xl">{eff.icon}</span>
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isPlaying
                              ? 'bg-amber-400 text-slate-950 animate-spin-slow'
                              : 'bg-slate-900/80 text-slate-400 border border-slate-700'
                          }`}
                        >
                          <Play className="w-3 h-3 fill-current" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-100">{eff.title}</h4>
                        <p className="text-[10px] text-slate-400 truncate">{eff.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Sound & Audio Controls Section */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>التحكم في أصوات ومؤثرات الغرفة</span>
                </h4>

                {/* Gift Sound Mute Switch */}
                <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-xl border ${
                        isGiftSoundMuted
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      }`}
                    >
                      {isGiftSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-100 block">أصوات الهدايا الفاخرة</span>
                      <p className="text-[10px] text-slate-400">
                        {isGiftSoundMuted ? 'وضع الهدوء (كتم أصوات الهدايا)' : 'تشغيل النغمات الموسيقية للهدايا الكبرى'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !isGiftSoundMuted;
                      setIsGiftSoundMuted(next);
                      soundEffects.setGiftSoundMuted(next);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                      !isGiftSoundMuted ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ${
                        !isGiftSoundMuted ? 'translate-x-0' : '-translate-x-5'
                      }`}
                    />
                  </button>
                </div>

                {/* Entrance Sound Mute Switch */}
                <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-xl border ${
                        isEntranceSoundMuted
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      }`}
                    >
                      {isEntranceSoundMuted ? <VolumeX className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-100 block">أصوات ومؤثرات الدخول</span>
                      <p className="text-[10px] text-slate-400">
                        {isEntranceSoundMuted ? 'كتم مؤثرات دخول الغرفة' : 'تشغيل المؤثرات الصوتية للدخول'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = soundEffects.toggleEntranceSoundMute();
                      setIsEntranceSoundMuted(next);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                      !isEntranceSoundMuted ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ${
                        !isEntranceSoundMuted ? 'translate-x-0' : '-translate-x-5'
                      }`}
                    />
                  </button>
                </div>

                {/* Mic Echo / Reverb Modes */}
                <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-amber-400" />
                      <span>صدى الصوت للمايك (Echo & Reverb)</span>
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono font-bold">
                      {echoMode === 'normal'
                        ? 'عادي (بدون صدى)'
                        : echoMode === 'light'
                        ? 'صدى خفيف'
                        : echoMode === 'stage'
                        ? 'مسرحي واسع'
                        : 'كاريوكي غنائي'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[
                      { id: 'normal', label: 'طبيعي' },
                      { id: 'light', label: 'خفيف' },
                      { id: 'stage', label: 'مسرح' },
                      { id: 'karaoke', label: 'كاريوكي' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setEchoMode(mode.id as any)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          echoMode === mode.id
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                            : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Volume Slider */}
                <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-100 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>مستوى صوت المؤثرات العامة</span>
                    </span>
                    <span className="text-amber-400 font-mono font-bold">{effectsVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={effectsVolume}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEffectsVolume(val);
                      soundEffects.setMasterVolume(val / 100);
                    }}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 2: الطراج (Car & Mount Entrances Garage & Pitch Tuning / الطرب)
             ========================================================================= */}
          {activeTab === 'garage' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Garage Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-amber-400" />
                    <span>الطراج - كراج المركبات والدخولات الفاخرة</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    استعراض وتفعيل سيارات ومواكب الدخولات ثلاثية الأبعاد 3D
                  </p>
                </div>
                {onOpenEntrancesShop && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenEntrancesShop();
                    }}
                    className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[11px] font-black shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    متجر الدخولات 🛍️
                  </button>
                )}
              </div>

              {/* Empty Garage Notification */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                  <Car className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-100">كراج الدخولات المركبية فارغ حالياً</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    تم تفريغ جميع الدخولات القديمة بالكامل. يمكنك تصفح وإضافة دخولات جديدة من خلال متجر الدخولات أو لوحة الإدارة.
                  </p>
                </div>
                {onOpenEntrancesShop && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenEntrancesShop();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>فتح متجر الدخولات</span>
                    <span>🛍️</span>
                  </button>
                )}
              </div>

              {/* Tarab Audio Pitch & Equalizer Tuning */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-amber-400" />
                    <span>موالفة الصوت ونبرات الطرب (Equalizer & Tuning)</span>
                  </h4>
                  <span className="text-[10px] text-amber-400 font-mono">طرب ومايك 🎶</span>
                </div>

                {/* Tarab Style Presets */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { id: 'tarab', title: 'طرب أصيل', icon: '🎶', desc: 'دافئ وعميق' },
                    { id: 'broadcast', title: 'إذاعي نقي', icon: '🎙️', desc: 'واضح وفائق النقاء' },
                    { id: 'studio', title: 'استوديو غنائي', icon: '🎤', desc: 'ممتلئ وعريض' },
                    { id: 'chat', title: 'حوار هادئ', icon: '💬', desc: 'ناعم ومريح' }
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setTarabPreset(preset.id as any)}
                      className={`p-2 rounded-xl border text-right transition-all cursor-pointer ${
                        tarabPreset === preset.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-base block mb-0.5">{preset.icon}</span>
                      <span className="text-xs font-bold block">{preset.title}</span>
                      <span className="text-[9px] text-slate-400">{preset.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Equalizer Sliders */}
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2.5">
                  {/* Bass */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300">جهير الصوت (Bass - دفء وعمق):</span>
                      <span className="text-amber-400 font-mono">{bassLevel}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={bassLevel}
                      onChange={(e) => setBassLevel(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Mid */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300">وضوح الكلام (Mid - نقاء الحروف):</span>
                      <span className="text-amber-400 font-mono">{midLevel}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={midLevel}
                      onChange={(e) => setMidLevel(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Treble */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300">حدّة ولمعان الصوت (Treble - لمعان وبريق):</span>
                      <span className="text-amber-400 font-mono">{trebleLevel}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={trebleLevel}
                      onChange={(e) => setTrebleLevel(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 3: إعدادات الغرفة (Host Room Controls: Name, Background, Layout)
             ========================================================================= */}
          {activeTab === 'room' && (
            <form onSubmit={handleSaveRoom} className="space-y-5 animate-in fade-in duration-150">
              {/* Authorization Notice */}
              {!isHost && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div>
                    <p className="font-bold">تنبيه الصلاحية</p>
                    <p className="text-rose-300/80">أنت لست صاحب هذه الغرفة. يمكنك معاينة الإعدادات فقط، ولا تملك صلاحية الحفظ.</p>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Room Title & Description */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-200">
                  اسم الغرفة
                </label>
                <input
                  type="text"
                  value={title}
                  disabled={!isHost}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="اكتب اسم الغرفة..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 disabled:opacity-60 transition-colors"
                />

                <label className="block text-xs font-bold text-slate-200">
                  وصف الغرفة أو الترحيب
                </label>
                <textarea
                  value={description}
                  disabled={!isHost}
                  rows={2}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب وصفاً أو قواعد للغرفة..."
                  className="w-full px-3.5 py-2 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400 disabled:opacity-60 transition-colors resize-none"
                />
              </div>

              {/* Room Background */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-200">
                    خلفية الغرفة
                  </label>
                  <span className="text-[11px] text-slate-400">معاينة مباشرة</span>
                </div>

                <div className="relative w-full h-28 rounded-2xl overflow-hidden border border-slate-700 shadow-inner group">
                  <img
                    src={coverImage}
                    alt="معاينة الخلفية"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end justify-between p-3">
                    <span className="text-xs font-bold text-white drop-shadow-md">
                      الخلفية المختارة حالياً
                    </span>
                    <span className="text-[10px] bg-amber-500/90 text-slate-950 font-black px-2 py-0.5 rounded-full">
                      تطبيق فوري
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_BACKGROUNDS.map((bg) => {
                    const isSelected = coverImage === bg.url;
                    return (
                      <button
                        type="button"
                        key={bg.id}
                        disabled={!isHost}
                        onClick={() => setCoverImage(bg.url)}
                        className={`relative rounded-xl overflow-hidden border transition-all aspect-video group ${
                          isSelected
                            ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105 shadow-md'
                            : 'border-slate-700 hover:border-slate-500 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={bg.url}
                          alt={bg.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-amber-500/30 backdrop-blur-[1px] flex items-center justify-center">
                            <Check className="w-4 h-4 text-white drop-shadow font-black" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {isHost && (
                  <div className="pt-1">
                    <label className="flex items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed border-amber-500/50 hover:border-amber-400 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold text-amber-200 cursor-pointer transition-all active:scale-98 shadow-sm">
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span>تعديل صورة الغرفة (رفع صورة غلاف جديدة من الهاتف) 🖼️</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    {customImageError && (
                      <p className="text-[11px] text-rose-400 mt-1 font-bold">{customImageError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Mic Layout */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-200">
                    تحديد عدد المايكات
                  </label>
                  <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700">
                    <button
                      type="button"
                      disabled={!isHost}
                      onClick={handlePrevLayout}
                      className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-40"
                      title="النمط السابق"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-black text-amber-400 px-1">
                      {LAYOUT_OPTIONS.find(l => l.id === micLayout)?.label}
                    </span>
                    <button
                      type="button"
                      disabled={!isHost}
                      onClick={handleNextLayout}
                      className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-40"
                      title="النمط التالي"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {LAYOUT_OPTIONS.map((layout) => {
                    const isSelected = micLayout === layout.id;
                    return (
                      <button
                        type="button"
                        key={layout.id}
                        disabled={!isHost}
                        onClick={() => setMicLayout(layout.id)}
                        className={`flex items-start gap-3 p-3 rounded-2xl border text-right transition-all ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 shadow-md shadow-amber-500/10'
                            : 'bg-slate-800/70 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 shrink-0 text-xl">
                          {layout.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-100">{layout.label}</span>
                            <span className="text-[10px] text-amber-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-700">
                              {layout.rows}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 leading-tight">{layout.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Host Save Button & Explicit Permanent Delete Button */}
              {isHost && (
                <div className="space-y-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                        <span>جاري حفظ الإعدادات وتطبيقها...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 text-slate-950" />
                        <span>حفظ إعدادات الغرفة وتطبيقها مباشرة</span>
                      </>
                    )}
                  </button>

                  <div className="pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm('هل أنت متأكد من حذف الغرفة نهائياً؟ سيتم مسح الغرفة تماماً ولن تظهر في قائمة الغرف.')) {
                          try {
                            await API.deleteRoom(room.id, currentUser.id);
                            onClose();
                            window.location.reload();
                          } catch (err: any) {
                            alert(err.message || 'تعذر حذف الغرفة');
                          }
                        }
                      }}
                      className="w-full py-2.5 px-4 rounded-2xl bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 font-bold text-xs active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                      <span>حذف الغرفة نهائياً (شرط المسح الوحيد)</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
