import React, { useLayoutEffect, useRef, useState } from 'react';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import { TutorAiService, type TutorChatMessage } from '../../../services/Learner/tutorAiService';

const AiTutorPage: React.FC = () => {
  const [messages, setMessages] = useState<TutorChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setError(null);
    const userMsg: TutorChatMessage = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setSending(true);
    try {
      const reply = await TutorAiService.chat(history);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Không nhận được phản hồi. Kiểm tra Ollama đang chạy và model trong appsettings.';
      setError(msg);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-background-light font-['Lexend'] text-[#211118]">
      <LearnerHeader>
        <div className="flex items-center gap-4 flex-1">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-[#181114] uppercase">Trợ lý AI (Ollama)</h2>
            <p className="text-xs text-[#886373] font-medium">Hỏi ngữ pháp, từ vựng, hoặc dán đoạn cần sửa</p>
          </div>
        </div>
      </LearnerHeader>

      <div className="flex-1 p-8 flex overflow-hidden flex-col min-h-0 h-[calc(100vh-100px)]">
        <div className="rounded-2xl border border-[#f4f0f2] bg-white shadow-sm overflow-hidden flex flex-col flex-1 min-h-0 w-full max-w-4xl mx-auto">
          <div className="shrink-0 px-6 py-4 border-b border-[#f4f0f2] bg-violet-50/50">
            <p className="text-xs text-[#5b4d6a] leading-relaxed">
              Trợ lý chạy trên model local; có thể nhầm. Đáp án bài tập trên hệ thống luôn là chuẩn. Khác với{' '}
              <span className="font-bold">Chat hỗ trợ</span> (nói chuyện với admin).
            </p>
          </div>

          <div className="flex-1 flex flex-col min-h-0 bg-[#fafafa]">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 py-12">
                  <div className="size-20 rounded-full bg-white border border-violet-100 shadow-sm flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-[32px] text-violet-400">smart_toy</span>
                  </div>
                  <p className="text-[#181114] font-bold mb-1">Hỏi trợ lý tiếng Nhật</p>
                  <p className="text-sm text-[#886373] max-w-md">
                    Ví dụ: giải thích trợ từ は/が, sửa câu bạn viết, hoặc dán đoạn văn cần góp ý.
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                      m.role === 'user'
                        ? 'bg-violet-600 text-white rounded-br-sm'
                        : 'bg-white border border-[#f4f0f2] text-[#181114] rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap wrap-break-word leading-relaxed">{m.content}</p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3 bg-white border border-[#f4f0f2] text-[#886373] text-sm">
                    Đang suy nghĩ…
                  </div>
                </div>
              )}
              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-sm px-4 py-3">
                  {error}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="shrink-0 p-4 bg-white border-t border-[#f4f0f2] flex flex-col gap-3">
              <textarea
                className="w-full rounded-2xl bg-[#f4f0f2] border-none px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-300/40 transition-all text-[#181114] min-h-[88px] resize-y max-h-48"
                placeholder="Nhập câu hỏi hoặc dán đoạn văn…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="rounded-full px-8 py-3 bg-violet-600 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/20"
                >
                  Gửi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiTutorPage;
