import React, { useEffect, useState } from 'react';
import AdminHeader from '../../../../components/layout/admin/AdminHeader';
import { Link } from 'react-router-dom';
import { listeningService } from '../../../../services/Admin/listeningService'; 
import { ListeningItem } from '../../../../interfaces/Admin/Listening';
import { TopicItem } from '../../../../interfaces/Admin/Topic';

const ListeningManagement: React.FC = () => {
  const [tracks, setTracks] = useState<ListeningItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [topics, setTopics] = useState<TopicItem[]>([]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 7;

  // Reset về trang 1 mỗi khi tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchListenings = async () => {
    try {
      setLoading(true);
      const [listeningData, topicData] = await Promise.all([
              listeningService.getAll(),
              listeningService.getTopics()
            ]);
      setTracks(listeningData);
      setTopics(topicData);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bài nghe:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListenings();
  }, []);

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

  // State quản lý Modal Xóa
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [listeningToDelete, setListeningToDelete] = useState<{id: string, title: string} | null>(null);

  const handleDelete = (id: string, title: string) => {
    setDeleteId(id);
    setListeningToDelete({ id, title });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await listeningService.delete(deleteId);
      setTracks(tracks.filter(t => t.id !== deleteId));
      setDeleteId(null);
      setListeningToDelete(null);
    } catch (error) {
      console.error(error);
      alert("Xóa thất bại!");
    }
  };

  // Hàm format giây thành mm:ss
  const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
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
  
    const TopicMegaDropdown = ({ label, topics, selectedTopics, onChange, isOpen, onToggle }: any) => {
      const [searchTerm, setSearchTerm] = useState('');
      const isFiltering = selectedTopics.length > 0;
  
      const remainingTopics = topics.filter((t: any) => !(selectedTopics.includes(t.name || t.topicName)));
      const filteredTopics = remainingTopics.filter((t: any) => 
        (t.name || t.topicName || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
  
      const toggleTopic = (name: string) => {
        const next = selectedTopics.includes(name)
          ? selectedTopics.filter((i: string) => i !== name)
          : [...selectedTopics, name];
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
                  {selectedTopics.length}
                </span>
              )}
            </div>
          </div>
  
          {/* 2. Menu Dropdown */}
          {isOpen && (
            <>
              <div className="fixed inset-0" onClick={onToggle} />
              
              <div 
                style={{ right: "-325px" }} // Đẩy ngược lại sang phải để bù trừ việc nó nằm ở cột gần cuối bảng
                className="absolute mt-4 w-387.5 max-w-[85vw] bg-white border border-[#f4f0f2] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden"
              >
                
                {/* A. Search */}
                <div className="p-4 bg-[#fbf9fa] border-b border-[#f4f0f2]">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#886373]">search</span>
                    <input 
                      autoFocus
                      type="text"
                      placeholder="Tìm kiếm chủ đề..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white border border-[#f4f0f2] rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-primary font-medium shadow-sm"
                    />
                  </div>
                </div>
  
                {/* B. TAGS ĐÃ CHỌN */}
                {isFiltering && (
                  <div className="p-4 bg-white border-b border-[#f4f0f2] flex flex-wrap gap-2 max-h-39 overflow-y-auto custom-scrollbar">
                    {selectedTopics.map((name: string) => (
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

  // 1. Khai báo State lọc
  const [filters, setFilters] = useState({
    status: [] as string[],
    level: [] as string[],
    topic: [] as string[]
  });
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  // 2. Logic lọc TỔNG HỢP (Search + Dropdowns)
  const filteredData = tracks.filter((item: any) => {
    const search = searchTerm.toLowerCase();
    
    // 1. Search logic
    const matchSearch = !searchTerm || 
      item.title?.toLowerCase().includes(search.toLowerCase());

    // 2. Status & Level (Giữ nguyên của bạn nhưng thêm kiểm tra an toàn)
    const matchStatus = filters.status.length === 0 || filters.status.includes(item.status?.toString());
    const matchLevel = filters.level.length === 0 || filters.level.includes(item.levelName);

    // 3. Topic Logic (SỬA Ở ĐÂY)
    const matchTopic = filters.topic.length === 0 || 
      item.topics?.some((t: any) => {
        // Ép kiểu t về string để so sánh với mảng filters.topic
        const name = typeof t === 'string' ? t : (t.name || t.topicName);
        return filters.topic.includes(name);
      });

    return matchSearch && matchStatus && matchLevel && matchTopic;
  });

  // 3. Tính toán phân trang dựa trên dữ liệu đã lọc
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  // Reset trang về 1 nếu trang hiện tại vượt quá tổng số trang sau khi lọc
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filters, searchTerm, totalPages]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="flex flex-col h-full bg-background-light">
      <AdminHeader>
        <div className="flex items-center gap-194">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-[#181114]">QUẢN LÝ BÀI NGHE</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#886373]">
                search
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm bài nghe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#f4f0f2] border-none rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary/50 text-[#181114] outline-none"
              />
            </div>

            <Link 
              to="/admin/resource/listening/create"
              className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95 no-underline"
            >
              <span className="material-symbols-outlined text-sm">mic</span>
              Thêm Bài nghe
            </Link>
          </div>
        </div>
      </AdminHeader>

      {deleteId && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#181114]/40 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-[3rem] p-10 max-w-105 w-full shadow-[0_40px_100px_-20px_rgba(24,11,20,0.3)] border border-white/50 animate-in zoom-in-95 duration-300">
            <div className="relative size-32 rounded-[2.5rem] bg-linear-to-br from-[#fff1f2] to-[#ffe4e6] flex flex-col items-center justify-center text-[#e11d48] mb-8 mx-auto shadow-[inset_0_4px_12px_rgba(225,29,72,0.1)] border-4 border-white rotate-3">
              <span className="material-symbols-outlined text-5xl drop-shadow-sm scale-110">
                headphones
              </span>
              <div className="absolute -bottom-2 -right-2 size-11 rounded-full bg-[#e11d48] text-white flex items-center justify-center shadow-lg border-4 border-white -rotate-3">
                <span className="material-symbols-outlined text-[20px] font-bold">close</span>
              </div>
            </div>
            
            <div className="text-center mb-10">
              <h3 className="text-[24px] font-black text-[#181114] mb-3 tracking-tight">Gỡ bỏ bài nghe?</h3>
              <p className="text-[#886373] text-sm leading-relaxed px-4">
                Toàn bộ dữ liệu âm thanh và câu hỏi của bài <span className="inline-block mt-2 font-bold text-[#e11d48] bg-[#fff1f2] px-3 py-1 rounded-xl italic">
                  "{listeningToDelete?.title}"</span> sẽ bị xóa vĩnh viễn.
              </p>
            </div>
            
            <div className="flex gap-4">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-4 px-2 rounded-[1.25rem] bg-[#f4f2f3] text-[#5a434d] font-black text-[12px] uppercase tracking-wider hover:bg-[#ece8ea] transition-all duration-200 border border-[#e8e4e6]">
                Hủy bỏ
              </button>
              <button onClick={confirmDelete} className="flex-1 py-4 px-2 rounded-[1.25rem] bg-[#e53e3e] text-white font-black text-[12px] uppercase tracking-wider hover:bg-[#c53030] shadow-xl shadow-red-100 transition-all active:scale-95">
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden p-8">
        <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm overflow-hidden flex flex-col h-full">
          <div className="overflow-hidden flex-1 no-scrollbar">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className='h-15'>
                <tr className="bg-[rgb(251,249,250)] border-b border-[#f4f0f2] relative">
                  <th className="w-[30%] px-8 py-4 text-left text-sm font-bold text-[#886373] uppercase tracking-wider">Tiêu đề</th>
                  
                  {/* Trạng thái */}
                  <th className="w-[15%] px-8 py-4 text-center">
                    <SimpleFilterDropdown 
                      label="Trạng thái"
                      currentValues={filters.status}
                      isOpen={openFilter === 'status'}
                      onToggle={() => setOpenFilter(openFilter === 'status' ? null : 'status')}
                      onChange={(vals: string[]) => setFilters({...filters, status: vals})}
                      options={[
                        { value: '0', label: 'Đang tạo' },
                        { value: '1', label: 'Hoạt động' },
                        { value: '2', label: 'Lưu trữ' }
                      ]}
                    />
                  </th>

                  <th className="w-[12%] px-8 py-4 text-center text-sm font-bold text-[#886373] uppercase tracking-wider">Thời lượng</th>
                  
                  {/* Trình độ */}
                  <th className="w-[10%] px-8 py-4 text-center">
                    <SimpleFilterDropdown 
                      label="JLPT"
                      currentValues={filters.level}
                      isOpen={openFilter === 'level'}
                      onToggle={() => setOpenFilter(openFilter === 'level' ? null : 'level')}
                      onChange={(vals: string[]) => setFilters({...filters, level: vals})}
                      options={[
                        { value: 'N1', label: 'N1' }, { value: 'N2', label: 'N2' },
                        { value: 'N3', label: 'N3' }, { value: 'N4', label: 'N4' }, { value: 'N5', label: 'N5' },
                      ]}
                    />
                  </th>

                  {/* Chủ đề*/}
                  <th className="w-[18%] px-8 py-4 text-center relative">
                    <TopicMegaDropdown 
                      label="Chủ đề"
                      topics={topics}
                      selectedTopics={filters.topic}
                      onChange={(vals: string[]) => setFilters({...filters, topic: vals})}
                      // Logic: Nếu đang mở topic thì đóng, nếu không thì mở
                      isOpen={openFilter === 'topic'}
                      onToggle={() => setOpenFilter(openFilter === 'topic' ? null : 'topic')}
                    />
                  </th>

                  <th className="w-[15%] px-8 py-4 text-right text-sm font-bold text-[#886373] uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f0f2]">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-10 text-sm text-slate-400">Đang tải audio...</td></tr>
                ) : currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-primary/5 transition-colors h-24.5">
                    <td className="px-8 py-5 font-bold text-sm text-[#181114]">
                      <div className="flex flex-col">
                        <span className="truncate">{item.title}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`text-sm font-medium ${
                        item.status === 0 ? "text-yellow-500" : 
                        item.status === 1 ? "text-green-500" : 
                        "text-red-500"
                      }`}>
                        {item.status === 0 ? "Đang tạo" : 
                        item.status === 1 ? "Hoạt động" : 
                        "Lưu trữ"}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="text-sm font-medium text-black">{formatDuration(item.duration)}</span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`${getLevelStyles(item.levelName)} px-3 py-1 rounded-lg text-xs font-bold uppercase`}>{item.levelName}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap gap-1.5 max-w-55"> {/* Khống chế chiều rộng tối đa */}
                        {item.topics && item.topics.length > 0 ? (
                          <>
                            {/* Chỉ hiển thị 2 tag đầu tiên */}
                            {item.topics.slice(0, 2).map((topic: any, index: number) => (
                              <span 
                                key={index}
                                className="px-2 py-0.5 bg-primary/5 border border-primary/20 text-primary text-[12px] font-bold rounded-md whitespace-nowrap uppercase tracking-tighter"
                              >
                                {typeof topic === 'string' ? topic : topic.topicName}
                              </span>
                            ))}

                            {/* Nếu có nhiều hơn 2 tag, hiển thị số dư */}
                            {item.topics.length > 2 && (
                              <span className="px-2 py-0.5 bg-primary/5 border border-primary/20 text-primary text-[12px] font-bold rounded-md whitespace-nowrap">
                                +{item.topics.length - 2}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] text-[#886373]/40 italic font-medium">
                            Chưa chọn
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Nút nghe trước mới */}
                        <Link to={`/admin/resource/listening/edit/${item.id}`} className="p-2 hover:bg-[#f4f0f2] rounded-lg text-[#886373] border border-[#f4f0f2]">
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </Link>
                        
                        <button onClick={() => handleDelete(item.id, item.title)} className="p-2 hover:bg-[#f4f0f2] rounded-lg text-[#886373] border border-[#f4f0f2] hover:text-red-500">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-[#f4f0f2] flex items-center justify-between bg-white h-20">
            <p className="text-xs text-[#886373] font-medium">
              Hiển thị <span className="text-[#181114]">{indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredData.length)}</span> của {filteredData.length} bài nghe
            </p>
            
            <div className="flex items-center gap-2">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`size-10 rounded-lg flex items-center justify-center border-2 border-[#f4f0f2] font-bold text-sm transition-all ${
                    currentPage === index + 1 
                      ? 'bg-primary text-white shadow-md shadow-primary/20 border-none' 
                      : 'text-[#886373] hover:bg-[#f4f0f2]'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListeningManagement;