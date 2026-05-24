# API CRUD Khóa Học và Bài Học - Hướng Dẫn Sử Dụng

## Giới Thiệu

Tài liệu này cung cấp hướng dẫn chi tiết về các API Endpoint cho quản lý Khóa Học (Courses) và Bài Học (Lessons) trong hệ thống. Tất cả các endpoint đều yêu cầu quyền Admin.

---

## Yêu Cầu Chung

### Authentication

- Tất cả các endpoint yêu cầu JWT token với role `Admin`
- Header: `Authorization: Bearer <token>`

### Base URLs

- Courses: `api/admin/courses`
- Lessons: `api/admin/lessons`

---

## API KHÓA HỌC (Courses)

### 1. Lấy Danh Sách Tất Cả Khóa Học

**GET** `/api/admin/courses/get-all`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "courseID": "guid",
      "courseName": "Tiếng Nhật N5 - Cơ Bản",
      "description": "Khóa học dành cho người mới bắt đầu",
      "levelID": "guid",
      "levelName": "N5",
      "lessonCount": 10
    }
  ]
}
```

---

### 2. Lấy Chi Tiết Khóa Học

**GET** `/api/admin/courses/get-by-id/{courseID}`

**Parameters:**

- `courseID` (Guid): ID của khóa học

**Response:**

```json
{
  "success": true,
  "data": {
    "courseID": "guid",
    "courseName": "Tiếng Nhật N5 - Cơ Bản",
    "description": "Khóa học dành cho người mới bắt đầu",
    "levelID": "guid",
    "levelName": "N5",
    "lessons": [
      {
        "lessonID": "guid",
        "title": "Bài 1: Từ Vựng Cơ Bản",
        "skillType": 1,
        "difficulty": 1,
        "priority": 1
      }
    ]
  }
}
```

---

### 3. Thêm Mới Khóa Học

**POST** `/api/admin/courses/create`

**Request Body:**

```json
{
  "courseName": "Tiếng Nhật N5 - Cơ Bản",
  "description": "Khóa học dành cho người mới bắt đầu",
  "levelID": "guid"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Thêm khóa học thành công",
  "courseID": "guid"
}
```

---

### 4. Cập Nhật Khóa Học

**PUT** `/api/admin/courses/update/{courseID}`

**Parameters:**

- `courseID` (Guid): ID của khóa học

**Request Body:**

```json
{
  "courseName": "Tiếng Nhật N5 - Cơ Bản (Cập Nhật)",
  "description": "Mô tả cập nhật",
  "levelID": "guid"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Cập nhật khóa học thành công"
}
```

---

### 5. Xóa Khóa Học

**DELETE** `/api/admin/courses/delete/{courseID}`

**Parameters:**

- `courseID` (Guid): ID của khóa học

**Response:**

```json
{
  "success": true,
  "message": "Xóa khóa học thành công"
}
```

> **Lưu ý:** Khi xóa khóa học, tất cả các bài học trong khóa học cũng sẽ bị xóa.

---

### 6. Lấy Metadata Khóa Học (Dropdown)

**GET** `/api/admin/courses/metadata`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "courseID": "guid",
      "courseName": "Tiếng Nhật N5 - Cơ Bản"
    }
  ]
}
```

---

## 🎓 API BÀI HỌC (Lessons)

### 1. Lấy Danh Sách Tất Cả Bài Học

**GET** `/api/admin/lessons/get-all`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "lessonID": "guid",
      "courseID": "guid",
      "courseName": "Tiếng Nhật N5 - Cơ Bản",
      "title": "Bài 1: Từ Vựng Cơ Bản",
      "skillType": 1,
      "difficulty": 1,
      "priority": 1,
      "questionCount": 5
    }
  ]
}
```

---

### 2. Lấy Danh Sách Bài Học Theo Khóa Học

**GET** `/api/admin/lessons/get-by-course/{courseID}`

**Parameters:**

- `courseID` (Guid): ID của khóa học

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "lessonID": "guid",
      "title": "Bài 1: Từ Vựng Cơ Bản",
      "skillType": 1,
      "difficulty": 1,
      "priority": 1,
      "questionCount": 5
    }
  ]
}
```

---

### 3. Lấy Chi Tiết Bài Học

**GET** `/api/admin/lessons/get-by-id/{lessonID}`

**Parameters:**

- `lessonID` (Guid): ID của bài học

**Response:**

