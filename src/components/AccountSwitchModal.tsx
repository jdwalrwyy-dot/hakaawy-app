import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Users,
  Sparkles,
  CheckCircle2,
  Plus,
  Trash2,
  LogIn,
  Crown,
  Shield,
  Gem,
  Coins,
  ArrowRightLeft,
  UserCheck
} from 'lucide-react';
import { User, DeviceSavedAccount, isUserOwner } from '../types';
import {
  getSavedDeviceAccounts,
  saveDeviceAccount,
  removeSavedDeviceAccount
} from '../utils/deviceAccounts';
import { RoleBadge, UserRoleBadges } from './RoleBadge';
import { soundEffects } from '../services/soundEffects';

interface AccountSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSelectAccountToSwitch: (targetAccount: DeviceSavedAccount) => void;
  onOpenNewAuthModal: (initialMode?: 'google' | 'login' | 'register') => void;
}

export const AccountSwitchModal: React.FC<AccountSwitchModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectAccountToSwitch,
  onOpenNewAuthModal
}) => {
  const [savedAccounts, setSavedAccounts] = useState<DeviceSavedAccount[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Load and sync device accounts whenever modal opens or user updates
  useEffect(() => {
    if (isOpen) {
      if (currentUser) {
        saveDeviceAccount(currentUser);
      }
      setSavedAccounts(getSavedDeviceAccounts());
    }
  }, [isOpen, currentUser?.id]);

  if (!isOpen) return null;

  const handleSwitch = (account: DeviceSavedAccount) => {
    if (currentUser && account.id === currentUser.id) {
      onClose();
      return;
    }
    soundEffects.playJoinRoom();
    onSelectAccountToSwitch(account);
    onClose();
  };

  const handleRemoveAccount = (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    const updated = removeSavedDeviceAccount(targetId);
    setSavedAccounts(updated);
    setConfirmDeleteId(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-750 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto"
        >
          {/* Header Bar */}
          <div className="relative px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>تبديل الحساب</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-400/30">
                    هذا الجهاز
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  اختر حساباً محدوماً على هذا الهاتف للبدء باستخدامه فوراً
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Accounts List */}
          <div className="p-6 flex flex-col gap-3.5 max-h-[60vh] overflow-y-auto">
            {savedAccounts.length === 0 ? (
              <div className="text-center py-8 bg-slate-950/40 rounded-2xl border border-slate-800 p-4">
                <p className="text-xs text-slate-400">لا توجد حسابات أخرى محفوظة على هذا الجهاز حالياً.</p>
              </div>
            ) : (
              savedAccounts.map(acc => {
                const isActive = currentUser && currentUser.id === acc.id;
                const isDeleting = confirmDeleteId === acc.id;

                return (
                  <motion.div
                    key={acc.id}
                    layout
                    onClick={() => !isActive && handleSwitch(acc)}
                    className={`relative p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-amber-500/10 border-amber-400/60 shadow-[0_0_15px_rgba(251,191,36,0.15)] cursor-default'
                        : 'bg-slate-850 hover:bg-slate-800 border-slate-750 hover:border-slate-650 cursor-pointer group'
                    }`}
                  >
                    {/* User Info */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative w-12 h-12 rounded-2xl bg-slate-950 border border-slate-700 p-0.5 shrink-0 overflow-hidden">
                        <img
                          src={acc.avatar}
                          alt={acc.name}
                          className="w-full h-full rounded-xl object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {acc.isOwner && (
                          <span className="absolute bottom-0 right-0 p-0.5 bg-amber-400 text-slate-950 rounded-full">
                            <Crown className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <UserRoleBadges user={acc} size="sm" />
                          <span className="font-extrabold text-sm text-white truncate max-w-[150px]">
                            {acc.name}
                          </span>
                          {isActive && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1">
                              <UserCheck className="w-3 h-3" /> الحساب الحالي
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
                          <span>@{acc.username}</span>
                          <span>•</span>
                          <span>ID: {acc.numericId || acc.id}</span>
                        </div>

                        {/* Balances Preview */}
                        <div className="flex items-center gap-3 mt-1 text-[11px]">
                          <span className="flex items-center gap-1 text-sky-300 font-semibold">
                            <Gem className="w-3 h-3 text-sky-400" />
                            {acc.diamonds.toLocaleString('ar-EG')}
                          </span>
                          <span className="flex items-center gap-1 text-amber-300 font-semibold">
                            <Coins className="w-3 h-3 text-amber-400" />
                            {acc.coins.toLocaleString('ar-EG')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => handleSwitch(acc)}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black hover:brightness-110 transition-all shadow-md cursor-pointer"
                        >
                          تبديل
                        </button>
                      )}

                      {/* Remove Account from Device Cache */}
                      {!isActive && (
                        <div className="relative">
                          {isDeleting ? (
                            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-rose-500/50">
                              <button
                                type="button"
                                onClick={(e) => handleRemoveAccount(e, acc.id)}
                                className="px-2 py-1 rounded-lg bg-rose-500 text-white text-[10px] font-bold"
                              >
                                تأكيد الإزالة
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(null);
                                }}
                                className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[10px]"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(acc.id);
                              }}
                              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 transition-colors cursor-pointer"
                              title="إزالة الحساب من قائمة هذا الجهاز فقط"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Bottom Actions */}
          <div className="p-6 pt-3 bg-slate-950/60 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewAuthModal('google');
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/20 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول بحساب آخر (Google / هاتف)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewAuthModal('register');
              }}
              className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>إنشاء حساب جديد</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
