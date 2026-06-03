# Reading Generator - Phase 2 Implementation Guide

## Mục tiêu

Triển khai bước đầu tiên của hệ thống sinh dữ liệu Reading tự động cho dự án học tiếng Nhật JLPT N5–N3.

Mục tiêu của Phase 2 là tạo được file:

```text
Data/SeedFiles/generated/readings_generated.json
```

từ các nguồn đã normalize:

```text
Data/SeedFiles/normalized/vocabularies_n5_n3.json
Data/SeedFiles/normalized/examples_n5_n3.json
Data/SeedFiles/generated/reading_templates.json
```

Sau đó chuẩn bị để C# `ReadingSeeder.cs` insert vào DB:

```text
Readings
Questions
Answers
ReadingTopics
```

---

## 1. Bối cảnh hiện tại

Hệ thống đang có pipeline:

```text
Raw Data
↓
DataImport JS
↓
Normalized JSON
↓
Seeder C#
↓
PostgreSQL
```

Các dữ liệu nền đã hoặc đang được xử lý:

```text
Vocabulary
Kanji
Examples
Radicals
Courses
Lessons
JLPT_Level
Topics
WordTypes
ExamTemplate
```

Reading Generator không dùng API ngoài, không dùng AI runtime, không dịch tự động lúc seed.

Mục tiêu là tạo dữ liệu demo có kiểm soát, đủ để:

```text
Hiển thị Reading
Làm câu hỏi Reading
Gắn Reading vào Lesson
Sinh đề thi từ Questions
```

---

## 2. Kết luận từ Phase 1

Agent Phase 1 đã xác định:

### Model Readings cần tối thiểu

```text
ReadingID
Title
Content
LevelID
LessonID
```

Các field nên có:

```text
Translation
WordCount
EstimatedTime
Status
CreatedAt
UpdatedAt
```

### Question Reading liên kết bằng

```text
Questions.ReadingID
```

### Reading Question nên có

```text
SkillType = Reading
QuestionFormat = Passage
ReadingID != null
LessonID != null
```

### Answer nên có

```text
4 answers / question
1 correct
3 wrong
```

---

## 3. Điều chỉnh quan trọng trước khi code

### 3.1. Không dùng Kanji trực tiếp để sinh Reading ở Phase 2

Input chính của Reading Generator nên là:

```text
Vocabulary
Examples
Reading Templates
```

Không cần đọc riêng Kanji ở bước đầu.

Lý do:

```text
Vocabulary đã chứa chữ Kanji trong word
Examples đã chứa câu tiếng Nhật thật
Kanji riêng chỉ nên dùng cho Kanji Questions
```

Kanji có thể dùng ở Phase sau để kiểm soát độ khó, nhưng Phase 2 chưa cần.

### 3.2. Không generate Translation cho Reading ở Phase 2

Trong `readings_generated.json`, có thể để:

```json
"translation": null
```

hoặc:

```json
"translation": ""
```

Lý do:

```text
Dịch tự động đoạn văn dễ sai
Không cần cho demo chức năng Reading
Có thể bổ sung thủ công sau
```

### 3.3. Cần kiểm tra dữ liệu N4 trước khi generate

Trước đó phát hiện N4 có thể bị thiếu do lỗi xử lý tags.

Agent cần kiểm tra lại sau khi đã sửa normalize-vocab:

```text
Vocabulary N5 > 0
Vocabulary N4 > 0
Vocabulary N3 > 0

Examples N5 > 0
Examples N4 > 0
Examples N3 > 0
```

Nếu N4 vẫn bằng 0, không triển khai generator ngay. Cần sửa `normalize-vocab.js` hoặc `normalize-examples.js` trước.

---

## 4. Kiến trúc Reading Generator đề xuất

Không nên để Seeder tự sáng tác nội dung.

Luồng đúng:

```text
reading_templates.json
+
vocabularies_n5_n3.json
+
examples_n5_n3.json
↓
generate-reading.js
↓
readings_generated.json
↓
ReadingSeeder.cs
↓
Database
```

---

## 5. File cần tạo

### 5.1. Tạo thư mục generated nếu chưa có

```text
Data/SeedFiles/generated/
```

### 5.2. Tạo file template

```text
Data/SeedFiles/generated/reading_templates.json
```

### 5.3. Tạo script generator

```text
DataImport/generate-reading.js
```

### 5.4. Tạo seeder

```text
Data/Seed/ReadingSeeder.cs
```

---

## 6. Cấu trúc `reading_templates.json`

Agent cần tạo file:

```text
Data/SeedFiles/generated/reading_templates.json
```

Cấu trúc đề xuất:

