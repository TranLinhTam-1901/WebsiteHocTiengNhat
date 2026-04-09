import React from 'react';
import { AnswerDTO } from '../../../interfaces/Admin/QuestionBank';

interface Props {
    answers: AnswerDTO[];
    setAnswers: (answers: AnswerDTO[]) => void;
}

const AnswerEditor: React.FC<Props> = ({ answers, setAnswers }) => {
    const updateAnswer = (index: number, field: keyof AnswerDTO, value: any) => {
        const newAnswers = [...answers];
        if (field === 'isCorrect') {
            newAnswers.forEach((ans, i) => (ans.isCorrect = i === index));
        } else {
            (newAnswers[index] as any)[field] = value;
        }
        setAnswers(newAnswers);
    };

    const removeAnswer = (index: number) => {
        if (answers.length <= 2) {
            alert('Một câu hỏi cần tối thiểu 2 đáp án!');
            return;
        }

        const wasCorrect = answers[index].isCorrect;
        const newAnswers = answers.filter((_, i) => i !== index);

        if (wasCorrect && newAnswers.length > 0) {
            newAnswers[0].isCorrect = true;
        }

        setAnswers(newAnswers);
    };

    return (
        <div className="mt-2">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#886373]">
                    Danh sách đáp án
                </label>
                <span className="text-[11px] font-medium text-[#886373]">Chọn một đáp án đúng</span>
            </div>

            {answers.map((ans, index) => (
                <div
                    key={index}
                    className={`relative mb-3 flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${
                        ans.isCorrect
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-[#f4f0f2] bg-white hover:border-primary/20'
                    }`}
                >
                    <input
                        type="radio"
                        name="correct-answer"
                        checked={ans.isCorrect}
                        onChange={() => updateAnswer(index, 'isCorrect', true)}
                        className="size-5 shrink-0 cursor-pointer accent-primary"
                    />

                    <input
                        value={ans.answerText}
                        placeholder={`Đáp án ${index + 1}...`}
                        onChange={(e) => updateAnswer(index, 'answerText', e.target.value)}
                        className="min-w-0 flex-1 border-none bg-transparent text-[15px] text-[#181114] outline-none placeholder:text-[#886373]/50"
                    />

                    {ans.isCorrect ? (
                        <span className="shrink-0 whitespace-nowrap text-[10px] font-bold uppercase tracking-wide text-primary">
                            Đúng
                        </span>
                    ) : (
                        <button
                            type="button"
                            onClick={() => removeAnswer(index)}
                            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-lg text-[#886373] transition-colors hover:bg-[#f4f0f2] hover:text-red-500"
                            title="Xóa đáp án"
                        >
                            ×
                        </button>
                    )}
                </div>
            ))}

            <button
                type="button"
                onClick={() => setAnswers([...answers, { answerText: '', isCorrect: false }])}
                className="w-full rounded-xl border border-dashed border-primary/40 bg-primary/5 py-3 text-sm font-bold text-primary transition-all hover:border-primary hover:bg-primary/10"
            >
                + Thêm đáp án
            </button>
        </div>
    );
};

export default AnswerEditor;
