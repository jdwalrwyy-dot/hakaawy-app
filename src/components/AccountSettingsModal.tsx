import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sliders,
  Sparkles,
  Crown,
  Check,
  Eye,
  Gem,
  Coins,
  ShieldCheck,
  Volume2,
  VolumeX,
  RefreshCw,
  Car,
  ArrowRight,
  Trash2,
  Plus,
  Edit,
  Power,
  AlertCircle,
  Upload
} from 'lucide-react';
import { User, Entrance, Frame, EntranceCategory, EntranceTier, EntranceSoundType } from '../types';
import { API, parseJsonResponse } from '../services/api';
import { soundEffects } from '../services/soundEffects';
import { EntranceVisualRenderer } from './EntranceVisualRenderer';
import { RoomEntranceOverlay, RoomEntranceEventPayload } from './RoomEntranceOverlay';
import { Avatar4DFrame, isVideoUrl } from './Avatar4DFrame';
import { LevelProgressCard } from './LevelProgressCard';
import confetti from 'canvas-confetti';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserUpdated?: (user: User) => void;
  onOpenRechargeModal?: () => void;
  initialTab?: 'entrances' | 'frames';
  onTriggerLiveEntrance?: (entranceId: string) => void;
  isInline?: boolean;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
  onOpenRechargeModal,
  initialTab = 'entrances',
  onTriggerLiveEntrance,
  isInline = false
}) => {
  const [activeTab, setActiveTab] = useState<'entrances' | 'frames'>(initialTab);

  // --- ENTRANCES STATE ---
  const [entrances, setEntrances] = useState<Entrance[]>([]);
  const [ownedEntranceIds, setOwnedEntranceIds] = useState<string[]>([]);
  const [activeEntranceId, setActiveEntranceId] = useState<string>(currentUser.activeEntranceId || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isEntrancesLoading, setIsEntrancesLoading] = useState<boolean>(true);
  const [entrancesError, setEntrancesError] = useState<string | null>(null);
  const [purchasingEntranceId, setPurchasingEntranceId] = useState<string | null>(null);
  const [activatingEntranceId, setActivatingEntranceId] = useState<string | null>(null);
  const [entranceFeedbackMsg, setEntranceFeedbackMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [previewEvent, setPreviewEvent] = useState<RoomEntranceEventPayload | null>(null);
  const [isEntranceSoundMuted, setIsEntranceSoundMuted] = useState<boolean>(soundEffects.getIsEntranceSoundMuted());
  const [entranceRenderMode, setEntranceRenderMode] = useState<'3D' | '5D'>('5D');

  // --- ADMIN ENTRANCE MANAGEMENT STATE ---
  const [isEntranceFormOpen, setIsEntranceFormOpen] = useState<boolean>(false);
  const [editingEntrance, setEditingEntrance] = useState<Entrance | null>(null);
  const [isSavingEntrance, setIsSavingEntrance] = useState<boolean>(false);
  const [entranceFormData, setEntranceFormData] = useState({
    id: '',
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    diamondPrice: 0,
    category: 'VEHICLE' as EntranceCategory,
    tier: 'LUXURY' as EntranceTier,
    durationSeconds: 5,
    soundType: 'supercar' as EntranceSoundType,
    isExclusiveOwner: false,
    badgeLabel: 'فاخرة',
    previewColor: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    isDisabled: false
  });

  // --- FRAMES STATE ---
  const [frames, setFrames] = useState<Frame[]>([]);
  const [ownedFrameIds, setOwnedFrameIds] = useState<string[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);
  const [selectedFrameCategory, setSelectedFrameCategory] = useState<string>('ALL');
  const [isFramesLoading, setIsFramesLoading] = useState<boolean>(false);
  const [frameLoadError, setFrameLoadError] = useState<string | null>(null);
  const [frameErrorMsg, setFrameErrorMsg] = useState<string | null>(null);
  const [frameSuccessMsg, setFrameSuccessMsg] = useState<string | null>(null);

  // --- EDIT PROFILE STATE ---
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>(currentUser.name || '');
  const [editBio, setEditBio] = useState<string>(currentUser.bio || '');
  const [editAvatar, setEditAvatar] = useState<string>(currentUser.avatar || '');
  const [editGender, setEditGender] = useState<'MALE' | 'FEMALE' | 'male' | 'female'>(currentUser.gender || 'MALE');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Sync state when currentUser prop changes
  useEffect(() => {
    setEditName(currentUser.name || '');
    setEditBio(currentUser.bio || '');
    setEditAvatar(currentUser.avatar || '');
    setEditGender(currentUser.gender || 'MALE');
  }, [currentUser]);

  // Handle Avatar Image File Upload from Phone
  const handleProfileAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setProfileMsg({ text: 'حجم الصورة كبير، يرجى اختيار صورة أقل من 8 ميجابايت', isError: true });
      setTimeout(() => setProfileMsg(null), 3500);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url) {
        setEditAvatar(base64Url);
        setProfileMsg({ text: 'تم تجهيز الصورة، انقر على "حفظ التغييرات" لتطبيقه!', isError: false });
        setTimeout(() => setProfileMsg(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Profile Save
  const handleSaveProfileChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setProfileMsg({ text: 'يرجى كتابة الاسم المستعار', isError: true });
      return;
    }

    setIsSavingProfile(true);
    setProfileMsg(null);

    try {
      const updatedUser = await API.updateUser(currentUser.id, {
        name: editName.trim(),
        bio: editBio.trim(),
        avatar: editAvatar,
        gender: editGender
      });

      soundEffects.playNotification();
      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }

      setProfileMsg({ text: 'تم حفظ وتحديث الملف الشخصي بنجاح! 🎉', isError: false });
      setTimeout(() => {
        setProfileMsg(null);
        setIsEditProfileModalOpen(false);
      }, 1500);
    } catch (err: any) {
      soundEffects.playError();
      setProfileMsg({ text: err?.message || 'تعذر حفظ بيانات الملف الشخصي', isError: true });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const isOwner = currentUser.role === 'OWNER' || !!currentUser.isOwner;
  const isAdminOrOwner = isOwner || currentUser.role === 'ADMIN';

  // Load Entrances safely
  const loadEntrancesData = async () => {
    setIsEntrancesLoading(true);
    setEntrancesError(null);
    try {
      const res = await fetch(`/api/entrances?userId=${currentUser.id}`);
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'فشل تحميل قائمة الدخلات من الخادم');
      if (Array.isArray(data.entrances)) {
        setEntrances(data.entrances);
      } else {
        setEntrances([]);
      }

      const ownedRes = await fetch(`/api/entrances/user/${currentUser.id}`);
      if (ownedRes.ok) {
        const ownedData = await parseJsonResponse(ownedRes);
        if (Array.isArray(ownedData.ownedEntranceIds)) {
          setOwnedEntranceIds(ownedData.ownedEntranceIds);
        }
        if (ownedData.activeEntranceId) {
          setActiveEntranceId(ownedData.activeEntranceId);
        }
      }
    } catch (e: any) {
      console.warn('Error loading entrances:', e);
      setEntrancesError(e?.message || 'تعذر تحميل بيانات الدخلات. يرجى إعادة المحاولة.');
    } finally {
      setIsEntrancesLoading(false);
    }
  };

  // Load Frames
  const loadFramesData = async () => {
    setIsFramesLoading(true);
    setFrameLoadError(null);
    try {
      const [framesData, ownedData] = await Promise.all([
        API.getFrames(),
        API.getUserFrames(currentUser.id)
      ]);
      const validFrames = Array.isArray(framesData) ? framesData : [];
      setFrames(validFrames);
      setOwnedFrameIds(Array.isArray(ownedData) ? ownedData : []);

      if (validFrames.length > 0) {
        const currentActive = validFrames.find(f => f.id === currentUser.activeFrameId);
        setSelectedFrame(prev => prev || currentActive || validFrames[0]);
      } else {
        setSelectedFrame(null);
      }
    } catch (e: any) {
      console.warn('Error loading frames:', e);
      setFrameLoadError(e?.message || 'تعذر تحميل إطارات الصور الشخصية من السيرفر. يرجى التثبت من الاتصال وإعادة المحاولة.');
    } finally {
      setIsFramesLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadEntrancesData();
      loadFramesData();
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab, currentUser.id]);

  if (!isOpen) return null;

  // Sound toggle for entrances
  const handleToggleSoundMute = () => {
    const nextVal = soundEffects.toggleEntranceSoundMute();
    setIsEntranceSoundMuted(nextVal);
  };

  // Preview Entrance
  const handlePreviewEntrance = (ent: Entrance) => {
    soundEffects.playTap(1.2);
    const isKing = ent.id === 'entrance_king_limousine' || ent.id === 'entrance_owner_imperial_throne' || ent.category === 'OWNER' || Boolean(ent.isExclusiveOwner);
    setPreviewEvent({
      id: `preview_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      entranceId: ent.id,
      entranceName: ent.nameAr,
      entranceCategory: ent.category,
      entranceTier: ent.tier,
      soundType: ent.soundType,
      durationSeconds: isKing ? 5.0 : (ent.durationSeconds || 6.0),
      isOwner: isKing,
      userRole: currentUser.role,
      renderMode: entranceRenderMode
    });
  };

  // Equip / Activate Entrance
  const handleActivateEntrance = async (ent: Entrance) => {
    setActivatingEntranceId(ent.id);
    setEntranceFeedbackMsg(null);
    try {
      const res = await fetch('/api/entrances/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, entranceId: ent.id })
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'تعذر تفعيل الدخلة');

      setActiveEntranceId(ent.id);
      soundEffects.playNotification();
      setEntranceFeedbackMsg({ text: `تم تفعيل ${ent.nameAr} بنجاح! ✨`, isError: false });

      if (onUserUpdated && data.user) {
        onUserUpdated(data.user);
      }
      if (onTriggerLiveEntrance) {
        onTriggerLiveEntrance(ent.id);
      }
    } catch (err: any) {
      soundEffects.playError();
      setEntranceFeedbackMsg({ text: err.message, isError: true });
    } finally {
      setActivatingEntranceId(null);
      setTimeout(() => setEntranceFeedbackMsg(null), 3500);
    }
  };

  // Purchase Entrance
  const handlePurchaseEntrance = async (ent: Entrance) => {
    setPurchasingEntranceId(ent.id);
    setEntranceFeedbackMsg(null);
    try {
      const res = await fetch('/api/entrances/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, entranceId: ent.id })
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'فشلت عملية الشراء');

      setOwnedEntranceIds(prev => [...prev, ent.id]);
      setActiveEntranceId(ent.id);
      soundEffects.playCoinSound();
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      setEntranceFeedbackMsg({ text: `تهانينا! تم اقتناء ${ent.nameAr} وتفعيلها مباشرة! 🎉`, isError: false });

      if (onUserUpdated && data.user) {
        onUserUpdated(data.user);
      }
    } catch (err: any) {
      soundEffects.playError();
      setEntranceFeedbackMsg({ text: err.message, isError: true });
    } finally {
      setPurchasingEntranceId(null);
      setTimeout(() => setEntranceFeedbackMsg(null), 4000);
    }
  };

  // --- ADMIN HANDLERS FOR ENTRANCES ---
  const handleOpenAddEntrance = () => {
    setEditingEntrance(null);
    setEntranceFormData({
      id: `entrance_${Date.now()}`,
      nameAr: '',
      nameEn: '',
      descriptionAr: '',
      diamondPrice: 10000,
      category: 'VEHICLE',
      tier: 'LUXURY',
      durationSeconds: 5,
      soundType: 'supercar',
      isExclusiveOwner: false,
      badgeLabel: 'جديدة',
      previewColor: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      isDisabled: false
    });
    setIsEntranceFormOpen(true);
  };

  const handleOpenEditEntrance = (ent: Entrance) => {
    setEditingEntrance(ent);
    setEntranceFormData({
      id: ent.id,
      nameAr: ent.nameAr || '',
      nameEn: ent.nameEn || '',
      descriptionAr: ent.descriptionAr || '',
      diamondPrice: ent.diamondPrice ?? (ent as any).diamondCost ?? 0,
      category: ent.category || 'VEHICLE',
      tier: ent.tier || 'LUXURY',
      durationSeconds: ent.durationSeconds || 5,
      soundType: ent.soundType || 'sparkle',
      isExclusiveOwner: Boolean(ent.isExclusiveOwner),
      badgeLabel: ent.badgeLabel || 'مخصصة',
      previewColor: ent.previewColor || 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      isDisabled: Boolean(ent.isDisabled)
    });
    setIsEntranceFormOpen(true);
  };

  const handleSaveEntranceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entranceFormData.nameAr.trim()) {
      setEntranceFeedbackMsg({ text: 'يرجى كتابة اسم الدخلة بالعربية', isError: true });
      return;
    }
    setIsSavingEntrance(true);
    setEntranceFeedbackMsg(null);
    try {
      const isEdit = !!editingEntrance;
      const url = isEdit ? `/api/admin/entrances/${editingEntrance.id}` : '/api/admin/entrances';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: currentUser.id,
          entrance: entranceFormData
        })
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'فشل حفظ الدخلة');

      soundEffects.playNotification();
      setEntranceFeedbackMsg({ text: isEdit ? 'تم تعديل الدخلة بنجاح! ✨' : 'تم إضافة الدخلة الجديدة بنجاح! 🚀', isError: false });
      setIsEntranceFormOpen(false);
      loadEntrancesData();
    } catch (err: any) {
      soundEffects.playError();
      setEntranceFeedbackMsg({ text: err.message || 'تعذر حفظ الدخلة', isError: true });
    } finally {
      setIsSavingEntrance(false);
      setTimeout(() => setEntranceFeedbackMsg(null), 4000);
    }
  };

  const handleToggleDisableEntrance = async (ent: Entrance) => {
    try {
      const res = await fetch(`/api/admin/entrances/${ent.id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId: currentUser.id })
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'تعذر تغيير حالة الدخلة');

      soundEffects.playNotification();
      setEntranceFeedbackMsg({ text: data.message, isError: false });
      loadEntrancesData();
    } catch (err: any) {
      soundEffects.playError();
      setEntranceFeedbackMsg({ text: err.message, isError: true });
    } finally {
      setTimeout(() => setEntranceFeedbackMsg(null), 3500);
    }
  };

  const handleDeleteEntrance = async (ent: Entrance) => {
    if (!confirm(`هل أنت تأكد من رغبتك في حذف دخلة "${ent.nameAr}" نهائياً من النظام؟`)) return;
    try {
      const res = await fetch(`/api/admin/entrances/${ent.id}?adminUserId=${currentUser.id}`, {
        method: 'DELETE'
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'تعذر حذف الدخلة');

      soundEffects.playNotification();
      setEntranceFeedbackMsg({ text: 'تم حذف الدخلة بنجاح', isError: false });
      loadEntrancesData();
    } catch (err: any) {
      soundEffects.playError();
      setEntranceFeedbackMsg({ text: err.message, isError: true });
    } finally {
      setTimeout(() => setEntranceFeedbackMsg(null), 3500);
    }
  };

  // Equip or Unlock Frame
  const handleEquipFrame = async (frame: Frame) => {
    const reqLevel = frame.requiredLevel || 1;
    const isUnlocked = ownedFrameIds.includes(frame.id) || reqLevel <= (currentUser.level || 1) || (frame.isExclusiveOwner && isAdminOrOwner);

    if (frame.isExclusiveOwner && !isAdminOrOwner) {
      setFrameErrorMsg('إطار الإدارة والمالك حصري لمالك وإدارة التطبيق فقط 👑');
      setTimeout(() => setFrameErrorMsg(null), 3500);
      return;
    }

    if (!isUnlocked) {
      setFrameErrorMsg(`هذا الإطار مغلق! يتطلب الوصول للمستوى ${reqLevel} لفتحه (مستواك الحالي: ${currentUser.level || 1}).`);
      setTimeout(() => setFrameErrorMsg(null), 4000);
      return;
    }

    try {
      await API.setActiveFrame(currentUser.id, frame.id);
      if (!frame.isExclusiveOwner && frame.id !== 'frame_king' && frame.id !== 'frame_owner_king') {
        soundEffects.playNotification();
      }
      setFrameSuccessMsg(`تم تفعيل إطار ${frame.nameAr} بنجاح!`);
      const updatedUser = await API.getUser(currentUser.id);
      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }
      setTimeout(() => setFrameSuccessMsg(null), 3000);
    } catch (err: any) {
      soundEffects.playError();
      setFrameErrorMsg(err.message || 'تعذر تفعيل الإطار');
      setTimeout(() => setFrameErrorMsg(null), 3000);
    }
  };

  // Remove Active Frame
  const handleRemoveActiveFrame = async () => {
    try {
      await API.setActiveFrame(currentUser.id, null);
      soundEffects.playNotification();
      setFrameSuccessMsg('تم إزالة الإطار والعودة للصورة الشخصية العادية');
      const updatedUser = await API.getUser(currentUser.id);
      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }
      setTimeout(() => setFrameSuccessMsg(null), 3000);
    } catch (err: any) {
      soundEffects.playError();
      setFrameErrorMsg(err.message || 'تعذر إزالة الإطار');
      setTimeout(() => setFrameErrorMsg(null), 3000);
    }
  };

  // Upload Custom Frame Video (MP4/WebM) or Image (PNG/GIF/JPEG) from Phone
  const handleUploadCustomFrameImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setFrameErrorMsg('حجم الملف كبير جداً، يرجى اختيار ملف فيديو أو صورة أقل من 20 ميجابايت');
      setTimeout(() => setFrameErrorMsg(null), 3500);
      return;
    }

    const isVideoFile = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.webm');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target?.result as string;
      if (!base64Url) return;

      try {
        const updatedUser = await API.updateUser(currentUser.id, {
          customFrameUrl: base64Url,
          activeFrameId: 'frame_custom'
        });
        soundEffects.playNotification();
        if (onUserUpdated) {
          onUserUpdated(updatedUser);
        }
        setFrameSuccessMsg(isVideoFile ? 'تم رفع وتطبيق إطار الفيديو المفرغ بنجاح! 🎬👑' : 'تم رفع وتطبيق صورة الإطار بنجاح وبدقة عالية! 🖼️👑');
        setFrameErrorMsg(null);
        setTimeout(() => setFrameSuccessMsg(null), 3500);
      } catch (err: any) {
        soundEffects.playError();
        setFrameErrorMsg('تعذر حفظ ملف الإطار المرفوع');
        setTimeout(() => setFrameErrorMsg(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove Custom Frame
  const handleRemoveCustomFrame = async () => {
    try {
      const updatedUser = await API.updateUser(currentUser.id, {
        customFrameUrl: null,
        activeFrameId: 'frame_king'
      });
      soundEffects.playNotification();
      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }
      setFrameSuccessMsg('تم إزالة الإطار المخصص بنجاح');
      setTimeout(() => setFrameSuccessMsg(null), 3000);
    } catch (err: any) {
      soundEffects.playError();
      setFrameErrorMsg('تعذر إزالة الإطار المخصص');
      setTimeout(() => setFrameErrorMsg(null), 3000);
    }
  };

  const filteredEntrances = entrances.filter(e => {
    if (e.isDisabled && !isAdminOrOwner) return false;
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'VEHICLE') return e.category === 'VEHICLE' || (e as any).category === 'CAR';
    if (selectedCategory === 'AERIAL') return e.category === 'AERIAL' || (e as any).category === 'AIRCRAFT';
    if (selectedCategory === 'CREATURE') return e.category === 'CREATURE';
    if (selectedCategory === 'MYTHIC') return e.category === 'MYTHIC' || (e as any).category === 'VIP';
    if (selectedCategory === 'OWNER') return e.category === 'OWNER' || e.isExclusiveOwner || (e as any).category === 'ROYAL';
    if (selectedCategory === 'FREE') return (e.diamondPrice ?? (e as any).diamondCost ?? 0) === 0 || e.category === 'FREE';
    return e.category === selectedCategory;
  });

  const content = (
    <>
      <div
        className={
          isInline
            ? "w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-right animate-in fade-in duration-200"
            : "w-full sm:max-w-2xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-right"
        }
        dir="rtl"
      >
      {/* Header Bar */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer active:scale-95"
            title="رجوع"
          >
            <ArrowRight className="w-4 h-4" />
            <span>رجوع</span>
          </button>
          <div>
            <h2 className="text-base font-black text-slate-100 flex items-center gap-1.5">
              <span>إدارة وحسابي</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-bold border border-slate-700">
                الملف الشخصي
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">تعديل الملف الشخصي، والدخلات 3D، وإطارات البروفايل</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Mute Toggle for Entrances */}
          {activeTab === 'entrances' && (
            <button
              onClick={handleToggleSoundMute}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isEntranceSoundMuted
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
              }`}
              title={isEntranceSoundMuted ? 'أصوات الدخولات مكتومة' : 'أصوات الدخولات مفعلة'}
            >
              {isEntranceSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            title="رجوع للملف الشخصي"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

        {/* User Profile Overview Banner with Edit Profile Button */}
        <div className="mx-4 mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border border-amber-500/30 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <Avatar4DFrame
                avatarUrl={currentUser.avatar}
                frameId={currentUser.activeFrameId || 'frame_king'}
                customFrameUrl={currentUser.customFrameUrl}
                size="md"
                showEffects={true}
                isOwner={isAdminOrOwner}
              />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-extrabold text-sm text-slate-100">{currentUser.name}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Lv.{currentUser.level || 1}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 max-w-[180px] sm:max-w-xs truncate">
                {currentUser.bio || 'مستخدم مميز في تطبيق حكاوي 🎙️'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditName(currentUser.name || '');
              setEditBio(currentUser.bio || '');
              setEditAvatar(currentUser.avatar || '');
              setEditGender(currentUser.gender || 'MALE');
              setIsEditProfileModalOpen(true);
            }}
            className="shrink-0 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>تعديل الملف الشخصي</span>
          </button>
        </div>

        {/* Tab Navigation: الدخلات / الإطارات */}
        <div className="p-3 bg-slate-950/70 border-b border-slate-800/80 shrink-0">
          <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
            <button
              type="button"
              id="tab-settings-entrances-btn"
              onClick={() => setActiveTab('entrances')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs transition-all cursor-pointer ${
                activeTab === 'entrances'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/25 scale-[1.02]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>ضبط الدخلات 3D</span>
            </button>

            <button
              type="button"
              id="tab-settings-frames-btn"
              onClick={() => setActiveTab('frames')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs transition-all cursor-pointer ${
                activeTab === 'frames'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/25 scale-[1.02]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>الإطارات</span>
            </button>
          </div>
        </div>

        {/* Feedback Notifications */}
        {entranceFeedbackMsg && (
          <div
            className={`mx-4 mt-3 p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in ${
              entranceFeedbackMsg.isError
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            }`}
          >
            <span>{entranceFeedbackMsg.text}</span>
          </div>
        )}

        {frameSuccessMsg && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
            <span>{frameSuccessMsg}</span>
          </div>
        )}

        {frameErrorMsg && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
            <span>{frameErrorMsg}</span>
          </div>
        )}

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* =========================================================================
              TAB 1: الدخلات (3D Entrances & Rides)
             ========================================================================= */}
          {activeTab === 'entrances' && (
            <div className="space-y-4 animate-in fade-in duration-150">

              {/* Owner / Admin Control Bar */}
              {isAdminOrOwner && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-950 border border-amber-500/40 flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black text-amber-300">إدارة وضبط الدخلات (المالك والإدارة 👑)</h4>
                      <p className="text-[10px] text-slate-400">يمكنك إضافة دخلات جديدة، تعديل الأسعار والخصائص، أو تعطل/تضمين أي دخلة.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddEntrance}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة دخلة جديدة</span>
                  </button>
                </div>
              )}

              {/* 3D / 5D Entrance System Mode Selector */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/90 border border-slate-700/80 shadow-md">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="text-xs font-black text-slate-200">نوع نظام الدخلات والمعاينة:</span>
                </div>
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEntranceRenderMode('3D')}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      entranceRenderMode === '3D'
                        ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/20'
                        : 'text-slate-400 hover:text-slate-200 font-bold'
                    }`}
                  >
                    3D
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntranceRenderMode('5D')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 ${
                      entranceRenderMode === '5D'
                        ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/30'
                        : 'text-amber-400/80 hover:text-amber-300 font-bold'
                    }`}
                  >
                    <span>5D</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-950/50 text-slate-950 font-black">جديد 🔥</span>
                  </button>
                </div>
              </div>

              {/* 🔊 Web Audio API Sound Effects (SFX) & Supercar Roar Mute Control Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-amber-500/30 flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    isEntranceSoundMuted
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}>
                    {isEntranceSoundMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 animate-pulse" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                      <span>المؤثرات الصوتية للدخلات 5D (Supercar Roar SFX)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 font-bold border border-slate-800">
                        Web Audio API
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      تعديل تشغيل/كتم الأصوات السينمائية وهدير المحرك المتزامن للدخلات والهدايا
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleSoundMute}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                    isEntranceSoundMuted
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/40 text-rose-300'
                      : 'bg-amber-500 hover:bg-amber-400 border-amber-300 text-slate-950'
                  }`}
                >
                  {isEntranceSoundMuted ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      <span>صوت مكتوم (Muted)</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>الصوت مفعل (Active)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                {[
                  { id: 'ALL', label: 'الكل' },
                  { id: 'FREE', label: 'مجانية 🎁' },
                  { id: 'VEHICLE', label: 'سيارات ومركبات 🏎️' },
                  { id: 'AERIAL', label: 'طائرات ومواكب 🚁' },
                  { id: 'CREATURE', label: 'كائنات ومخلوقات 🦅' },
                  { id: 'MYTHIC', label: 'خيالية وأسطورية 🐉' },
                  { id: 'OWNER', label: 'خاصة بالمالك 👑' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* 1. Entrances Loading State */}
              {isEntrancesLoading && (
                <div className="py-16 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center gap-3 bg-slate-950/40 rounded-3xl border border-slate-800/80">
                  <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
                  <span className="text-sm font-black text-slate-200">جاري تحميل قائمة الدخلات الملكية...</span>
                  <span className="text-[11px] text-slate-400">يرجى الانتظار لحظة</span>
                </div>
              )}

              {/* 2. Entrances Error State */}
              {!isEntrancesLoading && entrancesError && (
                <div className="p-6 text-center bg-rose-500/10 border border-rose-500/30 rounded-3xl flex flex-col items-center gap-3">
                  <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-extrabold text-rose-200">حدث خطأ أثناء تحميل الدخلات</h4>
                    <p className="text-xs text-rose-300/80">{entrancesError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={loadEntrancesData}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>إعادة المحاولة</span>
                  </button>
                </div>
              )}

              {/* 3. Empty Entrances State */}
              {!isEntrancesLoading && !entrancesError && filteredEntrances.length === 0 && (
                <div className="py-12 text-center bg-slate-950/40 border border-slate-800/80 rounded-3xl flex flex-col items-center gap-3 p-4">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Car className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-bold text-slate-200">لا توجد دخلات في هذه الفئة حالياً</h4>
                    <p className="text-xs text-slate-400">اختر فئة أخرى استعراض التشكيلة كاملة</p>
                  </div>
                  {selectedCategory !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('ALL')}
                      className="mt-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs border border-slate-700 cursor-pointer"
                    >
                      عرض جميع الدخلات
                    </button>
                  )}
                </div>
              )}

              {/* 4. Entrances Catalog Grid */}
              {!isEntrancesLoading && !entrancesError && filteredEntrances.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredEntrances.map((ent) => {
                    const price = ent.diamondPrice ?? (ent as any).diamondCost ?? 0;
                    const desc = ent.descriptionAr || (ent as any).descAr || '';
                    const isOwned = ownedEntranceIds.includes(ent.id) || price === 0 || (isOwner && ent.category === 'OWNER');
                    const isActive = activeEntranceId === ent.id;
                    const isPurchasing = purchasingEntranceId === ent.id;
                    const isActivating = activatingEntranceId === ent.id;

                    return (
                      <div
                        key={ent.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 relative ${
                          ent.isDisabled
                            ? 'bg-slate-900/50 border-rose-500/30 opacity-75'
                            : isActive
                            ? 'bg-amber-500/10 border-amber-400/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50'
                            : 'bg-slate-800/70 border-slate-700/80 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            {/* 3D Visual Preview Thumbnail */}
                            <div className="w-16 h-16 shrink-0 rounded-2xl bg-slate-950 border border-slate-700/80 flex items-center justify-center overflow-hidden">
                              <EntranceVisualRenderer entranceId={ent.id} size="sm" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-xs font-black text-slate-100 truncate">{ent.nameAr}</h4>
                                {isActive && (
                                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded-md border border-emerald-500/30">
                                    المفعلة حالياً
                                  </span>
                                )}
                                {ent.isDisabled && (
                                  <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-1.5 py-0.5 rounded-md border border-rose-500/30">
                                    معطلة 🚫
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1 leading-tight line-clamp-2">{desc}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] text-amber-400 font-bold font-mono">
                                  {price === 0 ? 'مجانية' : `${price.toLocaleString('ar-EG')} ماسة`}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {ent.durationSeconds || 5} ثوانٍ ⏱️
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Admin Edit/Delete Controls */}
                          {isAdminOrOwner && (
                            <div className="flex items-center gap-1 shrink-0 bg-slate-900/90 p-1 rounded-xl border border-slate-700/80">
                              <button
                                type="button"
                                onClick={() => handleOpenEditEntrance(ent)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors"
                                title="تعديل الدخلة"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleDisableEntrance(ent)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  ent.isDisabled
                                    ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                }`}
                                title={ent.isDisabled ? 'تفعيل الدخلة' : 'تعطيل الدخلة'}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEntrance(ent)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                                title="حذف الدخلة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handlePreviewEntrance(ent)}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                            title={`معاينة الدخلة بنظام ${entranceRenderMode}`}
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-[10px]">معاينة {entranceRenderMode}</span>
                          </button>

                          {isOwned ? (
                            <button
                              type="button"
                              disabled={isActive || isActivating || ent.isDisabled}
                              onClick={() => handleActivateEntrance(ent)}
                              className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                isActive
                                  ? 'bg-slate-700/50 text-slate-400 border border-slate-600/40 cursor-default'
                                  : ent.isDisabled
                                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95'
                              }`}
                            >
                              {isActivating ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : isActive ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>مفعلة</span>
                                </>
                              ) : ent.isDisabled ? (
                                <span>معطلة حالياً</span>
                              ) : (
                                <span>تفعيل واستخدام</span>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isPurchasing || ent.isDisabled}
                              onClick={() => handlePurchaseEntrance(ent)}
                              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isPurchasing ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Gem className="w-3.5 h-3.5" />
                                  <span>شراء وتفعيل ({price.toLocaleString('ar-EG')})</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 2: إطارات الصور الشخصية 4D (4D Avatar Frames)
             ========================================================================= */}
          {activeTab === 'frames' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: 'ALL', nameAr: 'الكل' },
                  { id: 'ROYAL', nameAr: 'الملكية 👑' },
                  { id: 'FANTASY', nameAr: 'خيالي 🔮' },
                  { id: 'ANIMAL', nameAr: 'حيوانات 🦁' },
                  { id: 'NEON', nameAr: 'نيون ⚡' },
                  { id: 'NATURE', nameAr: 'طبيعة 🌿' },
                  { id: 'SPECIAL', nameAr: 'مميز ⭐' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedFrameCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                      selectedFrameCategory === cat.id
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/60'
                    }`}
                  >
                    {cat.nameAr}
                  </button>
                ))}
              </div>

              {/* Level Unlock System Info Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 font-bold shrink-0">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-amber-300 block text-xs sm:text-sm">نظام فتح الإطارات بالمستويات 🌟</span>
                    <span className="text-[11px] text-slate-300 mt-0.5 block">
                      إطار واحد مجاني للجميع من المستوى 1، وتُفتح جميع الإطارات الأخرى تلقائياً عند الارتقاء لمستواك المطلوب بدون دفع ماسات!
                    </span>
                  </div>
                </div>
                <div className="shrink-0 bg-amber-500/10 px-3.5 py-1.5 rounded-xl border border-amber-500/30 self-end sm:self-auto">
                  <span className="text-[10px] text-slate-400 block font-extrabold">مستواك الحالي</span>
                  <span className="text-xs font-black text-amber-400 font-mono">المستوى {currentUser.level || 1} ⭐</span>
                </div>
              </div>

              {/* Upload Custom Frame Video or Image Card (Exclusive for Owner & Admin) */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-900/40 border-2 border-amber-500/70 shadow-2xl flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-amber-500/30 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/40 shadow-inner">
                      <Crown className="w-5 h-5 text-amber-400 animate-pulse" />
                    </div>
                    <div className="text-right">
                      <h4 className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1.5">
                        <span>رفع إطار مخصص (فيديو MP4/WebM أو صورة)</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold border border-amber-500/30">حصري للمالك 👑</span>
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                        اختر ملف فيديو مفرغ (MP4 / WebM) أو صورة (PNG / GIF) من الهاتف لتظهر كإطار دائري متحرك بدقة عالية فوق صورة البروفايل بالغرفة الصوتية!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Avatar4DFrame
                      avatarUrl={currentUser.avatar}
                      frameId={currentUser.activeFrameId}
                      customFrameUrl={currentUser.customFrameUrl}
                      size="md"
                      showEffects={true}
                      isOwner={isAdminOrOwner}
                    />
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-200 block">الإطار المخصص الحالي</span>
                      <span className="text-[11px] text-amber-400 font-mono font-bold">
                        {currentUser.customFrameUrl ? (isVideoUrl(currentUser.customFrameUrl) ? '🎬 فيديو متحرك مخصص (MP4/WebM)' : '🖼️ صورة مخصصة') : '👑 إطار المالك الملكي'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {currentUser.customFrameUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveCustomFrame}
                        className="px-3.5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف الإطار المخصص</span>
                      </button>
                    )}

                    <label className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-lg shadow-amber-500/25">
                      <Upload className="w-4 h-4" />
                      <span>اختيار فيديو/صورة من الهاتف 📱</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,image/*"
                        className="hidden"
                        onChange={handleUploadCustomFrameImage}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Level & XP Progress Summary */}
              <LevelProgressCard
                exp={currentUser.exp || 0}
                level={currentUser.level || 1}
              />

              {/* Feedback messages */}
              {frameErrorMsg && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold text-center">
                  {frameErrorMsg}
                </div>
              )}
              {frameSuccessMsg && (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center">
                  {frameSuccessMsg}
                </div>
              )}

              {/* Selected Frame Live Preview Banner */}
              {selectedFrame && (() => {
                const reqLevel = selectedFrame.requiredLevel || 1;
                const isFrameUnlocked = ownedFrameIds.includes(selectedFrame.id) || reqLevel <= (currentUser.level || 1) || (selectedFrame.isExclusiveOwner && isAdminOrOwner);

                return (
                  <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                    <div className="flex items-center gap-4">
                      {/* Real 4D Avatar Preview */}
                      <div className="shrink-0">
                        <Avatar4DFrame
                          avatarUrl={currentUser.avatar}
                          frameId={selectedFrame.id}
                          customFrameUrl={currentUser.customFrameUrl}
                          size="lg"
                          showEffects={true}
                          isOwner={isAdminOrOwner}
                        />
                      </div>

                      <div className="flex flex-col text-right">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-extrabold text-slate-100">{selectedFrame.nameAr}</h4>
                          {selectedFrame.isExclusiveOwner && (
                            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/40">
                              حصري للإدارة والمالك 👑
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm">
                          {selectedFrame.descriptionAr || selectedFrame.description || 'إطار شخصي فاخر 4D'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs font-black font-mono px-2.5 py-1 rounded-xl border ${
                            selectedFrame.isExclusiveOwner
                              ? 'text-amber-300 bg-amber-500/20 border-amber-500/40'
                              : isFrameUnlocked
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                              : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          }`}>
                            {selectedFrame.isExclusiveOwner
                              ? 'خاص بالمالك والإدارة'
                              : reqLevel === 1
                              ? 'إطار مجاني (المستوى 1)'
                              : isFrameUnlocked
                              ? `مفتوح (المستوى ${reqLevel})`
                              : `🔒 يفتح عند المستوى ${reqLevel}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {/* If user currently has active frame, show remove button */}
                      {currentUser.activeFrameId && (
                        <button
                          type="button"
                          onClick={handleRemoveActiveFrame}
                          className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                          title="إزالة الإطار والعودة للصورة العادية"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">إزالة الإطار</span>
                        </button>
                      )}

                      {/* Action button */}
                      {selectedFrame.isExclusiveOwner && !isAdminOrOwner ? (
                        <span className="py-2.5 px-4 rounded-2xl bg-slate-800 text-amber-400/80 font-bold text-xs border border-slate-700/60 text-center w-full sm:w-auto">
                          خاص بالمالك والإدارة فقط 👑
                        </span>
                      ) : !isFrameUnlocked ? (
                        <button
                          type="button"
                          disabled
                          className="w-full sm:w-auto py-2.5 px-5 rounded-2xl bg-slate-800 text-rose-300/80 font-black text-xs border border-rose-500/30 flex items-center justify-center gap-1.5 cursor-not-allowed opacity-85"
                        >
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          <span>🔒 مغلق (يتطلب المستوى {reqLevel})</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={currentUser.activeFrameId === selectedFrame.id}
                          onClick={() => handleEquipFrame(selectedFrame)}
                          className={`w-full sm:w-auto py-2.5 px-5 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                            currentUser.activeFrameId === selectedFrame.id
                              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-95'
                          }`}
                        >
                          {currentUser.activeFrameId === selectedFrame.id ? 'الإطار مفعل حالياً ✓' : 'تطبيق الإطار'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* 1. Loading State */}
              {isFramesLoading && (
                <div className="py-16 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center gap-3 bg-slate-950/40 rounded-3xl border border-slate-800/80">
                  <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
                  <span className="text-sm font-black text-slate-200">جاري تحميل إطارات الصور الشخصية 4D...</span>
                  <span className="text-[11px] text-slate-400">يرجى الانتظار لحظة لتجهيز قائمة الإطارات</span>
                </div>
              )}

              {/* 2. Error State with Retry Button */}
              {!isFramesLoading && frameLoadError && (
                <div className="p-6 text-center bg-rose-500/10 border border-rose-500/30 rounded-3xl flex flex-col items-center gap-3">
                  <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400">
                    <X className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-extrabold text-rose-200">فشل تحميل إطارات الصور</h4>
                    <p className="text-xs text-rose-300/80">{frameLoadError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={loadFramesData}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>إعادة المحاولة</span>
                  </button>
                </div>
              )}

              {/* 3. Empty State */}
              {!isFramesLoading && !frameLoadError && frames.filter(f => selectedFrameCategory === 'ALL' || f.category === selectedFrameCategory).length === 0 && (
                <div className="py-12 text-center bg-slate-950/40 border border-slate-800/80 rounded-3xl flex flex-col items-center gap-3 p-4">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-bold text-slate-200">لا توجد إطارات مفرودة في هذه الفئة حالياً</h4>
                    <p className="text-xs text-slate-400">اختر فئة أخرى أو اضغط على "عرض جميع الإطارات"</p>
                  </div>
                  {selectedFrameCategory !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setSelectedFrameCategory('ALL')}
                      className="mt-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs border border-slate-700 cursor-pointer"
                    >
                      عرض جميع الإطارات
                    </button>
                  )}
                </div>
              )}

              {/* 4. 4D Frames Catalog Grid */}
              {!isFramesLoading && !frameLoadError && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto p-1 pr-2 no-scrollbar">
                  {frames
                    .filter(f => selectedFrameCategory === 'ALL' || f.category === selectedFrameCategory)
                    .map((frame) => {
                      const reqLevel = frame.requiredLevel || 1;
                      const isUnlocked = ownedFrameIds.includes(frame.id) || reqLevel <= (currentUser.level || 1) || (frame.isExclusiveOwner && isAdminOrOwner);
                      const isActive = currentUser.activeFrameId === frame.id;
                      const isSelected = selectedFrame?.id === frame.id;

                      return (
                        <button
                          key={frame.id}
                          type="button"
                          onClick={() => setSelectedFrame(frame)}
                          className={`p-3 rounded-2xl border transition-all flex flex-col items-center text-center gap-2 cursor-pointer relative overflow-hidden group ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-400 shadow-xl shadow-amber-500/10 ring-2 ring-amber-400'
                              : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                          }`}
                        >
                          {/* Owner/Admin Badge on Card if Exclusive */}
                          {frame.isExclusiveOwner && (
                            <span className="absolute top-1.5 right-1.5 z-30 text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded-full">
                              الإدارة 👑
                            </span>
                          )}

                          {/* Lock Badge on Card if Locked */}
                          {!isUnlocked && !frame.isExclusiveOwner && (
                            <span className="absolute top-1.5 left-1.5 z-30 text-[9px] bg-slate-950/90 text-rose-300 font-extrabold px-1.5 py-0.5 rounded-full border border-rose-500/40 flex items-center gap-0.5 shadow-sm">
                              🔒 Lvl {reqLevel}
                            </span>
                          )}

                          {/* 4D Frame Visual Element */}
                          <div className={`my-1 ${!isUnlocked && !frame.isExclusiveOwner ? 'opacity-70' : ''}`}>
                            <Avatar4DFrame
                              avatarUrl={currentUser.avatar}
                              frameId={frame.id}
                              size="md"
                              showEffects={isSelected || isActive}
                              isOwner={isAdminOrOwner}
                            />
                          </div>

                          <div className="w-full">
                            <h5 className="text-xs font-extrabold text-slate-100 truncate">{frame.nameAr}</h5>
                            <span className="text-[11px] text-amber-400 font-mono font-bold block mt-0.5">
                              {frame.isExclusiveOwner
                                ? 'حصري للإدارة والمالك'
                                : reqLevel === 1
                                ? 'مجاني'
                                : `يفتح عند Level ${reqLevel}`}
                            </span>
                          </div>

                          {isActive ? (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                              مفعل ✓
                            </span>
                          ) : frame.isExclusiveOwner && !isAdminOrOwner ? (
                            <span className="text-[10px] bg-amber-500/10 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                              للإدارة 🔒
                            </span>
                          ) : isUnlocked ? (
                            <span className="text-[10px] bg-slate-800 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                              مفتوح ✓
                            </span>
                          ) : (
                            <span className="text-[10px] bg-rose-500/10 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-500/20">
                              🔒 مغلق
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Admin Entrance Add/Edit Modal Form */}
      {isEntranceFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span>{editingEntrance ? 'تعديل الدخلة' : 'إضافة دخلة جديدة 3D'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEntranceFormOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntranceSubmit} className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">اسم الدخلة بالعربية *</label>
                <input
                  type="text"
                  required
                  value={entranceFormData.nameAr}
                  onChange={(e) => setEntranceFormData({ ...entranceFormData, nameAr: e.target.value })}
                  placeholder="مثال: قطار الذهب الملكي 🚂"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">اسم الدخلة بالإنجليزية</label>
                <input
                  type="text"
                  value={entranceFormData.nameEn}
                  onChange={(e) => setEntranceFormData({ ...entranceFormData, nameEn: e.target.value })}
                  placeholder="e.g. Royal Golden Train"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">وصف الدخلة</label>
                <textarea
                  rows={2}
                  value={entranceFormData.descriptionAr}
                  onChange={(e) => setEntranceFormData({ ...entranceFormData, descriptionAr: e.target.value })}
                  placeholder="اكتب وصفاً جذاباً ومفصلاً للدخلة..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-amber-400 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">السعر بالماسات 💎</label>
                  <input
                    type="number"
                    min={0}
                    value={entranceFormData.diamondPrice}
                    onChange={(e) => setEntranceFormData({ ...entranceFormData, diamondPrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-amber-400 outline-none font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">ضع 0 للغايات المجانية</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">مدة العرض (بالثواني)</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={entranceFormData.durationSeconds}
                    onChange={(e) => setEntranceFormData({ ...entranceFormData, durationSeconds: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-amber-400 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">فئة الدخلة</label>
                  <select
                    value={entranceFormData.category}
                    onChange={(e) => setEntranceFormData({ ...entranceFormData, category: e.target.value as EntranceCategory })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-amber-400 outline-none"
                  >
                    <option value="VEHICLE">مركبات وسيارات 🏎️</option>
                    <option value="AERIAL">طائرات ومواكب 🚁</option>
                    <option value="CREATURE">كائنات أسطورية 🦅</option>
                    <option value="MYTHIC">خيالية وفائقة 🐉</option>
                    <option value="OWNER">خاصة بالمالك 👑</option>
                    <option value="FREE">مجانية للجميع 🎁</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">مستوى الفخامة (Tier)</label>
                  <select
                    value={entranceFormData.tier}
                    onChange={(e) => setEntranceFormData({ ...entranceFormData, tier: e.target.value as EntranceTier })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-amber-400 outline-none"
                  >
                    <option value="COMMON">عادية (COMMON)</option>
                    <option value="LUXURY">فاخرة (LUXURY)</option>
                    <option value="LEGENDARY">أسطورية (LEGENDARY)</option>
                    <option value="ROYAL_VIP">ملكية VIP (ROYAL_VIP)</option>
                    <option value="OWNER_EXCLUSIVE">حصري للمالك (OWNER)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">نوع المؤثر الصوتي</label>
                  <select
                    value={entranceFormData.soundType}
                    onChange={(e) => setEntranceFormData({ ...entranceFormData, soundType: e.target.value as EntranceSoundType })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-amber-400 outline-none"
                  >
                    <option value="supercar">سيارة رياضية (Supercar)</option>
                    <option value="jet">طائرة نفاثة (Jet)</option>
                    <option value="bike">دراجة نارية (Bike)</option>
                    <option value="yacht">يخت فاخر (Yacht)</option>
                    <option value="falcon">صقر ملكي (Falcon)</option>
                    <option value="eagle">نسر خارق (Eagle)</option>
                    <option value="dove">حمامة سلام (Dove)</option>
                    <option value="dragon">تنين أسطوري (Dragon)</option>
                    <option value="sparkle">بريق ونجوم (Sparkle)</option>
                    <option value="royal_fanfare">موسيقى ملكية (Royal Fanfare)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الشارة الترويجية (Badge)</label>
                  <input
                    type="text"
                    value={entranceFormData.badgeLabel}
                    onChange={(e) => setEntranceFormData({ ...entranceFormData, badgeLabel: e.target.value })}
                    placeholder="مثال: أسطورية، حصري..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:border-amber-400 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-amber-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={entranceFormData.isExclusiveOwner}
                    onChange={(e) => setEntranceFormData({ ...entranceFormData, isExclusiveOwner: e.target.checked })}
                    className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                  />
                  <span>حصري لمالك التطبيق والإدارة فقط 👑</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-rose-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={entranceFormData.isDisabled}
                    onChange={(e) => setEntranceFormData({ ...entranceFormData, isDisabled: e.target.checked })}
                    className="w-4 h-4 rounded accent-rose-500 cursor-pointer"
                  />
                  <span>تعطيل الدخلة (إخفاء من المتجر)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEntranceFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={isSavingEntrance}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isSavingEntrance ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingEntrance ? 'حفظ التعديلات' : 'إضافة الدخلة الحقيقية'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL OVERLAY */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-right overflow-y-auto max-h-[90vh]" dir="rtl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-100">تعديل الملف الشخصي (Edit Profile)</h3>
                  <p className="text-[11px] text-slate-400">تحديث الاسم المستعار، الصورة الشخصية والنبذة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Messages */}
            {profileMsg && (
              <div className={`p-3 rounded-2xl text-xs font-bold text-center border ${
                profileMsg.isError ? 'bg-rose-500/15 border-rose-500/40 text-rose-300' : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              }`}>
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveProfileChanges} className="flex flex-col gap-4">
              {/* Avatar Frame Preview & Upload Button */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center gap-3">
                <span className="text-xs font-extrabold text-amber-300">معاينة الصورة داخل الإطار الملكي 👑</span>
                <Avatar4DFrame
                  avatarUrl={editAvatar}
                  frameId={currentUser.activeFrameId || 'frame_king'}
                  customFrameUrl={currentUser.customFrameUrl}
                  size="xl"
                  showEffects={true}
                  isOwner={isAdminOrOwner}
                />

                <label className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-md shadow-amber-500/20">
                  <Upload className="w-4 h-4" />
                  <span>رفع صورة جديدة من الهاتف 🖼️</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfileAvatarUpload}
                  />
                </label>
                <p className="text-[10px] text-slate-400 text-center">اختر صورة من استوديو هاتفك وتتحدث فوراً داخل الإطار</p>
              </div>

              {/* Display Name Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  الاسم المستعار (Display Name) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={24}
                  placeholder="ادخل اسمك المستعار..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:border-amber-400 focus:outline-none transition-colors"
                />
              </div>

              {/* Bio / Status Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  النبذة الشخصية (Bio / الحالة)
                </label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  maxLength={120}
                  placeholder="اكتب نبذة مميزة عنك..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:border-amber-400 focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Gender Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">الجنس (النوع)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditGender('MALE')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                      (editGender === 'MALE' || editGender === 'male')
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-md shadow-blue-500/20'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>🔵</span>
                    <span>ذكر (Male)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditGender('FEMALE')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                      (editGender === 'FEMALE' || editGender === 'female')
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-500/20'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>🔴</span>
                    <span>أنثى (Female)</span>
                  </button>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  {isSavingProfile ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>حفظ التعديلات</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );

  if (isInline) {
    return (
      <>
        {content}
        {previewEvent && (
          <RoomEntranceOverlay
            currentEvent={previewEvent}
            isPreviewMode={true}
            onClose={() => setPreviewEvent(null)}
            onAnimationComplete={() => setPreviewEvent(null)}
            roomCoverImage="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&auto=format&fit=crop&q=80"
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
        {content}
      </div>

      {/* 3D Entrance Live Preview Overlay */}
      {previewEvent && (
        <RoomEntranceOverlay
          currentEvent={previewEvent}
          isPreviewMode={true}
          onClose={() => setPreviewEvent(null)}
          onAnimationComplete={() => setPreviewEvent(null)}
          roomCoverImage="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&auto=format&fit=crop&q=80"
        />
      )}
    </>
  );
};

