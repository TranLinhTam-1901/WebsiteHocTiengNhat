import axiosInstance from '../../utils/axiosInstance';
import type {
  CourseListItemDTO,
  LessonCompleteResponseDTO,
  LessonLearnDTO,
  LessonListItemDTO,
} from '../../interfaces/Learner/Course';

const COURSES_BASE = 'learner/courses';

function unwrapArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  const v = data as { $values?: T[] } | undefined;
  if (v?.$values && Array.isArray(v.$values)) return v.$values;
  return [];
}

export const LearnerCourseService = {
  
  getCourses: async (): Promise<CourseListItemDTO[]> => {
    const { data } = await axiosInstance.get<CourseListItemDTO[] | { $values?: CourseListItemDTO[] }>(
      COURSES_BASE
    );
    return unwrapArray<CourseListItemDTO>(data);
  },

  getLessonsInCourse: async (courseId: string): Promise<LessonListItemDTO[]> => {
    const { data } = await axiosInstance.get<LessonListItemDTO[] | { $values?: LessonListItemDTO[] }>(
      `${COURSES_BASE}/${courseId}/lessons`
    );
    return unwrapArray<LessonListItemDTO>(data);
  },

  /** GET /api/learner/courses/{lessonId}/learn — tham số là lessonId, không phải courseId */
  getLessonLearn: async (lessonId: string): Promise<LessonLearnDTO> => {
    const { data } = await axiosInstance.get<LessonLearnDTO>(`${COURSES_BASE}/${lessonId}/learn`);
    return data;
  },

  /** POST /api/learner/lessons/{lessonId}/complete */
  completeLesson: async (lessonId: string): Promise<LessonCompleteResponseDTO> => {
    const { data } = await axiosInstance.post<LessonCompleteResponseDTO>(
      `learner/lessons/${lessonId}/complete`
    );
    return data;
  },
};
