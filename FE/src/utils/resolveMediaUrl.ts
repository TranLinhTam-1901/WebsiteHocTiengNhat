/** Chuẩn hóa đường dẫn ảnh/âm thanh từ API (relative → URL đầy đủ tới host BE). */
export function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) return path;
  const api = import.meta.env.VITE_API_URL ?? 'https://localhost:7055/api';
  const base = api.replace(/\/api\/?$/, '');
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}
