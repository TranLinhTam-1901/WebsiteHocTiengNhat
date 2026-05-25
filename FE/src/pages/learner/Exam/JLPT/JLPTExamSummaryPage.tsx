import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import LearnerHeader from '../../../../components/layout/learner/LearnerHeader';

import { LearnerExamService } from '../../../../services/Learner/examService';

import {
    ExamSummaryDTO,
    ExamSectionSummaryDTO
} from '../../../../interfaces/Learner/Exam';
import { Exam_Session_Service } from '../../../../services/Learner/exam_SessionService';

const JLPTExamSummaryPage: React.FC = () => {

    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [exam, setExam] = useState<ExamSummaryDTO | null>(null);

    const [hasSession, setHasSession] = useState(false);

    const [sessionId, setSessionId] = useState<string | null>(null);

    useEffect(() => {

        const fetchExamSummary = async () => {

            if (!id) return;

            setLoading(true);

            try {

                const data = await LearnerExamService.getExamSummary(id);
                try {

                    const session = await Exam_Session_Service.getActiveSession(id);

                    if (session?.hasSession) {
                        setHasSession(true);
                        setSessionId(session.sessionID);
                    } else {
                        setHasSession(false);
                        setSessionId(null);
                    }

                } catch (err) {
                    console.error(err);
                }

                setExam(data);

            } catch (error) {

                console.error('Lỗi khi tải thông tin đề JLPT:', error);

            } finally {

                setLoading(false);
            }
        };

        fetchExamSummary();

    }, [id]);

    const handleStartExam = () => {

        if (!id) return;

        navigate(`/learner/exams/jlpt-exams/${id}/take`);
    };

    const renderSectionIcon = (skillName: string) => {

        switch (skillName.toLowerCase()) {

            case 'vocabulary':
                return 'dictionary';

            case 'grammar':
                return 'translate';

            case 'reading':
                return 'menu_book';

            case 'listening':
                return 'headphones';

            case 'language':
                return 'language';

            default:
                return 'school';
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#fbf9fa]">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-xs font-black text-[#886373] uppercase tracking-[0.2em]">
                        Đang tải thông tin đề thi...
                    </p>
                </div>
            </div>
        );
    }

    if (!exam) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#fbf9fa]">
                <div className="text-center">
                    <span className="material-symbols-outlined text-6xl text-[#f4f0f2]">
                        error
                    </span>

                    <p className="text-[#886373] font-bold mt-4">
                        Không tìm thấy đề thi.
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

                    {/* Header Card */}
                    <div className="bg-white rounded-[3rem] border border-[#f4f0f2] shadow-sm overflow-hidden">

                        <div className="p-10 border-b border-[#f4f0f2] bg-[#fbf9fa] flex items-center justify-between">

                            <div>

                                <p className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-3">
                                    Japanese Language Proficiency Test
                                </p>

                                <h1 className="text-4xl font-black text-[#181114] tracking-tight">
                                    {exam.title}
                                </h1>

                                <p className="text-[#886373] font-medium mt-2">
                                    Xem cấu trúc đề thi và thông tin điểm chuẩn trước khi bắt đầu làm bài
                                </p>
                            </div>

                            <div className="size-20 rounded-4xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                                <span className="material-symbols-outlined text-5xl">
                                    school
                                </span>
                            </div>

                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 p-8">

                            <div className="bg-[#fbf9fa] rounded-3xl border border-[#f4f0f2] p-6">
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#886373] mb-2">
                                    Level
                                </p>

                                <h3 className="text-2xl font-black text-[#181114]">
                                    {exam.levelName}
                                </h3>
                            </div>

                            <div className="bg-[#fbf9fa] rounded-3xl border border-[#f4f0f2] p-6">
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#886373] mb-2">
                                    Thời gian
                                </p>

                                <h3 className="text-2xl font-black text-[#181114]">
                                    {exam.duration} phút
                                </h3>
                            </div>

                            <div className="bg-[#fbf9fa] rounded-3xl border border-[#f4f0f2] p-6">
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#886373] mb-2">
                                    Tổng câu
                                </p>

                                <h3 className="text-2xl font-black text-[#181114]">
                                    {exam.totalQuestions}
                                </h3>
                            </div>

                            <div className="bg-[#fbf9fa] rounded-3xl border border-[#f4f0f2] p-6">
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#886373] mb-2">
                                    Điểm đậu
                                </p>

                                <h3 className="text-2xl font-black text-primary">
                                    {exam.passingScore}
                                </h3>
                            </div>

                        </div>
                    </div>

                    {/* Min Score */}
                    <div className="bg-white rounded-[3rem] border border-[#f4f0f2] shadow-sm overflow-hidden">

                        <div className="p-8 border-b border-[#f4f0f2] bg-[#fbf9fa]">

                            <h2 className="text-2xl font-black text-[#181114]">
                                Điểm liệt từng phần
                            </h2>

                            <p className="text-[#886373] mt-1">
                                Bạn phải đạt tối thiểu số điểm dưới đây ở từng kỹ năng
                            </p>

                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">

                            <div className="rounded-3xl border border-[#f4f0f2] bg-[#fbf9fa] p-6">
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#886373] mb-2">
                                    Language
                                </p>

                                <h3 className="text-4xl font-black text-[#181114]">
                                    {exam.minScores.language}
                                </h3>
                            </div>

                            <div className="rounded-3xl border border-[#f4f0f2] bg-[#fbf9fa] p-6">
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#886373] mb-2">
                                    Reading
                                </p>

                                <h3 className="text-4xl font-black text-[#181114]">
                                    {exam.minScores.reading}
                                </h3>
                            </div>

                            <div className="rounded-3xl border border-[#f4f0f2] bg-[#fbf9fa] p-6">
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#886373] mb-2">
                                    Listening
                                </p>

                                <h3 className="text-4xl font-black text-[#181114]">
                                    {exam.minScores.listening}
                                </h3>
                            </div>

                        </div>
                    </div>

                    {/* Sections */}
                    <div className="bg-white rounded-[3rem] border border-[#f4f0f2] shadow-sm overflow-hidden">

                        <div className="p-8 border-b border-[#f4f0f2] bg-[#fbf9fa]">

                            <h2 className="text-2xl font-black text-[#181114]">
                                Cấu trúc đề thi
                            </h2>

                            <p className="text-[#886373] mt-1">
                                Các phần kỹ năng xuất hiện trong bài thi JLPT
                            </p>

                        </div>

                        <div className="p-8 space-y-4">

                            {exam.sections.map((section: ExamSectionSummaryDTO) => (

                                <div
                                    key={section.skillType}
                                    className="group bg-[#fbf9fa] border-2 border-[#f4f0f2] rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 hover:border-primary/30 hover:bg-white hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                                >

                                    <div className="flex items-center gap-6">

                                        <div className="size-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-4xl">
                                                {renderSectionIcon(section.skillName)}
                                            </span>
                                        </div>

                                        <div>

                                            <h3 className="text-xl font-black text-[#181114]">
                                                {section.skillName}
                                            </h3>

                                            <div className="flex items-center gap-5 mt-2 text-sm text-[#886373] font-medium">

                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">
                                                        quiz
                                                    </span>

                                                    {section.totalQuestions} câu hỏi
                                                </span>

                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">
                                                        emoji_events
                                                    </span>

                                                    {section.totalPoints} điểm
                                                </span>

                                            </div>

                                        </div>

                                    </div>

                                </div>
                            ))}

                        </div>
                    </div>

                    {/* CTA */}
                    <div className="flex justify-end">

                        <button
                            onClick={handleStartExam}
                            className="px-10 py-5 rounded-3xl bg-primary text-white font-black uppercase tracking-wider flex items-center gap-3 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                        >

                            {hasSession ? 'Tiếp tục làm bài' : 'Bắt đầu làm bài'}

                            <span className="material-symbols-outlined">
                                arrow_forward
                            </span>

                        </button>

                    </div>

                </div>

            </main>

        </div>
    );
};

export default JLPTExamSummaryPage;