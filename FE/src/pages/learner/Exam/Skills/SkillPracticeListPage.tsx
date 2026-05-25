import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LearnerHeader from '../../../../components/layout/learner/LearnerHeader';
import { SkillPracticeService } from '../../../../services/Learner/skillPracticeService';
import { SkillPracticeExamDTO } from '../../../../interfaces/Learner/SkillPractice';
import { getSkillHubConfig } from './skillHubTheme';

const SkillPracticeListPage: React.FC = () => {
  const { skillType } = useParams<{ skillType: string }>();
  const navigate = useNavigate();

  const config = getSkillHubConfig(skillType);

  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<SkillPracticeExamDTO[]>([]);

  const skillNameMap: Record<string, number> = {
    vocabulary: 1,
    grammar: 2,
    kanji: 3,
    reading: 4,
    listening: 5,
  };

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      try {
        const targetSkillId = skillNameMap[skillType || ''] || 1;
        const data = await SkillPracticeService.getSkillPracticeExams(targetSkillId);
        setExams(data);
      } catch (error) {
        console.error('Lỗi khi tải danh sách bài tập:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, [skillType]);

  const handleStartExam = (examId: string) => {
    navigate(`/learner/skill-learning/${skillType}/practice/${examId}`);
  };

  const handleViewResult = (resultId: string) => {
    navigate(`/learner/skill-learning/${skillType}/result/${resultId}`);
  };

  const headerEyebrow = 'Danh sách đề ôn · JLPT-style';

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-light">
        <div className="flex flex-col items-center gap-4">
          <div
            className={`size-12 animate-spin rounded-full border-4 border-solid border-neutral-200 ${config.spinnerTop}`}
            aria-busy="true"
            aria-hidden
          />
          <p
            className={`text-xs font-black uppercase tracking-[0.2em] ${config.colorText} opacity-90`}
          >
            Đang lấy danh sách bài tập…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background-light">
      <LearnerHeader title={`LUYỆN TẬP: ${config.title}`} />

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-8xl mx-auto space-y-8">
          <div
            className={`bg-white rounded-[3rem] border overflow-hidden shadow-sm transition-shadow hover:shadow-md ${config.borderColor}`}
          >
            <div
              className={`relative p-8 md:p-10 border-b border-[#ece8ea] flex flex-wrap items-start justify-between gap-6`}
            >
              <div className={`absolute inset-0 ${config.colorLight} pointer-events-none`} aria-hidden />
              <div className="relative z-1 min-w-0 flex-1">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider mb-4 border border-white/70 ${config.colorLight} ${config.colorText}`}
                >
                  <span className="material-symbols-outlined text-[18px]">assignment</span>
                  {headerEyebrow}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#181114] tracking-tight">
                  Đề luyện <span className={config.colorText}>{config.title}</span>
                </h2>
                <p className="text-[#534248] font-medium mt-2 max-w-lg leading-relaxed">
                  Chọn đề làm trong thời gian giới hạn; có giải thích sau khi nộp. Giao diện được tô màu đúng theo kỹ
                  năng bạn đang ôn.
                </p>
              </div>
              <div
                className={`relative z-1 size-16 shrink-0 rounded-3xl ${config.colorLight} flex items-center justify-center shadow-lg ${config.colorText} ring-4 ring-white/80`}
              >
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {config.icon}
                </span>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-[#fcfafa]">
              {exams.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">
                  {exams.map((exam) => (
                    <div
                      key={exam.examID}
                      className={`group min-w-0 h-full rounded-3xl border-2 bg-white p-6 flex flex-wrap items-center justify-between gap-4 border-[#eae5e9] transition-all duration-300 hover:border-transparent hover:bg-white ${config.shadowHover}`}
                    >
                    <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                      <div
                        className={`size-14 shrink-0 rounded-2xl flex items-center justify-center transition-colors ${
                          exam.isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-neutral-100 text-neutral-400'
                        }`}
                      >
                        <span className="material-symbols-outlined text-3xl">
                          {exam.isCompleted ? 'check_circle' : 'pending'}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <h3 className="text-lg font-black text-[#181114] wrap-break-word">{exam.title}</h3>
                          {exam.hasNewVersion && (
                            <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase shrink-0">
                              Mới
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0 ${config.colorLight} ${config.colorText}`}
                          >
                            Đề
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-[#6b5660] font-medium">
                          <span className="flex items-center gap-1">
                            <span className={`material-symbols-outlined text-sm ${config.colorText}`}>timer</span>
                            {exam.duration} phút
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">emoji_events</span>
                            Điểm cao nhất: {exam.bestScore}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto shrink-0">
                      {!exam.isCompleted && exam.latestResultID && (
                        <p className="text-xs text-red-500 font-bold text-right max-w-[280px] self-end">
                          Bạn chưa đạt yêu cầu. Hãy luyện tập lại.
                        </p>
                      )}
                      {exam.isCompleted && (
                        <p className="text-xs text-emerald-600 font-bold text-right">Đã hoàn thành yêu cầu đề.</p>
                      )}

                      <div className="flex flex-wrap items-center justify-end gap-3">
                        {exam.latestResultID && (
                          <button
                            type="button"
                            onClick={() => handleViewResult(exam.latestResultID!)}
                            className={`px-5 py-3 rounded-2xl border-2 border-[#eae5e9] bg-white text-[#55454d] text-xs font-black uppercase tracking-wider transition-colors ${config.secondaryBtnHover}`}
                          >
                            Xem kết quả
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleStartExam(exam.examID)}
                          className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
                            exam.isCompleted
                              ? `bg-white border-2 border-[#eae5e9] text-[#55454d] ${config.secondaryBtnHover}`
                              : `text-white shadow-lg hover:brightness-105 active:scale-[0.98] ${config.colorBg} ${config.shadowGlow}`
                          }`}
                        >
                          {exam.isCompleted ? 'Luyện tập lại' : 'Bắt đầu'}
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 px-4">
                  <span
                    className={`material-symbols-outlined text-6xl block mx-auto opacity-20 leading-none mb-6 ${config.colorText}`}
                  >
                    find_in_page
                  </span>
                  <p className="text-[#6b5660] font-bold mt-4 max-w-xs mx-auto">
                    Hiện chưa có bài tập nào cho <span className={config.colorText}>{config.title}</span>.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SkillPracticeListPage;
