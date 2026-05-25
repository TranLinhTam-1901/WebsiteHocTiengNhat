export interface LessonDTO {
  lessonID: string;
  courseID: string;
  courseName: string;
  title: string;
  priority: number;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUpdateLessonDTO {
  courseID: string;
  title: string;
}

export interface LessonMetadataItem {
  id: string;
  name: string;
}

export interface SkillType {
  id: number;
  name: string;
}
