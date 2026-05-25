import React from 'react';
import { CoursePublic } from '@/services/courseService';

interface CourseCardProps {
  course: CoursePublic;
  onClickLearnMore?: (courseId: string) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onClickLearnMore }) => {
  const getLevelColor = (levelName: string) => {
    const levelLower = levelName.toLowerCase();
    if (levelLower.includes('n5')) return 'bg-green-100 text-green-800';
    if (levelLower.includes('n4')) return 'bg-blue-100 text-blue-800';
    if (levelLower.includes('n3')) return 'bg-purple-100 text-purple-800';
    if (levelLower.includes('n2')) return 'bg-orange-100 text-orange-800';
    if (levelLower.includes('n1')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-[#f4f0f2] overflow-hidden group">
      {/* Header with level badge */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-[#181114] leading-tight flex-1 group-hover:text-primary transition-colors">
            {course.courseName}
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-2 ${getLevelColor(course.levelName)}`}>
            {course.levelName}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Description */}
        {course.description && (
          <p className="text-[#886370] text-sm mb-4 line-clamp-2">
            {course.description}
          </p>
        )}

        {/* Lesson count */}
        <div className="flex items-center gap-2 mb-4 p-3 bg-[#f4f0f2] rounded-lg">
          <span className="material-symbols-outlined text-primary text-lg">school</span>
          <span className="text-sm text-[#181114] font-medium">
            {course.lessonCount} bài học
          </span>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => onClickLearnMore?.(course.courseID)}
          className="w-full bg-primary hover:bg-[#e07198] text-white py-2.5 rounded-lg font-semibold transition-all active:scale-95"
        >
          Xem chi tiết
        </button>
      </div>
    </div>
  );
};

export default CourseCard;
