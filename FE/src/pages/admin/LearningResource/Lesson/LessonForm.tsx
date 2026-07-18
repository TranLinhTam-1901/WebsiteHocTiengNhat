import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminHeader from '../../../../components/layout/admin/AdminHeader';
import { lessonService } from '../../../../services/Admin/lessonService';
import { LessonDTO, CreateUpdateLessonDTO } from '../../../../interfaces/Admin/Lesson';

const LessonForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    courseID: '',
    title: '',
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);

        const allCourses = await lessonService.getCourses();
        setCourses(allCourses);

        if (id) {
          const lesson: LessonDTO = await lessonService.getById(id);

          setFormData({
            courseID: lesson.courseID,
            title: lesson.title,
          });
        }
      } catch (error) {
        console.error('Lỗi fetch dữ liệu:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.courseID) {
      alert('Vui lòng điền các trường bắt buộc.');
      return;
    }

    const payload: CreateUpdateLessonDTO = {
      courseID: formData.courseID,
      title: formData.title.trim(),
    };

    try {
      setLoading(true);

      if (id) {
        await lessonService.update(id, payload);
        alert('Cập nhật thành công!');
      } else {
        await lessonService.create(payload);
        alert('Thêm mới thành công!');
      }

      navigate('/admin/resource/lesson');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background-light font-['Lexend',sans-serif] text-[#181114]">
      <AdminHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="size-10 rounded-full border border-[#f4f0f2] flex items-center justify-center text-[#886373] hover:bg-[#f4f0f2] transition-colors active:scale-90"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>

            <div className="flex flex-col text-left">
              <h2 className="text-xl font-bold text-[#181114] uppercase">
                {id ? 'Chỉnh sửa bài học' : 'Thêm bài học'}
              </h2>

              <nav className="flex text-[10px] text-[#886373] font-medium gap-1 uppercase tracking-wider">
                <span>Quản lý</span>
                <span>/</span>
                <span className="text-primary font-bold">
                  {id ? 'Chỉnh sửa' : 'Thêm mới'}
                </span>
              </nav>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            {loading ? 'Đang lưu...' : id ? 'Cập nhật' : 'Lưu'}
          </button>
        </div>
      </AdminHeader>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="space-y-6 text-left">
          <section className="bg-white p-10 rounded-2xl border border-[#f4f0f2] shadow-sm">
            <h3 className="text-lg font-bold mb-8 flex items-center gap-2 text-[#181114]">
              <span className="material-symbols-outlined text-primary">
                info
              </span>
              Thông tin chi tiết
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#886373] uppercase tracking-wider">
                  Khóa học <span className="text-red-500">*</span>
                </label>

                <select
                  name="courseID"
                  value={formData.courseID}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border-[#f4f0f2] focus:ring-primary focus:border-primary px-5 py-4 outline-none border transition-all text-[16px] font-medium bg-[#fbf9fa] focus:bg-white"
                >
                  <option value="">Chọn khóa học...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>

                <p className="text-[12px] text-[#b399a4] italic">
                  Bài học sẽ được gắn vào khóa học đã chọn.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#886373] uppercase tracking-wider">
                  Tên bài học <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Nhập tên bài học..."
                  className="w-full rounded-xl border-[#f4f0f2] focus:ring-primary focus:border-primary px-5 py-4 outline-none border transition-all text-[16px] font-medium bg-[#fbf9fa] focus:bg-white"
                />

                <p className="text-[12px] text-[#b399a4] italic">
                  Tên bài học nên ngắn gọn và dễ hiểu với học viên.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-2xl border border-[#f4f0f2] shadow-sm">
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">sort</span>
              </div>

              <div>
                <h4 className="font-bold text-[#181114]">
                  Thứ tự hiển thị được tự động xử lý
                </h4>
                <p className="text-sm text-[#886373] mt-1 leading-relaxed">
                  Khi thêm mới bài học, hệ thống sẽ tự động đưa bài học xuống cuối
                  danh sách của khóa học. Admin không cần nhập thứ tự thủ công để
                  tránh bị trùng vị trí.
                </p>
              </div>
            </div>
          </section>

          {/* <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-full border border-[#f4f0f2] text-[#886373] font-bold text-sm hover:bg-[#f4f0f2] transition-all active:scale-95"
            >
              Hủy bỏ
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default LessonForm;