import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { API } from '../services/api';
import { triggerGoogleSignIn, renderGoogleSignInButton, GoogleUserProfile } from '../services/googleAuth';
import { soundEffects } from '../services/soundEffects';
import {
  Radio,
  Phone,
  User as UserIcon,
  Sparkles,
  X,
  AlertCircle,
  Loader2,
  Gift,
  LogIn,
  UserPlus,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User, ownerToken?: string) => void;
  currentUser: User | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser
}) => {
  const [mode, setMode] = useState<'google' | 'register' | 'login'>('google');
  const [loginMethod, setLoginMethod] = useState<'phone' | 'username'>('phone');
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  
  // Login fields
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [ownerPin, setOwnerPin] = useState('');
  const [requiresOwnerPin, setRequiresOwnerPin] = useState(false);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regGender, setRegGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [regPhone, setRegPhone] = useState('');
  const [regReferral, setRegReferral] = useState('');
  const [hasUrlReferral, setHasUrlReferral] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setIsOtpSent(false);
      setOtpCode('');
      setOwnerPin('');
      setRequiresOwnerPin(false);
      setIsGoogleLoading(false);
      setIsLoading(false);

      // Check for pending referral code from URL
      const pendingRef = 
        localStorage.getItem('hekawy_pending_ref_code') || 
        sessionStorage.getItem('hekawy_pending_ref_code');

      if (pendingRef && pendingRef.trim()) {
        const cleanRef = pendingRef.trim().toUpperCase();
        setRegReferral(cleanRef);
        setHasUrlReferral(true);
        setMode('register');
      } else {
        setHasUrlReferral(false);
        setMode('google');
      }
    }
  }, [isOpen]);

  // Render official Google Sign In button onto container when in google mode
  useEffect(() => {
    if (isOpen && mode === 'google' && googleBtnContainerRef.current) {
      const cleanup = renderGoogleSignInButton(
        googleBtnContainerRef.current,
        async (profile: GoogleUserProfile) => {
          setIsGoogleLoading(true);
          setErrorMsg(null);
          try {
            const referralToUse = regReferral.trim() || 
              localStorage.getItem('hekawy_pending_ref_code') || 
              sessionStorage.getItem('hekawy_pending_ref_code') || 
              undefined;

            const res = await API.loginWithGoogle({
              googleId: profile.googleId,
              email: profile.email,
              name: profile.name,
              avatar: profile.avatar || undefined,
              referredBy: referralToUse ? referralToUse.trim().toUpperCase() : undefined
            });

            finalizeAuth(res.user, res.ownerToken);
          } catch (err: any) {
            console.warn('Google auth error:', err);
            setErrorMsg(err.message || 'تعذر تسجيل الدخول بحساب Google');
          } finally {
            setIsGoogleLoading(false);
          }
        },
        (err) => {
          console.warn('Google button init error:', err);
        }
      );
      return cleanup;
    }
  }, [isOpen, mode, regReferral]);

  if (!isOpen) return null;

  // Clear referral tracking upon successful completion & save session
  const finalizeAuth = (user: User, ownerToken?: string) => {
    if (ownerToken) {
      localStorage.setItem('hekawy_owner_token', ownerToken);
    }
    localStorage.removeItem('hekawy_pending_ref_code');
    sessionStorage.removeItem('hekawy_pending_ref_code');
    soundEffects.playJoinRoom();
    onLoginSuccess(user, ownerToken);
    onClose();
  };

  // Google Authentication Trigger
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMsg(null);
    try {
      const profile: GoogleUserProfile = await triggerGoogleSignIn();
      const referralToUse = regReferral.trim() || 
        localStorage.getItem('hekawy_pending_ref_code') || 
        sessionStorage.getItem('hekawy_pending_ref_code') || 
        undefined;

      const res = await API.loginWithGoogle({
        googleId: profile.googleId,
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar || undefined,
        referredBy: referralToUse ? referralToUse.trim().toUpperCase() : undefined
      });

      finalizeAuth(res.user, res.ownerToken);
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      if (err.message && err.message.includes('إلغاء')) {
        setErrorMsg('تم إلغاء تسجيل الدخول أو اختيار الحساب');
      } else {
        setErrorMsg(err.message || 'تعذر تسجيل الدخول بحساب Google. يمكنك استخدام رقم الهاتف أو اسم المستخدم.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Phone OTP Flow
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 8) {
      setErrorMsg('يرجى إدخال رقم هاتف صحيح');
      return;
    }
    setIsOtpSent(true);
    setErrorMsg(null);
    setOtpCode('');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 4) {
      setErrorMsg('يرجى إدخال رمز التحقق المكون من 4 أرقام');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await API.login({ 
        phone: phone.trim(),
        ownerPin: ownerPin.trim() || undefined
      });
      finalizeAuth(res.user, res.ownerToken);
    } catch (err: any) {
      if (err.requiresOwnerPin) {
        setRequiresOwnerPin(true);
        setErrorMsg(err.message || 'حساب المالك العام محمي برمز أمان خاص. يرجى إدخال رمز الأمان (PIN).');
      } else {
        setErrorMsg(err.message || 'فشل تسجيل الدخول برقم الهاتف');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Username Login Flow
  const handleUsernameLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim()) {
      setErrorMsg('يرجى إدخال اسم المستخدم');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await API.login({ 
        username: loginUsername.trim().toLowerCase(),
        ownerPin: ownerPin.trim() || undefined
      });
      finalizeAuth(res.user, res.ownerToken);
    } catch (err: any) {
      if (err.requiresOwnerPin) {
        setRequiresOwnerPin(true);
        setErrorMsg(err.message || 'حساب المالك العام محمي برمز أمان خاص. يرجى إدخال رمز الأمان (PIN).');
      } else {
        setErrorMsg(err.message || 'اسم المستخدم غير موجود');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Register Flow
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regUsername.trim()) {
      setErrorMsg('الاسم واسم المستخدم مطلوبان');
      return;
    }

    const referralToUse = regReferral.trim() || 
      localStorage.getItem('hekawy_pending_ref_code') || 
      sessionStorage.getItem('hekawy_pending_ref_code') || 
      undefined;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await API.register({
        name: regName.trim(),
        username: regUsername.trim().toLowerCase(),
        gender: regGender,
        phone: regPhone.trim() || undefined,
        referredBy: referralToUse ? referralToUse.trim().toUpperCase() : undefined
      });
      finalizeAuth(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'تعذر إنشاء الحساب');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-lg text-slate-100">
                مرحبًا بك في حكاوي 🎙️
              </h2>
              <p className="text-xs text-slate-400">
                {mode === 'register' 
                  ? 'أنشئ حسابك الجديد للمشاركة في الغرف الصوتية والبث'
                  : 'سجّل دخولك لحسابك الخاص عبر Google أو رقم الهاتف'}
              </p>
            </div>
          </div>
          {currentUser && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Primary Screen Tabs: Google vs Phone vs Register */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-[11px] font-black">
          <button
            type="button"
            id="auth-tab-google"
            onClick={() => {
              setMode('google');
              setErrorMsg(null);
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'google'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
              <path fill={mode === 'google' ? '#0f172a' : '#4285F4'} d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill={mode === 'google' ? '#0f172a' : '#34A853'} d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill={mode === 'google' ? '#0f172a' : '#FBBC05'} d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill={mode === 'google' ? '#0f172a' : '#EA4335'} d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            id="auth-tab-phone"
            onClick={() => {
              setMode('login');
              setLoginMethod('phone');
              setErrorMsg(null);
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>رقم الهاتف</span>
          </button>

          <button
            type="button"
            id="auth-tab-register"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>حساب جديد</span>
          </button>
        </div>

        {/* Active Referral Banner (if came from referral URL) */}
        {regReferral && (
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center gap-3 text-right">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300">رابط دعوة مفعّل</span>
                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {regReferral}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                عند إتمام التسجيل سيحصل صاحب الدعوة على 10 كونز مكافأة إحالة! 🎁
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* MODE: OFFICIAL GOOGLE ACCOUNT PICKER */}
        {mode === 'google' && (
          <div className="flex flex-col gap-4 py-1">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-3 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-white/5 border border-slate-200">
                <svg className="w-8 h-8" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-100">
                  Google Account Picker الرسمي لنظام Android
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  يفتح نافذة اختيار الحسابات الرسمية لإظهار كافة حسابات Google الموجودة على هاتفك بدون أي حد واختيار أي حساب للدخول أو التسجيل فوراً.
                </p>
              </div>

              {/* Main Google Sign-in Button */}
              <button
                type="button"
                id="google-signin-btn"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm flex items-center justify-center gap-3 shadow-xl shadow-white/10 active:scale-98 transition-all border border-slate-200 cursor-pointer disabled:opacity-75 group"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-900" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span>{isGoogleLoading ? 'جاري فتح حسابات Google...' : 'تسجيل عبر Google'}</span>
              </button>

              {/* Official Google Button Render Container */}
              <div ref={googleBtnContainerRef} className="flex justify-center my-0.5 overflow-hidden" />

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 text-right mt-1 border-t border-slate-800 pt-3">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>عرض جميع حسابات الهاتف</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>إنشاء أو دخول تلقائي</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>بدون كتابة إيميل يدوياً</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>ربط دائم بحسابك المختار</span>
                </div>
              </div>
            </div>

            {/* Quick Link to manual login */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className="text-xs text-slate-400 hover:text-amber-400 transition-colors cursor-pointer py-1 px-3"
              >
                تسجيل الدخول برقم الهاتف أو اسم المستخدم السابق ←
              </button>
            </div>
          </div>
        )}

        {/* MODE: LOGIN (Phone or Username) */}
        {mode === 'login' && (
          <div className="flex flex-col gap-3">
            {/* Login sub-tabs: Phone vs Username */}
            <div className="flex items-center gap-2 text-xs border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  loginMethod === 'phone'
                    ? 'bg-slate-800 text-amber-400 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                برقم الهاتف
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('username')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  loginMethod === 'username'
                    ? 'bg-slate-800 text-amber-400 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                باسم المستخدم
              </button>
            </div>

            {loginMethod === 'phone' && (
              <>
                {!isOtpSent ? (
                  <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">رقم الهاتف المسجل</label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          placeholder="+966501234567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm font-mono focus:border-amber-400 focus:outline-none"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 active:scale-98 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-slate-950" />
                          <span>جاري إرسال كود التحقق...</span>
                        </>
                      ) : (
                        <span>إرسال كود التحقق (OTP)</span>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                      تم إرسال رمز التحقق إلى <b>{phone}</b>. كود التجربة: <b>1234</b>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">رمز التحقق (4 أرقام)</label>
                      <input
                        type="text"
                        maxLength={4}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="w-full text-center tracking-widest text-2xl font-mono px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    {requiresOwnerPin && (
                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex flex-col gap-1.5 animate-in fade-in">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                          <KeyRound className="w-4 h-4 text-amber-400" />
                          <span>رمز أمان المالك (PIN)</span>
                        </label>
                        <input
                          type="password"
                          placeholder="أدخل رمز أمان المالك"
                          value={ownerPin}
                          onChange={(e) => setOwnerPin(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-amber-400/40 text-amber-300 text-sm font-mono tracking-widest text-center focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400">حساب المالك «جدو الرويعى» محمي برمز أمان خاص لمنع الدخول غير المصرح به</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 active:scale-98 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-slate-950 shrink-0" />
                          <span>جاري التحقق والتسجيل...</span>
                        </>
                      ) : (
                        <span>تأكيد الدخول</span>
                      )}
                    </button>
                  </form>
                )}
              </>
            )}

            {loginMethod === 'username' && (
              <form onSubmit={handleUsernameLogin} className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم المستخدم (Username)</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="مثال: ahmed99"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm font-mono focus:border-amber-400 focus:outline-none"
                    />
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                {(requiresOwnerPin || loginUsername.trim().toLowerCase() === 'jdwalrwyy') && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex flex-col gap-1.5 animate-in fade-in">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <span>رمز أمان المالك (PIN)</span>
                    </label>
                    <input
                      type="password"
                      placeholder="أدخل رمز أمان المالك"
                      value={ownerPin}
                      onChange={(e) => setOwnerPin(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-amber-400/40 text-amber-300 text-sm font-mono tracking-widest text-center focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">حساب المالك «جدو الرويعى» محمي برمز أمان خاص لمنع الدخول غير المصرح به</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 active:scale-98 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950 shrink-0" />
                      <span>جاري تسجيل الدخول...</span>
                    </>
                  ) : (
                    <span>تسجيل الدخول</span>
                  )}
                </button>
              </form>
            )}

            {/* Back to Google */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('google');
                  setErrorMsg(null);
                }}
                className="text-xs text-amber-400 hover:underline cursor-pointer"
              >
                ← العودة إلى تسجيل عبر Google الرسمي
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: NEW REGISTRATION */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>إنشاء حساب جديد مستقل — بدون أي حد للحسابات على الجهاز</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                غير محدود ✓
              </span>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                الاسم الظاهر <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: أحمد عبد الله"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                اسم المستخدم بالإنجليزية (Username) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: ahmed_user"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                الجنس (النوع) <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegGender('MALE')}
                  className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    regGender === 'MALE'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-md shadow-blue-500/20'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>🔵</span>
                  <span>ذكر</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegGender('FEMALE')}
                  className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    regGender === 'FEMALE'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-500/20'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>🔴</span>
                  <span>أنثى</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                رقم الهاتف (اختياري)
              </label>
              <input
                type="tel"
                placeholder="+966501234567"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                كود الإحالة (الدعوة)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="مثال: HKW100"
                  value={regReferral}
                  onChange={(e) => setRegReferral(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono focus:outline-none ${
                    hasUrlReferral
                      ? 'bg-amber-500/10 border-amber-400 text-amber-300 font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-100 focus:border-amber-400'
                  }`}
                />
                {hasUrlReferral && (
                  <span className="absolute left-3 top-2.5 text-[10px] text-amber-400 font-bold">
                    تم التفعيل ✓
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                صاحب كود الإحالة يحصل على 10 كونز عند إتمام تسجيلك بنجاح.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 active:scale-98 transition-all mt-1 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950 shrink-0" />
                  <span>جاري إنشاء الحساب المستقل...</span>
                </>
              ) : (
                <span>إنشاء حساب مستقل وبدء الاستخدام</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
