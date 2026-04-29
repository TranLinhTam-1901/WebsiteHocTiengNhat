# AI Learning Platform Roadmap

Mục tiêu: xây dựng một nền tảng học tiếng Nhật có thể hiển thị bài học và bài luyện tập theo hai luồng (khóa học và kỹ năng), cho phép người dùng làm thật và lưu dữ liệu thực tế, sau đó sử dụng AI phân tích dữ liệu để đề xuất lộ trình.

## Tổng quan 3 giai đoạn

### Giai đoạn 1: Tạo tiền đề dữ liệu
Mục tiêu: chuẩn bị cấu trúc dữ liệu bền vững, phục vụ cả hiển thị và lưu kết quả.

Các bước:
1. Mở rộng model `Exams`
   - Thêm `CourseID` để gắn exam vào khóa học.
   - Thêm `OrderIndex` hoặc `Priority` để sắp xếp exam trong chuỗi học.
   - Có thể cân nhắc thêm `IsCheckpoint` để phân biệt bài kiểm tra checkpoint.
2. Tạo bảng `Exam_Result_Details`
   - Mục đích: lưu dữ liệu câu trả lời từng item, không chỉ tổng điểm.
   - Fields đề xuất:
     - `ResultDetailID` (PK)
     - `ResultID` (FK tới `Exam_Results`)
     - `QuestionID` hoặc `ItemID`
     - `IsCorrect` (bool)
     - `ResponseTime` (int giây)
     - `TopicID`
     - `SkillType` (tùy chọn)
     - `ReadingID` / `ListeningID` (tùy chọn)
     - `ExamQuestionID` (tùy chọn)
3. Tạo bảng `User_Skill_Matrix`
   - Mục đích: lưu nhanh điểm kỹ năng hiện tại, giúp AI truy vấn nhanh.
   - Fields đề xuất:
     - `UserID`
     - `SkillType`
     - `ProficiencyScore` (0-100)
     - `LastUpdated`
     - `LevelID` hoặc `SkillLevel` (tùy chọn)
     - `NeedsReview` hoặc `Confidence` (tùy chọn)
4. Cập nhật API/DTO liên quan
   - Update DTO `Exams` nếu cần.
   - Thêm API để tạo / lấy `Exam_Result_Details`.
   - Thêm API để lấy `User_Skill_Matrix`.

### Giai đoạn 2: Hiển thị bài học và bài luyện tập
Mục tiêu: hiện thị hai luồng học khác nhau, dựa trên dữ liệu model đã chuẩn bị.

Luồng 1: Khóa học (Linear / Hybrid Path)
- Dữ liệu: kết hợp `Lessons` và `Exams` theo cùng một `CourseID`.
- Sắp xếp: dùng `Lesson.Priority` và `Exam.OrderIndex`.
- UI: Flat list, mỗi item có `type: Lesson | Exam`.
- Logic AI: coi `Exam` là checkpoint; nếu điểm không đạt, AI căn cứ vào các lessons trước đó để đề xuất học lại.

Luồng 2: Kỹ năng (Adaptive / Skill Hub)
- Dữ liệu: lấy `Exams` / `Practice` theo `SkillType`.
- Sắp xếp: `SkillType`, sau đó `difficulty` / `level`.
- UI: nhóm theo skill.
- Logic AI: coi đây là assessment environment để cập nhật `User_Skill_Matrix`.

### Giai đoạn 3: Làm thật và lưu kết quả
Mục tiêu: cho người dùng thực hiện bài thi, lưu kết quả vào DB, tạo dữ liệu cho AI.

Các bước:
1. API nộp bài thi/exam
   - Tạo record `Exam_Results`.
   - Tạo nhiều record `Exam_Result_Details` cho từng câu hỏi.
2. Cập nhật `User_Skill_Matrix`
   - Tính score mới theo skill.
   - Cập nhật `LastUpdated`.
3. Nếu cần, thêm logic ghi nhận `Exam` gắn vào `CourseID` để xác định điểm checkpoint trong khóa học.

### Giai đoạn 4: AI đọc dữ liệu và phân tích
Mục tiêu: AI dùng dữ liệu thực tế để đưa ra định hướng học tập.

Dữ liệu AI cần:
- `Exam_Result_Details` cho lỗ hổng chủ đề/skill.
- `User_Skill_Matrix` cho trạng thái hiện tại.
- `Lessons` + `CourseID` + `OrderIndex` cho timeline học lại.

Kết quả mong muốn:
- AI xác định chủ đề yếu theo topic.
- AI xác định skill yếu theo `SkillType`.
- AI đề xuất bài học/bài luyện tập tiếp theo.
- AI đề xuất học lại các lesson nằm trước checkpoint nếu điểm không đạt.

## Gợi ý triển khai giai đoạn đầu
1. Chỉnh sửa model `Exams`.
2. Tạo model `Exam_Result_Details`.
3. Tạo model `User_Skill_Matrix`.
4. Tạo migration và apply.
5. Xây API lấy dữ liệu `Course Timeline` và `Skill Hub` (dù chưa full UI).

## Định nghĩa ưu tiên
- Ưu tiên 1: Data model và migration
- Ưu tiên 2: API hiển thị luồng
- Ưu tiên 3: API submit kết quả
- Ưu tiên 4: AI analysis

---

> Lưu ý: đây là roadmap dài hạn — hiện tại ta nên thực hiện giai đoạn 1 trước để không phát triển UI trên nền dữ liệu thiếu.
