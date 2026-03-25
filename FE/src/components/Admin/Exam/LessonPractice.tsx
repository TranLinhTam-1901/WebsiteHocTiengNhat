import React from 'react';
import { GenerateExamRequest } from '../../../interfaces/Admin/Exam';
import { ExamType, SkillType } from '../../../interfaces/Admin/QuestionBank';
import Select from "react-select";

interface Props {
    data: GenerateExamRequest;
    onChange: (data: GenerateExamRequest) => void;
    levels: any[];
    lessons: { lessonID: string, title: string }[];
    lessonDataFull: any[];
    onLevelChange: (levelId: string) => void;
}

const LessonPractice: React.FC<Props> = ({ data, onChange, levels, lessons, lessonDataFull, onLevelChange }) => {
    const currentLessonInfo = lessonDataFull.find(l => l.lessonID === data.lessonID);
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Section lọc Level & Chọn bài học */}
            <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                {/* HÀNG 1: LEVEL & TITLE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cấp độ */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Trình độ mục tiêu</label>
                        <select 
                            className="w-full p-3 border-2 border-gray-50 rounded-xl outline-none focus:border-pink-500 transition-all appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em_1em]"
                            value={data.levelID}
                            onChange={e => onLevelChange(e.target.value)}
                        >
                            <option value="">Chọn cấp độ</option>
                            {levels
                                .filter(lvl => ["N3", "N4", "N5"].includes(lvl.levelName.toUpperCase()))
                                .sort((a, b) => b.levelName.localeCompare(a.levelName)) 
                                .map((lvl) => (
                                    <option key={lvl.levelID} value={lvl.levelID}>
                                        {lvl.levelName}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* Tiêu đề đề thi */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tên đề thi / Bài luyện tập</label>
                        <input 
                            type="text"
                            placeholder="VD: Luyện tập ngữ pháp N4 - Bài 1..."
                            className="w-full p-3 border-2 border-gray-50 rounded-xl outline-none focus:border-pink-500 transition-all placeholder:text-gray-300"
                            value={data.title}
                            onChange={e => onChange({...data, title: e.target.value})}
                        />
                    </div>
                </div>

                {/* HÀNG 2: CHỌN BÀI HỌC (Chỉ hiện khi là LessonPractice) */}
                {data.type === ExamType.LessonPractice && (
                    <div className="p-5 bg-pink-50/30 rounded-2xl border-2 border-dashed border-pink-100 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-pink-500 rounded-lg text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </span>
                                <label className="text-sm font-bold text-pink-700">Phạm vi bài học cụ thể</label>
                            </div>

                            <Select

                            value={lessons.find(l => l.lessonID === data.lessonID) 
                                ? { value: data.lessonID, label: lessons.find(l => l.lessonID === data.lessonID)?.title } 
                                : null
                            }
                                    options={lessons.map(l => ({
                                    value: l.lessonID,
                                    label: l.title
                                }))}
                                unstyled
                                placeholder="Tìm và chọn bài học từ danh sách..."
                                onChange={(selected) => {
                                    const updates: any = { ...data, lessonID: selected?.value };
                                    // Nếu người dùng chưa nhập tiêu đề, tự động lấy tên bài học làm tiêu đề
                                    if (!data.title && selected) {
                                        updates.title = `Luyện tập: ${selected.label}`;
                                    }
                                    onChange(updates);
                                }}
                                // Giữ nguyên phần classNames đẹp đẽ của bạn ở đây...
                                classNames={{
                                    control: ({ isFocused }) => `flex border-2 rounded-xl p-1.5 transition-all ${isFocused ? 'border-pink-500 bg-white' : 'border-white bg-white hover:border-pink-200'}`,
                                    singleValue: () => 'text-slate-800 font-medium ml-1',
                                    menu: () => 'mt-2 border border-slate-100 bg-white rounded-xl shadow-xl overflow-hidden',
                                    option: ({ isSelected, isFocused }) => `px-4 py-3 cursor-pointer ${isSelected ? 'bg-pink-500 text-white' : isFocused ? 'bg-pink-50 text-pink-600' : 'text-slate-700'}`,
                                    placeholder: () => 'text-slate-400 ml-1',
                                    menuList: () => 'max-h-[250px] overflow-y-auto'
                                }}
                            />
                        </div>
                    </div>
                )}
            </section>

            {/* Bảng cấu hình rút gọn (Không cần Point/Question quá phức tạp) */}
            <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-700">Thiết lập số lượng câu hỏi</h3>
                    <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
                        Luyện tập tự do
                    </span>
                 </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.parts.map((part, idx) => {
                        // Trích xuất số lượng câu hỏi tối đa cho kỹ năng này từ SkillStats
                        const skillStat = currentLessonInfo?.skillStats?.find(
                            (s: any) => s.skillId === part.skillType
                        );
                        const maxAvailable = skillStat?.totalQuestions || 0;

                        return (
                            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-pink-200 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-xl">
                                        {part.skillType === SkillType.Vocabulary ? "🎋" : 
                                         part.skillType === SkillType.Grammar ? "📝" : "🎧"}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-700">{SkillType[part.skillType]}</p>
                                        <p className="text-[10px] text-gray-400 italic">
                                            Kho câu hỏi: <span className="text-pink-500 font-bold">{maxAvailable}</span> câu
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <button 
                                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-30"
                                        onClick={() => {
                                            const newParts = [...data.parts];
                                            newParts[idx].quantity = Math.max(0, newParts[idx].quantity - 1);
                                            onChange({...data, parts: newParts});
                                        }}
                                        disabled={part.quantity <= 0}
                                    >-</button>

                                    <input 
                                        type="number" 
                                        className="w-12 text-center bg-transparent font-bold text-lg outline-none text-pink-600"
                                        value={part.quantity}
                                        onChange={(e) => {
                                            let val = Number(e.target.value);
                                            if (val > maxAvailable) val = maxAvailable;
                                            if (val < 0) val = 0;
                                            const newParts = [...data.parts];
                                            newParts[idx].quantity = val;
                                            onChange({...data, parts: newParts});
                                        }}
                                    />

                                    <button 
                                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-pink-50 hover:text-pink-500 disabled:opacity-30"
                                        onClick={() => {
                                            if (part.quantity < maxAvailable) {
                                                const newParts = [...data.parts];
                                                newParts[idx].quantity += 1;
                                                onChange({...data, parts: newParts});
                                            }
                                        }}
                                        disabled={part.quantity >= maxAvailable}
                                    >+</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};
export default LessonPractice;