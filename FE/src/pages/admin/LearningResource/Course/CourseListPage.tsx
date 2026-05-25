import React, { useEffect, useState, useMemo } from 'react';
import AdminHeader from '../../../../components/layout/admin/AdminHeader';
import { Link } from 'react-router-dom';
import { courseService } from '../../../../services/Admin/courseService';
import { CourseDTO } from '../../../../interfaces/Admin/Course';

const CourseListPage: React.FC = () => {
  const [courseList, setCourseList] = useState<CourseDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const courseToDelete = courseList.find((c) => c.courseID === deleteId);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [levels, setLevels] = useState<{ id: string; name: string }[]>([]);

  const filteredCourses = useMemo(() => {
    return courseList.filter((item: any) => {
      const s = searchTerm.toLowerCase();

      const matchesSearch =
        !searchTerm ||
        item.courseName?.toLowerCase().includes(s) ||
        item.description?.toLowerCase().includes(s);

      const matchesLevel =
        selectedLevels.length === 0 || selectedLevels.includes(item.levelName);

      return matchesSearch && matchesLevel;
    });
  }, [courseList, searchTerm, selectedLevels]);

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);

        const courses = await courseService.getAll();
        setCourseList(courses);

        try {
          const allLevels = await courseService.getLevels();
          setLevels(allLevels);
        } catch (levelError) {
          console.error('Lỗi load levels:', levelError);
          setLevels([]);
        }
      } catch (error) {
        console.error('Lỗi load courses:', error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await courseService.delete(deleteId);
      setCourseList((prev) => prev.filter((c) => c.courseID !== deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error('Lỗi xóa khóa học:', error);
      alert('Xóa thất bại! Khóa học này có thể đang được sử dụng.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-light font-['Lexend',sans-serif] text-[#181114]">
      <AdminHeader>
        <div className="flex items-center justify-between w-full gap-4">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-[#181114] uppercase">
              Quản lý khóa học
            </h2>
            <nav className="flex text-[10px] text-[#886373] font-medium gap-1 uppercase tracking-wider">
              <span>Nội dung</span>
              <span>/</span>
              <span className="text-primary font-bold">Khóa học</span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#886373]">
                search
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm khóa học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#f4f0f2] border-none rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary/50 text-[#181114] outline-none"
              />
            </div>

            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all active:scale-95 ${
                showFilter
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white border border-[#f4f0f2] text-[#886373] hover:bg-[#f4f0f2]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                filter_list
              </span>
              Bộ lọc
            </button>

            <Link
              to="/admin/resource/course/create"
              className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95 no-underline"
            >
              <span className="material-symbols-outlined text-sm">school</span>
              Thêm khóa học
            </Link>
          </div>
        </div>
      </AdminHeader>

      {deleteId && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-[#181114]/40 backdrop-blur-md animate-in fade-in duration-500"
            onClick={() => setDeleteId(null)}
          />

          <div className="relative bg-white rounded-[3rem] p-10 max-w-105 w-full shadow-[0_40px_100px_-20px_rgba(24,11,20,0.3)] border border-white/50 animate-in zoom-in-95 duration-300">
            <div className="relative size-32 rounded-[2.5rem] bg-linear-to-br from-[#fff1f2] to-[#ffe4e6] flex flex-col items-center justify-center text-[#e11d48] mb-8 mx-auto shadow-[inset_0_4px_12px_rgba(225,29,72,0.1)] border-4 border-white rotate-3">
              <span className="material-symbols-outlined text-5xl drop-shadow-sm scale-110">
                school
              </span>
              <div className="absolute -bottom-2 -right-2 size-11 rounded-full bg-[#e11d48] text-white flex items-center justify-center shadow-lg border-4 border-white -rotate-3">
                <span className="material-symbols-outlined text-[20px] font-bold">
                  delete_forever
                </span>
              </div>
            </div>

            <div className="text-center mb-10">
              <h3 className="text-[24px] font-black text-[#181114] mb-3 tracking-tight">
                Xóa khóa học?
              </h3>
              <p className="text-[#886373] text-sm leading-relaxed px-4">
                Khóa học{' '}
                <span className="inline-block mt-2 font-bold text-[#e11d48] bg-[#fff1f2] px-3 py-1 rounded-xl italic">
                  "{courseToDelete?.courseName}"
                </span>
                <br />
                sẽ bị gỡ khỏi hệ thống và các bài học liên quan.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-4 px-2 rounded-[1.25rem] bg-[#f4f2f3] text-[#5a434d] font-black text-[12px] uppercase tracking-wider hover:bg-[#ece8ea] hover:text-[#181114] transition-all duration-200 active:scale-95 border border-[#e8e4e6]"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-4 px-2 rounded-[1.25rem] bg-[#e53e3e] text-white font-black text-[12px] uppercase tracking-wider hover:bg-[#c53030] shadow-xl shadow-red-100 hover:shadow-red-200 transition-all active:scale-95"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden p-8">
        <div className="bg-white rounded-2xl border border-[#f4f0f2] shadow-sm overflow-hidden flex flex-col h-full">
          {showFilter && (
            <div className="p-6 border-b border-[#f4f0f2] bg-[#fbf9fa]">
              <div className="space-y-3">
                <label className="block text-sm font-bold text-[#181114]">
                  Cấp độ
                </label>

                <div className="flex flex-wrap gap-2">
                  {levels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() =>
                        setSelectedLevels((prev) =>
                          prev.includes(level.name)
                            ? prev.filter((l) => l !== level.name)
                            : [...prev, level.name]
                        )
                      }
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
                        selectedLevels.includes(level.name)
                          ? 'bg-primary text-white shadow-md shadow-primary/20'
                          : 'bg-white border border-[#f4f0f2] text-[#886373] hover:bg-[#f4f0f2]'
                      }`}
                    >
                      {level.name}
                    </button>
                  ))}

                  {selectedLevels.length > 0 && (
                    <button
                      onClick={() => setSelectedLevels([])}
                      className="px-4 py-2 rounded-full text-xs font-bold bg-[#fff1f2] text-[#e11d48] hover:bg-[#ffe4e6] transition-all"
                    >
                      Xóa lọc
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="overflow-hidden flex-1 no-scrollbar">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="h-15">
                <tr className="bg-[rgb(251,249,250)] border-b border-[#f4f0f2]">
                  <th className="w-[40%] px-8 py-4 text-left text-sm font-bold text-[#886373] uppercase tracking-wider">
                    Khóa học
                  </th>
                  <th className="w-[18%] px-8 py-4 text-center text-sm font-bold text-[#886373] uppercase tracking-wider">
                    Cấp độ
                  </th>
                  <th className="w-[22%] px-8 py-4 text-center text-sm font-bold text-[#886373] uppercase tracking-wider">
                    Số bài học
                  </th>
                  <th className="w-[20%] px-8 py-4 text-right text-sm font-bold text-[#886373] uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f4f0f2]">
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-10 text-sm text-slate-400"
                    >
                      Đang tải danh sách khóa học...
                    </td>
                  </tr>
                ) : filteredCourses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-10 text-sm text-slate-400"
                    >
                      Không tìm thấy khóa học nào.
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((course) => (
                    <tr
                      key={course.courseID}
                      className="hover:bg-primary/5 transition-colors h-24"
                    >
                      <td className="px-8 py-5 text-sm text-[#181114]">
                        <div className="flex items-center gap-3">
                          <div className="size-10 shrink-0 rounded-xl bg-[#fcf9fa] border border-[#f4f0f2] flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[22px]">
                              school
                            </span>
                          </div>

                          <div className="flex flex-col gap-0.5 overflow-hidden">
                            <span className="font-bold text-[15px] text-[#181114] truncate">
                              {course.courseName}
                            </span>
                            <span className="text-[#886373] text-xs italic truncate">
                              {course.description || 'Không có mô tả'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-5 text-center">
                        <span className="inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-black">
                          {course.levelName}
                        </span>
                      </td>

                      <td className="px-8 py-5 text-center">
                        <div className="inline-flex items-center px-3 py-1.5 bg-[#f8fafc] text-[#475569] rounded-lg border border-[#e2e8f0] font-bold text-[12px]">
                          <span className="material-symbols-outlined text-[16px] mr-1.5 text-primary">
                            library_books
                          </span>
                          {course.lessonCount ?? 0} bài học
                        </div>
                      </td>

                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/resource/course/edit/${course.courseID}`}
                            className="p-2 hover:bg-[#f4f0f2] rounded-lg text-[#886373] border border-[#f4f0f2]"
                          >
                            <span className="material-symbols-outlined text-lg">
                              edit
                            </span>
                          </Link>

                          <button
                            onClick={() => setDeleteId(course.courseID)}
                            className="p-2 hover:bg-[#f4f0f2] rounded-lg text-[#886373] border border-[#f4f0f2] hover:text-red-500"
                          >
                            <span className="material-symbols-outlined text-lg">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-[#f4f0f2] flex items-center justify-between bg-white h-20">
            <p className="text-xs text-[#886373] font-medium">
              Hiển thị{' '}
              <span className="text-[#181114]">{filteredCourses.length}</span>{' '}
              khóa học
            </p>

            <div className="text-xs text-[#886373] font-medium">
              Tổng cộng:{' '}
              <span className="font-bold text-[#181114]">
                {courseList.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseListPage;