// 1. Enum phải khớp hoàn toàn với Backend
export enum QuestionType {
    MultipleChoice = 0, // Chọn 1 trong 4 (Kanji, Từ vựng, Ngữ pháp)
    FillInBlank = 1,    // Điền từ (Thường là trợ từ hoặc đuôi động từ)
    Ordering = 2,       // Sắp xếp câu (Dạng bài dấu sao ★ cực kỳ quan trọng)
    Synonym = 3,        // Tìm từ đồng nghĩa (Dạng bài đặc thù JLPT)
    Usage = 4,
}

export enum QuestionStatus {
    Active = 1,
    Draft = 0
}


export enum SkillType {
    General = 0,
    Vocabulary = 1,
    Grammar = 2,
    Kanji = 3,
    Reading = 4,
    Listening = 5,
    Practice = 6
} 

export enum ExamType {
    StandardJLPT = 0,
    LessonPractice = 1,
    SkillPractice = 2
}

// 2. Interface cho Đáp án
export interface AnswerDTO {
    answerText: string;
    isCorrect: boolean;
}

// 3. Interface chính cho API Create
export interface CreateQuestionDTO {
    lessonID: string;
    content: string;
    questionType: QuestionType;
    difficulty: number;
    // audioURL?: string;
    // mediaTimestamp?: number;
    explanation?: string;
    equivalentID?: string | null;
    sourceID?: string | null;
    topicIds: string[];
    status: QuestionStatus;
    skillType?: SkillType; 
    answers: AnswerDTO[];
}

// 4. Interface cho vật liệu phôi (Source Materials) từ Task 1
export interface SourceMaterial {
    id: string;
    word?: string;      // Cho Vocabulary
    character?: string; // Cho Kanji
    title?: string;     // Cho Grammar/Reading/Listening
    meaning?: string;
    example?: string;
    // audioURL?: string;
    topicID?: string;
    structure?: string; // Cho Grammar
    onyomi?: string;    // Cho Kanji
    kunyomi?: string;   // Cho Kanji
}
export interface Topics {
    topicID: string;
    topicName: string;
}

export interface LessonLookupDTO {
    lessonID: string;
    title: string;
    levelValue: string; 
    levelName: string;  
}

// Dành cho hiển thị danh sách (View 1)
export interface QuestionListItem {
  questionID: string;
  content: string;
  questionType: QuestionType; 
  difficulty: number;
  status: QuestionStatus; 
  hasAudio: boolean;
  linkedCount: number;
  lessonName: string;
}


export interface QuestionDetail {
  questionID?: string; // Optional vì khi tạo mới chưa có ID
  content: string;
  questionType: QuestionType;
  difficulty: number;
//   audioURL?: string;
//   mediaTimestamp?: number;
  explanation?: string;
  equivalentID?: string;
  topicIds: string[];
  sourceID?: string;
  lessonID: string;
  status: QuestionStatus;
  answers: AnswerDTO[];
}