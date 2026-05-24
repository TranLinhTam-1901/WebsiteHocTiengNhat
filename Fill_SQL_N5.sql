-------------------------------------------------------
-- 0. DỌN DẸP VÀ CẤU HÌNH RÀNG BUỘC
-------------------------------------------------------
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- 1. Vòng lặp tìm các ràng buộc FK và Unique để xóa (Tránh lỗi khi Truncate/Insert)
    FOR r IN (
        SELECT table_name, constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE constraint_schema = 'public' 
          AND constraint_type IN ('FOREIGN KEY', 'UNIQUE')
          AND table_name NOT LIKE 'AspNet%'
          AND table_name NOT IN ('__EFMigrationsHistory')
    ) LOOP
        BEGIN
            EXECUTE 'ALTER TABLE "' || r.table_name || '" DROP CONSTRAINT IF EXISTS "' || r.constraint_name || '" CASCADE';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Bỏ qua % trên bảng %', r.constraint_name, r.table_name;
        END;
    END LOOP;

    -- 2. Reset dữ liệu bao gồm cả các bảng mới bổ sung
    -- Thứ tự bảng trong TRUNCATE không quan trọng khi dùng CASCADE, nhưng liệt kê đủ là cần thiết
    EXECUTE 'TRUNCATE TABLE 
        "UserAnswerHistories", "Exam_Result_Details", "Exam_Results", "Exam_Questions", "Exams",
        "ExamTemplateDetails", "ExamTemplates", "User_Skill_Matrices",
        "Answers", "Questions", "Questions_Topics",
        "VocabularyKanjis", "VocabWordTypes", "Vocabularies", 
        "Grammars", "GrammarGroups", "Kanjis", "RadicalVariants", "Radicals", "WordTypes",
        "Readings", "Listenings", "Examples", 
        "Lessons_Topics", "Lessons", "Topics", "Courses", "JLPT_Levels", 
		"GrammarTopics", "ReadingTopics", "ListeningTopics", "VocabTopics"
    RESTART IDENTITY CASCADE';

    RAISE NOTICE '=== ĐÃ DỌN DẸP SẠCH DỮ LIỆU VÀ RÀNG BUỘC (FK/UNIQUE) ===';
END $$;

-------------------------------------------------------
-- 1. RÀNG BUỘC UNIQUE VÀ CẤU TRÚC BỔ SUNG
-------------------------------------------------------
DO $$
BEGIN
    -------------------------------------------------------
    -- 1. Bảng JLPT_Levels, Courses, Topics
    -------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_jlpt_levelname') THEN
        ALTER TABLE "JLPT_Levels" ADD CONSTRAINT uc_jlpt_levelname UNIQUE ("LevelName");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_coursename') THEN
        ALTER TABLE "Courses" ADD CONSTRAINT uc_coursename UNIQUE ("CourseName");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_topicname') THEN
        ALTER TABLE "Topics" ADD CONSTRAINT uc_topicname UNIQUE ("TopicName");
    END IF;

    -------------------------------------------------------
    -- 2. Bảng Radicals (MỚI)
    -------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_radical_character') THEN
        ALTER TABLE "Radicals" ADD CONSTRAINT uc_radical_character UNIQUE ("Character");
    END IF;

	-------------------------------------------------------
    -- 3. Bảng RadicalVariants (MỚI)
    -------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_radicalvariants_character') THEN
        ALTER TABLE "RadicalVariants" ADD CONSTRAINT uc_radicalvariants_character UNIQUE ("Character");
    END IF;

    -------------------------------------------------------
    -- 4. Bảng WordTypes (MỚI)
    -------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_wordtype_name') THEN
        ALTER TABLE "WordTypes" ADD CONSTRAINT uc_wordtype_name UNIQUE ("Name");
    END IF;

    -------------------------------------------------------
    -- 5. Bảng GrammarGroups (MỚI)
    -------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_grammargroup_name') THEN
        ALTER TABLE "GrammarGroups" ADD CONSTRAINT uc_grammargroup_name UNIQUE ("GroupName");
    END IF;

    -------------------------------------------------------
    -- 6. Bảng Lessons (Ràng buộc tiêu đề theo khóa học)
    -------------------------------------------------------
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_lessontitle') THEN
        ALTER TABLE "Lessons" DROP CONSTRAINT "uc_lessontitle";
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_title_course') THEN
        ALTER TABLE "Lessons" ADD CONSTRAINT "uc_title_course" UNIQUE ("Title", "CourseID");
    END IF;

    -------------------------------------------------------
    -- 7. Bảng Vocabularies & Kanjis
    -------------------------------------------------------
    -- Một từ vựng có cùng cách đọc không được trùng (VD: Tránh 2 từ 'Học' cùng reading 'まなぶ')
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_word_reading') THEN
        ALTER TABLE "Vocabularies" ADD CONSTRAINT uc_word_reading UNIQUE ("Word", "Reading");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_kanjicharacter') THEN
        ALTER TABLE "Kanjis" ADD CONSTRAINT uc_kanjicharacter UNIQUE ("Character");
    END IF;

    -------------------------------------------------------
    -- 8. Bảng Grammars
    -------------------------------------------------------
    -- Tránh trùng lặp cấu trúc có cùng ý nghĩa
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_grammar_structure_meaning') THEN
        ALTER TABLE "Grammars" ADD CONSTRAINT uc_grammar_structure_meaning UNIQUE ("Structure", "Meaning");
    END IF;

    -------------------------------------------------------
    -- 9. Bảng Examples (Ràng buộc nội dung ví dụ)
    -------------------------------------------------------
    -- Một ví dụ không được lặp lại cho cùng 1 từ vựng/ngữ pháp
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_example_vocab') THEN
        ALTER TABLE "Examples" ADD CONSTRAINT uc_example_vocab UNIQUE ("Content", "VocabID");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_example_grammar') THEN
        ALTER TABLE "Examples" ADD CONSTRAINT uc_example_grammar UNIQUE ("Content", "GrammarID");
    END IF;

    -------------------------------------------------------
    -- 10. Bảng Readings & Listenings
    -------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_reading_title') THEN
        ALTER TABLE "Readings" ADD CONSTRAINT uc_reading_title UNIQUE ("Title");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_listening_title') THEN
        ALTER TABLE "Listenings" ADD CONSTRAINT uc_listening_title UNIQUE ("Title");
    END IF;

    -------------------------------------------------------
    -- 11. Cấu hình Cột bổ sung (Nếu Migration chưa tạo)
    -------------------------------------------------------
    -- Bổ sung cột cho Listenings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Listenings' AND column_name='AudioURL') THEN
        ALTER TABLE "Listenings" ADD COLUMN "AudioURL" TEXT;
    END IF;
    
    -- Bổ sung cột cho Grammars (Sắc thái & Nhóm)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Grammars' AND column_name='Formality') THEN
        ALTER TABLE "Grammars" ADD COLUMN "Formality" INT DEFAULT 0;
    END IF;

    -------------------------------------------------------
    -- 12. Cấu hình CASCADE DELETE (Đảm bảo dọn dẹp sạch dữ liệu con)
    -------------------------------------------------------
    -- Questions từ Readings
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_Questions_Readings_ReadingID') THEN
        ALTER TABLE "Questions" DROP CONSTRAINT "FK_Questions_Readings_ReadingID";
    END IF;
    ALTER TABLE "Questions" ADD CONSTRAINT "FK_Questions_Readings_ReadingID" 
        FOREIGN KEY ("ReadingID") REFERENCES "Readings" ("ReadingID") ON DELETE CASCADE;

    -- Questions từ Listenings
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_Questions_Listenings_ListeningID') THEN
        ALTER TABLE "Questions" DROP CONSTRAINT "FK_Questions_Listenings_ListeningID";
    END IF;
    ALTER TABLE "Questions" ADD CONSTRAINT "FK_Questions_Listenings_ListeningID" 
        FOREIGN KEY ("ListeningID") REFERENCES "Listenings" ("ListeningID") ON DELETE CASCADE;

    -- Answers từ Questions
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_Answers_Questions_QuestionID') THEN
        ALTER TABLE "Answers" DROP CONSTRAINT "FK_Answers_Questions_QuestionID";
    END IF;
    ALTER TABLE "Answers" ADD CONSTRAINT "FK_Answers_Questions_QuestionID" 
        FOREIGN KEY ("QuestionID") REFERENCES "Questions" ("QuestionID") ON DELETE CASCADE;

    RAISE NOTICE '=== ĐÃ CẬP NHẬT TẤT CẢ RÀNG BUỘC VÀ BẢNG BỔ SUNG THÀNH CÔNG ===';
END $$;

-------------------------------------------------------
-- 2. KHỞI TẠO DANH MỤC HỆ THỐNG (LEVELS, COURSES, TYPES)
-------------------------------------------------------

DO $$
DECLARE 
    -- 1. ID cố định cho Levels
    level_n5_id uuid := '550e8400-e29b-41d4-a716-446655440000';
    level_n4_id uuid := '550e8400-e29b-41d4-a716-446655440001';
    level_n3_id uuid := '550e8400-e29b-41d4-a716-446655440002';
    level_n2_id uuid := '550e8400-e29b-41d4-a716-446655440003';
    level_n1_id uuid := '550e8400-e29b-41d4-a716-446655440004';

    -- 2. ID cố định cho Courses
    course_n5_id uuid := '11111111-1111-1111-1111-111111111111';
    course_n4_id uuid := '22222222-2222-2222-2222-222222222222';
    course_n3_id uuid := '33333333-3333-3333-3333-333333333333';
    course_n2_id uuid := '44444444-4444-4444-4444-444444444444';
    course_n1_id uuid := '55555555-5555-5555-5555-555555555555';

    -- 3. ID cố định cho WordTypes (Rất quan trọng để chèn Vocab sau này)
    t_danh_tu      uuid := 'a1111111-1111-1111-1111-111111111111';
    t_dong_tu_1    uuid := 'a2222222-2222-2222-2222-222222222222';
    t_dong_tu_2    uuid := 'a3333333-3333-3333-3333-333333333333';
    t_dong_tu_3    uuid := 'a4444444-4444-4444-4444-444444444444';
    t_tinh_tu_i    uuid := 'a5555555-5555-5555-5555-555555555555';
    t_tinh_tu_na   uuid := 'a6666666-6666-6666-6666-666666666666';
    t_trang_tu     uuid := 'a7777777-7777-7777-7777-777777777777';
    t_tro_tu       uuid := 'a8888888-8888-8888-8888-888888888888';
    t_lien_tu      uuid := 'a9999999-9999-9999-9999-999999999999';
    t_tu_dong_tu   uuid := 'b1111111-1111-1111-1111-111111111111';
    t_tha_dong_tu  uuid := 'b2222222-2222-2222-2222-222222222222';
    t_than_tu      uuid := 'b3333333-3333-3333-3333-333333333333';
	t_tu_nghi_van  uuid := 'b4444444-4444-4444-4444-444444444444';
	t_phu_tu       uuid := 'b5555555-5555-5555-5555-555555555555';
	t_dai_tu       uuid := 'b6666666-6666-6666-6666-666666666666';
BEGIN
    -------------------------------------------------------
    -- 1. TẠO CÁC LEVEL (JLPT_Levels)
    -------------------------------------------------------
    INSERT INTO "JLPT_Levels" ("LevelID", "LevelName") VALUES 
    (level_n5_id, 'N5'),
    (level_n4_id, 'N4'),
    (level_n3_id, 'N3'),
    (level_n2_id, 'N2'),
    (level_n1_id, 'N1')
    ON CONFLICT ("LevelName") DO NOTHING;

    -------------------------------------------------------
    -- 2. TẠO CÁC LOẠI TỪ (WordTypes) - MỚI
    -------------------------------------------------------
    INSERT INTO "WordTypes" ("WordTypeID", "Name", "Description") VALUES
    (t_danh_tu,     'Danh từ',           'Meishi - Từ chỉ vật, người, hiện tượng'),
    (t_dong_tu_1,   'Động từ nhóm 1',    'Godan Doushi - Động từ chia 5 cột'),
    (t_dong_tu_2,   'Động từ nhóm 2',    'Ichidan Doushi - Động từ có đuôi -iru/-eru'),
    (t_dong_tu_3,   'Động từ nhóm 3',    'Suru/Kuru Doushi - Động từ bất quy tắc'),
    (t_tinh_tu_i,   'Tính từ đuôi i',    'I-keiyoushi - Tính từ kết thúc bằng đuôi い'),
    (t_tinh_tu_na,  'Tính từ đuôi na',   'Na-keiyoushi - Tính từ kết thúc bằng đuôi な'),
    (t_trang_tu,    'Trạng từ',          'Fukushi - Bổ nghĩa cho động từ/tính từ'),
    (t_tro_tu,      'Trợ từ',            'Joshi - Các từ như は, が, を, に...'),
    (t_lien_tu,     'Liên từ',           'Setsuzokushi - Từ nối câu như それから, しかし'),
    (t_tu_dong_tu,  'Tự động từ',        'Jidoushi - Hành động không tác động lên vật khác'),
    (t_tha_dong_tu, 'Tha động từ',       'Tadoushi - Hành động có đối tượng tác động'),
    (t_than_tu,     'Thán từ',           'Kandoushi - Từ biểu cảm như あっ, ええと')
    ON CONFLICT ("Name") DO NOTHING;

    -------------------------------------------------------
    -- 3. TẠO NHÓM NGỮ PHÁP (GrammarGroups) - MỚI
    -------------------------------------------------------
    INSERT INTO "GrammarGroups" ("GrammarGroupID", "GroupName", "Description") VALUES
    (gen_random_uuid(), 'Câu điều kiện', 'Các mẫu ngữ pháp giả định (tara, ba, nara, to...)'),
    (gen_random_uuid(), 'Sự biến đổi', 'Trở nên, trở thành, quyết định làm gì (naru, suru...)'),
    (gen_random_uuid(), 'Khả năng', 'Có thể, năng lực làm gì đó (v-eru, koto ga dekiru...)'),
    (gen_random_uuid(), 'Cho nhận', 'Hành động tặng, cho, nhận (ageru, kureru, morau, te-ageru...)'),
    (gen_random_uuid(), 'Sự truyền đạt', 'Trích dẫn lời nói, tin đồn (to iu, rashii, soo da...)'),
    (gen_random_uuid(), 'Ý chí - Dự định', 'Dự định, ý định thực hiện (tsumori, yoo to omou, koto ni suru...)'),
    (gen_random_uuid(), 'Nguyên nhân - Kết quả', 'Vì, do là (kara, node, tame ni, oka-ge de...)'),
    (gen_random_uuid(), 'Sự so sánh', 'Hơn, kém, nhất, giống như (yori, hou ga, hodo, mitai da...)'),
    (gen_random_uuid(), 'Thời điểm - Trình tự', 'Trước, sau, trong khi (mae ni, ato de, uchi ni, nagara...)'),
    (gen_random_uuid(), 'Cung kính - Khiêm nhường', 'Kính ngữ (Sonkeigo, Kenjougo, Teineigo)'),
    (gen_random_uuid(), 'Sự phỏng đoán', 'Chắc là, có lẽ là (darou, kamoshirenai, hazu da...)'),
    (gen_random_uuid(), 'Bắt buộc - Cấm đoán', 'Phải làm, không được làm (nakereba naranai, te wa ikenai...)'),
    (gen_random_uuid(), 'Yêu cầu - Nhờ vả', 'Mệnh lệnh, nhờ vả (te kudasai, nasai, kure...)')
    ON CONFLICT ("GroupName") DO NOTHING;

    -------------------------------------------------------
    -- 4. TẠO CÁC TOPIC TỔNG QUÁT
    -------------------------------------------------------
    INSERT INTO "Topics" ("TopicID", "TopicName", "Description") VALUES
    -- Nhóm theo giáo trình
    (gen_random_uuid(), 'Minna no Nihongo I', 'Bài 1 đến Bài 25 - Sơ cấp 1'),
    (gen_random_uuid(), 'Minna no Nihongo II', 'Bài 26 đến Bài 50 - Sơ cấp 2'),

	-- Nhóm theo N5
	(gen_random_uuid(), 'Kanji N5', 'Tổng hợp Kanji N5'),
	(gen_random_uuid(), 'Từ vựng N5', 'Tổng hợp Từ vựng N5'),
	(gen_random_uuid(), 'Ngữ pháp N5', 'Tổng hợp Ngữ pháp N5'),
	(gen_random_uuid(), 'Bài đọc N5', 'Tổng hợp Bài đọc N5'),
	(gen_random_uuid(), 'Bài nghe N5', 'Tổng hợp Bài nghe N5'),
	-- Nhóm theo N4
	(gen_random_uuid(), 'Kanji N4', 'Tổng hợp Kanji N4'),
	(gen_random_uuid(), 'Từ vựng N4', 'Tổng hợp Từ vựng N4'),
	(gen_random_uuid(), 'Ngữ pháp N4', 'Tổng hợp Ngữ pháp N4'),
	(gen_random_uuid(), 'Bài đọc N4', 'Tổng hợp Bài đọc N4'),
	(gen_random_uuid(), 'Bài nghe N4', 'Tổng hợp Bài nghe N4'),
	-- Nhóm theo N3
	(gen_random_uuid(), 'Kanji N3', 'Tổng hợp Kanji N3'),
	(gen_random_uuid(), 'Từ vựng N3', 'Tổng hợp Từ vựng N3'),
	(gen_random_uuid(), 'Ngữ pháp N3', 'Tổng hợp Ngữ pháp N3'),
	(gen_random_uuid(), 'Bài đọc N3', 'Tổng hợp Bài đọc N3'),
	(gen_random_uuid(), 'Bài nghe N3', 'Tổng hợp Bài nghe N3'),
	-- Nhóm theo N2
	(gen_random_uuid(), 'Kanji N2', 'Tổng hợp Kanji N2'),
	(gen_random_uuid(), 'Từ vựng N2', 'Tổng hợp Từ vựng N2'),
	(gen_random_uuid(), 'Ngữ pháp N2', 'Tổng hợp Ngữ pháp N2'),
	(gen_random_uuid(), 'Bài đọc N2', 'Tổng hợp Bài đọc N2'),
	(gen_random_uuid(), 'Bài nghe N2', 'Tổng hợp Bài nghe N2'),
	-- Nhóm theo N1
	(gen_random_uuid(), 'Kanji N1', 'Tổng hợp Kanji N1'),
	(gen_random_uuid(), 'Từ vựng N1', 'Tổng hợp Từ vựng N1'),
	(gen_random_uuid(), 'Ngữ pháp N1', 'Tổng hợp Ngữ pháp N1'),
	(gen_random_uuid(), 'Bài đọc N1', 'Tổng hợp Bài đọc N1'),
	(gen_random_uuid(), 'Bài nghe N1', 'Tổng hợp Bài nghe N1'),
    
    
    -- Nhóm theo đời sống (Dùng cho Vocab/Listening)
    (gen_random_uuid(), 'Giới thiệu bản thân', 'Chào hỏi, quốc tịch, nghề nghiệp'),
    (gen_random_uuid(), 'Mua sắm & Giá cả', 'Đi chợ, siêu thị, mặc cả, đơn vị đếm'),
    (gen_random_uuid(), 'Ăn uống & Nhà hàng', 'Gọi món, hương vị, các loại món ăn'),
    (gen_random_uuid(), 'Giao thông & Đi lại', 'Tàu điện, xe buýt, hỏi đường, phương hướng'),
    (gen_random_uuid(), 'Gia đình & Nhà cửa', 'Các thành viên, đồ gia dụng, hoạt động tại nhà'),
    (gen_random_uuid(), 'Thời gian & Lịch trình', 'Giờ giấc, ngày tháng, lịch trình hàng ngày'),
    (gen_random_uuid(), 'Sức khỏe & Bệnh viện', 'Bộ phận cơ thể, triệu chứng bệnh, hiệu thuốc'),
    (gen_random_uuid(), 'Công việc & Văn phòng', 'Đồng nghiệp, máy móc văn phòng, hội họp'),
    (gen_random_uuid(), 'Sở thích & Giải trí', 'Thể thao, âm nhạc, du lịch, xem phim'),
    (gen_random_uuid(), 'Tự nhiên & Thời tiết', 'Bốn mùa, hiện tượng thiên nhiên, động vật'),
    
    -- Nhóm theo kỹ năng thi JLPT
    (gen_random_uuid(), 'Kính ngữ thường gặp', 'Tổng hợp kính ngữ trong đề thi N3-N2'),
    (gen_random_uuid(), 'Phó từ chỉ mức độ', 'Các từ như: nakanaka, zuibun, totemo...'),
    (gen_random_uuid(), 'Liên từ nối câu', 'Các từ như: soshite, sorekara, shikashi...'),
    (gen_random_uuid(), 'Từ láy tượng hình/thanh', 'Onomatopoeia (nikoniko, wakuwaku...)'),
    (gen_random_uuid(), 'Thành ngữ & Quán ngữ', 'Kanyouku - Diễn đạt ẩn dụ trong tiếng Nhật')
    ON CONFLICT ("TopicName") DO NOTHING;
    
    -------------------------------------------------------
    -- 5. TẠO CÁC KHÓA HỌC (Courses)
    -------------------------------------------------------
    INSERT INTO "Courses" ("CourseID", "CourseName", "Description", "LevelID") VALUES 
    (course_n5_id, 'Minna no Nihongo I (N5)', '25 bài đầu sơ cấp 1', level_n5_id),
    (course_n4_id, 'Minna no Nihongo II (N4)', '25 bài tiếp theo sơ cấp 2', level_n4_id),
    (course_n3_id, 'Soumatome/Shinkanzen (N3)', 'Lộ trình trung cấp', level_n3_id),
    (course_n2_id, 'Thượng cấp Nihongo (N2)', 'Lộ trình thượng cấp', level_n2_id),
    (course_n1_id, 'Chinh phục N1', 'Trình độ cao nhất', level_n1_id)
    ON CONFLICT ("CourseName") DO NOTHING;

    RAISE NOTICE '=== ĐÃ TẠO XONG DANH MỤC HỆ THỐNG TỪ N5 ĐẾN N1 ===';
END $$;

-------------------------------------------------------
-- 3. KHỞI TẠO BÀI HỌC (LESSONS) CHO N5 VÀ N4
-------------------------------------------------------
DO $$
DECLARE 
    course_n5_id uuid;
    course_n4_id uuid;
BEGIN
    -- 1. Lấy ID của các Khóa học
    SELECT "CourseID" INTO course_n5_id FROM "Courses" WHERE "CourseName" LIKE '%(N5)%' LIMIT 1;
    SELECT "CourseID" INTO course_n4_id FROM "Courses" WHERE "CourseName" LIKE '%(N4)%' LIMIT 1;

    -------------------------------------------------------
    -- 2. TẠO 25 BÀI CHO N5 (Bài 1 - 25)
    -------------------------------------------------------
    IF course_n5_id IS NOT NULL THEN
        FOR i IN 1..25 LOOP
            INSERT INTO "Lessons" ("LessonID", "Title", "SkillType", "Difficulty", "Priority", "CourseID")
            VALUES (
                gen_random_uuid(), 
                'Bài ' || i, 
                '0', -- Đồng bộ với SkillType Enum (string conversion)
                1,         -- Độ khó sơ cấp
                i,         -- Thứ tự ưu tiên
                course_n5_id
            ) ON CONFLICT ("Title", "CourseID") DO NOTHING;
        END LOOP;
        RAISE NOTICE 'Đã tạo xong 25 bài cho N5.';
    END IF;

    -------------------------------------------------------
    -- 3. TẠO 25 BÀI CHO N4 (Bài 26 - 50)
    -------------------------------------------------------
    IF course_n4_id IS NOT NULL THEN
        FOR i IN 26..50 LOOP
            INSERT INTO "Lessons" ("LessonID", "Title", "SkillType", "Difficulty", "Priority", "CourseID")
            VALUES (
                gen_random_uuid(), 
                'Bài ' || i, 
                '0',
                2,         -- Độ khó cao hơn một chút
                i,         -- Thứ tự từ 26 trở đi
                course_n4_id
            ) ON CONFLICT ("Title", "CourseID") DO NOTHING;
        END LOOP;
        RAISE NOTICE 'Đã tạo xong 25 bài cho N4.';
    ELSE
        RAISE WARNING 'Không tìm thấy Course N4, bỏ qua việc tạo Lesson N4.';
    END IF;

END $$;

-------------------------------------------------------
-- 4. NGỮ PHÁP N5: CHI TIẾT TỪ BÀI 1 ĐẾN BÀI 25
-------------------------------------------------------
DO $$
DECLARE 
    n5_id uuid := '550e8400-e29b-41d4-a716-446655440000'; -- ID cố định đã tạo ở script trước
    t_id uuid; 
    l_id uuid;
    g_id uuid;
    group_set_id uuid; -- ID cho nhóm ngữ pháp
