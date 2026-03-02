import React from 'react';
import { AnswerDTO } from '../../../interfaces/Admin/QuestionBank';

interface Props {
    answers: AnswerDTO[];
    setAnswers: (answers: AnswerDTO[]) => void;
}

const AnswerEditor: React.FC<Props> = ({ answers, setAnswers }) => {
    // Cập nhật nội dung hoặc trạng thái đúng/sai
    const updateAnswer = (index: number, field: keyof AnswerDTO, value: any) => {
        const newAnswers = [...answers];
        if (field === 'isCorrect') {
            // Khi chọn một cái là Đúng, tất cả cái khác thành Sai (Radio logic)
            newAnswers.forEach((ans, i) => ans.isCorrect = i === index);
        } else {
            (newAnswers[index] as any)[field] = value;
        }
        setAnswers(newAnswers);
    };

    // Hàm xóa đáp án
    const removeAnswer = (index: number) => {
        // Không cho phép xóa nếu chỉ còn 2 đáp án (để đảm bảo tính trắc nghiệm)
        if (answers.length <= 2) {
            alert("Một câu hỏi cần tối thiểu 2 đáp án!");
            return;
        }

        const wasCorrect = answers[index].isCorrect;
        const newAnswers = answers.filter((_, i) => i !== index);

        // Nếu xóa trúng đáp án đang được chọn là "Đúng", hãy đặt lại đáp án đầu tiên là "Đúng"
        if (wasCorrect && newAnswers.length > 0) {
            newAnswers[0].isCorrect = true;
        }

        setAnswers(newAnswers);
    };

    return (
        <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontWeight: 'bold', color: '#4A5568' }}>Danh sách đáp án lựa chọn</label>
                <span style={{ fontSize: '12px', color: '#666' }}>Chọn một đáp án đúng nhất</span>
            </div>
            
            {answers.map((ans, index) => (
                <div key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    marginBottom: '12px',
                    padding: '12px 16px',
                    border: ans.isCorrect ? '2px solid #52C41A' : '1px solid #E8E8E8',
                    borderRadius: '12px',
                    backgroundColor: ans.isCorrect ? '#F6FFED' : '#FFFFFF',
                    transition: 'all 0.3s',
                    position: 'relative'
                }}>
                    {/* Radio chọn đáp án đúng */}
                    <input 
                        type="radio" 
                        name="correct-answer"
                        checked={ans.isCorrect} 
                        onChange={() => updateAnswer(index, 'isCorrect', true)}
                        style={{ accentColor: '#52C41A', width: '20px', height: '20px', cursor: 'pointer' }} 
                    />

                    {/* Ô nhập văn bản đáp án */}
                    <input 
                        value={ans.answerText}
                        placeholder={`Nhập nội dung đáp án ${index + 1}...`}
                        onChange={(e) => updateAnswer(index, 'answerText', e.target.value)}
                        style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '15px' }}
                    />

                    {/* Nhãn hiển thị nếu là đáp án đúng */}
                    {ans.isCorrect ? (
                        <span style={{ color: '#52C41A', fontWeight: 'bold', fontSize: '11px', whiteSpace: 'nowrap' }}>
                            ✓ ĐÁP ÁN ĐÚNG
                        </span>
                    ) : (
                        // Nút xóa chỉ hiện ở các đáp án sai
                        <button 
                            type="button"
                            onClick={() => removeAnswer(index)}
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: '#FF4D4F', 
                                cursor: 'pointer', 
                                fontSize: '18px',
                                padding: '0 5px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Xóa đáp án này"
                        >
                            ×
                        </button>
                    )}
                </div>
            ))}
            
            {/* Nút thêm đáp án */}
            <button 
                type="button"
                onClick={() => setAnswers([...answers, { answerText: '', isCorrect: false }])}
                style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px dashed #1890ff', 
                    color: '#1890ff', 
                    background: '#F0F7FF', 
                    borderRadius: '12px', 
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#BAE7FF')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#F0F7FF')}
            >
                + Thêm lựa chọn đáp án
            </button>
        </div>
    );
};

export default AnswerEditor;