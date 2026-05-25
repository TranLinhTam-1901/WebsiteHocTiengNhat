/** Chuẩn hóa đường dẫn ảnh/âm thanh từ API (relative → URL đầy đủ tới host BE). */
export function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) return path;
  const api = import.meta.env.VITE_API_URL ?? 'https://localhost:7055/api';
  const base = api.replace(/\/api\/?$/, '');
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}

/** Chuẩn hóa trước khi gửi lên API: giữ base64 hoặc đường dẫn `/uploads/...`, không gửi full URL. */
export function normalizeMediaForSave(path?: string | null): string | null | undefined {
  if (!path) return path;
  if (path.startsWith('data:')) return path;
  if (path.startsWith('/uploads/')) return path;

  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const pathname = new URL(path).pathname;
      if (pathname.startsWith('/uploads/')) return pathname;
    } catch {
      /* ignore invalid URL */
    }
  }

  return path.startsWith('/') ? path : `/${path}`;
}
