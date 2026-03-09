import React, { useEffect, useState } from 'react';
import AdminHeader from '../../../../components/layout/admin/AdminHeader';
import { Link } from 'react-router-dom';
import { vocabService } from '../../../../services/Admin/vocabService';
import { VocabularyItem } from '../../../../interfaces/Admin/Vocabulary';

const VocabularyListPage: React.FC = () => {
  const [vocabList, setVocabList] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);

  // Thêm vào cùng các state khác
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const vocabToDelete = vocabList.find(v => v.vocabID === deleteId);
  
  const [selectedLevel, setSelectedLevel] = useState<string>('Toàn bộ');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const wordTypes = [
    { id: 'Danh từ', label: 'Danh từ' },
    { id: 'Động từ', label: 'Động từ' },
    { id: 'Tính từ na', label: 'Tính từ (Na)' },
    { id: 'Tính từ i', label: 'Tính từ (I)' },
    { id: 'Trạng từ', label: 'Trạng từ' },
    { id: 'Trợ từ', label: 'Trợ từ' }
  ];

  const fetchVocabularies = async () => {
    try {
      setLoading(true);
      const data = await vocabService.getAll();
      setVocabList(data);
    } catch (error) {
      console.error("Lỗi khi fetch dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVocabularies(); }, []);

  const filteredVocab = vocabList.filter(item => {
    const matchSearch = item.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       item.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       item.reading.toLowerCase().includes(searchTerm.toLowerCase());
    const matchLevel = selectedLevel === 'Toàn bộ' || item.levelName === selectedLevel;
    const matchType = selectedType === 'all' || (item as any).wordType === selectedType;
    return matchSearch && matchLevel && matchType;
  });

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      // Gọi service xóa (truyền uuid vào)
      await vocabService.delete(deleteId);

      // Cập nhật State: Dùng vocabID để lọc
      setVocabList(prev => prev.filter(item => item.vocabID !== deleteId));

      // Đóng modal
      setDeleteId(null);
      
      // Thông báo (tùy chọn)
      // toast.success("Xóa thành công!"); 
    } catch (error) {
      console.error("Lỗi khi xóa:", error);
      alert("Không thể xóa từ vựng này. Vui lòng thử lại!");
    }
  };

  const getLevelStyle = (level?: string) => {
    switch (level) {
      case 'N5': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'N4': return 'bg-sky-50 text-sky-600 border-sky-100';
      case 'N3': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'N2': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'N1': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-light font-display text-[#181114]">
      <AdminHeader>
        <div className="flex items-center gap-107.5 w-full">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-xl font-bold text-[#181114]">QUẢN LÝ TỪ VỰNG</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#886373]">search</span>
              <input
                type="text"
                placeholder="Tìm kiếm từ vựng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#f4f0f2] border-none rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary/50 outline-none"
              />
            </div>
            <Link to="/admin/resource/vocabulary/create" className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all no-underline shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-sm">add</span>
              Thêm Từ vựng
            </Link>
          </div>
        </div>
      </AdminHeader>

      <div className="flex-1 overflow-y-auto p-8">
        {/* --- FILTER BAR (GIỐNG KANJI) --- */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex flex-1 gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button 
              onClick={() => setSelectedLevel('Toàn bộ')}
              className={`px-5 py-2 text-[15px] font-bold rounded-full transition-all border shadow-sm ${selectedLevel === 'Toàn bộ' ? 'bg-primary text-white border-primary shadow-primary/20' : 'bg-white text-[#886373] border-[#f4f0f2] hover:border-primary'}`}
            >
              Toàn bộ
            </button>
            {['N5', 'N4', 'N3', 'N2', 'N1'].map((lv) => (
              <button 
                key={lv} 
                onClick={() => setSelectedLevel(lv)}
                className={`px-5 py-2 text-xs font-bold rounded-full border transition-all ${selectedLevel === lv ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' : 'bg-white text-[#886373] border-[#f4f0f2] hover:border-primary hover:text-primary'}`}
              >
                {lv}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              {/* Button Dropdown */}
              <button 
                onClick={() => setIsTypeMenuOpen(!isTypeMenuOpen)}
                className="flex items-center bg-[#fbf9fa] border border-[#f4f0f2] rounded-full px-4 py-1.5 hover:border-primary/30 transition-all outline-none"
              >
                <span className="material-symbols-outlined text-[16px] text-[#886373] mr-2">category</span>
                <span className="text-[15px] font-bold text-[#181114] min-w-20 text-left">
                  {selectedType === 'all' ? 'Loại từ' : wordTypes.find(t => t.id === selectedType)?.label}
                </span>
                <span className={`material-symbols-outlined text-[#886373] text-[18px] transition-transform duration-300 ${isTypeMenuOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {/* Dropdown Menu */}
              {isTypeMenuOpen && (
                <>
                  {/* Backdrop để click ra ngoài thì đóng menu */}
                  <div className="fixed inset-0 z-10" onClick={() => setIsTypeMenuOpen(false)} />
                  
                  <div className="absolute right-0 mt-2 w-48 z-20 bg-white border border-[#f4f0f2] rounded-2xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-200">
                    {/* Option mặc định */}
                    <button 
                      onClick={() => { setSelectedType('all'); setIsTypeMenuOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-[15px] font-bold rounded-xl transition-colors flex items-center justify-between
                        ${selectedType === 'all' ? 'bg-primary/5 text-primary' : 'text-[#886373] hover:bg-[#fbf9fa] hover:text-[#181114]'}`}
                    >
                      Tất cả loại từ
                      {selectedType === 'all' && <span className="material-symbols-outlined text-[15px]">check</span>}
                    </button>

                    <div className="h-px bg-[#f4f0f2] my-1 mx-2" />

                    {/* Danh sách loại từ */}
                    {wordTypes.map((type) => (
                      <button 
                        key={type.id}
                        onClick={() => { setSelectedType(type.id); setIsTypeMenuOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-[15px] font-bold rounded-xl transition-colors flex items-center justify-between
                          ${selectedType === type.id ? 'bg-primary/5 text-primary' : 'text-[#886373] hover:bg-[#fbf9fa] hover:text-[#181114]'}`}
                      >
                        {type.label}
                        {selectedType === type.id && <span className="material-symbols-outlined text-sm">check</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={() => { setSelectedLevel('Toàn bộ'); setSelectedType('all'); setSearchTerm(''); }}
              className="size-9 flex items-center justify-center bg-white text-[#886373] border border-[#f4f0f2] rounded-full hover:text-red-500 hover:border-red-200 transition-all active:scale-90 shadow-sm"
              title="Xóa lọc"
            >
              <span className="material-symbols-outlined text-[18px]">filter_list_off</span>
            </button>
          </div>
        </div>

        {deleteId && (
          <div className="fixed inset-0 z-999 flex items-center justify-center p-6">
            {/* Overlay: Đồng bộ độ mờ và blur với bên Kanji */}
            <div 
              className="absolute inset-0 bg-[#181114]/30 backdrop-blur-sm animate-in fade-in duration-500" 
              onClick={() => setDeleteId(null)} 
            />
            
            {/* Modal Content: Giữ nguyên rounded-[3rem] và shadow đặc trưng */}
            <div className="relative bg-white rounded-[3rem] p-10 max-w-95 w-full shadow-[0_40px_100px_-20px_rgba(24,11,20,0.25)] border border-white/50 animate-in zoom-in-95 duration-300">
              
              {/* Vòng tròn hiển thị: Giữ nguyên style Kanji nhưng thay bằng Icon để hợp với từ dài */}
              <div className="relative size-32 rounded-full bg-linear-to-br from-[#fff5f5] to-[#fed7d7] flex flex-col items-center justify-center text-[#e53e3e] mb-8 mx-auto shadow-[inset_0_4px_12px_rgba(229,62,62,0.1)] border-4 border-white">
                <span className="text-3xl font-black font-japanese drop-shadow-sm">
                  {vocabToDelete?.word}
                </span>
                
                {/* Badge Delete: Giữ nguyên vị trí và màu sắc như bên Kanji */}
                <div className="absolute -bottom-1 -right-1 size-9 rounded-full bg-[#e53e3e] text-white flex items-center justify-center shadow-lg border-[3px] border-white">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </div>
              </div>
              
              {/* Văn bản thông báo: Cấu trúc y hệt bên Kanji */}
              <div className="text-center mb-10">
                <h3 className="text-[22px] font-black text-[#181114] mb-3 tracking-tight">Xác nhận xóa từ?</h3>
                <p className="text-[#886373] text-sm leading-relaxed px-2">
                  Từ vựng <span className="font-bold text-[#e53e3e] bg-[#fff5f5] px-2 py-0.5 rounded-md italic">"{vocabToDelete?.word}"</span> sẽ bị gỡ bỏ. <br/> Bạn chắc chắn chứ?
                </p>
              </div>
              
              {/* Nút bấm: Đồng bộ size 12px, font-black và màu sắc xám ấm/đỏ coral */}
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-4 px-2 rounded-[1.25rem] bg-[#f4f2f3] text-[#5a434d] font-black text-[12px] uppercase tracking-wider hover:bg-[#ece8ea] hover:text-[#181114] transition-all duration-200 active:scale-95 border border-[#e8e4e6]"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-4 px-2 rounded-[1.25rem] bg-[#e53e3e] text-white font-black text-[12px] uppercase tracking-wider hover:bg-[#c53030] shadow-xl shadow-red-100 hover:shadow-red-200 transition-all active:scale-95"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- GRID CARDS --- */}
        {loading ? (
          <div className="py-20 text-center text-[#886373] font-bold">Đang tải dữ liệu...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredVocab.map((item) => (
              <div key={item.vocabID} className="group relative bg-white rounded-[2.5rem] border border-[#f4f0f2] shadow-sm hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col aspect-[3/4.2] overflow-hidden">
                
                {/* Actions Overlay: Trượt từ dưới lên, nằm đè lên nội dung */}
                <div className="absolute inset-x-0 bottom-6 flex justify-center gap-4 translate-y-20 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 z-50">
                  <Link 
                    to={`/admin/resource/vocabulary/edit/${item.vocabID}`} 
                    className="size-12 rounded-full bg-white shadow-2xl border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:text-primary hover:border-primary transition-all active:scale-90 no-underline"
                  >
                    <span className="material-symbols-outlined text-2xl">edit</span>
                  </Link>
                  <button 
                    onClick={() => setDeleteId(item.vocabID)} 
                    className="size-12 rounded-full bg-white shadow-2xl border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:text-red-500 hover:border-red-200 transition-all active:scale-90"
                  >
                    <span className="material-symbols-outlined text-2xl">delete</span>
                  </button>
                </div>

                <div className="p-7 flex-1 flex flex-col items-center text-center">
                  {/* Header: Level & Topic nhỏ gọn */}
                  <div className="w-full flex justify-between items-center mb-6">
                    <span className={`px-2 py-0.5 text-[15px] font-bold rounded border ${getLevelStyle(item.levelName)}`}>
                      {item.levelName || 'N/A'}
                    </span>
                    <span className="text-[#886373]/50 text-[10px] font-bold italic truncate max-w-20">
                      #{item.topicName || 'General'}
                    </span>
                  </div>

                  {/* Word Content: Chữ siêu to cố định (Bỏ hover scale) */}
                  <div className="flex flex-col items-center mb-5">
                    <span className="text-primary text-[15px] font-japanese mb-1 font-bold italic tracking-wide">
                      {item.reading}
                    </span>
                    <span className="font-japanese text-[42px] font-black text-[#181114] tracking-tighter transition-colors duration-300">
                      {item.word}
                    </span>
                  </div>

                  <div className="w-12 h-1.5 bg-primary/10 rounded-full mb-6"></div>

                  {/* Meaning: Chữ lớn (16px) cố định */}
                  <div className="flex-1 flex items-start justify-center px-2">
                    <p className="text-[16px] font-bold text-[#5a434d] leading-relaxed line-clamp-3 italic">
                      "{item.meaning}"
                    </p>
                  </div>
                  
                  {/* Khoảng trống cố định để Overlay không che mất chữ quan trọng */}
                  <div className="h-10"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabularyListPage;