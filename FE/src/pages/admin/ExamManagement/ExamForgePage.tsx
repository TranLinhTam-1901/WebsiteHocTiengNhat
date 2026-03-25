import React, { useState, useEffect } from 'react';
import ExamService from '../../../services/Admin/examService';
import {  ExamPartConfig, GenerateExamRequest, ExamSummaryResponse } from '../../../interfaces/Admin/Exam'; 
import {ExamType, SkillType,} from '../../../interfaces/Admin/QuestionBank';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

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
            // Lưu ý: Đổi toast chuẩn để hiện thông báo nhé
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
                        // Lưu ý: Dùng summary.totalScore ở đây là ổn vì nó đại diện cho "Tổng cũ"
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
        // Trường hợp: Luyện tập theo bài học VÀ đã có LevelID
        if (formData.type === ExamType.LessonPractice && formData.levelID) {
            try {
                // Sử dụng API mới để lấy bài học kèm stats theo Level
                const lessonsWithStats = await ExamService.getLessonsByLevel(formData.levelID);
                setLessonDataFull(lessonsWithStats); // Lưu data đầy đủ (có SkillStats)
                
                // Đồng thời cập nhật list giản lược cho dropdown nếu cần
                setLessons(lessonsWithStats.map(l => ({ lessonID: l.lessonID, title: l.title })));
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
        lessonID: null, // Reset bài học nếu đang ở chế độ luyện tập
        title: "", // Reset tiêu đề
        duration: 0, // Reset thời gian
        minLanguageKnowledgeScore: 0,
        minReadingScore: 0,
        minListeningScore: 0,
        

    };

    // 2. Cấu hình mặc định dựa trên loại hình mới
    if (newType === ExamType.StandardJLPT) {
        // Nếu chuyển về JLPT và đã có LevelID, tự động fetch lại cấu trúc chuẩn của Level đó
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
    } else if (newType === ExamType.LessonPractice) 
        {
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
            levelID: "", // Bắt buộc chọn lại level để load bài học (đảm bảo dữ liệu sạch)
            duration: 0, 
            parts: practiceParts, 
            passingScore: 0
        }));
        }
        else if (newType === ExamType.SkillPractice) {
            // Khung xương cho kỹ năng (thường là chọn 1 hoặc nhiều kỹ năng cụ thể)
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
                lessonID: null, // Chắc chắn lessonID là null ở đây
                levelID: "", // Bắt buộc chọn lại level để load stats kỹ năng (đảm bảo dữ liệu sạch)
                duration: 0, // Thường luyện kỹ năng có thời gian mặc định ngắn hơn
                parts: skillParts,
                passingScore: 0
                
            }));
        } 
    else {
        
        setFormData(prev => ({ 
            ...prev, 
            ...baseChanges, 
            passingScore: 0,
            duration: 0,
            parts: []
        }));
        setSummary({ totalQuestions: 0, totalScore: 0 }); // Reset bảng tóm tắt ngay lập tức
    }
};


    const handleSave = async () => {
    // 1. Validate dữ liệu theo phong cách trang Question
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
       
       const res = await ExamService.generateExam(formData);
        
        toast.success("🚀 Đã tạo đề thi thành công!");

        setTimeout(() => navigate('/admin/exams'), 1000);
    } catch (error: any) {
        toast.error("Lỗi: " + (error.response?.data?.detail || "Không thể tạo đề"));
    }
};

    return (
        <div className="p-6 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Thiết lập Đề thi & Luyện tập</h1>
                <p className="text-gray-500">Tạo và cấu hình các bộ đề thi JLPT tiêu chuẩn hoặc bài luyện tập cá nhân.</p>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* --- CỘT TRÁI: Cấu hình (8 blocks) --- */}
                <div className="col-span-8 space-y-6">
                    
                    {/* Block 2: Loại hình bài làm (Chuyển đổi giữa 3 View) */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-700 mb-4">Loại hình bài làm</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { id: ExamType.StandardJLPT, label: "Đề thi thử JLPT", icon: "🏆" },
                                { id: ExamType.LessonPractice, label: "Luyện tập theo bài học", icon: "📖" },
                                { id: ExamType.SkillPractice, label: "Luyện tập theo kỹ năng", icon: "⚙️" }
                            ].map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => handleTypeChange(mode.id)}
                                    className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${
                                        formData.type === mode.id 
                                        ? "border-pink-500 bg-pink-50 text-pink-600 shadow-sm" 
                                        : "border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200"
                                    }`}
                                >
                                    <span className="text-xl mb-1">{mode.icon}</span>
                                    <span className="text-sm font-bold">{mode.label}</span>
                                </button>
                            ))}
                        </div>
                    </section>
                    {/* Hiển thị view tương ứng với loại hình bài làm được chọn */}
                    {renderActiveView()}
                </div>

                {/* --- CỘT PHẢI: Summary & Actions (4 blocks) --- */}
                <div className="col-span-4 space-y-6">
                    {/* Bảng tóm tắt màu hồng */}
                    <div className="bg-gradient-to-br from-pink-400 to-pink-500 p-6 rounded-[2rem] text-white shadow-xl shadow-pink-100 relative overflow-hidden">
                        <div className="relative z-10">
                            <h4 className="font-bold mb-4">Bảng tóm tắt</h4>
                            <div className="flex justify-between items-center mb-4">
                                <span className="opacity-80">Tổng số câu hỏi</span>
                                <span className="text-3xl font-black">{summary.totalQuestions}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="opacity-80">Tổng điểm dự kiến</span>
                                <span className="text-3xl font-black">{summary.totalScore}</span>
                            </div>
                        </div>
                        {/* Số 180 mờ ở nền */}
                        <div className="absolute -right-4 -bottom-4 text-9xl font-black opacity-10 italic">180</div>
                    </div>

                   {/* Cấu hình điểm đạt - Hiển thị động dựa trên formData.type */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-700 mb-4 text-sm uppercase">Cấu hình hoàn thành</h3>
                        
                        {formData.type === ExamType.StandardJLPT ? (
                            // GIAO DIỆN CHO ĐỀ THI THỬ (Có điểm liệt)
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 read-only">Điểm đỗ tổng (Passing)</label>
                                    <input 
                                        type="number" disabled
                                        className="w-full mt-1 p-2 bg-gray-50 border-none rounded-xl font-bold text-pink-600"
                                        value={formData.passingScore}
                                        onChange={e => setFormData({...formData, passingScore: Number(e.target.value)})}
                                    />
                                </div>
                                <div className="pt-2 border-t border-gray-50 space-y-3">
                                    <label className="text-xs font-bold text-gray-400 uppercase block">Điểm liệt tối thiểu</label>
                                <div className="grid grid-cols-1 gap-3">
                                        {/* Điểm liệt Kiến thức ngôn ngữ (Chỉ hiện nếu > 0 hoặc tùy cấp độ) */}
                                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl">
                                            <span className="text-xs font-medium text-gray-500">Kiến thức ngôn ngữ</span>
                                            <input 
                                                type="number" disabled
                                                className="w-16 bg-white border border-gray-200 rounded-lg text-center font-bold p-1"
                                                value={formData.minLanguageKnowledgeScore}
                                                onChange={e => setFormData({...formData, minLanguageKnowledgeScore: Number(e.target.value)})}
                                            />
                                        </div>

                                        {/* Điểm liệt Đọc hiểu */}
                                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl">
                                            <span className="text-xs font-medium text-gray-500">Đọc hiểu</span>
                                            <input 
                                                type="number" disabled
                                                className="w-16 bg-white border border-gray-200 rounded-lg text-center font-bold p-1"
                                                value={formData.minReadingScore}
                                                onChange={e => setFormData({...formData, minReadingScore: Number(e.target.value)})}
                                            />
                                        </div>

                                        {/* Điểm liệt Nghe hiểu */}
                                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl">
                                            <span className="text-xs font-medium text-gray-500">Nghe hiểu</span>
                                            <input 
                                                type="number" disabled
                                                className="w-16 bg-white border border-gray-200 rounded-lg text-center font-bold p-1"
                                                value={formData.minListeningScore}
                                                onChange={e => setFormData({...formData, minListeningScore: Number(e.target.value)})}
                                            />
                                        </div>

                                        {/* Mục Hiển thị kết quả ngay lập tức */}
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-transparent hover:border-pink-100 transition-all mt-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-700">Hiển thị đáp án ngay</span>
                                                <span className="text-[10px] text-gray-400 italic">Xem kết quả ngay sau khi nộp bài</span>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    className="sr-only peer"
                                                    checked={formData.showResultImmediately}
                                                    onChange={e => setFormData({...formData, showResultImmediately: e.target.checked})}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                                            </label>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        ) : (
                            // GIAO DIỆN CHO LUYỆN TẬP BÀI HỌC (Đơn giản)
                           <div className="space-y-6">
                                {/* Thông báo chế độ luyện tập */}
                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                    <p className="text-xs text-blue-600 leading-relaxed italic">
                                        💡 Chế độ luyện tập không áp dụng điểm liệt. Thí sinh chỉ cần đạt tổng điểm mục tiêu.
                                    </p>
                                </div>

                                {/* PHẦN CẤU HÌNH ĐIỂM ĐẠT (PASSING SCORE) - ĐÃ TỐI ƯU */}
                                <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 transition-all">
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <label className="text-sm font-bold text-gray-700">Tiêu chuẩn đạt</label>
                                            <span className="text-[10px] text-gray-400 italic">Số câu đúng tối thiểu để vượt qua</span>
                                        </div>
                                        
                                        <div className=" flex items-center gap-2 bg-white px-1.5 py-1.5 rounded-xl border border-gray-200 shadow-sm">
                                            <input 
                                                type="text"
                                                min="0"
                                                max={summary.totalScore}
                                                value={formData.passingScore}
                                                onChange={e => {
                                                    let rawString = e.target.value;
                                                    if (rawString.length > 1 && rawString.startsWith('0'))
                                                    {
                                                        rawString = rawString.replace(/^0+/, '');
                                                    }
                                                    const parsed = parseInt(rawString, 10);
                                                    const finalRaw = isNaN(parsed) ? 0 : parsed;

                                                    const val = Math.min(summary.totalScore, Math.max(0, finalRaw));
                                                    setFormData(prev => ({ ...prev, passingScore: val }));
                                                }}
                                                className="w-12 text-sm font-bold outline-none"
                                            />
                                            <span className="text-xs font-medium text-gray-400 border-l pl-2">
                                                / {summary.totalScore} câu
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="100" 
                                            step="1"
                                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                            value={summary.totalScore > 0 
                                                ? Math.round((formData.passingScore / summary.totalScore) * 100) 
                                                : 0
                                            }
                                            onChange={e => {
                                                const percent = Number(e.target.value);
                                                const score = Math.round((percent / 100) * summary.totalScore);
                                                setFormData(prev => ({ ...prev, passingScore: score }));
                                            }}
                                        />
                                        <div className="min-w-[45px] px-2 py-1  rounded-lg">
                                            <span className="text-xs font-bold ">
                                                {summary.totalScore > 0 
                                                    ? Math.round((formData.passingScore / summary.totalScore) * 100) 
                                                    : 0}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Cấu hình Thời gian làm bài */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        ⏱️ Thời gian làm bài (Phút) 
                                        <span className="text-gray-400 text-[10px] font-normal">(0 nếu không giới hạn)</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 0})}
                                        className="w-full p-3 bg-white border-2 border-gray-100 rounded-2xl focus:border-blue-200 focus:bg-white outline-none transition-all placeholder:text-gray-300 text-sm"
                                        placeholder="Ví dụ: 60"
                                    />
                                </div>

                                {/* Mục Hiển thị kết quả ngay lập tức */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-pink-100 transition-all">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-700">Hiển thị đáp án ngay</span>
                                        <span className="text-[10px] text-gray-400 italic">Xem kết quả ngay sau khi nộp bài</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer"
                                            checked={formData.showResultImmediately}
                                            onChange={e => setFormData({...formData, showResultImmediately: e.target.checked})}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Nút hành động */}
                    <div className="flex gap-4 items-center justify-end pt-4">
                        <button 
                            className="bg-pink-500 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-pink-100 hover:bg-pink-600 transform hover:-translate-y-1 transition-all flex items-center gap-2"
                            onClick={handleSave}
                        >
                            🚀 Lưu & Xuất bản
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamForgePage;


  