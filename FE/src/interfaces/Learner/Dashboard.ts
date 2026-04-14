export interface UserInterest {
    userID: string;
    topicID: string;
    interactionCount: number;
}

export interface AISuggestions {
    reviewCount: number;
    weakPoints: string[]; // Danh sách các Topic yếu
    systemMessage: string;
    focusSuggestion: string; // Gợi ý về tốc độ phản xạ
}

export interface TopicProgress {
    topicId: string;
    progress: number; // Ví dụ: 65.5
    vocabularies: any[]; // Có thể thay bằng Vocab interface nếu đã có
}


export interface ProgressDetail {
  total: number;
  completed: number;
  percentage: number;
}

export interface DashboardProgressResponse {
  totalPercent: number;
  courseProgress: ProgressDetail;
  skillProgress: ProgressDetail;
  currentLevelName: string;
}