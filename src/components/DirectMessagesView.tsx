import React, { useState, useEffect, useRef } from 'react';
import { User, Friendship, PrivateMessage, OfficialMessageTarget, isUserOwner } from '../types';
import { API } from '../services/api';
import { soundEffects } from '../services/soundEffects';
import { UserRoleBadges } from './RoleBadge';
import { MessageSquare, Send, UserPlus, Check, X, ArrowRight, Shield, Megaphone, Lock, Sparkles, CheckCheck } from 'lucide-react';

interface DirectMessagesViewProps {
  currentUser: User;
  onOpenReport: (targetType: 'USER' | 'MESSAGE', targetId: string, targetName: string) => void;
}

const HEKAWY_OFFICIAL_USER: User = {
  id: 'HEKAWY_OFFICIAL',
  numericId: '1000',
  name: 'حكاوي',
  username: 'hekawy_official',
  avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
  level: 100,
  exp: 999999,
  coins: 0,
  diamonds: 0,
  followersCount: 0,
  followingCount: 0,
  friendsCount: 0,
  referralCode: 'HEKAWY',
  createdAt: '2026-01-01T00:00:00.000Z',
  role: 'OWNER',
  isOnline: true,
  bio: 'الحساب الرسمي لإنشاء وتوجيه التنبيهات والرسائل الرسمية لمنصة حكاوي'
};

