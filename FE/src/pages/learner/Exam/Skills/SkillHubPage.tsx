import LearnerHeader from '../../../../components/layout/learner/LearnerHeader';
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SkillType } from '../../../../interfaces/Admin/QuestionBank';
import { getSkillHubConfig } from './skillHubTheme';

const SkillHubPage: React.FC = () => {
  const { skillType } = useParams<{ skillType: string }>();
  const navigate = useNavigate();

  const config = getSkillHubConfig(skillType);
  const isPracticeOnly = skillType === 'reading' || skillType === 'listening';

  const handleGoToFlashcard = () => {
    navigate(`/learner/flashcards?type=${config.skillEnum}`);
  };

  const handleGoToPractice = () => {
    const type = skillType || 'vocabulary'; 
    navigate(`/learner/skill-learning/${type}/practice-list`); 
  };

  return (
    <div className="bg-background-light text-[#211118] min-h-screen font-['Lexend']">
      <LearnerHeader>
            <div className="flex items-center gap-191">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex flex-col">
                      <h2 className="text-xl font-bold text-[#181114] uppercase"> KĨ NĂNG: {config.title}</h2>
                  </div>
                </div>
            </div>
      </LearnerHeader>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto px-6 py-8 no-scrollbar">

          {/* Header Section */}
          <div className="mb-16">
            <h1 className="text-4xl md:text-5xl font-black text-[#211118] tracking-tight mb-4">
              Ôn và luyện tập: <span className={config.colorText}>{config.title}</span>
            </h1>
            <p className="text-lg text-[#534248] max-w-2xl leading-relaxed">
              {isPracticeOnly ? (
                <>
                  Bài ôn chỉ có dạng luyện tập trắc nghiệm JLPT-style. Giảm dần chủ đề, rút ngắn thời gian làm bài để sát đề.
                </>
              ) : (
                <>
                  Chọn phương thức học tập phù hợp nhất với mục tiêu của bạn hôm nay. Mỗi bài học đều giúp bạn tiến gần hơn tới chứng chỉ JLPT.
                </>
              )}
            </p>
          </div>

          {/* Selection Bento Grid — ôn + luyện: một cột (2 khung trên/dưới), full width mỗi thẻ */}
          <div className="grid grid-cols-1 gap-8 max-w-5xl mx-auto">
            {/* Card 1: Học & Ôn tập (vocab/kanji/grammar) — cùng khung hai cột như khung đọc/nghe */}
            {!isPracticeOnly && (
            <div 
              onClick={handleGoToFlashcard}
              className={`group relative bg-white rounded-3xl border ${config.borderColor} ${config.shadowHover} transition-all duration-500 overflow-hidden cursor-pointer min-h-[420px] p-8 md:p-12 lg:min-h-[480px]`}
            >
              <div className="absolute top-0 right-0 p-6 md:p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <span className="material-symbols-outlined text-[120px] md:text-[160px]">style</span>
              </div>

              <div className="relative grid gap-10 lg:grid-cols-[1fr_280px] lg:gap-12 items-center">
                <div>
                  <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold mb-6 ${config.colorLight} ${config.colorText}`}>
                    <span className="material-symbols-outlined text-lg">replay</span>
                    Ôn tập SRS
                  </div>
                  <div className="flex flex-wrap gap-3 mb-6">
                    {[
                      { icon: 'style', label: 'Flashcard theo chủ đề JLPT' },
                      { icon: 'schedule', label: 'Ôn cách quãng thông minh' },
                      { icon: 'school', label: 'N5 → N1' },
                    ].map(({ icon, label }) => (
                      <span key={label} className="inline-flex items-center gap-1.5 rounded-2xl border border-[#f4f0f2] bg-[#faf8f9] px-3 py-2 text-xs md:text-sm font-medium text-[#534248]">
                        <span className="material-symbols-outlined text-[18px] text-[#266c24]">{icon}</span>
                        {label}
                      </span>
                    ))}
                  </div>
                  <div className={`w-16 h-16 rounded-2xl ${config.colorLight} ${config.colorText} flex items-center justify-center mb-6 group-hover:scale-105 transition-transform`}>
                    <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>style</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-[#211118] mb-4 tracking-tight wrap-break-word">Học & Ôn tập · {config.title}</h2>
                  <p className="text-[#534248] text-base md:text-lg leading-relaxed max-w-xl mb-8 wrap-break-word">
                    Thẻ ghi nhớ (SRS): học từ mới, ôn những gì đang quên. Phù hợp ôn nhẹ trước khi vào đề trắc nghiệm.
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex -space-x-2 shrink-0">
                      {(['JLPT', 'N5', 'N4', 'N3', 'N2', 'N1'] as const).map((tag) => (
                        <div
                          key={tag}
                          className={`w-10 h-10 rounded-full border-2 border-white ${config.colorBg} flex items-center justify-center text-[9px] font-bold text-[#311020] leading-none text-center px-0.5`}
                        >
                          {tag}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGoToFlashcard();
                      }}
                      className={`inline-flex items-center gap-2 rounded-full px-10 py-3.5 font-bold text-white shadow-lg transition-all ${config.colorBg} hover:brightness-105 ${config.shadowGlow}`}
                    >
                      Bắt đầu học
                      <span className="material-symbols-outlined">trending_flat</span>
                    </button>
                  </div>
                </div>

                <div className="relative flex justify-center lg:justify-end">
                  <div className="relative w-full max-w-[280px] space-y-3">
                    <div className={`rounded-2xl border-2 border-dashed p-4 text-center text-sm font-semibold ${config.colorText} ${config.colorLight} border-current/20`}>
                      <span className="material-symbols-outlined align-middle mr-1 text-lg">layers</span>
                      Xếp chồng ôn luyện
                    </div>
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className="rounded-xl border border-[#eee8ea] bg-white p-4 shadow-sm flex items-center gap-3"
                        style={{ marginLeft: step * 12 }}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#266c24]/10 text-sm font-black text-[#266c24]">{step}</span>
                        <div className="h-2 flex-1 rounded bg-[#f4f0f2] overflow-hidden">
                          <div
                            style={{ width: `${35 + step * 18}%` }}
                            className={`h-full rounded ${config.colorBg} opacity-50`}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs font-medium text-[#837078] px-2 pt-2">
                      <span>Tiến độ ôn SRS</span>
                      <span>Luôn theo chủ đề</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`pointer-events-none absolute -bottom-24 -left-24 w-64 h-64 ${config.colorLight} rounded-full blur-3xl transition-colors`} />
            </div>
            )}

            {/* Card 2: Luyện tập */}
            <div 
              onClick={handleGoToPractice}
              className={`group relative bg-white rounded-3xl border ${config.borderColor} ${config.shadowHover} transition-all duration-500 overflow-hidden cursor-pointer min-h-[420px] p-8 md:p-12 lg:min-h-[480px]`}
            >
              <div className="absolute top-0 right-0 p-6 md:p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <span className="material-symbols-outlined text-[120px] md:text-[160px]">
                  {skillType === 'listening' ? 'headphones' : 'quiz'}
                </span>
              </div>

              {isPracticeOnly ? (
                <div className="relative grid gap-10 lg:grid-cols-[1fr_280px] lg:gap-12 items-center">
                  <div>
                    <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold mb-6 ${config.colorLight} ${config.colorText}`}>
                      <span className="material-symbols-outlined text-lg">timer</span>
                      Làm như trong phòng thi
                    </div>
                    <div className="flex flex-wrap gap-3 mb-6">
                      {[
                        { icon: 'target', label: 'Theo chủ đề JLPT' },
                        { icon: 'speed', label: 'Đúng/sai có giải thích' },
                        { icon: skillType === 'listening' ? 'graphic_eq' : 'description', label: skillType === 'listening' ? 'Audio · script bật/tắt' : 'Đoạn văn dài/ngắn' },
                      ].map(({ icon, label }) => (
                        <span key={label} className="inline-flex items-center gap-1.5 rounded-2xl border border-[#f4f0f2] bg-[#faf8f9] px-3 py-2 text-xs md:text-sm font-medium text-[#534248]">
                          <span className="material-symbols-outlined text-[18px] text-[#266c24]">{icon}</span>
                          {label}
                        </span>
                      ))}
                    </div>
                    <div className={`w-16 h-16 rounded-2xl ${config.skillEnum === SkillType.Listening ? 'bg-violet-500/10 text-violet-600' : 'bg-indigo-500/10 text-indigo-600'} flex items-center justify-center mb-6 group-hover:scale-105 transition-transform`}>
                      <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>{skillType === 'listening' ? 'headphones' : 'quiz'}</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#211118] mb-4 tracking-tight">Luyện tập · {config.title}</h2>
                    <p className="text-[#534248] text-base md:text-lg leading-relaxed max-w-xl mb-8">
                      {skillType === 'listening'
                        ? 'Nghe theo chủ đề, chọn đáp án đúng, luyện tốc độ đọc câu hỏi sau khi audio kết thúc.'
                        : 'Đọc đoạn, nắm ý chính & chi tiết, chọn đáp án sát nhất với các dạng câu JLPT.'}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGoToPractice();
                      }}
                      className={`inline-flex items-center gap-2 rounded-full px-10 py-3.5 font-bold text-white shadow-lg transition-all ${skillType === 'listening' ? 'bg-violet-600 hover:bg-violet-700 shadow-violet-500/25' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25'}`}
                    >
                      Vào danh sách đề
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                  </div>

                  <div className="relative flex justify-center lg:justify-end">
                    <div className="relative w-full max-w-[280px] space-y-3">
                      <div className={`rounded-2xl border-2 border-dashed p-4 text-center text-sm font-semibold ${config.colorText} ${config.colorLight} border-current/20`}>
                        <span className="material-symbols-outlined align-middle mr-1 text-lg">assignment</span>
                        Bản xem trước đề
                      </div>
                      {[1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className="rounded-xl border border-[#eee8ea] bg-white p-4 shadow-sm flex items-center gap-3"
                          style={{ marginLeft: step * 12 }}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#266c24]/10 text-sm font-black text-[#266c24]">{step}</span>
                          <div className="h-2 flex-1 rounded bg-[#f4f0f2] overflow-hidden">
                            <div
                              style={{ width: `${40 + step * 15}%` }}
                              className={`h-full rounded ${config.colorBg} opacity-40`}
                            />
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs font-medium text-[#837078] px-2 pt-2">
                        <span>Đã gắn sẵn cấp độ</span>
                        <span>Cập nhật liên tục</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative grid gap-10 lg:grid-cols-[1fr_280px] lg:gap-12 items-center">
                  <div>
                    <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold mb-6 ${config.colorLight} ${config.colorText}`}>
                      <span className="material-symbols-outlined text-lg">timer</span>
                      Trắc nghiệm JLPT-style
                    </div>
                    <div className="flex flex-wrap gap-3 mb-6">
                      {[
                        { icon: 'quiz', label: 'Đề theo chủ đề' },
                        { icon: 'rule', label: 'Giải thích sau khi nộp' },
                        { icon: 'insights', label: 'Theo dõi làm sai' },
                      ].map(({ icon, label }) => (
                        <span key={label} className="inline-flex items-center gap-1.5 rounded-2xl border border-[#f4f0f2] bg-[#faf8f9] px-3 py-2 text-xs md:text-sm font-medium text-[#534248]">
                          <span className="material-symbols-outlined text-[18px] text-[#266c24]">{icon}</span>
                          {label}
                        </span>
                      ))}
                    </div>
                    <div className={`w-16 h-16 rounded-2xl ${config.colorLight} ${config.colorText} flex items-center justify-center mb-6 group-hover:scale-105 transition-transform`}>
                      <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>quiz</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#211118] mb-4 tracking-tight wrap-break-word">Luyện tập · {config.title}</h2>
                    <p className="text-[#534248] text-base md:text-lg leading-relaxed max-w-xl mb-8 wrap-break-word">
                      Thử bản thân với bộ đề trắc nghiệm: kiểm tra phản xạ và độ chính xác với {config.title.toLowerCase()} trong ngữ cảnh thực tế JLPT.
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGoToPractice();
                      }}
                      className={`inline-flex items-center gap-2 rounded-full px-10 py-3.5 font-bold text-white shadow-lg transition-all ${config.colorBg} hover:brightness-105 ${config.shadowGlow}`}
                    >
                      Thực hành ngay
                      <span className="material-symbols-outlined">bolt</span>
                    </button>
                  </div>

                  <div className="relative flex justify-center lg:justify-end">
                    <div className="relative w-full max-w-[280px] space-y-3">
                      <div className={`rounded-2xl border-2 border-dashed p-4 text-center text-sm font-semibold ${config.colorText} ${config.colorLight} border-current/20`}>
                        <span className="material-symbols-outlined align-middle mr-1 text-lg">assignment</span>
                        Bản xem trước đề
                      </div>
                      {[1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className="rounded-xl border border-[#eee8ea] bg-white p-4 shadow-sm flex items-center gap-3"
                          style={{ marginLeft: step * 12 }}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#266c24]/10 text-sm font-black text-[#266c24]">{step}</span>
                          <div className="h-2 flex-1 rounded bg-[#f4f0f2] overflow-hidden">
                            <div
                              style={{ width: `${40 + step * 15}%` }}
                              className={`h-full rounded ${config.colorBg} opacity-40`}
                            />
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs font-medium text-[#837078] px-2 pt-2">
                        <span>Đã gắn sẵn cấp độ</span>
                        <span>Cập nhật liên tục</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className={`pointer-events-none absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl transition-colors ${isPracticeOnly ? (skillType === 'listening' ? 'bg-violet-500/10 group-hover:bg-violet-500/15' : 'bg-indigo-500/10 group-hover:bg-indigo-500/15') : `${config.colorLight} opacity-70 group-hover:opacity-90`}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillHubPage;