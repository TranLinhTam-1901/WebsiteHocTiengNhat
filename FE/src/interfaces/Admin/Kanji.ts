export interface CreateUpdateKanjiDTO {
  character: string;
  onyomi: string;
  kunyomi: string;
  meaning: string;
  strokeCount: number;
  strokeGif?: string;
  radicalID: string;

  mnemonics?: string;
  popularity: number;
  note?: string;
  status: number;
  levelID: string;
  topicID: string;
  lessonID: string;

  // 1. Dùng để quản lý danh sách hiển thị trên Form (Mảng Object)
  relatedVocabs?: { 
    vocabID: string; 
    word: string; 
    reading: string;
    meaning: string; 
  }[];

  // 2. Dùng để gửi lên Backend (Mảng chuỗi ID)
  relatedVocabIDs?: string[]; 
}

export interface KanjiItem {
  id: string;
  character: string;
  onyomi: string;
  kunyomi: string;
  radical: RadicalItem;

  meaning: string;
  levelName: string;
  topicName: string;
  strokeCount: number;
  status: number;
  updatedAt: string;
}

export interface RadicalItem {
  id: string;
  character: string;
  name: string;
  stroke: number; 
}

export interface RadicalVariantItem {
  variantID: string;
  character: string;
  name?: string;
  radicalID: string;
}