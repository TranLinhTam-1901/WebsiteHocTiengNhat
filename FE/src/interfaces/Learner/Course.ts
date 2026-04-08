/** Khớp JSON PascalCase từ LearnerCourseController */

export interface LearnCountsDTO {
  kanji: number;
  vocabulary: number;
  reading: number;
  grammar: number;
  listening: number;
}

export interface CourseListItemDTO {
  courseID: string;
  courseName: string;
  description?: string | null;
  levelName: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  continueLessonID?: string | null;
  continueLessonTitle?: string | null;
}

export interface LessonListItemDTO {
  lessonID: string;
  title: string;
  difficulty: number;
  priority: number;
  topicID?: string | null;
  topicName?: string | null;
  isCompleted: boolean;
  isLocked: boolean;
  counts: LearnCountsDTO;
}

export interface ExampleDTO {
  content: string;
  translation: string;
  audioURL?: string | null;
}

export interface RadicalDTO {
  radicalID: string;
  character: string;
  name: string;
  meaning?: string | null;
  strokeCount: number;
}

export interface KanjiItemDTO {
  kanjiID: string;
  character: string;
  onyomi: string;
  kunyomi: string;
  meaning: string;
  strokeCount: number;
  radical?: RadicalDTO | null;
}

export interface KanjiBlockDTO {
  displayCount: number;
  items: KanjiItemDTO[];
}

export interface VocabularyItemDTO {
  vocabID: string;
  word: string;
  reading: string;
  meaning: string;
  audioURL?: string | null;
  imageURL?: string | null;
  mnemonics?: string | null;
  wordTypes: string[];
  examples: ExampleDTO[];
}

export interface VocabularyBlockDTO {
  displayCount: number;
  items: VocabularyItemDTO[];
}

export interface GrammarItemDTO {
  grammarID: string;
  title: string;
  structure: string;
  meaning: string;
  explanation: string;
  usageNote?: string | null;
  grammarType: number;
  formality: number;
  grammarGroupName?: string | null;
  examples: ExampleDTO[];
}

export interface GrammarBlockDTO {
  displayCount: number;
  items: GrammarItemDTO[];
}

export interface ReadingItemDTO {
  readingID: string;
  title: string;
  content: string;
  translation: string;
  wordCount: number;
  estimatedTime: number;
}

export interface ReadingBlockDTO {
  displayCount: number;
  items: ReadingItemDTO[];
}

export interface ListeningItemDTO {
  listeningID: string;
  title: string;
  audioURL: string;
  script?: string | null;
  transcript?: string | null;
  duration: number;
  speedCategory?: string | null;
}

export interface ListeningBlockDTO {
  displayCount: number;
  items: ListeningItemDTO[];
}

export interface LessonLearnDTO {
  lessonID: string;
  lessonTitle: string;
  topicIDs: string[];
  topicNames: string[];
  kanjiBlock?: KanjiBlockDTO | null;
  vocabularyBlock?: VocabularyBlockDTO | null;
  grammarBlock?: GrammarBlockDTO | null;
  readingBlock?: ReadingBlockDTO | null;
  listeningBlock?: ListeningBlockDTO | null;
}

export interface LessonCompleteResponseDTO {
  lessonId: string;
  isCompleted: boolean;
  status: string;
  completedAt: string;
}
