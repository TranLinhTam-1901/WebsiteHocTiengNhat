export function pickJapaneseVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | undefined {
  const norm = (lang: string) => lang?.toLowerCase().replace(/_/g, '-') || '';
  return (
    voices.find((v) => norm(v.lang) === 'ja-jp') ||
    voices.find((v) => norm(v.lang).startsWith('ja')) ||
    voices.find((v) =>
      /日本|japanese|nihongo|kyoto|osaka|tokyo|sayuri|kyoko|haruka|naoki|google.*ja/i.test(
        `${v.name} ${v.lang}`
      )
    )
  );
}

export function firstReadingChunk(raw?: string | null): string {
  const s = raw?.trim();
  if (!s || s === '—') return '';
  const part = s
    .split(/[、，,\s/／]+/)
    .map((x) => x.trim())
    .find(Boolean);
  return part || s;
}

/** Chuẩn hóa chuỗi trước khi TTS: bỏ furigana trong ngoặc, ký tự thừa. */
export function normalizeJapaneseTtsText(text: string): string {
  return text
    .replace(/\[[^\]]*?\]/g, '')
    .replace(/（[^）]*?）/g, '')
    .replace(/\([^)]*?\)/g, '')
    .replace(/[「」『』【】]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export type SpeakJapaneseOptions = {
  onEnd?: () => void;
  onError?: () => void;
};

function isOperaBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /OPR|Opera/i.test(navigator.userAgent);
}

function resumeSpeechIfStuck(synth: SpeechSynthesis): void {
  window.setTimeout(() => {
    if (synth.speaking && synth.paused) {
      synth.resume();
    }
  }, 120);

  // Chromium/Opera GX: queue đôi khi bị "kẹt" im lặng nếu không resume.
  window.setTimeout(() => {
    if (synth.speaking) {
      synth.pause();
      synth.resume();
    }
  }, 280);
}

/**
 * Phát TTS ngay trong user-gesture (click).
 * Không chờ voices async — Opera GX / Chromium sẽ chặn speak() nếu trễ quá lâu sau click.
 */
export function speakJapanese(text: string, options?: SpeakJapaneseOptions): boolean {
  const t = normalizeJapaneseTtsText(text);
  if (!t || typeof window === 'undefined' || !window.speechSynthesis) {
    options?.onError?.();
    return false;
  }

  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(t);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.92;
  utterance.pitch = 1;

  const voice = pickJapaneseVoice(synth.getVoices());
  if (voice) utterance.voice = voice;

  utterance.onend = () => options?.onEnd?.();
  utterance.onerror = () => options?.onError?.();

  synth.cancel();

  // Delay ngắn sau cancel — tránh lỗi im lặng trên Chromium/Opera GX.
  window.setTimeout(() => {
    synth.speak(utterance);
    resumeSpeechIfStuck(synth);
  }, 64);

  return true;
}

/** Gọi sớm + sau click đầu tiên để nạp giọng ja-JP. */
export function preloadJapaneseVoices(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  void window.speechSynthesis.getVoices();
}

export function hasJapaneseVoice(): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  return Boolean(pickJapaneseVoice(window.speechSynthesis.getVoices()));
}

export function getJapaneseTtsHint(): string {
  if (isOperaBrowser()) {
    return 'Opera GX: bật giọng tiếng Nhật trong Windows (Settings → Time & language → Speech) hoặc thử Chrome/Edge nếu vẫn im lặng.';
  }
  if (!hasJapaneseVoice()) {
    return 'Trình duyệt chưa có giọng tiếng Nhật. Cài language pack ja-JP trên Windows.';
  }
  return 'Không phát được âm thanh. Hãy thử nhấn lại hoặc kiểm tra quyền âm thanh trình duyệt.';
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
