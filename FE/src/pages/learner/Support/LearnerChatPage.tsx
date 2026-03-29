import React, { useCallback, useEffect, useRef, useState } from 'react';
import axiosInstance from '../../../utils/axiosInstance';
import { useChatHub } from '../../../hooks/useChatHub';
import type { ChatConversationListItem, ChatMessage } from '../../../types/chat';

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

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await sendMessage(conversationId ?? null, text);
      setInput('');
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#f4f0f2] bg-white shadow-sm overflow-hidden flex flex-col min-h-[560px] max-w-3xl">
      <div className="px-6 py-4 border-b border-[#f4f0f2] bg-[#f287ae]/5">
        <h1 className="text-lg font-bold text-[#181114]">Chat hỗ trợ</h1>
        <p className="text-sm text-[#886373]">Bạn chỉ trò chuyện với đội ngũ quản trị. Tin nhắn được lưu và trả lời theo thời gian thực.</p>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center p-8 text-[#886373]">Đang tải…</div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-[#fafafa]">
            {messages.length === 0 && (
              <p className="text-center text-sm text-[#886373] py-8">
                Gửi tin nhắn đầu tiên để bắt đầu — hệ thống sẽ tạo hội thoại và phân admin hỗ trợ (Round Robin).
              </p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.isFromAdmin ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-sm ${
                    m.isFromAdmin
                      ? 'bg-white border border-[#e4e6eb] text-[#181114] rounded-bl-sm'
                      : 'bg-[#f287ae] text-white rounded-br-sm'
                  }`}
                >
                  {m.isFromAdmin && (
                    <div className="text-[10px] font-semibold text-[#f287ae] mb-0.5">{m.senderName}</div>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                  <div className={`text-[10px] mt-1 ${m.isFromAdmin ? 'text-[#65676b]' : 'text-white/85'}`}>
                    {formatTime(m.sentAt)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 border-t border-[#f4f0f2] flex gap-2 bg-white">
            <input
              className="flex-1 rounded-full border border-[#e4e6eb] px-4 py-2.5 text-sm outline-none focus:border-[#f287ae]"
              placeholder="Nhập nội dung cần hỗ trợ…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              disabled={!connected || sending}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!connected || sending || !input.trim()}
              className="rounded-full bg-[#f287ae] text-white px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              Gửi
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default LearnerChatPage;
