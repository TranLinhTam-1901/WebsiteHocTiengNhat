import React, { useEffect, useState } from 'react';
import QuestionService from '../../../services/Admin/QuestionService';
import { LessonLookupDTO, SourceMaterial } from '../../../interfaces/Admin/QuestionBank';
import { SOURCE_TYPE_OPTIONS, DIFFICULTY_OPTIONS } from '../../../constants/admin/questionOptions';

interface Props {
    // Page sẽ truyền hàm này vào để nhận dữ liệu khi Admin bấm "Select"
    onPick: (item: SourceMaterial, type: string) => void;
    // Page sẽ truyền hàm này vào để đồng bộ difficulty khi Lesson thay đổi
    onLessonChange: (lessonID: string, levelName: string) => void;
    // lessonId hiện tại từ Page (để đồng bộ nếu Page thay đổi)
    currentLessonId: string;
}

const SourcePanel: React.FC<Props> = ({ onPick, onLessonChange, currentLessonId }) => {
    // --- State cho Dữ liệu ---
    const [lessons, setLessons] = useState<LessonLookupDTO[]>([]);
    const [materials, setMaterials] = useState<SourceMaterial[]>([]);
    
    // --- State cho Bộ lọc ---
    const [selectedLevel, setSelectedLevel] = useState<string>(""); // Lọc N5, N4, N3
    const [type, setType] = useState('Vocabulary');
    const [loading, setLoading] = useState(false);

    // Fetch danh sách Lessons Lookup một lần duy nhất khi mount
    useEffect(() => {
        const fetchLessons = async () => {
            try {
                const data = await QuestionService.getLessonsLookup();
                setLessons(data);
            } catch (error) {
                console.error("Lỗi load lessons:", error);
            }
        };
        fetchLessons();
    }, []);

    // Fetch Materials khi lessonId hoặc type thay đổi
    useEffect(() => {
    const fetchSource = async () => {
        try {
            setLoading(true);
            setMaterials([]);
            const data = await QuestionService.getSourceMaterials(currentLessonId || "",
                    type,
                    selectedLevel || "");
            setMaterials(data || []);
        } catch (error) {
            console.error("Lỗi lấy phôi:", error);
            setMaterials([]);
        } finally {
            setLoading(false);
        }
    };
    fetchSource();
    }, [currentLessonId, type, selectedLevel]);

    useEffect(() => {
    //kiểm tra xem bài học hiện tại có nằm trong danh sách bài học của Level mới không
    const isCurrentLessonInLevel = lessons.some(
        l => l.lessonID === currentLessonId && l.levelName === selectedLevel
    );

    if (!isCurrentLessonInLevel && selectedLevel !== "") {
        // Nếu bài học cũ không thuộc Level mới, reset lessonId về rỗng
        onLessonChange("", ""); 
    }
        }, [selectedLevel]);
        
    // 3. Hàm xử lý khi thay đổi bài học
    const handleSelectLesson = (id: string) => {
        const lesson = lessons.find(l => l.lessonID === id);
        onLessonChange(id, lesson?.levelName || "");
    };

    const VIEW2_SOURCE_TYPES = SOURCE_TYPE_OPTIONS.filter(opt => 
        ['Vocabulary', 'Kanji', 'Grammar'].includes(opt.value));
        return (
            <div className="flex flex-col h-full min-h-0 overflow-hidden">
                {/* PHẦN BỘ LỌC (FILTER HEADER) */}
                <div className="mb-5 flex flex-col gap-2 shrink-0">
                    
                    {/* Lọc theo Trình độ N */}
                    <select 
                        className="w-full p-2.5 rounded-lg border border-[#DDD] bg-[#FFF5F7] box-border min-h-0 outline-none focus:border-[#FF6B81]"
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                    >
                        <option value="">-- Tất cả trình độ --</option>
                        {DIFFICULTY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.label}>{opt.label}</option>
                        ))}
                    </select>

                    <div className="flex gap-2">
                        {/* Lọc theo Lesson */}
                        <select 
                            className="flex-1 p-2.5 rounded-lg border border-[#DDD] w-full box-border outline-none focus:border-[#FF6B81]"
                            value={currentLessonId}
                            onChange={(e) => handleSelectLesson(e.target.value)}
                        >
                            <option value="">-- Bài học --</option>
                            {lessons
                                .filter(l => !selectedLevel || l.levelName === selectedLevel)
                                .map(l => (
                                    <option key={l.lessonID} value={l.lessonID}>
                                        {l.title}
                                    </option>
                                ))
                            }
                        </select>

                        {/* Lọc theo Type */}
                        <select 
                            className="flex-1 p-2.5 rounded-lg border border-[#DDD] w-full box-border outline-none focus:border-[#FF6B81]"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            {VIEW2_SOURCE_TYPES.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* PHẦN DANH SÁCH (Duy trì cuộn) */}
                <div className="flex-1 overflow-y-auto min-h-0 pr-[5px] pb-5 scrollbar-thin">
                    {loading ? (
                        /* 1. Hiển thị khi đang tải */
                        <p className="text-center px-[15px] text-[#FF6B81] min-h-0 font-medium">
                            ⌛ Đang tải dữ liệu...
                        </p>
                    ) : materials.length > 0 ? (
                        /* 2. Hiển thị khi CÓ dữ liệu */
                        materials.map(item => (
                            <div key={item.id} className="bg-white p-[15px] rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.05)] border border-[#eee] mb-[15px] transition-hover hover:shadow-md">
                                <div className="flex justify-between mb-1.5">
                                    <span className="font-bold text-base text-[#2D3748]">
                                        {item.word || item.character || item.structure || "N/A"}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#e6f7ff] text-[#1890ff] font-bold uppercase">
                                        {type.toUpperCase()}
                                    </span>
                                </div>
                                <div className="text-[#666] text-[13px] mb-2.5 line-clamp-2">
                                    {item.meaning}
                                </div>
                                <button 
                                    onClick={() => onPick(item, type)}
                                    className="w-full p-2 rounded-lg border border-[#ff4d4f] text-[#ff4d4f] bg-transparent cursor-pointer font-bold transition-colors hover:bg-[#ff4d4f] hover:text-white"
                                >
                                    Chọn làm phôi
                                </button>
                            </div>
                        ))
                    ) : (
                        /* 3. Hiển thị khi KHÔNG CÓ dữ liệu */
                        <div className="text-center py-10 px-5 text-[#999]">
                            <div className="text-4xl mb-2.5">📭</div>
                            <p className="text-sm font-medium">Không có dữ liệu phôi cho mục này.</p>
                            <p className="text-xs text-[#ccc]">Vui lòng chọn bài học khác.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

export default SourcePanel;