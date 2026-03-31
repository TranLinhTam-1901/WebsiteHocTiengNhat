import React, { useState, useEffect } from 'react';
import ExamService from '../../../services/Admin/examService';
import { GenerateExamRequest, ExamSummaryResponse } from '../../../interfaces/Admin/Exam'; 
import { ExamType, SkillType } from '../../../interfaces/Admin/QuestionBank';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../../../components/layout/admin/AdminHeader';

import StandardJLPT from '../../../components/Admin/Exam/StandardJLPT';
import LessonPractice from '../../../components/Admin/Exam/LessonPractice';
import SkillPractice from '../../../components/Admin/Exam/SkillPractice';

const ExamForgePage: React.FC = () => {
    const navigate = useNavigate();
    // State lưu trữ dữ liệu form - Khớp 100% với GenerateExamRequest
    const [formData, setFormData] = useState<GenerateExamRequest>({
        title: "",
        duration: 0,
        levelID: "",
        type: ExamType.StandardJLPT, 
        lessonID: null,
        showResultImmediately: false,
        passingScore: 95,
        minLanguageKnowledgeScore: 19,
        minReadingScore: 19,
        minListeningScore: 19,
        parts: [] // Mảng các ExamPartConfig
    });
    const [levels, setLevels] = useState<{ levelID: string, levelName: string }[]>([]);
    const [summary, setSummary] = useState<ExamSummaryResponse>({ totalQuestions: 0, totalScore: 0 });
    const [lessons, setLessons] = useState<{ lessonID: string, title: string }[]>([]);
    const [lessonDataFull, setLessonDataFull] = useState<any[]>([]);

    useEffect(() => {
        const fetchLevels = async () => {
            try {
                const data = await ExamService.getLevelsLookup();
                setLevels(data);
            } catch (error) {
                console.error("Lỗi load levels:", error);
            }
        };
        fetchLevels();
    }, []);

    // Xử lý khi đổi Level -> Gọi API lấy cấu trúc chuẩn (View 1)
    const handleLevelChange = async (levelId: string) => {
        try {
            // TRƯỜNG HỢP 1: LEVEL ID RỖNG (Người dùng chọn "Chọn cấp độ")
            if (!levelId) {
                setFormData(prev => ({ 
                    ...prev, 
                    levelID: "", 
                    lessonID: null, 
                    title: "",
                    duration: 0,
                    parts: [],             
                }));
                return; 
            }
            // Cập nhật LevelID trước cho toàn bộ Form
            setFormData(prev => ({ ...prev, levelID: levelId, lessonID : null, title: "" }));

            // Nếu là chế độ JLPT Tiêu chuẩn -> Mới gọi Template cấu trúc đề
            if (formData.type === ExamType.StandardJLPT) {
                const template = await ExamService.getStandardTemplate(levelId);
                setFormData(prev => ({
                    ...prev,
                    title: template.title,
                    duration: template.duration,
                    parts: template.details,
                    passingScore: template.passingScore, 
                    minLanguageKnowledgeScore: template.minLanguageKnowledgeScore,
                    minReadingScore: template.minReadingScore,
                    minListeningScore: template.minListeningScore
                }));
            }
        } catch (error) {
            console.error("Lỗi chi tiết:", error);
            toast.error("Lỗi khi cập nhật trình độ");
        }
    };

    const [levelStats, setLevelStats] = useState<any[]>([]);

    const handleSkillLevelChange = async (levelId: string) => {
        setFormData(prev => ({ ...prev, levelID: levelId, parts: [] })); // Reset parts khi đổi level

        if (!levelId) {
            setLevelStats([]); // Xóa stats cũ
            return;
        }
        try {
            // Gọi API stats-by-skill của bạn
            const stats = await ExamService.getStatsBySkill(levelId); 
            setLevelStats(stats);
        } catch (error) {
            toast.error("Không thể tải thống kê kỹ năng");
        }
    };

    // Theo dõi thay đổi của 'parts' để cập nhật bảng Tóm tắt (Summary)
    useEffect(() => {
        if (formData.parts.length > 0) {
            ExamService.getExamSummary(formData.parts).then((res) => {
                const newTotalScore = Math.round(res.totalScore);
                
                // 1. Cập nhật summary để hiển thị bảng hồng
                setSummary({
                    totalQuestions: res.totalQuestions,
                    totalScore: newTotalScore
                });

                // 2. Cập nhật passingScore cho các chế độ Luyện tập
                if (formData.type !== ExamType.StandardJLPT) {
                    setFormData(prev => {
                        let updatedPassingScore = prev.passingScore;

                        // KIỂM TRA QUAN TRỌNG: 
                        // Nếu là câu đầu tiên (tổng điểm cũ đang là 0) hoặc chưa có điểm đạt
                        if (summary.totalScore === 0 || prev.passingScore === 0) {
                            // Cho nhảy thẳng lên 100% mục tiêu cho câu đầu
                            updatedPassingScore = newTotalScore;
                        } 
                        else {
                            // Nếu đã có dữ liệu trước đó, dùng newTotalScore để tính theo tỉ lệ cũ
                            const ratio = prev.passingScore / summary.totalScore;
                            updatedPassingScore = Math.round(newTotalScore * ratio);
                        }

                        return {
                            ...prev,
                            passingScore: updatedPassingScore
                        };
                    });
                }
            });
        } else {
            setSummary({ totalQuestions: 0, totalScore: 0 });
        }
    }, [formData.parts]);

    // Theo dõi 'type' để load dữ liệu bổ sung (Ví dụ View 2 cần list bài học)
    useEffect(() => {
       const loadExtraData = async () => {
            if (formData.type === ExamType.LessonPractice && formData.levelID) {
                try {
                    const lessonsWithStats = await ExamService.getLessonsByLevel(formData.levelID);
                    setLessonDataFull(lessonsWithStats); // Lưu data đầy đủ (có SkillStats)
                    setLessons(lessonsWithStats.map((l: any) => ({ lessonID: l.lessonID, title: l.title })));
                } catch (error) {
                    toast.error("Lỗi khi tải danh sách bài học theo trình độ");
                }
            }
        };
        loadExtraData();
    }, [formData.type, formData.levelID]);

    // Hàm render view động
    const renderActiveView = () => {
        const commonProps = { data: formData, onChange: setFormData, levels: levels,
        levelStats: levelStats };
        
        switch (formData.type) {
            case ExamType.StandardJLPT:
                return <StandardJLPT {...commonProps} levels={levels} onLevelChange={handleLevelChange} />;
            case ExamType.LessonPractice:
                return <LessonPractice {...commonProps} levels={levels} lessons={lessons} lessonDataFull={lessonDataFull} onLevelChange={handleLevelChange}/>;
             case ExamType.SkillPractice:
                return <SkillPractice {...commonProps} onLevelChange={handleSkillLevelChange} />;
            default:
                return null;
        }
    };

    const handleTypeChange = async (newType: ExamType) => {
        // 1. Reset các thông số cơ bản để tránh "dính" dữ liệu giữa các Tab
        const baseChanges: Partial<GenerateExamRequest> = {
            type: newType,
            lessonID: null,
            title: "",
            duration: 0,
            minLanguageKnowledgeScore: 0,
            minReadingScore: 0,
            minListeningScore: 0,
        };

        // 2. Cấu hình mặc định dựa trên loại hình mới
        if (newType === ExamType.StandardJLPT) {
            if (formData.levelID) {
                try {
                    const template = await ExamService.getStandardTemplate(formData.levelID);
                    setFormData(prev => ({
                        ...prev,
                        ...baseChanges,
                        title: template.title,
                        duration: template.duration,
                        parts: template.details,
                        passingScore: template.passingScore,
                        minLanguageKnowledgeScore: template.minLanguageKnowledgeScore,
                        minReadingScore: template.minReadingScore,
                        minListeningScore: template.minListeningScore
                    }));
                } catch (error) {
                    toast.error("Không thể tải cấu trúc đề thi chuẩn");
                }
            } else {
                setFormData(prev => ({ ...prev, ...baseChanges, passingScore: 95 }));
            }
        } else if (newType === ExamType.LessonPractice) {
            const practiceParts = [
                { skillType: SkillType.Vocabulary, quantity: 0, pointPerQuestion: 1 },
                { skillType: SkillType.Grammar, quantity: 0, pointPerQuestion: 1 },
                { skillType: SkillType.Kanji, quantity: 0, pointPerQuestion: 1 },
                { skillType: SkillType.Reading, quantity: 0, pointPerQuestion: 1 },
                { skillType: SkillType.Listening, quantity: 0, pointPerQuestion: 1 }
            ];

            setFormData(prev => ({
                ...prev,
                ...baseChanges,
                levelID: "",
                duration: 0, 
                parts: practiceParts, 
                passingScore: 0
            }));
        } else if (newType === ExamType.SkillPractice) {
            const skillParts = [
                { skillType: SkillType.Vocabulary, quantity: 0, pointPerQuestion: 1 },
                { skillType: SkillType.Grammar, quantity: 0, pointPerQuestion: 1 },
                { skillType: SkillType.Kanji, quantity: 0, pointPerQuestion: 1 },
                { skillType: SkillType.Reading, quantity: 0, pointPerQuestion: 1 },
                { skillType: SkillType.Listening, quantity: 0, pointPerQuestion: 1 }
            ];

            setFormData(prev => ({
                ...prev,
                ...baseChanges,
                lessonID: null,
                levelID: "",
                duration: 0,
                parts: skillParts,
                passingScore: 0
            }));
        } else {
            setFormData(prev => ({ 
                ...prev, 
                ...baseChanges, 
                passingScore: 0,
                duration: 0,
                parts: []
            }));
            setSummary({ totalQuestions: 0, totalScore: 0 });
        }
    };

    const handleSave = async () => {
        if (!formData.levelID) {
            toast.error("Vui lòng chọn trình độ (Level) trước khi tạo đề!");
            return;
        }

        if (!formData.title.trim()) {
            toast.error("Vui lòng nhập tiêu đề cho bộ đề thi!");
            return;
        }

        if (formData.parts.length === 0 || summary.totalQuestions === 0) {
            toast.error("Cấu trúc đề thi hiện chưa có câu hỏi nào. Vui lòng cấu hình các phần thi!");
            return;
        }

        try {
            await ExamService.generateExam(formData);
            toast.success("🚀 Đã tạo đề thi thành công!");
            setTimeout(() => navigate('/admin/exams'), 1000);
        } catch (error: any) {
            toast.error("Lỗi: " + (error.response?.data?.detail || "Không thể tạo đề"));
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-light font-display text-[#181114]">
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* --- Header --- */}
                <AdminHeader>
                    <div className="flex items-center w-full gap-257.5">
                        <div className="flex items-center gap-4 flex-1">
                            <button onClick={() => navigate(-1)} className="size-10 rounded-full border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:bg-[#f4f0f2] transition-colors active:scale-90">
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                            <div className="flex flex-col">
                                <h2 className="text-xl font-bold text-[#181114] uppercase">Thiết lập Đề thi</h2>
                                <nav className="flex text-[10px] text-[#886373] font-medium gap-1 uppercase tracking-wider">
                                    <span>Quản lý</span> / <span className="text-primary font-bold">Tạo mới đề thi</span>
                                </nav>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleSave} className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95">
                                <span className="material-symbols-outlined text-sm">save</span> Lưu Đề Thi
                            </button>
                        </div>
                    </div>
                </AdminHeader>

                {/* --- Form Body --- */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* --- CỘT TRÁI: Main Config (2/3) --- */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Loại hình bài làm */}
                            <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm p-8">
                                <h3 className="text-base font-bold mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">assignment</span>
                                    Loại hình bài làm
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { id: ExamType.StandardJLPT, label: "Đề thi thử JLPT", icon: "🏆" },
                                        { id: ExamType.LessonPractice, label: "Luyện tập theo bài học", icon: "📖" },
                                        { id: ExamType.SkillPractice, label: "Luyện tập theo kỹ năng", icon: "⚙️" }
                                    ].map((mode) => (
                                        <button
                                            key={mode.id}
                                            type="button"
                                            onClick={() => handleTypeChange(mode.id)}
                                            className={`flex flex-col items-center p-5 rounded-2xl border transition-all ${
                                                formData.type === mode.id 
                                                ? "border-primary bg-primary/5 text-primary ring-1 ring-primary shadow-sm" 
                                                : "border-[#f4f0f2] bg-[#fbf9fa] text-[#886373] hover:border-primary/30"
                                            }`}
                                        >
                                            <span className="text-2xl mb-2">{mode.icon}</span>
                                            <span className="text-xs font-bold uppercase tracking-wider">{mode.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dynamic Views */}
                            {renderActiveView()}
                        </div>

                        {/* --- CỘT PHẢI: Summary & Extra Config (1/3) --- */}
                        <div className="space-y-6">
                            {/* Bảng tóm tắt (Modern Card) */}
                            <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-[#f4f0f2] bg-[#fbf9fa]">
                                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#886373]">Tóm tắt cấu hình đề</h4>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                                <span className="material-symbols-outlined text-primary">quiz</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-[#886373] uppercase tracking-wider">Tổng số câu</p>
                                                <p className="text-2xl font-black text-primary leading-none mt-1">{summary.totalQuestions}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-primary/60 uppercase">Câu hỏi</span>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                                <span className="material-symbols-outlined text-emerald-600">military_tech</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-[#886373] uppercase tracking-wider">Tổng điểm tối đa</p>
                                                <p className="text-2xl font-black text-emerald-600 leading-none mt-1">{summary.totalScore}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-emerald-600/60 uppercase">Điểm</span>
                                    </div>
                                </div>
                                <div className="px-8 pb-8">
                                    <div className="flex items-center gap-2 p-3 bg-[#fbf9fa] rounded-xl border border-[#f4f0f2]">
                                        <span className="material-symbols-outlined text-sm text-[#886373]">info</span>
                                        <p className="text-[10px] font-medium text-[#886373]">Hệ thống sẽ bốc câu hỏi từ ngân hàng dựa trên cấu hình.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Cấu hình hoàn thành */}
                            <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm p-8 space-y-6">
                                <h3 className="text-sm font-bold text-[#886373] uppercase tracking-wider mb-2">Cấu hình hoàn thành</h3>
                                
                                {formData.type === ExamType.StandardJLPT ? (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-bold text-[#886373] uppercase tracking-wider">Điểm đỗ tổng (Passing)</label>
                                            <div className="w-full px-4 py-3 bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl text-lg font-bold text-primary">
                                                {formData.passingScore}
                                            </div>
                                        </div>
                                        
                                        <div className="pt-4 border-t border-[#f4f0f2] space-y-4">
                                            <label className="block text-[10px] font-bold text-[#886373] uppercase tracking-wider">Điểm liệt tối thiểu</label>
                                            {[
                                                { label: "Kiến thức ngôn ngữ", value: formData.minLanguageKnowledgeScore },
                                                { label: "Đọc hiểu", value: formData.minReadingScore },
                                                { label: "Nghe hiểu", value: formData.minListeningScore }
                                            ].map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-[#fbf9fa] p-3 rounded-xl border border-[#f4f0f2]">
                                                    <span className="text-xs font-medium text-[#886373]">{item.label}</span>
                                                    <span className="px-3 py-1 bg-white border border-[#f4f0f2] rounded-lg font-bold text-sm min-w-10 text-center">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="p-4 bg-sky-50 rounded-xl border border-sky-100">
                                            <p className="text-[11px] text-sky-600 leading-relaxed italic">
                                                💡 Chế độ luyện tập không áp dụng điểm liệt. Chỉ cần đạt tổng điểm mục tiêu.
                                            </p>
                                        </div>

                                        <div className="space-y-4 p-5 bg-[#fbf9fa] rounded-2xl border border-[#f4f0f2]">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-bold text-[#181114]">Tiêu chuẩn đạt</label>
                                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#f4f0f2] shadow-sm">
                                                    <input 
                                                        type="number"
                                                        value={formData.passingScore}
                                                        onChange={e => {
                                                            const val = Math.min(summary.totalScore, Math.max(0, parseInt(e.target.value) || 0));
                                                            setFormData(prev => ({ ...prev, passingScore: val }));
                                                        }}
                                                        className="w-10 text-sm font-bold text-primary outline-none"
                                                    />
                                                    <span className="text-[10px] font-bold text-[#886373]/60 border-l pl-2">/ {summary.totalScore}</span>
                                                </div>
                                            </div>

                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="100" 
                                                className="w-full h-1.5 bg-[#f4f0f2] rounded-lg appearance-none cursor-pointer accent-primary"
                                                value={summary.totalScore > 0 ? (formData.passingScore / summary.totalScore) * 100 : 0}
                                                onChange={e => {
                                                    const score = Math.round((parseInt(e.target.value) / 100) * summary.totalScore);
                                                    setFormData(prev => ({ ...prev, passingScore: score }));
                                                }}
                                            />
                                            <div className="text-center">
                                                <span className="text-[11px] font-black text-primary uppercase">Mục tiêu: {summary.totalScore > 0 ? Math.round((formData.passingScore / summary.totalScore) * 100) : 0}%</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-bold text-[#886373] uppercase tracking-wider">Thời gian làm bài (Phút)</label>
                                            <input
                                                type="number"
                                                value={formData.duration}
                                                onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 0})}
                                                className="w-full px-4 py-3 bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl text-sm font-bold outline-none focus:border-primary transition-all"
                                                placeholder="0: Không giới hạn"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Hiển thị đáp án ngay */}
                                <div className="flex items-center justify-between p-4 bg-[#fbf9fa] rounded-2xl border border-[#f4f0f2]">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-[#181114]">Hiển thị đáp án ngay</span>
                                        <span className="text-[9px] text-[#886373] uppercase tracking-tighter">Kết quả sau khi nộp</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({...formData, showResultImmediately: !formData.showResultImmediately})}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                            formData.showResultImmediately ? "bg-primary" : "bg-gray-200"
                                        }`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                            formData.showResultImmediately ? "translate-x-6" : "translate-x-1"
                                        }`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ExamForgePage;