const DB_NAME = 'tutor-ai-character-v2';
const DB_VERSION = 2;
const STORE = 'conversations';

export type LocalTutorMessage = {
  clientId: string;
  role: 'user' | 'assistant';
  userContent?: string;
  vietnameseText?: string;
  japaneseSpeech?: string;
  expression?: string;
  serverAssistantMessageId?: number;
};

export type LocalTutorConversation = {
  localId: string;
  /** Khớp với ClaimTypes.NameIdentifier — tách dữ liệu theo tài khoản. */
  ownerUserId: string;
  /** Id model Live2D (FE) — tách hội thoại offline theo nhân vật. */
  live2dModelId?: string;
  serverConversationId?: number;
  title?: string;
  updatedAt: number;
  messages: LocalTutorMessage[];
  /** Base64 WAV for last assistant message keyed by clientId */
  audioBase64ByClientId?: Record<string, string>;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'localId' });
      }
      // v2: thêm live2dModelId trên object (schemaless); không cần đổi store.
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveLocalConversation(conv: LocalTutorConversation): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ ...conv, updatedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadLocalConversation(
  localId: string,
  ownerUserId: string
): Promise<LocalTutorConversation | null> {
  const db = await openDb();
  const row = await new Promise<LocalTutorConversation | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const q = tx.objectStore(STORE).get(localId);
    q.onsuccess = () => resolve(q.result as LocalTutorConversation | undefined);
    q.onerror = () => reject(q.error);
  });
  db.close();
  if (!row) return null;
  if (row.ownerUserId && row.ownerUserId !== ownerUserId) return null;
  if (!row.ownerUserId) return null;
  return row;
}

export async function listLocalConversations(): Promise<LocalTutorConversation[]> {
  const db = await openDb();
  const rows = await new Promise<LocalTutorConversation[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const q = tx.objectStore(STORE).getAll();
    q.onsuccess = () => resolve((q.result as LocalTutorConversation[]) ?? []);
    q.onerror = () => reject(q.error);
  });
  db.close();
  return rows.sort((a, b) => b.updatedAt - a.updatedAt);
}
