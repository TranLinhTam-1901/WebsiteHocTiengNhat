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

    // 1. Fetch danh sách Lessons Lookup một lần duy nhất khi mount
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

    // 2. Fetch Materials khi lessonId hoặc type thay đổi
    useEffect(() => {
        if (!currentLessonId) {
            setMaterials([]);
            return;
        }

        const fetchSource = async () => {
            try {
                setLoading(true);
                setMaterials([]);
                const data = await QuestionService.getSourceMaterials(currentLessonId, type);
                setMaterials(data || []);
            } catch (error) {
                console.error("Lỗi lấy phôi:", error);
                setMaterials([]);
            } finally {
                setLoading(false);
            }
        };
        fetchSource();
    }, [currentLessonId, type]);

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

        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* PHẦN BỘ LỌC (FILTER HEADER) */}
                <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    
                    {/* Lọc theo Trình độ N */}
                    <select 
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #DDD', backgroundColor: '#FFF5F7',
                            boxSizing: 'border-box'
                         }}
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                    >
                        <option value="">-- Tất cả trình độ --</option>
                        {DIFFICULTY_OPTIONS.map(opt => <option key={opt.value} value={opt.label}>{opt.label}</option>)}
                    </select>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        {/* Lọc theo Lesson (đã được lọc theo N ở trên) */}
                        <select 
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #DDD',width: '100%', boxSizing: 'border-box' }}
                            value={currentLessonId}
                            onChange={(e) => handleSelectLesson(e.target.value)}
                        >
                            <option value="">Bài học</option>
                            {lessons
                                .filter(l => !selectedLevel || l.levelName === selectedLevel)
                                .map(l => <option key={l.lessonID} value={l.lessonID}>{l.title}</option>)
                            }
                        </select>

                        {/* Lọc theo Type */}
                        <select 
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #DDD',width: '100%', boxSizing: 'border-box' }}
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            {SOURCE_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                </div>

                {/* PHẦN DANH SÁCH (Duy trì cuộn) */}
               <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loading ? (
                        /* 1. Hiển thị khi đang tải */
                        <p style={{ textAlign: 'center', padding: '20px', color: '#FF6B81' }}>⌛ Đang tải dữ liệu...</p>
                    ) : materials.length > 0 ? (
                        /* 2. Hiển thị khi CÓ dữ liệu (Giữ nguyên cấu trúc cũ của bạn) */
                        materials.map(item => (
                            <div key={item.id} style={{ 
                                background: '#fff', padding: '15px', borderRadius: '12px', 
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #eee', marginBottom: '15px' 
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{item.word || item.character}</span>
                                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: '#e6f7ff', color: '#1890ff' }}>
                                        {type.toUpperCase()}
                                    </span>
                                </div>
                                <div style={{ color: '#666', fontSize: '13px', marginBottom: '10px' }}>{item.meaning}</div>
                                <button 
                                    onClick={() => onPick(item, type)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ff4d4f', color: '#ff4d4f', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    Chọn làm phôi
                                </button>
                            </div>
                        ))
                    ) : (
                        /* 3. Hiển thị khi KHÔNG CÓ dữ liệu (Phần thêm mới để sửa lỗi dính dữ liệu N3) */
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
                            <p style={{ fontSize: '14px' }}>Không có dữ liệu phôi cho mục này.</p>
                            <p style={{ fontSize: '12px', color: '#ccc' }}>Vui lòng chọn bài học khác.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

export default SourcePanel;