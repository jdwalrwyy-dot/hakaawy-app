import React, { useState, useEffect } from 'react';
import { AppNotification, User } from '../types';
import { API } from '../services/api';
import { Bell, Gift, Users, Shield, Sparkles, MessageSquare, CheckCheck, Radio } from 'lucide-react';

interface NotificationsViewProps {
  currentUser: User;
  onRefreshUnreadCount?: () => void;
  onOpenAdminAgencyTab?: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  currentUser,
  onRefreshUnreadCount,
  onOpenAdminAgencyTab
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'GIFT' | 'SYSTEM' | 'FRIEND' | 'ROOM'>('ALL');

  const loadNotifications = () => {
    API.getNotifications(currentUser.id).then(data => {
      setNotifications(data);
    }).catch(() => {});
  };

  useEffect(() => {
    loadNotifications();
  }, [currentUser.id]);

  const handleMarkRead = async (id: string) => {
    await API.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    if (onRefreshUnreadCount) onRefreshUnreadCount();
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'GIFT': return <Gift className="w-5 h-5 text-amber-400" />;
      case 'FRIEND_REQUEST':
      case 'FRIEND_ACCEPT': return <Users className="w-5 h-5 text-sky-400" />;
      case 'ROOM_INVITE': return <Radio className="w-5 h-5 text-emerald-400" />;
      case 'SYSTEM': return <Shield className="w-5 h-5 text-purple-400" />;
      default: return <Bell className="w-5 h-5 text-amber-400" />;
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'ALL') return true;
    if (filter === 'GIFT') return n.type === 'GIFT';
    if (filter === 'FRIEND') return n.type === 'FRIEND_REQUEST' || n.type === 'FRIEND_ACCEPT' || n.type === 'FOLLOW';
    if (filter === 'ROOM') return n.type === 'ROOM_INVITE';
    if (filter === 'SYSTEM') return n.type === 'SYSTEM' || n.type === 'BAN_NOTICE';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-100">مركز الإشعارات</h2>
            <p className="text-[11px] text-slate-400">تنبيهات الهدايا، الدعوات والتحديثات</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'ALL' as const, label: 'الكل' },
          { id: 'GIFT' as const, label: 'الهدايا 🎁' },
          { id: 'FRIEND' as const, label: 'الأصدقاء 👥' },
          { id: 'ROOM' as const, label: 'الغرف 🎙️' },
          { id: 'SYSTEM' as const, label: 'النظام 🛡️' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="flex flex-col gap-2.5">
        {filteredNotifs.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/60 rounded-3xl border border-slate-800 text-xs text-slate-500">
            لا توجد إشعارات في هذا التصنيف حالياً.
          </div>
        ) : (
          filteredNotifs.map(notif => (
            <div
              key={notif.id}
              onClick={() => {
                if (!notif.isRead) handleMarkRead(notif.id);
                if (
                  onOpenAdminAgencyTab &&
                  (currentUser.role === 'OWNER' || currentUser.role === 'ADMIN') &&
                  (notif.title.includes('وكالة') || notif.message.includes('وكالة'))
                ) {
                  onOpenAdminAgencyTab();
                }
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                notif.isRead
                  ? 'bg-slate-900/60 border-slate-800/80 opacity-80'
                  : 'bg-slate-900 border-amber-500/30 shadow-md shadow-amber-500/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-slate-800 border border-slate-700/60 shrink-0">
                  {getNotifIcon(notif.type)}
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-100">{notif.title}</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{notif.message}</p>
                  <span className="text-[10px] text-slate-500 font-mono mt-1">
                    {new Date(notif.createdAt).toLocaleString('ar-EG')}
                  </span>
                </div>
              </div>

              {!notif.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 mt-1 shadow-sm shadow-amber-400"></span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
