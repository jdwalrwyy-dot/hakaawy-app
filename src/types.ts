export type UserRole = 'USER' | 'HOST' | 'AGENT' | 'STAFF' | 'MODERATOR' | 'ADMIN' | 'OWNER';

export const SYSTEM_OWNER_EMAILS = [
  'jdwalrwyy@gmail.com',
  'waledwwwz41@gmail.com'
];

export function isUserOwner(user?: User | PublicUserProfile | null): boolean {
  if (!user) return false;
  if (user.role === 'OWNER' || user.isOwner === true || user.is_owner === true) return true;
  if (user.id === 'user_admin' || user.id === 'user_owner_waled' || user.id === 'user_1788450708278_wtpv') return true;
  const username = user.username?.toLowerCase();
  if (username === 'jdwalrwyy' || username === 'waledwwwz41' || username === 'waled') return true;
  if ('email' in user && user.email) {
    const email = user.email.toLowerCase();
    if (SYSTEM_OWNER_EMAILS.some(e => e.toLowerCase() === email)) return true;
  }
  return false;
}

export interface DeviceSavedAccount {
  id: string;
  numericId?: string;
  name: string;
  username: string;
  avatar: string;
  role: UserRole;
  isOwner?: boolean;
  ownerToken?: string;
  level?: number;
  diamonds: number;
  coins: number;
  phone?: string;
  email?: string;
  lastUsedAt: string;
}

export interface User {
  id: string;
  numericId?: string;
  isVipNumericId?: boolean;
  name: string;
  username: string;
  avatar: string;
  gender?: 'male' | 'female';
  phone?: string;
  email?: string;
  googleId?: string;
  bio?: string;
  level: number;
  exp: number;
  coins: number;
  diamonds: number;
  role: UserRole;
  isOwner?: boolean;
  is_owner?: boolean;
  canRecharge?: boolean;
  followersCount: number;
  followingCount: number;
  friendsCount: number;
  activeFrameId?: string;
  customFrameUrl?: string | null;
  activeEntranceId?: string;
  referralCode: string;
  referredBy?: string;
  isShippingAgent?: boolean;
  isBanned?: boolean;
  banReason?: string;
  createdAt: string;
  isOnline?: boolean;
  isStealthMode?: boolean;
}

export interface ShippingPackage {
  id: string;
  priceEgp: number;
  diamonds: number;
  label: string;
}

export const SHIPPING_PACKAGES: ShippingPackage[] = [
  { id: 'pkg_50', priceEgp: 50, diamonds: 50000, label: '50 جنيه = 50,000 ماسة' },
  { id: 'pkg_100', priceEgp: 100, diamonds: 100000, label: '100 جنيه = 100,000 ماسة' },
  { id: 'pkg_200', priceEgp: 200, diamonds: 200000, label: '200 جنيه = 200,000 ماسة' },
  { id: 'pkg_500', priceEgp: 500, diamonds: 500000, label: '500 جنيه = 500,000 ماسة' },
  { id: 'pkg_1000', priceEgp: 1000, diamonds: 1000000, label: '1,000 جنيه = 1,000,000 ماسة' }
];

export interface PublicUserProfile {
  id: string;
  numericId?: string;
  isVipNumericId?: boolean;
  name: string;
  username: string;
  avatar: string;
  gender?: 'male' | 'female';
  bio?: string;
  level: number;
  exp?: number;
  role: UserRole;
  isOwner?: boolean;
  is_owner?: boolean;
  followersCount: number;
  followingCount: number;
  friendsCount: number;
  activeFrameId?: string;
  activeEntranceId?: string;
  referralCode?: string;
  createdAt: string;
  isOnline?: boolean;
  isFollowing?: boolean;
  friendshipStatus?: 'NONE' | 'PENDING' | 'ACCEPTED';
  currentRoomRole?: RoomRole | 'HOST';
  currentSeatIndex?: number | null;
  isMutedInRoom?: boolean;
  isSpeakingInRoom?: boolean;
}

export type RoomType = 'PUBLIC' | 'PRIVATE';
export type RoomStatus = 'LIVE' | 'WAITING' | 'ENDED';
export type RoomRole = 'HOST' | 'MODERATOR' | 'SPEAKER' | 'LISTENER';
export type MicLayoutType = '2+10' | '10' | '15' | '2+15' | '5' | '8' | '4' | '12' | 'auto';

