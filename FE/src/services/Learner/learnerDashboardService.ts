import axios from 'axios';

const API_URL = '/api/learner/dashboard';
const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export const LearnerDashboardService = {
  // Lấy chi tiết từ vựng kèm % tiến độ của Topic đó
  getTopicDetail: async (topicId: string) => {
    const response = await axios.get(`${API_URL}/topic/${topicId}`, config());
    return response.data;
  },

  // Lấy các phân tích "Điểm mù" và gợi ý lộ trình từ AI
  getAISuggestions: async () => {
    const response = await axios.get(`${API_URL}/ai-suggestions`, config());
    return response.data;
  },

  // Lấy tiến độ tổng quát các kỹ năng
  getOverallProgress: async () => {
    const response = await axios.get(`${API_URL}/overall-progress`, config());
    return response.data;
  }
};