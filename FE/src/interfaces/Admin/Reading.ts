import { QuestionType, QuestionStatus } from './Question';

export interface ReadingAnswerDTO {
  answerID?: string; // Thêm để hỗ trợ hiển thị/cập nhật
  answerText: string;
  isCorrect: boolean;
}

export interface ReadingQuestionDTO {
  questionID?: string; 
  content: string;
  explanation: string | null;
  difficulty: number;
  questionType: number; // Chuyển sang number để khớp Enum C#
  status: number;       // Chuyển sang number để khớp Enum C#
  lessonID: string;     // Bắt buộc phải có Guid hợp lệ
  readingID?: string | null;
  answers: ReadingAnswerDTO[];
}

export interface CreateUpdateReadingDTO {
  title: string;
  content: string;      
  translation: string; 
  wordCount: number;    // Thêm trường này theo Model C#
  estimatedTime: number; // Thêm trường này theo Model C#
  levelID: string;
  topicID: string;
  lessonID: string;
  status: number;       // Theo C# Reading Status là int
  questions: ReadingQuestionDTO[]; 
}

export interface ReadingItem {
  id: string;
  title: string;
  levelName: string;
  topicName: string;
  wordCount: number;
  estimatedTime: number;
  status: number;
  updatedAt: string;
}