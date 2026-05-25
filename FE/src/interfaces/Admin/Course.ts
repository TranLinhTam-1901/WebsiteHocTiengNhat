export interface CourseDTO {
  courseID: string;
  courseName: string;
  description: string;
  levelID: string;
  levelName: string;
  lessonCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUpdateCourseDTO {
  courseName: string;
  description: string;
  levelID: string;
}

export interface CourseMetadataItem {
  id: string;
  name: string;
}