export const DirectMessagesView: React.FC<DirectMessagesViewProps> = ({
  currentUser,
  onOpenReport
}) => {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [activePartner, setActivePartner] = useState<User | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [officialMessages, setOfficialMessages] = useState<PrivateMessage[]>([]);

  // Official Hekawy Broadcast Modal state
  const [isOfficialModalOpen, setIsOfficialModalOpen] = useState(false);
  const [officialTarget, setOfficialTarget] = useState<OfficialMessageTarget>('ALL');
  const [officialTargetUserId, setOfficialTargetUserId] = useState<string>('');
  const [officialText, setOfficialText] = useState('');
  const [isSendingOfficial, setIsSendingOfficial] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isOwnerOrAdmin = isUserOwner(currentUser) || currentUser.role === 'OWNER' || currentUser.role === 'ADMIN';

  const loadFriendsAndUsers = () => {
    API.getFriends(currentUser.id).then(data => {
      setFriends(data.friends || []);
      setPendingRequests(data.pendingRequests || []);
    }).catch(() => {});

    API.getUsers().then(users => {
      setAllUsers(users.filter(u => u.id !== currentUser.id && u.id !== 'HEKAWY_OFFICIAL'));
    }).catch(() => {});

    API.getOfficialHekawyMessages(currentUser.id).then(msgs => {
      setOfficialMessages(msgs);
    }).catch(() => {});
  };

  useEffect(() => {
    loadFriendsAndUsers();
  }, [currentUser.id]);

  // Load chat messages when active partner changes
  useEffect(() => {
    if (activePartner) {
      if (activePartner.id === 'HEKAWY_OFFICIAL') {
        API.getOfficialHekawyMessages(currentUser.id).then(msgs => {
          setMessages(msgs);
          setOfficialMessages(msgs);
        }).catch(() => {});
      } else {
        API.getPrivateMessages(currentUser.id, activePartner.id).then(msgs => {
          setMessages(msgs);
        }).catch(() => {});
      }
    }
  }, [activePartner, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activePartner || isSending) return;

    if (activePartner.id === 'HEKAWY_OFFICIAL') {
      alert('لا يمكن الرد على رسائل حكاوي الرسمية. هذا الحساب لإرسال الإشعارات الرسمية فقط من طرف واحد.');
      return;
    }

    setIsSending(true);
    try {
      const res = await API.sendPrivateMessage(currentUser.id, activePartner.id, messageInput.trim());
      soundEffects.playNotification();
      setMessages(prev => [...prev, res]);
      setMessageInput('');
    } catch (err: any) {
      alert(err.message || 'فشل إرسال الرسالة');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendOfficialBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officialText.trim() || isSendingOfficial) return;

    setIsSendingOfficial(true);
    try {
      const result = await API.sendOfficialHekawyMessage({
        senderUserId: currentUser.id,
        targetCategory: officialTarget,
        targetUserId: officialTarget === 'USER_SPECIFIC' ? officialTargetUserId : undefined,
        text: officialText.trim()
      });

      soundEffects.playNotification();
      alert(result.message);
      setOfficialText('');
      setIsOfficialModalOpen(false);
      loadFriendsAndUsers();
    } catch (err: any) {
      alert(err.message || 'فشل إرسال الرسالة الرسمية');
    } finally {
      setIsSendingOfficial(false);
    }
  };

  const handleRespondRequest = async (requestId: string, accept: boolean) => {
    try {
      await API.respondFriendRequest(requestId, accept);
      loadFriendsAndUsers();
    } catch {
      alert('تعذر الرد على طلب الصداقة');
    }
  };

  const handleSendFriendRequest = async (targetId: string) => {
    try {
      const res = await API.sendFriendRequest(currentUser.id, targetId);
      alert(res.message);
      loadFriendsAndUsers();
    } catch (err: any) {
      alert(err.message || 'فشل إرسال طلب الصداقة');
    }
  };

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.numericId && u.numericId.includes(searchQuery))
  );

  const unreadOfficialCount = officialMessages.filter(m => !m.read).length;
  const latestOfficialMsg = officialMessages[officialMessages.length - 1];

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col gap-4">
      {/* OWNER/ADMIN OFFICIAL MESSAGE SYSTEM BROADCAST BUTTON */}
      {isOwnerOrAdmin && (
        <div className="bg-gradient-to-r from-amber-500/20 via-purple-600/20 to-slate-900 border border-amber-500/40 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center shrink-0 font-black shadow-lg shadow-amber-500/30">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
                <span>نظام رسائل حكاوي الرسمية</span>
                <span className="text-[10px] bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-500/40">
                  لوحة المالك والإدارة 👑
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                إرسال إشعارات وتنبيهات رسمية باسم <strong className="text-amber-400">"حكاوي"</strong> إلى الفئات المستهدفة (المستخدمين، المضيفين، الوكلاء، الموظفين، الإدارة).
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOfficialModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Megaphone className="w-4 h-4" />
            <span>إرسال رسالة رسمية جديدة</span>
          </button>
        </div>
      )}

      {/* Pending Friend Requests Banner */}
      {pendingRequests.length > 0 && !activePartner && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <UserPlus className="w-4 h-4" />
            <span>طلبات صداقة واردة ({pendingRequests.length})</span>
          </div>

          <div className="flex flex-col gap-2">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <img
                    src={req.senderAvatar}
                    alt={req.senderName}
                    className="w-8 h-8 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-xs font-bold text-slate-100">{req.senderName}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleRespondRequest(req.id, true)}
                    className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>قبول</span>
                  </button>
                  <button
                    onClick={() => handleRespondRequest(req.id, false)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHAT INTERFACE OR CONVERSATIONS LIST */}
      {activePartner ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-[75vh]">
          {/* Active Partner Top Bar */}
          <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setActivePartner(null)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="relative">
                <img
                  src={activePartner.avatar}
                  alt={activePartner.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-amber-500/60 shadow-md shadow-amber-500/20"
                  referrerPolicy="no-referrer"
                />
                {activePartner.id === 'HEKAWY_OFFICIAL' ? (
                  <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 rounded-full p-0.5 border border-slate-900">
                    <Shield className="w-3 h-3 fill-slate-950" />
                  </span>
                ) : activePartner.isOnline ? (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
                ) : null}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <UserRoleBadges user={activePartner} size="sm" />
                  <h3 className="font-bold text-sm text-slate-100">{activePartner.name}</h3>
                  {activePartner.id === 'HEKAWY_OFFICIAL' && (
                    <span className="bg-gradient-to-r from-amber-500 to-amber-300 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm shadow-amber-500/30">
                      <Shield className="w-3 h-3" />
                      <span>حساب رسمي موثق</span>
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {activePartner.id === 'HEKAWY_OFFICIAL'
                    ? 'الرسائل والإشعارات الرسمية الموجهة من إدارة المنصة'
                    : `@${activePartner.username}`}
                </span>
              </div>
            </div>

            {activePartner.id !== 'HEKAWY_OFFICIAL' && (
              <button
                onClick={() => onOpenReport('USER', activePartner.id, activePartner.name)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 text-xs flex items-center gap-1 cursor-pointer"
                title="إبلاغ عن المستخدم"
              >
                <Shield className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-950/40">
            {messages.length === 0 ? (
              <div className="text-center my-auto text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                {activePartner.id === 'HEKAWY_OFFICIAL' ? (
                  <>
                    <Shield className="w-10 h-10 text-amber-500/40" />
                    <span>لا توجد رسائل رسمية سابقة من حكاوي.</span>
                  </>
                ) : (
                  <span>لا توجد رسائل سابقة. ابدأ المحادثة الآن! 💬</span>
                )}
              </div>
            ) : (
              messages.map(msg => {
                const isOfficial = msg.senderId === 'HEKAWY_OFFICIAL' || msg.isOfficial === true || activePartner.id === 'HEKAWY_OFFICIAL';
                const isMine = !isOfficial && msg.senderId === currentUser.id;

                if (isOfficial) {
                  return (
                    <div key={msg.id} className="w-full my-1 flex flex-col items-center">
                      <div className="w-full max-w-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/40 rounded-3xl p-4 shadow-xl shadow-amber-500/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                        
                        {/* Official Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-md shadow-amber-500/30">
                              <Shield className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-xs text-amber-400">حكاوي</span>
                                <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                                  رسمي
                                </span>
                              </div>
                              <span className="text-[9px] text-slate-400 block font-mono">
                                System Official Sender
                              </span>
                            </div>
                          </div>

                          {msg.targetCategoryLabel && (
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-xl font-bold border border-slate-700/60">
                              فئة: {msg.targetCategoryLabel}
                            </span>
                          )}
                        </div>

                        {/* Message Content */}
                        <p className="text-xs text-slate-100 leading-relaxed font-medium whitespace-pre-wrap py-1">
                          {msg.text}
                        </p>

                        {/* Footer Info & No-Reply Notice */}
                        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                          <div className="flex items-center gap-1 text-amber-400/80 font-bold">
                            <Lock className="w-3 h-3" />
                            <span>إرسال رسمياً من طرف واحد (غير قابل للرد)</span>
                          </div>

                          <span className="font-mono">
                            {new Date(msg.createdAt).toLocaleString('ar-EG', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[75%] ${isMine ? 'mr-auto items-end' : 'ml-auto items-start'}`}
                  >
                    <div
                      className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                        isMine
                          ? 'bg-amber-500 text-slate-950 font-medium rounded-bl-sm'
                          : 'bg-slate-800 text-slate-100 rounded-br-sm border border-slate-700/60'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-0.5 font-mono">
                      {new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar OR Official No-Reply Notice */}
          {activePartner.id === 'HEKAWY_OFFICIAL' ? (
            <div className="p-4 bg-slate-950 border-t border-amber-500/30 flex flex-col items-center justify-center text-center gap-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-black text-xs">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>رسالة رسمية من حكاوي (إرسال من طرف واحد فقط)</span>
              </div>
              <p className="text-[11px] text-slate-400 max-w-lg leading-relaxed">
                لا يستطيع المستلم الرد على حساب حكاوي الرسمي. التواصل الشخصي مع الإدارة يكون من خلال الخاص العادي فقط إذا كانت صلاحية الخاص متاحة.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                placeholder={`اكتب رسالة إلى ${activePartner.name}...`}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:border-amber-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!messageInput.trim() || isSending}
                className="p-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-bold transition-all cursor-pointer"
              >
                <Send className="w-4 h-4 rotate-180" />
              </button>
            </form>
          )}
        </div>
      ) : (
        /* Conversations & Users Search */
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              <span>الرسائل والأصدقاء</span>
            </h2>
          </div>

          {/* PINNED OFFICIAL HEKAWY MESSAGES THREAD CARD */}
          <div
            onClick={() => setActivePartner(HEKAWY_OFFICIAL_USER)}
            className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 border-2 border-amber-500/50 hover:border-amber-400 cursor-pointer flex items-center justify-between transition-all shadow-xl shadow-amber-500/10 group"
          >
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <img
                  src={HEKAWY_OFFICIAL_USER.avatar}
                  alt="حكاوي"
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-md shadow-amber-500/30 group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 rounded-full p-1 border-2 border-slate-900 shadow">
                  <Shield className="w-3.5 h-3.5 fill-slate-950" />
                </span>
              </div>

              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-slate-100 group-hover:text-amber-300 transition-colors">
                    رسائل حكاوي الرسمية
                  </h3>
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                    رسمي 🛡️
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-medium line-clamp-1">
                  {latestOfficialMsg ? latestOfficialMsg.text : 'التنبيهات والإشعارات الرسمية الصادرة من إدارة حكاوي'}
                </p>

                {latestOfficialMsg && (
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                    آخر رسالة: {new Date(latestOfficialMsg.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {unreadOfficialCount > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black animate-pulse">
                  {unreadOfficialCount} جديد
                </span>
              )}
              <span className="p-2 rounded-xl bg-slate-800 text-slate-300 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                ←
              </span>
            </div>
          </div>

          <input
            type="text"
            placeholder="ابحث عن مستخدم للمحادثة أو إضافة صديق..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 focus:border-amber-400 focus:outline-none text-slate-100 text-xs"
          />

          {/* Friends List */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-400">المحادثات والأصدقاء:</span>
            {filteredUsers.map(user => (
              <div
                key={user.id}
                onClick={() => setActivePartner(user)}
                className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/30 cursor-pointer flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700"
                      referrerPolicy="no-referrer"
                    />
                    {user.isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <UserRoleBadges user={user} size="sm" />
                      <h4 className="font-bold text-xs text-slate-100">{user.name}</h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block">@{user.username} • ID: <span className="text-amber-300 font-bold">{user.numericId || user.id}</span></span>
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleSendFriendRequest(user.id); }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-amber-500 text-slate-300 hover:text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                  title="إرسال طلب صداقة"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: OWNER/ADMIN OFFICIAL MESSAGE BROADCAST FORM */}
      {isOfficialModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/30">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-100">إرسال رسالة رسمية باسم "حكاوي"</h3>
                  <span className="text-[11px] text-amber-400 font-medium block">هوية النظام الرسمية - System Sender</span>
                </div>
              </div>

              <button
                onClick={() => setIsOfficialModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendOfficialBroadcast} className="flex flex-col gap-4">
              {/* Target Selection Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                  <span>تحديد الفئة المستهدفة للمستلمين:</span>
                  <span className="text-rose-400">*</span>
                </label>
                
                <select
                  value={officialTarget}
                  onChange={(e) => setOfficialTarget(e.target.value as OfficialMessageTarget)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-bold focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">👥 المستخدمين (جميع المستخدمين المسجلين بالمنصة)</option>
                  <option value="HOSTS">🎙️ المضيفين (جميع المضيفين المعتمدين والموثقين)</option>
                  <option value="AGENTS">🏢 الوكلاء (جميع وكلاء الشحن وأصحاب الوكالات)</option>
                  <option value="STAFF">💼 الموظفين (الموظفين والمشرفين في المنصة)</option>
                  <option value="ADMINS">👑 الإدارة (جميع أعضاء الإدارة والمالك)</option>
                  <option value="USER_SPECIFIC">👤 مستخدم محدد (اختيار مستخدم خاص بالإسم أو المعرف)</option>
                </select>
              </div>

              {/* User Specific selector if USER_SPECIFIC selected */}
              {officialTarget === 'USER_SPECIFIC' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-200">اختر المستخدم المستهدف:</label>
                  <select
                    value={officialTargetUserId}
                    onChange={(e) => setOfficialTargetUserId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-400 focus:outline-none"
                    required
                  >
                    <option value="">-- اختر مستخدماً من القائمة --</option>
                    {allUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} (@{u.username}) - ID: {u.numericId || u.id}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Message Text Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-slate-200 flex items-center justify-between">
                  <span>نص الرسالة الرسمية:</span>
                  <span className="text-[10px] text-amber-400">اسم المرسل الظاهر: حكاوي</span>
                </label>
                <textarea
                  rows={4}
                  value={officialText}
                  onChange={(e) => setOfficialText(e.target.value)}
                  placeholder="اكتب هنا نص الرسالة الرسمية التي ستصل صندوق رسائل المستلمين من حساب 'حكاوي'..."
                  className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 text-xs leading-relaxed focus:border-amber-400 focus:outline-none resize-none"
                  required
                />
              </div>

              {/* Informational Banner */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-[11px] text-amber-300 leading-relaxed flex items-start gap-2">
                <Shield className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <strong>ملاحظة نظامية:</strong> الرسالة ستصل إلى كافة المستلمين في الفئة المحددة باسم المرسل <strong>"حكاوي"</strong>. الرسالة تكون من طرف واحد فقط بدون إمكانية الرد المباشر.
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOfficialModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!officialText.trim() || isSendingOfficial || (officialTarget === 'USER_SPECIFIC' && !officialTargetUserId)}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSendingOfficial ? (
                    <span>جاري الإرسال...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4 rotate-180" />
                      <span>إرسال باسم حكاوي 📢</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
