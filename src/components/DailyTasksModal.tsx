import React, { useState, useEffect } from 'react';
import { DailyTask, User, ReferralStats } from '../types';
import { API } from '../services/api';
import { soundEffects } from '../services/soundEffects';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Coins,
  CheckCircle2,
  Clock,
  X,
  Gift,
  Radio,
  Users,
  Share2,
  Copy,
  ExternalLink,
  MessageCircle,
  Send,
  SendHorizontal
} from 'lucide-react';

interface DailyTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserUpdated: (user: User) => void;
}

export const DailyTasksModal: React.FC<DailyTasksModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated
}) => {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [claimingTaskId, setClaimingTaskId] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      API.getTasks(currentUser.id).then(data => {
        setTasks(data);
      }).catch(() => {});

      API.getReferralStats(currentUser.id).then(stats => {
        setReferralStats(stats);
      }).catch(() => {});
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const baseReferralCode = currentUser.referralCode || referralStats?.referralCode || 'HKW100';
  const shareBaseUrl = 'https://service-rooms.ai.studio/';
  const fullShareUrl = `${shareBaseUrl}?ref=${encodeURIComponent(baseReferralCode)}`;
  const shareMessageText = `جرّب حكاوي - غرف صوتية وبث مباشر 🎙️🎁\nانضم للغرف الصوتية والبث المباشر والدردشة والهدايا:\n${fullShareUrl}`;

  const handleShareNow = async () => {
    soundEffects.playJoinRoom();

    // Check if real Android / Web Share Sheet is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'تطبيق حكاوي - غرف صوتية وبث مباشر',
          text: `جرّب حكاوي - غرف صوتية وبث مباشر 🎙️🎁\nانضم للغرف الصوتية والبث المباشر والدردشة والهدايا:\n${fullShareUrl}`,
          url: fullShareUrl
        });
        return;
      } catch (err: any) {
        // If user cancelled or share failed, fallback to show share options sheet
        if (err.name !== 'AbortError') {
          setShowShareOptions(true);
        }
      }
    } else {
      setShowShareOptions(true);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullShareUrl);
    setCopiedLink(true);
    soundEffects.playCoinSound();
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(baseReferralCode);
    setCopiedCode(true);
    soundEffects.playCoinSound();
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleClaim = async (taskId: string) => {
    setClaimingTaskId(taskId);
    try {
      await API.claimTask(currentUser.id, taskId);
      soundEffects.playCoinSound();
      confetti({ particleCount: 60, spread: 65 });
      
      // Update local task state
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, claimed: true } : t));
      
      // Update current user balance
      const updatedUser = await API.getUser(currentUser.id);
      onUserUpdated(updatedUser);
    } catch (err: any) {
      alert(err.message || 'تعذر استلام المكافأة');
    } finally {
      setClaimingTaskId(null);
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'DAILY_LOGIN': return <Clock className="w-5 h-5 text-amber-400" />;
      case 'JOIN_ROOM': return <Radio className="w-5 h-5 text-emerald-400" />;
      case 'SEND_GIFT': return <Gift className="w-5 h-5 text-rose-400" />;
      case 'RECEIVE_GIFT': return <Sparkles className="w-5 h-5 text-yellow-400" />;
      case 'INVITE_FRIEND':
      case 'SHARE_APP': return <Share2 className="w-5 h-5 text-sky-400" />;
      default: return <Sparkles className="w-5 h-5 text-amber-400" />;
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
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-100">المهام اليومية والمكافآت</h2>
              <p className="text-[11px] text-slate-400">أنجز المهام واحصل على كونز مجانية يومياً</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRIMARY FIXED TASK: مشاركة تطبيق حكاوي */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-950/50 via-slate-800/80 to-slate-900 border border-sky-500/30 flex flex-col gap-3 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
                <Share2 className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-slate-100">📤 مشاركة تطبيق حكاوي</h3>
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                    +10 كونز لكل صديق
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  شارك حكاوي مع أصدقائك وعائلتك. عندما يسجل أي شخص من رابطك الخاص، تحصل فوراً على 10 كونز!
                </p>
              </div>
            </div>
          </div>

          {/* Referral Stats Badges */}
          <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60 text-center">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">دعواتك الناجحة</span>
              <span className="text-sm font-black text-sky-400 font-mono">
                {referralStats?.successfulInvites || 0} مستخدم
              </span>
            </div>
            <div className="flex flex-col border-r border-slate-800">
              <span className="text-[10px] text-slate-400">الكونز المكتسبة</span>
              <span className="text-sm font-black text-amber-400 font-mono flex items-center justify-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                {referralStats?.earnedCoins || 0}
              </span>
            </div>
          </div>

          {/* Referral Code & Copy Box */}
          <div className="flex items-center justify-between bg-slate-950/70 p-2 rounded-xl border border-slate-800 text-xs font-mono">
            <div className="flex items-center gap-2 truncate">
              <span className="text-[10px] text-slate-400 uppercase">كود الدعوة:</span>
              <span className="font-black text-amber-400 tracking-wider text-xs">{baseReferralCode}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 px-2 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 cursor-pointer transition-all"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedCode ? 'تم النسخ ✓' : 'نسخ الكود'}</span>
            </button>
          </div>

          {/* Action Buttons: Share Now & Copy Link */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareNow}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-98 cursor-pointer transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>مشاركة الآن</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 active:scale-98 cursor-pointer transition-all"
              title="نسخ رابط الإحالة"
            >
              <Copy className="w-3.5 h-3.5 text-sky-400" />
              <span>{copiedLink ? 'تم نسخ الرابط ✓' : 'نسخ الرابط'}</span>
            </button>
          </div>

          {/* Direct Social Share Buttons Fallback / Drawer */}
          {showShareOptions && (
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-700/60 flex flex-col gap-2 animate-in fade-in">
              <span className="text-[11px] font-bold text-slate-300">مشاركة مباشرة عبر:</span>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessageText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex flex-col items-center gap-1 transition-all"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>واتساب</span>
                </a>

                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(fullShareUrl)}&text=${encodeURIComponent('جرّب حكاوي - غرف صوتية وبث مباشر 🎙️🎁')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-[10px] font-bold flex flex-col items-center gap-1 transition-all"
                >
                  <Send className="w-4 h-4 text-sky-400" />
                  <span>تيليجرام</span>
                </a>

                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullShareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-[10px] font-bold flex flex-col items-center gap-1 transition-all"
                >
                  <ExternalLink className="w-4 h-4 text-blue-400" />
                  <span>فيسبوك</span>
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessageText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[10px] font-bold flex flex-col items-center gap-1 transition-all"
                >
                  <span className="font-bold font-mono">𝕏</span>
                  <span>تويتر (X)</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Section title for remaining tasks */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs font-bold text-slate-400">باقي المهام اليومية:</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        {/* Regular Tasks List */}
        <div className="flex flex-col gap-2.5">
          {tasks
            .filter(task => task.id !== 'task_share_app')
            .map(task => {
              const isCompleted = task.progress >= task.requiredCount;
              const progressPct = Math.min(100, Math.round((task.progress / task.requiredCount) * 100));

              return (
                <div
                  key={task.id}
                  className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                      {getTaskIcon(task.taskType)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-100">{task.titleAr}</span>
                      <span className="text-[10px] text-slate-400">مكافأة: {task.rewardCoins} كونز و {task.rewardExp} نقطة خبرة</span>

                      {/* Progress Bar */}
                      <div className="w-28 sm:w-36 h-1.5 bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-500 mt-0.5 font-mono">
                        {task.progress} / {task.requiredCount}
                      </span>
                    </div>
                  </div>

                  {/* Claim / Reward Button */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1 text-[11px] font-extrabold text-amber-400">
                      <Coins className="w-3.5 h-3.5" />
                      <span>+{task.rewardCoins}</span>
                    </div>

                    {task.claimed ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>تم الاستلام</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleClaim(task.id)}
                        disabled={!isCompleted || claimingTaskId === task.id}
                        className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                          isCompleted
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 animate-pulse'
                            : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                        }`}
                      >
                        {claimingTaskId === task.id ? '...' : 'استلام'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
