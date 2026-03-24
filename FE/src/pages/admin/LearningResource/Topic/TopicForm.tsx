import React, { useState, useEffect } from 'react';
import AdminHeader from '../../../../components/layout/admin/AdminHeader';
import { useParams, useNavigate } from 'react-router-dom';
import { topicService } from '../../../../services/Admin/topicService';
import { CreateUpdateTopicDTO } from '../../../../interfaces/Admin/Topic';

const TopicEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState<boolean>(false);

  // 1. Khởi tạo State (Không set cứng ID, để trống để người dùng chọn)
  const [formData, setFormData] = useState<CreateUpdateTopicDTO>({
    topicName: '',
    description: ''
  });

  // 2. Hàm tải dữ liệu cũ để Sửa (Edit Mode)
  useEffect(() => {
    const loadTopicDetail = async () => {
        if (isEditMode && id) {
            try {
                const data = await topicService.getById(id);
                setFormData({
                    topicName: data.topicName || '',
                    description: data.description || ''
                });
            } catch (error) {
                console.error("Lỗi khi tải chi tiết topic:", error);
            }
        }
    };
    loadTopicDetail();
}, [id, isEditMode]);

// 3. Hàm Lưu dữ liệu
const handleSave = async () => {
    if (!formData.topicName.trim()) {
        alert("Vui lòng nhập tên chủ đề!");
        return;
    }

    // Tạo payload chuẩn theo CreateUpdateTopicDTO
    const payload: CreateUpdateTopicDTO = {
        topicName: formData.topicName.trim(),
        description: formData.description.trim()
    };

    try {
        setLoading(true);
        if (isEditMode && id) {
            await topicService.update(id, payload);
            alert("Cập nhật chủ đề thành công!");
        } else {
            await topicService.create(payload);
            alert("Thêm mới chủ đề thành công!");
        }
        navigate("/admin/resource/topic");
    } catch (error: any) {
        // Xử lý lỗi như bài trước mình đã hướng dẫn
        alert("Lưu thất bại!");
    } finally {
        setLoading(false);
    }
  };

  return (
    /* Đổi flex-row thành flex-col để Header nằm trên cùng */
    <div className="flex flex-col h-screen bg-background-light font-['Lexend',sans-serif] text-slate-900">
      
      {/* Header section - Nằm ở top */}
      <AdminHeader>
          <div className={isEditMode ? 'flex items-center w-full gap-258' : 'flex items-center w-full gap-267.5'}>
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={() => navigate(-1)}
                    className="size-10 rounded-full border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:bg-[#f4f0f2] transition-colors active:scale-90"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex flex-col text-left">
                    <h2 className="text-xl font-bold text-[#181114] uppercase">
                        {isEditMode ? 'Chỉnh sửa chủ đề' : 'Thêm chủ đề'}
                    </h2>
                    <nav className="flex text-[10px] text-[#886373] font-medium gap-1 uppercase tracking-wider">
                        <span>Quản lý</span>
                        <span>/</span>
                        <span className="text-primary font-bold">
                            {isEditMode ? 'Chỉnh sửa' : 'Thêm mới'}
                        </span>
                    </nav>
                </div>
            </div>

            {/* Phần Header - Nút Lưu */}
            <div className="flex items-center gap-3">
                <button 
                    type="button" // Đảm bảo có type="button"
                    onClick={handleSave} // BỎ DẤU COMMENT Ở ĐÂY
                    className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95 no-underline"
                >
                    <span className="material-symbols-outlined text-sm">save</span>
                    {isEditMode ? 'Cập nhật' : 'Lưu bài đọc'}
                </button>
            </div>
        </div>
      </AdminHeader>
      
      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-8">
    
        {/* Form chính - Trải dài hết chiều ngang */}
        <div className="space-y-6 text-left">
            <section className="bg-white p-10 rounded-2xl border border-[#f4f0f2] shadow-sm">
                <h3 className="text-lg font-bold mb-8 flex items-center gap-2 text-[#181114]">
                    <span className="material-symbols-outlined text-primary">info</span>
                    Thông tin chi tiết
                </h3>

                {/* Hàng ngang chia 40/60 */}
                <div className="flex flex-row gap-10">
                    {/* Cột Tên Chủ đề (40%) */}
                    <div className="w-[40%] space-y-2">
                        <label className="block text-sm font-bold text-[#886373] uppercase tracking-wider">
                            Tên chủ đề <span className="text-red-500">*</span>
                        </label>
                        <input
                            className="w-full rounded-xl border-[#f4f0f2] focus:ring-primary focus:border-primary px-5 py-4 outline-none border transition-all text-[16px] font-medium bg-[#fbf9fa] focus:bg-white"
                            placeholder="e.g., Công việc, Gia đình..."
                            type="text"
                            value={formData.topicName}
                            onChange={(e) => setFormData({ ...formData, topicName: e.target.value })}
                        />
                        <p className="text-[12px] text-[#b399a4] italic">Tên chủ đề nên ngắn gọn, dễ hiểu.</p>
                    </div>

                    {/* Cột Mô tả Chủ đề (60%) */}
                    <div className="w-[60%] space-y-2">
                        <label className="block text-sm font-bold text-[#886373] uppercase tracking-wider">
                            Mô tả chi tiết
                        </label>
                        <textarea
                            rows={5}
                            className="w-full rounded-xl border-[#f4f0f2] focus:ring-primary focus:border-primary px-5 py-4 outline-none border transition-all text-[15px] resize-none bg-[#fbf9fa] focus:bg-white"
                            placeholder="Mô tả mục tiêu hoặc nội dung của chủ đề này..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>
            </section>
        </div>
      </div>
    </div>
  );
};

// Các Sub-components hỗ trợ
const ToolbarButton: React.FC<{ icon: string; active?: boolean }> = ({ icon, active }) => (
  <button className={`p-1 px-2 border-r last:border-0 ${active ? 'bg-[#f287b6] text-white' : 'bg-slate-50 text-slate-600'}`}>
    <span className="material-symbols-outlined text-sm">{icon}</span>
  </button>
);

const Tag: React.FC<{ label: string }> = ({ label }) => (
  <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600 flex items-center gap-1">
    {label} <button className="hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-xs">close</span></button>
  </span>
);

export default TopicEditor;