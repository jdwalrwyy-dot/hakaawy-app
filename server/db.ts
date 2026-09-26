import fs from 'fs';
import path from 'path';
import { calculateLevelFromXP, getXPForLevel, getLevelProgressInfo } from '../src/utils/levelUtils';
import {
  User,
  UserRole,
  PublicUserProfile,
  Room,
  RoomMember,
  RoomSeat,
  MicRequest,
  RoomMessage,
  PrivateMessage,
  Friendship,
  Gift,
  GiftTransaction,
  WalletTransaction,
  DailyTask,
  Frame,
  Report,
  Ban,
  AuditLog,
  AppNotification,
  AdminStats,
  MicLayoutType,
  ModerationIncident,
  ModerationCategory,
  BannedIdentifier,
  HostApplication,
  AgentApplication,
  Agency,
  HostProfile,
  TargetConfig,
  HostTargetProgress,
  AgencyDashboardData,
  HostDashboardData,
  GiftTierConfig,
  GiftTierLevel,
  SystemGiftTierSettings,
  ReferralRecord,
  ReferralStats,
  Entrance,
  UserEntrance,
  ShippingRechargeLog,
  OfficialMessageTarget,
  OfficialHekawyMessage
} from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'hekawy.json');

export const SYSTEM_OWNER_EMAIL = 'jdwalrwyy@gmail.com';
export const SYSTEM_OWNER_EMAIL_2 = 'waledwwwz41@gmail.com';
export const SYSTEM_OWNER_EMAILS = [
  'jdwalrwyy@gmail.com',
  'waledwwwz41@gmail.com'
];
export const SYSTEM_OWNER_NAME = 'جدو الرويعى';
export const SYSTEM_OWNER_NAME_2 = 'وليد (المالك)';
export const SYSTEM_OWNER_PIN = '778899';

export function isSystemOwnerEmail(email?: string): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return SYSTEM_OWNER_EMAILS.some(e => e.toLowerCase() === clean);
}

export function isSystemOwnerUsername(username?: string): boolean {
  if (!username) return false;
  const clean = username.trim().toLowerCase();
  return clean === 'jdwalrwyy' || clean === 'waledwwwz41' || clean === 'waled';
}

export interface DatabaseSchema {
  users: User[];
  rooms: Room[];
  roomMembers: RoomMember[];
  roomSeats: Record<string, RoomSeat[]>; // roomId -> seats
  micRequests: MicRequest[];
  messages: RoomMessage[];
  privateMessages: PrivateMessage[];
  friendships: Friendship[];
  follows: { id: string; followerId: string; followingId: string; createdAt: string }[];
  gifts: Gift[];
  giftTransactions: GiftTransaction[];
  walletTransactions: WalletTransaction[];
  dailyTasks: DailyTask[];
  userDailyTaskProgress: { userId: string; taskId: string; date: string; progress: number; completed: boolean; claimed: boolean }[];
  frames: Frame[];
  userFrames: { id: string; userId: string; frameId: string; acquiredAt: string }[];
  entrances: Entrance[];
  userEntrances: UserEntrance[];
  reports: Report[];
  bans: Ban[];
  moderationIncidents: ModerationIncident[];
  bannedIdentifiers: BannedIdentifier[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  hostApplications: HostApplication[];
  agentApplications: AgentApplication[];
  agencies: Agency[];
  hostProfiles: HostProfile[];
  targetConfigs: TargetConfig[];
  giftTierSettings?: SystemGiftTierSettings;
  referrals: ReferralRecord[];
  reservedNumericIds?: string[];
  shippingRechargeLogs?: ShippingRechargeLog[];
  deviceBindings?: DeviceBinding[];
}

export interface DeviceBinding {
  deviceId: string;
  userId: string;
  boundAt: string;
  lastUsedAt: string;
  userEmail?: string;
  userPhone?: string;
  ip?: string;
}

export const DEFAULT_GIFT_TIER_SETTINGS: SystemGiftTierSettings = {
  globalSoundEnabled: true,
  bigGiftThreshold: 5000,
  globalBannerEnabled: true,
  globalBannerDurationMs: 10000,
  lastUpdated: new Date().toISOString(),
  tiers: [
    {
      level: 'COMMON',
      nameAr: 'هدايا عادية (5 – 100 💎)',
      minDiamonds: 5,
      maxDiamonds: 100,
      hasSound: true,
      soundType: 'common_chime',
      hasFullscreenAura: false,
      celebrationDurationMs: 4200,
      screenGlowColor: 'rgba(251, 191, 36, 0.15)',
      descriptionAr: 'هدايا أنيقة بحركة انسيابية هادئة وصوت رنين ناعم ورقيق.'
    },
    {
      level: 'PRETTY',
      nameAr: 'هدايا مميزة (200 – 5,000 💎)',
      minDiamonds: 200,
      maxDiamonds: 5000,
      hasSound: true,
      soundType: 'pretty_crystal',
      hasFullscreenAura: false,
      celebrationDurationMs: 4800,
      screenGlowColor: 'rgba(56, 189, 248, 0.35)',
      descriptionAr: 'هدايا متوسطة مع رنين هارموني بلوري وأطياف ضوئية ساحرة.'
    },
    {
      level: 'LUXURY',
      nameAr: 'هدايا فخمة (8,000 – 30,000 💎)',
      minDiamonds: 8000,
      maxDiamonds: 30000,
      hasSound: true,
      soundType: 'luxury_fanfare',
      hasFullscreenAura: false,
      celebrationDurationMs: 5600,
      screenGlowColor: 'rgba(245, 158, 11, 0.65)',
      descriptionAr: 'هدايا فاخرة بحركة سينمائية وتوقف احتفالي وعزف نحاسي مبهج.'
    },
    {
      level: 'LEGENDARY',
      nameAr: 'هدايا أسطورية (40,000 – 80,000 💎)',
      minDiamonds: 40000,
      maxDiamonds: 80000,
      hasSound: true,
      soundType: 'legendary_grand',
      hasFullscreenAura: true,
      celebrationDurationMs: 6800,
      screenGlowColor: 'linear-gradient(135deg, rgba(168, 85, 247, 0.8), rgba(251, 191, 36, 0.7))',
      descriptionAr: 'هدايا أسطورية بحركة ملحمية بطيئة وهالة احتفالية تغطي الغرفة كاملة.'
    },
    {
      level: 'VIP',
      nameAr: 'هدايا VIP ملكية (90,000 – 100,000 💎)',
      minDiamonds: 90000,
      maxDiamonds: 100000,
      hasSound: true,
      soundType: 'vip_imperial',
      hasFullscreenAura: true,
      celebrationDurationMs: 8000,
      screenGlowColor: 'linear-gradient(135deg, rgba(250, 204, 21, 0.95), rgba(220, 38, 38, 0.85))',
      descriptionAr: 'قمة الفخامة الملكية! تتويج إمبراطوري كامل، هالة شمسية ملكية وكرنفال عظيم.'
    }
  ]
};

const DEFAULT_FRAMES: Frame[] = [
  // Owner Exclusive Frame
  {
    id: 'frame_king',
    nameAr: 'إطار الإدارة والمالك',
    icon: '👑',
    previewGradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF4500 100%)',
    borderStyle: 'border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.9)] ring-2 ring-yellow-300',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: true,
    requiredLevel: 999,
    descriptionAr: 'إطار الإدارة والمالك الحصري لمالك وإدارة التطبيق فقط 4D - متحرك وصامت',
    category: 'ROYAL'
  },
  // Level 1: Single Free Frame for everyone
  {
    id: 'frame_flowers',
    nameAr: 'إطار الزهور',
    icon: '🌸',
    previewGradient: 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)',
    borderStyle: 'border-2 border-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.6)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 1,
    descriptionAr: 'إطار أزهار الكرز والساكورا الوردية - مجاني ومتاح للجميع من المستوى 1',
    category: 'NATURE'
  },

  // Progressive Level Unlocked Frames
  {
    id: 'frame_cat',
    nameAr: 'إطار القط',
    icon: '🐱',
    previewGradient: 'linear-gradient(135deg, #D946EF 0%, #8B5CF6 100%)',
    borderStyle: 'border-2 border-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.7)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 5,
    descriptionAr: 'إطار آذان القطة النيون - يفتح عند المستوى 5',
    category: 'ANIMAL'
  },
  {
    id: 'frame_neon',
    nameAr: 'إطار النيون',
    icon: '💡',
    previewGradient: 'linear-gradient(135deg, #06B6D4 0%, #EC4899 100%)',
    borderStyle: 'border-2 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.7)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 8,
    descriptionAr: 'إطار حلقة النيون الكهربائية - يفتح عند المستوى 8',
    category: 'NEON'
  },
  {
    id: 'frame_traveler',
    nameAr: 'إطار الرحالة',
    icon: '🤠',
    previewGradient: 'linear-gradient(135deg, #B45309 0%, #78350F 100%)',
    borderStyle: 'border-2 border-amber-700 shadow-[0_0_8px_rgba(180,83,9,0.6)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 10,
    descriptionAr: 'إطار حبل المغامرة وقبعة السفاري - يفتح عند المستوى 10',
    category: 'SPECIAL'
  },
  {
    id: 'frame_summer',
    nameAr: 'إطار الصيف',
    icon: '🏖️',
    previewGradient: 'linear-gradient(135deg, #0EA5E9 0%, #F59E0B 100%)',
    borderStyle: 'border-2 border-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.6)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 12,
    descriptionAr: 'إطار شاطئ الصيف وأشجار النخيل - يفتح عند المستوى 12',
    category: 'NATURE'
  },
  {
    id: 'frame_roses',
    nameAr: 'إطار الورود',
    icon: '🌹',
    previewGradient: 'linear-gradient(135deg, #E11D48 0%, #881337 100%)',
    borderStyle: 'border-2 border-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.7)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 15,
    descriptionAr: 'إطار إكليل الورود الحمراء المخملية - يفتح عند المستوى 15',
    category: 'NATURE'
  },
  {
    id: 'frame_nature',
    nameAr: 'إطار الطبيعة',
    icon: '🌿',
    previewGradient: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
    borderStyle: 'border-2 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 18,
    descriptionAr: 'إطار أوراق الشجر الخضراء وفراشات النيون - يفتح عند المستوى 18',
    category: 'NATURE'
  },
  {
    id: 'frame_love',
    nameAr: 'إطار الحب',
    icon: '💖',
    previewGradient: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
    borderStyle: 'border-2 border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.7)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 20,
    descriptionAr: 'إطار القلوب الوردية النيون المضيئة - يفتح عند المستوى 20',
    category: 'SPECIAL'
  },
  {
    id: 'frame_dreams',
    nameAr: 'إطار الأحلام',
    icon: '🌈',
    previewGradient: 'linear-gradient(135deg, #F472B6 0%, #38BDF8 100%)',
    borderStyle: 'border-2 border-pink-300 shadow-[0_0_10px_rgba(244,114,182,0.7)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 22,
    descriptionAr: 'إطار قوس قزح والسحاب والنجوم - يفتح عند المستوى 22',
    category: 'SPECIAL'
  },
  {
    id: 'frame_music',
    nameAr: 'إطار الموسيقى',
    icon: '🎧',
    previewGradient: 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)',
    borderStyle: 'border-2 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 25,
    descriptionAr: 'إطار سماعات الرأس النيون والنوتات - يفتح عند المستوى 25',
    category: 'SPECIAL'
  },
  {
    id: 'frame_winter',
    nameAr: 'إطار الشتاء',
    icon: '❄️',
    previewGradient: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
    borderStyle: 'border-2 border-sky-200 shadow-[0_0_10px_rgba(56,189,248,0.7)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 28,
    descriptionAr: 'إطار جليد الشتاء وتساقط ندف الثلج - يفتح عند المستوى 28',
    category: 'NATURE'
  },
  {
    id: 'frame_butterfly',
    nameAr: 'إطار الفراشة',
    icon: '🦋',
    previewGradient: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
    borderStyle: 'border-2 border-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.7)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 30,
    descriptionAr: 'إطار الفراشات السحرية المتوهجة - يفتح عند المستوى 30',
    category: 'NATURE'
  },
  {
    id: 'frame_knowledge',
    nameAr: 'إطار المعرفة',
    icon: '📚',
    previewGradient: 'linear-gradient(135deg, #0284C7 0%, #0F172A 100%)',
    borderStyle: 'border-2 border-sky-500 shadow-[0_0_8px_rgba(2,132,199,0.6)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 32,
    descriptionAr: 'إطار الكتب الأسطورية المفتوحة - يفتح عند المستوى 32',
    category: 'SPECIAL'
  },
  {
    id: 'frame_gaming',
    nameAr: 'إطار الألعاب',
    icon: '🎮',
    previewGradient: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
    borderStyle: 'border-2 border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.7)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 35,
    descriptionAr: 'إطار يد التحكم للجيمنج والسايبر نيون - يفتح عند المستوى 35',
    category: 'NEON'
  },
  {
    id: 'frame_nautical',
    nameAr: 'إطار البحر والإبحار',
    icon: '⚓',
    previewGradient: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)',
    borderStyle: 'border-2 border-blue-600 shadow-[0_0_8px_rgba(30,64,175,0.6)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 38,
    descriptionAr: 'إطار دفة السفينة والمرساة الذهبية - يفتح عند المستوى 38',
    category: 'SPECIAL'
  },
  {
    id: 'frame_sports',
    nameAr: 'إطار الرياضة',
    icon: '⚽',
    previewGradient: 'linear-gradient(135deg, #22C55E 0%, #15803D 100%)',
    borderStyle: 'border-2 border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 40,
    descriptionAr: 'إطار مضمار الرياضة وكرة القدم - يفتح عند المستوى 40',
    category: 'SPECIAL'
  },
  {
    id: 'frame_stars',
    nameAr: 'إطار النجوم',
    icon: '⭐',
    previewGradient: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
    borderStyle: 'border-2 border-fuchsia-400 shadow-[0_0_10px_rgba(168,85,247,0.7)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 45,
    descriptionAr: 'إطار مجرة النجوم الفضائية وحلقة النيون - يفتح عند المستوى 45',
    category: 'SPECIAL'
  },
  {
    id: 'frame_silver',
    nameAr: 'إطار فضي',
    icon: '🥈',
    previewGradient: 'linear-gradient(135deg, #94A3B8 0%, #CBD5E1 100%)',
    borderStyle: 'border-2 border-slate-300 shadow-[0_0_10px_rgba(203,213,225,0.8)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 50,
    descriptionAr: 'إطار التاج الفضي الماسي الأنيق - يفتح عند المستوى 50',
    category: 'ROYAL'
  },
  {
    id: 'frame_sea',
    nameAr: 'إطار البحر',
    icon: '🐬',
    previewGradient: 'linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)',
    borderStyle: 'border-2 border-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.7)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 55,
    descriptionAr: 'إطار أمواج المحيط الأزرق - يفتح عند المستوى 55',
    category: 'NATURE'
  },
  {
    id: 'frame_future',
    nameAr: 'إطار المستقبل',
    icon: '⚡',
    previewGradient: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
    borderStyle: 'border-2 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.8)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 60,
    descriptionAr: 'إطار تكنولوجيا المستقبل والسايبر - يفتح عند المستوى 60',
    category: 'NEON'
  },
  {
    id: 'frame_space',
    nameAr: 'إطار الفضاء',
    icon: '🚀',
    previewGradient: 'linear-gradient(135deg, #0284C7 0%, #3B82F6 100%)',
    borderStyle: 'border-2 border-sky-400 shadow-[0_0_10px_rgba(2,132,199,0.7)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 65,
    descriptionAr: 'إطار رواد الفضاء والكواكب - يفتح عند المستوى 65',
    category: 'SPECIAL'
  },
  {
    id: 'frame_mystery',
    nameAr: 'إطار الغموض',
    icon: '🔮',
    previewGradient: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
    borderStyle: 'border-2 border-purple-500 shadow-[0_0_12px_rgba(139,92,246,0.8)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 70,
    descriptionAr: 'إطار شبح الغموض والبرق الأرجواني - يفتح عند المستوى 70',
    category: 'SPECIAL'
  },
  {
    id: 'frame_gold',
    nameAr: 'إطار ذهبي',
    icon: '👑',
    previewGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    borderStyle: 'border-2 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.8)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 80,
    descriptionAr: 'إطار التاج الذهبي الفاخر المزدوج - يفتح عند المستوى 80',
    category: 'ROYAL'
  },
  {
    id: 'frame_wings',
    nameAr: 'إطار الأجنحة',
    icon: '🦅',
    previewGradient: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
    borderStyle: 'border-2 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.8)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 90,
    descriptionAr: 'إطار الأجنحة الذهبية الضخمة - يفتح عند المستوى 90',
    category: 'ROYAL'
  },
  {
    id: 'frame_luxury',
    nameAr: 'إطار الفخامة',
    icon: '👑',
    previewGradient: 'linear-gradient(135deg, #D97706 0%, #78350F 100%)',
    borderStyle: 'border-2 border-amber-500 shadow-[0_0_12px_rgba(217,119,6,0.8)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 100,
    descriptionAr: 'إطار إكليل الغار الذهبي وتاج الفخامة - يفتح عند المستوى 100',
    category: 'ROYAL'
  },
  {
    id: 'frame_elite',
    nameAr: 'إطار النخبة',
    icon: '🎖️',
    previewGradient: 'linear-gradient(135deg, #EAB308 0%, #B45309 100%)',
    borderStyle: 'border-2 border-amber-400 shadow-[0_0_12px_rgba(234,179,8,0.8)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 110,
    descriptionAr: 'إطار التاج الذهبي لكبار شخصيات النخبة - يفتح عند المستوى 110',
    category: 'ROYAL'
  },
  {
    id: 'frame_lion',
    nameAr: 'إطار الأسد',
    icon: '🦁',
    previewGradient: 'linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)',
    borderStyle: 'border-2 border-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.8)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 120,
    descriptionAr: 'إطار رأس الأسد الذهبي 3D - يفتح عند المستوى 120',
    category: 'ANIMAL'
  },
  {
    id: 'frame_angel',
    nameAr: 'إطار الملاك',
    icon: '👼',
    previewGradient: 'linear-gradient(135deg, #38BDF8 0%, #818CF8 100%)',
    borderStyle: 'border-2 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.8)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 130,
    descriptionAr: 'إطار الملاك بأجنحة نيون زرقاء - يفتح عند المستوى 130',
    category: 'FANTASY'
  },
  {
    id: 'frame_dragon',
    nameAr: 'إطار التنين',
    icon: '🐉',
    previewGradient: 'linear-gradient(135deg, #EF4444 0%, #F97316 100%)',
    borderStyle: 'border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.9)]',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: false,
    requiredLevel: 140,
    descriptionAr: 'إطار التنين الخرافي الناري 4D - يفتح عند المستوى 140',
    category: 'FANTASY'
  }
];

export const DEFAULT_ENTRANCES: Entrance[] = [
  {
    id: 'entrance_royal_luxury_car_5d',
    nameAr: 'الدخلة الملكية - السيارة الفاخرة (5D Cinema)',
    nameEn: 'Royal Luxury Car 5D',
    descriptionAr: 'عرض سينمائي متدرج (8 ثوانٍ): سيارة فاخرة فائقة الواقعية بإنارة سينمائية، كشف الاسم والمستوى، وكادر ملكي.',
    diamondPrice: 25000,
    category: '5D',
    tier: 'ROYAL_VIP',
    durationSeconds: 8,
    soundType: 'supercar',
    previewColor: '#F59E0B',
    badgeLabel: '5D CINEMA'
  },
  {
    id: 'entrance_king_limousine_5d',
    nameAr: 'موكب الليموزين الملكي الإمبراطوري (5D VIP)',
    nameEn: 'Imperial Royal Limousine 5D',
    descriptionAr: 'موكب فخم من سيارة الليموزين السوداء الذهبية مع سجادة حمراء ملكية وكشافات ليزر عالية الدقة.',
    diamondPrice: 50000,
    category: '5D',
    tier: 'OWNER_EXCLUSIVE',
    durationSeconds: 8,
    soundType: 'supercar',
    previewColor: '#D97706',
    badgeLabel: '5D OWNER',
    isExclusiveOwner: true
  },
  {
    id: 'entrance_private_jet_5d',
    nameAr: 'الطائرة الخاصة الرئاسية (5D VIP)',
    nameEn: 'Presidential Private Jet 5D',
    descriptionAr: 'هبوط سينمائي لطائرة جيت سوداء وذهبية، انضباط الإضاءات المهبطية وتدفق السجاد الأحمر.',
    diamondPrice: 35000,
    category: '5D',
    tier: 'ROYAL_VIP',
    durationSeconds: 8,
    soundType: 'jet',
    previewColor: '#0284C7',
    badgeLabel: '5D AERIAL'
  },
  {
    id: 'entrance_mega_yacht_5d',
    nameAr: 'اليخت الإمبراطوري الفاخر (5D Ocean)',
    nameEn: 'Imperial Mega Yacht 5D',
    descriptionAr: 'إبحار سينمائي في أعماق المياه مع إضاءات LED تحت الماء وموجات متلألئة وبريق ذهبي.',
    diamondPrice: 30000,
    category: '5D',
    tier: 'ROYAL_VIP',
    durationSeconds: 8,
    soundType: 'yacht',
    previewColor: '#0EA5E9',
    badgeLabel: '5D OCEAN'
  },
  {
    id: 'entrance_royal_crown_5d',
    nameAr: 'عرش التاج الملكي الماسي (5D Sovereign)',
    nameEn: 'Royal Sovereign Crown 5D',
    descriptionAr: 'هبوط التاج الإمبراطوري ثلاثي الأبعاد مع انعكاسات الياقوت والألماس ومؤثرات ضوئية فاخرة.',
    diamondPrice: 20000,
    category: '5D',
    tier: 'LEGENDARY',
    durationSeconds: 8,
    soundType: 'royal_fanfare',
    previewColor: '#EAB308',
    badgeLabel: '5D CROWN'
  },
  {
    id: 'entrance_royal_falcon_5d',
    nameAr: 'الصقر العربي الذهبي الأصيل (5D Falcon)',
    nameEn: 'Royal Golden Falcon 5D',
    descriptionAr: 'تحليق صقر عربي حر بريش ذهبي وعيون الياقوت ينزل بسلاسة مع هالة شمسية سينمائية.',
    diamondPrice: 18000,
    category: '5D',
    tier: 'LEGENDARY',
    durationSeconds: 8,
    soundType: 'falcon',
    previewColor: '#B45309',
    badgeLabel: '5D FALCON'
  },
  {
    id: 'entrance_superbike_chrome_3d',
    nameAr: 'الدراجة النارية الكروم الفاخرة (3D Master)',
    nameEn: 'Chrome Chopper Superbike 3D',
    descriptionAr: 'دراجة تشوبر نارية فاخرة من الكروم والذهب مع زئير المحرك وانعكاسات الطرق.',
    diamondPrice: 12000,
    category: '3D',
    tier: 'LUXURY',
    durationSeconds: 6,
    soundType: 'bike',
    previewColor: '#F59E0B',
    badgeLabel: '3D BIKE'
  },
  {
    id: 'entrance_arabian_steed_3d',
    nameAr: 'الحصان العربي الأصيل (3D Noble)',
    nameEn: 'Purebred Arabian Steed 3D',
    descriptionAr: 'جواد عربي أصيل بسرج ذهبي وسرعة هيبة الملك على مضمار الروم.',
    diamondPrice: 10000,
    category: '3D',
    tier: 'LUXURY',
    durationSeconds: 6,
    soundType: 'steed',
    previewColor: '#D97706',
    badgeLabel: '3D STEED'
  },
  {
    id: 'entrance_space_cruiser_5d',
    nameAr: 'المركبة السايبر الفضائية (5D Galaxy)',
    nameEn: 'Cyber Space Cruiser 5D',
    descriptionAr: 'مركبة تيتانيوم سايبر المستقبلية مع خطوط نيون زرقاء ومحرك طاقة كمومية.',
    diamondPrice: 22000,
    category: '5D',
    tier: 'LEGENDARY',
    durationSeconds: 8,
    soundType: 'space',
    previewColor: '#06B6D4',
    badgeLabel: '5D CYBER'
  }
];

