/**
 * Origin backend (không có /api) để ghép SignalR hub, v.v.
 * `VITE_API_URL` thường là `http://localhost:5167/api` → `http://localhost:5167`
 */
export function resolveBackendOrigin(): string {
  const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || 'https://localhost:7055/api';
  let withScheme = raw;
  if (!/^https?:\/\//i.test(withScheme)) {
    withScheme = `${window.location.protocol}//${window.location.host}${withScheme.startsWith('/') ? '' : '/'}${withScheme}`;
  }
  const u = new URL(withScheme);
  let p = u.pathname.replace(/\/+$/, '') || '';
  if (p.toLowerCase().endsWith('/api')) p = p.slice(0, -4);
  u.pathname = p || '/';
  if (u.pathname === '/') return u.origin;
  return `${u.origin}${u.pathname.replace(/\/+$/, '')}`;
}
