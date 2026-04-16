const STORAGE_KEY = 'jquiz_browser_session_id';

/** Id ổn định theo profile trình duyệt (localStorage); mọi tab cùng trình duyệt dùng chung. */
export function getBrowserSessionId(): string {
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return 'browser-session-fallback';
  }
}
