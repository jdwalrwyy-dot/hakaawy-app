import React, { useState, useEffect } from 'react';
import { User, HostApplication } from '../types';
import { API } from '../services/api';
import { Mic, CheckCircle2, Clock, AlertCircle, X, Sparkles, Building, Globe, Phone, FileText } from 'lucide-react';

interface HostApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSuccess?: () => void;
}

export const HostApplicationModal: React.FC<HostApplicationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess
}) => {
  const [existingApp, setExistingApp] = useState<HostApplication | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [phone, setPhone] = useState<string>(currentUser.phone || '');
  const [country, setCountry] = useState<string>('المملكة العربية السعودية');
  const [specialTalent, setSpecialTalent] = useState<string>('سوالف وترفيه');
  const [experienceBio, setExperienceBio] = useState<string>('');
  const [sampleLink, setSampleLink] = useState<string>('');
  const [agentInviteCode, setAgentInviteCode] = useState<string>('');
  const [matchedAgencyName, setMatchedAgencyName] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      API.getHostApplication(currentUser.id)
        .then(app => {
          setExistingApp(app);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [isOpen, currentUser]);

  // Check agent invite code on blur / change
  const checkInviteCode = async (code: string) => {
    if (!code.trim()) {
      setMatchedAgencyName(null);
      return;
    }
    try {
      const res = await API.getAgencyByCode(code.trim());
      if (res.agency && res.agency.agencyName) {
        setMatchedAgencyName(`وكالة معتمدة: ${res.agency.agencyName} (${res.agency.ownerName || 'وكيل'})`);
      } else {
        setMatchedAgencyName(null);
      }
    } catch {
      setMatchedAgencyName(null);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!phone.trim()) {
      setErrorMsg('يرجى إدخال رقم الهاتف للتواصل');
      return;
    }
    if (!experienceBio.trim() || experienceBio.length < 15) {
      setErrorMsg('يرجى كتابة نبذة كافية عن خبرتك وأسلوبك في البث (15 حرف على الأقل)');
      return;
    }

    setSubmitting(true);
    try {
      const res = await API.applyAsHost({
        userId: currentUser.id,
        phone,
        country,
        specialTalent,
        experienceBio,
        sampleLink: sampleLink.trim() || undefined,
        agentInviteCode: agentInviteCode.trim() || undefined
      });

      if (res.success) {
        setSuccessMsg(res.message);
        if (res.application) {
          setExistingApp(res.application);
        }
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إرسال الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden my-8 text-right font-sans">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-600/30 via-slate-800 to-slate-900 p-5 border-b border-slate-700/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 justify-end">
                <span>التسجيل كمضيف معتمد</span>
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <Mic size={18} />
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">انضم لنجوم البث الصوتي في حكاوي وابدأ جني الأرباح والتارجت</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <span>جاري التحقق من حالة الحساب والطلبات...</span>
            </div>
          ) : existingApp && existingApp.status === 'PENDING' ? (
            /* Pending Status View */
            <div className="bg-slate-800/80 border border-amber-500/40 rounded-xl p-5 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Clock size={30} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-300">طلبك قيد المراجعة الإدارية ⏳</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  تم استلام طلب انضمامك كمضيف رسمي بنجاح، ويقوم فريق الإدارة بمراجعته حالياً. سيصلك إشعار فوري عند اعتماد الحساب وتوليد كود المضيف الخاص بك.
                </p>
              </div>

              <div className="bg-slate-900/90 rounded-lg p-3 text-xs text-slate-300 space-y-1.5 text-right border border-slate-700/50">
                <div className="flex justify-between">
                  <span className="text-amber-400 font-medium">{existingApp.id}</span>
                  <span className="text-slate-400">رقم الطلب:</span>
                </div>
                <div className="flex justify-between">
                  <span>{existingApp.specialTalent}</span>
                  <span className="text-slate-400">الموهبة:</span>
                </div>
                {existingApp.agencyName && (
                  <div className="flex justify-between">
                    <span className="text-emerald-400 font-medium">{existingApp.agencyName} ({existingApp.agencyCode})</span>
                    <span className="text-slate-400">الوكالة التابعة:</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{new Date(existingApp.createdAt).toLocaleDateString('ar-SA')}</span>
                  <span className="text-slate-400">تاريخ التقديم:</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl text-sm transition"
              >
                حسناً، فهمت
              </button>
            </div>
          ) : (
            /* Application Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Info banner */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-start gap-3">
                <Sparkles size={20} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200/90 leading-relaxed">
                  <strong>مزايا المضيف المعتمد:</strong> كود مضيف فريد، إمكانية ربط الحساب بوكالة، الدخول في نظام التارجت الشهري، وتحويل الماسات إلى مكافآت وأرباح مالية.
                </div>
              </div>

              {/* Phone & Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">رقم الهاتف (واتساب للتواصل) *</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+966 5X XXX XXXX"
                      dir="ltr"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition text-right"
                      required
                    />
                    <Phone size={16} className="absolute left-3 top-2.5 text-slate-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">دولة الإقامة *</label>
                  <div className="relative">
                    <select
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                    >
                      <option value="المملكة العربية السعودية">المملكة العربية السعودية 🇸🇦</option>
                      <option value="الإمارات العربية المتحدة">الإمارات العربية المتحدة 🇦🇪</option>
                      <option value="الكويت">الكويت 🇰🇼</option>
                      <option value="قطر">قطر 🇶🇦</option>
                      <option value="البحرين">البحرين 🇧🇭</option>
                      <option value="عمان">عمان 🇴🇲</option>
                      <option value="مصر">مصر 🇪🇬</option>
                      <option value="الأردن">الأردن 🇯🇴</option>
                      <option value="العراق">العراق 🇮🇶</option>
                      <option value="دولة أخرى">دولة أخرى 🌍</option>
                    </select>
                    <Globe size={16} className="absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Special Talent / Category */}
              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium">المحتوى الصوتي والموهبة *</label>
                <select
                  value={specialTalent}
                  onChange={e => setSpecialTalent(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                >
                  <option value="سوالف وترفيه ومسابقات">سوالف وترفيه ومسابقات 🎙️</option>
                  <option value="شعر وأمسيات أدبية وطرب">شعر وأمسيات أدبية وطرب 🎻</option>
                  <option value="ألعاب وتحديات صوتية">ألعاب وتحديات صوتية 🎮</option>
                  <option value="بودكاست وحوارات ملهمة">بودكاست وحوارات ملهمة 🎧</option>
                  <option value="تطوير ذات واستشارات عامة">تطوير ذات واستشارات عامة 💡</option>
                </select>
              </div>

              {/* Experience Bio */}
              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium">نبذة عن خبرتك وأسلوبك في البث *</label>
                <textarea
                  value={experienceBio}
                  onChange={e => setExperienceBio(e.target.value)}
                  rows={3}
                  placeholder="حدثنا عن خبرتك السابقة في تطبيقات البث الصوتي أو الترفيه، وكم ساعة تستطيع البث يومياً..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 transition resize-none"
                  required
                />
              </div>

              {/* Agent Invite Code (Optional) */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-amber-300">
                  <Building size={16} />
                  <span>هل تمت دعوتك من وكالة معتمدة؟ (اختياري)</span>
                </div>
                <input
                  type="text"
                  value={agentInviteCode}
                  onChange={e => {
                    setAgentInviteCode(e.target.value);
                    checkInviteCode(e.target.value);
                  }}
                  onBlur={() => checkInviteCode(agentInviteCode)}
                  placeholder="أدخل كود الدعوة مثل: STAR2026 أو AG-1001"
                  dir="ltr"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition uppercase"
                />
                {matchedAgencyName && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 size={13} />
                    <span>{matchedAgencyName}</span>
                  </p>
                )}
                <p className="text-[11px] text-slate-400">
                  إذا لم يكن لديك وكيل، يمكنك ترك الحقل فارغاً وسيتم اعتمادك كمضيف مستقل أو تعيين وكالة مناسبة لك لاحقاً.
                </p>
              </div>

              {/* Sample link */}
              <div>
                <label className="block text-xs text-slate-300 mb-1">رابط نموذج بث أو حساب تواصل (اختياري)</label>
                <input
                  type="url"
                  value={sampleLink}
                  onChange={e => setSampleLink(e.target.value)}
                  placeholder="https://instagram.com/your_handle أو رابط تسجيل"
                  dir="ltr"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition text-right"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>جاري إرسال الطلب...</span>
                    </>
                  ) : (
                    <>
                      <span>تقديم طلب الانضمام كمضيف</span>
                      <Mic size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
