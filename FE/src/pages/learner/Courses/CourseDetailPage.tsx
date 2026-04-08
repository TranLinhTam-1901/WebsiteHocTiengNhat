import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import { LearnerCourseService } from '../../../services/Learner/learnerCourseService';
import type { LessonListItemDTO } from '../../../interfaces/Learner/Course';

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [lessons, setLessons] = useState<LessonListItemDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const list = await LearnerCourseService.getLessonsInCourse(courseId);
        if (alive) setLessons(list);
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Không tải được danh sách bài học.';
        toast.error(msg);
        if (alive) setLessons([]);
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
          <h2 className="text-xl font-bold text-[#181114] uppercase tracking-tight">Bài trong khóa</h2>
        </div>
      </LearnerHeader>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-4">
          {lessons.length === 0 ? (
            <p className="text-center text-[#886373]">Không có bài học hoặc khóa không khớp trình độ.</p>
          ) : (
            lessons.map((l) => (
              <div
                key={l.lessonID}
                className={`rounded-2xl border-2 p-6 flex flex-col gap-3 ${
                  l.isLocked ? 'border-[#f4f0f2] bg-zinc-50 opacity-70' : 'border-[#f4f0f2] bg-white shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {l.topicName && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-primary/10 text-primary">
                          {l.topicName}
                        </span>
                      )}
                      {l.isCompleted && (
                        <span className="text-[10px] font-black uppercase text-emerald-600">Đã xong</span>
                      )}
                      {l.isLocked && (
                        <span className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">lock</span>
                          Khóa
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-[#181114]">{l.title}</h3>
                    <p className="text-xs text-[#886373] mt-1">
                      Độ khó {l.difficulty} · Thứ tự {l.priority}
                    </p>
                  </div>
                  {!l.isLocked && (
                    <Link
                      to={`/learner/lessons/${l.lessonID}/learn`}
                      state={{ courseId }}
                      className="shrink-0 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold"
                    >
                      Học
                    </Link>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] font-bold text-[#886373]">
                  <span>Kanji {l.counts.kanji}</span>
                  <span>·</span>
                  <span>Từ {l.counts.vocabulary}</span>
                  <span>·</span>
                  <span>Ngữ pháp {l.counts.grammar}</span>
                  <span>·</span>
                  <span>Đọc {l.counts.reading}</span>
                  <span>·</span>
                  <span>Nghe {l.counts.listening}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default CourseDetailPage;
