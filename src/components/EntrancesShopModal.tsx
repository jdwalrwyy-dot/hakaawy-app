import React from 'react';
import { X, Zap, ShieldCheck } from 'lucide-react';
import { User } from '../types';

interface EntrancesShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserUpdated?: (user: User) => void;
  onOpenRechargeModal?: () => void;
  onTriggerLiveEntrance?: (entranceId: string) => void;
}

export const EntrancesShopModal: React.FC<EntrancesShopModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4" dir="rtl">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg">
          <Zap className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-black text-slate-100">
          النظام السريع والإنيميشن الخفيف
        </h2>

        <p className="text-sm text-slate-300 leading-relaxed font-medium">
          تم إلغاء كافة الإطارات والمؤثرات الرسومية الثقيلة لتوفير تجربة دخول وخروج فائقة السرعة ولحظية بدون أي تهنيج أو استهلاك للذاكرة.
        </p>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-2xl shadow-lg hover:brightness-110 active:scale-98 transition-all"
          >
            موافق
          </button>
        </div>
      </div>
    </div>
  );
};
