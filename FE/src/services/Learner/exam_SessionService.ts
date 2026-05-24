import axiosInstance from '../../utils/axiosInstance';
import { SaveExamProgressDTO } from '../../interfaces/Learner/Exam_Session';
import { SubmitExamRequestDTO, SubmitExamResultDTO } from '@/interfaces/Learner/Exam';

const API_URL = 'learner/exam-sessions';

export const Exam_Session_Service = {
    async getOrCreateSession(examId: string) {
    const response = await axiosInstance.get(
        `${API_URL}/${examId}/session`
    );

    return response.data;
},

async saveProgress(data: SaveExamProgressDTO) {
    const response = await axiosInstance.post(
        `${API_URL}/session/save`,
        data
    );

    return response.data;
},

async resetSession(sessionId: string) {
    const response = await axiosInstance.delete(
        `${API_URL}/session/${sessionId}`
    );

    return response.data;
}, 

  async getActiveSession(examId: string) {
    const response = await axiosInstance.get(
      `${API_URL}/${examId}/active-session`
    );
    return response.data;
  },


};