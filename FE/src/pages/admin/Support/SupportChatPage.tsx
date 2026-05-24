import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from '../../../utils/axiosInstance';
import { useChatHub } from '../../../hooks/useChatHub';
import type { ChatConversationListItem, ChatMessage } from '../../../types/chat';
import AdminHeader from '../../../components/layout/admin/AdminHeader';

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
  const inputRef = useRef<HTMLInputElement | null>(null);
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
    if (!text || !selectedId || sending) return;
    setSending(true);
    try {
      await sendMessage(selectedId, text);
      setInput('');
      setTimeout(() => inputRef.current?.focus(), 0);
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
    <div className="flex flex-col h-full bg-background-light">
      <AdminHeader>
        <div className="flex items-center gap-4 flex-1">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-[#181114]">HỖ TRỢ TRỰC TUYẾN</h2>
          </div>
        </div>
      </AdminHeader>

      <div className="flex-1 overflow-hidden p-8">
        <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm overflow-hidden flex h-full">
          {/* Sidebar */}
          <aside className="w-[320px] shrink-0 bg-white border-r border-[#f4f0f2] flex flex-col">
            <div className="p-4 border-b border-[#f4f0f2] font-bold text-sm text-[#181114] uppercase tracking-wider">
              Danh sách hội thoại
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loadingList ? (
                <p className="p-4 text-sm text-[#886373] text-center mt-4">Đang tải…</p>
              ) : conversations.length === 0 ? (
                <p className="p-4 text-sm text-[#886373] text-center mt-4">Chưa có hội thoại nào.</p>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left px-4 py-4 border-b border-[#f4f0f2] hover:bg-primary/5 transition-all ${
                      selectedId === c.id ? 'bg-primary/5 relative' : ''
                    }`}
                  >
                    {selectedId === c.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                    )}
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 text-lg border border-primary/20">
                        {(c.learnerName || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-[#181114] truncate">{c.learnerName || c.learnerEmail}</span>
                          <span className="text-[10px] text-[#886373] font-medium whitespace-nowrap ml-2">
                            {formatTime(c.lastMessageAt).split(',')[1]?.trim() || formatTime(c.lastMessageAt)}
                          </span>
                        </div>
                        <div className="text-[12px] text-[#886373] truncate">
                          {c.lastMessagePreview || '—'}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          {/* Thread */}
          <section className="flex-1 flex flex-col min-w-0 bg-[#fafafa]">
            {!selected ? (
              <div className="flex-1 flex flex-col items-center justify-center text-[#886373] gap-4">
                <div className="size-20 rounded-full bg-white border border-[#f4f0f2] shadow-sm flex items-center justify-center">
                  <span className="material-symbols-outlined text-[32px] text-primary/40">forum</span>
                </div>
                <p className="font-medium">Chọn một hội thoại để xem tin nhắn</p>
              </div>
            ) : (
              <>
                <div className="shrink-0 h-[68px] px-6 flex items-center gap-3 bg-white border-b border-[#f4f0f2]">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                    {(selected.learnerName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <div className="font-bold text-sm text-[#181114]">{selected.learnerName}</div>
                    <div className="text-[11px] text-[#886373] font-medium">{selected.learnerEmail}</div>
                  </div>
                  <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">support_agent</span>
                    <span className="text-xs font-bold text-emerald-600">
                      Phụ trách: {selected.assignedAdminName}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
                  {messages.length > 0 && (
                    <button
                      type="button"
                      onClick={loadOlder}
                      disabled={loadingOlder}
                      className="text-xs font-bold text-primary hover:text-primary-dark transition-colors mx-auto block py-2 bg-primary/5 px-4 rounded-full"
                    >
                      {loadingOlder ? 'Đang tải…' : ''}
                    </button>
                  )}
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.isFromAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                          m.isFromAdmin
                            ? 'bg-primary text-white rounded-br-sm'
                            : 'bg-white text-[#181114] border border-[#f4f0f2] rounded-bl-sm'
                        }`}
                      >
                        {!m.isFromAdmin && (
                          <div className="text-[11px] font-bold text-primary mb-1">{m.senderName}</div>
                        )}
                        <p className="text-sm whitespace-pre-wrap wrap-break-word leading-relaxed">{m.content}</p>
                        <div
                          className={`text-[10px] mt-2 font-medium flex items-center gap-1 ${m.isFromAdmin ? 'text-white/80' : 'text-[#886373]'}`}
                        >
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
                      className="w-full rounded-full bg-[#f4f0f2] border-none pl-5 pr-12 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all text-[#181114]"
                      placeholder="Nhập tin nhắn hỗ trợ..."
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
                    className="rounded-full size-[44px] bg-primary text-white flex items-center justify-center disabled:opacity-50 hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 shrink-0"
                    title="Gửi tin nhắn"
                  >
                    <span className="material-symbols-outlined text-[20px] ml-1">send</span>
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default SupportChatPage;