BEGIN
    -- 1. Lấy Topic và Lesson
    SELECT "TopicID" INTO t_id FROM "Topics" WHERE "TopicName" LIKE 'Minna no Nihongo I' LIMIT 1;
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 1' LIMIT 1;
    
    -- 2. Lấy hoặc tạo một GrammarGroup cho "Câu khẳng định/Phủ định"
    -- Điều này giúp App hiển thị: "Các mẫu câu tương tự"
    SELECT "GrammarGroupID" INTO group_set_id FROM "GrammarGroups" WHERE "GroupName" = 'Câu khẳng định' LIMIT 1;
    IF group_set_id IS NULL THEN
        group_set_id := gen_random_uuid();
        INSERT INTO "GrammarGroups" ("GrammarGroupID", "GroupName", "Description") 
        VALUES (group_set_id, 'Câu khẳng định', 'Các mẫu câu giới thiệu, khẳng định sự vật');
    END IF;

    -------------------------------------------------------
    -- BÀI 1: TỔNG HỢP NGỮ PHÁP (WA, MO, NO, KA, JA ARIMASEN)
    -------------------------------------------------------
    
    -- 1. Khẳng định: N1 は N2 です
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Khẳng định', 'N1 は N2 です', 'N1 là N2', 'Dùng để khẳng định. です thể hiện sự lịch sự.', 2, 6, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
	INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
	(gen_random_uuid(), 'わたしは たなかです。', 'Tôi là Tanaka.', g_id, NOW(), NOW()), (gen_random_uuid(), 'ミラーさんは 会社員です。', 'Anh Miller là nhân viên công ty.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 2. Phủ định: N1 は N2 じゃありません
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Phủ định', 'N1 は N2 じゃありません', 'N1 không phải là N2', 'Dạng phủ định lịch sự của です.', 2, 6, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'あの方は 医者じゃありません。', 'Vị kia không phải là bác sĩ.', g_id, NOW(), NOW()), (gen_random_uuid(), 'サントスさんは 学生じゃありません。', 'Anh Santos không phải là sinh viên.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 3. Câu hỏi: S + か
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Câu hỏi', 'S + か', 'Câu hỏi (?)', 'Thêm か vào cuối câu để tạo câu hỏi.', 2, 6, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'たなかさんは 学生ですか。', 'Anh Tanaka là sinh viên phải không?', g_id, NOW(), NOW()), (gen_random_uuid(), 'あの方も 銀行員ですか.','Vị kia cũng là nhân viên ngân hàng phải không?', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 4. Trợ từ も: N1 も N2
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Đồng nhất (Cũng)', 'N1 も N2', 'N1 cũng là N2', 'Thay thế は khi đối tượng có cùng tính chất.', 2, 1, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'ミラーさんも 会社員です。', 'Anh Miller cũng là nhân viên công ty.', g_id, NOW(), NOW()), (gen_random_uuid(), 'わたしも ベトナム人です。', 'Tôi cũng là người Việt Nam.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 5. Trợ từ の: N1 の N2
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Sở hữu / Thuộc về', 'N1 の N2', 'N2 của N1', 'Nối 2 danh từ, N1 bổ nghĩa hoặc sở hữu N2.', 2, 1, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'これは 私の本です。', 'Đây là cuốn sách của tôi.', g_id, NOW(), NOW()), (gen_random_uuid(), 'あの方は IMCの社員です。', 'Vị kia là nhân viên công ty IMC.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 2: ĐẠI TỪ CHỈ ĐỊNH (KORE, KONO, SOU DESU KA, LỰA CHỌN)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 2' LIMIT 1;
    SELECT "GrammarGroupID" INTO group_set_id FROM "GrammarGroups" WHERE "GroupName" = 'Sự so sánh' LIMIT 1; -- Dùng tạm nhóm liên quan hoặc tạo mới

    -- 6. Kore/Sore/Are
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Vật gần/xa', 'これ / それ / あれ', 'Cái này / đó / kia', 'Đại từ chỉ định làm chủ ngữ đứng độc lập.', 2, 0, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'これは コンピューターです。', 'Đây là máy tính.', g_id, NOW(), NOW()), (gen_random_uuid(), 'それは 私の傘です。', 'Đó là cái ô của tôi.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 7. Kono/Sono/Ano
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Bổ nghĩa danh từ', 'この N / その N / あの N', 'Cái N này / đó / kia', 'Đi kèm sau bắt buộc là một danh từ.', 2, 10, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'この辞書は 私のです。', 'Cuốn từ điển này là của tôi.', g_id, NOW(), NOW()), (gen_random_uuid(), 'あの人は だれですか。', 'Người kia là ai vậy?', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 8. Sou desu ka
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Xác nhận thông tin', 'そうですか', 'Ra vậy / Thế à', 'Tiếp nhận thông tin mới từ người đối diện.', 2, 6, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'そうですか。わかりました。', 'Thế à. Tôi hiểu rồi.', g_id, NOW(), NOW()), (gen_random_uuid(), 'そうですか。おもしろいですね。', 'Vậy à. Thú vị nhỉ.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 9. Câu hỏi lựa chọn
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Lựa chọn', 'S1 か、S2 か', 'S1 hay là S2?', 'Dùng để hỏi về sự lựa chọn giữa hai hay nhiều phương án.', 2, 6, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'これは 「９」ですか、「７」ですか。', 'Đây là số 9 hay số 7?', g_id, NOW(), NOW()), (gen_random_uuid(), 'あの人は 先生ですか、学生ですか。', 'Người kia là giáo viên hay sinh viên?', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 3: ĐỊA ĐIỂM & PHƯƠNG HƯỚNG (KOKO, KOCHIRA, DOKO)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 3' LIMIT 1;
    SELECT "GrammarGroupID" INTO group_set_id FROM "GrammarGroups" WHERE "GroupName" = 'Thời điểm - Trình tự' LIMIT 1; -- Hoặc nhóm phù hợp

    -- 10. Koko/Soko/Asoko
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Địa điểm', 'ここ / そこ / あそこ', 'Chỗ này / đó / kia', 'Đại từ chỉ địa điểm nơi người nói và người nghe đang ở.', 2, 0, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'あそこは 食堂です。', 'Chỗ kia là nhà ăn.', g_id, NOW(), NOW()), (gen_random_uuid(), 'ここは 会議室です。', 'Đây là phòng họp.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 11. Kochira/Sochira/Achira
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Hướng/Lịch sự', 'こちら / そちら / あちら', 'Phía này / đó / kia', 'Dùng để chỉ phương hướng hoặc thay thế Koko/Soko/Asoko để tăng sắc thái lịch sự.', 2, 0, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'お手洗いは こちらです。', 'Nhà vệ sinh ở phía này.', g_id, NOW(), NOW()), (gen_random_uuid(), '電話は あちらです。', 'Điện thoại ở phía kia.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 12. N1 wa N2 (địa điểm) desu
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Vị trí đối tượng', 'N1 は N2 (địa điểm) です', 'N1 ở N2', 'Dùng để diễn tả một người, vật hoặc địa điểm nằm ở đâu.', 2, 6, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '電話は ２階です。', 'Điện thoại ở tầng 2.', g_id, NOW(), NOW()), (gen_random_uuid(), 'ミラーさんは 事務所です。', 'Anh Miller ở văn phòng.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 13. Doko/Dochira
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Hỏi nơi chốn', 'どこ / どちら', 'Ở đâu / Phía nào', 'Từ nghi vấn dùng để hỏi về địa điểm hoặc phương hướng.', 2, 0, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '大学は どこですか。', 'Trường đại học ở đâu?', g_id, NOW(), NOW()), (gen_random_uuid(), 'エレベーターは どちらですか。', 'Thang máy ở phía nào vậy?', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 4: THỜI GIAN & ĐỘNG TỪ (GIỜ PHÚT, MASU, NI, KARA-MADE)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 4' LIMIT 1;
    SELECT "GrammarGroupID" INTO group_set_id FROM "GrammarGroups" WHERE "GroupName" = 'Thời điểm - Trình tự' LIMIT 1;

    -- 14. Giờ phút: 今 ～時 ～分 です
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Thời gian', '今 ～時 ～分 です', 'Bây giờ là...', 'Cách nói thời gian hiện tại.', 2, 6, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '今 ４時５分です。', 'Bây giờ là 4 giờ 5 phút.', g_id, NOW(), NOW()), (gen_random_uuid(), 'ニューヨークは 今 午前４時です。', 'New York bây giờ là 4 giờ sáng.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 15. V-masu/masen: Khẳng định/Phủ định hiện tại
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Động từ hiện tại', 'V-ます / V-ません', 'Làm / Không làm', 'Diễn tả thói quen, chân lý hoặc hành động sẽ làm.', 2, 6, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '毎日 勉強します。', 'Hàng ngày tôi đều học bài.', g_id, NOW(), NOW()), (gen_random_uuid(), 'あしたは 働きません。', 'Ngày mai tôi sẽ không làm việc.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 16. V-mashita/masen deshita: Quá khứ
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Động từ quá khứ', 'V-ました / V-ませんでした', 'Đã làm / Đã không làm', 'Diễn tả hành động đã xảy ra trong quá khứ.', 2, 6, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'きのう 勉強しました。', 'Hôm qua tôi đã học bài.', g_id, NOW(), NOW()), (gen_random_uuid(), 'おととい 働きませんでした。', 'Hôm kia tôi đã không làm việc.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 17. Trợ từ に (thời gian): N に V
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Thời điểm hành động', 'N (thời gian) に V', 'Làm gì vào lúc...', 'Dùng cho mốc thời gian có số cụ thể. Không dùng cho từ chỉ thời gian tương đối.', 2, 1, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '６時に 起きます。', 'Tôi thức dậy lúc 6 giờ.', g_id, NOW(), NOW()), (gen_random_uuid(), '７月２日に 日本へ行きます。', 'Tôi sẽ đi Nhật vào ngày 2 tháng 7.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 18. Kara/Made: N1 から N2 まで
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Phạm vi', 'N1 から N2 まで', 'Từ N1 đến N2', 'Diễn tả phạm vi thời gian hoặc địa điểm.', 2, 1, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '９時から ５時まで 働きます。', 'Tôi làm việc từ 9 giờ đến 5 giờ.', g_id, NOW(), NOW()), (gen_random_uuid(), '大阪から 東京まで ３時間かかります。', 'Từ Osaka đến Tokyo mất 3 tiếng.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 5: DI CHUYỂN (HE, MO, DE, TO, ITSU)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 5' LIMIT 1;
    SELECT "GrammarGroupID" INTO group_set_id FROM "GrammarGroups" WHERE "GroupName" = 'Giao thông & Đi lại' LIMIT 1;

    -- 19. Trợ từ へ: N へ 行きます/来ます/帰ります
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Hướng di chuyển', 'N へ 行きます/来ます/帰ります', 'Đi / Đến / Về đâu', 'Trợ từ へ chỉ hướng di chuyển của hành động.', 2, 1, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '京都へ 行きます。', 'Tôi đi Kyoto.', g_id, NOW(), NOW()), (gen_random_uuid(), '日本へ 来ました。', 'Tôi đã đến Nhật.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 20. Phủ định hoàn toàn: どこ [へ] も 行きません
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Phủ định sạch', 'どこ [へ] も 行きません', 'Không đi đâu cả', 'Sử dụng nghi vấn từ + も để phủ định hoàn toàn.', 2, 1, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'どこへも 行きませんでした。', 'Tôi đã không đi đâu cả.', g_id, NOW(), NOW()), (gen_random_uuid(), '何も 食べません。', 'Tôi sẽ không ăn gì cả.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 21. Trợ từ で (phương tiện): N で 行きます
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Phương tiện di chuyển', 'N で 行きます', 'Đi bằng phương tiện gì', 'Trợ từ で chỉ cách thức, phương tiện di chuyển.', 2, 1, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '電車で 行きます。', 'Tôi đi bằng tàu điện.', g_id, NOW(), NOW()), (gen_random_uuid(), 'タクシーで 帰りました。', 'Tôi đã về bằng taxi.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 22. Trợ từ と (người): N と V
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Cùng với ai', 'N と V', 'Làm gì cùng ai', 'Trợ từ と chỉ đối tượng cùng thực hiện hành động.', 2, 1, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '家族と 日本へ 来ました。', 'Tôi đã đến Nhật cùng gia đình.', g_id, NOW(), NOW()), (gen_random_uuid(), '友達と 映画を見ます。', 'Tôi xem phim cùng bạn.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 23. Itsu: いつ V ますか
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Hỏi thời điểm', 'いつ V ますか', 'Khi nào làm V?', 'Nghi vấn từ hỏi về thời gian thực hiện hành động.', 2, 0, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'いつ 日本へ 来ましたか。', 'Bạn đã đến Nhật khi nào?', g_id, NOW(), NOW()), (gen_random_uuid(), '誕生日は いつですか。', 'Sinh nhật bạn là khi nào?', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 6: NGOẠI ĐỘNG TỪ (WO, DE-LOCATION, MASENKA, MASHOU)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 6' LIMIT 1;
    SELECT "GrammarGroupID" INTO group_set_id FROM "GrammarGroups" WHERE "GroupName" = 'Yêu cầu - Nhờ vả' LIMIT 1;

    -- 24. Trợ từ を: N を V
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Tác động trực tiếp', 'N を V', 'Làm / Tác động vào N', 'Trợ từ を dùng để chỉ đối tượng trực tiếp của hành động.', 2, 1, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'ごはんを 食べます。', 'Tôi ăn cơm.', g_id, NOW(), NOW()), (gen_random_uuid(), '水を 飲みます。', 'Tôi uống nước.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 25. Nani wo shimasu ka: 何を しますか
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Hỏi hành động', '何を しますか', 'Làm cái gì?', 'Dùng để hỏi về nội dung của hành động.', 2, 0, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '月曜日 何を しますか。', 'Thứ Hai bạn làm gì?', g_id, NOW(), NOW()), (gen_random_uuid(), '昨日 何を しましたか。', 'Hôm qua bạn đã làm gì?', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 26. Trợ từ で (địa điểm): N (địa điểm) で V
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Nơi xảy ra hành động', 'N (địa điểm) で V', 'Làm việc gì tại đâu', 'Trợ từ で chỉ địa điểm nơi thực hiện hành động (phân biệt với に chỉ vị trí tồn tại).', 2, 1, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '駅で 新聞を 買います。', 'Tôi mua báo ở nhà ga.', g_id, NOW(), NOW()), (gen_random_uuid(), 'ロビーで 休みます。', 'Tôi nghỉ ngơi ở hành lang.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 27. V-masenka: V-ませんか
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Mời mọc', 'V-ませんか', 'Cùng làm... nhé?', 'Dùng để mời ai đó làm gì với mình, thể hiện sự tôn trọng ý kiến đối phương.', 2, 6, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'いっしょに 京都へ 行きませんか。', 'Cùng đi Kyoto với tôi không?', g_id, NOW(), NOW()), (gen_random_uuid(), 'いっしょに お茶を 飲みませんか。', 'Cùng uống trà với tôi không?', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 28. V-mashou: V-ましょう
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Đề nghị', 'V-ましょう', 'Cùng làm... thôi!', 'Dùng khi người nói chủ động đề nghị cùng làm gì hoặc đáp lại lời mời V-masenka.', 2, 6, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'ちょっと 休みましょう。', 'Nghỉ một chút nào.', g_id, NOW(), NOW()), (gen_random_uuid(), '昼ごはんを 食べましょう。', 'Ăn cơm trưa thôi.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 7: CÔNG CỤ & CHO/NHẬN (DE-TOOL, AGEMASU, MORAIMASU, MOU)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 7' LIMIT 1;
    SELECT "GrammarGroupID" INTO group_set_id FROM "GrammarGroups" WHERE "GroupName" = 'Cho nhận' LIMIT 1;

    -- 29. Trợ từ で (công cụ): N で V
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Công cụ/Phương thức', 'N で V', 'Làm bằng công cụ/phương thức gì', 'Trợ từ で chỉ công cụ, phương tiện hoặc ngôn ngữ để thực hiện hành động.', 2, 1, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'はしで 食べます。', 'Tôi ăn bằng đũa.', g_id, NOW(), NOW()), (gen_random_uuid(), '日本語で レポートを書きます。', 'Tôi viết báo cáo bằng tiếng Nhật.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 30. Nani desu ka (ngôn ngữ): 「Từ/Câu」は ～語で 何ですか
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Hỏi dịch thuật', '「Từ/Câu」は ～語で 何ですか', '... tiếng ~ nói là gì?', 'Dùng để hỏi cách nói một từ hoặc câu bằng ngôn ngữ khác.', 2, 6, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '「Thank you」は 日本語で 何ですか。', '"Thank you" tiếng Nhật là gì?', g_id, NOW(), NOW()), (gen_random_uuid(), '「こんにちは」は 英語で 何ですか。', '"Konnichiwa" tiếng Anh là gì?', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 31. Agemasu: N1 に N2 を あげます
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Hành động cho/tặng', 'N1 に N2 を あげます', 'Cho/Tặng N1 cái N2', 'Diễn tả việc người nói tặng vật gì cho người khác (không dùng cho người nói là người nhận).', 2, 12, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '木村さんに 花を あげました。', 'Tôi đã tặng hoa cho chị Kimura.', g_id, NOW(), NOW()), (gen_random_uuid(), '友達に プレゼントを あげます。', 'Tôi tặng quà cho bạn.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 32. Moraimasu: N1 に N2 を もらいます
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Hành động nhận', 'N1 に N2 を もらいます', 'Nhận N2 từ N1', 'Diễn tả việc người nói nhận vật gì từ người khác. Có thể dùng から thay cho に.', 2, 12, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'カリナさんに CDを もらいました。', 'Tôi đã nhận đĩa CD từ Karina.', g_id, NOW(), NOW()), (gen_random_uuid(), '父に お金をもらいました。', 'Tôi đã nhận tiền từ bố.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 33. Mou V-mashita: Đã làm... rồi
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Hoàn thành hành động', 'もう V-ました', 'Đã làm... rồi', 'Diễn tả một hành động đã được thực hiện xong tại thời điểm hiện tại.', 2, 6, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'もう 荷物を 送りましたか。', 'Bạn đã gửi hành lý đi chưa?', g_id, NOW(), NOW()), (gen_random_uuid(), 'もう 昼ごはんを 食べました。', 'Tôi đã ăn cơm trưa rồi.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 8: TÍNH TỪ (ADJ-I, ADJ-NA, PHỦ ĐỊNH, BỔ NGHĨA DANH TỪ)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 8' LIMIT 1;
    -- Lấy ID nhóm "Tính từ" hoặc tạo mới nếu chưa có
    SELECT "GrammarGroupID" INTO group_set_id FROM "GrammarGroups" WHERE "GroupName" = 'Tính từ' LIMIT 1;
    IF group_set_id IS NULL THEN
        group_set_id := gen_random_uuid();
        INSERT INTO "GrammarGroups" ("GrammarGroupID", "GroupName", "Description") VALUES (group_set_id, 'Tính từ', 'Các cấu trúc về tính từ đuôi i và đuôi na');
    END IF;

    -- 34. Adj-i desu: Khẳng định tính từ đuôi i
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Tính từ đuôi i', 'N は Adj-い です', 'N thì... (đuôi i)', 'Dùng tính từ đuôi i để miêu tả tính chất của chủ ngữ.', 2, 8, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '富士山は 高いです。', 'Núi Phú Sĩ cao.', g_id, NOW(), NOW()), (gen_random_uuid(), 'この料理は おいしいです。', 'Món ăn này ngon.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 35. Adj-na desu: Khẳng định tính từ đuôi na
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Tính từ đuôi na', 'N は Adj-な です', 'N thì... (đuôi na)', 'Dùng tính từ đuôi na (bỏ na) kết hợp với desu để miêu tả tính chất.', 2, 8, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'この町は 静かです。', 'Thành phố này yên tĩnh.', g_id, NOW(), NOW()), (gen_random_uuid(), 'ワットさんは 親切です。', 'Thầy Watt thân thiện.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 36. Adj-i kunai desu: Phủ định tính từ đuôi i
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Phủ định đuôi i', 'Adj-い (bỏ い) + くないです', 'Không...', 'Đổi đuôi i thành kunai để tạo thể phủ định. Ngoại lệ: ii -> yokunai.', 2, 8, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'この本は おもしろくないです。', 'Cuốn sách này không hay.', g_id, NOW(), NOW()), (gen_random_uuid(), '今日は 寒くないです。', 'Hôm nay không lạnh.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 37. Adj-na ja arimasen: Phủ định tính từ đuôi na
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Phủ định đuôi na', 'Adj-な じゃありません', 'Không...', 'Tính từ đuôi na phủ định giống như danh từ.', 2, 8, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'あそこは べんりじゃありません。', 'Chỗ kia không tiện lợi.', g_id, NOW(), NOW()), (gen_random_uuid(), 'この町は にぎやかじゃありません。', 'Thành phố này không nhộn nhịp.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 38. Adj N: Tính từ bổ nghĩa cho danh từ
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Tính từ bổ nghĩa N', 'Adj N', 'Tính từ + Danh từ', 'Đuôi i giữ nguyên, đuôi na phải thêm "na" trước danh từ.', 2, 8, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '奈良は 古い 町です。', 'Nara là một thành phố cổ.', g_id, NOW(), NOW()), (gen_random_uuid(), 'ミラーさんは ハンサムな 人です。', 'Anh Miller là người đẹp trai.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 9: SỞ THÍCH & KHẢ NĂNG (GA ARIMASU, GA SUKI, DONNA, KARA)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 9' LIMIT 1;
    SELECT "GrammarGroupID" INTO group_set_id FROM "GrammarGroups" WHERE "GroupName" = 'Sở thích - Năng lực' LIMIT 1;

    -- 39. N ga arimasu/wakarimasu: Trạng thái & Sở hữu
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Sở hữu/Trạng thái', 'N が あります / わかります', 'Có N / Hiểu N', 'Dùng trợ từ が để chỉ đối tượng của các động từ chỉ trạng thái hoặc sở hữu.', 2, 1, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '英語が わかります。', 'Tôi hiểu tiếng Anh.', g_id, NOW(), NOW()), (gen_random_uuid(), '車が あります。', 'Tôi có xe ô tô.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 40. N ga suki/kirai: Cảm xúc
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Cảm xúc/Sở thích', 'N が 好きです / 嫌いです', 'Thích / Ghét N', 'Các tính từ chỉ cảm xúc hoặc tâm thế như thích, ghét, giỏi, kém đi kèm với trợ từ が.', 2, 1, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '料理が 好きです。', 'Tôi thích nấu ăn.', g_id, NOW(), NOW()), (gen_random_uuid(), '魚が 嫌いです。', 'Tôi ghét cá.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 41. Donna N: Hỏi tính chất/chủng loại
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Tính chất', 'どんな N', 'N như thế nào?', 'Nghi vấn từ dùng để hỏi về chủng loại hoặc đặc điểm cụ thể của một danh từ.', 2, 0, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'どんな スポーツが 好きですか。', 'Bạn thích môn thể thao như thế nào?', g_id, NOW(), NOW()), (gen_random_uuid(), 'どんな 飲み物が いいですか。', 'Bạn thích đồ uống như thế nào?', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 42. Kara (Lý do): Nối câu nguyên nhân - kết quả
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Nguyên nhân', 'S1 から、S2', 'Vì S1 nên S2', 'Từ nối chỉ lý do. S1 là nguyên nhân, S2 là kết quả.', 2, 7, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '時間が ありませんから、読みません。', 'Vì không có thời gian nên tôi không đọc.', g_id, NOW(), NOW()), (gen_random_uuid(), '暑いですから、窓を開けます。', 'Vì nóng nên tôi mở cửa sổ.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 10: SỰ TỒN TẠI (ARIMASU, IMASU, YA)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 10' LIMIT 1;
    SELECT "GrammarGroupID" INTO group_set_id FROM "GrammarGroups" WHERE "GroupName" = 'Sự tồn tại' LIMIT 1;

    -- 43. N ni N ga arimasu: Tồn tại vật vô tri
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Tồn tại vật', 'N に N が あります', 'Ở địa điểm có vật', 'Dùng để diễn tả sự hiện diện của đồ vật, thực vật hoặc sự kiện tại một địa điểm.', 2, 6, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '机の上に 本があります。', 'Trên bàn có cuốn sách.', g_id, NOW(), NOW()), (gen_random_uuid(), '庭に 木があります。', 'Trong sân có cái cây.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 44. N ni N ga imasu: Tồn tại sinh vật sống
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Tồn tại người/động vật', 'N に N が います', 'Ở địa điểm có người/con vật', 'Dùng để diễn tả sự hiện diện của con người hoặc động vật.', 2, 6, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'あそこに 男の人が います。', 'Ở kia có người đàn ông.', g_id, NOW(), NOW()), (gen_random_uuid(), '部屋に 猫が います。', 'Trong phòng có con mèo.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 45. N wa N ni arimasu/imasu: Nhấn mạnh vị trí của chủ thể
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Vị trí của chủ thể', 'N は N に あります/います', 'N thì ở địa điểm', 'Dùng khi muốn nói về vị trí của một chủ thể mà cả người nói và người nghe đều đã biết.', 2, 6, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'ミラーさんは 事務所に います。', 'Anh Miller ở văn phòng.', g_id, NOW(), NOW()), (gen_random_uuid(), '本は 机の上に あります。', 'Cuốn sách thì ở trên bàn.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 46. Ya (Liệt kê không đầy đủ): N1 や N2
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Liệt kê không đầy đủ', 'N1 や N2', 'N1 và N2 (vẫn còn nữa)', 'Dùng để liệt kê một vài danh từ tiêu biểu trong một nhóm nhiều đối tượng.', 2, 1, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '店に パンや 卵が あります。', 'Ở cửa hàng có bánh mì, trứng...', g_id, NOW(), NOW()), (gen_random_uuid(), 'かばんの中に 手紙や 写真があります。', 'Trong túi xách có thư, ảnh...', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

	-------------------------------------------------------
    -- BÀI 11: CÁCH ĐẾM SỐ LƯỢNG (VỊ TRÍ SỐ TỪ, TẦN SUẤT, DAKE)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 11' LIMIT 1;
    -- Lấy ID nhóm "Số lượng"
    SELECT "GrammarGroupID" INTO group_set_id FROM "GrammarGroups" WHERE "GroupName" = 'Số lượng' LIMIT 1;

    -- 47. Số lượng vật (Vị trí số từ): N を Số lượng V
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Số lượng vật', 'N を Số lượng V', 'Làm V với số lượng N', 'Số từ thường đặt sau trợ từ và trước động từ. Không cần trợ từ sau số từ (trừ trường hợp đặc biệt).', 2, 0, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'りんごを ４つ 買いました。', 'Tôi đã mua 4 quả táo.', g_id, NOW(), NOW()), (gen_random_uuid(), '卵を １０買いました。', 'Tôi đã mua 10 quả trứng.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 48. Tần suất hành động: Khoảng thời gian に Số lần V
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Tần suất', 'Khoảng thời gian に Số lần V', 'Làm V mấy lần trong khoảng thời gian', 'Trợ từ に sau khoảng thời gian dùng để chỉ định mức tần suất thực hiện hành động.', 2, 1, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '１か月に ２回 映画を 見ます。', 'Một tháng tôi xem phim 2 lần.', g_id, NOW(), NOW()), (gen_random_uuid(), '１週間に ３回 テニスを します。', 'Một tuần tôi chơi tennis 3 lần.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 49. Giới hạn (Dake): Số lượng + だけ
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Chỉ duy nhất', 'Số lượng + だけ', 'Chỉ (số lượng)', 'Dùng để giới hạn số lượng hoặc phạm vi, mang nghĩa "không có gì thêm ngoài cái đó".', 2, 1, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '休みは 日曜日だけです。', 'Ngày nghỉ chỉ có Chủ Nhật.', g_id, NOW(), NOW()), (gen_random_uuid(), 'クラスに ベトナム人は 一人だけいます。', 'Trong lớp chỉ có duy nhất một người Việt Nam.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 50. Hỏi khoảng thời gian/giá cả: どのくらい / どのぐらい
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Hỏi lượng', 'どのくらい / どのぐらい', 'Mất bao lâu / Khoảng bao nhiêu', 'Dùng để hỏi về độ dài thời gian, khoảng cách hoặc số tiền ước lượng.', 2, 0, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '東京から 大阪まで どのくらい かかりますか。', 'Từ Tokyo đến Osaka mất bao lâu?', g_id, NOW(), NOW()), (gen_random_uuid(), '日本に どのくらい いますか。', 'Bạn ở Nhật bao lâu rồi?', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 12: QUÁ KHỨ CỦA TÍNH TỪ & SO SÁNH (YORI, DOCHIRA, ICHIBAN)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 12' LIMIT 1;
    -- Lấy ID nhóm "Sự so sánh"
    SELECT "GrammarGroupID" INTO group_set_id FROM "GrammarGroups" WHERE "GroupName" = 'Sự so sánh' LIMIT 1;

    -- 51. So sánh hơn: N1 は N2 より Adj です
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'So sánh hơn', 'N1 は N2 より Adj です', 'N1 Adj hơn N2', 'Dùng より (so với) đặt sau đối tượng được dùng làm chuẩn so sánh.', 2, 9, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'この車は あの車より 速いです。', 'Cái xe ô tô này nhanh hơn cái ô tô kia.', g_id, NOW(), NOW()), (gen_random_uuid(), '今日は 昨日より 暑いです。', 'Hôm nay nóng hơn hôm qua.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 52. So sánh lựa chọn: N1 と N2 と どちらが Adj ですか
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'So sánh lựa chọn', 'N1 と N2 と どちらが Adj ですか', 'N1 và N2 cái nào Adj hơn?', 'Cấu trúc hỏi để yêu cầu lựa chọn một trong hai đối tượng.', 2, 9, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'サッカーと 野球と どちらが おもしろいですか。', 'Bóng đá và bóng chày cái nào thú vị hơn?', g_id, NOW(), NOW()), (gen_random_uuid(), 'コーヒーと 紅茶と どちらが 好きですか。', 'Cà phê và trà hồng cái nào bạn thích hơn?', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 53. So sánh nhất: N1 [の中で] N2 が いちばん Adj です
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'So sánh nhất', 'N1 [の中で] N2 が いちばん Adj です', 'Trong N1, N2 là Adj nhất', 'Sử dụng いちばん (số 1/nhất) để so sánh đối tượng trong một tập hợp từ 3 trở lên.', 2, 9, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '１年で いつが いちばん 暑いですか。', 'Trong một năm khi nào là nóng nhất?', g_id, NOW(), NOW()), (gen_random_uuid(), '家族の中で 誰が いちばん 背が高いですか。', 'Trong gia đình ai là người cao nhất?', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 54. Quá khứ tính từ đuôi i: Adj-i (bỏ い) + かったです
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Quá khứ đuôi i', 'Adj-い (bỏ い) + かったです', 'Đã... (tính từ đuôi i)', 'Biến đổi tính từ đuôi i sang thì quá khứ. Lưu ý: いい -> よかったです.', 2, 8, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '昨日のパーティーは 楽しかったです。', 'Bữa tiệc hôm qua đã rất vui.', g_id, NOW(), NOW()), (gen_random_uuid(), '旅行は よかったです。', 'Chuyến du lịch đã rất tốt.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 55. Quá khứ tính từ đuôi na/Danh từ: Adj-na / N + でした
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Quá khứ đuôi na/Danh từ', 'Adj-na / N + でした', 'Đã là...', 'Cách chia quá khứ cho tính từ đuôi na và danh từ giống hệt nhau.', 2, 8, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '昨日は 雨でした。', 'Hôm qua đã trời mưa.', g_id, NOW(), NOW()), (gen_random_uuid(), 'お祭りは にぎやかでした。', 'Lễ hội đã rất nhộn nhịp.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 13: MONG MUỐN & MỤC ĐÍCH (HOSHII, TAI, NI IKIMASU)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 13' LIMIT 1;
    -- Lấy ID nhóm "Mong muốn"
    SELECT "GrammarGroupID" INTO group_set_id FROM "GrammarGroups" WHERE "GroupName" = 'Mong muốn' LIMIT 1;

    -- 56. Mong muốn vật: N が ほしいです
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Mong muốn vật', 'N が ほしいです', 'Muốn có N', 'Diễn tả mong muốn sở hữu một đồ vật hoặc một đối tượng nào đó của người nói.', 2, 6, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '私は 新しい車が ほしいです。', 'Tôi muốn có một chiếc xe hơi mới.', g_id, NOW(), NOW()), (gen_random_uuid(), '誕生日に 何が ほしいですか。', 'Vào ngày sinh nhật bạn muốn gì?', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 57. Mong muốn hành động: V-たいです
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Mong muốn làm gì', 'V-たいです', 'Muốn làm V', 'Bỏ đuôi ます thêm たいです. Cách chia phủ định và quá khứ giống như tính từ đuôi i.', 2, 6, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '日本へ 行きたいです。', 'Tôi muốn đi Nhật.', g_id, NOW(), NOW()), (gen_random_uuid(), 'お腹が痛いですから、何も 食べたくないです。', 'Vì đau bụng nên tôi không muốn ăn gì cả.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 58. Mục đích di chuyển: N へ (V-masu/N) に 行きます/来ます/帰ります
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Mục đích di chuyển', 'N へ (V-masu/N) に 行きます', 'Đi đến đâu để làm gì', 'Trợ từ に sau danh từ hoặc động từ (thể ます bỏ ます) để chỉ mục đích của hành động di chuyển.', 2, 1, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'デパートへ 買い物に 行きます。', 'Tôi đi trung tâm thương mại để mua sắm.', g_id, NOW(), NOW()), (gen_random_uuid(), '日本へ 経済の勉強に 来ました。', 'Tôi đến Nhật để học kinh tế.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 14: THỂ TE (1) - SAI KHIẾN & ĐANG LÀM (TE KUDASAI, TE IMASU, MASHOUKA)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 14' LIMIT 1;
    -- Lấy ID nhóm "Các thể của động từ"
    SELECT "GrammarGroupID" INTO group_set_id FROM "GrammarGroups" WHERE "GroupName" = 'Thể Te' LIMIT 1;

    -- 59. Yêu cầu lịch sự: V-て ください
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Yêu cầu lịch sự', 'V-て ください', 'Hãy làm V', 'Dùng để nhờ vả, sai khiến hoặc yêu cầu đối phương thực hiện hành động một cách lịch sự.', 2, 2, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'ここに 住所を 書いてください。', 'Hãy viết địa chỉ vào đây.', g_id, NOW(), NOW()), (gen_random_uuid(), 'すみませんが、塩を 取ってください。', 'Xin lỗi, hãy lấy hộ tôi lọ muối.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 60. Đang làm (Hiện tại tiếp diễn): V-て います
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Hành động đang diễn ra', 'V-て います', 'Đang làm V', 'Diễn tả một hành động đang được thực hiện tại thời điểm nói.', 2, 2, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '今 本を 読んでいます。', 'Bây giờ tôi đang đọc sách.', g_id, NOW(), NOW()), (gen_random_uuid(), 'ミラーさんは 今 電話を かけています。', 'Anh Miller hiện đang gọi điện thoại.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 61. Đề nghị giúp đỡ: V-ましょうか
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Đề nghị giúp đỡ', 'V-ましょうか', 'Để tôi làm... nhé?', 'Dùng khi người nói chủ động đề nghị làm một việc gì đó để giúp đỡ đối phương.', 2, 6, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'タクシーを 呼びましょうか。', 'Để tôi gọi taxi cho bạn nhé?', g_id, NOW(), NOW()), (gen_random_uuid(), '荷物を 持ちましょうか。', 'Để tôi cầm hành lý giúp bạn nhé?', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 15: THỂ TE (2) - CHO PHÉP & CẤM ĐOÁN (TE MO II, TE WA IKEMASEN)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 15' LIMIT 1;
    SELECT "GrammarGroupID" INTO group_set_id FROM "GrammarGroups" WHERE "GroupName" = 'Thể Te' LIMIT 1;

    -- 62. Xin phép: V-て も いいです
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Xin phép', 'V-て も いいです', 'Làm V cũng được/Có thể làm V', 'Dùng để xin phép hoặc cho phép ai đó làm gì.', 2, 2, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '写真を 撮っても いいですか。', 'Tôi chụp ảnh có được không?', g_id, NOW(), NOW()), (gen_random_uuid(), 'タバコを 吸っても いいですか。', 'Tôi hút thuốc có được không?', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 63. Cấm đoán: V-て は いけません
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Cấm đoán', 'V-て は いけません', 'Không được làm V', 'Biểu thị sự cấm đoán mạnh mẽ, thường dùng trong các quy định hoặc biển báo.', 2, 2, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'ここで タバコを 吸ってはいけません。', 'Không được hút thuốc ở đây.', g_id, NOW(), NOW()), (gen_random_uuid(), 'ここに 車を 止めてはいけません。', 'Không được đậu xe ở đây.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 64. Trạng thái kết quả: V-て います
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Trạng thái/Kết quả', 'V-て います', 'Đang (kết quả/nghề nghiệp)', 'Diễn tả trạng thái là kết quả của một hành động đã xảy ra trong quá khứ hoặc thói quen/nghề nghiệp.', 2, 2, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '私は 結婚しています。', 'Tôi đã kết hôn.', g_id, NOW(), NOW()), (gen_random_uuid(), 'IMCは コンピューターを 作っています。', 'Công ty IMC sản xuất máy tính.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 16: LIỆT KÊ HÀNH ĐỘNG & TÍNH TỪ (TE-FORM CHAINING)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 16' LIMIT 1;
    -- Lấy ID nhóm "Nối câu"
    SELECT "GrammarGroupID" INTO group_set_id FROM "GrammarGroups" WHERE "GroupName" = 'Nối câu' LIMIT 1;

    -- 65. Liệt kê hành động (Trình tự): V1-て, V2-て, V3
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Liệt kê hành động', 'V1-て, V2-て, V3', 'Làm V1, rồi V2, rồi V3', 'Nối các động từ để liệt kê hành động theo thứ tự thời gian.', 2, 2, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '朝 起きて、顔を 洗って、朝ごはんを 食べます。', 'Sáng tôi thức dậy, rửa mặt rồi ăn sáng.', g_id, NOW(), NOW()), (gen_random_uuid(), '神戸へ 行って、映画を 見て、お茶を 飲みました。', 'Tôi đã đi Kobe, xem phim rồi uống trà.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 66. Nối tính từ đuôi i: Adj1-くて, Adj2
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Nối tính từ đuôi i', 'Adj1-くて, Adj2', 'Adj1 và Adj2', 'Bỏ "i" thay bằng "kute" để nối hai tính từ đuôi i hoặc tính từ đuôi i với tính từ khác.', 2, 8, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'この部屋は 広くて、明るいです。', 'Căn phòng này rộng và sáng sủa.', g_id, NOW(), NOW()), (gen_random_uuid(), '若くて、元気です。', 'Trẻ và khỏe mạnh.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 67. Nối tính từ na / danh từ: Adj-na / N + で, Adj2
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Nối tính từ na/Danh từ', 'Adj-na / N + で, Adj2', 'Adj1/N và Adj2', 'Sử dụng "de" để nối tính từ đuôi na hoặc danh từ.', 2, 8, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '奈良は 静かで、きれいな 町です。', 'Nara là thành phố yên tĩnh và đẹp.', g_id, NOW(), NOW()), (gen_random_uuid(), 'カリナさんは 学生で、マリアさんは 主婦です。', 'Karina là sinh viên, còn Maria là nội trợ.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 68. V-te kara: Sau khi...
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Hành động nối tiếp', 'V1-て から, V2', 'Sau khi làm V1, thì làm V2', 'Diễn tả hành động V2 được thực hiện sau khi V1 kết thúc, nhấn mạnh trình tự.', 2, 2, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '仕事が 終わってから、飲みに 行きます。', 'Sau khi xong việc, tôi sẽ đi uống bia.', g_id, NOW(), NOW()), (gen_random_uuid(), 'お金を 入れてから、ボタンを 押してください。', 'Sau khi bỏ tiền vào, hãy nhấn nút.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 69. Miêu tả đặc điểm: N1 は N2 が Adj です
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Miêu tả bộ phận', 'N1 は N2 が Adj です', 'N1 có N2 thì Adj', 'Dùng để miêu tả đặc điểm một bộ phận của chủ thể (N1 là chủ thể chính, N2 là bộ phận).', 2, 8, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'マリアさんは 目が 大きいです。', 'Chị Maria có đôi mắt to.', g_id, NOW(), NOW()), (gen_random_uuid(), '大阪は 食べ物が おいしいです。', 'Osaka thì đồ ăn ngon.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 17: THỂ NAI (PHỦ ĐỊNH NGẮN - NAI DE, NAKEREBA)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 17' LIMIT 1;
    -- Lấy ID nhóm "Các thể của động từ" (Sử dụng chung cho Nai, Dictionary, v.v.)
    SELECT "GrammarGroupID" INTO group_set_id FROM "GrammarGroups" WHERE "GroupName" = 'Thể Nai' LIMIT 1;

    -- 70. Nai de kudasai: Yêu cầu đừng làm gì
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Yêu cầu không làm', 'V-ないで ください', 'Đừng làm V', 'Dùng để yêu cầu hoặc khuyên bảo ai đó không nên làm việc gì một cách lịch sự.', 2, 4, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'ここで 写真を 撮らないで ください。', 'Xin đừng chụp ảnh ở đây.', g_id, NOW(), NOW()), (gen_random_uuid(), '危ないですから、入らないで ください。', 'Vì nguy hiểm nên xin đừng vào.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 71. Nakereba narimasen: Nghĩa vụ bắt buộc
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Nghĩa vụ', 'V-なければ なりません', 'Phải làm V', 'Diễn tả một việc gì đó là cần thiết hoặc là nghĩa vụ phải thực hiện bất kể ý muốn.', 2, 4, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '薬を 飲まなければ なりません。', 'Tôi phải uống thuốc.', g_id, NOW(), NOW()), (gen_random_uuid(), '明日は 早く 起きなければ なりません。', 'Ngày mai tôi phải dậy sớm.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 72. Nakutemo ii desu: Không cần thiết
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Không cần thiết', 'V-なくても いいです', 'Không cần làm V cũng được', 'Diễn tả rằng việc thực hiện hành động đó là không bắt buộc.', 2, 4, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '明日 来なくても いいです。', 'Ngày mai bạn không cần đến cũng được.', g_id, NOW(), NOW()), (gen_random_uuid(), '名前を 書かなくても いいです。', 'Không cần viết tên cũng được.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 73. Madeni: Thời hạn cuối cùng
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Thời hạn', 'N (thời gian) までに V', 'Làm V trước thời hạn N', 'Chỉ rõ mốc thời gian cuối cùng mà một hành động phải được hoàn thành.', 2, 1, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '会議は ５時までに 終わります。', 'Cuộc họp sẽ kết thúc trước 5 giờ.', g_id, NOW(), NOW()), (gen_random_uuid(), '土曜日までに 本を 返さなければなりません。', 'Phải trả sách trước thứ Bảy.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 18: THỂ TỪ ĐIỂN (KHẢ NĂNG & DANH TỪ HÓA)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 18' LIMIT 1;
    SELECT "GrammarGroupID" INTO group_set_id FROM "GrammarGroups" WHERE "GroupName" = 'Thể từ điển' LIMIT 1;

    -- 74. Koto ga dekimasu: Năng lực/Điều kiện
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Khả năng', 'V-ること が できます', 'Có thể làm V', 'Dùng thể từ điển kết hợp với koto ga dekimasu để nói về khả năng của bản thân hoặc sự cho phép.', 2, 5, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '漢字を 読むことが できます。', 'Tôi có thể đọc được chữ Hán.', g_id, NOW(), NOW()), (gen_random_uuid(), 'ここで カードを 使うことが できますか。', 'Ở đây có thể dùng thẻ được không?', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 75. Shumi wa...: Sở thích
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Sở thích', '趣味は V-ること です', 'Sở thích là làm V', 'Biến đổi động từ thành danh từ để giải thích cụ thể nội dung của sở thích.', 2, 5, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '私の趣味は 写真を 撮ることです。', 'Sở thích của tôi là chụp ảnh.', g_id, NOW(), NOW()), (gen_random_uuid(), '趣味は 音楽を 聞くことです。', 'Sở thích của tôi là nghe nhạc.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 76. Mae ni: Trình tự trước sau
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Trước khi', 'V1-る / N の + まえに, V2', 'Trước khi làm V1, làm V2', 'Diễn tả hành động V2 xảy ra trước hành động hoặc thời điểm V1.', 2, 5, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '寝る前に、日記を 書きます。', 'Trước khi đi ngủ, tôi viết nhật ký.', g_id, NOW(), NOW()), (gen_random_uuid(), '食事の前に、手を 洗います。', 'Trước bữa ăn, tôi rửa tay.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 19: THỂ TA (KINH NGHIỆM, LIỆT KÊ, BIẾN ĐỔI)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 19' LIMIT 1;
    -- Lấy ID nhóm "Các thể của động từ"
    SELECT "GrammarGroupID" INTO group_set_id FROM "GrammarGroups" WHERE "GroupName" = 'Thể Ta' LIMIT 1;

    -- 77. Koto ga arimasu: Diễn tả kinh nghiệm
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Kinh nghiệm', 'V-た こと が あります', 'Đã từng làm V', 'Diễn tả một trải nghiệm hoặc sự kiện đã xảy ra ít nhất một lần trong quá khứ.', 2, 3, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '北海道へ 行ったことが あります。', 'Tôi đã từng đi Hokkaido.', g_id, NOW(), NOW()), (gen_random_uuid(), '馬に 乗ったことが ありますか。', 'Bạn đã từng cưỡi ngựa chưa?', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 78. Tari... tari shimasu: Liệt kê hành động không trình tự
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Liệt kê hành động', 'V1-たり, V2-たり します', 'Lúc thì V1, lúc thì V2', 'Liệt kê vài hành động tiêu biểu trong nhiều hành động, không quan tâm đến thứ tự thời gian.', 2, 3, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '日曜日は 買い物したり、映画を 見たり します。', 'Chủ nhật tôi lúc thì đi mua sắm, lúc thì xem phim.', g_id, NOW(), NOW()), (gen_random_uuid(), '昨日 テニスを したり、散歩したり しました。', 'Hôm qua tôi đã lúc thì chơi tennis, lúc thì đi dạo.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 79. Sự thay đổi (Narimasu): Biến đổi trạng thái
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Biến đổi trạng thái', 'Adj / N + なります', 'Trở nên... / Thành...', 'Diễn tả sự thay đổi từ trạng thái này sang trạng thái khác. Đuôi i -> ku; Đuôi na/N -> ni.', 2, 8, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '寒く なりました。', 'Trời đã trở nên lạnh rồi.', g_id, NOW(), NOW()), (gen_random_uuid(), '２５歳に なりました。', 'Tôi đã tròn 25 tuổi.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 20: THỂ THÔNG THƯỜNG (FUTSUUKEI)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 20' LIMIT 1;
    -- Lấy ID nhóm "Giao tiếp thân mật"
    SELECT "GrammarGroupID" INTO group_set_id FROM "GrammarGroups" WHERE "GroupName" = 'Thể thông thường' LIMIT 1;

    -- 80. Thể ngắn (Động từ): V giao tiếp thân mật
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Động từ thể ngắn', 'V-る / V-ない / V-た', 'Làm / Không / Đã làm', 'Sử dụng thể từ điển, thể nai, thể ta thay cho thể masu trong văn nói thân mật.', 1, 0, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '明日 行く？', 'Mai đi không?', g_id, NOW(), NOW()), (gen_random_uuid(), '昨日 どこか 行った？', 'Hôm qua đã đi đâu đó à?', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 81. Thể ngắn (Tính từ/Danh từ): N/Adj thân mật
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'N/Adj thể ngắn', 'N / Adj-na + だ', 'Là... (thân mật)', 'Dùng だ thay cho です. Trong câu hỏi, だ thường bị lược bỏ và lên giọng ở cuối câu.', 1, 0, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '今日は 雨だ。', 'Hôm nay trời mưa đấy.', g_id, NOW(), NOW()), (gen_random_uuid(), 'この料理、おいしい？', 'Món này ngon không?', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 82. Kedo: Nối câu tương phản thân mật
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Liên từ Kedo', 'S + けど', 'S nhưng mà...', 'Tương đương với trợ từ が nhưng dùng trong phong cách nói chuyện thân mật hoặc suồng sã.', 1, 7, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'その映画、見たけど おもしろくなかった。', 'Phim đó tớ xem rồi nhưng không hay lắm.', g_id, NOW(), NOW()), (gen_random_uuid(), 'おなかが すいたけど、食べるものが ない。', 'Đói bụng rồi nhưng chẳng có gì ăn cả.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

	-------------------------------------------------------
    -- BÀI 21: TƯỜNG THUẬT & DỰ ĐOÁN (OMOIMASU, IIMASU, DESHOU)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 21' LIMIT 1;
    -- Lấy ID nhóm "Trích dẫn & Ý kiến"
    SELECT "GrammarGroupID" INTO group_set_id FROM "GrammarGroups" WHERE "GroupName" = 'Trích dẫn & Ý kiến' LIMIT 1;

    -- 83. Bày tỏ ý kiến: Thể thông thường + と 思います
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Bày tỏ ý kiến', 'Thể thông thường + と 思います', 'Tôi nghĩ là...', 'Dùng để bày tỏ ý kiến, suy đoán cá nhân. Lưu ý Danh từ/Adj-na + だ trước と.', 2, 6, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '明日 雨が 降ると 思います。', 'Tôi nghĩ là ngày mai trời sẽ mưa.', g_id, NOW(), NOW()), (gen_random_uuid(), '日本は 物価が 高いと 思います。', 'Tôi nghĩ là giá cả ở Nhật đắt đỏ.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 84. Trích dẫn lời nói: Thể thông thường + と 言いました
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Trích dẫn lời nói', 'Thể thông thường + と 言いました', 'Đã nói là...', 'Dùng để tường thuật gián tiếp nội dung lời nói. Nếu trích trực tiếp thì dùng ngoặc 「 」.', 2, 6, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '寝る前に 「おやすみなさい」と 言います。', 'Trước khi đi ngủ, chúng ta nói "Chúc ngủ ngon".', g_id, NOW(), NOW()), (gen_random_uuid(), 'ミラーさんは 「来週 東京へ 行きます」と 言いました。', 'Anh Miller đã nói là "Tuần sau tôi sẽ đi Tokyo".', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 85. Xác nhận/Dự đoán: S + でしょう
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Xác nhận/Dự đoán', 'S + でしょう', 'S có đúng không? / S chắc là...', 'Dùng để hỏi sự đồng ý của người nghe khi bạn khá tự tin, hoặc đưa ra dự đoán về thời tiết/tin tức.', 2, 6, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '明日は パーティーに 行くでしょう？', 'Ngày mai bạn đi dự tiệc chứ nhỉ?', g_id, NOW(), NOW()), (gen_random_uuid(), '北海道は 寒いでしょう。', 'Hokkaido chắc là lạnh lắm nhỉ.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 22: MỆNH ĐỀ ĐỊNH NGỮ (BỔ NGHĨA DANH TỪ)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 22' LIMIT 1;
    -- Lấy ID nhóm "Mệnh đề bổ ngữ"
    SELECT "GrammarGroupID" INTO group_set_id FROM "GrammarGroups" WHERE "GroupName" = 'Mệnh đề bổ ngữ' LIMIT 1;

    -- 86. Mệnh đề định ngữ: V (thể ngắn) + N
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Mệnh đề định ngữ', 'V (thể ngắn) + N', 'Cái N mà...', 'Dùng cả một câu thể ngắn để làm tính từ bổ nghĩa cho danh từ. Chủ ngữ trong mệnh đề phụ dùng trợ từ が.', 2, 0, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'これは ミラーさんが 作った ケーキです。', 'Đây là chiếc bánh mà anh Miller đã làm.', g_id, NOW(), NOW()), (gen_random_uuid(), 'あそこに いる 人は 誰ですか。', 'Người đang ở đằng kia là ai thế?', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 87. Danh từ kế hoạch/thời gian: V-る + 時間/約束/用事
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Danh từ kế hoạch', 'V-る + 時間/約束/用事', 'Thời gian/Hẹn... để làm V', 'Động từ thể từ điển bổ nghĩa cho danh từ để diễn đạt có thời gian/cuộc hẹn làm việc gì đó.', 2, 5, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '明日 友達と 会う 約束が あります。', 'Ngày mai tôi có hẹn gặp bạn.', g_id, NOW(), NOW()), (gen_random_uuid(), '朝ごはんを 食べる 時間が ありません。', 'Tôi không có thời gian ăn sáng.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 23: KHI... THÌ (TOKI) & HỆ QUẢ (TO)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 23' LIMIT 1;
    -- Lấy ID nhóm "Mệnh đề thời gian & Điều kiện"
    SELECT "GrammarGroupID" INTO group_set_id FROM "GrammarGroups" WHERE "GroupName" = 'Thời gian & Điều kiện' LIMIT 1;

    -- 88. Toki: Khi...
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Khi...', 'V / Adj / N + とき', 'Khi (làm) V / Khi là...', 'Nối hai vế câu để chỉ thời điểm hành động xảy ra. Lưu ý cách chia tính từ và danh từ (N+の/Adj-na+な) trước とき.', 2, 0, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '図書館で 本を 借りるとき、カードが 要ります。', 'Khi mượn sách ở thư viện cần có thẻ.', g_id, NOW(), NOW()), (gen_random_uuid(), '暇なとき、本を 読んだり します。', 'Khi rảnh rỗi, tôi thường đọc sách.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 89. Hệ quả tất yếu (To): Hễ mà...
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Hệ quả tất yếu', 'V-る + と、S2', 'Hễ làm V thì S2 xảy ra', 'Diễn tả một hệ quả tất yếu, quy luật tự nhiên hoặc hướng dẫn sử dụng máy móc, chỉ đường.', 2, 5, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'このボタンを 押すと、お釣りが 出ます。', 'Hễ ấn nút này thì tiền thừa sẽ ra.', g_id, NOW(), NOW()), (gen_random_uuid(), 'これを 回すと、音が 大きくなります。', 'Hễ vặn cái này thì âm thanh sẽ to lên.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 24: CHO NHẬN TRỢ GIÚP (TE-FORM)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 24' LIMIT 1;
    -- Lấy ID nhóm "Cho nhận hành động"
    SELECT "GrammarGroupID" INTO group_set_id FROM "GrammarGroups" WHERE "GroupName" = 'Cho nhận' LIMIT 1;

    -- 90. Te-agemasu: Làm giúp cho ai đó
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Làm giúp ai đó', 'V-て あげます', 'Làm V cho ai đó', 'Người nói thực hiện hành động có lợi cho người khác. Tránh dùng trực tiếp với người bề trên trừ khi thân thiết.', 2, 12, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '私は 木村さんに 本を 貸して あげました。', 'Tôi đã cho chị Kimura mượn sách.', g_id, NOW(), NOW()), (gen_random_uuid(), 'タクシーを 呼びましょうか。', 'Tôi gọi taxi giúp bạn nhé?', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 91. Te-moraimasu: Được ai đó giúp
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Được ai đó giúp', 'V-て もらいます', 'Được ai đó làm giúp V', 'Diễn tả việc nhận được sự giúp đỡ và bày tỏ lòng biết ơn. Chủ ngữ là người nhận.', 2, 12, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '私は 鈴木さんに 漢字を 教えて もらいました。', 'Tôi đã được anh Suzuki dạy chữ Hán.', g_id, NOW(), NOW()), (gen_random_uuid(), '山田さんに 地図を 書いて もらいました。', 'Tôi đã được anh Yamada vẽ bản đồ cho.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 92. Te-kuremasu: Ai đó làm giúp mình
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Ai đó làm giúp mình', 'V-て くれます', 'Ai đó làm V cho tôi', 'Người khác chủ động làm gì đó cho mình. Khác với moraimasu, chủ ngữ ở đây là người thực hiện hành động.', 2, 12, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '家内は 私のシャツを 洗って くれました。', 'Vợ tôi đã giặt áo sơ mi giúp tôi.', g_id, NOW(), NOW()), (gen_random_uuid(), '佐藤さんは お菓子を 買って くれました。', 'Chị Sato đã mua kẹo cho tôi.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 25: CÂU ĐIỀU KIỆN (TARA) & NGHỊCH LÝ (TEMO)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 25' LIMIT 1;
    -- Lấy ID nhóm "Thời gian & Điều kiện"
    SELECT "GrammarGroupID" INTO group_set_id FROM "GrammarGroups" WHERE "GroupName" = 'Thời gian & Điều kiện' LIMIT 1;

    -- 93. Câu điều kiện (Tara): Nếu... thì
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Câu điều kiện Tara', 'V-たら、S2', 'Nếu làm V thì S2', 'Dùng để giả định một tình huống trong tương lai hoặc một hành động là tiền đề cho hành động sau. Cách chia: Thể Ta + ら.', 2, 3, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '雨が 降ったら、出かけません。', 'Nếu trời mưa, tôi sẽ không ra ngoài.', g_id, NOW(), NOW()), (gen_random_uuid(), '安かったら、このパソコンを 買います。', 'Nếu rẻ, tôi sẽ mua chiếc máy tính này.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 94. Nghịch lý (Temo): Dù... vẫn
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Cấu trúc nghịch lý', 'V-ても、S2', 'Cho dù... thì cũng S2', 'Diễn tả một kết quả trái ngược với dự đoán thông thường. V-te + mo, Adj-i (kute) + mo, Adj-na/N + demo.', 2, 2, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), '雨が 降っても、洗濯します。', 'Cho dù trời mưa, tôi vẫn giặt đồ.', g_id, NOW(), NOW()), (gen_random_uuid(), '高くても、この辞書が ほしいです。', 'Dù đắt tôi vẫn muốn có cuốn từ điển này.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

    -- 95. Nhấn mạnh nghịch lý (Ikura): Dù bao nhiêu đi nữa
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Nhấn mạnh nghịch lý', 'いくら + V-ても', 'Cho dù... bao nhiêu đi nữa', 'Đi kèm với mẫu câu Temo để nhấn mạnh về mức độ, số lượng hoặc tần suất của điều kiện giả định.', 2, 2, group_set_id, 1, n5_id, l_id, NOW(), NOW()) ON CONFLICT ("Structure", "Meaning") DO NOTHING;
    INSERT INTO "GrammarTopics" ("GrammarID", "TopicID") SELECT g_id, t_id WHERE EXISTS (SELECT 1 FROM "Grammars" WHERE "GrammarID" = g_id) ON CONFLICT DO NOTHING;
	INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "GrammarID", "CreatedAt", "UpdatedAt") VALUES 
    (gen_random_uuid(), 'いくら 考えても、わかりません。', 'Dù có suy nghĩ bao nhiêu đi nữa, tôi vẫn không hiểu.', g_id, NOW(), NOW()), (gen_random_uuid(), 'いくら 練習しても、上手になりません。', 'Dù luyện tập bao nhiêu đi nữa cũng không giỏi lên được.', g_id, NOW(), NOW()) ON CONFLICT ("Content", "GrammarID") DO NOTHING;

	RAISE NOTICE 'Hoàn tất nạp dữ liệu Ngữ pháp N5 (Bài 1 - 25)';

