import React, { useState, useEffect, useRef } from 'react';
import { Send, CalendarPlus, MessageSquare, Users, FolderKanban } from 'lucide-react';
import { ChatRoom, ChatMessage } from '../../types';
import { subscribeToChatMessages, sendChatMessage } from '../../firebase/socialService';
import { useApp } from '../../context/AppContext';

interface ChatPanelProps {
  room: ChatRoom;
  compactHeader?: boolean;
  onProposeEvent?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  room,
  compactHeader = false,
  onProposeEvent,
}) => {
  const { user, userProfile, getProfile, getUserLabel } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!room?.id) return;
    const unsub = subscribeToChatMessages(room.id, setMessages);
    return () => unsub();
  }, [room.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const getRoomTitle = (): string => {
    if (room.type === 'dm') {
      const otherUid = room.participantIds.find((id) => id !== user?.uid);
      return getUserLabel(otherUid);
    }
    return room.title || 'Chat';
  };

  const getRoomSubtitle = (): string => {
    if (room.type === 'dm') {
      const otherUid = room.participantIds.find((id) => id !== user?.uid);
      const prof = getProfile(otherUid);
      return prof ? `@${prof.username}` : 'Direktnachricht';
    }
    return `${room.participantIds.length} Teilnehmer`;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim() || sending) return;
    setSending(true);
    try {
      await sendChatMessage({
        chatId: room.id,
        senderId: user.uid,
        senderName: userProfile?.displayName || userProfile?.username || user.displayName || 'Ich',
        text,
      });
      setText('');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-[#e2e8e3] overflow-hidden shadow-xs">
      {/* Chat Header */}
      {!compactHeader && (
        <div className="px-4 py-3 border-b border-[#e2e8e3] bg-[#fafcfa] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#edf5f0] border border-[#cfe0d5] text-[#174e36] flex items-center justify-center shrink-0">
              {room.type === 'project' ? (
                <FolderKanban className="w-4 h-4" />
              ) : room.type === 'group' ? (
                <Users className="w-4 h-4" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[#171c19] truncate">{getRoomTitle()}</h3>
              <p className="text-[11px] text-[#52645a] truncate">{getRoomSubtitle()}</p>
            </div>
          </div>

          {onProposeEvent && (
            <button
              type="button"
              onClick={onProposeEvent}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#edf5f0] hover:bg-[#174e36] text-[#174e36] hover:text-white border border-[#cfe0d5] rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0"
              title="Gemeinsamen Termin vorschlagen"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Termin vorschlagen</span>
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8faf8]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-8 text-[#6b7d72]">
            <MessageSquare className="w-8 h-8 text-[#9bb0a3] mb-2" />
            <p className="text-xs font-semibold text-[#171c19]">Noch keine Nachrichten</p>
            <p className="text-[11px] mt-0.5">
              Starte die Unterhaltung oder schlage direkt einen Termin vor.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === user?.uid;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                {!isMine && (
                  <span className="text-[10px] font-semibold text-[#52645a] mb-0.5 px-1">
                    {msg.senderName || getUserLabel(msg.senderId)}
                  </span>
                )}
                <div
                  className={`max-w-[80%] sm:max-w-[70%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-xs ${
                    isMine
                      ? 'bg-[#174e36] text-white rounded-br-sm'
                      : 'bg-white text-[#171c19] border border-[#e2e8e3] rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      isMine ? 'text-[#a8e2c4]' : 'text-[#7d8e84]'
                    }`}
                  >
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-white border-t border-[#e2e8e3] flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nachricht schreiben..."
          className="flex-1 px-3.5 py-2 text-xs bg-[#f8faf8] border border-[#d8e2db] focus:border-[#174e36] focus:bg-white rounded-xl text-[#171c19] placeholder-[#7d8e84] outline-none transition-all"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="p-2.5 bg-[#174e36] hover:bg-[#12402c] disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer shrink-0 shadow-xs"
          aria-label="Senden"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
