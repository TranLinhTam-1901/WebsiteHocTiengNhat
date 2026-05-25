import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import courseService, { CoursePublic } from '../../services/courseService';
import CourseCard from '../../components/common/CourseCard';

const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CoursePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  // Get unique levels from courses
  const levels = Array.from(
    new Map(courses.map(c => [c.levelID, { id: c.levelID, name: c.levelName }])).values()
  ).sort((a, b) => {
    // Sort N5, N4, N3, N2, N1
    const orderMap: { [key: string]: number } = {
      N5: 1,
      N4: 2,
      N3: 3,
      N2: 4,
      N1: 5,
    };
    return (orderMap[a.name] || 99) - (orderMap[b.name] || 99);
  });

  // Filter courses by selected level
  const filteredCourses = selectedLevel
    ? courses.filter(c => c.levelID === selectedLevel)
    : courses;

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await courseService.getAllCoursesPublic();
      setCourses(data);
    } catch (err) {
      setError('Không thể tải danh sách khóa học. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

    const handleCourseClick = (courseId: string) => {
    const redirectPath = `/learner/courses/${courseId}`;

    navigate(
        `/login?redirect=${encodeURIComponent(redirectPath)}`
    );
    };

  return (
    <div className="bg-white font-display text-[#181114] min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 bg-white/80 backdrop-blur-md border-b border-[#f4f0f2]">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="size-8 text-primary">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M42.1739 20.1739L27.8261 5.82609C29.1366 7.13663 28.3989 10.1876 26.2002 13.7654C24.8538 15.9564 22.9595 18.3449 20.6522 20.6522C18.3449 22.9595 15.9564 24.8538 13.7654 26.2002C10.1876 28.3989 7.13663 29.1366 5.82609 27.8261L20.1739 42.1739C21.4845 43.4845 24.5355 42.7467 28.1133 40.548C30.3042 39.2016 32.6927 37.3073 35 35C37.3073 32.6927 39.2016 30.3042 40.548 28.1133C42.7467 24.5355 43.4845 21.4845 42.1739 20.1739Z" fill="currentColor"></path>
            </svg>
          </div>
          <h2 className="text-xl tracking-tight">
            <span className="font-bold">JQuiz</span>
          </h2>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="bg-primary hover:bg-[#e07198] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all"
        >
          Đăng nhập
        </button>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-6">
          {/* Page Title */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Khóa học</h1>
            <p className="text-xl text-[#886370] max-w-2xl">
              Khám phá các khóa học ôn JLPT từ N5 đến N3 với nội dung được cộng tác viên giáo dục thiết kế.
            </p>
          </div>

          {/* Level Filter */}
          {levels.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-[#181114] mb-3">Lọc theo cấp độ:</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedLevel(null)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedLevel === null
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-[#f4f0f2] text-[#181114] hover:bg-primary/10'
                  }`}
                >
                  Tất cả
                </button>
                {levels.map(level => (
                  <button
                    key={level.id}
                    onClick={() => setSelectedLevel(level.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedLevel === level.id
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-[#f4f0f2] text-[#181114] hover:bg-primary/10'
                    }`}
                  >
                    {level.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/30 border-t-primary"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <p className="text-red-800 font-medium">{error}</p>
              <button
                onClick={fetchCourses}
                className="mt-2 text-red-600 hover:text-red-800 font-semibold text-sm underline"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Courses Grid */}
          {!loading && filteredCourses.length > 0 && (
            <div>
              <p className="text-[#886370] mb-6 font-medium">
                Hiển thị {filteredCourses.length} khóa học
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map(course => (
                  <CourseCard
                    key={course.courseID}
                    course={course}
                    onClickLearnMore={handleCourseClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredCourses.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-2xl font-bold mb-2">Chưa có khóa học</h3>
              <p className="text-[#886370]">
                {selectedLevel
                  ? 'Không tìm thấy khóa học cho cấp độ này.'
                  : 'Hệ thống hiện chưa có khóa học nào.'}
              </p>
            </div>
          )}

          {/* CTA Section */}
          <div className="mt-16 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Sẵn sàng bắt đầu?</h3>
            <p className="text-[#886370] mb-6 max-w-xl mx-auto">
              Đăng ký ngay để bắt đầu học tập với lộ trình AI được cá nhân hóa.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="bg-primary hover:bg-[#e07198] text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg"
            >
              Tạo tài khoản miễn phí
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#f4f0f2] py-8">
        <div className="container mx-auto px-6 text-center text-sm text-[#886370]">
          <p>© 2024 JQuiz AI. Bảo lưu mọi quyền.</p>
        </div>
      </footer>
    </div>
  );
};

export default CoursesPage;
