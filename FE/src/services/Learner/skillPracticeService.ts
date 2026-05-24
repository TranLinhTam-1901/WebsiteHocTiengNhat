import axiosInstance from '../../utils/axiosInstance';
import { SkillPracticeDTO, SkillPracticeExamDTO } from '../../interfaces/Learner/SkillPractice';

const API_URL = 'learner/skill-practice';

// Helper để lấy cấu hình Header có Token
const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const SkillPracticeService = {
  // // Lấy danh sách câu hỏi dựa trên filter
  // getQuestionsByFilter: async (filter: SkillPracticeDTO) => {
  //   const response = await axios.get(`${API_URL}/questions-by-filter`, {
  //     params: filter,
  //     ...getAuthHeader()
  //   });
  //   return response.data;
  // },

  // // Các API lấy Metadata
  // getRadicals: async () => (await axios.get(`${API_URL}/metadata/radicals`, getAuthHeader())).data,
  // getWordTypes: async () => (await axios.get(`${API_URL}/metadata/word-types`, getAuthHeader())).data,
  // getGrammarGroups: async () => (await axios.get(`${API_URL}/metadata/grammar-groups`, getAuthHeader())).data,
  // getLevels: async () => (await axios.get(`${API_URL}/metadata/levels`, getAuthHeader())).data,
  // getTopics: async () => (await axios.get(`${API_URL}/metadata/topics`, getAuthHeader())).data,
  // getLessons: async () => (await axios.get(`${API_URL}/metadata/lessons`, getAuthHeader())).data,
  // getSkillHub: async () => (await axios.get(`${API_URL}/skill-hub`, getAuthHeader())).data,

  // API mới: Lấy danh sách đề luyện tập theo kỹ năng
  getSkillPracticeExams: async (skillType?: number): Promise<SkillPracticeExamDTO[]> => {
    const response = await axiosInstance.get(`${API_URL}`, { 
      params: { skillType },
      ...getAuthHeader()
    });
    return response.data;
  },
};