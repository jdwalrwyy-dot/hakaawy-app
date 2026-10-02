import React, { useState, useEffect } from 'react';
import { User, HostApplication, HostAgencyRequest, AgencyDispute } from '../types';
import { API } from '../services/api';
import {
  Mic,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Sparkles,
  Building,
  Globe,
  Phone,
  FileText,
  DoorOpen,
  Scale,
  Send,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'join_agency' | 'apply_host' | 'my_agency'>('join_agency');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Agency Join Request Form State
  const [agencyCode, setAgencyCode] = useState<string>('');
  const [phone, setPhone] = useState<string>(currentUser.phone || '');
  const [matchedAgencyName, setMatchedAgencyName] = useState<string | null>(null);

  // Existing Data State
  const [hostDashboardData, setHostDashboardData] = useState<any | null>(null);
  const [existingApp, setExistingApp] = useState<HostApplication | null>(null);

  // Dispute State
  const [showDisputeForm, setShowDisputeForm] = useState<boolean>(false);
  const [disputeReason, setDisputeReason] = useState<string>('');

  useEffect(() => {
    if (isOpen && currentUser) {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      Promise.all([
        API.getHostApplication(currentUser.id).catch(() => null),
        API.getHostDashboard(currentUser.id).catch(() => null)
      ]).then(([app, dashData]) => {
        setExistingApp(app);
        setHostDashboardData(dashData);
        if (dashData?.agency) {
          setActiveTab('my_agency');
        } else {
          setActiveTab('join_agency');
        }
        setLoading(false);
      });
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Real-time lookup for Agency by Code
  const checkInviteCode = async (code: string) => {
    if (!code.trim()) {
      setMatchedAgencyName(null);
      return;
    }
    try {
      const res = await API.getAgencyByCode(code.trim());
      if (res.agency && res.agency.agencyName) {
        setMatchedAgencyName(`وكالة معتمدة: ${res.agency.agencyName} (الوكيل: ${res.agency.ownerName || 'وكيل معتمد'})`);
      } else {
        setMatchedAgencyName(null);
      }
    } catch {
      setMatchedAgencyName(null);
    }
  };

  // Submit Host Agency Join Request
  const handleAgencyJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!agencyCode.trim()) {
      setErrorMsg('يرجى إدخال كود الوكالة الإلزامي (Agency ID)');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('يرجى إدخال رقم الهاتف / وسيلة التواصل الإلزامية');
      return;
    }

    setSubmitting(true);
    try {
      const res = await API.submitHostAgencyJoinRequest({
        userId: currentUser.id,
        agencyCode: agencyCode.trim(),
        phone: phone.trim()
      });

      if (res.success) {
        setSuccessMsg(res.message);
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إرسال طلب الانضمام للوكالة');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Dispute for Force Release
  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!disputeReason.trim() || disputeReason.trim().length < 10) {
      setErrorMsg('يرجى كتابة سبب النزاع وسبب طلب فك الارتباط الإجباري بشكل كافٍ (10 أحرف على الأقل)');
      return;
    }

    setSubmitting(true);
    try {
      const res = await API.submitAgencyDispute({
        hostUserId: currentUser.id,
        reason: disputeReason.trim()
      });

      if (res.success) {
        setSuccessMsg(res.message);
        setShowDisputeForm(false);
        setDisputeReason('');
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء رفع الشكوى للإدارة');
    } finally {
      setSubmitting(false);
    }
  };

  const agency = hostDashboardData?.agency;
  const hostProfile = hostDashboardData?.hostProfile;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden my-6 text-right">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-600/30 via-slate-800 to-slate-900 p-5 border-b border-slate-700/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 justify-end">
                <span>مركز المضيفين والوكالات 🎙️</span>
                <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
                  <Mic size={18} />
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">الانضمام لوكالة، متابعة تفاصيل المضيف، أو رفع نزاع إداري</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 gap-1 p-2 bg-slate-950 border-b border-slate-800/80">
          <button
            onClick={() => setActiveTab('join_agency')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'join_agency'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building size={15} />
            <span>الانضمام لوكالة 🎙️</span>
          </button>

          <button
            onClick={() => setActiveTab('my_agency')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'my_agency'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck size={15} />
            <span>وكالتي الحالية والنزاعات ⚖️</span>
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <span>جاري التحقق من بيانات المضيف والوكالة...</span>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* TAB 1: JOIN AGENCY FORM */}
              {activeTab === 'join_agency' && (
                <form onSubmit={handleAgencyJoinSubmit} className="space-y-4">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <Sparkles size={20} className="text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-200/90 leading-relaxed">
                      <strong>الانضمام المباشر لوكالة:</strong> أدخل كود الوكالة (Agency ID) ورقم هاتفك. سيتم إرسال الطلب آلياً وبشكل مباشر إلى لوحة تحكم الوكيل للموافقة دون أي إبطاء.
                    </div>
                  </div>

                  {/* Agency Code Input */}
                  <div>
                    <label className="block text-xs text-slate-300 mb-1.5 font-bold">
                      كود الوكالة (Agency ID) *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={agencyCode}
                        onChange={e => {
                          setAgencyCode(e.target.value);
                          checkInviteCode(e.target.value);
                        }}
                        onBlur={() => checkInviteCode(agencyCode)}
                        placeholder="أدخل كود الوكالة مثل: AG-1001"
                        dir="ltr"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition uppercase font-mono text-right"
                        required
                      />
                      <Building size={16} className="absolute left-3 top-3 text-slate-500" />
                    </div>
                    {matchedAgencyName && (
                      <p className="text-xs text-emerald-400 flex items-center gap-1 font-bold mt-1.5">
                        <CheckCircle2 size={14} />
                        <span>{matchedAgencyName}</span>
                      </p>
                    )}
                  </div>

                  {/* Phone Input */}
                  <div>
                    <label className="block text-xs text-slate-300 mb-1.5 font-bold">
                      رقم الهاتف / وسيلة التواصل *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+966 5X XXX XXXX"
                        dir="ltr"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition text-right font-mono"
                        required
                      />
                      <Phone size={16} className="absolute left-3 top-3 text-slate-500" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-sm transition shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>جاري إرسال الطلب...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>إرسال طلب الانضمام للوكالة 🚀</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* TAB 2: MY AGENCY & DISPUTE SECTION */}
              {activeTab === 'my_agency' && (
                <div className="space-y-4">
                  {agency ? (
                    <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 text-[10px] rounded-full font-black">
                          وكالة معتمدة 🌟
                        </span>
                        <div className="flex items-center gap-2 text-right">
                          <div>
                            <h3 className="text-sm font-black text-white">{agency.agencyName}</h3>
                            <span className="text-[11px] text-slate-400 font-mono">كود الوكالة: {agency.agencyCode}</span>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                            <Building size={20} />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">صاحب الوكالة:</span>
                          <span className="font-bold text-white">{agency.ownerName}</span>
                        </div>
                        <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">كود المضيف الخاص بك:</span>
                          <span className="font-bold text-amber-400 font-mono">{hostProfile?.hostCode || 'HOST-ACTIVE'}</span>
                        </div>
                      </div>

                      {/* Dispute & Force Release Options */}
                      <div className="pt-2 border-t border-slate-800">
                        {!showDisputeForm ? (
                          <button
                            onClick={() => setShowDisputeForm(true)}
                            className="w-full py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <DoorOpen size={16} />
                            <span>طلب مغادرة الوكالة / رفع نزاع للإدارة ⚖️</span>
                          </button>
                        ) : (
                          <form onSubmit={handleDisputeSubmit} className="space-y-3 bg-slate-900 p-3.5 rounded-xl border border-rose-500/40">
                            <div className="flex items-center justify-between text-xs font-bold text-rose-300">
                              <button
                                type="button"
                                onClick={() => setShowDisputeForm(false)}
                                className="text-slate-400 hover:text-white"
                              >
                                إلغاء
                              </button>
                              <span className="flex items-center gap-1">
                                <Scale size={15} /> رفع نزاع إجباري للمالك
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              في حال عدم موافقة الوكيل أو المماطلة، سيتم تحويل هذا النزاع فوراً وبشكل حصري لـ <strong>لوحة تحكم المالك (Super Admin)</strong> لفك ارتباطك إجبارياً بضغطة زر.
                            </p>

                            <textarea
                              value={disputeReason}
                              onChange={e => setDisputeReason(e.target.value)}
                              rows={3}
                              placeholder="اكتب سبب النزاع وسبب طلب فك الارتباط الإجباري بالتفصيل..."
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 transition resize-none"
                              required
                            />

                            <button
                              type="submit"
                              disabled={submitting}
                              className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 text-white font-black rounded-xl text-xs transition shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer"
                            >
                              {submitting ? (
                                <span>جاري رفع النزاع للمالك...</span>
                              ) : (
                                <>
                                  <Scale size={15} />
                                  <span>إحالة الشكوى للمالك / فك ارتباط إجباري ⚖️</span>
                                </>
                              )}
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 space-y-3 bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
                      <Building size={36} className="mx-auto text-amber-400 opacity-60" />
                      <h4 className="text-sm font-bold text-white">أنت غير منضم لأي وكالة حالياً</h4>
                      <p className="text-xs text-slate-400">
                        يمكنك استخدام تبويب "الانضمام لوكالة" لإدخال كود وكالتك والانضمام المباشر.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
