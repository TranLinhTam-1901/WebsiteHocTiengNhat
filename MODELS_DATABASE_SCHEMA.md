# Sơ đồ cơ sở dữ liệu - Hệ thống Quizz Tiếng Nhật

**Tài liệu này mô tả chi tiết các bảng Model trong hệ thống, giúp tìm nguồn dữ liệu phù hợp để seed vào hệ thống.**

---

## 📋 Mục lục

1. [Quản lý Người dùng](#quản-lý-người-dùng)
2. [Cấu trúc Khóa học](#cấu-trúc-khóa-học)
3. [Nội dung Học tập](#nội-dung-học-tập)
4. [Câu hỏi & Đáp án](#câu-hỏi--đáp-án)
5. [Bài thi & Kết quả](#bài-thi--kết-quả)
6. [Tiến độ & Flashcard](#tiến-độ--flashcard)
7. [Hội thoại & Chat](#hội-thoại--chat)
8. [Bảng Liên kết (Many-to-Many)](#bảng-liên-kết-many-to-many)
9. [Bảng Cấu hình](#bảng-cấu-hình)
10. [Enums & Hằng số](#enums--hằng-số)

---

## Quản lý Người dùng

### 1. **ApplicationUser** (Người dùng - Kế thừa từ IdentityUser)
Bảng lưu thông tin người dùng. Kế thừa từ `IdentityUser` của ASP.NET Core Identity.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **Id** | string | ID người dùng (tự động tạo) |
| **UserName** | string | Tên đăng nhập (từ IdentityUser) |
| **Email** | string | Email người dùng (từ IdentityUser) |
| **FullName** | string | Tên đầy đủ |
| **LevelID** | Guid? | Khóa ngoại tới JLPT_Level |
| **AvatarUrl** | string? | URL ảnh đại diện |
| **PhoneNumber** | string? | Số điện thoại (từ IdentityUser) |

**Quan hệ:**
- 1 User → nhiều Progress
- 1 User → nhiều Exam_Results
- 1 User → nhiều User_Skill_Matrix
- 1 User → nhiều FlashcardDeck
- 1 User → nhiều ChatConversation (là Learner hoặc AssignedAdmin)
- 1 User → nhiều ChatMessage (gửi)
- 1 User → nhiều UserAnswerHistory
- 1 User → nhiều UserInterest
- 1 User → nhiều TutorAiConversation

---

## Cấu trúc Khóa học

### 2. **JLPT_Level** (Cấp độ JLPT)
Các cấp độ JLPT: N5, N4, N3, N2, N1

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **LevelID** | Guid | ID cấp độ (Primary Key) |
| **LevelName** | string | Tên cấp độ (N5, N4, N3, N2, N1) |

**Quan hệ:**
- 1 Level → nhiều Courses
- 1 Level → nhiều Lessons
- 1 Level → nhiều Questions
- 1 Level → nhiều Vocabularies
- 1 Level → nhiều Kanjis
- 1 Level → nhiều Grammars
- 1 Level → nhiều Readings
- 1 Level → nhiều Listenings
- 1 Level → nhiều User_Skill_Matrix
- 1 Level → nhiều FlashcardDeck
- 1 Level → nhiều ExamTemplate

**Dữ liệu cần Seed:**
- 5 bảng ghi: N5, N4, N3, N2, N1

---

### 3. **Courses** (Khóa học)
Các khóa học được tổ chức theo cấp độ JLPT.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **CourseID** | Guid | ID khóa học (Primary Key) |
| **CourseName** | string | Tên khóa học |
| **Description** | string | Mô tả khóa học |
| **LevelID** | Guid | Khóa ngoại tới JLPT_Level |

**Quan hệ:**
- 1 Course → nhiều Lessons
- 1 Course → nhiều Exams

**Dữ liệu cần Seed:**
- Ít nhất 1-2 khóa học cho mỗi cấp độ

---

### 4. **Lessons** (Bài học)
Các bài học trong khóa học.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **LessonID** | Guid | ID bài học (Primary Key) |
| **CourseID** | Guid | Khóa ngoại tới Courses |
| **Title** | string | Tiêu đề bài học |
| **SortOrder** | int | Thứ tự ưu tiên hiển thị |

**Quan hệ:**
- 1 Lesson → nhiều Progress
- 1 Lesson → nhiều Questions
- 1 Lesson → nhiều Lessons_Topic (Many-to-Many với Topics)
- 1 Lesson → nhiều Vocabularies
- 1 Lesson → nhiều Grammars
- 1 Lesson → nhiều Kanjis
- 1 Lesson → nhiều Readings
- 1 Lesson → nhiều Listenings

**Dữ liệu cần Seed:**
- 5-10 bài học cho mỗi khóa học

---

### 5. **Topics** (Chủ đề)
Các chủ đề nội dung (ví dụ: "Tự giới thiệu", "Gia đình", "Công việc", v.v.)

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **TopicID** | Guid | ID chủ đề (Primary Key) |
| **TopicName** | string | Tên chủ đề |
| **Description** | string | Mô tả chủ đề |

**Quan hệ:**
- 1 Topic → nhiều VocabTopics
- 1 Topic → nhiều GrammarTopics
- 1 Topic → nhiều ReadingTopics
- 1 Topic → nhiều ListeningTopics
- 1 Topic → nhiều Questions_Topic
- 1 Topic → nhiều Lessons_Topic
- 1 Topic → nhiều UserInterest

**Dữ liệu cần Seed:**
- 10-20 chủ đề phổ biến

---

## Nội dung Học tập

### 6. **Vocabularies** (Từ vựng)
Từ vựng tiếng Nhật với các thông tin liên quan.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **VocabID** | Guid | ID từ vựng (Primary Key) |
| **Word** | string | Từ tiếng Nhật (Hiragana/Kanji) |
| **Reading** | string | Cách phát âm (Furigana) |
| **Meaning** | string | Nghĩa tiếng Việt |
| **IsCommon** | bool | Là từ vựng phổ biến không |
| **Mnemonics** | string? | Mẹo nhớ |
| **ImageURL** | string? | URL ảnh minh họa |
| **AudioURL** | string? | URL file âm thanh |
| **Priority** | int | Mức độ ưu tiên |
| **Status** | int | Trạng thái (0: Draft, 1: Published, 2: Archived) |
| **CreatedAt** | DateTime | Ngày tạo |
| **UpdatedAt** | DateTime | Ngày cập nhật |
| **LevelID** | Guid | Khóa ngoại tới JLPT_Level |
| **LessonID** | Guid | Khóa ngoại tới Lessons |

**Quan hệ:**
- 1 Vocabulary → nhiều VocabWordTypes (Many-to-Many với WordTypes)
- 1 Vocabulary → nhiều VocabTopics (Many-to-Many với Topics)
- 1 Vocabulary → nhiều Examples
- 1 Vocabulary → nhiều VocabularyKanjis (Many-to-Many với Kanjis)

**Dữ liệu cần Seed:**
- 100-300 từ vựng cho mỗi cấp độ
- Ví dụ: "猫", "犬", "学生", "先生", v.v.

---

### 7. **Kanjis** (Chữ Kanji)
Chữ Kanji tiếng Nhật.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **KanjiID** | Guid | ID Kanji (Primary Key) |
| **Character** | string | Ký tự Kanji |
| **Onyomi** | string | Âm Trung Quốc (trên) |
| **Kunyomi** | string | Âm Nhật (dưới) |
| **Meaning** | string | Nghĩa |
| **StrokeCount** | int | Số nét |
| **StrokeGif** | string? | URL GIF hướng dẫn cách viết |
| **SearchVector** | string? | Vector tìm kiếm |
| **Note** | string? | Ghi chú |
| **Mnemonics** | string? | Mẹo nhớ |
| **Popularity** | int | Độ phổ biến |
| **Status** | int | Trạng thái |
| **CreatedAt** | DateTime | Ngày tạo |
| **UpdatedAt** | DateTime | Ngày cập nhật |
| **LevelID** | Guid | Khóa ngoại tới JLPT_Level |
| **TopicID** | Guid | Khóa ngoại tới Topics |
| **LessonID** | Guid | Khóa ngoại tới Lessons |
| **RadicalID** | Guid | Khóa ngoại tới Radicals |

**Quan hệ:**
- 1 Kanji → nhiều VocabularyKanjis (Many-to-Many với Vocabularies)
- 1 Kanji → nhiều RelatedVocabularies

**Dữ liệu cần Seed:**
- 100-200 Kanji cho mỗi cấp độ
- Ví dụ: "木", "火", "水", "金", "土", v.v.

---

### 8. **Radicals** (Bộ thủ)
Các bộ thủ của chữ Kanji (ví dụ: 水部, 木部, v.v.)

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **RadicalID** | Guid | ID bộ thủ (Primary Key) |
| **Character** | string | Ký tự bộ thủ (ví dụ: 氵) |
| **Name** | string | Tên bộ thủ (ví dụ: Bộ Thủy) |
| **Meaning** | string? | Nghĩa (ví dụ: Nước) |
| **StrokeCount** | int | Số nét |
| **CreatedAt** | DateTime | Ngày tạo |

**Quan hệ:**
- 1 Radical → nhiều Kanjis
- 1 Radical → nhiều RadicalVariants

**Dữ liệu cần Seed:**
- ~214 bộ thủ Kanji chuẩn

---

### 9. **RadicalVariants** (Biến thể bộ thủ)
Các biến thể của bộ thủ (ví dụ: 水部 → 氵, 水)

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **VariantID** | Guid | ID biến thể (Primary Key) |
| **Character** | string | Ký tự biến thể |
| **Name** | string? | Tên biến thể |
| **Meaning** | string? | Nghĩa |
| **StrokeCount** | int | Số nét |
| **CreatedAt** | DateTime | Ngày tạo |
| **RadicalID** | Guid | Khóa ngoại tới Radicals |

---

### 10. **Grammars** (Ngữ pháp)
Cấu trúc ngữ pháp tiếng Nhật.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **GrammarID** | Guid | ID ngữ pháp (Primary Key) |
| **Title** | string | Tiêu đề |
| **Structure** | string | Công thức cấu trúc |
| **Meaning** | string | Nghĩa |
| **Explanation** | string | Giải thích chi tiết |
| **GrammarType** | GrammarCategory | Loại ngữ pháp (Trợ từ, Thể Te, v.v.) |
| **Formality** | FormalityLevel | Mức độ trang trọng |
| **UsageNote** | string? | Ghi chú cách dùng |
| **Status** | int | Trạng thái |
| **CreatedAt** | DateTime | Ngày tạo |
| **UpdatedAt** | DateTime | Ngày cập nhật |
| **LevelID** | Guid | Khóa ngoại tới JLPT_Level |
| **LessonID** | Guid | Khóa ngoại tới Lessons |
| **GrammarGroupID** | Guid? | Khóa ngoại tới GrammarGroups |

**Quan hệ:**
- 1 Grammar → nhiều GrammarTopics
- 1 Grammar → nhiều Examples

**Dữ liệu cần Seed:**
- 50-150 cấu trúc ngữ pháp cho mỗi cấp độ
- Ví dụ: "～だ", "～です", "～ます", "～ている", v.v.

---

### 11. **GrammarGroups** (Nhóm ngữ pháp)
Nhóm các cấu trúc ngữ pháp liên quan (ví dụ: "Nhóm câu điều kiện")

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **GrammarGroupID** | Guid | ID nhóm (Primary Key) |
| **GroupName** | string | Tên nhóm |
| **Description** | string? | Mô tả |

**Quan hệ:**
- 1 GrammarGroup → nhiều Grammars

---

### 12. **Readings** (Bài đọc hiểu)
Bài đọc hiểu tiếng Nhật.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **ReadingID** | Guid | ID bài đọc (Primary Key) |
| **Title** | string | Tiêu đề bài đọc |
| **Content** | string | Nội dung đoạn văn |
| **Translation** | string | Dịch sang tiếng Việt |
| **WordCount** | int | Tổng số từ |
| **EstimatedTime** | int | Thời gian dự kiến (phút) |
| **Status** | int | Trạng thái |
| **CreatedAt** | DateTime | Ngày tạo |
| **UpdatedAt** | DateTime | Ngày cập nhật |
| **LevelID** | Guid | Khóa ngoại tới JLPT_Level |
| **LessonID** | Guid | Khóa ngoại tới Lessons |

**Quan hệ:**
- 1 Reading → nhiều ReadingTopics
- 1 Reading → nhiều Questions
- 1 Reading → nhiều Exam_Questions

**Dữ liệu cần Seed:**
- 20-50 bài đọc cho mỗi cấp độ

---

### 13. **Listenings** (Bài nghe)
Bài nghe tiếng Nhật với file audio.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **ListeningID** | Guid | ID bài nghe (Primary Key) |
| **Title** | string | Tiêu đề bài nghe |
| **AudioURL** | string | URL file âm thanh |
| **Script** | string? | Lời thoại (optional) |
| **Transcript** | string? | Nội dung viết |
| **Duration** | int | Độ dài file (giây) |
| **SpeedCategory** | string? | Tốc độ (Chậm, Bình thường, Nhanh) |
| **Status** | int | Trạng thái |
| **CreatedAt** | DateTime | Ngày tạo |
| **UpdatedAt** | DateTime | Ngày cập nhật |
| **LevelID** | Guid | Khóa ngoại tới JLPT_Level |
| **LessonID** | Guid | Khóa ngoại tới Lessons |

**Quan hệ:**
- 1 Listening → nhiều ListeningTopics
- 1 Listening → nhiều Questions
- 1 Listening → nhiều Exam_Questions

**Dữ liệu cần Seed:**
- 15-40 bài nghe cho mỗi cấp độ
- Cần file audio tương ứng

---

### 14. **Examples** (Ví dụ)
Ví dụ câu sử dụng từ vựng hoặc ngữ pháp.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **ExampleID** | Guid | ID ví dụ (Primary Key) |
| **Content** | string | Nội dung câu ví dụ (có Furigana) |
| **Translation** | string | Dịch sang tiếng Việt |
| **AudioURL** | string? | URL file âm thanh |
| **CreatedAt** | DateTime | Ngày tạo |
| **UpdatedAt** | DateTime | Ngày cập nhật |
| **VocabID** | Guid? | Khóa ngoại tới Vocabularies |
| **GrammarID** | Guid? | Khóa ngoại tới Grammars |

**Dữ liệu cần Seed:**
- 2-5 ví dụ cho mỗi từ vựng/ngữ pháp

---

### 15. **WordTypes** (Loại từ)
Các loại từ tiếng Nhật (Danh từ, Động từ, Tính từ, v.v.)

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **WordTypeID** | Guid | ID loại từ (Primary Key) |
| **Name** | string | Tên loại từ (Danh từ, Động từ, v.v.) |
| **Description** | string? | Giải thích |

**Dữ liệu cần Seed:**
- Các loại từ cơ bản: Noun, Verb Group 1, Verb Group 2, i-Adjective, na-Adjective, Adverb, v.v.

---

## Câu hỏi & Đáp án

### 16. **Questions** (Câu hỏi)
Các câu hỏi trong bài tập.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **QuestionID** | Guid | ID câu hỏi (Primary Key) |
| **Content** | string | Nội dung câu hỏi |
| **QuestionType** | QuestionType | Loại câu hỏi |
| **QuestionFormat** | QuestionFormat | Định dạng (StandardChoice, StarSentence, Passage, AudioChoice) |
| **SkillType** | SkillType | Kỹ năng (Vocabulary, Grammar, Reading, Listening, v.v.) |
| **AudioURL** | string? | URL file âm thanh (nếu có) |
| **ImageURL** | string? | URL ảnh (nếu có) |
| **Difficulty** | int | Mức độ khó (1-10) |
| **Explanation** | string? | Giải thích đáp án |
| **Status** | Status | Trạng thái |
| **MediaTimestamp** | string? | Mốc thời gian trong bài nghe |
| **DisplayOrder** | int? | Thứ tự hiển thị |
| **CreatedAt** | DateTime | Ngày tạo |
| **UpdatedAt** | DateTime | Ngày cập nhật |
| **SourceID** | Guid? | Truy nguồn gốc |
| **ParentID** | Guid? | Câu hỏi cha (cho câu con) |
| **LessonID** | Guid | Khóa ngoại tới Lessons |
| **ReadingID** | Guid? | Khóa ngoại tới Readings |
| **ListeningID** | Guid? | Khóa ngoại tới Listenings |

**Quan hệ:**
- 1 Question → nhiều Answers
- 1 Question → nhiều Questions_Topic
- 1 Question → nhiều Exam_Questions
- 1 Question → nhiều SubQuestions (tự tham chiếu)

**Dữ liệu cần Seed:**
- 500-2000 câu hỏi cho mỗi cấp độ
- Chia đều theo các kỹ năng

---

### 17. **Answers** (Đáp án)
Các đáp án cho câu hỏi.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **AnswerID** | Guid | ID đáp án (Primary Key) |
| **QuestionID** | Guid | Khóa ngoại tới Questions |
| **AnswerText** | string | Nội dung đáp án |
| **IsCorrect** | bool | Là đáp án đúng không |

**Dữ liệu cần Seed:**
- 3-5 đáp án cho mỗi câu hỏi trắc nghiệm
- 1 đáp án cho mỗi câu hỏi tự luận

---

## Bài thi & Kết quả

### 18. **Exams** (Bài thi)
Các bài thi trong hệ thống.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **ExamID** | Guid | ID bài thi (Primary Key) |
| **Title** | string | Tiêu đề bài thi |
| **Type** | ExamType | Loại bài thi (MockTest, LessonPractice, SkillPractice) |
| **SortOrder** | int | Thứ tự ưu tiên |
| **IsCheckpoint** | bool | Là checkpoint không |
| **TotalMaxScore** | decimal | Tổng điểm tối đa |
| **PassingScore** | decimal | Điểm đỗ |
| **MinLanguageKnowledgeScore** | double | Điểm tối thiểu từ vựng + ngữ pháp |
| **MinReadingScore** | double | Điểm tối thiểu đọc |
| **MinListeningScore** | double | Điểm tối thiểu nghe |
| **ShowResultImmediately** | bool | Hiển thị kết quả ngay |
| **Duration** | int | Thời gian làm (phút) |
| **CreatedAt** | DateTime | Ngày tạo |
| **UpdatedAt** | DateTime | Ngày cập nhật |
| **TemplateID** | Guid? | Khóa ngoại tới ExamTemplate |
| **CourseID** | Guid? | Khóa ngoại tới Courses |
| **LessonID** | Guid? | Khóa ngoại tới Lessons |
| **LevelID** | Guid? | Khóa ngoại tới JLPT_Level |
| **TargetSkill** | SkillType? | Kỹ năng đích |

**Quan hệ:**
- 1 Exam → nhiều Exam_Results
- 1 Exam → nhiều Exam_Sessions
- 1 Exam → nhiều Exam_Questions

**Dữ liệu cần Seed:**
- 10-30 bài thi cho mỗi cấp độ

---

### 19. **ExamTemplate** (Khung đề thi)
Template cho đề thi thử JLPT chuẩn.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **TemplateID** | Guid | ID template (Primary Key) |
| **Title** | string | Tiêu đề template |
| **Duration** | int | Thời gian làm (phút) |
| **PassingScore** | decimal | Điểm đỗ |
| **MinLanguageKnowledgeScore** | double | Điểm tối thiểu phần 1 |
| **MinReadingScore** | double? | Điểm tối thiểu phần đọc |
| **MinListeningScore** | double? | Điểm tối thiểu phần nghe |
| **TotalMaxScore** | decimal | Tổng điểm tối đa |
| **Version** | int | Phiên bản |
| **IsActive** | bool | Đang hoạt động |
| **LevelID** | Guid | Khóa ngoại tới JLPT_Level |

**Quan hệ:**
- 1 Template → nhiều ExamTemplateDetail
- 1 Template → nhiều Exams

---

### 20. **ExamTemplateDetail** (Chi tiết khung đề)
Chi tiết cấu thành của template (phần nào, bao nhiêu câu, bao nhiêu điểm).

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **DetailID** | Guid | ID chi tiết (Primary Key) |
| **SkillType** | SkillType | Kỹ năng |
| **QuestionFormat** | QuestionFormat | Định dạng câu hỏi |
| **Quantity** | int | Số lượng câu |
| **PointPerQuestion** | decimal | Điểm trên câu |
| **TemplateID** | Guid | Khóa ngoại tới ExamTemplate |

---

### 21. **Exam_Sessions** (Phiên làm bài)
Phiên làm bài thi của người dùng.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **SessionID** | Guid | ID phiên (Primary Key) |
| **UserID** | string | Khóa ngoại tới ApplicationUser |
| **ExamID** | Guid | Khóa ngoại tới Exams |
| **RemainingTime** | int | Thời gian còn lại (giây) |
| **Status** | SessionStatus | Trạng thái (InProgress, Submitted, Abandoned) |
| **StartedAt** | DateTime | Thời gian bắt đầu |
| **ExpiresAt** | DateTime | Thời gian hết hạn |
| **LastAccessedAt** | DateTime | Lần truy cập cuối |
| **ExamVersion** | int | Phiên bản đề |

**Quan hệ:**
- 1 Session → nhiều Exam_Session_Answers

---

### 22. **Exam_Session_Answers** (Đáp án phiên)
Câu trả lời trong phiên làm bài.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **SessionAnswerID** | Guid | ID đáp án phiên (Primary Key) |
| **SessionID** | Guid | Khóa ngoại tới Exam_Sessions |
| **QuestionID** | Guid | ID câu hỏi |
| **SelectedAnswerID** | Guid? | Khóa ngoại tới Answers (nếu chọn) |
| **TextAnswer** | string? | Đáp án tự luận |
| **ResponseTime** | int | Thời gian trả lời (giây) |
| **UpdatedAt** | DateTime | Ngày cập nhật |

---

### 23. **Exam_Results** (Kết quả bài thi)
Kết quả tổng hợp bài thi.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **ResultID** | Guid | ID kết quả (Primary Key) |
| **UserID** | string | Khóa ngoại tới ApplicationUser |
| **ExamID** | Guid | Khóa ngoại tới Exams |
| **Score** | float | Điểm số |
| **TimeSpent** | int | Thời gian làm (giây) |
| **ExamVersion** | int | Phiên bản đề |
| **CreatedAt** | DateTime | Ngày thi |

**Quan hệ:**
- 1 Result → nhiều Exam_Result_Details

---

### 24. **Exam_Result_Details** (Chi tiết kết quả)
Chi tiết từng câu hỏi trong kết quả.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **ResultDetailID** | Guid | ID chi tiết (Primary Key) |
| **ResultID** | Guid | Khóa ngoại tới Exam_Results |
| **QuestionID** | Guid | Khóa ngoại tới Questions |
| **IsCorrect** | bool | Trả lời đúng không |
| **ResponseTime** | int | Thời gian trả lời (giây) |
| **TopicID** | Guid? | Khóa ngoại tới Topics |
| **SkillType** | SkillType? | Kỹ năng |
| **SelectedAnswerID** | Guid? | Đáp án chọn |
| **TextAnswer** | string? | Đáp án tự luận |
| **ReadingID** | Guid? | Bài đọc liên quan |
| **ListeningID** | Guid? | Bài nghe liên quan |
| **ExamQuestionID** | Guid? | Khóa ngoại tới Exam_Questions |

---

### 25. **Exam_Questions** (Câu hỏi trong đề thi)
Liên kết giữa bài thi và câu hỏi.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **ExamQuestionID** | Guid | ID (Primary Key) |
| **ExamID** | Guid | Khóa ngoại tới Exams |
| **QuestionID** | Guid? | Khóa ngoại tới Questions |
| **ReadingID** | Guid? | Khóa ngoại tới Readings |
| **ListeningID** | Guid? | Khóa ngoại tới Listenings |
| **OrderIndex** | int | Thứ tự trong đề |
| **Score** | decimal | Điểm câu hỏi |
| **Version** | int | Phiên bản |

---

## Tiến độ & Flashcard

### 26. **Progress** (Tiến độ học tập)
Theo dõi tiến độ học tập của người dùng.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **ProgressID** | Guid | ID tiến độ (Primary Key) |
| **UserID** | string | Khóa ngoại tới ApplicationUser |
| **LevelID** | Guid | Khóa ngoại tới JLPT_Level |
| **LessonsID** | Guid | Khóa ngoại tới Lessons |
| **Status** | string | Trạng thái ("NotStarted", "InProgress", "Completed") |
| **LastAccessed** | DateTime | Lần truy cập cuối |
| **CompletedAt** | DateTime | Ngày hoàn thành |

---

### 27. **User_Skill_Matrix** (Ma trận kỹ năng)
Đánh giá mức độ thành thạo từng kỹ năng.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **MatrixID** | Guid | ID (Primary Key) |
| **UserID** | string | Khóa ngoại tới ApplicationUser |
| **SkillType** | SkillType | Kỹ năng (Vocabulary, Grammar, etc.) |
| **ProficiencyScore** | int | Điểm thành thạo (0-100) |
| **LastUpdated** | DateTime | Cập nhật lần cuối |
| **LevelID** | Guid? | Khóa ngoại tới JLPT_Level |
| **NeedsReview** | bool | Cần ôn tập |
| **Confidence** | int | Độ tin cậy (0-100) |

---

### 28. **FlashcardDeck** (Bộ thẻ flashcard)
Bộ sưu tập flashcard do người dùng tạo hoặc hệ thống tạo.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **DeckID** | Guid | ID bộ thẻ (Primary Key) |
| **Name** | string | Tên bộ thẻ |
| **Description** | string? | Mô tả |
| **SkillType** | SkillType | Loại kỹ năng |
| **LevelID** | Guid? | Khóa ngoại tới JLPT_Level |
| **UserID** | string | Khóa ngoại tới ApplicationUser |
| **IsUserCustomDeck** | bool | Bộ thẻ do người dùng tạo |
| **DeckSyncKey** | string? | Khóa đồng bộ |
| **ActiveStudyMode** | string? | Chế độ học (learn, continue, review, due) |
| **ActiveStudyQueueJson** | string? | Hàng đợi thẻ (JSON) |
| **ActiveStudyCursor** | int | Con trỏ hiện tại |
| **ActiveStudyUpdatedAt** | DateTime? | Cập nhật lần cuối |
| **CreatedAt** | DateTime | Ngày tạo |

**Quan hệ:**
- 1 Deck → nhiều FlashcardItem

---

### 29. **FlashcardItem** (Thẻ flashcard)
Từng thẻ trong bộ flashcard, sử dụng thuật toán SRS.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **ItemID** | Guid | ID thẻ (Primary Key) |
| **DeckID** | Guid | Khóa ngoại tới FlashcardDeck |
| **EntityID** | Guid | ID của entity (VocabID, KanjiID, hoặc GrammarID) |
| **ItemType** | SkillType | Loại thẻ (Vocabulary, Kanji, Grammar) |
| **EF** | double | Ease Factor (mặc định 2.5) |
| **Interval** | int | Khoảng cách ôn (ngày) |
| **Repetitions** | int | Số lần trả lời đúng liên tiếp |
| **NextReview** | DateTime | Ngày ôn tiếp theo |
| **LastReviewed** | DateTime | Ôn lần cuối |
| **LastReviewQuality** | int? | Chất lượng lần ôn cuối (0-5) |
| **LastTimeTakenSeconds** | int? | Thời gian ôn (giây) |
| **IsMastered** | bool | Đã thuộc hết |

---

### 30. **UserAnswerHistory** (Lịch sử trả lời)
Lịch sử từng lần trả lời câu hỏi.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **HistoryID** | Guid | ID lịch sử (Primary Key) |
| **UserID** | string | Khóa ngoại tới ApplicationUser |
| **QuestionID** | Guid | Khóa ngoại tới Questions |
| **SelectedAnswerID** | Guid? | Đáp án chọn |
| **TextAnswer** | string? | Đáp án tự luận |
| **IsCorrect** | bool | Trả lời đúng |
| **AnsweredAt** | DateTime | Thời gian trả lời |
| **TimeTaken** | int | Thời gian suy nghĩ (giây) |

---

### 31. **UserInterest** (Sở thích người dùng)
Theo dõi sở thích chủ đề của người dùng.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **UserID** | string | Khóa ngoại tới ApplicationUser |
| **TopicID** | Guid | Khóa ngoại tới Topics |
| **InteractionCount** | int | Số lần tương tác |

---

## Hội thoại & Chat

### 32. **ChatConversation** (Hội thoại Chat)
Hội thoại giữa học viên và admin.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **Id** | Guid | ID hội thoại (Primary Key) |
| **LearnerId** | string | Khóa ngoại tới ApplicationUser (học viên) |
| **AssignedAdminId** | string | Khóa ngoại tới ApplicationUser (admin) |
| **CreatedAt** | DateTime | Ngày tạo |
| **LastMessageAt** | DateTime | Tin nhắn cuối cùng |

**Quan hệ:**
- 1 Conversation → nhiều ChatMessage

---

### 33. **ChatMessage** (Tin nhắn Chat)
Tin nhắn trong cuộc hội thoại.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **Id** | Guid | ID tin nhắn (Primary Key) |
| **ConversationId** | Guid | Khóa ngoại tới ChatConversation |
| **SenderId** | string | Khóa ngoại tới ApplicationUser (người gửi) |
| **Content** | string | Nội dung (tối đa 8000 ký tự) |
| **SentAt** | DateTime | Thời gian gửi |

---

### 34. **ChatRoundRobinState** (Trạng thái Round Robin Chat)
Lưu trạng thái phân công admin cho hội thoại (Round Robin).

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **Id** | int | ID (mặc định = 1) (Primary Key) |
| **LastAssignedIndex** | int | Index admin được gán lần trước |

---

### 35. **TutorAiConversation** (Hội thoại AI Tutor)
Hội thoại giữa người dùng và AI Tutor (Live2D).

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **Id** | int | ID hội thoại (Primary Key) |
| **UserId** | string | Khóa ngoại tới ApplicationUser |
| **Title** | string? | Tiêu đề hội thoại |
| **Live2dModelId** | string | ID model Live2D (FE) |
| **CreatedAt** | DateTime | Ngày tạo |
| **UpdatedAt** | DateTime | Cập nhật lần cuối |

**Quan hệ:**
- 1 Conversation → nhiều TutorAiMessage

---

### 36. **TutorAiMessage** (Tin nhắn AI Tutor)
Tin nhắn trong cuộc hội thoại với AI Tutor.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **Id** | int | ID tin nhắn (Primary Key) |
| **ConversationId** | int | Khóa ngoại tới TutorAiConversation |
| **Role** | string | Vai trò (user, assistant) |
| **ClientMessageId** | string | ID tin nhắn từ client (để dedup) |
| **PlainContent** | string? | Nội dung văn bản |
| **VietnameseText** | string? | Văn bản tiếng Việt |
| **JapaneseSpeech** | string? | Văn bản tiếng Nhật |
| **Expression** | string? | Biểu cảm nhân vật (tối đa 32 ký tự) |
| **CreatedAt** | DateTime | Ngày tạo |

**Quan hệ:**
- 1 Message → 1 TutorAiMessageAudio (optional)

---

### 37. **TutorAiMessageAudio** (Audio AI Tutor)
File audio cho tin nhắn AI Tutor.

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **Id** | int | ID (Primary Key) |
| **MessageId** | int | Khóa ngoại tới TutorAiMessage |
| **PublicUrl** | string | URL công khai (ví dụ: /uploads/tutor-audio/...) |
| **SpeakerId** | int | ID diễn viên VOICEVOX |
| **DurationMs** | int? | Độ dài (ms) |

---

## Bảng Liên kết (Many-to-Many)

### 38. **VocabTopics** (Liên kết Từ vựng - Chủ đề)

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **VocabID** | Guid | Khóa ngoại tới Vocabularies |
| **TopicID** | Guid | Khóa ngoại tới Topics |

**Mục đích:** Một từ vựng có thể thuộc nhiều chủ đề, một chủ đề có nhiều từ vựng.

---

### 39. **VocabWordTypes** (Liên kết Từ vựng - Loại từ)

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **VocabID** | Guid | Khóa ngoại tới Vocabularies |
| **WordTypeID** | Guid | Khóa ngoại tới WordTypes |

**Mục đích:** Một từ vựng có thể là nhiều loại từ (ví dụ: "読む" vừa là động từ vừa có thể là danh từ).

---

### 40. **VocabularyKanjis** (Liên kết Từ vựng - Kanji)

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **VocabID** | Guid | Khóa ngoại tới Vocabularies |
| **KanjiID** | Guid | Khóa ngoại tới Kanjis |

**Mục đích:** Một từ vựng có thể chứa nhiều Kanji, một Kanji có thể xuất hiện trong nhiều từ vựng.

---

### 41. **GrammarTopics** (Liên kết Ngữ pháp - Chủ đề)

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **GrammarID** | Guid | Khóa ngoại tới Grammars |
| **TopicID** | Guid | Khóa ngoại tới Topics |

---

### 42. **ReadingTopics** (Liên kết Bài đọc - Chủ đề)

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **ReadingID** | Guid | Khóa ngoại tới Readings |
| **TopicID** | Guid | Khóa ngoại tới Topics |

---

### 43. **ListeningTopics** (Liên kết Bài nghe - Chủ đề)

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **ListeningID** | Guid | Khóa ngoại tới Listenings |
| **TopicID** | Guid | Khóa ngoại tới Topics |

---

### 44. **Questions_Topic** (Liên kết Câu hỏi - Chủ đề)

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **QuestionID** | Guid | Khóa ngoại tới Questions |
| **TopicID** | Guid | Khóa ngoại tới Topics |

---

### 45. **Lessons_Topic** (Liên kết Bài học - Chủ đề)

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| **LessonsID** | Guid | Khóa ngoại tới Lessons |
| **TopicID** | Guid | Khóa ngoại tới Topics |

---

## Bảng Cấu hình

### 46. **SD** (Static Data - Hằng số)
Lưu trữ các hằng số của hệ thống.

```csharp
Role_Admin = "Admin"
Role_Learner = "Learner"
```

---

## Enums & Hằng số

### SkillType (Loại kỹ năng)
```
General = 0       // Bài học tổng hợp
Vocabulary = 1    // Từ vựng
Grammar = 2       // Ngữ pháp
Kanji = 3         // Chữ Kanji
Reading = 4       // Đọc hiểu
Listening = 5     // Nghe hiểu
Practice = 6      // Luyện tập
```

### FormalityLevel (Mức độ trang trọng)
```
Neutral = 0       // Trung tính
Casual = 1        // Thân mật (Thể từ điển)
Polite = 2        // Lịch sự (Desu/Masu)
Formal = 3        // Trang trọng (Văn viết)
Honorific = 4     // Kính ngữ (Sonkeigo)
Humble = 5        // Khiêm nhường ngữ (Kenjougo)
```

### GrammarCategory (Loại ngữ pháp)
```
General = 0           // Cấu trúc chung
Particle = 1          // Trợ từ
TeForm = 2            // Thể Te
TaForm = 3            // Thể Ta
NaiForm = 4           // Thể Nai
DictionaryForm = 5    // Thể Từ điển
SentenceEnding = 6    // Cách kết thúc câu
Conjunction = 7       // Liên từ
Adjective = 8         // Biến đổi tính từ
Comparison = 9        // So sánh
NounModification = 10 // Mệnh đề định ngữ
Condition = 11        // Câu điều kiện
GivingReceiving = 12  // Cho nhận
Potential = 13        // Khả năng
Honorific = 14        // Kính ngữ
```

### QuestionType (Loại câu hỏi)
```
MultipleChoice = 0    // Trắc nghiệm
Ordering = 1          // Sắp xếp câu (★ cấu trúc dấu sao)
```

### Status (Trạng thái)
```
Draft = 0         // Nháp
Published = 1     // Đã xuất bản
Archived = 2      // Lưu trữ
```

### QuestionFormat (Định dạng câu hỏi)
```
StandardChoice = 0      // Trắc nghiệm thông thường
StarSentence = 1        // Câu hỏi dấu ★
Passage = 2             // Đọc đoạn văn
AudioChoice = 3         // Nghe trắc nghiệm
```

### ExamType (Loại bài thi)
```
MockTest = 0           // Đề thi thử JLPT
LessonPractice = 1     // Luyện tập bài học
SkillPractice = 2      // Luyện tập kỹ năng
```

### CourseTimelineItemType (Loại mục trong timeline khóa học)
```
Lesson = 0
Exam = 1
```

### SessionStatus (Trạng thái phiên làm bài)
```
InProgress = 0  // Đang làm
Submitted = 1   // Đã submit
Abandoned = 2   // Bỏ dở
```

---

## 📊 Tóm tắt Dữ liệu cần Seed

| Bảng | Số lượng tối thiểu | Ghi chú |
|------|--------|---------|
| JLPT_Level | 5 | N5, N4, N3, N2, N1 |
| Courses | 5-10 | 1-2 khóa học/cấp độ |
| Lessons | 50-100 | 5-10 bài/khóa học |
| Topics | 10-20 | Các chủ đề phổ biến |
| Vocabularies | 500-1500 | 100-300/cấp độ |
| Kanjis | 500-1000 | 100-200/cấp độ |
| Radicals | 214 | Các bộ thủ chuẩn |
| WordTypes | 15-20 | Các loại từ cơ bản |
| Grammars | 300-750 | 50-150/cấp độ |
| GrammarGroups | 20-30 | Nhóm ngữ pháp |
| Readings | 100-250 | 20-50/cấp độ |
| Listenings | 75-200 | 15-40/cấp độ + file audio |
| Questions | 2500-6000 | 500-1200/cấp độ |
| Answers | 7500-18000 | 3-5 đáp án/câu |
| Examples | 1500-3750 | 2-5 ví dụ/từ/ngữ pháp |
| Exams | 50-150 | 10-30/cấp độ |
| ExamTemplate | 5-10 | 1-2/cấp độ |

---

## 🔗 Quan hệ chính giữa các bảng

```
JLPT_Level
├── Courses
│   └── Lessons
│       ├── Questions
│       │   ├── Answers
│       │   ├── Questions_Topic
│       │   ├── Readings
│       │   └── Listenings
│       ├── Vocabularies
│       │   ├── VocabTopics
│       │   ├── VocabWordTypes
│       │   ├── VocabularyKanjis
│       │   └── Examples
│       ├── Grammars
│       │   ├── GrammarTopics
│       │   └── Examples
│       ├── Kanjis
│       │   ├── Radicals
│       │   └── RadicalVariants
│       ├── Readings
│       │   ├── ReadingTopics
│       │   └── Questions
│       └── Listenings
│           ├── ListeningTopics
│           └── Questions
├── Exams
│   ├── Exam_Sessions
│   │   └── Exam_Session_Answers
│   ├── Exam_Results
│   │   └── Exam_Result_Details
│   └── Exam_Questions
├── ExamTemplate
│   └── ExamTemplateDetail
└── Users
    ├── Progress
    ├── User_Skill_Matrix
    ├── FlashcardDeck
    │   └── FlashcardItem
    ├── UserAnswerHistory
    ├── UserInterest
    ├── ChatConversation
    │   └── ChatMessage
    └── TutorAiConversation
        └── TutorAiMessage
            └── TutorAiMessageAudio
```

---

## 📝 Hướng dẫn tìm nguồn dữ liệu

### Từ vựng & Kanji
- **Nguồn:** Sách giáo trình JLPT (Minna no Nihongo, 新完全マスター)
- **Dữ liệu cần:** Word, Reading, Meaning, Audio, Images
- **Format:** CSV/Excel với cột: Word, Hiragana, Vietnamese, AudioURL

### Ngữ pháp
- **Nguồn:** Tài liệu JLPT chính thức, sách ngữ pháp
- **Dữ liệu cần:** Pattern, Meaning, Explanation, Examples
- **Format:** CSV/Excel với cột: Pattern, Meaning, Explanation

### Câu hỏi
- **Nguồn:** Đề thi JLPT thực tế, bộ câu hỏi luyện tập
- **Dữ liệu cần:** Question, Answers (4-5 lựa chọn), CorrectAnswer, Explanation
- **Format:** CSV/Excel hoặc JSON

### Bài đọc & Nghe
- **Nguồn:** Bộ tài liệu JLPT, sách luyện tập, bài báo tiếng Nhật
- **Dữ liệu cần:** Content, Translation, AudioURL, Difficulty
- **Format:** Markdown hoặc XML với metadata

### Chủ đề & Cấu trúc
- **Nguồn:** Phân tích từ giáo trình JLPT
- **Dữ liệu cần:** TopicName, Description, RelatedContent
- **Format:** CSV/Excel

---

**Cập nhật lần cuối: 28 tháng 5 năm 2026**
