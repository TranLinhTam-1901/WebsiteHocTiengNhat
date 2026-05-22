# 📝 CRUD Khóa Học và Bài Học - Tóm Tắt Triển Khai

## ✅ Hoàn Thành

Đã tạo thành công CRUD (Create, Read, Update, Delete) cho Khóa Học (Courses) và Bài Học (Lessons) với:

### 1️⃣ **DTOs (Data Transfer Objects)**

#### Khóa Học

- `DTOs/Admin/Course/CourseDTO.cs` - DTO để hiển thị danh sách
- `DTOs/Admin/Course/CreateUpdateCourseDTO.cs` - DTO cho tạo/cập nhật

#### Bài Học

- `DTOs/Admin/Lesson/LessonDTO.cs` - DTO để hiển thị danh sách
- `DTOs/Admin/Lesson/CreateUpdateLessonDTO.cs` - DTO cho tạo/cập nhật

### 2️⃣ **Controllers (API Endpoints)**

#### Khóa Học - `Controllers/Admins/CoursesAdminController.cs`

| Phương Thức | Endpoint                            | Mô Tả                         |
| ----------- | ----------------------------------- | ----------------------------- |
| GET         | `/api/admin/courses/get-all`        | Lấy danh sách tất cả khóa học |
| GET         | `/api/admin/courses/get-by-id/{id}` | Lấy chi tiết khóa học         |
| POST        | `/api/admin/courses/create`         | Thêm mới khóa học             |
| PUT         | `/api/admin/courses/update/{id}`    | Cập nhật khóa học             |
| DELETE      | `/api/admin/courses/delete/{id}`    | Xóa khóa học                  |
| GET         | `/api/admin/courses/metadata`       | Lấy danh sách cho dropdown    |

#### Bài Học - `Controllers/Admins/LessonsAdminController.cs`

| Phương Thức | Endpoint                                      | Mô Tả                        |
| ----------- | --------------------------------------------- | ---------------------------- |
| GET         | `/api/admin/lessons/get-all`                  | Lấy danh sách tất cả bài học |
| GET         | `/api/admin/lessons/get-by-course/{courseId}` | Lấy bài học theo khóa học    |
| GET         | `/api/admin/lessons/get-by-id/{id}`           | Lấy chi tiết bài học         |
| POST        | `/api/admin/lessons/create`                   | Thêm mới bài học             |
| PUT         | `/api/admin/lessons/update/{id}`              | Cập nhật bài học             |
| DELETE      | `/api/admin/lessons/delete/{id}`              | Xóa bài học                  |
| GET         | `/api/admin/lessons/metadata`                 | Lấy danh sách cho dropdown   |
| GET         | `/api/admin/lessons/skill-types`              | Lấy danh sách loại kỹ năng   |

---

## 📂 Cấu Trúc Tệp

```
BE/
├── Controllers/
│   └── Admins/
│       ├── CoursesAdminController.cs  ✅ MỚI
│       └── LessonsAdminController.cs  ✅ MỚI
├── DTOs/
│   └── Admin/
│       ├── Course/  ✅ MỚI
│       │   ├── CourseDTO.cs
│       │   └── CreateUpdateCourseDTO.cs
│       └── Lesson/  ✅ MỚI
│           ├── LessonDTO.cs
│           └── CreateUpdateLessonDTO.cs
└── Models/
    ├── Courses.cs  (Đã tồn tại)
    └── Lessons.cs  (Đã tồn tại)
```

---

## 🔐 Yêu Cầu Bảo Mật

- ✅ **Admin Only**: Tất cả endpoint yêu cầu role `Admin`
- ✅ **JWT Authentication**: Cần token JWT hợp lệ trong header
- ✅ **Authorization**: Sử dụng `[Authorize(Roles = "Admin")]`

---

## 🧪 Ví Dụ Sử Dụng

### Tạo Khóa Học