const DEFAULT_GIFTS: Gift[] = [
  // 1. عادية (Common: 5 - 100 Diamonds)
  {
    id: 'gift_crystal_rose',
    nameAr: 'وردة كريستالية ملكية',
    icon: '🌹',
    diamondCost: 5,
    coinReward: 5,
    animationType: 'crystal_rose_refraction',
    soundKey: 'common_chime',
    category: 'common',
    tierLevel: 'COMMON',
    descriptionAr: 'وردة منحوتة من الكريستال الوردي والزمرد الملكي.'
  },
  {
    id: 'gift_ruby_gem',
    nameAr: 'ياقوت ملكي متألق',
    icon: '💎',
    diamondCost: 20,
    coinReward: 20,
    animationType: 'ruby_radiance',
    soundKey: 'common_chime',
    category: 'common',
    tierLevel: 'COMMON',
    descriptionAr: 'جوهرة ياقوت أحمر إمبراطوري بقصة برليانت ثلاثية الأبعاد.'
  },
  {
    id: 'gift_golden_dagger',
    nameAr: 'خنجر دمشقي مذهب',
    icon: '🗡️',
    diamondCost: 50,
    coinReward: 50,
    animationType: 'golden_dagger_sheen',
    soundKey: 'common_chime',
    category: 'common',
    tierLevel: 'COMMON',
    descriptionAr: 'خنجر عربي أصيل بنقوش ذهبية وأحجار كريمة.'
  },
  {
    id: 'gift_royal_falcon',
    nameAr: 'صقر الصيد الملكي',
    icon: '🦅',
    diamondCost: 75,
    coinReward: 75,
    animationType: 'falcon_soar',
    soundKey: 'common_chime',
    category: 'common',
    tierLevel: 'COMMON',
    descriptionAr: 'صقر شاهين حر بعيون من الياقوت وريش ذهبي.'
  },
  {
    id: 'gift_golden_lamp',
    nameAr: 'مصباح الأساطير الذهبي',
    icon: '🪔',
    diamondCost: 100,
    coinReward: 100,
    animationType: 'lamp_magic_dust',
    soundKey: 'common_chime',
    category: 'common',
    tierLevel: 'COMMON',
    descriptionAr: 'مصباح عربي تراثي من الذهب الخالص ينثر أطيافاً ساحرة.'
  },

  // 2. مميزة (Pretty / Special: 200 - 5,000 Diamonds)
  {
    id: 'gift_diamond_ring',
    nameAr: 'خاتم ألماس فاخر',
    icon: '💍',
    diamondCost: 300,
    coinReward: 300,
    animationType: 'diamond_ring_flare',
    soundKey: 'pretty_crystal',
    category: 'pretty',
    tierLevel: 'PRETTY',
    descriptionAr: 'خاتم سوليتير من البلاتين النقي يتوسطه فص ألماس ملكي.'
  },
  {
    id: 'gift_diamond_necklace',
    nameAr: 'عقد ألماس ملكي',
    icon: '📿',
    diamondCost: 800,
    coinReward: 800,
    animationType: 'necklace_cascades',
    soundKey: 'pretty_crystal',
    category: 'pretty',
    tierLevel: 'PRETTY',
    descriptionAr: 'عقد ريفيير ماسي بقطع ماركيز يتلألأ بأطياف النور.'
  },
  {
    id: 'gift_jewelry_box',
    nameAr: 'صندوق مجوهرات فاخر',
    icon: '🎁',
    diamondCost: 1500,
    coinReward: 1500,
    animationType: 'jewelry_chest_open',
    soundKey: 'pretty_crystal',
    category: 'pretty',
    tierLevel: 'PRETTY',
    descriptionAr: 'صندوق مخملي مطعم بالذهب الخالص يفيض بالزمرد واللؤلؤ.'
  },
  {
    id: 'gift_royal_stallion',
    nameAr: 'حصان ملكي عربي',
    icon: '🐎',
    diamondCost: 3000,
    coinReward: 3000,
    animationType: 'stallion_gallop',
    soundKey: 'pretty_crystal',
    category: 'pretty',
    tierLevel: 'PRETTY',
    descriptionAr: 'جواد عربي أصيل بدرع ذهبي وسرج مرصع بالأحجار الكريمة.'
  },
  {
    id: 'gift_majestic_peacock',
    nameAr: 'طاووس ملكي فاخر',
    icon: '🦚',
    diamondCost: 5000,
    coinReward: 5000,
    animationType: 'peacock_spread',
    soundKey: 'pretty_crystal',
    category: 'pretty',
    tierLevel: 'PRETTY',
    descriptionAr: 'طاووس إمبراطوري بذيل مروحي يعكس بريق الزمرد والذهب.'
  },

  // 3. فخمة (Luxury: 8,000 - 30,000 Diamonds)
  {
    id: 'gift_luxury_supercar',
    nameAr: 'سيارة رياضية خارقة',
    icon: '🏎️',
    diamondCost: 8000,
    coinReward: 8000,
    animationType: 'supercar_thrust',
    soundKey: 'luxury_fanfare',
    category: 'luxury',
    tierLevel: 'LUXURY',
    descriptionAr: 'هايبركار ديناميكية بهيكل كربوني مطعم بذهب عيار 24.'
  },
  {
    id: 'gift_golden_rolls',
    nameAr: 'سيارة ذهبية ملكية',
    icon: '🚘',
    diamondCost: 12000,
    coinReward: 12000,
    animationType: 'golden_rolls_glide',
    soundKey: 'luxury_fanfare',
    category: 'luxury',
    tierLevel: 'LUXURY',
    descriptionAr: 'ليموزين فانتوم فارهة مصنوعة بالكامل من الذهب المصقول.'
  },
  {
    id: 'gift_luxury_superyacht',
    nameAr: 'يخت ملكي فاخر',
    icon: '🛥️',
    diamondCost: 18000,
    coinReward: 18000,
    animationType: 'superyacht_cruise',
    soundKey: 'luxury_fanfare',
    category: 'luxury',
    tierLevel: 'LUXURY',
    descriptionAr: 'ميغايخت متعدد الطوابق مع مهبط مروحيات وحوض زجاجي مضيء.'
  },
  {
    id: 'gift_private_jet',
    nameAr: 'طائرة خاصة فاخرة',
    icon: '🛩️',
    diamondCost: 24000,
    coinReward: 24000,
    animationType: 'private_jet_flight',
    soundKey: 'luxury_fanfare',
    category: 'luxury',
    tierLevel: 'LUXURY',
    descriptionAr: 'طائرة نفاثة رئاسية تتألق باللون الأبيض والخطوط الذهبية.'
  },
  {
    id: 'gift_royal_palace',
    nameAr: 'قصر الملوك الفاخر',
    icon: '🏰',
    diamondCost: 30000,
    coinReward: 30000,
    animationType: 'royal_palace_illuminated',
    soundKey: 'luxury_fanfare',
    category: 'luxury',
    tierLevel: 'LUXURY',
    descriptionAr: 'قصر ملكي شامخ بقباب ذهبية ومآذن رخامية مشعة بالنور.'
  },

  // 4. أسطورية (Legendary: 40,000 - 80,000 Diamonds)
  {
    id: 'gift_golden_castle',
    nameAr: 'قلعة ذهبية شامخة',
    icon: '🏯',
    diamondCost: 40000,
    coinReward: 40000,
    animationType: 'golden_castle_unfold',
    soundKey: 'legendary_grand',
    category: 'legendary',
    tierLevel: 'LEGENDARY',
    descriptionAr: 'قلعة أسطورية محصنة بأسوار من الذهب الخالص وأبراج مشتعلة.'
  },
  {
    id: 'gift_golden_3d_dragon',
    nameAr: 'تنين ذهبي أسطوري',
    icon: '🐉',
    diamondCost: 50000,
    coinReward: 50000,
    animationType: 'dragon_celestial_roar',
    soundKey: 'legendary_grand',
    category: 'legendary',
    tierLevel: 'LEGENDARY',
    descriptionAr: 'تنين مجنح ثلاثي الأبعاد يلتف في الفضاء وينفث شواظاً ذهبية.'
  },
  {
    id: 'gift_golden_eagle',
    nameAr: 'نسر ذهبي إمبراطوري',
    icon: '🦅',
    diamondCost: 60000,
    coinReward: 60000,
    animationType: 'imperial_eagle_strike',
    soundKey: 'legendary_grand',
    category: 'legendary',
    tierLevel: 'LEGENDARY',
    descriptionAr: 'نسر إمبراطوري عملاق باسط جناحيه يقبض على صواعق البرق الذهبي.'
  },
  {
    id: 'gift_cosmic_stargate',
    nameAr: 'بوابة كونية أسطورية',
    icon: '🌀',
    diamondCost: 70000,
    coinReward: 70000,
    animationType: 'stargate_vortex',
    soundKey: 'legendary_grand',
    category: 'legendary',
    tierLevel: 'LEGENDARY',
    descriptionAr: 'بوابة هولوغرافية بين المجرات تدور بحلقات رونية وأشعة سماوية.'
  },
  {
    id: 'gift_vortex_galaxy',
    nameAr: 'مجرة كونية متحركة',
    icon: '🌌',
    diamondCost: 80000,
    coinReward: 80000,
    animationType: 'vortex_galaxy_spin',
    soundKey: 'legendary_grand',
    category: 'legendary',
    tierLevel: 'LEGENDARY',
    descriptionAr: 'مجرة حلزونية ساطعة بسدم نجمية وثقوب ضوئية تبهر الأبصار.'
  },

  // 5. VIP (VIP: 90,000 - 100,000 Diamonds)
  {
    id: 'gift_golden_planet',
    nameAr: 'كوكب ذهبي أسطوري',
    icon: '🪐',
    diamondCost: 90000,
    coinReward: 90000,
    animationType: 'golden_planet_eclipse',
    soundKey: 'vip_imperial',
    category: 'vip',
    tierLevel: 'VIP',
    badge: 'VIP',
    descriptionAr: 'كوكب عملاق من الذهب الخالص تحيط به حلقات من الماس المشع.'
  },
  {
    id: 'gift_luxury_starship',
    nameAr: 'صاروخ ملكي فضائي',
    icon: '🚀',
    diamondCost: 95000,
    coinReward: 95000,
    animationType: 'starship_hyperdrive',
    soundKey: 'vip_imperial',
    category: 'vip',
    tierLevel: 'VIP',
    badge: 'VIP',
    descriptionAr: 'مركبة استكشاف فضائية ملكية تخترق الفضاء بمحركات البلازما.'
  },
  {
    id: 'gift_golden_empire',
    nameAr: 'إمبراطورية ذهبية شامخة',
    icon: '🏛️',
    diamondCost: 98000,
    coinReward: 98000,
    animationType: 'golden_empire_ascension',
    soundKey: 'vip_imperial',
    category: 'vip',
    tierLevel: 'VIP',
    badge: 'VIP',
    descriptionAr: 'مدينة أكروبوليس ملكية بأعمدة بارثينون شامخة من الذهب الخالص.'
  },
  {
    id: 'gift_royal_throne',
    nameAr: 'عرش الملوك الأعظم',
    icon: '👑',
    diamondCost: 100000,
    coinReward: 100000,
    animationType: 'royal_throne_coronation',
    soundKey: 'vip_imperial',
    category: 'vip',
    tierLevel: 'VIP',
    badge: 'VIP',
    descriptionAr: 'أعظم هدية في حكاوي: عرش الملوك الإمبراطوري بتاج مرصع بألماس كولينان.'
  }
];

const DEFAULT_TASKS: DailyTask[] = [
  { id: 'task_login', titleAr: 'تسجيل الدخول اليومي', rewardCoins: 5, rewardExp: 20, taskType: 'DAILY_LOGIN', requiredCount: 1, progress: 0, completed: false, claimed: false },
  { id: 'task_share_app', titleAr: '📤 مشاركة تطبيق حكاوي', descriptionAr: 'شارك حكاوي مع أصدقائك وعائلتك، وكل شخص جديد يسجل من رابطك يمنحك 10 كونز.', rewardCoins: 10, rewardExp: 50, taskType: 'SHARE_APP', requiredCount: 1, progress: 0, completed: false, claimed: false },
  { id: 'task_join_room', titleAr: 'دخول غرفة صوتية أو بث', rewardCoins: 5, rewardExp: 20, taskType: 'JOIN_ROOM', requiredCount: 1, progress: 0, completed: false, claimed: false },
  { id: 'task_stay_10min', titleAr: 'البقاء في الغرفة لمدة 10 دقائق', rewardCoins: 10, rewardExp: 50, taskType: 'STAY_10_MIN', requiredCount: 10, progress: 0, completed: false, claimed: false },
  { id: 'task_send_gift', titleAr: 'إرسال هدية لأحد المضيفين', rewardCoins: 5, rewardExp: 30, taskType: 'SEND_GIFT', requiredCount: 1, progress: 0, completed: false, claimed: false },
  { id: 'task_receive_gift', titleAr: 'استقبال هدية على المايك', rewardCoins: 5, rewardExp: 30, taskType: 'RECEIVE_GIFT', requiredCount: 1, progress: 0, completed: false, claimed: false },
  { id: 'task_invite', titleAr: 'دعوة مستخدم جديد برمز الإحالة', rewardCoins: 10, rewardExp: 60, taskType: 'INVITE_FRIEND', requiredCount: 1, progress: 0, completed: false, claimed: false }
];

const SEED_USERS: User[] = [
  {
    id: 'user_admin',
    name: SYSTEM_OWNER_NAME,
    username: 'jdwalrwyy',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    gender: 'male',
    phone: '+966500000001',
    email: SYSTEM_OWNER_EMAIL,
    bio: 'المالك العام ومؤسس منصة حكاوي | أعلى صلاحية في النظام 👑',
    level: 99,
    exp: 9999,
    coins: 999999,
    diamonds: 999999,
    role: 'OWNER',
    isOwner: true,
    is_owner: true,
    followersCount: 9999,
    followingCount: 12,
    friendsCount: 140,
    activeFrameId: 'frame_owner_king',
    referralCode: 'HEKAWY1',
    createdAt: new Date().toISOString(),
    isOnline: true
  }
];

const SEED_ROOMS: Room[] = [];

const SEED_AGENCIES: Agency[] = [];

const SEED_HOST_PROFILES: HostProfile[] = [];

function getSeatsCountForLayout(layout: MicLayoutType = '2+15'): number {
  switch (layout) {
    case '4': return 4;
    case '5': return 5;
    case '8': return 8;
    case '10': return 10;
    case '12': return 12;
    case '15': return 15;
    case '2+10': return 12;
    case '2+15': return 17;
    default: return 12;
  }
}

function createEmptySeats(roomId: string, hostUser: User, layout: MicLayoutType = '2+15'): RoomSeat[] {
  const count = getSeatsCountForLayout(layout);
  const seats: RoomSeat[] = [];

  for (let i = 0; i < count; i++) {
    if (i === 0) {
      // Seat 0 is always the Host Seat
      seats.push({
        seatIndex: 0,
        userId: hostUser.id,
        userName: hostUser.name,
        userAvatar: hostUser.avatar,
        userGender: hostUser.gender || 'male',
        userFrameId: hostUser.activeFrameId,
        isMuted: false,
        isCameraOn: false,
        isSpeaking: false,
        isLocked: false,
        isHostSeat: true,
        isVipSeat: true,
        seatLabel: 'المضيف 👑'
      });
    } else if (i === 1 && (layout === '2+10' || layout === '2+15')) {
      // Seat 1 is VIP Co-Host Seat in 2+VIP layouts
      seats.push({
        seatIndex: 1,
        userId: null,
        isMuted: false,
        isCameraOn: false,
        isSpeaking: false,
        isLocked: false,
        isHostSeat: false,
        isVipSeat: true,
        seatLabel: 'VIP 🌟'
      });
    } else {
      const displayIndex = (layout === '2+10' || layout === '2+15') ? (i - 1) : (i + 1);
      seats.push({
        seatIndex: i,
        userId: null,
        isMuted: false,
        isCameraOn: false,
        isSpeaking: false,
        isLocked: false,
        isHostSeat: false,
        isVipSeat: false,
        seatLabel: `مايك ${displayIndex}`
      });
    }
  }
  return seats;
}

