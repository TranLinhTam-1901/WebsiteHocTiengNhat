import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SkillType } from '../../../interfaces/Admin/QuestionBank';

const SkillHubPage: React.FC = () => {
  const { skillType } = useParams<{ skillType: string }>();
  const navigate = useNavigate();

  const getSkillConfig = (type: string | undefined) => {
    switch(type) {
      case 'vocabulary': return { title: 'Từ vựng', colorText: 'text-[#f287b6]', colorBg: 'bg-[#f287b6]', hoverBg: 'hover:bg-[#f287b6]', colorLight: 'bg-[#f287b6]/10', borderColor: 'border-[rgba(242,135,182,0.1)]', shadowHover: 'hover:shadow-[0_20px_40px_-15px_rgba(242,135,182,0.3)]', shadowGlow: 'shadow-[#f287b6]/30', icon: 'translate', skillEnum: SkillType.Vocabulary };
      case 'kanji': return { title: 'Hán tự', colorText: 'text-emerald-500', colorBg: 'bg-emerald-500', hoverBg: 'hover:bg-emerald-500', colorLight: 'bg-emerald-500/10', borderColor: 'border-[rgba(16,185,129,0.1)]', shadowHover: 'hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)]', shadowGlow: 'shadow-emerald-500/30', icon: 'draw', skillEnum: SkillType.Kanji };
      case 'grammar': return { title: 'Ngữ pháp', colorText: 'text-amber-500', colorBg: 'bg-amber-500', hoverBg: 'hover:bg-amber-500', colorLight: 'bg-amber-500/10', borderColor: 'border-[rgba(245,158,11,0.1)]', shadowHover: 'hover:shadow-[0_20px_40px_-15px_rgba(245,158,11,0.3)]', shadowGlow: 'shadow-amber-500/30', icon: 'menu_book', skillEnum: SkillType.Grammar };
      case 'reading': return { title: 'Luyện đọc', colorText: 'text-blue-500', colorBg: 'bg-blue-500', hoverBg: 'hover:bg-blue-500', colorLight: 'bg-blue-500/10', borderColor: 'border-[rgba(59,130,246,0.1)]', shadowHover: 'hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)]', shadowGlow: 'shadow-blue-500/30', icon: 'menu_book', skillEnum: SkillType.Reading };
      case 'listening': return { title: 'Luyện nghe', colorText: 'text-violet-500', colorBg: 'bg-violet-500', hoverBg: 'hover:bg-violet-500', colorLight: 'bg-violet-500/10', borderColor: 'border-[rgba(139,92,246,0.1)]', shadowHover: 'hover:shadow-[0_20px_40px_-15px_rgba(139,92,246,0.3)]', shadowGlow: 'shadow-violet-500/30', icon: 'headphones', skillEnum: SkillType.Listening };
      default: return { title: 'Từ vựng', colorText: 'text-[#f287b6]', colorBg: 'bg-[#f287b6]', hoverBg: 'hover:bg-[#f287b6]', colorLight: 'bg-[#f287b6]/10', borderColor: 'border-[rgba(242,135,182,0.1)]', shadowHover: 'hover:shadow-[0_20px_40px_-15px_rgba(242,135,182,0.3)]', shadowGlow: 'shadow-[#f287b6]/30', icon: 'translate', skillEnum: SkillType.Vocabulary };
    }
  };

  const config = getSkillConfig(skillType);

  const handleGoToFlashcard = () => {
    navigate(`/learner/flashcards?type=${config.skillEnum}`);
  };

  const handleGoToPractice = () => {
    navigate(`/learner/skill-learning/${skillType || 'vocabulary'}/select`);
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
              Kỹ năng: <span className={config.colorText}>{config.title}</span>
            </h1>
            <p className="text-lg text-[#534248] max-w-2xl leading-relaxed">
              Chọn phương thức học tập phù hợp nhất với mục tiêu của bạn hôm nay. Mỗi bài học đều giúp bạn tiến gần hơn tới chứng chỉ JLPT.
            </p>
          </div>

          {/* Selection Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card 1: Học & Ôn tập */}
            <div 
              onClick={handleGoToFlashcard}
              className={`group relative bg-white rounded-3xl p-10 border ${config.borderColor} ${config.shadowHover} transition-all duration-500 flex flex-col justify-between overflow-hidden cursor-pointer h-[480px]`}
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-[160px]">style</span>
              </div>
              <div>
                <div className={`w-16 h-16 rounded-2xl ${config.colorLight} flex items-center justify-center ${config.colorText} mb-8 group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>style</span>
                </div>
                <h2 className="text-3xl font-bold text-[#211118] mb-4">Học & Ôn tập</h2>
                <p className="text-[#534248] text-lg leading-relaxed">
                  Xây dựng nền tảng vững chắc thông qua hệ thống Flashcards thông minh (Spaced Repetition). Học từ mới và củng cố kiến thức đã quên.
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-3">
                  <div className={`w-10 h-10 rounded-full border-2 border-white ${config.colorBg} flex items-center justify-center text-[10px] font-bold text-[#311020]`}>JLPT</div>
                  <div className={`w-10 h-10 rounded-full border-2 border-white ${config.colorBg} flex items-center justify-center text-[10px] font-bold text-[#311020]`}>N5</div>
                  <div className={`w-10 h-10 rounded-full border-2 border-white ${config.colorBg} flex items-center justify-center text-[10px] font-bold text-[#311020]`}>N4</div>
                  <div className={`w-10 h-10 rounded-full border-2 border-white ${config.colorBg} flex items-center justify-center text-[10px] font-bold text-[#311020]`}>N3</div>
                  <div className={`w-10 h-10 rounded-full border-2 border-white ${config.colorBg} flex items-center justify-center text-[10px] font-bold text-[#311020]`}>N2</div>
                  <div className={`w-10 h-10 rounded-full border-2 border-white ${config.colorBg} flex items-center justify-center text-[10px] font-bold text-[#311020]`}>N1</div>
                </div>
                <button className={`px-8 py-3 ${config.colorBg} text-white rounded-full font-bold shadow-lg ${config.shadowGlow} group-hover:px-10 transition-all flex items-center gap-2`}>
                  Bắt đầu học
                  <span className="material-symbols-outlined">trending_flat</span>
                </button>
              </div>
              <div className={`absolute -bottom-24 -left-24 w-64 h-64 ${config.colorLight} rounded-full blur-3xl transition-colors`}></div>
            </div>

            {/* Card 2: Luyện tập */}
            <div 
              onClick={handleGoToPractice}
              className={`group relative bg-white rounded-3xl p-10 border ${config.borderColor} ${config.shadowHover} transition-all duration-500 flex flex-col justify-between overflow-hidden cursor-pointer h-[480px]`}
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-[160px]">quiz</span>
              </div>
              <div>
                <div className="w-16 h-16 rounded-2xl bg-[#266c24]/10 flex items-center justify-center text-[#266c24] mb-8 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>quiz</span>
                </div>
                <h2 className="text-3xl font-bold text-[#211118] mb-4">Luyện tập</h2>
                <p className="text-[#534248] text-lg leading-relaxed">
                  Thử thách bản thân với các bộ đề trắc nghiệm đa dạng. Kiểm tra độ nhạy bén và tốc độ phản xạ với {config.title.toLowerCase()} trong ngữ cảnh thực tế.
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#266c24]">
                  <span className="material-symbols-outlined text-lg">verified</span>
                  Đề thi chính thức
                </div>
                <button className={`px-8 py-3 bg-white border-2 border-[#f4f0f2] text-[#266c24] rounded-full font-bold hover:bg-[#266c24] hover:border-transparent hover:text-white transition-all flex items-center gap-2`}>
                  Thực hành ngay
                  <span className="material-symbols-outlined">bolt</span>
                </button>
              </div>
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#266c24]/5 rounded-full blur-3xl group-hover:bg-[#266c24]/10 transition-colors"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillHubPage;