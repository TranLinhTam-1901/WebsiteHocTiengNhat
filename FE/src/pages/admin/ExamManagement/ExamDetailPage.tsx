import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ExamService from '../../../services/Admin/examService';
import { ExamDetailResponse } from '../../../interfaces/Admin/Exam';
import { ExamType } from '../../../interfaces/Admin/QuestionBank';

const ExamDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [details, setDetails] = useState<ExamDetailResponse | null>(null);

    useEffect(() => {
        if (id) ExamService.getExamDetails(id).then(setDetails);
    }, [id]);

    if (!details) return <div className="p-10 text-center italic text-gray-400">Đang tải chi tiết đề thi...</div>;

    return (
        <div className="p-6 max-w-[1400px] mx-auto">
            <button onClick={() => navigate(-1)} className="mb-4 text-gray-400 font-bold hover:text-gray-600 flex items-center gap-2">
                ← Quay lại danh sách
            </button>

            <div className="grid grid-cols-12 gap-8">
                {/* Cột trái: Danh sách câu hỏi */}
                <div className="col-span-8 space-y-4">
                    <section className="bg-white p-6 rounded-4xl border border-gray-100 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex justify-between items-center">
                            Danh sách câu hỏi 
                            <span className="text-sm bg-gray-100 px-4 py-1 rounded-full text-gray-500">{details.questions.length} câu</span>
                        </h2>
                        <div className="space-y-3">
                            {details.questions.map((q, idx) => (
                                <div key={q.questionID} className="p-4 bg-gray-50 rounded-2xl flex gap-4 items-start border border-transparent hover:border-pink-100 transition-all">
                                    <span className="bg-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-gray-400 text-xs shadow-sm">
                                        {q.orderIndex}
                                    </span>
                                    <div className="flex-1">
                                        <div className="text-gray-700 font-medium mb-1">{q.content}</div>
                                        <div className="flex gap-2">
                                            <span className="text-[10px] uppercase font-black text-pink-400">{q.skillType}</span>
                                            <span className="text-[10px] uppercase font-bold text-gray-300">• {q.score} điểm</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Cột phải: Thông số đề thi */}
              
                <div className="col-span-4 space-y-6">
                    {/* Card Thông tin chung */}
                    <div className="bg-linear-to-br from-pink-500 to-pink-400 p-6 rounded-4xl text-white shadow-xl relative overflow-hidden">
                        <h4 className="font-bold mb-4 opacity-60 uppercase text-black">Thông tin chung</h4>
                        <div className="text-2xl font-black mb-1">{details.title}</div>
                        <div className="text-white font-bold text-sm">Điểm đạt: {details.passingScore}</div>
                        
                        {/* Hiển thị loại đề thi làm watermark phía sau */}
                        <div className="absolute -right-4 -bottom-4 text-6xl font-black opacity-10 italic uppercase">
                            {details.examType === ExamType.StandardJLPT ? 'JLPT' : 'PRACTICE'}
                        </div>
                    </div>

                    {/* Chỉ hiển thị Điểm Liệt nếu là StandardJLPT */}
                    {details.examType === ExamType.StandardJLPT && (
                        <div className="bg-white p-6 rounded-4xl border border-gray-100 shadow-sm transition-all duration-300">
                            <h4 className="font-bold text-gray-700 mb-4 text-xs uppercase flex items-center gap-2">
                                <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
                                Điểm liệt quy định (JLPT)
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between p-3 bg-gray-50 rounded-xl hover:bg-pink-50 transition-colors">
                                    <span className="text-sm text-gray-500 font-medium">Kiến thức ngôn ngữ</span>
                                    <span className="font-bold text-pink-500">{details.minScores?.language ?? 0}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-gray-50 rounded-xl hover:bg-pink-50 transition-colors">
                                    <span className="text-sm text-gray-500 font-medium">Đọc hiểu</span>
                                    <span className="font-bold text-pink-500">{details.minScores?.reading ?? 0}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-gray-50 rounded-xl hover:bg-pink-50 transition-colors">
                                    <span className="text-sm text-gray-500 font-medium">Nghe hiểu</span>
                                    <span className="font-bold text-pink-500">{details.minScores?.listening ?? 0}</span>
                                </div>
                            </div>
                            <p className="mt-4 text-[10px] text-gray-400 italic text-center">
                                * Thí sinh cần đạt điểm tối thiểu ở tất cả các phần để vượt qua kỳ thi.
                            </p>
                        </div>
                    )}

                    {/* Hiển thị thông tin khác nếu KHÔNG PHẢI là StandardJLPT */}
                    {details.examType !== ExamType.StandardJLPT && (
                        <div className="bg-white p-6 rounded-4xl border border-dashed border-gray-200 text-center">
                            <p className="text-sm text-gray-400 italic">
                                Kỳ thi này áp dụng cách tính điểm tổng quát, không có quy định điểm liệt từng phần.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default ExamDetailPage;