export interface Room {
  id: string;
  roomCode: string;
  title: string;
  description: string;
  coverImage: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  hostFrameId?: string;
  type: RoomType;
  password?: string;
  status: RoomStatus;
  allowAudio: boolean;
  allowVideo: boolean;
  viewerCount: number;
  currentCategory: string;
  createdAt: string;
  tags: string[];
  endedAt?: string;
  micLayout?: MicLayoutType;
  seatsCount?: number;
}

export interface RoomMember {
  roomId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userGender?: 'male' | 'female';
  userFrameId?: string;
  userEntranceId?: string;
  roleInRoom: RoomRole;
  isMuted: boolean;
  isCameraOn: boolean;
  isSpeaking: boolean;
  isStealth?: boolean;
  joinedAt: string;
}

export interface RoomSeat {
  seatIndex: number; // 0 to N
  userId: string | null;
  userName?: string;
  userAvatar?: string;
  userGender?: 'male' | 'female';
  userFrameId?: string;
  isMuted: boolean;
  isCameraOn: boolean;
  isSpeaking: boolean;
  isLocked: boolean;
  isHostSeat: boolean;
  isVipSeat?: boolean;
  seatLabel?: string;
  customFrameUrl?: string | null;
}

export interface MicRequest {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  targetSeatIndex?: number;
  seatLabel?: string;
  requestedAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
}

export interface RoomMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userFrameId?: string;
  userRole: UserRole;
  text: string;
  createdAt: string;
  isModerated?: boolean;
  giftData?: {
    giftId: string;
    giftName: string;
    giftIcon: string;
    count: number;
    receiverName: string;
  };
}

export type OfficialMessageTarget = 'ALL' | 'HOSTS' | 'AGENTS' | 'STAFF' | 'ADMINS' | 'USER_SPECIFIC';

export interface OfficialHekawyMessage {
  id: string;
  senderId: 'HEKAWY_OFFICIAL';
  senderName: string; // 'حكاوي'
  senderAvatar: string;
  targetCategory: OfficialMessageTarget;
  targetCategoryLabel: string;
  receiverId: string;
  receiverName?: string;
  text: string;
  createdAt: string;
  read: boolean;
  isOfficial: true;
}

export interface PrivateMessage {
  id: string;
  senderId: string;
  receiverId: string;
  senderName?: string;
  senderAvatar?: string;
  text: string;
  createdAt: string;
  read: boolean;
  isOfficial?: boolean;
  targetCategory?: OfficialMessageTarget;
  targetCategoryLabel?: string;
}

export interface Friendship {
  id: string;
  user1Id: string;
  user2Id: string;
  status: 'PENDING' | 'ACCEPTED';
  requestedBy: string;
  createdAt: string;
  otherUser?: User;
}

export type GiftTierLevel = 'COMMON' | 'PRETTY' | 'LUXURY' | 'LEGENDARY' | 'VIP' | 'STANDARD' | 'FEATURED' | 'RARE';
export type GiftCategory = 'all' | 'common' | 'pretty' | 'luxury' | 'legendary' | 'vip';

export interface Gift {
  id: string;
  nameAr: string;
  icon: string;
  diamondCost: number;
  coinReward: number;
  animationType: string;
  soundKey: string;
  category: 'common' | 'pretty' | 'luxury' | 'legendary' | 'vip' | string;
  tierLevel?: GiftTierLevel;
  badge?: string;
  descriptionAr?: string;
}

export interface GiftTransaction {
  id: string;
  giftId: string;
  giftName: string;
  giftIcon: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
  roomId?: string;
  count: number;
  totalDiamonds: number;
  createdAt: string;
  idempotencyKey?: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'COIN' | 'DIAMOND';
  amount: number;
  newBalance: number;
  reason: string;
  createdAt: string;
}

export interface ShippingRechargeLog {
  id: string;
  referenceId: string;
  userId: string;
  userName: string;
  userUsername: string;
  userNumericId: string;
  amountEgp: number;
  diamonds: number;
  agentId: string;
  agentName: string;
  agentNumericId: string;
  createdAt: string;
  status: 'COMPLETED' | 'CANCELLED';
  notes?: string;
}