const DEFAULT_TARGET_CONFIGS: TargetConfig[] = [
  {
    id: 'target_monthly_curr',
    title: 'تارجت شهر سبتمبر 2026 الرسمي',
    period: 'MONTHLY',
    monthYear: '2026-09',
    requiredDiamonds: 50000,
    requiredLiveMinutes: 1800, // 30 hours
    requiredActiveDays: 15,
    rewardCoins: 10000,
    rewardDiamonds: 5000,
    agentCommissionPct: 15,
    isActive: true,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'target_weekly_curr',
    title: 'تارجت أسبوعي سريع للنجوم',
    period: 'WEEKLY',
    monthYear: '2026-W36',
    requiredDiamonds: 15000,
    requiredLiveMinutes: 600, // 10 hours
    requiredActiveDays: 5,
    rewardCoins: 3000,
    rewardDiamonds: 1500,
    agentCommissionPct: 10,
    isActive: true,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  }
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadData();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private purgeDemoAndFakeData(data: DatabaseSchema): void {
    if (!data) return;

    const fakeUserIds = new Set([
      'user_host_1', 'user_host_2', 'user_mod_1', 'user_agent_1', 'user_staff_1', 'user_guest_1'
    ]);
    const fakeUsernames = new Set([
      'tareq_voice', 'sara_live', 'mohanad_mod', 'sultan_agent', 'rima_staff', 'ahmed_story'
    ]);
    const fakePhones = new Set([
      '+966500000002', '+966500000003', '+966500000004', '+966500000005', '+966500000006', '+966500000007'
    ]);
    const fakeRoomIds = new Set(['room_1', 'room_2', 'room_3']);

    // 1. Purge fake users (preserve owners and real registered users)
    if (data.users) {
      data.users = data.users.filter(u => {
        if (
          u.id === 'user_admin' || 
          u.id === 'user_owner_waled' || 
          u.id === 'user_1788450708278_wtpv' ||
          u.email?.toLowerCase() === SYSTEM_OWNER_EMAIL.toLowerCase() ||
          u.email?.toLowerCase() === SYSTEM_OWNER_EMAIL_2.toLowerCase() ||
          u.username?.toLowerCase() === 'jdwalrwyy' ||
          u.username?.toLowerCase() === 'waledwwwz41' ||
          u.username?.toLowerCase() === 'waled'
        ) {
          return true;
        }
        if (
          fakeUserIds.has(u.id) || 
          (u.username && fakeUsernames.has(u.username.toLowerCase())) || 
          (u.phone && fakePhones.has(u.phone))
        ) {
          return false;
        }
        return true;
      });
    }

    const validUserIds = new Set((data.users || []).map(u => u.id));

    // 2. Purge fake rooms & rooms without valid host
    if (data.rooms) {
      data.rooms = data.rooms.filter(r => {
        if (fakeRoomIds.has(r.id)) return false;
        if (fakeUserIds.has(r.hostId)) return false;
        if (!validUserIds.has(r.hostId)) return false;
        return true;
      });
    }

    const validRoomIds = new Set((data.rooms || []).map(r => r.id));

    // 3. Clean up room members
    if (data.roomMembers) {
      data.roomMembers = data.roomMembers.filter(m => validRoomIds.has(m.roomId) && validUserIds.has(m.userId));
    }

    // 4. Clean up room seats
    if (data.roomSeats) {
      Object.keys(data.roomSeats).forEach(roomId => {
        if (!validRoomIds.has(roomId)) {
          delete data.roomSeats[roomId];
        } else {
          data.roomSeats[roomId].forEach(seat => {
            if (seat.userId && !validUserIds.has(seat.userId)) {
              seat.userId = null;
              seat.userName = undefined;
              seat.userAvatar = undefined;
              seat.isMuted = false;
              seat.isCameraOn = false;
              seat.isSpeaking = false;
            }
          });
        }
      });
    }

    // 5. Clean up messages
    if (data.messages) {
      data.messages = data.messages.filter(m => validRoomIds.has(m.roomId) && validUserIds.has(m.userId));
    }

    // 6. Clean up mic requests
    if (data.micRequests) {
      data.micRequests = data.micRequests.filter(r => validRoomIds.has(r.roomId) && validUserIds.has(r.userId));
    }

    // 7. Clean up friendships & follows
    if (data.friendships) {
      data.friendships = data.friendships.filter(f => validUserIds.has(f.user1Id) && validUserIds.has(f.user2Id));
    }
    if (data.follows) {
      data.follows = data.follows.filter(f => validUserIds.has(f.followerId) && validUserIds.has(f.followingId));
    }

    // 8. Clean up user frames & entrances
    if (data.userFrames) {
      data.userFrames = data.userFrames.filter(uf => validUserIds.has(uf.userId));
    }
    if (data.userEntrances) {
      data.userEntrances = data.userEntrances.filter(ue => validUserIds.has(ue.userId));
    }

    // 9. Clean up agencies & host profiles
    if (data.agencies) {
      data.agencies = data.agencies.filter(a => a.id !== 'agency_stars_1' && validUserIds.has(a.ownerUserId));
    }
    if (data.hostProfiles) {
      data.hostProfiles = data.hostProfiles.filter(hp => hp.id !== 'host_prof_1' && hp.id !== 'host_prof_2' && validUserIds.has(hp.userId));
    }

    // 10. Clean up notifications
    if (data.notifications) {
      data.notifications = data.notifications.filter(n => validUserIds.has(n.userId));
    }
  }

  private loadData(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const loaded: DatabaseSchema = JSON.parse(raw);
        
        // Migration / Data Integrity: Ensure all collections exist
        if (loaded && loaded.users) {
          if (!loaded.moderationIncidents) loaded.moderationIncidents = [];
          if (!loaded.bannedIdentifiers) loaded.bannedIdentifiers = [];
          if (!loaded.bans) loaded.bans = [];
          if (!loaded.hostApplications) loaded.hostApplications = [];
          if (!loaded.agentApplications) loaded.agentApplications = [];
          if (!loaded.agencies) loaded.agencies = [];
          if (!loaded.hostProfiles) loaded.hostProfiles = [];
          if (!loaded.targetConfigs || loaded.targetConfigs.length === 0) loaded.targetConfigs = DEFAULT_TARGET_CONFIGS;
          loaded.giftTierSettings = DEFAULT_GIFT_TIER_SETTINGS;

          loaded.users.forEach(u => {
            if (!u.gender) {
              u.gender = 'male';
            }
          });

          // Ensure roomSeats have proper userGender
          if (loaded.roomSeats) {
            Object.values(loaded.roomSeats).forEach(seats => {
              seats.forEach(s => {
                if (s.userId) {
                  const targetUser = loaded.users.find(usr => usr.id === s.userId);
                  if (targetUser) {
                    s.userGender = targetUser.gender;
                  }
                }
              });
            });
          }
          // Ensure gifts catalog is always updated to latest specification
          loaded.gifts = DEFAULT_GIFTS;

          // Ensure referrals collection exists and each user has unique uppercase referralCode
          loaded.referrals = loaded.referrals || [];
          const existingCodes = new Set<string>();
          loaded.users.forEach(u => {
            if (u.referralCode) {
              u.referralCode = u.referralCode.trim().toUpperCase();
              existingCodes.add(u.referralCode);
            }
          });
          loaded.users.forEach(u => {
            if (!u.referralCode) {
              const baseName = (u.username || 'USR').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 6);
              let code = `${baseName || 'HKW'}${Math.floor(100 + Math.random() * 900)}`;
              while (existingCodes.has(code)) {
                code = `HKW${Math.floor(10000 + Math.random() * 90000)}`;
              }
              u.referralCode = code;
              existingCodes.add(code);
            }
          });

          // Ensure System Owner Account Integrity & Numeric IDs
          loaded.shippingRechargeLogs = loaded.shippingRechargeLogs || [];
          loaded.deviceBindings = loaded.deviceBindings || [];
          this.ensureOwnerIntegrity(loaded);
          this.ensureNumericIdsIntegrity(loaded);
          this.purgeDemoAndFakeData(loaded);
        }
        return loaded;
      } catch (err) {
        console.error('Failed to parse db file, initializing new default db:', err);
      }
    }
    const initial = this.initializeDefaultData();
    this.ensureOwnerIntegrity(initial);
    this.ensureNumericIdsIntegrity(initial);
    this.purgeDemoAndFakeData(initial);
    return initial;
  }

  public generateUniqueNumericIdWithData(data: DatabaseSchema): string {
    const existingIds = new Set(data.users.map(u => u.numericId).filter(Boolean));
    const reservedIds = new Set(data.reservedNumericIds || []);

    let attempts = 0;
    while (attempts < 20000) {
      // 6-digit random number composed of different digits (non-sequential)
      const val = Math.floor(100000 + Math.random() * 900000).toString();

      const isRepeating = /^(\d)\1+$/.test(val);
      const isSequentialAsc = '01234567890123456789'.includes(val);
      const isSequentialDesc = '98765432109876543210'.includes(val);

      if (!existingIds.has(val) && !reservedIds.has(val) && !isRepeating && !isSequentialAsc && !isSequentialDesc) {
        return val;
      }
      attempts++;
    }

    let fallbackVal = Math.floor(1000000 + Math.random() * 9000000).toString();
    while (existingIds.has(fallbackVal) || reservedIds.has(fallbackVal)) {
      fallbackVal = Math.floor(1000000 + Math.random() * 9000000).toString();
    }
    return fallbackVal;
  }

  public generateUniqueNumericId(): string {
    return this.generateUniqueNumericIdWithData(this.data);
  }

  private ensureNumericIdsIntegrity(data: DatabaseSchema): void {
    if (!data.users) data.users = [];
    if (!data.reservedNumericIds) data.reservedNumericIds = [];

    const existingNumericIds = new Set<string>();

    // Pass 1: Collect valid existing numeric IDs and remove duplicates
    data.users.forEach(u => {
      if (u.numericId) {
        const clean = String(u.numericId).trim();
        if (existingNumericIds.has(clean) || !/^\d+$/.test(clean)) {
          u.numericId = '' as any;
        } else {
          u.numericId = clean;
          existingNumericIds.add(clean);
        }
      }
    });

    // Pass 2: Assign a unique random numeric ID to any account missing one
    data.users.forEach(u => {
      if (!u.numericId) {
        let newId = '';
        if (u.username === 'jdwalrwyy' && !existingNumericIds.has('888888')) {
          newId = '888888';
          u.isVipNumericId = true;
        } else if ((u.username === 'waledwwwz41' || u.username === 'waled') && !existingNumericIds.has('777777')) {
          newId = '777777';
          u.isVipNumericId = true;
        } else {
          newId = this.generateUniqueNumericIdWithData(data);
        }
        u.numericId = newId;
        existingNumericIds.add(newId);
      }
    });
  }

  private ensureOwnerIntegrity(data: DatabaseSchema): void {
    if (!data.users) data.users = [];

    // 1. Locate Owner 1 account (jdwalrwyy@gmail.com)
    let ownerUser = data.users.find(u => 
      (u.email && u.email.toLowerCase() === SYSTEM_OWNER_EMAIL.toLowerCase()) ||
      u.id === 'user_admin' ||
      u.username?.toLowerCase() === 'jdwalrwyy'
    );

    if (ownerUser) {
      ownerUser.id = ownerUser.id || 'user_admin';
      ownerUser.name = SYSTEM_OWNER_NAME;
      ownerUser.username = 'jdwalrwyy';
      ownerUser.email = SYSTEM_OWNER_EMAIL;
      ownerUser.role = 'OWNER';
      ownerUser.isOwner = true;
      ownerUser.is_owner = true;
      ownerUser.isBanned = false;
      ownerUser.banReason = undefined;
      ownerUser.activeFrameId = 'frame_owner_king';
      if (!ownerUser.coins || ownerUser.coins < 100000) ownerUser.coins = 999999;
      if (!ownerUser.diamonds || ownerUser.diamonds < 50000) ownerUser.diamonds = 999999;
      if (!ownerUser.level || ownerUser.level < 50) ownerUser.level = 99;
    } else {
      ownerUser = {
        id: 'user_admin',
        name: SYSTEM_OWNER_NAME,
        username: 'jdwalrwyy',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        gender: 'male',
        phone: '+966500000001',
        email: SYSTEM_OWNER_EMAIL,
        bio: 'المالك العام ومؤسس منصة حكاوي | أعلى صلاحية في النظام 👑',
        level: 99,
        exp: 9999,
        coins: 999999,
        diamonds: 999999,
        role: 'OWNER',
        isOwner: true,
        is_owner: true,
        followersCount: 9999,
        followingCount: 12,
        friendsCount: 140,
        activeFrameId: 'frame_owner_king',
        referralCode: 'HEKAWY1',
        createdAt: new Date().toISOString(),
        isOnline: true
      };
      data.users.unshift(ownerUser);
    }

    // 2. Locate / Ensure Owner 2 account (waledwwwz41@gmail.com)
    let owner2User = data.users.find(u =>
      (u.email && u.email.toLowerCase() === SYSTEM_OWNER_EMAIL_2.toLowerCase()) ||
      u.id === 'user_owner_waled' ||
      u.id === 'user_1788450708278_wtpv' ||
      u.username?.toLowerCase() === 'waledwwwz41' ||
      u.username?.toLowerCase() === 'waled'
    );

    if (owner2User) {
      owner2User.id = owner2User.id || 'user_owner_waled';
      if (!owner2User.name || owner2User.name === 'المدير' || owner2User.name.includes('Google')) {
        owner2User.name = SYSTEM_OWNER_NAME_2;
      }
      owner2User.email = SYSTEM_OWNER_EMAIL_2;
      owner2User.role = 'OWNER';
      owner2User.isOwner = true;
      owner2User.is_owner = true;
      owner2User.isBanned = false;
      owner2User.banReason = undefined;
      owner2User.activeFrameId = 'frame_owner_king';
      if (!owner2User.coins || owner2User.coins < 100000) owner2User.coins = 999999;
      if (!owner2User.diamonds || owner2User.diamonds < 50000) owner2User.diamonds = 999999;
      if (!owner2User.level || owner2User.level < 50) owner2User.level = 99;
    } else {
      owner2User = {
        id: 'user_owner_waled',
        name: SYSTEM_OWNER_NAME_2,
        username: 'waledwwwz41',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        gender: 'male',
        phone: '+966500000002',
        email: SYSTEM_OWNER_EMAIL_2,
        bio: 'المالك العام وشريك مؤسس في منصة حكاوي | أعلى صلاحية في النظام 👑',
        level: 99,
        exp: 9999,
        coins: 999999,
        diamonds: 999999,
        role: 'OWNER',
        isOwner: true,
        is_owner: true,
        followersCount: 9999,
        followingCount: 12,
        friendsCount: 140,
        activeFrameId: 'frame_owner_king',
        referralCode: 'WALED1',
        createdAt: new Date().toISOString(),
        isOnline: true
      };
      data.users.push(owner2User);
    }

    // 3. Remove any bans on either of the owners
    const ownerIds = [ownerUser?.id, owner2User?.id, 'user_admin', 'user_owner_waled', 'user_1788450708278_wtpv'].filter(Boolean) as string[];
    if (data.bans) {
      data.bans = data.bans.filter(b => !ownerIds.includes(b.userId));
    }
    if (data.bannedIdentifiers) {
      data.bannedIdentifiers = data.bannedIdentifiers.filter(b => 
        !SYSTEM_OWNER_EMAILS.some(e => e.toLowerCase() === b.value.toLowerCase()) &&
        !ownerIds.includes(b.value) &&
        b.value.toLowerCase() !== 'jdwalrwyy' &&
        b.value.toLowerCase() !== 'waledwwwz41' &&
        b.value.toLowerCase() !== 'waled'
      );
    }

    // 4. Ensure Both Owners own the exclusive King Frame
    if (data.userFrames) {
      [ownerUser, owner2User].forEach(ow => {
        if (ow) {
          const hasKingFrame = data.userFrames.some(uf => uf.userId === ow.id && uf.frameId === 'frame_owner_king');
          if (!hasKingFrame) {
            data.userFrames.push({
              id: `uf_owner_king_${ow.id}_${Date.now()}`,
              userId: ow.id,
              frameId: 'frame_owner_king',
              acquiredAt: new Date().toISOString()
            });
          }
        }
      });
    }

    // 5. Ensure Entrances are populated with DEFAULT_ENTRANCES
    data.entrances = DEFAULT_ENTRANCES;

    if (!data.userEntrances) data.userEntrances = [];

    // Grant all entrances to owner accounts & set activeEntranceId to entrance_royal_luxury_car_5d
    if (ownerUser || owner2User) {
      [ownerUser, owner2User].forEach(ow => {
        if (ow) {
          ow.activeEntranceId = 'entrance_royal_luxury_car_5d';
          DEFAULT_ENTRANCES.forEach(ent => {
            const hasEnt = data.userEntrances.some(ue => ue.userId === ow.id && ue.entranceId === ent.id);
            if (!hasEnt) {
              data.userEntrances.push({
                id: `ue_${ow.id}_${ent.id}_${Date.now()}`,
                userId: ow.id,
                entranceId: ent.id,
                acquiredAt: new Date().toISOString()
              });
            }
          });
        }
      });
    }
  }

  private initializeDefaultData(): DatabaseSchema {
    const roomSeats: Record<string, RoomSeat[]> = {};
    const roomMembers: RoomMember[] = [];
    const initialMessages: RoomMessage[] = [];

    const initialData: DatabaseSchema = {
      users: [...SEED_USERS],
      rooms: [],
      roomMembers,
      roomSeats,
      micRequests: [],
      messages: initialMessages,
      privateMessages: [],
      friendships: [],
      follows: [],
      gifts: DEFAULT_GIFTS,
      giftTransactions: [],
      walletTransactions: [],
      dailyTasks: DEFAULT_TASKS,
      userDailyTaskProgress: [],
      frames: DEFAULT_FRAMES,
      userFrames: [
        { id: `uf_1_${Date.now()}`, userId: 'user_admin', frameId: 'frame_owner_king', acquiredAt: new Date().toISOString() }
      ],
      entrances: DEFAULT_ENTRANCES,
      userEntrances: [],
      reports: [],
      bans: [],
      auditLogs: [
        {
          id: 'audit_init',
          adminId: 'user_admin',
          adminName: 'حكاوي VIP',
          action: 'SYSTEM_BOOTSTRAP',
          targetType: 'SYSTEM',
          targetId: 'hekawy_core',
          details: 'تم بدء تشغيل منصة حكاوي بنجاح مع تهيئة السيرفر وقاعدة البيانات ونظام الرقابة الصارم.',
          createdAt: new Date().toISOString()
        }
      ],
      moderationIncidents: [],
      bannedIdentifiers: [],
      notifications: [],
      hostApplications: [],
      agentApplications: [],
      agencies: [],
      hostProfiles: [],
      targetConfigs: DEFAULT_TARGET_CONFIGS,
      giftTierSettings: DEFAULT_GIFT_TIER_SETTINGS,
      referrals: [],
      shippingRechargeLogs: []
    };

    this.saveData(initialData);
    return initialData;
  }

  public save() {
    this.saveData(this.data);
  }

  private saveData(dataToSave: DatabaseSchema) {
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  // --- GETTERS & ACTIONS ---

  private activeOwnerTokens: Set<string> = new Set<string>();

  public verifyOwnerPin(pin?: string): boolean {
    if (!pin) return false;
    return String(pin).trim() === SYSTEM_OWNER_PIN;
  }

  public createOwnerSession(): string {
    const token = `owner_tok_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    this.activeOwnerTokens.add(token);
    return token;
  }

  public validateOwnerToken(token?: string): boolean {
    if (!token) return false;
    return this.activeOwnerTokens.has(token);
  }

  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    if (!id) return undefined;
    const clean = String(id).trim();
    const user = this.data.users.find(u => u.id === clean || (u.numericId && u.numericId === clean));
    if (user) {
      user.canRecharge = this.canUserRecharge(user.id);
    }
    return user;
  }

  public getUserByNumericId(numericId: string): User | undefined {
    if (!numericId) return undefined;
    const clean = String(numericId).trim();
    const user = this.data.users.find(u => u.numericId === clean);
    if (user) {
      user.canRecharge = this.canUserRecharge(user.id);
    }
    return user;
  }

  public isIdentifierBanned(value?: string): { banned: boolean; reason?: string } {
    if (!value) return { banned: false };
    const clean = value.trim().toLowerCase();
    
    // Check bannedIdentifiers list
    const foundId = this.data.bannedIdentifiers?.find(b => b.value.toLowerCase() === clean);
    if (foundId) {
      return { banned: true, reason: foundId.reason || 'تم حظر هذا الحساب/المعرف نهائياً لمخالفة سياسة المحتوى والآداب العامة' };
    }

    // Check if matching any banned user
    const bannedUser = this.data.users.find(u => 
      u.isBanned && (
        u.id === clean ||
        u.username.toLowerCase() === clean ||
        u.phone === clean ||
        (u.email && u.email.toLowerCase() === clean) ||
        (u.googleId && u.googleId === clean)
      )
    );
    if (bannedUser) {
      return { banned: true, reason: bannedUser.banReason || 'تم حظر الحساب نهائياً لمخالفة سياسة المحتوى والحشمة' };
    }

    return { banned: false };
  }

  public getUserByUsername(username: string): User | undefined {
    const user = this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (user) {
      user.canRecharge = this.canUserRecharge(user.id);
    }
    return user;
  }

  public getUserByPhone(phone: string): User | undefined {
    const user = this.data.users.find(u => u.phone === phone);
    if (user) {
      user.canRecharge = this.canUserRecharge(user.id);
    }
    return user;
  }

  public getUserByGoogleId(googleId: string): User | undefined {
    const user = this.data.users.find(u => u.googleId === googleId);
    if (user) {
      user.canRecharge = this.canUserRecharge(user.id);
    }
    return user;
  }

  public getUserByEmail(email: string): User | undefined {
    const user = this.data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (user) {
      user.canRecharge = this.canUserRecharge(user.id);
    }
    return user;
  }

  public isOwner(userId?: string): boolean {
    if (!userId) return false;
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return false;
    return (
      user.role === 'OWNER' ||
      user.isOwner === true ||
      user.is_owner === true ||
      isSystemOwnerEmail(user.email) ||
      isSystemOwnerUsername(user.username) ||
      user.id === 'user_admin' ||
      user.id === 'user_owner_waled' ||
      user.id === 'user_1788450708278_wtpv'
    );
  }

  /**
   * Temporary Recharge Restriction Policy:
   * When true, diamond recharge (paid top-up, agent transfers, etc.)
   * is suspended for regular users and agents, and restricted EXCLUSIVELY to the system OWNER.
   * Reversible via admin toggle or setRechargeRestrictedToOwner(false).
   */
  public rechargeRestrictedToOwner: boolean = true;

  public canUserRecharge(userId?: string): boolean {
    if (!userId) return false;
    if (this.rechargeRestrictedToOwner) {
      return this.isOwner(userId);
    }
    return true;
  }

  public setRechargeRestrictedToOwner(restricted: boolean): void {
    this.rechargeRestrictedToOwner = restricted;
  }

  public isAdminOrOwner(userId?: string): boolean {
    if (!userId) return false;
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return false;
    return (
      this.isOwner(userId) ||
      user.role === 'OWNER' ||
      user.role === 'STAFF' ||
      user.role === 'MODERATOR'
    );
  }

  public loginOrCreateWithGoogle(payload: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
    referredBy?: string;
  }): User {
    const { googleId, email, name, avatar, referredBy } = payload;
    const isSystemOwner = isSystemOwnerEmail(email);

    // Anti-Bypass Ban Checks (Except for verified system owner account)
    if (!isSystemOwner) {
      const banCheckGoogle = this.isIdentifierBanned(googleId);
      if (banCheckGoogle.banned) {
        throw new Error(`حسابك محظور نهائياً: ${banCheckGoogle.reason}`);
      }
      const banCheckEmail = this.isIdentifierBanned(email);
      if (banCheckEmail.banned) {
        throw new Error(`حسابك محظور نهائياً: ${banCheckEmail.reason}`);
      }
    }
    
    // Check if logging in as System Owner
    if (isSystemOwner) {
      const cleanEmail = email.trim().toLowerCase();
      let owner = this.data.users.find(u => 
        (u.email && u.email.toLowerCase() === cleanEmail) ||
        (cleanEmail === SYSTEM_OWNER_EMAIL.toLowerCase() && (u.id === 'user_admin' || u.username?.toLowerCase() === 'jdwalrwyy')) ||
        (cleanEmail === SYSTEM_OWNER_EMAIL_2.toLowerCase() && (u.id === 'user_owner_waled' || u.id === 'user_1788450708278_wtpv' || u.username?.toLowerCase() === 'waledwwwz41' || u.username?.toLowerCase() === 'waled'))
      );

      if (owner) {
        owner.googleId = googleId;
        owner.role = 'OWNER';
        owner.isOwner = true;
        owner.is_owner = true;
        owner.isBanned = false;
        owner.banReason = undefined;
        owner.email = cleanEmail;
        owner.activeFrameId = 'frame_owner_king';
        owner.isOnline = true;
        if (cleanEmail === SYSTEM_OWNER_EMAIL.toLowerCase()) {
          owner.name = SYSTEM_OWNER_NAME;
          owner.username = 'jdwalrwyy';
        } else if (cleanEmail === SYSTEM_OWNER_EMAIL_2.toLowerCase()) {
          if (!owner.name || owner.name === 'المدير' || owner.name.includes('Google')) {
            owner.name = SYSTEM_OWNER_NAME_2;
          }
          if (!owner.username) owner.username = 'waledwwwz41';
        }
        if (avatar && (!owner.avatar || owner.avatar.includes('dicebear'))) {
          owner.avatar = avatar;
        }
        this.addAuditLog({
          adminId: owner.id,
          adminName: owner.name,
          action: 'OWNER_AUTH_LOGIN',
          targetType: 'SYSTEM',
          targetId: owner.id,
          details: `تسجيل دخول المالك العام للنظام (${owner.name} - ${owner.email}) عبر المصادقة المركزية بنجاح.`
        });
        this.save();
        return owner;
      }
    }

    // 1. Try finding by Google ID
    let user = this.getUserByGoogleId(googleId);
    
    // 2. If not found by Google ID, try finding by Email
    if (!user && email) {
      user = this.getUserByEmail(email);
      if (user) {
        if (user.isBanned && !this.isOwner(user.id)) {
          throw new Error(`حسابك محظور: ${user.banReason || 'مخالفة معايير المجتمع'}`);
        }
        // Link Google ID to existing account
        user.googleId = googleId;
        if (avatar && (!user.avatar || user.avatar.includes('dicebear'))) {
          user.avatar = avatar;
        }
        user.isOnline = true;
        this.save();
        return user;
      }
    }

    if (user) {
      if (user.isBanned && !this.isOwner(user.id)) {
        throw new Error(`حسابك محظور: ${user.banReason || 'مخالفة معايير المجتمع'}`);
      }
      // Existing Google user - update avatar or name if changed
      if (avatar && (!user.avatar || user.avatar.includes('dicebear'))) {
        user.avatar = avatar;
      }
      user.isOnline = true;
      this.save();
      return user;
    }

    // 3. Brand new user -> create with Google information
    const cleanEmailName = (email ? email.split('@')[0] : 'user')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .toLowerCase();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    let username = cleanEmailName || `user_${randomSuffix}`;
    
    // Ensure unique username
    if (this.getUserByUsername(username)) {
      username = `${username}_${randomSuffix}`;
    }

    const id = `user_g_${googleId.substring(0, 12)}_${Date.now()}`;
    const newUser: User = {
      id,
      name: name || `مستخدم Google ${randomSuffix}`,
      username,
      avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      email,
      googleId,
      bio: 'عضو عبر حساب Google في مجتمع حكاوي 🎙️',
      level: 1,
      exp: 0,
      coins: 500, // Welcome bonus
      diamonds: 100, // Welcome bonus
      role: isSystemOwner ? 'OWNER' : 'USER',
      isOwner: isSystemOwner ? true : undefined,
      is_owner: isSystemOwner ? true : undefined,
      followersCount: 0,
      followingCount: 0,
      friendsCount: 0,
      activeFrameId: isSystemOwner ? 'frame_owner_king' : undefined,
      referralCode: `HKW${Math.floor(10000 + Math.random() * 90000)}`,
      referredBy: referredBy ? referredBy.trim().toUpperCase() : undefined,
      createdAt: new Date().toISOString(),
      isOnline: true
    };

    this.data.users.push(newUser);
    this.addWalletTransaction(newUser.id, 'COIN', 500, 500, 'مكافأة التسجيل والترحيب بحساب Google في حكاوي');
    this.addWalletTransaction(newUser.id, 'DIAMOND', 100, 100, 'رصيد ماسات ترحيبي');
    
    this.addNotification({
      userId: newUser.id,
      title: 'مرحباً بك في حكاوي! 🎙️✨',
      message: 'تم تسجيل دخولك بنجاح باستخدام حساب Google وحصلت على 500 كونز و 100 ماسة ترحيبية.',
      type: 'ADMIN'
    });

    // Process referral reward atomically if referred by valid code
    if (newUser.referredBy) {
      this.processReferralReward(newUser.referredBy, newUser.id);
    }

    this.save();
    return newUser;
  }

  // --- STRICT ECONOMIC LEVEL & XP SYSTEM ---

  public addXP(userId: string, xpAmount: number, sourceReason?: string): { oldLevel: number; newLevel: number; totalExp: number } {
    const user = this.getUserById(userId);
    if (!user || xpAmount <= 0) return { oldLevel: user?.level || 1, newLevel: user?.level || 1, totalExp: user?.exp || 0 };

    const oldLevel = user.level || calculateLevelFromXP(user.exp || 0);
    user.exp = (user.exp || 0) + Math.floor(xpAmount);

    const isOwner = user.role === 'OWNER' || !!user.isOwner || isSystemOwnerUsername(user.username);
    const calculatedLvl = calculateLevelFromXP(user.exp);
    const newLevel = isOwner ? Math.max(user.level || 99, calculatedLvl) : calculatedLvl;
    user.level = newLevel;

    // Auto unlock any frames that user now qualifies for
    if (newLevel > oldLevel) {
      const frames = this.getFrames();
      frames.forEach(f => {
        if (!f.isExclusiveOwner && (f.requiredLevel || 1) <= newLevel) {
          const alreadyHas = this.data.userFrames.some(uf => uf.userId === user.id && uf.frameId === f.id);
          if (!alreadyHas) {
            this.data.userFrames.push({
              id: `uf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              userId: user.id,
              frameId: f.id,
              acquiredAt: new Date().toISOString()
            });
          }
        }
      });

      this.addNotification({
        userId: user.id,
        title: 'تهانينا! ارتقيت لمستوى جديد! 🎉🌟',
        message: `مبروك! لقد وصلت إلى المستوى ${newLevel}! تم فتح الإطارات المخصصة لهذا المستوى تلقائياً.`,
        type: 'SYSTEM'
      });
    }

    this.save();
    return { oldLevel, newLevel, totalExp: user.exp };
  }

  // --- ATOMIC REFERRAL SYSTEM ---

  public processReferralReward(referrerCode: string, newUserId: string): { success: boolean; message: string; reward?: number } {
    if (!referrerCode || !newUserId) {
      return { success: false, message: 'بيانات الإحالة غير مكتملة' };
    }

    const cleanCode = referrerCode.trim().toUpperCase();
    const newUser = this.getUserById(newUserId);
    if (!newUser) {
      return { success: false, message: 'المستخدم الجديد غير موجود' };
    }

    this.data.referrals = this.data.referrals || [];

    // Check if this new user has ALREADY been rewarded/recorded (strictly once per new user)
    const alreadyReferred = this.data.referrals.some(
      r => r.referred_user_id === newUser.id && r.status === 'COMPLETED'
    );
    if (alreadyReferred) {
      return { success: false, message: 'تم احتساب إحالة هذا المستخدم مسبقاً' };
    }

    // Locate the referrer by referralCode (case-insensitive)
    const referrer = this.data.users.find(u => 
      u.referralCode?.toUpperCase() === cleanCode
    );
    if (!referrer) {
      return { success: false, message: 'رمز الإحالة غير صالح أو غير موجود' };
    }

    // Anti-Fraud: Cannot refer yourself
    if (
      referrer.id === newUser.id ||
      (referrer.email && newUser.email && referrer.email.toLowerCase() === newUser.email.toLowerCase()) ||
      (referrer.phone && newUser.phone && referrer.phone === newUser.phone)
    ) {
      return { success: false, message: 'لا يمكن للمستخدم إحالة نفسه' };
    }

    // Atomic reward: 10 coins to the referrer
    const rewardAmount = 10;
    const prevBalance = referrer.coins || 0;
    referrer.coins = prevBalance + rewardAmount;
    const newBalance = referrer.coins;

    const referralRecord: ReferralRecord = {
      referral_id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      referrer_user_id: referrer.id,
      referred_user_id: newUser.id,
      referral_code: cleanCode,
      status: 'COMPLETED',
      reward_amount: rewardAmount,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    };
    this.data.referrals.push(referralRecord);

    // Record wallet transaction with previous and new balance
    this.addWalletTransaction(
      referrer.id,
      'COIN',
      rewardAmount,
      newBalance,
      `مكافأة دعوة مستخدم جديد (${newUser.name} - @${newUser.username}) عبر رابط الإحالة [${cleanCode}] | رصيد قبل: ${prevBalance}، رصيد بعد: ${newBalance}`
    );

    // Send notification to referrer
    this.addNotification({
      userId: referrer.id,
      title: 'مكافأة إحالة جديدة 🎁 (+10 كونز)',
      message: `قام صديقك ${newUser.name} بالتسجيل بنجاح عبر رابط الإحالة الخاص بك! تمت إضافة 10 كونز إلى رصيدك.`,
      type: 'INVITE'
    });

    // Increment task progress
    this.incrementDailyTaskProgress(referrer.id, 'INVITE_FRIEND', 1);
    this.incrementDailyTaskProgress(referrer.id, 'SHARE_APP', 1);

    this.save();
    return {
      success: true,
      message: `تم منح ${rewardAmount} كونز لصاحب رابط الإحالة (${referrer.name}) بنجاح`,
      reward: rewardAmount
    };
  }

  public getReferralStats(userId: string): ReferralStats {
    const user = this.getUserById(userId);
    if (!user) {
      return {
        success: false,
        referralCode: '',
        shareUrl: '',
        successfulInvites: 0,
        earnedCoins: 0,
        history: []
      };
    }

    // Ensure referral code is generated and unique
    if (!user.referralCode) {
      const baseName = (user.username || 'USR').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 6);
      user.referralCode = `${baseName || 'HKW'}${Math.floor(100 + Math.random() * 900)}`;
      this.save();
    }

    this.data.referrals = this.data.referrals || [];
    const completed = this.data.referrals.filter(
      r => r.referrer_user_id === userId && r.status === 'COMPLETED'
    );

    const successfulInvites = completed.length;
    const earnedCoins = completed.reduce((sum, r) => sum + (r.reward_amount || 0), 0);

    const shareBaseUrl = process.env.APP_SHARE_URL || 'https://service-rooms.ai.studio/';
    const cleanBaseUrl = shareBaseUrl.endsWith('/') ? shareBaseUrl : `${shareBaseUrl}/`;
    const shareUrl = `${cleanBaseUrl}?ref=${encodeURIComponent(user.referralCode)}`;

    const history = completed.map(r => {
      const refUser = this.getUserById(r.referred_user_id);
      return {
        ...r,
        referredUserName: refUser?.name || 'مستخدم جديد',
        referredUserAvatar: refUser?.avatar
      };
    });

    return {
      success: true,
      referralCode: user.referralCode,
      shareUrl,
      successfulInvites,
      earnedCoins,
      history
    };
  }

  public createUser(userData: Partial<User>): User {
    if (userData.phone) {
      const banCheckPhone = this.isIdentifierBanned(userData.phone);
      if (banCheckPhone.banned) {
        throw new Error(`رقم الهاتف هذا محظور نهائياً: ${banCheckPhone.reason}`);
      }
    }
    if (userData.email) {
      const banCheckEmail = this.isIdentifierBanned(userData.email);
      if (banCheckEmail.banned) {
        throw new Error(`البريد الإلكتروني هذا محظور نهائياً: ${banCheckEmail.reason}`);
      }
    }
    if (userData.username) {
      const banCheckUser = this.isIdentifierBanned(userData.username);
      if (banCheckUser.banned) {
        throw new Error(`اسم المستخدم هذا محظور نهائياً: ${banCheckUser.reason}`);
      }
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const username = userData.username || `user_${randomSuffix}`;
    const name = userData.name || `مستخدم ${randomSuffix}`;
    const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Generate unique uppercase referral code
    const baseCode = (username || 'HKW').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 6);
    let myRefCode = `${baseCode || 'HKW'}${Math.floor(100 + Math.random() * 900)}`;
    const allCodes = new Set(this.data.users.map(u => u.referralCode?.toUpperCase()));
    while (allCodes.has(myRefCode)) {
      myRefCode = `HKW${Math.floor(10000 + Math.random() * 90000)}`;
    }

    const isSystemOwner = isSystemOwnerEmail(userData.email);
    const numericId = this.generateUniqueNumericId();
    
    const newUser: User = {
      id,
      numericId,
      isVipNumericId: false,
      name,
      username,
      avatar: userData.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      gender: userData.gender || 'male',
      phone: userData.phone,
      email: userData.email,
      bio: userData.bio || 'مرحباً، أنا عضو جديد في مجتمع حكاوي!',
      level: 1,
      exp: 0,
      coins: 500, // Welcome bonus
      diamonds: 100, // Welcome bonus
      role: isSystemOwner ? 'OWNER' : 'USER',
      isOwner: isSystemOwner ? true : undefined,
      is_owner: isSystemOwner ? true : undefined,
      followersCount: 0,
      followingCount: 0,
      friendsCount: 0,
      activeFrameId: isSystemOwner ? 'frame_owner_king' : undefined,
      referralCode: myRefCode,
      referredBy: userData.referredBy ? userData.referredBy.trim().toUpperCase() : undefined,
      createdAt: new Date().toISOString(),
      isOnline: true
    };

    this.data.users.push(newUser);
    this.addWalletTransaction(newUser.id, 'COIN', 500, 500, 'مكافأة التسجيل والترحيب في حكاوي');
    this.addWalletTransaction(newUser.id, 'DIAMOND', 100, 100, 'رصيد ماسات ترحيبي');

    // Process referral reward atomically on the backend
    if (newUser.referredBy) {
      this.processReferralReward(newUser.referredBy, newUser.id);
    }
    
    this.save();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.getUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates);

    // If gender was updated, propagate to all seats occupied by this user
    if (updates.gender && this.data.roomSeats) {
      Object.values(this.data.roomSeats).forEach(seats => {
        seats.forEach(s => {
          if (s.userId === id) {
            s.userGender = updates.gender;
          }
        });
      });
    }

    this.save();
    return user;
  }

  /**
   * Retrieves strictly sanitized public profile for a user.
   * Strips all private & sensitive info: email, phone, googleId, wallet coin/diamond balances, passwords.
   */
  public getPublicUserProfile(targetUserId: string, requesterUserId?: string): PublicUserProfile | null {
    const user = this.getUserById(targetUserId);
    if (!user) return null;

    let isFollowing = false;
    let friendshipStatus: 'NONE' | 'PENDING' | 'ACCEPTED' = 'NONE';

    if (requesterUserId && requesterUserId !== targetUserId) {
      isFollowing = this.isFollowing(requesterUserId, targetUserId);
      const friendship = this.data.friendships.find(
        f => (f.user1Id === requesterUserId && f.user2Id === targetUserId) ||
             (f.user1Id === targetUserId && f.user2Id === requesterUserId)
      );
      if (friendship) {
        friendshipStatus = friendship.status;
      }
    }

    const publicProfile: PublicUserProfile = {
      id: user.id,
      numericId: user.numericId,
      isVipNumericId: user.isVipNumericId || false,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      gender: user.gender,
      bio: user.bio || 'عضو في مجتمع حكاوي',
      level: user.level || 1,
      exp: user.exp || 0,
      role: user.role || 'USER',
      isOwner: user.role === 'OWNER' || user.isOwner === true || user.is_owner === true || this.isOwner(user.id),
      is_owner: user.role === 'OWNER' || user.isOwner === true || user.is_owner === true || this.isOwner(user.id),
      followersCount: user.followersCount || 0,
      followingCount: user.followingCount || 0,
      friendsCount: user.friendsCount || 0,
      activeFrameId: user.activeFrameId,
      referralCode: user.referralCode,
      createdAt: user.createdAt,
      isOnline: user.isOnline ?? true,
      isFollowing,
      friendshipStatus
    };

    return publicProfile;
  }

  /**
   * Updates a user's system role. Strictly requires caller to have OWNER or ADMIN role.
   */
  public updateUserRole(adminId: string, targetUserId: string, newRole: UserRole): { success: boolean; message: string; user?: User } {
    const admin = this.getUserById(adminId);
    if (!admin || !this.isAdminOrOwner(adminId)) {
      return { success: false, message: 'غير مصرح لك بتعديل الرتب. هذه الصلاحية للإدارة فقط.' };
    }

    const targetUser = this.getUserById(targetUserId);
    if (!targetUser) {
      return { success: false, message: 'المستخدم المستهدف غير موجود' };
    }

    // Protection for System Owner
    if (this.isOwner(targetUserId) && !this.isOwner(adminId)) {
      return { success: false, message: 'غير مصرح: لا يمكن تعديل رتبة أو صلاحيات المالك العام للنظام.' };
    }

    // Setting someone to OWNER or ADMIN, or changing an OWNER/ADMIN role, requires caller to be OWNER
    if ((newRole === 'OWNER' || newRole === 'ADMIN' || targetUser.role === 'OWNER' || targetUser.role === 'ADMIN') && !this.isOwner(adminId)) {
      return { success: false, message: 'صلاحية تعيين أو تعديل رتب المالك العام أو المشرفين محصورة بالمالك العام (Owner) حصرياً.' };
    }

    const oldRole = targetUser.role;
    targetUser.role = newRole;
    if (newRole === 'OWNER') {
      targetUser.isOwner = true;
      targetUser.is_owner = true;
    } else if (oldRole === 'OWNER' && !this.isOwner(targetUserId)) {
      targetUser.isOwner = false;
      targetUser.is_owner = false;
    }

    this.addAuditLog({
      adminId,
      adminName: admin.name,
      action: 'UPDATE_ROLE',
      targetType: 'USER',
      targetId: targetUserId,
      details: `تم ترقية/تعديل رتبة ${targetUser.name} من [${oldRole}] إلى [${newRole}] بواسطة ${admin.name} (${admin.role})`
    });

    this.addNotification({
      userId: targetUserId,
      title: 'تحديث الرتبة والصلاحيات 🎖️',
      message: `تم تحديث رتبتك في منصة حكاوي لتصبح: [${newRole}]`,
      type: 'SYSTEM'
    });

    this.save();
    return { success: true, message: `تم تحديث رتبة ${targetUser.name} إلى ${newRole} بنجاح!`, user: targetUser };
  }

  /**
   * Assigns a custom VIP numeric ID to a target user. Reserved for Admin and Owner.
   */
  public assignVipNumericId(adminId: string, targetUserId: string, newNumericId: string): { success: boolean; message: string; user?: User } {
    const admin = this.getUserById(adminId);
    if (!admin || (admin.role !== 'OWNER' && admin.role !== 'ADMIN' && !this.isOwner(adminId))) {
      return { success: false, message: 'غير مصرح: هذه العملية مخصصة للإدارة والمالك فقط' };
    }

    const cleanNumericId = String(newNumericId).trim();
    if (!/^\d+$/.test(cleanNumericId)) {
      return { success: false, message: 'الـ ID المميز يجب أن يتكون من أرقام فقط' };
    }

    if (cleanNumericId.length < 2 || cleanNumericId.length > 12) {
      return { success: false, message: 'طول الـ ID المميز يجب أن يكون بين 2 و 12 رقم' };
    }

    const targetUser = this.getUserById(targetUserId);
    if (!targetUser) {
      return { success: false, message: 'المستخدم المستهدف غير موجود' };
    }

    // Check unique constraint across all users
    const existingUserWithId = this.data.users.find(u => u.numericId === cleanNumericId && u.id !== targetUser.id);
    if (existingUserWithId) {
      return { success: false, message: `هذا الـ ID الرقمي (${cleanNumericId}) مستخدم بالفعل لحساب آخر (@${existingUserWithId.username})` };
    }

    targetUser.numericId = cleanNumericId;
    targetUser.isVipNumericId = true;

    if (!this.data.reservedNumericIds) {
      this.data.reservedNumericIds = [];
    }
    if (!this.data.reservedNumericIds.includes(cleanNumericId)) {
      this.data.reservedNumericIds.push(cleanNumericId);
    }

    this.addAuditLog({
      adminId,
      adminName: admin.name,
      action: 'UPDATE_ROLE',
      targetType: 'USER',
      targetId: targetUserId,
      details: `تم منح الـ ID الرقمي المميز [${cleanNumericId}] للمستخدم ${targetUser.name} بواسطة ${admin.name}`
    });

    this.addNotification({
      userId: targetUser.id,
      title: 'تهانينا! حصلت على ID مميز 👑✨',
      message: `تم منحك الـ ID المميز الجديد (${cleanNumericId}) بنجاح من قبل إدارة التطبيق.`,
      type: 'SYSTEM'
    });

    this.save();
    return {
      success: true,
      message: `تم تخصيص الـ ID المميز (${cleanNumericId}) بنجاح للمستخدم @${targetUser.username}`,
      user: targetUser
    };
  }

  // --- ROOMS ---

  public getRooms(): Room[] {
    return this.data.rooms
      .filter(r => r.status !== 'ENDED')
      .map(r => ({
        ...r,
        viewerCount: this.getRoomMembers(r.id).length
      }));
  }

  public getAllRooms(): Room[] {
    return this.data.rooms;
  }

  public getRoomById(id: string): Room | undefined {
    return this.data.rooms.find(r => r.id === id);
  }

  public getRoomByCode(code: string): Room | undefined {
    return this.data.rooms.find(r => r.roomCode === code);
  }

  public createRoom(roomData: {
    title: string;
    description?: string;
    coverImage?: string;
    hostId: string;
    type: 'PUBLIC' | 'PRIVATE';
    password?: string;
    allowAudio?: boolean;
    allowVideo?: boolean;
    currentCategory?: string;
    tags?: string[];
    micLayout?: MicLayoutType;
  }): Room {
    const host = this.getUserById(roomData.hostId) || SEED_USERS[0];
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    const micLayout: MicLayoutType = roomData.micLayout || '2+15';
    const seatsCount = getSeatsCountForLayout(micLayout);

    const newRoom: Room = {
      id: roomId,
      roomCode,
      title: roomData.title.trim(),
      description: roomData.description?.trim() || 'غرفة حوارية وصوتية ممتعة في حكاوي',
      coverImage: roomData.coverImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      hostId: host.id,
      hostName: host.name,
      hostAvatar: host.avatar,
      hostFrameId: host.activeFrameId,
      type: roomData.type,
      password: roomData.password,
      status: 'LIVE',
      allowAudio: roomData.allowAudio !== undefined ? roomData.allowAudio : true,
      allowVideo: roomData.allowVideo !== undefined ? roomData.allowVideo : true,
      viewerCount: 1,
      currentCategory: roomData.currentCategory || 'عام',
      createdAt: new Date().toISOString(),
      tags: roomData.tags && roomData.tags.length > 0 ? roomData.tags : ['حكاوي', 'صوت', 'لايف'],
      micLayout,
      seatsCount
    };

    this.data.rooms.unshift(newRoom);
    this.data.roomSeats[roomId] = createEmptySeats(roomId, host, micLayout);
    this.data.roomMembers.push({
      roomId,
      userId: host.id,
      userName: host.name,
      userAvatar: host.avatar,
      userFrameId: host.activeFrameId,
      roleInRoom: 'HOST',
      isMuted: false,
      isCameraOn: false,
      isSpeaking: false,
      joinedAt: new Date().toISOString()
    });

    this.save();
    return newRoom;
  }

  public updateRoom(id: string, updates: Partial<Room>): Room | undefined {
    const room = this.getRoomById(id);
    if (!room) return undefined;
    Object.assign(room, updates);
    this.save();
    return room;
  }

  public endRoom(roomId: string, adminOrHostId: string): boolean {
    const room = this.getRoomById(roomId);
    if (!room) return false;
    room.status = 'ENDED';
    room.endedAt = new Date().toISOString();
    
    // Clear seats
    if (this.data.roomSeats[roomId]) {
      this.data.roomSeats[roomId].forEach((seat, idx) => {
        seat.userId = null;
        seat.isMuted = false;
        seat.isCameraOn = false;
        seat.isSpeaking = false;
      });
    }

    this.addAuditLog({
      adminId: adminOrHostId,
      action: 'END_ROOM',
      targetType: 'ROOM',
      targetId: roomId,
      details: `تم إنهاء الغرفة (${room.title}) كود: ${room.roomCode}`
    });

    this.save();
    return true;
  }

  public deleteRoom(roomId: string, adminOrHostId: string): boolean {
    const roomIdx = this.data.rooms.findIndex(r => r.id === roomId);
    if (roomIdx === -1) return false;
    const room = this.data.rooms[roomIdx];
    this.data.rooms.splice(roomIdx, 1);
    delete this.data.roomSeats[roomId];
    this.data.roomMembers = this.data.roomMembers.filter(m => m.roomId !== roomId);
    this.data.messages = this.data.messages.filter(m => m.roomId !== roomId);
    this.data.micRequests = this.data.micRequests.filter(m => m.roomId !== roomId);

    this.addAuditLog({
      adminId: adminOrHostId,
      action: 'DELETE_ROOM',
      targetType: 'ROOM',
      targetId: roomId,
      details: `تم حذف الغرفة نهائياً (${room.title}) كود: ${room.roomCode}`
    });

    this.save();
    return true;
  }

  // --- SEATS & MIC MANAGEMENT (FLEXIBLE RESPONSIVE SEATS) ---

  public getRoomSeats(roomId: string): RoomSeat[] {
    if (!this.data.roomSeats[roomId]) {
      const room = this.getRoomById(roomId);
      const host = room ? (this.getUserById(room.hostId) || SEED_USERS[0]) : SEED_USERS[0];
      const layout = room?.micLayout || '2+10';
      this.data.roomSeats[roomId] = createEmptySeats(roomId, host, layout);
      this.save();
    }
    return this.data.roomSeats[roomId];
  }

  public changeRoomLayout(roomId: string, newLayout: MicLayoutType): { success: boolean; seats: RoomSeat[] } {
    const room = this.getRoomById(roomId);
    if (!room) return { success: false, seats: [] };

    const host = this.getUserById(room.hostId) || SEED_USERS[0];
    const targetCount = getSeatsCountForLayout(newLayout);
    const existingSeats = this.getRoomSeats(roomId);
    const newSeats = createEmptySeats(roomId, host, newLayout);

    // Copy occupied seats where possible
    for (let i = 0; i < Math.min(existingSeats.length, targetCount); i++) {
      const oldSeat = existingSeats[i];
      if (oldSeat && oldSeat.userId) {
        newSeats[i].userId = oldSeat.userId;
        newSeats[i].userName = oldSeat.userName;
        newSeats[i].userAvatar = oldSeat.userAvatar;
        newSeats[i].userGender = oldSeat.userGender;
        newSeats[i].userFrameId = oldSeat.userFrameId;
        newSeats[i].isMuted = oldSeat.isMuted;
        newSeats[i].isCameraOn = oldSeat.isCameraOn;
        newSeats[i].isSpeaking = oldSeat.isSpeaking;
        newSeats[i].isLocked = oldSeat.isLocked;
      }
    }

    // If shrinking, downgrade users who lost seats to listeners
    if (existingSeats.length > targetCount) {
      for (let i = targetCount; i < existingSeats.length; i++) {
        const removedUserId = existingSeats[i]?.userId;
        if (removedUserId) {
          const member = this.data.roomMembers.find(m => m.roomId === roomId && m.userId === removedUserId);
          if (member && member.roleInRoom === 'SPEAKER') {
            member.roleInRoom = 'LISTENER';
          }
        }
      }
    }

    this.data.roomSeats[roomId] = newSeats;
    room.micLayout = newLayout;
    room.seatsCount = targetCount;
    this.save();

    return { success: true, seats: newSeats };
  }

  public updateRoomSettings(roomId: string, userId: string, settings: {
    title?: string;
    coverImage?: string;
    description?: string;
    micLayout?: MicLayoutType;
    tags?: string[];
  }): { success: boolean; message?: string; room?: Room; seats?: RoomSeat[] } {
    const room = this.getRoomById(roomId);
    if (!room) {
      return { success: false, message: 'الغرفة غير موجودة' };
    }

    const user = this.getUserById(userId);
    const isOwnerOrHost = room.hostId === userId || user?.role === 'ADMIN' || user?.role === 'OWNER';
    if (!isOwnerOrHost) {
      return { success: false, message: 'ليس لديك صلاحية تعديل إعدادات هذه الغرفة (صاحب الغرفة فقط)' };
    }

    if (settings.title && settings.title.trim()) {
      room.title = settings.title.trim();
    }

    if (settings.coverImage && settings.coverImage.trim()) {
      room.coverImage = settings.coverImage.trim();
    }

    if (settings.description !== undefined) {
      room.description = settings.description.trim();
    }

    if (settings.tags && Array.isArray(settings.tags)) {
      room.tags = settings.tags;
    }

    let updatedSeats = this.getRoomSeats(roomId);
    if (settings.micLayout && settings.micLayout !== room.micLayout) {
      const layoutRes = this.changeRoomLayout(roomId, settings.micLayout);
      if (layoutRes.success) {
        updatedSeats = layoutRes.seats;
      }
    }

    this.save();
    return { success: true, room, seats: updatedSeats };
  }

  public assignUserToSeat(roomId: string, seatIndex: number, userId: string): { success: boolean; message?: string } {
    const seats = this.getRoomSeats(roomId);
    if (seatIndex < 0 || seatIndex >= seats.length) {
      return { success: false, message: 'رقم المايك غير صالح' };
    }
    const targetSeat = seats[seatIndex];
    if (targetSeat.isLocked) {
      return { success: false, message: 'هذا المقعد مقفل حالياً بواسطة المضيف' };
    }
    if (targetSeat.userId && targetSeat.userId !== userId) {
      return { success: false, message: 'هذا المقعد مشغول حالياً' };
    }

    // Remove user from any other seat in this room first
    seats.forEach(s => {
      if (s.userId === userId) {
        s.userId = null;
        s.userName = undefined;
        s.userAvatar = undefined;
        s.userFrameId = undefined;
        s.isMuted = false;
        s.isCameraOn = false;
        s.isSpeaking = false;
      }
    });

    const user = this.getUserById(userId);
    if (!user) return { success: false, message: 'المستخدم غير موجود' };

    targetSeat.userId = user.id;
    targetSeat.userName = user.name;
    targetSeat.userAvatar = user.avatar;
    targetSeat.userGender = user.gender || 'male';
    targetSeat.userFrameId = user.activeFrameId;
    targetSeat.isMuted = false;
    targetSeat.isCameraOn = false;
    targetSeat.isSpeaking = false;

    // Update room member role
    const member = this.data.roomMembers.find(m => m.roomId === roomId && m.userId === userId);
    if (member && member.roleInRoom === 'LISTENER') {
      member.roleInRoom = 'SPEAKER';
    }

    this.save();
    return { success: true };
  }

  public removeUserFromSeat(roomId: string, seatIndex: number): boolean {
    const seats = this.getRoomSeats(roomId);
    if (seatIndex < 0 || seatIndex >= seats.length) return false;
    const seat = seats[seatIndex];
    const removedUserId = seat.userId;
    
    seat.userId = null;
    seat.userName = undefined;
    seat.userAvatar = undefined;
    seat.userGender = undefined;
    seat.userFrameId = undefined;
    seat.isMuted = false;
    seat.isCameraOn = false;
    seat.isSpeaking = false;

    if (removedUserId) {
      const member = this.data.roomMembers.find(m => m.roomId === roomId && m.userId === removedUserId);
      if (member && member.roleInRoom === 'SPEAKER') {
        member.roleInRoom = 'LISTENER';
      }
    }

    this.save();
    return true;
  }

  public updateSeatState(roomId: string, seatIndex: number, updates: Partial<RoomSeat>): boolean {
    const seats = this.getRoomSeats(roomId);
    if (seatIndex < 0 || seatIndex >= seats.length) return false;
    Object.assign(seats[seatIndex], updates);
    this.save();
    return true;
  }

  // --- MIC REQUESTS ---

  public getMicRequests(roomId: string): MicRequest[] {
    return this.data.micRequests.filter(r => r.roomId === roomId && r.status === 'PENDING');
  }

  public getMyPendingMicRequest(roomId: string, userId: string): MicRequest | undefined {
    return this.data.micRequests.find(r => r.roomId === roomId && r.userId === userId && r.status === 'PENDING');
  }

  public addMicRequest(roomId: string, userId: string, targetSeatIndex?: number): { success: boolean; request: MicRequest; isDuplicate?: boolean; message?: string } {
    const existing = this.data.micRequests.find(r => r.roomId === roomId && r.userId === userId && r.status === 'PENDING');
    if (existing) {
      return {
        success: false,
        isDuplicate: true,
        request: existing,
        message: 'لديك طلب صعود إلى المايك قيد الانتظار بالفعل'
      };
    }

    const user = this.getUserById(userId) || SEED_USERS[0];
    const seats = this.getRoomSeats(roomId);
    let seatLabel = 'أي مقعد متاح';
    if (targetSeatIndex !== undefined && targetSeatIndex >= 0 && targetSeatIndex < seats.length) {
      seatLabel = `المقعد رقم ${targetSeatIndex + 1}`;
    }

    const req: MicRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      roomId,
      userId,
      userName: user?.name || 'مستخدم',
      userAvatar: user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
      targetSeatIndex: targetSeatIndex !== undefined && targetSeatIndex >= 0 ? targetSeatIndex : undefined,
      seatLabel,
      requestedAt: new Date().toISOString(),
      status: 'PENDING'
    };
    this.data.micRequests.push(req);
    this.save();
    return { success: true, request: req };
  }

  public cancelMicRequest(roomId: string, userId: string): boolean {
    const req = this.data.micRequests.find(r => r.roomId === roomId && r.userId === userId && r.status === 'PENDING');
    if (!req) return false;
    req.status = 'CANCELLED';
    this.save();
    return true;
  }

  public resolveMicRequest(requestId: string, status: 'ACCEPTED' | 'REJECTED', targetSeatIndex?: number): { success: boolean; request?: MicRequest; assignedSeatIndex?: number } {
    const req = this.data.micRequests.find(r => r.id === requestId);
    if (!req) return { success: false };
    req.status = status;

    let assignedSeatIndex: number | undefined = undefined;

    if (status === 'ACCEPTED') {
      const seats = this.getRoomSeats(req.roomId);
      let seatToAssign = -1;
      if (targetSeatIndex !== undefined && targetSeatIndex >= 0 && !seats[targetSeatIndex]?.userId && !seats[targetSeatIndex]?.isLocked) {
        seatToAssign = targetSeatIndex;
      } else if (req.targetSeatIndex !== undefined && req.targetSeatIndex >= 0 && !seats[req.targetSeatIndex]?.userId && !seats[req.targetSeatIndex]?.isLocked) {
        seatToAssign = req.targetSeatIndex;
      } else {
        seatToAssign = seats.findIndex(s => !s.userId && !s.isLocked);
      }

      if (seatToAssign !== -1) {
        this.assignUserToSeat(req.roomId, seatToAssign, req.userId);
        assignedSeatIndex = seatToAssign;
      }
    }

    this.save();
    return { success: true, request: req, assignedSeatIndex };
  }

  // --- ROOM MEMBERS ---

  public getRoomMembers(roomId: string, includeStealth: boolean = false): RoomMember[] {
    return this.data.roomMembers.filter(m => m.roomId === roomId && (includeStealth || !m.isStealth));
  }

  public addRoomMember(roomId: string, userId: string, isStealth: boolean = false): RoomMember {
    let member = this.data.roomMembers.find(m => m.roomId === roomId && m.userId === userId);
    const user = this.getUserById(userId) || SEED_USERS[0];
    const room = this.getRoomById(roomId);
    const isHost = room?.hostId === userId;
    const effectiveStealth = this.isOwner(user.id) ? Boolean(isStealth || user.isStealthMode) : false;

    if (!member) {
      member = {
        roomId,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        userFrameId: user.activeFrameId,
        userEntranceId: user.activeEntranceId || undefined,
        roleInRoom: isHost ? 'HOST' : (user.role === 'ADMIN' || user.role === 'OWNER' ? 'MODERATOR' : 'LISTENER'),
        isMuted: false,
        isCameraOn: false,
        isSpeaking: false,
        isStealth: effectiveStealth,
        joinedAt: new Date().toISOString()
      };
      this.data.roomMembers.push(member);
      
      // Update viewer count
      if (room) {
        room.viewerCount = this.getRoomMembers(roomId).length;
      }
      this.save();
    } else {
      member.isStealth = effectiveStealth;
    }
    return member;
  }

  public removeRoomMember(roomId: string, userId: string): boolean {
    const idx = this.data.roomMembers.findIndex(m => m.roomId === roomId && m.userId === userId);
    if (idx !== -1) {
      this.data.roomMembers.splice(idx, 1);
      
      // Free seat if user was on mic
      const seats = this.getRoomSeats(roomId);
      const userSeatIndex = seats.findIndex(s => s.userId === userId);
      if (userSeatIndex !== -1) {
        this.removeUserFromSeat(roomId, userSeatIndex);
      }

      const room = this.getRoomById(roomId);
      if (room) {
        room.viewerCount = this.getRoomMembers(roomId).length;
      }
      this.save();
      return true;
    }
    return false;
  }

  // --- MESSAGES & CHAT ---

  public getRoomMessages(roomId: string, limit: number = 100): RoomMessage[] {
    return this.data.messages
      .filter(m => m.roomId === roomId && !m.isModerated)
      .slice(-limit);
  }

  public addRoomMessage(msg: {
    roomId: string;
    userId: string;
    text: string;
    giftData?: any;
  }): RoomMessage {
    const user = this.getUserById(msg.userId) || SEED_USERS[0];
    const newMessage: RoomMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      roomId: msg.roomId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      userFrameId: user.activeFrameId,
      userRole: user.role,
      text: msg.text.trim(),
      createdAt: new Date().toISOString(),
      isModerated: false,
      giftData: msg.giftData
    };
    this.data.messages.push(newMessage);
    this.save();
    return newMessage;
  }

  public deleteMessage(messageId: string, adminOrModId: string): boolean {
    const msg = this.data.messages.find(m => m.id === messageId);
    if (!msg) return false;
    msg.isModerated = true;
    this.addAuditLog({
      adminId: adminOrModId,
      action: 'DELETE_MESSAGE',
      targetType: 'MESSAGE',
      targetId: messageId,
      details: `تم حذف الرسالة المخالفة: "${msg.text}" بواسطة المشرف`
    });
    this.save();
    return true;
  }

  // --- GIFTS & SERVER-SIDE TRANSACTIONS (IDEMPOTENT & SAFE) ---

  public getGifts(): Gift[] {
    return this.data.gifts;
  }

  public sendGift(params: {
    senderId: string;
    receiverId: string;
    giftId: string;
    count: number;
    roomId?: string;
    idempotencyKey?: string;
  }): { success: boolean; message: string; transaction?: GiftTransaction; senderNewDiamonds?: number; receiverNewCoins?: number; user?: User } {
    const { senderId, receiverId, giftId, count, roomId, idempotencyKey } = params;

    if (count <= 0 || !Number.isInteger(count)) {
      return { success: false, message: 'عدد الهدايا غير صالح' };
    }

    // Check idempotency if key provided
    if (idempotencyKey) {
      const existingTx = this.data.giftTransactions.find(t => t.idempotencyKey === idempotencyKey);
      if (existingTx) {
        const sender = this.getUserById(senderId);
        return {
          success: true,
          message: 'تم إرسال الهدية بنجاح مسبقاً',
          transaction: existingTx,
          senderNewDiamonds: sender?.diamonds
        };
      }
    }

    const sender = this.getUserById(senderId);
    const receiver = this.getUserById(receiverId);
    const gift = this.data.gifts.find(g => g.id === giftId);

    if (!sender) return { success: false, message: 'المرسل غير مسجل' };
    if (!receiver) return { success: false, message: 'المستلم غير مسجل' };
    if (!gift) return { success: false, message: 'الهدية غير صالحة' };

    const totalDiamonds = gift.diamondCost * count;
    const totalCoinReward = gift.coinReward * count;

    if (sender.diamonds < totalDiamonds) {
      return { success: false, message: 'رصيد الماسات غير كافٍ' };
    }

    // Deduct diamonds from sender (never allows negative)
    sender.diamonds -= totalDiamonds;
    this.addXP(sender.id, totalDiamonds, 'GIFT_SENT');

    // Add coins & support exp to receiver
    receiver.coins += totalCoinReward;
    this.addXP(receiver.id, totalDiamonds, 'GIFT_RECEIVED');

    const txId = `tx_gift_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const tx: GiftTransaction = {
      id: txId,
      giftId: gift.id,
      giftName: gift.nameAr,
      giftIcon: gift.icon,
      senderId: sender.id,
      senderName: sender.name,
      senderAvatar: sender.avatar,
      receiverId: receiver.id,
      receiverName: receiver.name,
      receiverAvatar: receiver.avatar,
      roomId,
      count,
      totalDiamonds,
      createdAt: new Date().toISOString(),
      idempotencyKey
    };

    this.data.giftTransactions.unshift(tx);

    // Record in wallet ledger
    this.addWalletTransaction(sender.id, 'DIAMOND', -totalDiamonds, sender.diamonds, `إرسال ${count}x ${gift.nameAr} إلى ${receiver.name}`);
    this.addWalletTransaction(receiver.id, 'COIN', totalCoinReward, receiver.coins, `استقبال ${count}x ${gift.nameAr} من ${sender.name}`);

    // Update Host Profile & Agency Performance in real-time
    const receiverHostProfile = this.data.hostProfiles.find(hp => hp.userId === receiver.id);
    if (receiverHostProfile) {
      receiverHostProfile.totalDiamondsReceived += totalDiamonds;
      if (receiverHostProfile.agencyId) {
        const agency = this.data.agencies.find(a => a.id === receiverHostProfile.agencyId);
        if (agency) {
          agency.totalDiamondsEarned += totalDiamonds;
        }
      }
    }

    // Update Daily Task progress for sending & receiving gifts
    this.incrementDailyTaskProgress(sender.id, 'SEND_GIFT');
    this.incrementDailyTaskProgress(receiver.id, 'RECEIVE_GIFT');

    // Create system notification for receiver
    this.addNotification({
      userId: receiver.id,
      title: 'هدية جديدة! 🎁',
      message: `أرسل لك ${sender.name} عدد ${count} ${gift.nameAr} ${gift.icon}! حصلت على ${totalCoinReward} كونز.`,
      type: 'GIFT'
    });

    this.save();
    return {
      success: true,
      message: `تم إرسال ${count}x ${gift.nameAr} بنجاح!`,
      transaction: tx,
      senderNewDiamonds: sender.diamonds,
      receiverNewCoins: receiver.coins,
      user: sender
    };
  }

  // --- WALLET & COIN/DIAMOND TOP-UP ---

  public addWalletTransaction(userId: string, type: 'COIN' | 'DIAMOND', amount: number, newBalance: number, reason: string): WalletTransaction {
    const tx: WalletTransaction = {
      id: `wtx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      type,
      amount,
      newBalance,
      reason,
      createdAt: new Date().toISOString()
    };
    this.data.walletTransactions.unshift(tx);
    return tx;
  }

  public getWalletTransactions(userId: string): WalletTransaction[] {
    return this.data.walletTransactions.filter(t => t.userId === userId);
  }

  public convertCoinsToDiamonds(userId: string, coinsAmount: number): { success: boolean; message: string; user?: User } {
    const user = this.getUserById(userId);
    if (!user) return { success: false, message: 'المستخدم غير موجود' };
    if (coinsAmount < 100 || coinsAmount % 100 !== 0) {
      return { success: false, message: 'يجب أن يكون مبلغ التحويل من مضاعفات 100 كونز' };
    }
    if (user.coins < coinsAmount) {
      return { success: false, message: 'رصيد الكونز غير كافٍ' };
    }

    const diamondsGained = Math.floor(coinsAmount / 2); // 100 coins = 50 diamonds
    user.coins -= coinsAmount;
    user.diamonds += diamondsGained;

    this.addWalletTransaction(user.id, 'COIN', -coinsAmount, user.coins, `تحويل ${coinsAmount} كونز إلى ماسات`);
    this.addWalletTransaction(user.id, 'DIAMOND', diamondsGained, user.diamonds, `استلام ${diamondsGained} ماسة من التحويل`);

    this.save();
    return { success: true, message: `تم تحويل ${coinsAmount} كونز إلى ${diamondsGained} ماسة بنجاح!`, user };
  }

  public freeTopUp(userId: string, type: 'COIN' | 'DIAMOND', amount: number, reason?: string): { success: boolean; message: string; user?: User } {
    const user = this.getUserById(userId);
    if (!user) {
      return { success: false, message: 'المستخدم غير موجود' };
    }

    // STRICT SECURITY CHECK: Strictly OWNER ONLY
    if (!this.isOwner(user.id)) {
      return {
        success: false,
        message: 'عملية مرفوضة: الشحن المجاني مخصص حصرياً للمالك العام (Owner). جميع عمليات شحن المستخدمين العاديين والوكلاء مدفوعة وممنوع الحصول على الماسات مجاناً.'
      };
    }

    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: 'يجب تحديد كمية شحن صالحة أكبر من صفر' };
    }

    const roleName = 'المالك 👑';
    const finalReason = reason || `شحن مجاني مباشر (صلاحية المالك العام 👑)`;

    if (type === 'COIN') {
      user.coins += amount;
      this.addWalletTransaction(user.id, 'COIN', amount, user.coins, finalReason);
    } else {
      user.diamonds += amount;
      this.addXP(user.id, amount, 'FREE_TOPUP');
      this.addWalletTransaction(user.id, 'DIAMOND', amount, user.diamonds, finalReason);
    }

    this.addAuditLog({
      adminId: user.id,
      action: 'FREE_WALLET_TOPUP',
      targetType: 'USER',
      targetId: user.id,
      details: `تم شحن ${amount} ${type === 'COIN' ? 'كونز' : 'ماسة'} مجاناً لحساب المالك [${user.name}]`
    });

    this.save();
    return {
      success: true,
      message: `تم الشحن المجاني بنجاح: +${amount.toLocaleString('ar-EG')} ${type === 'COIN' ? 'كونز' : 'ماسة'} 💎 (المالك العام 👑)`,
      user
    };
  }

  public paidTopUp(
    userId: string,
    params: {
      amount: number;
      price: string;
      paymentMethod: string;
      packageName?: string;
    }
  ): { success: boolean; message: string; user?: User; receipt?: any } {
    const user = this.getUserById(userId);
    if (!user) {
      return { success: false, message: 'المستخدم غير موجود' };
    }

    // Role/Permission check: Restrict recharge to OWNER temporarily
    if (!this.canUserRecharge(userId)) {
      return {
        success: false,
        message: 'عملية مرفوضة: صلاحية الشحن معطلة مؤقتاً لجميع المستخدمين والوكلاء، ومتاحة حصرياً للمالك فقط.'
      };
    }

    if (!params.amount || params.amount <= 0) {
      return { success: false, message: 'كمية الشحن غير صالحة' };
    }

    if (!params.paymentMethod) {
      return { success: false, message: 'يجب تحديد وسيلة دفع صالحة (بطاقة بنكية، مدى، Apple Pay، أو STC Pay)' };
    }

    const methodLabels: Record<string, string> = {
      MADA: 'بطاقة مدى (Mada)',
      VISA_MC: 'فيزا / ماستركارد (Visa/MC)',
      APPLE_PAY: 'Apple Pay',
      STC_PAY: 'STC Pay'
    };

    const methodLabel = methodLabels[params.paymentMethod] || params.paymentMethod;
    const txRef = 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    user.diamonds += params.amount;
    this.addXP(user.id, params.amount, 'RECHARGE');

    const txDesc = `شحن باقة مدفوعة (${params.amount.toLocaleString('ar-EG')} ماسة) - ${params.price} عبر ${methodLabel} [مرجع: ${txRef}]`;
    this.addWalletTransaction(user.id, 'DIAMOND', params.amount, user.diamonds, txDesc);

    const receipt = {
      referenceId: txRef,
      userId: user.id,
      userName: user.name,
      amount: params.amount,
      price: params.price,
      paymentMethod: methodLabel,
      timestamp: new Date().toISOString(),
      status: 'COMPLETED'
    };

    this.addNotification({
      userId: user.id,
      title: 'إيصال شحن رصيد مدفوع 🧾✨',
      message: `تمت عملية الدفع بنجاح! تم إضافة ${params.amount} ماسة إلى محفظتك. المرجع: ${txRef}`,
      type: 'SYSTEM'
    });

    this.save();
    return {
      success: true,
      message: `تمت عملية الدفع بنجاح! تم شحن ${params.amount.toLocaleString('ar-EG')} ماسة إلى محفظتك.`,
      user,
      receipt
    };
  }

  public topUpBalance(userId: string, type: 'COIN' | 'DIAMOND', amount: number, reason: string): { success: boolean; user?: User } {
    const user = this.getUserById(userId);
    if (!user) return { success: false };
    if (amount <= 0) return { success: false };

    // Strict Owner check: direct topUpBalance without payment is strictly restricted to OWNER only
    if (!this.isOwner(userId)) {
      return { success: false };
    }

    if (type === 'COIN') {
      user.coins += amount;
      this.addWalletTransaction(user.id, 'COIN', amount, user.coins, reason);
    } else {
      user.diamonds += amount;
      this.addWalletTransaction(user.id, 'DIAMOND', amount, user.diamonds, reason);
    }
    this.save();
    return { success: true, user };
  }

  // --- DAILY TASKS ---

  public getUserDailyTasks(userId: string): DailyTask[] {
    const today = new Date().toISOString().split('T')[0];
    return DEFAULT_TASKS.map(task => {
      const progressRecord = this.data.userDailyTaskProgress.find(
        p => p.userId === userId && p.taskId === task.id && p.date === today
      );
      return {
        ...task,
        progress: progressRecord ? progressRecord.progress : (task.taskType === 'DAILY_LOGIN' ? 1 : 0),
        completed: progressRecord ? progressRecord.completed : (task.taskType === 'DAILY_LOGIN'),
        claimed: progressRecord ? progressRecord.claimed : false
      };
    });
  }

  public incrementDailyTaskProgress(userId: string, taskType: DailyTask['taskType'], amount: number = 1) {
    const today = new Date().toISOString().split('T')[0];
    const task = DEFAULT_TASKS.find(t => t.taskType === taskType);
    if (!task) return;

    let progressRecord = this.data.userDailyTaskProgress.find(
      p => p.userId === userId && p.taskId === task.id && p.date === today
    );

    if (!progressRecord) {
      progressRecord = {
        userId,
        taskId: task.id,
        date: today,
        progress: 0,
        completed: false,
        claimed: false
      };
      this.data.userDailyTaskProgress.push(progressRecord);
    }

    if (!progressRecord.completed) {
      progressRecord.progress += amount;
      if (progressRecord.progress >= task.requiredCount) {
        progressRecord.progress = task.requiredCount;
        progressRecord.completed = true;
      }
      this.save();
    }
  }

  public claimDailyTaskReward(userId: string, taskId: string): { success: boolean; message: string; rewardCoins?: number } {
    const today = new Date().toISOString().split('T')[0];
    const task = DEFAULT_TASKS.find(t => t.id === taskId);
    const user = this.getUserById(userId);
    if (!task || !user) return { success: false, message: 'البيانات غير صالحة' };

    let progressRecord = this.data.userDailyTaskProgress.find(
      p => p.userId === userId && p.taskId === taskId && p.date === today
    );

    if (!progressRecord) {
      if (task.taskType === 'DAILY_LOGIN') {
        progressRecord = {
          userId,
          taskId,
          date: today,
          progress: 1,
          completed: true,
          claimed: false
        };
        this.data.userDailyTaskProgress.push(progressRecord);
      } else {
        return { success: false, message: 'المهمة لم تكتمل بعد' };
      }
    }

    if (progressRecord.claimed) {
      return { success: false, message: 'تم استلام مكافأة هذه المهمة اليوم بالفعل' };
    }

    if (!progressRecord.completed) {
      return { success: false, message: 'المهمة لم تكتمل بعد' };
    }

    progressRecord.claimed = true;
    user.coins += task.rewardCoins;

    this.addWalletTransaction(user.id, 'COIN', task.rewardCoins, user.coins, `مكافأة المهمة اليومية (${task.titleAr})`);
    this.save();

    return { success: true, message: `مبروك! حصلت على ${task.rewardCoins} كونز! 🎉`, rewardCoins: task.rewardCoins };
  }

  // --- FRAMES SYSTEM (LEVEL-BASED UNLOCK) ---

  public getFrames(): Frame[] {
    const defaultMap = new Map<string, Frame>();
    DEFAULT_FRAMES.forEach(df => defaultMap.set(df.id, df));

    // Always synchronize with DEFAULT_FRAMES to keep requiredLevel and prices up to date
    const mergedFrames: Frame[] = [];
    
    DEFAULT_FRAMES.forEach(df => {
      mergedFrames.push(df);
    });

    if (Array.isArray(this.data.frames)) {
      this.data.frames.forEach(f => {
        if (!defaultMap.has(f.id)) {
          mergedFrames.push({
            ...f,
            requiredLevel: f.requiredLevel || 1,
            diamondPrice: 0,
            coinPrice: 0
          });
        }
      });
    }

    this.data.frames = mergedFrames;
    return this.data.frames;
  }

  public getUserFrames(userId: string): string[] {
    const user = this.getUserById(userId);
    const userLevel = user ? (user.level || 1) : 1;
    const isOwnerOrAdmin = user ? (user.role === 'OWNER' || user.role === 'ADMIN' || !!user.isOwner || isSystemOwnerUsername(user.username)) : false;

    const framesList = this.getFrames();
    const dbOwned = this.data.userFrames.filter(uf => uf.userId === userId).map(uf => uf.frameId);

    const levelUnlockedFrameIds = framesList
      .filter(f => {
        if (f.isExclusiveOwner) return isOwnerOrAdmin;
        return (f.requiredLevel || 1) <= userLevel;
      })
      .map(f => f.id);

    const set = new Set([...dbOwned, ...levelUnlockedFrameIds]);
    return Array.from(set);
  }

  public purchaseFrame(userId: string, frameId: string): { success: boolean; message: string; frame?: Frame } {
    const user = this.getUserById(userId);
    const framesList = this.getFrames();
    let frame = framesList.find(f => f.id === frameId);
    
    // Normalize aliases
    if (!frame && frameId === 'frame_owner_king') frame = framesList.find(f => f.id === 'frame_king');
    if (!frame && frameId === 'frame_royal_gold') frame = framesList.find(f => f.id === 'frame_gold');

    if (!user || !frame) return { success: false, message: 'الإطار غير موجود' };

    const isOwnerOrAdmin = user.role === 'OWNER' || user.role === 'ADMIN' || !!user.isOwner || isSystemOwnerUsername(user.username);

    if (frame.isExclusiveOwner && !isOwnerOrAdmin) {
      return { success: false, message: 'إطار الإدارة والمالك حصري لمالك وإدارة التطبيق فقط 👑' };
    }

    const reqLevel = frame.requiredLevel || 1;
    if (!isOwnerOrAdmin && !frame.isExclusiveOwner && (user.level || 1) < reqLevel) {
      return { success: false, message: `هذا الإطار مغلق! يتطلب الوصول إلى المستوى ${reqLevel} لفتحه.` };
    }

    user.activeFrameId = frame.id;
    const exists = this.data.userFrames.some(uf => uf.userId === userId && uf.frameId === frame.id);
    if (!exists) {
      this.data.userFrames.push({
        id: `uf_${Date.now()}`,
        userId: user.id,
        frameId: frame.id,
        acquiredAt: new Date().toISOString()
      });
    }

    this.save();
    return { success: true, message: `تم تفعيل إطار ${frame.nameAr} بنجاح!`, frame };
  }

  public setActiveFrame(userId: string, frameId: string | null): boolean {
    const user = this.getUserById(userId);
    if (!user) return false;
    if (frameId) {
      const framesList = this.getFrames();
      let frame = framesList.find(f => f.id === frameId);
      if (!frame && frameId === 'frame_owner_king') frame = framesList.find(f => f.id === 'frame_king');

      if (!frame) return false;

      const isOwnerOrAdmin = user.role === 'OWNER' || user.role === 'ADMIN' || !!user.isOwner || isSystemOwnerUsername(user.username);
      if (frame.isExclusiveOwner && !isOwnerOrAdmin) return false;

      const owned = this.data.userFrames.some(uf => uf.userId === userId && uf.frameId === frame!.id);
      const levelUnlocked = (frame.requiredLevel || 1) <= (user.level || 1);

      if (!owned && !levelUnlocked && !isOwnerOrAdmin) {
        return false;
      }

      user.activeFrameId = frame.id;
      if (!owned) {
        this.data.userFrames.push({
          id: `uf_${Date.now()}`,
          userId: user.id,
          frameId: frame.id,
          acquiredAt: new Date().toISOString()
        });
      }
    } else {
      user.activeFrameId = undefined;
    }
    this.save();
    return true;
  }

  public assignKingFrame(ownerId: string, targetUserId: string): { success: boolean; message: string; user?: User } {
    const owner = this.getUserById(ownerId);
    if (!owner || owner.role !== 'OWNER') {
      return { success: false, message: 'غير مصرح: تخصيص إطار «ملك» متاح فقط للمالك الأساسي للتطبيق.' };
    }

    const targetUser = this.getUserById(targetUserId);
    if (!targetUser) {
      return { success: false, message: 'المستخدم المستهدف غير موجود' };
    }

    const kingFrameId = 'frame_owner_king';
    const alreadyHas = this.data.userFrames.some(uf => uf.userId === targetUserId && uf.frameId === kingFrameId);
    if (!alreadyHas) {
      this.data.userFrames.push({
        id: `uf_king_${Date.now()}`,
        userId: targetUserId,
        frameId: kingFrameId,
        acquiredAt: new Date().toISOString()
      });
    }

    targetUser.activeFrameId = kingFrameId;
    this.save();

    this.addAuditLog({
      adminId: ownerId,
      adminName: owner.name,
      action: 'ASSIGN_KING_FRAME',
      targetType: 'USER',
      targetId: targetUserId,
      details: `تم تخصيص ومنح إطار الملك الحصري للمستخدم ${targetUser.name} (@${targetUser.username})`
    });

    this.addNotification({
      userId: targetUserId,
      title: '👑 تكريم ملكي خاص من إدارة حكاوي',
      message: `تهانينا! لقد تم منحك وتفعيل إطار «الملك» الحصري على حسابك من قِبل مالك التطبيق.`,
      type: 'ADMIN'
    });

    return { success: true, message: `تم منح إطار الملك وتفعيله للمستخدم ${targetUser.name} بنجاح!`, user: targetUser };
  }

  // --- ENTRANCES SYSTEM ---

  public getEntrances(userId?: string): Entrance[] {
    const isUserOwner = userId ? this.isOwner(userId) : false;
    if (isUserOwner) {
      return this.data.entrances;
    }
    // Filter out exclusive owner entrances for regular users so they never see them in the shop
    return this.data.entrances.filter(e => !e.isExclusiveOwner);
  }

  public getEntranceById(id: string): Entrance | undefined {
    return this.data.entrances.find(e => e.id === id);
  }

  public getUserEntrances(userId: string): string[] {
    return this.data.userEntrances
      .filter(ue => ue.userId === userId)
      .map(ue => ue.entranceId);
  }

  public purchaseEntrance(userId: string, entranceId: string): { success: boolean; message: string; entrance?: Entrance; user?: User } {
    const user = this.getUserById(userId);
    const entrance = this.getEntranceById(entranceId);
    if (!user || !entrance) {
      return { success: false, message: 'الدخلة المحددة غير موجودة' };
    }

    // Owner entrance check
    if (entrance.isExclusiveOwner && !this.isOwner(userId)) {
      return { success: false, message: 'هذه الدخلة الملكية حصرية لحساب الملك فقط ولا يمكن لأي مستخدم آخر شراؤها أو استخدامها.' };
    }

    // Free entrance
    if (entrance.diamondPrice === 0) {
      user.activeEntranceId = entranceId;
      this.save();
      return { success: true, message: `تم تفعيل ${entrance.nameAr} بنجاح!`, entrance, user };
    }

    const owned = this.getUserEntrances(userId).includes(entranceId);
    if (owned) {
      user.activeEntranceId = entranceId;
      this.save();
      return { success: true, message: `تم تفعيل دخلة ${entrance.nameAr} بنجاح!`, entrance, user };
    }

    if (user.diamonds < entrance.diamondPrice) {
      return {
        success: false,
        message: `رصيدك من الماسات غير كافٍ. تحتاج إلى ${entrance.diamondPrice.toLocaleString('ar-EG')} ماسة (رصيدك الحالي: ${user.diamonds.toLocaleString('ar-EG')}).`
      };
    }

    // Deduct diamonds
    user.diamonds -= entrance.diamondPrice;
    user.activeEntranceId = entranceId;

    this.data.userEntrances.push({
      id: `ue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      entranceId: entrance.id,
      acquiredAt: new Date().toISOString()
    });

    this.addWalletTransaction(
      user.id,
      'DIAMOND',
      -entrance.diamondPrice,
      user.diamonds,
      `شراء وتفعيل دخلة ثلاثية الأبعاد (${entrance.nameAr})`
    );

    this.save();

    return {
      success: true,
      message: `مبروك! تم شراء وتفعيل دخلة ${entrance.nameAr} بنجاح!`,
      entrance,
      user
    };
  }

  public setActiveEntrance(userId: string, entranceId: string | null): boolean {
    const user = this.getUserById(userId);
    if (!user) return false;

    if (entranceId) {
      const isUserOwner = this.isOwner(userId);
      const isOwned = this.getUserEntrances(userId).includes(entranceId);
      const entrance = this.getEntranceById(entranceId);

      if (!entrance) return false;
      if (entrance.isExclusiveOwner && !isUserOwner) return false;
      if (!isOwned && entrance.diamondPrice > 0 && !isUserOwner) return false;

      user.activeEntranceId = entranceId;
    } else {
      delete user.activeEntranceId;
    }

    this.save();
    return true;
  }

  // Admin Entrance Management Methods
  public addEntrance(adminUserId: string, entranceData: any): { success: boolean; message: string; entrance?: Entrance } {
    if (!this.isAdminOrOwner(adminUserId)) {
      return { success: false, message: 'ليس لديك صلاحيات لإضافة دخلات جديدة' };
    }
    const id = entranceData.id?.trim() || `entrance_custom_${Date.now()}`;
    if (this.data.entrances.some(e => e.id === id)) {
      return { success: false, message: 'معرّف الدخلة موجود بالفعل' };
    }
    const newEntrance: Entrance = {
      id,
      nameAr: entranceData.nameAr || 'دخلة جديدة',
      nameEn: entranceData.nameEn || 'New Entrance',
      descriptionAr: entranceData.descriptionAr || 'وصف الدخلة الجديدة',
      diamondPrice: Number(entranceData.diamondPrice ?? entranceData.diamondCost) || 0,
      category: entranceData.category || 'VEHICLE',
      tier: entranceData.tier || 'LUXURY',
      durationSeconds: Number(entranceData.durationSeconds) || 5,
      soundType: entranceData.soundType || 'sparkle',
      isExclusiveOwner: Boolean(entranceData.isExclusiveOwner),
      badgeLabel: entranceData.badgeLabel || 'فاخرة',
      previewColor: entranceData.previewColor || 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      isDisabled: Boolean(entranceData.isDisabled)
    };
    this.data.entrances.push(newEntrance);
    this.save();
    return { success: true, message: 'تم إضافة الدخلة بنجاح!', entrance: newEntrance };
  }

  public updateEntrance(adminUserId: string, entranceId: string, entranceData: any): { success: boolean; message: string; entrance?: Entrance } {
    if (!this.isAdminOrOwner(adminUserId)) {
      return { success: false, message: 'ليس لديك صلاحيات لتعديل الدخلات' };
    }
    const idx = this.data.entrances.findIndex(e => e.id === entranceId);
    if (idx === -1) {
      return { success: false, message: 'الدخلة المطلوبة غير موجودة' };
    }
    const existing = this.data.entrances[idx];
    const updated: Entrance = {
      ...existing,
      nameAr: entranceData.nameAr !== undefined ? entranceData.nameAr : existing.nameAr,
      nameEn: entranceData.nameEn !== undefined ? entranceData.nameEn : existing.nameEn,
      descriptionAr: entranceData.descriptionAr !== undefined ? entranceData.descriptionAr : existing.descriptionAr,
      diamondPrice: entranceData.diamondPrice !== undefined ? Number(entranceData.diamondPrice) : (entranceData.diamondCost !== undefined ? Number(entranceData.diamondCost) : existing.diamondPrice),
      category: entranceData.category || existing.category,
      tier: entranceData.tier || existing.tier,
      durationSeconds: entranceData.durationSeconds !== undefined ? Number(entranceData.durationSeconds) : existing.durationSeconds,
      soundType: entranceData.soundType || existing.soundType,
      isExclusiveOwner: entranceData.isExclusiveOwner !== undefined ? Boolean(entranceData.isExclusiveOwner) : existing.isExclusiveOwner,
      badgeLabel: entranceData.badgeLabel !== undefined ? entranceData.badgeLabel : existing.badgeLabel,
      previewColor: entranceData.previewColor || existing.previewColor,
      isDisabled: entranceData.isDisabled !== undefined ? Boolean(entranceData.isDisabled) : existing.isDisabled
    };
    this.data.entrances[idx] = updated;
    this.save();
    return { success: true, message: 'تم تعديل الدخلة بنجاح!', entrance: updated };
  }

  public deleteEntrance(adminUserId: string, entranceId: string): { success: boolean; message: string } {
    if (!this.isAdminOrOwner(adminUserId)) {
      return { success: false, message: 'ليس لديك صلاحيات لحذف الدخلات' };
    }
    const idx = this.data.entrances.findIndex(e => e.id === entranceId);
    if (idx === -1) {
      return { success: false, message: 'الدخلة المطلوبة غير موجودة' };
    }
    this.data.entrances.splice(idx, 1);
    this.save();
    return { success: true, message: 'تم حذف الدخلة بنجاح' };
  }

  public toggleDisableEntrance(adminUserId: string, entranceId: string): { success: boolean; message: string; entrance?: Entrance } {
    if (!this.isAdminOrOwner(adminUserId)) {
      return { success: false, message: 'ليس لديك صلاحيات لتغيير حالة الدخلة' };
    }
    const entrance = this.getEntranceById(entranceId);
    if (!entrance) {
      return { success: false, message: 'الدخلة المطلوبة غير موجودة' };
    }
    entrance.isDisabled = !entrance.isDisabled;
    this.save();
    return {
      success: true,
      message: entrance.isDisabled ? 'تم تعطيل الدخلة بنجاح' : 'تم تفعيل الدخلة بنجاح',
      entrance
    };
  }

  public adjustUserBalance(
    adminId: string,
    targetUserId: string,
    type: 'COIN' | 'DIAMOND',
    amount: number,
    reason: string
  ): { success: boolean; message: string; user?: User } {
    const admin = this.getUserById(adminId);
    if (!admin) {
      return { success: false, message: 'حساب الإدارة غير موجود' };
    }

    // STRICT OWNER CHECK: Adding diamonds for free or generating diamonds is restricted to OWNER ONLY!
    if (type === 'DIAMOND' && amount > 0 && !this.isOwner(adminId)) {
      return {
        success: false,
        message: 'عملية مرفوضة: صلاحية توليد وإضافة الماسات محصورة بالمالك العام (Owner) حصرياً من لوحة المالك. لا يملك أي حساب آخر حق إضافة الماسات مجاناً.'
      };
    }

    if (!this.isAdminOrOwner(adminId)) {
      return { success: false, message: 'غير مصرح: تعديل الرصيد الإداري يتطلب صلاحيات المالك أو المشرف العام' };
    }

    const targetUser = this.getUserById(targetUserId);
    if (!targetUser) {
      return { success: false, message: 'المستخدم غير موجود' };
    }

    if (type === 'COIN') {
      targetUser.coins = Math.max(0, targetUser.coins + amount);
      this.addWalletTransaction(targetUser.id, 'COIN', amount, targetUser.coins, `تعديل إداري: ${reason}`);
    } else {
      targetUser.diamonds = Math.max(0, targetUser.diamonds + amount);
      this.addWalletTransaction(targetUser.id, 'DIAMOND', amount, targetUser.diamonds, `تعديل إداري: ${reason}`);
    }

    this.save();

    this.addAuditLog({
      adminId,
      adminName: admin.name,
      action: 'ADJUST_BALANCE',
      targetType: 'USER',
      targetId: targetUserId,
      details: `تم تعديل رصيد ${type === 'COIN' ? 'الكونز' : 'الماسات'} بمقدار ${amount > 0 ? '+' : ''}${amount} للسبب: ${reason}`
    });

    return { success: true, message: `تم تحديث الرصيد بنجاح (${type === 'COIN' ? 'كونز' : 'ماسات'}: ${amount})`, user: targetUser };
  }

  public ownerFreeRecharge(
    ownerId: string,
    amount: number
  ): { success: boolean; message: string; user?: User; amount?: number } {
    if (!this.isOwner(ownerId)) {
      return {
        success: false,
        message: 'غير مصرح: هذه العملية مخصصة حصرياً للمالك العام (Owner) فقط'
      };
    }

    const ownerUser = this.getUserById(ownerId);
    if (!ownerUser) {
      return {
        success: false,
        message: 'حساب المالك غير موجود في قاعدة البيانات'
      };
    }

    if (isNaN(amount) || amount <= 0) {
      return {
        success: false,
        message: 'يرجى إدخال كمية مَسّات صالحة أكبر من صفر'
      };
    }

    const oldDiamonds = ownerUser.diamonds || 0;
    const newDiamonds = oldDiamonds + amount;
    ownerUser.diamonds = newDiamonds;

    // Add wallet transaction entry
    this.addWalletTransaction(
      ownerUser.id,
      'DIAMOND',
      amount,
      newDiamonds,
      'شحن مجاني للمالك'
    );

    // Record in Audit Log
    this.addAuditLog({
      adminId: ownerUser.id,
      adminName: ownerUser.name || 'المالك العام',
      action: 'OWNER_FREE_RECHARGE',
      targetType: 'USER',
      targetId: ownerUser.id,
      details: `شحن مجاني للمالك: +${amount.toLocaleString('ar-EG')} مَسّة | الكمية: ${amount} | الرصيد السابق: ${oldDiamonds.toLocaleString('ar-EG')} | الرصيد الجديد: ${newDiamonds.toLocaleString('ar-EG')} | سبب العملية: شحن مجاني للمالك`
    });

    this.save();

    return {
      success: true,
      message: `تم إضافة ${amount.toLocaleString('ar-EG')} مَسّة إلى رصيد المالك مجاناً بنجاح! 🎉`,
      user: ownerUser,
      amount
    };
  }

  // --- FRIENDS & FOLLOWS ---

  public getFriendships(userId: string): Friendship[] {
    const list = this.data.friendships.filter(
      f => (f.user1Id === userId || f.user2Id === userId) && f.status === 'ACCEPTED'
    );
    return list.map(f => {
      const otherId = f.user1Id === userId ? f.user2Id : f.user1Id;
      const otherUser = this.getUserById(otherId);
      return { ...f, otherUser };
    });
  }

  public getPendingFriendRequests(userId: string): Friendship[] {
    const list = this.data.friendships.filter(
      f => f.user2Id === userId && f.status === 'PENDING'
    );
    return list.map(f => {
      const otherUser = this.getUserById(f.user1Id);
      return { ...f, otherUser };
    });
  }

  public sendFriendRequest(senderId: string, receiverId: string): { success: boolean; message: string } {
    if (senderId === receiverId) return { success: false, message: 'لا يمكنك إضافة نفسك كصديق' };
    const existing = this.data.friendships.find(
      f => (f.user1Id === senderId && f.user2Id === receiverId) || (f.user1Id === receiverId && f.user2Id === senderId)
    );
    if (existing) {
      if (existing.status === 'ACCEPTED') return { success: false, message: 'أنتم أصدقاء بالفعل' };
      return { success: false, message: 'طلب الصداقة قيد الانتظار مسبقاً' };
    }

    const sender = this.getUserById(senderId);
    this.data.friendships.push({
      id: `fr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user1Id: senderId,
      user2Id: receiverId,
      status: 'PENDING',
      requestedBy: senderId,
      createdAt: new Date().toISOString()
    });

    this.addNotification({
      userId: receiverId,
      title: 'طلب صداقة جديد 👥',
      message: `أرسل لك ${sender?.name || 'مستخدم'} طلب صداقة.`,
      type: 'FRIEND_REQUEST'
    });

    this.save();
    return { success: true, message: 'تم إرسال طلب الصداقة بنجاح!' };
  }

  public respondToFriendRequest(requestId: string, accept: boolean): boolean {
    const idx = this.data.friendships.findIndex(f => f.id === requestId);
    if (idx === -1) return false;
    const req = this.data.friendships[idx];

    if (accept) {
      req.status = 'ACCEPTED';
      const u1 = this.getUserById(req.user1Id);
      const u2 = this.getUserById(req.user2Id);
      if (u1) u1.friendsCount += 1;
      if (u2) u2.friendsCount += 1;

      this.addNotification({
        userId: req.user1Id,
        title: 'تم قبول طلب الصداقة! 🎉',
        message: `وافق ${u2?.name || 'صديقك'} على طلب الصداقة. يمكنكما الآن التواصل عبر الرسائل الخاصة.`,
        type: 'FRIEND_ACCEPT'
      });
    } else {
      this.data.friendships.splice(idx, 1);
    }

    this.save();
    return true;
  }

  public toggleFollow(followerId: string, followingId: string): { isFollowing: boolean } {
    const idx = this.data.follows.findIndex(f => f.followerId === followerId && f.followingId === followingId);
    const follower = this.getUserById(followerId);
    const following = this.getUserById(followingId);

    if (idx !== -1) {
      this.data.follows.splice(idx, 1);
      if (follower) follower.followingCount = Math.max(0, follower.followingCount - 1);
      if (following) following.followersCount = Math.max(0, following.followersCount - 1);
      this.save();
      return { isFollowing: false };
    } else {
      this.data.follows.push({
        id: `fol_${Date.now()}`,
        followerId,
        followingId,
        createdAt: new Date().toISOString()
      });
      if (follower) follower.followingCount += 1;
      if (following) {
        following.followersCount += 1;
        this.addNotification({
          userId: followingId,
          title: 'متابع جديد! ⭐',
          message: `بدأ ${follower?.name || 'مستخدم'} بمتابعتك الآن.`,
          type: 'FOLLOW'
        });
      }
      this.save();
      return { isFollowing: true };
    }
  }

  public isFollowing(followerId: string, followingId: string): boolean {
    return this.data.follows.some(f => f.followerId === followerId && f.followingId === followingId);
  }

  // --- PRIVATE MESSAGES & OFFICIAL HEKAWY MESSAGES ---

  public getPrivateMessages(user1Id: string, user2Id: string): PrivateMessage[] {
    return (this.data.privateMessages || []).filter(
      m => (m.senderId === user1Id && m.receiverId === user2Id) || (m.senderId === user2Id && m.receiverId === user1Id)
    );
  }

  public sendPrivateMessage(senderId: string, receiverId: string, text: string): PrivateMessage {
    if (receiverId === 'HEKAWY_OFFICIAL' || senderId === 'HEKAWY_OFFICIAL') {
      throw new Error('لا يمكن الرد على رسائل حكاوي الرسمية. هذا الحساب لإرسال الإشعارات الرسمية فقط من طرف واحد.');
    }

    const sender = this.getUserById(senderId);
    const msg: PrivateMessage = {
      id: `pmsg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId,
      receiverId,
      senderName: sender?.name,
      senderAvatar: sender?.avatar,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      read: false
    };
    this.data.privateMessages.push(msg);

    this.addNotification({
      userId: receiverId,
      title: `رسالة خاصة من ${sender?.name || 'صديق'} 💬`,
      message: text.length > 50 ? text.substring(0, 47) + '...' : text,
      type: 'MESSAGE'
    });

    this.save();
    return msg;
  }

  public sendOfficialHekawyMessage(params: {
    senderUserId: string;
    targetCategory: OfficialMessageTarget;
    targetUserId?: string;
    text: string;
  }): { success: boolean; sentCount: number; targetCategoryLabel: string; message: string; createdMessages: PrivateMessage[] } {
    const sender = this.getUserById(params.senderUserId);
    const isAllowed = this.isOwner(params.senderUserId) || sender?.role === 'OWNER' || sender?.role === 'ADMIN';
    if (!isAllowed) {
      throw new Error('غير مصرح لك بإرسال رسائل حكاوي الرسمية. هذه الخاصية مخصصة للمالك والإدارة فقط.');
    }

    if (!params.text || !params.text.trim()) {
      throw new Error('محتوى الرسالة الرسمية لا يمكن أن يكون فارغاً');
    }

    const cleanText = params.text.trim();
    let targetCategoryLabel = 'المستخدمين';
    let targetUsers: User[] = [];

    const allActiveUsers = this.getUsers().filter(u => !u.isBanned && u.id !== 'HEKAWY_OFFICIAL');

    if (params.targetCategory === 'ALL') {
      targetCategoryLabel = 'المستخدمين';
      targetUsers = allActiveUsers;
    } else if (params.targetCategory === 'HOSTS') {
      targetCategoryLabel = 'المضيفين';
      targetUsers = allActiveUsers.filter(u => 
        u.role === 'HOST' || (u as any).isHost === true || (u as any).hostAgencyId || !!this.getHostProfile(u.id)
      );
    } else if (params.targetCategory === 'AGENTS') {
      targetCategoryLabel = 'الوكلاء';
      const agencyOwnerIds = (this.data.agencies || []).map(a => a.ownerUserId);
      targetUsers = allActiveUsers.filter(u => 
        u.role === 'AGENT' || (u as any).isAgent === true || agencyOwnerIds.includes(u.id)
      );
    } else if (params.targetCategory === 'STAFF') {
      targetCategoryLabel = 'الموظفين';
      targetUsers = allActiveUsers.filter(u => 
        u.role === 'STAFF' || u.role === 'MODERATOR'
      );
    } else if (params.targetCategory === 'ADMINS') {
      targetCategoryLabel = 'الإدارة';
      targetUsers = allActiveUsers.filter(u => 
        u.role === 'ADMIN' || u.role === 'OWNER' || this.isOwner(u.id)
      );
    } else if (params.targetCategory === 'USER_SPECIFIC' && params.targetUserId) {
      targetCategoryLabel = 'مستخدم محدد';
      const single = this.getUserById(params.targetUserId);
      if (single) targetUsers = [single];
    } else {
      targetCategoryLabel = 'المستخدمين';
      targetUsers = allActiveUsers;
    }

    // De-duplicate users
    const uniqueUsersMap = new Map<string, User>();
    targetUsers.forEach(u => uniqueUsersMap.set(u.id, u));
    const finalRecipients = Array.from(uniqueUsersMap.values());

    if (finalRecipients.length === 0) {
      throw new Error('لم يتم العثور على أي مستخدمين يطابقون الفئة المستهدفة المختارة.');
    }

    const createdMessages: PrivateMessage[] = [];
    const nowStr = new Date().toISOString();

    for (const recipient of finalRecipients) {
      const msg: PrivateMessage = {
        id: `off_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${recipient.id.substring(0, 5)}`,
        senderId: 'HEKAWY_OFFICIAL',
        receiverId: recipient.id,
        senderName: 'حكاوي',
        senderAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
        text: cleanText,
        createdAt: nowStr,
        read: false,
        isOfficial: true,
        targetCategory: params.targetCategory,
        targetCategoryLabel: targetCategoryLabel
      };

      this.data.privateMessages.push(msg);
      createdMessages.push(msg);

      this.addNotification({
        userId: recipient.id,
        title: 'رسالة رسمية من حكاوي 📢',
        message: cleanText.length > 60 ? cleanText.substring(0, 57) + '...' : cleanText,
        type: 'SYSTEM'
      });
    }

    this.save();

    return {
      success: true,
      sentCount: finalRecipients.length,
      targetCategoryLabel,
      message: `تم إرسال الرسالة الرسمية بنجاح باسم "حكاوي" إلى ${finalRecipients.length} مستلم (${targetCategoryLabel}).`,
      createdMessages
    };
  }

  public getOfficialHekawyMessages(userId: string): PrivateMessage[] {
    return (this.data.privateMessages || []).filter(
      m => m.receiverId === userId && (m.senderId === 'HEKAWY_OFFICIAL' || m.isOfficial === true)
    );
  }

  public markOfficialMessagesAsRead(userId: string): void {
    let updated = false;
    (this.data.privateMessages || []).forEach(m => {
      if (m.receiverId === userId && (m.senderId === 'HEKAWY_OFFICIAL' || m.isOfficial === true) && !m.read) {
        m.read = true;
        updated = true;
      }
    });
    if (updated) this.save();
  }

  // --- REPORTS & MODERATION ---

  public addReport(reportData: {
    reporterId: string;
    targetType: 'USER' | 'ROOM' | 'MESSAGE' | 'STREAM';
    targetId: string;
    targetName: string;
    reason: string;
    details?: string;
  }): Report {
    const reporter = this.getUserById(reportData.reporterId);
    const report: Report = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      reporterId: reportData.reporterId,
      reporterName: reporter?.name || 'مستخدم',
      targetType: reportData.targetType,
      targetId: reportData.targetId,
      targetName: reportData.targetName,
      reason: reportData.reason,
      details: reportData.details || '',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    this.data.reports.unshift(report);
    this.save();
    return report;
  }

  public getReports(): Report[] {
    return this.data.reports;
  }

  public resolveReport(reportId: string, status: 'RESOLVED' | 'DISMISSED', adminId: string): boolean {
    const rep = this.data.reports.find(r => r.id === reportId);
    if (!rep) return false;
    rep.status = status;
    this.addAuditLog({
      adminId,
      action: status === 'RESOLVED' ? 'RESOLVE_REPORT' : 'DISMISS_REPORT',
      targetType: 'REPORT',
      targetId: reportId,
      details: `تمت مراجعة البلاغ رقم ${reportId} وحالته الآن: ${status}`
    });
    this.save();
    return true;
  }

  // --- BANS & BLOCKS & MODERATION ---

  public banUser(
    userId: string,
    bannedBy: string,
    reason: string,
    days?: number,
    category?: ModerationCategory,
    mediaSnapshot?: string
  ): boolean {
    const user = this.getUserById(userId);
    if (!user) return false;

    // Strict Protection: Owner cannot be banned under any circumstance
    if (this.isOwner(userId)) {
      throw new Error('عملية مرفوضة: لا يمكن حظر حساب المالك العام للنظام بأي حال من الأحوال.');
    }

    user.isBanned = true;
    user.banReason = reason;

    const isPermanent = !days;
    const expiresAt = days ? new Date(Date.now() + days * 86400000).toISOString() : null;

    // Add ban record
    this.data.bans.unshift({
      id: `ban_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      userName: user.name,
      bannedBy,
      reason,
      category,
      mediaSnapshot,
      isPermanent,
      expiresAt,
      createdAt: new Date().toISOString()
    });

    // Add to anti-bypass banned identifiers
    if (!this.data.bannedIdentifiers) this.data.bannedIdentifiers = [];
    const timestamp = new Date().toISOString();
    
    // Add user ID
    this.data.bannedIdentifiers.push({
      id: `bid_${Date.now()}_1`,
      type: 'USER_ID',
      value: user.id,
      reason,
      bannedAt: timestamp
    });

    // Add username
    if (user.username) {
      this.data.bannedIdentifiers.push({
        id: `bid_${Date.now()}_2`,
        type: 'USERNAME',
        value: user.username,
        reason,
        bannedAt: timestamp
      });
    }

    // Add phone
    if (user.phone) {
      this.data.bannedIdentifiers.push({
        id: `bid_${Date.now()}_3`,
        type: 'PHONE',
        value: user.phone,
        reason,
        bannedAt: timestamp
      });
    }

    // Add email
    if (user.email) {
      this.data.bannedIdentifiers.push({
        id: `bid_${Date.now()}_4`,
        type: 'EMAIL',
        value: user.email,
        reason,
        bannedAt: timestamp
      });
    }

    // Add Google ID
    if (user.googleId) {
      this.data.bannedIdentifiers.push({
        id: `bid_${Date.now()}_5`,
        type: 'GOOGLE_ID',
        value: user.googleId,
        reason,
        bannedAt: timestamp
      });
    }

    // Eject user from any active mic seats
    if (this.data.roomSeats) {
      Object.entries(this.data.roomSeats).forEach(([roomId, seats]) => {
        seats.forEach(s => {
          if (s.userId === userId) {
            s.userId = null;
            s.userName = undefined;
            s.userAvatar = undefined;
            s.isMuted = true;
            s.isSpeaking = false;
            s.userGender = undefined;
            s.isCameraOn = false;
          }
        });
      });
    }

    // Close any rooms hosted by this banned user
    this.data.rooms.forEach(room => {
      if (room.hostId === userId && room.status === 'LIVE') {
        room.status = 'ENDED';
      }
    });

    const admin = this.getUserById(bannedBy);
    this.addAuditLog({
      adminId: bannedBy,
      adminName: admin?.name || bannedBy,
      action: 'BAN_USER_STRICT',
      targetType: 'USER',
      targetId: userId,
      details: `تم حظر الحساب ${user.name} (@${user.username}) ${isPermanent ? 'نهائياً وبلا رجعة' : `لمدة ${days} يوم`}. السبب: ${reason}`,
      mediaSnapshot
    });

    this.save();
    return true;
  }

  public unbanUser(userId: string, adminId: string): boolean {
    const admin = this.getUserById(adminId);
    if (!admin || !this.isAdminOrOwner(adminId)) {
      throw new Error('فقط المالك (Owner) أو المشرف المصرح له يمكنه فك حظر المستخدمين');
    }

    const user = this.getUserById(userId);
    if (!user) return false;

    // Check if the user has a permanent ban
    const existingBan = this.data.bans?.find(b => b.userId === userId);
    const isPermanent = existingBan ? (existingBan.isPermanent || !existingBan.expiresAt) : true;

    // Rule 6: Permanent unban is strictly reserved for the OWNER only
    if (isPermanent && !this.isOwner(adminId)) {
      throw new Error('فك الحظر الدائم محصور حصرياً بالمالك العام (Owner) للنظام ولا تملك أي رتبة أخرى حق فكه');
    }

    user.isBanned = false;
    user.banReason = undefined;

    // Remove from anti-bypass list
    if (this.data.bannedIdentifiers) {
      this.data.bannedIdentifiers = this.data.bannedIdentifiers.filter(b => 
        b.value !== user.id &&
        b.value !== user.username &&
        b.value !== user.phone &&
        b.value !== user.email &&
        b.value !== user.googleId
      );
    }

    // Mark bans as resolved or removed
    this.data.bans = this.data.bans.filter(b => b.userId !== userId);

    this.addAuditLog({
      adminId,
      adminName: admin.name,
      action: 'UNBAN_USER_MANUAL',
      targetType: 'USER',
      targetId: userId,
      details: `قام ${admin.name} (${admin.role}) برفع الحظر ${isPermanent ? 'الدائم ' : ''}يدوياً عن المستخدم ${user.name} (@${user.username})`
    });

    this.save();
    return true;
  }

  public autoBanForModeration(payload: {
    userId: string;
    reason: string;
    category: ModerationCategory;
    targetType: 'AVATAR' | 'ROOM_COVER' | 'LIVE_STREAM' | 'CHAT_MEDIA' | 'VIDEO' | 'ROOM_TEXT';
    targetId?: string;
    mediaSnapshot?: string;
    confidenceScore?: number;
    details?: string;
  }): { success: boolean; incident: ModerationIncident } {
    const { userId, reason, category, targetType, targetId, mediaSnapshot, confidenceScore, details } = payload;
    const user = this.getUserById(userId);

    // Apply strict permanent ban
    this.banUser(userId, 'SYSTEM_AUTO_MODERATOR', reason, undefined, category, mediaSnapshot);

    const incident: ModerationIncident = {
      id: `mod_inc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      userName: user?.name || 'مستخدم غير معروف',
      userRole: user?.role || 'USER',
      userAvatar: user?.avatar || '',
      targetType,
      targetId,
      reason,
      category,
      confidenceScore: confidenceScore || 0.95,
      status: 'BLOCKED_BANNED',
      actionTaken: 'AUTO_BAN_PERMANENT',
      mediaSnapshot,
      details,
      detectedAt: new Date().toISOString()
    };

    if (!this.data.moderationIncidents) this.data.moderationIncidents = [];
    this.data.moderationIncidents.unshift(incident);

    this.addAuditLog({
      adminId: 'SYSTEM_MODERATOR',
      adminName: '🛡️ نظام الرقابة التلقائية (AI Shield)',
      action: 'AUTO_BAN_VIOLATION',
      targetType,
      targetId: targetId || userId,
      details: `[حظر تلقائي فوري]: مخالفة سياسة الحشمة والآداب (${reason}) على المستخدم ${user?.name}. تم حظر الحساب ووسائل تسجيله نهائياً.`,
      mediaSnapshot
    });

    this.save();
    return { success: true, incident };
  }

  public addModerationIncident(incidentData: Omit<ModerationIncident, 'id' | 'detectedAt'>): ModerationIncident {
    const incident: ModerationIncident = {
      id: `mod_inc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...incidentData,
      detectedAt: new Date().toISOString()
    };

    if (!this.data.moderationIncidents) this.data.moderationIncidents = [];
    this.data.moderationIncidents.unshift(incident);
    this.save();
    return incident;
  }

  public getModerationIncidents(): ModerationIncident[] {
    return this.data.moderationIncidents || [];
  }

  public resolveModerationIncident(
    adminId: string,
    incidentId: string,
    action: 'CONFIRM_BAN' | 'UNBAN_RESTORE' | 'APPROVE_CONTENT' | 'DISMISS'
  ): boolean {
    const admin = this.getUserById(adminId);
    if (!admin || (admin.role !== 'OWNER' && admin.role !== 'ADMIN')) {
      throw new Error('غير مصرح لك بإدارة قرارات الرقابة');
    }

    if (!this.data.moderationIncidents) return false;
    const incident = this.data.moderationIncidents.find(i => i.id === incidentId);
    if (!incident) return false;

    incident.reviewedBy = admin.name;
    incident.reviewedAt = new Date().toISOString();

    if (action === 'UNBAN_RESTORE') {
      incident.status = 'DISMISSED';
      this.unbanUser(incident.userId, adminId);
    } else if (action === 'CONFIRM_BAN') {
      incident.status = 'BLOCKED_BANNED';
      this.banUser(incident.userId, adminId, `تأكيد حظر الرقابة بواسطة الإدارة: ${incident.reason}`);
    } else if (action === 'APPROVE_CONTENT') {
      incident.status = 'APPROVED';
    } else if (action === 'DISMISS') {
      incident.status = 'DISMISSED';
    }

    this.addAuditLog({
      adminId,
      adminName: admin.name,
      action: `MODERATION_${action}`,
      targetType: 'MODERATION_INCIDENT',
      targetId: incidentId,
      details: `قام ${admin.name} باتخاذ إجراء [${action}] على بلاغ الرقابة للمستخدم ${incident.userName}`
    });

    this.save();
    return true;
  }

  // --- NOTIFICATIONS ---

  public getNotifications(userId: string): AppNotification[] {
    return this.data.notifications
      .filter(n => n.userId === userId)
      .slice(0, 50);
  }

  public addNotification(notif: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>): AppNotification {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...notif,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.unshift(newNotif);
    this.save();
    return newNotif;
  }

  public markNotificationAsRead(notifId: string): boolean {
    const notif = this.data.notifications.find(n => n.id === notifId);
    if (notif) {
      notif.isRead = true;
      this.save();
      return true;
    }
    return false;
  }

  // --- AUDIT LOGS & ADMIN STATS ---

  public addAuditLog(log: Omit<AuditLog, 'id' | 'createdAt' | 'adminName'> & { adminName?: string }): AuditLog {
    const admin = this.getUserById(log.adminId);
    const newLog: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...log,
      adminName: log.adminName || admin?.name || 'إدارة حكاوي',
      createdAt: new Date().toISOString()
    };
    this.data.auditLogs.unshift(newLog);
    this.save();
    return newLog;
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs.slice(0, 100);
  }

  public getAdminStats(): AdminStats {
    const totalUsers = this.data.users.length;
    const activeUsers = this.data.users.filter(u => u.isOnline).length;
    const totalRooms = this.data.rooms.length;
    const liveRooms = this.data.rooms.filter(r => r.status === 'LIVE').length;
    const totalLiveStreams = liveRooms;
    const totalMessages = this.data.messages.length;
    const totalGiftsSent = this.data.giftTransactions.reduce((acc, t) => acc + t.count, 0);
    const totalTransactions = this.data.giftTransactions.length + this.data.walletTransactions.length;
    const totalReports = this.data.reports.length;
    const totalDiamondsSpent = this.data.giftTransactions.reduce((acc, t) => acc + t.totalDiamonds, 0);
    const totalCoinsCirculating = this.data.users.reduce((acc, u) => acc + u.coins, 0);
    const totalAgencies = this.data.agencies.length;
    const totalHosts = this.data.hostProfiles.length;

    // Calculate achieved targets count across active targets
    const activeTarget = this.data.targetConfigs.find(tc => tc.isActive);
    let totalTargetAchieved = 0;
    if (activeTarget) {
      totalTargetAchieved = this.data.hostProfiles.filter(hp => {
        const prog = this.calculateHostTargetProgress(hp.userId, activeTarget.id);
        return prog.isAchieved;
      }).length;
    }

    return {
      totalUsers,
      activeUsers,
      totalRooms,
      liveRooms,
      totalLiveStreams,
      totalMessages,
      totalGiftsSent,
      totalTransactions,
      totalReports,
      totalDiamondsSpent,
      totalCoinsCirculating,
      totalAgencies,
      totalHosts,
      totalTargetAchieved
    };
  }

  // ==========================================
  // --- HOSTS, AGENTS, AGENCIES & TARGETS ---
  // ==========================================

  // --- HOST APPLICATIONS ---

  public getHostApplications(): HostApplication[] {
    return this.data.hostApplications || [];
  }

  public getUserHostApplication(userId: string): HostApplication | undefined {
    return this.data.hostApplications.find(a => a.userId === userId);
  }

  public createHostApplication(data: {
    userId: string;
    phone: string;
    country?: string;
    experienceBio: string;
    specialTalent: string;
    sampleLink?: string;
    agentInviteCode?: string;
  }): { success: boolean; message: string; application?: HostApplication } {
    const user = this.getUserById(data.userId);
    if (!user) {
      return { success: false, message: 'المستخدم غير موجود' };
    }

    if (user.isBanned) {
      return { success: false, message: 'الحساب محظور ولا يمكنه التقديم كمضيف' };
    }

    // Check if already a host
    const existingProfile = this.getHostProfile(data.userId);
    if (existingProfile && existingProfile.status === 'ACTIVE') {
      return { success: false, message: 'أنت مسجل بالفعل كمضيف معتمد في حكاوي' };
    }

    // Check pending application
    const existingApp = this.data.hostApplications.find(a => a.userId === data.userId && a.status === 'PENDING');
    if (existingApp) {
      return { success: false, message: 'لديك طلب انضمام كمضيف قيد المراجعة الإدارية بالفعل' };
    }

    // Check agent invite code if provided
    let matchedAgency: Agency | undefined;
    if (data.agentInviteCode && data.agentInviteCode.trim()) {
      const code = data.agentInviteCode.trim().toUpperCase();
      matchedAgency = this.data.agencies.find(
        a => a.status === 'ACTIVE' && (a.inviteCode.toUpperCase() === code || a.agencyCode.toUpperCase() === code)
      );
      if (!matchedAgency) {
        return { success: false, message: 'كود دعوة الوكيل غير صحيح أو أن الوكالة غير نشطة' };
      }
    }

    const application: HostApplication = {
      id: `host_app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      userUsername: user.username,
      phone: data.phone,
      country: data.country || 'المملكة العربية السعودية',
      experienceBio: data.experienceBio,
      specialTalent: data.specialTalent,
      sampleLink: data.sampleLink,
      agentInviteCode: data.agentInviteCode,
      agencyId: matchedAgency?.id,
      agencyName: matchedAgency?.agencyName,
      agencyCode: matchedAgency?.agencyCode,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    if (!this.data.hostApplications) this.data.hostApplications = [];
    this.data.hostApplications.unshift(application);

    // Add user notification
    this.addNotification({
      userId: user.id,
      title: 'طلب الانضمام كمضيف 🎙️',
      message: `تم استلام طلب انضمامك كمضيف بنجاح! الطلب الآن «قيد المراجعة» من قبل الإدارة وسنوافيك بالرد قريباً.`,
      type: 'SYSTEM'
    });

    this.save();
    return {
      success: true,
      message: 'تم إرسال طلب الانضمام كمضيف بنجاح وهو الآن قيد المراجعة الإدارية',
      application
    };
  }

  public reviewHostApplication(
    adminId: string,
    applicationId: string,
    action: 'APPROVE' | 'REJECT',
    rejectionReason?: string,
    assignedAgencyId?: string
  ): { success: boolean; message: string } {
    const admin = this.getUserById(adminId);
    if (!admin || (admin.role !== 'OWNER' && admin.role !== 'ADMIN')) {
      throw new Error('غير مصرح لك بمراجعة طلبات المضيفين');
    }

    const app = this.data.hostApplications.find(a => a.id === applicationId);
    if (!app) {
      return { success: false, message: 'طلب الانضمام غير موجود' };
    }

    const user = this.getUserById(app.userId);
    if (!user) {
      return { success: false, message: 'صاحب الطلب غير موجود' };
    }

    app.reviewedBy = admin.id;
    app.reviewedByName = admin.name;
    app.reviewedAt = new Date().toISOString();

    if (action === 'APPROVE') {
      app.status = 'APPROVED';
      const hostCode = `HOST-${Math.floor(1000 + Math.random() * 9000)}`;
      app.hostCode = hostCode;

      // Update user role to HOST (unless already ADMIN/OWNER)
      if (user.role === 'USER') {
        user.role = 'HOST';
      }

      // Determine Agency
      const targetAgencyId = assignedAgencyId || app.agencyId;
      let agency: Agency | undefined;
      if (targetAgencyId) {
        agency = this.data.agencies.find(a => a.id === targetAgencyId);
      }

      // Create or update HostProfile
      let hostProfile = this.data.hostProfiles.find(hp => hp.userId === user.id);
      if (!hostProfile) {
        hostProfile = {
          id: `host_prof_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          hostCode,
          agencyId: agency?.id,
          agencyName: agency?.agencyName,
          agencyCode: agency?.agencyCode,
          status: 'ACTIVE',
          category: app.specialTalent || 'محتوى ترفيهي وصوتي',
          bio: app.experienceBio,
          totalLiveMinutes: 0,
          totalDiamondsReceived: user.diamonds || 0,
          totalValidDays: 1,
          approvedAt: new Date().toISOString(),
          approvedBy: admin.name
        };
        this.data.hostProfiles.unshift(hostProfile);
      } else {
        hostProfile.status = 'ACTIVE';
        hostProfile.hostCode = hostCode;
        if (agency) {
          hostProfile.agencyId = agency.id;
          hostProfile.agencyName = agency.agencyName;
          hostProfile.agencyCode = agency.agencyCode;
        }
      }

      // Update Agency stats
      if (agency) {
        agency.hostsCount = this.data.hostProfiles.filter(hp => hp.agencyId === agency!.id).length;
        agency.activeHostsCount = this.data.hostProfiles.filter(hp => hp.agencyId === agency!.id && hp.status === 'ACTIVE').length;
      }

      this.addAuditLog({
        adminId,
        action: 'APPROVE_HOST_APPLICATION',
        targetType: 'HOST_APPLICATION',
        targetId: app.id,
        details: `تمت الموافقة على طلب انضمام المضيف [${user.name}] بكود مضيف [${hostCode}] ${agency ? `وتعيينه تحت وكالة [${agency.agencyName}]` : 'كمضيف مستقل'}`
      });

      this.addNotification({
        userId: user.id,
        title: '🎉 تهانينا! أصبحت مضيفاً معتمداً في حكاوي',
        message: `تمت الموافقة على طلبك بنجاح! كود المضيف الخاص بك هو: ${hostCode}${agency ? `، ووكالتك التابعة هي: ${agency.agencyName}` : ''}. يمكنك الآن بدء البث وتحقيق التارجت الشهري.`,
        type: 'SYSTEM'
      });

      this.save();
      return { success: true, message: `تمت الموافقة على طلب المضيف ${user.name} بنجاح` };
    } else {
      app.status = 'REJECTED';
      app.rejectionReason = rejectionReason || 'لم يستوفِ الشروط والمعايير المطلوبة حالياً';

      this.addAuditLog({
        adminId,
        action: 'REJECT_HOST_APPLICATION',
        targetType: 'HOST_APPLICATION',
        targetId: app.id,
        details: `تم رفض طلب انضمام المضيف [${user.name}]. السبب: ${app.rejectionReason}`
      });

      this.addNotification({
        userId: user.id,
        title: 'إشعار بخصوص طلب الانضمام كمضيف',
        message: `نأسف لإبلاغك بأنه تم رفض طلب الانضمام كمضيف حالياً. السبب: ${app.rejectionReason}`,
        type: 'SYSTEM'
      });

      this.save();
      return { success: true, message: `تم رفض طلب المضيف ${user.name}` };
    }
  }

  // --- AGENT APPLICATIONS & AGENCIES ---

  public getAgentApplications(): AgentApplication[] {
    return this.data.agentApplications || [];
  }

  public getUserAgentApplication(userId: string): AgentApplication | undefined {
    return this.data.agentApplications.find(a => a.userId === userId);
  }

  public createAgentApplication(data: {
    userId: string;
    agencyName: string;
    phone: string;
    country: string;
    expectedHostsCount: number;
    experienceBio: string;
  }): { success: boolean; message: string; application?: AgentApplication } {
    const user = this.getUserById(data.userId);
    if (!user) {
      return { success: false, message: 'المستخدم غير موجود' };
    }

    if (user.isBanned) {
      return { success: false, message: 'الحساب محظور ولا يمكنه التقدم بطلب وكالة' };
    }

    // Check if already an agent owner
    const existingAgency = this.getAgencyByOwnerId(data.userId);
    if (existingAgency && existingAgency.status === 'ACTIVE') {
      return { success: false, message: 'أنت مالك وكالة معتمدة بالفعل في حكاوي' };
    }

    // Check pending application
    const existingApp = this.data.agentApplications.find(a => a.userId === data.userId && a.status === 'PENDING');
    if (existingApp) {
      return { success: false, message: 'لديك طلب تأسيس وكالة قيد المراجعة الإدارية بالفعل' };
    }

    const application: AgentApplication = {
      id: `agent_app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      userUsername: user.username,
      agencyName: data.agencyName,
      phone: data.phone,
      country: data.country,
      expectedHostsCount: Number(data.expectedHostsCount) || 5,
      experienceBio: data.experienceBio,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    if (!this.data.agentApplications) this.data.agentApplications = [];
    this.data.agentApplications.unshift(application);

    // Add user notification
    this.addNotification({
      userId: user.id,
      title: 'طلب إنشاء وكالة 💼',
      message: `تم استلام طلب تأسيس وكالة [${data.agencyName}] بنجاح، وهو قيد المراجعة الإدارية وسيقوم فريق الإدارة بدراسة الطلب.`,
      type: 'SYSTEM'
    });

    // Notify all Admins & Owners about the new agency application
    const adminOwners = (this.data.users || []).filter(u => u.role === 'OWNER' || u.role === 'ADMIN');
    adminOwners.forEach(admin => {
      this.addNotification({
        userId: admin.id,
        title: '💼 طلب فتح وكالة جديد',
        message: `وصل طلب جديد لتأسيس وكالة [${data.agencyName}] من المستخدم [${user.name}]. اضغط لمراجعة الطلب والموافقة عليه أو رفضه.`,
        type: 'SYSTEM'
      });
    });

    this.save();
    return {
      success: true,
      message: 'تم إرسال طلب الوكالة بنجاح وهو قيد المراجعة الإدارية',
      application
    };
  }

  public reviewAgentApplication(
    adminId: string,
    applicationId: string,
    action: 'APPROVE' | 'REJECT',
    rejectionReason?: string,
    commissionPercentage?: number
  ): { success: boolean; message: string } {
    const admin = this.getUserById(adminId);
    if (!admin || (admin.role !== 'OWNER' && admin.role !== 'ADMIN')) {
      throw new Error('غير مصرح لك بمراجعة طلبات الوكلاء');
    }

    const app = this.data.agentApplications.find(a => a.id === applicationId);
    if (!app) {
      return { success: false, message: 'طلب الوكالة غير موجود' };
    }

    const user = this.getUserById(app.userId);
    if (!user) {
      return { success: false, message: 'صاحب الطلب غير موجود' };
    }

    app.reviewedBy = admin.id;
    app.reviewedByName = admin.name;
    app.reviewedAt = new Date().toISOString();

    if (action === 'APPROVE') {
      app.status = 'APPROVED';
      const agencyCode = `AG-${Math.floor(1000 + Math.random() * 9000)}`;
      const inviteCode = `HEK${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      app.agencyCode = agencyCode;

      // Update user role to AGENT (unless already ADMIN/OWNER)
      if (user.role === 'USER' || user.role === 'HOST') {
        user.role = 'AGENT';
      }
      (user as any).isAgent = true;
      (user as any).isAgencyOwner = true;
      (user as any).agencyCode = agencyCode;

      const newAgency: Agency = {
        id: `agency_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        ownerUserId: user.id,
        ownerName: user.name,
        ownerAvatar: user.avatar,
        agencyName: app.agencyName,
        agencyCode,
        inviteCode,
        status: 'ACTIVE',
        contactPhone: app.phone,
        country: app.country,
        hostsCount: 0,
        activeHostsCount: 0,
        totalDiamondsEarned: 0,
        commissionPercentage: commissionPercentage ? Number(commissionPercentage) : 15,
        createdAt: new Date().toISOString()
      };

      if (!this.data.agencies) this.data.agencies = [];
      this.data.agencies.unshift(newAgency);

      this.addAuditLog({
        adminId,
        action: 'APPROVE_AGENT_APPLICATION',
        targetType: 'AGENCY',
        targetId: newAgency.id,
        details: `تمت الموافقة على وكالة [${newAgency.agencyName}] بكود وكيل [${agencyCode}] وكود دعوة [${inviteCode}] للوكيل [${user.name}]`
      });

      this.addNotification({
        userId: user.id,
        title: '👑 تهانينا! تم اعتماد وكالتك رسمياً في حكاوي',
        message: `تم اعتماد وكالة [${app.agencyName}] بنجاح! كود وكالتك: ${agencyCode} | كود الدعوة للمضيفين: ${inviteCode}. يمكنك الآن دعوة المضيفين ومتابعة أدائهم في لوحة الوكيل.`,
        type: 'SYSTEM'
      });

      this.save();
      return { success: true, message: `تمت الموافقة على اعتماد وكالة ${app.agencyName} بنجاح` };
    } else {
      app.status = 'REJECTED';
      app.rejectionReason = rejectionReason || 'لم يستوفِ الشروط أو متطلبات الوكالات المعتمدة';

      this.addAuditLog({
        adminId,
        action: 'REJECT_AGENT_APPLICATION',
        targetType: 'AGENT_APPLICATION',
        targetId: app.id,
        details: `تم رفض طلب وكالة [${app.agencyName}] للمستخدم [${user.name}]. السبب: ${app.rejectionReason}`
      });

      this.addNotification({
        userId: user.id,
        title: 'إشعار بخصوص طلب تأسيس الوكالة',
        message: `نأسف لإبلاغك بأنه تم رفض طلب تأسيس الوكالة. السبب: ${app.rejectionReason}`,
        type: 'SYSTEM'
      });

      this.save();
      return { success: true, message: `تم رفض طلب الوكالة للمستخدم ${user.name}` };
    }
  }

  // --- AGENCIES MANAGEMENT ---

  public getAgencies(): Agency[] {
    // Dynamically refresh hosts count
    if (this.data.agencies && this.data.hostProfiles) {
      this.data.agencies.forEach(agency => {
        agency.hostsCount = this.data.hostProfiles.filter(hp => hp.agencyId === agency.id).length;
        agency.activeHostsCount = this.data.hostProfiles.filter(hp => hp.agencyId === agency.id && hp.status === 'ACTIVE').length;
      });
    }
    return this.data.agencies || [];
  }

  public getAgencyById(agencyId: string): Agency | undefined {
    return this.data.agencies.find(a => a.id === agencyId);
  }

  public getAgencyByOwnerId(userId: string): Agency | undefined {
    return this.data.agencies.find(a => a.ownerUserId === userId);
  }

  public getAgencyByCode(code: string): Agency | undefined {
    const formatted = code.trim().toUpperCase();
    return this.data.agencies.find(
      a => a.agencyCode.toUpperCase() === formatted || a.inviteCode.toUpperCase() === formatted
    );
  }

  public updateAgencyStatus(
    adminId: string,
    agencyId: string,
    status: 'ACTIVE' | 'SUSPENDED',
    reason?: string
  ): { success: boolean; message: string } {
    const admin = this.getUserById(adminId);
    if (!admin || (admin.role !== 'OWNER' && admin.role !== 'ADMIN')) {
      throw new Error('غير مصرح لك بتغيير حالة الوكالة');
    }

    const agency = this.getAgencyById(agencyId);
    if (!agency) {
      return { success: false, message: 'الوكالة غير موجودة' };
    }

    agency.status = status;

    this.addAuditLog({
      adminId,
      action: status === 'ACTIVE' ? 'ACTIVATE_AGENCY' : 'SUSPEND_AGENCY',
      targetType: 'AGENCY',
      targetId: agency.id,
      details: `تم تغيير حالة وكالة [${agency.agencyName}] إلى [${status}] بواسطة ${admin.name}. ${reason ? `السبب: ${reason}` : ''}`
    });

    this.addNotification({
      userId: agency.ownerUserId,
      title: status === 'ACTIVE' ? 'تفعيل الوكالة 💼' : 'تنبيه: إيقاف الوكالة ⚠️',
      message: status === 'ACTIVE'
        ? `تم إعادة تفعيل وكالتك [${agency.agencyName}] بنجاح.`
        : `تم إيقاف وكالتك [${agency.agencyName}] مؤقتاً من قبل الإدارة. ${reason || ''}`,
      type: 'ADMIN'
    });

    this.save();
    return { success: true, message: `تم تحديث حالة الوكالة إلى ${status}` };
  }

  // --- HOST PROFILES & AGENCY LINKING ---

  public getHostProfiles(): HostProfile[] {
    return this.data.hostProfiles || [];
  }

  public getHostProfile(userId: string): HostProfile | undefined {
    return this.data.hostProfiles.find(hp => hp.userId === userId);
  }

  public linkHostToAgency(
    adminId: string,
    hostUserId: string,
    agencyId: string
  ): { success: boolean; message: string } {
    const admin = this.getUserById(adminId);
    if (!admin || (admin.role !== 'OWNER' && admin.role !== 'ADMIN')) {
      throw new Error('غير مصرح لك بربط المضيفين بالوكالات (صلاحية إدارية فقط)');
    }

    const hostUser = this.getUserById(hostUserId);
    if (!hostUser) {
      return { success: false, message: 'المستخدم غير موجود' };
    }

    const agency = this.getAgencyById(agencyId);
    if (!agency) {
      return { success: false, message: 'الوكالة غير موجودة' };
    }

    if (agency.status !== 'ACTIVE') {
      return { success: false, message: 'لا يمكن الربط بوكالة موقوفة' };
    }

    let hostProfile = this.getHostProfile(hostUserId);
    if (!hostProfile) {
      hostProfile = {
        id: `host_prof_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: hostUser.id,
        userName: hostUser.name,
        userAvatar: hostUser.avatar,
        hostCode: `HOST-${Math.floor(1000 + Math.random() * 9000)}`,
        agencyId: agency.id,
        agencyName: agency.agencyName,
        agencyCode: agency.agencyCode,
        status: 'ACTIVE',
        category: 'ترفيه وصوتيات',
        bio: hostUser.bio || 'مضيف صوتي معتمد',
        totalLiveMinutes: 0,
        totalDiamondsReceived: hostUser.diamonds || 0,
        totalValidDays: 1,
        approvedAt: new Date().toISOString(),
        approvedBy: admin.name
      };
      this.data.hostProfiles.unshift(hostProfile);
    } else {
      hostProfile.agencyId = agency.id;
      hostProfile.agencyName = agency.agencyName;
      hostProfile.agencyCode = agency.agencyCode;
    }

    // Ensure role is HOST
    if (hostUser.role === 'USER') {
      hostUser.role = 'HOST';
    }

    this.addAuditLog({
      adminId,
      action: 'LINK_HOST_TO_AGENCY',
      targetType: 'HOST_PROFILE',
      targetId: hostProfile.id,
      details: `قام ${admin.name} بربط المضيف [${hostUser.name}] بوكالة [${agency.agencyName}] (${agency.agencyCode})`
    });

    this.addNotification({
      userId: hostUser.id,
      title: 'ربط الحساب بوكالة رسمية 💼',
      message: `تم ربط حسابك كمضيف رسمياً مع وكالة [${agency.agencyName}].`,
      type: 'SYSTEM'
    });

    this.addNotification({
      userId: agency.ownerUserId,
      title: 'انضمام مضيف جديد لوكالتك 🎙️',
      message: `تم ربط المضيف [${hostUser.name}] بوكالتك بنجاح. يمكنك متابعة أدائه في لوحة الوكيل.`,
      type: 'SYSTEM'
    });

    this.save();
    return { success: true, message: `تم ربط المضيف ${hostUser.name} بالوكالة ${agency.agencyName} بنجاح` };
  }

  public unlinkHostFromAgency(
    adminId: string,
    hostUserId: string,
    reason?: string
  ): { success: boolean; message: string } {
    const admin = this.getUserById(adminId);
    if (!admin || (admin.role !== 'OWNER' && admin.role !== 'ADMIN')) {
      throw new Error('غير مصرح لك بفك ارتباط المضيف (صلاحية إدارية فقط)');
    }

    const hostProfile = this.getHostProfile(hostUserId);
    if (!hostProfile) {
      return { success: false, message: 'ملف المضيف غير موجود' };
    }

    const oldAgencyName = hostProfile.agencyName || 'وكالة سابقة';
    const oldAgencyId = hostProfile.agencyId;

    hostProfile.agencyId = undefined;
    hostProfile.agencyName = undefined;
    hostProfile.agencyCode = undefined;

    this.addAuditLog({
      adminId,
      action: 'UNLINK_HOST_FROM_AGENCY',
      targetType: 'HOST_PROFILE',
      targetId: hostProfile.id,
      details: `قام ${admin.name} بفك ارتباط المضيف [${hostProfile.userName}] من وكالة [${oldAgencyName}]. ${reason ? `السبب: ${reason}` : ''}`
    });

    this.addNotification({
      userId: hostUserId,
      title: 'فك الارتباط بالوكالة',
      message: `تم فك ارتباطك بوكالة [${oldAgencyName}] وأصبحت مضيفاً مستقلاً. ${reason || ''}`,
      type: 'SYSTEM'
    });

    if (oldAgencyId) {
      const oldAgency = this.getAgencyById(oldAgencyId);
      if (oldAgency) {
        this.addNotification({
          userId: oldAgency.ownerUserId,
          title: 'تنبيه فك ارتباط مضيف',
          message: `تم فك ارتباط المضيف [${hostProfile.userName}] من وكالتك بواسطة الإدارة.`,
          type: 'ADMIN'
        });
      }
    }

    this.save();
    return { success: true, message: `تم فك ارتباط المضيف ${hostProfile.userName} بنجاح` };
  }

  public transferHostAgency(
    adminId: string,
    hostUserId: string,
    newAgencyId: string,
    reason?: string
  ): { success: boolean; message: string } {
    const admin = this.getUserById(adminId);
    if (!admin || (admin.role !== 'OWNER' && admin.role !== 'ADMIN')) {
      throw new Error('غير مصرح لك بنقل المضيفين بين الوكالات (صلاحية إدارية فقط)');
    }

    const hostProfile = this.getHostProfile(hostUserId);
    if (!hostProfile) {
      return { success: false, message: 'ملف المضيف غير موجود' };
    }

    const newAgency = this.getAgencyById(newAgencyId);
    if (!newAgency) {
      return { success: false, message: 'الوكالة الجديدة غير موجودة' };
    }

    const oldAgencyName = hostProfile.agencyName || 'مستقل';
    const oldAgencyId = hostProfile.agencyId;

    hostProfile.agencyId = newAgency.id;
    hostProfile.agencyName = newAgency.agencyName;
    hostProfile.agencyCode = newAgency.agencyCode;

    this.addAuditLog({
      adminId,
      action: 'TRANSFER_HOST_AGENCY',
      targetType: 'HOST_PROFILE',
      targetId: hostProfile.id,
      details: `قام ${admin.name} بنقل المضيف [${hostProfile.userName}] من [${oldAgencyName}] إلى وكالة [${newAgency.agencyName}]. ${reason ? `السبب: ${reason}` : ''}`
    });

    this.addNotification({
      userId: hostUserId,
      title: 'نقل إلى وكالة جديدة 💼',
      message: `تم نقلك إلى وكالة [${newAgency.agencyName}] بواسطة الإدارة.`,
      type: 'SYSTEM'
    });

    if (oldAgencyId) {
      const oldAgency = this.getAgencyById(oldAgencyId);
      if (oldAgency) {
        this.addNotification({
          userId: oldAgency.ownerUserId,
          title: 'نقل مضيف',
          message: `تم نقل المضيف [${hostProfile.userName}] من وكالتك إلى وكالة أخرى بواسطة الإدارة.`,
          type: 'ADMIN'
        });
      }
    }

    this.addNotification({
      userId: newAgency.ownerUserId,
      title: 'انضمام مضيف منقول لوكالتك 🎙️',
      message: `تم نقل المضيف [${hostProfile.userName}] إلى وكالتك بنجاح.`,
      type: 'SYSTEM'
    });

    this.save();
    return { success: true, message: `تم نقل المضيف ${hostProfile.userName} إلى ${newAgency.agencyName} بنجاح` };
  }

  public updateHostProfileStatus(
    adminId: string,
    hostUserId: string,
    status: 'ACTIVE' | 'SUSPENDED',
    reason?: string
  ): { success: boolean; message: string } {
    const admin = this.getUserById(adminId);
    if (!admin || (admin.role !== 'OWNER' && admin.role !== 'ADMIN')) {
      throw new Error('غير مصرح لك بتغيير حالة المضيف');
    }

    const hostProfile = this.getHostProfile(hostUserId);
    if (!hostProfile) {
      return { success: false, message: 'ملف المضيف غير موجود' };
    }

    hostProfile.status = status;

    this.addAuditLog({
      adminId,
      action: status === 'ACTIVE' ? 'ACTIVATE_HOST' : 'SUSPEND_HOST',
      targetType: 'HOST_PROFILE',
      targetId: hostProfile.id,
      details: `تم تغيير حالة المضيف [${hostProfile.userName}] إلى [${status}] بواسطة ${admin.name}. ${reason ? `السبب: ${reason}` : ''}`
    });

    this.addNotification({
      userId: hostUserId,
      title: status === 'ACTIVE' ? 'تفعيل حساب المضيف 🎙️' : 'تنبيه: إيقاف حساب المضيف ⚠️',
      message: status === 'ACTIVE'
        ? 'تم إعادة تفعيل صلاحيات البث والمضيف لحسابك.'
        : `تم إيقاف صلاحيات المضيف لحسابك مؤقتاً. ${reason || ''}`,
      type: 'ADMIN'
    });

    this.save();
    return { success: true, message: `تم تحديث حالة المضيف إلى ${status}` };
  }

  // --- TARGET CONFIGS & REAL PROGRESS CALCULATIONS ---

  public getTargetConfigs(): TargetConfig[] {
    return this.data.targetConfigs || [];
  }

  public createTargetConfig(
    adminId: string,
    configData: Omit<TargetConfig, 'id' | 'createdAt'>
  ): { success: boolean; message: string; targetConfig?: TargetConfig } {
    const admin = this.getUserById(adminId);
    if (!admin || (admin.role !== 'OWNER' && admin.role !== 'ADMIN')) {
      throw new Error('غير مصرح لك بإنشاء خطط التارجت (صلاحية إدارية فقط)');
    }

    if (!configData.title || !configData.requiredDiamonds) {
      return { success: false, message: 'عنوان التارجت والماسات المطلوبة حقول إجبارية' };
    }

    const targetConfig: TargetConfig = {
      id: `target_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...configData,
      createdAt: new Date().toISOString()
    };

    if (!this.data.targetConfigs) this.data.targetConfigs = [];
    this.data.targetConfigs.unshift(targetConfig);

    this.addAuditLog({
      adminId,
      action: 'CREATE_TARGET_CONFIG',
      targetType: 'TARGET_CONFIG',
      targetId: targetConfig.id,
      details: `أنشأ ${admin.name} تارجت جديد [${targetConfig.title}] - هدف الماسات: ${targetConfig.requiredDiamonds.toLocaleString()}، الساعات: ${Math.round(targetConfig.requiredLiveMinutes / 60)}`
    });

    this.save();
    return { success: true, message: `تم إنشاء التارجت ${targetConfig.title} بنجاح`, targetConfig };
  }

  public updateTargetConfig(
    adminId: string,
    id: string,
    updates: Partial<TargetConfig>
  ): { success: boolean; message: string } {
    const admin = this.getUserById(adminId);
    if (!admin || (admin.role !== 'OWNER' && admin.role !== 'ADMIN')) {
      throw new Error('غير مصرح لك بتعديل خطط التارجت');
    }

    const config = this.data.targetConfigs.find(tc => tc.id === id);
    if (!config) {
      return { success: false, message: 'خطة التارجت غير موجودة' };
    }

    Object.assign(config, updates);

    this.addAuditLog({
      adminId,
      action: 'UPDATE_TARGET_CONFIG',
      targetType: 'TARGET_CONFIG',
      targetId: config.id,
      details: `قام ${admin.name} بتحديث إعدادات التارجت [${config.title}]`
    });

    this.save();
    return { success: true, message: 'تم تحديث إعدادات التارجت بنجاح' };
  }

  public calculateHostTargetProgress(hostUserId: string, targetConfigId?: string): HostTargetProgress {
    const hostProfile = this.getHostProfile(hostUserId);
    const user = this.getUserById(hostUserId);

    let activeConfig: TargetConfig | undefined;
    if (targetConfigId) {
      activeConfig = this.data.targetConfigs.find(tc => tc.id === targetConfigId);
    }
    if (!activeConfig) {
      activeConfig = this.data.targetConfigs.find(tc => tc.isActive) || this.data.targetConfigs[0];
    }

    const fallbackConfig: TargetConfig = activeConfig || {
      id: 'default_target',
      title: 'تارجت عام',
      period: 'MONTHLY',
      monthYear: '2026-09',
      requiredDiamonds: 50000,
      requiredLiveMinutes: 1800,
      requiredActiveDays: 15,
      rewardCoins: 10000,
      rewardDiamonds: 5000,
      agentCommissionPct: 15,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    // Real server calculation from gift transactions & host profile
    const currentDiamonds = hostProfile ? hostProfile.totalDiamondsReceived : (user?.diamonds || 0);
    const currentLiveMinutes = hostProfile ? hostProfile.totalLiveMinutes : 0;
    const currentActiveDays = hostProfile ? hostProfile.totalValidDays : 1;

    const remainingDiamonds = Math.max(0, fallbackConfig.requiredDiamonds - currentDiamonds);
    const diamondPct = (currentDiamonds / fallbackConfig.requiredDiamonds) * 100;
    const hoursPct = (currentLiveMinutes / fallbackConfig.requiredLiveMinutes) * 100;
    const progressPercentage = Math.min(100, Math.round(Math.min(diamondPct, 100)));

    const isAchieved = currentDiamonds >= fallbackConfig.requiredDiamonds && currentLiveMinutes >= (fallbackConfig.requiredLiveMinutes * 0.7);

    return {
      hostId: hostProfile?.id || `temp_${hostUserId}`,
      userId: hostUserId,
      userName: user?.name || hostProfile?.userName || 'مضيف',
      userAvatar: user?.avatar || hostProfile?.userAvatar || '',
      hostCode: hostProfile?.hostCode || 'HOST-NEW',
      agencyId: hostProfile?.agencyId,
      agencyName: hostProfile?.agencyName,
      agencyCode: hostProfile?.agencyCode,
      targetConfigId: fallbackConfig.id,
      targetTitle: fallbackConfig.title,
      period: fallbackConfig.period,
      targetDiamonds: fallbackConfig.requiredDiamonds,
      currentDiamonds,
      remainingDiamonds,
      targetLiveMinutes: fallbackConfig.requiredLiveMinutes,
      currentLiveMinutes,
      targetActiveDays: fallbackConfig.requiredActiveDays,
      currentActiveDays,
      progressPercentage,
      isAchieved,
      rewardClaimed: false,
      lastUpdated: new Date().toISOString()
    };
  }

  public getHostDashboardData(userId: string): HostDashboardData {
    const hostProfile = this.getHostProfile(userId);
    const hostApp = this.getUserHostApplication(userId);

    let accountStatus: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'NOT_APPLIED' = 'NOT_APPLIED';
    if (hostProfile) {
      accountStatus = hostProfile.status === 'ACTIVE' ? 'APPROVED' : 'SUSPENDED';
    } else if (hostApp) {
      accountStatus = hostApp.status === 'PENDING' ? 'PENDING' : 'NOT_APPLIED';
    }

    const defaultProfile: HostProfile = hostProfile || {
      id: `hp_placeholder_${userId}`,
      userId,
      userName: this.getUserById(userId)?.name || 'مستخدم',
      userAvatar: this.getUserById(userId)?.avatar || '',
      hostCode: 'غير مسجل',
      status: 'SUSPENDED',
      category: 'عام',
      bio: '',
      totalLiveMinutes: 0,
      totalDiamondsReceived: 0,
      totalValidDays: 0,
      approvedAt: '',
      approvedBy: ''
    };

    const targetProgress = this.calculateHostTargetProgress(userId);
    const agency = hostProfile?.agencyId ? this.getAgencyById(hostProfile.agencyId) : undefined;

    // History for other configs
    const targetHistory = this.data.targetConfigs.map(tc => this.calculateHostTargetProgress(userId, tc.id));

    // Calculate real eligible hours and gift counts
    const eligibleLiveHours = Math.round((defaultProfile.totalLiveMinutes / 60) * 10) / 10;
    const eligibleGiftsCount = this.data.giftTransactions.filter(gt => gt.receiverId === userId).length;

    return {
      hostProfile: defaultProfile,
      agency,
      targetProgress,
      targetHistory,
      eligibleLiveHours,
      eligibleGiftsCount,
      accountStatus
    };
  }

  public getAgencyDashboardData(agentUserId: string): AgencyDashboardData {
    const user = this.getUserById(agentUserId);
    const agency = this.getAgencyByOwnerId(agentUserId);

    if (!agency) {
      throw new Error('لا توجد وكالة مرتبطة بهذا الحساب');
    }

    // Get all hosts affiliated with this agency
    const affiliatedHostProfiles = this.data.hostProfiles.filter(hp => hp.agencyId === agency.id);

    const hosts = affiliatedHostProfiles.map(hp => {
      const hostUser = this.getUserById(hp.userId) || {
        id: hp.userId,
        name: hp.userName,
        username: hp.userName,
        avatar: hp.userAvatar,
        level: 1,
        exp: 0,
        coins: 0,
        diamonds: 0,
        role: 'HOST' as UserRole,
        followersCount: 0,
        followingCount: 0,
        friendsCount: 0,
        referralCode: '',
        createdAt: ''
      };
      const targetProgress = this.calculateHostTargetProgress(hp.userId);
      return {
        hostProfile: hp,
        user: hostUser,
        targetProgress
      };
    });

    const totalHosts = hosts.length;
    const activeHosts = hosts.filter(h => h.hostProfile.status === 'ACTIVE').length;
    const suspendedHosts = hosts.filter(h => h.hostProfile.status === 'SUSPENDED').length;
    const totalAgencyDiamonds = hosts.reduce((acc, h) => acc + h.targetProgress.currentDiamonds, 0);
    const totalAgencyTargetDiamonds = hosts.reduce((acc, h) => acc + h.targetProgress.targetDiamonds, 0);
    const achievedTargetsCount = hosts.filter(h => h.targetProgress.isAchieved).length;
    const averageCompletionRate = totalHosts > 0
      ? Math.round(hosts.reduce((acc, h) => acc + h.targetProgress.progressPercentage, 0) / totalHosts)
      : 0;

    return {
      agency,
      hosts,
      summary: {
        totalHosts,
        activeHosts,
        suspendedHosts,
        totalAgencyDiamonds,
        totalAgencyTargetDiamonds,
        averageCompletionRate,
        achievedTargetsCount
      }
    };
  }

  public claimHostTargetReward(
    userId: string,
    targetConfigId: string
  ): { success: boolean; message: string; rewardCoins?: number; rewardDiamonds?: number } {
    const user = this.getUserById(userId);
    if (!user) {
      return { success: false, message: 'المستخدم غير موجود' };
    }

    const targetProgress = this.calculateHostTargetProgress(userId, targetConfigId);
    if (!targetProgress.isAchieved) {
      return {
        success: false,
        message: `لم تكتمل شروط التارجت بعد. المحقق: ${targetProgress.currentDiamonds.toLocaleString()} ماسة من أصل ${targetProgress.targetDiamonds.toLocaleString()}`
      };
    }

    const config = this.data.targetConfigs.find(tc => tc.id === targetConfigId);
    if (!config) {
      return { success: false, message: 'خطة التارجت غير موجودة' };
    }

    // Credit host reward
    user.coins += config.rewardCoins;
    user.diamonds += config.rewardDiamonds;

    this.addWalletTransaction(
      user.id,
      'COIN',
      config.rewardCoins,
      user.coins,
      `مكافأة إنجاز التارجت [${config.title}]`
    );

    this.addWalletTransaction(
      user.id,
      'DIAMOND',
      config.rewardDiamonds,
      user.diamonds,
      `مكافأة ماسات إنجاز التارجت [${config.title}]`
    );

    // If host has an agency, credit agency commission!
    if (targetProgress.agencyId) {
      const agency = this.getAgencyById(targetProgress.agencyId);
      if (agency) {
        const agencyOwner = this.getUserById(agency.ownerUserId);
        if (agencyOwner) {
          const commissionDiamonds = Math.round(targetProgress.currentDiamonds * (config.agentCommissionPct / 100));
          agencyOwner.diamonds += commissionDiamonds;
          this.addWalletTransaction(
            agencyOwner.id,
            'DIAMOND',
            commissionDiamonds,
            agencyOwner.diamonds,
            `عمولة وكالة [${agency.agencyName}] عن إنجاز المضيف ${user.name} للتارجت [${config.title}]`
          );

          this.addNotification({
            userId: agencyOwner.id,
            title: 'عمولة وكالة جديدة! 💼💰',
            message: `حقق المضيف [${user.name}] التارجت بنجاح وتم إيداع عمولتك (${commissionDiamonds.toLocaleString()} ماسة) في محفظتك.`,
            type: 'GIFT'
          });
        }
      }
    }

    this.addNotification({
      userId: user.id,
      title: '🏆 تهانينا! استلمت مكافأة التارجت',
      message: `تم إيداع ${config.rewardCoins.toLocaleString()} كونز و ${config.rewardDiamonds.toLocaleString()} ماسة في محفظتك بنجاح لإنجازك التارجت!`,
      type: 'GIFT'
    });

    this.save();
    return {
      success: true,
      message: `تم استلام مكافأة التارجت بنجاح! (+${config.rewardCoins.toLocaleString()} كونز و +${config.rewardDiamonds.toLocaleString()} ماسة)`,
      rewardCoins: config.rewardCoins,
      rewardDiamonds: config.rewardDiamonds
    };
  }

  getGiftTierSettings(): SystemGiftTierSettings {
    if (!this.data.giftTierSettings) {
      this.data.giftTierSettings = DEFAULT_GIFT_TIER_SETTINGS;
      this.save();
    }
    if (this.data.giftTierSettings.bigGiftThreshold === undefined) {
      this.data.giftTierSettings.bigGiftThreshold = 5000;
    }
    if (this.data.giftTierSettings.globalBannerEnabled === undefined) {
      this.data.giftTierSettings.globalBannerEnabled = true;
    }
    if (this.data.giftTierSettings.globalBannerDurationMs === undefined) {
      this.data.giftTierSettings.globalBannerDurationMs = 10000;
    }
    return this.data.giftTierSettings;
  }

  updateGiftTierSettings(adminId: string, updates: Partial<SystemGiftTierSettings>): { success: boolean; settings: SystemGiftTierSettings; message: string } {
    const admin = this.getUserById(adminId);
    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'OWNER')) {
      throw new Error('غير مصرح لك بتعديل إعدادات الهدايا والأصوات');
    }

    const current = this.getGiftTierSettings();
    const updated: SystemGiftTierSettings = {
      ...current,
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    if (updates.tiers) {
      updated.tiers = updates.tiers;
    }
    if (updates.bigGiftThreshold !== undefined) {
      updated.bigGiftThreshold = Number(updates.bigGiftThreshold) || 5000;
    }
    if (updates.globalBannerEnabled !== undefined) {
      updated.globalBannerEnabled = Boolean(updates.globalBannerEnabled);
    }
    if (updates.globalBannerDurationMs !== undefined) {
      updated.globalBannerDurationMs = Number(updates.globalBannerDurationMs) || 5000;
    }

    this.data.giftTierSettings = updated;
    this.addAuditLog({
      adminId,
      action: 'SETTINGS_UPDATE',
      targetType: 'SYSTEM',
      targetId: 'GIFT_SYSTEM',
      details: 'تم تحديث فئات ومؤثرات أصوات الهدايا وشريط الهدايا العالمية بنجاح'
    });
    this.save();

    return {
      success: true,
      message: 'تم حفظ إعدادات فئات الهدايا وشريط الهدايا العالمية بنجاح',
      settings: updated
    };
  }

  // --- SHIPPING AGENT SYSTEM ---

  public setShippingAgent(
    ownerId: string,
    targetUserId: string,
    isAgent: boolean
  ): { success: boolean; message: string; user?: User } {
    if (!this.isOwner(ownerId)) {
      throw new Error('فقط المالك العام يستطيع تعيين أو إلغاء وكلاء الشحن');
    }
    const targetUser = this.getUserById(targetUserId);
    if (!targetUser) {
      throw new Error('المستخدم المستهدف غير موجود');
    }

    targetUser.isShippingAgent = isAgent;
    if (isAgent) {
      if (targetUser.role === 'USER') {
        targetUser.role = 'AGENT';
      }
    } else {
      if (targetUser.role === 'AGENT') {
        targetUser.role = 'USER';
      }
    }

    this.addNotification({
      userId: targetUser.id,
      title: isAgent ? 'تهانينا! أصبحت وكيل شحن رسمي 💎' : 'تحديث الصلاحيات',
      message: isAgent
        ? 'تم تعيينك كـ «وكيل شحن» رسمي في حكاوي بواسطة المالك. يمكنك الآن شحن وتحويل الماسات للمستخدمين.'
        : 'تم إلغاء تعيينك كـ وكيل شحن بواسطة المالك.',
      type: 'ADMIN'
    });

    this.addAuditLog({
      adminId: ownerId,
      action: isAgent ? 'ASSIGN_SHIPPING_AGENT' : 'REMOVE_SHIPPING_AGENT',
      targetType: 'USER',
      targetId: targetUser.id,
      details: `قام المالك بـ ${isAgent ? 'تعيين' : 'إلغاء'} المستخدم (${targetUser.name}) كوكيل شحن`
    });

    this.save();
    return {
      success: true,
      message: isAgent
        ? `تم تعيين ${targetUser.name} كـ وكيل شحن بنجاح`
        : `تم إلغاء وكيل الشحن عن ${targetUser.name}`,
      user: targetUser
    };
  }

  public agentTransferDiamonds(
    agentId: string,
    targetUserIdentifier: string,
    packageId: string
  ): { success: boolean; message?: string; error?: string; agentDiamonds?: number; targetUser?: Partial<User>; receipt?: ShippingRechargeLog } {
    const agent = this.getUserById(agentId);
    if (!agent) {
      return { success: false, error: 'حساب الوكيل غير موجود' };
    }

    const isAuthorizedAgent = agent.isShippingAgent === true || agent.role === 'AGENT' || agent.role === 'OWNER' || agent.isOwner === true;
    if (!isAuthorizedAgent) {
      return { success: false, error: 'غير مصرح لك بإجراء عمليات شحن كوكيل' };
    }

    const cleanIdentifier = (targetUserIdentifier || '').trim();
    if (!cleanIdentifier) {
      return { success: false, error: 'يرجى إدخال ID المستخدم أو اسم المستخدم' };
    }

    // Locate target user by ID, numericId, username, or phone
    let targetUser = this.getUserById(cleanIdentifier) ||
      this.data.users.find(u => u.numericId && u.numericId === cleanIdentifier) ||
      this.getUserByUsername(cleanIdentifier.toLowerCase()) ||
      this.getUserByPhone(cleanIdentifier);

    if (!targetUser) {
      return { success: false, error: 'المستخدم غير موجود. يرجى التأكد من الـ ID الرقمي أو اسم المستخدم.' };
    }

    // Security: Agent cannot increase or recharge their own balance
    if (targetUser.id === agent.id) {
      return { success: false, error: 'الوكيل لا يستطيع زيادة رصيده أو شحن حسابه بنفسه.' };
    }

    const packages = [
      { id: 'pkg_50', priceEgp: 50, diamonds: 50000, label: '50 جنيه = 50,000 ماسة' },
      { id: 'pkg_100', priceEgp: 100, diamonds: 100000, label: '100 جنيه = 100,000 ماسة' },
      { id: 'pkg_200', priceEgp: 200, diamonds: 200000, label: '200 جنيه = 200,000 ماسة' },
      { id: 'pkg_500', priceEgp: 500, diamonds: 500000, label: '500 جنيه = 500,000 ماسة' },
      { id: 'pkg_1000', priceEgp: 1000, diamonds: 1000000, label: '1,000 جنيه = 1,000,000 ماسة' }
    ];

    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) {
      return { success: false, error: 'باقة الشحن غير صحيحة' };
    }

    const isOwnerAgent = this.isOwner(agent.id);

    // Balance check for non-owner agents
    if (!isOwnerAgent && (agent.diamonds || 0) < pkg.diamonds) {
      return { success: false, error: 'رصيدك غير كافٍ لإتمام العملية' };
    }

    // Atomic diamond deduction (if non-owner agent) and addition
    if (!isOwnerAgent) {
      agent.diamonds = (agent.diamonds || 0) - pkg.diamonds;
    }
    targetUser.diamonds = (targetUser.diamonds || 0) + pkg.diamonds;
    this.addXP(targetUser.id, pkg.diamonds, 'AGENT_RECHARGE');

    // Generate unique Transaction Reference Number
    const refCode = `TXN-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;

    // Create required shipping recharge log in database
    const rechargeLog: ShippingRechargeLog = {
      id: `recharge_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      referenceId: refCode,
      userId: targetUser.id,
      userName: targetUser.name,
      userUsername: targetUser.username,
      userNumericId: targetUser.numericId || targetUser.id,
      amountEgp: pkg.priceEgp,
      diamonds: pkg.diamonds,
      agentId: agent.id,
      agentName: agent.name,
      agentNumericId: agent.numericId || agent.id,
      createdAt: new Date().toISOString(),
      status: 'COMPLETED',
      notes: `شحن خارجي عن طريق وكالة الشحن (${agent.name})`
    };

    this.data.shippingRechargeLogs = this.data.shippingRechargeLogs || [];
    this.data.shippingRechargeLogs.unshift(rechargeLog);

    // Wallet transactions
    if (!isOwnerAgent) {
      this.addWalletTransaction(
        agent.id,
        'DIAMOND',
        -pkg.diamonds,
        agent.diamonds,
        `تحويل شحن باقة (${pkg.label}) للمستخدم [${targetUser.name} - ID: ${targetUser.numericId || targetUser.id}] (مرجع: ${refCode})`
      );
    }

    this.addWalletTransaction(
      targetUser.id,
      'DIAMOND',
      pkg.diamonds,
      targetUser.diamonds,
      `شحن رصيد خارجي (${pkg.label}) بواسطة وكيل الشحن [${agent.name}] (مرجع: ${refCode})`
    );

    // Notifications
    this.addNotification({
      userId: targetUser.id,
      title: 'تم شحن رصيدك بالماسات 💎',
      message: `تم شحن ${pkg.diamonds.toLocaleString('ar-EG')} ماسة لحسابك بنجاح من خلال وكالة الشحن (${agent.name}). رقم المرجع: ${refCode}`,
      type: 'ADMIN'
    });

    this.addNotification({
      userId: agent.id,
      title: 'نجاح عملية الشحن 💎',
      message: `تم تحويل ${pkg.diamonds.toLocaleString('ar-EG')} ماسة بنجاح إلى المستخدم ${targetUser.name} (مرجع: ${refCode}).`,
      type: 'ADMIN'
    });

    // Audit log
    this.addAuditLog({
      adminId: agent.id,
      adminName: agent.name,
      action: 'SHIPPING_RECHARGE',
      targetType: 'USER',
      targetId: targetUser.id,
      details: `شحن خارجي بقيمة ${pkg.priceEgp} EGP (${pkg.diamonds} 💎) للمستخدم ${targetUser.name} (ID: ${targetUser.numericId || targetUser.id}) - مرجع: ${refCode}`
    });

    this.save();

    return {
      success: true,
      message: `تم شحن ${pkg.diamonds.toLocaleString('ar-EG')} ماسة للمستخدم ${targetUser.name} بنجاح!`,
      agentDiamonds: agent.diamonds,
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
        username: targetUser.username,
        diamonds: targetUser.diamonds
      },
      receipt: rechargeLog
    };
  }

  public getShippingRechargeLogs(): ShippingRechargeLog[] {
    this.data.shippingRechargeLogs = this.data.shippingRechargeLogs || [];
    return this.data.shippingRechargeLogs;
  }

  // --- DEVICE BINDING & SINGLE ACCOUNT PER DEVICE SYSTEM ---

  public getDeviceBinding(deviceId: string): DeviceBinding | undefined {
    if (!deviceId || !deviceId.trim()) return undefined;
    this.data.deviceBindings = this.data.deviceBindings || [];
    return this.data.deviceBindings.find(b => b.deviceId === deviceId.trim());
  }

  public validateDeviceAccess(deviceId: string, targetUserId?: string): { allowed: boolean; error?: string; boundUserId?: string } {
    if (!deviceId || !deviceId.trim()) {
      return { allowed: true };
    }

    const cleanDeviceId = deviceId.trim();
    this.data.deviceBindings = this.data.deviceBindings || [];
    const binding = this.data.deviceBindings.find(b => b.deviceId === cleanDeviceId);

    if (binding) {
      if (targetUserId && binding.userId === targetUserId) {
        binding.lastUsedAt = new Date().toISOString();
        this.save();
        return { allowed: true, boundUserId: binding.userId };
      }
      return {
        allowed: false,
        boundUserId: binding.userId,
        error: 'هذا الجهاز مرتبط بالفعل بحساب حكاوي آخر.'
      };
    }

    return { allowed: true };
  }

  public bindDevice(deviceId: string, userId: string, ip?: string): void {
    if (!deviceId || !deviceId.trim() || !userId) return;
    const cleanDeviceId = deviceId.trim();
    this.data.deviceBindings = this.data.deviceBindings || [];
    const user = this.getUserById(userId);

    const existing = this.data.deviceBindings.find(b => b.deviceId === cleanDeviceId);

    if (existing) {
      if (existing.userId === userId) {
        existing.lastUsedAt = new Date().toISOString();
        if (user?.email) existing.userEmail = user.email;
        if (user?.phone) existing.userPhone = user.phone;
        if (ip) existing.ip = ip;
      }
    } else {
      this.data.deviceBindings.push({
        deviceId: cleanDeviceId,
        userId,
        boundAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        userEmail: user?.email,
        userPhone: user?.phone,
        ip
      });
    }
    this.save();
  }
}

export const db = new Database();
