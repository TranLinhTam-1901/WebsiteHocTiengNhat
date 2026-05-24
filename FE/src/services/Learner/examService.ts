import axiosInstance from '../../utils/axiosInstance';
import { ExamType } from '../../interfaces/Admin/QuestionBank';
import {
  LearnerExamListItem,
  LearnerExamFilters,
  ExamDisplayDTO,
  SubmitExamRequestDTO,
  SubmitExamResultDTO,
  ExamListItemDTO,
  ExamSummaryDTO,
  ExamStructuredDTO,
  ExamResultListItemDTO,
} from '../../interfaces/Learner/Exam';

const API_URL = 'learner/exams';

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

  async getExamQuestions(id: string): Promise<ExamDisplayDTO> {
    const response = await axiosInstance.get(`${API_URL}/${id}/questions`);
    return response.data;
  },


  async getExamResult(resultId: string): Promise<SubmitExamResultDTO> {
    const response = await axiosInstance.get(`${API_URL}/results/${resultId}`);
    return response.data;
  },
  
// Các API bổ sung cho phần Summary và cấu trúc đề thi JLPT
  async getJLPTExams(): Promise<ExamListItemDTO[]> {
  const response = await axiosInstance.get(`${API_URL}/jlpt`);
  return response.data;
  },

  async getExamSummary(id: string): Promise<ExamSummaryDTO> {
    const response = await axiosInstance.get(
      `${API_URL}/${id}/summary`
    );

    return response.data;
  },

  async getExamQuestionsStructured(
    id: string
  ): Promise<ExamStructuredDTO> {
    const response = await axiosInstance.get(
      `${API_URL}/${id}/questions/structured`
    );

    return response.data;
  },

   async submitExam(id: string, data: SubmitExamRequestDTO): Promise<SubmitExamResultDTO> {
    const response = await axiosInstance.post(`${API_URL}/${id}/submit`, data);
    return response.data;
  },

    async getMyExamResults( params?: {examType?: number;examId?: string;}): Promise<ExamResultListItemDTO[]> {
     const response = await axiosInstance.get(`${API_URL}/results`,{ params });
     return response.data;
  }


};
