import { DEFAULT_TUTOR_LIVE2D_MODEL_RELATIVE_PATH } from './tutorLive2dModels';

/**
 * Cubism model mặc định — đồng bộ với mục đầu trong `tutorLive2dModels.ts`.
 * Override với `VITE_LIVE2D_MODEL_URL` nếu cần ép một URL cố định khi dev.
 */
export const DEFAULT_TUTOR_LIVE2D_MODEL_PATH = DEFAULT_TUTOR_LIVE2D_MODEL_RELATIVE_PATH;

export function resolveLive2dModelUrl(explicit?: string | null): string {
  const trimmed = explicit?.trim();
  if (trimmed) return trimmed;

  const fromEnv = import.meta.env.VITE_LIVE2D_MODEL_URL?.trim();
  if (fromEnv) return fromEnv;

  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const rel = DEFAULT_TUTOR_LIVE2D_MODEL_PATH.startsWith('/')
    ? DEFAULT_TUTOR_LIVE2D_MODEL_PATH
    : `/${DEFAULT_TUTOR_LIVE2D_MODEL_PATH}`;
  return `${base}${rel}`;
}
