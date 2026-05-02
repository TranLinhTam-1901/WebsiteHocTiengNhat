import axiosInstance from '../../utils/axiosInstance';
import { ExamType } from '../../interfaces/Admin/QuestionBank';
import { LearnerExamListItem, LearnerExamFilters } from '../../interfaces/Learner/Exam';

const API_URL = '/api/learner/exams';

export const LearnerExamService = {
  async getExams(filters: LearnerExamFilters = {}): Promise<LearnerExamListItem[]> {
    const response = await axiosInstance.get(API_URL, {
      params: {
        search: filters.search || undefined,
        levelId: filters.levelId || undefined,
        type: filters.type !== undefined ? filters.type : undefined,
      },
    });
    return response.data;
  },

  async getExamDetails(id: string): Promise<LearnerExamListItem> {
    const response = await axiosInstance.get(`${API_URL}/${id}`);
    return response.data;
  },
};
