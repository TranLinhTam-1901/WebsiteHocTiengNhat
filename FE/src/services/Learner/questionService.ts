import axios from 'axios';
import { AnswerSubmissionDto } from '../../interfaces/Learner/UserAnswerHistory';

const API_URL = '/api/questions';

export const QuestionService = {
  // Kiểm tra đáp án (Trắc nghiệm hoặc Điền từ)
  checkAnswer: async (submission: AnswerSubmissionDto) => {
    const response = await axios.post(`${API_URL}/check-answer`, submission, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  }
};