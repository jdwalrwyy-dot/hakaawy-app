import React, { useState, useEffect } from 'react';
import { User, GiftTierConfig, SystemGiftTierSettings, GiftTierLevel } from '../types';
import { API } from '../services/api';
import { soundEffects } from '../services/soundEffects';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Shield,
  Crown,
  Flame,
  Info
} from 'lucide-react';

interface AdminGiftTierSettingsProps {
  currentUser: User;
}

const TIER_ICONS: Record<GiftTierLevel, string> = {
  COMMON: '🌸',
  PRETTY: '✨',
  LUXURY: '🏆',
  LEGENDARY: '🌟',
  VIP: '👑',
  STANDARD: '🎁',
  FEATURED: '✨',
  RARE: '💎'
};

const TIER_COLORS: Record<GiftTierLevel, string> = {
  COMMON: 'from-slate-800 to-slate-900 border-slate-700 text-slate-200',
  PRETTY: 'from-sky-950/40 to-slate-900 border-sky-500/40 text-sky-300',
  LUXURY: 'from-amber-950/40 to-slate-900 border-amber-500/40 text-amber-300',
  LEGENDARY: 'from-yellow-950/60 to-purple-950/60 border-yellow-400 text-yellow-300',
  VIP: 'from-purple-950 via-amber-950 to-slate-900 border-yellow-300 text-yellow-300',
  STANDARD: 'from-slate-800 to-slate-900 border-slate-700 text-slate-200',
  FEATURED: 'from-sky-950/40 to-slate-900 border-sky-500/40 text-sky-300',
  RARE: 'from-purple-950/40 to-slate-900 border-purple-500/40 text-purple-300'
};

