/**
 * Danh sách model Live2D dưới `FE/public/models/`.
 * Tỷ lệ hiển thị (`scale`) và `voicevoxSpeakerId` có thể chỉnh trực tiếp tại đây cho từng model.
 *
 * Biểu cảm cố định (chung mọi model, file .exp3.json): Thinking, Thanks, Wrong, Error — id trùng tên file (không đuôi).
 * Trạng thái "mặc định" (không .exp3) do runtime reset tham số core — không dùng file Neutral.
 */

export const TUTOR_LIVE2D_MODEL_STORAGE_KEY = 'tutor_live2d_model_id';

/** Gợi ý biểu cảm khi mở trang tutor từ nơi khác (vd. luyện tập sai). Xóa sau khi đọc. */
export const TUTOR_FACE_HINT_SESSION_KEY = 'tutor_face_hint';

export type TutorFaceHint = 'wrong' | 'thanks';

export type TutorLive2dModelDefinition = {
  id: string;
  label: string;
  /** Đường dẫn từ thư mục public, ví dụ `models/huohuo/huohuo.model3.json` */
  model3JsonPath: string;
  /** Tỷ lệ canvas (nhân với scale tự động theo khung). */
  scale: number;
  /** VOICEVOX: giọng mặc định (hội thoại bình thường / suy nghĩ / lỗi dịch vụ). */
  voicevoxSpeakerIdNormal: number;
  /** VOICEVOX: khi user cảm ơn (turn vừa gửi nhận diện thanks). */
  voicevoxSpeakerIdThanks: number;
  /** VOICEVOX: khi user nói làm sai / hint sai. */
  voicevoxSpeakerIdWrong: number;
  expressionIds: {
    thinking: string;
    thanks: string;
    wrong: string;
    error: string;
  };
  /**
   * (Tuỳ chọn) Hợp các `Param…` xuất hiện trong Thanks/Wrong/Thinking/Error `.exp3` của model đó.
   * Runtime gán 0 trước khi áp expression tiếp — tránh sót tham số (vd. Thinking Param141–143) khi không sửa được editor.
   */
  expressionResetParamIds?: readonly string[];
};

export const TUTOR_LIVE2D_MODELS: TutorLive2dModelDefinition[] = [
  {
    id: 'huohuo',
    label: 'Huohuo',
    model3JsonPath: 'models/huohuo/huohuo.model3.json',
    scale: 1.5,
    voicevoxSpeakerIdNormal: 58,
    voicevoxSpeakerIdThanks: 58,
    voicevoxSpeakerIdWrong: 58,
    expressionIds: {
      thinking: 'Thinking',
      thanks: 'Thanks',
      wrong: 'Wrong',
      error: 'Error',
    },
  },
  {
    id: 'aniya',
    label: 'ANIYA',
    model3JsonPath: 'models/ANIYA/ANIYA.model3.json',
    scale: 1.65,
    voicevoxSpeakerIdNormal: 3,
    voicevoxSpeakerIdThanks: 3,
    voicevoxSpeakerIdWrong: 3,
    expressionIds: {
      thinking: 'Thinking',
      thanks: 'Thanks',
      wrong: 'Wrong',
      error: 'Error',
    },
  },
  {
    id: 'takodachi',
    label: 'Takodachi',
    model3JsonPath: 'models/Takodachi/takodachi.model3.json',
    scale: 1.5,
    voicevoxSpeakerIdNormal: 2,
    voicevoxSpeakerIdThanks: 2,
    voicevoxSpeakerIdWrong: 2,
    expressionIds: {
      thinking: 'Thinking',
      thanks: 'Thanks',
      wrong: 'Wrong',
      error: 'Error',
    },
  },
  {
    id: 'fuxuan',
    label: 'Fuxuan',
    model3JsonPath: 'models/fuxuan/fuxuan.model3.json',
    scale: 1.55,
    voicevoxSpeakerIdNormal: 1,
    voicevoxSpeakerIdThanks: 1,
    voicevoxSpeakerIdWrong: 1,
    expressionIds: {
      thinking: 'Thinking',
      thanks: 'Thanks',
      wrong: 'Wrong',
      error: 'Error',
    },
  },
  {
    id: 'vivian',
    label: '薇薇安',
    model3JsonPath: 'models/薇薇安/薇薇安.model3.json',
    scale: 2.75,
    voicevoxSpeakerIdNormal: 23,
    voicevoxSpeakerIdThanks: 23,
    voicevoxSpeakerIdWrong: 23,
    expressionIds: {
      thinking: 'Thinking',
      thanks: 'Thanks',
      wrong: 'Wrong',
      error: 'Error',
    },
    /** Hợp tham số từ Thanks/Wrong/Thinking/Error.exp3.json (không gồm ParamBreath — để physics thở tự nhiên). */
    expressionResetParamIds: [
      'Param14',
      'Param15',
      'Param16',
      'Param22',
      'Param132',
      'Param135',
      'Param140',
      'Param141',
      'Param142',
      'Param143',
      'Param144',
      'Param145',
      'Param146',
      'Param149',
      'Param150',
      'ParamEyeLSmile',
      'ParamEyeRSmile',
      'ParamMouthOpenY',
    ],
  },
];

export const DEFAULT_TUTOR_LIVE2D_MODEL_RELATIVE_PATH = TUTOR_LIVE2D_MODELS[0]!.model3JsonPath;

export function getTutorLive2dModelById(id: string | null | undefined): TutorLive2dModelDefinition {
  const found = TUTOR_LIVE2D_MODELS.find((m) => m.id === id);
  return found ?? TUTOR_LIVE2D_MODELS[0]!;
}