```json
POST /api/admin/courses/create
{
  "courseName": "Tiếng Nhật N5 - Cơ Bản",
  "description": "Khóa học dành cho người mới bắt đầu",
  "levelID": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Tạo Bài Học

```json
POST /api/admin/lessons/create
{
  "courseID": "550e8400-e29b-41d4-a716-446655440001",
  "title": "Bài 1: Từ Vựng Cơ Bản",
  "skillType": 1,
  "difficulty": 1,
  "priority": 1
}
```

**SkillType Enum:**

- `0` = General (Bài học tổng hợp)
- `1` = Vocabulary (Từ Vựng)
- `2` = Grammar (Ngữ Pháp)
- `3` = Kanji (Kanji)
- `4` = Reading (Đọc)
- `5` = Listening (Nghe)
- `6` = Practice (Luyện Tập)

---

## ✨ Tính Năng Đặc Biệt

### Khóa Học

- ✅ Tự động xóa bài học khi xóa khóa học (Cascade Delete)
- ✅ Kiểm tra JLPT Level tồn tại trước khi tạo
- ✅ Trả về số lượng bài học trong mỗi khóa học
- ✅ Sắp xếp theo tên khóa học

### Bài Học

- ✅ Tự động xóa tiến trình học tập khi xóa bài học
- ✅ Tự động xóa các chủ đề liên kết khi xóa bài học
- ✅ Lấy bài học theo khóa học cụ thể
- ✅ Trả về số lượng câu hỏi trong mỗi bài học
- ✅ Hỗ trợ lấy danh sách SkillType để UI sử dụng

---

## 🧹 Xử Lý Lỗi

Tất cả endpoint trả về format chuẩn:

```json
{
  "success": true/false,
  "message": "Mô tả",
  "data": {} // (nếu có)
}
```

**Mã Lỗi Phổ Biến:**

- `400 Bad Request` - Dữ liệu không hợp lệ
- `401 Unauthorized` - Không có token
- `403 Forbidden` - Không phải Admin
- `404 Not Found` - Không tìm thấy tài nguyên
- `500 Internal Server Error` - Lỗi máy chủ

---

## 📖 Tài Liệu Chi Tiết

Xem tệp `API_DOCUMENTATION_COURSES_LESSONS.md` để có hướng dẫn chi tiết:

- Ví dụ CURL
- Mô tả từng endpoint
- Mối quan hệ dữ liệu
- Quy tắc kinh doanh

---

## 🔧 Quy Trình Phát Triển Frontend

1. **Lấy danh sách khóa học:**

   ```
   GET /api/admin/courses/metadata
   ```

2. **Tạo khóa học mới:**

   ```
   POST /api/admin/courses/create
   ```

3. **Lấy bài học trong khóa học:**

   ```
   GET /api/admin/lessons/get-by-course/{courseId}
   ```

4. **Tạo bài học:**

   ```
   POST /api/admin/lessons/create
   ```

5. **Lấy loại kỹ năng:**
   ```
   GET /api/admin/lessons/skill-types
   ```

---

## 🔄 Quan Hệ Dữ Liệu

```
JLPT_Level (1)
    ↓
    ├── Courses (N)
    │    ↓
    │    └── Lessons (N)
    │         ├── Questions (N)
    │         ├── Progress (N)
    │         └── Lessons_Topic (N)
```

---

## 📊 Build Status

✅ **Build Successful** (8.9s)

- Không có error
- 279 warnings (non-critical, nullable property warnings)
- Code compiled thành công

---

## 🚀 Sẵn Sàng Triển Khai

Tất cả code đã:

- ✅ Compiled thành công
- ✅ Tuân theo pattern hiện tại (TopicsAdminController, VocabAdminController)
- ✅ Có error handling đầy đủ
- ✅ Hỗ trợ transaction safety
- ✅ Có validation cho dữ liệu đầu vào

---

## 📝 Ghi Chú

- Tất cả ID sử dụng GUID format
- Xóa dữ liệu sẽ xóa tất cả liên kết (Cascade Delete)
- Response luôn có `success` field để xác định kết quả
- API hỗ trợ phân trang thông qua `metadata` endpoints
