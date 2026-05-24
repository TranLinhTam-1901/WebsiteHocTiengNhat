import React from 'react';

import { Link } from "react-router-dom";
const JQuizLanding: React.FC = () => {
  return (
    <div className="bg-white font-display text-[#181114]">
      <div className="relative flex min-h-screen flex-col overflow-x-hidden">
        
        {/* HEADER */}
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 bg-white/80 backdrop-blur-md border-b border-[#f4f0f2]">
          <div className="flex items-center gap-2">
            <div className="size-8 text-primary">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M42.1739 20.1739L27.8261 5.82609C29.1366 7.13663 28.3989 10.1876 26.2002 13.7654C24.8538 15.9564 22.9595 18.3449 20.6522 20.6522C18.3449 22.9595 15.9564 24.8538 13.7654 26.2002C10.1876 28.3989 7.13663 29.1366 5.82609 27.8261L20.1739 42.1739C21.4845 43.4845 24.5355 42.7467 28.1133 40.548C30.3042 39.2016 32.6927 37.3073 35 35C37.3073 32.6927 39.2016 30.3042 40.548 28.1133C42.7467 24.5355 43.4845 21.4845 42.1739 20.1739Z" fill="currentColor"></path>
                <path fillRule="evenodd" clipRule="evenodd" d="M7.24189 26.4066C7.31369 26.4411 7.64204 26.5637 8.52504 26.3738C9.59462 26.1438 11.0343 25.5311 12.7183 24.4963C14.7583 23.2426 17.0256 21.4503 19.238 19.238C21.4503 17.0256 23.2426 14.7583 24.4963 12.7183C25.5311 11.0343 26.1438 9.59463 26.3738 8.52504C26.5637 7.64204 26.4411 7.31369 26.4066 7.24189C26.345 7.21246 26.143 7.14535 25.6664 7.1918C24.9745 7.25925 23.9954 7.5498 22.7699 8.14278C20.3369 9.32007 17.3369 11.4915 14.4142 14.4142C11.4915 17.3369 9.32007 20.3369 8.14278 22.7699C7.5498 23.9954 7.25925 24.9745 7.1918 25.6664C7.14534 26.143 7.21246 26.345 7.24189 26.4066ZM29.9001 10.7285C29.4519 12.0322 28.7617 13.4172 27.9042 14.8126C26.465 17.1544 24.4686 19.6641 22.0664 22.0664C19.6641 24.4686 17.1544 26.465 14.8126 27.9042C13.4172 28.7617 12.0322 29.4519 10.7285 29.9001L21.5754 40.747C21.6001 40.7606 21.8995 40.931 22.8729 40.7217C23.9424 40.4916 25.3821 39.879 27.0661 38.8441C29.1062 37.5904 31.3734 35.7982 33.5858 33.5858C35.7982 31.3734 37.5904 29.1062 38.8441 27.0661C39.879 25.3821 40.4916 23.9425 40.7216 22.8729C40.931 21.8995 40.7606 21.6001 40.747 21.5754L29.9001 10.7285ZM29.2403 4.41187L43.5881 18.7597C44.9757 20.1473 44.9743 22.1235 44.6322 23.7139C44.2714 25.3919 43.4158 27.2666 42.252 29.1604C40.8128 31.5022 38.8165 34.012 36.4142 36.4142C34.012 38.8165 31.5022 40.8128 29.1604 42.252C27.2666 43.4158 25.3919 44.2714 23.7139 44.6322C22.1235 44.9743 20.1473 44.9757 18.7597 43.5881L4.41187 29.2403C3.29027 28.1187 3.08209 26.5973 3.21067 25.2783C3.34099 23.9415 3.8369 22.4852 4.54214 21.0277C5.96129 18.0948 8.43335 14.7382 11.5858 11.5858C14.7382 8.43335 18.0948 5.9613 21.0277 4.54214C22.4852 3.8369 23.9415 3.34099 25.2783 3.21067C26.5973 3.08209 28.1133 3.29028 29.2403 4.41187Z" fill="currentColor"></path>
              </svg>
            </div>
            {/* Logo: J đậm, Quiz thường */}
            <h2 className="text-xl tracking-tight">
              <span className="font-bold">JQuiz</span>
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a className="text-sm font-medium hover:text-primary transition-colors" href="#">Khóa học</a>
            <a className="text-sm font-medium hover:text-primary transition-colors" href="#">Cộng đồng</a>
            <a className="text-sm font-medium hover:text-primary transition-colors" href="#">Bảng giá</a>
            
            <Link
              to="/login"
              className="bg-primary hover:bg-[#e07198] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-primary/20">
              Bắt đầu miễn phí
            </Link>
          </div>
        </header>

        <main className="grow pt-16">
          {/* HERO SECTION */}
          <section className="relative min-h-[90vh] flex items-center overflow-hidden">
            <div className="absolute inset-0 z-0">
              <div 
                className="absolute inset-0 bg-cover bg-center" 
                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBeJt_Vz3_wUaqYa2iTgTGLQQe796qNJiZ9xOh58qKpXPF3CQCcWW7HXQHRxpkGTGGWtH9h9-S8vPFWfXQoLmOvcxcWAXYmkZcb-lMJ9BHthtmEXtp1HCjt34i-mpgX1mNvTlqL5IkGyvJeplPjzvv3jKu00edvoHJZ_CNZvXPoNgq_W7cnmNfng4yxQg3RG17QaUco3S0rN92FcL0RSDoGbfMgaMakAqZrTt0Atj5n98w-k86J0_6avwh30mgJ7p6DTK_eHRc0kDKL")' }}
              ></div>
              <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/40 to-transparent"></div>
            </div>
            <div className="container mx-auto px-6 relative z-10">
              <div className="max-w-2xl text-white">
                <span className="inline-block px-4 py-1.5 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full text-primary font-bold text-sm mb-6">
                  Luyện JLPT cùng AI
                </span>
                <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
                  Chinh phục tiếng Nhật <br/>cùng AI
                </h1>
                <p className="text-xl md:text-2xl font-light opacity-90 mb-10 leading-relaxed max-w-xl">
                  Lộ trình cá nhân từ N5 đến N3. Trắc nghiệm tương tác, lộ trình thông minh và phản hồi AI theo thời gian thực.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="bg-primary hover:bg-[#e07198] text-white px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-2">
                    Bắt đầu miễn phí <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                  <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 px-8 py-4 rounded-xl text-lg font-bold transition-all">
                    Xem demo
                  </button>
                </div>
                <div className="mt-12 flex items-center gap-4 text-sm opacity-80">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200"></div>
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300"></div>
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-400"></div>
                  </div>
                  <p>Hơn 50.000 học viên đang học tích cực</p>
                </div>
              </div>
            </div>
          </section>

          {/* WHY CHOOSE SECTION */}
          <section className="py-24 bg-background-light">
            <div className="container mx-auto px-6">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Vì sao chọn JQuiz?</h2>
                <p className="text-[#886370] text-lg">Kết hợp AI hiện đại với phương pháp học ngôn ngữ đã được kiểm chứng để rút ngắn thời gian ôn JLPT.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                <FeatureCard icon="map" title="Lộ trình cá nhân hóa (AI)" desc="AI phân tích kết quả của bạn để dựng lộ trình học riêng, bám sát điểm mạnh và điểm yếu." />
                <FeatureCard icon="school" title="Ôn JLPT N5–N3" desc="Nội dung chọn lọc cho N5 đến N3: hán tự, ngữ pháp và nghe hiểu." />
                <FeatureCard icon="query_stats" title="Theo dõi tiến độ tức thì" desc="Theo dõi trình độ qua thống kê chi tiết và chuỗi ngày học để giữ động lực." />
              </div>
            </div>
          </section>

          {/* TESTIMONIALS SECTION */}
          <section className="py-24 bg-white overflow-hidden">
            <div className="container mx-auto px-6">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div>
                  <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-8">
                    Được hàng nghìn người học ngoại ngữ yêu thích.
                  </h2>
                  <div className="space-y-6">
                    <TestimonialCard avatar="Sarah" author="Sarah J." role="Sinh viên" text="Phản hồi AI về lỗi ngữ pháp đã thay đổi cách tôi học. Tôi đỗ N4 khá nhẹ nhàng!" />
                    <TestimonialCard avatar="Marcus" author="Marcus K." role="Đi làm" text="JQuiz khiến luyện hán tự thú vị hơn. Lộ trình giúp tôi tập trung mỗi ngày." />
                  </div>
                </div>
                <div className="relative hidden lg:block">
                  <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-40 h-40 text-primary/30"
                        fill="currentColor"
                      >
                        <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zM11.5 9.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA SECTION - Đã căn chỉnh rộng như hình 2 */}
          <section className="py-28 bg-primary">
            <div className="container mx-auto px-6 text-center">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6">Sẵn sàng bắt đầu hành trình?</h2>
              <p className="text-white/90 text-xl mb-12 max-w-2xl mx-auto">Cùng hàng nghìn học viên chinh phục tiếng Nhật với sức mạnh AI ngay hôm nay.</p>
              <Link to="/register" className="bg-white text-primary px-12 py-5 rounded-2xl text-xl font-bold hover:shadow-2xl transition-all active:scale-95">
                Tạo tài khoản miễn phí
              </Link>
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer className="bg-white border-t border-[#f4f0f2] py-16">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
              <div className="col-span-2">
                <div className="flex items-center gap-2 mb-6">
                  <div className="size-6 text-primary">
                    <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                      <path d="M42.1739 20.1739L27.8261 5.82609C29.1366 7.13663 28.3989 10.1876 26.2002 13.7654C24.8538 15.9564 22.9595 18.3449 20.6522 20.6522C18.3449 22.9595 15.9564 24.8538 13.7654 26.2002C10.1876 28.3989 7.13663 29.1366 5.82609 27.8261L20.1739 42.1739C21.4845 43.4845 24.5355 42.7467 28.1133 40.548C30.3042 39.2016 32.6927 37.3073 35 35C37.3073 32.6927 39.2016 30.3042 40.548 28.1133C42.7467 24.5355 43.4845 21.4845 42.1739 20.1739Z" fill="currentColor"></path>
                    </svg>
                  </div>
                  <span className="text-xl tracking-tight">
                    <span className="font-bold">JQuiz</span>
                  </span>
                </div>
                <p className="text-[#886370] max-w-sm">Đưa việc học tiếng Nhật đến gần hơn — thông minh và hiệu quả cho mọi người.</p>
              </div>
              <FooterColumn title="Sản phẩm" links={['Chương trình', 'Tính năng AI', 'Bảng giá']} />
              <FooterColumn title="Pháp lý" links={['Chính sách bảo mật', 'Điều khoản dịch vụ', 'Chính sách cookie']} />
            </div>
            <div className="pt-8 border-t border-[#f4f0f2] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#886370]">
              <p>© 2024 JQuiz AI. Bảo lưu mọi quyền.</p>
              <div className="flex gap-6">
                <a className="hover:text-primary transition-colors" href="#">Twitter</a>
                <a className="hover:text-primary transition-colors" href="#">Discord</a>
                <a className="hover:text-primary transition-colors" href="#">Instagram</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

// Sub-components
const FeatureCard = ({ icon, title, desc }: { icon: string; title: string; desc: string }) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#f4f0f2] hover:shadow-xl transition-all hover:-translate-y-1 group">
    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
      <span className="material-symbols-outlined text-3xl">{icon}</span>
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-[#886370] leading-relaxed">{desc}</p>
  </div>
);

const TestimonialCard = ({ avatar, author, role, text }: { avatar: string; author: string; role: string; text: string }) => (
  <div className="flex gap-4 items-start p-6 bg-background-light rounded-2xl border border-white shadow-sm transition-all hover:shadow-md">
    <div className="shrink-0">
      <img 
        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatar}`} 
        className="w-12 h-12 rounded-full bg-gray-200" 
        alt={author}
      />
    </div>
    <div>
      <div className="flex text-[#FFD700] mb-2 font-bold">★★★★★</div>
      <p className="text-[#181114] italic mb-2 leading-relaxed">"{text}"</p>
      <p className="text-sm font-bold text-primary">— {author}, {role}</p>
    </div>
  </div>
);

const FooterColumn = ({ title, links }: { title: string; links: string[] }) => (
  <div>
    <h4 className="font-bold mb-6 text-2xs text-[#181114]">{title}</h4>
    <ul className="space-y-4 text-sm text-[#886370]">
      {links.map((link) => (
        <li key={link}><a className="hover:text-primary transition-colors" href="#">{link}</a></li>
      ))}
    </ul>
  </div>
);

export default JQuizLanding;