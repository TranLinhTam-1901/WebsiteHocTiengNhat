import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import { FlashcardService } from '../../../services/Learner/flashcardService';
import { FlashcardItemDTO } from '../../../interfaces/Learner/Flashcard';

const DeckDetailPage: React.FC = () => {
    const { deckID } = useParams<{ deckID: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<FlashcardItemDTO[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'mastered' | 'learning'>('all');

    useEffect(() => {
        const fetchDeckItems = async () => {
            if (!deckID) return;
            setLoading(true);
            try {
                const data = await FlashcardService.getDeckItems(deckID);
                setItems(data);
            } catch (error) {
                console.error("Lỗi khi tải chi tiết bộ thẻ:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDeckItems();
    }, [deckID]);

    const filteredItems = items.filter(item => {
        const matchesSearch = item.kanji?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             item.meaning?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' ? true : 
                             filterStatus === 'mastered' ? item.isMastered : !item.isMastered;
        return matchesSearch && matchesStatus;
    });

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[#fbf9fa]">
            <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[#fbf9fa]">
            <LearnerHeader title="Chi tiết bộ thẻ" />
            
            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => navigate('/learner/flashcards')}
                                className="size-10 rounded-full border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:bg-white transition-all shadow-sm"
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                            <div>
                                <h2 className="text-3xl font-black text-[#181114] uppercase tracking-tight">Danh sách thẻ</h2>
                                <p className="text-[#886373] font-medium mt-1">Quản lý và theo dõi tiến độ các thẻ trong bộ học tập.</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-2xl">
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#886373]">search</span>
                                <input 
                                    type="text" 
                                    placeholder="Tìm kiếm từ vựng, kanji..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-6 py-3 bg-white border border-[#f4f0f2] rounded-2xl font-bold focus:border-primary focus:outline-none transition-all"
                                />
                            </div>
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                className="px-6 py-3 bg-white border border-[#f4f0f2] rounded-2xl font-bold focus:border-primary focus:outline-none transition-all outline-none"
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="mastered">Đã thuộc</option>
                                <option value="learning">Đang học</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-[#f4f0f2] overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#fbf9fa] border-b border-[#f4f0f2]">
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#886373]">Từ gốc / Kanji</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#886373]">Ý nghĩa</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#886373]">SRS (Ngày gặp lại)</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#886373]">Độ dễ (EF)</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#886373]">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#f4f0f2]">
                                    {filteredItems.map((item) => (
                                        <tr key={item.itemID} className="hover:bg-[#fbf9fa]/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <span className="text-2xl font-japanese font-black text-[#181114]">{item.kanji || '-'}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-bold text-[#181114]">{item.meaning || '-'}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-[#181114]">{item.interval} ngày</span>
                                                    <span className="text-[10px] font-bold text-[#886373]">Tiếp theo: {new Date(item.nextReview).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-xs font-bold text-primary">{item.ef.toFixed(2)}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                {item.isMastered ? (
                                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full">Đã thuộc</span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-full">Đang học</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredItems.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center">
                                                <span className="material-symbols-outlined text-4xl text-gray-200 mb-2">inbox</span>
                                                <p className="text-[#886373] font-medium">Không tìm thấy thẻ nào.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DeckDetailPage;
