export interface ListeningAnswerDTO {
  answerID?: string;
  answerText: string;
  isCorrect: boolean;
}

export interface ListeningQuestionDTO {
  questionID?: string;
  content: string;
  imageURL?: string | null;      // Cần thiết cho yêu cầu "mỗi câu hỏi kèm 1 hình"
  mediaTimestamp?: string | null; // Mốc thời gian trong file audio (ví dụ: "01:20")
  explanation: string | null;
  difficulty: number;
  questionType: number;
  displayOrder?: number;         // Thứ tự câu hỏi trong bài nghe
  status: number;
  lessonID: string;
  listeningID?: string | null;
  answers: ListeningAnswerDTO[];
}

export interface CreateUpdateListeningDTO {
  title: string;
  audioURL: string;              // Đường dẫn file MP3 chính
  script?: string | null;        // Lời thoại tiếng Nhật
  transcript?: string | null;    // Bản dịch hoặc chú giải
  duration: number;              // Độ dài tính bằng giây
  speedCategory?: string | null;  // "Chậm", "Bình thường", "Nhanh"
  levelID: string;
  topicID: string;
  lessonID: string;
  status: number;
  questions: ListeningQuestionDTO[];
}

export interface ListeningItem {
  id: string;
  title: string;
  audioURL: string;
  levelName: string;
  topicName: string;
  duration: number;
  speedCategory: string;
  status: number;
  updatedAt: string;
}