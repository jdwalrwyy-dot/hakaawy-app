/**
 * Avatar Frame Local Storage Cache & Catalog Manager
 * Caches frame images locally in LocalStorage / memory to ensure zero lag & instant room navigation.
 */

import { Frame } from '../types';

export const OWNER_FRAME_URL = 'https://i.postimg.cc/J40pyK8Y/1790585192100.jpg';

export const STORE_FRAMES: Frame[] = [
  {
    id: 'frame_legendary_colorful',
    nameAr: 'إطار أسطوري ملون',
    icon: '🌈',
    imageUrl: 'https://i.postimg.cc/tT3W1Vm0/file-841827-331881.jpg',
    previewGradient: 'linear-gradient(135deg, #FF007A 0%, #7928CA 50%, #4FE2B1 100%)',
    borderStyle: 'border-2 border-fuchsia-400 shadow-[0_0_12px_rgba(217,70,239,0.8)]',
    diamondPrice: 5000,
    coinPrice: 50000,
    isExclusiveOwner: false,
    requiredLevel: 1,
    descriptionAr: 'إطار أسطوري بألوان هولوجرافية ساحرة ومتميزة.',
    category: 'LEGENDARY'
  },
  {
    id: 'frame_golden_round',
    nameAr: 'إطار دائري ذهبي لامع',
    icon: '✨',
    imageUrl: 'https://i.postimg.cc/85RMFrnS/file-841827-512527.png',
    previewGradient: 'linear-gradient(135deg, #FFD700 0%, #F59E0B 50%, #D97706 100%)',
    borderStyle: 'border-2 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]',
    diamondPrice: 3000,
    coinPrice: 30000,
    isExclusiveOwner: false,
    requiredLevel: 1,
    descriptionAr: 'إطار دائري ذهبي ناصع البريق يحيط بملفك الشخصي بفخامة.',
    category: 'GOLDEN'
  },
  {
    id: 'frame_royal_golden_ornament',
    nameAr: 'إطار زخرفة ذهبية ملكي',
    icon: '⚜️',
    imageUrl: 'https://i.postimg.cc/TwVgyWNz/file-841827-883967.jpg',
    previewGradient: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
    borderStyle: 'border-2 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.9)]',
    diamondPrice: 7000,
    coinPrice: 70000,
    isExclusiveOwner: false,
    requiredLevel: 1,
    descriptionAr: 'نقوش وزخارف إمبراطورية ذهبية للملوك والأمراء.',
    category: 'ROYAL'
  },
  {
    id: 'frame_golden_hearts',
    nameAr: 'إطار القلوب الذهبية',
    icon: '💛',
    imageUrl: 'https://i.postimg.cc/gJV8w6BP/file-841827-889787.jpg',
    previewGradient: 'linear-gradient(135deg, #F59E0B 0%, #EC4899 100%)',
    borderStyle: 'border-2 border-pink-400 shadow-[0_0_12px_rgba(244,114,182,0.8)]',
    diamondPrice: 4000,
    coinPrice: 40000,
    isExclusiveOwner: false,
    requiredLevel: 1,
    descriptionAr: 'إطار مفعم بقلوب ذهبية ورومانسية ساحرة.',
    category: 'ROMANCE'
  },
  {
    id: 'frame_golden_wheat',
    nameAr: 'إطار سنبلة القمح الذهبية',
    icon: '🌾',
    imageUrl: 'https://i.postimg.cc/QtQ1BWYP/file-841827-394731.jpg',
    previewGradient: 'linear-gradient(135deg, #EAB308 0%, #CA8A04 100%)',
    borderStyle: 'border-2 border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.7)]',
    diamondPrice: 3500,
    coinPrice: 35000,
    isExclusiveOwner: false,
    requiredLevel: 1,
    descriptionAr: 'إطار سنابل الخير والوفرة الذهبية الجذابة.',
    category: 'GOLDEN'
  },
  {
    id: 'frame_golden_stars',
    nameAr: 'إطار النجوم الذهبية',
    icon: '⭐',
    imageUrl: 'https://i.postimg.cc/TwVgyWNz/file-841827-883967.jpg',
    previewGradient: 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)',
    borderStyle: 'border-2 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.9)]',
    diamondPrice: 4500,
    coinPrice: 45000,
    isExclusiveOwner: false,
    requiredLevel: 1,
    descriptionAr: 'إطار نجوم متلألئة في السماء الذهبية.',
    category: 'STARS'
  },
  {
    id: 'frame_owner_king',
    nameAr: 'إطار المالك الحصري الملكي',
    icon: '👑',
    imageUrl: OWNER_FRAME_URL,
    previewGradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF4500 100%)',
    borderStyle: 'border-2 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,1)] ring-2 ring-yellow-300',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: true,
    requiredLevel: 999,
    descriptionAr: 'إطار المالك التنفيذي الحصري مع التاج الذهبي والشارة الملكية.',
    category: 'ROYAL'
  },
  {
    id: 'frame_owner_exclusive',
    nameAr: 'إطار المالك الحصري الخاص',
    icon: '👑',
    imageUrl: OWNER_FRAME_URL,
    previewGradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF4500 100%)',
    borderStyle: 'border-2 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,1)] ring-2 ring-yellow-300',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: true,
    requiredLevel: 999,
    descriptionAr: 'إطار المالك الخاص والمميز للقيادة والإدارة العليا.',
    category: 'ROYAL'
  },
  {
    id: 'frame_king',
    nameAr: 'إطار الإدارة والمالك',
    icon: '👑',
    imageUrl: OWNER_FRAME_URL,
    previewGradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF4500 100%)',
    borderStyle: 'border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.9)] ring-2 ring-yellow-300',
    diamondPrice: 0,
    coinPrice: 0,
    isExclusiveOwner: true,
    requiredLevel: 999,
    descriptionAr: 'إطار المالك والإدارة الحصري للتطبيق.',
    category: 'ROYAL'
  }
];