```json
[
  {
    "level": "N5",
    "topic": "Trường học",
    "lessonTitle": "N5 - Bài 1: Từ vựng cơ bản",
    "title": "学校の生活",
    "mode": "example_based",
    "minSentences": 3,
    "maxSentences": 5,
    "questionCount": 3,
    "keywords": ["学校", "学生", "先生", "勉強", "日本語"],
    "questionTemplates": [
      {
        "content": "この文章の主なテーマは何ですか。",
        "correctAnswerType": "topic",
        "wrongAnswerType": "topic"
      },
      {
        "content": "文章に出てくる言葉はどれですか。",
        "correctAnswerType": "keyword",
        "wrongAnswerType": "vocabulary"
      }
    ]
  }
]
```

Phase 2 nên tạo tối thiểu:

```text
N5: 5 templates
N4: 5 templates
N3: 5 templates
```

Nếu dữ liệu N4 chưa đủ, vẫn tạo template N4 nhưng generator có thể skip khi thiếu data.

---

## 7. Cách sinh Reading ở Phase 2

Có 2 hướng:

### Hướng A: Example-based Reading

Ưu tiên dùng hướng này.

Logic:

```text
1. Chọn template theo level/topic
2. Lấy examples cùng level
3. Ưu tiên examples chứa keywords trong template
4. Chọn 3-8 câu
5. Ghép thành một passage
6. Sinh questions dựa trên keyword/topic
```

Ưu điểm:

```text
Câu tiếng Nhật tự nhiên hơn
Tận dụng Tatoeba
Không phải hardcode toàn bộ đoạn văn
```

### Hướng B: Template sentence Reading

Dùng khi không đủ examples.

Logic:

```text
1. Template có sẵn contentTemplate
2. Replace placeholder bằng vocabulary
3. Tạo passage
```

Phase 2 có thể hỗ trợ sau, nhưng ưu tiên hướng A.

---

## 8. Cấu trúc output `readings_generated.json`

Agent cần tạo output như sau:

```json
[
  {
    "title": "学校の生活",
    "content": "私は学生です。\n毎日学校へ行きます。\n日本語を勉強します。",
    "translation": null,
    "wordCount": 36,
    "estimatedTime": 2,
    "level": "N5",
    "lessonTitle": "N5 - Bài 1: Từ vựng cơ bản",
    "topics": ["Trường học"],
    "questions": [
      {
        "content": "この文章の主なテーマは何ですか。",
        "displayOrder": 1,
        "difficulty": 1,
        "answers": [
          { "answerText": "学校", "isCorrect": true },
          { "answerText": "家族", "isCorrect": false },
          { "answerText": "買い物", "isCorrect": false },
          { "answerText": "旅行", "isCorrect": false }
        ]
      }
    ]
  }
]
```

Lưu ý:

```text
Không cần LevelID/LessonID trong JSON
Seeder sẽ map từ level + lessonTitle
```

---

## 9. Thuật toán `generate-reading.js`

Agent cần viết script:

```text
DataImport/generate-reading.js
```

### Input paths

```js
const vocabPath = "../Data/SeedFiles/normalized/vocabularies_n5_n3.json";
const examplesPath = "../Data/SeedFiles/normalized/examples_n5_n3.json";
const templatesPath = "../Data/SeedFiles/generated/reading_templates.json";
const outputPath = "../Data/SeedFiles/generated/readings_generated.json";
```

### Step 1: Load data

```text
Load vocabularies
Load examples
Load templates
```

### Step 2: Group data

Group theo:

```text
level
topic
lessonTitle
```

### Step 3: Generate passages

Với mỗi template:

```text
for each template:
    get examples by level
    filter examples by keywords
    if not enough examples:
        fallback to same level examples
    select minSentences-maxSentences
    join content by "\n"
```

### Step 4: Generate questions

Mỗi reading cần:

```text
3 questions
4 answers/question
```

Các dạng question Phase 2:

```text
1. Topic question
2. Keyword recognition question
3. Vocabulary meaning question
```

Ví dụ:

```text
この文章の主なテーマは何ですか。
文章に出てくる言葉はどれですか。
「学校」の意味は何ですか。
```

### Step 5: Generate wrong answers

Nguồn wrong answer:

```text
Vocabulary cùng level
Topic khác
Meaning khác
Keyword khác
```

Yêu cầu:

```text
Không trùng đáp án đúng
Không rỗng
Có ít nhất 3 wrong answers
```

### Step 6: Save JSON

Ghi ra:

```text
Data/SeedFiles/generated/readings_generated.json
```

---

## 10. Quy tắc sinh câu hỏi Reading ở Phase 2

Không cần quá thông minh. Chỉ cần ổn cho demo.

### Question Type 1: Main topic

```json
{
  "content": "この文章の主なテーマは何ですか。",
  "correctAnswer": "学校",
  "wrongAnswers": ["家族", "買い物", "旅行"]
}
```

### Question Type 2: Keyword in passage

```json
{
  "content": "文章に出てくる言葉はどれですか。",
  "correctAnswer": "学生",
  "wrongAnswers": ["医者", "犬", "空港"]
}
```

### Question Type 3: Meaning of keyword