export function pickVoicevoxSpeakerForTurn(model: TutorLive2dModelDefinition, intent: TutorSendIntent): number {
  if (intent === 'thanks') return model.voicevoxSpeakerIdThanks;
  if (intent === 'wrong') return model.voicevoxSpeakerIdWrong;
  return model.voicevoxSpeakerIdNormal;
}

/** URL tĩnh tới file model3.json (kèm Vite base). */
export function tutorModelRelativeUrl(model3JsonPath: string): string {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const rel = model3JsonPath.startsWith('/') ? model3JsonPath : `/${model3JsonPath}`;
  return `${base}${rel}`;
}

/** Intent gửi tin: chat thường → `normal` (assistant vẫn dùng Thanks trong assistantExpressionIdForIntent). */
export type TutorSendIntent = 'thanks' | 'wrong' | 'normal';

/** Gợi ý từ nội dung user (chat). */
export function detectUserTutorIntent(text: string): TutorSendIntent {
  const t = text.trim();
  if (!t) return 'normal';
  if (
    /(tôi sai|em sai|mình sai|đáp án sai|làm sai|trả lời sai|wrong answer|incorrect|間違)/i.test(t)
  ) {
    return 'wrong';
  }
  if (
    /(bạn (trả lời )?sai|AI (trả lời )?sai|bạn (nói )?sai|AI (nói )?sai|không đúng ý|không phải ý|hiểu sai|not what i meant|bạn hiểu nhầm|違う|ちがう|誤解)/i.test(
      t
    )
  ) {
    return 'wrong';
  }
  return 'normal';
}

export function queueTutorFaceHint(hint: TutorFaceHint): void {
  try {
    sessionStorage.setItem(TUTOR_FACE_HINT_SESSION_KEY, hint);
  } catch {
    /* ignore */
  }
}

export function peekAndConsumeTutorFaceHint(): TutorFaceHint | null {
  try {
    const v = sessionStorage.getItem(TUTOR_FACE_HINT_SESSION_KEY);
    if (v === 'wrong' || v === 'thanks') {
      sessionStorage.removeItem(TUTOR_FACE_HINT_SESSION_KEY);
      return v;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Sau phản hồi: giữ Thanks/Wrong/Error; `default` = không giữ mood — pose mặc định (không .exp3). */
export type TutorIdleFaceMood = 'default' | 'thanks' | 'wrong' | 'error';

export type TutorAvatarSignal =
  | { kind: 'error' }
  /** Chỉ khi LLM đang suy nghĩ — luôn dùng expression Thinking. */
  | { kind: 'thinking' }
  | { kind: 'reply'; idleMood: TutorIdleFaceMood };

/** `null` = không áp file .exp3 (pose mặc định sau reset core). */
export function resolveTutorLive2dExpressionId(
  model: TutorLive2dModelDefinition,
  signal: TutorAvatarSignal
): string | null {
  const { expressionIds: e } = model;
  if (signal.kind === 'error') return e.error;
  if (signal.kind === 'thinking') return e.thinking;
  if (signal.kind === 'reply') {
    if (signal.idleMood === 'thanks') return e.thanks;
    if (signal.idleMood === 'wrong') return e.wrong;
    if (signal.idleMood === 'error') return e.error;
  }
  return null;
}

/** Mood chữ (happy/sad/calm/...) cho chọn motion TutorReply — không nhất thiết trùng id file .exp3 */
export function replyMotionMoodFromSignal(signal: TutorAvatarSignal): string {
  if (signal.kind === 'error') return 'cry';
  if (signal.kind === 'thinking') return 'thinking';
  if (signal.kind === 'reply') {
    if (signal.idleMood === 'thanks') return 'happy';
    if (signal.idleMood === 'wrong') return 'sad';
    if (signal.idleMood === 'error') return 'cry';
  }
  return 'calm';
}

/** Chat thường / nhận diện thanks → Thanks; wrong → Wrong. */
export function assistantExpressionIdForIntent(model: TutorLive2dModelDefinition, intent: TutorSendIntent): string {
  return intent === 'wrong' ? model.expressionIds.wrong : model.expressionIds.thanks;
}

/** Khi nghe lại: map id expression đã lưu → mood motion TutorReply. */
export function replyMotionMoodForExpressionId(
  model: TutorLive2dModelDefinition,
  expressionId: string
): string {
  if (expressionId === model.expressionIds.thinking) return 'thinking';
  if (expressionId === model.expressionIds.thanks) return 'happy';
  if (expressionId === model.expressionIds.wrong) return 'sad';
  if (expressionId === model.expressionIds.error) return 'cry';
  return 'calm';
}

/** Chuẩn hóa expression lưu DB/local (legacy Neutral/neutral → không áp .exp3). */
export function normalizeStoredAssistantExpressionId(
  model: TutorLive2dModelDefinition,
  raw: string | null | undefined
): string | null {
  if (raw == null || !String(raw).trim()) return null;
  const s = raw.trim();
  if (/^neutral$/i.test(s)) return null;
  return s;
}

/** Expression để replay: thiếu hoặc legacy neutral → Thanks (khớp assistant mặc định). */
export function resolveReplayAssistantExpressionId(
  model: TutorLive2dModelDefinition,
  raw: string | null | undefined
): string {
  const n = normalizeStoredAssistantExpressionId(model, raw);
  if (n == null) return assistantExpressionIdForIntent(model, 'normal');
  return n;
}
