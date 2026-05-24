import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import { LearnerCourseService } from '../../../services/Learner/learnerCourseService';
import type { CourseTimelineItemDTO } from '../../../interfaces/Learner/Course';
import { CourseTimelineItemType } from '../../../interfaces/Learner/Course';
import { SkillType } from '../../../interfaces/Admin/QuestionBank';

const VIEWBOX_WIDTH = 800;
const NODE_START_Y = 50;
const NODE_GAP = 200;
const X_PATTERN = [400, 550, 400, 250] as const;

type NodeVisualState = 'completed' | 'current' | 'locked' | 'available';

function getNodePosition(index: number) {
  return {
    x: X_PATTERN[index % X_PATTERN.length],
    y: NODE_START_Y + index * NODE_GAP,
  };
}

function getNodeVisualState(
  item: CourseTimelineItemDTO,
  currentItemId: string | null
): NodeVisualState {
  if (item.isLocked) return 'locked';
  if (item.isCompleted) return 'completed';
  if (item.itemID === currentItemId) return 'current';
  return 'available';
}

function buildSmoothPath(count: number): string {
  if (count <= 0) return '';
  if (count === 1) {
    const p = getNodePosition(0);
    return `M ${p.x} ${p.y}`;
  }

  let d = '';
  for (let i = 0; i < count; i += 1) {
    const { x, y } = getNodePosition(i);
    if (i === 0) {
      d = `M ${x} ${y}`;
      continue;
    }
    const prev = getNodePosition(i - 1);
    const midY = (prev.y + y) / 2;
    d += ` C ${prev.x} ${midY}, ${x} ${midY}, ${x} ${y}`;
  }
  return d;
}

function getItemIcon(item: CourseTimelineItemDTO, state: NodeVisualState): string {
  if (state === 'locked') return 'lock';
  if (state === 'completed') return 'check';

  if (item.itemType === CourseTimelineItemType.Exam) {
    if (item.isCheckpoint) return 'emoji_events';
    return 'quiz';
  }

  if (state === 'current') return 'play_arrow';
  return 'menu_book';
}

function getBadgeLabel(item: CourseTimelineItemDTO): string {
  if (item.itemType === CourseTimelineItemType.Lesson) return 'Bài học';
  if (item.isCheckpoint) return 'Checkpoint';
  return 'Luyện tập';
}

function getMilestoneIcon(item: CourseTimelineItemDTO): string {
  switch (item.skillType) {
    case SkillType.Vocabulary:
      return 'spellcheck';
    case SkillType.Listening:
      return 'headphones';
    case SkillType.Reading:
      return 'history_edu';
    case SkillType.Grammar:
      return 'edit_note';
    case SkillType.Kanji:
      return 'translate';
    default:
      return item.isCheckpoint ? 'emoji_events' : 'quiz';
  }
}

