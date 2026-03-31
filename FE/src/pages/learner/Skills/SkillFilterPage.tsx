import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LearnerHeader from '../../../components/layout/learner/LearnerHeader';
import { SkillType } from '../../../interfaces/Admin/QuestionBank';
import { SkillPracticeService } from '../../../services/Learner/skillPracticeService';
import { SkillPracticeDTO } from '../../../interfaces/Learner/SkillPractice';

const SkillSelectionPage: React.FC = () => {
    const { skillType } = useParams<{ skillType: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [metadata, setMetadata] = useState<any>({
        levels: [],
        topics: [],
        wordTypes: [],
        grammarGroups: [],
        radicals: []
    });

    const [filters, setFilters] = useState<SkillPracticeDTO>({
        levelId: null,
        topicIds: [],
        lessonIds: [],
        wordTypeIds: [],
        grammarGroupIds: [],
        radicalIds: [],
        grammarType: 0,
        formality: 0,
        limit: 10
    });

    // Dropdown states
    const [openMenu, setOpenFilter] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const skillEnumMap: Record<string, SkillType> = {
        "vocabulary": SkillType.Vocabulary,
        "grammar": SkillType.Grammar,
        "kanji": SkillType.Kanji,
        "reading": SkillType.Reading,
        "listening": SkillType.Listening
    };

    const currentSkill = skillEnumMap[skillType || ""] || SkillType.General;

    useEffect(() => {
        const fetchMetadata = async () => {
            setLoading(true);
            try {
                const [levels, topics, wordTypes, grammarGroups, radicals] = await Promise.all([
                    SkillPracticeService.getLevels(),
                    SkillPracticeService.getTopics(),
                    SkillPracticeService.getWordTypes(),
                    SkillPracticeService.getGrammarGroups(),
                    SkillPracticeService.getRadicals()
                ]);
                
                setMetadata({
                    levels,
                    topics,
                    wordTypes,
                    grammarGroups,
                    radicals
                });
            } catch (error) {
                console.error("Lỗi khi tải metadata:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMetadata();
    }, []);

    const handleStart = () => {
        if (!filters.levelId) {
            alert("Vui lòng chọn trình độ mục tiêu!");
            return;
        }
        sessionStorage.setItem('current_skill_filters', JSON.stringify({
            skillType: currentSkill,
            filters
        }));
        navigate(`/learner/skill-learning/${skillType}/practice`);
    };

    const SearchableDropdown = ({ label, options, selected, onSelect, fieldId, multiple = false, placeholder = "Tìm kiếm..." }: any) => {
        const isOpen = openMenu === fieldId;
        const filteredOptions = options?.filter((opt: any) => 
            (opt.name || opt.character || opt.levelName || "").toLowerCase().includes(searchTerm.toLowerCase())
        ) || [];

        const isSelected = (id: any) => multiple ? selected.includes(id) : selected === id;

        const handleToggle = (id: any) => {
            if (multiple) {
                onSelect(selected.includes(id) ? selected.filter((x: any) => x !== id) : [...selected, id]);
            } else {
                onSelect(id);
                setOpenFilter(null);
            }
        };

        const getSelectedLabel = () => {
            if (multiple) {
                return selected.length > 0 ? `${selected.length} đã chọn` : "Tất cả";
            }
            const found = options?.find((o: any) => o.id === selected || o.levelID === selected);
            return found ? (found.name || found.character || found.levelName) : "Chưa chọn";
        };

        return (
            <div className="space-y-3">
                <label className="block text-[10px] font-black text-[#886373] uppercase tracking-[0.2em] ml-2">{label}</label>
                <div className="relative">
                    <button
                        onClick={() => {
                            setOpenFilter(isOpen ? null : fieldId);
                            setSearchTerm("");
                        }}
                        className={`w-full bg-[#fbf9fa] border-2 border-[#f4f0f2] rounded-2xl px-6 py-4 text-sm flex items-center justify-between hover:border-primary/30 transition-all outline-none ${isOpen ? 'ring-4 ring-primary/5 border-primary shadow-sm' : ''}`}
                    >
                        <span className={`font-bold ${selected && (multiple ? selected.length > 0 : true) ? "text-[#181114]" : "text-[#886373]/40"}`}>
                            {getSelectedLabel()}
                        </span>
                        <span className={`material-symbols-outlined text-[#886373] transition-transform ${isOpen ? "rotate-180" : ""}`}>expand_more</span>
                    </button>

                    {isOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenFilter(null)} />
                            <div className="absolute left-0 right-0 mt-3 bg-white border-2 border-[#f4f0f2] rounded-4xl shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="p-4 border-b border-[#f4f0f2] bg-[#fbf9fa]">
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-[#886373]">search</span>
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder={placeholder}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-white border border-[#f4f0f2] rounded-xl pl-11 pr-4 py-2.5 text-sm focus:border-primary outline-none transition-all font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="max-h-64 overflow-y-auto custom-scrollbar p-2">
                                    {filteredOptions.map((opt: any) => (
                                        <button
                                            key={opt.id || opt.levelID}
                                            onClick={() => handleToggle(opt.id || opt.levelID)}
                                            className={`w-full text-left px-5 py-3.5 text-sm rounded-2xl flex items-center justify-between transition-all mb-1 ${isSelected(opt.id || opt.levelID) ? 'bg-primary/10 text-primary font-black' : 'hover:bg-primary/5 hover:text-primary text-[#181114] font-bold'}`}
                                        >
                                            <span className="flex items-center gap-3">
                                                {opt.character && <span className="text-xl font-japanese">{opt.character}</span>}
                                                {opt.name || opt.levelName}
                                            </span>
                                            {isSelected(opt.id || opt.levelID) && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
                                        </button>
                                    ))}
                                    {filteredOptions.length === 0 && <div className="p-6 text-center text-xs text-[#886373] italic font-medium">Không tìm thấy kết quả</div>}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center bg-[#fbf9fa]">
            <div className="flex flex-col items-center gap-4">
                <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-xs font-black text-[#886373] uppercase tracking-[0.2em]">Đang chuẩn bị lộ trình...</p>
            </div>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#fbf9fa]">
            <LearnerHeader title={`Cấu hình luyện tập ${skillType}`} />
            
            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="bg-white rounded-[3rem] border border-[#f4f0f2] shadow-sm overflow-hidden">
                        <div className="p-10 border-b border-[#f4f0f2] bg-[#fbf9fa] flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-black text-[#181114] uppercase tracking-tight">Tùy chỉnh nội dung</h2>
                                <p className="text-[#886373] font-medium mt-1">Chọn cấp độ và nội dung bạn muốn luyện tập</p>
                            </div>
                            <div className="size-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                                <span className="material-symbols-outlined text-4xl">tune</span>
                            </div>
                        </div>

                        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                            <SearchableDropdown 
                                label="Trình độ mục tiêu" 
                                fieldId="level"
                                options={metadata.levels}
                                selected={filters.levelId}
                                onSelect={(val: string) => setFilters({...filters, levelId: val})}
                                placeholder="Chọn N5, N4, N3..."
                            />

                            <SearchableDropdown 
                                label="Chủ đề quan tâm" 
                                fieldId="topics"
                                multiple
                                options={metadata.topics}
                                selected={filters.topicIds}
                                onSelect={(val: string[]) => setFilters({...filters, topicIds: val})}
                                placeholder="Tìm kiếm chủ đề..."
                            />

                            {currentSkill === SkillType.Vocabulary && (
                                <SearchableDropdown 
                                    label="Phân loại từ" 
                                    fieldId="wordTypes"
                                    multiple
                                    options={metadata.wordTypes}
                                    selected={filters.wordTypeIds}
                                    onSelect={(val: string[]) => setFilters({...filters, wordTypeIds: val})}
                                    placeholder="Danh từ, Động từ..."
                                />
                            )}

                            {currentSkill === SkillType.Grammar && (
                                <>
                                    <SearchableDropdown 
                                        label="Nhóm ngữ pháp" 
                                        fieldId="grammarGroups"
                                        multiple
                                        options={metadata.grammarGroups}
                                        selected={filters.grammarGroupIds}
                                        onSelect={(val: string[]) => setFilters({...filters, grammarGroupIds: val})}
                                        placeholder="Phân nhóm..."
                                    />
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-[#886373] uppercase tracking-[0.2em] ml-2">Độ trang trọng</label>
                                        <select 
                                            value={filters.formality}
                                            onChange={(e) => setFilters({...filters, formality: parseInt(e.target.value)})}
                                            className="w-full bg-[#fbf9fa] border-2 border-[#f4f0f2] rounded-2xl px-6 py-4 text-sm font-bold focus:border-primary outline-none transition-all"
                                        >
                                            <option value={0}>Mọi mức độ</option>
                                            <option value={1}>Thân mật (Plain)</option>
                                            <option value={2}>Lịch sự (Polite)</option>
                                            <option value={3}>Kính ngữ (Keigo)</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {currentSkill === SkillType.Kanji && (
                                <SearchableDropdown 
                                    label="Bộ thủ liên quan" 
                                    fieldId="radicals"
                                    multiple
                                    options={metadata.radicals}
                                    selected={filters.radicalIds}
                                    onSelect={(val: string[]) => setFilters({...filters, radicalIds: val})}
                                    placeholder="Chọn bộ thủ..."
                                />
                            )}
                            
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-[#886373] uppercase tracking-[0.2em] ml-2">Số lượng câu hỏi</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[5, 10, 20].map(n => (
                                        <button 
                                            key={n}
                                            onClick={() => setFilters({...filters, limit: n})}
                                            className={`py-3.5 rounded-2xl font-black text-xs transition-all border-2 ${filters.limit === n ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-[#fbf9fa] text-[#886373] border-[#f4f0f2] hover:border-primary/30'}`}
                                        >
                                            {n} câu
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-10 bg-[#fbf9fa] border-t border-[#f4f0f2] flex justify-end">
                            <button 
                                onClick={handleStart}
                                className="bg-primary hover:scale-[1.02] active:scale-95 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 transition-all shadow-2xl shadow-primary/20"
                            >
                                Bắt đầu học ngay
                                <span className="material-symbols-outlined text-[18px]">play_circle</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-emerald-50 rounded-[2.5rem] p-8 border border-emerald-100 flex gap-6 items-start">
                        <div className="size-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                            <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                        </div>
                        <div>
                            <h4 className="font-black text-emerald-900 mb-2 uppercase tracking-tight">Gợi ý từ AI</h4>
                            <p className="text-sm text-emerald-700/80 leading-relaxed font-medium">
                                Dựa trên lịch sử học tập, bạn nên tập trung vào các <strong>động từ nhóm 2</strong> của trình độ <strong>N4</strong> để lấp đầy lỗ hổng kiến thức hiện tại.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SkillSelectionPage;
