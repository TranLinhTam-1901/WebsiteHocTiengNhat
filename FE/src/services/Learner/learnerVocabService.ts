import axiosInstance from '../../utils/axiosInstance';
import { LearnerVocabDetail, LearnerVocabListItem } from '../../interfaces/Learner/StudyResource';

export const learnerVocabService = {
  getAll: async (): Promise<LearnerVocabListItem[]> => {
    const response = await axiosInstance.get('learner/vocabulary/get-all');
    return response.data;
  },

  getById: async (id: string): Promise<LearnerVocabDetail> => {
    const response = await axiosInstance.get(`learner/vocabulary/get-by-id/${id}`);
    return normalizeVocabDetail(response.data);
  },

  getLevels: async (): Promise<{ id: string; name: string }[]> => {
    const response = await axiosInstance.get('learner/vocabulary/metadata/levels');
    return response.data;
  },

  getTopics: async (): Promise<{ id: string; name: string }[]> => {
    const response = await axiosInstance.get('learner/vocabulary/metadata/topics');
    return response.data;
  },

  getWordTypes: async (): Promise<{ id: string; name: string }[]> => {
    const response = await axiosInstance.get('learner/vocabulary/metadata/word-types');
    return response.data;
  },
};

function normalizeVocabDetail(raw: Record<string, unknown>): LearnerVocabDetail {
  const related = (raw.relatedKanjis as Record<string, string>[] | undefined) ?? [];
  return {
    ...(raw as unknown as LearnerVocabDetail),
    relatedKanjis: related.map((k) => ({
      kanjiID: String(k.kanjiID ?? k.KanjiID ?? ''),
      character: String(k.character ?? ''),
      onyomi: String(k.onyomi ?? ''),
      kunyomi: String(k.kunyomi ?? ''),
      meaning: String(k.meaning ?? ''),
    })),
  };
}
