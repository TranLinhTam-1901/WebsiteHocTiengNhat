import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import { LearnerCourseService } from '../../../services/Learner/learnerCourseService';
import type { CourseListItemDTO } from '../../../interfaces/Learner/Course';

const CourseListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [courses, setCourses] = useState<CourseListItemDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const list = await LearnerCourseService.getCourses();
        console.log("Dữ liệu khóa học:", list);
        if (alive) setCourses(list);

      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Không tải được danh sách khóa học.';
        toast.error(msg);
        if (alive) setCourses([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [location.key]);

  const handleContinue = (c: CourseListItemDTO) => {
    if (c.continueLessonID) {
      navigate(`/learner/lessons/${c.continueLessonID}/learn`, {
        state: { courseId: c.courseID },
      });
    } else {
      navigate(`/learner/courses/${c.courseID}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[#fbf9fa]">
        <LearnerHeader title="Khóa học" />
        <div className="flex-1 flex items-center justify-center">
          <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#fbf9fa] font-display">
      <LearnerHeader title="Khóa học" />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <p className="text-[#886373] text-sm font-medium">
            Các khóa theo trình độ của bạn. Tiến độ dựa trên bài đã hoàn thành.
          </p>

          {courses.length === 0 ? (
            <div className="bg-white rounded-[2rem] border-2 border-dashed border-[#f4f0f2] p-12 text-center">
              <p className="text-[#886373] font-medium">Chưa có khóa học phù hợp với trình độ hiện tại.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map((c, index) => (
                <div
                  key={c.courseID || index}
                  className="bg-white rounded-[2rem] border-2 border-[#f4f0f2] p-8 shadow-sm flex flex-col gap-4"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                        {c.levelName}
                      </span>
                      <h3 className="text-xl font-black text-[#181114] mt-1">{c.courseName}</h3>
                      {c.description && (
                        <p className="text-sm text-[#886373] mt-2 line-clamp-2">{c.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-[#886373]">
                      <span>
                        {c.completedLessons} / {c.totalLessons} bài
                      </span>
                      <span>{c.progressPercent}%</span>
                    </div>
                    <div className="h-2 bg-[#f4f0f2] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(100, c.progressPercent)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-auto pt-2">
                    <Link
                      to={`/learner/courses/${c.courseID}`}
                      className="px-5 py-2.5 rounded-xl border-2 border-[#f4f0f2] text-sm font-bold text-[#181114] hover:border-primary/30 transition-all"
                    >
                      Xem bài học
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleContinue(c)}
                      className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-105 transition-all"
                    >
                      {c.continueLessonID
                        ? c.continueLessonTitle
                          ? `Tiếp tục: ${c.continueLessonTitle}`
                          : 'Tiếp tục'
                        : c.totalLessons > 0 && c.completedLessons >= c.totalLessons
                          ? 'Đã xong'
                          : 'Vào học'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CourseListPage;
