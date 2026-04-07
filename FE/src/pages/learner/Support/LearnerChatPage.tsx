import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import axiosInstance from '../../../utils/axiosInstance';
import { useChatHub } from '../../../hooks/useChatHub';
import type { ChatConversationListItem, ChatMessage } from '../../../types/chat';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
  } catch {
    return '';
  }
}

const LearnerChatPage: React.FC = () => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const loadThread = useCallback(async () => {
    const { data: list } = await axiosInstance.get<ChatConversationListItem[]>('/chat/conversations');
    if (list.length === 0) {
      setConversationId(null);
      setMessages([]);
      return;
    }
    const id = list[0].id;
    setConversationId(id);
    const { data: msgs } = await axiosInstance.get<ChatMessage[]>(`/chat/conversations/${id}/messages`, {
      params: { take: 50 },
    });
    setMessages(msgs);
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    loadThread().finally(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [loadThread]);

  const onReceiveMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    setConversationId(msg.conversationId);
  }, []);

  const { connected, joinConversation, sendMessage } = useChatHub({
    enabled: true,
    onReceiveMessage,
    onConversationUpdated: undefined,
  });

  useEffect(() => {
    if (!connected || !conversationId) return;
    joinConversation(conversationId);
  }, [connected, conversationId, joinConversation]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);

  useLayoutEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await sendMessage(conversationId ?? null, text);
      setInput('');
      // Focus will naturally remain on input, but we explicitly re-focus just in case
      setTimeout(() => inputRef.current?.focus(), 0);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-background-light font-['Lexend'] text-[#211118]">
      
      <LearnerHeader>
            <div className="flex items-center gap-191">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex flex-col">
                      <h2 className="text-xl font-bold text-[#181114] uppercase"> CHAT HỖ TRỢ </h2>
                  </div>
                </div>
            </div>
      </LearnerHeader>

      <div className="flex-1 p-8 flex overflow-hidden flex-col min-h-0 h-[calc(100vh-100px)]">
        <div className="rounded-2xl border border-[#f4f0f2] bg-white shadow-sm overflow-hidden flex flex-col flex-1 min-h-0 w-full max-w-8xl mx-auto">
            <div className="shrink-0 h-[72px] px-6 flex items-center justify-between border-b border-[#f4f0f2] bg-white">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-[#f287ae]/10 flex items-center justify-center text-[#f287ae] font-bold border border-[#f287ae]/20">
                  <span className="material-symbols-outlined text-[24px]">support_agent</span>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-lg font-bold text-[#181114]">Chat hỗ trợ trực tuyến</h1>
                  <p className="text-xs text-[#886373] font-medium">Trò chuyện trực tiếp với đội ngũ quản trị</p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-[#886373] gap-4 bg-[#fafafa] min-h-0">
                <div className="size-16 rounded-full bg-white border border-[#f4f0f2] shadow-sm flex items-center justify-center animate-pulse">
                  <span className="material-symbols-outlined text-[28px] text-[#f287ae]/40">forum</span>
                </div>
                <p className="font-medium text-sm">Đang tải cuộc trò chuyện…</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 bg-[#fafafa]">
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                      <div className="size-20 rounded-full bg-white border border-[#f4f0f2] shadow-sm flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-[32px] text-[#f287ae]/40">chat_bubble</span>
                      </div>
                      <p className="text-[#181114] font-bold mb-1">Bắt đầu cuộc hội thoại</p>
                      <p className="text-sm text-[#886373] max-w-sm">
                        Gửi tin nhắn đầu tiên để bắt đầu. Hệ thống sẽ tự động kết nối bạn với admin hỗ trợ gần nhất.
                      </p>
                    </div>
                  )}
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.isFromAdmin ? 'justify-start' : 'justify-end'}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                          m.isFromAdmin
                            ? 'bg-white border border-[#f4f0f2] text-[#181114] rounded-bl-sm'
                            : 'bg-[#f287ae] text-white rounded-br-sm'
                        }`}
                      >
                        {m.isFromAdmin && (
                          <div className="text-[11px] font-bold text-[#f287ae] mb-1">{m.senderName}</div>
                        )}
                        <p className="text-sm whitespace-pre-wrap wrap-break-word leading-relaxed">{m.content}</p>
                        <div className={`text-[10px] mt-2 font-medium flex items-center gap-1 ${m.isFromAdmin ? 'text-[#886373]' : 'text-white/80'}`}>
                          {formatTime(m.sentAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <div className="shrink-0 p-4 bg-white border-t border-[#f4f0f2] flex gap-3 items-center">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      className="w-full rounded-full bg-[#f4f0f2] border-none pl-5 pr-12 py-3.5 text-sm outline-none focus:ring-2 focus:ring-[#f287ae]/20 transition-all text-[#181114]"
                      placeholder="Nhập nội dung cần hỗ trợ…"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      disabled={!connected || sending}
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!connected || sending || !input.trim()}
                    className="rounded-full size-[48px] bg-[#f287ae] text-white flex items-center justify-center disabled:opacity-50 hover:bg-[#e06b96] transition-colors shadow-lg shadow-[#f287ae]/20 shrink-0"
                    title="Gửi tin nhắn"
                  >
                    <span className="material-symbols-outlined text-[20px] ml-1">send</span>
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LearnerChatPage;
