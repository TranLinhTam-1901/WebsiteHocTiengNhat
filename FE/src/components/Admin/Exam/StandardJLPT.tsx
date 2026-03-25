import React from 'react';
import { GenerateExamRequest } from '../../../interfaces/Admin/Exam';
import { SkillType } from '../../../interfaces/Admin/QuestionBank';

interface Props {
    data: GenerateExamRequest;
    onChange: (data: GenerateExamRequest) => void;
    levels: { levelID: string, levelName: string }[];
    onLevelChange: (levelId: string) => void;
}

const StandardJLPT: React.FC<Props> = ({ data, onChange, levels, onLevelChange }) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Di chuyển Block 1: Thông tin cơ bản vào đây */}
            <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                 <h3 className="font-bold text-gray-700 mb-4">Thông tin đề thi tiêu chuẩn</h3>
                 <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Tiêu đề đề bài</label>
                        <input 
                            className="w-full mt-1 p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-200 outline-none"
                            placeholder="Nhập tiêu đề..."
                            value={data.title}
                            onChange={e => onChange({...data, title: e.target.value})}
                        />
                    </div>
                    
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Thời gian (Phút)</label>
                        <input 
                            type="number"
                            className="w-full mt-1 p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-200 outline-none"
                            value={data.duration}
                            onChange={e => onChange({...data, duration: Number(e.target.value)})}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Cấp độ JLPT</label>
                        <select 
                            className="w-full mt-1 p-2.5 border border-gray-200 rounded-xl outline-none"
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

                </div>
            </section>

            {/* Di chuyển Block 3: Bảng cấu hình chi tiết vào đây */}
            <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <table className="w-full">
                    
                    <thead>
                        <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
                            <th className="pb-3 pl-2">Phần thi</th>
                            <th className="pb-3">Số câu</th>
                            <th className="pb-3 text-center">Điểm/Câu</th>
                            <th className="pb-3 text-center">Tổng điểm</th>
                            {/* <th className="pb-3 text-right pr-2">Thao tác</th> */}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {data.parts.map((part, idx) => (
                            <tr key={idx} className="group hover:bg-gray-50 transition-colors">
                                <td className="py-4 pl-2 font-bold text-gray-700">{SkillType[part.skillType]}</td>
                                <td className="py-4">
                                    <input 
                                        type="number" disabled
                                        className="w-16 p-1 border rounded-lg text-center font-bold"
                                        value={part.quantity}
                                        onChange={(e) => {
                                            const newParts = [...data.parts];
                                            newParts[idx].quantity = Number(e.target.value);
                                            onChange({...data, parts: newParts});
                                        }}
                                    />
                                </td>
                                <td className="py-4 text-center text-gray-400">~{part.pointPerQuestion}</td>
                                <td className="py-4 text-center font-bold text-gray-700">{Math.round(part.quantity * part.pointPerQuestion)}</td>
                                {/* <td className="py-4 text-right pr-2">
                                    <button className="text-pink-300 hover:text-pink-500 transition-colors">⚙️</button>
                                </td> */}
                            </tr>
                        ))}
                    </tbody>
                                            
                </table>
            </section>
        </div>
    );
};
export default StandardJLPT;