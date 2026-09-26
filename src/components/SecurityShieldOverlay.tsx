import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { screenProtectionService } from '../services/screenProtectionService';
import { Shield, ShieldAlert, Lock, AlertTriangle, EyeOff } from 'lucide-react';

interface SecurityShieldOverlayProps {
  currentUser: User | null;
  enableWatermark?: boolean;
}

export const SecurityShieldOverlay: React.FC<SecurityShieldOverlayProps> = ({
  currentUser,
  enableWatermark = true
}) => {
  const [isObscured, setIsObscured] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState(() => new Date().toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }));

  // Initialize screen protection service
  useEffect(() => {
    screenProtectionService.init();

    // Listen to focus/blur & visibility change (Recent Apps / App Switcher / multi-tasking preview)
    const unsubObscure = screenProtectionService.onObscureStateChange((obscured) => {
      setIsObscured(obscured);
    });

    // Listen to capture attempts
    const unsubAttempt = screenProtectionService.onCaptureAttempt((type) => {
      if (type === 'SCREENSHOT_KEY') {
        showAlert('⚠️ محاولة التقاط شاشة محظورة! المحتوى محمي بموجب سياسة الخصوصية.');
      } else if (type === 'SCREEN_SHARE_ATTEMPT') {
        showAlert('🚫 تم حظر محاولة مشاركة أو تسجيل الشاشة لحماية خصوصية المستخدمين.');
      } else if (type === 'PRINT_ATTEMPT') {
        showAlert('🔒 طباعة أو حفظ الصفحات بصيغة PDF غير متاح للمحتوى المحمي.');
      }
    });

    // Update watermark timestamp every 30 seconds
    const interval = setInterval(() => {
      setTimestamp(new Date().toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }));
    }, 30000);

    return () => {
      unsubObscure();
      unsubAttempt();
      clearInterval(interval);
    };
  }, []);

  const showAlert = (msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => {
      setAlertMessage(null);
    }, 4500);
  };

  // Generate dynamic user watermark text
  const watermarkText = currentUser
    ? `${currentUser.name} • UID: ${currentUser.id.slice(-6).toUpperCase()} • ${timestamp}`
    : `حكاوي • محتوى محمي • ${timestamp}`;

  return (
    <>
      {/* 1. Dynamic Anti-Leak Traceability Watermark */}
      {enableWatermark && currentUser && (
        <div
          className="fixed inset-0 pointer-events-none select-none z-[45] overflow-hidden opacity-[0.038] dark:opacity-[0.045] mix-blend-difference"
          aria-hidden="true"
        >
          <div className="absolute inset-[-100%] w-[300%] h-[300%] flex flex-wrap gap-20 -rotate-12 items-center justify-around">
            {Array.from({ length: 48 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs font-mono font-bold whitespace-nowrap tracking-wider text-slate-100"
              >
                <span>🛡️ {watermarkText}</span>
                <span className="text-[10px] text-amber-300/80">#HKW-{currentUser.id.slice(0, 4)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Privacy Shield (Recent Apps / Background App Switcher Blanking) */}
      {isObscured && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/98 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center select-none"
          dir="rtl"
        >
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-pulse">
              <Shield className="w-10 h-10" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-slate-900 border border-amber-500/50 text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-lg font-black text-slate-100 mb-1">
            حكاوي - محتوى محمي
          </h2>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            تم إخفاء الشاشة تلقائياً لمنع التقاط الشاشة في قائمة التطبيقات الحديثة.
          </p>
          <span className="mt-4 text-[10px] px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
            FLAG_SECURE ACTIVE 🔒
          </span>
        </div>
      )}

      {/* 3. Screen Capture Attempt Warning Toast */}
      {alertMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] w-[90%] max-w-md animate-in slide-in-from-top duration-300">
          <div className="p-3.5 rounded-2xl bg-rose-950/95 border border-rose-500/50 text-rose-200 shadow-2xl backdrop-blur-md flex items-start gap-3 text-right text-xs" dir="rtl">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
              <ShieldAlert className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-100 mb-0.5">تنبيه أمان وحماية الخصوصية</p>
              <p className="text-rose-200/90 leading-relaxed">{alertMessage}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
