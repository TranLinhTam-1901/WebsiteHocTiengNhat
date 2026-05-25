import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import LearnerHeader from '../../../../components/layout/learner/LearnerHeader';

import { LearnerExamService } from '../../../../services/Learner/examService';

import {
    ExamListItemDTO
} from '../../../../interfaces/Learner/Exam';

const JLPTExamListPage: React.FC = () => {

    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);

    const [exams, setExams] = useState<ExamListItemDTO[]>([]);

    useEffect(() => {

        const fetchJLPTExams = async () => {

            setLoading(true);

            try {

                const data = await LearnerExamService.getJLPTExams();

                setExams(data);

            } catch (error) {

                console.error('Lỗi khi tải danh sách JLPT exams:', error);

            } finally {

                setLoading(false);
            }
        };

        fetchJLPTExams();

    }, []);

    const handleViewSummary = (examId: string) => {

        navigate(`${examId}/summary`);
    };

    if (loading) {

        return (
            <div className="flex-1 flex items-center justify-center bg-[#fbf9fa]">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>

                    <p className="text-xs font-black text-[#886373] uppercase tracking-[0.2em]">
                        Đang tải danh sách đề JLPT...
                    </p>
                </div>
            </div>
        );
    }

    return (

        <div className="flex-1 flex flex-col overflow-hidden bg-[#fbf9fa]">

            <LearnerHeader title="JLPT MOCK TEST" />

            <main className="flex-1 overflow-y-auto p-8">

                <div className="max-w-5xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="bg-white rounded-[3rem] border border-[#f4f0f2] shadow-sm overflow-hidden">

                        <div className="p-10 border-b border-[#f4f0f2] bg-[#fbf9fa] flex items-center justify-between">

                            <div>

                                <h2 className="text-3xl font-black text-[#181114] uppercase tracking-tight">
                                    Danh sách đề JLPT
                                </h2>

                                <p className="text-[#886373] font-medium mt-1">
                                    Luyện tập với các đề thi mô phỏng theo cấu trúc JLPT thật
                                </p>

                            </div>

                            <div className="size-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">

                                <span className="material-symbols-outlined text-4xl">
                                    school
                                </span>

                            </div>

                        </div>

                        {/* Exam List */}
                        <div className="p-8 space-y-5">

                            {exams.length > 0 ? (

                                exams.map((exam) => (

                                    <div
                                        key={exam.examID}
                                        className="group bg-[#fbf9fa] border-2 border-[#f4f0f2] rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 hover:border-primary/30 hover:bg-white hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                                    >

                                        {/* Left */}
                                        <div className="flex items-center gap-6">

                                            <div className="size-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center">

                                                <span className="material-symbols-outlined text-4xl">
                                                    menu_book
                                                </span>

                                            </div>

                                            <div>

                                                <div className="flex items-center gap-3 flex-wrap">

                                                    <h3 className="text-xl font-black text-[#181114]">
                                                        {exam.title}
                                                    </h3>

                                                    <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                                        {exam.levelName}
                                                    </span>

                                                </div>

                                                <div className="flex flex-wrap items-center gap-5 mt-3 text-sm text-[#886373] font-medium">

                                                    <span className="flex items-center gap-1">

                                                        <span className="material-symbols-outlined text-sm">
                                                            timer
                                                        </span>

                                                        {exam.duration} phút
                                                    </span>

                                                    <span className="flex items-center gap-1">

                                                        <span className="material-symbols-outlined text-sm">
                                                            quiz
                                                        </span>

                                                        {exam.totalQuestions} câu
                                                    </span>

                                                    <span className="flex items-center gap-1">

                                                        <span className="material-symbols-outlined text-sm">
                                                            emoji_events
                                                        </span>

                                                        Tổng điểm: {exam.totalScore}
                                                    </span>

                                                    <span className="flex items-center gap-1 text-emerald-600 font-bold">

                                                        <span className="material-symbols-outlined text-sm">
                                                            verified
                                                        </span>

                                                        Điểm đậu: {exam.passingScore}
                                                    </span>

                                                </div>

                                            </div>

                                        </div>

                                        {/* Right */}
                                        <div className="flex items-center gap-3">

                                            <button
                                                type="button"
                                                onClick={() => handleViewSummary(exam.examID)}
                                                className="px-6 py-3 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                                            >

                                                Xem chi tiết

                                                <span className="material-symbols-outlined text-sm">
                                                    arrow_forward
                                                </span>

                                            </button>

                                        </div>

                                    </div>
                                ))

                            ) : (

                                <div className="text-center py-20">

                                    <span className="material-symbols-outlined text-6xl text-[#f4f0f2]">
                                        find_in_page
                                    </span>

                                    <p className="text-[#886373] font-bold mt-4">
                                        Hiện chưa có đề JLPT nào.
                                    </p>

                                </div>
                            )}

                        </div>

                    </div>

                </div>

            </main>

        </div>
    );
};

export default JLPTExamListPage;