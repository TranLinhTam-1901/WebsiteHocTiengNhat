import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const SupportChatPage: React.FC = () => {
  const [conversations, setConversations] = useState<ChatConversationListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const prevJoined = useRef<string | null>(null);

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  const loadConversations = useCallback(async () => {
    const { data } = await axiosInstance.get<ChatConversationListItem[]>('/chat/conversations');
    setConversations(data);
    return data;
  }, []);

  useEffect(() => {
    let alive = true;
    setLoadingList(true);
    loadConversations()
      .then((data) => {
        if (!alive) return;
        if (data.length && !selectedId) setSelectedId(data[0].id);
      })
      .finally(() => {
        if (alive) setLoadingList(false);
      });
    return () => {
      alive = false;
    };
  }, [loadConversations]);

  const loadMessages = useCallback(
    async (conversationId: string, before?: string) => {
      const params: Record<string, string | number> = { take: 40 };
      if (before) params.before = before;
      const { data } = await axiosInstance.get<ChatMessage[]>(
        `/chat/conversations/${conversationId}/messages`,
        { params }
      );
      return data;
    },
    []
  );

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    let alive = true;
    loadMessages(selectedId).then((data) => {
      if (alive) setMessages(data);
    });
    return () => {
      alive = false;
    };
  }, [selectedId, loadMessages]);

  const onReceiveMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      if (msg.conversationId !== selectedId) return prev;
      return [...prev, msg];
    });
  }, [selectedId]);

  const onConversationUpdated = useCallback((preview: ChatConversationListItem) => {
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.id === preview.id);
      const next = [...prev];
      if (idx >= 0) next[idx] = preview;
      else next.push(preview);
      return next.sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
    });
  }, []);

  const { connected, joinConversation, leaveConversation, sendMessage } = useChatHub({
    enabled: true,
    onReceiveMessage,
    onConversationUpdated,
  });

  useEffect(() => {
    if (!connected || !selectedId) return;
    const run = async () => {
      if (prevJoined.current && prevJoined.current !== selectedId) {
        await leaveConversation(prevJoined.current);
      }
      await joinConversation(selectedId);
      prevJoined.current = selectedId;
    };
    run();
  }, [connected, selectedId, joinConversation, leaveConversation]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !selectedId || sending) return;
    setSending(true);
    try {
      await sendMessage(selectedId, text);
      setInput('');
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const loadOlder = async () => {
    if (!selectedId || loadingOlder || messages.length === 0) return;
    setLoadingOlder(true);
    try {
      const oldest = messages[0];
      const older = await loadMessages(selectedId, oldest.id);
      setMessages((prev) => [...older.filter((m) => !prev.some((p) => p.id === m.id)), ...prev]);
    } finally {
      setLoadingOlder(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] min-h-[520px] -m-8 bg-[#f0f2f5]">
      <header className="shrink-0 px-8 py-4 border-b border-[#e4e6eb] bg-white">
        <h1 className="text-xl font-bold text-[#181114]">Hỗ trợ trực tuyến</h1>
        <p className="text-sm text-[#886373]">Tất cả hội thoại từ học viên — giống giao diện Messenger</p>
      </header>

      <div className="flex flex-1 min-h-0 border-t border-[#e4e6eb]">
        {/* Sidebar */}
        <aside className="w-[320px] shrink-0 bg-white border-r border-[#e4e6eb] flex flex-col">
          <div className="p-3 border-b border-[#e4e6eb] font-semibold text-sm text-[#65676b]">Hội thoại</div>
          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <p className="p-4 text-sm text-[#886373]">Đang tải…</p>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-sm text-[#886373]">Chưa có hội thoại nào.</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left px-3 py-3 border-b border-[#f0f2f5] hover:bg-[#f5f6f7] transition-colors ${
                    selectedId === c.id ? 'bg-[#e7f3ff]' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="size-12 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-white font-bold shrink-0">
                      {(c.learnerName || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[#181114] truncate">{c.learnerName || c.learnerEmail}</div>
                      <div className="text-xs text-[#65676b] truncate">{c.lastMessagePreview || '—'}</div>
                      <div className="text-[10px] text-[#b0b3b8] mt-0.5">{formatTime(c.lastMessageAt)}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Thread */}
        <section className="flex-1 flex flex-col min-w-0 bg-[#f0f2f5]">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-[#65676b]">Chọn một hội thoại</div>
          ) : (
            <>
              <div className="shrink-0 h-14 px-4 flex items-center gap-3 bg-white border-b border-[#e4e6eb] shadow-sm">
                <div className="size-10 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-white font-bold">
                  {(selected.learnerName || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-[#181114]">{selected.learnerName}</div>
                  <div className="text-xs text-[#65676b]">{selected.learnerEmail}</div>
                </div>
                <span className="ml-auto text-xs text-[#65676b]">
                  Admin phụ trách (RR): {selected.assignedAdminName}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={loadOlder}
                    disabled={loadingOlder}
                    className="text-xs text-primary mx-auto block py-1"
                  >
                    {loadingOlder ? 'Đang tải…' : 'Tải tin nhắn cũ hơn'}
                  </button>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.isFromAdmin ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[72%] rounded-2xl px-3 py-2 shadow-sm ${
                        m.isFromAdmin
                          ? 'bg-primary text-white rounded-br-sm'
                          : 'bg-white text-[#181114] border border-[#e4e6eb] rounded-bl-sm'
                      }`}
                    >
                      {!m.isFromAdmin && (
                        <div className="text-[10px] font-semibold text-primary mb-0.5">{m.senderName}</div>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                      <div
                        className={`text-[10px] mt-1 ${m.isFromAdmin ? 'text-white/80' : 'text-[#65676b]'}`}
                      >
                        {formatTime(m.sentAt)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="shrink-0 p-3 bg-white border-t border-[#e4e6eb] flex gap-2">
                <input
                  className="flex-1 rounded-full border border-[#e4e6eb] px-4 py-2 text-sm outline-none focus:border-primary"
                  placeholder="Nhập tin nhắn…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  disabled={!connected || sending}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!connected || sending || !input.trim()}
                  className="rounded-full bg-primary text-white px-5 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Gửi
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default SupportChatPage;
