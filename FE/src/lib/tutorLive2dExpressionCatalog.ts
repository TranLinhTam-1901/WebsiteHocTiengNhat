/**
 * Đọc `FileReferences.Expressions` từ model3.json (Cubism 3/4).
 * Biểu cảm cố định tutor: Thinking, Thanks, Wrong, Error (file .exp3.json) — các id khác coi là "extra" để random khi tap.
 */

const RESERVED_IDS = new Set(['thinking', 'thanks', 'wrong', 'error']);

function stemFromFile(file: string): string {
  const base = file.replace(/\\/g, '/').split('/').pop() ?? file;
  return base.replace(/\.exp3\.json$/i, '').trim();
}

export async function fetchExtraExpressionIds(modelUrl: string): Promise<string[]> {
  try {
    const res = await fetch(modelUrl, { cache: 'force-cache' });
    if (!res.ok) return [];
    const j = (await res.json()) as {
      FileReferences?: { Expressions?: Array<{ Name?: string; File?: string }> };
    };
    const list = j?.FileReferences?.Expressions;
    if (!Array.isArray(list)) return [];
    const extras: string[] = [];
    for (const item of list) {
      const name = (item?.Name ?? '').trim();
      const file = (item?.File ?? '').trim();
      if (!name || !/\.exp3\.json$/i.test(file)) continue;
      const stem = stemFromFile(file);
      const key = (name || stem).toLowerCase();
      if (RESERVED_IDS.has(key) || RESERVED_IDS.has(stem.toLowerCase())) continue;
      extras.push(name);
    }
    return extras;
  } catch {
    return [];
  }
}
