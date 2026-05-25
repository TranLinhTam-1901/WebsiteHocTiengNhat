# Hướng Dẫn Test CRUD Khóa Học & Bài Học

## Chuẩn Bị

### 1. Lấy Admin Token

Đã đăng nhập như admin, lấy JWT token từ response.

### 2. Lấy JLPT Level ID

```bash
GET /api/admin/lessons/skill-types
```

Để xem các cấp độ JLPT khả dụng (hoặc truy vấn trực tiếp database).

---

## Test Khóa Học (Courses)

### Test 1: Lấy Danh Sách Khóa Học

```bash
curl -X GET "https://localhost:7001/api/admin/courses/get-all" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Status 200, danh sách khóa học

---

### Test 2: Tạo Khóa Học Mới

```bash
curl -X POST "https://localhost:7001/api/admin/courses/create" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseName": "Tiếng Nhật N5 - Cơ Bản",
    "description": "Khóa học dành cho người mới bắt đầu",
    "levelID": "YOUR_LEVEL_ID"
  }'
```

**Expected:** Status 201, `"success": true`, trả về `courseID`

**Lưu ID trả về để dùng trong test tiếp theo.**

---

### Test 3: Lấy Chi Tiết Khóa Học

```bash
curl -X GET "https://localhost:7001/api/admin/courses/get-by-id/YOUR_COURSE_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Status 200, chi tiết khóa học với danh sách bài học

---

### Test 4: Cập Nhật Khóa Học

```bash
curl -X PUT "https://localhost:7001/api/admin/courses/update/YOUR_COURSE_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseName": "Tiếng Nhật N5 - Cơ Bản (Cập Nhật)",
    "description": "Mô tả cập nhật",
    "levelID": "YOUR_LEVEL_ID"
  }'
```

**Expected:** Status 200, `"success": true`

---

### Test 5: Lấy Metadata Khóa Học

```bash
curl -X GET "https://localhost:7001/api/admin/courses/metadata" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Status 200, danh sách id và name cho dropdown

---

## Test Bài Học (Lessons)

### Test 1: Lấy Danh Sách SkillType

```bash
curl -X GET "https://localhost:7001/api/admin/lessons/skill-types" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Status 200, danh sách SkillType với giá trị 0-6

---

### Test 2: Tạo Bài Học Mới

```bash
curl -X POST "https://localhost:7001/api/admin/lessons/create" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseID": "YOUR_COURSE_ID",
    "title": "Bài 1: Từ Vựng Cơ Bản",
    "skillType": 1,
    "difficulty": 1,
    "priority": 1
  }'
```

**Expected:** Status 201, `"success": true`, trả về `lessonID`

**Lưu ID trả về để dùng trong test tiếp theo.**

---

### Test 3: Lấy Bài Học Theo Khóa Học

```bash
curl -X GET "https://localhost:7001/api/admin/lessons/get-by-course/YOUR_COURSE_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Status 200, danh sách bài học trong khóa học

---

### Test 4: Lấy Chi Tiết Bài Học

```bash
curl -X GET "https://localhost:7001/api/admin/lessons/get-by-id/YOUR_LESSON_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Status 200, chi tiết bài học với topics và questions

---

### Test 5: Cập Nhật Bài Học

```bash
curl -X PUT "https://localhost:7001/api/admin/lessons/update/YOUR_LESSON_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseID": "YOUR_COURSE_ID",
    "title": "Bài 1: Từ Vựng Cơ Bản (Cập Nhật)",
    "skillType": 1,
    "difficulty": 2,
    "priority": 1
  }'
```

**Expected:** Status 200, `"success": true`

---

### Test 6: Lấy Danh Sách Tất Cả Bài Học

```bash
curl -X GET "https://localhost:7001/api/admin/lessons/get-all" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Status 200, danh sách tất cả bài học

---

### Test 7: Lấy Metadata Bài Học

```bash
curl -X GET "https://localhost:7001/api/admin/lessons/metadata" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Status 200, danh sách id và title cho dropdown

---

## Test Xóa (Delete)

### Test 1: Xóa Bài Học

```bash
curl -X DELETE "https://localhost:7001/api/admin/lessons/delete/YOUR_LESSON_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Status 200, `"success": true`

**Verify:** Bài học đã bị xóa bằng cách gọi get-by-course

---

### Test 2: Xóa Khóa Học

```bash
curl -X DELETE "https://localhost:7001/api/admin/courses/delete/YOUR_COURSE_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Status 200, `"success": true`

**Note:** Tất cả bài học trong khóa học cũng sẽ bị xóa

---

## Test Lỗi (Error Cases)

### Test 1: Tạo Khóa Học Với Level Không Tồn Tại

```bash
curl -X POST "https://localhost:7001/api/admin/courses/create" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseName": "Test Course",
    "description": "Test",
    "levelID": "00000000-0000-0000-0000-000000000000"
  }'
```

**Expected:** Status 400, `"success": false`, message: "Cấp độ JLPT không tồn tại"

---

### Test 2: Tạo Bài Học Với Course Không Tồn Tại

```bash
curl -X POST "https://localhost:7001/api/admin/lessons/create" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseID": "00000000-0000-0000-0000-000000000000",
    "title": "Test Lesson",
    "skillType": 1,
    "difficulty": 1,
    "priority": 1
  }'
```

**Expected:** Status 400, `"success": false`, message: "Khóa học không tồn tại"

---

### Test 3: Tạo Khóa Học Với Tên Trống

```bash
curl -X POST "https://localhost:7001/api/admin/courses/create" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseName": "",
    "description": "Test",
    "levelID": "YOUR_LEVEL_ID"
  }'
```

**Expected:** Status 400, `"success": false`, message: "Tên khóa học không được để trống"

---

### Test 4: Truy Cập Mà Không Có Token

```bash
curl -X GET "https://localhost:7001/api/admin/courses/get-all"
```

**Expected:** Status 401, Unauthorized

---

### Test 5: Truy Cập Với User Không Phải Admin

```bash
# Dùng token của User bình thường
curl -X GET "https://localhost:7001/api/admin/courses/get-all" \
  -H "Authorization: Bearer USER_TOKEN"
```

**Expected:** Status 403, Forbidden

---

## Test Performance

### Test 1: Lấy Danh Sách Lớn

Tạo 100 khóa học và bài học, kiểm tra response time.

### Test 2: Concurrent Requests

Gửi 10 requests cùng lúc để tạo khóa học/bài học.

---

## Checklist Hoàn Thành

- [ ] Test tạo mới khóa học
- [ ] Test tạo mới bài học
- [ ] Test cập nhật khóa học
- [ ] Test cập nhật bài học
- [ ] Test xóa bài học
- [ ] Test xóa khóa học (cascade)
- [ ] Test lấy danh sách
- [ ] Test lấy chi tiết
- [ ] Test metadata/dropdown
- [ ] Test error handling
- [ ] Test authorization (admin only)
- [ ] Test validation (dữ liệu trống, không tồn tại)
- [ ] Test cascade delete
- [ ] Test response format

---

## Ghi Chú

- Thay `YOUR_TOKEN` bằng JWT token thực tế
- Thay `YOUR_COURSE_ID`, `YOUR_LESSON_ID`, `YOUR_LEVEL_ID` bằng ID thực tế
- Sử dụng Postman hoặc Insomnia để test dễ hơn
- Kiểm tra database để verify dữ liệu sau mỗi test
