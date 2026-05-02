import React, { useEffect, useMemo, useState } from 'react';
import { LearnerExamService } from '../../../services/Learner/examService';
import { LearnerExamListItem } from '../../../interfaces/Learner/Exam';
import { ExamType } from '../../../interfaces/Admin/QuestionBank';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';

const examTypeOptions = [
  { value: ExamType.StandardJLPT, label: 'Đề chính thức JLPT' },
  { value: ExamType.LessonPractice, label: 'Luyện tập theo bài học' },
  { value: ExamType.SkillPractice, label: 'Luyện tập theo kỹ năng' },
];

const typeBadgeClasses = (type: ExamType) => {
  switch (type) {
    case ExamType.StandardJLPT:
      return 'bg-rose-50 text-rose-600 border-rose-100';
    case ExamType.LessonPractice:
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case ExamType.SkillPractice:
      return 'bg-sky-50 text-sky-600 border-sky-100';
    default:
      return 'bg-gray-50 text-gray-500 border-gray-100';
  }
};

const typeLabel = (type: ExamType) => {
  switch (type) {
    case ExamType.StandardJLPT:
      return 'Chuẩn JLPT';
    case ExamType.LessonPractice:
      return 'Theo bài học';
    case ExamType.SkillPractice:
      return 'Theo kỹ năng';
    default:
      return 'Khác';
  }
};

const ExamListPage: React.FC = () => {
  const [exams, setExams] = useState<LearnerExamListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<ExamType | undefined>(undefined);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadExams = async () => {
      setLoading(true);
      try {
        const data = await LearnerExamService.getExams({
          search: search || undefined,
          type: activeType,
        });
        setExams(data);
      } catch (error) {
        console.error('Lỗi khi tải danh sách bài luyện tập:', error);
        setExams([]);
      } finally {
        setLoading(false);
      }
    };

    loadExams();
  }, [search, activeType]);

  const groupedByType = useMemo(() => {
    return examTypeOptions.map((option) => ({
      option,
      items: exams.filter((exam) => exam.type === option.value),
    }));
  }, [exams]);

  return (
    <div className="min-h-screen bg-background-light text-[#211118] font-['Inter']">
      <LearnerHeader>
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Danh sách bài luyện tập</h1>
          <p className="text-sm text-[#6b5a62] max-w-2xl">
            Chọn bộ đề phù hợp theo loại luyện tập. FE đã setup sẵn để phân biệt bài luyện theo thuộc tính <span className="font-bold">ExamType</span>.
          </p>
        </div>
      </LearnerHeader>

      <main className="p-8 max-w-6xl mx-auto space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6">
          <div className="bg-white rounded-4xl p-6 border border-[#f4f0f2] shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black">Bộ lọc loại luyện tập</h2>
                <p className="text-sm text-[#7d6f76]">Chọn một dạng để xem bài luyện theo loại.</p>
              </div>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm đề..."
                className="w-full md:w-72 rounded-3xl border border-[#f4f0f2] bg-[#fbf9fa] px-5 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {examTypeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setActiveType(activeType === option.value ? undefined : option.value)}
                  className={`rounded-3xl border px-4 py-3 text-sm font-bold transition-all ${
                    activeType === option.value
                      ? 'border-primary bg-primary text-white shadow-lg shadow-primary/10'
                      : 'border-[#e9e6e9] bg-white text-[#534248] hover:border-primary hover:text-primary'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-4xl p-6 border border-[#f4f0f2] shadow-sm">
            <h2 className="text-xl font-black mb-4">Gợi ý nhanh</h2>
            <div className="space-y-4 text-sm text-[#6b5a62]">
              <p>FE đã sẵn sàng hiển thị các bài luyện tập theo 3 dạng:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><span className="font-semibold">Chuẩn JLPT</span>: bài kiểm tra mô phỏng đề thi.</li>
                <li><span className="font-semibold">Theo bài học</span>: luyện tập liên kết với nội dung bài học.</li>
                <li><span className="font-semibold">Theo kỹ năng</span>: ôn theo kỹ năng từ vựng/ngữ pháp/kanji/đọc/nghe.</li>
              </ul>
              <p>Nếu API đã trả `ExamType`, FE sẽ tự động phân loại và render theo từng tab.</p>
            </div>
          </div>
        </div>

        <section className="space-y-10">
          {loading ? (
            <div className="rounded-4xl border border-[#f4f0f2] bg-white p-12 text-center text-sm font-bold text-[#886373]">
              Đang tải danh sách bài luyện tập...
            </div>
          ) : exams.length === 0 ? (
            <div className="rounded-4xl border border-dashed border-[#e7e1e4] bg-white p-12 text-center text-sm text-[#886373]">
              Không tìm thấy bài luyện tập nào. Vui lòng thử lại với bộ lọc khác.
            </div>
          ) : (
            groupedByType.map(({ option, items }) => (
              <div key={option.value} className="bg-white rounded-4xl border border-[#f4f0f2] shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-[#fbf9fa] px-6 py-5 border-b border-[#f4f0f2]">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-[#886373]">{option.label}</p>
                    <h3 className="text-2xl font-black text-[#211118] mt-2">{items.length} đề luyện tập</h3>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-black ${typeBadgeClasses(option.value)}`}>
                    {typeLabel(option.value)}
                  </span>
                </div>

                {items.length === 0 ? (
                  <div className="p-10 text-sm text-[#886373]">Không có đề luyện tập cho loại này.</div>
                ) : (
                  <div className="divide-y divide-[#f4f0f2]">
                    {items.map((exam) => (
                      <div key={exam.examID} className="px-6 py-5 sm:px-8 sm:py-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="space-y-2">
                          <p className="text-base font-bold text-[#181114]">{exam.title}</p>
                          <div className="flex flex-wrap gap-3 text-sm text-[#6b5a62]">
                            <span>{exam.levelName}</span>
                            {exam.courseName && <span>{exam.courseName}</span>}
                            {exam.lessonTitle && <span>{exam.lessonTitle}</span>}
                            {exam.totalQuestions != null && <span>{exam.totalQuestions} câu</span>}
                            {exam.duration != null && <span>{exam.duration} phút</span>}
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-3 sm:items-end">
                          {exam.bestScore != null && (
                            <span className="text-sm font-semibold text-emerald-600">Điểm cao nhất: {exam.bestScore}%</span>
                          )}
                          <button
                            disabled
                            className="rounded-full border border-[#e9e6e9] bg-[#f9f7f8] px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-[#886373] disabled:cursor-not-allowed"
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
};

export default ExamListPage;
