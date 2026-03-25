import React from 'react';
import { GenerateExamRequest } from '../../../interfaces/Admin/Exam';
import { ExamType, SkillType } from '../../../interfaces/Admin/QuestionBank';

interface Props {
    data: GenerateExamRequest;
    onChange: (data: GenerateExamRequest) => void;
    levels: any[];
    // Ở chế độ SkillPractice, ta cần thông số tổng câu hỏi của cả Level thay vì theo bài học
    levelStats: any; 
    onLevelChange: (levelId: string) => Promise<void>;
}

const SkillPractice: React.FC<Props> = ({ data, onChange, levels, levelStats, onLevelChange }) => {
    
    // Hàm thêm kỹ năng vào danh sách cấu hình
    const handleAddSkill = (stat: any) => {
        // Kiểm tra xem kỹ năng này đã có trong danh sách chưa
        if (data.parts.find(p => p.skillType === stat.skillId)) {
            return; // Đã tồn tại thì không thêm nữa
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

    // Hàm xóa kỹ năng khỏi danh sách
    const handleRemoveSkill = (skillType: number) => {
        onChange({
            ...data,
            parts: data.parts.filter(p => p.skillType !== skillType)
        });
    };

    return (
        <div className="space-y-6 ">
            {/* SECTION 1: CHỌN LEVEL (Giữ nguyên của bạn nhưng sửa onChange để gọi API cha) */}
            <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
                {/* Cấp độ trình độ */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Trình độ mục tiêu
                    </label>
                    <select 
                        className="w-full p-3 border-2 border-gray-50 rounded-xl outline-none focus:border-pink-500 transition-all appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em_1em]"
                        value={data.levelID || ""}
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

                {/* Tiêu đề đề thi luyện tập kỹ năng */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Tên đề luyện tập kỹ năng
                    </label>
                    <input 
                        type="text"
                        placeholder="VD: Luyện tập tổng hợp kỹ năng N3..."
                        className="w-full p-3 border-2 border-gray-50 rounded-xl outline-none focus:border-pink-500 transition-all placeholder:text-gray-300"
                        value={data.title || ""}
                        onChange={e => onChange({...data, title: e.target.value})} 
                    />
                    <p className="text-[10px] text-gray-400 italic">
                        * Gợi ý: Tên đề sẽ giúp bạn quản lý các bài luyện tập dễ dàng hơn.
                    </p>
                </div>
                </div>
            </section>

            {/* SECTION 2: CHỌN KỸ NĂNG KHẢ DỤNG (Chỉ hiện khi đã chọn Level) */}
            {data.levelID && (
                <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-in zoom-in-95 duration-300">
                    <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase tracking-tight">Chọn kỹ năng muốn luyện tập</h3>
                    <div className="flex flex-wrap gap-3">
                        {levelStats && levelStats.length > 0 ? (
                            levelStats.map((stat: any) => {
                                const isSelected = data.parts.some(p => p.skillType === stat.skillId);
                                return (
                                    <button
                                        key={stat.skillId}
                                        onClick={() => handleAddSkill(stat)}
                                        disabled={isSelected || stat.totalAvailable === 0}
                                        className={`px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2 ${
                                            isSelected 
                                                ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed" 
                                                : "border-pink-50 bg-pink-50/30 text-pink-600 hover:border-pink-500 hover:bg-white focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                                            }`}
                                    >
                                        <span className="font-bold">{stat.skillName}</span>
                                        <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-blue-100">
                                            {stat.totalAvailable} câu
                                        </span>
                                        {!isSelected && <span className="text-lg">+</span>}
                                    </button>
                                );
                            })
                        ) : (
                            <p className="text-gray-400 text-sm italic">Đang tải dữ liệu kỹ năng hoặc kho trống...</p>
                        )}
                    </div>
                </section>
            )}

            {/* SECTION 3: BẢNG CHI TIẾT CẤU HÌNH (Chỉ hiện khi đã bốc ít nhất 1 kỹ năng) */}
            {data.levelID && data.parts.length > 0 && (
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in slide-in-from-top-4">
                    <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700">Chi tiết cấu hình đề</h3>
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                            {data.parts.length} kỹ năng đã chọn
                        </span>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[11px] text-gray-400 uppercase tracking-widest bg-gray-50/30">
                                    <th className="px-6 py-4 font-bold">Kỹ năng</th>
                                    <th className="px-6 py-4 font-bold text-center">Số lượng</th>
                                    <th className="px-6 py-4 font-bold text-center">Điểm/Câu</th>
                                    <th className="px-6 py-4 font-bold text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.parts.map((part, idx) => {
                                    const stat = levelStats?.find((s: any) => s.skillId === part.skillType);
                                    const maxCount = stat?.totalAvailable || 0;

                                    return (
                                        <tr key={idx} className="hover:bg-blue-50/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">
                                                        {part.skillType === 1 ? "📚" : part.skillType === 2 ? "🖋️" : "🎧"}
                                                    </span>
                                                    <div>
                                                        <p className="font-bold text-gray-700">{stat?.skillName || "Kỹ năng"}</p>
                                                        <p className="text-[10px] text-gray-400">Tối đa: {maxCount} câu</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-lg p-1 w-32 mx-auto">
                                                    <button 
                                                        className="w-7 h-7 hover:bg-gray-100 rounded text-gray-400"
                                                        onClick={() => {
                                                            const newParts = [...data.parts];
                                                            newParts[idx].quantity = Math.max(1, part.quantity - 1);
                                                            onChange({...data, parts: newParts});
                                                        }}
                                                    >-</button>
                                                    <input 
                                                        type="text" 
                                                        className="w-10 text-center font-bold text-blue-600 outline-none"
                                                        value={part.quantity}
                                                        onChange={(e) => {
                                                            let val = parseInt(e.target.value) || 0;
                                                            val = Math.min(maxCount, Math.max(0, val));
                                                            const newParts = [...data.parts];
                                                            newParts[idx].quantity = val;
                                                            onChange({...data, parts: newParts});
                                                        }}
                                                    />
                                                    <button 
                                                        className="w-7 h-7 hover:bg-gray-100 rounded text-gray-400"
                                                        onClick={() => {
                                                            const newParts = [...data.parts];
                                                            newParts[idx].quantity = Math.min(maxCount, part.quantity + 1);
                                                            onChange({...data, parts: newParts});
                                                        }}
                                                    >+</button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <input 
                                                    type="text" 
                                                    className="w-16 p-2 border border-gray-100 rounded-lg text-center font-medium focus:border-blue-300 outline-none"
                                                    value={part.pointPerQuestion}
                                                    onChange={(e) => {
                                                        const newParts = [...data.parts];
                                                        newParts[idx].pointPerQuestion = parseFloat(e.target.value) || 0;
                                                        onChange({...data, parts: newParts});
                                                    }}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => handleRemoveSkill(part.skillType)}
                                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                >
                                                    🗑️
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