END $$;

-------------------------------------------------------
-- 5. BỘ THỦ KANJI: CHIA THEO TỪNG NHÓM
-------------------------------------------------------
DO $$ 
BEGIN
    -- NHÓM 1 NÉT
    INSERT INTO "Radicals" ("RadicalID", "Character", "Name", "Meaning", "StrokeCount", "CreatedAt") VALUES
    (gen_random_uuid(), '一', 'Nhất', 'Số một', 1, NOW()),
    (gen_random_uuid(), '丨', 'Cổn', 'Nét sổ thẳng', 1, NOW()),
    (gen_random_uuid(), '丶', 'Chủ', 'Điểm, dấu chấm', 1, NOW()),
    (gen_random_uuid(), '丿', 'Phiệt', 'Nét phẩy', 1, NOW()),
    (gen_random_uuid(), '乙', 'Ất', 'Vị trí thứ 2 trong can', 1, NOW()),
    (gen_random_uuid(), '亅', 'Quyết', 'Nét móc', 1, NOW())
	ON CONFLICT ("Character") DO NOTHING;

    -- NHÓM 2 NÉT
    INSERT INTO "Radicals" ("RadicalID", "Character", "Name", "Meaning", "StrokeCount", "CreatedAt") VALUES
    (gen_random_uuid(), '二', 'Nhị', 'Số hai', 2, NOW()),
    (gen_random_uuid(), '亠', 'Đầu', '(không có nghĩa rõ ràng, thường nằm trên)', 2, NOW()),
    (gen_random_uuid(), '人', 'Nhân', 'Người', 2, NOW()),
    (gen_random_uuid(), '儿', 'Nhân đi', 'Người đi', 2, NOW()),
    (gen_random_uuid(), '入', 'Nhập', 'Vào', 2, NOW()),
    (gen_random_uuid(), '八', 'Bát', 'Số tám', 2, NOW()),
    (gen_random_uuid(), '冂', 'Quynh', 'Vùng biên giới xa', 2, NOW()),
    (gen_random_uuid(), '冖', 'Mịch', 'Trùm khăn lên', 2, NOW()),
    (gen_random_uuid(), '冫', 'Băng', 'Nước đá', 2, NOW()),
    (gen_random_uuid(), '几', 'Kỷ', 'Cái bàn nhỏ', 2, NOW()),
    (gen_random_uuid(), '凵', 'Khảm', 'Há miệng', 2, NOW()),
    (gen_random_uuid(), '刀', 'Đao', 'Con dao', 2, NOW()),
    (gen_random_uuid(), '力', 'Lực', 'Sức mạnh', 2, NOW()),
    (gen_random_uuid(), '勹', 'Bao', 'Bao bọc', 2, NOW()),
    (gen_random_uuid(), '匕', 'Chủy', 'Cái thìa', 2, NOW()),
    (gen_random_uuid(), '匚', 'Phương', 'Tủ đựng', 2, NOW()),
	(gen_random_uuid(), '卜', 'Bốc', 'Xem bói', 2, NOW()),
    (gen_random_uuid(), '卩', 'Tiết', 'Đốt tre, thẻ tre', 2, NOW()),
    (gen_random_uuid(), '厂', 'Hán', 'Sườn núi, vách đá', 2, NOW()),
    (gen_random_uuid(), '厶', 'Khư', 'Riêng tư', 2, NOW()),
    (gen_random_uuid(), '又', 'Hựu', 'Lại nữa, bàn tay phải', 2, NOW()),
	(gen_random_uuid(), '十', 'Thập', 'Số mười', 2, NOW()),
    (gen_random_uuid(), '匸', 'Hệ', 'Che đậy, hầm kín', 2, NOW())
    ON CONFLICT ("Character") DO NOTHING;

    -- NHÓM 3 NÉT
    INSERT INTO "Radicals" ("RadicalID", "Character", "Name", "Meaning", "StrokeCount", "CreatedAt") VALUES
    (gen_random_uuid(), '巛', 'Xuyên', 'Sông ngòi', 3, NOW()),
    (gen_random_uuid(), '口', 'Khẩu', 'Cái miệng', 3, NOW()),
    (gen_random_uuid(), '囗', 'Vi', 'Vây quanh', 3, NOW()),
    (gen_random_uuid(), '土', 'Thổ', 'Đất', 3, NOW()),
    (gen_random_uuid(), '士', 'Sĩ', 'Kẻ sĩ', 3, NOW()),
    (gen_random_uuid(), '夂', 'Truy', 'Đến sau', 3, NOW()),
    (gen_random_uuid(), '夕', 'Tịch', 'Đêm tối', 3, NOW()),
    (gen_random_uuid(), '大', 'Đại', 'To lớn', 3, NOW()),
    (gen_random_uuid(), '女', 'Nữ', 'Phụ nữ', 3, NOW()),
    (gen_random_uuid(), '子', 'Tử', 'Con cái', 3, NOW()),
    (gen_random_uuid(), '宀', 'Miên', 'Mái nhà', 3, NOW()),
    (gen_random_uuid(), '寸', 'Thốn', 'Đơn vị đo (tấc)', 3, NOW()),
    (gen_random_uuid(), '小', 'Tiểu', 'Nhỏ bé', 3, NOW()),
    (gen_random_uuid(), '尸', 'Thi', 'Xác chết', 3, NOW()),
    (gen_random_uuid(), '山', 'Sơn', 'Núi', 3, NOW()),
    (gen_random_uuid(), '工', 'Công', 'Người thợ', 3, NOW()),
    (gen_random_uuid(), '己', 'Kỷ', 'Bản thân mình', 3, NOW()),
    (gen_random_uuid(), '巾', 'Cân', 'Cái khăn', 3, NOW()),
    (gen_random_uuid(), '广', 'Nghiễm', 'Mái nhà bên sườn núi', 3, NOW()),
	(gen_random_uuid(), '廴', 'Dẫn', 'Bước đi dài', 3, NOW()),
    (gen_random_uuid(), '廾', 'Củng', 'Chắp tay', 3, NOW()),
    (gen_random_uuid(), '弋', 'Dặc', 'Bắn cung, chiếm lấy', 3, NOW()),
    (gen_random_uuid(), '弓', 'Cung', 'Cái cung', 3, NOW()),
    (gen_random_uuid(), '彐', 'Ký', 'Đầu con nhím', 3, NOW()),
    (gen_random_uuid(), '彡', 'Sam', 'Lông dài, tóc dài', 3, NOW()),
    (gen_random_uuid(), '彳', 'Xích', 'Bước chân trái', 3, NOW()),
    (gen_random_uuid(), '尢', 'Uông', 'Yếu đuối', 3, NOW()),
    (gen_random_uuid(), '屮', 'Triệt', 'Cỏ non mới mọc', 3, NOW()),
    (gen_random_uuid(), '彑', 'Ký', 'Đầu con nhím', 3, NOW()),
	(gen_random_uuid(), '夊', 'Tuy', 'Đi chậm', 3, NOW()),
    (gen_random_uuid(), '干', 'Can', 'Thiên can, cái khiên', 3, NOW()),
    (gen_random_uuid(), '幺', 'Yêu', 'Nhỏ nhắn', 3, NOW())
    ON CONFLICT ("Character") DO NOTHING;

    -- NHÓM 4 NÉT
    INSERT INTO "Radicals" ("RadicalID", "Character", "Name", "Meaning", "StrokeCount", "CreatedAt") VALUES
    (gen_random_uuid(), '心', 'Tâm', 'Quả tim, lòng dạ', 4, NOW()),
    (gen_random_uuid(), '戈', 'Qua', 'Cây qua (vũ khí)', 4, NOW()),
    (gen_random_uuid(), '戸', 'Hộ', 'Cửa một cánh', 4, NOW()),
    (gen_random_uuid(), '支', 'Chi', 'Cành cây', 4, NOW()),
    (gen_random_uuid(), '攴', 'Phộc', 'Đánh nhẹ', 4, NOW()),
    (gen_random_uuid(), '文', 'Văn', 'Văn chương, chữ nghĩa', 4, NOW()),
    (gen_random_uuid(), '斗', 'Đẩu', 'Cái đấu (đong lường)', 4, NOW()),
    (gen_random_uuid(), '斤', 'Cân', 'Cái rìu, cân Anh', 4, NOW()),
    (gen_random_uuid(), '方', 'Phương', 'Hình vuông', 4, NOW()),
    (gen_random_uuid(), '无', 'Vô', 'Không có', 4, NOW()),
    (gen_random_uuid(), '日', 'Nhật', 'Mặt trời, ngày', 4, NOW()),
    (gen_random_uuid(), '曰', 'Viết', 'Nói rằng', 4, NOW()),
    (gen_random_uuid(), '月', 'Nguyệt', 'Mặt trăng, tháng', 4, NOW()),
    (gen_random_uuid(), '欠', 'Khiếm', 'Thiếu thốn, ngáp', 4, NOW()),
    (gen_random_uuid(), '止', 'Chỉ', 'Dừng lại', 4, NOW()),
    (gen_random_uuid(), '歹', 'Đãi', 'Xấu xa, tệ hại', 4, NOW()),
    (gen_random_uuid(), '殳', 'Thù', 'Binh khí dài', 4, NOW()),
    (gen_random_uuid(), '毋', 'Vô', 'Chớ, đừng', 4, NOW()),
    (gen_random_uuid(), '比', 'Tỷ', 'So sánh', 4, NOW()),
    (gen_random_uuid(), '毛', 'Mao', 'Lông', 4, NOW()),
    (gen_random_uuid(), '氏', 'Thị', 'Họ', 4, NOW()),
    (gen_random_uuid(), '气', 'Khí', 'Hơi nước, khí', 4, NOW()),
    (gen_random_uuid(), '父', 'Phụ', 'Cha', 4, NOW()),
    (gen_random_uuid(), '爻', 'Hào', 'Các hào trong kinh dịch', 4, NOW()),
    (gen_random_uuid(), '爿', 'Tường', 'Mảnh gỗ bên trái', 4, NOW()),
    (gen_random_uuid(), '片', 'Phiến', 'Mảnh gỗ bên phải', 4, NOW()),
    (gen_random_uuid(), '牙', 'Nha', 'Răng', 4, NOW()),
    (gen_random_uuid(), '牛', 'Ngưu', 'Con trâu/bò', 4, NOW()),
    (gen_random_uuid(), '犬', 'Khuyển', 'Con chó', 4, NOW()),
	(gen_random_uuid(), '爪', 'Trảo', 'Móng vuốt', 4, NOW()),
	(gen_random_uuid(), '手', 'Thủ', 'Cái tay', 4, NOW()),
    (gen_random_uuid(), '木', 'Mộc', 'Cây cối', 4, NOW()),
    (gen_random_uuid(), '水', 'Thủy', 'Nước', 4, NOW()),
    (gen_random_uuid(), '火', 'Hỏa', 'Lửa', 4, NOW())
    ON CONFLICT ("Character") DO NOTHING;

    -- NHÓM 5 NÉT
    INSERT INTO "Radicals" ("RadicalID", "Character", "Name", "Meaning", "StrokeCount", "CreatedAt") VALUES
    (gen_random_uuid(), '玄', 'Huyền', 'Màu đen huyền bí', 5, NOW()),
    (gen_random_uuid(), '玉', 'Ngọc', 'Đá quý, ngọc', 5, NOW()),
    (gen_random_uuid(), '瓜', 'Qua', 'Quả dưa', 5, NOW()),
    (gen_random_uuid(), '瓦', 'Ngõa', 'Ngói', 5, NOW()),
    (gen_random_uuid(), '甘', 'Cam', 'Ngọt', 5, NOW()),
    (gen_random_uuid(), '生', 'Sinh', 'Sống, nảy nở', 5, NOW()),
    (gen_random_uuid(), '用', 'Dụng', 'Sử dụng', 5, NOW()),
    (gen_random_uuid(), '田', 'Điền', 'Ruộng', 5, NOW()),
    (gen_random_uuid(), '疋', 'Sơ', 'Đơn vị đo chiều dài', 5, NOW()),
    (gen_random_uuid(), '疒', 'Nạch', 'Bệnh tật', 5, NOW()),
    (gen_random_uuid(), '癶', 'Bát', 'Gạt ngược lại', 5, NOW()),
    (gen_random_uuid(), '白', 'Bạch', 'Màu trắng', 5, NOW()),
    (gen_random_uuid(), '皮', 'Bì', 'Da', 5, NOW()),
    (gen_random_uuid(), '皿', 'Mãnh', 'Bát đĩa', 5, NOW()),
    (gen_random_uuid(), '矢', 'Thỉ', 'Cây tên', 5, NOW()),
    (gen_random_uuid(), '石', 'Thạch', 'Đá', 5, NOW()),
    (gen_random_uuid(), '示', 'Thị', 'Chỉ bảo, thần linh', 5, NOW()),
    (gen_random_uuid(), '禸', 'Nhựu', 'Vết chân thú', 5, NOW()),
    (gen_random_uuid(), '禾', 'Hòa', 'Cây lúa', 5, NOW()),
    (gen_random_uuid(), '穴', 'Huyệt', 'Cái hang', 5, NOW()),
    (gen_random_uuid(), '立', 'Lập', 'Đứng', 5, NOW()),
	(gen_random_uuid(), '目', 'Mục', 'Mắt', 5, NOW()),
    (gen_random_uuid(), '矛', 'Mâu', 'Cái giáo', 5, NOW()),
	(gen_random_uuid(), '母', 'Mẫu', 'Mẹ', 5, NOW())
	ON CONFLICT ("Character") DO NOTHING;

    -- NHÓM 6 NÉT
    INSERT INTO "Radicals" ("RadicalID", "Character", "Name", "Meaning", "StrokeCount", "CreatedAt") VALUES
    (gen_random_uuid(), '竹', 'Trúc', 'Tre trúc', 6, NOW()),
    (gen_random_uuid(), '米', 'Mễ', 'Gạo', 6, NOW()),
    (gen_random_uuid(), '糸', 'Mịch', 'Sợi tơ nhỏ', 6, NOW()),
    (gen_random_uuid(), '缶', 'Phẫu', 'Đồ sành sứ', 6, NOW()),
    (gen_random_uuid(), '网', 'Võng', 'Cái lưới', 6, NOW()),
    (gen_random_uuid(), '羊', 'Dương', 'Con cừu/dê', 6, NOW()),
    (gen_random_uuid(), '羽', 'Vũ', 'Lông vũ', 6, NOW()),
    (gen_random_uuid(), '老', 'Lão', 'Người già', 6, NOW()),
    (gen_random_uuid(), '而', 'Nhi', 'Mà, và', 6, NOW()),
    (gen_random_uuid(), '耒', 'Lỗi', 'Cái cày', 6, NOW()),
    (gen_random_uuid(), '耳', 'Nhĩ', 'Cái tai', 6, NOW()),
    (gen_random_uuid(), '聿', 'Duật', 'Cây bút', 6, NOW()),
    (gen_random_uuid(), '肉', 'Nhục', 'Thịt', 6, NOW()),
    (gen_random_uuid(), '臣', 'Thần', 'Bề tôi', 6, NOW()),
    (gen_random_uuid(), '自', 'Tự', 'Tự bản thân', 6, NOW()),
    (gen_random_uuid(), '至', 'Chí', 'Đến', 6, NOW()),
    (gen_random_uuid(), '臼', 'Cữu', 'Cái cối', 6, NOW()),
    (gen_random_uuid(), '舌', 'Thiệt', 'Cái lưỡi', 6, NOW()),
    (gen_random_uuid(), '舛', 'Suyễn', 'Sai lầm, trái ngược', 6, NOW()),
    (gen_random_uuid(), '舟', 'Chu', 'Cái thuyền', 6, NOW()),
    (gen_random_uuid(), '艮', 'Cấn', 'Dừng lại, bền cứng', 6, NOW()),
    (gen_random_uuid(), '色', 'Sắc', 'Màu sắc', 6, NOW()),
    (gen_random_uuid(), '艸', 'Thảo', 'Cỏ', 6, NOW()),
    (gen_random_uuid(), '虍', 'Hô', 'Vằn vện của con hổ', 6, NOW()),
    (gen_random_uuid(), '虫', 'Trùng', 'Sâu bọ', 6, NOW()),
    (gen_random_uuid(), '血', 'Huyết', 'Máu', 6, NOW()),
    (gen_random_uuid(), '行', 'Hành', 'Đi, làm', 6, NOW()),
    (gen_random_uuid(), '衣', 'Y', 'Áo quần', 6, NOW()),
    (gen_random_uuid(), '襾', 'Á', 'Che đậy', 6, NOW())
    ON CONFLICT ("Character") DO NOTHING;

    -- NHÓM 7 NÉT
    INSERT INTO "Radicals" ("RadicalID", "Character", "Name", "Meaning", "StrokeCount", "CreatedAt") VALUES
    (gen_random_uuid(), '見', 'Kiến', 'Trông thấy', 7, NOW()),
    (gen_random_uuid(), '角', 'Giác', 'Góc, sừng', 7, NOW()),
    (gen_random_uuid(), '谷', 'Cốc', 'Khe núi', 7, NOW()),
    (gen_random_uuid(), '豆', 'Đậu', 'Hạt đậu', 7, NOW()),
    (gen_random_uuid(), '豕', 'Thỉ', 'Con lợn', 7, NOW()),
    (gen_random_uuid(), '豸', 'Trãi', 'Loài muông thú', 7, NOW()),
    (gen_random_uuid(), '赤', 'Xích', 'Màu đỏ', 7, NOW()),
    (gen_random_uuid(), '走', 'Tẩu', 'Chạy', 7, NOW()),
    (gen_random_uuid(), '足', 'Túc', 'Cái chân', 7, NOW()),
    (gen_random_uuid(), '身', 'Thân', 'Thân thể', 7, NOW()),
    (gen_random_uuid(), '酉', 'Dậu', 'Rượu, chi Dậu', 7, NOW()),
    (gen_random_uuid(), '釆', 'Biện', 'Phân biệt', 7, NOW()),
    (gen_random_uuid(), '里', 'Lý', 'Dặm, làng xóm', 7, NOW()),
	(gen_random_uuid(), '辰', 'Thần', 'Nhân vật, chi Thần', 7, NOW()),
    (gen_random_uuid(), '辵', 'Sước', 'Chợt đi chợt dừng', 7, NOW()),
    (gen_random_uuid(), '邑', 'Ấp', 'Vùng đất, kinh đô', 7, NOW()),
	(gen_random_uuid(), '言', 'Ngôn', 'Nói', 7, NOW()),
    (gen_random_uuid(), '貝', 'Bối', 'Vỏ sò (tiền tệ)', 7, NOW()),
    (gen_random_uuid(), '車', 'Xa', 'Xe', 7, NOW()),
    (gen_random_uuid(), '辛', 'Tân', 'Cay, vất vả', 7, NOW())
    ON CONFLICT ("Character") DO NOTHING;

    -- NHÓM LỚN HƠN (Tiêu biểu các bộ quan trọng)
    INSERT INTO "Radicals" ("RadicalID", "Character", "Name", "Meaning", "StrokeCount", "CreatedAt") VALUES
	-- NHÓM 8 NÉT
    (gen_random_uuid(), '金', 'Kim', 'Vàng, kim loại', 8, NOW()),
    (gen_random_uuid(), '長', 'Trường', 'Dài', 8, NOW()),
    (gen_random_uuid(), '隹', 'Chuy', 'Chim đuôi ngắn', 8, NOW()),
    (gen_random_uuid(), '雨', 'Vũ', 'Mưa', 8, NOW()),
    (gen_random_uuid(), '青', 'Thanh', 'Màu xanh', 8, NOW()),
    (gen_random_uuid(), '非', 'Phi', 'Sai, không phải', 8, NOW()),
	(gen_random_uuid(), '門', 'Môn', 'Cửa hai cánh', 8, NOW()),
	(gen_random_uuid(), '隶', 'Lệ', 'Kịp, đến', 8, NOW()),
	(gen_random_uuid(), '阜', 'Phụ', 'Đống đất, gò', 8, NOW()),
	-- NHÓM 9 NÉT
    (gen_random_uuid(), '面', 'Diện', 'Mặt', 9, NOW()),
    (gen_random_uuid(), '革', 'Cách', 'Da thú, cải cách', 9, NOW()),
    (gen_random_uuid(), '音', 'Âm', 'Âm thanh', 9, NOW()),
    (gen_random_uuid(), '頁', 'Hiệt', 'Trang giấy', 9, NOW()),
    (gen_random_uuid(), '風', 'Phong', 'Gió', 9, NOW()),
    (gen_random_uuid(), '飛', 'Phi', 'Bay', 9, NOW()),
    (gen_random_uuid(), '食', 'Thực', 'Ăn', 9, NOW()),
	(gen_random_uuid(), '韋', 'Vi', 'Da thuộc', 9, NOW()),
    (gen_random_uuid(), '韭', 'Cửu', 'Rau hẹ', 9, NOW()),
    (gen_random_uuid(), '首', 'Thủ', 'Đầu', 9, NOW()),
    (gen_random_uuid(), '香', 'Hương', 'Mùi thơm', 9, NOW()),
	-- NHÓM 10 NÉT
    (gen_random_uuid(), '馬', 'Mã', 'Con ngựa', 10, NOW()),
    (gen_random_uuid(), '骨', 'Cốt', 'Xương', 10, NOW()),
    (gen_random_uuid(), '高', 'Cao', 'Cao', 10, NOW()),
    (gen_random_uuid(), '鬼', 'Quỷ', 'Ma quỷ', 10, NOW()),
	(gen_random_uuid(), '髟', 'Bưu', 'Tóc dài', 10, NOW()),
    (gen_random_uuid(), '鬥', 'Đấu', 'Đánh nhau', 10, NOW()),
    (gen_random_uuid(), '鬯', 'Sưởng', 'Rượu nghệ', 10, NOW()),
    (gen_random_uuid(), '鬲', 'Cách', 'Cái nồi, chõ', 10, NOW()),
	-- NHÓM 11 NÉT
    (gen_random_uuid(), '魚', 'Ngư', 'Con cá', 11, NOW()),
    (gen_random_uuid(), '鳥', 'Điểu', 'Con chim', 11, NOW()),
    (gen_random_uuid(), '鹿', 'Lộc', 'Con hươu', 11, NOW()),
    (gen_random_uuid(), '麻', 'Ma', 'Cây gai', 11, NOW()),
	(gen_random_uuid(), '鹵', 'Lỗ', 'Đất mặn, muối', 11, NOW()),
    (gen_random_uuid(), '麥', 'Mạch', 'Lúa mạch', 11, NOW()),
	-- NHÓM 12 NÉT
    (gen_random_uuid(), '黃', 'Hoàng', 'Màu vàng', 12, NOW()),
    (gen_random_uuid(), '黍', 'Thử', 'Lúa nếp', 12, NOW()),
	(gen_random_uuid(), '黑', 'Hắc', 'Màu đen', 12, NOW()),
	(gen_random_uuid(), '黹', 'Chỉ', 'May áo, thêu thùa', 12, NOW()),
	-- NHÓM 13 NÉT
    (gen_random_uuid(), '鼎', 'Đỉnh', 'Cái đỉnh', 13, NOW()),
    (gen_random_uuid(), '鼓', 'Cổ', 'Cái trống', 13, NOW()),
	(gen_random_uuid(), '鼠', 'Thử', 'Con chuột (bản chuẩn)', 13, NOW()),
	(gen_random_uuid(), '黽', 'Mãnh', 'Con ếch, cố gắng', 13, NOW()),
	-- NHÓM 14 NÉT
    (gen_random_uuid(), '鼻', 'Tỵ', 'Cái mũi', 14, NOW()),
    (gen_random_uuid(), '齊', 'Tề', 'Ngang nhau, chỉnh tề', 14, NOW()),
	-- NHÓM 15 NÉT
    (gen_random_uuid(), '齒', 'Xỉ', 'Răng', 15, NOW()),
	-- NHÓM 16 NÉT
    (gen_random_uuid(), '龜', 'Quy', 'Con rùa', 16, NOW()),
    (gen_random_uuid(), '龍', 'Long', 'Con rồng', 16, NOW()),
	-- NHÓM 17 NÉT
    (gen_random_uuid(), '龠', 'Dược', 'Sáo 3 lỗ', 17, NOW())

    ON CONFLICT ("Character") DO NOTHING;

	-- CÁC BIẾN THỂ QUAN TRỌNG (Dạng viết khác của bộ thủ)
    INSERT INTO "RadicalVariants"
	("VariantID","Character","Name","Meaning","StrokeCount","RadicalID","CreatedAt")
	SELECT gen_random_uuid(),'氵','Thủy (biến thể)','Nước',3,"RadicalID",NOW() FROM "Radicals" WHERE "Character"='水'
	UNION ALL SELECT gen_random_uuid(),'忄','Tâm (biến thể)','Lòng dạ',3,"RadicalID",NOW() FROM "Radicals" WHERE "Character"='心'
	UNION ALL SELECT gen_random_uuid(),'扌','Thủ (biến thể)','Tay',3,"RadicalID",NOW() FROM "Radicals" WHERE "Character"='手'
	UNION ALL SELECT gen_random_uuid(),'灬','Hỏa (biến thể)','Lửa',4,"RadicalID",NOW() FROM "Radicals" WHERE "Character"='火'
	UNION ALL SELECT gen_random_uuid(),'亻','Nhân (biến thể)','Người',2,"RadicalID",NOW() FROM "Radicals" WHERE "Character"='人'
	UNION ALL SELECT gen_random_uuid(),'犭','Khuyển (biến thể)','Con chó',3,"RadicalID",NOW() FROM "Radicals" WHERE "Character"='犬'
	UNION ALL SELECT gen_random_uuid(),'辶','Sước (biến thể)','Chợt đi chợt dừng',3,"RadicalID",NOW() FROM "Radicals" WHERE "Character"='辵'
	UNION ALL SELECT gen_random_uuid(),'阝','Ấp (biến thể)','Vùng đất',3,"RadicalID",NOW() FROM "Radicals" WHERE "Character"='邑'
	UNION ALL SELECT gen_random_uuid(),'礻','Thị (biến thể)','Thần linh',4,"RadicalID",NOW() FROM "Radicals" WHERE "Character"='示'
	UNION ALL SELECT gen_random_uuid(),'衤','Y (biến thể)','Áo quần',5,"RadicalID",NOW() FROM "Radicals" WHERE "Character"='衣';

    RAISE NOTICE 'Hoàn tất nạp dữ liệu 214 Bộ thủ';
END $$;

-------------------------------------------------------
-- 6. KANJI N5: PHÂN CHI TIẾT THEO TỪNG BÀI (CẬP NHẬT FOREIGN KEY)
-------------------------------------------------------
DO $$
DECLARE 
    n5_id uuid := '550e8400-e29b-41d4-a716-446655440000';
    t_id uuid;
    l_id uuid;
