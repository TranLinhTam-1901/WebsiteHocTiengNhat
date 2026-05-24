import { SkillType } from '../../../../interfaces/Admin/QuestionBank';

export type SkillHubConfig = {
  title: string;
  colorText: string;
  colorBg: string;
  hoverBg: string;
  colorLight: string;
  borderColor: string;
  shadowHover: string;
  shadowGlow: string;
  icon: string;
  skillEnum: SkillType;
  /** Loading spinner accent (Tailwind border-top) */
  spinnerTop: string;
  /** Ghost/outline buttons trong danh sách đề */
  secondaryBtnHover: string;
  /** Đáp án được chọn (viền + nền) */
  examOptionSelected: string;
  /** Hover ô đáp án */
  examOptionHover: string;
  /** Ô chỉ mục câu đang làm */
  examNavActive: string;
};

export function getSkillHubConfig(type: string | undefined): SkillHubConfig {
  switch (type) {
    case 'vocabulary':
      return {
        title: 'Từ vựng',
        colorText: 'text-[#f287b6]',
        colorBg: 'bg-[#f287b6]',
        hoverBg: 'hover:bg-[#f287b6]',
        colorLight: 'bg-[#f287b6]/10',
        borderColor: 'border-[rgba(242,135,182,0.1)]',
        shadowHover: 'hover:shadow-[0_20px_40px_-15px_rgba(242,135,182,0.3)]',
        shadowGlow: 'shadow-[#f287b6]/30',
        icon: 'translate',
        skillEnum: SkillType.Vocabulary,
        spinnerTop: 'border-t-[#f287b6]',
        secondaryBtnHover:
          'hover:border-[rgba(242,135,182,0.35)] hover:text-[#e0609a]',
        examOptionSelected: 'border-[#f287b6] bg-[#f287b6]/10 shadow-sm',
        examOptionHover:
          'hover:border-[rgba(242,135,182,0.35)] hover:bg-[rgba(242,135,182,0.06)]',
        examNavActive: 'border-[#f287b6] text-[#c75488] ring-4 ring-[#f287b6]/15 bg-white',
      };
    case 'kanji':
      return {
        title: 'Hán tự',
        colorText: 'text-emerald-500',
        colorBg: 'bg-emerald-500',
        hoverBg: 'hover:bg-emerald-500',
        colorLight: 'bg-emerald-500/10',
        borderColor: 'border-[rgba(16,185,129,0.1)]',
        shadowHover: 'hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)]',
        shadowGlow: 'shadow-emerald-500/30',
        icon: 'draw',
        skillEnum: SkillType.Kanji,
        spinnerTop: 'border-t-emerald-500',
        secondaryBtnHover: 'hover:border-emerald-300/70 hover:text-emerald-700',
        examOptionSelected: 'border-emerald-500 bg-emerald-500/10 shadow-sm',
        examOptionHover: 'hover:border-emerald-400/60 hover:bg-emerald-500/5',
        examNavActive: 'border-emerald-500 text-emerald-600 ring-4 ring-emerald-500/15 bg-white',
      };
    case 'grammar':
      return {
        title: 'Ngữ pháp',
        colorText: 'text-amber-500',
        colorBg: 'bg-amber-500',
        hoverBg: 'hover:bg-amber-500',
        colorLight: 'bg-amber-500/10',
        borderColor: 'border-[rgba(245,158,11,0.1)]',
        shadowHover: 'hover:shadow-[0_20px_40px_-15px_rgba(245,158,11,0.3)]',
        shadowGlow: 'shadow-amber-500/30',
        icon: 'menu_book',
        skillEnum: SkillType.Grammar,
        spinnerTop: 'border-t-amber-500',
        secondaryBtnHover: 'hover:border-amber-300/70 hover:text-amber-700',
        examOptionSelected: 'border-amber-500 bg-amber-500/10 shadow-sm',
        examOptionHover: 'hover:border-amber-400/60 hover:bg-amber-500/5',
        examNavActive: 'border-amber-500 text-amber-700 ring-4 ring-amber-500/15 bg-white',
      };
    case 'reading':
      return {
        title: 'Đọc hiểu',
        colorText: 'text-indigo-500',
        colorBg: 'bg-indigo-500',
        hoverBg: 'hover:bg-indigo-500',
        colorLight: 'bg-indigo-500/10',
        borderColor: 'border-[rgba(59,130,246,0.1)]',
        shadowHover: 'hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)]',
        shadowGlow: 'shadow-indigo-500/30',
        icon: 'menu_book',
        skillEnum: SkillType.Reading,
        spinnerTop: 'border-t-indigo-500',
        secondaryBtnHover: 'hover:border-indigo-300/70 hover:text-indigo-700',
        examOptionSelected: 'border-indigo-500 bg-indigo-500/10 shadow-sm',
        examOptionHover: 'hover:border-indigo-400/60 hover:bg-indigo-500/5',
        examNavActive: 'border-indigo-500 text-indigo-600 ring-4 ring-indigo-500/15 bg-white',
      };
    case 'listening':
      return {
        title: 'Nghe hiểu',
        colorText: 'text-violet-500',
        colorBg: 'bg-violet-500',
        hoverBg: 'hover:bg-violet-500',
        colorLight: 'bg-violet-500/10',
        borderColor: 'border-[rgba(139,92,246,0.1)]',
        shadowHover: 'hover:shadow-[0_20px_40px_-15px_rgba(139,92,246,0.3)]',
        shadowGlow: 'shadow-violet-500/30',
        icon: 'headphones',
        skillEnum: SkillType.Listening,
        spinnerTop: 'border-t-violet-500',
        secondaryBtnHover: 'hover:border-violet-300/70 hover:text-violet-700',
        examOptionSelected: 'border-violet-500 bg-violet-500/10 shadow-sm',
        examOptionHover: 'hover:border-violet-400/60 hover:bg-violet-500/5',
        examNavActive: 'border-violet-500 text-violet-600 ring-4 ring-violet-500/15 bg-white',
      };
    default:
      return {
        title: 'Từ vựng',
        colorText: 'text-[#f287b6]',
        colorBg: 'bg-[#f287b6]',
        hoverBg: 'hover:bg-[#f287b6]',
        colorLight: 'bg-[#f287b6]/10',
        borderColor: 'border-[rgba(242,135,182,0.1)]',
        shadowHover: 'hover:shadow-[0_20px_40px_-15px_rgba(242,135,182,0.3)]',
        shadowGlow: 'shadow-[#f287b6]/30',
        icon: 'translate',
        skillEnum: SkillType.Vocabulary,
        spinnerTop: 'border-t-[#f287b6]',
        secondaryBtnHover:
          'hover:border-[rgba(242,135,182,0.35)] hover:text-[#e0609a]',
        examOptionSelected: 'border-[#f287b6] bg-[#f287b6]/10 shadow-sm',
        examOptionHover:
          'hover:border-[rgba(242,135,182,0.35)] hover:bg-[rgba(242,135,182,0.06)]',
        examNavActive: 'border-[#f287b6] text-[#c75488] ring-4 ring-[#f287b6]/15 bg-white',
      };
  }
}
