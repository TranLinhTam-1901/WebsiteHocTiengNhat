import React, { useEffect, useState } from 'react';
import { kanjiService } from '../../../../services/Admin/kanjiService';
import AdminHeader from '../../../../components/layout/admin/AdminHeader';
import { Link } from 'react-router-dom';
import { KanjiItem } from '../../../../interfaces/Admin/Kanji';

const KanjiListPage: React.FC = () => {
  const [kanjiList, setKanjiList] = useState<KanjiItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const kanjiToDelete = kanjiList.find(k => k.id === deleteId);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleDelete = async (id: string) => {
    try {
        await kanjiService.delete(id); // Giả sử service của bạn có hàm delete
        setKanjiList(prev => prev.filter(k => k.id !== id));
        setDeleteId(null);
        // Thêm thông báo thành công nếu muốn
    } catch (error) {
        console.error("Lỗi khi xóa:", error);
    }
  };

  const fetchKanjis = async () => {
    try {
      setLoading(true);
      const data = await kanjiService.getAll();
      
      // Ép kiểu 'as KanjiItem[]' để TypeScript bỏ qua việc so khớp khắt khe
      setKanjiList(data as KanjiItem[]); 
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKanjis(); }, []);

  const getLevelStyle = (level: string) => {
  switch (level) {
      case 'N5': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'N4': return 'bg-sky-50 text-sky-600 border-sky-100';
      case 'N3': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'N2': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'N1': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  const [selectedLevel, setSelectedLevel] = useState('Toàn bộ');
  const [strokeFilter, setStrokeFilter] = useState<number | 'all'>('all');

  // Logic lọc dữ liệu tổng hợp
  const filteredList = kanjiList.filter((kanji) => {
    const matchLevel =
      selectedLevel === 'Toàn bộ' || kanji.levelName === selectedLevel;

    const matchStroke =
      strokeFilter === 'all' || kanji.strokeCount === strokeFilter;

    const matchSearch =
      kanji.character?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kanji.meaning?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kanji.onyomi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kanji.kunyomi?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchLevel && matchStroke && matchSearch;
  });

  // 4. Hiển thị trạng thái Loading
  if (loading) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="flex flex-col h-full bg-background-light font-display text-[#181114]">
    <AdminHeader>
      <div className="flex items-center gap-120">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex flex-col">
              <h2 className="text-xl font-bold text-[#181114]">QUẢN LÝ KANJI</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#886373]">search</span>
              <input
                type="text"
                placeholder="Tìm kiếm kanji, nghĩa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#f4f0f2] border-none rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary/50 outline-none"
              />
            </div>

          {/* Add Button */}
          <Link 
            to="/admin/resource/kanji/create" // Thay đường dẫn này bằng route thực tế của bạn
            className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95 no-underline"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Thêm Kanji
          </Link>
        </div>

      </div>
    </AdminHeader>

      <div className="flex-1 overflow-y-auto p-8">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          {/* Thêm flex-1 để chiếm không gian trống, đẩy cụm sau ra xa */}
          <div className="flex flex-1 gap-2 overflow-x-auto pb-2 no-scrollbar">
            {/* Nút Toàn bộ */}
            <button 
                onClick={() => setSelectedLevel('Toàn bộ')}
                className={`px-5 py-2 text-[15px] font-bold rounded-full transition-all border shadow-sm ${
                    selectedLevel === 'Toàn bộ' 
                    ? 'bg-primary text-white border-primary shadow-primary/20' 
                    : 'bg-white text-[#886373] border-[#f4f0f2] hover:border-primary'
                }`}
            >
                Toàn bộ
            </button>

            {/* Các nút N5 -> N1 */}
            {['N5', 'N4', 'N3', 'N2', 'N1'].map((lv) => (
                <button 
                    key={lv} 
                    onClick={() => setSelectedLevel(lv)}
                    className={`px-5 py-2 text-xs font-bold rounded-full border transition-all ${
                        selectedLevel === lv 
                        ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' 
                        : 'bg-white text-[#886373] border-[#f4f0f2] hover:border-primary hover:text-primary'
                    }`}
                >
                    {lv}
                </button>
            ))}
          </div>

          {/* Cụm này sẽ tự động dạt về bên phải */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#fbf9fa] border border-[#f4f0f2] rounded-full px-4 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <span className="material-symbols-outlined text-[16px] text-[#886373] mr-2">draw</span>
              <input 
                type="number" 
                placeholder="Số nét"
                value={strokeFilter === 'all' ? '' : strokeFilter}
                onChange={(e) => setStrokeFilter(e.target.value ? parseInt(e.target.value) : 'all')}
                className="w-14 bg-transparent text-[15px] font-bold text-[#181114] outline-none no-spinner placeholder:text-[#886373]/50 placeholder:font-normal"
              />
            </div>

            {/* Nút Reset */}
            <button 
              onClick={() => { setSelectedLevel('Toàn bộ'); setStrokeFilter('all'); }}
              className="size-9 flex items-center justify-center bg-white text-[#886373] border border-[#f4f0f2] rounded-full hover:text-red-500 hover:border-red-200 transition-all active:scale-90 shadow-sm"
              title="Xóa lọc"
            >
              <span className="material-symbols-outlined text-[18px]">filter_list_off</span>
            </button>
          </div>
        </div>

        {/* POPUP ĐẶT Ở ĐÂY (Ngoài grid, ngoài card) */}
        {deleteId && (
          <div className="fixed inset-0 z-999 flex items-center justify-center p-6">
            {/* Overlay: Làm mờ hậu cảnh sâu hơn và mịn hơn */}
            <div 
              className="absolute inset-0 bg-[#181114]/30 backdrop-blur-sm animate-in fade-in duration-500" 
              onClick={() => setDeleteId(null)} 
            />
            
            {/* Modal Content */}
            <div className="relative bg-white rounded-[3rem] p-10 max-w-95 w-full shadow-[0_40px_100px_-20px_rgba(24,11,20,0.25)] border border-white/50 animate-in zoom-in-95 duration-300">
              
              {/* Vòng tròn hiển thị chữ Kanji: Mix màu Soft Rose và Soft Red */}
              <div className="relative size-28 rounded-full bg-linear-to-br from-[#fff5f5] to-[#fed7d7] flex flex-col items-center justify-center text-[#e53e3e] mb-8 mx-auto shadow-[inset_0_4px_12px_rgba(229,62,62,0.1)] border-4 border-white">
                <span className="text-5xl font-black font-japanese drop-shadow-sm">
                  {kanjiToDelete?.character}
                </span>
                
                {/* Badge Delete nhỏ nhắn, xinh xắn hơn */}
                <div className="absolute -bottom-1 -right-1 size-9 rounded-full bg-[#e53e3e] text-white flex items-center justify-center shadow-lg border-[3px] border-white">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </div>
              </div>
              
              {/* Văn bản: Sử dụng font-spacing và màu sắc trung tính */}
              <div className="text-center mb-10">
                <h3 className="text-[22px] font-black text-[#181114] mb-3 tracking-tight">Xác nhận xóa dữ liệu?</h3>
                <p className="text-[#886373] text-sm leading-relaxed px-2">
                  Mọi thông tin về chữ <span className="font-bold text-[#e53e3e] bg-[#fff5f5] px-2 py-0.5 rounded-md italic">"{kanjiToDelete?.character}"</span> sẽ bị xóa. Thao tác này không thể hoàn tác.
                </p>
              </div>
              
              {/* Nút bấm: Bo góc mạnh và hiệu ứng Hover mượt */}
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-4 px-2 rounded-[1.25rem] bg-[#f4f2f3] text-[#5a434d] font-black text-[12px] uppercase tracking-wider hover:bg-[#ece8ea] hover:text-[#181114]transition-all duration-200 active:scale-95 border border-[#e8e4e6]"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={() => handleDelete(deleteId)}
                  className="flex-1 py-4 px-2 rounded-[1.25rem] bg-[#e53e3e] text-white font-black text-[12px] uppercase tracking-wider hover:bg-[#c53030] shadow-xl shadow-red-100 hover:shadow-red-200 transition-all active:scale-95"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid hiển thị dữ liệu thật */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {filteredList.map((kanji) => (
            <div key={kanji.id} className="group relative bg-white rounded-4xl border border-[#f4f0f2] shadow-sm hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 transition-all duration-300 flex flex-col aspect-[3/4.5] overflow-hidden">
              
              {/* Actions Overlay */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-3 translate-x-14 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30">
                <Link to={`/admin/resource/kanji/edit/${kanji.id}`} className="size-12 rounded-full bg-white shadow-xl border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:text-primary hover:border-primary transition-all active:scale-90">
                  <span className="material-symbols-outlined text-xl">edit</span>
                </Link>
                <button 
                  onClick={() => setDeleteId(kanji.id)} 
                  className="size-12 rounded-full bg-white shadow-xl border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:text-red-500 hover:border-red-200 transition-all active:scale-90"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              </div>

              {/* Kanji Card Content */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <span className={`px-2 py-0.5 text-[15px] font-bold rounded border ${getLevelStyle(kanji.levelName)}`}>
                    {kanji.levelName}
                  </span>
                  <div className="text-[15px] text-[#886373] font-medium text-right">
                    Radical: <span className="font-japanese text-primary">{kanji.radical}</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center py-4">
                  <div className="flex flex-col items-center gap-1 mb-4">
                    <span className="text-[15px] text-[#886373] font-japanese tracking-tighter">{kanji.character}</span>
                    <span className="text-6xl font-japanese font-bold text-[#181114] group-hover:scale-105 transition-transform duration-500">
                      {kanji.character}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 w-full text-center">
                    <p className="text-xs font-japanese text-[#181114]">On: {kanji.onyomi}</p>
                    <p className="text-xs font-japanese text-[#181114]">Kun: {kanji.kunyomi}</p>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-[#f4f0f2] text-center">
                  <p className="text-sm font-bold text-[#181114]">{kanji.meaning}</p>
                </div>
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
};

export default KanjiListPage;