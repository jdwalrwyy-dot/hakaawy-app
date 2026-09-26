import React, { useState, useEffect } from 'react';
import { User, AgentApplication } from '../types';
import { API } from '../services/api';
import { UserRoleBadges } from './RoleBadge';
import { Briefcase, Building, CheckCircle2, Clock, AlertCircle, X, Shield, Phone, Globe, Users } from 'lucide-react';

interface AgentApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSuccess?: () => void;
}

export const AgentApplicationModal: React.FC<AgentApplicationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess
}) => {
  const [existingApp, setExistingApp] = useState<AgentApplication | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [agencyName, setAgencyName] = useState<string>('');
  const [phone, setPhone] = useState<string>(currentUser.phone || '');
  const [country, setCountry] = useState<string>('المملكة العربية السعودية');
  const [expectedHostsCount, setExpectedHostsCount] = useState<number>(10);
  const [experienceBio, setExperienceBio] = useState<string>('');

  useEffect(() => {
    if (isOpen && currentUser) {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      API.getAgentApplication(currentUser.id)
        .then(app => {
          setExistingApp(app);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!agencyName.trim() || agencyName.length < 3) {
      setErrorMsg('يرجى إدخال اسم وكالة صالح (3 أحرف على الأقل)');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('يرجى إدخال رقم الهاتف للتواصل');
      return;
    }
    if (!experienceBio.trim() || experienceBio.length < 15) {
      setErrorMsg('يرجى كتابة نبذة كافية عن خبرة الوكالة وخطة إدارتها للمضيفين');
      return;
    }

    setSubmitting(true);
    try {
      const res = await API.applyAsAgent({
        userId: currentUser.id,
        agencyName: agencyName.trim(),
        phone: phone.trim(),
        country,
        expectedHostsCount: Number(expectedHostsCount) || 5,
        experienceBio: experienceBio.trim()
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
      <div className="relative w-full max-w-lg bg-slate-900 border border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden my-8 text-right font-sans">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600/30 via-slate-800 to-slate-900 p-5 border-b border-slate-700/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 justify-end">
                <span>طلب تأسيس وكالة معتمدة</span>
                <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                  <Briefcase size={18} />
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">كن وكيلاً رسمياً في حكاوي وابنِ فريقك من المضيفين مع أرباح مجزية</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>جاري التحقق من حالة الوكالة والطلبات...</span>
            </div>
          ) : (currentUser.role === 'AGENT' || (currentUser as any).isAgent || (currentUser as any).isAgencyOwner || existingApp?.status === 'APPROVED') ? (
            /* Approved Agent View - Cannot send another application */
            <div className="bg-slate-800/80 border border-emerald-500/40 rounded-xl p-5 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20">
                ⭐
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <UserRoleBadges user={currentUser} size="sm" />
                  <h3 className="text-lg font-bold text-emerald-300">أنت وكيل معتمد بالفعل ✅</h3>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  تم اعتمادك كوكيل رسمي في المنصة بنجاح. لا يمكنك تقديم طلب وكالة آخر طالما أصبحت وكيلًا معتمدًا.
                </p>
              </div>

              {existingApp && (
                <div className="bg-slate-900/90 rounded-lg p-3 text-xs text-slate-300 space-y-1.5 text-right border border-slate-700/50">
                  <div className="flex justify-between">
                    <span className="text-emerald-400 font-bold">{existingApp.agencyName}</span>
                    <span className="text-slate-400">اسم الوكالة:</span>
                  </div>
                  {existingApp.agencyCode && (
                    <div className="flex justify-between font-mono">
                      <span className="text-amber-300 font-bold">{existingApp.agencyCode}</span>
                      <span className="text-slate-400">كود الوكالة:</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-emerald-300 font-bold">تم القبول ✅</span>
                    <span className="text-slate-400">حالة الطلب:</span>
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl text-sm transition"
              >
                إغلاق
              </button>
            </div>
          ) : existingApp && existingApp.status === 'PENDING' ? (
            /* Pending Status View */
            <div className="bg-slate-800/80 border border-amber-500/40 rounded-xl p-5 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Clock size={30} className="animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-bold inline-block mb-2">
                  جاري المراجعة ⏳
                </span>
                <h3 className="text-lg font-bold text-amber-300">طلب الوكالة قيد المراجعة الإدارية ⏳</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  تم استلام طلب تأسيس وكالتك [<strong>{existingApp.agencyName}</strong>] وهو الآن بحالة (جاري المراجعة). تقوم إدارة حكاوي بدراسة الطلب لاتخاذ القرار المناسب.
                </p>
              </div>

              <div className="bg-slate-900/90 rounded-lg p-3 text-xs text-slate-300 space-y-1.5 text-right border border-slate-700/50">
                <div className="flex justify-between">
                  <span className="text-blue-400 font-medium">{existingApp.agencyName}</span>
                  <span className="text-slate-400">اسم الوكالة:</span>
                </div>
                <div className="flex justify-between">
                  <span>{existingApp.expectedHostsCount} مضيفين</span>
                  <span className="text-slate-400">العدد المتوقع:</span>
                </div>
                <div className="flex justify-between">
                  <span>{new Date(existingApp.createdAt).toLocaleDateString('ar-SA')}</span>
                  <span className="text-slate-400">تاريخ الطلب:</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl text-sm transition"
              >
                إغلاق
              </button>
            </div>
          ) : (
            /* Application Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {existingApp && existingApp.status === 'REJECTED' && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs space-y-1 text-right">
                  <div className="flex items-center gap-1.5 text-rose-300 font-bold">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>تم رفض طلبك السابق لتأسيس الوكالة (تم الرفض ❌)</span>
                  </div>
                  {existingApp.rejectionReason && (
                    <p className="text-slate-300 text-[11px] pr-5">
                      السبب: {existingApp.rejectionReason}
                    </p>
                  )}
                  <p className="text-emerald-400 text-[11px] pr-5 font-semibold mt-1">
                    يمكنك الآن كتابة وتنسيق بيانات طلبك الجديد وإرساله للإدارة مجدداً.
                  </p>
                </div>
              )}

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
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3.5 flex items-start gap-3">
                <Shield size={20} className="text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-200/90 leading-relaxed">
                  <strong>مزايا الوكيل المعتمد:</strong> لوحة تحكم متطورة لإدارة المضيفين، كود دعوة خاص بوكالتك، عمولات ونسب أرباح شهرية من تارجت المضيفين، ودعم إداري مخصص.
                </div>
              </div>

              {/* Agency Name */}
              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium">اسم الوكالة المقترح *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={agencyName}
                    onChange={e => setAgencyName(e.target.value)}
                    placeholder="مثال: وكالة فرسان حكاوي"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition text-right"
                    required
                  />
                  <Building size={16} className="absolute left-3 top-2.5 text-slate-500" />
                </div>
              </div>

              {/* Phone & Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">رقم الهاتف (واتساب للإدارة) *</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+966 5X XXX XXXX"
                      dir="ltr"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition text-right"
                      required
                    />
                    <Phone size={16} className="absolute left-3 top-2.5 text-slate-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">دولة المقر *</label>
                  <div className="relative">
                    <select
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition"
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
                      <option value="أخرى">دولة أخرى 🌍</option>
                    </select>
                    <Globe size={16} className="absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Expected Hosts Count */}
              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium">عدد المضيفين المتوقع استقطابهم شهرياً *</label>
                <div className="relative">
                  <select
                    value={expectedHostsCount}
                    onChange={e => setExpectedHostsCount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value={5}>5 إلى 10 مضيفين</option>
                    <option value={15}>15 إلى 30 مضيف</option>
                    <option value={50}>50 مضيف فأكثر (وكالة كبرى)</option>
                  </select>
                  <Users size={16} className="absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Experience Bio */}
              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium">خبرة الوكالة وخطة العمل *</label>
                <textarea
                  value={experienceBio}
                  onChange={e => setExperienceBio(e.target.value)}
                  rows={3}
                  placeholder="حدثنا عن خبرتك في إدارة الوكالات واستقطاب صناع المحتوى الصوتي وخطتك لتنشيط الغرف..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 transition resize-none"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>جاري إرسال الطلب...</span>
                    </>
                  ) : (
                    <>
                      <span>تقديم طلب تأسيس الوكالة</span>
                      <Briefcase size={16} />
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
