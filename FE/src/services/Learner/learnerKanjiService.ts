import axiosInstance from '../../utils/axiosInstance';
import { LearnerKanjiDetail, LearnerKanjiListItem } from '../../interfaces/Learner/StudyResource';

export interface LearnerRadicalMetadata {
  id: string;
  name: string;
  character: string;
  stroke: number;
}

export const learnerKanjiService = {
  getAll: async (): Promise<LearnerKanjiListItem[]> => {
    const response = await axiosInstance.get('learner/kanji/get-all');
    return response.data;
  },

  getById: async (id: string): Promise<LearnerKanjiDetail> => {
    const response = await axiosInstance.get(`learner/kanji/get-by-id/${id}`);
    const data = response.data;
    return {
      ...data,
      radicalVariants: Array.isArray(data.radicalVariants) ? data.radicalVariants : [],
      relatedVocabs: Array.isArray(data.relatedVocabs) ? data.relatedVocabs : [],
    };
  },

  getRadicals: async (): Promise<LearnerRadicalMetadata[]> => {
    const response = await axiosInstance.get('learner/kanji/metadata/radicals');
    return response.data;
  },

  getLevels: async (): Promise<{ id: string; name: string }[]> => {
    const response = await axiosInstance.get('learner/kanji/metadata/levels');
    return response.data;
  },

  getTopics: async (): Promise<{ id: string; name: string }[]> => {
    const response = await axiosInstance.get('learner/kanji/metadata/topics');
    return response.data;
  },
};
