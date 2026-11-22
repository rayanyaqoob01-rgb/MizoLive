import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  Gift,
  ImagePlus,
  MessageCircle,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Send,
  SlidersHorizontal,
  Swords,
  Video,
  X,
} from 'lucide-react';
import { SafeImage } from '../components/Cards';
import { AppHeader } from '../components/Header';
import { LevelBadge } from '../components/LevelBadge';
import { MizoAppIcon } from '../components/MizoLogo';
import { UserInfoTarget } from '../components/UserInfoModal';
import { CallRecord, InboxItem, InboxTab, NotificationPrefs } from '../types/mizo';

interface InboxScreenProps {
  items: InboxItem[];
  callHistory: CallRecord[];
  notificationPrefs: NotificationPrefs;
  initialTab?: InboxTab;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onAcceptRequest: (id: string) => void;
  onDeclineRequest: (id: string) => void;
  onSendMessage: (itemId: string, text: string, imageUrl?: string) => void;
  onStartCall: (
    peerName: string,
    peerAvatar: string,
    peerLevel: number,
    callType: 'audio' | 'video'
  ) => void;
  onUpdateNotifPrefs: (next: NotificationPrefs) => void;
  onOpenUserInfo: (user: UserInfoTarget) => void;
}

const INBOX_TABS: InboxTab[] = ['All', 'Messages', 'Requests', 'Notifications', 'Calls'];

