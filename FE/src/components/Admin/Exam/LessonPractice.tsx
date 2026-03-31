import React, { useState } from 'react';
import { GenerateExamRequest } from '../../../interfaces/Admin/Exam';
import { ExamType, SkillType } from '../../../interfaces/Admin/QuestionBank';

interface Props {
    data: GenerateExamRequest;
    onChange: (data: GenerateExamRequest) => void;
    levels: any[];
    lessons: { lessonID: string, title: string }[];
    lessonDataFull: any[];
    onLevelChange: (levelId: string) => void;
}

const LessonPractice: React.FC<Props> = ({ data, onChange, levels, lessons, lessonDataFull, onLevelChange }) => {
    const [isLevelMenuOpen, setIsLevelMenuOpen] = useState(false);
    const [levelSearch, setLevelSearch] = useState("");
    const [isLessonMenuOpen, setIsLessonMenuOpen] = useState(false);
    const [lessonSearch, setLessonSearch] = useState("");

    const currentLessonInfo = lessonDataFull.find(l => l.lessonID === data.lessonID);

    const filteredLevels = levels
        .filter(lvl => ["N3", "N4", "N5"].includes(lvl.levelName.toUpperCase()))
        .filter(lvl => lvl.levelName.toLowerCase().includes(levelSearch.toLowerCase()))
        .sort((a, b) => b.levelName.localeCompare(a.levelName));

    const filteredLessons = lessons
        .filter(l => l.title.toLowerCase().includes(lessonSearch.toLowerCase()));

    const selectedLevel = levels.find(l => l.levelID === data.levelID);
    const selectedLesson = lessons.find(l => l.lessonID === data.lessonID);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Section lọc Level & Chọn bài học */}
            <section className="bg-white p-8 rounded-2xl border border-[#f4f0f2] shadow-sm space-y-8">
                <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-primary">menu_book</span>
                    <h3 className="text-base font-bold text-[#181114] uppercase">Luyện tập theo Bài học</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Cấp độ trình độ */}
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider">Trình độ mục tiêu</label>
                        <div className="relative">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#886373]">
                                    search
                                </span>
                                <input
                                    type="text"
                                    placeholder="Tìm và chọn trình độ..."
                                    value={isLevelMenuOpen ? levelSearch : (selectedLevel?.levelName || "")}
                                    onChange={(e) => {
                                        setLevelSearch(e.target.value);
                                        setIsLevelMenuOpen(true);
                                    }}
                                    onFocus={() => {
                                        setIsLevelMenuOpen(true);
                                        setLevelSearch("");
                                    }}
                                    className="w-full bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl pl-9 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                />
                                {selectedLevel && !isLevelMenuOpen && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-sm">check_circle</span>
                                )}
                            </div>

                            {isLevelMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsLevelMenuOpen(false)} />
                                    <div className="absolute left-0 right-0 mt-2 bg-white border border-[#f4f0f2] rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto p-1 custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                                        {filteredLevels.map((lvl) => (
                                            <button
                                                key={lvl.levelID}
                                                type="button"
                                                onClick={() => {
                                                    onLevelChange(lvl.levelID);
                                                    setIsLevelMenuOpen(false);
                                                    setLevelSearch("");
                                                }}
                                                className={`w-full text-left px-4 py-2.5 text-sm rounded-lg hover:bg-primary/5 hover:text-primary transition-colors flex items-center justify-between group ${data.levelID === lvl.levelID ? 'bg-primary/5 text-primary font-bold' : 'text-[#886373]'}`}
                                            >
                                                {lvl.levelName}
                                                {data.levelID === lvl.levelID && <span className="material-symbols-outlined text-xs">check</span>}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Tiêu đề đề thi */}
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider">Tên đề luyện tập</label>
                        <input 
                            type="text"
                            placeholder="VD: Luyện tập ngữ pháp N4 - Bài 1..."
                            className="w-full px-4 py-3 bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl text-sm font-bold focus:border-primary outline-none transition-all placeholder:text-[#886373]/30"
                            value={data.title}
                            onChange={e => onChange({...data, title: e.target.value})}
                        />
                    </div>
                </div>

                {/* HÀNG 2: CHỌN BÀI HỌC */}
                {data.levelID && (
                    <div className="p-6 bg-primary/5 rounded-2xl border border-dashed border-primary/20 animate-in slide-in-from-top-2 duration-300">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-xl">auto_stories</span>
                                <label className="text-sm font-bold text-primary uppercase">Phạm vi bài học cụ thể</label>
                            </div>

                            <div className="relative">
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-primary/60">
                                        search
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Tìm và chọn bài học từ danh sách..."
                                        value={isLessonMenuOpen ? lessonSearch : (selectedLesson?.title || "")}
                                        onChange={(e) => {
                                            setLessonSearch(e.target.value);
                                            setIsLessonMenuOpen(true);
                                        }}
                                        onFocus={() => {
                                            setIsLessonMenuOpen(true);
                                            setLessonSearch("");
                                        }}
                                        className="w-full bg-white border border-primary/20 rounded-xl pl-9 pr-4 py-3 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm"
                                    />
                                    {selectedLesson && !isLessonMenuOpen && (
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary text-sm">check_circle</span>
                                    )}
                                </div>

                                {isLessonMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsLessonMenuOpen(false)} />
                                        <div className="absolute left-0 right-0 mt-2 bg-white border border-[#f4f0f2] rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto p-1 custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                                            {filteredLessons.map((l) => (
                                                <button
                                                    key={l.lessonID}
                                                    type="button"
                                                    onClick={() => {
                                                        const updates: any = { ...data, lessonID: l.lessonID };
                                                        if (!data.title) {
                                                            updates.title = `Luyện tập: ${l.title}`;
                                                        }
                                                        onChange(updates);
                                                        setIsLessonMenuOpen(false);
                                                        setLessonSearch("");
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 text-sm rounded-lg hover:bg-primary/5 hover:text-primary transition-colors flex items-center justify-between group ${data.lessonID === l.lessonID ? 'bg-primary/5 text-primary font-bold' : 'text-[#886373]'}`}
                                                >
                                                    {l.title}
                                                    {data.lessonID === l.lessonID && <span className="material-symbols-outlined text-xs">check</span>}
                                                </button>
                                            ))}
                                            {filteredLessons.length === 0 && (
                                                <div className="p-3 text-center text-xs text-gray-400 italic">Không tìm thấy bài học phù hợp</div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Bảng cấu hình rút gọn */}
            <section className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm overflow-hidden animate-in slide-in-from-top-4">
                <div className="p-6 border-b border-[#f4f0f2] bg-[#fbf9fa] flex justify-between items-center">
                    <h3 className="text-sm font-bold text-[#181114] uppercase tracking-tight">Thiết lập số lượng câu hỏi</h3>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full uppercase">Luyện tập tự do</span>
                </div>
                
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.parts.map((part, idx) => {
                        const skillStat = currentLessonInfo?.skillStats?.find(
                            (s: any) => s.skillId === part.skillType
                        );
                        const maxAvailable = skillStat?.totalQuestions || 0;

                        return (
                            <div key={idx} className="flex items-center justify-between p-5 bg-[#fbf9fa] rounded-2xl border border-[#f4f0f2] hover:border-primary/30 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-2xl bg-white border border-[#f4f0f2] flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                                        {part.skillType === SkillType.Vocabulary ? "🎋" : 
                                         part.skillType === SkillType.Grammar ? "📝" : "🎧"}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-sm text-[#181114]">{SkillType[part.skillType]}</p>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#886373] uppercase">
                                            <span>Kho câu hỏi:</span>
                                            <span className="text-primary">{maxAvailable}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <button 
                                        type="button"
                                        className="size-8 rounded-xl bg-white border border-[#f4f0f2] flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 disabled:opacity-30 shadow-sm transition-colors"
                                        onClick={() => {
                                            const newParts = [...data.parts];
                                            newParts[idx].quantity = Math.max(0, newParts[idx].quantity - 1);
                                            onChange({...data, parts: newParts});
                                        }}
                                        disabled={part.quantity <= 0}
                                    >
                                        <span className="material-symbols-outlined text-sm">remove</span>
                                    </button>

                                    <div className="w-12 text-center">
                                        <input 
                                            type="number" 
                                            className="w-full bg-transparent font-black text-lg outline-none text-primary"
                                            value={part.quantity}
                                            onChange={(e) => {
                                                let val = Math.min(maxAvailable, Math.max(0, parseInt(e.target.value) || 0));
                                                const newParts = [...data.parts];
                                                newParts[idx].quantity = val;
                                                onChange({...data, parts: newParts});
                                            }}
                                        />
                                    </div>

                                    <button 
                                        type="button"
                                        className="size-8 rounded-xl bg-white border border-[#f4f0f2] flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-500 disabled:opacity-30 shadow-sm transition-colors"
                                        onClick={() => {
                                            if (part.quantity < maxAvailable) {
                                                const newParts = [...data.parts];
                                                newParts[idx].quantity += 1;
                                                onChange({...data, parts: newParts});
                                            }
                                        }}
                                        disabled={part.quantity >= maxAvailable}
                                    >
                                        <span className="material-symbols-outlined text-sm">add</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {data.parts.length === 0 && (
                        <div className="col-span-2 py-10 text-center text-xs text-[#886373] italic">Vui lòng chọn trình độ và bài học để cấu hình câu hỏi</div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default LessonPractice;