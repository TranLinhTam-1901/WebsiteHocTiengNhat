import React, { useState, useEffect } from 'react';
import ExamService from '../../../services/Admin/examService';
import { ExamListResponse } from '../../../interfaces/Admin/Exam';
import { ExamType } from '../../../interfaces/Admin/QuestionBank';
import { toast } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import AdminHeader from '../../../components/layout/admin/AdminHeader';

const ExamListPage: React.FC = () => {
    const navigate = useNavigate();
    const [exams, setExams] = useState<ExamListResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    const [filters, setFilters] = useState({ 
        levelId: [] as string[], 
        type: [] as string[] 
    });
    const [openFilter, setOpenFilter] = useState<string | null>(null);
    const [levels, setLevels] = useState<{ levelID: string, levelName: string }[]>([]);

    const getLevelStyles = (level: string) => {
      switch (level?.toUpperCase()) {
        case 'N5': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        case 'N4': return 'bg-sky-50 text-sky-600 border-sky-100';
        case 'N3': return 'bg-amber-50 text-amber-600 border-amber-100';
        case 'N2': return 'bg-purple-50 text-purple-600 border-purple-100';
        case 'N1': return 'bg-rose-50 text-rose-600 border-rose-100';
        default: return 'bg-gray-50 text-gray-500 border-gray-100';
      }
    };

    useEffect(() => {
        ExamService.getLevelsLookup().then(setLevels).catch(() => {
            setLevels([
                { levelID: 'guid-n1', levelName: 'N1' },
                { levelID: 'guid-n2', levelName: 'N2' },
                { levelID: 'guid-n3', levelName: 'N3' },
                { levelID: 'guid-n4', levelName: 'N4' },
                { levelID: 'guid-n5', levelName: 'N5' }
            ]);
        });
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch all exams once and filter locally for simplicity, 
                // matching the pattern in QuestionBank/Index.tsx
                const data = await ExamService.getExams('', '', undefined);
                setExams(data);
            } finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const handleToggle = async (id: string) => {
        const res = await ExamService.togglePublish(id);
        if (res.success) {
            setExams(prev => prev.map(e => e.examID === id ? { ...e, isPublished: res.isPublished } : e));
            toast.success(res.message);
        }
    };

    const getStatusDot = (isPublished: boolean) => {
        if (isPublished) return "bg-emerald-500"; // Xanh: Đã công khai
        return "bg-rose-500"; // Đỏ: Chưa công khai
    };

    const getExamTypeInfo = (type: number) => {
        const map: Record<number, { label: string, style: string }> = {
            [ExamType.StandardJLPT]: { label: "Chuẩn JLPT", style: "bg-rose-50 text-rose-600 border-rose-100" },
            [ExamType.LessonPractice]: { label: "Bài học", style: "bg-emerald-50 text-emerald-600 border-emerald-100" },
            [ExamType.SkillPractice]: { label: "Kỹ năng", style: "bg-sky-50 text-sky-600 border-sky-100" },
        };
        return map[type] || { label: "Khác", style: "bg-gray-50 text-gray-500 border-gray-100" };
    };

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const filteredExams = exams.filter((item) => {
        const search = searchTerm.toLowerCase();
        const matchSearch = !searchTerm || item.title?.toLowerCase().includes(search);
        const matchLevel = filters.levelId.length === 0 || filters.levelId.includes(item.levelName);
        const matchType = filters.type.length === 0 || filters.type.includes(String(item.type));
        return matchSearch && matchLevel && matchType;
    });

    const totalPages = Math.ceil(filteredExams.length / itemsPerPage);
    const currentItems = filteredExams.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => { setCurrentPage(1); }, [searchTerm, filters]);

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

    return (
        <div className="flex flex-col h-full bg-background-light">
            <AdminHeader>
                <div className="flex items-center gap-219.5">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="flex flex-col">
                            <h2 className="text-xl font-bold text-[#181114]">KHO ĐỀ THI</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative hidden md:block">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#886373]">
                                search
                            </span>
                            <input
                                type="text"
                                placeholder="Tìm kiếm tên đề..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-[#f4f0f2] border-none rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary/50 text-[#181114] outline-none"
                            />
                        </div>

                        <Link 
                            to="/admin/exams/add"
                            className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95 no-underline"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Tạo Đề Mới
                        </Link>
                    </div>
                </div>
            </AdminHeader>

            <div className="flex-1 overflow-hidden p-8">
                <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="overflow-hidden flex-1 no-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead className="h-15">
                                <tr className="bg-[rgb(251,249,250)] border-b border-[#f4f0f2] relative">
                                    <th className="w-[35%] px-8 py-4 text-left text-sm font-bold text-[#886373] uppercase tracking-wider">
                                        Thông tin đề thi
                                    </th>
                                    <th className="w-[15%] px-8 py-4 text-center">
                                        <SimpleFilterDropdown
                                            label="Loại"
                                            currentValues={filters.type}
                                            isOpen={openFilter === 'type'}
                                            onToggle={() => setOpenFilter(openFilter === 'type' ? null : 'type')}
                                            onChange={(vals: any) => handleFilterChange('type', vals)}
                                            options={[
                                                { value: String(ExamType.StandardJLPT), label: "Chuẩn JLPT" },
                                                { value: String(ExamType.LessonPractice), label: "Bài học" },
                                                { value: String(ExamType.SkillPractice), label: "Kỹ năng" }
                                            ]}
                                        />
                                    </th>
                                    <th className="w-[15%] px-8 py-4 text-center">
                                        <SimpleFilterDropdown
                                            label="Trình độ"
                                            currentValues={filters.levelId}
                                            isOpen={openFilter === 'levelId'}
                                            onToggle={() => setOpenFilter(openFilter === 'levelId' ? null : 'levelId')}
                                            onChange={(vals: any) => handleFilterChange('levelId', vals)}
                                            options={levels.map(l => ({ value: l.levelName, label: l.levelName }))}
                                        />
                                    </th>
                                    <th className="w-[20%] px-8 py-4 text-center text-sm font-bold text-[#886373] uppercase tracking-wider">
                                        Câu hỏi / Điểm
                                    </th>
                                    <th className="w-[15%] px-8 py-4 text-right text-sm font-bold text-[#886373] uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f4f0f2]">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-10 text-sm text-slate-400">Đang tải...</td>
                                    </tr>
                                ) : currentItems.length > 0 ? (
                                    currentItems.map((exam) => {
                                        const typeInfo = getExamTypeInfo(exam.type);
                                        return (
                                            <tr key={exam.examID} className="hover:bg-primary/5 transition-colors h-24.5">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`size-2.5 rounded-full shrink-0 ${getStatusDot(exam.isPublished)} shadow-sm`} title={exam.isPublished ? "Đã công khai" : "Chưa công khai"} />
                                                        <div className="flex flex-col overflow-hidden">
                                                            <span className="truncate font-bold text-sm text-[#181114]">
                                                                {exam.title}
                                                            </span>
                                                            <span className="text-[11px] text-[#886373] font-medium uppercase mt-0.5">
                                                                {exam.duration} phút • {new Date(exam.createdAt).toLocaleDateString('vi-VN')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <span className={`${typeInfo.style} px-3 py-1 rounded-lg text-[11px] font-bold uppercase border whitespace-nowrap`}>
                                                        {typeInfo.label}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <span className={`${getLevelStyles(exam.levelName)} px-3 py-1 rounded-lg text-sm font-bold uppercase`}>
                                                        {exam.levelName}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-[#181114]">{exam.totalQuestions} câu</span>
                                                        <span className="text-[11px] text-[#886373] font-medium">{exam.totalScore} điểm</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => navigate(`/admin/exams/${exam.examID}/details`)}
                                                            className="p-2 hover:bg-[#f4f0f2] rounded-lg text-[#886373] border border-[#f4f0f2]"
                                                            title="Xem chi tiết"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">visibility</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleToggle(exam.examID)}
                                                            className={`p-2 rounded-lg border transition-all ${exam.isPublished ? 'text-emerald-500 bg-emerald-50 border-emerald-100 hover:bg-emerald-100' : 'text-slate-400 bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
                                                            title={exam.isPublished ? "Hủy công khai" : "Công khai"}
                                                        >
                                                            <span className="material-symbols-outlined text-lg">{exam.isPublished ? 'visibility_off' : 'visibility'}</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-10 text-sm text-slate-400">Không có dữ liệu</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 border-t border-[#f4f0f2] flex items-center justify-between bg-white h-20">
                        <p className="text-xs text-[#886373] font-medium">
                            Hiển thị <span className="text-[#181114]">
                                {filteredExams.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredExams.length)}
                            </span> của {filteredExams.length} kết quả
                        </p>
                        <div className="flex items-center gap-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`size-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
                                        currentPage === page 
                                        ? 'bg-primary text-white shadow-md shadow-primary/20' 
                                        : 'bg-white text-[#886373] hover:bg-gray-100 border border-[#f4f0f2]'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamListPage;