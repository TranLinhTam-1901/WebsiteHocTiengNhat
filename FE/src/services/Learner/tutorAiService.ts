import axiosInstance from '../../utils/axiosInstance';

const BASE = '/tutor';

export type TutorChatRole = 'user' | 'assistant';

export interface TutorChatMessage {
  role: TutorChatRole;
  content: string;
}

export interface TutorExplainMistakePayload {
  questionContent: string;
  skillType?: string;
  userAnswer?: string;
  correctAnswer?: string;
  explanationFromSystem?: string;
}

export const TutorAiService = {
  chat: async (messages: TutorChatMessage[]) => {
    const { data } = await axiosInstance.post<{ reply: string }>(`${BASE}/chat`, { messages });
    return data.reply;
  },

  explainMistake: async (payload: TutorExplainMistakePayload) => {
    const { data } = await axiosInstance.post<{ explanation: string }>(`${BASE}/explain-mistake`, payload);
    return data.explanation;
  },
};