export const AdminGiftTierSettings: React.FC<AdminGiftTierSettingsProps> = ({ currentUser }) => {
  const [settings, setSettings] = useState<SystemGiftTierSettings | null>(null);
  const [tiers, setTiers] = useState<GiftTierConfig[]>([]);
  const [globalSoundEnabled, setGlobalSoundEnabled] = useState(true);
  const [bigGiftThreshold, setBigGiftThreshold] = useState<number>(5000);
  const [globalBannerEnabled, setGlobalBannerEnabled] = useState<boolean>(true);
  const [globalBannerDurationMs, setGlobalBannerDurationMs] = useState<number>(10000);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeTestSound, setActiveTestSound] = useState<string | null>(null);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await API.getGiftTierSettings();
      setSettings(data);
      setTiers(data.tiers || []);
      setGlobalSoundEnabled(data.globalSoundEnabled ?? true);
      setBigGiftThreshold(data.bigGiftThreshold ?? 5000);
      setGlobalBannerEnabled(data.globalBannerEnabled ?? true);
      setGlobalBannerDurationMs(data.globalBannerDurationMs ?? 10000);
    } catch {
      setMessage({ text: 'فشل في تحميل إعدادات فئات الهدايا', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleTierChange = (index: number, field: keyof GiftTierConfig, value: any) => {
    setTiers(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleTestSound = (tier: GiftTierConfig) => {
    setActiveTestSound(tier.level);
    if (!tier.hasSound || tier.soundType === 'none') {
      // Intentionally silent test
      setTimeout(() => setActiveTestSound(null), 600);
      return;
    }
    soundEffects.playGiftSound(tier.level, tier.minDiamonds, tier.soundType);
    setTimeout(() => setActiveTestSound(null), 1500);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await API.updateAdminGiftTierSettings(currentUser.id, {
        tiers,
        globalSoundEnabled,
        bigGiftThreshold,
        globalBannerEnabled,
        globalBannerDurationMs
      });
      setMessage({ text: res.message || 'تم حفظ الإعدادات وتحديث شريط الهدايا العالمية في كل الغرف!', type: 'success' });
      setSettings(res.settings);
      setTiers(res.settings.tiers);
      if (res.settings.bigGiftThreshold !== undefined) setBigGiftThreshold(res.settings.bigGiftThreshold);
      if (res.settings.globalBannerEnabled !== undefined) setGlobalBannerEnabled(res.settings.globalBannerEnabled);
      if (res.settings.globalBannerDurationMs !== undefined) setGlobalBannerDurationMs(res.settings.globalBannerDurationMs);
    } catch (err: any) {
      setMessage({ text: err.message || 'تعذر حفظ الإعدادات', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (!confirm('هل أنت متأكد من استعادة الإعدادات الافتراضية الموصى بها لنظام الهدايا والأصوات؟')) return;
    
    setTiers([
      {
        level: 'STANDARD',
        nameAr: 'عادية',
        minDiamonds: 0,
        maxDiamonds: 499,
        hasSound: false,
        soundType: 'none',
        hasFullscreenAura: false,
        celebrationDurationMs: 1200,
        screenGlowColor: 'rgba(251, 191, 36, 0.12)',
        descriptionAr: 'صامتة تماماً وبحركة مسار انسيابية خفيفة وبدون أي إزعاج.'
      },
      {
        level: 'FEATURED',
        nameAr: 'مميزة',
        minDiamonds: 500,
        maxDiamonds: 4999,
        hasSound: false,
        soundType: 'none',
        hasFullscreenAura: false,
        celebrationDurationMs: 1500,
        screenGlowColor: 'rgba(56, 189, 248, 0.25)',
        descriptionAr: 'هدايا متوسطة القيمة بلمعان جميل وهادئ، صامتة افتراضياً بدون إزعاج.'
      },
      {
        level: 'RARE',
        nameAr: 'نادرة',
        minDiamonds: 5000,
        maxDiamonds: 19999,
        hasSound: true,
        soundType: 'rare_chime',
        hasFullscreenAura: false,
        celebrationDurationMs: 2000,
        screenGlowColor: 'rgba(168, 85, 247, 0.4)',
        descriptionAr: 'هدايا عالية القيمة مع رنين هارموني بلوري أنيق ومبهج وقصير.'
      },
      {
        level: 'LUXURY',
        nameAr: 'فاخرة',
        minDiamonds: 20000,
        maxDiamonds: 49999,
        hasSound: true,
        soundType: 'luxury_fanfare',
        hasFullscreenAura: false,
        celebrationDurationMs: 2400,
        screenGlowColor: 'rgba(245, 158, 11, 0.65)',
        descriptionAr: 'هدايا فخمة مع عزف احتفالي نحاسي رائع ولمعان ذهبي بارز.'
      },
      {
        level: 'LEGENDARY',
        nameAr: 'أسطورية',
        minDiamonds: 50000,
        maxDiamonds: 999999999,
        hasSound: true,
        soundType: 'legendary_grand',
        hasFullscreenAura: true,
        celebrationDurationMs: 3200,
        screenGlowColor: 'linear-gradient(135deg, rgba(250, 204, 21, 0.8), rgba(244, 63, 94, 0.6))',
        descriptionAr: 'القمة! مؤثر أوركسترالي عظيم، هالة سينمائية تشمل الغرفة بالكامل واحتفال ملكي مبهر.'
      }
    ]);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
        <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs">جاري تحميل إعدادات فئات الهدايا والمؤثرات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200" dir="rtl">
      {/* Header Info Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-slate-900 border border-amber-500/30 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
              <span>إدارة فئات ومؤثرات أصوات الهدايا الفاخرة</span>
              <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-mono font-bold">
                PRO AUDIO ENGINE
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              تحكم ديناميكي في شروط ومؤثرات الهدايا. تضمن السياسة الصارمة بقاء الهدايا العادية والمتوسطة
              صامتة تماماً لمنع الإزعاج في الغرف، مع تفعيل العزف الاحتفالي الفخم للهدايا النادرة والأسطورية فقط.
            </p>
          </div>
        </div>

        <button
          onClick={handleResetDefaults}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold shrink-0 border border-slate-700 transition-colors"
          title="استعادة الإعدادات الموصى بها"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>استعادة الافتراضي</span>
        </button>
      </div>

      {/* Message Box */}
      {message && (
        <div
          className={`p-3 rounded-2xl border text-xs flex items-center gap-2 animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Global Sound Switch */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${globalSoundEnabled ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
            {globalSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-100">تفعيل نظام الأصوات العام للهدايا</h4>
            <p className="text-[11px] text-slate-400">إذا تم تعطيله، ستكون جميع الهدايا في النظام صامتة تماماً</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setGlobalSoundEnabled(!globalSoundEnabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
            globalSoundEnabled ? 'bg-amber-500' : 'bg-slate-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              globalSoundEnabled ? 'translate-x-0' : '-translate-x-5'
            }`}
          />
        </button>
      </div>

      {/* Global Gift Banner Settings Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-900 border border-amber-500/40 space-y-3.5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300">
              <Crown className="w-5 h-5 fill-amber-300" />
            </div>
            <div>
              <h4 className="text-xs font-black text-amber-300">شريط الهدايا العالمية (GLOBAL GIFT BANNER)</h4>
              <p className="text-[11px] text-slate-400">بث الإعلانات الفاخرة للهدايا الكبيرة في جميع الغرف اللحظية</p>
            </div>
          </div>

          {/* Toggle Banner */}
          <button
            type="button"
            onClick={() => setGlobalBannerEnabled(!globalBannerEnabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              globalBannerEnabled ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                globalBannerEnabled ? 'translate-x-0' : '-translate-x-5'
              }`}
            />
          </button>
        </div>

        {globalBannerEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-amber-500/20">
            {/* Big Gift Threshold */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <span>حد "الهدية الكبيرة" لإطلاق الشريط (ماسات 💎)</span>
              </label>
              <input
                type="number"
                step={500}
                value={bigGiftThreshold}
                onChange={e => setBigGiftThreshold(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/90 border border-amber-500/40 text-amber-300 font-mono font-black text-xs focus:outline-none focus:border-amber-400"
              />
              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-slate-400">خيارات سريعة:</span>
                {[1000, 5000, 10000, 50000, 100000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setBigGiftThreshold(val)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                      bigGiftThreshold === val
                        ? 'bg-amber-400 text-slate-950 font-black scale-105'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {val.toLocaleString()} 💎
                  </button>
                ))}
              </div>
            </div>

            {/* Banner Duration */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <span>مدة عرض الشريط (بالثواني)</span>
              </label>
              <input
                type="number"
                step={1}
                min={2}
                max={20}
                value={Math.round(globalBannerDurationMs / 1000)}
                onChange={e => setGlobalBannerDurationMs(Math.max(2000, Number(e.target.value) * 1000))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-700 text-slate-200 font-mono font-black text-xs focus:outline-none focus:border-amber-400"
              />
              <p className="text-[10px] text-slate-400 pt-1">الافتراضي الموصى به: 5 ثوانٍ</p>
            </div>
          </div>
        )}
      </div>

      {/* Tiers List */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-black text-slate-200">مستويات وفئات الهدايا (5 مستويات)</h4>
          <span className="text-[10px] text-slate-400">اضغط "تجربة الصوت" لسماع النغمات الاحتفالية المركبة</span>
        </div>

        {tiers.map((tier, idx) => {
          const isSilent = !tier.hasSound || tier.soundType === 'none';
          const isTesting = activeTestSound === tier.level;

          return (
            <div
              key={tier.level}
              className={`p-4 rounded-2xl border bg-gradient-to-b ${TIER_COLORS[tier.level]} transition-all shadow-lg`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/40 pb-3">
                {/* Tier Title and Tag */}
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{TIER_ICONS[tier.level]}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-100">{tier.nameAr}</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-950/70 border border-slate-700 text-slate-300">
                        {tier.level}
                      </span>
                      {isSilent ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-bold flex items-center gap-1">
                          <VolumeX className="w-3 h-3" /> صامتة تماماً
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                          <Volume2 className="w-3 h-3" /> مؤثر صوتي نشط
                        </span>
                      )}
                      {tier.hasFullscreenAura && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 font-bold flex items-center gap-1">
                          👑 هالة سينمائية كاملة
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{tier.descriptionAr}</p>
                  </div>
                </div>

                {/* Sound Tester Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTestSound(tier)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                      isSilent
                        ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border border-slate-700'
                        : isTesting
                        ? 'bg-amber-400 text-slate-950 scale-105 ring-2 ring-amber-300 font-black'
                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isTesting ? 'جاري العزف...' : isSilent ? 'معاينة الصمت' : 'تجربة الصوت'}</span>
                  </button>
                </div>
              </div>

              {/* Editable Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3">
                {/* Min Diamonds */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block">الحد الأدنى (ماسات 💎)</label>
                  <input
                    type="number"
                    value={tier.minDiamonds}
                    onChange={e => handleTierChange(idx, 'minDiamonds', Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 text-xs font-mono font-bold focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {/* Max Diamonds */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block">الحد الأقصى (ماسات 💎)</label>
                  <input
                    type="number"
                    value={tier.maxDiamonds}
                    onChange={e => handleTierChange(idx, 'maxDiamonds', Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 text-xs font-mono font-bold focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {/* Sound Type Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block">نوع النغمة والمؤثر</label>
                  <select
                    value={tier.soundType}
                    onChange={e => {
                      const val = e.target.value as any;
                      handleTierChange(idx, 'soundType', val);
                      handleTierChange(idx, 'hasSound', val !== 'none');
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 text-xs font-bold focus:border-amber-400 focus:outline-none"
                  >
                    <option value="none">🔇 صامتة (بدون صوت)</option>
                    <option value="rare_chime">✨ رنين هارموني بلوري (Rare Chime)</option>
                    <option value="luxury_fanfare">🎺 عزف نحاسي احتفالي (Luxury Fanfare)</option>
                    <option value="legendary_grand">👑 عزف أوركسترالي ملكي أسطوري (Grand Fanfare)</option>
                  </select>
                </div>

                {/* Celebration Duration */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block">مدة العرض (مللي ثانية)</label>
                  <input
                    type="number"
                    step={100}
                    value={tier.celebrationDurationMs}
                    onChange={e => handleTierChange(idx, 'celebrationDurationMs', Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 text-xs font-mono font-bold focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="pt-2 sticky bottom-0 bg-slate-900/95 py-3 border-t border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>التغييرات يتم بثها فوراً عبر WebSocket لجميع الغرف المتصلة.</span>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>جاري الحفظ...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>حفظ التعديلات وتطبيقها</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
