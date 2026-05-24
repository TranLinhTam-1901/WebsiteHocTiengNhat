import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import { LearnerCourseService } from '../../../services/Learner/learnerCourseService';
import type { CourseTimelineItemDTO } from '../../../interfaces/Learner/Course';
import { CourseTimelineItemType } from '../../../interfaces/Learner/Course';
import { SkillType } from '../../../interfaces/Admin/QuestionBank';

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [courseName, setCourseName] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();
  const [timeline, setTimeline] = useState<CourseTimelineItemDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    let alive = true; // Bắt đầu "sự sống" của hiệu ứng này

    (async () => {
      setLoading(true);
      try {
        // Giả sử API trả về: { courseName: string, items: CourseTimelineItemDTO[] }
        const data = await LearnerCourseService.getCourseTimeline(courseId);
        
        // CHỈ cập nhật nếu Component vẫn còn "sống"
       if (alive) {
        setTimeline(data);
        
        // Lấy courseName từ phần tử đầu tiên nếu mảng có dữ liệu
        if (data.length > 0) {
          setCourseName(data[0].courseName);
        }
      }
      } catch (e: unknown) {
        const msg = (e as any)?.response?.data?.message || 'Lỗi tải dữ liệu';
        toast.error(msg);
        if (alive) setTimeline([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

  return () => {
    alive = false; 
  };
}, [courseId, location.key]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[#fbf9fa]">
        <LearnerHeader title="Chi tiết khóa" />
        <div className="flex-1 flex items-center justify-center">
          <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#fbf9fa] font-display">
      <LearnerHeader>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/learner/courses')}
            className="size-10 rounded-full border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:bg-[#f4f0f2]"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-xl font-bold text-[#181114] uppercase tracking-tight">{courseName || 'Đang tải...'}</h2>
        </div>
      </LearnerHeader>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-4">
          {timeline.length === 0 ? (
            <p className="text-center text-[#886373]">Không có bài học hoặc kiểm tra trong khóa này.</p>
          ) : (
            timeline.map((item) => {
              const isLesson = item.itemType === CourseTimelineItemType.Lesson;
              const badgeLabel = isLesson
                ? 'Bài học'
                : item.isCheckpoint
                ? 'Checkpoint'
                : 'Bài luyện tập';
              const examSkillLabel = item.skillType != null ? SkillType[item.skillType] : 'Luyện tập';

              return (
                <div
                  key={item.itemID}
                  className={`rounded-2xl border-2 p-6 flex flex-col gap-3 ${
                    item.isLocked ? 'border-[#f4f0f2] bg-zinc-50 opacity-70' : 'border-[#f4f0f2] bg-white shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-primary/10 text-primary">
                          {badgeLabel}
                        </span>
                        {item.hasNewVersion && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700 border border-amber-200 animate-pulse">
                            Có bản mới
                          </span>
                        )}
                        {item.isCompleted && (
                          <span className="text-[10px] font-black uppercase text-emerald-600">Đã xong</span>
                        )}
                        {item.isLocked && (
                          <span className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">lock</span>
                            Khóa
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-[#181114]">{item.title}</h3>
                      {/* <p className="text-xs text-[#886373] mt-1">
                        Thứ tự {item.sortOrder}
                        {!isLesson && item.skillType != null ? ` · ${examSkillLabel}` : ''}
                      </p> */}
                    </div>
                    {!item.isLocked && (
                      isLesson ? (
                        <Link
                          to={`/learner/lessons/${item.lessonID}/learn`}
                          state={{ courseId }}
                          className="shrink-0 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold"
                        >
                          Học
                        </Link>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => navigate(`/learner/quiz/exam/${item.examID}`, { state: { courseId } })}
                           className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            item.hasNewVersion 
                              ? 'bg-amber-500 text-white shadow-md hover:bg-amber-600 ring-2 ring-amber-200' // Làm nổi bật nút nếu có bản mới
                              : 'bg-primary text-white'
                          }`}
                          >
                          {item.hasNewVersion ? 'Làm bản mới' : 'Làm bài'}
                          </button>
                          {item.latestResultID && (
                            <button
                              type="button"
                              onClick={() => navigate(`/learner/quiz/result/${item.latestResultID}`, { state: { courseId } })}
                              className="px-4 py-2 rounded-xl border border-[#f4f0f2] bg-white text-[#181114] text-sm font-bold hover:border-primary/30"
                            >
                              Xem kết quả cũ
                            </button>
                          )}
                        </div>
                      )
                    )}
                  </div>
                  {/* {!isLesson && item.lessonID && (
                    <p className="text-xs text-[#886373]">Theo bài học: {item.lessonID}</p>
                  )} */}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default CourseDetailPage;
