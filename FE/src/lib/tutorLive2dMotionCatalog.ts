/**
 * Đọc `FileReferences.Motions` từ model3.json (URL đã resolve) để biết nhóm motion có trên model.
 * Thư mục model không thể liệt kê từ trình duyệt; cần khai báo Motions trong model3 (hoặc manifest tùy chỉnh).
 */

export type TutorMotionCatalog = {
  motionGroupNames: string[];
  hasIdle: boolean;
  hasTutorReply: boolean;
  hasTapBody: boolean;
};

export async function fetchTutorMotionCatalog(modelUrl: string): Promise<TutorMotionCatalog | null> {
  try {
    const res = await fetch(modelUrl, { cache: 'force-cache' });
    if (!res.ok) return null;
    const j = (await res.json()) as {
      FileReferences?: { Motions?: Record<string, unknown> };
    };
    const motions = j?.FileReferences?.Motions;
    const motionGroupNames =
      motions && typeof motions === 'object'
        ? Object.keys(motions).filter((k) => Array.isArray((motions as Record<string, unknown>)[k]))
        : [];
    return {
      motionGroupNames,
      hasIdle: motionGroupNames.includes('Idle'),
      hasTutorReply: motionGroupNames.includes('TutorReply'),
      hasTapBody: motionGroupNames.includes('TapBody'),
    };
  } catch {
    return null;
  }
}
