import React, { useState } from 'react';
import { User } from '../types';
import { UserVerifiedBadge } from './RoleBadge';
import { LivenessCameraVerificationModal } from './LivenessCameraVerificationModal';
import { ShieldCheck, Camera, CheckCircle2, Lock, Sparkles, Video } from 'lucide-react';

interface UserVerificationSectionProps {
  currentUser: User;
  onUserUpdated: (user: User) => void;
}

export const UserVerificationSection: React.FC<UserVerificationSectionProps> = ({
  currentUser,
  onUserUpdated
}) => {
  const [isLivenessModalOpen, setIsLivenessModalOpen] = useState(false);
  const [gender, setGender] = useState<'male' | 'female'>(
    (currentUser.verifiedGender || currentUser.gender || 'male').toLowerCase() === 'female' ? 'female' : 'male'
  );

  const isVerified = Boolean(currentUser.isVerified);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3 dir-rtl text-right font-sans">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`p-2.5 rounded-2xl border ${
            isVerified
              ? gender === 'female'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-100">توثيق الكاميرا الحية (Liveness Verification)</h3>
              <UserVerifiedBadge user={currentUser} size="sm" showTextLabel />
            </div>
            <p className="text-[11px] text-slate-400">
              {isVerified
                ? 'حسابك موثق بالفحص الحي مع شارة المصداقية الفورية'
                : 'فحص فوري بالكاميرا الأمامية مع منع خيار الصور الجاهزة من المعرض'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsLivenessModalOpen(true)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
            isVerified
              ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
              : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black border-amber-400 shadow-lg shadow-amber-500/20 active:scale-95'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>{isVerified ? 'تحديث الفحص الحي' : 'بدء فحص الكاميرا الحية ✨'}</span>
        </button>
      </div>

      {/* Select Gender Row if not verified */}
      {!isVerified && (
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <label className="text-xs font-bold text-slate-300 block">اختر الجنس قبل بدء فحص الكاميرا:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setGender('male')}
              className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-black transition-all cursor-pointer ${
                gender === 'male'
                  ? 'bg-blue-500/20 border-blue-500 text-blue-300 ring-1 ring-blue-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <span>♂️</span>
              <span>ذكر (Blue Badge ♂️)</span>
            </button>

            <button
              type="button"
              onClick={() => setGender('female')}
              className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-black transition-all cursor-pointer ${
                gender === 'female'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-1 ring-rose-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <span>♀️</span>
              <span>أنثى (Pink Badge ♀️)</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Verification Status Banner if verified */}
      {isVerified && (
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${gender === 'female' ? 'text-rose-400' : 'text-blue-400'}`} />
              <span className="font-extrabold text-slate-200">
                مفعل بالفحص الحي للحركات الثلاث ({gender === 'female' ? 'أنثى ♀️' : 'ذكر ♂️'})
              </span>
            </div>

            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>الجنس مثبّت لمنع التلاعب</span>
            </span>
          </div>

          {/* Liveness Captured Movement Snapshots */}
          {(currentUser.livenessFrontPhoto || currentUser.verificationPhoto) && (
            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
              <div className="space-y-1">
                <div className="w-full aspect-square bg-slate-900 rounded-xl overflow-hidden border border-amber-500/40">
                  <img
                    src={currentUser.livenessFrontPhoto || currentUser.verificationPhoto}
                    alt="الوسط"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[9px] font-bold text-slate-400">1. النظر للمنتصف 🎯</span>
              </div>

              <div className="space-y-1">
                <div className="w-full aspect-square bg-slate-900 rounded-xl overflow-hidden border border-amber-500/40">
                  <img
                    src={currentUser.livenessRightPhoto || currentUser.verificationPhoto}
                    alt="اليمين"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[9px] font-bold text-slate-400">2. اليمين ➡️</span>
              </div>

              <div className="space-y-1">
                <div className="w-full aspect-square bg-slate-900 rounded-xl overflow-hidden border border-amber-500/40">
                  <img
                    src={currentUser.livenessLeftPhoto || currentUser.verificationPhoto}
                    alt="اليسار"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[9px] font-bold text-slate-400">3. اليسار ⬅️</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Liveness Camera Verification Modal */}
      <LivenessCameraVerificationModal
        isOpen={isLivenessModalOpen}
        onClose={() => setIsLivenessModalOpen(false)}
        currentUser={currentUser}
        gender={gender}
        onUserUpdated={onUserUpdated}
      />
    </div>
  );
};