BEGIN
    -- 1. Lấy TopicID
    SELECT "TopicID" INTO t_id FROM "Topics" WHERE "TopicName" = 'Kanji N5' LIMIT 1;
    
    IF t_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy TopicID "Kanji N5".';
    END IF;

    -------------------------------------------------------
    -- BÀI 1: CHÀO HỎI & GIỚI THIỆU
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 1' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '人', 'ジン, ニン', 'ひと', 'Người', 2, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '人' LIMIT 1), 1, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '学', 'ガク', 'まな.bu', 'Học', 8, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '子' LIMIT 1), 2, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '生', 'セイ, ショウ', 'い.きる', 'Sinh', 5, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '生' LIMIT 1), 3, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '先', 'セン', 'さき', 'Trước', 6, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '儿' LIMIT 1), 4, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '日', 'ニチ', 'ひ', 'Ngày/Mặt trời', 4, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '日' LIMIT 1), 5, 1, t_id, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 2: ĐỒ VẬT SỞ HỮU
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 2' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '本', 'ホン', 'もと', 'Sách/Gốc', 5, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '木' LIMIT 1), 6, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '車', 'シャ', 'くるま', 'Xe ô tô', 7, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '車' LIMIT 1), 7, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '何', 'カ', 'なに, なん', 'Cái gì', 7, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '人' LIMIT 1), 8, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '名', 'メイ, ミョウ', 'な', 'Tên', 6, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '口' LIMIT 1), 9, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '語', 'ゴ', 'かた.る', 'Ngôn ngữ', 14, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '言' LIMIT 1), 10, 1, t_id, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 3: ĐỊA ĐIỂM
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 3' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '円', 'エン', 'まる.い', 'Tiền Yên/Tròn', 4, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '冂' LIMIT 1), 11, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '万', 'マン, バン', 'よろず', 'Vạn (10.000)', 3, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '一' LIMIT 1), 12, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '百', 'ヒャク', 'もも', 'Trăm', 6, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '白' LIMIT 1), 13, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '千', 'セン', 'ち', 'Nghìn', 3, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '十' LIMIT 1), 14, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '社', 'シャ', 'やしろ', 'Công ty/Đền', 8, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '示' LIMIT 1), 15, 1, t_id, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 4: THỜI GIAN & NGÀY THÁNG
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 4' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '時', 'ジ', 'とき', 'Giờ', 10, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '日' LIMIT 1), 16, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '分', 'ブン, フン', 'わ.かる, わ.ける', 'Phút/Hiểu', 4, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '刀' LIMIT 1), 17, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '半', 'ハン', 'なか.ba', 'Một nửa', 5, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '十' LIMIT 1), 18, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '午', 'ゴ', 'うま', 'Ngọ (Trưa)', 4, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '十' LIMIT 1), 19, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '月', 'ゲツ, ガツ', 'つき', 'Tháng/Trăng', 4, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '月' LIMIT 1), 20, 1, t_id, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 5: DI CHUYỂN
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 5' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '行', 'コウ', 'い.く', 'Đi', 6, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '行' LIMIT 1), 21, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '来', 'ライ', 'く.る', 'Đến', 7, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '木' LIMIT 1), 22, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '帰', 'キ', 'かえ.る', 'Về', 10, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '止' LIMIT 1), 23, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '年', 'ネン', 'とし', 'Năm', 6, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '干' LIMIT 1), 24, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    -- Lưu ý: Bộ Sước viết là 辵 hoặc biến thể 辶
    (gen_random_uuid(), '週', 'シュウ', '---', 'Tuần', 11, ((SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '辵' LIMIT 1)), 25, 1, t_id, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 6: ĂN UỐNG & HÀNH ĐỘNG
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 6' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '食', 'ショク', 'た.べる', 'Ăn', 9, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '食' LIMIT 1), 26, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '飲', 'イン', 'の.む', 'Uống', 12, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '食' LIMIT 1), 27, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '見', 'ケン', 'み.る', 'Nhìn/Xem', 7, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '見' LIMIT 1), 28, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '聞', 'ブン, モン', 'き.く', 'Nghe', 14, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '耳' LIMIT 1), 29, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '買', 'バイ', 'か.う', 'Mua', 12, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '貝' LIMIT 1), 30, 1, t_id, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 7: CÔNG CỤ & TẶNG QUÀ
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 7' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '手', 'シュ', 'て', 'Tay', 4, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '手' LIMIT 1), 31, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '紙', 'シ', 'かみ', 'Giấy', 10, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '糸' LIMIT 1), 32, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '父', 'フ', 'ちち', 'Bố', 4, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '父' LIMIT 1), 33, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '母', 'ボ', 'はは', 'Mẹ', 5, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '母' LIMIT 1), 34, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '子', 'シ', 'こ', 'Con', 3, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '子' LIMIT 1), 35, 1, t_id, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 8: TÍNH TỪ CƠ BẢN
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 8' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '大', 'ダイ', 'おお.kいい', 'Lớn', 3, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '大' LIMIT 1), 36, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '小', 'ショウ', 'ちい.さい', 'Nhỏ', 3, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '小' LIMIT 1), 37, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '高', 'コウ', 'たか.い', 'Cao/Đắt', 10, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '高' LIMIT 1), 38, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '安', 'アン', 'やす.い', 'Rẻ/An tâm', 6, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '宀' LIMIT 1), 39, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '新', 'シン', 'あたら.しい', 'Mới', 13, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '斤' LIMIT 1), 40, 1, t_id, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 9: TRẠNG THÁI & SỞ THÍCH
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 9' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '友', 'ユウ', 'とも', 'Bạn bè', 4, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '又' LIMIT 1), 41, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '書', 'ショ', 'か.く', 'Viết', 10, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '聿' LIMIT 1), 42, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '少', 'ショウ', 'すく.ない', 'Ít', 4, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '小' LIMIT 1), 43, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '多', 'タ', 'おお.い', 'Nhiều', 6, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '夕' LIMIT 1), 44, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '長', 'チョウ', 'なが.い', 'Dài', 8, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '長' LIMIT 1), 45, 1, t_id, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 10: VỊ TRÍ & TỒN TẠI
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 10' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '上', 'ジョウ', 'うえ', 'Trên', 3, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '一' LIMIT 1), 46, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '下', 'カ', 'した', 'Dưới', 3, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '一' LIMIT 1), 47, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '中', 'チュウ', 'なか', 'Trong/Giữa', 4, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '口' LIMIT 1), 48, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '右', 'ウ', 'みぎ', 'Bên phải', 5, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '口' LIMIT 1), 49, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '左', 'サ', 'ひだり', 'Bên trái', 5, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '口' LIMIT 1), 50, 1, t_id, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;
    
    -------------------------------------------------------
    -- BÀI 11: SỐ LƯỢNG & ĐƠN VỊ ĐẾM
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 11' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '枚', 'マイ', '---', 'Tờ, lá (vật mỏng)', 8, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '木' LIMIT 1), 51, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '台', 'ダイ, タイ', '---', 'Cái (máy móc, xe)', 5, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '口' LIMIT 1), 52, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '回', 'カイ', 'まわ.る', 'Lần / Vòng quanh', 6, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '囗' LIMIT 1), 53, 1, t_id, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 12: SO SÁNH & THỜI TIẾT
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 12' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '雨', 'ウ', 'あめ', 'Mưa', 8, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '雨' LIMIT 1), 54, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '天', 'テン', 'あめ', 'Trời', 4, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '大' LIMIT 1), 55, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '気', 'キ', '---', 'Khí / Tâm trạng', 6, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '气' LIMIT 1), 56, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '風', 'フウ', 'かぜ', 'Gió', 9, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '風' LIMIT 1), 57, 1, t_id, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 13: MONG MUỐN & CƠ THỂ
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 13' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '口', 'コウ', 'くち', 'Miệng', 3, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '口' LIMIT 1), 58, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '目', 'モク', 'め', 'Mắt', 5, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '目' LIMIT 1), 59, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '耳', 'ジ', 'みみ', 'Tai', 6, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '耳' LIMIT 1), 60, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '足', 'ソク', 'あし', 'Chân', 7, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '足' LIMIT 1), 61, 1, t_id, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 14: THỂ TE & ĐỊA ĐIỂM CÔNG CỘNG
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 14' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '駅', 'エキ', '---', 'Nhà ga', 14, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '馬' LIMIT 1), 62, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '電', 'デン', '---', 'Điện', 13, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '雨' LIMIT 1), 63, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '話', 'ワ', 'はな.す', 'Nói chuyện', 13, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '言' LIMIT 1), 64, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '出', 'シュツ', 'で.る, だ.す', 'Ra / Đưa ra', 5, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '凵' LIMIT 1), 65, 1, t_id, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 15: SỞ HỮU & CÔNG VIỆC
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 15' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '住', 'ジュウ', 'す.む', 'Cư trú / Sống', 7, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '人' LIMIT 1), 66, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '所', 'ショ', 'ところ', 'Nơi chốn', 8, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '戸' LIMIT 1), 67, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '知', 'チ', 'し.る', 'Biết', 8, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '矢' LIMIT 1), 68, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '工', 'コウ', '---', 'Công việc / Kỹ thuật', 3, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '工' LIMIT 1), 69, 1, t_id, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;
    
    -------------------------------------------------------
    -- BÀI 16: LIÊN KẾT HÀNH ĐỘNG
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 16' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '入', 'ニュウ', 'はい.る, い.れる', 'Vào / Cho vào', 2, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '入' LIMIT 1), 70, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '体', 'タイ', 'からだ', 'Cơ thể', 7, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '人' LIMIT 1), 71, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '明', 'メイ', 'あか.るい', 'Sáng', 8, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '日' LIMIT 1), 72, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '暗', 'アン', 'くら.い', 'Tối', 13, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '日' LIMIT 1), 73, 1, t_id, n5_id, l_id, NOW(), NOW(), '') 
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 17: PHỦ ĐỊNH & SỨC KHỎE
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 17' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '病', 'ビョウ', 'やまい', 'Bệnh', 10, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '疒' LIMIT 1), 74, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '院', 'イン', '---', 'Viện (Bệnh viện)', 10, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '阜' LIMIT 1), 75, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '医', 'イ', '---', 'Y (Bác sĩ)', 7, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '匚' LIMIT 1), 76, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '者', 'シャ', 'もの', 'Người', 8, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '老' LIMIT 1), 77, 1, t_id, n5_id, l_id, NOW(), NOW(), '') 
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 18: KHẢ NĂNG & THIÊN NHIÊN
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 18' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '山', 'サン', 'やま', 'Núi', 3, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '山' LIMIT 1), 78, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '川', 'セン', 'かわ', 'Sông', 3, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '巛' LIMIT 1), 79, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '田', 'デン', 'た', 'Ruộng', 5, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '田' LIMIT 1), 80, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '海', 'カイ', 'うmi', 'Biển', 9, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '水' LIMIT 1), 81, 1, t_id, n5_id, l_id, NOW(), NOW(), '') 
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 19: KINH NGHIỆM & TRẠNG THÁI (NGŨ HÀNH)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 19' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '火', 'カ', 'ひ', 'Lửa', 4, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '火' LIMIT 1), 82, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '水', 'スイ', 'みず', 'Nước', 4, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '水' LIMIT 1), 83, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '木', 'モク', 'き', 'Cây', 4, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '木' LIMIT 1), 84, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '金', 'キン', 'かね', 'Vàng / Tiền', 8, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '金' LIMIT 1), 85, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '土', 'ド', 'つち', 'Đất', 3, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '土' LIMIT 1), 86, 1, t_id, n5_id, l_id, NOW(), NOW(), '') 
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 20: GIAO TIẾP THÂN MẬT
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 20' LIMIT 1;
    
    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '道', 'ドウ', 'みち', 'Đường / Đạo', 12, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '辵' LIMIT 1), 87, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '店', 'テン', 'みせ', 'Cửa hàng', 8, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '广' LIMIT 1), 88, 1, t_id, n5_id, l_id, NOW(), NOW(), '') 
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 21: TƯỜNG THUẬT & DỰ ĐOÁN
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 21' LIMIT 1;
    
    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '思', 'シ', 'おmo.u', 'Nghĩ', 9, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '心' LIMIT 1), 89, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '言', 'ゲン, ゴン', 'い.u, こと', 'Nói', 7, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '言' LIMIT 1), 90, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '物', 'ブツ, モツ', 'もの', 'Vật / Đồ vật', 8, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '牛' LIMIT 1), 91, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '正', 'セイ, ショウ', 'ただ.しい', 'Chính xác / Đúng', 5, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '止' LIMIT 1), 92, 1, t_id, n5_id, l_id, NOW(), NOW(), '') 
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 22: MỆNH ĐỀ ĐỊNH NGỮ (TRANG PHỤC)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 22' LIMIT 1;
    
    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '着', 'チャク', 'き.る, つ.く', 'Mặc / Đến nơi', 12, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '羊' LIMIT 1), 93, 1, t_id, n5_id, l_id, NOW(), NOW(), '') 
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 23: PHƯƠNG HƯỚNG
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 23' LIMIT 1;
    
    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '東', 'トウ', 'ひがし', 'Phía Đông', 8, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '木' LIMIT 1), 94, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '西', 'セイ, サイ', 'にし', 'Phía Tây', 6, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '襾' LIMIT 1), 95, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '南', 'ナン', 'みなみ', 'Phía Nam', 9, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '十' LIMIT 1), 96, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '北', 'ホク', 'きた', 'Phía Bắc', 5, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '匕' LIMIT 1), 97, 1, t_id, n5_id, l_id, NOW(), NOW(), '') 
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 24: GIA ĐÌNH
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 24' LIMIT 1;
    
    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '兄', 'キョウ', 'あに', 'Anh trai', 5, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '儿' LIMIT 1), 98, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '姉', 'シ', 'あね', 'Chị gái', 8, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '女' LIMIT 1), 99, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '弟', 'ダイ', 'おとうと', 'Em trai', 7, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '弓' LIMIT 1), 100, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '妹', 'マイ', 'いもうと', 'Em gái', 8, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '女' LIMIT 1), 101, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '家', 'カ', 'いえ, うち', 'Nhà / Gia đình', 10, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '宀' LIMIT 1), 102, 1, t_id, n5_id, l_id, NOW(), NOW(), '') 
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 25: VẬN ĐỘNG & KẾT THÚC
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 25' LIMIT 1;
    
    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '運', 'ウン', 'はこ.ぶ', 'Vận chuyển', 12, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '辵' LIMIT 1), 103, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '動', 'ドウ', 'うご.く', 'Chuyển động', 11, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '力' LIMIT 1), 104, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '止', 'シ', 'と.まる, と.める', 'Dừng lại', 4, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '止' LIMIT 1), 105, 1, t_id, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '歩', 'ホ', 'ある.く', 'Đi bộ', 8, (SELECT "RadicalID" FROM "Radicals" WHERE "Character" = '止' LIMIT 1), 106, 1, t_id, n5_id, l_id, NOW(), NOW(), '') 
    ON CONFLICT ("Character") DO NOTHING;

    RAISE NOTICE 'Hoàn tất nạp dữ liệu Kanji N5 (Bài 1 - 25)';
END $$;

-------------------------------------------------------
-- 7. TỪ VỰNG N5 CHI TIẾT BÀI 1 - 25
-------------------------------------------------------
DO $$
DECLARE 
    -- 1. Định nghĩa các ID cố định (Bắt buộc phải có để gán loại từ)
    t_danh_tu      uuid := 'a1111111-1111-1111-1111-111111111111';
    t_dong_tu_1    uuid := 'a2222222-2222-2222-2222-222222222222';
    t_dong_tu_2    uuid := 'a3333333-3333-3333-3333-333333333333';
    t_dong_tu_3    uuid := 'a4444444-4444-4444-4444-444444444444';
    t_tinh_tu_i    uuid := 'a5555555-5555-5555-5555-555555555555';
    t_tinh_tu_na   uuid := 'a6666666-6666-6666-6666-666666666666';
    t_trang_tu     uuid := 'a7777777-7777-7777-7777-777777777777';
    t_tro_tu       uuid := 'a8888888-8888-8888-8888-888888888888';
    t_lien_tu      uuid := 'a9999999-9999-9999-9999-999999999999';
    t_tu_dong_tu   uuid := 'b1111111-1111-1111-1111-111111111111';
    t_tha_dong_tu  uuid := 'b2222222-2222-2222-2222-222222222222';
    t_than_tu      uuid := 'b3333333-3333-3333-3333-333333333333';
	t_tu_nghi_van  uuid := 'b4444444-4444-4444-4444-444444444444';
	t_phu_tu       uuid := 'b5555555-5555-5555-5555-555555555555';
	t_dai_tu       uuid := 'b6666666-6666-6666-6666-666666666666';
    
    n5_id uuid := '550e8400-e29b-41d4-a716-446655440000';
    l_id uuid;
    t_id uuid;
    v_id uuid;