```json
{
  "content": "「学生」の意味は何ですか。",
  "correctAnswer": "học sinh, sinh viên",
  "wrongAnswers": ["tàu điện", "thời gian", "gia đình"]
}
```

---

## 11. ReadingSeeder.cs yêu cầu

Agent cần tạo:

```text
Data/Seed/ReadingSeeder.cs
```

### Seeder đọc file

```text
Data/SeedFiles/generated/readings_generated.json
```

### Seeder cần insert

```text
Readings
Questions
Answers
ReadingTopics
```

### Seeder mapping

```text
level string → JLPT_Level.LevelID
lessonTitle string → Lessons.LessonID
topic string → Topics.TopicID
```

### Cần kiểm tra tồn tại

Không insert trùng nếu đã có:

```text
Reading.Title + Reading.LessonID
```

hoặc:

```text
Reading.Content
```

### Cần batch insert tương đối

Không nên `SaveChangesAsync()` sau từng answer.

Có thể:

```text
AddRange readings
SaveChanges
AddRange questions
SaveChanges
AddRange answers
SaveChanges
```

Hoặc đơn giản hơn trong Phase 2:

```text
Insert reading
Insert related questions/answers
SaveChanges theo từng reading
```

Nhưng cần tránh `AnyAsync()` quá nhiều trong loop lớn.

---

## 12. Enum cần dùng

Agent cần kiểm tra enum thật trong dự án.

Dự kiến:

```csharp
SkillType.Reading
QuestionFormat.Passage
QuestionType.MultipleChoice
```

Nếu tên enum khác, dùng đúng enum hiện tại của dự án.

---

## 13. Cập nhật SeedData.cs

Không bật ReadingSeeder mặc định ngay.

Nên thêm hàm riêng:

```csharp
public static async Task SeedGeneratedContentAsync(ApplicationDbContext context)
{
    await ReadingSeeder.SeedAsync(context);
}
```

Và trong `Program.cs`, chỉ chạy khi có flag:

```bash
dotnet run -- --seed-generated
```

Không chạy ReadingSeeder mỗi lần `dotnet run`.

---

## 14. Điều kiện hoàn thành Phase 2

Phase 2 được xem là hoàn thành khi:

```text
1. Có reading_templates.json
2. Chạy được node DataImport/generate-reading.js
3. Sinh ra readings_generated.json
4. File JSON có ít nhất:
   - 5 readings N5
   - 5 readings N4 nếu có data
   - 5 readings N3
5. Mỗi reading có ít nhất 3 questions
6. Mỗi question có 4 answers
7. Seed được vào DB
8. Frontend/API đọc được Reading và Questions
```

---

## 15. Các log cần có trong generator

Agent cần thêm log:

```text
Loaded vocabulary: X
Loaded examples: Y
Loaded templates: Z

Generated readings:
N5: X
N4: Y
N3: Z

Skipped templates:
- reason: not enough examples
```

---

## 16. Các lỗi cần tránh

### 16.1. Không hardcode quá nhiều từ

Không nên chỉ viết:

```json
"person": ["学生", "先生"]
```

mà nên lấy từ vocabulary/examples nếu có thể.

### 16.2. Không sinh N4 nếu N4 chưa có data

Nếu N4 thiếu, log warning:

```text
Skip N4 template because examples are not enough
```

### 16.3. Không insert Reading nếu Lesson không tồn tại

Seeder phải log:

```text
Skip Reading: lesson not found: ...
```

### 16.4. Không tạo question thiếu answer đúng

Mỗi question phải có đúng 1 answer `isCorrect = true`.

---

## 17. Chiến lược demo đề xuất

Mục tiêu đầu tiên:

```text
N5: 5 readings
N3: 5 readings
N4: nếu đủ data thì 5 readings
```

Sau khi ổn, tăng lên:

```text
Mỗi level 25 readings
Mỗi lesson 1 reading
```

Tương lai khi đủ Course/Lesson:

```text
5 course / level
5 lesson / course
1 reading / lesson
```

---

## 18. Tóm tắt yêu cầu cho Agent

Agent cần triển khai các file:

```text
Data/SeedFiles/generated/reading_templates.json
DataImport/generate-reading.js
Data/Seed/ReadingSeeder.cs
```

Cập nhật:

```text
SeedData.cs
Program.cs flag --seed-generated
```

Không cần triển khai trong Phase 2 này:

```text
Listening
Grammar
ExamGenerator
```

Phase 2 chỉ tập trung vào Reading.

---

## 19. Ghi chú quan trọng

Reading Generator không cần tạo nội dung hoàn hảo như đề JLPT thật.

Mục tiêu là:

```text
Có dữ liệu reading hợp lệ
Có câu hỏi reading hợp lệ
Có answers hợp lệ
Có liên kết level/lesson/topic đúng
Có thể seed và demo
```

Chất lượng nội dung có thể cải thiện ở Phase sau.
