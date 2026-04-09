import React, { useState } from 'react';
import { GenerateExamRequest } from '../../../interfaces/Admin/Exam';
import { SkillType } from '../../../interfaces/Admin/QuestionBank';

interface Props {
    data: GenerateExamRequest;
    onChange: (data: GenerateExamRequest) => void;
    levels: { levelID: string, levelName: string }[];
    onLevelChange: (levelId: string) => void;
}

const StandardJLPT: React.FC<Props> = ({ data, onChange, levels, onLevelChange }) => {
    const [isLevelMenuOpen, setIsLevelMenuOpen] = useState(false);
    const [levelSearch, setLevelSearch] = useState("");

    const filteredLevels = levels
        .filter(lvl => ["N1", "N2", "N3", "N4", "N5"].includes(lvl.levelName.toUpperCase()))
        .filter(lvl => lvl.levelName.toLowerCase().includes(levelSearch.toLowerCase()))
        .sort((a, b) => b.levelName.localeCompare(a.levelName));

    const selectedLevel = levels.find(l => l.levelID === data.levelID);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <section className="bg-white p-8 rounded-2xl border border-[#f4f0f2] shadow-sm space-y-8">
                 <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-primary">analytics</span>
                    <h3 className="text-base font-bold text-[#181114] uppercase">Cấu hình Đề thi tiêu chuẩn</h3>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Cấp độ JLPT */}
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider">Trình độ JLPT mục tiêu</label>
                        <div className="relative">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#886373]">
                                    search
                                </span>
                                <input
                                    type="text"
                                    placeholder="Tìm và chọn trình độ (N5 - N1)..."
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
                                        {filteredLevels.length === 0 && (
                                            <div className="p-3 text-center text-xs text-gray-400 italic">Không tìm thấy trình độ phù hợp</div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Tiêu đề */}
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider">Tên bộ đề thi</label>
                        <input 
                            className="w-full px-4 py-3 bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl text-sm font-bold focus:border-primary outline-none transition-all placeholder:text-[#886373]/30"
                            placeholder="VD: Đề thi thử JLPT N3 - Lần 1..."
                            value={data.title}
                            onChange={e => onChange({...data, title: e.target.value})}
                        />
                    </div>

                    {/* Thời gian */}
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider">Thời gian làm bài (Phút)</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#886373]">schedule</span>
                            <input 
                                type="number"
                                className="w-full px-4 py-3 bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl pl-9 text-sm font-bold focus:border-primary outline-none transition-all"
                                value={data.duration}
                                onChange={e => onChange({...data, duration: Number(e.target.value)})}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Bảng cấu hình chi tiết */}
            <section className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm overflow-hidden animate-in slide-in-from-top-4">
                <div className="p-6 border-b border-[#f4f0f2] bg-[#fbf9fa] flex justify-between items-center">
                    <h3 className="text-sm font-bold text-[#181114] uppercase tracking-tight">Chi tiết cấu trúc đề thi</h3>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase">Cố định theo Level</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-[10px] text-[#886373] uppercase tracking-[0.15em] bg-[#fbf9fa]/50">
                                <th className="px-8 py-4 font-bold">Phần thi / Kỹ năng</th>
                                <th className="px-8 py-4 font-bold text-center">Số lượng câu</th>
                                <th className="px-8 py-4 font-bold text-center">Điểm / Câu</th>
                                <th className="px-8 py-4 font-bold text-right">Tổng điểm phần</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f4f0f2]">
                            {data.parts.map((part, idx) => {
                                const skillLabels: Record<number, string> = {
                                    [SkillType.Vocabulary]: "Từ vựng (Vocabulary)",
                                    [SkillType.Grammar]: "Ngữ pháp (Grammar)",
                                    [SkillType.Kanji]: "Chữ Hán (Kanji)",
                                    [SkillType.Reading]: "Đọc hiểu (Reading)",
                                    [SkillType.Listening]: "Nghe hiểu (Listening)"
                                };
                                return (
                                    <tr key={idx} className="group hover:bg-primary/5 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-lg bg-[#fbf9fa] border border-[#f4f0f2] flex items-center justify-center text-lg">
                                                    {part.skillType === SkillType.Reading ? "📖" : part.skillType === SkillType.Listening ? "🎧" : "📝"}
                                                </div>
                                                <span className="font-bold text-sm text-[#181114]">{skillLabels[part.skillType] || "Phần thi"}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="px-3 py-1 bg-[#fbf9fa] border border-[#f4f0f2] rounded-lg font-bold text-sm">{part.quantity}</span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="text-xs font-bold text-[#886373]">~{part.pointPerQuestion}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="font-black text-sm text-[#181114]">{Math.round(part.quantity * part.pointPerQuestion)}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {data.parts.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-10 text-center text-xs text-[#886373] italic">Vui lòng chọn trình độ để xem cấu trúc đề thi</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default StandardJLPT;