// In-Memory cache map to ensure 0ms latency after initial fetch
const memoryFrameCache = new Map<string, string>();

/**
 * Normalizes URL keys for local storage
 */
function getStorageKey(url: string): string {
  return `hekawy_frame_cache_${url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 80)}`;
}

/**
 * Gets cached frame image URL (Base64 or cached link) from memory/LocalStorage
 */
export function getCachedFrameImage(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;

  // Check in-memory first
  if (memoryFrameCache.has(url)) {
    return memoryFrameCache.get(url)!;
  }

  // Check localStorage
  try {
    const key = getStorageKey(url);
    const cachedData = localStorage.getItem(key);
    if (cachedData) {
      memoryFrameCache.set(url, cachedData);
      return cachedData;
    }
  } catch (e) {
    // LocalStorage quota or access error
  }

  // Fallback to original URL
  return url;
}

/**
 * Pre-downloads and stores frame image in LocalStorage as Base64 for instant rendering
 */
export async function cacheFrameImageLocally(url: string): Promise<string> {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return url;

  const cached = getCachedFrameImage(url);
  if (cached && cached.startsWith('data:')) return cached;

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return url;
    const blob = await response.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        if (base64Data) {
          memoryFrameCache.set(url, base64Data);
          try {
            const key = getStorageKey(url);
            localStorage.setItem(key, base64Data);
          } catch (err) {
            console.warn('LocalStorage full, holding frame in memory cache:', err);
          }
          resolve(base64Data);
        } else {
          resolve(url);
        }
      };
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    // Network or CORS issue, fallback to original URL
    return url;
  }
}

/**
 * Preloads all store frame images into local cache
 */
export function preloadAllFrameImages(): void {
  STORE_FRAMES.forEach(f => {
    if (f.imageUrl) {
      cacheFrameImageLocally(f.imageUrl).catch(() => {});
    }
  });
}

/**
 * Lookup helper to get image URL for frameId or custom URL
 */
export function resolveFrameImageUrl(frameId?: string | null, customFrameUrl?: string | null): string | null {
  if (customFrameUrl) {
    return getCachedFrameImage(customFrameUrl);
  }

  if (!frameId) return null;

  if (frameId === 'frame_owner_king' || frameId === 'frame_king' || frameId === 'frame_owner_exclusive') {
    return getCachedFrameImage(OWNER_FRAME_URL);
  }

  const found = STORE_FRAMES.find(f => f.id === frameId);
  if (found && found.imageUrl) {
    return getCachedFrameImage(found.imageUrl);
  }

  return null;
}

// Automatically trigger preload when module is imported
if (typeof window !== 'undefined') {
  setTimeout(() => {
    preloadAllFrameImages();
  }, 1000);
}
