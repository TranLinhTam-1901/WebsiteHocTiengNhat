import React, { useState } from 'react';
import { GenerateExamRequest } from '../../../interfaces/Admin/Exam';
import { SkillType } from '../../../interfaces/Admin/QuestionBank';

interface Props {
    data: GenerateExamRequest;
    onChange: (data: GenerateExamRequest) => void;
    levels: any[];
    levelStats: any; 
    onLevelChange: (levelId: string) => Promise<void>;
}

const SkillPractice: React.FC<Props> = ({ data, onChange, levels, levelStats, onLevelChange }) => {
    const [isLevelMenuOpen, setIsLevelMenuOpen] = useState(false);
    const [levelSearch, setLevelSearch] = useState("");

    const filteredLevels = levels
        .filter(lvl => ["N3", "N4", "N5"].includes(lvl.levelName.toUpperCase()))
        .filter(lvl => lvl.levelName.toLowerCase().includes(levelSearch.toLowerCase()))
        .sort((a, b) => b.levelName.localeCompare(a.levelName));

    const selectedLevel = levels.find(l => l.levelID === data.levelID);

    const handleAddSkill = (stat: any) => {
        if (data.parts.find(p => p.skillType === stat.skillId)) {
            return;
        }

        const newPart = {
            skillType: stat.skillId,
            quantity: 1, 
            pointPerQuestion: 1
        };

        onChange({
            ...data,
            parts: [...data.parts, newPart]
        });
    };

    const handleRemoveSkill = (skillType: number) => {
        onChange({
            ...data,
            parts: data.parts.filter(p => p.skillType !== skillType)
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Section lọc Level & Title */}
            <section className="bg-white p-8 rounded-2xl border border-[#f4f0f2] shadow-sm space-y-8">
                <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-primary">fitness_center</span>
                    <h3 className="text-base font-bold text-[#181114] uppercase">Luyện tập theo Kỹ năng</h3>
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

                    {/* Tiêu đề */}
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-[#886373] uppercase tracking-wider">Tên đề luyện tập</label>
                        <input 
                            type="text"
                            placeholder="VD: Luyện tập tổng hợp kỹ năng N3..."
                            className="w-full px-4 py-3 bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl text-sm font-bold focus:border-primary outline-none transition-all placeholder:text-[#886373]/30"
                            value={data.title}
                            onChange={e => onChange({...data, title: e.target.value})} 
                        />
                    </div>
                </div>
            </section>

            {/* SECTION 2: CHỌN KỸ NĂNG KHẢ DỤNG */}
            {data.levelID && (
                <section className="bg-white p-8 rounded-2xl border border-[#f4f0f2] shadow-sm space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">extension</span>
                        <h3 className="text-sm font-bold text-[#181114] uppercase tracking-tight">Chọn kỹ năng muốn luyện tập</h3>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                        {levelStats && levelStats.length > 0 ? (
                            levelStats.map((stat: any) => {
                                const isSelected = data.parts.some(p => p.skillType === stat.skillId);
                                return (
                                    <button
                                        key={stat.skillId}
                                        onClick={() => handleAddSkill(stat)}
                                        disabled={isSelected || stat.totalAvailable === 0}
                                        className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-3 ${
                                            isSelected 
                                                ? "bg-[#fbf9fa] border-[#f4f0f2] text-[#886373]/50 cursor-not-allowed opacity-60 shadow-inner" 
                                                : "border-primary/20 bg-primary/5 text-primary hover:border-primary hover:bg-primary hover:text-white hover:shadow-lg shadow-sm"
                                            }`}
                                    >
                                        <span className="font-bold text-sm tracking-tight">{stat.skillName}</span>
                                        <div className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase ${isSelected ? 'border-[#f4f0f2] bg-white text-[#886373]/40' : 'border-primary/20 bg-white/50 text-primary group-hover:bg-white group-hover:border-transparent transition-colors'}`}>
                                            {stat.totalAvailable} <span className="font-normal opacity-60">CÂU</span>
                                        </div>
                                        {!isSelected && <span className="material-symbols-outlined text-sm">add_circle</span>}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="w-full py-8 text-center text-xs text-[#886373] italic border-2 border-dashed border-[#f4f0f2] rounded-2xl">
                                Đang tải dữ liệu kỹ năng hoặc kho trống...
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* SECTION 3: BẢNG CHI TIẾT CẤU HÌNH */}
            {data.levelID && data.parts.length > 0 && (
                <section className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm overflow-hidden animate-in slide-in-from-top-4">
                    <div className="p-6 border-b border-[#f4f0f2] bg-[#fbf9fa] flex justify-between items-center">
                        <h3 className="text-sm font-bold text-[#181114] uppercase tracking-tight">Chi tiết cấu hình kỹ năng</h3>
                        <span className="px-3 py-1 bg-primary text-white text-[10px] font-black rounded-full uppercase shadow-sm shadow-primary/20">
                            {data.parts.length} KỸ NĂNG
                        </span>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] text-[#886373] uppercase tracking-[0.15em] bg-[#fbf9fa]/50">
                                    <th className="px-8 py-4 font-bold">Tên kỹ năng</th>
                                    <th className="px-8 py-4 font-bold text-center">Số lượng câu</th>
                                    <th className="px-8 py-4 font-bold text-center">Điểm / Câu</th>
                                    <th className="px-8 py-4 font-bold text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f4f0f2]">
                                {data.parts.map((part, idx) => {
                                    const stat = levelStats?.find((s: any) => s.skillId === part.skillType);
                                    const maxCount = stat?.totalAvailable || 0;

                                    return (
                                        <tr key={idx} className="hover:bg-primary/5 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-xl bg-[#fbf9fa] border border-[#f4f0f2] flex items-center justify-center text-xl shadow-sm">
                                                        {part.skillType === 1 ? "📚" : part.skillType === 2 ? "🖋️" : "🎧"}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-[#181114]">{stat?.skillName || "Kỹ năng"}</p>
                                                        <p className="text-[10px] text-[#886373] font-bold uppercase tracking-tight opacity-60">Tối đa: {maxCount} câu</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center justify-center gap-3 bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl p-1.5 w-32 mx-auto shadow-inner">
                                                    <button 
                                                        type="button"
                                                        className="size-7 hover:bg-rose-50 hover:text-rose-500 rounded-lg text-[#886373] transition-colors"
                                                        onClick={() => {
                                                            const newParts = [...data.parts];
                                                            newParts[idx].quantity = Math.max(1, part.quantity - 1);
                                                            onChange({...data, parts: newParts});
                                                        }}
                                                    >
                                                        <span className="material-symbols-outlined text-sm">remove</span>
                                                    </button>
                                                    <input 
                                                        type="number" 
                                                        className="w-8 text-center font-black text-primary bg-transparent outline-none"
                                                        value={part.quantity}
                                                        onChange={(e) => {
                                                            let val = Math.min(maxCount, Math.max(0, parseInt(e.target.value) || 0));
                                                            const newParts = [...data.parts];
                                                            newParts[idx].quantity = val;
                                                            onChange({...data, parts: newParts});
                                                        }}
                                                    />
                                                    <button 
                                                        type="button"
                                                        className="size-7 hover:bg-emerald-50 hover:text-emerald-500 rounded-lg text-[#886373] transition-colors"
                                                        onClick={() => {
                                                            const newParts = [...data.parts];
                                                            newParts[idx].quantity = Math.min(maxCount, part.quantity + 1);
                                                            onChange({...data, parts: newParts});
                                                        }}
                                                    >
                                                        <span className="material-symbols-outlined text-sm">add</span>
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl font-bold text-xs text-[#886373] shadow-inner">
                                                    {part.pointPerQuestion}
                                                    <span className="text-[8px] opacity-40">ĐIỂM/CÂU</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 flex items-end justify-end mr-3">
                                                <button 
                                                    type="button"
                                                    onClick={() => handleRemoveSkill(part.skillType)}
                                                    className="size-9 text-[#886373] hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 flex items-center justify-center"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete_sweep</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
};

export default SkillPractice;