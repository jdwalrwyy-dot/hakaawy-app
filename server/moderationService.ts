import { ModerationCategory, ModerationAction, ModerationIncident, User } from '../src/types';

export interface ModerationScanResult {
  isSafe: boolean;
  decision: 'SAFE' | 'NEEDS_REVIEW' | 'VIOLATION';
  action: ModerationAction;
  category?: ModerationCategory;
  confidence: number;
  reason: string;
  details?: string;
}

// Prohibited Arabic & English terms relating to male nudity, underwear, sexual solicitation, and illicit content
const EXPLICIT_TEXT_PATTERNS: { regex: RegExp; category: ModerationCategory; reason: string }[] = [
  {
    regex: /(عري|عار|عاري|ملط|سكس|تعري|كشف العورة|كشف العضو|بدون ملابس|خلع الملابس)/i,
    category: 'MALE_NUDITY',
    reason: 'رصد ألفاظ أو دلالات صريحة على العُري والتعري'
  },
  {
    regex: /(بوكسر|ملابس داخلية|كيلوت|شورت داخلي|سروال داخلي|مايوه كاشف|عري رجالي|صدر عاري|بدون قميص)/i,
    category: 'UNDERWEAR_EXPOSURE',
    reason: 'رصد دلالات على الظهور بملابس داخلية أو كشف غير لائق'
  },
  {
    regex: /(قضيب|عضو ذكري|خصية|عورة|مؤخرة|مناطق خاصة|جنسي|شذوذ|إباحي)/i,
    category: 'GENITALIA_EXPOSURE',
    reason: 'رصد محتوى ينتهك حرمة المناطق الخاصة ومحظور نهائياً'
  },
  {
    regex: /(sex|nude|naked|penis|dick|underwear|boxer|panties|nsfw|shirtless|porn|horny|erotic)/i,
    category: 'SEXUAL_CONTENT',
    reason: 'Explicit sexual or nudity keyword detected'
  }
];

export class ServerModerationEngine {
  /**
   * Scans text content (room titles, descriptions, bios, chat messages)
   */
  public scanText(text: string): ModerationScanResult {
    if (!text || typeof text !== 'string') {
      return { isSafe: true, decision: 'SAFE', action: 'ALLOWED', confidence: 0, reason: 'محتوى نصي فارغ' };
    }

    const cleanText = text.trim();

    for (const pattern of EXPLICIT_TEXT_PATTERNS) {
      if (pattern.regex.test(cleanText)) {
        return {
          isSafe: false,
          decision: 'VIOLATION',
          action: 'AUTO_BAN_PERMANENT',
          category: pattern.category,
          confidence: 0.95,
          reason: pattern.reason,
          details: `تم رصد نص غير لائق: "${cleanText.substring(0, 30)}..."`
        };
      }
    }

    // Heuristic for suspicious ambiguous words
    const suspiciousWords = ['خاص كام', 'افتح كام', 'تعال خاص بدون', 'شوف جسمي', 'عضلات خاص'];
    for (const word of suspiciousWords) {
      if (cleanText.includes(word)) {
        return {
          isSafe: false,
          decision: 'NEEDS_REVIEW',
          action: 'QUEUED_FOR_REVIEW',
          category: 'SUSPICIOUS_UNVERIFIED',
          confidence: 0.65,
          reason: 'تم رصد عبارات مشبوهة تستدعي مراجعة الإدارة قبل النشر',
          details: `عبارة قيد الفحص: "${word}"`
        };
      }
    }

    return {
      isSafe: true,
      decision: 'SAFE',
      action: 'ALLOWED',
      confidence: 0.1,
      reason: 'النص متوافق مع معايير الآداب العامة'
    };
  }

