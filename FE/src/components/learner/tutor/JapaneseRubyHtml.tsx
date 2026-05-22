import React, { useEffect, useState, useMemo } from 'react';
import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';
import windowPath from 'path-browserify';

if (typeof window !== 'undefined') {
  (window as any).path = windowPath;
}

/** Dict kuromoji: mặc định CDN (gzip hợp lệ). `public/dict` chỉ dùng khi set VITE_KUROMOJI_DICT_URL (ví dụ deploy đủ static). */
const DEFAULT_KUROMOJI_DICT_CDN = 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/';

function getKuromojiDictPath(): string {
  const fromEnv = import.meta.env.VITE_KUROMOJI_DICT_URL?.trim();
  if (fromEnv) return fromEnv.endsWith('/') ? fromEnv : `${fromEnv}/`;
  return DEFAULT_KUROMOJI_DICT_CDN;
}

// Singleton instance để không init lại nhiều lần
let kuroshiroInstance: Kuroshiro | null = null;
let initPromise: Promise<Kuroshiro> | null = null;

function getKuroshiro(): Promise<Kuroshiro> {
  if (kuroshiroInstance) return Promise.resolve(kuroshiroInstance);
  
  if (!initPromise) {
    const k = new Kuroshiro();
    const dictPath = getKuromojiDictPath();
    const analyzer = new KuromojiAnalyzer({
      dictPath,
    });

    initPromise = k.init(analyzer)
      .then(() => {
        kuroshiroInstance = k;
        console.log("✅ Kuroshiro ready!");
        return k;
      })
      .catch((err) => {
        initPromise = null; // Reset để có thể thử lại nếu lỗi
        console.error("❌ Kuroshiro init failed:", err);
        throw err;
      });
  }
  return initPromise;
}

type Props = {
  text: string;
  className?: string;
};

const JapaneseRubyHtml: React.FC<Props> = ({ text, className = '' }) => {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Memoize bản gốc để tránh xss khi chưa convert xong
  const safeOriginalText = useMemo(() => escapeHtml(text), [text]);

  useEffect(() => {
    const t = text.trim();
    if (!t) {
      setHtml('');
      setLoading(false);
      return;
    }

    let isCancelled = false;
    setLoading(true);

    getKuroshiro()
      .then(async (k) => {
        // Sử dụng 'as any' hoặc 'never' cho options nếu type definition bị cũ
        const out = await k.convert(t, { to: 'hiragana', mode: 'furigana' } as any);
        if (!isCancelled) {
          setHtml(out);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Convert error:", err);
        if (!isCancelled) {
          setHtml(`<span>${safeOriginalText}</span>`);
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [text, safeOriginalText]);

  if (!text.trim()) return null;

  return (
    <div
      className={`text-[18px] leading-relaxed [&_rt]:text-[0.65em] [&_rt]:text-[#886373] [&_rt]:font-medium ${className} ${loading ? 'opacity-50' : 'opacity-100 transition-opacity'}`}
      dangerouslySetInnerHTML={{ 
        __html: html || `<span>${safeOriginalText}</span>` 
      }}
    />
  );
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default JapaneseRubyHtml;