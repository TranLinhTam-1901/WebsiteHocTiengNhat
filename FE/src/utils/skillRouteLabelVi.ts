/** Nhãn tiếng Việt cho slug kỹ năng trong URL (`/learner/skill-learning/:skillType`). */
export function skillRouteSlugToVi(slug: string | undefined): string {
  const s = (slug || '').toLowerCase();
  const map: Record<string, string> = {
    vocabulary: 'từ vựng',
    kanji: 'hán tự',
    grammar: 'ngữ pháp',
    reading: 'đọc hiểu',
    listening: 'nghe hiểu',
  };
  return map[s] || slug || 'kỹ năng';
}