export interface DailyTask {
  id: string;
  titleAr: string;
  descriptionAr?: string;
  rewardCoins: number;
  rewardExp: number;
  taskType: 'DAILY_LOGIN' | 'JOIN_ROOM' | 'STAY_10_MIN' | 'SEND_GIFT' | 'RECEIVE_GIFT' | 'INVITE_FRIEND' | 'SHARE_APP';
  requiredCount: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export interface TaskCompletionLog {
  id: string;
  userId: string;
  user_id?: string;
  taskId: string;
  task_id?: string;
  reward: number;
  completedAt: string;
  completed_at?: string;
  date: string;
}

export interface ReferralRecord {
  referral_id: string;
  referrer_user_id: string;
  referred_user_id: string;
  referral_code: string;
  status: 'COMPLETED' | 'REJECTED';
  reward_amount: number;
  created_at: string;
  completed_at: string;
  referredUserName?: string;
  referredUserAvatar?: string;
}

export interface ReferralStats {
  success: boolean;
  referralCode: string;
  shareUrl: string;
  successfulInvites: number;
  earnedCoins: number;
  history?: ReferralRecord[];
}

export interface Frame {
  id: string;
  nameAr: string;
  icon: string;
  previewGradient: string;
  borderStyle: string;
  diamondPrice: number;
  coinPrice: number;
  isExclusiveOwner: boolean;
  descriptionAr: string;
  description?: string;
  category?: string;
  requiredLevel: number;
}

export type EntranceCategory = 'FREE' | 'VEHICLE' | 'AERIAL' | 'CREATURE' | 'MYTHIC' | 'OWNER' | '3D' | '5D' | string;
export type EntranceTier = 'COMMON' | 'LUXURY' | 'LEGENDARY' | 'ROYAL_VIP' | 'OWNER_EXCLUSIVE';
export type EntranceSoundType = 'jet' | 'supercar' | 'bike' | 'yacht' | 'falcon' | 'eagle' | 'dove' | 'steed' | 'helicopter' | 'space' | 'dragon' | 'sparkle' | 'royal_fanfare';

export interface Entrance {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  diamondPrice: number;
  category: EntranceCategory;
  tier: EntranceTier;
  durationSeconds: number;
  soundType: EntranceSoundType;
  isExclusiveOwner?: boolean;
  badgeLabel?: string;
  previewColor: string;
  isDisabled?: boolean;
}

export interface UserEntrance {
  id: string;
  userId: string;
  entranceId: string;
  acquiredAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'USER' | 'ROOM' | 'MESSAGE' | 'STREAM';
  targetId: string;
  targetName: string;
  reason: string;
  details: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

export interface Ban {
  id: string;
  userId: string;
  userName: string;
  bannedBy: string;
  reason: string;
  category?: string;
  mediaSnapshot?: string;
  isPermanent: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export type ModerationCategory =
  | 'MALE_NUDITY'
  | 'UNDERWEAR_EXPOSURE'
  | 'GENITALIA_EXPOSURE'
  | 'SEXUAL_CONTENT'
  | 'EXCESSIVE_SKIN'
  | 'SUSPICIOUS_UNVERIFIED';

export type ModerationAction =
  | 'AUTO_BAN_PERMANENT'
  | 'QUEUED_FOR_REVIEW'
  | 'AUTO_BLUR_WARN'
  | 'ALLOWED';

export interface ModerationIncident {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userAvatar: string;
  targetType: 'AVATAR' | 'ROOM_COVER' | 'LIVE_STREAM' | 'CHAT_MEDIA' | 'VIDEO' | 'ROOM_TEXT';
  targetId?: string;
  reason: string;
  category: ModerationCategory;
  confidenceScore: number;
  status: 'BLOCKED_BANNED' | 'NEEDS_REVIEW' | 'APPROVED' | 'DISMISSED';
  actionTaken: ModerationAction;
  mediaSnapshot?: string;
  details?: string;
  detectedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface BannedIdentifier {
  id: string;
  type: 'USER_ID' | 'PHONE' | 'EMAIL' | 'GOOGLE_ID' | 'USERNAME';
  value: string;
  reason: string;
  bannedAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  mediaSnapshot?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'MESSAGE' | 'FRIEND_REQUEST' | 'FRIEND_ACCEPT' | 'FOLLOW' | 'GIFT' | 'INVITE' | 'ROOM_JOIN' | 'ADMIN' | 'SYSTEM';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRooms: number;
  liveRooms: number;
  totalLiveStreams: number;
  totalMessages: number;
  totalGiftsSent: number;
  totalTransactions: number;
  totalReports: number;
  totalDiamondsSpent: number;
  totalCoinsCirculating: number;
  totalAgencies?: number;
  totalHosts?: number;
  totalTargetAchieved?: number;
}

// --- HOSTS, AGENTS, AGENCIES & TARGETS SYSTEM ---

export type HostApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface HostApplication {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userUsername: string;
  phone: string;
  country?: string;
  experienceBio: string;
  specialTalent: string;
  sampleLink?: string;
  agentInviteCode?: string;
  agencyId?: string;
  agencyName?: string;
  agencyCode?: string;
  status: HostApplicationStatus;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  hostCode?: string;
  createdAt: string;
}

export type AgentApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AgentApplication {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userUsername: string;
  agencyName: string;
  phone: string;
  country: string;
  expectedHostsCount: number;
  experienceBio: string;
  status: AgentApplicationStatus;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  agencyCode?: string;
  createdAt: string;
}

export interface Agency {
  id: string;
  ownerUserId: string;
  ownerName: string;
  ownerAvatar: string;
  agencyName: string;
  agencyCode: string;
  inviteCode: string;
  status: 'ACTIVE' | 'SUSPENDED';
  contactPhone: string;
  country: string;
  hostsCount: number;
  activeHostsCount: number;
  totalDiamondsEarned: number;
  commissionPercentage: number;
  createdAt: string;
}

export interface HostProfile {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  hostCode: string;
  agencyId?: string;
  agencyName?: string;
  agencyCode?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  category: string;
  bio: string;
  totalLiveMinutes: number;
  totalDiamondsReceived: number;
  totalValidDays: number;
  approvedAt: string;
  approvedBy: string;
}

export interface TargetConfig {
  id: string;
  title: string;
  period: 'MONTHLY' | 'WEEKLY';
  monthYear: string;
  requiredDiamonds: number;
  requiredLiveMinutes: number;
  requiredActiveDays: number;
  rewardCoins: number;
  rewardDiamonds: number;
  agentCommissionPct: number;
  isActive: boolean;
  createdAt: string;
}

export interface HostTargetProgress {
  hostId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  hostCode: string;
  agencyId?: string;
  agencyName?: string;
  agencyCode?: string;
  targetConfigId: string;
  targetTitle: string;
  period: 'MONTHLY' | 'WEEKLY';
  targetDiamonds: number;
  currentDiamonds: number;
  remainingDiamonds: number;
  targetLiveMinutes: number;
  currentLiveMinutes: number;
  targetActiveDays: number;
  currentActiveDays: number;
  progressPercentage: number;
  isAchieved: boolean;
  rewardClaimed: boolean;
  lastUpdated: string;
}

export interface AgencyDashboardData {
  agency: Agency;
  hosts: Array<{
    hostProfile: HostProfile;
    user: User;
    targetProgress: HostTargetProgress;
  }>;
  summary: {
    totalHosts: number;
    activeHosts: number;
    suspendedHosts: number;
    totalAgencyDiamonds: number;
    totalAgencyTargetDiamonds: number;
    averageCompletionRate: number;
    achievedTargetsCount: number;
  };
}

export interface HostDashboardData {
  hostProfile: HostProfile;
  agency?: Agency;
  targetProgress: HostTargetProgress;
  targetHistory: HostTargetProgress[];
  eligibleLiveHours: number;
  eligibleGiftsCount: number;
  accountStatus: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'NOT_APPLIED';
}

export interface GiftTierConfig {
  level: GiftTierLevel;
  nameAr: string;
  minDiamonds: number;
  maxDiamonds: number;
  hasSound: boolean;
  soundType: 'none' | 'common_chime' | 'pretty_crystal' | 'rare_chime' | 'luxury_fanfare' | 'legendary_grand' | 'vip_imperial';
  hasFullscreenAura: boolean;
  celebrationDurationMs: number;
  screenGlowColor: string;
  descriptionAr: string;
}

export interface SystemGiftTierSettings {
  tiers: GiftTierConfig[];
  globalSoundEnabled: boolean;
  bigGiftThreshold?: number;
  globalBannerEnabled?: boolean;
  globalBannerDurationMs?: number;
  lastUpdated?: string;
}

