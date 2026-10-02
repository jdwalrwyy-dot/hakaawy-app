import React, { useState, useEffect } from 'react';
import { User, VerifiedUserRecord } from '../types';
import { API } from '../services/api';
import { UserVerifiedBadge } from './RoleBadge';
import {
  ShieldCheck,
  Search,
  XCircle,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Eye,
  User as UserIcon,
  Calendar,
  X,
  Sparkles,
  Camera
} from 'lucide-react';

interface AdminVerifiedUsersManagementProps {
  currentUser: User;
}

export const AdminVerifiedUsersManagement: React.FC<AdminVerifiedUsersManagementProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<VerifiedUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'REVOKED'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [banModalReq, setBanModalReq] = useState<VerifiedUserRecord | null>(null);
  const [banReasonInput, setBanReasonInput] = useState('انتحال شخصية أو رفع صورة غير مطابقة للتوثيق');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await API.getAdminVerifiedUsersLog(currentUser.id);
      setLogs(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل جلب سجل الموثقين الجدد');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [currentUser.id]);

  const handleRevoke = async (record: VerifiedUserRecord) => {
    if (!confirm(`هل أنت متأكد من سحب التوثيق وإلغاء شارة المصداقية من المستخدم [${record.userName}]؟`)) {
      return;
    }

    setActionLoadingId(record.id);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await API.revokeVerification({
        adminId: currentUser.id,
        targetUserId: record.userId
      });

      if (res.success) {
        setSuccessMsg(res.message);
        await loadLogs();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل سحب التوثيق');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banModalReq) return;

    setActionLoadingId(banModalReq.id);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await API.banVerifiedUser({
        adminId: currentUser.id,
        targetUserId: banModalReq.userId,
        banReason: banReasonInput.trim()
      });

      if (res.success) {
        setSuccessMsg(res.message);
        setBanModalReq(null);
        await loadLogs();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل حظر الحساب');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredLogs = logs.filter(r => {
    if (filterStatus === 'ACTIVE' && !r.isVerified) return false;
    if (filterStatus === 'REVOKED' && r.isVerified) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        r.userName.toLowerCase().includes(q) ||
        (r.userNumericId && r.userNumericId.includes(q)) ||
        r.userId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCount = logs.filter(r => r.isVerified).length;

  return (
    <div className="space-y-4 text-right dir-rtl font-sans">
      {/* Header Banner */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              <span>سجل الموثقين الجدد والمراجعة الإدارية</span>
              {activeCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500 text-slate-950 font-black text-xs">
                  {activeCount} حساب موثق
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">مراجعة صور التحقق ومطابقتها مع التحكم المباشر بسحب التوثيق أو الحظر</p>
          </div>
        </div>

        <button
          onClick={loadLogs}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
        >
          تحديث السجل 🔄
        </button>
      </div>

      {/* Messages Alerts */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filters & Search Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5">
          {[
            { id: 'ACTIVE' as const, label: `الموثقين النشطين (${activeCount})` },
            { id: 'REVOKED' as const, label: `المسحوب توثيقهم (${logs.filter(r => !r.isVerified).length})` },
            { id: 'ALL' as const, label: `الكل (${logs.length})` }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === f.id
                  ? f.id === 'ACTIVE'
                    ? 'bg-blue-500 text-slate-950 font-black shadow-md'
                    : 'bg-purple-600 text-white font-extrabold shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px] flex-1 sm:flex-initial">
          <input
            type="text"
            placeholder="بحث بالمستخدم، الـ ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-400 rounded-xl px-3 py-1.5 pr-8 text-xs text-slate-200 focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
        </div>
      </div>

      {/* Verified Users Cards Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs font-bold">جاري تحميل سجل الموثقين الجدد...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
          <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-xs font-bold text-slate-400">لا يوجد موثقون في هذه القائمة حالياً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredLogs.map(record => {
            const isLoadingThis = actionLoadingId === record.id;
            const isFemale = String(record.gender).toLowerCase() === 'female';

            return (
              <div
                key={record.id}
                className={`bg-slate-900/90 border rounded-2xl p-4 space-y-3 shadow-xl transition-all ${
                  record.isVerified
                    ? isFemale
                      ? 'border-rose-500/40 shadow-rose-500/5'
                      : 'border-blue-500/40 shadow-blue-500/5'
                    : 'border-slate-800 opacity-75'
                }`}
              >
                {/* Header: User Avatar + Name + Gender Badge */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-3">
                    <img
                      src={record.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${record.userId}`}
                      alt={record.userName}
                      className={`w-11 h-11 rounded-full object-cover border-2 shrink-0 ${
                        isFemale ? 'border-rose-400' : 'border-blue-400'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-100">{record.userName}</span>
                        <UserVerifiedBadge
                          user={{ isVerified: record.isVerified, verifiedGender: record.gender }}
                          size="sm"
                          showTextLabel
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ID: {record.userNumericId || record.userId} | تاريخ التوثيق: {new Date(record.verifiedAt).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    record.isVerified
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {record.isVerified ? 'موثق نشط ✅' : 'مسحوب ⚠️'}
                  </span>
                </div>

                {/* Verification Liveness Face Movement Snapshots (Front, Right, Left) */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                    <span className="flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-cyan-400" />
                      <span>لقطات الفحص الحي بالكاميرا (3 Movements Liveness)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">انقر للرؤية بحجم مكبر</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* 1. Front */}
                    <div className="space-y-1 text-center">
                      <div
                        onClick={() => setPreviewPhoto({ url: record.livenessFrontPhoto || record.verificationPhoto, title: `1. لقطة النظر للمنتصف - ${record.userName}` })}
                        className="relative group w-full aspect-square bg-slate-900 rounded-xl overflow-hidden border border-amber-500/50 cursor-pointer"
                      >
                        <img
                          src={record.livenessFrontPhoto || record.verificationPhoto}
                          alt="الوسط"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-amber-300">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-slate-300">1. الوسط 🎯</span>
                    </div>

                    {/* 2. Right */}
                    <div className="space-y-1 text-center">
                      <div
                        onClick={() => setPreviewPhoto({ url: record.livenessRightPhoto || record.verificationPhoto, title: `2. لقطة توجيه الوجه لليمين - ${record.userName}` })}
                        className="relative group w-full aspect-square bg-slate-900 rounded-xl overflow-hidden border border-amber-500/50 cursor-pointer"
                      >
                        <img
                          src={record.livenessRightPhoto || record.verificationPhoto}
                          alt="اليمين"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-amber-300">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-slate-300">2. اليمين ➡️</span>
                    </div>

                    {/* 3. Left */}
                    <div className="space-y-1 text-center">
                      <div
                        onClick={() => setPreviewPhoto({ url: record.livenessLeftPhoto || record.verificationPhoto, title: `3. لقطة توجيه الوجه لليسار - ${record.userName}` })}
                        className="relative group w-full aspect-square bg-slate-900 rounded-xl overflow-hidden border border-amber-500/50 cursor-pointer"
                      >
                        <img
                          src={record.livenessLeftPhoto || record.verificationPhoto}
                          alt="اليسار"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-amber-300">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-slate-300">3. اليسار ⬅️</span>
                    </div>
                  </div>
                </div>

                {/* ADMIN CONTROL BUTTONS */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
                  {record.isVerified && (
                    <button
                      onClick={() => handleRevoke(record)}
                      disabled={isLoadingThis}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      title="سحب التوثيق الفوري وإلغاء الشارة"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>[سحب التوثيق ⚠️]</span>
                    </button>
                  )}

                  <button
                    onClick={() => setBanModalReq(record)}
                    disabled={isLoadingThis}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1"
                    title="حظر الحساب نهائياً وطرده"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>[حظر الحساب 🚫]</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PHOTO PREVIEW MODAL */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative max-w-lg w-full bg-slate-900 border border-amber-500/50 rounded-3xl p-4 space-y-3 text-right dir-rtl shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-extrabold text-sm text-slate-100">{previewPhoto.title}</h3>
              <button onClick={() => setPreviewPhoto(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <img
                src={previewPhoto.url}
                alt="صورة مكبرة"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* BAN CONFIRMATION MODAL */}
      {banModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/50 rounded-3xl p-5 space-y-4 shadow-2xl text-right dir-rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-extrabold text-sm text-rose-300">حظر الحساب وسحب التوثيق</h3>
              <button onClick={() => setBanModalReq(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              سيتم حظر المستخدم <strong className="text-amber-300">{banModalReq.userName}</strong> وسحب توثيقه وطرده نهائياً من الغرف والتطبيق.
            </p>

            <form onSubmit={handleConfirmBan} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">سبب الحظر:</label>
                <textarea
                  value={banReasonInput}
                  onChange={(e) => setBanReasonInput(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-rose-400 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBanModalReq(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg"
                >
                  تأكيد الحظر والطرْد 🚫
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
