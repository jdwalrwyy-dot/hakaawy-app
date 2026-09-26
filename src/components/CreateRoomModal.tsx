import React, { useState } from 'react';
import { API } from '../services/api';
import { Room, User, MicLayoutType } from '../types';
import { Radio, Lock, Globe, Image, Mic, Video, Sparkles, X, CheckCircle, AlertCircle, LayoutGrid, Star, Crown, Loader2 } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onRoomCreated: (room: Room) => void;
}

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'
];

const CATEGORIES = ['سوالف', 'شعر وموسيقى', 'تقنية', 'ألعاب ومسابقات', 'ثقافة وتطوير', 'عام'];

const LAYOUT_OPTIONS: { id: MicLayoutType; label: string; desc: string; icon: string; count: number }[] = [
  { id: '2+10', label: '12 مايك (2 VIP + 5+5)', desc: 'صف علوي VIP لمضيفين + صفين 5 مايكات', icon: '👑', count: 12 },
  { id: '2+15', label: '17 مايك (2 VIP + 5+5+5)', desc: 'صف علوي VIP + 3 صفوف 5 مايكات', icon: '🌟', count: 17 },
  { id: '10', label: '10 مايكات (5 + 5)', desc: 'تخطيط متوازن صفين 5 مايكات', icon: '🎙️', count: 10 },
  { id: '15', label: '15 مايك (5 + 5 + 5)', desc: 'مساحة ضخمة 3 صفوف متوازنة', icon: '💎', count: 15 },
  { id: '5', label: '5 مايكات (صف واحد)', desc: 'جلسة سريعة وخفيفة', icon: '⚡', count: 5 },
  { id: '8', label: '8 مايكات كلاسيكي (4 + 4)', desc: 'التخطيط الكلاسيكي 4 في كل صف', icon: '📻', count: 8 }
];

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onRoomCreated
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState(PRESET_COVERS[0]);
  const [micLayout, setMicLayout] = useState<MicLayoutType>('2+15');
  const [type, setType] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [allowAudio, setAllowAudio] = useState(true);
  const [allowVideo, setAllowVideo] = useState(true);
  const [tagsInput, setTagsInput] = useState('حكاوي, لايف, سوالف');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('يرجى كتابة عنوان جذاب للغرفة');
      return;
    }

    if (type === 'PRIVATE' && !password.trim()) {
      setErrorMsg('يرجى تحديد كلمة مرور للغرفة الخاصة');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const tags = tagsInput
      .split(/[,،]/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    try {
      const room = await API.createRoom({
        title: title.trim(),
        description: description.trim() || undefined,
        coverImage,
        hostId: currentUser.id,
        type,
        password: type === 'PRIVATE' ? password.trim() : undefined,
        allowAudio,
        allowVideo,
        currentCategory: category,
        tags: tags.length > 0 ? tags : ['حكاوي', 'صوت'],
        micLayout
      });

      onRoomCreated(room);
    } catch (err: any) {
      setErrorMsg(err.message || 'تعذر إنشاء الغرفة، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-100">إنشاء غرفة صوتية / بث</h2>
              <p className="text-[11px] text-slate-400">ابدأ مساحتك واستضف 8 متحدثين على المايكات</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Room Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              اسم الغرفة <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: جلسة حكاوي وسوالف رمضانية 🎙️"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-amber-400 focus:outline-none text-slate-100 text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">وصف الغرفة (اختياري)</label>
            <textarea
              rows={2}
              placeholder="اكتب نبذة عن موضوع الجلسة أو القوانين..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-amber-400 focus:outline-none text-slate-100 text-xs resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">تصنيف الغرفة</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    category === cat
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Cover Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">غلاف الغرفة</label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {PRESET_COVERS.map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => setCoverImage(url)}
                  className={`relative w-16 h-14 rounded-xl overflow-hidden cursor-pointer shrink-0 border-2 transition-all ${
                    coverImage === url ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/20' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`cover ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  {coverImage === url && (
                    <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-amber-300 drop-shadow" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mic Layout Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300">
                تخطيط وسعة المايكات
              </label>
              <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                {LAYOUT_OPTIONS.find(l => l.id === micLayout)?.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {LAYOUT_OPTIONS.map(layout => {
                const isSelected = micLayout === layout.id;
                return (
                  <button
                    type="button"
                    key={layout.id}
                    onClick={() => setMicLayout(layout.id)}
                    className={`flex items-start gap-2 p-2.5 rounded-2xl border text-right transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 text-slate-100 shadow-md shadow-amber-500/10'
                        : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-lg shrink-0 mt-0.5">{layout.icon}</span>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold truncate text-slate-100">{layout.label}</span>
                        {isSelected && <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mr-1" />}
                      </div>
                      <span className="text-[10px] text-slate-400 leading-tight mt-0.5">{layout.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Room Type (Public vs Private) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('PUBLIC')}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                type === 'PUBLIC'
                  ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow-sm'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>عامة للجميع</span>
            </button>

            <button
              type="button"
              onClick={() => setType('PRIVATE')}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                type === 'PRIVATE'
                  ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow-sm'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>خاصة برمز سري</span>
            </button>
          </div>

          {type === 'PRIVATE' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">كلمة المرور</label>
              <input
                type="password"
                placeholder="أدخل كلمة مرور الغرفة"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>
          )}

          {/* Media Toggles */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-200">
                <input
                  type="checkbox"
                  checked={allowAudio}
                  onChange={(e) => setAllowAudio(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>السماح بالصوت</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-200">
                <input
                  type="checkbox"
                  checked={allowVideo}
                  onChange={(e) => setAllowVideo(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <Video className="w-3.5 h-3.5 text-cyan-400" />
                <span>السماح بالكاميرا</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950 shrink-0" />
                <span>جاري إنشاء الغرفة وفتح المايكات...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>إنشاء وبدء الغرفة الآن</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
