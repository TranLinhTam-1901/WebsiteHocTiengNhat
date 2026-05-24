import axiosInstance from '../../utils/axiosInstance';

const BASE = '/tutor';

export type TutorChatRole = 'user' | 'assistant';

export interface TutorChatMessage {
  role: TutorChatRole;
  content: string;
}

export interface TutorCharacterChatRequest {
  messages: TutorChatMessage[];
  learnerJlptLevel?: string;
}

export interface TutorCharacterReply {
  vietnameseText: string;
  japaneseSpeech: string;
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

  characterChat: async (body: TutorCharacterChatRequest) => {
    const { data } = await axiosInstance.post<TutorCharacterReply>(`${BASE}/character-chat`, body);
    return data;
  },

  explainMistake: async (payload: TutorExplainMistakePayload) => {
    const { data } = await axiosInstance.post<{ explanation: string }>(`${BASE}/explain-mistake`, payload);
    return data.explanation;
  },

  synthesizeSpeech: async (text: string, speakerId?: number) => {
    try {
      const payload: Record<string, unknown> = { text };
      if (speakerId !== undefined && speakerId !== null) {
        payload.speakerId = speakerId;
      }

      const response = await axiosInstance.post(`${BASE}/speech`, payload, { responseType: 'arraybuffer' });
      return new Blob([response.data], { type: 'audio/wav' });
    } catch (error: unknown) {
      console.error('Lỗi Voicevox:', (error as { response?: { status?: number } })?.response?.status);
      throw error;
    }
  },

  createConversation: async (title?: string, live2dModelId?: string) => {
    const { data } = await axiosInstance.post<{ id: number }>(`${BASE}/conversations`, {
      title,
      live2dModelId: live2dModelId ?? undefined,
    });
    return data.id;
  },

  listConversations: async (live2dModelId: string) => {
    const { data } = await axiosInstance.get<
      Array<{ id: number; title?: string | null; updatedAt: string; live2dModelId?: string }>
    >(`${BASE}/conversations`, { params: { live2dModelId } });
    return data;
  },

  getConversation: async (conversationId: number, live2dModelId: string) => {
    const { data } = await axiosInstance.get<{
      id: number;
      title?: string | null;
      updatedAt: string;
      live2dModelId?: string;
      messages: Array<{
        id: number;
        role: string;
        clientMessageId: string;
        plainContent?: string | null;
        vietnameseText?: string | null;
        japaneseSpeech?: string | null;
        expression?: string | null;
        audioPublicUrl?: string | null;
      }>;
    }>(`${BASE}/conversations/${conversationId}`, { params: { live2dModelId } });
    return data;
  },

  appendTurn: async (
    conversationId: number,
    body: {
      live2dModelId?: string;
      userClientMessageId: string;
      userContent: string;
      assistantClientMessageId: string;
      vietnameseText?: string;
      japaneseSpeech?: string;
      expression?: string;
      audioWavBase64?: string;
      speakerId?: number;
    }
  ) => {
    const { data } = await axiosInstance.post<{
      conversationId: number;
      userMessageId: number;
      assistantMessageId: number;
      audioPublicUrl?: string | null;
    }>(`${BASE}/conversations/${conversationId}/turn`, body);
    return data;
  },

  fetchMessageAudioBlob: async (messageId: number) => {
    const { data } = await axiosInstance.get<ArrayBuffer>(`${BASE}/messages/${messageId}/audio`, {
      responseType: 'arraybuffer',
    });
    return new Blob([data], { type: 'audio/wav' });
  },

  transcribeSpeech: async (audio: Blob, language: 'vi' | 'ja') => {
    const form = new FormData();
    const mime = audio.type || 'audio/webm';
    const ext = mime.includes('wav') ? 'wav' : mime.includes('mp4') ? 'm4a' : 'webm';
    form.append('file', audio, `speech.${ext}`);
    form.append('language', language);
    const { data } = await axiosInstance.post<{ text: string }>(`${BASE}/transcribe`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120_000,
    });
    return (data.text ?? '').trim();
  },
};
