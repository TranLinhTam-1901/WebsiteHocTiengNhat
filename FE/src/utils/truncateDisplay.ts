/** Rút gọn chuỗi theo số ký tự, thêm "..." nếu dài hơn giới hạn. */
export function truncateChars(
  text: string | null | undefined,
  maxLength: number,
  fallback = '—'
): string {
  const s = (text ?? '').trim();
  if (!s) return fallback;
  if (s.length <= maxLength) return s;
  return `${s.slice(0, maxLength).trimEnd()}...`;
}

/** Rút gọn danh sách phân tách bằng dấu phẩy, slash, v.v. — chỉ giữ tối đa maxItems mục. */
export function truncateListDisplay(
  text: string | null | undefined,
  maxItems: number,
  fallback = '—'
): string {
  const s = (text ?? '').trim();
  if (!s) return fallback;
  const parts = s.split(/\s*[,，、;；/]\s*/).filter(Boolean);
  if (parts.length <= maxItems) return s;
  return `${parts.slice(0, maxItems).join(', ')}...`;
}
