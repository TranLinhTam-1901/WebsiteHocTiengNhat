import React, { useState, useEffect } from 'react';
import ExamService from '../../../services/Admin/examService';
import { ExamListResponse } from '../../../interfaces/Admin/Exam';
import { ExamType } from '../../../interfaces/Admin/QuestionBank';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ExamListPage: React.FC = () => {
    const navigate = useNavigate();
    const [exams, setExams] = useState<ExamListResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ search: '', levelId: '', type: undefined as ExamType | undefined });
    const [levels, setLevels] = useState<{ levelID: string, levelName: string }[]>([]);

    useEffect(() => {
    ExamService.getLevelsLookup().then(setLevels).catch(() => {
        // Fallback nếu API lỗi
        setLevels([
            { levelID: 'guid-n1', levelName: 'N1' },
            { levelID: 'guid-n2', levelName: 'N2' }
        ]);
    });
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await ExamService.getExams(filters.search, filters.levelId, filters.type);
                setExams(data);
            } finally { setLoading(false); }
        };
        fetchData();
    }, [filters]);

    const handleToggle = async (id: string) => {
        const res = await ExamService.togglePublish(id);
        if (res.success) {
            setExams(prev => prev.map(e => e.examID === id ? { ...e, isPublished: res.isPublished } : e));
            toast.success(res.message);
        }
    };

    const getBadge = (type: ExamType) => {
        const map = {
            [ExamType.StandardJLPT]: { label: "Chuẩn JLPT", css: "bg-red-50 text-red-600 border-red-100" },
            [ExamType.LessonPractice]: { label: "Bài học", css: "bg-green-50 text-green-600 border-green-100" },
            [ExamType.SkillPractice]: { label: "Kỹ năng", css: "bg-blue-50 text-blue-600 border-blue-100" },
        };
        const item = map[type];
        return <span className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${item.css}`}>{item.label}</span>;
    };

    return (
        <div className="p-6 max-w-[1400px] mx-auto">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Kho đề thi</h1>
                    <p className="text-gray-500 text-sm">Quản lý và theo dõi trạng thái các bộ đề đã đúc.</p>
                </div>
                <button onClick={() => navigate('/admin/exams/edit')} className="bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-pink-600 transition-all">
                    + Tạo đề mới
                </button>
            </div>

            {/* Filter Block */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 mb-6 flex gap-4">
                <input 
                    type="text" placeholder="Tìm kiếm tên đề..." 
                    className="flex-2 p-3 bg-gray-50 rounded-xl outline-none border-2 border-transparent focus:border-pink-100"
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                />

                
                    <select 
                        className="flex-1 p-3 bg-gray-50 rounded-xl outline-none"
                        value={filters.levelId}
                        onChange={(e) => setFilters({...filters, levelId: e.target.value})}
                    >
                        <option value="">Tất cả trình độ</option>
                        {levels.map(lvl => (
                            <option key={lvl.levelID} value={lvl.levelID}>
                                {lvl.levelName}
                            </option>
                        ))}
                    </select>
                
                <select 
                    className="p-3 bg-gray-50 rounded-xl outline-none min-w-[200px]"
                    onChange={(e) => setFilters({...filters, type: e.target.value === "" ? undefined : Number(e.target.value)})}
                >
                    <option value="">Tất cả loại hình</option>
                    <option value={ExamType.StandardJLPT}>Chuẩn JLPT</option>
                    <option value={ExamType.LessonPractice}>Luyện tập bài học</option>
                    <option value={ExamType.SkillPractice}>Luyện tập kỹ năng</option>
                </select>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-4xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr className="text-xs font-bold text-gray-400 uppercase">
                            <th className="p-5 text-left">Thông tin đề thi</th>
                            <th className="p-5 text-center">Phân loại</th>
                            <th className="p-5 text-center">Câu hỏi / Điểm</th>
                            <th className="p-5 text-center">Công khai</th>
                            <th className="p-5 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {exams.map(exam => (
                            <tr key={exam.examID} className="group hover:bg-gray-50/50 transition-all">
                                <td className="p-5">
                                    <div className="font-bold text-gray-700">{exam.title}</div>
                                    <div className="text-[11px] text-gray-400 uppercase font-medium">{exam.levelName} • {exam.duration} phút</div>
                                </td>
                                <td className="p-5 text-center">{getBadge(exam.type)}</td>
                                <td className="p-5 text-center">
                                    <div className="text-sm font-bold text-gray-600">{exam.totalQuestions} câu</div>
                                    <div className="text-xs text-gray-400">{exam.totalScore} điểm</div>
                                </td>
                                <td className="p-5 text-center">
                                    <button 
                                        onClick={() => handleToggle(exam.examID)}
                                        className={`w-10 h-5 rounded-full relative transition-all ${exam.isPublished ? 'bg-primary' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${exam.isPublished ? 'left-6' : 'left-1'}`} />
                                    </button>
                                </td>
                                <td className="p-5 text-right">
                                    <button 
                                        onClick={() => navigate(`/admin/exams/${exam.examID}/details`)}
                                        className="text-background-dark font-bold text-sm hover:underline"
                                    >
                                        Chi tiết 👁️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default ExamListPage;