export const InboxScreen: React.FC<InboxScreenProps> = ({
  items,
  callHistory,
  notificationPrefs,
  initialTab = 'All',
  onMarkRead,
  onMarkAllRead,
  onAcceptRequest,
  onDeclineRequest,
  onSendMessage,
  onStartCall,
  onUpdateNotifPrefs,
  onOpenUserInfo,
}) => {
  const [activeTab, setActiveTab] = useState<InboxTab>(initialTab);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [prefsOpen, setPrefsOpen] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  const activeThread = items.find((i) => i.id === activeThreadId) || null;
  const q = searchQuery.trim().toLowerCase();

  const filteredItems = items.filter((item) => {
    if (activeTab === 'Messages' && item.type !== 'message') return false;
    if (activeTab === 'Requests' && item.type !== 'request') return false;
    if (activeTab === 'Notifications' && item.type !== 'notification') return false;
    if (!q) return true;
    return (
      item.senderName.toLowerCase().includes(q) ||
      item.preview.toLowerCase().includes(q)
    );
  });

  const filteredCalls = callHistory.filter((c) => {
    if (!q) return true;
    return c.peerName.toLowerCase().includes(q);
  });

  const handleOpenItem = (item: InboxItem) => {
    onMarkRead(item.id);
    if (item.type === 'message' || item.type === 'request') {
      setActiveThreadId(item.id);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !replyText.trim()) return;
    onSendMessage(activeThread.id, replyText.trim());
    setReplyText('');
  };

  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeThread) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onSendMessage(activeThread.id, 'Shared a photo', reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  /* Active Chat Thread View with Audio Call, Video Call, Image Share & Message Status */
  if (activeThread) {
    return (
      <div className="min-h-screen flex flex-col pb-24">
        <header className="sticky top-0 z-30 bg-[#06040B]/95 backdrop-blur-xl border-b border-purple-500/20 pt-safe">
          <div className="max-w-4xl mx-auto px-4 h-[56px] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setActiveThreadId(null)}
                aria-label="Back to Chat"
                className="min-w-[40px] min-h-[40px] -ml-2 flex items-center justify-center rounded-xl text-slate-200 hover:text-white hover:bg-white/5"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() =>
                  onOpenUserInfo({
                    name: activeThread.senderName,
                    avatar: activeThread.avatar || '',
                    level: activeThread.senderLevel || 24,
                  })
                }
                className="flex items-center gap-2.5 min-w-0 text-left"
              >
                {activeThread.avatar ? (
                  <SafeImage
                    src={activeThread.avatar}
                    alt={activeThread.senderName}
                    className="w-9 h-9 rounded-full object-cover border border-amber-400/60 shrink-0"
                  />
                ) : (
                  <MizoAppIcon size={36} />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-display font-bold text-white truncate">
                      {activeThread.senderName}
                    </h2>
                    {activeThread.senderLevel && (
                      <LevelBadge level={activeThread.senderLevel} size="xs" />
                    )}
                  </div>
                  <p className="text-[11px] text-emerald-300">Active on Mizo Live</p>
                </div>
              </button>
            </div>

            {/* Conversation Header AUDIO CALL & VIDEO CALL Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() =>
                  onStartCall(
                    activeThread.senderName,
                    activeThread.avatar || '',
                    activeThread.senderLevel || 24,
                    'audio'
                  )
                }
                aria-label={`Audio Call ${activeThread.senderName}`}
                className="min-w-[40px] min-h-[40px] px-2.5 rounded-xl bg-purple-800/70 hover:bg-purple-700 border border-purple-400/40 text-amber-300 inline-flex items-center justify-center gap-1 text-xs font-bold"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Audio</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onStartCall(
                    activeThread.senderName,
                    activeThread.avatar || '',
                    activeThread.senderLevel || 24,
                    'video'
                  )
                }
                aria-label={`Video Call ${activeThread.senderName}`}
                className="min-w-[40px] min-h-[40px] px-2.5 rounded-xl mizo-gold-gradient text-[#1E0B3B] inline-flex items-center justify-center gap-1 text-xs font-extrabold shadow"
              >
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">Video</span>
              </button>
            </div>
          </div>
        </header>

        {activeThread.type === 'request' && (
          <div className="max-w-4xl w-full mx-auto px-4 pt-3">
            <div className="rounded-2xl bg-[#180D31] border border-amber-400/40 p-3 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-200">
                Message request from <span className="font-bold text-white">{activeThread.senderName}</span>
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onDeclineRequest(activeThread.id);
                    setActiveThreadId(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-bold text-slate-200"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => onAcceptRequest(activeThread.id)}
                  className="px-3 py-1.5 rounded-xl mizo-gold-gradient text-[#1E0B3B] text-xs font-extrabold"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 space-y-3 overflow-y-auto">
          {(activeThread.messages || []).map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm space-y-1.5 ${
                  msg.sender === 'me'
                    ? 'mizo-purple-gradient text-white rounded-br-sm border border-purple-300/30'
                    : 'bg-[#170E2B] text-slate-100 rounded-bl-sm border border-purple-500/25'
                }`}
              >
                {msg.imageUrl && (
                  <img
                    src={msg.imageUrl}
                    alt="Shared attachment"
                    className="rounded-xl max-h-52 w-auto object-cover border border-white/15"
                  />
                )}
                <p>{msg.text}</p>
                <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-300/75">
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'me' && (
                    <span className="text-amber-300 font-semibold">
                      · {msg.status || 'Delivered'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSendReply}
          className="sticky bottom-[66px] max-w-4xl w-full mx-auto px-4 py-3 bg-[#06040B]/95 border-t border-purple-500/20 flex items-center gap-2"
        >
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            aria-label="Share image in chat"
            className="w-10 h-10 rounded-full bg-[#150C28] border border-purple-500/35 text-amber-300 flex items-center justify-center shrink-0 hover:border-amber-400"
          >
            <ImagePlus className="w-4 h-4" />
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handlePickImage}
            className="hidden"
          />

          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Message ${activeThread.senderName}...`}
            className="flex-1 h-11 px-4 rounded-full bg-[#150C28] border border-purple-500/35 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            aria-label="Send message"
            className="w-11 h-11 rounded-full mizo-gold-gradient text-[#1E0B3B] flex items-center justify-center shrink-0 active:scale-95 transition-transform"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <AppHeader
        title="Chat"
        showSearch
        searchOpen={searchOpen}
        searchValue={searchQuery}
        onToggleSearch={() => {
          setSearchOpen((prev) => !prev);
          if (searchOpen) setSearchQuery('');
        }}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search conversations or notifications..."
        rightSlot={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onMarkAllRead}
              title="Mark all as read"
              aria-label="Mark all as read"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-200 hover:text-amber-300 hover:bg-white/5 transition-colors"
            >
              <CheckCheck className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setPrefsOpen(true)}
              title="Notification Preferences"
              aria-label="Notification Preferences"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-200 hover:text-amber-300 hover:bg-white/5 transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
        }
      />

      <main className="max-w-4xl mx-auto px-4 pt-3 space-y-4">
        {/* Tabs: All / Messages / Requests / Notifications / Calls */}
        <div
          role="tablist"
          aria-label="Chat filter tabs"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1"
        >
          {INBOX_TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab)}
                className={`min-h-[38px] px-4 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                  active
                    ? 'mizo-gold-gradient text-[#1E0B3B] shadow-md'
                    : 'bg-[#150C28] text-slate-300 border border-purple-500/25 hover:text-white'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Calls Tab: Call History & Missed Calls */}
        {activeTab === 'Calls' ? (
          <div className="divide-y divide-purple-500/15 rounded-2xl mizo-royal-card overflow-hidden">
            {filteredCalls.length === 0 ? (
              <div className="p-8 text-center">
                <PhoneCall className="w-8 h-8 text-purple-400 mx-auto mb-2 opacity-75" />
                <p className="text-sm font-semibold text-white">No call history yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Open any conversation and tap Audio or Video Call.
                </p>
              </div>
            ) : (
              filteredCalls.map((c) => (
                <div
                  key={c.id}
                  className="px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <SafeImage
                      src={c.peerAvatar}
                      alt={c.peerName}
                      className="w-11 h-11 rounded-full object-cover border border-amber-400/50 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white truncate">
                          {c.peerName}
                        </span>
                        <LevelBadge level={c.peerLevel} size="xs" />
                      </div>
                      <p className="text-xs text-slate-300 inline-flex items-center gap-1 mt-0.5">
                        {c.direction === 'missed' ? (
                          <PhoneMissed className="w-3.5 h-3.5 text-rose-400" />
                        ) : c.direction === 'incoming' ? (
                          <PhoneIncoming className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <PhoneOutgoing className="w-3.5 h-3.5 text-amber-300" />
                        )}
                        <span className={c.direction === 'missed' ? 'text-rose-300' : ''}>
                          {c.direction === 'missed'
                            ? `Missed ${c.callType} call`
                            : `${c.callType === 'video' ? 'Video' : 'Audio'} · ${c.durationDisplay}`}
                        </span>
                        <span>· {c.timestamp}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onStartCall(c.peerName, c.peerAvatar, c.peerLevel, 'audio')
                      }
                      aria-label={`Audio call ${c.peerName}`}
                      className="w-9 h-9 rounded-xl bg-purple-800/60 border border-purple-400/35 text-amber-300 flex items-center justify-center"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onStartCall(c.peerName, c.peerAvatar, c.peerLevel, 'video')
                      }
                      aria-label={`Video call ${c.peerName}`}
                      className="w-9 h-9 rounded-xl mizo-gold-gradient text-[#1E0B3B] flex items-center justify-center"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="mizo-royal-card rounded-2xl p-8 text-center">
            <MessageCircle className="w-8 h-8 text-purple-400 mx-auto mb-2 opacity-75" />
            <p className="text-sm font-semibold text-white">Nothing here yet</p>
            <p className="text-xs text-slate-400 mt-1">
              New messages, requests, and notifications will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-purple-500/15 rounded-2xl mizo-royal-card overflow-hidden">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="w-full min-h-[74px] px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => handleOpenItem(item)}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left"
                >
                  {item.avatar ? (
                    <SafeImage
                      src={item.avatar}
                      alt={item.senderName}
                      className="w-12 h-12 rounded-full object-cover border border-amber-400/50 shrink-0"
                    />
                  ) : item.iconType === 'gift' ? (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fuchsia-600 to-amber-500 flex items-center justify-center shrink-0 shadow-md">
                      <Gift className="w-6 h-6 text-white" />
                    </div>
                  ) : item.iconType === 'pk' ? (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-700 to-fuchsia-600 flex items-center justify-center shrink-0 shadow-md">
                      <Swords className="w-6 h-6 text-amber-300" />
                    </div>
                  ) : item.iconType === 'call' ? (
                    <div className="w-12 h-12 rounded-full bg-rose-600/80 flex items-center justify-center shrink-0 shadow-md">
                      <PhoneMissed className="w-6 h-6 text-white" />
                    </div>
                  ) : item.iconType === 'mizo' ? (
                    <MizoAppIcon size={48} className="rounded-full" />
                  ) : (
                    <div className="w-12 h-12 rounded-full mizo-gold-gradient flex items-center justify-center shrink-0 shadow-md">
                      <Bell className="w-6 h-6 text-[#1E0B3B]" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-display font-bold text-white truncate">
                        {item.senderName}
                      </span>
                      {item.senderLevel && (
                        <LevelBadge level={item.senderLevel} size="xs" />
                      )}
                      {item.type === 'request' && (
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded">
                          Request
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 truncate mt-0.5">{item.preview}</p>
                  </div>
                </button>

                {item.type === 'request' ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onDeclineRequest(item.id)}
                      aria-label={`Decline ${item.senderName}`}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-rose-600/50 text-slate-200 flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onAcceptRequest(item.id)}
                      aria-label={`Accept ${item.senderName}`}
                      className="w-8 h-8 rounded-lg mizo-gold-gradient text-[#1E0B3B] flex items-center justify-center"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">
                      {item.timestamp}
                    </span>
                    {item.unreadCount > 0 ? (
                      <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center font-mono-num">
                        {item.unreadCount}
                      </span>
                    ) : (
                      <span className="h-[20px]" aria-hidden="true" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Notification Preferences Modal */}
      {prefsOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Notification Preferences"
        >
          <div className="w-full max-w-sm rounded-3xl mizo-royal-card p-5 space-y-4 border border-purple-400/40">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-white">
                Notification Preferences
              </h3>
              <button
                type="button"
                onClick={() => setPrefsOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {(
                [
                  ['messages', 'Private Messages'],
                  ['calls', 'Incoming & Missed Calls'],
                  ['live', 'Followed Creator Live'],
                  ['rooms', 'Room Invites'],
                  ['pk', 'PK Challenges'],
                  ['gifts', 'Received Gifts'],
                  ['follows', 'New Followers'],
                  ['system', 'System Alerts'],
                ] as const
              ).map(([key, label]) => {
                const enabled = notificationPrefs[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      onUpdateNotifPrefs({ ...notificationPrefs, [key]: !enabled })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#160B2C] border border-purple-500/20 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-white">{label}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        enabled
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {enabled ? 'ON' : 'OFF'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
