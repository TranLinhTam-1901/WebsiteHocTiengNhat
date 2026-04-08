import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ExamService from '../../../services/Admin/examService';
import { UpdateExamRequest } from '../../../interfaces/Admin/Exam';
import AdminHeader from '../../../components/layout/admin/AdminHeader';
import { toast } from 'react-hot-toast';
const EditExamPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // State quản lý form
    const [formData, setFormData] = useState<UpdateExamRequest>({
        title: '',
        duration: 0,
        passingScore: 0,
        minLanguageKnowledgeScore: 0,
        minReadingScore: 0,
        minListeningScore: 0,
        showResultImmediately: false
    });

    useEffect(() => {
        const loadExamData = async () => {
            if (id) {
                try {
                    const res = await ExamService.getExamDetails(id);
                    setFormData({
                        title: res.title,
                        duration: res.duration || 0,
                        passingScore: res.passingScore,
                        minLanguageKnowledgeScore: res.minScores?.language || 0,
                        minReadingScore: res.minScores?.reading || 0,
                        minListeningScore: res.minScores?.listening || 0,
                        showResultImmediately: res.showResultImmediately || false
                    });
                } catch (error) {
                    console.error("Lỗi khi tải dữ liệu đề thi:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        loadExamData();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSaving(true);
    try {
       
        await ExamService.updateExam(id, formData);
       
        toast.success('🚀 Đã cập nhật thông tin đề thi thành công!');
      
        setTimeout(() => navigate('/admin/exams'), 1500);
        
    } catch (error: any) {
        // Lấy message lỗi từ response giống bên Question
        const errorMsg = error.response?.data?.detail || 'Không thể cập nhật đề thi';
        console.error("Lỗi cập nhật:", error);
        toast.error('Lỗi: ' + errorMsg);
    } finally {
        setIsSaving(false);
    }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light">
                <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
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
                            <button onClick={() => navigate(-1)} className="size-10 rounded-full border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:bg-[#f4f0f2] transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                            <div className="flex flex-col">
                                <h2 className="text-xl font-bold text-[#181114] uppercase">Chỉnh sửa thông tin</h2>
                                <nav className="flex text-[10px] text-[#886373] font-medium gap-1 uppercase tracking-wider">
                                    <span>Quản lý</span> / <span>Chi tiết</span> / <span className="text-primary font-bold">Chỉnh sửa</span>
                                </nav>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => navigate(-1)}
                                className="px-6 py-2 rounded-full text-sm font-bold text-[#886373] hover:bg-[#f4f0f2] transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button 
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="bg-primary hover:bg-primary-dark text-white px-8 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                {isSaving ? 'Đang lưu...' : (
                                    <><span className="material-symbols-outlined text-sm">save</span> Lưu thay đổi</>
                                )}
                            </button>
                        </div>
                    </div>
                </AdminHeader>

                {/* --- Form Body --- */}
                <div className="flex-1 overflow-y-auto p-8">
                    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
                        
                        {/* Phần 1: Thông tin cơ bản */}
                        <div className="bg-white rounded-3xl border border-[#f4f0f2] shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-[#f4f0f2] bg-[#fbf9fa]">
                                <h3 className="text-sm font-bold text-[#181114] uppercase tracking-wider flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-lg">edit_note</span>
                                    Thông tin chung
                                </h3>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-[#886373] uppercase tracking-widest ml-1">Tiêu đề đề thi</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-[#fbf9fa] border border-[#f4f0f2] rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-[#181114]"
                                        value={formData.title}
                                        onChange={e => setFormData({...formData, title: e.target.value})}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-[#886373] uppercase tracking-widest ml-1">Thời gian (Phút)</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#886373] text-lg">schedule</span>
                                            <input 
                                                type="number"
                                                className="w-full bg-[#fbf9fa] border border-[#f4f0f2] rounded-2xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold"
                                                value={formData.duration}
                                                onChange={e => setFormData({...formData, duration: Number(e.target.value)})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-[#886373] uppercase tracking-widest ml-1">Điểm đạt tối thiểu</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 text-lg">military_tech</span>
                                            <input 
                                                type="number"
                                                className="w-full bg-[#fbf9fa] border border-[#f4f0f2] rounded-2xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold"
                                                value={formData.passingScore}
                                                onChange={e => setFormData({...formData, passingScore: Number(e.target.value)})}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Phần 2: Điểm liệt & Hiển thị */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-white rounded-3xl border border-[#f4f0f2] shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-[#f4f0f2] bg-[#fbf9fa]">
                                    <h3 className="text-sm font-bold text-[#181114] uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-lg">rule</span>
                                        Cấu hình điểm liệt
                                    </h3>
                                </div>
                                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { label: "Kiến thức", field: "minLanguageKnowledgeScore", icon: "translate" },
                                        { label: "Đọc hiểu", field: "minReadingScore", icon: "menu_book" },
                                        { label: "Nghe hiểu", field: "minListeningScore", icon: "headset" }
                                    ].map((item) => (
                                        <div key={item.field} className="space-y-2">
                                            <label className="text-[10px] font-bold text-[#886373] uppercase text-center block">{item.label}</label>
                                            <input 
                                                type="number"
                                                className="w-full bg-[#fbf9fa] border border-[#f4f0f2] rounded-xl py-3 text-center focus:ring-2 focus:ring-primary/20 outline-none font-black text-primary"
                                                value={(formData as any)[item.field]}
                                                onChange={e => setFormData({...formData, [item.field]: Number(e.target.value)})}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl border border-[#f4f0f2] shadow-sm p-8 flex flex-col justify-center items-center text-center space-y-4">
                                <div className={`size-14 rounded-2xl flex items-center justify-center transition-colors ${formData.showResultImmediately ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                                    <span className="material-symbols-outlined text-3xl">visibility</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#181114]">Xem kết quả ngay</h4>
                                    <p className="text-[11px] text-[#886373] mt-1">Cho phép người học xem đáp án sau khi nộp bài</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setFormData({...formData, showResultImmediately: !formData.showResultImmediately})}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${formData.showResultImmediately ? 'bg-primary' : 'bg-slate-200'}`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formData.showResultImmediately ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>

                        {/* Lưu ý bảo mật */}
                        <div className="flex items-center gap-4 p-5 bg-amber-50 rounded-2xl border border-amber-100">
                             <span className="material-symbols-outlined text-amber-600">info</span>
                             <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                <b>Lưu ý:</b> Việc thay đổi tiêu đề và thời gian sẽ được cập nhật ngay lập tức. Nếu đề thi đã có người tham gia, hãy cân nhắc kỹ việc sửa đổi <b>Điểm đạt</b> và <b>Điểm liệt</b> để tránh làm sai lệch kết quả xếp hạng.
                             </p>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default EditExamPage;