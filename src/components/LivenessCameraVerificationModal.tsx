import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { API } from '../services/api';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  ShieldCheck,
  RefreshCw,
  Video
} from 'lucide-react';

interface LivenessCameraVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  gender: 'male' | 'female';
  onUserUpdated: (user: User) => void;
}

type LivenessStep = 'FRONT' | 'RIGHT' | 'LEFT' | 'COMPLETED';

export const LivenessCameraVerificationModal: React.FC<LivenessCameraVerificationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  gender,
  onUserUpdated
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<LivenessStep>('FRONT');

  // Captured snapshots
  const [frontPhoto, setFrontPhoto] = useState<string | null>(null);
  const [rightPhoto, setRightPhoto] = useState<string | null>(null);
  const [leftPhoto, setLeftPhoto] = useState<string | null>(null);

  // Status & Progress
  const [isCapturing, setIsCapturing] = useState(false);
  const [stepSuccessAnimation, setStepSuccessAnimation] = useState<LivenessStep | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Start Front Camera Feed
  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      setCameraError(null);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(console.warn);
      }
    } catch (err: any) {
      console.error('Liveness camera access error:', err);
      setCameraError('لم نتمكن من الوصول للكاميرا الأمامية. يرجى السماح بتطبيق الكاميرا لإتمام التوثيق الحي.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentStep('FRONT');
      setFrontPhoto(null);
      setRightPhoto(null);
      setLeftPhoto(null);
      setErrorMessage(null);
      setStepSuccessAnimation(null);
      startCamera();
    } else {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        setStream(null);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isOpen]);

  // Capture frame helper
  const captureCurrentFrame = (): string | null => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Flip canvas horizontally to match mirrored preview
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // Perform Movement Step Capture
  const handlePerformMovementCapture = () => {
    if (isCapturing || submitting) return;
    setIsCapturing(true);

    setTimeout(() => {
      const snapshot = captureCurrentFrame();
      if (!snapshot) {
        setErrorMessage('تعذر التقاط الكاميرا، يرجى إعادة المحاولة.');
        setIsCapturing(false);
        return;
      }

      if (currentStep === 'FRONT') {
        setFrontPhoto(snapshot);
        setStepSuccessAnimation('FRONT');
        setTimeout(() => {
          setStepSuccessAnimation(null);
          setCurrentStep('RIGHT');
          setIsCapturing(false);
        }, 1200);
      } else if (currentStep === 'RIGHT') {
        setRightPhoto(snapshot);
        setStepSuccessAnimation('RIGHT');
        setTimeout(() => {
          setStepSuccessAnimation(null);
          setCurrentStep('LEFT');
          setIsCapturing(false);
        }, 1200);
      } else if (currentStep === 'LEFT') {
        setLeftPhoto(snapshot);
        setStepSuccessAnimation('LEFT');
        setTimeout(() => {
          setStepSuccessAnimation(null);
          setCurrentStep('COMPLETED');
          setIsCapturing(false);
          // Automatically trigger Instant Verification Submission
          submitLivenessVerification(frontPhoto || snapshot, rightPhoto || snapshot, snapshot);
        }, 1200);
      }
    }, 600);
  };

  // Submit Instant Liveness Verification
  const submitLivenessVerification = async (
    frontImg: string,
    rightImg: string,
    leftImg: string
  ) => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await API.submitInstantVerification({
        userId: currentUser.id,
        gender,
        verificationPhoto: frontImg,
        livenessFrontPhoto: frontImg,
        livenessRightPhoto: rightImg,
        livenessLeftPhoto: leftImg
      });

      if (res.success && res.user) {
        onUserUpdated(res.user);
        try {
          localStorage.setItem('currentUser', JSON.stringify(res.user));
          localStorage.setItem('hekawy_current_user', JSON.stringify(res.user));
        } catch {}

        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'فشلت معالجة التوثيق الحي');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200 dir-rtl font-sans select-none">
      <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Top Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
                <span>فحص الوجه الحي (Liveness Detection)</span>
                <span className="px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-extrabold border border-cyan-500/30">
                  فوري تلقائي
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">توثيق مباشر عبر الكاميرا مع منع الصور المرفوقة من المعرض</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Instruction Bar */}
        <div className="p-3 bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 border-b border-slate-800 text-center">
          {currentStep === 'FRONT' && (
            <div className="flex items-center justify-center gap-2 text-amber-300 font-extrabold text-xs animate-pulse">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span>الخطوة 1 من 3: انظر مباشرة إلى منتصف الكاميرا (Face Front)</span>
            </div>
          )}

          {currentStep === 'RIGHT' && (
            <div className="flex items-center justify-center gap-2 text-cyan-300 font-extrabold text-xs animate-pulse">
              <ArrowRight className="w-4 h-4 text-amber-400" />
              <span>الخطوة 2 من 3: أدِر وجهك ببطء نحو اليمين (Turn Face Right)</span>
            </div>
          )}

          {currentStep === 'LEFT' && (
            <div className="flex items-center justify-center gap-2 text-rose-300 font-extrabold text-xs animate-pulse">
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>الخطوة 3 من 3: أدِر وجهك ببطء نحو اليسار (Turn Face Left)</span>
            </div>
          )}

          {currentStep === 'COMPLETED' && (
            <div className="flex items-center justify-center gap-2 text-emerald-300 font-black text-xs animate-bounce">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>اكتمل الفحص الحي! جاري تفعيل التوثيق وشارة المصداقية فوراً...</span>
            </div>
          )}
        </div>

        {/* Camera Live Viewfinder inside Oval Frame */}
        <div className="relative p-6 bg-slate-950 flex flex-col items-center justify-center">
          <canvas ref={canvasRef} className="hidden" />

          {/* Oval Face Frame Overlay */}
          <div className="relative w-64 h-72 rounded-[50%/60%] overflow-hidden border-4 border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.25)] bg-slate-900 flex items-center justify-center">
            {cameraError ? (
              <div className="p-4 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                <p className="text-xs font-bold text-rose-300">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-extrabold"
                >
                  إعادة تشغيل الكاميرا 🔄
                </button>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            )}

            {/* Target Face Guide Overlay Lines */}
            {!cameraError && currentStep !== 'COMPLETED' && (
              <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-cyan-400/50 rounded-[50%/60%] animate-pulse flex items-center justify-center">
                <div className="w-32 h-44 border border-amber-400/30 rounded-full" />
              </div>
            )}

            {/* Step Green Checkmark Animation Overlay */}
            {stepSuccessAnimation && (
              <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 animate-in zoom-in-50 duration-200">
                <div className="p-3 rounded-full bg-emerald-500 text-slate-950 shadow-2xl animate-bounce">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <span className="font-black text-sm text-emerald-200">تم التقاط الحركة بنجاح! ✅</span>
              </div>
            )}

            {/* Completed Final Celebration Overlay */}
            {currentStep === 'COMPLETED' && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center space-y-3 animate-in zoom-in-75 duration-300">
                <div className="p-4 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-2xl animate-bounce">
                  <ShieldCheck className="w-12 h-12" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-base text-slate-100">مبروك! تم تفعيل التوثيق فوراً 🎉</h4>
                  <p className="text-xs text-amber-300 font-bold">
                    تمت إضافة شارة المصداقية ({gender === 'female' ? 'أنثى ♀️' : 'ذكر ♂️'}) إلى حسابك
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Steps Progress Pills */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold border transition-all ${
              frontPhoto
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : currentStep === 'FRONT'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 ring-2 ring-amber-400'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}>
              {frontPhoto ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : '1'}
              <span>الوسط 🎯</span>
            </div>

            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold border transition-all ${
              rightPhoto
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : currentStep === 'RIGHT'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 ring-2 ring-amber-400'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}>
              {rightPhoto ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : '2'}
              <span>اليمين ➡️</span>
            </div>

            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold border transition-all ${
              leftPhoto
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : currentStep === 'LEFT'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 ring-2 ring-amber-400'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}>
              {leftPhoto ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : '3'}
              <span>اليسار ⬅️</span>
            </div>
          </div>
        </div>

        {/* Action Controls Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-2">
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold text-center">
              {errorMessage}
            </div>
          )}

          {currentStep !== 'COMPLETED' && (
            <button
              onClick={handlePerformMovementCapture}
              disabled={isCapturing || Boolean(cameraError)}
              className={`w-full py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer ${
                isCapturing || Boolean(cameraError)
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 text-slate-950 shadow-amber-500/20 active:scale-95'
              }`}
            >
              {isCapturing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>جاري التقاط الحركة والمطابقة...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>
                    {currentStep === 'FRONT' && 'تثبيت النظر في المنتصف والتقاط ✅'}
                    {currentStep === 'RIGHT' && 'توجيه الوجه نحو اليمين والتقاط ✅'}
                    {currentStep === 'LEFT' && 'توجيه الوجه نحو اليسار والتقاط ✅'}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
