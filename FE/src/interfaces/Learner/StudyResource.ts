export interface LearnerVocabListItem {
  vocabID: string;
  word: string;
  reading: string;
  meaning: string;
  wordTypes: string[];
  topics: string[];
  isCommon: boolean;
  priority: number;
  status: number;
  levelName: string;
  lessonName: string;
  updatedAt: string;
}

export interface LearnerVocabDetail {
  vocabID: string;
  word: string;
  reading: string;
  meaning: string;
  wordTypes: { id: string; name: string }[];
  topics: { topicID: string; topicName: string }[];
  isCommon: boolean;
  mnemonics?: string;
  imageURL?: string;
  audioURL?: string;
  priority: number;
  status: number;
  levelName: string;
  lessonName: string;
  examples: { content: string; translation: string }[];
  relatedKanjis: {
    kanjiID: string;
    character: string;
    onyomi: string;
    kunyomi: string;
    meaning: string;
  }[];
}

export interface LearnerKanjiListItem {
  id: string;
  character: string;
  meaning: string;
  onyomi: string;
  kunyomi: string;
  strokeCount: number;
  radical?: {
    id: string;
    character: string;
    name: string;
    stroke: number;
  } | null;
  status: number;
  popularity: number;
  levelName: string;
  topicName: string;
  updatedAt: string;
}

export interface LearnerKanjiDetail {
  id: string;
  character: string;
  onyomi: string;
  kunyomi: string;
  meaning: string;
  strokeCount: number;
  strokeGif?: string;
  mnemonics?: string;
  popularity: number;
  note?: string;
  radical?: {
    id: string;
    character: string;
    name: string;
    stroke: number;
  } | null;
  radicalVariants: {
    variantID: string;
    character: string;
    name?: string;
    radicalID: string;
  }[];
  levelName: string;
  topicName: string;
  lessonName: string;
  relatedVocabs: {
    vocabID: string;
    word: string;
    reading: string;
    meaning: string;
  }[];
}
