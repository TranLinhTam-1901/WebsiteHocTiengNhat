import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ExamService from '../../../services/Admin/examService';
import { ExamDetailResponse } from '../../../interfaces/Admin/Exam';
import { ExamType } from '../../../interfaces/Admin/QuestionBank';
import AdminHeader from '../../../components/layout/admin/AdminHeader';

const ExamDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [details, setDetails] = useState<ExamDetailResponse | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [openFilter, setOpenFilter] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        skillType: [] as string[]
    });

    useEffect(() => {
        const fetchDetails = async () => {
            if (id) {
                setLoading(true);
                try {
                    const data = await ExamService.getExamDetails(id);
                    setDetails(data);
                } catch (error) {
                    console.error("Lỗi khi tải chi tiết đề thi:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchDetails();
    }, [id]);

    const filteredQuestions = details?.questions.filter(q => {
        const matchesSearch = q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              q.skillType.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSkill = filters.skillType.length === 0 || filters.skillType.includes(q.skillType);
        return matchesSearch && matchesSkill;
    }) || [];

    const uniqueSkills = Array.from(new Set(details?.questions.map(q => q.skillType) || []));

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const SimpleFilterDropdown = ({ label, options, currentValues, onChange, isOpen, onToggle }: any) => {
        const isFiltering = currentValues.length > 0;
        const handleSelect = (val: string) => {
            const newValues = currentValues.includes(val)
                ? currentValues.filter((v: string) => v !== val)
                : [...currentValues, val];
            onChange(newValues);
        };

        return (
            <div className="relative inline-block text-left">
                <div className="flex items-center justify-center gap-1 min-w-max">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggle(); }}
                        className={`hover:text-primary transition-all font-bold uppercase tracking-wider text-[13px] inline-flex flex-col items-center ${isFiltering ? 'text-primary' : 'text-[#886373]'}`}
                    >
                        <span className="after:content-[attr(data-text)] after:block after:font-bold after:h-0 after:invisible after:overflow-hidden" data-text={label}>
                            {label}
                        </span>
                    </button>
                    <span 
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isFiltering) onChange([]);
                            else onToggle();
                        }}
                        className={`material-symbols-outlined text-[18px] cursor-pointer transition-all p-0.5 rounded-full shrink-0 
                        ${isFiltering ? 'text-[#886373]' : `text-[#886373] ${isOpen ? 'rotate-180' : ''}`}`}
                    >
                        {isFiltering ? 'filter_list_off' : 'expand_more'}
                    </span>
                </div>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-30" onClick={onToggle} />
                        <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-48 bg-white border border-[#f4f0f2] rounded-xl shadow-2xl z-40 p-1 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                {options.map((opt: any) => {
                                    const isSelected = currentValues.includes(opt.value);
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => handleSelect(opt.value)}
                                            className={`w-full h-10 text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between mb-0.5 transition-colors ${isSelected ? 'bg-primary/10 text-primary font-bold' : 'text-slate-600 hover:bg-primary/5 hover:text-primary'}`}
                                        >
                                            {opt.label}
                                            {isSelected && <span className="material-symbols-outlined text-[15px]">check</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm font-bold text-[#886373] uppercase tracking-widest">Đang tải chi tiết đề thi...</p>
                </div>
            </div>
        );
    }

    if (!details) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light">
                <div className="text-center space-y-4">
                    <span className="material-symbols-outlined text-6xl text-[#886373]/20">error</span>
                    <p className="text-lg font-bold text-[#886373]">Không tìm thấy thông tin đề thi</p>
                    <button onClick={() => navigate(-1)} className="text-primary font-bold hover:underline">Quay lại danh sách</button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background-light font-display text-[#181114]">
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* --- Header --- */}
                <AdminHeader>
                    <div className="flex items-center w-full gap-8">
                        <div className="flex items-center gap-4 flex-1">
                            <button onClick={() => navigate(-1)} className="size-10 rounded-full border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:bg-[#f4f0f2] transition-colors active:scale-90">
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                            <div className="flex flex-col">
                                <h2 className="text-xl font-bold text-[#181114] uppercase">Chi tiết Đề thi</h2>
                                <nav className="flex text-[10px] text-[#886373] font-medium gap-1 uppercase tracking-wider">
                                    <span>Quản lý</span> / <span className="text-primary font-bold">Chi tiết đề thi</span>
                                </nav>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative hidden md:block">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#886373] text-sm">
                                    search
                                </span>
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm câu hỏi..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-[#f4f0f2] border-none rounded-full pl-9 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary/50 text-[#181114] outline-none transition-all"
                                />
                            </div>
                            <button 
                                onClick={() => navigate(`/admin/exams/edit/${id}`)}
                                className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95"
                            >
                                <span className="material-symbols-outlined text-sm">edit</span> Chỉnh sửa
                            </button>
                        </div>
                    </div>
                </AdminHeader>

                {/* --- Content Body --- */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-[1600px] mx-auto h-full">
                        
                        {/* --- CỘT TRÁI: Danh sách câu hỏi (2/3) --- */}
                        <div className="lg:col-span-2 flex flex-col h-full min-h-0">
                            <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm flex flex-col h-full overflow-hidden">
                                <div className="p-6 border-b border-[#f4f0f2] bg-[#fbf9fa] flex justify-between items-center shrink-0">
                                    <h3 className="text-sm font-bold text-[#181114] uppercase tracking-tight flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">list_alt</span>
                                        Danh sách câu hỏi
                                    </h3>
                                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase">
                                        {details.questions.length} CÂU HỎI
                                    </span>
                                </div>
                                
                                <div className="overflow-y-auto flex-1 no-scrollbar">
                                    <table className="w-full text-left border-collapse table-fixed">
                                        <thead className="sticky top-0 z-10 bg-[#fbf9fa] border-b border-[#f4f0f2]">
                                            <tr className="text-[10px] text-[#886373] uppercase tracking-[0.15em]">
                                                <th className="px-8 py-4 font-bold w-20">STT</th>
                                                <th className="px-8 py-4 font-bold w-auto">Nội dung câu hỏi</th>
                                                <th className="px-8 py-4 text-center w-40">
                                                    <SimpleFilterDropdown
                                                        label="Kỹ năng"
                                                        currentValues={filters.skillType}
                                                        isOpen={openFilter === 'skillType'}
                                                        onToggle={() => setOpenFilter(openFilter === 'skillType' ? null : 'skillType')}
                                                        onChange={(vals: any) => handleFilterChange('skillType', vals)}
                                                        options={uniqueSkills.map(s => ({ value: s, label: s }))}
                                                    />
                                                </th>
                                                <th className="px-8 py-4 font-bold text-right w-24">Điểm</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#f4f0f2]">
                                            {filteredQuestions.map((q) => (
                                                <tr key={q.questionID} className="group hover:bg-primary/5 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <span className="text-xs font-bold text-[#886373]/50">#{q.orderIndex}</span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <p className="text-sm font-bold text-[#181114] line-clamp-2">{q.content}</p>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <span className="px-2.5 py-1 bg-primary/5 border border-primary/10 rounded-lg text-[10px] font-black text-primary uppercase whitespace-nowrap">
                                                            {q.skillType}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right font-black text-sm text-[#181114]">
                                                        {q.score}
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredQuestions.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-8 py-10 text-center text-xs text-[#886373] italic">
                                                        Không tìm thấy câu hỏi phù hợp.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* --- CỘT PHẢI: Thông tin đề thi (1/3) --- */}
                        <div className="space-y-6">
                            {/* Bảng tóm tắt (Modern Card) */}
                            <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-[#f4f0f2] bg-[#fbf9fa]">
                                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#886373]">Tóm tắt Đề thi</h4>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                                <span className="material-symbols-outlined text-primary">quiz</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-[#886373] uppercase tracking-wider">Tổng số câu</p>
                                                <p className="text-2xl font-black text-primary leading-none mt-1">{details.questions.length}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-primary/60 uppercase">Câu</span>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                                <span className="material-symbols-outlined text-emerald-600">military_tech</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-[#886373] uppercase tracking-wider">Tổng điểm tối đa</p>
                                                <p className="text-2xl font-black text-emerald-600 leading-none mt-1">
                                                    {details.questions.reduce((acc, q) => acc + q.score, 0)}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-emerald-600/60 uppercase">Điểm</span>
                                    </div>
                                </div>
                                <div className="px-8 pb-8">
                                    <div className="flex items-center gap-3 p-4 bg-[#fbf9fa] rounded-xl border border-[#f4f0f2]">
                                        <div className="size-8 rounded-lg bg-white flex items-center justify-center shadow-sm border border-[#f4f0f2]">
                                            <span className="material-symbols-outlined text-primary text-sm">grade</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-[#886373] uppercase">Điểm đạt tối thiểu</p>
                                            <p className="text-sm font-black text-[#181114]">{details.passingScore} điểm</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cấu hình hoàn thành / Điểm liệt */}
                            <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm p-8 space-y-6">
                                <h3 className="text-sm font-bold text-[#181114] uppercase tracking-wider flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">rule</span>
                                    Quy định chấm điểm
                                </h3>
                                
                                {details.examType === ExamType.StandardJLPT ? (
                                    <div className="space-y-6">
                                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                            <p className="text-[11px] text-amber-700 leading-relaxed italic">
                                                💡 Đề thi JLPT tiêu chuẩn yêu cầu thí sinh đạt điểm tối thiểu ở từng phần thi (điểm liệt).
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="block text-[10px] font-bold text-[#886373] uppercase tracking-wider">Điểm liệt quy định</label>
                                            {[
                                                { label: "Kiến thức ngôn ngữ", value: details.minScores?.language ?? 0, icon: "translate" },
                                                { label: "Đọc hiểu", value: details.minScores?.reading ?? 0, icon: "menu_book" },
                                                { label: "Nghe hiểu", value: details.minScores?.listening ?? 0, icon: "headset" }
                                            ].map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-[#fbf9fa] p-4 rounded-xl border border-[#f4f0f2] hover:border-primary/20 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <span className="material-symbols-outlined text-sm text-[#886373]">{item.icon}</span>
                                                        <span className="text-xs font-bold text-[#181114]">{item.label}</span>
                                                    </div>
                                                    <span className="px-3 py-1 bg-white border border-[#f4f0f2] rounded-lg font-black text-sm text-primary shadow-sm min-w-10 text-center">
                                                        {item.value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="p-4 bg-sky-50 rounded-xl border border-sky-100">
                                            <p className="text-[11px] text-sky-600 leading-relaxed italic">
                                                💡 Đây là đề luyện tập tự do. Không áp dụng quy tắc điểm liệt của JLPT.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 p-5 bg-[#fbf9fa] rounded-2xl border border-[#f4f0f2]">
                                            <div className="size-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-[#f4f0f2]">
                                                <span className="material-symbols-outlined text-primary">task_alt</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-[#886373] uppercase tracking-wider">Trạng thái chấm</p>
                                                <p className="text-sm font-bold text-[#181114]">Luyện tập tổng quát</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ExamDetailPage;