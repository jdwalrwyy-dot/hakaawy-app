export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level <= 10) {
    return Math.floor((100 * level * (level - 1)) / 2);
  }
  if (level <= 30) {
    const base = Math.floor((100 * 10 * 9) / 2); // 4500
    const l = level - 10;
    return base + l * 1000 + l * l * 100;
  }
  if (level <= 100) {
    const base = 4500 + 20 * 1000 + 400 * 100; // 64500
    const l = level - 30;
    return base + l * 5000 + l * l * 500;
  }
  const base = 64500 + 70 * 5000 + 4900 * 500; // 2,864,500
  const l = level - 100;
  return base + l * 20000 + l * l * 2000;
}

export function calculateLevelFromXP(exp: number): number {
  if (!exp || exp <= 0) return 1;
  let lvl = 1;
  while (getXPForLevel(lvl + 1) <= exp) {
    lvl++;
  }
  return lvl;
}

export interface LevelProgressInfo {
  currentLevel: number;
  currentExp: number;
  currentLevelBaseXP: number;
  nextLevelXP: number;
  expInCurrentLevel: number;
  neededForNextLevel: number;
  remainingExpForNextLevel: number;
  progressPercent: number;
  nextUnlockFrame?: {
    id: string;
    nameAr: string;
    requiredLevel: number;
  };
}

export const FRAME_LEVEL_MILESTONES = [
  { level: 1, nameAr: 'إطار الزهور 🌸' },
  { level: 5, nameAr: 'إطار القط 🐱' },
  { level: 8, nameAr: 'إطار النيون ⚡' },
  { level: 10, nameAr: 'إطار الرحالة 🧭' },
  { level: 12, nameAr: 'إطار الصيف 🌴' },
  { level: 15, nameAr: 'إطار الورود 🌹' },
  { level: 18, nameAr: 'إطار الطبيعة 🍃' },
  { level: 20, nameAr: 'إطار الحب ❤️' },
  { level: 22, nameAr: 'إطار الأحلام 🌙' },
  { level: 25, nameAr: 'إطار الموسيقى 🎵' },
  { level: 28, nameAr: 'إطار الشتاء ❄️' },
  { level: 30, nameAr: 'إطار الفراشة 🦋' },
  { level: 32, nameAr: 'إطار المعرفة 📚' },
  { level: 35, nameAr: 'إطار الألعاب 🎮' },
  { level: 38, nameAr: 'إطار البحر 🌊' },
  { level: 40, nameAr: 'إطار النجوم 🌟' },
  { level: 45, nameAr: 'إطار التاج الفضي 🥈' },
  { level: 50, nameAr: 'إطار السايبر 🤖' },
  { level: 55, nameAr: 'إطار التاج الذهبي 👑' },
  { level: 60, nameAr: 'إطار الملاك 👼' },
  { level: 70, nameAr: 'إطار التنين الناري 🐉' }
];

export function getLevelProgressInfo(exp: number, currentLevelOverride?: number): LevelProgressInfo {
  const totalExp = Math.max(0, exp || 0);
  const currentLevel = currentLevelOverride || calculateLevelFromXP(totalExp);
  const currentLevelBaseXP = getXPForLevel(currentLevel);
  const nextLevelXP = getXPForLevel(currentLevel + 1);

  const neededForNextLevel = Math.max(1, nextLevelXP - currentLevelBaseXP);
  const expInCurrentLevel = Math.max(0, totalExp - currentLevelBaseXP);
  const remainingExpForNextLevel = Math.max(0, nextLevelXP - totalExp);

  const progressPercent = Math.min(
    100,
    Math.max(0, Math.floor((expInCurrentLevel / neededForNextLevel) * 100))
  );

  const nextUnlockFrame = FRAME_LEVEL_MILESTONES.find(m => m.level > currentLevel);

  return {
    currentLevel,
    currentExp: totalExp,
    currentLevelBaseXP,
    nextLevelXP,
    expInCurrentLevel,
    neededForNextLevel,
    remainingExpForNextLevel,
    progressPercent,
    nextUnlockFrame: nextUnlockFrame
      ? {
          id: `frame_${nextUnlockFrame.level}`,
          nameAr: nextUnlockFrame.nameAr,
          requiredLevel: nextUnlockFrame.level
        }
      : undefined
  };
}
