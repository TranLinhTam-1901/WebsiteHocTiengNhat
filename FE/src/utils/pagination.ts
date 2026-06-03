export type PaginationItem = number | 'ellipsis';

/** Trang hiển thị dạng 1 … 4 5 6 … 20 (không liệt kê hết). */
export function getVisiblePages(current: number, total: number): PaginationItem[] {
  if (total <= 0) return [];
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, 4, 5, 'ellipsis', total];
  }
  if (current >= total - 2) {
    return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
}
