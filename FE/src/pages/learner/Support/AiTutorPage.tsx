import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import JapaneseRubyHtml from '../../../components/learner/tutor/JapaneseRubyHtml';
import Live2DPanel from '../../../components/learner/tutor/Live2DPanel';
import { useLipFromAudio } from '../../../hooks/useLipFromAudio';
import {
  loadLocalConversation,
  saveLocalConversation,
  type LocalTutorConversation,
} from '../../../lib/tutorLocalStore';
import { resolveLive2dModelUrl } from '../../../constants/tutorLive2d';
import {
  TUTOR_LIVE2D_MODELS,
  TUTOR_LIVE2D_MODEL_STORAGE_KEY,
  assistantExpressionIdForIntent,
  detectUserTutorIntent,
  getTutorLive2dModelById,
  peekAndConsumeTutorFaceHint,
  pickVoicevoxSpeakerForTurn,
  replyMotionMoodForExpressionId,
  replyMotionMoodFromSignal,
  resolveReplayAssistantExpressionId,
  resolveTutorLive2dExpressionId,
  tutorModelRelativeUrl,
  type TutorAvatarSignal,
  type TutorFaceHint,
  type TutorIdleFaceMood,
  type TutorSendIntent,
} from '../../../constants/tutorLive2dModels';
import { TutorAiService, type TutorChatMessage } from '../../../services/Learner/tutorAiService';
import { LearnerProfileService } from '../../../services/Learner/learnerProfileService';
import { getTutorLocalStorageOwnerKey } from '../../../utils/jwtUserId';

function activeLocalStorageKeyFor(owner: string, live2dModelId: string): string {
  return `aiTutorActiveLocalId:${owner}:${live2dModelId}`;
}

function readStoredTutorModelId(): string {
  try {
    const s = localStorage.getItem(TUTOR_LIVE2D_MODEL_STORAGE_KEY);
    return s && TUTOR_LIVE2D_MODELS.some((m) => m.id === s) ? s : TUTOR_LIVE2D_MODELS[0]!.id;
  } catch {
    return TUTOR_LIVE2D_MODELS[0]!.id;
  }
}