function getTooltipPlacement(x: number): string {
  if (x >= 500) return 'top-0 right-20 w-48 text-right';
  if (x <= 300) return 'top-0 left-16 w-40';
  return 'top-0 left-20 w-48';
}

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [courseName, setCourseName] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();
  const [timeline, setTimeline] = useState<CourseTimelineItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const currentNodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!courseId) return;
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const data = await LearnerCourseService.getCourseTimeline(courseId);

        if (alive) {
          setTimeline(data);
          if (data.length > 0) {
            setCourseName(data[0].courseName);
          }
        }
      } catch (e: unknown) {
        const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Lỗi tải dữ liệu';
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

  const currentItemId = useMemo(() => {
    const next = timeline.find((item) => !item.isLocked && !item.isCompleted);
    return next?.itemID ?? null;
  }, [timeline]);

  const currentItem = useMemo(
    () => timeline.find((item) => item.itemID === currentItemId) ?? null,
    [timeline, currentItemId]
  );

  const completedCount = useMemo(
    () => timeline.filter((item) => item.isCompleted).length,
    [timeline]
  );

  const progressPercent = timeline.length
    ? Math.round((completedCount / timeline.length) * 100)
    : 0;

  const pathD = useMemo(() => buildSmoothPath(timeline.length), [timeline.length]);
  const roadmapHeight =
    timeline.length > 0 ? getNodePosition(timeline.length - 1).y + 160 : 400;

  const pathProgress = useMemo(() => {
    if (timeline.length <= 1) return 1;
    const focusIndex = timeline.findIndex((item) => item.itemID === currentItemId);
    const anchorIndex = focusIndex >= 0 ? focusIndex : Math.max(0, completedCount - 1);
    return Math.min(1, anchorIndex / (timeline.length - 1));
  }, [timeline, currentItemId, completedCount]);

  const milestones = useMemo(
    () => timeline.filter((item) => item.itemType === CourseTimelineItemType.Exam),
    [timeline]
  );

  useEffect(() => {
    if (loading || !currentNodeRef.current) return;
    currentNodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [loading, currentItemId]);

  const handlePrimaryAction = (item: CourseTimelineItemDTO) => {
    if (item.isLocked) return;

    if (item.itemType === CourseTimelineItemType.Lesson && item.lessonID) {
      navigate(`/learner/lessons/${item.lessonID}/learn`, { state: { courseId } });
      return;
    }

    if (item.examID) {
      navigate(`/learner/quiz/exam/${item.examID}`, { state: { courseId } });
    }
  };

  const handleViewResult = (item: CourseTimelineItemDTO) => {
    if (item.latestResultID) {
      navigate(`/learner/quiz/result/${item.latestResultID}`, { state: { courseId } });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-background-light">
        <LearnerHeader title="Chi tiết khóa" />
        <div className="flex-1 flex items-center justify-center">
          <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background-light font-display">
      <LearnerHeader>
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/learner/courses')}
            className="size-10 rounded-full border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:bg-[#f4f0f2] shrink-0"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-[#181114] uppercase tracking-tight truncate">
              {courseName || 'Đang tải...'}
            </h2>
            {timeline.length > 0 && (
              <p className="text-[11px] font-bold text-[#886373] uppercase tracking-wider mt-0.5">
                {completedCount}/{timeline.length} hoàn thành · {progressPercent}%
              </p>
            )}
          </div>
        </div>
      </LearnerHeader>

      <main className="flex-1 overflow-hidden flex min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-8 py-6 shrink-0">
            <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#f4f0f2] text-xs font-semibold">
                <span className="size-2 rounded-full bg-primary" />
                Đang học
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#f4f0f2] text-xs font-semibold">
                <span className="size-2 rounded-full bg-zinc-300" />
                Đã khóa
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 relative min-h-0">
            {timeline.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-center text-[#886373]">Không có bài học hoặc kiểm tra trong khóa này.</p>
              </div>
            ) : (
              <div
                className="max-w-4xl mx-auto relative"
                style={{ minHeight: roadmapHeight }}
              >
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox={`0 0 ${VIEWBOX_WIDTH} ${roadmapHeight}`}
                  preserveAspectRatio="xMidYMin meet"
                  fill="none"
                >
                  <path
                    d={pathD}
                    stroke="#E2E8F0"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  <path
                    d={pathD}
                    stroke="#F285AD"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeOpacity="0.3"
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1 - pathProgress}
                  />
                </svg>

                {timeline.map((item, index) => {
                  const state = getNodeVisualState(item, currentItemId);
                  const isExam = item.itemType === CourseTimelineItemType.Exam;
                  const isCheckpoint = isExam && item.isCheckpoint;
                  const isCurrent = item.itemID === currentItemId;
                  const isLastCheckpoint = isCheckpoint && index === timeline.length - 1;
                  const { x, y } = getNodePosition(index);
                  const tooltip = getTooltipPlacement(x);
                  const examSkillLabel =
                    item.skillType != null ? SkillType[item.skillType] : 'Luyện tập';

                  const isLocked = state === 'locked';
                  const isCompleted = state === 'completed';

                  return (
                    <div
                      key={item.itemID}
                      ref={isCurrent ? currentNodeRef : undefined}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 group ${isLocked ? 'opacity-60' : ''}`}
                      style={{
                        left: `${(x / VIEWBOX_WIDTH) * 100}%`,
                        top: y,
                      }}
                    >
                      {isLastCheckpoint ? (
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => !isLocked && handlePrimaryAction(item)}
                          className={`size-24 bg-linear-to-br from-amber-300 to-orange-400 rounded-3xl rotate-12 flex items-center justify-center text-white shadow-2xl ring-4 ring-white ${
                            isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105 transition-transform'
                          }`}
                        >
                          <span className="material-symbols-outlined text-4xl -rotate-12 fill-1">
                            emoji_events
                          </span>
                        </button>
                      ) : isCurrent ? (
                        <button
                          type="button"
                          onClick={() => handlePrimaryAction(item)}
                          className="size-20 bg-white rounded-full flex items-center justify-center text-primary shadow-xl cursor-pointer ring-4 ring-primary pulse-node"
                        >
                          <span className="material-symbols-outlined text-3xl">play_arrow</span>
                        </button>
                      ) : isLocked ? (
                        <div className="size-14 bg-zinc-200 rounded-full flex items-center justify-center text-zinc-500 shadow-sm ring-4 ring-white">
                          <span className="material-symbols-outlined">lock</span>
                        </div>
                      ) : isCompleted ? (
                        <button
                          type="button"
                          onClick={() => handlePrimaryAction(item)}
                          className={`flex items-center justify-center text-white shadow-lg cursor-pointer ring-4 ring-white hover:scale-105 transition-transform ${
                            isCheckpoint
                              ? 'size-18 bg-linear-to-br from-amber-300 to-orange-400 rounded-3xl rotate-6'
                              : 'size-16 bg-primary rounded-full'
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined fill-1 ${
                              isCheckpoint ? 'text-3xl -rotate-6' : ''
                            }`}
                          >
                            {isCheckpoint ? 'emoji_events' : 'check'}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePrimaryAction(item)}
                          className={`relative flex items-center justify-center shadow-md cursor-pointer ring-4 ring-white hover:scale-105 transition-transform ${
                            isCheckpoint
                              ? 'size-18 bg-linear-to-br from-amber-200 to-amber-400 text-amber-900 rounded-3xl rotate-6'
                              : isExam
                                ? 'size-16 bg-violet-100 text-violet-600 rounded-full border-2 border-violet-200'
                                : 'size-16 bg-white text-primary rounded-full border-2 border-primary/30'
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined ${
                              isCheckpoint ? 'text-3xl -rotate-6 fill-1' : 'text-2xl'
                            }`}
                          >
                            {getItemIcon(item, state)}
                          </span>
                          {item.hasNewVersion && (
                            <span className="absolute -top-1 -right-1 size-5 rounded-full bg-amber-400 text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
                              !
                            </span>
                          )}
                        </button>
                      )}

                      {isCurrent && (
                        <div className="absolute -top-4 left-24 w-56 bg-white p-4 rounded-xl border-2 border-primary shadow-xl z-20">
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                              Đang tập trung
                            </p>
                            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-[9px] font-bold text-primary">
                              #{item.sortOrder}
                            </span>
                          </div>
                          <p className="text-base font-bold text-[#181114] leading-tight">{item.title}</p>
                          <p className="text-xs text-[#886373] mt-2">
                            {getBadgeLabel(item)}
                            {isExam ? ` · ${examSkillLabel}` : ''}
                          </p>
                          {item.hasNewVersion && (
                            <p className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1 mt-2">
                              Có phiên bản bài kiểm tra mới
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() => handlePrimaryAction(item)}
                            className={`w-full mt-3 text-[11px] font-bold py-2 rounded-lg transition-colors ${
                              item.hasNewVersion && isExam
                                ? 'bg-amber-500 text-white hover:bg-amber-600'
                                : 'bg-primary text-white hover:bg-primary/90'
                            }`}
                          >
                            {item.itemType === CourseTimelineItemType.Lesson
                              ? 'Tiếp tục bài học'
                              : item.hasNewVersion
                                ? 'Làm bản mới'
                                : 'Làm bài ngay'}
                          </button>
                          {isExam && item.isCompleted && item.latestResultID && (
                            <button
                              type="button"
                              onClick={() => handleViewResult(item)}
                              className="w-full mt-2 text-[11px] font-bold py-2 rounded-lg border border-[#f4f0f2] text-[#181114] hover:border-primary/30"
                            >
                              Xem kết quả cũ
                            </button>
                          )}
                        </div>
                      )}

                      {!isCurrent && (
                        <div
                          className={`absolute ${tooltip} bg-white p-3 rounded-xl border border-[#f4f0f2] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none`}
                        >
                          <p
                            className={`text-xs font-bold uppercase ${
                              isLocked ? 'text-zinc-500' : 'text-primary'
                            }`}
                          >
                            {getBadgeLabel(item)}
                            {isExam ? ` · ${examSkillLabel}` : ''}
                          </p>
                          <p className="text-sm font-bold text-[#181114]">{item.title}</p>
                          <p className="text-[10px] text-[#886373] mt-1">
                            {isCompleted
                              ? '100% Hoàn thành'
                              : isLocked
                                ? 'Hoàn thành bài trước để mở khóa'
                                : item.hasNewVersion
                                  ? 'Có bản kiểm tra mới'
                                  : 'Sẵn sàng'}
                          </p>
                        </div>
                      )}

                      {isLastCheckpoint && (
                        <div className="absolute -top-12 left-0 w-max bg-zinc-900 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg pointer-events-none">
                          Mục tiêu khóa học
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <aside className="w-80 bg-white border-l border-[#f4f0f2] flex flex-col p-6 gap-8 overflow-y-auto shrink-0 lg:flex">
          <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                <h3 className="text-sm font-bold text-primary uppercase tracking-wide">Tiến độ khóa học</h3>
              </div>
              <p className="text-xs text-[#886373] font-medium">Hoàn thành</p>
              <p className="text-2xl font-black text-[#181114] mt-1">
                {completedCount}/{timeline.length} bài
              </p>
              <div className="mt-4 w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {currentItem && (
                <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  Đang học: {currentItem.title}
                </div>
              )}
            </div>
            <span className="material-symbols-outlined absolute -bottom-6 -right-6 text-primary/10 text-9xl">
              calendar_month
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end px-2">
              <h3 className="text-base font-black text-[#181114]">Cột mốc</h3>
              <span className="text-[10px] font-bold text-primary">{milestones.length} bài</span>
            </div>
            <div className="space-y-3">
              {milestones.length === 0 ? (
                <p className="text-xs text-[#886373] px-2">Chưa có bài kiểm tra trong khóa này.</p>
              ) : (
                milestones.map((item) => {
                  const locked = item.isLocked;
                  const done = item.isCompleted;
                  const progress = done ? 100 : locked ? 0 : 30;

                  return (
                    <div
                      key={item.itemID}
                      className="bg-zinc-50 p-4 rounded-xl border border-[#f4f0f2] flex gap-4"
                    >
                      <div
                        className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
                          locked ? 'bg-zinc-100' : 'bg-primary/20'
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined ${
                            locked ? 'text-zinc-400' : 'text-primary'
                          }`}
                        >
                          {getMilestoneIcon(item)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#181114] truncate">{item.title}</p>
                        <p className="text-xs text-[#886373] mt-1 leading-relaxed">
                          {item.isCheckpoint ? 'Bài checkpoint' : 'Bài luyện tập'}
                          {item.skillType != null ? ` · ${SkillType[item.skillType]}` : ''}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex-1 bg-zinc-200 h-1 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${locked ? 'bg-zinc-300' : 'bg-primary'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span
                            className={`text-[10px] font-bold shrink-0 ${
                              locked ? 'text-zinc-400' : 'text-[#181114]'
                            }`}
                          >
                            {locked ? 'Đã khóa' : done ? '100%' : 'Đang mở'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-auto bg-zinc-900 rounded-2xl p-5 text-white shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-amber-400 text-lg">lightbulb</span>
              <h4 className="text-xs font-bold uppercase tracking-wider">Mẹo học tập</h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed italic">
              &ldquo;Hoàn thành từng nút trên lộ trình theo thứ tự để mở khóa bài tiếp theo và duy trì tiến độ học
              tập.&rdquo;
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default CourseDetailPage;
