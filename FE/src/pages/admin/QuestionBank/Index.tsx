import { useState, useEffect } from 'react';
import QuestionService from '../../../services/Admin/questionService';
import { QuestionListItem, QuestionType} from '../../../interfaces/Admin/QuestionBank';
import AdminHeader from '../../../components/layout/admin/AdminHeader';
import { Link } from 'react-router-dom';
import { DIFFICULTY_OPTIONS } from '../../../constants/admin/questionOptions';
import { useNavigate } from 'react-router-dom';

const QuestionListView = () => {
    const [questions, setQuestions] = useState<QuestionListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    const [topics, setTopics] = useState<any[]>([]);
    const [lessons, setLessons] = useState<any[]>([]);
    const [linkedQuestions, setLinkedQuestions] = useState<any[]>([]);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const navigate = useNavigate();

    // State quản lý Filter (Dùng mảng để chọn nhiều)
    const [filters, setFilters] = useState({
        difficulty: [] as string[],
        questionType: [] as string[],
        topicId: [] as string[], // Lưu tên hoặc ID chủ đề
        lessonId: [] as string[]
    });
    const [openFilter, setOpenFilter] = useState<string | null>(null);

    // --- LOGIC LỌC TỔNG HỢP ---
    const filteredQuestions = questions.filter((item) => {
        const search = searchTerm.toLowerCase();
        
        const matchSearch = !searchTerm || 
            item.content?.toLowerCase().includes(search) || 
            item.questionID?.toLowerCase().includes(search);

        const matchDifficulty = filters.difficulty.length === 0 || 
            filters.difficulty.includes(String(item.difficulty));

        const matchType = filters.questionType.length === 0 || 
            filters.questionType.includes(String(item.questionType));

        // Lọc Topic: Kiểm tra xem có giao điểm giữa mảng filters.topicId và mảng topics của item không
        const matchTopic = filters.topicId.length === 0 || 
            item.topicName?.some((t: any) => 
                filters.topicId.includes(t.name || t.topicName || t)
            );

        // Lọc Lesson: Thêm logic lọc bài học
        const matchLesson = filters.lessonId.length === 0 || 
            filters.lessonId.includes(item.lessonName || item.lessonId);

        return matchSearch && matchDifficulty && matchType && matchTopic && matchLesson;
    });

    // --- LOGIC PHÂN TRANG ---
    const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
    const currentItems = filteredQuestions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset trang khi filter thay đổi
    useEffect(() => { setCurrentPage(1); }, [searchTerm, filters]);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Chạy song song các API để tiết kiệm thời gian
                const [topicsData, lessonsData] = await Promise.all([
                    QuestionService.getTopicsLookup(),
                    QuestionService.getLessonsLookup()
                ]);
                
                setTopics(topicsData);
                setLessons(lessonsData);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu danh mục:", error);
            }
        };

        loadInitialData();
    }, []);

    useEffect(() => { fetchQuestions(); }, []);

    // Xử lý hiển thị Modal liên kết (Icon xích)
    const showLinks = async (id: string) => {
        setLinkedQuestions([]); 

        try {
            setLoading(true); // Nếu có state loading chung hoặc riêng cho modal
            const links = await QuestionService.getQuestionLinks(id);
            
            // Cập nhật dữ liệu mới từ API
            setLinkedQuestions(links || []);
            
            //  Chỉ mở Modal sau khi đã chắc chắn có dữ liệu hoặc API đã phản hồi
            setIsLinkModalOpen(true);
        } catch (error) {
            console.error("Lỗi khi tải liên kết:", error);
            setLinkedQuestions([]);
            setIsLinkModalOpen(true); // Vẫn mở để hiện thông báo "Chưa có liên kết"
        } finally {
            setLoading(false);
        }
    };

    const QUESTION_TYPE_LABELS: Record<number, string> = {
        [QuestionType.MultipleChoice]: "Trắc nghiệm",
        [QuestionType.FillInBlank]: "Điền từ",
        [QuestionType.Ordering]: "Sắp xếp câu",
        [QuestionType.Synonym]: "Đồng nghĩa",
        [QuestionType.Usage]: "Cách dùng"
    };

    // 1. Sửa hàm nhận cả string và number để hết lỗi TS
    const getLevelInfo = (difficulty: number | string) => {
        const level = Number(difficulty);
        const labels: Record<number, string> = {
            1: 'N5', 2: 'N4', 3: 'N3', 4: 'N2', 5: 'N1'
        };
        
        const label = labels[level] || `N${level}`;
        
        let style = "";
        switch (label) {
            case 'N1': style = 'bg-rose-50 text-rose-600 border-rose-100'; break;
            case 'N2': style = 'bg-purple-50 text-purple-600 border-purple-100'; break;
            case 'N3': style = 'bg-amber-50 text-amber-600 border-amber-100'; break;
            case 'N4': style = 'bg-sky-50 text-sky-600 border-sky-100'; break;
            case 'N5': style = 'bg-emerald-50 text-emerald-600 border-emerald-100'; break;
            default: style = 'bg-gray-50 text-gray-500 border-gray-100';
        }
        return { label, style };
    };

    const fetchQuestions = async (params: any = {}) => {
        setLoading(true);
        try {
            const data = await QuestionService.getQuestions(params);
            setQuestions(data);
        } catch (error) {
            console.error("Lỗi:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        // Gọi API xóa ở đây
        console.log("Xóa câu hỏi:", id);
    };

    const handleFilterChange = (key: string, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        fetchQuestions(newFilters);
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
                {/* Mẹo giữ chiều rộng cố định cho font-bold */}
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

    const TopicMegaDropdown = ({ label, topics, selected, onChange, isOpen, onToggle, type }: any) => {
        const [searchTerm, setSearchTerm] = useState('');
        const isFiltering = selected.length > 0;

        const dropdownStyle = type === 'topic' 
        ? { right: "-236px" } 
        : type === 'lesson' 
            ? { right: "-495px" } 
            : { left: "50%", transform: "translateX(-50%)" };
    
        const remainingTopics = topics.filter((t: any) => !(selected.includes(t.name || t.topicName)));
        const filteredTopics = remainingTopics.filter((t: any) => 
          (t.name || t.topicName || "").toLowerCase().includes(searchTerm.toLowerCase())
        );
    
        const toggleTopic = (name: string) => {
          const next = selected.includes(name)
            ? selected.filter((i: string) => i !== name)
            : [...selected, name];
          onChange(next);
        };
    
        return (
          <div className="relative inline-block">
            {/* 1. Header Button */}
            <div 
              className="flex items-center justify-center gap-1 cursor-pointer select-none group" 
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
            >
              {/* Label bên trái - Không để badge ở đây nữa */}
              <button className={`font-bold uppercase tracking-wider text-[13px] ${isFiltering ? 'text-primary' : 'text-[#886373]'}`}>
                {label}
              </button>
    
              {/* Group Icon + Badge bên phải */}
              <div className="relative flex items-center justify-center">
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isFiltering) onChange([]);
                    else onToggle();
                  }}
                  className={`material-symbols-outlined text-[20px] cursor-pointer transition-all p-0.5 rounded-full shrink-0 
                    ${isFiltering ? 'text-[#886373]' : `text-[#886373] ${isOpen ? 'rotate-180' : ''}`}`}
                >
                  {isFiltering ? 'filter_list_off' : 'expand_more'}
                </span>
    
                {/* BADGE NẰM BÊN PHẢI ICON */}
                {isFiltering && (
                  <span className="absolute -top-2 -right-4 bg-primary text-white text-sm min-w-6.25 h-6.25 rounded-full flex items-center justify-center border-2 border-white shadow-sm px-0.5">
                    {selected.length}
                  </span>
                )}
              </div>
            </div>
    
            {/* 2. Menu Dropdown */}
            {isOpen && (
              <>
                <div className="fixed inset-0" onClick={onToggle} />
                
                <div 
                  style={dropdownStyle}
                  className="absolute mt-4 w-387.5 max-w-[85vw] bg-white border border-[#f4f0f2] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden"
                >
                  
                  {/* A. Search */}
                  <div className="p-4 bg-[#fbf9fa] border-b border-[#f4f0f2]">
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#886373]">search</span>
                      <input 
                        autoFocus
                        type="text"
                        placeholder="Tìm kiếm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-[#f4f0f2] rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-primary font-medium shadow-sm"
                      />
                    </div>
                  </div>
    
                  {/* B. TAGS ĐÃ CHỌN */}
                  {isFiltering && (
                    <div className="p-4 bg-white border-b border-[#f4f0f2] flex flex-wrap gap-2 max-h-39 overflow-y-auto custom-scrollbar">
                      {selected.map((name: string) => (
                        <div key={name} className="inline-flex relative group animate-in zoom-in-95 duration-75">
                          <div className="pl-3 pr-8 py-1.5 bg-primary/5 border border-primary/20 text-primary text-sm font-bold rounded-full flex items-center">
                            <span className="material-symbols-outlined text-sm mr-1.5 opacity-60">label</span>
                            {name}
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleTopic(name); }}
                            className="absolute right-1 top-1/2 -translate-y-1/2 size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
    
                  {/* C. DANH SÁCH GỢI Ý - CHIA CỘT ĐỂ FULL CHIỀU RỘNG */}
                  <div className="max-h-100 overflow-y-auto p-3 custom-scrollbar bg-white">                
                    <div className="grid grid-cols-3 gap-1"> {/* Chia 3 cột để tận dụng 900px chiều rộng */}
                      {filteredTopics.length > 0 ? filteredTopics.map((t: any) => {
                        const name = t.name || t.topicName;
                        return (
                          <button
                            key={t.id || name}
                            onClick={(e) => { e.stopPropagation(); toggleTopic(name); }}
                            className="text-left px-4 py-3 text-sm rounded-xl flex items-center justify-between text-slate-600 hover:bg-primary/5 hover:text-primary transition-all group border border-transparent hover:border-primary/10"
                          >
                            <span className="truncate pr-2 font-medium">{name}</span>
                            <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity">add_circle</span>
                          </button>
                        );
                      }) : (
                        <div className="col-span-3 py-10 text-center text-slate-400 text-xs italic">
                          {remainingTopics.length === 0 ? "Bạn đã chọn tất cả chủ đề hiện có" : "Không tìm thấy kết quả phù hợp"}
                        </div>
                      )}
                    </div>
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
                <div className="flex items-center gap-190">
                <div className="flex items-center gap-4 flex-1">
                    <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-[#181114]">NGÂN HÀNG CÂU HỎI</h2>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative hidden md:block">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#886373]">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Tìm kiếm câu hỏi..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-[#f4f0f2] border-none rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary/50 text-[#181114] outline-none"
                    />
                    </div>

                    <Link 
                    to="/admin/question-bank/create"
                    className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95 no-underline"
                    >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Thêm Câu hỏi
                    </Link>
                </div>
                </div>
            </AdminHeader>

            {/* Table Container */}
            <div className="flex-1 overflow-hidden p-8">
                <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="overflow-hidden flex-1 no-scrollbar">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead className="h-15">
                        <tr className="bg-[rgb(251,249,250)] border-b border-[#f4f0f2] relative">
                            {/* Cột Nội dung câu hỏi */}
                            <th className="w-[30%] px-8 py-4 text-left text-sm font-bold text-[#886373] uppercase tracking-wider">
                            Nội dung câu hỏi
                            </th>

                            {/* Cột Loại (Filter Dropdown) */}
                            <th className="w-[15%] px-8 py-4 text-center">
                            <SimpleFilterDropdown
                                label="Loại"
                                currentValues={filters.questionType}
                                isOpen={openFilter === 'questionType'}
                                onToggle={() => setOpenFilter(openFilter === 'questionType' ? null : 'questionType')}
                                onChange={(vals: any) => handleFilterChange('questionType', vals)}
                                options={Object.entries(QUESTION_TYPE_LABELS).map(([val, label]) => ({
                                value: val,
                                label: label
                                }))}
                            />
                            </th>

                            {/* Cột Trình độ (Filter Dropdown) */}
                            <th className="w-[12%] px-8 py-4 text-center">
                            <SimpleFilterDropdown
                                label="JLPT"
                                currentValues={filters.difficulty}
                                isOpen={openFilter === 'difficulty'}
                                onToggle={() => setOpenFilter(openFilter === 'difficulty' ? null : 'difficulty')}
                                onChange={(vals: any) => handleFilterChange('difficulty', vals)}
                                options={DIFFICULTY_OPTIONS.map(opt => ({
                                value: String(opt.value),
                                label: opt.label
                                }))}
                            />
                            </th>

                            {/* Cột Bài học */}
                            <th className="w-[15%] px-8 py-4 text-center relative">
                                <TopicMegaDropdown
                                    label="Bài học"
                                    type="lesson"
                                    topics={lessons.map(l => ({ 
                                        ...l, 
                                        name: l.lessonName || l.title || l.name 
                                    }))}
                                    selected={filters.lessonId}
                                    isOpen={openFilter === 'lesson'}
                                    onToggle={() => setOpenFilter(openFilter === 'lesson' ? null : 'lesson')}
                                    onChange={(vals: string[]) => handleFilterChange('lessonId', vals)}
                                />
                            </th>

                            {/* Cột Chủ đề (Mega Dropdown) */}
                            <th className="w-[18%] px-8 py-4 text-center relative">
                            <TopicMegaDropdown
                                label="Chủ đề"
                                type="topic"
                                topics={topics}
                                selected={filters.topicId}
                                isOpen={openFilter === 'topic'}
                                onToggle={() => setOpenFilter(openFilter === 'topic' ? null : 'topic')}
                                onChange={(vals: string[]) => handleFilterChange('topicId', vals)}
                            />
                            </th>

                            {/* Thao tác */}
                            <th className="w-[10%] px-8 py-4 text-right text-sm font-bold text-[#886373] uppercase tracking-wider">
                            Thao tác
                            </th>
                        </tr>
                        </thead>

                        <tbody className="divide-y divide-[#f4f0f2]">
                        {loading ? (
                            <tr>
                            <td colSpan={6} className="text-center py-10 text-sm text-slate-400">Đang tải...</td>
                            </tr>
                        ) : currentItems.map((item) => (
                            <tr key={item.questionID} className="hover:bg-primary/5 transition-colors h-24.5">
                            {/* Nội dung câu hỏi + Link icon */}
                            <td className="px-8 py-5">
                                <div className="flex items-center gap-2 overflow-hidden">
                                <span className="truncate font-bold text-sm text-[#181114]">
                                    {item.content}
                                </span>
                                {item.linkedCount > 0 && (
                                    <span 
                                    className="material-symbols-outlined text-primary cursor-pointer text-[20px] shrink-0"
                                    onClick={() => { showLinks(item.questionID); setIsLinkModalOpen(true); }}
                                    >link</span>
                                )}
                                {item.hasAudio && (
                                    <span className="material-symbols-outlined text-blue-400 text-sm shrink-0">volume_up</span>
                                )}
                                </div>
                            </td>

                            {/* Loại */}
                            <td className="px-8 py-5 text-center">
                                <span className="text-[11px] font-bold text-[#886373] bg-[#f4f0f2] px-2 py-1 rounded uppercase tracking-tighter">
                                {QUESTION_TYPE_LABELS[item.questionType] || "Khác"}
                                </span>
                            </td>

                            {/* Trình độ */}
                            <td className="px-8 py-5 text-center">
                                {(() => {
                                    const { label, style } = getLevelInfo(item.difficulty);
                                    return (
                                        <span className={`${style} px-3 py-1 rounded-lg text-sm font-bold uppercase`}>
                                            {label}
                                        </span>
                                    );
                                })()}
                            </td>

                            {/* Bài học */}
                            <td className="px-8 py-5 text-center">
                                <span className="text-sm font-medium text-[#181114]">
                                {item.lessonName || "---"}
                                </span>
                            </td>

                            {/* Chủ đề */}
                            <td className="px-8 py-5">
                                <div className="flex flex-wrap gap-1.5 text-center justify-center max-w-75">
                                    {/* Lấy dữ liệu từ state 'topics' tổng đã load ở useEffect đầu tiên */}
                                    {item.topicName && item.topicName.length > 0 ? (
                                        item.topicName.map((t: any, index: number) => {
                                            const topicData = typeof t === 'object' ? t : topics.find(tp => tp.id === t || tp.topicId === t);
                                            const displayName = topicData?.name || topicData?.topicName || t;
                                            
                                            return (
                                                <span key={index} className="px-2 py-0.5 bg-primary/5 border border-primary/20 text-primary text-[12px] font-bold rounded-md whitespace-nowrap uppercase tracking-tighter">
                                                    {displayName}
                                                </span>
                                            );
                                        })
                                    ) : (
                                        <span className="text-gray-400 text-[12px]">---</span>
                                    )}
                                </div>
                            </td>

                            {/* Thao tác */}
                            <td className="px-8 py-5 text-right">
                                <div className="flex items-center justify-end gap-2 mr-4">
                                <button 
                                    onClick={() => navigate(`/admin/question-bank/edit/${item.questionID}`)}
                                    className="p-2 hover:bg-[#f4f0f2] rounded-lg text-[#886373] border border-[#f4f0f2]"
                                >
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                                {/* <button 
                                    onClick={() => handleDelete(item.questionID)}
                                    className="p-2 hover:bg-[#f4f0f2] rounded-lg text-[#886373] border border-[#f4f0f2] hover:text-red-500"
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button> */}
                                </div>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>

                    {/* Footer Phân trang chuẩn */}
                    <div className="p-6 border-t border-[#f4f0f2] flex items-center justify-between bg-white h-20">
                        <p className="text-xs text-[#886373] font-medium">
                            Hiển thị <span className="text-[#181114]">
                                {filteredQuestions.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredQuestions.length)}
                            </span> của {filteredQuestions.length} kết quả
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
export default QuestionListView;