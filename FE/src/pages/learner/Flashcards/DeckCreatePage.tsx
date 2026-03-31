import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import { FlashcardService } from '../../../services/Learner/flashcardService';
import { SkillType } from '../../../interfaces/Admin/QuestionBank';

const DeckCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedLevel, setSelectedLevel] = useState<string>('');
    const [selectedType, setSelectedType] = useState<SkillType>(SkillType.Vocabulary);
    const [availableCards, setAvailableCards] = useState<any[]>([]);
    const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingCards, setFetchingCards] = useState(false);

    // Giả lập danh sách levels (Thực tế nên lấy từ API)
    const levels = [
        { id: 'n5', name: 'JLPT N5' },
        { id: 'n4', name: 'JLPT N4' },
        { id: 'n3', name: 'JLPT N3' },
        { id: 'n2', name: 'JLPT N2' },
        { id: 'n1', name: 'JLPT N1' },
    ];

    useEffect(() => {
        const fetchAvailableCards = async () => {
            if (!selectedLevel) return;
            setFetchingCards(true);
            try {
                // Giả sử API này trả về danh sách Vocab/Kanji/Grammar tương ứng
                const data = await FlashcardService.getAvailableEntities(selectedLevel, selectedType);
                setAvailableCards(data);
            } catch (error) {
                console.error("Lỗi khi tải danh sách card:", error);
            } finally {
                setFetchingCards(false);
            }
        };
        fetchAvailableCards();
    }, [selectedLevel, selectedType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || selectedCardIds.length === 0) {
            alert("Vui lòng nhập tên bộ thẻ và chọn ít nhất 1 thẻ.");
            return;
        }

        setLoading(true);
        try {
            await FlashcardService.createDeck({ 
                name, 
                description,
                levelId: selectedLevel,
                itemIds: selectedCardIds
            });
            navigate('/learner/flashcards');
        } catch (error) {
            console.error("Lỗi khi tạo bộ thẻ:", error);
            alert("Có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    const toggleCardSelection = (id: string) => {
        setSelectedCardIds(prev => 
            prev.includes(id) ? prev.filter(cardId => cardId !== id) : [...prev, id]
        );
    };

    return (
        <div className="flex flex-col h-full bg-[#fbf9fa]">
            <LearnerHeader title="Tạo bộ thẻ tùy chỉnh" />
            
            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-10 flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/learner/flashcards')}
                            className="size-10 rounded-full border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:bg-white transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div>
                            <h2 className="text-3xl font-black text-[#181114] uppercase tracking-tight">Thiết lập bộ thẻ</h2>
                            <p className="text-[#886373] font-medium mt-1">Tạo kho học tập cá nhân bằng cách chọn từ dữ liệu có sẵn.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cột trái: Thông tin cơ bản */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-[#f4f0f2] shadow-sm space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#886373] ml-2">Tên bộ thẻ *</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="VD: Từ vựng N3 chuyên ngành"
                                        className="w-full px-6 py-4 bg-[#fbf9fa] border-2 border-[#f4f0f2] rounded-2xl font-bold focus:border-primary focus:outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#886373] ml-2">Mô tả</label>
                                    <textarea 
                                        rows={3}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Mô tả ngắn gọn..."
                                        className="w-full px-6 py-4 bg-[#fbf9fa] border-2 border-[#f4f0f2] rounded-2xl font-bold focus:border-primary focus:outline-none transition-all resize-none"
                                    ></textarea>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#886373] ml-2">Trình độ JLPT</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {levels.map(level => (
                                            <button
                                                key={level.id}
                                                type="button"
                                                onClick={() => setSelectedLevel(level.id)}
                                                className={`py-3 rounded-xl text-[10px] font-black transition-all ${
                                                    selectedLevel === level.id
                                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                    : 'bg-[#fbf9fa] text-[#886373] hover:bg-gray-100'
                                                }`}
                                            >
                                                {level.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#886373] ml-2">Loại thẻ học</label>
                                    <div className="flex flex-col gap-2">
                                        {[
                                            { type: SkillType.Vocabulary, name: 'Từ vựng' },
                                            { type: SkillType.Kanji, name: 'Hán tự' },
                                            { type: SkillType.Grammar, name: 'Ngữ pháp' },
                                        ].map(item => (
                                            <button
                                                key={item.type}
                                                type="button"
                                                onClick={() => setSelectedType(item.type)}
                                                className={`py-3 px-6 rounded-xl text-left font-bold transition-all flex items-center justify-between ${
                                                    selectedType === item.type
                                                    ? 'bg-[#181114] text-white'
                                                    : 'bg-[#fbf9fa] text-[#886373] hover:bg-gray-100'
                                                }`}
                                            >
                                                <span>{item.name}</span>
                                                {selectedType === item.type && <span className="material-symbols-outlined text-sm">check_circle</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={loading || !name.trim() || selectedCardIds.length === 0}
                                    className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all ${
                                        loading || !name.trim() || selectedCardIds.length === 0
                                        ? 'bg-gray-100 text-gray-400'
                                        : 'bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02]'
                                    }`}
                                >
                                    {loading ? 'Đang tạo...' : `Tạo với ${selectedCardIds.length} thẻ`}
                                </button>
                            </div>
                        </div>

                        {/* Cột phải: Danh sách chọn card */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-[2.5rem] border border-[#f4f0f2] shadow-sm overflow-hidden flex flex-col h-[700px]">
                                <div className="p-8 border-b border-[#f4f0f2] flex justify-between items-center">
                                    <h3 className="font-black text-[#181114] uppercase tracking-tight">Danh sách dữ liệu sẵn có</h3>
                                    <span className="text-[10px] font-black text-primary uppercase bg-primary/5 px-3 py-1 rounded-full">
                                        Đã chọn {selectedCardIds.length} thẻ
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8">
                                    {!selectedLevel ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                            <span className="material-symbols-outlined text-6xl mb-4">ads_click</span>
                                            <p className="font-bold">Vui lòng chọn trình độ để xem danh sách</p>
                                        </div>
                                    ) : fetchingCards ? (
                                        <div className="h-full flex items-center justify-center">
                                            <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {availableCards.map(card => {
                                                const cardId = card.vocabID || card.kanjiID || card.grammarID;
                                                const isSelected = selectedCardIds.includes(cardId);
                                                return (
                                                    <div 
                                                        key={cardId}
                                                        onClick={() => toggleCardSelection(cardId)}
                                                        className={`p-6 rounded-4xl border-2 cursor-pointer transition-all flex items-center justify-between group ${
                                                            isSelected 
                                                            ? 'border-primary bg-primary/5' 
                                                            : 'border-[#f4f0f2] hover:border-primary/30'
                                                        }`}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="text-2xl font-japanese font-black text-[#181114]">{card.word || card.character || card.title}</span>
                                                            <span className="text-xs font-bold text-[#886373] mt-1 line-clamp-1">{card.meaning}</span>
                                                        </div>
                                                        <div className={`size-8 rounded-full flex items-center justify-center transition-all ${
                                                            isSelected ? 'bg-primary text-white' : 'bg-[#fbf9fa] text-transparent group-hover:text-gray-300'
                                                        }`}>
                                                            <span className="material-symbols-outlined text-lg">check</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default DeckCreatePage;