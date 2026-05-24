/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_LIVE2D_MODEL_URL?: string;
  /** Thư mục dict kuromoji (URL kết thúc /). Mặc định dùng CDN nếu không set. */
  readonly VITE_KUROMOJI_DICT_URL?: string;
}

export {};