```json
{
  "success": true,
  "data": {
    "lessonID": "guid",
    "courseID": "guid",
    "courseName": "Tiếng Nhật N5 - Cơ Bản",
    "title": "Bài 1: Từ Vựng Cơ Bản",
    "skillType": 1,
    "difficulty": 1,
    "priority": 1,
    "topics": [
      {
        "topicID": "guid",
        "topicName": "Từ Vựng Hàng Ngày"
      }
    ],
    "questions": [
      {
        "questionID": "guid",
        "content": "Câu hỏi mẫu"
      }
    ]
  }
}
```

---

### 4. Thêm Mới Bài Học

**POST** `/api/admin/lessons/create`

**Request Body:**

```json
{
  "courseID": "guid",
  "title": "Bài 1: Từ Vựng Cơ Bản",
  "skillType": 1,
  "difficulty": 1,
  "priority": 1
}
```

**SkillType Values:**

- `0`: General (Bài học tổng hợp)
- `1`: Vocabulary (Từ Vựng)
- `2`: Grammar (Ngữ Pháp)
- `3`: Kanji (Kanji)
- `4`: Reading (Đọc)
- `5`: Listening (Nghe)
- `6`: Practice (Luyện Tập)

**Response:**

```json
{
  "success": true,
  "message": "Thêm bài học thành công",
  "lessonID": "guid"
}
```

---

### 5. Cập Nhật Bài Học

**PUT** `/api/admin/lessons/update/{lessonID}`

**Parameters:**

- `lessonID` (Guid): ID của bài học

**Request Body:**

```json
{
  "courseID": "guid",
  "title": "Bài 1: Từ Vựng Cơ Bản (Cập Nhật)",
  "skillType": 1,
  "difficulty": 2,
  "priority": 1
}
```

**Response:**

```json
{
  "success": true,
  "message": "Cập nhật bài học thành công"
}
```

---

### 6. Xóa Bài Học

**DELETE** `/api/admin/lessons/delete/{lessonID}`

**Parameters:**

- `lessonID` (Guid): ID của bài học

**Response:**

```json
{
  "success": true,
  "message": "Xóa bài học thành công"
}
```

> **Lưu ý:** Khi xóa bài học, tất cả các tiến trình học tập và chủ đề liên kết cũng sẽ bị xóa.

---

### 7. Lấy Metadata Bài Học (Dropdown)

**GET** `/api/admin/lessons/metadata`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "lessonID": "guid",
      "title": "Bài 1: Từ Vựng Cơ Bản"
    }
  ]
}
```

---

### 8. Lấy Danh Sách SkillType

**GET** `/api/admin/lessons/skill-types`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "value": 0,
      "name": "General"
    },
    {
      "value": 1,
      "name": "Vocabulary"
    },
    {
      "value": 2,
      "name": "Grammar"
    },
    {
      "value": 3,
      "name": "Kanji"
    },
    {
      "value": 4,
      "name": "Reading"
    },
    {
      "value": 5,
      "name": "Listening"
    },
    {
      "value": 6,
      "name": "Practice"
    }
  ]
}
```

---

## Cấu Trúc Thư Mục

```
BE/
├── Controllers/
│   └── Admins/
│       ├── CoursesAdminController.cs  (CRUD Khóa Học)
│       └── LessonsAdminController.cs  (CRUD Bài Học)
├── DTOs/
│   └── Admin/
│       ├── Course/
│       │   ├── CourseDTO.cs
│       │   └── CreateUpdateCourseDTO.cs
│       └── Lesson/
│           ├── LessonDTO.cs
│           └── CreateUpdateLessonDTO.cs
└── Models/
    ├── Courses.cs
    └── Lessons.cs
```

---

## Mối Quan Hệ

### Khóa Học (Courses)

- **1 Khóa Học** → **Nhiều Bài Học**
- **1 Khóa Học** → **1 Cấp Độ JLPT**

### Bài Học (Lessons)

- **1 Bài Học** → **Nhiều Câu Hỏi**
- **1 Bài Học** → **Nhiều Chủ Đề**
- **1 Bài Học** → **1 Khóa Học**

---

## Thông Báo Lỗi

Tất cả các response lỗi sẽ có format:

```json
{
  "success": false,
  "message": "Mô tả lỗi"
}
```

### Mã Lỗi Thường Gặp

- `400 Bad Request`: Dữ liệu không hợp lệ
- `401 Unauthorized`: Không có quyền truy cập
- `403 Forbidden`: Chỉ Admin có thể truy cập
- `404 Not Found`: Không tìm thấy dữ liệu
- `500 Internal Server Error`: Lỗi máy chủ

---

## Ghi Chú

- Tất cả IDs sử dụng định dạng **GUID**
- Quyền truy cập yêu cầu **role Admin**
- Các thay đổi được lưu trữ trong **database tự động**
- Xóa dữ liệu sẽ xóa tất cả dữ liệu liên quan (Cascade Delete)