function readInitialLocalId(owner: string, modelId: string): string {
  const k = activeLocalStorageKeyFor(owner, modelId);
  try {
    const existing = localStorage.getItem(k);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(k, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function parseJlptFromLevelName(levelName?: string | null): 'N1' | 'N2' | 'N3' | 'N4' | 'N5' {
  if (!levelName?.trim()) return 'N5';
  const m = levelName.toUpperCase().match(/N[1-5]/);
  if (m?.[0] === 'N1' || m?.[0] === 'N2' || m?.[0] === 'N3' || m?.[0] === 'N4' || m?.[0] === 'N5') return m[0];
  return 'N5';
}

function jlptToPlaybackRate(code: 'N1' | 'N2' | 'N3' | 'N4' | 'N5'): number {
  switch (code) {
    case 'N5':
      return 0.78;
    case 'N4':
      return 0.84;
    case 'N3':
      return 0.92;
    case 'N2':
      return 1.0;
    case 'N1':
      return 1.08;
    default:
      return 0.85;
  }
}

function pickRecorderMime(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c;
  }
  return 'audio/webm';
}

const TUTOR_FACE_HOLD_MS = 3 * 60 * 1000;

type TutorMenuOption = { value: string; label: string };

function TutorMenuDropdown({
  value,
  options,
  onSelect,
  placeholder,
  disabled,
  className,
  alignMenu = 'stretch',
  variant = 'default',
  buttonTitle,
  'aria-label': ariaLabel,
  staleValueAsNumberedConvo,
}: {
  value: string;
  options: TutorMenuOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  alignMenu?: 'stretch' | 'end';
  variant?: 'default' | 'compact';
  buttonTitle?: string;
  'aria-label'?: string;
  /** Khi `value` không còn trong `options` (ví dụ danh sách đổi), hiển thị “Hội thoại #id”. */
  staleValueAsNumberedConvo?: boolean;
}) {
  const listboxId = React.useId();
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value);
  const displayLabel =
    selected?.label ??
    (value.trim()
      ? staleValueAsNumberedConvo
        ? `Hội thoại #${value}`
        : value
      : (placeholder ?? ''));

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const updateMenuPlacement = useCallback(() => {
    const root = rootRef.current;
    const menu = menuRef.current;
    if (!root || !menu) return;
    const rect = root.getBoundingClientRect();
    const menuH = Math.max(menu.offsetHeight, 72);
    const margin = 6;
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const need = Math.min(menuH, 192);
    setOpenUp(spaceBelow < need && spaceAbove >= spaceBelow);
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setOpenUp(false);
      return;
    }
    let inner = 0;
    const run = () => {
      updateMenuPlacement();
      inner = requestAnimationFrame(updateMenuPlacement);
    };
    run();
    const onWin = () => updateMenuPlacement();
    window.addEventListener('resize', onWin);
    window.addEventListener('scroll', onWin, true);
    return () => {
      cancelAnimationFrame(inner);
      window.removeEventListener('resize', onWin);
      window.removeEventListener('scroll', onWin, true);
    };
  }, [open, options.length, updateMenuPlacement]);

  const triggerBase =
    'flex w-full items-center justify-between gap-1.5 rounded-lg border text-left font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50';
  const triggerSkin =
    'border-violet-200/80 bg-linear-to-b from-white to-violet-50/40 text-[#2e1f38] shadow-sm hover:border-violet-300/90';
  const triggerSize =
    variant === 'compact'
      ? 'min-h-[32px] px-2 py-1 text-[11px] leading-tight'
      : 'min-h-[34px] px-2.5 py-1.5 text-xs leading-snug';

  const menuPos = alignMenu === 'end' ? 'right-0 min-w-full' : 'left-0 right-0';
  const menuFlip = openUp ? 'bottom-full mb-1' : 'top-full mt-1';

  return (
    <div ref={rootRef} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        title={buttonTitle}
        disabled={disabled}
        className={`${triggerBase} ${triggerSkin} ${triggerSize}`}
        onClick={() => !disabled && setOpen((o) => !o)}
      >
        <span className="min-w-0 flex-1 truncate">{displayLabel || '\u00a0'}</span>
        <ChevronDown
          className={`shrink-0 text-violet-500 transition-transform ${variant === 'compact' ? 'size-3' : 'size-3.5'} ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open ? (
        <ul
          ref={menuRef}
          id={listboxId}
          role="listbox"
          className={`tutor-chat-scroll absolute z-70 max-h-44 overflow-y-auto rounded-lg border border-violet-100/90 bg-white py-0.5 shadow-md shadow-violet-900/8 ring-1 ring-violet-100/30 ${menuFlip} ${menuPos}`}
        >
          {options.length === 0 ? (
            <li className="px-2 py-1.5 text-[11px] text-[#886373]">Chưa có mục</li>
          ) : (
            options.map((o) => {
              const isSel = o.value === value;
              return (
                <li key={o.value} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSel}
                    className={`flex w-full px-2 py-1.5 text-left text-xs leading-snug transition-colors ${
                      isSel
                        ? 'bg-violet-100 font-semibold text-violet-900'
                        : 'text-[#3d3439] hover:bg-violet-50/90'
                    }`}
                    onClick={() => {
                      onSelect(o.value);
                      setOpen(false);
                    }}
                  >
                    <span className="line-clamp-2">{o.label}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}

function attachSilenceAutoStop(stream: MediaStream, onSilence: () => void): () => void {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return () => {};

  const ctx = new Ctor();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  const data = new Uint8Array(analyser.fftSize);
  let silenceMs = 0;
  let last = performance.now();
  let raf = 0;
  const thresh = 0.018;
  const needMs = 880;

  const loop = (t: number) => {
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i]! - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    const dt = Math.min(120, t - last);
    last = t;
    if (rms < thresh) silenceMs += dt;
    else silenceMs = 0;
    if (silenceMs >= needMs) {
      onSilence();
      return;
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    try {
      source.disconnect();
    } catch {
      /* ignore */
    }
    try {
      analyser.disconnect();
    } catch {
      /* ignore */
    }
    void ctx.close();
  };
}

export type UiMessage = {
  id: string;
  role: 'user' | 'assistant';
  userText?: string;
  vietnameseText?: string;
  japaneseSpeech?: string;
  expression?: string;
  audioBlob?: Blob;
  serverAssistantMessageId?: number;
};

function toApiHistory(msgs: UiMessage[]): TutorChatMessage[] {
  return msgs.map((m) => {
    if (m.role === 'user') return { role: 'user', content: m.userText ?? '' };
    return {
      role: 'assistant',
      content: JSON.stringify({
        vietnameseText: m.vietnameseText ?? '',
        japaneseSpeech: m.japaneseSpeech ?? '',
      }),
    };
  });
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

const AiTutorPage: React.FC = () => {
  const initialModelId = readStoredTutorModelId();
  const ownerKeyInit = getTutorLocalStorageOwnerKey();
  const [localId, setLocalId] = useState<string>(() => readInitialLocalId(ownerKeyInit, initialModelId));

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [serverConversationId, setServerConversationId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'thinking' | 'speaking'>('idle');
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [serverConvos, setServerConvos] = useState<
    Array<{ id: number; title?: string | null; updatedAt: string; live2dModelId?: string }>
  >([]);
  const [learnerLevelName, setLearnerLevelName] = useState<string | null>(null);
  const [speechLang, setSpeechLang] = useState<'vi-VN' | 'ja-JP'>('vi-VN');
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [idleFaceMood, setIdleFaceMood] = useState<TutorIdleFaceMood>('default');
  const [replayExpressionId, setReplayExpressionId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<BlobPart[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const silenceStopCleanupRef = useRef<(() => void) | null>(null);
  const recordMimeRef = useRef('');
  const recordEpochRef = useRef(0);
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);

  const jlptCode = useMemo(() => parseJlptFromLevelName(learnerLevelName), [learnerLevelName]);
  const tutorPlaybackRate = useMemo(() => jlptToPlaybackRate(jlptCode), [jlptCode]);

  const tutorModelOptions = useMemo(
    () => TUTOR_LIVE2D_MODELS.map((m) => ({ value: m.id, label: m.label })),
    []
  );

  const savedConvoOptions = useMemo(
    () =>
      serverConvos.map((c) => ({
        value: String(c.id),
        label: (c.title ?? `Hội thoại #${c.id}`).slice(0, 56),
      })),
    [serverConvos]
  );

  const speechLangOptions = useMemo(
    () => [
      { value: 'vi-VN', label: 'Tiếng Việt' },
      { value: 'ja-JP', label: 'Tiếng Nhật' },
    ],
    []
  );

  const envLive2dModelUrl = import.meta.env.VITE_LIVE2D_MODEL_URL?.trim();
  const [tutorModelId, setTutorModelId] = useState<string>(initialModelId);

  useEffect(() => {
    try {
      localStorage.setItem(TUTOR_LIVE2D_MODEL_STORAGE_KEY, tutorModelId);
    } catch {
      /* ignore */
    }
  }, [tutorModelId]);

  const tutorModelDef = useMemo(() => getTutorLive2dModelById(tutorModelId), [tutorModelId]);

  const live2dModelUrl = useMemo(() => {
    if (envLive2dModelUrl) return resolveLive2dModelUrl(envLive2dModelUrl);
    return tutorModelRelativeUrl(tutorModelDef.model3JsonPath);
  }, [tutorModelDef.model3JsonPath, envLive2dModelUrl]);

  const pendingFaceHintRef = useRef<TutorFaceHint | null>(null);
  useEffect(() => {
    const h = peekAndConsumeTutorFaceHint();
    if (h) pendingFaceHintRef.current = h;
  }, []);

  const lastSendIntentRef = useRef<TutorSendIntent>('normal');

  const serviceWarnForErrorFace = useMemo(() => {
    if (!warn?.trim()) return false;
    return /VOICEVOX|Whisper|nhận dạng|STT|Ollama|502|503|đồng bộ|Không tạo được|Không gọi được|Không tải được|timeout|Docker/i.test(
      warn
    );
  }, [warn]);

  const avatarSignal = useMemo((): TutorAvatarSignal => {
    if (error || speechError || serviceWarnForErrorFace) return { kind: 'error' };
    if (sending) return { kind: 'thinking' };
    return { kind: 'reply', idleMood: idleFaceMood };
  }, [error, speechError, serviceWarnForErrorFace, sending, idleFaceMood]);

  const live2dExpressionId = useMemo((): string | null => {
    if (replayExpressionId) return replayExpressionId;
    return resolveTutorLive2dExpressionId(tutorModelDef, avatarSignal);
  }, [replayExpressionId, tutorModelDef, avatarSignal]);

  const live2dReplyMotionMood = useMemo(() => {
    if (replayExpressionId) return replyMotionMoodForExpressionId(tutorModelDef, replayExpressionId);
    return replyMotionMoodFromSignal(avatarSignal);
  }, [replayExpressionId, tutorModelDef, avatarSignal]);

  const live2dLipIdleOpenY = useMemo(() => {
    return live2dExpressionId === tutorModelDef.expressionIds.thanks ? 0.1 : 0;
  }, [live2dExpressionId, tutorModelDef.expressionIds.thanks]);

  useEffect(() => {
    if (idleFaceMood === 'default') return;
    const t = window.setTimeout(() => setIdleFaceMood('default'), TUTOR_FACE_HOLD_MS);
    return () => window.clearTimeout(t);
  }, [idleFaceMood]);

  useEffect(() => {
    if (error || speechError || serviceWarnForErrorFace) setIdleFaceMood('error');
  }, [error, speechError, serviceWarnForErrorFace]);

  const lip = useLipFromAudio(currentAudio, phase === 'speaking');

  useLayoutEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    let innerRaf = 0;
    const apply = () => {
      el.scrollTop = el.scrollHeight;
    };
    apply();
    const outerRaf = requestAnimationFrame(() => {
      apply();
      innerRaf = requestAnimationFrame(apply);
    });
    const t1 = window.setTimeout(apply, 80);
    const t2 = window.setTimeout(apply, 280);
    return () => {
      cancelAnimationFrame(outerRaf);
      cancelAnimationFrame(innerRaf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [messages, sending, ttsLoading, isListening, isTranscribing, error, warn, speechError]);

  const persistLocal = useCallback(
    async (msgs: UiMessage[], serverId: number | null) => {
      const ownerUserId = getTutorLocalStorageOwnerKey();
      const title = msgs.find((m) => m.role === 'user')?.userText?.slice(0, 48);
      const audioBase64ByClientId: Record<string, string> = {};
      for (const m of msgs) {
        if (m.role === 'assistant' && m.audioBlob) {
          audioBase64ByClientId[m.id] = await blobToBase64(m.audioBlob);
        }
      }
      const conv: LocalTutorConversation = {
        localId,
        ownerUserId,
        live2dModelId: tutorModelId,
        serverConversationId: serverId ?? undefined,
        title,
        updatedAt: Date.now(),
        messages: msgs.map((m) => ({
          clientId: m.id,
          role: m.role,
          userContent: m.userText,
          vietnameseText: m.vietnameseText,
          japaneseSpeech: m.japaneseSpeech,
          expression: m.expression,
          serverAssistantMessageId: m.serverAssistantMessageId,
        })),
        audioBase64ByClientId,
      };
      await saveLocalConversation(conv);
    },
    [localId, tutorModelId]
  );

  const refreshServerConvos = useCallback(async () => {
    try {
      const list = await TutorAiService.listConversations(tutorModelId);
      setServerConvos(list);
    } catch {
      /* ignore */
    }
  }, [tutorModelId]);

  useEffect(() => {
    void refreshServerConvos();
  }, [refreshServerConvos]);

  useEffect(() => {
    const owner = getTutorLocalStorageOwnerKey();
    const k = activeLocalStorageKeyFor(owner, tutorModelId);
    let nextLocal: string;
    try {
      const existing = localStorage.getItem(k);
      if (existing) nextLocal = existing;
      else {
        nextLocal = crypto.randomUUID();
        localStorage.setItem(k, nextLocal);
      }
    } catch {
      nextLocal = crypto.randomUUID();
    }
    setLocalId(nextLocal);
    setServerConversationId(null);
    setMessages([]);
    setIdleFaceMood('default');

    let cancelled = false;
    void (async () => {
      const stored = await loadLocalConversation(nextLocal, owner);
      if (cancelled) return;
      if (!stored?.messages?.length) return;
      if ((stored.live2dModelId ?? tutorModelId) !== tutorModelId) return;
      if (cancelled) return;

      const hydrated: UiMessage[] = [];
      for (const m of stored.messages) {
        if (m.role === 'user') {
          hydrated.push({ id: m.clientId, role: 'user', userText: m.userContent ?? '' });
        } else {
          let audioBlob: Blob | undefined;
          const b64 = stored.audioBase64ByClientId?.[m.clientId];
          if (b64) {
            try {
              const bin = atob(b64);
              const bytes = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
              audioBlob = new Blob([bytes], { type: 'audio/wav' });
            } catch {
              audioBlob = undefined;
            }
          }
          hydrated.push({
            id: m.clientId,
            role: 'assistant',
            vietnameseText: m.vietnameseText,
            japaneseSpeech: m.japaneseSpeech,
            expression: m.expression,
            serverAssistantMessageId: m.serverAssistantMessageId,
            audioBlob,
          });
        }
      }
      if (cancelled) return;
      setMessages(hydrated);
      setServerConversationId(stored.serverConversationId ?? null);
    })();

    return () => {
      cancelled = true;
    };
  }, [tutorModelId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const profile = await LearnerProfileService.getCurrentProfile();
        if (!cancelled) setLearnerLevelName(profile.levelName ?? null);
      } catch {
        if (!cancelled) setLearnerLevelName(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stopAudio = useCallback(() => {
    try {
      currentAudio?.pause();
    } catch {
      /* ignore */
    }
    setCurrentAudio(null);
    setPhase('idle');
    setReplayExpressionId(null);
  }, [currentAudio]);

  const playBlob = useCallback(
    async (blob: Blob, opts?: { keepLive2DReplay?: boolean; onEnded?: () => void }) => {
      try {
        currentAudio?.pause();
      } catch {
        /* ignore */
      }
      setCurrentAudio(null);
      setPhase('idle');
      if (!opts?.keepLive2DReplay) setReplayExpressionId(null);

      const url = URL.createObjectURL(blob);
      const a = new Audio(url);
      a.playbackRate = tutorPlaybackRate;
      setCurrentAudio(a);
      setPhase('speaking');
      a.addEventListener(
        'ended',
        () => {
          URL.revokeObjectURL(url);
          setCurrentAudio(null);
          setPhase('idle');
          setReplayExpressionId(null);
          opts?.onEnded?.();
        },
        { once: true }
      );
      try {
        await a.play();
      } catch {
        URL.revokeObjectURL(url);
        setCurrentAudio(null);
        setPhase('idle');
        setReplayExpressionId(null);
        opts?.onEnded?.();
      }
    },
    [currentAudio, tutorPlaybackRate]
  );

  const stopMediaRecording = useCallback(() => {
    silenceStopCleanupRef.current?.();
    silenceStopCleanupRef.current = null;
    try {
      mediaRecorderRef.current?.stop();
    } catch {
      /* ignore */
    }
    mediaRecorderRef.current = null;
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      recordEpochRef.current += 1;
      silenceStopCleanupRef.current?.();
      silenceStopCleanupRef.current = null;
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        /* ignore */
      }
      mediaRecorderRef.current = null;
      mediaChunksRef.current = [];
      if (mediaStreamRef.current) {
        for (const tr of mediaStreamRef.current.getTracks()) tr.stop();
        mediaStreamRef.current = null;
      }
    };
  }, []);

  const toggleVoiceInput = useCallback(() => {
    setSpeechError(null);
    if (sending || ttsLoading || isTranscribing) return;

    if (isListening) {
      stopMediaRecording();
      return;
    }

    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = stream;
        const mime = pickRecorderMime();
        recordMimeRef.current = mime;
        mediaChunksRef.current = [];
        const epochAtStart = recordEpochRef.current;
        const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
        mediaRecorderRef.current = rec;

        rec.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) mediaChunksRef.current.push(ev.data);
        };

        rec.onerror = () => {
          recordEpochRef.current += 1;
          setSpeechError('Lỗi ghi âm.');
          try {
            rec.stop();
          } catch {
            /* ignore */
          }
        };

        rec.onstop = () => {
          silenceStopCleanupRef.current?.();
          silenceStopCleanupRef.current = null;
          if (mediaStreamRef.current) {
            for (const tr of mediaStreamRef.current.getTracks()) tr.stop();
            mediaStreamRef.current = null;
          }
          setIsListening(false);

          if (epochAtStart !== recordEpochRef.current) {
            mediaChunksRef.current = [];
            return;
          }

          const chunks = mediaChunksRef.current;
          mediaChunksRef.current = [];
          const blob = new Blob(chunks, { type: recordMimeRef.current || 'audio/webm' });
          if (blob.size < 400) {
            setSpeechError('Âm thanh quá ngắn hoặc không thu được tín hiệu.');
            return;
          }

          const whisperLang = speechLang.startsWith('ja') ? 'ja' : 'vi';
          setIsTranscribing(true);
          void (async () => {
            try {
              const text = await TutorAiService.transcribeSpeech(blob, whisperLang);
              if (text) {
                setInput((prev) => {
                  const base = prev.trimEnd();
                  return base ? `${base} ${text}` : text;
                });
              } else {
                setSpeechError('Không nhận được văn bản từ Whisper.');
              }
            } catch (e: unknown) {
              const status = (e as { response?: { status?: number; data?: { message?: string } } })?.response?.status;
              const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
              if (status === 503) {
                setSpeechError(
                  msg ??
                    'STT chưa bật. Chạy Docker image onerahmet/openai-whisper-asr-webservice:latest (-p 9000:9000) và Whisper:BaseUrl=http://127.0.0.1:9000/v1/ trên backend.',
                );
              } else if (status === 502) {
                setSpeechError(
                  msg ??
                    'Lỗi kết nối hoặc phản hồi từ Whisper ASR Docker. Kiểm tra container đang chạy, ASR_MODEL=base khớp Whisper:Model.',
                );
              } else {
                setSpeechError(msg ?? 'Không gọi được nhận dạng giọng nói trên server.');
              }
            } finally {
              setIsTranscribing(false);
            }
          })();
        };

        rec.start(380);

        silenceStopCleanupRef.current = attachSilenceAutoStop(stream, () => {
          try {
            rec.stop();
          } catch {
            /* ignore */
          }
        });

        setIsListening(true);
      } catch {
        setSpeechError('Không bật được micro. Kiểm tra quyền truy cập micro.');
        stopMediaRecording();
      }
    })();
  }, [isListening, isTranscribing, sending, speechLang, stopMediaRecording, ttsLoading]);

  const handleReplay = useCallback(
    async (m: UiMessage) => {
      setError(null);

      const expr = resolveReplayAssistantExpressionId(tutorModelDef, m.expression);

      let replayMood: TutorIdleFaceMood = 'default';
      if (expr === tutorModelDef.expressionIds.thanks) replayMood = 'thanks';
      else if (expr === tutorModelDef.expressionIds.wrong) replayMood = 'wrong';
      else if (expr === tutorModelDef.expressionIds.error) replayMood = 'error';
      setIdleFaceMood(replayMood);

      setReplayExpressionId(expr);

      if (m.audioBlob) {
        await playBlob(m.audioBlob, { keepLive2DReplay: true });
        return;
      }
      if (!m.serverAssistantMessageId) {
        setReplayExpressionId(null);
        setError('Chưa có bản âm thanh đã lưu cho tin nhắn này.');
        return;
      }
      try {
        const blob = await TutorAiService.fetchMessageAudioBlob(m.serverAssistantMessageId);
        setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, audioBlob: blob } : x)));
        await playBlob(blob, { keepLive2DReplay: true });
      } catch {
        setReplayExpressionId(null);
        setError('Không tải được âm thanh từ server.');
      }
    },
    [playBlob, tutorModelDef]
  );

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    stopAudio();
    setError(null);
    setWarn(null);

    const userId = crypto.randomUUID();
    const userMsg: UiMessage = { id: userId, role: 'user', userText: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    const hint = pendingFaceHintRef.current;
    if (hint) {
      pendingFaceHintRef.current = null;
      lastSendIntentRef.current = hint === 'wrong' ? 'wrong' : 'thanks';
    } else {
      lastSendIntentRef.current = detectUserTutorIntent(text);
    }
    setSending(true);
    setPhase('thinking');

    try {
      let convId = serverConversationId;
      if (!convId) {
        convId = await TutorAiService.createConversation(text.slice(0, 48), tutorModelId);
        setServerConversationId(convId);
      }

      const history = toApiHistory(next);
      const reply = await TutorAiService.characterChat({
        messages: history,
        learnerJlptLevel: jlptCode,
      });

      const ttsSpeakerId = pickVoicevoxSpeakerForTurn(tutorModelDef, lastSendIntentRef.current);

      const assistantId = crypto.randomUUID();
      const assistantExpr = assistantExpressionIdForIntent(tutorModelDef, lastSendIntentRef.current);
      const assistantMsg: UiMessage = {
        id: assistantId,
        role: 'assistant',
        vietnameseText: reply.vietnameseText,
        japaneseSpeech: reply.japaneseSpeech,
        expression: assistantExpr,
      };

      const withAssistant = [...next, assistantMsg];
      setMessages(withAssistant);
      setSending(false);
      setIdleFaceMood(lastSendIntentRef.current === 'wrong' ? 'wrong' : 'thanks');
      setPhase('idle');

      let wav: Blob | undefined;
      if (assistantMsg.japaneseSpeech?.trim()) {
        setTtsLoading(true);
        try {
          wav = await TutorAiService.synthesizeSpeech(assistantMsg.japaneseSpeech, ttsSpeakerId);
        } catch {
          setWarn('Không tạo được giọng nói (VOICEVOX). Vẫn lưu nội dung chữ.');
        } finally {
          setTtsLoading(false);
        }
      }

      const finalMsgs: UiMessage[] = wav
        ? withAssistant.map((m) => (m.id === assistantId ? { ...m, audioBlob: wav } : m))
        : withAssistant;
      setMessages(finalMsgs);

      if (wav) {
        await playBlob(wav);
      } else {
        setPhase('idle');
      }

      let audioB64: string | undefined;
      if (wav) {
        try {
          audioB64 = await blobToBase64(wav);
        } catch {
          audioB64 = undefined;
        }
      }

      try {
        const appended = await TutorAiService.appendTurn(convId, {
          live2dModelId: tutorModelId,
          userClientMessageId: userId,
          userContent: text,
          assistantClientMessageId: assistantId,
          vietnameseText: reply.vietnameseText,
          japaneseSpeech: reply.japaneseSpeech,
          expression: assistantExpr,
          audioWavBase64: audioB64,
          speakerId: ttsSpeakerId,
        });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, serverAssistantMessageId: appended.assistantMessageId } : m))
        );
        await persistLocal(
          finalMsgs.map((m) =>
            m.id === assistantId ? { ...m, serverAssistantMessageId: appended.assistantMessageId } : m
          ),
          convId
        );
      } catch {
        setWarn((w) => w ?? 'Không đồng bộ được lên server (tin nhắn vẫn ở máy bạn).');
        await persistLocal(finalMsgs, convId);
      }

      await refreshServerConvos();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Không nhận được phản hồi. Kiểm tra Ollama đang chạy và model trong appsettings.';
      setError(msg);
      setIdleFaceMood('error');
      setMessages((prev) => prev.filter((m) => m.id !== userId));
      setPhase('idle');
    } finally {
      setSending(false);
      setTtsLoading(false);
    }
  };

  const handleNewChat = () => {
    stopAudio();
    const id = crypto.randomUUID();
    const owner = getTutorLocalStorageOwnerKey();
    localStorage.setItem(activeLocalStorageKeyFor(owner, tutorModelId), id);
    setLocalId(id);
    setMessages([]);
    setServerConversationId(null);
    setError(null);
    setWarn(null);
    setIdleFaceMood('default');
    void saveLocalConversation({
      localId: id,
      ownerUserId: owner,
      live2dModelId: tutorModelId,
      updatedAt: Date.now(),
      messages: [],
    });
  };

  const handleOpenServerConversation = async (id: number) => {
    stopAudio();
    setError(null);
    setWarn(null);
    setIdleFaceMood('default');
    try {
      const detail = await TutorAiService.getConversation(id, tutorModelId);
      const hydrated: UiMessage[] = [];
      for (const m of detail.messages) {
        if (m.role === 'user') {
          hydrated.push({ id: m.clientMessageId, role: 'user', userText: m.plainContent ?? '' });
        } else if (m.role === 'assistant') {
          hydrated.push({
            id: m.clientMessageId,
            role: 'assistant',
            vietnameseText: m.vietnameseText ?? undefined,
            japaneseSpeech: m.japaneseSpeech ?? undefined,
            expression: m.expression ?? undefined,
            serverAssistantMessageId: m.id,
            audioBlob: undefined,
          });
        }
      }

      const newLocal = crypto.randomUUID();
      const owner = getTutorLocalStorageOwnerKey();
      localStorage.setItem(activeLocalStorageKeyFor(owner, tutorModelId), newLocal);

      const title = hydrated.find((m) => m.role === 'user')?.userText?.slice(0, 48);
      const audioBase64ByClientId: Record<string, string> = {};
      for (const m of hydrated) {
        if (m.role === 'assistant' && m.audioBlob) {
          audioBase64ByClientId[m.id] = await blobToBase64(m.audioBlob);
        }
      }
      await saveLocalConversation({
        localId: newLocal,
        ownerUserId: owner,
        live2dModelId: tutorModelId,
        serverConversationId: detail.id,
        title,
        updatedAt: Date.now(),
        messages: hydrated.map((m) => ({
          clientId: m.id,
          role: m.role,
          userContent: m.userText,
          vietnameseText: m.vietnameseText,
          japaneseSpeech: m.japaneseSpeech,
          expression: m.expression,
          serverAssistantMessageId: m.serverAssistantMessageId,
        })),
        audioBase64ByClientId,
      });

      setLocalId(newLocal);
      setMessages(hydrated);
      setServerConversationId(detail.id);
    } catch {
      setError('Không tải được hội thoại từ server.');
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-[#f6f3f7] font-['Lexend'] text-[#211118]">
      <LearnerHeader>
        <div className="flex flex-1 flex-col gap-4 min-w-0 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="flex flex-col min-w-0 gap-0.5">
            <h2 className="text-lg sm:text-xl font-bold text-[#181114] tracking-tight">Gia sư AI</h2>
            <p className="text-xs text-[#886373]">Học cùng nhân vật 2D</p>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full max-w-md lg:w-auto lg:min-w-[280px]">
            <span className="text-xs font-semibold text-[#5c4a56] whitespace-nowrap">Nhân vật</span>
            <TutorMenuDropdown
              className="flex-1 min-w-0"
              value={tutorModelId}
              options={tutorModelOptions}
              onSelect={(v) => setTutorModelId(v)}
              disabled={!!envLive2dModelUrl}
              aria-label="Chọn nhân vật"
              buttonTitle={envLive2dModelUrl ? 'Model cố định theo cấu hình triển khai' : undefined}
            />
          </div>
        </div>
      </LearnerHeader>

      <div className="flex-1 p-3 sm:p-5 flex overflow-hidden flex-col min-h-0 h-[calc(100vh-100px)]">
        <div className="flex flex-1 min-h-0 gap-4 sm:gap-5 w-full max-w-[1440px] mx-auto">
          <div className="w-[58%] lg:w-[60%] min-w-0 flex flex-col min-h-0 self-stretch">
            <div className="flex flex-1 min-h-[280px] sm:min-h-[320px] min-w-0 flex-col rounded-2xl overflow-hidden border border-[#e8dfe6] bg-white shadow-sm">
              <Live2DPanel
                modelUrl={live2dModelUrl}
                expression={live2dExpressionId}
                replyMotionMood={live2dReplyMotionMood}
                phase={sending ? 'thinking' : phase}
                lip={lip}
                lipIdleOpenY={live2dLipIdleOpenY}
                scale={tutorModelDef.scale}
                interactionDisabled={sending || ttsLoading}
                expressionResetParamIds={tutorModelDef.expressionResetParamIds}
              />
            </div>
          </div>

          <div className="w-[42%] lg:w-[40%] min-w-0 flex flex-col min-h-0">
            <div className="rounded-2xl border border-[#e8dfe6] bg-white shadow-sm flex flex-col flex-1 min-h-0">
              <div className="shrink-0 px-4 py-3.5 border-b border-[#ede6ee] bg-linear-to-b from-violet-50/80 to-white flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#181114]">Trò chuyện</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNewChat}
                    className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold bg-violet-600 text-white hover:bg-violet-700 shadow-sm shadow-violet-600/15 transition-colors"
                  >
                    Cuộc mới
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-[#5c4a56] whitespace-nowrap">Đã lưu</span>
                  <TutorMenuDropdown
                    className="flex-1 min-w-0"
                    value={serverConversationId != null ? String(serverConversationId) : ''}
                    options={savedConvoOptions}
                    placeholder="Chọn hội thoại…"
                    onSelect={(v) => void handleOpenServerConversation(Number(v))}
                    aria-label="Mở hội thoại đã lưu"
                    staleValueAsNumberedConvo
                  />
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0 bg-[#faf8fb]">
                <div
                  ref={messagesScrollRef}
                  className="tutor-chat-scroll flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 py-4 pb-5 space-y-3 min-h-0"
                >
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4 py-10">
                      <p className="text-[#181114] font-semibold mb-2">Bắt đầu nhé</p>
                      <p className="text-sm text-[#886373] max-w-sm leading-relaxed">
                        Đặt câu hỏi ngữ pháp, từ vựng, hoặc nhờ gia sư sửa câu của bạn.
                      </p>
                    </div>
                  )}

                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[95%] rounded-2xl px-4 py-3 shadow-sm ${
                          m.role === 'user'
                            ? 'bg-violet-600 text-white rounded-br-md'
                            : 'bg-white border border-[#ebe4ef] text-[#181114] rounded-bl-md'
                        }`}
                      >
                        {m.role === 'user' ? (
                          <p className="text-sm whitespace-pre-wrap wrap-break-word leading-relaxed">{m.userText}</p>
                        ) : (
                          <div className="space-y-3">
                            {m.japaneseSpeech ? (
                              <div
                                className="rounded-xl bg-[#f7f4f9] border border-[#ebe4ef] px-3 py-2.5 text-[15px] leading-relaxed"
                                lang="ja"
                              >
                                <JapaneseRubyHtml text={m.japaneseSpeech} />
                              </div>
                            ) : null}
                            {m.vietnameseText ? (
                              <p
                                className="text-sm whitespace-pre-wrap wrap-break-word leading-relaxed text-[#3d3439]"
                                lang="vi"
                              >
                                {m.vietnameseText}
                              </p>
                            ) : null}
                            <div className="flex justify-end pt-0.5">
                              <button
                                type="button"
                                onClick={() => void handleReplay(m)}
                                className="rounded-full px-4 py-2 text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100/80 hover:bg-violet-100 disabled:opacity-40 transition-colors"
                                disabled={!m.japaneseSpeech?.trim()}
                              >
                                Nghe lại
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {(sending || ttsLoading || isListening || isTranscribing) && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl px-4 py-3 bg-white border border-[#ebe4ef] text-[#6b5c66] text-sm shadow-sm">
                        {isTranscribing
                          ? 'Đang nhận dạng…'
                          : isListening
                            ? 'Đang ghi âm…'
                            : sending
                              ? 'Đang suy nghĩ…'
                              : 'Đang tạo giọng đọc…'}
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-sm px-4 py-3">
                      {error}
                    </div>
                  )}
                  {warn && (
                    <div className="rounded-xl bg-amber-50 border border-amber-100 text-amber-900 text-sm px-4 py-3">
                      {warn}
                    </div>
                  )}
                  {speechError && (
                    <div className="rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-sm px-4 py-3">
                      {speechError}
                    </div>
                  )}
                </div>

                <div className="shrink-0 p-4 bg-white border-t border-[#ede6ee] flex flex-col gap-3">
                  <textarea
                    className="w-full rounded-2xl bg-[#f4f0f5] border border-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-200 focus:bg-white focus:border-violet-100 transition-all text-[#181114] min-h-[76px] resize-y max-h-40 placeholder:text-[#a898a5]"
                    placeholder="Nhập câu hỏi…"
                    title="Enter gửi tin — Shift+Enter xuống dòng"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (!sending && !ttsLoading && input.trim()) void handleSend();
                      }
                    }}
                    disabled={sending || ttsLoading || isListening || isTranscribing}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-[#5c4a56] shrink-0">Mic</span>
                      <TutorMenuDropdown
                        className="w-[128px] shrink-0"
                        variant="compact"
                        alignMenu="end"
                        value={speechLang}
                        options={speechLangOptions}
                        onSelect={(v) => setSpeechLang(v as 'vi-VN' | 'ja-JP')}
                        disabled={sending || ttsLoading || isListening || isTranscribing}
                        aria-label="Ngôn ngữ ghi âm"
                      />
                      <button
                        type="button"
                        onClick={() => void toggleVoiceInput()}
                        disabled={sending || ttsLoading || isTranscribing}
                        title={isListening ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold border transition-colors ${
                          isListening
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            : 'bg-violet-50 text-violet-700 border-violet-100 hover:bg-violet-100'
                        } disabled:opacity-40`}
                      >
                        <span
                          className={`inline-block size-2 rounded-full bg-current ${isListening ? 'animate-pulse' : ''}`}
                          aria-hidden
                        />
                        {isListening ? 'Dừng' : 'Ghi'}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleSend()}
                      disabled={sending || ttsLoading || isListening || isTranscribing || !input.trim()}
                      className="rounded-full px-7 py-2.5 bg-violet-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-violet-700 transition-colors shadow-md shadow-violet-600/20"
                    >
                      Gửi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiTutorPage;
