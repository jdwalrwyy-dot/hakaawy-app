import React, { useState } from 'react';
import { User } from '../types';
import { API } from '../services/api';
import {
  Shield,
  FileText,
  HelpCircle,
  AlertOctagon,
  X,
  CheckCircle2,
  Send,
  Mail,
  Lock,
  EyeOff,
  UserCheck,
  Smartphone
} from 'lucide-react';

export type LegalModalType = 'privacy' | 'terms' | 'guidelines' | 'support';

interface LegalSupportModalsProps {
  type: LegalModalType | null;
  onClose: () => void;
  currentUser?: User | null;
}

export const LegalSupportModals: React.FC<LegalSupportModalsProps> = ({
  type,
  onClose,
  currentUser
}) => {
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketEmail, setTicketEmail] = useState(currentUser?.email || '');
  const [ticketName, setTicketName] = useState(currentUser?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!type) return null;

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      setSubmitError('يرجى كتابة عنوان ورسالة واضحة لفريق الدعم');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await API.submitSupportTicket({
        userId: currentUser?.id,
        name: ticketName,
        email: ticketEmail,
        subject: ticketSubject,
        message: ticketMessage
      });
      setSubmitSuccess(res.message || 'تم إرسال تذكرتك بنجاح!');
      setTicketSubject('');
      setTicketMessage('');
    } catch (err: any) {
      setSubmitError(err.message || 'تعذر إرسال تذكرة الدعم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      dir="rtl"
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            {type === 'privacy' && (
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Lock className="w-5 h-5" />
              </div>
            )}
            {type === 'terms' && (
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <FileText className="w-5 h-5" />
              </div>
            )}
            {type === 'guidelines' && (
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertOctagon className="w-5 h-5" />
              </div>
            )}
            {type === 'support' && (
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <HelpCircle className="w-5 h-5" />
              </div>
            )}

            <div>
              <h2 className="font-extrabold text-base">
                {type === 'privacy' && 'سياسة الخصوصية وأمن البيانات'}
                {type === 'terms' && 'شروط وأحكام الاستخدام'}
                {type === 'guidelines' && 'قواعد المجتمع ومعايير الحشمة والآداب'}
                {type === 'support' && 'مركز الدعم الفني والمساعدة'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {type === 'privacy' && 'كيف نحمي معلوماتك وخصوصيتك في تطبيق حكاوي'}
                {type === 'terms' && 'القواعد المنظمة للحقوق والواجبات بين المستخدم والمنصة'}
                {type === 'guidelines' && 'معايير السلوك ومكافحة العري والمحتوى غير اللائق'}
                {type === 'support' && 'تواصل مع فريق إدارة ودعم تطبيق حكاوي الرسمي'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* VIEW 1: PRIVACY POLICY */}
        {type === 'privacy' && (
          <div className="flex flex-col gap-4 text-xs text-slate-300 leading-relaxed">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <p className="font-medium">
                تلتزم منصة <strong>«حكاوي»</strong> بأعلى معايير حماية الخصوصية والأمان الرقمي لجميع المستخدمين. لا نقوم ببيع بياناتك الشخصية أو مشاركتها مع أطراف ثالثة.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-100 text-sm mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-400" />
                <span>1. البيانات التي نجمعها</span>
              </h3>
              <p>
                نجمع فقط البيانات الضرورية لتشغيل الحساب: اسم المستخدم، الصورة الشخصية، معرف الحساب، وسجلات التفاعل داخل الغرف الصوتية وعمليات الهدايا. لا يتم تسجيل محادثاتك الخاصة أو الصوتيات إلا وفق إجراءات الأمان والرقابة الفورية المعتمدة.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-100 text-sm mb-1.5 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>2. أذونات الميكروفون والكاميرا</span>
              </h3>
              <p>
                يطلب التطبيق إذن الميكروفون فقط عند صعودك للمايك، وإذن الكاميرا فقط عند تفعيل البث المباشر بموافقتك الصريحة. لا تعمل الكاميرا أو الميكروفون في الخلفية مطلقاً عند إغلاق الغرفة أو الخروج منها.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-100 text-sm mb-1.5 flex items-center gap-1.5">
                <EyeOff className="w-4 h-4 text-emerald-400" />
                <span>3. حماية الشاشة والوسائط الحساسة</span>
              </h3>
              <p>
                يتضمن التطبيق تقنيات حماية من لقطات الشاشة (Screenshot Protection) والعلامة المائية الديناميكية لحماية خصوصية المشاركين والمتحدثين في الغرف الصوتية ومكافحة التسريب غير المصرح به.
              </p>
            </div>
          </div>
        )}

        {/* VIEW 2: TERMS OF SERVICE */}
        {type === 'terms' && (
          <div className="flex flex-col gap-4 text-xs text-slate-300 leading-relaxed">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
              <FileText className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="font-medium">
                باستخدامك لتطبيق «حكاوي»، فإنك توافق على الالتزام الكامل بهذه الشروط والقوانين المنظمة للغرف الصوتية والبث المباشر.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-100 text-sm mb-1">1. الحساب والأمان</h3>
              <p>
                يتحمل المستخدم المسؤولية الكاملة عن أمان حسابه ومعلوماته. يُمنع منعاً باتاً انتحال شخصيات الآخرين أو محاولة اختراق غرف أو أرصدة مستخدمين آخرين.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-100 text-sm mb-1">2. العملات والهدايا المالية</h3>
              <p>
                جميع عمليات شراء الكونز وشحن الماسات وإرسال الهدايا نهائية وتتم معالجتها آمنياً على الخوادم الرسمية. يُمنع التلاعب بالأرصدة أو استخدام برمجيات غير مصرح بها، ويؤدي أي تحايل إلى تجميد فوري للحساب.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-100 text-sm mb-1">3. صلاحيات إدارة المنصة</h3>
              <p>
                تحتفظ إدارة ومالك منصة حكاوي بالحق الحصري في إيقاف أي بث، إغلاق أي غرفة مخالفة، أو حظر أي حساب ينتهك الآداب العامة والسياسات بدون إشعار مسبق.
              </p>
            </div>
          </div>
        )}

        {/* VIEW 3: COMMUNITY GUIDELINES & DECENCY RULES */}
        {type === 'guidelines' && (
          <div className="flex flex-col gap-3.5 text-xs text-slate-300 leading-relaxed">
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300">
              <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm text-rose-200 mb-0.5">سياسة صارمة لمكافحة العري والمحتوى غير اللائق</span>
                <span>نظام الرقابة الآلي يفحص الصور، البث المباشر، والغرف الصوتية على مدار الساعة، ويقوم بالحظر الفوري التلقائي للمخالفين.</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 flex flex-col gap-2">
              <h3 className="font-bold text-slate-100 text-sm">المحظورات الصريحة الخاضعة للحظر الدائم:</h3>
              <ul className="list-disc list-inside space-y-1.5 text-slate-300 pr-1">
                <li><strong>منع العري التام:</strong> كشف العورات، الأعضاء الخاصة، أو أي محتوى جنسي صريح أو إيحائي.</li>
                <li><strong>حشمة الرجال:</strong> منع ظهور الرجل عارياً، أو بملابس داخلية كاشفة، أو دون لباس ساتر في البث المباشر وصور الملفات الشخصية.</li>
                <li><strong>منع السب والقذف والتمييز:</strong> يُمنع الإساءة للأديان، العنصرية، التهديد، أو نشر خطاب الكراهية.</li>
                <li><strong>منع الإعلانات المزعجة (Spam):</strong> منع الروابط الخارجية المشبوهة أو الترويج لخدمات مجهولة.</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-400">
              💡 <strong>تنويه إداري:</strong> في حال تم حظر حسابك بسبب مخالفة الحشمة أو العري، فإن الحظر نهائي ودائم ولا يمكن فكه إلا بقرار استثنائي من مالك المنصة فقط.
            </div>
          </div>
        )}

        {/* VIEW 4: CONTACT SUPPORT FORM */}
        {type === 'support' && (
          <div className="flex flex-col gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
              <Mail className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-100 block mb-0.5">فريق الدعم الفني جاهز لمساعدتك</span>
                <span>أرسل استفسارك أو مشكلتك المتعلقة بالشحن، الغرف، الحسابات، أو الإبلاغ عن مشكلة تقنية وسنرد عليك سريعاً.</span>
              </div>
            </div>

            {submitSuccess ? (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center text-center gap-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                <h3 className="font-bold text-sm text-emerald-300">تم استلام رسالتك بنجاح!</h3>
                <p className="text-xs text-slate-300">{submitSuccess}</p>
                <button
                  onClick={() => setSubmitSuccess(null)}
                  className="mt-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                >
                  إرسال تذكرة أخرى
                </button>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="flex flex-col gap-3">
                {submitError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                    {submitError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">الاسم الكامل</label>
                    <input
                      type="text"
                      required
                      value={ticketName}
                      onChange={(e) => setTicketName(e.target.value)}
                      placeholder="اسمك"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">البريد الإلكتروني للتواصل</label>
                    <input
                      type="email"
                      required
                      value={ticketEmail}
                      onChange={(e) => setTicketEmail(e.target.value)}
                      placeholder="example@mail.com"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:border-emerald-400 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">موضوع التذكرة / المشكلة</label>
                  <input
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="مثال: مشكلة في شحن الماسات، استفسار عن غرفة..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">تفاصيل الرسالة</label>
                  <textarea
                    rows={4}
                    required
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="اكتب تفاصيل مشكلتك وسيقوم فريق الدعم الفني بمتابعتها..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:border-emerald-400 focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 mt-1"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'جاري الإرسال...' : 'إرسال تذكرة الدعم'}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