  /**
   * Scans Image URL or Base64 / Canvas Data
   * Inspects metadata, known patterns, keywords in image URL, and heuristic indicators
   */
  public scanImage(
    imageUrlOrData: string,
    context?: { textContext?: string; userGender?: 'male' | 'female'; isLiveStream?: boolean }
  ): ModerationScanResult {
    if (!imageUrlOrData) {
      return { isSafe: true, decision: 'SAFE', action: 'ALLOWED', confidence: 0, reason: 'لا توجد صورة للفحص' };
    }

    const inputLower = imageUrlOrData.toLowerCase();

    // 1. Text Context scan (if provided)
    if (context?.textContext) {
      const textRes = this.scanText(context.textContext);
      if (!textRes.isSafe) {
        return textRes;
      }
    }

    // 2. Direct URL keywords scan
    const forbiddenUrlKeywords = [
      { key: 'nude', cat: 'MALE_NUDITY' as ModerationCategory, reason: 'رابط صورة يحتوي على وسوم عري صريحة' },
      { key: 'naked', cat: 'MALE_NUDITY' as ModerationCategory, reason: 'رابط صورة يحتوي على وسوم عري صريحة' },
      { key: 'underwear', cat: 'UNDERWEAR_EXPOSURE' as ModerationCategory, reason: 'رابط صورة يحتوي على ملابس داخلية' },
      { key: 'shirtless', cat: 'MALE_NUDITY' as ModerationCategory, reason: 'رصد ظهور عاري الصدر للرجال مخالف لسياسة المنصة' },
      { key: 'boxer', cat: 'UNDERWEAR_EXPOSURE' as ModerationCategory, reason: 'رصد ملابس داخلية رجالية' },
      { key: 'penis', cat: 'GENITALIA_EXPOSURE' as ModerationCategory, reason: 'رصد انتهاك صارخ للمناطق الخاصة' },
      { key: 'nsfw', cat: 'SEXUAL_CONTENT' as ModerationCategory, reason: 'محتوى مصنف كـ NSFW محظور تماماً' }
    ];

    for (const kw of forbiddenUrlKeywords) {
      if (inputLower.includes(kw.key)) {
        return {
          isSafe: false,
          decision: 'VIOLATION',
          action: 'AUTO_BAN_PERMANENT',
          category: kw.cat,
          confidence: 0.98,
          reason: kw.reason,
          details: `تم حظر المحتوى تلقائياً بسبب مطابقة الكلمة المفتاحية المحظورة (${kw.key})`
        };
      }
    }

    // 3. Base64 payload heuristics (e.g. from camera frame or user file upload)
    if (imageUrlOrData.startsWith('data:image')) {
      // If skin tone ratio metadata was passed in query or payload (e.g. skinPercent)
      // Check if it has a high skin ratio flag
      if (inputLower.includes('violation_flag:male_nudity') || inputLower.includes('nudity_detected=1')) {
        return {
          isSafe: false,
          decision: 'VIOLATION',
          action: 'AUTO_BAN_PERMANENT',
          category: 'MALE_NUDITY',
          confidence: 0.96,
          reason: 'كشف عُري للرجال في البث المباشر أو الصورة المرفقة',
          details: 'تم رصد كشف للأعضاء أو عدم ارتداء ملابس لائقة'
        };
      }
    }

    return {
      isSafe: true,
      decision: 'SAFE',
      action: 'ALLOWED',
      confidence: 0.05,
      reason: 'الصورة مجازة وفق معايير الحشمة المعتمدة'
    };
  }

  /**
   * Evaluates client-side frame skin analysis data from live video stream
   */
  public evaluateStreamAnalysis(
    skinRatio: number,
    torsoExposureRatio: number,
    userGender?: string
  ): ModerationScanResult {
    // If more than 45% skin surface or more than 35% upper torso exposed in male stream
    if (torsoExposureRatio >= 0.42 || skinRatio >= 0.55) {
      return {
        isSafe: false,
        decision: 'VIOLATION',
        action: 'AUTO_BAN_PERMANENT',
        category: 'MALE_NUDITY',
        confidence: 0.92,
        reason: 'تم رصد كشف عري/صدر أو عدم ارتداء ملابس علوية في البث المباشر',
        details: `نسبة تعري الجسد المرصودة: ${(skinRatio * 100).toFixed(1)}%`
      };
    }

    // Borderline exposure (needs review / obscuring)
    if (torsoExposureRatio >= 0.28 || skinRatio >= 0.38) {
      return {
        isSafe: false,
        decision: 'NEEDS_REVIEW',
        action: 'QUEUED_FOR_REVIEW',
        category: 'EXCESSIVE_SKIN',
        confidence: 0.72,
        reason: 'نسبة كشف جسد مرتفعة تستدعي المراجعة الفورية',
        details: `نسبة الكشف: ${(skinRatio * 100).toFixed(1)}% - تم إخفاء البث مؤقتاً`
      };
    }

    return {
      isSafe: true,
      decision: 'SAFE',
      action: 'ALLOWED',
      confidence: 0.08,
      reason: 'البث المباشر متوافق مع معايير الحشمة'
    };
  }
}

export const serverModerationEngine = new ServerModerationEngine();