BEGIN
    -- 1. Lấy TopicID
    SELECT "TopicID" INTO t_id FROM "Topics" WHERE "TopicName" = 'Từ vựng N5' LIMIT 1;
    
    IF t_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy TopicID "Từ vựng N5".';
    END IF;

    -------------------------------------------------------
    -- BÀI 1: CHÀO HỎI & NGHỀ NGHIỆP
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 1' LIMIT 1;

    -- Danh sách từ vựng Bài 1 (Không còn cột WordType)
    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "IsCommon", "Priority", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '私', 'わたし', 'Tôi', true, 1, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '学生', 'がくせい', 'Sinh viên', true, 2, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '先生', 'せんせい', 'Thầy giáo/Cô giáo', true, 3, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '会社員', 'かいしゃいん', 'Nhân viên công ty', true, 4, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '銀行員', 'ぎんこういん', 'Nhân viên ngân hàng', true, 5, 1, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -- GÁN LOẠI TỪ & VÍ DỤ BÀI 1
    -- 1. 私
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '私' AND "Reading" = 'わたし' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '私はマインです。', 'Tôi là Nam.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '私はベトナム人です。', 'Tôi là người Việt Nam.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 2. 学生
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '学生' AND "Reading" = 'がくせい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '彼は学生です。', 'Anh ấy là sinh viên.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '学生じゃありません。', 'Tôi không phải là sinh viên.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 3. 先生
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '先生' AND "Reading" = 'せんせい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'ワット先生はイギリス人です。', 'Thầy Watt là người Anh.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'あの方は先生ですか。', 'Vị kia có phải là giáo viên không?', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 4. 会社員
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '会社員' AND "Reading" = 'かいしゃいん' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '私は会社員です。', 'Tôi là nhân viên công ty.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'ミラさんは会社員ですか。', 'Anh Miller có phải là nhân viên công ty không?', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 5. 銀行員
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '銀行員' AND "Reading" = 'ぎんこういん' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '田中さんは銀行員です。', 'Anh Tanaka là nhân viên ngân hàng.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '母は銀行員です。', 'Mẹ tôi là nhân viên ngân hàng.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -------------------------------------------------------
    -- BÀI 2: ĐỒ VẬT XUNG QUANH
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 2' LIMIT 1;

    INSERT INTO "Vocabularies" 
   ("VocabID", "Word", "Reading", "Meaning", "IsCommon", "Priority", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '本', 'ほん', 'Sách', true, 6, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '辞書', 'じしょ', 'Từ điển', true, 7, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '雑誌', 'ざっし', 'Tạp chí', true, 8, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '新聞', 'しんぶん', 'Tờ báo', true, 9, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '時計', 'とけい', 'Đồng hồ', true, 10, 1, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -- GÁN LOẠI TỪ & VÍ DỤ BÀI 2
    -- 1. 本
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '本' AND "Reading" = 'ほん' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'これは日本語の本です。', 'Đây là cuốn sách tiếng Nhật.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'その本は私のです。', 'Cuốn sách đó là của tôi.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 2. 辞書
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '辞書' AND "Reading" = 'じしょ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'それは英語の辞書です。', 'Đó là từ điển tiếng Anh.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '辞書で調べます。', 'Tra cứu bằng từ điển.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 3. 雑誌
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '雑誌' AND "Reading" = 'ざっし' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'カメラの雑誌 को đọc tạp chí về máy ảnh.', 'Tôi đọc tạp chí về máy ảnh.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'この雑誌はいくらですか。', 'Cuốn tạp chí này bao nhiêu tiền?', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 4. 新聞
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '新聞' AND "Reading" = 'しんぶん' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '毎朝新聞を読みます。', 'Mỗi sáng tôi đều đọc báo.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'それは今日の新聞です。', 'Đó là tờ báo của ngày hôm nay.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 5. 時計
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '時計' AND "Reading" = 'とけい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'この時計は高いです。', 'Cái đồng hồ này đắt.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'あの方は新しい時計を買いました。', 'Vị kia đã mua một cái đồng hồ mới.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -------------------------------------------------------
    -- BÀI 3: ĐỊA ĐIỂM & GIÁ CẢ
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 3' LIMIT 1;

    INSERT INTO "Vocabularies" 
   ("VocabID", "Word", "Reading", "Meaning", "IsCommon", "Priority", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '教室', 'きょうしつ', 'Lớp học', true, 11, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '食堂', 'しょくどう', 'Nhà ăn', true, 12, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '受付', 'うけつけ', 'Quầy lễ tân', true, 13, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '事務所', 'じむしょ', 'Văn phòng', true, 14, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '会議室', 'かいぎしつ', 'Phòng họp', true, 15, 1, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -- Ví dụ & Loại từ Bài 3
    -- 1. 教室
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '教室' AND "Reading" = 'きょうしつ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '教室はあちらです。', 'Lớp học ở phía kia.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'ここは３階の教室です。', 'Đây là lớp học ở tầng 3.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 2. 食堂
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '食堂' AND "Reading" = 'しょくどう' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '食堂で昼ご飯を食べます。', 'Ăn trưa tại nhà ăn.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '食堂はどこですか. ', 'Nhà ăn ở đâu vậy?', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 3. 受付
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '受付' AND "Reading" = 'うけつけ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '受付は１階です。', 'Quầy lễ tân ở tầng 1.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '受付で聞きます。', 'Hỏi tại quầy lễ tân.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 4. 事務所
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '事務所' AND "Reading" = 'じむしょ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '事務所に先生がいます。', 'Trong văn phòng có thầy giáo.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '事務所はあそこです。', 'Văn phòng ở đằng kia.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 5. 会議室
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '会議室' AND "Reading" = 'かいぎしつ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '会議室はどこですか。', 'Phòng họp ở đâu thế?', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '会議室は２階にあります。', 'Phòng họp nằm ở tầng 2.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -------------------------------------------------------
    -- BÀI 4: THỜI GIAN & LÀM VIỆC
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 4' LIMIT 1;

    INSERT INTO "Vocabularies" 
   ("VocabID", "Word", "Reading", "Meaning", "IsCommon", "Priority", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '起きる', 'おきる', 'Thức dậy', true, 16, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '寝る', 'ねる', 'Đi ngủ', true, 17, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '働く', 'はたらく', 'Làm việc', true, 18, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '勉強', 'べんきょう', 'Học tập', true, 19, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '休み', 'やすみ', 'Nghỉ ngơi/Ngày nghỉ', true, 20, 1, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -- Ví dụ & Loại từ Bài 4
    -- 1. 起きる (Nhóm 2)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '起きる' AND "Reading" = 'おきる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_2) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '毎朝６時に起きます。', 'Mỗi sáng tôi thức dậy lúc 6 giờ.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '明日は７時に起きます。', 'Ngày mai tôi sẽ thức dậy lúc 7 giờ.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 2. 寝る (Nhóm 2)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '寝る' AND "Reading" = 'ねる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_2) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '夜１１時に寝ます。', 'Tôi đi ngủ lúc 11 giờ đêm.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '昨日の夜は１２時に寝ました。', 'Đêm qua tôi đã đi ngủ lúc 12 giờ.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 3. 働く (Nhóm 1)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '働く' AND "Reading" = 'はたらく' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '月曜日から金曜日まで働きます。', 'Tôi làm việc từ thứ Hai đến thứ Sáu.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '銀行は何時から何時まで働きますか。', 'Ngân hàng làm việc từ mấy giờ đến mấy giờ?', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 4. 勉強 (Danh từ học tập / Động từ nhóm 3)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '勉強' AND "Reading" = 'べんきょう' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_3) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '毎日日本語を勉強します。', 'Học tiếng Nhật mỗi ngày.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '昨日の晩は勉強しませんでした。', 'Tối qua tôi đã không học bài.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 5. 休み
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '休み' AND "Reading" = 'やすみ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '今日は休みです。', 'Hôm nay là ngày nghỉ.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '昼休みは１２時からです。', 'Nghỉ trưa bắt đầu từ 12 giờ.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -------------------------------------------------------
    -- BÀI 5: DI CHUYỂN & GIAO THÔNG
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 5' LIMIT 1;

    INSERT INTO "Vocabularies" 
   ("VocabID", "Word", "Reading", "Meaning", "IsCommon", "Priority", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '行く', 'いく', 'Đi', true, 21, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '来る', 'くる', 'Đến', true, 22, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '帰る', 'かえる', 'Về', true, 23, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '電車', 'でんしゃ', 'Tàu điện', true, 24, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '飛行機', 'ひこうき', 'Máy bay', true, 25, 1, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -- Ví dụ & Loại từ Bài 5
    -- 1. 行く (Động từ nhóm 1)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '行く' AND "Reading" = 'いく' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '明日スーパーへ行きます。', 'Ngày mai tôi sẽ đi siêu thị.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'どこへ行きますか。', 'Bạn đi đâu thế?', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 2. 来る (Động từ nhóm 3 - Bất quy tắc)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '来る' AND "Reading" = 'くる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_3) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '日本へ来ました。', 'Tôi đã đến Nhật Bản.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '友達がうちへ来ます。', 'Bạn tôi sẽ đến nhà chơi.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 3. 帰る (Động từ nhóm 1 - Trường hợp đặc biệt đuôi eru nhưng là nhóm 1)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '帰る' AND "Reading" = 'かえる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '８時にうちへ帰ります。', 'Tôi về nhà lúc 8 giờ.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'いつ国へ帰りますか。', 'Khi nào bạn về nước?', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 4. 電車 (Danh từ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '電車' AND "Reading" = 'でんしゃ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '電車で会社へ行きます。', 'Tôi đi làm bằng tàu điện.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'この電車は大阪へ行きますか。', 'Chuyến tàu điện này có đi Osaka không?', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 5. 飛行機 (Danh từ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '飛行機' AND "Reading" = 'ひこうき' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '飛行機で日本へ来ました。', 'Tôi đã đến Nhật Bản bằng máy bay.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '飛行기의チケットを買いました。', 'Tôi đã mua vé máy bay.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -------------------------------------------------------
    -- BÀI 6: ĂN UỐNG & HOẠT ĐỘNG
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 6' LIMIT 1;

    INSERT INTO "Vocabularies" 
   ("VocabID", "Word", "Reading", "Meaning", "IsCommon", "Priority", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '食べる', 'たべる', 'Ăn', true, 26, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '飲む', 'のむ', 'Uống', true, 27, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '吸う', 'すう', 'Hút (thuốc)', true, 28, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '見る', 'みる', 'Xem / Nhìn', true, 29, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '聞く', 'きく', 'Nghe', true, 30, 1, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -- Ví dụ & Loại từ Bài 6
    -- 1. 食べる (Động từ nhóm 2)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '食べる' AND "Reading" = 'たべる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_2) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'パンを食べます。', 'Tôi ăn bánh mì.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '毎朝何をたべますか。', 'Mỗi sáng bạn ăn cái gì thế?', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 2. 飲む (Động từ nhóm 1)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '飲む' AND "Reading" = 'のむ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'お酒を飲みます。', 'Tôi uống rượu.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '一緒にコーヒーを飲みませんか。', 'Bạn cùng uống cà phê với tôi không?', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 3. 吸う (Động từ nhóm 1)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '吸う' AND "Reading" = 'すう' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'たばこを吸います。', 'Tôi hút thuốc lá.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'ここではたばこを吸わないでください。', 'Xin đừng hút thuốc ở đây.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 4. 見る (Động từ nhóm 2)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '見る' AND "Reading" = 'みる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_2) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'テレビを見ます。', 'Tôi xem tivi.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '映画を見に行きます。', 'Tôi đi xem phim.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 5. 聞く (Động từ nhóm 1)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '聞く' AND "Reading" = 'きく' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '音楽を聞きます。', 'Tôi nghe nhạc.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'ラジオを聞きました。', 'Tôi đã nghe đài radio.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -------------------------------------------------------
    -- BÀI 7: GIAO TIẾP & TẶNG QUÀ
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 7' LIMIT 1;

    INSERT INTO "Vocabularies" 
   ("VocabID", "Word", "Reading", "Meaning", "IsCommon", "Priority", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '切る', 'きる', 'Cắt', true, 31, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '送る', 'おくる', 'Gửi', true, 32, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), 'あげる', 'あげる', 'Cho / Tặng', true, 33, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), 'もらう', 'もらう', 'Nhận', true, 34, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '貸す', 'かす', 'Cho mượn', true, 35, 1, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -- Ví dụ & Loại từ Bài 7
    -- 1. 切る (Động từ nhóm 1 - Đặc biệt đuôi iru nhưng là nhóm 1)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '切る' AND "Reading" = 'きる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'はさみで紙を切ります。', 'Cắt giấy bằng kéo.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'ナイフでパンを切ります。', 'Cắt bánh mì bằng dao.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 2. 送る (Động từ nhóm 1)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '送る' AND "Reading" = 'おくる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '荷物を送ります。', 'Tôi gửi hành lý.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '家族にメールを送ります。', 'Tôi gửi email cho gia đình.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 3. あげる (Động từ nhóm 2)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'あげる' AND "Reading" = 'あげる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_2) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '花 को tặng hoa.', 'Tôi tặng hoa.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '誕生日にプレゼントをあげました。', 'Tôi đã tặng quà vào ngày sinh nhật.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 4. もらう (Động từ nhóm 1)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'もらう' AND "Reading" = 'もらう' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '先生に本をもらいました。', 'Tôi đã nhận được cuốn sách từ thầy giáo.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '母に電話をもらいました。', 'Tôi đã nhận được điện thoại từ mẹ.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 5. 貸す (Động từ nhóm 1)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '貸す' AND "Reading" = 'かす' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '友達にお金を貸します。', 'Tôi cho bạn mượn tiền.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '傘を貸してください。', 'Hãy cho tôi mượn ô (dù).', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -------------------------------------------------------
    -- BÀI 8: TÍNH TỪ
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 8' LIMIT 1;

    INSERT INTO "Vocabularies" 
   ("VocabID", "Word", "Reading", "Meaning", "IsCommon", "Priority", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), 'ハンサム', 'はんさむ', 'Đẹp trai', true, 36, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '静か', 'しずか', 'Yên tĩnh', true, 37, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '大きい', 'おおきい', 'Lớn / To', true, 38, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '新しい', 'あたらしい', 'Mới', true, 39, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '高い', 'たかい', 'Đắt / Cao', true, 40, 1, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -- Ví dụ & Loại từ Bài 8
    -- 1. ハンサム (Tính từ na)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'ハンサム' AND "Reading" = 'はんさむ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_tinh_tu_na) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '彼はハンサムですね。', 'Anh ấy đẹp trai nhỉ.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'ハンサムな人を紹介してください。', 'Hãy giới thiệu cho tôi người nào đẹp trai đi.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 2. 静か (Tính từ na)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '静か' AND "Reading" = 'しずか' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_tinh_tu_na) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'この町は静かです。', 'Thị trấn này yên tĩnh.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '静かな場所で勉強します。', 'Tôi học bài ở một nơi yên tĩnh.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 3. 大きい (Tính từ i)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '大きい' AND "Reading" = 'おおきい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_tinh_tu_i) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '大きい家ですね。', 'Ngôi nhà lớn nhỉ.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'この靴は少し大きいです。', 'Đôi giày này hơi lớn một chút.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 4. 新しい (Tính từ i)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '新しい' AND "Reading" = 'あたらしい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_tinh_tu_i) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '新しい靴を買いました。', 'Tôi đã mua đôi giày mới.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'そのカメラは新しいですか。', 'Cái máy ảnh đó có mới không?', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 5. 高い (Tính từ i)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '高い' AND "Reading" = 'たかい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_tinh_tu_i) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '日本の果物は高いです. ', 'Trái cây ở Nhật Bản đắt.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'あの方の背は高いですね。', 'Vị kia dáng cao nhỉ.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -------------------------------------------------------
    -- BÀI 9: SỞ THÍCH & NĂNG LỰC
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 9' LIMIT 1;

    INSERT INTO "Vocabularies" 
   ("VocabID", "Word", "Reading", "Meaning", "IsCommon", "Priority", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '好き', 'すき', 'Thích', true, 41, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '上手', 'じょうず', 'Giỏi', true, 42, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), 'わかる', 'わかる', 'Hiểu / Biết', true, 43, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), 'ある', 'ある', 'Có (vật)', true, 44, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '料理', 'りょうり', 'Món ăn / Nấu ăn', true, 45, 1, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -- Ví dụ & Loại từ Bài 9
    -- 1. 好き (Tính từ na)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '好き' AND "Reading" = 'すき' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_tinh_tu_na) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '私は日本料理が好きです。', 'Tôi thích món ăn Nhật Bản.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'どんなスポーツが好きですか。', 'Bạn thích môn thể thao nào?', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 2. 上手 (Tính từ na)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '上手' AND "Reading" = 'じょうず' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_tinh_tu_na) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'マインさんはテニスが上手です。', 'Anh Nam giỏi tennis.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '歌が上手な人が好きです。', 'Tôi thích người hát giỏi.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 3. わかる (Động từ nhóm 1)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'わかる' AND "Reading" = 'わかる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '英語がわかりますか。', 'Bạn có hiểu tiếng Anh không?', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '漢字が少しわかります。', 'Tôi hiểu chữ Kanji một chút.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 4. ある (Động từ nhóm 1)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'ある' AND "Reading" = 'ある' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'お金があります。', 'Tôi có tiền.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '今日は約束があります。', 'Hôm nay tôi có hẹn.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 5. 料理 (Danh từ / Động từ nhóm 3)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '料理' AND "Reading" = 'りょうり' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_3) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '料理を作ります。', 'Tôi nấu ăn (làm món ăn).', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'この料理はとてもおいしいです。', 'Món ăn này rất ngon.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -------------------------------------------------------
    -- BÀI 10: VỊ TRÍ & SỰ TỒN TẠI
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 10' LIMIT 1;

    INSERT INTO "Vocabularies" 
   ("VocabID", "Word", "Reading", "Meaning", "IsCommon", "Priority", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), 'いる', 'いる', 'Có (người/động vật)', true, 46, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '箱', 'はこ', 'Cái hộp', true, 47, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '上', 'うえ', 'Trên', true, 48, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '下', 'した', 'Dưới', true, 49, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '近く', 'ちかく', 'Gần', true, 50, 1, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -- Ví dụ & Loại từ Bài 10
    -- 1. いる (Động từ nhóm 2)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'いる' AND "Reading" = 'いる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_2) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'あそこに猫がいます。', 'Ở đằng kia có con mèo.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '事務所に田中さんがいます。', 'Anh Tanaka ở trong văn phòng.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 2. 箱 (Danh từ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '箱' AND "Reading" = 'はこ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '箱の中に何がありますか。', 'Trong hộp có cái gì thế?', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'この箱を捨ててください。', 'Hãy vứt cái hộp này đi.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 3. 上 (Danh từ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '上' AND "Reading" = 'うえ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '机の上に本があります。', 'Trên bàn có cuốn sách.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'テレビの上に時計を置きました。', 'Tôi đã đặt cái đồng hồ lên trên tivi.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 4. 下 (Danh từ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '下' AND "Reading" = 'した' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '机の下に猫がいます。', 'Dưới gầm bàn có con mèo.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '椅子の下に靴があります。', 'Dưới ghế có đôi giày.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 5. 近く (Danh từ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '近く' AND "Reading" = 'ちかく' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '銀行の近くにポストがあります。', 'Ở gần ngân hàng có hòm thư.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '学校の近くに住んでいます。', 'Tôi đang sống ở gần trường học.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

	-------------------------------------------------------
	-- BÀI 11: SỐ LƯỢNG & THỜI GIAN
	-------------------------------------------------------
	SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 11' LIMIT 1;
	
	INSERT INTO "Vocabularies" 
	("VocabID", "Word", "Reading", "Meaning", "IsCommon", "Priority", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
	VALUES
	(gen_random_uuid(), 'いくつ', 'いくつ', 'Bao nhiêu cái', true, 51, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '一人', 'ひとり', '1 người', true, 52, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '期間', 'きかん', 'Thời gian / Kỳ hạn', true, 53, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), 'ぐらい', 'ぐらい', 'Khoảng', true, 54, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '全部', 'ぜんぶ', 'Tất cả', true, 55, 1, n5_id, l_id, NOW(), NOW(), '')
	ON CONFLICT ("Word", "Reading") DO NOTHING;
	
	-------------------------------------------------------
	-- 1. いくつ (Từ nghi vấn)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'いくつ' AND "Reading" = 'いくつ' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics" ("VocabID", "TopicID") 
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") 
	    VALUES (v_id, t_tu_nghi_van) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, 'りんごをいくつ買いましたか。', 'Bạn đã mua bao nhiêu quả táo?', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, '卵がいくつありますか。', 'Có bao nhiêu quả trứng?', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 2. 一人 (Danh từ)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '一人' AND "Reading" = 'ひとり' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics" ("VocabID", "TopicID") 
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") 
	    VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, '家族は一人です。', 'Gia đình chỉ có một người.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, '一人で日本へ来ました。', 'Tôi đã đến Nhật Bản một mình.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 3. 期間 (Danh từ)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '期間' AND "Reading" = 'きかん' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics" ("VocabID", "TopicID") 
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") 
	    VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, '試験の期間は１週間です。', 'Thời gian thi là 1 tuần.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, 'この期間にたくさん勉強しました。', 'Trong khoảng thời gian này tôi đã học rất nhiều.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 4. ぐらい (Trợ từ)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'ぐらい' AND "Reading" = 'ぐらい' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics" ("VocabID", "TopicID") 
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") 
	    VALUES (v_id, t_tro_tu) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, '３週間ぐらい休みます。', 'Nghỉ khoảng 3 tuần.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, '家から大学まで３０分ぐらいです。', 'Từ nhà đến trường đại học mất khoảng 30 phút.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 5. 全部 (Danh từ / Phó từ)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '全部' AND "Reading" = 'ぜんぶ' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics" ("VocabID", "TopicID") 
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES
	    (v_id, t_danh_tu),
	    (v_id, t_phu_tu)
	    ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, 'お金を全部使いました。', 'Tôi đã dùng hết tiền.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, '宿題は全部終わりました。', 'Bài tập đã xong hết rồi.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;

    -------------------------------------------------------
	-- BÀI 12: SO SÁNH & THÌ QUÁ KHỨ
	-------------------------------------------------------
	SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 12' LIMIT 1;
	
	INSERT INTO "Vocabularies" 
	("VocabID", "Word", "Reading", "Meaning", "IsCommon", "Priority", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
	VALUES
	(gen_random_uuid(), '簡単', 'かんたん', 'Đơn giản / Dễ', true, 56, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '暑い', 'あつい', 'Nóng (thời tiết)', true, 57, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '速い', 'はやい', 'Nhanh', true, 58, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), 'より', 'より', 'Hơn (so sánh)', true, 59, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '一番', 'いちばん', 'Nhất', true, 60, 1, n5_id, l_id, NOW(), NOW(), '')
	ON CONFLICT ("Word", "Reading") DO NOTHING;
	
	-------------------------------------------------------
	-- 1. 簡単 (Tính từ na)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '簡単' AND "Reading" = 'かんたん' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics" ("VocabID", "TopicID") 
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") 
	    VALUES (v_id, t_tinh_tu_na) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, 'この問題は簡単です。', 'Bài này dễ.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, 'この仕事は簡単じゃありません。', 'Công việc này không đơn giản.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 2. 暑い (Tính từ i)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '暑い' AND "Reading" = 'あつい' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics" ("VocabID", "TopicID") 
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") 
	    VALUES (v_id, t_tinh_tu_i) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, '今日はとても暑いです。', 'Hôm nay rất nóng.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, '昨日は暑くなかったです。', 'Hôm qua không nóng.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 3. 速い (Tính từ i)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '速い' AND "Reading" = 'はやい' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics" ("VocabID", "TopicID") 
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") 
	    VALUES (v_id, t_tinh_tu_i) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, 'この電車はとても速いです。', 'Tàu này rất nhanh.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, '彼は走るのが速いです。', 'Anh ấy chạy nhanh.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 4. より (Trợ từ so sánh)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'より' AND "Reading" = 'より' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics" ("VocabID", "TopicID") 
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") 
	    VALUES (v_id, t_tro_tu) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, '日本はベトナムより寒いです。', 'Nhật Bản lạnh hơn Việt Nam.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, 'バスより電車のほうが速いです。', 'Tàu nhanh hơn xe buýt.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 5. 一番 (Phụ từ)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '一番' AND "Reading" = 'いちばん' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics" ("VocabID", "TopicID") 
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") 
	    VALUES (v_id, t_phu_tu) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, '１年でいつが一番寒いですか。', 'Trong 1 năm khi nào lạnh nhất?', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, '日本料理で寿司が一番好きです。', 'Trong các món Nhật tôi thích sushi nhất.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;

    -------------------------------------------------------
	-- BÀI 13: MONG MUỐN & DỰ ĐỊNH
	-------------------------------------------------------
	SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 13' LIMIT 1;
	
	INSERT INTO "Vocabularies" 
	("VocabID", "Word", "Reading", "Meaning", "IsCommon", "Priority", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
	VALUES
	(gen_random_uuid(), '欲しい', 'ほしい', 'Muốn (có gì đó)', true, 61, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '遊びます', 'あそびます', 'Chơi', true, 62, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '泳ぎます', 'およぎます', 'Bơi', true, 63, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '迎えます', 'むかえます', 'Đón', true, 64, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '食事', 'しょくじ', 'Bữa ăn', true, 65, 1, n5_id, l_id, NOW(), NOW(), '')
	ON CONFLICT ("Word", "Reading") DO NOTHING;
	
	-------------------------------------------------------
	-- 1. 欲しい (Tính từ i)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '欲しい' AND "Reading" = 'ほしい' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics" 
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" VALUES (v_id, t_tinh_tu_i) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, '新しい車が欲しいです。', 'Tôi muốn một chiếc xe mới.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, '水が欲しいです。', 'Tôi muốn nước.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 2. 遊びます (Động từ nhóm 1)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '遊びます' AND "Reading" = 'あそびます' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics" 
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, '友達と遊びます。', 'Tôi chơi với bạn.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, '週末に公園で遊びました。', 'Cuối tuần tôi đã chơi ở công viên.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 3. 泳ぎます (Động từ nhóm 1)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '泳ぎます' AND "Reading" = 'およぎます' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics" 
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, '海で泳ぎます。', 'Tôi bơi ở biển.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, '子供の時よく泳ぎました。', 'Hồi nhỏ tôi thường bơi.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 4. 迎えます (Động từ nhóm 2)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '迎えます' AND "Reading" = 'むかえます' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics" 
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" VALUES (v_id, t_dong_tu_2) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, '駅で友達を迎えます。', 'Tôi đón bạn ở ga.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, '空港まで迎えに行きます。', 'Tôi sẽ đi đón ở sân bay.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 5. 食事 (Danh từ / Động từ nhóm 3)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '食事' AND "Reading" = 'しょくじ' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics" 
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" VALUES 
	    (v_id, t_danh_tu),
	    (v_id, t_dong_tu_3)
	    ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, '家族と食事します。', 'Tôi ăn cơm với gia đình.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, '一緒に食事しませんか。', 'Cùng ăn cơm nhé?', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;

	-------------------------------------------------------
    -- VÍ DỤ CHO BÀI 13: MONG MUỐN & DỰ ĐỊNH
    -------------------------------------------------------

    -- 1. 欲しい (Ví dụ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '欲しい' AND "Reading" = 'ほしい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '新しい車が欲しいです。', 'Tôi muốn có một chiếc xe hơi mới.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '今、何が一番欲しいですか。', 'Bây giờ bạn muốn cái gì nhất?', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 2. 遊びます (Ví dụ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '遊びます' AND "Reading" = 'あそびます' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '週末は友達と遊びます。', 'Cuối tuần tôi đi chơi với bạn.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '公園へ遊びに行きます。', 'Tôi đi đến công viên để chơi.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 3. 泳ぎます (Ví dụ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '泳ぎます' AND "Reading" = 'およぎます' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '海で泳ぎます。', 'Bơi ở biển.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'プールへ泳ぎに行きたいです。', 'Tôi muốn đi đến hồ bơi để bơi.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 4. 迎えます (Ví dụ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '迎えます' AND "Reading" = 'むかえます' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '駅へ家族を迎えに行きます。', 'Tôi đi ra ga để đón gia đình.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '空港で友達を迎えました。', 'Tôi đã đón bạn tại sân bay.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 5. 食事 (Ví dụ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '食事' AND "Reading" = 'しょくじ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '一緒に食事をしませんか。', 'Cùng dùng bữa với tôi nhé?', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '食事のあとで、コーヒーを飲みます。', 'Sau bữa ăn, tôi uống cà phê.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

	-------------------------------------------------------
	-- BÀI 14: THỂ TE (YÊU CẦU / ĐANG LÀM)
	-------------------------------------------------------
	SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 14' LIMIT 1;
	
	INSERT INTO "Vocabularies" 
	("VocabID", "Word", "Reading", "Meaning", "IsCommon", "Priority", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
	VALUES
	(gen_random_uuid(), 'つけます', 'つけます', 'Bật (điện/máy lạnh)', true, 66, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '開けます', 'あけます', 'Mở (cửa)', true, 67, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '急ぎます', 'いそぎます', 'Vội vàng / Gấp', true, 68, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '待つ', 'まつ', 'Chờ / Đợi', true, 69, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '降る', 'ふる', 'Rơi (mưa/tuyết)', true, 70, 1, n5_id, l_id, NOW(), NOW(), '')
	ON CONFLICT ("Word", "Reading") DO NOTHING;
	
	-------------------------------------------------------
	-- 1. つけます (Động từ nhóm 2)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'つけます' AND "Reading" = 'つけます' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics"
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" VALUES (v_id, t_dong_tu_2) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, '電気をつけてください。', 'Hãy bật điện.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, 'エアコンをつけました。', 'Tôi đã bật máy lạnh.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 2. 開けます (Động từ nhóm 2)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '開けます' AND "Reading" = 'あけます' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics"
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" VALUES (v_id, t_dong_tu_2) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, 'ドアを開けてください。', 'Hãy mở cửa.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, '窓を開けました。', 'Tôi đã mở cửa sổ.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 3. 急ぎます (Động từ nhóm 1)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '急ぎます' AND "Reading" = 'いそぎます' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics"
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, 'タクシーで急ぎます。', 'Tôi đi gấp bằng taxi.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, '時間がありませんから、急いでください。', 'Không có thời gian nên hãy nhanh lên.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 4. 待つ (Động từ nhóm 1)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '待つ' AND "Reading" = 'まつ' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics"
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, 'ちょっと待ってください。', 'Xin hãy chờ một chút.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, 'ロビーで友達を待っています。', 'Tôi đang đợi bạn ở sảnh.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 5. 降る (Động từ nhóm 1)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '降る' AND "Reading" = 'ふる' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics"
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, '雨が降っています。', 'Trời đang mưa.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, '雪が降りましたね。', 'Tuyết rơi rồi nhỉ.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;

    -------------------------------------------------------
    -- BÀI 15: PHÉP TẮC & TRẠNG THÁI
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 15' LIMIT 1;

    INSERT INTO "Vocabularies" 
   ("VocabID", "Word", "Reading", "Meaning", "IsCommon", "Priority", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '置く', 'おく', 'Đặt / Để', true, 71, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '売る', 'うる', 'Bán', true, 72, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '住む', 'すむ', 'Sống / Cư trú', true, 73, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '知る', 'しる', 'Biết', true, 74, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '思い出す', 'おもいだす', 'Nhớ lại / Hồi tưởng', true, 75, 1, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -- Phân loại Bài 15 (Tất cả đều là Động từ nhóm 1)
	INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID")
    SELECT "VocabID", t_dong_tu_1 FROM "Vocabularies" 
    WHERE "Word" IN ('置く', '売る', '住む', '知る', '思い出す') 
    AND "LessonID" = l_id ON CONFLICT DO NOTHING;

	-------------------------------------------------------
    -- VÍ DỤ CHO BÀI 15: PHÉP TẮC & TRẠNG THÁI
    -------------------------------------------------------

    -- 1. 置く (Đặt / Để)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '置く' AND "Reading" = 'おく' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'ここに荷物を置かないでください。', 'Xin đừng đặt hành lý ở đây.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '辞書は机の上に置いてあります。', 'Cuốn từ điển đang được đặt ở trên bàn.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 2. 売る (Bán)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '売る' AND "Reading" = 'うる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'スーパーで古い本を売っています。', 'Siêu thị đang bán sách cũ.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'どこでチケットを売っていますか. ', 'Vé được bán ở đâu vậy?', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 3. 住む (Sống / Cư trú)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '住む' AND "Reading" = 'すむ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '私はハノイに住んでいます。', 'Tôi đang sống ở Hà Nội.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'どこに住みたいですか。', 'Bạn muốn sống ở đâu?', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 4. 知る (Biết)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '知る' AND "Reading" = 'しる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '田中さんの電話番号を知っていますか。', 'Bạn có biết số điện thoại của anh Tanaka không?', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'いいえ、知りません。', 'Không, tôi không biết.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 5. 思い出す (Nhớ lại)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '思い出す' AND "Reading" = 'おもいだす' LIMIT 1;
    IF v_id IS NOT NULL THEN
		INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '家族を思い出しました。', 'Tôi đã nhớ về gia đình.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '名前が思い出せません。', 'Tôi không thể nhớ ra tên.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -------------------------------------------------------
    -- BÀI 16: LIÊN KẾT HÀNH ĐỘNG & CƠ THỂ
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 16' LIMIT 1;

    INSERT INTO "Vocabularies" 
   ("VocabID", "Word", "Reading", "Meaning", "IsCommon", "Priority", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '降りる', 'おりる', 'Xuống (tàu, xe)', true, 76, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '浴びる', 'あびる', 'Tắm (vòi sen)', true, 77, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '若い', 'わかい', 'Trẻ trung', true, 78, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '長い', 'ながい', 'Dài', true, 79, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '明るい', 'あかるい', 'Sáng sủa', true, 80, 1, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -- 1. 降りる (Động từ nhóm 2)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '降りる' AND "Reading" = 'おりる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_2) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '電車を降ります。', 'Tôi xuống tàu điện.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '次の駅で降りてください。', 'Hãy xuống ở ga tiếp theo.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 2. 浴びる (Động từ nhóm 2)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '浴びる' AND "Reading" = 'あびる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_2) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'シャワーを浴びます。', 'Tôi tắm vòi sen.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '毎朝シャワーを浴びてから大学へ行きます。', 'Mỗi sáng sau khi tắm tôi sẽ đến trường đại học.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 3. 若い (Tính từ i)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '若い' AND "Reading" = 'わかい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_tinh_tu_i) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '母は若いです。', 'Mẹ tôi trẻ.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '若い時、日本へ来ました。', 'Lúc còn trẻ, tôi đã đến Nhật Bản.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 4. 長い (Tính từ i)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '長い' AND "Reading" = 'ながい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_tinh_tu_i) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '夏は日が長いです。', 'Mùa hè ngày dài.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '髪が長いですね。', 'Tóc dài nhỉ.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 5. 明るい (Tính từ i)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '明るい' AND "Reading" = 'あかるい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_tinh_tu_i) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'この部屋は明るいです。', 'Căn phòng này sáng sủa.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '明るい色のシャツを着ます。', 'Tôi mặc áo sơ mi màu sáng.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

	-------------------------------------------------------
	-- BÀI 17: SỨC KHỎE & PHỦ ĐỊNH
	-------------------------------------------------------
	SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 17' LIMIT 1;
	
	INSERT INTO "Vocabularies" 
	("VocabID", "Word", "Reading", "Meaning", "IsCommon", "Priority", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
	VALUES
	(gen_random_uuid(), '忘れる', 'わすれる', 'Quên', true, 81, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '払う', 'はらう', 'Trả tiền', true, 82, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '脱ぐ', 'ぬぐ', 'Cởi (quần áo, giày)', true, 83, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '心配', 'しんぱい', 'Lo lắng', true, 84, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '大切', 'たいせつ', 'Quan trọng / Quý giá', true, 85, 1, n5_id, l_id, NOW(), NOW(), '')
	ON CONFLICT ("Word", "Reading") DO NOTHING;
	
	-------------------------------------------------------
	-- 1. 忘れる (Động từ nhóm 2)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '忘れる' AND "Reading" = 'わすれる' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics" 
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" VALUES (v_id, t_dong_tu_2) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, '宿題を忘れないでください。', 'Xin đừng quên bài tập.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, '傘を忘れました。', 'Tôi đã quên ô.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 2. 払う (Động từ nhóm 1)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '払う' AND "Reading" = 'はらう' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics" 
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, 'レジでお金を払います。', 'Trả tiền ở quầy thu ngân.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, 'カードで払えますか。', 'Có thể trả bằng thẻ không?', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 3. 脱ぐ (Động từ nhóm 1)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '脱ぐ' AND "Reading" = 'ぬぐ' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics" 
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, '靴を脱ぎます。', 'Tôi cởi giày.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, 'コートを脱いでください。', 'Hãy cởi áo khoác.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 4. 心配 (Danh từ / Động từ nhóm 3)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '心配' AND "Reading" = 'しんぱい' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics" 
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" VALUES 
	    (v_id, t_danh_tu),
	    (v_id, t_dong_tu_3)
	    ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, '心配しないでください。', 'Đừng lo lắng.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, '母は私を心配しています。', 'Mẹ đang lo lắng cho tôi.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 5. 大切 (Tính từ na)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '大切' AND "Reading" = 'たいせつ' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics" 
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" VALUES (v_id, t_tinh_tu_na) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, '家族はとても大切です。', 'Gia đình rất quan trọng.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, 'これは大切な本です。', 'Đây là cuốn sách quan trọng.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;

    -------------------------------------------------------
	-- BÀI 18: KHẢ NĂNG & SỞ THÍCH
	-------------------------------------------------------
	SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 18' LIMIT 1;
	
	INSERT INTO "Vocabularies" 
	("VocabID", "Word", "Reading", "Meaning", "IsCommon", "Priority", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
	VALUES
	(gen_random_uuid(), 'できる', 'できる', 'Có thể', true, 86, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '洗う', 'あらう', 'Rửa', true, 87, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '弾く', 'ひく', 'Chơi (nhạc cụ dây)', true, 88, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '歌う', 'うたう', 'Hát', true, 89, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '集める', 'あつめる', 'Sưu tầm / Thu thập', true, 90, 1, n5_id, l_id, NOW(), NOW(), '')
	ON CONFLICT ("Word", "Reading") DO NOTHING;
	
	-------------------------------------------------------
	-- 1. できる (Động từ nhóm 2)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'できる' AND "Reading" = 'できる' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics" ("VocabID", "TopicID") 
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" VALUES (v_id, t_dong_tu_2) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, '私は日本語ができます。', 'Tôi có thể nói tiếng Nhật.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, 'ピアノを弾くことができます。', 'Tôi có thể chơi piano.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 2. 洗う (Động từ nhóm 1)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '洗う' AND "Reading" = 'あらう' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics" ("VocabID", "TopicID") 
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, '毎日手を洗います。', 'Tôi rửa tay mỗi ngày.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, 'シャツを洗いました。', 'Tôi đã giặt áo sơ mi.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 3. 弾く (Động từ nhóm 1)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '弾く' AND "Reading" = 'ひく' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics" ("VocabID", "TopicID") 
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, 'ギターを弾きます。', 'Tôi chơi guitar.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, '彼はピアノを弾くことができます。', 'Anh ấy có thể chơi piano.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 4. 歌う (Động từ nhóm 1)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '歌う' AND "Reading" = 'うたう' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics" ("VocabID", "TopicID") 
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, '歌を歌います。', 'Tôi hát bài hát.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, '彼女は上手に歌います。', 'Cô ấy hát rất hay.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 5. 集める (Động từ nhóm 2)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '集める' AND "Reading" = 'あつめる' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics" ("VocabID", "TopicID") 
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" VALUES (v_id, t_dong_tu_2) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, '切手を集めています。', 'Tôi đang sưu tầm tem.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, '資料を集めてください。', 'Hãy thu thập tài liệu.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;

	-------------------------------------------------------
    -- BÀI 19: KINH NGHIỆM & TRẠNG THÁI
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 19' LIMIT 1;

    -- 1. Chèn từ vựng
    INSERT INTO "Vocabularies" 
   ("VocabID", "Word", "Reading", "Meaning", "IsCommon", "Priority", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '登る', 'のぼる', 'Leo (núi)', true, 91, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '泊まる', 'とまる', 'Trọ lại', true, 92, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '掃除', 'そうじ', 'Dọn dẹp vệ sinh', true, 93, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '洗濯', 'せんたく', 'Giặt giũ', true, 94, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '練習', 'れんしゅう', 'Luyện tập', true, 95, 1, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -- 2. Phân loại WordTypes (Dùng SELECT để tránh dùng vòng lặp FOR)
    
    -- Gán Nhóm 1 cho: 登る, 泊まる
	INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID")
    SELECT "VocabID", t_dong_tu_1 FROM "Vocabularies" 
    WHERE "Word" IN ('登る', '泊まる') AND "LessonID" = l_id ON CONFLICT DO NOTHING;

    -- Gán Danh từ cho: 掃除, 洗濯, 練習
	INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID")
    SELECT "VocabID", t_danh_tu FROM "Vocabularies" 
    WHERE "Word" IN ('掃除', '洗濯', '練習') AND "LessonID" = l_id ON CONFLICT DO NOTHING;

    -- Gán Nhóm 3 cho: 掃除, 洗濯, 練習
	INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID")
    SELECT "VocabID", t_dong_tu_3 FROM "Vocabularies" 
    WHERE "Word" IN ('掃除', '洗濯', '練習') AND "LessonID" = l_id ON CONFLICT DO NOTHING;

    -- 3. Chèn Ví dụ

    -- 登る (Leo núi)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '登る' AND "Reading" = 'のぼる' AND "LessonID" = l_id LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '富士山に登ったことがありますか。', 'Bạn đã từng leo núi Phú Sĩ chưa?', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '一度高い山に登りたいです。', 'Tôi muốn leo núi cao một lần.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 泊まる (Trọ lại)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '泊まる' AND "Reading" = 'とまる' AND "LessonID" = l_id LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '日本旅館に泊まりたいです。', 'Tôi muốn trọ lại ở nhà trọ kiểu Nhật.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'ホテルに泊まったことがあります。', 'Tôi đã từng ở lại khách sạn.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 掃除 (Dọn dẹp)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '掃除' AND "Reading" = 'そうじ' AND "LessonID" = l_id LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '日曜日に部屋を掃除します。', 'Tôi dọn dẹp phòng vào chủ nhật.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '掃除したり、洗濯したりします。', 'Tôi nào là dọn dẹp, nào là giặt giũ.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 洗濯 (Giặt giũ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '洗濯' AND "Reading" = 'せんたく' AND "LessonID" = l_id LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '昨日の晩、洗濯をしました。', 'Tối qua tôi đã giặt giũ.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '天気がいいですから、洗濯します。', 'Vì thời tiết đẹp nên tôi đi giặt đồ.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 練習 (Luyện tập)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '練習' AND "Reading" = 'れんしゅう' AND "LessonID" = l_id LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '毎日、日本語を練習します。', 'Hàng ngày tôi luyện tập tiếng Nhật.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'ピアノの練習は大変です。', 'Việc luyện tập piano thật là vất vả.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

	-------------------------------------------------------
	-- BÀI 20: GIAO TIẾP THÂN MẬT
	-------------------------------------------------------
	SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 20' LIMIT 1;
	
	INSERT INTO "Vocabularies" 
	("VocabID", "Word", "Reading", "Meaning", "IsCommon", "Priority", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
	VALUES
	(gen_random_uuid(), '要る', 'いる', 'Cần', true, 96, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '調べる', 'しらべる', 'Tìm hiểu / Tra cứu', true, 97, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '直す', 'なおす', 'Sửa chữa', true, 98, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '僕', 'ぼく', 'Tôi (nam, thân mật)', true, 99, 1, n5_id, l_id, NOW(), NOW(), ''),
	(gen_random_uuid(), '君', 'くん', 'Cậu / -kun (hậu tố)', true, 100, 1, n5_id, l_id, NOW(), NOW(), '')
	ON CONFLICT ("Word", "Reading") DO NOTHING;
	
	-------------------------------------------------------
	-- 1. 要る (Động từ nhóm 1 - đặc biệt)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '要る' AND "Reading" = 'いる' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics"
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, 'ビザが要る？', 'Có cần visa không?', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, 'ううん、要らない。', 'Không, không cần.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 2. 調べる (Động từ nhóm 2)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '調べる' AND "Reading" = 'しらべる' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics"
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" VALUES (v_id, t_dong_tu_2) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, 'インターネットで調べます。', 'Tôi tra cứu trên internet.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, '意味を調べてください。', 'Hãy tra nghĩa.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 3. 直す (Động từ nhóm 1)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '直す' AND "Reading" = 'なおす' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics"
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, '時計を直します。', 'Tôi sửa đồng hồ.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, 'この文を直してください。', 'Hãy sửa câu này.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 4. 僕 (Đại từ)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '僕' AND "Reading" = 'ぼく' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics"
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" VALUES (v_id, t_dai_tu) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, '僕は学生です。', 'Tớ là sinh viên.', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, '僕の家に来ない？', 'Đến nhà tớ chơi không?', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;
	
	-------------------------------------------------------
	-- 5. 君 (Đại từ / Hậu tố)
	-------------------------------------------------------
	SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '君' AND "Reading" = 'くん' LIMIT 1;
	IF v_id IS NOT NULL THEN
	    INSERT INTO "VocabTopics"
	    SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "VocabWordTypes" VALUES (v_id, t_dai_tu) ON CONFLICT DO NOTHING;
	
	    INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
	    (gen_random_uuid(), v_id, '君は学生？', 'Cậu là sinh viên à?', '', NOW(), NOW()),
	    (gen_random_uuid(), v_id, '佐藤君は優しいね。', 'Sato-kun hiền nhỉ.', '', NOW(), NOW())
	    ON CONFLICT DO NOTHING;
	END IF;

	-------------------------------------------------------
    -- BÀI 21: TƯỜNG THUẬT & DỰ ĐOÁN (Đầy đủ)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 21' LIMIT 1;

    -- 1. Thêm từ vựng Bài 21
    INSERT INTO "Vocabularies" 
   ("VocabID", "Word", "Reading", "Meaning", "IsCommon", "Priority", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '思う', 'おもう', 'Nghĩ là', true, 101, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '言う', 'いう', 'Nói', true, 102, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '勝つ', 'かつ', 'Thắng', true, 103, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '負ける', 'まける', 'Thua', true, 104, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '役に立つ', 'やくにたつ', 'Có ích', true, 105, 1, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -- 2. Phân loại & Ví dụ Bài 21
    -- 思う (Nhóm 1)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '思う' AND "Reading" = 'おもう' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '明日、雨が降ると思います。', 'Tôi nghĩ là ngày mai trời sẽ mưa.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '日本は物価が高いと思います。', 'Tôi nghĩ là giá cả ở Nhật đắt đỏ.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 言う (Nhóm 1)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '言う' AND "Reading" = 'いう' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '寝る前に「おやすみなさい」と言います。', 'Trước khi đi ngủ, chúng ta nói "Chúc ngủ ngon".', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '田中さんは「明日休みます」と言いました。', 'Anh Tanaka đã nói là "Ngày mai tôi nghỉ".', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 勝つ (Nhóm 1)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '勝つ' AND "Reading" = 'かつ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '日本チームはブラジルに勝ちました。', 'Đội Nhật Bản đã thắng đội Brazil.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '試合に勝って、うれしいです。', 'Tôi rất vui vì đã thắng trận đấu.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 負ける (Nhóm 2)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '負ける' AND "Reading" = 'まける' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_2) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '昨日の試合は負けました。', 'Trận đấu hôm qua đã thua rồi.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '絶対に負けたくないです。', 'Tôi tuyệt đối không muốn thua.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 役に立つ (Nhóm 1)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '役に立つ' AND "Reading" = 'やくにたつ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'この辞書はとても役に立ちます。', 'Cuốn từ điển này rất có ích.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'インターネットは勉強の役に立ちます。', 'Internet có ích cho việc học tập.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -------------------------------------------------------
    -- BÀI 22: MỆNH ĐỀ ĐỊNH NGỮ (Đầy đủ)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 22' LIMIT 1;

    -- 1. Thêm từ vựng Bài 22
    INSERT INTO "Vocabularies" 
   ("VocabID", "Word", "Reading", "Meaning", "IsCommon", "Priority", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '着る', 'きる', 'Mặc (từ thắt lưng trở lên)', true, 106, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '履く', 'はく', 'Mặc (từ thắt lưng trở xuống)', true, 107, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '帽子', 'ぼうし', 'Mũ / Nón', true, 108, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '眼鏡', 'めがね', 'Kính mắt', true, 109, 1, n5_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '約束', 'やくそく', 'Hẹn / Lời hứa', true, 110, 1, n5_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -- 2. Phân loại & Ví dụ Bài 22
    -- 着る (Nhóm 2 - Đặc biệt)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '着る' AND "Reading" = 'きる' AND "LessonID" = l_id LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_2) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '赤いシャツを着ている人は田中さんです。', 'Người đang mặc cái áo sơ mi màu đỏ là anh Tanaka.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '寒い時、コートを着ます。', 'Khi trời lạnh, tôi mặc áo khoác.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 履く (Nhóm 1)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '履く' AND "Reading" = 'はく' AND "LessonID" = l_id LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '新しい靴を履いて出かけます。', 'Tôi đi đôi giày mới rồi đi ra ngoài.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '黒いズボンを履いている人はだれですか。', 'Người đang mặc cái quần màu đen là ai thế?', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 帽子 (Danh từ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '帽子' AND "Reading" = 'ぼうし' AND "LessonID" = l_id LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '可愛い帽子をかぶっていますね。', 'Bạn đang đội cái mũ đáng yêu nhỉ.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'あそこに帽子を忘れないでください。', 'Đừng quên cái mũ ở đằng kia nhé.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 眼鏡 (Danh từ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '眼鏡' AND "Reading" = 'めがね' AND "LessonID" = l_id LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '眼鏡をかけて本を読みます。', 'Tôi đeo kính để đọc sách.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'あの眼鏡をかけている人は先生です。', 'Người đang đeo kính đằng kia là thầy giáo.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 約束 (Danh từ / Nhóm 3)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '約束' AND "Reading" = 'やくそく' AND "LessonID" = l_id LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_3) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '友達と会う約束があります。', 'Tôi có hẹn gặp bạn.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '約束の時間を忘れないでください。', 'Xin đừng quên thời gian cuộc hẹn.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -------------------------------------------------------
    -- BÀI 23: THỜI ĐIỂM & CHỈ ĐƯỜNG
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 23' LIMIT 1;

    -- Phân loại WordTypes
	INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID")
    SELECT "VocabID", t_dong_tu_1 FROM "Vocabularies" 
    WHERE "Word" IN ('渡る', '曲がる') AND "LessonID" = l_id ON CONFLICT DO NOTHING;

	INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID")
    SELECT "VocabID", t_tinh_tu_i FROM "Vocabularies" 
    WHERE "Word" = '寂しい' AND "LessonID" = l_id ON CONFLICT DO NOTHING;

	INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID")
    SELECT "VocabID", t_danh_tu FROM "Vocabularies" 
    WHERE "Word" IN ('お湯', '交差点') AND "LessonID" = l_id ON CONFLICT DO NOTHING;

    -- Ví dụ Bài 23
    -- 1. 渡る (Băng qua)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '渡る' AND "Reading" = 'わたる' AND "LessonID" = l_id LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '橋を渡る時、気をつけてください。', 'Khi đi qua cầu hãy cẩn thận nhé.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '道を渡る時、車に注意してください。', 'Khi băng qua đường hãy chú ý xe ô tô.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 2. 曲がる (Rẽ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '曲がる' AND "Reading" = 'まがる' AND "LessonID" = l_id LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '信号を右へ曲がってください。', 'Hãy rẽ phải ở chỗ đèn tín hiệu.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '角を左に曲がると、銀行があります。', 'Hễ rẽ trái ở góc đường thì sẽ thấy ngân hàng.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 3. 寂しい (Buồn)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '寂しい' AND "Reading" = 'さびしい' AND "LessonID" = l_id LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '家族に会えなくて寂しいです。', 'Không được gặp gia đình nên tôi thấy buồn.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '寂しい時、いつも音楽を聞きます。', 'Khi buồn tôi luôn nghe nhạc.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 4. お湯 (Nước nóng)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'お湯' AND "Reading" = 'おゆ' AND "LessonID" = l_id LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'お湯が出ません。故障でしょうか。', 'Nước nóng không chảy ra. Liệu có phải bị hỏng không?', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'お湯を沸かしてください。', 'Hãy đun sôi nước giúp tôi.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 5. 交差点 (Ngã tư)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '交差点' AND "Reading" = 'こうさてん' AND "LessonID" = l_id LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '交差点をまっすぐ行きます。', 'Đi thẳng qua ngã tư.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'あの交差点で止まってください。', 'Hãy dừng lại ở ngã tư kia.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -------------------------------------------------------
    -- BÀI 24: CHO NHẬN TRỢ GIÚP
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 24' LIMIT 1;

    -- Phân loại WordTypes (Thay thế DO block bằng SELECT)
	INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID")
    SELECT "VocabID", t_dong_tu_2 FROM "Vocabularies" WHERE "Word" = 'くれる' AND "LessonID" = l_id ON CONFLICT DO NOTHING;

	INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID")
    SELECT "VocabID", t_dong_tu_1 FROM "Vocabularies" WHERE "Word" IN ('連れて行く', '送る') AND "LessonID" = l_id ON CONFLICT DO NOTHING;

	INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID")
    SELECT "VocabID", t_danh_tu FROM "Vocabularies" WHERE "Word" IN ('紹介', '準備') AND "LessonID" = l_id ON CONFLICT DO NOTHING;

	INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID")
    SELECT "VocabID", t_dong_tu_3 FROM "Vocabularies" WHERE "Word" IN ('紹介', '準備') AND "LessonID" = l_id ON CONFLICT DO NOTHING;

    -- Ví dụ Bài 24
    -- 1. くれる
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'くれる' AND "LessonID" = l_id LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '佐藤さんがお菓子をくれました。', 'Chị Sato đã cho tôi kẹo.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '友達が日本語を教えてくれました。', 'Bạn tôi đã dạy tiếng Nhật cho tôi.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 2. 連れて行く
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '連れて行く' AND "LessonID" = l_id LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '子供を公園へ連れて行きます。', 'Tôi dẫn con đi công viên.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'いい病院へ連れて行ってください。', 'Hãy dẫn tôi đến một bệnh viện tốt.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 3. 送る
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '送る' AND "LessonID" = l_id LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '駅まで友達を送ります。', 'Tôi tiễn bạn ra tận ga.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '車で家まで送ってくれました。', 'Anh ấy đã đưa tôi về tận nhà bằng xe hơi.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 4. 紹介
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '紹介' AND "LessonID" = l_id LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '自己紹介をしてください。', 'Hãy tự giới thiệu bản thân.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'いい人を紹介してくれませんか。', 'Bạn giới thiệu cho tôi một người tốt được không?', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 5. 準備
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '準備' AND "LessonID" = l_id LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '旅行の準備をします。', 'Chuẩn bị cho chuyến du lịch.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '準備ができました。', 'Tôi đã chuẩn bị xong rồi.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -------------------------------------------------------
    -- BÀI 25: CÂU ĐIỀU KIỆN
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 25' LIMIT 1;

    -- 1. 考える (Động từ nhóm 2)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '考える' AND "Reading" = 'かんがえる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_2) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'よく考えてから返事します。', 'Tôi sẽ suy nghĩ kỹ rồi mới trả lời.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '将来のことを考えています. ', 'Tôi đang suy nghĩ về tương lai.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 2. 着く (Động từ nhóm 1)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '着く' AND "Reading" = 'つく' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '駅に着いたら、電話してください。', 'Khi nào đến ga hãy gọi điện cho tôi nhé.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'あしたの８時に東京に着きます。', '8 giờ ngày mai tôi sẽ đến Tokyo.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 3. 留学 (Danh từ / Động từ nhóm 3)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '留学' AND "Reading" = 'りゅうがく' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_3) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '日本へ留学したいです。', 'Tôi muốn đi du học Nhật Bản.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '大学を卒業してから、留学します。', 'Sau khi tốt nghiệp đại học tôi sẽ đi du học.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 4. 頑張る (Động từ nhóm 1)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '頑張る' AND "Reading" = 'がんばる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_dong_tu_1) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '明日から頑張ります。', 'Từ ngày mai tôi sẽ cố gắng.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '日本語の勉強を頑張ってください。', 'Hãy cố gắng học tiếng Nhật nhé.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

    -- 5. 田舎 (Danh từ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '田舎' AND "Reading" = 'いなか' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "VocabTopics" ("VocabID", "TopicID") SELECT v_id, t_id WHERE EXISTS (SELECT 1 FROM "Vocabularies" WHERE "VocabID" = v_id) ON CONFLICT DO NOTHING;
		INSERT INTO "VocabWordTypes" ("VocabID", "WordTypeID") VALUES (v_id, t_danh_tu) ON CONFLICT DO NOTHING;
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '田舎へ帰ったら、農業をします。', 'Hễ về quê tôi sẽ làm nông nghiệp.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '私の田舎はとても静かです。', 'Quê tôi rất yên tĩnh.', '', NOW(), NOW()) ON CONFLICT DO NOTHING;
    END IF;

	RAISE NOTICE 'Hoàn tất nạp dữ liệu Từ vựng N5 (Bài 1 - 25)';

END $$;

-------------------------------------------------------
-- 7. BÀI ĐỌC N5: TỪ BÀI 1 - 25
-------------------------------------------------------
DO $$
DECLARE 
    -- Khai báo ID các bảng liên quan (thay ID đúng của bạn nếu cần)
    n5_id uuid := '550e8400-e29b-41d4-a716-446655440000'; 
    t_id uuid; 
    l_id uuid;
    r_id uuid;
	q_id uuid;
BEGIN
    -- 1. Lấy Topic ID (Ví dụ: Chủ đề Gia đình)
    SELECT "TopicID" INTO t_id FROM "Topics" WHERE "TopicName" = 'Bài đọc N5' LIMIT 1;
	
	CREATE TEMP TABLE temp_new_q_ids (id_vua_tao uuid) ON COMMIT DROP;
    -------------------------------------------------------
    -- BÀI ĐỌC 1: GIỚI THIỆU GIA ĐÌNH
    -------------------------------------------------------
	SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 1' LIMIT 1;
    r_id := gen_random_uuid();
    INSERT INTO "Readings" ("ReadingID", "Title", "Content", "Translation", "WordCount", "EstimatedTime", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (r_id, 'わたしの家族 (Gia đình của tôi)', 
    'わたしの家族は４人です。父と母と兄がいます。父は会社員です。母は日本語の先生です。', 
    'Gia đình tôi có 4 người. Có bố, mẹ và anh trai. Bố tôi là nhân viên công ty. Mẹ tôi là giáo viên tiếng Nhật.', 
    45, 5, 1, n5_id, l_id, NOW(), NOW())
    ON CONFLICT ("Title") DO NOTHING;

	INSERT INTO "ReadingTopics" ("ReadingID", "TopicID") 
    SELECT r_id, t_id WHERE EXISTS (SELECT 1 FROM "Readings" WHERE "ReadingID" = r_id) ON CONFLICT DO NOTHING;

    -- Câu hỏi 1 cho bài 1
    q_id := gen_random_uuid();
    INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "QuestionFormat", "SkillType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '家族は何人ですか？ (Gia đình có mấy người?)', 0, 0, 4, 1, 1, l_id, r_id, NULL, NOW(), NOW());

	INSERT INTO temp_new_q_ids (id_vua_tao) VALUES (q_id);
    
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, '３人です', false),
    (gen_random_uuid(), q_id, '４人です', true),
    (gen_random_uuid(), q_id, '５人です', false),
	(gen_random_uuid(), q_id, '２人です', false);


    -- Câu hỏi 2 cho bài 1
    q_id := gen_random_uuid();
	INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "QuestionFormat", "SkillType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, 'お母さんの仕事は何ですか？ (Công việc của mẹ là gì?)', 0, 0, 4, 1, 1, l_id, r_id, NULL, NOW(), NOW());

	INSERT INTO temp_new_q_ids (id_vua_tao) VALUES (q_id);
	
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, '会社員です', false),
    (gen_random_uuid(), q_id, '医者です', false),
	(gen_random_uuid(), q_id, '銀行員です', false),
    (gen_random_uuid(), q_id, '先生です', true);

    -------------------------------------------------------
    -- BÀI ĐỌC 2: MỘT NGÀY CỦA TÔI
    -------------------------------------------------------
	SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 2' LIMIT 1;
    r_id := gen_random_uuid();
    INSERT INTO "Readings" ("ReadingID", "Title", "Content", "Translation", "WordCount", "EstimatedTime", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (r_id, '私の hằng ngày (Một ngày của tôi)', 
    '私は毎日６時に起きます。朝ご飯を食べて、学校へ行きます。夜は１１時に寝ます。', 
    'Mỗi ngày tôi thức dậy lúc 6 giờ. Tôi ăn sáng rồi đi đến trường. Buổi tối tôi đi ngủ lúc 11 giờ.', 
    35, 3, 1, n5_id, l_id, NOW(), NOW())
    ON CONFLICT ("Title") DO NOTHING;

	INSERT INTO "ReadingTopics" ("ReadingID", "TopicID") 
    SELECT r_id, t_id WHERE EXISTS (SELECT 1 FROM "Readings" WHERE "ReadingID" = r_id) ON CONFLICT DO NOTHING;

    -- Câu hỏi 1 cho bài 2
    q_id := gen_random_uuid();
	INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "QuestionFormat", "SkillType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '何時に起きますか？ (Thức dậy lúc mấy giờ?)', 0, 0, 4, 1, 1, l_id, r_id, NULL, NOW(), NOW());

	INSERT INTO temp_new_q_ids (id_vua_tao) VALUES (q_id);
	
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, '６時です', true),
    (gen_random_uuid(), q_id, '７時です', false),
	(gen_random_uuid(), q_id, '８時です', false),
	(gen_random_uuid(), q_id, '９時です', false);

    -- Câu hỏi 2 cho bài 2
    q_id := gen_random_uuid();
	INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "QuestionFormat", "SkillType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '学校へ行きますか？ (Có đi đến trường không?)', 0, 0, 4, 1, 1, l_id, r_id, NULL, NOW(), NOW());


	INSERT INTO temp_new_q_ids (id_vua_tao) VALUES (q_id);
	
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, 'はい、行きます', true),
    (gen_random_uuid(), q_id, 'いいえ、行きません', false),
	(gen_random_uuid(), q_id, 'デパートへ行きます', false),
	(gen_random_uuid(), q_id, 'どこも行きません', false);

    -------------------------------------------------------
    -- BÀI ĐỌC 3: TRONG PHÒNG HỌC
    -------------------------------------------------------
	SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 3' LIMIT 1;
    r_id := gen_random_uuid();
    INSERT INTO "Readings" ("ReadingID", "Title", "Content", "Translation", "WordCount", "EstimatedTime", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (r_id, '教室 (Lớp học)', 
    '教室に机といすがあります。あそこに時計があります。学生は５人います。', 
    'Trong lớp học có bàn và ghế. Ở kia có cái đồng hồ. Có 5 học sinh.', 
    30, 3, 1, n5_id, l_id, NOW(), NOW())
    ON CONFLICT ("Title") DO NOTHING;

	INSERT INTO "ReadingTopics" ("ReadingID", "TopicID") 
    SELECT r_id, t_id WHERE EXISTS (SELECT 1 FROM "Readings" WHERE "ReadingID" = r_id) ON CONFLICT DO NOTHING;

    -- Câu hỏi 1 cho bài 3
    q_id := gen_random_uuid();
	INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "QuestionFormat", "SkillType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '時計はどこにありますか？ (Cái đồng hồ ở đâu?)', 0, 0, 4, 1, 1, l_id, r_id, NULL, NOW(), NOW());


	INSERT INTO temp_new_q_ids (id_vua_tao) VALUES (q_id);
	
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, 'あそこにあります', true),
    (gen_random_uuid(), q_id, '教室の外にあります', false),
	(gen_random_uuid(), q_id, 'かばんの中にあります', false),
	(gen_random_uuid(), q_id, '机の下にあります', false);

    -- Câu hỏi 2 cho bài 3
    q_id := gen_random_uuid();
	INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "QuestionFormat", "SkillType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '学生は何人いますか？ (Có bao nhiêu học sinh?)', 0, 0, 4, 1, 1, l_id, r_id, NULL, NOW(), NOW());


	INSERT INTO temp_new_q_ids (id_vua_tao) VALUES (q_id);
	
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, '５人です', true),
    (gen_random_uuid(), q_id, '４人です', false),
	(gen_random_uuid(), q_id, '１０人です', false),
	(gen_random_uuid(), q_id, '２人です', false);

	-------------------------------------------------------
    -- BÀI ĐỌC 4: SỞ THÍCH
    -------------------------------------------------------
	SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 4' LIMIT 1;
    r_id := gen_random_uuid();
    INSERT INTO "Readings" ("ReadingID", "Title", "Content", "Translation", "WordCount", "EstimatedTime", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (r_id, '私の趣味 (Sở thích của tôi)', 
    '私の趣味は読書です。休みの日に図書館へ行きます。日本の本が大好きです。', 
    'Sở thích của tôi là đọc sách. Vào ngày nghỉ tôi đến thư viện. Tôi rất thích sách Nhật Bản.', 
    32, 4, 1, n5_id, l_id, NOW(), NOW())
    ON CONFLICT ("Title") DO NOTHING;

	INSERT INTO "ReadingTopics" ("ReadingID", "TopicID") 
    SELECT r_id, t_id WHERE EXISTS (SELECT 1 FROM "Readings" WHERE "ReadingID" = r_id) ON CONFLICT DO NOTHING;

    -- Câu hỏi 1 cho bài 4
    q_id := gen_random_uuid();
	INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "QuestionFormat", "SkillType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '趣味は何ですか？ (Sở thích là gì?)', 0, 0, 4, 1, 1, l_id, r_id, NULL, NOW(), NOW());


	INSERT INTO temp_new_q_ids (id_vua_tao) VALUES (q_id);
	
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, '読書です', true),
    (gen_random_uuid(), q_id, 'スポーツです', false),
	(gen_random_uuid(), q_id, '料理です', false),
	(gen_random_uuid(), q_id, '映画です', false);

    -- Câu hỏi 2 cho bài 4
	q_id := gen_random_uuid();
	INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "QuestionFormat", "SkillType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '休みの日にどこへ行きますか？ (Ngày nghỉ đi đâu?)', 0, 0, 4, 1, 1, l_id, r_id, NULL, NOW(), NOW());


	INSERT INTO temp_new_q_ids (id_vua_tao) VALUES (q_id);
	
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, '図書館です', true),
    (gen_random_uuid(), q_id, '会社です', false),
	(gen_random_uuid(), q_id, '海へ行きます', false),
	(gen_random_uuid(), q_id, '病院へ行きます', false);

    -------------------------------------------------------
    -- BÀI ĐỌC 5: ĐỒ ĂN NHẬT BẢN
    -------------------------------------------------------
	SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 5' LIMIT 1;
    r_id := gen_random_uuid();
    INSERT INTO "Readings" ("ReadingID", "Title", "Content", "Translation", "WordCount", "EstimatedTime", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (r_id, '日本料理 (Món ăn Nhật)', 
    '私はすしが大好きです。昨日、友達とレストランで食べました。とてもおいしかったです。', 
    'Tôi rất thích Sushi. Hôm qua tôi đã ăn cùng bạn ở nhà hàng. Nó đã rất ngon.', 
    38, 4, 1, n5_id, l_id, NOW(), NOW())
    ON CONFLICT ("Title") DO NOTHING;

	INSERT INTO "ReadingTopics" ("ReadingID", "TopicID") 
    SELECT r_id, t_id WHERE EXISTS (SELECT 1 FROM "Readings" WHERE "ReadingID" = r_id) ON CONFLICT DO NOTHING;

    -- Câu hỏi 1 cho bài 5
    q_id := gen_random_uuid();
	INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "QuestionFormat", "SkillType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '何が大好きですか？ (Thích cái gì nhất?)', 0, 0, 4, 1, 1, l_id, r_id, NULL, NOW(), NOW());


	INSERT INTO temp_new_q_ids (id_vua_tao) VALUES (q_id);
	
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, 'すしです', true),
    (gen_random_uuid(), q_id, 'ラーメンです', false),
	(gen_random_uuid(), q_id, 'お酒です', false),
	(gen_random_uuid(), q_id, 'パンです', false);

    -- Câu hỏi 2 cho bài 5
    q_id := gen_random_uuid();
	INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "QuestionFormat", "SkillType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, 'だれと食べましたか？ (Đã ăn cùng với ai?)', 0, 0, 4, 1, 1, l_id, r_id, NULL, NOW(), NOW());

	INSERT INTO temp_new_q_ids (id_vua_tao) VALUES (q_id);
	
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, '友達とです', true),
    (gen_random_uuid(), q_id, '家族とです', false),
	(gen_random_uuid(), q_id, '先生とです', false),
	(gen_random_uuid(), q_id, '一人で食べました', false);
	
	-------------------------------------------------------
    -- BÀI ĐỌC 6: THỜI TIẾT HÔM NAY
    -------------------------------------------------------
	SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 6' LIMIT 1;
    r_id := gen_random_uuid();
    INSERT INTO "Readings" ("ReadingID", "Title", "Content", "Translation", "WordCount", "EstimatedTime", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (r_id, '今日の天気 (Thời tiết hôm nay)', 
    '今日はいい天気です。とても暑いです。公園で散歩をします。明日は雨です。', 
    'Hôm nay thời tiết đẹp. Trời rất nóng. Tôi đi dạo ở công viên. Ngày mai trời sẽ mưa.', 
    35, 4, 1, n5_id, l_id, NOW(), NOW())
    ON CONFLICT ("Title") DO NOTHING;

	INSERT INTO "ReadingTopics" ("ReadingID", "TopicID") 
    SELECT r_id, t_id WHERE EXISTS (SELECT 1 FROM "Readings" WHERE "ReadingID" = r_id) ON CONFLICT DO NOTHING;

    -- Câu hỏi 1 bài 6
    q_id := gen_random_uuid();
	INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "QuestionFormat", "SkillType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '今日の天気はどうですか？ (Thời tiết hôm nay thế nào?)', 0, 0, 4, 1, 1, l_id, r_id, NULL, NOW(), NOW());

	INSERT INTO temp_new_q_ids (id_vua_tao) VALUES (q_id);
	
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, 'いい天気です', true),
    (gen_random_uuid(), q_id, '寒いです', false),
    (gen_random_uuid(), q_id, '雪です', false),
    (gen_random_uuid(), q_id, 'あまりよくないです', false);

    -- Câu hỏi 2 bài 6
    q_id := gen_random_uuid();
        INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "QuestionFormat", "SkillType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '明日の天気は何ですか？ (Thời tiết ngày mai là gì?)', 0, 0, 4, 1, 1, l_id, r_id, NULL, NOW(), NOW());

	INSERT INTO temp_new_q_ids (id_vua_tao) VALUES (q_id);
	
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, '雨です', true),
    (gen_random_uuid(), q_id, '晴れです', false),
    (gen_random_uuid(), q_id, '曇りです', false),
    (gen_random_uuid(), q_id, '風です', false);

    -------------------------------------------------------
    -- BÀI ĐỌC 7: MUA SẮM TẠI SIÊU THỊ
    -------------------------------------------------------
	SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 7' LIMIT 1;
    r_id := gen_random_uuid();
    INSERT INTO "Readings" ("ReadingID", "Title", "Content", "Translation", "WordCount", "EstimatedTime", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (r_id, 'スーパーで買い物 (Mua sắm ở siêu thị)', 
    'このスーパーはとても大きいです。りんごとみかんを買いました。全部で５００円でした。',
	'Siêu thị này rất lớn. Tôi đã mua táo và quýt. Tổng cộng hết 500 Yên.', 
    38, 4, 1, n5_id, l_id, NOW(), NOW())
    ON CONFLICT ("Title") DO NOTHING;

	INSERT INTO "ReadingTopics" ("ReadingID", "TopicID") 
    SELECT r_id, t_id WHERE EXISTS (SELECT 1 FROM "Readings" WHERE "ReadingID" = r_id) ON CONFLICT DO NOTHING;

    -- Câu hỏi 1 bài 7
    q_id := gen_random_uuid();
	INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "QuestionFormat", "SkillType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '何を買いましたか？ (Đã mua cái gì?)', 0, 0, 4, 1, 1, l_id, r_id, NULL, NOW(), NOW());

	INSERT INTO temp_new_q_ids (id_vua_tao) VALUES (q_id);
	
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, '果物です', true),
    (gen_random_uuid(), q_id, '肉です', false),
    (gen_random_uuid(), q_id, '魚です', false),
    (gen_random_uuid(), q_id, '野菜です', false);

    -- Câu hỏi 2 bài 7
    q_id := gen_random_uuid();
	INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "QuestionFormat", "SkillType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '全部でいくらでしたか？ (Tổng cộng bao nhiêu tiền?)', 0, 0, 4, 1, 1, l_id, r_id, NULL, NOW(), NOW());

	INSERT INTO temp_new_q_ids (id_vua_tao) VALUES (q_id);
	
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, '５００円です', true),
    (gen_random_uuid(), q_id, '４００円です', false),
    (gen_random_uuid(), q_id, '６００円です', false),
    (gen_random_uuid(), q_id, '１０００円です', false);

    -------------------------------------------------------
    -- BÀI ĐỌC 8: NGÔI NHÀ MỚI
    -------------------------------------------------------
	SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 8' LIMIT 1;
    r_id := gen_random_uuid();
    INSERT INTO "Readings" ("ReadingID", "Title", "Content", "Translation", "WordCount", "EstimatedTime", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (r_id, '新しい家 (Ngôi nhà mới)', 
    '私の家は新しくてきれいです。庭にきれいな花がたくさんあります。犬も一匹います。', 
    'Nhà của tôi mới và đẹp. Ở sân có rất nhiều hoa đẹp. Cũng có một con chó nữa.', 
    36, 5, 1, n5_id, l_id, NOW(), NOW())
    ON CONFLICT ("Title") DO NOTHING;

	INSERT INTO "ReadingTopics" ("ReadingID", "TopicID") 
    SELECT r_id, t_id WHERE EXISTS (SELECT 1 FROM "Readings" WHERE "ReadingID" = r_id) ON CONFLICT DO NOTHING;

    -- Câu hỏi 1 bài 8
    q_id := gen_random_uuid();
	INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "QuestionFormat", "SkillType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, 'どんな家ですか？ (Ngôi nhà như thế nào?)', 0, 0, 4, 1, 1, l_id, r_id, NULL, NOW(), NOW());

	INSERT INTO temp_new_q_ids (id_vua_tao) VALUES (q_id);
	
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES
	(gen_random_uuid(), q_id, '新しくてきれいです', true),
    (gen_random_uuid(), q_id, '古くて安いです', false),
    (gen_random_uuid(), q_id, '狭くて暗いです', false),
    (gen_random_uuid(), q_id, '大きくて近いです', false);

    -- Câu hỏi 2 bài 8
    q_id := gen_random_uuid();
	INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "QuestionFormat", "SkillType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '庭に何がありますか？ (Ở sân có cái gì?)', 0, 0, 4, 1, 1, l_id, r_id, NULL, NOW(), NOW());

	INSERT INTO temp_new_q_ids (id_vua_tao) VALUES (q_id);
	
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, '花と犬です', true),
    (gen_random_uuid(), q_id, '木と猫です', false),
    (gen_random_uuid(), q_id, '池と魚です', false),
    (gen_random_uuid(), q_id, '車と自転車です', false);

	-------------------------------------------------------
    -- BÀI ĐỌC 9: KẾ HOẠCH CUỐI TUẦN
    -------------------------------------------------------
	SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 9' LIMIT 1;
    r_id := gen_random_uuid();
    INSERT INTO "Readings" ("ReadingID", "Title", "Content", "Translation", "WordCount", "EstimatedTime", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (r_id, '週末の予定 (Kế hoạch cuối tuần)', 
    '今週の土曜日に友達と海へ行きます。泳いで、魚を食べます。日曜日はうちで休みます。', 
    'Thứ Bảy tuần này tôi sẽ đi biển cùng bạn. Chúng tôi sẽ bơi và ăn cá. Chủ Nhật tôi sẽ nghỉ ngơi ở nhà.', 
    37, 4, 1, n5_id, l_id, NOW(), NOW())
    ON CONFLICT ("Title") DO NOTHING;

	INSERT INTO "ReadingTopics" ("ReadingID", "TopicID") 
    SELECT r_id, t_id WHERE EXISTS (SELECT 1 FROM "Readings" WHERE "ReadingID" = r_id) ON CONFLICT DO NOTHING;

    -- Câu hỏi 1 bài 9
    q_id := gen_random_uuid();
	INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "QuestionFormat", "SkillType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '土曜日にどこへ行きますか？ (Thứ Bảy đi đâu?)', 0, 0, 4, 1, 1, l_id, r_id, NULL, NOW(), NOW());

	INSERT INTO temp_new_q_ids (id_vua_tao) VALUES (q_id);
	
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, '海です', true),
    (gen_random_uuid(), q_id, '山です', false),
    (gen_random_uuid(), q_id, '公園です', false),
    (gen_random_uuid(), q_id, 'デパートです', false);

    -- Câu hỏi 2 bài 9
    q_id := gen_random_uuid();
	INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "QuestionFormat", "SkillType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '日曜日は何をしますか？ (Chủ Nhật làm gì?)', 0, 0, 4, 1, 1, l_id, r_id, NULL, NOW(), NOW());

	INSERT INTO temp_new_q_ids (id_vua_tao) VALUES (q_id);
	INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, 'うちで休みます', true),
    (gen_random_uuid(), q_id, 'テニスをします', false),
    (gen_random_uuid(), q_id, '買い物をします', false),
    (gen_random_uuid(), q_id, '仕事をします', false);

    -------------------------------------------------------
    -- BÀI ĐỌC 10: TIẾNG NHẬT CỦA TÔI
    -------------------------------------------------------
	SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 10' LIMIT 1;
    r_id := gen_random_uuid();
    INSERT INTO "Readings" ("ReadingID", "Title", "Content", "Translation", "WordCount", "EstimatedTime", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (r_id, '私の日本語 (Tiếng Nhật của tôi)', 
    '私は３ヶ月日本語を勉強しました。漢字は難しいですが、とてもおもしろいです。毎日頑張ります。', 
    'Tôi đã học tiếng Nhật được 3 tháng. Kanji thì khó nhưng rất thú vị. Mỗi ngày tôi đều cố gắng.', 
    42, 5, 1, n5_id, l_id, NOW(), NOW())
    ON CONFLICT ("Title") DO NOTHING;

	INSERT INTO "ReadingTopics" ("ReadingID", "TopicID") 
    SELECT r_id, t_id WHERE EXISTS (SELECT 1 FROM "Readings" WHERE "ReadingID" = r_id) ON CONFLICT DO NOTHING;

    -- Câu hỏi 1 bài 10
    q_id := gen_random_uuid();
	INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "QuestionFormat", "SkillType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, 'どのくらい勉強しましたか？ (Đã học được bao lâu rồi?)', 0, 0, 4, 1, 1, l_id, r_id, NULL, NOW(), NOW());

	INSERT INTO temp_new_q_ids (id_vua_tao) VALUES (q_id);
	
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, '３ヶ月です', true),
    (gen_random_uuid(), q_id, '１ヶ月です', false),
    (gen_random_uuid(), q_id, '半年です', false),
    (gen_random_uuid(), q_id, '１年です', false);

    -- Câu hỏi 2 bài 10
    q_id := gen_random_uuid();
	INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "QuestionFormat", "SkillType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '漢字はどうですか？ (Chữ Hán thì thế nào?)', 0, 0, 4, 1, 1, l_id, r_id, NULL, NOW(), NOW());

	INSERT INTO temp_new_q_ids (id_vua_tao) VALUES (q_id);
	
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, '難しいですがおもしろいです', true),
    (gen_random_uuid(), q_id, '易しいです', false),
    (gen_random_uuid(), q_id, 'あまり好きじゃないです', false),
    (gen_random_uuid(), q_id, '全然わかりません', false);


	INSERT INTO "Questions_Topics" ("QuestionID", "TopicID")
    SELECT id_vua_tao, t_id FROM temp_new_q_ids
    ON CONFLICT DO NOTHING; -- Tránh lỗi nếu chạy lại script nhiều lần

	RAISE NOTICE 'Đã tạo xong bài đọc N5.';

END $$;

-- =========================================================
-- SEED TEST JLPT N5 MOCK TEST
-- Mục tiêu: reset dữ liệu test và tạo 1 Level N5 + 1 Course + 1 Lesson + 1 đề JLPT đầy đủ.
-- Enum dùng theo hệ thống hiện tại:
-- SkillType: Vocabulary=1, Grammar=2, Kanji=3, Reading=4, Listening=5
-- QuestionType: MultipleChoice=0
-- QuestionFormat: StandardChoice=0, StarSentence=1, Passage=2, AudioChoice=3
-- Status: Published=1
-- ExamType: MockTest=0
-- Lưu ý: AudioURL/ImageURL của Listening đang để rỗng để bạn tự cập nhật sau.
-- =========================================================

BEGIN;

-- 2. DỮ LIỆU BẢNG CON KỸ NĂNG (tạo nếu bảng/cột đúng như schema hiện tại)
DO $$
DECLARE
    v_level uuid := '91e47292-b3eb-5965-9d01-45f9b3681fc6';
    v_lesson uuid := 'bdff3452-6099-5556-ba16-1cb8673e726c';
BEGIN
    IF to_regclass('public."Vocabularies"') IS NOT NULL THEN
        BEGIN
        INSERT INTO public."Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "IsCommon", "Priority", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") VALUES
        ('1cfbad62-0713-543d-a493-06ee2da648ee', '私', 'わたし', 'Tôi', true, 1, 1, v_level, v_lesson, NOW(), NOW(), ''),
        ('769135b2-b1ad-53a4-9204-6b3eb70fc96e', '学生', 'がくせい', 'Học sinh/sinh viên', true, 2, 1, v_level, v_lesson, NOW(), NOW(), ''),
        ('0d0336a8-efa0-52a0-b055-0d8f80fbee47', '先生', 'せんせい', 'Giáo viên', true, 3, 1, v_level, v_lesson, NOW(), NOW(), ''),
        ('89367015-92a6-52a8-b025-be993eb7f6fc', '学校', 'がっこう', 'Trường học', true, 4, 1, v_level, v_lesson, NOW(), NOW(), ''),
        ('2b8ee1ac-b57b-530a-b858-3c98e7e546cb', '本', 'ほん', 'Sách', true, 5, 1, v_level, v_lesson, NOW(), NOW(), '')
        ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Bỏ qua insert Vocabularies: %', SQLERRM;
        END;
    END IF;

    IF to_regclass('public."Grammars"') IS NOT NULL THEN
        BEGIN
        INSERT INTO public."Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "GrammarType", "GrammarGroupID", "Status", "LevelID", "LessonID", "CreatedAt", "UpdatedAt") VALUES
        ('e2647061-a9ba-5da6-8fa9-718521f8a240', 'は', 'N は ...', 'Trợ từ chủ đề', 'Trợ từ chủ đề', 0, 0, NULL, 1, v_level, v_lesson, NOW(), NOW()),
        ('52703ad7-c849-58cb-affa-6d853d676dc2', 'を', 'N を Vます', 'Đánh dấu tân ngữ', 'Đánh dấu tân ngữ', 0, 0, NULL, 1, v_level, v_lesson, NOW(), NOW()),
        ('9e7c5def-e9e2-5cae-97bb-ada22e4f64ec', 'で', 'Nで Vます', 'Nơi thực hiện hành động', 'Nơi thực hiện hành động', 0, 0, NULL, 1, v_level, v_lesson, NOW(), NOW()),
        ('2b5e3e7b-7922-589b-88b9-2e16827ad293', 'に', 'Time に Vます', 'Thời điểm', 'Thời điểm', 0, 0, NULL, 1, v_level, v_lesson, NOW(), NOW()),
        ('ca51868f-f68d-5190-bd4c-d3b540f6e26e', 'の', 'N の N', 'Sở hữu/liên kết danh từ', 'Sở hữu/liên kết danh từ', 0, 0, NULL, 1, v_level, v_lesson, NOW(), NOW())
        ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Bỏ qua insert Grammars: %', SQLERRM;
        END;
    END IF;

    IF to_regclass('public."Kanjis"') IS NOT NULL THEN
        BEGIN
        INSERT INTO public."Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "RadicalID", "Popularity", "Status", "TopicID", "LevelID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") VALUES
        ('62e70eb9-c765-59b1-adfd-306b11c096e2', '人', 'ジン, ニン', 'ひと', 'Người', 2, NULL, 1, 1, NULL, v_level, v_lesson, NOW(), NOW(), ''),
        ('abb28424-184d-5688-a94a-8706f7f6052e', '日', 'ニチ', 'ひ', 'Ngày/Mặt trời', 4, NULL, 2, 1, NULL, v_level, v_lesson, NOW(), NOW(), ''),
        ('a38b1139-a2d0-5725-8be9-776bb772bca0', '月', 'ゲツ, ガツ', 'つき', 'Tháng/Mặt trăng', 4, NULL, 3, 1, NULL, v_level, v_lesson, NOW(), NOW(), ''),
        ('24cb6ae6-46e6-50e9-a329-91430a931bfa', '水', 'スイ', 'みず', 'Nước', 4, NULL, 4, 1, NULL, v_level, v_lesson, NOW(), NOW(), ''),
        ('456c2593-f952-561b-9a39-20d3a95805a5', '車', 'シャ', 'くるま', 'Xe', 7, NULL, 5, 1, NULL, v_level, v_lesson, NOW(), NOW(), '')
        ON CONFLICT DO NOTHING;
        EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Bỏ qua insert Kanjis: %', SQLERRM;
        END;
    END IF;
END $$;

-- 3. READING PARENTS: 2 bài đọc, mỗi bài 3 câu
INSERT INTO public."Readings" ("ReadingID", "Title", "Content", "Translation", "WordCount", "EstimatedTime", "Status", "CreatedAt", "UpdatedAt", "LevelID", "LessonID") VALUES
('21ea58a5-2311-5ad3-9806-1dd8059bb61e', 'N5 Reading 1 - わたしの一日', '私は毎朝六時に起きます。七時に朝ごはんを食べます。八時に学校へ行きます。学校で日本語を勉強します。午後四時に家へ帰ります。', 'Tôi thức dậy lúc 6 giờ mỗi sáng...', 90, 5, 1, NOW(), NOW(), '91e47292-b3eb-5965-9d01-45f9b3681fc6', 'bdff3452-6099-5556-ba16-1cb8673e726c'),
('f0a2c372-fbaa-5eb3-91f2-422720b24e68', 'N5 Reading 2 - 週末', '土曜日に友だちと駅で会いました。私たちは電車で町へ行きました。町で映画を見て、レストランで昼ごはんを食べました。とても楽しかったです。', 'Thứ bảy tôi gặp bạn ở ga...', 95, 5, 1, NOW(), NOW(), '91e47292-b3eb-5965-9d01-45f9b3681fc6', 'bdff3452-6099-5556-ba16-1cb8673e726c');

-- 4. LISTENING PARENTS: 20 bài nghe, audio để rỗng
INSERT INTO public."Listenings" ("ListeningID", "Title", "AudioURL", "Script", "Transcript", "Duration", "SpeedCategory", "Status", "CreatedAt", "UpdatedAt", "LevelID", "LessonID") VALUES
('cfe60b4d-9b44-5891-adf7-49782be4e119', 'N5 Listening 01', '/listening-audios/JLPTAudio.mp4', 'これはN5聴解テスト01のスクリプトです。', '', 30, 'Normal', 1, NOW(), NOW(), '91e47292-b3eb-5965-9d01-45f9b3681fc6', 'bdff3452-6099-5556-ba16-1cb8673e726c'),
('e61ed20e-dc54-5071-bad5-8a7f807bee53', 'N5 Listening 02', '/listening-audios/JLPTAudio.mp4', 'これはN5聴解テスト02のスクリプトです。', '', 30, 'Normal', 1, NOW(), NOW(), '91e47292-b3eb-5965-9d01-45f9b3681fc6', 'bdff3452-6099-5556-ba16-1cb8673e726c'),
('79fe3bfa-6a24-5779-bf67-317738181fdc', 'N5 Listening 03', '/listening-audios/JLPTAudio.mp4', 'これはN5聴解テスト03のスクリプトです。', '', 30, 'Normal', 1, NOW(), NOW(), '91e47292-b3eb-5965-9d01-45f9b3681fc6', 'bdff3452-6099-5556-ba16-1cb8673e726c'),
('58ddee31-2fa8-5ed3-80b1-c67027e81c31', 'N5 Listening 04', '/listening-audios/JLPTAudio.mp4', 'これはN5聴解テスト04のスクリプトです。', '', 30, 'Normal', 1, NOW(), NOW(), '91e47292-b3eb-5965-9d01-45f9b3681fc6', 'bdff3452-6099-5556-ba16-1cb8673e726c'),
('17cc484f-eb1d-5d87-b7d8-2b537306d451', 'N5 Listening 05', '/listening-audios/JLPTAudio.mp4', 'これはN5聴解テスト05のスクリプトです。', '', 30, 'Normal', 1, NOW(), NOW(), '91e47292-b3eb-5965-9d01-45f9b3681fc6', 'bdff3452-6099-5556-ba16-1cb8673e726c'),
('1dfca429-43e4-5da5-958b-20ba6d95caf0', 'N5 Listening 06', '/listening-audios/JLPTAudio.mp4', 'これはN5聴解テスト06のスクリプトです。', '', 30, 'Normal', 1, NOW(), NOW(), '91e47292-b3eb-5965-9d01-45f9b3681fc6', 'bdff3452-6099-5556-ba16-1cb8673e726c'),
('cb86d6aa-d6cc-5c37-9e13-0654605cf5a6', 'N5 Listening 07', '/listening-audios/JLPTAudio.mp4', 'これはN5聴解テスト07のスクリプトです。', '', 30, 'Normal', 1, NOW(), NOW(), '91e47292-b3eb-5965-9d01-45f9b3681fc6', 'bdff3452-6099-5556-ba16-1cb8673e726c'),
('407776cf-3bd7-58eb-be37-eae89a5db175', 'N5 Listening 08', '/listening-audios/JLPTAudio.mp4', 'これはN5聴解テスト08のスクリプトです。', '', 30, 'Normal', 1, NOW(), NOW(), '91e47292-b3eb-5965-9d01-45f9b3681fc6', 'bdff3452-6099-5556-ba16-1cb8673e726c'),
('4741ebed-bc26-5f96-877d-59072f406aeb', 'N5 Listening 09', '/listening-audios/JLPTAudio.mp4', 'これはN5聴解テスト09のスクリプトです。', '', 30, 'Normal', 1, NOW(), NOW(), '91e47292-b3eb-5965-9d01-45f9b3681fc6', 'bdff3452-6099-5556-ba16-1cb8673e726c'),
('acc5797e-d48b-53ee-a808-9f359f6323b4', 'N5 Listening 10', '/listening-audios/JLPTAudio.mp4', 'これはN5聴解テスト10のスクリプトです。', '', 30, 'Normal', 1, NOW(), NOW(), '91e47292-b3eb-5965-9d01-45f9b3681fc6', 'bdff3452-6099-5556-ba16-1cb8673e726c'),
('14701068-910b-56db-aa67-117928508847', 'N5 Listening 11', '/listening-audios/JLPTAudio.mp4', 'これはN5聴解テスト11のスクリプトです。', '', 30, 'Normal', 1, NOW(), NOW(), '91e47292-b3eb-5965-9d01-45f9b3681fc6', 'bdff3452-6099-5556-ba16-1cb8673e726c'),
('c5f998fb-f7c7-59c8-ad41-a5ee516119f7', 'N5 Listening 12', '/listening-audios/JLPTAudio.mp4', 'これはN5聴解テスト12のスクリプトです。', '', 30, 'Normal', 1, NOW(), NOW(), '91e47292-b3eb-5965-9d01-45f9b3681fc6', 'bdff3452-6099-5556-ba16-1cb8673e726c'),
('d30a9bef-2f1b-56a4-ac98-d921d56d48ca', 'N5 Listening 13', '/listening-audios/JLPTAudio.mp4', 'これはN5聴解テスト13のスクリプトです。', '', 30, 'Normal', 1, NOW(), NOW(), '91e47292-b3eb-5965-9d01-45f9b3681fc6', 'bdff3452-6099-5556-ba16-1cb8673e726c'),
('029dcc09-b051-59d5-b671-32bc874bc154', 'N5 Listening 14', '/listening-audios/JLPTAudio.mp4', 'これはN5聴解テスト14のスクリプトです。', '', 30, 'Normal', 1, NOW(), NOW(), '91e47292-b3eb-5965-9d01-45f9b3681fc6', 'bdff3452-6099-5556-ba16-1cb8673e726c'),
('2be75180-9b30-56a7-9a3d-9d82e7e3d6f3', 'N5 Listening 15', '/listening-audios/JLPTAudio.mp4', 'これはN5聴解テスト15のスクリプトです。', '', 30, 'Normal', 1, NOW(), NOW(), '91e47292-b3eb-5965-9d01-45f9b3681fc6', 'bdff3452-6099-5556-ba16-1cb8673e726c'),
('7c488529-8294-579a-b022-65e6a950e545', 'N5 Listening 16', '/listening-audios/JLPTAudio.mp4', 'これはN5聴解テスト16のスクリプトです。', '', 30, 'Normal', 1, NOW(), NOW(), '91e47292-b3eb-5965-9d01-45f9b3681fc6', 'bdff3452-6099-5556-ba16-1cb8673e726c'),
('652e0b99-b752-58b8-a09f-ecfe0481d043', 'N5 Listening 17', '/listening-audios/JLPTAudio.mp4', 'これはN5聴解テスト17のスクリプトです。', '', 30, 'Normal', 1, NOW(), NOW(), '91e47292-b3eb-5965-9d01-45f9b3681fc6', 'bdff3452-6099-5556-ba16-1cb8673e726c'),
('2dfbbe0d-0f4f-5dee-8dff-55512bf489c3', 'N5 Listening 18', '/listening-audios/JLPTAudio.mp4', 'これはN5聴解テスト18のスクリプトです。', '', 30, 'Normal', 1, NOW(), NOW(), '91e47292-b3eb-5965-9d01-45f9b3681fc6', 'bdff3452-6099-5556-ba16-1cb8673e726c'),
('12e225ba-f3bd-54f9-85e4-1e52bbdad8b7', 'N5 Listening 19', '/listening-audios/JLPTAudio.mp4', 'これはN5聴解テスト19のスクリプトです。', '', 30, 'Normal', 1, NOW(), NOW(), '91e47292-b3eb-5965-9d01-45f9b3681fc6', 'bdff3452-6099-5556-ba16-1cb8673e726c'),
('39c303ce-8e05-5f51-aaf9-308cc4c6f0c9', 'N5 Listening 20', '/listening-audios/JLPTAudio.mp4', 'これはN5聴解テスト20のスクリプトです。', '', 30, 'Normal', 1, NOW(), NOW(), '91e47292-b3eb-5965-9d01-45f9b3681fc6', 'bdff3452-6099-5556-ba16-1cb8673e726c');

-- 5. QUESTIONS
INSERT INTO public."Questions" ("QuestionID", "ReadingID", "ListeningID", "LessonID", "Content", "QuestionType", "QuestionFormat", "SkillType", "AudioURL", "ImageURL", "Difficulty", "Explanation", "Status", "EquivalentID", "MediaTimestamp", "DisplayOrder", "CreatedAt", "UpdatedAt", "SourceID", "ParentID") VALUES
('eb5cca3b-0065-5408-ad17-80cbb390811f', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「本」の読み方はどれですか。', 0, 0, 1, NULL, NULL, 1, '本 = ほん, nghĩa là sách.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('7621c0bf-eeaf-50b2-856b-e9a1f80013bf', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「学校」の読み方はどれですか。', 0, 0, 1, NULL, NULL, 1, '学校 = がっこう.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('5469a658-25a7-5c72-92c8-ce9e22650995', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「水」の意味はどれですか。', 0, 0, 1, NULL, NULL, 1, '水 nghĩa là nước.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('28c14c41-21e9-5f7b-9207-d6158ef42a5f', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「明日」の読み方はどれですか。', 0, 0, 1, NULL, NULL, 1, '明日 = あした.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('8fdb5ce0-a1f8-5ef6-b5c8-71d943e1b3f4', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「電車」の意味はどれですか。', 0, 0, 1, NULL, NULL, 1, '電車 nghĩa là tàu điện.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('adf593d3-abb9-597c-97d9-08b6fe739f74', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「友だち」の意味 là gì?', 0, 0, 1, NULL, NULL, 1, '友だち nghĩa là bạn bè.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('49e47085-a830-5e65-87d2-68e03d535c6f', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「食べます」の nghĩa là gì?', 0, 0, 1, NULL, NULL, 1, '食べます nghĩa là ăn.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('4edf3654-7d30-5333-983c-1c19601cf244', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「飲みます」の nghĩa là gì?', 0, 0, 1, NULL, NULL, 1, '飲みます nghĩa là uống.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('bb254cfb-64dc-51f5-8a24-9d53e3e4656e', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「大きい」の nghĩa là gì?', 0, 0, 1, NULL, NULL, 1, '大きい nghĩa là to/lớn.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('f5985592-2ba6-5ded-8a0c-ae79406ef161', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「安い」の nghĩa là gì?', 0, 0, 1, NULL, NULL, 1, '安い nghĩa là rẻ.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('f840f31e-a39a-5c55-b7c2-ce60c88790d8', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「駅」の読み方はどれですか。', 0, 0, 1, NULL, NULL, 1, '駅 = えき.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('16b861fb-2ca5-59b5-8499-b67a6ebae9a4', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「毎日」の nghĩa là gì?', 0, 0, 1, NULL, NULL, 1, '毎日 nghĩa là mỗi ngày.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('7c156578-6201-56fe-a62d-3eb128a3052e', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「右」の読み方はどれですか。', 0, 0, 1, NULL, NULL, 1, '右 = みぎ.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('db339b39-4ed8-50a9-a187-226fd9958f98', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「午前」の nghĩa là gì?', 0, 0, 1, NULL, NULL, 1, '午前 là trước 12 giờ trưa.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('4b113a3b-cf63-5bed-ad0f-090270bc7d1b', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「名前」の読み方はどれですか。', 0, 0, 1, NULL, NULL, 1, '名前 = なまえ.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('6ccc07f6-0d10-56e7-8871-8c54e487396a', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', 'わたし___学生です。', 0, 0, 2, NULL, NULL, 1, 'Chủ đề của câu dùng は.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('a85508e0-2215-5fc0-aa6c-33c4d820d0c7', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '学校___行きます。', 0, 0, 2, NULL, NULL, 1, 'Đi đến nơi nào dùng へ/に.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('a04de25d-4937-584a-a0af-817e879c8178', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', 'パン___食べます。', 0, 0, 2, NULL, NULL, 1, 'Tân ngữ của động từ dùng を.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('9ee0c25d-75c5-515e-a90f-90f8b9fbf7b0', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '図書館___本を読みます。', 0, 0, 2, NULL, NULL, 1, 'Nơi thực hiện hành động dùng で.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('82578b24-9ca1-50c6-8501-2a840945b3d8', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '田中さん___来ました。', 0, 0, 2, NULL, NULL, 1, 'Chủ ngữ mới thường dùng が.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('9a9577ac-e486-5c27-9504-c35c50bfc7ac', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', 'これは私___本です。', 0, 0, 2, NULL, NULL, 1, 'Sở hữu dùng の.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('dfaef71e-1a9a-5a97-b175-7277b3d387c5', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '日曜日___映画を見ます。', 0, 0, 2, NULL, NULL, 1, 'Thời điểm cụ thể dùng に.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('829d57c5-4fa7-59e5-8031-7a9d14bacf1e', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '友だち___駅へ行きます。', 0, 0, 2, NULL, NULL, 1, 'Đi cùng ai dùng と.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('4218414e-e920-5531-9a19-50b2b45b977b', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', 'コーヒー___お茶、どちらが好きですか。', 0, 0, 2, NULL, NULL, 1, 'Liệt kê lựa chọn dùng と.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('3e7a61a8-84a7-59f2-9f08-1675e9b792b3', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', 'このかばんは高く___ありません。', 0, 0, 2, NULL, NULL, 1, 'Tính từ い phủ định: 高くない.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('750d4d19-eb61-5988-bb36-c2317f5fcc3c', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', 'きのう学校へ行き___。', 0, 0, 2, NULL, NULL, 1, 'Quá khứ lịch sự dùng ました.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('411e7e70-8875-599c-8fb9-4bbc7e9e3865', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', 'ここで写真を撮って___。', 0, 0, 2, NULL, NULL, 1, 'Yêu cầu: Vてください.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('367c24bc-66ce-5de6-8eee-b8a11b44a77f', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '私は日本語___少しわかります。', 0, 0, 2, NULL, NULL, 1, 'Với わかります thường dùng が.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('7aec7f7e-79e6-5843-9b90-f8010439332e', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', 'この部屋は静か___。', 0, 0, 2, NULL, NULL, 1, 'Tính từ な kết câu với です.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('ab670466-d23e-5f7e-90d8-e2d63fc49da7', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '毎朝六時___起きます。', 0, 0, 2, NULL, NULL, 1, 'Giờ cụ thể dùng に.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('54f24e33-3ad1-588b-836f-f93e5f0af4bf', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「人」の意味はどれですか。', 0, 0, 3, NULL, NULL, 1, '人 nghĩa là người.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('4e56550d-ee60-5aab-856e-3ec6d6054051', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「日」の意味はどれですか。', 0, 0, 3, NULL, NULL, 1, '日 nghĩa là ngày hoặc mặt trời.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('f29910fa-f258-5636-bd00-6e8e3a435edd', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「月」の意味はどれですか。', 0, 0, 3, NULL, NULL, 1, '月 nghĩa là tháng hoặc mặt trăng.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('09d66d9c-4650-58e8-8e87-28ee67f3b09b', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「火」の意味はどれですか。', 0, 0, 3, NULL, NULL, 1, '火 nghĩa là lửa.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('c393bcf4-5e1c-57ac-b396-a16adbc806b8', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「水」の意味はどれですか。', 0, 0, 3, NULL, NULL, 1, '水 nghĩa là nước.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('ee2a8815-9172-5c42-8c62-9c51837b69f4', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「木」の意味はどれですか。', 0, 0, 3, NULL, NULL, 1, '木 nghĩa là cây.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('34806753-cdb1-5b99-8a6f-56cdd90e3f5e', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「山」の意味はどれですか。', 0, 0, 3, NULL, NULL, 1, '山 nghĩa là núi.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('cc55919d-6aac-5f03-9f90-867aa5d733f7', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「川」の意味はどれですか。', 0, 0, 3, NULL, NULL, 1, '川 nghĩa là sông.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('dde2dd8e-fec0-51c7-add7-8998d642bbf7', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「田」の意味 là gì?', 0, 0, 3, NULL, NULL, 1, '田 nghĩa là ruộng.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('1ca9207b-f20c-5d4a-a76f-493f6a142c87', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「口」の意味 là gì?', 0, 0, 3, NULL, NULL, 1, '口 nghĩa là miệng.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('786b30fb-8f9a-5bfb-8735-663a25136888', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「目」の意味 là gì?', 0, 0, 3, NULL, NULL, 1, '目 nghĩa là mắt.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('85a9ff76-6d39-5080-9d3e-af070746336d', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「耳」の意味 là gì?', 0, 0, 3, NULL, NULL, 1, '耳 nghĩa là tai.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('ac1b2b00-3237-5a5e-b2bd-234f23a11ddd', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「手」の意味 là gì?', 0, 0, 3, NULL, NULL, 1, '手 nghĩa là tay.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('0049db6e-0a9e-5b0e-ad0a-ccefc982fa53', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「足」の意味 là gì?', 0, 0, 3, NULL, NULL, 1, '足 nghĩa là chân.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('53f168bc-a364-5951-821b-0173637b0625', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「車」の意味 là gì?', 0, 0, 3, NULL, NULL, 1, '車 nghĩa là xe.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('bfede2c1-5f1c-577d-a63a-7e89a6760186', '21ea58a5-2311-5ad3-9806-1dd8059bb61e', NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '私は毎朝何時に起きますか。', 0, 2, 4, NULL, NULL, 1, 'Trong bài có câu 六時に起きます。', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('73fb6582-d96e-5e0a-8c90-f9556a5ec4da', '21ea58a5-2311-5ad3-9806-1dd8059bb61e', NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '私はどこで日本語を勉強しますか。', 0, 2, 4, NULL, NULL, 1, '学校で日本語を勉強します。', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('6eae996f-c4ad-5b7f-acf2-e983fc869b5b', '21ea58a5-2311-5ad3-9806-1dd8059bb61e', NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '午後四時に何をしますか。', 0, 2, 4, NULL, NULL, 1, '午後四時に家へ帰ります。', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('b3f00191-6b19-5f58-bebf-38edc5fce795', 'f0a2c372-fbaa-5eb3-91f2-422720b24e68', NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '土曜日にだれと会いましたか。', 0, 2, 4, NULL, NULL, 1, '友だちと駅で会いました。', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('8edf76ed-f55a-5e54-9ba1-556c4e2c4591', 'f0a2c372-fbaa-5eb3-91f2-422720b24e68', NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '何で町へ行きましたか。', 0, 2, 4, NULL, NULL, 1, '電車で町へ行きました。', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('5c30e54d-c10a-56df-a3f8-0352eae99919', 'f0a2c372-fbaa-5eb3-91f2-422720b24e68', NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '町で何を見ましたか。', 0, 2, 4, NULL, NULL, 1, '町で映画を見ました。', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('abe20793-92e1-57cd-b304-6c733cae6c28', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「今日は暑いです。」この文の意味はどれですか。', 0, 0, 4, NULL, NULL, 1, '暑い = nóng.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('21bdcfa0-c722-5230-996b-4299a28206ec', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「私は毎日日本語を勉強します。」何を勉強しますか。', 0, 0, 4, NULL, NULL, 1, '日本語を勉強します。', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('4f2df790-e1df-5dd9-aaa2-6f5366573878', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「スーパーは駅の前です。」スーパーはどこですか。', 0, 0, 4, NULL, NULL, 1, '駅の前 = trước nhà ga.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('2340a85c-1983-508b-8539-4b7d3546e268', NULL, NULL, 'bdff3452-6099-5556-ba16-1cb8673e726c', '「この本はおもしろいです。」本はどうですか。', 0, 0, 4, NULL, NULL, 1, 'おもしろい = thú vị.', 1, NULL, NULL, NULL, NOW(), NOW(), NULL, NULL),
('8f69ee4e-b869-5f25-92cb-600e1458c176', NULL, 'cfe60b4d-9b44-5891-adf7-49782be4e119', 'bdff3452-6099-5556-ba16-1cb8673e726c', 'Nghe đoạn hội thoại 01 và chọn đáp án đúng.', 0, 3, 5, NULL, '/listening-questions/JLPTTestImage.jpg', 1, 'Placeholder đáp án đúng cho bài nghe 01.', 1, NULL, '', 1, NOW(), NOW(), NULL, NULL),
('914e8f71-087e-580f-ab57-040874351cb5', NULL, 'e61ed20e-dc54-5071-bad5-8a7f807bee53', 'bdff3452-6099-5556-ba16-1cb8673e726c', 'Nghe đoạn hội thoại 02 và chọn đáp án đúng.', 0, 3, 5, NULL, '/listening-questions/JLPTTestImage.jpg', 1, 'Placeholder đáp án đúng cho bài nghe 02.', 1, NULL, '', 1, NOW(), NOW(), NULL, NULL),
('67179377-5910-5cbd-b597-3444f1b312da', NULL, '79fe3bfa-6a24-5779-bf67-317738181fdc', 'bdff3452-6099-5556-ba16-1cb8673e726c', 'Nghe đoạn hội thoại 03 và chọn đáp án đúng.', 0, 3, 5, NULL, '/listening-questions/JLPTTestImage.jpg', 1, 'Placeholder đáp án đúng cho bài nghe 03.', 1, NULL, '', 1, NOW(), NOW(), NULL, NULL),
('4543dc08-996e-535c-88f2-1569f0332d8e', NULL, '58ddee31-2fa8-5ed3-80b1-c67027e81c31', 'bdff3452-6099-5556-ba16-1cb8673e726c', 'Nghe đoạn hội thoại 04 và chọn đáp án đúng.', 0, 3, 5, NULL, '/listening-questions/JLPTTestImage.jpg', 1, 'Placeholder đáp án đúng cho bài nghe 04.', 1, NULL, '', 1, NOW(), NOW(), NULL, NULL),
('9d8aea1a-2f07-5ab8-8f8a-08bb17f5a156', NULL, '17cc484f-eb1d-5d87-b7d8-2b537306d451', 'bdff3452-6099-5556-ba16-1cb8673e726c', 'Nghe đoạn hội thoại 05 và chọn đáp án đúng.', 0, 3, 5, NULL, '/listening-questions/JLPTTestImage.jpg', 1, 'Placeholder đáp án đúng cho bài nghe 05.', 1, NULL, '', 1, NOW(), NOW(), NULL, NULL),
('26f6bcfe-3e4f-5789-be8f-8068d8db8ffd', NULL, '1dfca429-43e4-5da5-958b-20ba6d95caf0', 'bdff3452-6099-5556-ba16-1cb8673e726c', 'Nghe đoạn hội thoại 06 và chọn đáp án đúng.', 0, 3, 5, NULL, '/listening-questions/JLPTTestImage.jpg', 1, 'Placeholder đáp án đúng cho bài nghe 06.', 1, NULL, '', 1, NOW(), NOW(), NULL, NULL),
('aff70e6d-36ed-5a2a-a2e0-71f2c2256777', NULL, 'cb86d6aa-d6cc-5c37-9e13-0654605cf5a6', 'bdff3452-6099-5556-ba16-1cb8673e726c', 'Nghe đoạn hội thoại 07 và chọn đáp án đúng.', 0, 3, 5, NULL, '/listening-questions/JLPTTestImage.jpg', 1, 'Placeholder đáp án đúng cho bài nghe 07.', 1, NULL, '', 1, NOW(), NOW(), NULL, NULL),
('744952cb-b4ac-5bda-9056-2097bc189deb', NULL, '407776cf-3bd7-58eb-be37-eae89a5db175', 'bdff3452-6099-5556-ba16-1cb8673e726c', 'Nghe đoạn hội thoại 08 và chọn đáp án đúng.', 0, 3, 5, NULL, '/listening-questions/JLPTTestImage.jpg', 1, 'Placeholder đáp án đúng cho bài nghe 08.', 1, NULL, '', 1, NOW(), NOW(), NULL, NULL),
('35c1905b-455f-5f4b-8e7a-e5bc9f5552b6', NULL, '4741ebed-bc26-5f96-877d-59072f406aeb', 'bdff3452-6099-5556-ba16-1cb8673e726c', 'Nghe đoạn hội thoại 09 và chọn đáp án đúng.', 0, 3, 5, NULL, '/listening-questions/JLPTTestImage.jpg', 1, 'Placeholder đáp án đúng cho bài nghe 09.', 1, NULL, '', 1, NOW(), NOW(), NULL, NULL),
('d69167cf-717b-56c5-bdc3-850eda6ae4e3', NULL, 'acc5797e-d48b-53ee-a808-9f359f6323b4', 'bdff3452-6099-5556-ba16-1cb8673e726c', 'Nghe đoạn hội thoại 10 và chọn đáp án đúng.', 0, 3, 5, NULL, '/listening-questions/JLPTTestImage.jpg', 1, 'Placeholder đáp án đúng cho bài nghe 10.', 1, NULL, '', 1, NOW(), NOW(), NULL, NULL),
('efd7e4a9-163e-5a63-a96b-84af04e0f265', NULL, '14701068-910b-56db-aa67-117928508847', 'bdff3452-6099-5556-ba16-1cb8673e726c', 'Nghe đoạn hội thoại 11 và chọn đáp án đúng.', 0, 3, 5, NULL, '/listening-questions/JLPTTestImage.jpg', 1, 'Placeholder đáp án đúng cho bài nghe 11.', 1, NULL, '', 1, NOW(), NOW(), NULL, NULL),
('9190b874-3f14-53df-ac43-c73d614e948e', NULL, 'c5f998fb-f7c7-59c8-ad41-a5ee516119f7', 'bdff3452-6099-5556-ba16-1cb8673e726c', 'Nghe đoạn hội thoại 12 và chọn đáp án đúng.', 0, 3, 5, NULL, '/listening-questions/JLPTTestImage.jpg', 1, 'Placeholder đáp án đúng cho bài nghe 12.', 1, NULL, '', 1, NOW(), NOW(), NULL, NULL),
('f11a688f-de1c-59f6-b7fd-1c0e7ddf2d75', NULL, 'd30a9bef-2f1b-56a4-ac98-d921d56d48ca', 'bdff3452-6099-5556-ba16-1cb8673e726c', 'Nghe đoạn hội thoại 13 và chọn đáp án đúng.', 0, 3, 5, NULL, '/listening-questions/JLPTTestImage.jpg', 1, 'Placeholder đáp án đúng cho bài nghe 13.', 1, NULL, '', 1, NOW(), NOW(), NULL, NULL),
('84df2fbb-dba5-5389-91e0-78f4dbe55514', NULL, '029dcc09-b051-59d5-b671-32bc874bc154', 'bdff3452-6099-5556-ba16-1cb8673e726c', 'Nghe đoạn hội thoại 14 và chọn đáp án đúng.', 0, 3, 5, NULL, '/listening-questions/JLPTTestImage.jpg', 1, 'Placeholder đáp án đúng cho bài nghe 14.', 1, NULL, '', 1, NOW(), NOW(), NULL, NULL),
('d5f65a82-e106-50b7-b39b-0d3d31c211bd', NULL, '2be75180-9b30-56a7-9a3d-9d82e7e3d6f3', 'bdff3452-6099-5556-ba16-1cb8673e726c', 'Nghe đoạn hội thoại 15 và chọn đáp án đúng.', 0, 3, 5, NULL, '/listening-questions/JLPTTestImage.jpg', 1, 'Placeholder đáp án đúng cho bài nghe 15.', 1, NULL, '', 1, NOW(), NOW(), NULL, NULL),
('567f4de7-97ae-58c6-ad80-59d9ddd041dd', NULL, '7c488529-8294-579a-b022-65e6a950e545', 'bdff3452-6099-5556-ba16-1cb8673e726c', 'Nghe đoạn hội thoại 16 và chọn đáp án đúng.', 0, 3, 5, NULL, '/listening-questions/JLPTTestImage.jpg', 1, 'Placeholder đáp án đúng cho bài nghe 16.', 1, NULL, '', 1, NOW(), NOW(), NULL, NULL),
('1e2a75ac-ab92-5cea-bdb6-298cc2b5e219', NULL, '652e0b99-b752-58b8-a09f-ecfe0481d043', 'bdff3452-6099-5556-ba16-1cb8673e726c', 'Nghe đoạn hội thoại 17 và chọn đáp án đúng.', 0, 3, 5, NULL, '/listening-questions/JLPTTestImage.jpg', 1, 'Placeholder đáp án đúng cho bài nghe 17.', 1, NULL, '', 1, NOW(), NOW(), NULL, NULL),
('83212584-4c07-56dc-a056-cb42d8faf29c', NULL, '2dfbbe0d-0f4f-5dee-8dff-55512bf489c3', 'bdff3452-6099-5556-ba16-1cb8673e726c', 'Nghe đoạn hội thoại 18 và chọn đáp án đúng.', 0, 3, 5, NULL, '/listening-questions/JLPTTestImage.jpg', 1, 'Placeholder đáp án đúng cho bài nghe 18.', 1, NULL, '', 1, NOW(), NOW(), NULL, NULL),
('02d977b7-6696-5e88-aef0-88fe34f79797', NULL, '12e225ba-f3bd-54f9-85e4-1e52bbdad8b7', 'bdff3452-6099-5556-ba16-1cb8673e726c', 'Nghe đoạn hội thoại 19 và chọn đáp án đúng.', 0, 3, 5, NULL, '/listening-questions/JLPTTestImage.jpg', 1, 'Placeholder đáp án đúng cho bài nghe 19.', 1, NULL, '', 1, NOW(), NOW(), NULL, NULL),
('98abf35d-9c36-57a5-9ce7-59500a59a1f5', NULL, '39c303ce-8e05-5f51-aaf9-308cc4c6f0c9', 'bdff3452-6099-5556-ba16-1cb8673e726c', 'Nghe đoạn hội thoại 20 và chọn đáp án đúng.', 0, 3, 5, NULL, '/listening-questions/JLPTTestImage.jpg', 1, 'Placeholder đáp án đúng cho bài nghe 20.', 1, NULL, '', 1, NOW(), NOW(), NULL, NULL);

-- 6. ANSWERS: đáp án đầu tiên của mỗi câu là đáp án đúng
INSERT INTO public."Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES
('caa9bb8c-6ce8-5e2d-a98b-e9fdb76fb06f', 'eb5cca3b-0065-5408-ad17-80cbb390811f', 'ほん', true),
('00a4bbb2-f9c5-57b1-8dbb-a4c19babaf74', 'eb5cca3b-0065-5408-ad17-80cbb390811f', 'やま', false),
('ccd29e82-17b3-5c46-a9d5-d826f6723d11', 'eb5cca3b-0065-5408-ad17-80cbb390811f', 'ひと', false),
('e5266770-7ee6-520b-94c9-9acbe46c00f6', 'eb5cca3b-0065-5408-ad17-80cbb390811f', 'みず', false),
('2c5f8326-24ab-57f0-a718-91d3c5f3f728', '7621c0bf-eeaf-50b2-856b-e9a1f80013bf', 'がっこう', true),
('4470b217-b088-551d-b4a7-208531849443', '7621c0bf-eeaf-50b2-856b-e9a1f80013bf', 'がくせい', false),
('fcff7269-32b7-564c-89dd-b76657fee488', '7621c0bf-eeaf-50b2-856b-e9a1f80013bf', 'せんせい', false),
('ec72b0c2-b9e2-540e-93fb-a72d2035e21d', '7621c0bf-eeaf-50b2-856b-e9a1f80013bf', 'かいしゃ', false),
('e4b88949-5562-5a0d-b4c1-c53b01997e9a', '5469a658-25a7-5c72-92c8-ce9e22650995', 'nước', true),
('c796d31a-5344-5dbb-a1d5-b64c13d92815', '5469a658-25a7-5c72-92c8-ce9e22650995', 'lửa', false),
('24610069-055d-5ea3-8789-3dd59746e6db', '5469a658-25a7-5c72-92c8-ce9e22650995', 'sách', false),
('bf408485-6d8d-5219-8e5b-6cd84931965d', '5469a658-25a7-5c72-92c8-ce9e22650995', 'người', false),
('d2f6831f-6230-53ac-aca9-79f3cdeebe48', '28c14c41-21e9-5f7b-9207-d6158ef42a5f', 'あした', true),
('6c6067d4-fbce-5155-b8c9-f8ba269778e7', '28c14c41-21e9-5f7b-9207-d6158ef42a5f', 'きのう', false),
('669d8107-30cc-5252-b022-0691e12428e4', '28c14c41-21e9-5f7b-9207-d6158ef42a5f', 'きょう', false),
('6a10c0e4-649b-56fa-bf06-6169fd43b595', '28c14c41-21e9-5f7b-9207-d6158ef42a5f', 'まいにち', false),
('8df159d4-c356-5aba-b0ec-641ca0665f43', '8fdb5ce0-a1f8-5ef6-b5c8-71d943e1b3f4', 'tàu điện', true),
('4c2a35af-0435-56de-8c41-e00e3e1f4334', '8fdb5ce0-a1f8-5ef6-b5c8-71d943e1b3f4', 'xe đạp', false),
('a50b008f-5ee2-503a-8ffb-5dbf88bd51fa', '8fdb5ce0-a1f8-5ef6-b5c8-71d943e1b3f4', 'máy bay', false),
('9a454706-ef0f-5760-9200-16547315abcb', '8fdb5ce0-a1f8-5ef6-b5c8-71d943e1b3f4', 'nhà ga', false),
('03c51e06-c4ed-5ea5-a87c-a68efafaa9e7', 'adf593d3-abb9-597c-97d9-08b6fe739f74', 'bạn bè', true),
('d6cda8ad-cfbe-5ffc-8703-b0eafd3e6a17', 'adf593d3-abb9-597c-97d9-08b6fe739f74', 'giáo viên', false),
('ec0e18d9-c83b-5402-9eae-c0b97f4a9a71', 'adf593d3-abb9-597c-97d9-08b6fe739f74', 'học sinh', false),
('ab487e20-eb5a-5b83-8e88-ef5ab0f3ed0d', 'adf593d3-abb9-597c-97d9-08b6fe739f74', 'gia đình', false),
('e967da79-f040-5492-b971-19b9cd668225', '49e47085-a830-5e65-87d2-68e03d535c6f', 'ăn', true),
('88d460d6-17b5-58cc-96d9-3af2b03392c2', '49e47085-a830-5e65-87d2-68e03d535c6f', 'uống', false),
('14646d8f-b186-5d9c-974f-29e8488b97e2', '49e47085-a830-5e65-87d2-68e03d535c6f', 'đọc', false),
('ce75bb60-2a1b-5d7a-9a9f-ceaa180a9412', '49e47085-a830-5e65-87d2-68e03d535c6f', 'nghe', false),
('6f1ad21e-88e1-5f61-b34c-ae1cc48c7f4b', '4edf3654-7d30-5333-983c-1c19601cf244', 'uống', true),
('c5bf26b5-85b3-51c6-ac55-0333b2ec28b6', '4edf3654-7d30-5333-983c-1c19601cf244', 'đi', false),
('d4bd7e5b-33fd-524c-942f-e6e02116a91e', '4edf3654-7d30-5333-983c-1c19601cf244', 'xem', false),
('3f75471e-f4ef-52d2-8170-7eabf39371fa', '4edf3654-7d30-5333-983c-1c19601cf244', 'viết', false),
('390b184f-950a-5d04-bde3-69d0da2f9685', 'bb254cfb-64dc-51f5-8a24-9d53e3e4656e', 'to/lớn', true),
('c4aeea1c-e9b4-5295-9e03-3353b618306b', 'bb254cfb-64dc-51f5-8a24-9d53e3e4656e', 'nhỏ', false),
('24c511f8-6a41-5b35-8e54-42557e644035', 'bb254cfb-64dc-51f5-8a24-9d53e3e4656e', 'mới', false),
('d137519d-e935-5264-8f98-79b644837f10', 'bb254cfb-64dc-51f5-8a24-9d53e3e4656e', 'rẻ', false),
('3ae77913-6e64-5538-9bb8-3307e6b08b00', 'f5985592-2ba6-5ded-8a0c-ae79406ef161', 'rẻ', true),
('8bbf9991-6312-5db2-bbd3-6f1215c51782', 'f5985592-2ba6-5ded-8a0c-ae79406ef161', 'đắt', false),
('f556e80d-ea14-5c00-94f6-b9f9067a9243', 'f5985592-2ba6-5ded-8a0c-ae79406ef161', 'cao', false),
('671e4fef-60be-5905-8247-47da088ba0a1', 'f5985592-2ba6-5ded-8a0c-ae79406ef161', 'xa', false),
('53808264-58ec-51fc-a86c-3e6070ef4a30', 'f840f31e-a39a-5c55-b7c2-ce60c88790d8', 'えき', true),
('3e32f4c2-abb7-5431-9d2d-ebba33e85b17', 'f840f31e-a39a-5c55-b7c2-ce60c88790d8', 'いえ', false),
('4231ce14-222f-5680-9fb5-01986d0f25eb', 'f840f31e-a39a-5c55-b7c2-ce60c88790d8', 'みせ', false),
('ab28d379-128b-5ed9-b42d-eccd959dcea0', 'f840f31e-a39a-5c55-b7c2-ce60c88790d8', 'へや', false),
('0c7464c6-f960-50ff-a66d-9d6e48385033', '16b861fb-2ca5-59b5-8499-b67a6ebae9a4', 'mỗi ngày', true),
('98f1efa2-df8d-5e36-ba39-a432123c117e', '16b861fb-2ca5-59b5-8499-b67a6ebae9a4', 'mỗi tuần', false),
('34fa98dc-e793-584c-a1b2-cfddc3d2054f', '16b861fb-2ca5-59b5-8499-b67a6ebae9a4', 'hôm qua', false),
('753850f8-a30f-5fbe-b09e-bbd243e10952', '16b861fb-2ca5-59b5-8499-b67a6ebae9a4', 'ngày mai', false),
('257f30be-e3ee-5483-b106-ebbc4d0b3d1a', '7c156578-6201-56fe-a62d-3eb128a3052e', 'みぎ', true),
('d681bc82-2e8c-5215-b450-748500816353', '7c156578-6201-56fe-a62d-3eb128a3052e', 'ひだり', false),
('464c6076-ea09-5a94-bce5-9b84f257a029', '7c156578-6201-56fe-a62d-3eb128a3052e', 'うえ', false),
('e568c779-01aa-5f9f-9481-d577a12484d8', '7c156578-6201-56fe-a62d-3eb128a3052e', 'した', false),
('864b4b41-7a32-5d71-8bdf-c01eb457b8b3', 'db339b39-4ed8-50a9-a187-226fd9958f98', 'buổi sáng/trước trưa', true),
('3930497e-93ed-5b3d-91db-188a44b3e17d', 'db339b39-4ed8-50a9-a187-226fd9958f98', 'buổi tối', false),
('ce33938b-2104-5ce5-8df2-a66a2222c1a7', 'db339b39-4ed8-50a9-a187-226fd9958f98', 'sau trưa', false),
('c173001d-e41e-505a-a4b4-b23b2dab4e05', 'db339b39-4ed8-50a9-a187-226fd9958f98', 'cuối tuần', false),
('e3727846-c7a7-5761-939e-2cb05e98d2a4', '4b113a3b-cf63-5bed-ad0f-090270bc7d1b', 'なまえ', true),
('60e885d0-6319-5468-a682-ace933aaa736', '4b113a3b-cf63-5bed-ad0f-090270bc7d1b', 'せんせい', false),
('2d1c4272-cb40-5fdd-86f1-bfddbde361fc', '4b113a3b-cf63-5bed-ad0f-090270bc7d1b', 'でんわ', false),
('0485ef67-5ee7-5c88-8c9e-57bdce669c4d', '4b113a3b-cf63-5bed-ad0f-090270bc7d1b', 'くるま', false),
('96751046-7d7f-5755-beb4-80c221448425', '6ccc07f6-0d10-56e7-8871-8c54e487396a', 'は', true),
('570be31c-0369-56c0-ba8f-e230cb86acdd', '6ccc07f6-0d10-56e7-8871-8c54e487396a', 'を', false),
('6cb5fbea-6b37-50ca-9ff3-eef2bbfec2b6', '6ccc07f6-0d10-56e7-8871-8c54e487396a', 'で', false),
('d258d32a-07f2-5e5b-9569-2dc9bc410c78', '6ccc07f6-0d10-56e7-8871-8c54e487396a', 'に', false),
('40beccb3-a281-5ec2-8c24-d538e293dd7e', 'a85508e0-2215-5fc0-aa6c-33c4d820d0c7', 'へ', true),
('63a37ea4-b490-5d94-a13e-6851dc959e2e', 'a85508e0-2215-5fc0-aa6c-33c4d820d0c7', 'を', false),
('a3bb7151-4417-53d3-81d4-9ed7d7c1f9b1', 'a85508e0-2215-5fc0-aa6c-33c4d820d0c7', 'が', false),
('0185b888-0bd3-5a84-abf7-d631093469ae', 'a85508e0-2215-5fc0-aa6c-33c4d820d0c7', 'と', false),
('bae57a71-debc-5fc4-9561-42b6ebbb00bd', 'a04de25d-4937-584a-a0af-817e879c8178', 'を', true),
('741f0c09-f29d-5d9f-b557-bda0a15fd63c', 'a04de25d-4937-584a-a0af-817e879c8178', 'に', false),
('a9fb8eb3-fbe2-520a-a613-ebe918407f97', 'a04de25d-4937-584a-a0af-817e879c8178', 'で', false),
('33baa3c2-db11-5a02-adc4-481ef34ecbb5', 'a04de25d-4937-584a-a0af-817e879c8178', 'は', false),
('32f3621e-98a4-5ee0-81d2-d7129a823c2c', '9ee0c25d-75c5-515e-a90f-90f8b9fbf7b0', 'で', true),
('b75197d5-7e99-50dd-97e3-95f0449b1aab', '9ee0c25d-75c5-515e-a90f-90f8b9fbf7b0', 'に', false),
('ee39c919-54d3-5b9e-a3d9-a8301d233319', '9ee0c25d-75c5-515e-a90f-90f8b9fbf7b0', 'を', false),
('61f8b155-9c1d-507a-9862-c52562bf38d7', '9ee0c25d-75c5-515e-a90f-90f8b9fbf7b0', 'が', false),
('9ebbdcbd-7e9a-547b-95d4-cb018d7b0389', '82578b24-9ca1-50c6-8501-2a840945b3d8', 'が', true),
('eb84e2a3-ab1a-5501-9401-a312b7abea10', '82578b24-9ca1-50c6-8501-2a840945b3d8', 'を', false),
('a39b1c82-1681-5d8a-be86-04c5bbb6ff12', '82578b24-9ca1-50c6-8501-2a840945b3d8', 'で', false),
('c8909dd5-4432-5de4-99f7-05b77e8cce47', '82578b24-9ca1-50c6-8501-2a840945b3d8', 'へ', false),
('61956046-ee30-5377-b420-813a76cfe678', '9a9577ac-e486-5c27-9504-c35c50bfc7ac', 'の', true),
('5c14512d-1f67-5d2f-8070-c4e649dc8ccb', '9a9577ac-e486-5c27-9504-c35c50bfc7ac', 'は', false),
('4f34f1e5-d104-59c4-bc22-2ca69a89618b', '9a9577ac-e486-5c27-9504-c35c50bfc7ac', 'を', false),
('5ff4e407-17a1-597e-b773-27369e3bae3f', '9a9577ac-e486-5c27-9504-c35c50bfc7ac', 'で', false),
('5be0cef2-34ea-5491-a05c-22ffbd9b8d47', 'dfaef71e-1a9a-5a97-b175-7277b3d387c5', 'に', true),
('f994e781-5526-52a8-85d9-0221135bece8', 'dfaef71e-1a9a-5a97-b175-7277b3d387c5', 'を', false),
('f743703f-cea9-543f-b6d1-fd30ad13584c', 'dfaef71e-1a9a-5a97-b175-7277b3d387c5', 'が', false),
('ac61c81d-7f85-5bf8-9307-f2700d86c8d6', 'dfaef71e-1a9a-5a97-b175-7277b3d387c5', 'で', false),
('203c01d1-15f5-51a4-b0bb-517a51326e95', '829d57c5-4fa7-59e5-8031-7a9d14bacf1e', 'と', true),
('5693b47a-fe20-5147-8e86-6c43616c572b', '829d57c5-4fa7-59e5-8031-7a9d14bacf1e', 'を', false),
('05fd0557-b280-5990-a829-200186288f5a', '829d57c5-4fa7-59e5-8031-7a9d14bacf1e', 'に', false),
('26802464-1104-59cf-822b-b48f5269c653', '829d57c5-4fa7-59e5-8031-7a9d14bacf1e', 'は', false),
('e06b9f09-8ca7-59cc-b852-d6324645e890', '4218414e-e920-5531-9a19-50b2b45b977b', 'と', true),
('df1a13ec-77ed-5611-afc8-6e34abd99d5d', '4218414e-e920-5531-9a19-50b2b45b977b', 'を', false),
('d0cfca67-c987-5bb9-b539-7fc735038dcb', '4218414e-e920-5531-9a19-50b2b45b977b', 'に', false),
('21665974-47ef-553a-a27f-31535c59fd1f', '4218414e-e920-5531-9a19-50b2b45b977b', 'で', false),
('85d7fb90-a04b-5418-9a77-9af2dcc77793', '3e7a61a8-84a7-59f2-9f08-1675e9b792b3', 'ない', true),
('59a0779a-9f26-5751-9b78-ca1264447abc', '3e7a61a8-84a7-59f2-9f08-1675e9b792b3', 'なく', false),
('8a8589fc-5f19-5fda-bbff-64d8d24f204b', '3e7a61a8-84a7-59f2-9f08-1675e9b792b3', 'ません', false),
('fdf8db73-1d79-52b2-86a9-1a838c442ea0', '3e7a61a8-84a7-59f2-9f08-1675e9b792b3', 'では', false),
('ee2daedf-4493-59d2-8b98-891295dc6bc7', '750d4d19-eb61-5988-bb36-c2317f5fcc3c', 'ました', true),
('6cb94e2f-b85d-514f-b3ce-a7db2a3e1adb', '750d4d19-eb61-5988-bb36-c2317f5fcc3c', 'ます', false),
('fce92c30-4634-5b14-8a98-27572c17ba85', '750d4d19-eb61-5988-bb36-c2317f5fcc3c', 'ません', false),
('dbaf8db5-e5a5-5062-b1e8-f32881de1fb1', '750d4d19-eb61-5988-bb36-c2317f5fcc3c', 'です', false),
('a531a27d-176d-5749-b927-187a153546f1', '411e7e70-8875-599c-8fb9-4bbc7e9e3865', 'ください', true),
('81fff2fb-4012-53b1-93e0-aadb3e4d1a5a', '411e7e70-8875-599c-8fb9-4bbc7e9e3865', 'です', false),
('71b059db-a61a-5643-9c3e-e55dfb557f73', '411e7e70-8875-599c-8fb9-4bbc7e9e3865', 'ます', false),
('83f01726-1241-55f8-88f0-361e2d3ef45a', '411e7e70-8875-599c-8fb9-4bbc7e9e3865', 'でした', false),
('8cf5c66e-cf0b-5881-aa02-ad4a7e1e1419', '367c24bc-66ce-5de6-8eee-b8a11b44a77f', 'が', true),
('6ab12c10-1647-5d5f-b336-d112b87be857', '367c24bc-66ce-5de6-8eee-b8a11b44a77f', 'を', false),
('9c883217-b79a-536b-95e8-bd9f4cf7743d', '367c24bc-66ce-5de6-8eee-b8a11b44a77f', 'で', false),
('b1ddc4ab-d8cd-5782-beab-902bbfc1d3d4', '367c24bc-66ce-5de6-8eee-b8a11b44a77f', 'へ', false),
('865c17dc-ea8b-545d-832f-9705a7b79050', '7aec7f7e-79e6-5843-9b90-f8010439332e', 'です', true),
('d538f697-ca15-5ce7-8577-dfc7be6680f2', '7aec7f7e-79e6-5843-9b90-f8010439332e', 'ます', false),
('2a7fb2a9-d9eb-5582-9673-ee2f95ae08f8', '7aec7f7e-79e6-5843-9b90-f8010439332e', 'ました', false),
('60684165-f572-5abb-8c1c-b9cae661e6ac', '7aec7f7e-79e6-5843-9b90-f8010439332e', 'ありません', false),
('d49452d5-96e2-5ae2-b54c-8c98ce5259cb', 'ab670466-d23e-5f7e-90d8-e2d63fc49da7', 'に', true),
('4a7be37c-826e-5586-9c85-074f4937ae1f', 'ab670466-d23e-5f7e-90d8-e2d63fc49da7', 'を', false),
('dba58419-01e5-5812-9de0-3e69c0b34540', 'ab670466-d23e-5f7e-90d8-e2d63fc49da7', 'で', false),
('5672d2bd-ba6d-5f9c-a6a4-d0350a10f772', 'ab670466-d23e-5f7e-90d8-e2d63fc49da7', 'が', false),
('231b1360-8bb5-5238-8ed0-9b9dbe6b2bde', '54f24e33-3ad1-588b-836f-f93e5f0af4bf', 'người', true),
('f36df114-8ef5-579e-a421-65985e4178ef', '54f24e33-3ad1-588b-836f-f93e5f0af4bf', 'ngày', false),
('0a496ba7-3457-5bdc-987c-f8133e6e6db0', '54f24e33-3ad1-588b-836f-f93e5f0af4bf', 'sách', false),
('868cb934-7a2b-5f64-8385-cd2e1a085177', '54f24e33-3ad1-588b-836f-f93e5f0af4bf', 'nước', false),
('f833eaf7-84bb-5282-b3ec-e562b2285a9b', '4e56550d-ee60-5aab-856e-3ec6d6054051', 'ngày/mặt trời', true),
('90e0ed64-f9d4-5b04-b0a3-22754f10fa4a', '4e56550d-ee60-5aab-856e-3ec6d6054051', 'tháng', false),
('aaffc142-6b07-59ff-8487-571ab598031b', '4e56550d-ee60-5aab-856e-3ec6d6054051', 'lửa', false),
('4cd1a2fc-aad4-5703-a4e4-f225eddd15c8', '4e56550d-ee60-5aab-856e-3ec6d6054051', 'cây', false),
('ca4868d2-b0c6-5449-8b2a-9ea386449593', 'f29910fa-f258-5636-bd00-6e8e3a435edd', 'tháng/mặt trăng', true),
('a6813fb5-a1a8-55f5-91ca-e8a9e30e6af5', 'f29910fa-f258-5636-bd00-6e8e3a435edd', 'năm', false),
('1158edcd-d111-5b2b-98fe-a117a76106c5', 'f29910fa-f258-5636-bd00-6e8e3a435edd', 'nước', false),
('524093e6-d4b4-592c-882d-b7ac9679c31c', 'f29910fa-f258-5636-bd00-6e8e3a435edd', 'núi', false),
('83b77698-3c31-59bf-bd81-829366d04adf', '09d66d9c-4650-58e8-8e87-28ee67f3b09b', 'lửa', true),
('1a673067-2aa8-5429-8878-3f48d6192615', '09d66d9c-4650-58e8-8e87-28ee67f3b09b', 'nước', false),
('c2217b73-1cf7-5d0b-b207-d9ee427e0586', '09d66d9c-4650-58e8-8e87-28ee67f3b09b', 'đất', false),
('8e8afa3b-4021-513a-9897-7fd42da79e97', '09d66d9c-4650-58e8-8e87-28ee67f3b09b', 'tiền', false),
('94d07bf8-1b57-587d-807e-360727dc0eb0', 'c393bcf4-5e1c-57ac-b396-a16adbc806b8', 'nước', true),
('efec1b51-176b-54fe-b951-f35259ed1387', 'c393bcf4-5e1c-57ac-b396-a16adbc806b8', 'lửa', false),
('ee6c4a87-5565-580c-a30c-49096ccc2f2a', 'c393bcf4-5e1c-57ac-b396-a16adbc806b8', 'người', false),
('729d565b-9602-564e-8045-8a4a55f3f221', 'c393bcf4-5e1c-57ac-b396-a16adbc806b8', 'xe', false),
('0fb5765b-4975-5c26-b079-93baa76c17e6', 'ee2a8815-9172-5c42-8c62-9c51837b69f4', 'cây', true),
('4ca81928-187c-56d9-8843-357188852b21', 'ee2a8815-9172-5c42-8c62-9c51837b69f4', 'sách', false),
('0ad72704-220d-5097-806d-f1e055113364', 'ee2a8815-9172-5c42-8c62-9c51837b69f4', 'trường', false),
('240e77ad-6576-5d8a-bedb-479edfbffa93', 'ee2a8815-9172-5c42-8c62-9c51837b69f4', 'điện', false),
('5a118410-fc8b-517c-a89f-3761d74bb078', '34806753-cdb1-5b99-8a6f-56cdd90e3f5e', 'núi', true),
('9e79dfa3-8a04-5336-89b8-aa324d720491', '34806753-cdb1-5b99-8a6f-56cdd90e3f5e', 'sông', false),
('4b79eddf-aa0d-5f95-9868-e3a3db12eec8', '34806753-cdb1-5b99-8a6f-56cdd90e3f5e', 'biển', false),
('32eae827-a155-5faa-80fd-6f6bd81e4793', '34806753-cdb1-5b99-8a6f-56cdd90e3f5e', 'đường', false),
('8a45917b-ff4f-5b64-a98b-d413bd8dd3e7', 'cc55919d-6aac-5f03-9f90-867aa5d733f7', 'sông', true),
('f4a12a28-f0ff-5644-8a92-78b5ae9bd180', 'cc55919d-6aac-5f03-9f90-867aa5d733f7', 'núi', false),
('36e4f882-0fa2-503c-a181-d0cf6ae30d7a', 'cc55919d-6aac-5f03-9f90-867aa5d733f7', 'mưa', false),
('df59d1c0-fc9c-5684-84ad-e40d45154498', 'cc55919d-6aac-5f03-9f90-867aa5d733f7', 'cửa', false),
('044a405d-0cff-5865-b829-d8a6da4b6a27', 'dde2dd8e-fec0-51c7-add7-8998d642bbf7', 'ruộng', true),
('e0898c5b-ba9d-5cfd-aba1-a15993c1c224', 'dde2dd8e-fec0-51c7-add7-8998d642bbf7', 'người', false),
('7b79e841-6add-537d-abf6-7e4a74f5de5f', 'dde2dd8e-fec0-51c7-add7-8998d642bbf7', 'miệng', false),
('a75ed8c5-e9fe-5094-9da6-48adf7f1a0c7', 'dde2dd8e-fec0-51c7-add7-8998d642bbf7', 'trời', false),
('c72219fd-6e46-58e6-b230-3cdff10c3584', '1ca9207b-f20c-5d4a-a76f-493f6a142c87', 'miệng', true),
('5d6dfe2a-90a8-5b49-a8f0-22552b212885', '1ca9207b-f20c-5d4a-a76f-493f6a142c87', 'mắt', false),
('39e21a58-dc8f-54cf-bbea-612dfe0d8b81', '1ca9207b-f20c-5d4a-a76f-493f6a142c87', 'tai', false),
('2ad9900f-61bb-54a9-9de4-d0f3407bebbd', '1ca9207b-f20c-5d4a-a76f-493f6a142c87', 'tay', false),
('0521afe2-4af1-5ee9-871e-5830051d20d2', '786b30fb-8f9a-5bfb-8735-663a25136888', 'mắt', true),
('4bad80bd-a297-552e-8a29-4a67fa1f9755', '786b30fb-8f9a-5bfb-8735-663a25136888', 'tai', false),
('8ffc4180-9baf-5e32-8844-2f38973dae65', '786b30fb-8f9a-5bfb-8735-663a25136888', 'chân', false),
('3d63e195-ed22-5edf-be41-168ad8b33672', '786b30fb-8f9a-5bfb-8735-663a25136888', 'tay', false),
('a4146761-e2c4-5416-917b-8431294de44c', '85a9ff76-6d39-5080-9d3e-af070746336d', 'tai', true),
('31bfa8e7-a5eb-579d-935a-62a88fcbc9c0', '85a9ff76-6d39-5080-9d3e-af070746336d', 'mắt', false),
('31b560ad-c4e0-5308-bb65-a7376ed87080', '85a9ff76-6d39-5080-9d3e-af070746336d', 'miệng', false),
('6c914618-7da8-5f58-841e-8ff5d7665105', '85a9ff76-6d39-5080-9d3e-af070746336d', 'đầu', false),
('368d51aa-d3fc-5018-8b52-5d2540f59e83', 'ac1b2b00-3237-5a5e-b2bd-234f23a11ddd', 'tay', true),
('303b4a05-a9d8-55eb-9c74-7506de461e9a', 'ac1b2b00-3237-5a5e-b2bd-234f23a11ddd', 'chân', false),
('ef6d348a-bc2c-506b-8d71-0e6a6fbfe3f1', 'ac1b2b00-3237-5a5e-b2bd-234f23a11ddd', 'tai', false),
('2e3ae297-c37f-551c-b0a2-7b4392a29674', 'ac1b2b00-3237-5a5e-b2bd-234f23a11ddd', 'mắt', false),
('ab1671ec-f0d8-5189-bc74-6ae2e8255963', '0049db6e-0a9e-5b0e-ad0a-ccefc982fa53', 'chân', true),
('7de951be-f1bd-590e-9d36-b48580a7f6b8', '0049db6e-0a9e-5b0e-ad0a-ccefc982fa53', 'tay', false),
('bda9c9b0-844f-520b-aae4-8d1bb4a7d162', '0049db6e-0a9e-5b0e-ad0a-ccefc982fa53', 'mắt', false),
('92d55157-aa11-5897-b185-3ec96043e2ae', '0049db6e-0a9e-5b0e-ad0a-ccefc982fa53', 'tai', false),
('4251d561-0efd-5d1c-8cce-e1ea2a595ab9', '53f168bc-a364-5951-821b-0173637b0625', 'xe', true),
('3afcdd13-88f5-535c-9b17-255207d57ca2', '53f168bc-a364-5951-821b-0173637b0625', 'sách', false),
('b3a143cd-b4fb-5cfd-b449-377f99a82306', '53f168bc-a364-5951-821b-0173637b0625', 'trường', false),
('2ddbe823-9b5b-54ff-a34c-0fa9ae472616', '53f168bc-a364-5951-821b-0173637b0625', 'tiền', false),
('65156978-7f68-53d6-8ecb-4081324a2815', 'bfede2c1-5f1c-577d-a63a-7e89a6760186', '六時', true),
('74b38967-bc2d-59d9-a1e9-ab9d65363e81', 'bfede2c1-5f1c-577d-a63a-7e89a6760186', '七時', false),
('bdd6ad4b-c960-5c84-b5a0-8c52b8fa523c', 'bfede2c1-5f1c-577d-a63a-7e89a6760186', '八時', false),
('551d7591-733b-5d9f-aaca-aee5eb8cef89', 'bfede2c1-5f1c-577d-a63a-7e89a6760186', '四時', false),
('ccba2114-24b3-5592-bfde-83a4ab22b8c7', '73fb6582-d96e-5e0a-8c90-f9556a5ec4da', '学校', true),
('eefe667b-f03e-5cfb-aecc-6110f26cb800', '73fb6582-d96e-5e0a-8c90-f9556a5ec4da', '家', false),
('841c90bf-ec78-5150-9d2a-8508d6becaa5', '73fb6582-d96e-5e0a-8c90-f9556a5ec4da', '駅', false),
('57600846-506d-5b2a-be33-c5bcbb0033d9', '73fb6582-d96e-5e0a-8c90-f9556a5ec4da', 'レストラン', false),
('8fde9207-8b49-5d62-8265-5daed5d376b4', '6eae996f-c4ad-5b7f-acf2-e983fc869b5b', '家へ帰ります', true),
('213fd98f-0275-5120-adb7-1ad9b1c138ad', '6eae996f-c4ad-5b7f-acf2-e983fc869b5b', '朝ごはんを食べます', false),
('b8bf50f7-bb4f-5481-95df-49f5ca29c91d', '6eae996f-c4ad-5b7f-acf2-e983fc869b5b', '学校へ行きます', false),
('e6a853a4-932a-5032-9f39-d32c7ef4e4e3', '6eae996f-c4ad-5b7f-acf2-e983fc869b5b', '映画を見ます', false),
('eb8ecdaa-ff41-5a61-b78a-dbc7007b74f6', 'b3f00191-6b19-5f58-bebf-38edc5fce795', '友だち', true),
('64668ed3-531d-5ef7-b397-d743572e7b63', 'b3f00191-6b19-5f58-bebf-38edc5fce795', '先生', false),
('184d636e-8c0c-55e4-8895-c082333ab63f', 'b3f00191-6b19-5f58-bebf-38edc5fce795', '家族', false),
('e89dce93-fc80-5048-be36-4545f89d0315', 'b3f00191-6b19-5f58-bebf-38edc5fce795', '学生', false),
('d019be95-dd40-5ae1-b5c9-bcdf6e5b4e72', '8edf76ed-f55a-5e54-9ba1-556c4e2c4591', '電車', true),
('6a1f1548-7e9d-5906-949b-8db9d21ba5de', '8edf76ed-f55a-5e54-9ba1-556c4e2c4591', '車', false),
('8ce38b66-8712-5e68-9d1b-e2a1de65ca63', '8edf76ed-f55a-5e54-9ba1-556c4e2c4591', '自転車', false),
('52c0d6a1-8d8f-5e70-a3dc-ace33130ca64', '8edf76ed-f55a-5e54-9ba1-556c4e2c4591', 'バス', false),
('a452ca05-d8ab-5f13-8189-1b5950a20cfe', '5c30e54d-c10a-56df-a3f8-0352eae99919', '映画', true),
('9c278365-4bc3-578f-a158-3ef4d7371f6c', '5c30e54d-c10a-56df-a3f8-0352eae99919', '本', false),
('c8e7bdd3-2db3-5186-aca3-b9c2b3fa37f0', '5c30e54d-c10a-56df-a3f8-0352eae99919', '学校', false),
('2d75c62e-d5d3-5789-96a4-7a72fd4f3326', '5c30e54d-c10a-56df-a3f8-0352eae99919', '山', false),
('b42c5814-bfdd-5205-ab67-c270d3376cb3', 'abe20793-92e1-57cd-b304-6c733cae6c28', 'Hôm nay nóng.', true),
('8f33b13f-8c23-54b6-903a-011014cab8a3', 'abe20793-92e1-57cd-b304-6c733cae6c28', 'Hôm qua lạnh.', false),
('d061876b-408c-561d-ad7c-9430511e98fa', 'abe20793-92e1-57cd-b304-6c733cae6c28', 'Ngày mai mưa.', false),
('7ae1fadc-40e5-56c5-822b-11fade19e3bc', 'abe20793-92e1-57cd-b304-6c733cae6c28', 'Hôm nay rẻ.', false),
('7a38b075-fd33-5b4c-8bdc-e76f04746e70', '21bdcfa0-c722-5230-996b-4299a28206ec', '日本語', true),
('4941b78b-c14e-5343-ba58-df2b866d6de8', '21bdcfa0-c722-5230-996b-4299a28206ec', '英語', false),
('30ad9ec1-7a46-5bad-9c85-2f4f6c4fdf90', '21bdcfa0-c722-5230-996b-4299a28206ec', '数学', false),
('bcf12b4e-54ed-564f-993d-292dbc658eda', '21bdcfa0-c722-5230-996b-4299a28206ec', '音楽', false),
('f63b7102-e712-5fec-9bf3-47e19f98451c', '4f2df790-e1df-5dd9-aaa2-6f5366573878', '駅の前', true),
('dbb0e873-b23d-5b18-96ad-7732a649c330', '4f2df790-e1df-5dd9-aaa2-6f5366573878', '学校の中', false),
('4b1af4ca-97a3-5342-84ca-7b36bf475ed6', '4f2df790-e1df-5dd9-aaa2-6f5366573878', '家の後ろ', false),
('d14c2e96-c840-5b84-b244-dbac0bff45f7', '4f2df790-e1df-5dd9-aaa2-6f5366573878', '図書館の右', false),
('1a0ae7f5-0afb-58db-a8e3-8d3ac78d89cb', '2340a85c-1983-508b-8539-4b7d3546e268', 'おもしろい', true),
('62a72352-222f-539f-b3a4-37cb11e65403', '2340a85c-1983-508b-8539-4b7d3546e268', '高い', false),
('f930fb5f-4440-532b-aab5-e45eaabdc14c', '2340a85c-1983-508b-8539-4b7d3546e268', '古い', false),
('c0302f41-a980-5e6f-9d12-2a4878da7cdd', '2340a85c-1983-508b-8539-4b7d3546e268', '静か', false),
('11a6ce7a-264e-5c21-afed-30abffd546ea', '8f69ee4e-b869-5f25-92cb-600e1458c176', 'A', true),
('0161817e-1856-51a0-a838-891d4beba6a9', '8f69ee4e-b869-5f25-92cb-600e1458c176', 'B', false),
('71294ae0-2e27-5bcb-b10e-494b659102ec', '8f69ee4e-b869-5f25-92cb-600e1458c176', 'C', false),
('31f65e8c-2240-55d9-84f1-20e9e88160bb', '8f69ee4e-b869-5f25-92cb-600e1458c176', 'D', false),
('b47097c4-f28e-501c-bfad-ff57662ae2c3', '914e8f71-087e-580f-ab57-040874351cb5', 'A', true),
('a8777f5b-c502-5fe8-83ca-26f49a185b61', '914e8f71-087e-580f-ab57-040874351cb5', 'B', false),
('1e508647-8c7a-5dbf-910f-0af3c10fd4d3', '914e8f71-087e-580f-ab57-040874351cb5', 'C', false),
('707edd7b-db59-5e19-9490-d2b03ca6f0aa', '914e8f71-087e-580f-ab57-040874351cb5', 'D', false),
('634f83df-11d2-5043-aebc-63b7e6a8f260', '67179377-5910-5cbd-b597-3444f1b312da', 'A', true),
('843c78c6-a14e-5109-8e38-973ce1f40fee', '67179377-5910-5cbd-b597-3444f1b312da', 'B', false),
('9e62c448-8274-5a2e-9341-2d207eb4cd82', '67179377-5910-5cbd-b597-3444f1b312da', 'C', false),
('7de7e34c-27d9-58e8-8582-83b40e212241', '67179377-5910-5cbd-b597-3444f1b312da', 'D', false),
('79883088-ef7a-532d-b1cd-01e4d632e97f', '4543dc08-996e-535c-88f2-1569f0332d8e', 'A', true),
('5048cea7-0db8-5a9e-bb3a-17b66126b0ff', '4543dc08-996e-535c-88f2-1569f0332d8e', 'B', false),
('16520b0b-7678-5dd2-9091-47f36fdb34af', '4543dc08-996e-535c-88f2-1569f0332d8e', 'C', false),
('398261bd-470e-5a3f-931f-da69e605f951', '4543dc08-996e-535c-88f2-1569f0332d8e', 'D', false),
('784468fb-e827-5586-b6c3-b5dff908fcd1', '9d8aea1a-2f07-5ab8-8f8a-08bb17f5a156', 'A', true),
('a231029c-6d81-52f5-9dba-e9b490cc858e', '9d8aea1a-2f07-5ab8-8f8a-08bb17f5a156', 'B', false),
('5fa430db-55c5-56d4-8f5f-b6efe28fb1b2', '9d8aea1a-2f07-5ab8-8f8a-08bb17f5a156', 'C', false),
('8a1c06c1-087f-5041-84f7-765486f57829', '9d8aea1a-2f07-5ab8-8f8a-08bb17f5a156', 'D', false),
('5991cec8-d295-5d82-bfa8-de4314e36381', '26f6bcfe-3e4f-5789-be8f-8068d8db8ffd', 'A', true),
('86a53f7f-955d-5f92-8086-b1232f281609', '26f6bcfe-3e4f-5789-be8f-8068d8db8ffd', 'B', false),
('92b25d26-573c-582e-94e8-5b681bddcbe5', '26f6bcfe-3e4f-5789-be8f-8068d8db8ffd', 'C', false),
('37b1b9f3-55d6-5e0b-a161-6a866b3eee8b', '26f6bcfe-3e4f-5789-be8f-8068d8db8ffd', 'D', false),
('c9671aa8-0fa2-5229-894b-d63261832167', 'aff70e6d-36ed-5a2a-a2e0-71f2c2256777', 'A', true),
('5fdefef6-f259-597d-a3db-dbf8bd5e84cb', 'aff70e6d-36ed-5a2a-a2e0-71f2c2256777', 'B', false),
('2fba6e37-b55e-5a39-9024-3d745d5da53e', 'aff70e6d-36ed-5a2a-a2e0-71f2c2256777', 'C', false),
('6acad83c-3dfd-5f65-8194-c1ca39597e70', 'aff70e6d-36ed-5a2a-a2e0-71f2c2256777', 'D', false),
('ac6966ae-2ff2-51a2-b847-99401c813da9', '744952cb-b4ac-5bda-9056-2097bc189deb', 'A', true),
('b6ea3a8d-998d-5495-aba8-3165d0896da5', '744952cb-b4ac-5bda-9056-2097bc189deb', 'B', false),
('9febc4e9-2098-56fd-bff9-673d0f560432', '744952cb-b4ac-5bda-9056-2097bc189deb', 'C', false),
('18214fdb-1c7e-5940-b405-895af3fc1a04', '744952cb-b4ac-5bda-9056-2097bc189deb', 'D', false),
('f3145190-15f0-5528-80e1-3cbfa8df5b20', '35c1905b-455f-5f4b-8e7a-e5bc9f5552b6', 'A', true),
('e3a14586-306c-5cd3-992c-f3a5540693f3', '35c1905b-455f-5f4b-8e7a-e5bc9f5552b6', 'B', false),
('14a9ef01-e5e5-5a79-94b4-9d2c26e13a02', '35c1905b-455f-5f4b-8e7a-e5bc9f5552b6', 'C', false),
('b02c56c1-0535-5a1a-ae92-d755668508d0', '35c1905b-455f-5f4b-8e7a-e5bc9f5552b6', 'D', false),
('ededba0d-a9d7-5a9a-96b7-6f27f34c46d2', 'd69167cf-717b-56c5-bdc3-850eda6ae4e3', 'A', true),
('55929534-80a7-55bc-aefb-1d2c09f7d72a', 'd69167cf-717b-56c5-bdc3-850eda6ae4e3', 'B', false),
('229f49dd-d59a-5253-bc55-2cdf60c39a8b', 'd69167cf-717b-56c5-bdc3-850eda6ae4e3', 'C', false),
('2ae00ae1-eb56-5d32-bcc7-0da75eb7053b', 'd69167cf-717b-56c5-bdc3-850eda6ae4e3', 'D', false),
('63bd1d0c-2044-538c-8bd8-bd3b2dc1186d', 'efd7e4a9-163e-5a63-a96b-84af04e0f265', 'A', true),
('b9569b8e-97b6-51aa-a86d-c7ff658a8b7a', 'efd7e4a9-163e-5a63-a96b-84af04e0f265', 'B', false),
('b239d6f9-842f-5479-8b8b-752aee55ad29', 'efd7e4a9-163e-5a63-a96b-84af04e0f265', 'C', false),
('7fc199e0-e0aa-52b7-9809-02b4b078fa35', 'efd7e4a9-163e-5a63-a96b-84af04e0f265', 'D', false),
('5f9f89cf-f6dd-5cb0-ba4a-db4e255a061d', '9190b874-3f14-53df-ac43-c73d614e948e', 'A', true),
('077ef434-824f-57c9-a7ee-95e502c133e8', '9190b874-3f14-53df-ac43-c73d614e948e', 'B', false),
('d9128393-ac3a-596f-a840-bf8d001d1a54', '9190b874-3f14-53df-ac43-c73d614e948e', 'C', false),
('5fdbdcb9-14a5-5728-bf67-d57b6f9af9fb', '9190b874-3f14-53df-ac43-c73d614e948e', 'D', false),
('32078c72-8017-57c6-b087-22f27f7f641b', 'f11a688f-de1c-59f6-b7fd-1c0e7ddf2d75', 'A', true),
('f7fd6410-3712-59a7-bb5c-697145ebb6a0', 'f11a688f-de1c-59f6-b7fd-1c0e7ddf2d75', 'B', false),
('ad22a22e-50ed-5ca1-9ce3-da2407ddc26b', 'f11a688f-de1c-59f6-b7fd-1c0e7ddf2d75', 'C', false),
('63617249-2e3b-5390-9328-f3dcc5dde060', 'f11a688f-de1c-59f6-b7fd-1c0e7ddf2d75', 'D', false),
('1ca2c88e-db3d-5955-96a5-3ec7653c714c', '84df2fbb-dba5-5389-91e0-78f4dbe55514', 'A', true),
('acb54fdc-fe14-57c1-9f3f-02ea48a8c56b', '84df2fbb-dba5-5389-91e0-78f4dbe55514', 'B', false),
('b88df8e8-1cec-597b-8075-7bf79d3b738c', '84df2fbb-dba5-5389-91e0-78f4dbe55514', 'C', false),
('e21d83dc-2f8b-533e-b087-5803e5f2bac0', '84df2fbb-dba5-5389-91e0-78f4dbe55514', 'D', false),
('812ff593-8cfc-50df-ba3b-613a2a78b719', 'd5f65a82-e106-50b7-b39b-0d3d31c211bd', 'A', true),
('3ea232f2-36c1-55d3-8dd5-539ff72573a4', 'd5f65a82-e106-50b7-b39b-0d3d31c211bd', 'B', false),
('87748aa7-d57e-568b-9938-db8a748f108f', 'd5f65a82-e106-50b7-b39b-0d3d31c211bd', 'C', false),
('f8f4ad5e-b165-57bd-97d4-373ec469a3a3', 'd5f65a82-e106-50b7-b39b-0d3d31c211bd', 'D', false),
('d97875e0-cc4a-5b2b-9ea9-e2f09070f85b', '567f4de7-97ae-58c6-ad80-59d9ddd041dd', 'A', true),
('a565c9cc-0d7f-51fb-838a-819fd94b230c', '567f4de7-97ae-58c6-ad80-59d9ddd041dd', 'B', false),
('762906c2-384a-5a31-b7f6-d5c85f6a8b62', '567f4de7-97ae-58c6-ad80-59d9ddd041dd', 'C', false),
('d2db83be-498c-550e-8025-1caf56eadfd2', '567f4de7-97ae-58c6-ad80-59d9ddd041dd', 'D', false),
('52f0cc7d-d3b8-54e5-96ef-67f67a82ead2', '1e2a75ac-ab92-5cea-bdb6-298cc2b5e219', 'A', true),
('ac944158-9082-583f-b1b5-862eb83e5db7', '1e2a75ac-ab92-5cea-bdb6-298cc2b5e219', 'B', false),
('b1ddf91d-adb3-5749-b974-a2e6c06751fe', '1e2a75ac-ab92-5cea-bdb6-298cc2b5e219', 'C', false),
('da640a40-0305-5b1f-8de2-eb34c1ec6351', '1e2a75ac-ab92-5cea-bdb6-298cc2b5e219', 'D', false),
('fbf3a81f-3d72-59b8-bc9c-07d7e6d12dc4', '83212584-4c07-56dc-a056-cb42d8faf29c', 'A', true),
('f205f389-3fdc-5586-b301-5f622ae3718f', '83212584-4c07-56dc-a056-cb42d8faf29c', 'B', false),
('432f8523-b132-536c-a5f8-ce6592637f3a', '83212584-4c07-56dc-a056-cb42d8faf29c', 'C', false),
('97dd1443-8c75-57c8-848e-6592cd48da3d', '83212584-4c07-56dc-a056-cb42d8faf29c', 'D', false),
('70048f77-1c64-57fe-807f-11007ae2dfa7', '02d977b7-6696-5e88-aef0-88fe34f79797', 'A', true),
('b1a2afe0-f1ab-5003-89dc-d45e90d41352', '02d977b7-6696-5e88-aef0-88fe34f79797', 'B', false),
('4df4cfb9-2df1-549f-99f2-a9a8fa0f9127', '02d977b7-6696-5e88-aef0-88fe34f79797', 'C', false),
('467ea31b-911c-5b0f-aef5-10f9d9b1c36a', '02d977b7-6696-5e88-aef0-88fe34f79797', 'D', false),
('58024fc9-b657-567c-a8c8-3116514d511d', '98abf35d-9c36-57a5-9ce7-59500a59a1f5', 'A', true),
('cc4b4b8a-1785-5900-b55a-e47730fbd0fc', '98abf35d-9c36-57a5-9ce7-59500a59a1f5', 'B', false),
('1769cdde-2856-5cd0-8459-a6e94a9a2ba1', '98abf35d-9c36-57a5-9ce7-59500a59a1f5', 'C', false),
('ffa5f632-e66e-56c6-bd53-785d796fd79b', '98abf35d-9c36-57a5-9ce7-59500a59a1f5', 'D', false);

-- 7. TEMPLATE N5 THEO CẤU TRÚC TEST
INSERT INTO public."ExamTemplates" ("TemplateID", "Title", "LevelID", "Duration", "PassingScore", "MinLanguageKnowledgeScore", "MinReadingScore", "MinListeningScore", "TotalMaxScore", "Version", "IsActive") VALUES
('46619a03-3f7f-56e9-878f-a4fc17a91533', 'Cấu trúc JLPT N5 Seed Test', '91e47292-b3eb-5965-9d01-45f9b3681fc6', 105, 80.00, 38, 0, 19, 180.00, 1, true);

INSERT INTO public."ExamTemplateDetails" ("DetailID", "SkillType", "QuestionFormat", "Quantity", "PointPerQuestion", "TemplateID") VALUES
('3b7c3667-9824-5e97-8661-6c6da9b8aef8', 1, 0, 15, 1.3333, '46619a03-3f7f-56e9-878f-a4fc17a91533'),
('1ca3b27a-b3c8-5cc4-858c-71716005c420', 2, 0, 15, 1.3333, '46619a03-3f7f-56e9-878f-a4fc17a91533'),
('e7815742-6979-5ca9-9a69-24d2f5e4363f', 3, 0, 15, 1.3333, '46619a03-3f7f-56e9-878f-a4fc17a91533'),
-- Quantity = 2 nghĩa là 2 passage group; thực tế mỗi passage có 3 câu, tổng 6 câu x 7 điểm = 42.
('18bb70d8-acd3-581b-a057-b4278d86a5cb', 4, 2, 2, 7.0000, '46619a03-3f7f-56e9-878f-a4fc17a91533'),
('476e6401-b37a-5769-82f6-e6572fbe74e6', 4, 0, 4, 4.5000, '46619a03-3f7f-56e9-878f-a4fc17a91533'),
('5853f0de-a4fb-59a6-889f-4fdd54f203ab', 5, 3, 20, 3.0000, '46619a03-3f7f-56e9-878f-a4fc17a91533');

-- 8. EXAM MOCK TEST ĐÃ GẮN SẴN QUESTION, không cần gọi API generate nếu chỉ muốn test render ngay.
INSERT INTO public."Exams" (
    "ExamID", "TemplateID", "CourseID", "LessonID", "LevelID", "TargetSkill", "Priority", "IsCheckpoint",
    "Type", "Title", "CreatedAt", "UpdatedAt", "TotalMaxScore", "PassingScore",
    "MinLanguageKnowledgeScore", "MinReadingScore", "MinListeningScore", "ShowResultImmediately",
    "Duration", "IsPublished", "Version", "TemplateVersion"
) VALUES (
    '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '46619a03-3f7f-56e9-878f-a4fc17a91533', '72f02178-3772-5e5e-86f0-f897bbab39cc', 'bdff3452-6099-5556-ba16-1cb8673e726c', '91e47292-b3eb-5965-9d01-45f9b3681fc6', NULL, 1, false,
    0, 'JLPT N5 Mock Test - Seed Data', NOW(), NOW(), 180.00, 80.00,
    38, 0, 19, true,
    105, true, 1, 1
);

-- 9. EXAM_QUESTIONS: thứ tự đúng để API GetExamQuestions build tree.
INSERT INTO public."Exam_Questions" ("ExamQuestionID", "ExamID", "QuestionID", "ReadingID", "ListeningID", "OrderIndex", "Score", "Version") VALUES
('27c3129b-0c19-546e-bc32-ae914b16fe68', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', 'eb5cca3b-0065-5408-ad17-80cbb390811f', NULL, NULL, 1, 1.3333333333, 1),
('a604bfaf-2cc9-596f-97ff-06f514cb9785', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '7621c0bf-eeaf-50b2-856b-e9a1f80013bf', NULL, NULL, 2, 1.3333333333, 1),
('bb81eb53-8b94-5b2a-925b-8cf87a163fe4', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '5469a658-25a7-5c72-92c8-ce9e22650995', NULL, NULL, 3, 1.3333333333, 1),
('5cc08778-b30e-5748-8edc-81543e79cee5', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '28c14c41-21e9-5f7b-9207-d6158ef42a5f', NULL, NULL, 4, 1.3333333333, 1),
('a3f17224-1e45-5c16-99a2-40f960721cc1', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '8fdb5ce0-a1f8-5ef6-b5c8-71d943e1b3f4', NULL, NULL, 5, 1.3333333333, 1),
('f3b64b5b-0aa0-56b3-8735-c53a05eb6c13', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', 'adf593d3-abb9-597c-97d9-08b6fe739f74', NULL, NULL, 6, 1.3333333333, 1),
('62604dcd-5bd0-5ad7-ab17-1862a8314213', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '49e47085-a830-5e65-87d2-68e03d535c6f', NULL, NULL, 7, 1.3333333333, 1),
('dc7c444a-5074-55b4-9dfc-584bacde4c81', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '4edf3654-7d30-5333-983c-1c19601cf244', NULL, NULL, 8, 1.3333333333, 1),
('94a0ad3f-d42e-5be5-aa01-37728dfdb9af', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', 'bb254cfb-64dc-51f5-8a24-9d53e3e4656e', NULL, NULL, 9, 1.3333333333, 1),
('32e16970-3ef5-511d-9a4e-26c4423f5e75', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', 'f5985592-2ba6-5ded-8a0c-ae79406ef161', NULL, NULL, 10, 1.3333333333, 1),
('a996d201-3016-599b-a513-eba2fd04fb1e', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', 'f840f31e-a39a-5c55-b7c2-ce60c88790d8', NULL, NULL, 11, 1.3333333333, 1),
('fe7de6a8-94f5-501c-b66a-7bd544c016e1', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '16b861fb-2ca5-59b5-8499-b67a6ebae9a4', NULL, NULL, 12, 1.3333333333, 1),
('12fdc487-a0ae-584e-9da0-60d8096e573b', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '7c156578-6201-56fe-a62d-3eb128a3052e', NULL, NULL, 13, 1.3333333333, 1),
('59537e02-b7d7-5558-afea-8b91f44e13bf', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', 'db339b39-4ed8-50a9-a187-226fd9958f98', NULL, NULL, 14, 1.3333333333, 1),
('677cefef-cc15-5e73-aa74-6b3af15c2673', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '4b113a3b-cf63-5bed-ad0f-090270bc7d1b', NULL, NULL, 15, 1.3333333333, 1),
('c0772c34-7f3e-584f-84dd-66d251499c1f', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '6ccc07f6-0d10-56e7-8871-8c54e487396a', NULL, NULL, 16, 1.3333333333, 1),
('5295c984-4df0-519c-8d13-1ded54493741', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', 'a85508e0-2215-5fc0-aa6c-33c4d820d0c7', NULL, NULL, 17, 1.3333333333, 1),
('49f9280b-76a9-562e-a249-6e34f81c45ae', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', 'a04de25d-4937-584a-a0af-817e879c8178', NULL, NULL, 18, 1.3333333333, 1),
('2ad2f5e7-d3f6-5320-b178-df79ff7e0e08', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '9ee0c25d-75c5-515e-a90f-90f8b9fbf7b0', NULL, NULL, 19, 1.3333333333, 1),
('acf839be-d8c6-544a-9f86-48b2937d20c1', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '82578b24-9ca1-50c6-8501-2a840945b3d8', NULL, NULL, 20, 1.3333333333, 1),
('4671cb44-47ae-5df8-8a12-b3135de54569', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '9a9577ac-e486-5c27-9504-c35c50bfc7ac', NULL, NULL, 21, 1.3333333333, 1),
('a29ac48c-6a33-568e-acb5-0444f3de006a', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', 'dfaef71e-1a9a-5a97-b175-7277b3d387c5', NULL, NULL, 22, 1.3333333333, 1),
('a11eca18-f5dd-5b10-9346-a0e4abaf0a24', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '829d57c5-4fa7-59e5-8031-7a9d14bacf1e', NULL, NULL, 23, 1.3333333333, 1),
('97333a0d-1c6f-5c75-b568-452d54fffa11', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '4218414e-e920-5531-9a19-50b2b45b977b', NULL, NULL, 24, 1.3333333333, 1),
('53e3e8cb-03c0-511a-a1c2-7b2d0fe1326b', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '3e7a61a8-84a7-59f2-9f08-1675e9b792b3', NULL, NULL, 25, 1.3333333333, 1),
('bdbdf3da-453a-522d-9944-8067f5ed8e5f', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '750d4d19-eb61-5988-bb36-c2317f5fcc3c', NULL, NULL, 26, 1.3333333333, 1),
('66226e61-e565-507f-92e3-2fbfe8760de3', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '411e7e70-8875-599c-8fb9-4bbc7e9e3865', NULL, NULL, 27, 1.3333333333, 1),
('bbe3aca9-6c04-548a-8720-1aa2632ef0af', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '367c24bc-66ce-5de6-8eee-b8a11b44a77f', NULL, NULL, 28, 1.3333333333, 1),
('d90a95a5-4a95-5d7f-a8bc-19120ddad7a4', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '7aec7f7e-79e6-5843-9b90-f8010439332e', NULL, NULL, 29, 1.3333333333, 1),
('890f5cfe-5fca-52a4-8b90-253efc6757a2', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', 'ab670466-d23e-5f7e-90d8-e2d63fc49da7', NULL, NULL, 30, 1.3333333333, 1),
('28f28085-b207-5c80-b4cf-c99a9ad7d72d', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '54f24e33-3ad1-588b-836f-f93e5f0af4bf', NULL, NULL, 31, 1.3333333333, 1),
('79cc30f7-68b7-5988-b512-6786971959a8', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '4e56550d-ee60-5aab-856e-3ec6d6054051', NULL, NULL, 32, 1.3333333333, 1),
('56e5f922-fece-5620-a8fb-c2e4cb846815', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', 'f29910fa-f258-5636-bd00-6e8e3a435edd', NULL, NULL, 33, 1.3333333333, 1),
('cf5254be-8853-5b4e-9cd1-624cc47516fc', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '09d66d9c-4650-58e8-8e87-28ee67f3b09b', NULL, NULL, 34, 1.3333333333, 1),
('70731db3-4107-5cb4-9384-34c87cb3b8bd', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', 'c393bcf4-5e1c-57ac-b396-a16adbc806b8', NULL, NULL, 35, 1.3333333333, 1),
('68bbe841-2615-5497-bf88-af5f778c7313', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', 'ee2a8815-9172-5c42-8c62-9c51837b69f4', NULL, NULL, 36, 1.3333333333, 1),
('74b53e82-be99-5959-8f01-1611d626f8f9', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '34806753-cdb1-5b99-8a6f-56cdd90e3f5e', NULL, NULL, 37, 1.3333333333, 1),
('8eb53b93-c223-5883-a2fc-76c7af946030', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', 'cc55919d-6aac-5f03-9f90-867aa5d733f7', NULL, NULL, 38, 1.3333333333, 1),
('1d6c7e43-b001-5bcd-a546-edf2fab137f8', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', 'dde2dd8e-fec0-51c7-add7-8998d642bbf7', NULL, NULL, 39, 1.3333333333, 1),
('6c106ca0-4231-5f69-841a-7a6a86a2dd65', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '1ca9207b-f20c-5d4a-a76f-493f6a142c87', NULL, NULL, 40, 1.3333333333, 1),
('58147ddf-88a6-50e0-979f-00606a89de81', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '786b30fb-8f9a-5bfb-8735-663a25136888', NULL, NULL, 41, 1.3333333333, 1),
('36117d1a-e666-5274-92c1-6e5f5ab80dfa', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '85a9ff76-6d39-5080-9d3e-af070746336d', NULL, NULL, 42, 1.3333333333, 1),
('5eb14845-f060-558e-a162-319ad5fae5c7', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', 'ac1b2b00-3237-5a5e-b2bd-234f23a11ddd', NULL, NULL, 43, 1.3333333333, 1),
('f6a13408-b20e-5ff8-a211-99d269ade03b', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '0049db6e-0a9e-5b0e-ad0a-ccefc982fa53', NULL, NULL, 44, 1.3333333333, 1),
('8bae9896-d4aa-5f1f-bb83-d52f1d45154c', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '53f168bc-a364-5951-821b-0173637b0625', NULL, NULL, 45, 1.3333333333, 1),
('b0765c19-2c6d-5748-8211-39d0fc578e3a', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', 'bfede2c1-5f1c-577d-a63a-7e89a6760186', '21ea58a5-2311-5ad3-9806-1dd8059bb61e', NULL, 46, 7.0000, 1),
('32ec6003-2083-541a-9ea1-54b3c5a657a5', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '73fb6582-d96e-5e0a-8c90-f9556a5ec4da', '21ea58a5-2311-5ad3-9806-1dd8059bb61e', NULL, 47, 7.0000, 1),
('8db515b2-b00d-5f48-97fb-470e06d7acc9', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '6eae996f-c4ad-5b7f-acf2-e983fc869b5b', '21ea58a5-2311-5ad3-9806-1dd8059bb61e', NULL, 48, 7.0000, 1),
('0dcc2f36-6ed7-5e40-8a83-733f2271ad49', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', 'b3f00191-6b19-5f58-bebf-38edc5fce795', 'f0a2c372-fbaa-5eb3-91f2-422720b24e68', NULL, 49, 7.0000, 1),
('4c789eba-e55e-5126-89b3-6689b76ac1dc', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '8edf76ed-f55a-5e54-9ba1-556c4e2c4591', 'f0a2c372-fbaa-5eb3-91f2-422720b24e68', NULL, 50, 7.0000, 1),
('1cdde2f9-c89a-5cab-8f16-8b1724bc2218', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '5c30e54d-c10a-56df-a3f8-0352eae99919', 'f0a2c372-fbaa-5eb3-91f2-422720b24e68', NULL, 51, 7.0000, 1),
('1bbb7ec9-b6a1-50b5-8a83-761501d2207b', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', 'abe20793-92e1-57cd-b304-6c733cae6c28', NULL, NULL, 52, 4.5000, 1),
('fce58d63-4507-506c-9e87-d6916bc8432a', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '21bdcfa0-c722-5230-996b-4299a28206ec', NULL, NULL, 53, 4.5000, 1),
('59b6a9be-1736-5043-9d26-f4aab0a91c11', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '4f2df790-e1df-5dd9-aaa2-6f5366573878', NULL, NULL, 54, 4.5000, 1),
('e7ce9d0c-d725-5896-966e-6dc6ae7e6437', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '2340a85c-1983-508b-8539-4b7d3546e268', NULL, NULL, 55, 4.5000, 1),
('9aedd46d-13f2-5619-a3f3-595c79576b65', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '8f69ee4e-b869-5f25-92cb-600e1458c176', NULL, 'cfe60b4d-9b44-5891-adf7-49782be4e119', 56, 3.0000, 1),
('ad9947fc-6ff7-5d04-bdf3-8d031ee499b9', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '914e8f71-087e-580f-ab57-040874351cb5', NULL, 'e61ed20e-dc54-5071-bad5-8a7f807bee53', 57, 3.0000, 1),
('cef2bc67-eb59-53d7-9df1-314fa92c5071', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '67179377-5910-5cbd-b597-3444f1b312da', NULL, '79fe3bfa-6a24-5779-bf67-317738181fdc', 58, 3.0000, 1),
('c3fe4599-5359-5e6e-9f64-077e2af9c4ed', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '4543dc08-996e-535c-88f2-1569f0332d8e', NULL, '58ddee31-2fa8-5ed3-80b1-c67027e81c31', 59, 3.0000, 1),
('f09bf046-12a0-5592-9553-8d0e0543ac70', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '9d8aea1a-2f07-5ab8-8f8a-08bb17f5a156', NULL, '17cc484f-eb1d-5d87-b7d8-2b537306d451', 60, 3.0000, 1),
('01725a14-2a3d-5604-ac81-ca1f5fc3cce6', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '26f6bcfe-3e4f-5789-be8f-8068d8db8ffd', NULL, '1dfca429-43e4-5da5-958b-20ba6d95caf0', 61, 3.0000, 1),
('ebbeaafe-5d93-520e-8ecd-ac85ad5217fa', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', 'aff70e6d-36ed-5a2a-a2e0-71f2c2256777', NULL, 'cb86d6aa-d6cc-5c37-9e13-0654605cf5a6', 62, 3.0000, 1),
('ea2f0b0b-2464-5b35-af05-eb792df85c90', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '744952cb-b4ac-5bda-9056-2097bc189deb', NULL, '407776cf-3bd7-58eb-be37-eae89a5db175', 63, 3.0000, 1),
('97a1eaf3-a351-5783-8448-17d1600c3ce2', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '35c1905b-455f-5f4b-8e7a-e5bc9f5552b6', NULL, '4741ebed-bc26-5f96-877d-59072f406aeb', 64, 3.0000, 1),
('93c4af4b-c707-543c-97dc-c903673e98f3', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', 'd69167cf-717b-56c5-bdc3-850eda6ae4e3', NULL, 'acc5797e-d48b-53ee-a808-9f359f6323b4', 65, 3.0000, 1),
('e44fdb15-d8ec-5788-b99c-90a86462acf9', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', 'efd7e4a9-163e-5a63-a96b-84af04e0f265', NULL, '14701068-910b-56db-aa67-117928508847', 66, 3.0000, 1),
('72dd202e-e1fc-5c6a-a3f4-10b1d388e183', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '9190b874-3f14-53df-ac43-c73d614e948e', NULL, 'c5f998fb-f7c7-59c8-ad41-a5ee516119f7', 67, 3.0000, 1),
('30b144b4-0600-57b5-a4be-c31f2692f97b', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', 'f11a688f-de1c-59f6-b7fd-1c0e7ddf2d75', NULL, 'd30a9bef-2f1b-56a4-ac98-d921d56d48ca', 68, 3.0000, 1),
('489948b3-0f8e-5424-a5e3-54b1b56412a5', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '84df2fbb-dba5-5389-91e0-78f4dbe55514', NULL, '029dcc09-b051-59d5-b671-32bc874bc154', 69, 3.0000, 1),
('1bad2109-9a2f-5d0b-8ae0-f619bbdb5345', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', 'd5f65a82-e106-50b7-b39b-0d3d31c211bd', NULL, '2be75180-9b30-56a7-9a3d-9d82e7e3d6f3', 70, 3.0000, 1),
('0ce9c2a4-81f5-5d3f-828c-cb55891df4cb', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '567f4de7-97ae-58c6-ad80-59d9ddd041dd', NULL, '7c488529-8294-579a-b022-65e6a950e545', 71, 3.0000, 1),
('f1a32c80-3084-5ddb-bf4f-8d1642d7136e', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '1e2a75ac-ab92-5cea-bdb6-298cc2b5e219', NULL, '652e0b99-b752-58b8-a09f-ecfe0481d043', 72, 3.0000, 1),
('f70e1b14-fc21-51e7-ae45-edc9501ccbe1', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '83212584-4c07-56dc-a056-cb42d8faf29c', NULL, '2dfbbe0d-0f4f-5dee-8dff-55512bf489c3', 73, 3.0000, 1),
('dba8c70b-7751-58cc-9f33-100cdbc51d24', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '02d977b7-6696-5e88-aef0-88fe34f79797', NULL, '12e225ba-f3bd-54f9-85e4-1e52bbdad8b7', 74, 3.0000, 1),
('d5e9af05-4b57-5989-bac5-1d0436489e7f', '8fac6844-f9bf-5cfe-85eb-63d259d512b6', '98abf35d-9c36-57a5-9ce7-59500a59a1f5', NULL, '39c303ce-8e05-5f51-aaf9-308cc4c6f0c9', 75, 3.0000, 1);

COMMIT;

-- Kiểm tra nhanh sau khi chạy:
-- SELECT "ExamID", "Title" FROM public."Exams";
-- SELECT "SkillType", "QuestionFormat", COUNT(*) FROM public."Questions" GROUP BY "SkillType", "QuestionFormat" ORDER BY "SkillType", "QuestionFormat";
-- SELECT COUNT(*) FROM public."Exam_Questions" WHERE "ExamID" = '8fac6844-f9bf-5cfe-85eb-63d259d512b6';

-- -- -- Thay UserID tương ứng của ông vào
-- DELETE FROM "FlashcardDecks" WHERE "UserID" = '2aed63c2-ce50-4194-a9af-2fafa255df5a';

-- -------------------------------------------------------
-- -- SELECT VD
-- -------------------------------------------------------
-- SELECT * FROM "GrammarGroups"
-- WHERE "VocabID" = '014415d9-f006-4558-9a09-f4dcdee4a742';


-- SELECT * FROM "Vocabularies"
-- WHERE "Word" = '置く';
