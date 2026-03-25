import { QuestionType, QuestionStatus, SkillType } from "../../interfaces/Admin/QuestionBank";

// 1. Nhãn hiển thị cho Loại câu hỏi (Dùng để hiển thị text thuần)
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
    [QuestionType.MultipleChoice]: "Chọn từ",
    [QuestionType.FillInBlank]: "Điền vào chỗ trống",
    [QuestionType.Ordering]: "Sắp xếp câu",
    [QuestionType.Synonym]: "Từ đồng nghĩa",
    [QuestionType.Usage]: "Cách dùng"
};

// 2. Danh sách Options cho Dropdown/Select loại câu hỏi
export const QUESTION_TYPE_OPTIONS = [
    { value: QuestionType.MultipleChoice, label: "Chọn từ" },
    { value: QuestionType.FillInBlank, label: "Điền vào chỗ trống" },
    { value: QuestionType.Ordering, label: "Sắp xếp câu" },
    { value: QuestionType.Synonym, label: "Từ đồng nghĩa" },
    { value: QuestionType.Usage, label: "Cách dùng" }
];

// 3. Danh sách các mức độ khó
export const DIFFICULTY_OPTIONS = [
    { value: 1, label: "N5" },
    { value: 2, label: "N4" },
    { value: 3, label: "N3" }
];

// 4. Danh sách các loại phôi (Dùng cho Cột trái SourcePanel)
export const SOURCE_TYPE_OPTIONS = [
    { value: 'Vocabulary', label: 'Từ vựng' },
    { value: 'Grammar', label: 'Ngữ pháp' },
    { value: 'Kanji', label: 'Hán tự' },
    { value: 'Reading', label: 'Bài đọc' },
    { value: 'Listening', label: 'Bài nghe' }
];



export const SKILL_TYPE_LABELS: Record<SkillType, string> = {
    [SkillType.General]: "Tổng hợp",
    [SkillType.Vocabulary]: "Từ vựng",
    [SkillType.Grammar]: "Ngữ pháp",
    [SkillType.Kanji]: "Hán tự",
    [SkillType.Reading]: "Bài đọc",
    [SkillType.Listening]: "Bài nghe",
    [SkillType.Practice]: "Luyện tập"
};

export const SKILL_TYPE_OPTIONS = Object.entries(SKILL_TYPE_LABELS).map(([value, label]) => ({
    value: Number(value),
    label
}));