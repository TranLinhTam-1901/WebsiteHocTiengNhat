-------------------------------------------------------
-- 0. DỌN DẸP VÀ CẤU HÌNH RÀNG BUỘC
-------------------------------------------------------
TRUNCATE TABLE "Answers", "Questions", "Readings", "Vocabularies", "Kanjis", 
"Grammars", "Topics", "Lessons", "JLPT_Levels", "VocabularyKanjis" CASCADE;

DO $$ 
BEGIN
    -- Ràng buộc Unique để tránh trùng dữ liệu khi chạy lại script
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_level_name') THEN
        ALTER TABLE "JLPT_Levels" ADD CONSTRAINT "unique_level_name" UNIQUE ("LevelName");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_lesson_title') THEN
        ALTER TABLE "Lessons" ADD CONSTRAINT "unique_lesson_title" UNIQUE ("Title");
    END IF;
END $$;

-------------------------------------------------------
-- 1. RÀNG BUỘC UNIQUE CHO CÁC BẢNG
-------------------------------------------------------
DO $$
BEGIN
    -------------------------------------------------------
    -- 1. Bảng JLPT_Levels
    -------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_jlpt_levelname') THEN
        ALTER TABLE "JLPT_Levels" ADD CONSTRAINT uc_jlpt_levelname UNIQUE ("LevelName");
    END IF;

    -------------------------------------------------------
    -- 2. Bảng Courses
    -------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_coursename') THEN
        ALTER TABLE "Courses" ADD CONSTRAINT uc_coursename UNIQUE ("CourseName");
    END IF;

    -------------------------------------------------------
    -- 3. Bảng Lessons
    -------------------------------------------------------
	IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_lessontitle') THEN
	    ALTER TABLE "Lessons" DROP CONSTRAINT "uc_lessontitle";
	END IF;
	
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_title_course') THEN
	    ALTER TABLE "Lessons" ADD CONSTRAINT "uc_title_course" UNIQUE ("Title", "CourseID");
	END IF;

    -------------------------------------------------------
    -- 4. Bảng Vocabularies
    -------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_word_reading') THEN
        ALTER TABLE "Vocabularies" ADD CONSTRAINT uc_word_reading UNIQUE ("Word", "Reading");
    END IF;

    -------------------------------------------------------
    -- 5. Bảng Grammars
    -------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_grammarstructure') THEN
        ALTER TABLE "Grammars" ADD CONSTRAINT uc_grammarstructure UNIQUE ("Structure");
    END IF;

    -------------------------------------------------------
    -- 6. Bảng Kanjis
    -------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_kanjicharacter') THEN
        ALTER TABLE "Kanjis" ADD CONSTRAINT uc_kanjicharacter UNIQUE ("Character");
    END IF;

    -------------------------------------------------------
    -- 7. Bảng Topics
    -------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_topicname') THEN
        ALTER TABLE "Topics" ADD CONSTRAINT uc_topicname UNIQUE ("TopicName");
    END IF;

	-------------------------------------------------------
	-- 8. Bảng Examples
	-------------------------------------------------------
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_example_content_vocab_content') THEN
		ALTER TABLE "Examples" ADD CONSTRAINT uc_example_content_vocab_content UNIQUE ("Content", "VocabID");
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_example_content_grammar_content') THEN
		ALTER TABLE "Examples" ADD CONSTRAINT uc_example_content_grammar_content UNIQUE ("Content", "GrammarID");
	END IF;

	-------------------------------------------------------
    -- 9. Bảng Readings
    -------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_reading_title') THEN
        ALTER TABLE "Readings" ADD CONSTRAINT uc_reading_title UNIQUE ("Title");
    END IF;
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Readings' AND column_name='WordCount') THEN
        ALTER TABLE "Readings" ADD COLUMN "WordCount" INT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Readings' AND column_name='EstimatedTime') THEN
        ALTER TABLE "Readings" ADD COLUMN "EstimatedTime" INT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Readings' AND column_name='Status') THEN
        ALTER TABLE "Readings" ADD COLUMN "Status" INT DEFAULT 1;
    END IF;

    -------------------------------------------------------
    -- 10. Cấu hình CASCADE DELETE cho Questions và Answers
    -------------------------------------------------------
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_Questions_Readings_ReadingID') THEN
        ALTER TABLE "Questions" DROP CONSTRAINT "FK_Questions_Readings_ReadingID";
        ALTER TABLE "Questions" ADD CONSTRAINT "FK_Questions_Readings_ReadingID" 
            FOREIGN KEY ("ReadingID") REFERENCES "Readings" ("ReadingID") ON DELETE CASCADE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_Answers_Questions_QuestionID') THEN
        ALTER TABLE "Answers" DROP CONSTRAINT "FK_Answers_Questions_QuestionID";
        ALTER TABLE "Answers" ADD CONSTRAINT "FK_Answers_Questions_QuestionID" 
            FOREIGN KEY ("QuestionID") REFERENCES "Questions" ("QuestionID") ON DELETE CASCADE;
    END IF;
	

    RAISE NOTICE 'Đã kiểm tra và thêm các ràng buộc UNIQUE thành công.';
END $$;

-------------------------------------------------------
-- 2. KHỞI TẠO COURSES
-------------------------------------------------------
DO $$
DECLARE 
    -- Định nghĩa ID cố định cho Level
    level_n5_id uuid := '550e8400-e29b-41d4-a716-446655440000';
    level_n4_id uuid := '550e8400-e29b-41d4-a716-446655440001';
    level_n3_id uuid := '550e8400-e29b-41d4-a716-446655440002';
	level_n2_id uuid := '550e8400-e29b-41d4-a716-446655440003';
	level_n1_id uuid := '550e8400-e29b-41d4-a716-446655440004';

    -- Định nghĩa ID cố định cho Courses
    course_n5_id uuid := '11111111-1111-1111-1111-111111111111';
    course_n4_id uuid := '22222222-2222-2222-2222-222222222222';
    course_n3_id uuid := '33333333-3333-3333-3333-333333333333';
	course_n2_id uuid := '44444444-4444-4444-4444-444444444444';
	course_n1_id uuid := '55555555-5555-5555-5555-555555555555';
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
    -- 2. TẠO CÁC TOPIC
    -------------------------------------------------------
    INSERT INTO "Topics" ("TopicID", "TopicName", "Description") VALUES
    (gen_random_uuid(), 'Ngữ Pháp N5 Tổng Hợp', 'Tổng hợp 25 bài ngữ pháp căn bản theo giáo trình Minna no Nihongo'),
    (gen_random_uuid(), 'Kanji N5 Tổng Hợp', 'Tổng hợp các chữ kanji căn bản theo giáo trình Minna no Nihongo'),
    (gen_random_uuid(), 'Từ Vựng N5 Tổng Hợp', 'Tổng hợp các từ vựng căn bản theo giáo trình Minna no Nihongo'),
	(gen_random_uuid(), 'Bài Đọc N5 Tổng Hợp', 'Tổng hợp các bài đọc căn bản theo giáo trình Minna no Nihongo'),
	(gen_random_uuid(), 'Bài Nghe N5 Tổng Hợp', 'Tổng hợp các bài nghe căn bản theo giáo trình Minna no Nihongo')
    ON CONFLICT ("TopicName") DO NOTHING; -- OK vì TopicName thường là Unique
    
    -------------------------------------------------------
    -- 3. TẠO CÁC KHÓA HỌC (Courses)
    -------------------------------------------------------
    -- Sửa ON CONFLICT ("Character") thành ("CourseID") hoặc ("CourseName")
    
    -- Khóa học N5
    INSERT INTO "Courses" ("CourseID", "CourseName", "Description", "LevelID")
    VALUES (
        course_n5_id, 
        'Minna no Nihongo Sơ cấp 1 (N5)', 
        'Khóa học dành cho người mới bắt đầu, bao gồm 25 bài đầu giáo trình Minna.', 
        level_n5_id
    ) ON CONFLICT ("CourseName") DO NOTHING;

    -- Khóa học N4
    INSERT INTO "Courses" ("CourseID", "CourseName", "Description", "LevelID")
    VALUES (
        course_n4_id, 
        'Minna no Nihongo Sơ cấp 2 (N4)', 
        'Khóa học tiếp nối từ bài 26 đến bài 50, hoàn thành trình độ sơ cấp.', 
        level_n4_id
    ) ON CONFLICT ("CourseName") DO NOTHING;

    -- Khóa học N3
    INSERT INTO "Courses" ("CourseID", "CourseName", "Description", "LevelID")
    VALUES (
        course_n3_id, 
        'Trung cấp Nihongo (N3)', 
        'Khóa học chuẩn bị cho kỳ thi JLPT N3, tập trung vào ngữ pháp và từ vựng trung cấp.', 
        level_n3_id
    ) ON CONFLICT ("CourseName") DO NOTHING;

    RAISE NOTICE 'Đã tạo xong hệ thống Course từ N5 đến N3.';
END $$;

-------------------------------------------------------
-- 3. KHỞI TẠO LEVEL N5 VÀ 25 BÀI HỌC (LESSONS)
-------------------------------------------------------
DO $$
DECLARE 
    course_n5_id uuid;
BEGIN
    -- 1. Lấy ID của Course N5 dựa theo tên đã tạo ở bước trước
    SELECT "CourseID" INTO course_n5_id 
    FROM "Courses" 
    WHERE "CourseName" = 'Minna no Nihongo Sơ cấp 1 (N5)' 
    LIMIT 1;

    -- Kiểm tra nếu tìm thấy Course thì mới chạy vòng lặp
    IF course_n5_id IS NOT NULL THEN
        FOR i IN 1..25 LOOP
            INSERT INTO "Lessons" ("LessonID", "Title", "SkillType", "Difficulty", "Priority", "CourseID")
            VALUES (
                gen_random_uuid(), 
                'Bài ' || i, 
                'General', -- Khớp với Enum SkillType trong C# của bạn
                1,            -- Độ khó mặc định
                i,            -- Thứ tự ưu tiên
                course_n5_id  -- Khóa ngoại trỏ về bảng Courses
            ) ON CONFLICT ("Title", "CourseID") DO NOTHING;
        END LOOP;
        
        RAISE NOTICE 'Đã tạo xong 25 bài Lessons cho khóa học N5.';
    ELSE
        RAISE EXCEPTION 'Không tìm thấy Course N5. Vui lòng chạy script tạo Course trước!';
    END IF;
END $$;

-------------------------------------------------------
-- 4. NGỮ PHÁP N5: CHI TIẾT TỪ BÀI 1 ĐẾN BÀI 25
-------------------------------------------------------
DO $$
DECLARE 
    n5_id uuid := '550e8400-e29b-41d4-a716-446655440000';
    t_id uuid; 
    l_id uuid;
	g_id uuid;
BEGIN
    -- Lấy Topic ID chung cho Ngữ pháp N5 (Đã tạo ở script trước)
    SELECT "TopicID" INTO t_id FROM "Topics" WHERE "TopicName" = 'Ngữ Pháp N5 Tổng Hợp' LIMIT 1;

    -------------------------------------------------------
    -- BÀI 1: DANH TỪ & KHẲNG ĐỊNH/PHỦ ĐỊNH
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 1' LIMIT 1;

    -- 1. Khẳng định
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Khẳng định', 'N1 は N2 です', 'N1 là N2', 'Câu khẳng định lịch sự.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'わたしは たなかです。', 'Tôi là Tanaka.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'ミラーさんは 会社員です。', 'Anh Miller là nhân viên công ty.', '', NOW(), NOW(), g_id);

    -- 2. Phủ định
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Phủ định', 'N1 は N2 じゃありません', 'N1 không phải là N2', 'Câu phủ định của です.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'あの方は 医者じゃありません。', 'Vị kia không phải là bác sĩ.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'サントスさんは 学生じゃありません。', 'Anh Santos không phải là sinh viên.', '', NOW(), NOW(), g_id);

    -- 3. Câu hỏi
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Câu hỏi', 'S + か', 'Câu hỏi (?)', 'Thêm か vào cuối câu.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'たなかさんは 学生ですか。', 'Anh Tanaka là sinh viên phải không?', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'あの方も 銀行員ですか。', 'Vị kia cũng là nhân viên ngân hàng phải không?', '', NOW(), NOW(), g_id);

    -- 4. Trợ từ も
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Đồng nhất', 'N1 も N2', 'N1 cũng là N2', 'Trợ từ も thay thế は khi đối tượng có cùng tính chất.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'ミラーさんも 会社員です。', 'Anh Miller cũng là nhân viên công ty.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'わたしも ベトナム人です。', 'Tôi cũng là người Việt Nam.', '', NOW(), NOW(), g_id);

    -- 5. Trợ từ の
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Sở hữu', 'N1 の N2', 'N2 của N1', 'Trợ từ の nối 2 danh từ.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'これは 私の本です。', 'Đây là cuốn sách của tôi.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'あの方は IMCの社員です。', 'Vị kia là nhân viên công ty IMC.', '', NOW(), NOW(), g_id);

    -------------------------------------------------------
    -- BÀI 2: ĐẠI TỪ CHỈ ĐỊNH
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 2' LIMIT 1;

    -- 6. Kore/Sore/Are
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Vật gần/xa', 'これ / それ / あれ', 'Cái này / đó / kia', 'Đại từ chỉ định làm chủ ngữ.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'これは コンピューターです。', 'Đây là máy tính.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'それは 私の傘です。', 'Đó là cái ô của tôi.', '', NOW(), NOW(), g_id);

    -- 7. Kono/Sono/Ano
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Bổ nghĩa danh từ', 'この N / その N / あの N', 'Cái N này / đó / kia', 'Đi kèm sau là một danh từ.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'この辞書は 私のです。', 'Cuốn từ điển này là của tôi.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'あの人は だれですか。', 'Người kia là ai vậy?', '', NOW(), NOW(), g_id);

    -- 8. Sou desu ka
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Xác nhận', 'そうですか', 'Ra vậy / Thế à', 'Tiếp nhận thông tin mới.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'そうですか。わかりました。', 'Thế à. Tôi hiểu rồi.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'そうですか。おもしろいですね。', 'Vậy à. Thú vị nhỉ.', '', NOW(), NOW(), g_id);

    -- 9. Câu hỏi lựa chọn
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Lựa chọn', 'S1 か、S2 か', 'S1 hay là S2?', 'Lựa chọn phương án.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'これは 「９」ですか、「７」ですか。', 'Đây là số 9 hay số 7?', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'あの人は 先生ですか、学生ですか。', 'Người kia là giáo viên hay sinh viên?', '', NOW(), NOW(), g_id);

    -------------------------------------------------------
    -- BÀI 3: ĐỊA ĐIỂM & PHƯƠNG HƯỚNG
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 3' LIMIT 1;

    -- 10. Koko/Soko/Asoko
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Địa điểm', 'ここ / そこ / あそこ', 'Chỗ này / đó / kia', 'Đại từ chỉ địa điểm.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'あそこは 食堂です。', 'Chỗ kia là nhà ăn.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'ここは 会議室です。', 'Đây là phòng họp.', '', NOW(), NOW(), g_id);

    -- 11. Kochira/Sochira/Achira
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Hướng/Lịch sự', 'こちら / そちら / あちら', 'Phía này / đó / kia', 'Chỉ hướng hoặc địa điểm lịch sự.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'お手洗いは こちらです。', 'Nhà vệ sinh ở phía này.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '電話は あちらです。', 'Điện thoại ở phía kia.', '', NOW(), NOW(), g_id);

    -- 12. N1 wa N2 (địa điểm) desu
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Vị trí', 'N1 は N2 (địa điểm) です', 'N1 ở N2', 'Chỉ vị trí của đối tượng.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '電話は ２階です。', 'Điện thoại ở tầng 2.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'ミラーさんは 事務所です。', 'Anh Miller ở văn phòng.', '', NOW(), NOW(), g_id);

    -- 13. Doko/Dochira
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Hỏi nơi chốn', 'どこ / どちら', 'Ở đâu / Phía nào', 'Từ để hỏi địa điểm.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '大学は どこですか。', 'Trường đại học ở đâu?', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'エレベーターは どちらですか。', 'Thang máy ở phía nào vậy?', '', NOW(), NOW(), g_id);

    -------------------------------------------------------
    -- BÀI 4: THỜI GIAN & ĐỘNG TỪ
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 4' LIMIT 1;

    -- 14. Giờ phút
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Thời gian', '今 ～時 ～分 です', 'Bây giờ là...', 'Cách nói thời gian.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '今 ４時５分です。', 'Bây giờ là 4 giờ 5 phút.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'ニューヨークは 今 午前４時です。', 'New York bây giờ là 4 giờ sáng.', '', NOW(), NOW(), g_id);

    -- 15. V-masu/masen
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Động từ hiện tại', 'V-ます / V-ません', 'Làm / Không làm', 'Thói quen hoặc sự thật.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '毎日 勉強します。', 'Hàng ngày tôi đều học bài.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'あしたは 働きません。', 'Ngày mai tôi sẽ không làm việc.', '', NOW(), NOW(), g_id);

    -- 16. V-mashita/masen deshita
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Động từ quá khứ', 'V-ました / V-ませんでした', 'Đã làm / Đã không làm', 'Hành động trong quá khứ.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'きのう 勉強しました。', 'Hôm qua tôi đã học bài.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'おととい 働きませんでした。', 'Hôm kia tôi đã không làm việc.', '', NOW(), NOW(), g_id);

    -- 17. Trợ từ に (thời gian)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "UsageNote", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Thời điểm', 'N (thời gian) に V', 'Làm gì vào lúc...', 'Dùng cho mốc thời gian có con số cụ thể.', 'Không dùng cho các từ như: hôm nay, ngày mai...', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '６時に 起きます。', 'Tôi thức dậy lúc 6 giờ.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '７月２日に 日本へ行きます。', 'Tôi sẽ đi Nhật vào ngày 2 tháng 7.', '', NOW(), NOW(), g_id);

    -- 18. Kara/Made
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Phạm vi', 'N1 から N2 まで', 'Từ N1 đến N2', 'Phạm vi thời gian hoặc không gian.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '９時から ５時まで 働きます。', 'Tôi làm việc từ 9 giờ đến 5 giờ.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '大阪から 東京まで ３時間かかります。', 'Từ Osaka đến Tokyo mất 3 tiếng.', '', NOW(), NOW(), g_id);

    -------------------------------------------------------
    -- BÀI 5: DI CHUYỂN
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 5' LIMIT 1;

    -- 19. Trợ từ へ
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Hướng di chuyển', 'N へ 行きます/来ます/帰ります', 'Đi / Đến / Về đâu', 'Trợ từ へ chỉ hướng.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '京都へ 行きます。', 'Tôi đi Kyoto.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '日本へ 来ました。', 'Tôi đã đến Nhật.', '', NOW(), NOW(), g_id);

    -- 20. Phủ định hoàn toàn
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Phủ định sạch', 'どこ [へ] も 行きません', 'Không đi đâu cả', 'Phủ định hoàn toàn với trợ từ も.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'どこへも 行きませんでした。', 'Tôi đã không đi đâu cả.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '何も 食べません。', 'Tôi sẽ không ăn gì cả.', '', NOW(), NOW(), g_id);

    -- 21. Trợ từ で (phương tiện)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Phương tiện', 'N で 行きます', 'Đi bằng phương tiện gì', 'Cách thức di chuyển.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '電車で 行きます。', 'Tôi đi bằng tàu điện.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'タクシーで 帰りました。', 'Tôi đã về bằng taxi.', '', NOW(), NOW(), g_id);

    -- 22. Trợ từ と (người)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Cùng với ai', 'N と V', 'Làm gì cùng ai', 'Chỉ bạn đồng hành.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '家族と 日本へ 来ました。', 'Tôi đã đến Nhật cùng gia đình.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '友達と 映画を見ます。', 'Tôi xem phim cùng bạn.', '', NOW(), NOW(), g_id);

    -- 23. Itsu
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Hỏi thời điểm', 'いつ V ますか', 'Khi nào làm V?', 'Từ hỏi thời gian.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'いつ 日本へ 来ましたか。', 'Bạn đã đến Nhật khi nào?', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '誕生日は いつですか。', 'Sinh nhật bạn là khi nào?', '', NOW(), NOW(), g_id);

    -------------------------------------------------------
    -- BÀI 6: NGOẠI ĐỘNG TỪ
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 6' LIMIT 1;

    -- 24. Trợ từ を
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Tác động trực tiếp', 'N を V', 'Làm / Tác động vào N', 'Chỉ đối tượng trực tiếp.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'ごはんを 食べます。', 'Tôi ăn cơm.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '水を 飲みます。', 'Tôi uống nước.', '', NOW(), NOW(), g_id);

    -- 25. Nani wo shimasu ka
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Hỏi hành động', '何を しますか', 'Làm cái gì?', 'Hỏi nội dung hành động.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '月曜日 何を しますか。', 'Thứ Hai bạn làm gì?', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '昨日 何を しましたか。', 'Hôm qua bạn đã làm gì?', '', NOW(), NOW(), g_id);

    -- 26. Trợ từ で (địa điểm)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Nơi hành động', 'N (địa điểm) で V', 'Làm việc gì tại đâu', 'Chỉ nơi xảy ra hành động.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '駅で 新聞を 買います。', 'Tôi mua báo ở nhà ga.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'ロビーで 休みます。', 'Tôi nghỉ ngơi ở hành lang.', '', NOW(), NOW(), g_id);

    -- 27. V-masenka
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Mời mọc', 'V-ませんか', 'Cùng làm... nhé?', 'Lời mời mọc lịch sự.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'いっしょに 京都へ 行kiませんか。', 'Cùng đi Kyoto với tôi không?', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'いっしょに お茶を 飲みませんか。', 'Cùng uống trà với tôi không?', '', NOW(), NOW(), g_id);

    -- 28. V-mashou
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Đề nghị', 'V-ましょう', 'Cùng làm... thôi!', 'Lời đề nghị cùng thực hiện.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'ちょっと 休みましょう。', 'Nghỉ một chút nào.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '昼ごはんを 食べましょう。', 'Ăn cơm trưa thôi.', '', NOW(), NOW(), g_id);

    -------------------------------------------------------
    -- BÀI 7: CÔNG CỤ & CHO/NHẬN
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 7' LIMIT 1;

    -- 29. Trợ từ で (công cụ)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Công cụ', 'N で V', 'Làm bằng công cụ gì', 'Phương thức thực hiện.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'はしで 食べます。', 'Tôi ăn bằng đũa.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '日本語で レポートを書きます。', 'Tôi viết báo cáo bằng tiếng Nhật.', '', NOW(), NOW(), g_id);

    -- 30. Nani desu ka (ngôn ngữ)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Dịch thuật', '「Từ/Câu」は ～語で 何ですか', '... tiếng ~ nói là gì?', 'Hỏi cách dịch.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '「Thank you」は 日本語で 何ですか。', '"Thank you" tiếng Nhật là gì?', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '「こんにちは」は 英語で 何ですか。', '"Konnichiwa" tiếng Anh là gì?', '', NOW(), NOW(), g_id);

    -- 31. Agemasu
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Cho tặng', 'N1 に N2 を あげます', 'Cho/Tặng N1 cái N2', 'Hành động cho đi.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '木村さんに 花を あげました。', 'Tôi đã tặng hoa cho chị Kimura.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '友達に プレゼントを あげます。', 'Tôi tặng quà cho bạn.', '', NOW(), NOW(), g_id);

    -- 32. Moraimasu
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "SimilarGrammar", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Nhận về', 'N1 に N2 を もらいます', 'Nhận N2 từ N1', 'Hành động nhận về.', 'N1 から もらいます', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'カリナさんに CDを もらいました。', 'Tôi đã nhận đĩa CD từ Karina.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '父に お金をもらいました。', 'Tôi đã nhận tiền từ bố.', '', NOW(), NOW(), g_id);

    -- 33. Mou V-mashita
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Đã làm rồi', 'もう V-ました', 'Đã làm... rồi', 'Hành động đã hoàn tất.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'もう 荷物を 送りましたか。', 'Bạn đã gửi hành lý đi chưa?', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'もう 昼ごはんを 食べました。', 'Tôi đã ăn cơm trưa rồi.', '', NOW(), NOW(), g_id);

    -------------------------------------------------------
    -- BÀI 8: TÍNH TỪ
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 8' LIMIT 1;

    -- 34. Adj-i desu
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Tĩnh từ đuôi i', 'N は Adj-い です', 'N thì... (đuôi i)', 'Khẳng định tính chất.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '富士山は 高いです。', 'Núi Phú Sĩ cao.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'この料理は おいしいです。', 'Món ăn này ngon.', '', NOW(), NOW(), g_id);

    -- 35. Adj-na desu
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Tĩnh từ đuôi na', 'N は Adj-な です', 'N thì... (đuôi na)', 'Khẳng định tính chất.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'この町は 静かです。', 'Thành phố này yên tĩnh.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'ワットさんは 親切です。', 'Thầy Watt thân thiện.', '', NOW(), NOW(), g_id);

    -- 36. Adj-i kunai desu
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "UsageNote", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Phủ định đuôi i', 'Adj-い (bỏ い) + くないです', 'Không...', 'Phủ định tính từ đuôi i.', 'ii -> yokunai', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'この本は おもしろくないです.', 'Cuốn sách này không hay.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '今日は 寒くないです。', 'Hôm nay không lạnh.', '', NOW(), NOW(), g_id);

    -- 37. Adj-na ja arimasen
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Phủ định đuôi na', 'Adj-な じゃありません', 'Không...', 'Phủ định tính từ đuôi na.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'あそこは べんりじゃありません。', 'Chỗ kia không tiện lợi.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'この町は にぎやかじゃありません。', 'Thành phố này không nhộn nhịp.', '', NOW(), NOW(), g_id);

    -- 38. Adj N
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Tính từ + N', 'Adj N', 'Tính từ bổ nghĩa cho N', 'Đuôi i giữ nguyên, đuôi na thêm な.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '奈良は 古い 町です。', 'Nara là một thành phố cổ.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'ミラーさんは ハンサムな 人です。', 'Anh Miller là người đẹp trai.', '', NOW(), NOW(), g_id);

    -------------------------------------------------------
    -- BÀI 9: SỞ THÍCH & KHẢ NĂNG
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 9' LIMIT 1;

    -- 39. N ga arimasu/wakarimasu
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Sở hữu/Trạng thái', 'N が あります / わかります', 'Có N / Hiểu N', 'Trợ từ が chỉ trạng thái.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '英語が わかります。', 'Tôi hiểu tiếng Anh.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '車が あります。', 'Tôi có xe ô tô.', '', NOW(), NOW(), g_id);

    -- 40. N ga suki/kirai
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Sở thích', 'N が 好きです / 嫌いです', 'Thích / Ghét N', 'Dùng trợ từ が cho cảm xúc.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '料理が 好きです。', 'Tôi thích nấu ăn.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '魚が 嫌いです。', 'Tôi ghét cá.', '', NOW(), NOW(), g_id);

    -- 41. Danna N
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Tính chất', 'どんな N', 'N như thế nào?', 'Hỏi về chủng loại/tính chất.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'どんな スポーツが 好きですか。', 'Bạn thích môn thể thao như thế nào?', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'どんな 飲み物が いいですか。', 'Bạn thích đồ uống như thế nào?', '', NOW(), NOW(), g_id);

    -- 42. Kara (Lý do)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Nguyên nhân', 'S1 から、S2', 'Vì S1 nên S2', 'Nối câu chỉ lý do.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '時間が ありませんから、読みません。', 'Vì không có thời gian nên tôi không đọc.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '暑いですから、窓を開けます。', 'Vì nóng nên tôi mở cửa sổ.', '', NOW(), NOW(), g_id);

    -------------------------------------------------------
    -- BÀI 10: SỰ TỒN TẠI
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 10' LIMIT 1;

    -- 43. N ni N ga arimasu
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Tồn tại vật', 'N に N が あります', 'Ở địa điểm có vật', 'Dùng cho vật vô tri.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '机の上に 本があります。', 'Trên bàn có cuốn sách.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '庭に 木があります。', 'Trong sân có cái cây.', '', NOW(), NOW(), g_id);

    -- 44. N ni N ga imasu
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Tồn tại người', 'N に N が います', 'Ở địa điểm có người/vật', 'Dùng cho sinh vật sống.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'あそこに 男の人が います。', 'Ở kia có người đàn ông.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '部屋に 猫が います。', 'Trong phòng có con mèo.', '', NOW(), NOW(), g_id);

    -- 45. N wa N ni arimasu/imasu
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Nhấn mạnh vị trí', 'N は N に あります/います', 'N thì ở địa điểm', 'Chủ thể đã được nhắc đến trước.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'ミラーさんは 事務所に います。', 'Anh Miller ở văn phòng.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '本は 机の上に あります。', 'Cuốn sách thì ở trên bàn.', '', NOW(), NOW(), g_id);

    -- 46. Ya (Liệt kê)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "UsageNote", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Liệt kê', 'N1 や N2', 'N1 và N2 (vẫn còn nữa)', 'Liệt kê không đầy đủ.', 'Khác với と (liệt kê toàn bộ).', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '店に パンや 卵が あります。', 'Ở cửa hàng có bánh mì, trứng...', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'かばんの中に 手紙や 写真があります。', 'Trong túi xách có thư, ảnh...', '', NOW(), NOW(), g_id);

	-------------------------------------------------------
    -- BÀI 11: CÁCH ĐẾM SỐ LƯỢNG
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 11' LIMIT 1;

    -- 47. Số lượng vật (Vị trí số từ)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Số lượng vật', 'N を Số lượng V', 'Làm V với số lượng N', 'Số từ thường đặt sau trợ từ và trước động từ.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'りんごを ４つ 買いました。', 'Tôi đã mua 4 quả táo.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '卵を １０買いました。', 'Tôi đã mua 10 quả trứng.', '', NOW(), NOW(), g_id);

    -- 48. Tần suất hành động
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Tần suất', 'Khoảng thời gian に Số lần V', 'Làm V mấy lần trong khoảng thời gian', 'Chỉ mức độ lặp lại của hành động.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '１か月に ２回 映画を 見ます。', 'Một tháng tôi xem phim 2 lần.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '１週間に ３回 テニスを します。', 'Một tuần tôi chơi tennis 3 lần.', '', NOW(), NOW(), g_id);

    -- 49. Giới hạn (Dake)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Chỉ duy nhất', 'Số lượng + だけ', 'Chỉ (số lượng)', 'Biểu thị sự giới hạn không thêm gì nữa.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '休みは 日曜日だけです。', 'Ngày nghỉ chỉ có Chủ Nhật.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'クラスに ベトナム人は 一人だけいます。', 'Trong lớp chỉ có duy nhất một người Việt Nam.', '', NOW(), NOW(), g_id);

    -- 50. Hỏi khoảng thời gian/giá cả
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Hỏi lượng', 'どのくらい / どのぐらい', 'Mất bao lâu / Khoảng bao nhiêu', 'Hỏi về thời gian hoặc tiền bạc.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '東京から 大阪まで どのくらい かかりますか。', 'Từ Tokyo đến Osaka mất bao lâu?', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '日本に どのくらい いますか。', 'Bạn ở Nhật bao lâu rồi?', '', NOW(), NOW(), g_id);

    -------------------------------------------------------
    -- BÀI 12: QUÁ KHỨ CỦA TÍNH TỪ & SO SÁNH
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 12' LIMIT 1;

    -- 51. So sánh hơn
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'So sánh hơn', 'N1 は N2 より Adj です', 'N1 Adj hơn N2', 'Dùng より để đặt sau đối tượng được so sánh.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'この車は あの車より 速いです。', 'Cái xe ô tô này nhanh hơn cái ô tô kia.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '今日は 昨日より 暑いです。', 'Hôm nay nóng hơn hôm qua.', '', NOW(), NOW(), g_id);

    -- 52. So sánh lựa chọn
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'So sánh lựa chọn', 'N1 と N2 と どちらが Adj ですか', 'N1 và N2 cái nào Adj hơn?', 'Hỏi để lựa chọn giữa 2 đối tượng.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'サッカーと 野球と どちらが おもしろいですか。', 'Bóng đá và bóng chày cái nào thú vị hơn?', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'コーヒーと 紅茶と どちらが 好きですか。', 'Cà phê và trà hồng cái nào bạn thích hơn?', '', NOW(), NOW(), g_id);

    -- 53. So sánh nhất
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'So sánh nhất', 'N1 [の中で] N2 が いchibann Adj です', 'Trong N1, N2 là Adj nhất', 'So sánh nhất trong một tập hợp.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '１年で いつが いちばん 暑いですか。', 'Trong một năm khi nào là nóng nhất?', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '家族の中で 誰が いちばん 背が高いですか。', 'Trong gia đình ai là người cao nhất?', '', NOW(), NOW(), g_id);

    -- 54. Quá khứ tính từ đuôi i
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Quá khứ đuôi i', 'Adj-i (bỏ い) + かったです', 'Đã... (tính từ đuôi i)', 'Thì quá khứ của tính từ đuôi i.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '昨日のパーティーは 楽しかったです。', 'Bữa tiệc hôm qua đã rất vui.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '旅行は よかったです。', 'Chuyến du lịch đã rất tốt.', '', NOW(), NOW(), g_id);

    -- 55. Quá khứ tính từ đuôi na/Danh từ
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Quá khứ đuôi na/N', 'Adj-na / N + でした', 'Đã là...', 'Thì quá khứ của tính từ đuôi na và danh từ.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '昨日は 雨でした。', 'Hôm qua đã trời mưa.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'お祭りは にぎやかでした。', 'Lễ hội đã rất nhộn nhịp.', '', NOW(), NOW(), g_id);

    -------------------------------------------------------
    -- BÀI 13: MONG MUỐN & MỤC ĐÍCH
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 13' LIMIT 1;

    -- 56. Mong muốn vật
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Mong muốn vật', 'N が ほしいです', 'Muốn có N', 'Diễn tả mong muốn sở hữu.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '私は 新しい車が ほしいです。', 'Tôi muốn có một chiếc xe hơi mới.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '誕生日に 何が ほしいですか。', 'Vào ngày sinh nhật bạn muốn gì?', '', NOW(), NOW(), g_id);

    -- 57. Mong muốn hành động
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Mong muốn làm', 'V-たいです', 'Muốn làm V', 'Bỏ ます thêm たいです.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '日本へ 行きたいです。', 'Tôi muốn đi Nhật.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'お腹が痛いですから、何も 食べたくないです。', 'Vì đau bụng nên tôi không muốn ăn gì cả.', '', NOW(), NOW(), g_id);

    -- 58. Mục đích di chuyển
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Đi để làm gì', 'N へ (V-masu/N) に 行きます', 'Đi đến đâu để làm gì', 'Chỉ mục đích di chuyển.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'デパートへ 買い物に 行きます。', 'Tôi đi trung tâm thương mại để mua sắm.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '日本へ 経済の勉強に 来ました。', 'Tôi đến Nhật để học kinh tế.', '', NOW(), NOW(), g_id);

    -------------------------------------------------------
    -- BÀI 14: THỂ TE (1) - SAI KHIẾN & ĐANG LÀM
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 14' LIMIT 1;

    -- 59. Yêu cầu (Kudasai)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Yêu cầu lịch sự', 'V-て ください', 'Hãy làm V', 'Dùng để nhờ vả hoặc yêu cầu.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'ここに 住所を 書いてください。', 'Hãy viết địa chỉ vào đây.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'すみませんが、塩を 取ってください。', 'Xin lỗi, hãy lấy hộ tôi lọ muối.', '', NOW(), NOW(), g_id);

    -- 60. Đang làm (Te-imasu)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Hành động đang diễn ra', 'V-て います(1)', 'Đang làm V', 'Hành động đang tiếp diễn tại thời điểm nói.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '今 本を 読んでいます。', 'Bây giờ tôi đang đọc sách.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'ミラーさんは 今 電話を かけています。', 'Anh Miller hiện đang gọi điện thoại.', '', NOW(), NOW(), g_id);

    -- 61. Đề nghị giúp đỡ
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Đề nghị giúp đỡ', 'V-ましょうか', 'Để tôi làm... nhé?', 'Người nói tự nguyện giúp đỡ đối phương.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'タクシーを 呼びましょうか。', 'Để tôi gọi taxi cho bạn nhé?', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '荷物を 持ちましょうか。', 'Để tôi cầm hành lý giúp bạn nhé?', '', NOW(), NOW(), g_id);

    -------------------------------------------------------
    -- BÀI 15: THỂ TE (2) - CHO PHÉP & CẤM ĐOÁN
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 15' LIMIT 1;

    -- 62. Xin phép (Te mo ii)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Xin phép', 'V-て も いいです', 'Làm V cũng được/Có thể làm V', 'Biểu thị sự cho phép.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '写真を 撮っても いいですか。', 'Tôi chụp ảnh có được không?', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'タバコを 吸っても いいですか。', 'Tôi hút thuốc có được không?', '', NOW(), NOW(), g_id);

    -- 63. Cấm đoán (Te wa ikemasen)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Cấm đoán', 'V-て は いけません', 'Không được làm V', 'Biểu thị sự cấm đoán mạnh mẽ.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'ここで タバコを 吸ってはいけません。', 'Không được hút thuốc ở đây.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'ここに 車を 止めてはいけません。', 'Không được đậu xe ở đây.', '', NOW(), NOW(), g_id);

    -- 64. Trạng thái kết quả
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Trạng thái/Kết quả', 'V-て います(2)', 'Đang (kết quả/nghề nghiệp)', 'Trạng thái còn lưu lại của hành động hoặc nghề nghiệp.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '私は 結婚しています。', 'Tôi đã kết hôn.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'IMCは コンピューターを 作っています。', 'Công ty IMC sản xuất máy tính.', '', NOW(), NOW(), g_id);

	-------------------------------------------------------
    -- BÀI 16: LIỆT KÊ HÀNH ĐỘNG & TÍNH TỪ
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 16' LIMIT 1;

    -- 65. Liệt kê hành động (Trình tự)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Liệt kê hành động', 'V1-て, V2-て, V3', 'Làm V1, rồi V2, rồi V3', 'Liệt kê các hành động theo trình tự thời gian.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '朝 起きて、顔を 洗って、朝ごはんを 食べます。', 'Sáng tôi thức dậy, rửa mặt rồi ăn sáng.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '神戸へ 行って、映画を 見て、お茶を 飲みました。', 'Tôi đã đi Kobe, xem phim rồi uống trà.', '', NOW(), NOW(), g_id);

    -- 66. Nối tính từ đuôi i
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Nối tính từ đuôi i', 'Adj1-くて, Adj2', 'Adj1 và Adj2', 'Cách nối 2 tính từ đuôi i.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'この部屋は 広くて、明るいです。', 'Căn phòng này rộng và sáng sủa.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '若くて、元気です。', 'Trẻ và khỏe mạnh.', '', NOW(), NOW(), g_id);

    -- 67. Nối tính từ na / danh từ
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Nối tính từ na/N', 'Adj-na / N + で, Adj2', 'Adj1/N và Adj2', 'Cách nối tính từ đuôi na hoặc danh từ.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '奈良は 静かで、きれいな 町です。', 'Nara là thành phố yên tĩnh và đẹp.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'カリナさんは 学生で、マリアさんは 主婦です。', 'Karina là sinh viên, còn Maria là nội trợ.', '', NOW(), NOW(), g_id);

    -- 68. V-te kara
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Hành động nối tiếp', 'V1-て から, V2', 'Sau khi làm V1, thì làm V2', 'Nhấn mạnh V2 xảy ra ngay sau khi V1 kết thúc.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '仕事が 終わってから、飲みに 行きます。', 'Sau khi xong việc, tôi sẽ đi uống bia.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'お金を 入れてから、ボタンを 押してください。', 'Sau khi bỏ tiền vào, hãy nhấn nút.', '', NOW(), NOW(), g_id);

    -- 69. Miêu tả đặc điểm
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Miêu tả bộ phận', 'N1 は N2 が Adj です', 'N1 có N2 thì Adj', 'Miêu tả đặc điểm bộ phận cơ thể hoặc thành phần.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'マリアさんは 目が 大きいです。', 'Chị Maria có đôi mắt to.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '大阪は 食べ物が おいしいです。', 'Osaka thì đồ ăn ngon.', '', NOW(), NOW(), g_id);

    -------------------------------------------------------
    -- BÀI 17: THỂ NAI (PHỦ ĐỊNH NGẮN)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 17' LIMIT 1;

    -- 70. Nai de kudasai
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Yêu cầu không làm', 'V-ないで ください', 'Đừng làm V', 'Yêu cầu lịch sự đối phương không thực hiện hành động.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'ここで 写真を 撮らないで ください。', 'Xin đừng chụp ảnh ở đây.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '危ないですから、入らないで ください。', 'Vì nguy hiểm nên xin đừng vào.', '', NOW(), NOW(), g_id);

    -- 71. Nakereba narimasen
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Nghĩa vụ', 'V-なければ なりません', 'Phải làm V', 'Diễn tả nghĩa vụ bắt buộc không thể không làm.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '薬を 飲まなければ なりません。', 'Tôi phải uống thuốc.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '明日は 早く 起きなければ なりません。', 'Ngày mai tôi phải dậy sớm.', '', NOW(), NOW(), g_id);

    -- 72. Nakutemo ii desu
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Không cần thiết', 'V-なくても いいです', 'Không cần làm V cũng được', 'Biểu thị sự không cần thiết của hành động.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '明日 来なくても いいです。', 'Ngày mai bạn không cần đến cũng được.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '名前を 書かなくても いいです。', 'Không cần viết tên cũng được.', '', NOW(), NOW(), g_id);

    -- 73. Madeni
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Thời hạn', 'N (thời gian) までに V', 'Làm V trước thời hạn N', 'Chỉ hạn chót phải thực hiện hành động.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '会議は ５時までに 終わります。', 'Cuộc họp sẽ kết thúc trước 5 giờ.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '土曜日までに 本を 返さなければなりません。', 'Phải trả sách trước thứ Bảy.', '', NOW(), NOW(), g_id);

    -------------------------------------------------------
    -- BÀI 18: THỂ TỪ ĐIỂN (KHẢ NĂNG)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 18' LIMIT 1;

    -- 74. Koto ga dekimasu
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Khả năng', 'V-ること が できます', 'Có thể làm V', 'Diễn tả năng lực hoặc điều kiện cho phép.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '漢字を 読むことが できます。', 'Tôi có thể đọc được chữ Hán.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'ここで カードを 使うことが できますか。', 'Ở đây có thể dùng thẻ được không?', '', NOW(), NOW(), g_id);

    -- 75. Shumi wa...
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Sở thích', '趣味は V-ること です', 'Sở thích là làm V', 'Danh từ hóa động từ để nói về sở thích.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '私の趣味は 写真を 撮ることです。', 'Sở thích của tôi là chụp ảnh.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '趣味は 音楽を 聞くことです。', 'Sở thích của tôi là nghe nhạc.', '', NOW(), NOW(), g_id);

    -- 76. Mae ni
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Trước khi', 'V1-る / N の + まえに, V2', 'Trước khi làm V1, làm V2', 'Chỉ trình tự thời gian trước sau.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '寝る前に、日記を 書きます。', 'Trước khi đi ngủ, tôi viết nhật ký.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '食事の前に、手を 洗います。', 'Trước bữa ăn, tôi rửa tay.', '', NOW(), NOW(), g_id);

    -------------------------------------------------------
    -- BÀI 19: THỂ TA (KINH NGHIỆM)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 19' LIMIT 1;

    -- 77. Koto ga arimasu
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Kinh nghiệm', 'V-た こと が あります', 'Đã từng làm V', 'Diễn tả trải nghiệm đã xảy ra trong quá khứ.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '北海道へ 行ったことが あります。', 'Tôi đã từng đi Hokkaido.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '馬に 乗ったことが ありますか。', 'Bạn đã từng cưỡi ngựa chưa?', '', NOW(), NOW(), g_id);

    -- 78. Tari... tari shimasu
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Liệt kê hành động', 'V1-たり, V2-たり します', 'Lúc thì V1, lúc thì V2', 'Liệt kê các hành động tiêu biểu (không theo trình tự).', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '日曜日は 買い物したり、映画を 見たり します。', 'Chủ nhật tôi lúc thì đi mua sắm, lúc thì xem phim.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '昨日 テニスを したり、散歩したり しました。', 'Hôm qua tôi đã lúc thì chơi tennis, lúc thì đi dạo.', '', NOW(), NOW(), g_id);

    -- 79. Sự thay đổi (Narimasu)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Biến đổi trạng thái', 'Adj / N + なります', 'Trở nên... / Thành...', 'Diễn tả sự thay đổi trạng thái tự nhiên.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '寒く なりました。', 'Trời đã trở nên lạnh rồi.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '２５歳に なりました。', 'Tôi đã tròn 25 tuổi.', '', NOW(), NOW(), g_id);

    -------------------------------------------------------
    -- BÀI 20: THỂ THÔNG THƯỜNG
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 20' LIMIT 1;

    -- 80. Thể ngắn (Động từ)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'V thân mật', 'V-る / V-ない / V-た', 'Làm / Không / Đã làm', 'Dùng trong giao tiếp thân mật với bạn bè, gia đình.', 'Thân mật', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '明日 行く？', 'Mai đi không?', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '昨日 どこか 行った？', 'Hôm qua đã đi đâu đó à?', '', NOW(), NOW(), g_id);

    -- 81. Thể ngắn (Tính từ/Danh từ)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'N/Adj thân mật', 'N / Adj-na + だ', 'Là... (thân mật)', 'Thay です bằng だ hoặc lược bỏ.', 'Thân mật', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '今日は 雨だ。', 'Hôm nay trời mưa đấy.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'この料理、おいしい？', 'Món này ngon không?', '', NOW(), NOW(), g_id);

    -- 82. Kedo
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Nối câu thân mật', 'S + けど', 'S nhưng mà...', 'Cách nói thân mật của が dùng để nối câu tương phản.', 'Thân mật', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'その映画、見たけど おもしろくなかった。', 'Phim đó tớ xem rồi nhưng không hay lắm.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'おなかが すいたけど、食べるものが ない。', 'Đói bụng rồi nhưng chẳng có gì ăn cả.', '', NOW(), NOW(), g_id);

	-------------------------------------------------------
    -- BÀI 21: TƯỜNG THUẬT & DỰ ĐOÁN
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 21' LIMIT 1;

    -- 83. Bày tỏ ý kiến (To omoimasu)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Bày tỏ ý kiến', 'Thể thông thường + と 思います', 'Tôi nghĩ là...', 'Dùng để bày tỏ ý kiến, suy đoán hoặc dự định của cá nhân.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '明日 雨が 降ると 思います。', 'Tôi nghĩ là ngày mai trời sẽ mưa.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '日本は 物価が 高いと 思います。', 'Tôi nghĩ là giá cả ở Nhật đắt đỏ.', '', NOW(), NOW(), g_id);

    -- 84. Trích dẫn lời nói (To iimasu)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Trích dẫn lời nói', 'Thể thông thường + と 言いました', 'Đã nói là...', 'Dùng để tường thuật lại nội dung lời nói của người khác.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '寝る前に 「おやすみなさい」と 言います。', 'Trước khi đi ngủ, chúng ta nói "Chúc ngủ ngon".', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'ミラーさんは 「来週 東京へ 行きます」と 言いました。', 'Anh Miller đã nói là "Tuần sau tôi sẽ đi Tokyo".', '', NOW(), NOW(), g_id);

    -- 85. Xác nhận/Dự đoán (Deshou)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Xác nhận/Dự đoán', 'S + でしょう', 'S có đúng không? / S chắc là...', 'Dùng để hỏi sự đồng ý hoặc đưa ra dự đoán nhẹ nhàng.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '明日は パーティーに 行くでしょう？', 'Ngày mai bạn đi dự tiệc chứ nhỉ?', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '北海道は 寒いでしょう。', 'Hokkaido chắc là lạnh lắm nhỉ.', '', NOW(), NOW(), g_id);

    -------------------------------------------------------
    -- BÀI 22: MỆNH ĐỀ ĐỊNH NGỮ (BỔ NGHĨA DANH TỪ)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 22' LIMIT 1;

    -- 86. Bổ nghĩa danh từ (V-short + N)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Mệnh đề định ngữ', 'V (thể ngắn) + N', 'Cái N mà...', 'Dùng một mệnh đề để làm rõ nghĩa cho danh từ đứng sau.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'これは ミラーさんが 作った ケーキです。', 'Đây là chiếc bánh mà anh Miller đã làm.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'あそこに いる 人は 誰ですか。', 'Người đang ở đằng kia là ai thế?', '', NOW(), NOW(), g_id);

    -- 87. Bổ nghĩa cho danh từ kế hoạch
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Danh từ kế hoạch', 'V-る + 時間/約束/用事', 'Thời gian/Hẹn... để làm V', 'Dùng động từ thể từ điển bổ nghĩa cho các danh từ chỉ thời gian, hẹn ước.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '明日 友達と 会う 約束が あります。', 'Ngày mai tôi có hẹn gặp bạn.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '朝ごはんを 食べる 時間が ありません。', 'Tôi không có thời gian ăn sáng.', '', NOW(), NOW(), g_id);

    -------------------------------------------------------
    -- BÀI 23: KHI... THÌ (TOKI) & HỆ QUẢ (TO)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 23' LIMIT 1;

    -- 88. Toki (Khi...)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Khi...', 'V / Adj / N + とき', 'Khi (làm) V / Khi là...', 'Chỉ thời điểm hoặc trạng thái khi một hành động khác xảy ra.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '図書館で 本を 借りるとき、カードが 要ります。', 'Khi mượn sách ở thư viện cần có thẻ.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '暇なとき、本を 読んだり します。', 'Khi rảnh rỗi, tôi thường đọc sách.', '', NOW(), NOW(), g_id);

    -- 89. Hệ quả tất yếu (To)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Hệ quả tất yếu', 'V-る + と、S2', 'Hễ làm V thì S2 xảy ra', 'Dùng cho quy luật tự nhiên, máy móc hoặc chỉ đường.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'このボタンを 押すと、お釣りが 出ます。', 'Hễ ấn nút này thì tiền thừa sẽ ra.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'これを 回すと、音が 大きくなります。', 'Hễ vặn cái này thì âm thanh sẽ to lên.', '', NOW(), NOW(), g_id);

    -------------------------------------------------------
    -- BÀI 24: CHO NHẬN TRỢ GIÚP (TE-FORM)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 24' LIMIT 1;

    -- 90. Te-agemasu (Làm giúp)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Làm giúp ai đó', 'V-て あげます', 'Làm V cho ai đó', 'Người nói làm việc gì đó có lợi cho người khác.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '私は 木村さんに 本を 貸して あげました。', 'Tôi đã cho chị Kimura mượn sách.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'タクシーを 呼んで あげましょうか。', 'Tôi gọi taxi giúp bạn nhé?', '', NOW(), NOW(), g_id);

    -- 91. Te-moraimasu (Được làm giúp)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Được ai đó giúp', 'V-て もらいます', 'Được ai đó làm giúp V', 'Bày tỏ lòng biết ơn khi nhận được sự giúp đỡ từ người khác.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '私は 鈴木さんに 漢字を 教えて もらいました。', 'Tôi đã được anh Suzuki dạy chữ Hán.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '山田さんに 地図を 書いて もらいました。', 'Tôi đã được anh Yamada vẽ bản đồ cho.', '', NOW(), NOW(), g_id);

    -- 92. Te-kuremasu (Ai đó làm giúp mình)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Ai đó làm giúp mình', 'V-て くれます', 'Ai đó làm V cho tôi', 'Người khác chủ động làm gì đó cho mình (hoặc người nhà mình).', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '家内は 私のシャツを 洗って くれました。', 'Vợ tôi đã giặt áo sơ mi giúp tôi.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '佐藤さんは お菓子を 買って くれました。', 'Chị Sato đã mua kẹo cho tôi.', '', NOW(), NOW(), g_id);

    -------------------------------------------------------
    -- BÀI 25: CÂU ĐIỀU KIỆN (TARA) & NGHỊCH LÝ (TEMO)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 25' LIMIT 1;

    -- 93. Câu điều kiện (Tara)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Nếu... thì', 'V-たら、S2', 'Nếu làm V thì S2', 'Dùng cho các giả định trong tương lai hoặc điều kiện cần để thực hiện hành động sau.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '雨が 降ったら、出かけません。', 'Nếu trời mưa, tôi sẽ không ra ngoài.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '安かったら、このパソコンを 買います。', 'Nếu rẻ, tôi sẽ mua chiếc máy tính này.', '', NOW(), NOW(), g_id);

    -- 94. Nghịch lý (Temo)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Dù... vẫn', 'V-ても、S2', 'Cho dù... thì cũng S2', 'Diễn tả một kết quả trái ngược với dự đoán thông thường.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), '雨が 降っても、洗濯します。', 'Cho dù trời mưa, tôi vẫn giặt đồ.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), '高くても、この辞書が ほしいです。', 'Dù đắt tôi vẫn muốn có cuốn từ điển này.', '', NOW(), NOW(), g_id);

    -- 95. Nhấn mạnh nghịch lý (Ikura)
    g_id := gen_random_uuid();
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Formality", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (g_id, 'Dù bao nhiêu đi nữa', 'いくら + V-ても', 'Cho dù... bao nhiêu đi nữa', 'Đi kèm với mẫu câu Temo để nhấn mạnh mức độ của điều kiện.', 'Lịch sự', 1, n5_id, t_id, l_id, NOW(), NOW()) ON CONFLICT DO NOTHING;
    INSERT INTO "Examples" ("ExampleID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt", "GrammarID") VALUES 
    (gen_random_uuid(), 'いくら 考えても、わかりません。', 'Dù có suy nghĩ bao nhiêu đi nữa, tôi vẫn không hiểu.', '', NOW(), NOW(), g_id),
    (gen_random_uuid(), 'いくら 練習しても、上手になりません。', 'Dù luyện tập bao nhiêu đi nữa cũng không giỏi lên được.', '', NOW(), NOW(), g_id);

	RAISE NOTICE 'Đã tạo xong ngữ pháp N5.';

END $$;

-------------------------------------------------------
-- 5. KANJI N5: PHÂN CHI TIẾT THEO TỪNG BÀI (BÀI 1 - 25)
-------------------------------------------------------
DO $$
DECLARE 
    n5_id uuid := '550e8400-e29b-41d4-a716-446655440000';
	t_id uuid;
    l_id uuid;
BEGIN
	-- 1. Lấy TopicID (Phải chắc chắn Topic 'Kanji N5 Tổng Hợp' đã tồn tại)
    SELECT "TopicID" INTO t_id FROM "Topics" WHERE "TopicName" = 'Kanji N5 Tổng Hợp' LIMIT 1;
	
	-- Chỉ kiểm tra t_id ở đây, l_id sẽ kiểm tra theo từng bài
    IF t_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy TopicID "Kanji N5 Tổng Hợp". Vui lòng chạy lệnh tạo Topic trước!';
    END IF;

    -------------------------------------------------------
    -- BÀI 1: CHÀO HỎI & GIỚI THIỆU
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 1' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "Popularity", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '人', 'ジン, ニン', 'ひと', 'Người', 2, '人', 1, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '学', 'ガク', 'まな.ぶ', 'Học', 8, '子', 2, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '生', 'セイ, ショウ', 'い.きる', 'Sinh', 5, '生', 3, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '先', 'セン', 'さき', 'Trước', 6, '儿', 4, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '日', 'ニチ', 'ひ', 'Ngày/Mặt trời', 4, '日', 5, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 2: ĐỒ VẬT SỞ HỮU
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 2' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "Popularity", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '本', 'ホン', 'もと', 'Sách/Gốc', 5, '木', 6, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '車', 'シャ', 'くるま', 'Xe ô tô', 7, '車', 7, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '何', 'カ', 'なに, なん', 'Cái gì', 7, '人', 8, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '名', 'メイ, ミョウ', 'な', 'Tên', 6, '口', 9, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '語', 'ゴ', 'かた.る', 'Ngôn ngữ', 14, '言', 10, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 3: ĐỊA ĐIỂM
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 3' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "Popularity", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '円', 'エン', 'まる.い', 'Tiền Yên/Tròn', 4, '囗', 11, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '万', 'マン, バン', 'よろず', 'Vạn (10.000)', 3, '一', 12, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '百', 'ヒャク', 'もも', 'Trăm', 6, '白', 13, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '千', 'セン', 'ち', 'Nghìn', 3, '十', 14, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '社', 'シャ', 'やしろ', 'Công ty/Đền', 8, '示', 15, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 4: THỜI GIAN & NGÀY THÁNG
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 4' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "Popularity", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '時', 'ジ', 'とき', 'Giờ', 10, '日', 16, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '分', 'ブン, フン', 'わ.ける', 'Phút/Hiểu', 4, '刀', 17, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '半', 'ハン', 'なか.ba', 'Một nửa', 5, '十', 18, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '午', 'ゴ', 'うま', 'Ngọ (Trưa)', 4, '十', 19, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '月', 'ゲツ, ガツ', 'つき', 'Tháng/Trăng', 4, '月', 20, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 5: DI CHUYỂN
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 5' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "Popularity", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '行', 'コウ', 'い.く', 'Đi', 6, '行', 21, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '来', 'ライ', 'く.る', 'Đến', 7, '木', 22, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '帰', 'キ', 'かえ.る', 'Về', 10, '止', 23, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '年', 'ネン', 'とし', 'Năm', 6, '干', 24, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '週', 'シュウ', '---', 'Tuần', 11, '⻌', 25, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 6: ĂN UỐNG & HÀNH ĐỘNG
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 6' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "Popularity", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '食', 'ショク', 'た.べる', 'Ăn', 9, '食', 26, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '飲', 'イン', 'の.む', 'Uống', 12, '食', 27, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '見', 'ケン', 'み.る', 'Nhìn/Xem', 7, '見', 28, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '聞', 'ブン', 'き.く', 'Nghe', 14, '耳', 29, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '買', 'バイ', 'か.う', 'Mua', 12, '貝', 30, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 7: CÔNG CỤ & TẶNG QUÀ
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 7' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "Popularity", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '手', 'シュ', 'て', 'Tay', 4, '手', 31, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '紙', 'シ', 'かみ', 'Giấy', 10, '糸', 32, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '父', 'フ', 'ちち', 'Bố', 4, '父', 33, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '母', 'ボ', 'はは', 'Mẹ', 5, '毋', 34, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '子', 'シ', 'こ', 'Con', 3, '子', 35, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 8: TÍNH TỪ CƠ BẢN
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 8' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "Popularity", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '大', 'ダイ', 'おお.kiい', 'Lớn', 3, '大', 36, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '小', 'ショウ', 'ちい.さい', 'Nhỏ', 3, '小', 37, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '高', 'コウ', 'たか.い', 'Cao/Đắt', 10, '高', 38, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '安', 'アン', 'やす.い', 'Rẻ/An tâm', 6, '宀', 39, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '新', 'シン', 'あたら.しい', 'Mới', 13, '斤', 40, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 9: TRẠNG THÁI & SỞ THÍCH
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 9' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "Popularity", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '友', 'ユウ', 'とも', 'Bạn bè', 4, '又', 41, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '書', 'ショ', 'か.く', 'Viết', 10, '曰', 42, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '少', 'ショウ', 'すく.ない', 'Ít', 4, '小', 43, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '多', 'タ', 'おお.い', 'Nhiều', 6, '夕', 44, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '長', 'チョウ', 'なが.い', 'Dài', 8, '長', 45, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 10: VỊ TRÍ & TỒN TẠI
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 10' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "Popularity", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '上', 'ジョウ', 'うえ', 'Trên', 3, '一', 46, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '下', 'カ', 'した', 'Dưới', 3, '一', 47, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '中', 'チュウ', 'なか', 'Trong/Giữa', 4, '丨', 48, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '右', 'ウ', 'みぎ', 'Bên phải', 5, '口', 49, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '左', 'サ', 'ひだり', 'Bên trái', 5, '工', 50, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;
	
	-------------------------------------------------------
    -- BÀI 11: SỐ LƯỢNG & ĐƠN VỊ ĐẾM
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 11' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "Popularity", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '枚', 'マイ', '---', 'Tờ, lá (vật mỏng)', 8, '木', 51, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '台', 'ダイ, タイ', '---', 'Cái (máy móc, xe)', 5, '口', 52, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '回', 'カイ', 'まわ.る', 'Lần / Vòng quanh', 6, '囗', 53, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 12: SO SÁNH & THỜI TIẾT
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 12' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "Popularity", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '雨', 'ウ', 'あめ', 'Mưa', 8, '雨', 54, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '天', 'テン', 'あめ', 'Trời', 4, '大', 55, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '気', 'キ', '---', 'Khí / Tâm trạng', 6, '气', 56, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '風', 'フウ', 'かぜ', 'Gió', 9, '風', 57, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 13: MONG MUỐN & CƠ THỂ
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 13' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "Popularity", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '口', 'コウ', 'くち', 'Miệng', 3, '口', 58, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '目', 'モク', 'め', 'Mắt', 5, '目', 59, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '耳', 'ジ', 'みみ', 'Tai', 6, '耳', 60, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '足', 'ソク', 'あし', 'Chân', 7, '足', 61, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 14: THỂ TE & ĐỊA ĐIỂM CÔNG CỘNG
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 14' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "Popularity", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '駅', 'エキ', '---', 'Nhà ga', 14, '馬', 62, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '電', 'デン', '---', 'Điện', 13, '雨', 63, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '話', 'ワ', 'はな.す', 'Nói chuyện', 13, '言', 64, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '出', 'シュツ', 'で.る, だ.す', 'Ra / Đưa ra', 5, '凵', 65, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 15: SỞ HỮU & CÔNG VIỆC
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 15' LIMIT 1;

    INSERT INTO "Kanjis" 
    ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "Popularity", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") 
    VALUES
    (gen_random_uuid(), '住', 'ジュウ', 'す.む', 'Cư trú / Sống', 7, '人', 66, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '所', 'ショ', 'ところ', 'Nơi chốn', 8, '戸', 67, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '知', 'チ', 'し.る', 'Biết', 8, '矢', 68, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '工', 'コウ', '---', 'Công việc / Kỹ thuật', 3, '工', 69, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Character") DO NOTHING;
	
    -------------------------------------------------------
    -- BÀI 16: LIÊN KẾT HÀNH ĐỘNG
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 16' LIMIT 1;
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "Popularity", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") VALUES
    (gen_random_uuid(), '入', 'ニュウ', 'はい.る, い.れる', 'Vào / Cho vào', 2, '入', 70, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '体', 'タイ', 'からだ', 'Cơ thể', 7, '人', 71, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '明', 'メイ', 'あか.るい', 'Sáng', 8, '日', 72, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '暗', 'アン', 'くら.い', 'Tối', 13, '日', 73, 1, n5_id, t_id, l_id, NOW(), NOW(), '') ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 17: PHỦ ĐỊNH & SỨC KHỎE
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 17' LIMIT 1;
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "Popularity", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") VALUES
    (gen_random_uuid(), '病', 'ビョウ', 'やまい', 'Bệnh', 10, '疒', 74, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '院', 'イン', '---', 'Viện (Bệnh viện)', 10, '阜', 75, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '医', 'イ', '---', 'Y (Bác sĩ)', 7, '匚', 76, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '者', 'シャ', 'もの', 'Người', 8, '老', 77, 1, n5_id, t_id, l_id, NOW(), NOW(), '') ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 18: KHẢ NĂNG & THIÊN NHIÊN
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 18' LIMIT 1;
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "Popularity", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") VALUES
    (gen_random_uuid(), '山', 'サン', 'やま', 'Núi', 3, '山', 78, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '川', 'セン', 'かわ', 'Sông', 3, '巛', 79, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '田', 'デン', 'た', 'Ruộng', 5, '田', 80, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '海', 'カイ', 'うみ', 'Biển', 9, '水', 81, 1, n5_id, t_id, l_id, NOW(), NOW(), '') ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 19: KINH NGHIỆM & TRẠNG THÁI (NGŨ HÀNH)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 19' LIMIT 1;
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "Popularity", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") VALUES
    (gen_random_uuid(), '火', 'カ', 'ひ', 'Lửa', 4, '火', 82, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '水', 'スイ', 'みず', 'Nước', 4, '水', 83, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '木', 'モク', 'き', 'Cây', 4, '木', 84, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '金', 'キン', 'かね', 'Vàng / Tiền', 8, '金', 85, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '土', 'ド', 'つち', 'Đất', 3, '土', 86, 1, n5_id, t_id, l_id, NOW(), NOW(), '') ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 20: GIAO TIẾP THÂN MẬT
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 20' LIMIT 1;
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "Popularity", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") VALUES
    (gen_random_uuid(), '道', 'ドウ', 'みち', 'Đường / Đạo', 12, '辵', 87, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '店', 'テン', 'みせ', 'Cửa hàng', 8, '广', 88, 1, n5_id, t_id, l_id, NOW(), NOW(), '') ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 21: TƯỜNG THUẬT & DỰ ĐOÁN
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 21' LIMIT 1;
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "Popularity", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") VALUES
    (gen_random_uuid(), '思', 'シ', 'おも.う', 'Nghĩ', 9, '心', 89, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '言', 'ゲン, ゴン', 'い.う, こと', 'Nói', 7, '言', 90, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '物', 'ブツ, モツ', 'もの', 'Vật / Đồ vật', 8, '牛', 91, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '正', 'セイ, ショウ', 'ただ.しい', 'Chính xác / Đúng', 5, '止', 92, 1, n5_id, t_id, l_id, NOW(), NOW(), '') ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 22: MỆNH ĐỀ ĐỊNH NGỮ (TRANG PHỤC)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 22' LIMIT 1;
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "Popularity", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") VALUES
    (gen_random_uuid(), '着', 'チャク', 'き.る, つ.く', 'Mặc / Đến nơi', 12, '羊', 93, 1, n5_id, t_id, l_id, NOW(), NOW(), '') ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 23: PHƯƠNG HƯỚNG
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 23' LIMIT 1;
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "Popularity", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") VALUES
    (gen_random_uuid(), '東', 'トウ', 'ひがし', 'Phía Đông', 8, '木', 94, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '西', 'セイ, サイ', 'にし', 'Phía Tây', 6, '襾', 95, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '南', 'ナン', 'みなみ', 'Phía Nam', 9, '十', 96, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '北', 'ホク', 'きた', 'Phía Bắc', 5, '匕', 97, 1, n5_id, t_id, l_id, NOW(), NOW(), '') ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 24: GIA ĐÌNH
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 24' LIMIT 1;
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "Popularity", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") VALUES
    (gen_random_uuid(), '兄', 'キョウ', 'あに', 'Anh trai', 5, '儿', 98, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '姉', 'シ', 'あね', 'Chị gái', 8, '女', 99, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '弟', 'ダイ', 'おとうと', 'Em trai', 7, '弓', 100, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '妹', 'マイ', 'いもうと', 'Em gái', 8, '女', 101, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '家', 'カ', 'いえ, うち', 'Nhà / Gia đình', 10, '宀', 102, 1, n5_id, t_id, l_id, NOW(), NOW(), '') ON CONFLICT ("Character") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 25: VẬN ĐỘNG & KẾT THÚC
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 25' LIMIT 1;
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "Popularity", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "StrokeGif") VALUES
    (gen_random_uuid(), '運', 'ウン', 'はこ.ぶ', 'Vận chuyển', 12, '辵', 103, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '動', 'ドウ', 'うご.く', 'Chuyển động', 11, '力', 104, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '止', 'シ', 'と.まる, と.める', 'Dừng lại', 4, '止', 105, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '歩', 'ホ', 'ある.く', 'Đi bộ', 8, '止', 106, 1, n5_id, t_id, l_id, NOW(), NOW(), '') ON CONFLICT ("Character") DO NOTHING;
	
	RAISE NOTICE 'Đã tạo xong kanji N5.';

END $$;

-------------------------------------------------------
-- 6. TỪ VỰNG N5 CHI TIẾT BÀI 1 - 25
-------------------------------------------------------
DO $$
DECLARE 
    n5_id uuid := '550e8400-e29b-41d4-a716-446655440000';
    l_id uuid;
    t_id uuid;
	v_id uuid;
BEGIN
    -- 1. Lấy TopicID (Phải chắc chắn Topic 'Kanji N5 Tổng Hợp' đã tồn tại)
    SELECT "TopicID" INTO t_id FROM "Topics" WHERE "TopicName" = 'Từ Vựng N5 Tổng Hợp' LIMIT 1;
	
	-- Chỉ kiểm tra t_id ở đây, l_id sẽ kiểm tra theo từng bài
    IF t_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy TopicID "Từ Vựng N5 Tổng Hợp". Vui lòng chạy lệnh tạo Topic trước!';
    END IF;

    -------------------------------------------------------
    -- BÀI 1: CHÀO HỎI & NGHỀ NGHIỆP
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 1' LIMIT 1;

    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "WordType", "IsCommon", "Priority", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '私', 'わたし', 'Tôi', 'Danh từ', true, 1, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '学生', 'がくせい', 'Sinh viên', 'Danh từ', true, 2, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '先生', 'せんせい', 'Thầy giáo/Cô giáo', 'Danh từ', true, 3, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '会社員', 'かいしゃいん', 'Nhân viên công ty', 'Danh từ', true, 4, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '銀行員', 'ぎんこういん', 'Nhân viên ngân hàng', 'Danh từ', true, 5, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- VÍ DỤ CHO BÀI 1: CHÀO HỎI & NGHỀ NGHIỆP
    -------------------------------------------------------

    -- 1. 私 (Tôi)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '私' AND "Reading" = 'わたし' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '私はマインです。', 'Tôi là Nam.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '私はベトナム人です。', 'Tôi là người Việt Nam.', '', NOW(), NOW());
    END IF;

    -- 2. 学生 (Sinh viên)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '学生' AND "Reading" = 'がくせい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '彼は学生です。', 'Anh ấy là sinh viên.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '学生じゃありません。', 'Tôi không phải là sinh viên.', '', NOW(), NOW());
    END IF;

    -- 3. 先生 (Thầy/Cô giáo)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '先生' AND "Reading" = 'せんせい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'ワット先生はイギリス人です。', 'Thầy Watt là người Anh.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'あの方は先生ですか。', 'Vị kia có phải là giáo viên không?', '', NOW(), NOW());
    END IF;

    -- 4. 会社員 (Nhân viên công ty)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '会社員' AND "Reading" = 'かいしゃいん' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '私は会社員です。', 'Tôi là nhân viên công ty.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'ミラさんは会社員ですか。', 'Anh Miller có phải là nhân viên công ty không?', '', NOW(), NOW());
    END IF;

    -- 5. 銀行員 (Nhân viên ngân hàng)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '銀行員' AND "Reading" = 'ぎんこういん' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '田中さんは銀行員です。', 'Anh Tanaka là nhân viên ngân hàng.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '母は銀行員です。', 'Mẹ tôi là nhân viên ngân hàng.', '', NOW(), NOW());
    END IF;

    -------------------------------------------------------
    -- BÀI 2: ĐỒ VẬT XUNG QUANH
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 2' LIMIT 1;

    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "WordType", "IsCommon", "Priority", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '本', 'ほん', 'Sách', 'Danh từ', true, 6, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '辞書', 'じしょ', 'Từ điển', 'Danh từ', true, 7, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '雑誌', 'ざっし', 'Tạp chí', 'Danh từ', true, 8, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '新聞', 'しんぶん', 'Tờ báo', 'Danh từ', true, 9, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '時計', 'とけい', 'Đồng hồ', 'Danh từ', true, 10, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- VÍ DỤ CHO BÀI 2: ĐỒ VẬT XUNG QUANH
    -------------------------------------------------------

    -- 1. 本 (Sách)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '本' AND "Reading" = 'ほん' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'これは日本語の本です。', 'Đây là cuốn sách tiếng Nhật.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'その本は私のです。', 'Cuốn sách đó là của tôi.', '', NOW(), NOW());
    END IF;

    -- 2. 辞書 (Từ điển)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '辞書' AND "Reading" = 'じしょ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'それは英語の辞書です。', 'Đó là từ điển tiếng Anh.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '辞書で調べます。', 'Tra cứu bằng từ điển.', '', NOW(), NOW());
    END IF;

    -- 3. 雑誌 (Tạp chí)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '雑誌' AND "Reading" = 'ざっし' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'カメラの雑誌を読みます。', 'Tôi đọc tạp chí về máy ảnh.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'この雑誌はいくらですか。', 'Cuốn tạp chí này bao nhiêu tiền?', '', NOW(), NOW());
    END IF;

    -- 4. 新聞 (Tờ báo)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '新聞' AND "Reading" = 'しんぶん' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '毎朝新聞を読みます。', 'Mỗi sáng tôi đều đọc báo.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'それは今日の新聞です。', 'Đó là tờ báo của ngày hôm nay.', '', NOW(), NOW());
    END IF;

    -- 5. 時計 (Đồng hồ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '時計' AND "Reading" = 'とけい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'この時計は高いです。', 'Cái đồng hồ này đắt.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'あの方は新しい時計を買いました。', 'Vị kia đã mua một cái đồng hồ mới.', '', NOW(), NOW());
    END IF;

    -------------------------------------------------------
    -- BÀI 3: ĐỊA ĐIỂM & GIÁ CẢ
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 3' LIMIT 1;

    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "WordType", "IsCommon", "Priority", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '教室', 'きょうしつ', 'Lớp học', 'Danh từ', true, 11, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '食堂', 'しょくどう', 'Nhà ăn', 'Danh từ', true, 12, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '受付', 'うけつけ', 'Quầy lễ tân', 'Danh từ', true, 13, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '事務所', 'じむしょ', 'Văn phòng', 'Danh từ', true, 14, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '会議室', 'かいぎしつ', 'Phòng họp', 'Danh từ', true, 15, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- VÍ DỤ CHO BÀI 3: ĐỊA ĐIỂM & GIÁ CẢ
    -------------------------------------------------------

    -- 1. 教室 (Lớp học)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '教室' AND "Reading" = 'きょうしつ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '教室はあちらです。', 'Lớp học ở phía kia.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'ここは３階の教室です。', 'Đây là lớp học ở tầng 3.', '', NOW(), NOW());
    END IF;

    -- 2. 食堂 (Nhà ăn)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '食堂' AND "Reading" = 'しょくどう' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '食堂で昼ご飯を食べます。', 'Ăn trưa tại nhà ăn.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '食堂はどこですか。', 'Nhà ăn ở đâu vậy?', '', NOW(), NOW());
    END IF;

    -- 3. 受付 (Quầy lễ tân)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '受付' AND "Reading" = 'うけつけ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '受付は１階です。', 'Quầy lễ tân ở tầng 1.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '受付で聞きます。', 'Hỏi tại quầy lễ tân.', '', NOW(), NOW());
    END IF;

    -- 4. 事務所 (Văn phòng)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '事務所' AND "Reading" = 'じむしょ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '事務所に先生がいます。', 'Trong văn phòng có thầy giáo.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '事務所はあそこです。', 'Văn phòng ở đằng kia.', '', NOW(), NOW());
    END IF;

    -- 5. 会議室 (Phòng họp)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '会議室' AND "Reading" = 'かいぎしつ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '会議室はどこですか。', 'Phòng họp ở đâu thế?', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '会議室は２階にあります。', 'Phòng họp nằm ở tầng 2.', '', NOW(), NOW());
    END IF;

    -------------------------------------------------------
    -- BÀI 4: THỜI GIAN & LÀM VIỆC
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 4' LIMIT 1;

    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "WordType", "IsCommon", "Priority", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '起きる', 'おきる', 'Thức dậy', 'Động từ', true, 16, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '寝る', 'ねる', 'Đi ngủ', 'Động từ', true, 17, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '働く', 'はたらく', 'Làm việc', 'Động từ', true, 18, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '勉強', 'べんきょう', 'Học tập', 'Danh từ/Động từ', true, 19, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '休み', 'やすみ', 'Nghỉ ngơi/Ngày nghỉ', 'Danh từ', true, 20, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- VÍ DỤ CHO BÀI 4: THỜI GIAN & LÀM VIỆC
    -------------------------------------------------------

    -- 1. 起きる (Thức dậy)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '起きる' AND "Reading" = 'おきる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '毎朝６時に起きます。', 'Mỗi sáng tôi thức dậy lúc 6 giờ.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '明日は７時に起きます。', 'Ngày mai tôi sẽ thức dậy lúc 7 giờ.', '', NOW(), NOW());
    END IF;

    -- 2. 寝る (Đi ngủ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '寝る' AND "Reading" = 'ねる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '夜１１時に寝ます。', 'Tôi đi ngủ lúc 11 giờ đêm.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '昨日の夜は１２時に寝ました。', 'Đêm qua tôi đã đi ngủ lúc 12 giờ.', '', NOW(), NOW());
    END IF;

    -- 3. 働く (Làm việc)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '働く' AND "Reading" = 'はたらく' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '月曜日から金曜日まで働きます。', 'Tôi làm việc từ thứ Hai đến thứ Sáu.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '銀行は何時から何時まで働きますか。', 'Ngân hàng làm việc từ mấy giờ đến mấy giờ?', '', NOW(), NOW());
    END IF;

    -- 4. 勉強 (Học tập)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '勉強' AND "Reading" = 'べんきょう' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '毎日日本語を勉強します。', 'Học tiếng Nhật mỗi ngày.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '昨日の晩は勉強しませんでした。', 'Tối qua tôi đã không học bài.', '', NOW(), NOW());
    END IF;

    -- 5. 休み (Nghỉ ngơi/Ngày nghỉ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '休み' AND "Reading" = 'やすみ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '今日は休みです。', 'Hôm nay là ngày nghỉ.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '昼休みは１２時からです。', 'Nghỉ trưa bắt đầu từ 12 giờ.', '', NOW(), NOW());
    END IF;

    -------------------------------------------------------
    -- BÀI 5: DI CHUYỂN & GIAO THÔNG
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 5' LIMIT 1;

    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "WordType", "IsCommon", "Priority", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '行く', 'いく', 'Đi', 'Động từ', true, 21, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '来る', 'くる', 'Đến', 'Động từ', true, 22, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '帰る', 'かえる', 'Về', 'Động từ', true, 23, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '電車', 'でんしゃ', 'Tàu điện', 'Danh từ', true, 24, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '飛行機', 'ひこうき', 'Máy bay', 'Danh từ', true, 25, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- VÍ DỤ CHO BÀI 5: DI CHUYỂN & GIAO THÔNG
    -------------------------------------------------------

    -- 1. 行く (Đi)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '行く' AND "Reading" = 'いく' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '明日スーパーへ行きます。', 'Ngày mai tôi sẽ đi siêu thị.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'どこへ行きますか。', 'Bạn đi đâu thế?', '', NOW(), NOW());
    END IF;

    -- 2. 来る (Đến)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '来る' AND "Reading" = 'くる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '日本へ来ました。', 'Tôi đã đến Nhật Bản.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '友達がうちへ来ます。', 'Bạn tôi sẽ đến nhà chơi.', '', NOW(), NOW());
    END IF;

    -- 3. 帰る (Về)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '帰る' AND "Reading" = 'かえる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '８時にうちへ帰ります。', 'Tôi về nhà lúc 8 giờ.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'いつ国へ帰りますか。', 'Khi nào bạn về nước?', '', NOW(), NOW());
    END IF;

    -- 4. 電車 (Tàu điện)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '電車' AND "Reading" = 'でんしゃ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '電車で会社へ行きます。', 'Tôi đi làm bằng tàu điện.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'この電車は大阪へ行きますか。', 'Chuyến tàu điện này có đi Osaka không?', '', NOW(), NOW());
    END IF;

    -- 5. 飛行機 (Máy bay)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '飛行機' AND "Reading" = 'ひこうき' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '飛行機で日本へ来ました。', 'Tôi đã đến Nhật Bản bằng máy bay.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '飛行機のチケットを買いました。', 'Tôi đã mua vé máy bay.', '', NOW(), NOW());
    END IF;

	-------------------------------------------------------
    -- BÀI 6: ĂN UỐNG & HOẠT ĐỘNG
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 6' LIMIT 1;

    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "WordType", "IsCommon", "Priority", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '食べる', 'たべる', 'Ăn', 'Động từ', true, 26, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '飲む', 'のむ', 'Uống', 'Động từ', true, 27, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '吸う', 'すう', 'Hút (thuốc)', 'Động từ', true, 28, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '見る', 'みる', 'Xem / Nhìn', 'Động từ', true, 29, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '聞く', 'きく', 'Nghe', 'Động từ', true, 30, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- VÍ DỤ CHO BÀI 6: ĂN UỐNG & HOẠT ĐỘNG
    -------------------------------------------------------

    -- 1. 食べる (Ăn)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '食べる' AND "Reading" = 'たべる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'パンを食べます。', 'Tôi ăn bánh mì.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '毎朝何をたべますか。', 'Mỗi sáng bạn ăn cái gì thế?', '', NOW(), NOW());
    END IF;

    -- 2. 飲む (Uống)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '飲む' AND "Reading" = 'のむ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'お酒を飲みます。', 'Tôi uống rượu.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '一緒にコーヒーを飲みませんか。', 'Bạn cùng uống cà phê với tôi không?', '', NOW(), NOW());
    END IF;

    -- 3. 吸う (Hút thuốc)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '吸う' AND "Reading" = 'すう' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'たばこを吸います。', 'Tôi hút thuốc lá.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'ここではたばこを吸わないでください。', 'Xin đừng hút thuốc ở đây.', '', NOW(), NOW());
    END IF;

    -- 4. 見る (Xem / Nhìn)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '見る' AND "Reading" = 'みる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'テレビを見ます。', 'Tôi xem tivi.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '映画を見に行きます。', 'Tôi đi xem phim.', '', NOW(), NOW());
    END IF;

    -- 5. 聞く (Nghe)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '聞く' AND "Reading" = 'きく' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '音楽を聞きます。', 'Tôi nghe nhạc.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'ラジオを聞きました。', 'Tôi đã nghe đài radio.', '', NOW(), NOW());
    END IF;

    -------------------------------------------------------
    -- BÀI 7: GIAO TIẾP & TẶNG QUÀ
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 7' LIMIT 1;

    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "WordType", "IsCommon", "Priority", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '切る', 'きる', 'Cắt', 'Động từ', true, 31, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '送る', 'おくる', 'Gửi', 'Động từ', true, 32, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), 'あげる', 'あげる', 'Cho / Tặng', 'Động từ', true, 33, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), 'もらう', 'もらう', 'Nhận', 'Động từ', true, 34, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '貸す', 'かす', 'Cho mượn', 'Động từ', true, 35, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- VÍ DỤ CHO BÀI 7: GIAO TIẾP & TẶNG QUÀ
    -------------------------------------------------------

    -- 1. 切る (Cắt)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '切る' AND "Reading" = 'きる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'はさみで紙を切ります。', 'Cắt giấy bằng kéo.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'ナイフでパンを切ります。', 'Cắt bánh mì bằng dao.', '', NOW(), NOW());
    END IF;

    -- 2. 送る (Gửi)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '送る' AND "Reading" = 'おくる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '荷物を送ります。', 'Tôi gửi hành lý.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '家族にメールを送ります。', 'Tôi gửi email cho gia đình.', '', NOW(), NOW());
    END IF;

    -- 3. あげる (Cho / Tặng)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'あげる' AND "Reading" = 'あげる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '花をあげます。', 'Tôi tặng hoa.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '誕生日にプレゼントをあげました。', 'Tôi đã tặng quà vào ngày sinh nhật.', '', NOW(), NOW());
    END IF;

    -- 4. もらう (Nhận)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'もらう' AND "Reading" = 'もらう' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '先生に本をもらいました。', 'Tôi đã nhận được cuốn sách từ thầy giáo.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '母に電話をもらいました。', 'Tôi đã nhận được điện thoại từ mẹ.', '', NOW(), NOW());
    END IF;

    -- 5. 貸す (Cho mượn)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '貸す' AND "Reading" = 'かす' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '友達にお金を貸します。', 'Tôi cho bạn mượn tiền.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '傘を貸してください。', 'Hãy cho tôi mượn ô (dù).', '', NOW(), NOW());
    END IF;

    -------------------------------------------------------
    -- BÀI 8: TÍNH TỪ
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 8' LIMIT 1;

    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "WordType", "IsCommon", "Priority", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), 'ハンサム', 'はんさむ', 'Đẹp trai', 'Tính từ na', true, 36, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '静か', 'しずか', 'Yên tĩnh', 'Tính từ na', true, 37, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '大きい', 'おおきい', 'Lớn / To', 'Tính từ i', true, 38, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '新しい', 'あたらしい', 'Mới', 'Tính từ i', true, 39, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '高い', 'たかい', 'Đắt / Cao', 'Tính từ i', true, 40, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- VÍ DỤ CHO BÀI 8: TÍNH TỪ
    -------------------------------------------------------

    -- 1. ハンサム (Đẹp trai)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'ハンサム' AND "Reading" = 'はんさむ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '彼はハンサムですね。', 'Anh ấy đẹp trai nhỉ.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'ハンサムな人を紹介してください。', 'Hãy giới thiệu cho tôi người nào đẹp trai đi.', '', NOW(), NOW());
    END IF;

    -- 2. 静か (Yên tĩnh)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '静か' AND "Reading" = 'しずか' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'この町は静かです。', 'Thị trấn này yên tĩnh.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '静かな場所で勉強します。', 'Tôi học bài ở một nơi yên tĩnh.', '', NOW(), NOW());
    END IF;

    -- 3. 大きい (Lớn / To)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '大きい' AND "Reading" = 'おおきい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '大きい家ですね。', 'Ngôi nhà lớn nhỉ.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'この靴は少し大きいです。', 'Đôi giày này hơi lớn một chút.', '', NOW(), NOW());
    END IF;

    -- 4. 新しい (Mới)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '新しい' AND "Reading" = 'あたらしい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '新しい靴を買いました。', 'Tôi đã mua đôi giày mới.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'そのカメラは新しいですか。', 'Cái máy ảnh đó có mới không?', '', NOW(), NOW());
    END IF;

    -- 5. 高い (Đắt / Cao)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '高い' AND "Reading" = 'たかい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '日本の果物は高いです。', 'Trái cây ở Nhật Bản đắt.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'あの方の背は高いですね。', 'Vị kia dáng cao nhỉ.', '', NOW(), NOW());
    END IF;

    -------------------------------------------------------
    -- BÀI 9: SỞ THÍCH & NĂNG LỰC
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 9' LIMIT 1;

    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "WordType", "IsCommon", "Priority", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '好き', 'すき', 'Thích', 'Tính từ na', true, 41, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '上手', 'じょうず', 'Giỏi', 'Tính từ na', true, 42, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), 'わかる', 'わかる', 'Hiểu / Biết', 'Động từ', true, 43, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), 'ある', 'ある', 'Có (vật)', 'Động từ', true, 44, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '料理', 'りょうり', 'Món ăn / Nấu ăn', 'Danh từ', true, 45, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- VÍ DỤ CHO BÀI 9: SỞ THÍCH & NĂNG LỰC
    -------------------------------------------------------

    -- 1. 好き (Thích)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '好き' AND "Reading" = 'すき' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '私は日本料理が好きです。', 'Tôi thích món ăn Nhật Bản.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'どんなスポーツが好きですか。', 'Bạn thích môn thể thao nào?', '', NOW(), NOW());
    END IF;

    -- 2. 上手 (Giỏi)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '上手' AND "Reading" = 'じょうず' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'マインさんはテニスが上手です。', 'Anh Nam giỏi tennis.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '歌が上手な人が好きです。', 'Tôi thích người hát giỏi.', '', NOW(), NOW());
    END IF;

    -- 3. わかる (Hiểu / Biết)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'わかる' AND "Reading" = 'わかる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '英語がわかりますか。', 'Bạn có hiểu tiếng Anh không?', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '漢字が少しわかります。', 'Tôi hiểu chữ Kanji một chút.', '', NOW(), NOW());
    END IF;

    -- 4. ある (Có - sở hữu vật)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'ある' AND "Reading" = 'ある' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'お金があります。', 'Tôi có tiền.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '今日は約束があります。', 'Hôm nay tôi có hẹn.', '', NOW(), NOW());
    END IF;

    -- 5. 料理 (Món ăn / Nấu ăn)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '料理' AND "Reading" = 'りょうり' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '料理を作ります。', 'Tôi nấu ăn (làm món ăn).', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'この料理はとてもおいしいです。', 'Món ăn này rất ngon.', '', NOW(), NOW());
    END IF;

    -------------------------------------------------------
    -- BÀI 10: VỊ TRÍ
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 10' LIMIT 1;

    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "WordType", "IsCommon", "Priority", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), 'いる', 'いる', 'Có (người/động vật)', 'Động từ', true, 46, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '箱', 'はこ', 'Cái hộp', 'Danh từ', true, 47, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '上', 'うえ', 'Trên', 'Danh từ', true, 48, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '下', 'した', 'Dưới', 'Danh từ', true, 49, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '近く', 'ちかく', 'Gần', 'Danh từ', true, 50, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- VÍ DỤ CHO BÀI 10: VỊ TRÍ & SỰ TỒN TẠI
    -------------------------------------------------------

    -- 1. いる (Có - người/động vật)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'いる' AND "Reading" = 'いる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'あそこに猫がいます。', 'Ở đằng kia có con mèo.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '事務所に田中さんがいます。', 'Anh Tanaka ở trong văn phòng.', '', NOW(), NOW());
    END IF;

    -- 2. 箱 (Cái hộp)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '箱' AND "Reading" = 'はこ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '箱の中に何がありますか。', 'Trong hộp có cái gì thế?', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'この箱を捨ててください。', 'Hãy vứt cái hộp này đi.', '', NOW(), NOW());
    END IF;

    -- 3. 上 (Trên)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '上' AND "Reading" = 'うえ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '机の上に本があります。', 'Trên bàn có cuốn sách.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'テレビの上に時計を置きました。', 'Tôi đã đặt cái đồng hồ lên trên tivi.', '', NOW(), NOW());
    END IF;

    -- 4. 下 (Dưới)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '下' AND "Reading" = 'した' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '机の下に猫がいます。', 'Dưới gầm bàn có con mèo.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '椅子の下に靴があります。', 'Dưới ghế có đôi giày.', '', NOW(), NOW());
    END IF;

    -- 5. 近く (Gần)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '近く' AND "Reading" = 'ちかく' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '銀行の近くにポストがあります。', 'Ở gần ngân hàng có hòm thư.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '学校の近くに住んでいます。', 'Tôi đang sống ở gần trường học.', '', NOW(), NOW());
    END IF;

	-------------------------------------------------------
    -- BÀI 11: SỐ LƯỢNG & THỜI GIAN
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 11' LIMIT 1;

    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "WordType", "IsCommon", "Priority", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), 'いくつ', 'いくつ', 'Bao nhiêu cái', 'Từ nghi vấn', true, 51, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '一人', 'ひとり', '1 người', 'Danh từ', true, 52, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '期間', 'きかん', 'Thời gian / Kỳ hạn', 'Danh từ', true, 53, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), 'ぐらい', 'ぐらい', 'Khoảng', 'Trợ từ', true, 54, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '全部', 'ぜんぶ', 'Tất cả', 'Phụ từ', true, 55, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- VÍ DỤ CHO BÀI 11: SỐ LƯỢNG & THỜI GIAN
    -------------------------------------------------------

    -- 1. いくつ (Bao nhiêu cái)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'いくつ' AND "Reading" = 'いくつ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'りんごをいくつ買いましたか。', 'Bạn đã mua bao nhiêu quả táo?', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '卵がいくつありますか。', 'Có bao nhiêu quả trứng?', '', NOW(), NOW());
    END IF;

    -- 2. 一人 (1 người)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '一人' AND "Reading" = 'ひとり' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '家族は一人です。', 'Gia đình chỉ có một người.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '一人で日本へ来ました。', 'Tôi đã đến Nhật Bản một mình.', '', NOW(), NOW());
    END IF;

    -- 3. 期間 (Thời gian / Kỳ hạn)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '期間' AND "Reading" = 'きかん' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '冬休みの期間は２週間です。', 'Thời gian nghỉ đông là 2 tuần.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'この期間に勉強してください。', 'Hãy học trong khoảng thời gian này.', '', NOW(), NOW());
    END IF;

    -- 4. ぐらい (Khoảng)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'ぐらい' AND "Reading" = 'ぐらい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '３週間ぐらい休みます。', 'Nghỉ khoảng 3 tuần.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '家から大学まで３０分ぐらいです。', 'Từ nhà đến trường đại học mất khoảng 30 phút.', '', NOW(), NOW());
    END IF;

    -- 5. 全部 (Tất cả)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '全部' AND "Reading" = 'ぜんぶ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '全部でいくらですか。', 'Tất cả hết bao nhiêu tiền?', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'この宿題を全部しました。', 'Tôi đã làm hết đống bài tập này rồi.', '', NOW(), NOW());
    END IF;

    -------------------------------------------------------
    -- BÀI 12: SO SÁNH & THÌ QUÁ KHỨ
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 12' LIMIT 1;

    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "WordType", "IsCommon", "Priority", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '簡単', 'かんたん', 'Đơn giản / Dễ', 'Tính từ na', true, 56, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '暑い', 'あつい', 'Nóng (thời tiết)', 'Tính từ i', true, 57, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '速い', 'はやい', 'Nhanh', 'Tính từ i', true, 58, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), 'より', 'より', 'Hơn (so sánh)', 'Trợ từ', true, 59, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '一番', 'いちばん', 'Nhất', 'Phụ từ', true, 60, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- VÍ DỤ CHO BÀI 12: SO SÁNH & THÌ QUÁ KHỨ
    -------------------------------------------------------

    -- 1. 簡単 (Đơn giản / Dễ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '簡単' AND "Reading" = 'かんたん' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '昨日の試験は簡単でした。', 'Kỳ thi hôm qua đã rất đơn giản.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '使い方は簡単です。', 'Cách sử dụng rất đơn giản.', '', NOW(), NOW());
    END IF;

    -- 2. 暑い (Nóng)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '暑い' AND "Reading" = 'あつい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '昨日は暑かったです。', 'Hôm qua đã rất nóng.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '今日は昨日より暑いです。', 'Hôm nay nóng hơn hôm qua.', '', NOW(), NOW());
    END IF;

    -- 3. 速い (Nhanh)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '速い' AND "Reading" = 'はやい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '新幹線は速いです。', 'Tàu Shinkansen rất nhanh.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '歩くのが速いですね。', 'Bạn đi bộ nhanh nhỉ.', '', NOW(), NOW());
    END IF;

    -- 4. より (Hơn)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'より' AND "Reading" = 'より' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'この鞄はあの鞄より安いです。', 'Cái cặp này rẻ hơn cái cặp kia.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'ベトナムは日本より暑いです。', 'Việt Nam nóng hơn Nhật Bản.', '', NOW(), NOW());
    END IF;

    -- 5. 一番 (Nhất)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '一番' AND "Reading" = 'いちばん' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '１年でいつが一番寒いですか。', 'Trong 1 năm khi nào lạnh nhất?', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '日本料理で寿司が一番好きです。', 'Trong các món Nhật tôi thích sushi nhất.', '', NOW(), NOW());
    END IF;

    -------------------------------------------------------
    -- BÀI 13: MONG MUỐN & DỰ ĐỊNH
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 13' LIMIT 1;

    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "WordType", "IsCommon", "Priority", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '欲しい', 'ほしい', 'Muốn (có gì đó)', 'Tính từ i', true, 61, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '遊びます', 'あそびます', 'Chơi', 'Động từ', true, 62, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '泳ぎます', 'およぎます', 'Bơi', 'Động từ', true, 63, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '迎えます', 'むかえます', 'Đón', 'Động từ', true, 64, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '食事', 'しょくじ', 'Bữa ăn', 'Danh từ/Động từ', true, 65, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- BÀI 13: MONG MUỐN & DỰ ĐỊNH
    -------------------------------------------------------

    -- 1. 欲しい (Muốn có gì đó)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '欲しい' AND "Reading" = 'ほしい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '新しい車が欲しいです。', 'Tôi muốn có một chiếc xe hơi mới.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '今、何が一番欲しいですか。', 'Bây giờ bạn muốn cái gì nhất?', '', NOW(), NOW());
    END IF;

    -- 2. 遊びます (Chơi)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '遊びます' AND "Reading" = 'あそびます' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '週末は友達と遊びます。', 'Cuối tuần tôi đi chơi với bạn.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '公園へ遊びに行きます。', 'Tôi đi đến công viên để chơi.', '', NOW(), NOW());
    END IF;

    -- 3. 泳ぎます (Bơi)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '泳ぎます' AND "Reading" = 'およぎます' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '海で泳ぎます。', 'Bơi ở biển.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'プールへ泳ぎに行きたいです。', 'Tôi muốn đi đến hồ bơi để bơi.', '', NOW(), NOW());
    END IF;

    -- 4. 迎えます (Đón)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '迎えます' AND "Reading" = 'むかえます' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '駅へ家族を迎えに行きます。', 'Tôi đi ra ga để đón gia đình.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '空港で友達を迎えました。', 'Tôi đã đón bạn tại sân bay.', '', NOW(), NOW());
    END IF;

    -- 5. 食事 (Bữa ăn)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '食事' AND "Reading" = 'しょくじ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '一緒に食事をしませんか。', 'Cùng dùng bữa với tôi nhé?', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '食事のあとで、コーヒーを飲みます。', 'Sau bữa ăn, tôi uống cà phê.', '', NOW(), NOW());
    END IF;

    -------------------------------------------------------
    -- BÀI 14: THỂ TE (YÊU CẦU / ĐANG LÀM)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 14' LIMIT 1;

    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "WordType", "IsCommon", "Priority", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), 'つけます', 'つけます', 'Bật (điện/máy lạnh)', 'Động từ', true, 66, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '開けます', 'あけます', 'Mở (cửa)', 'Động từ', true, 67, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '急ぎます', 'いそぎます', 'Vội vàng / Gấp', 'Động từ', true, 68, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '待つ', 'まつ', 'Chờ / Đợi', 'Động từ', true, 69, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '降る', 'ふる', 'Rơi (mưa/tuyết)', 'Động từ', true, 70, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- BÀI 14: THỂ TE (YÊU CẦU / ĐANG LÀM)
    -------------------------------------------------------

    -- 1. つけます (Bật)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'つけます' AND "Reading" = 'つけます' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '電気をつけてください。', 'Hãy bật điện lên.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'エアコンをつけました。', 'Tôi đã bật máy lạnh.', '', NOW(), NOW());
    END IF;

    -- 2. 開けます (Mở)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '開けます' AND "Reading" = 'あけます' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '窓を開けてください。', 'Hãy mở cửa sổ ra.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'ドアを開けます。', 'Tôi mở cửa.', '', NOW(), NOW());
    END IF;

    -- 3. 急ぎます (Vội vàng)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '急ぎます' AND "Reading" = 'いそぎます' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'タクシーで急ぎます。', 'Tôi sẽ đi gấp bằng taxi.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '時間がありませんから、急いでください。', 'Vì không có thời gian nên hãy khẩn trương lên.', '', NOW(), NOW());
    END IF;

    -- 4. 待つ (Chờ đợi)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '待つ' AND "Reading" = 'まつ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'ちょっと待ってください。', 'Xin hãy chờ một chút.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'ロビーで友達を待っています', 'Tôi đang đợi bạn ở sảnh.', '', NOW(), NOW());
    END IF;

    -- 5. 降る (Rơi)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '降る' AND "Reading" = 'ふる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '雨が降っています。', 'Trời đang mưa.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '雪が降りましたね。', 'Tuyết đã rơi nhỉ.', '', NOW(), NOW());
    END IF;

    -------------------------------------------------------
    -- BÀI 15: PHÉP TẮC & TRẠNG THÁI
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 15' LIMIT 1;

    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "WordType", "IsCommon", "Priority", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '置く', 'おく', 'Đặt / Để', 'Động từ', true, 71, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '売る', 'うる', 'Bán', 'Động từ', true, 72, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '住む', 'すむ', 'Sống / Cư trú', 'Động từ', true, 73, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '知る', 'しる', 'Biết', 'Động từ', true, 74, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '思い出す', 'おもいだす', 'Nhớ lại / Hồi tưởng', 'Động từ', true, 75, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- BÀI 15: PHÉP TẮC & TRẠNG THÁI
    -------------------------------------------------------

    -- 1. 置く (Đặt / Để)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '置く' AND "Reading" = 'おく' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'ここに荷物を置かないでください。', 'Xin đừng đặt hành lý ở đây.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '辞書は机の上に置いてあります。', 'Cuốn từ điển đang được đặt ở trên bàn.', '', NOW(), NOW());
    END IF;

    -- 2. 売る (Bán)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '売る' AND "Reading" = 'うる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'スーパーで古い本を売っています。', 'Siêu thị đang bán sách cũ.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'どこでチケットを売っていますか。', 'Vé được bán ở đâu vậy?', '', NOW(), NOW());
    END IF;

    -- 3. 住む (Sống / Cư trú)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '住む' AND "Reading" = 'すむ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '私はハノイに住んでいます。', 'Tôi đang sống ở Hà Nội.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'どこに住みたいですか。', 'Bạn muốn sống ở đâu?', '', NOW(), NOW());
    END IF;

    -- 4. 知る (Biết)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '知る' AND "Reading" = 'しる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '田中さんの電話番号を知っていますか。', 'Bạn có biết số điện thoại của anh Tanaka không?', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'いいえ、知りません。', 'Không, tôi không biết.', '', NOW(), NOW());
    END IF;

    -- 5. 思い出す (Nhớ lại)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '思い出す' AND "Reading" = 'おもいだす' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '家族を思い出しました。', 'Tôi đã nhớ về gia đình.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '名前が思い出せません。', 'Tôi không thể nhớ ra tên.', '', NOW(), NOW());
    END IF;

	-------------------------------------------------------
    -- BÀI 16: LIÊN KẾT HÀNH ĐỘNG & CƠ THỂ
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 16' LIMIT 1;

    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "WordType", "IsCommon", "Priority", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '降りる', 'おりる', 'Xuống (tàu, xe)', 'Động từ', true, 76, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '浴びる', 'あびる', 'Tắm (vòi sen)', 'Động từ', true, 77, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '若い', 'わかい', 'Trẻ trung', 'Tính từ i', true, 78, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '長い', 'ながい', 'Dài', 'Tính từ i', true, 79, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '明るい', 'あかるい', 'Sáng sủa', 'Tính từ i', true, 80, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- BÀI 16: LIÊN KẾT HÀNH ĐỘNG & CƠ THỂ
    -------------------------------------------------------

    -- 1. 降りる (Xuống tàu xe)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '降りる' AND "Reading" = 'おりる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '電車を降ります。', 'Tôi xuống tàu điện.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '次の駅で降りてください。', 'Hãy xuống ở ga tiếp theo.', '', NOW(), NOW());
    END IF;

    -- 2. 浴びる (Tắm)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '浴びる' AND "Reading" = 'あびる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'シャワーを浴びます。', 'Tôi tắm vòi sen.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '毎朝シャワーを浴びてから大学へ行きます。', 'Mỗi sáng sau khi tắm tôi sẽ đến trường đại học.', '', NOW(), NOW());
    END IF;

    -- 3. 若い (Trẻ trung)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '若い' AND "Reading" = 'わかい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '母は若いです。', 'Mẹ tôi trẻ.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '若い時、日本へ来ました。', 'Lúc còn trẻ, tôi đã đến Nhật Bản.', '', NOW(), NOW());
    END IF;

    -- 4. 長い (Dài)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '長い' AND "Reading" = 'ながい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '夏は日が長いです。', 'Mùa hè ngày dài.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '髪が長いですね。', 'Tóc dài nhỉ.', '', NOW(), NOW());
    END IF;

    -- 5. 明るい (Sáng sủa)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '明るい' AND "Reading" = 'あかるい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'この部屋は明るいです。', 'Căn phòng này sáng sủa.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '明るい色のシャツを着ます。', 'Tôi mặc áo sơ mi màu sáng.', '', NOW(), NOW());
    END IF;

    -------------------------------------------------------
    -- BÀI 17: SỨC KHỎE & PHỦ ĐỊNH
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 17' LIMIT 1;

    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "WordType", "IsCommon", "Priority", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '忘れる', 'わすれる', 'Quên', 'Động từ', true, 81, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '払う', 'はらう', 'Trả tiền', 'Động từ', true, 82, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '脱ぐ', 'ぬぐ', 'Cởi (đồ, giày)', 'Động từ', true, 83, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '心配', 'しんぱい', 'Lo lắng', 'Danh từ/Tính từ na', true, 84, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '大切', 'たいせつ', 'Quan trọng / Quý giá', 'Tính từ na', true, 85, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- BÀI 17: SỨC KHỎE & PHỦ ĐỊNH
    -------------------------------------------------------

    -- 1. 忘れる (Quên)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '忘れる' AND "Reading" = 'わすれる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '宿題を忘れないでください。', 'Xin đừng quên làm bài tập về nhà.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '傘を忘れました。', 'Tôi đã quên mang ô.', '', NOW(), NOW());
    END IF;

    -- 2. 払う (Trả tiền)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '払う' AND "Reading" = 'はらう' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'レジでお金を払います。', 'Trả tiền ở quầy thu ngân.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'カードで払ってもいいですか。', 'Tôi trả bằng thẻ có được không?', '', NOW(), NOW());
    END IF;

    -- 3. 脱ぐ (Cởi đồ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '脱ぐ' AND "Reading" = 'ぬぐ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'ここで靴を脱いでください。', 'Hãy cởi giày ở đây.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '暑いですから、上着を脱ぎます。', 'Vì nóng nên tôi cởi áo khoác.', '', NOW(), NOW());
    END IF;

    -- 4. 心配 (Lo lắng)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '心配' AND "Reading" = 'しんぱい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '心配しないでください。', 'Đừng lo lắng nhé.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '家族のことを心配しています。', 'Tôi đang lo lắng cho gia đình.', '', NOW(), NOW());
    END IF;

    -- 5. 大切 (Quan trọng)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '大切' AND "Reading" = 'たいせつ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '体は大切です。', 'Cơ thể là quan trọng (Sức khỏe là quan trọng).', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'これは大切な資料です。', 'Đây là tài liệu quan trọng.', '', NOW(), NOW());
    END IF;

    -------------------------------------------------------
    -- BÀI 18: KHẢ NĂNG & SỞ THÍCH
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 18' LIMIT 1;

    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "WordType", "IsCommon", "Priority", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), 'できる', 'できる', 'Có thể', 'Động từ', true, 86, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '洗う', 'あらう', 'Rửa', 'Động từ', true, 87, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '弾く', 'ひく', 'Chơi (nhạc cụ dây)', 'Động từ', true, 88, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '歌う', 'うたう', 'Hát', 'Động từ', true, 89, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '集める', 'あつめる', 'Sưu tầm / Thu thập', 'Động từ', true, 90, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- BÀI 18: KHẢ NĂNG & SỞ THÍCH
    -------------------------------------------------------

    -- 1. できる (Có thể)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'できる' AND "Reading" = 'できる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'マインさんは日本語ができます。', 'Anh Nam có thể nói tiếng Nhật.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'カードで払うことができますか。', 'Có thể thanh toán bằng thẻ được không?', '', NOW(), NOW());
    END IF;

    -- 2. 洗う (Rửa)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '洗う' AND "Reading" = 'あらう' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '食べる前に手を洗います。', 'Rửa tay trước khi ăn.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '車を洗うのが好きです。', 'Tôi thích việc rửa xe.', '', NOW(), NOW());
    END IF;

    -- 3. 弾く (Chơi nhạc cụ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '弾く' AND "Reading" = 'ひく' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'ピアノを弾くことができます。', 'Tôi có thể chơi đàn piano.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'ギターを弾くのが上手ですね。', 'Bạn chơi guitar giỏi nhỉ.', '', NOW(), NOW());
    END IF;

    -- 4. 歌う (Hát)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '歌う' AND "Reading" = 'うたう' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '日本の歌を歌います。', 'Tôi hát bài hát Nhật Bản.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '歌うのが下手です。', 'Tôi hát dở lắm.', '', NOW(), NOW());
    END IF;

    -- 5. 集める (Sưu tầm)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '集める' AND "Reading" = 'あつめる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '趣味は切手を集めることです。', 'Sở thích của tôi là sưu tầm tem.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'ゴミを集めてください。', 'Hãy thu gom rác lại.', '', NOW(), NOW());
    END IF;

    -------------------------------------------------------
    -- BÀI 19: KINH NGHIỆM & TRẠNG THÁI
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 19' LIMIT 1;

    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "WordType", "IsCommon", "Priority", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '登る', 'のぼる', 'Leo (núi)', 'Động từ', true, 91, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '泊まる', 'とまる', 'Trọ lại', 'Động từ', true, 92, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '掃除', 'そうじ', 'Dọn dẹp vệ sinh', 'Danh từ/Động từ', true, 93, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '洗濯', 'せんたく', 'Giặt giũ', 'Danh từ/Động từ', true, 94, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '練習', 'れんしゅう', 'Luyện tập', 'Danh từ/Động từ', true, 95, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- BÀI 19: KINH NGHIỆM & TRẠNG THÁI
    -------------------------------------------------------

    -- 1. 登る (Leo núi)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '登る' AND "Reading" = 'のぼる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '富士山に登ったことがありますか。', 'Bạn đã từng leo núi Phú Sĩ chưa?', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '一度高い山に登りたいです。', 'Tôi muốn leo núi cao một lần.', '', NOW(), NOW());
    END IF;

    -- 2. 泊まる (Trọ lại)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '泊まる' AND "Reading" = 'とまる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '日本旅館に泊まりたいです。', 'Tôi muốn trọ lại ở nhà trọ kiểu Nhật.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'ホテルに泊まったことがあります。', 'Tôi đã từng ở lại khách sạn.', '', NOW(), NOW());
    END IF;

    -- 3. 掃除 (Dọn dẹp)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '掃除' AND "Reading" = 'そうじ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '日曜日に部屋を掃除します。', 'Tôi dọn dẹp phòng vào chủ nhật.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '掃除したり、洗濯したりします。', 'Tôi nào là dọn dẹp, nào là giặt giũ (liệt kê hành động).', '', NOW(), NOW());
    END IF;

    -- 4. 洗濯 (Giặt giũ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '洗濯' AND "Reading" = 'せんたく' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '天気がいいですから、洗濯します。', 'Vì thời tiết đẹp nên tôi đi giặt đồ.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '昨日、洗濯をしました。', 'Hôm qua tôi đã giặt giũ.', '', NOW(), NOW());
    END IF;

    -- 5. 練習 (Luyện tập)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '練習' AND "Reading" = 'れんしゅう' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '毎日、日本語を練習します。', 'Hàng ngày tôi luyện tập tiếng Nhật.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'ピアノの練習は大変です。', 'Việc luyện tập piano thật là vất vả.', '', NOW(), NOW());
    END IF;

    -------------------------------------------------------
    -- BÀI 20: GIAO TIẾP THÂN MẬT
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 20' LIMIT 1;

    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "WordType", "IsCommon", "Priority", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '要る', 'いる', 'Cần', 'Động từ', true, 96, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '調べる', 'しらべる', 'Tìm hiểu / Điều tra', 'Động từ', true, 97, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '直す', 'なおす', 'Sửa chữa', 'Động từ', true, 98, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '僕', 'ぼく', 'Tôi (nam giới dùng)', 'Đại từ', true, 99, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '君', 'くん', 'Cậu / Em (thân mật)', 'Hậu tố/Đại từ', true, 100, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- BÀI 20: GIAO TIẾP THÂN MẬT (Thể thông thường)
    -------------------------------------------------------

    -- 1. 要る (Cần)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '要る' AND "Reading" = 'いる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'ビザが要る？', 'Có cần visa không? (Thân mật)', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'ううん、要らない。', 'Không, không cần đâu. (Thân mật)', '', NOW(), NOW());
    END IF;

    -- 2. 調べる (Tìm hiểu)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '調べる' AND "Reading" = 'しらべる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '辞書で言葉を調べる。', 'Tra từ bằng từ điển.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'ネットでニュースを調べる。', 'Tìm kiếm tin tức trên mạng.', '', NOW(), NOW());
    END IF;

    -- 3. 直す (Sửa chữa)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '直す' AND "Reading" = 'なおす' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '自転車を直した。', 'Tôi đã sửa xe đạp rồi.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '間違いを直してください。', 'Hãy sửa lỗi sai giúp tôi.', '', NOW(), NOW());
    END IF;

    -- 4. 僕 (Tôi - nam giới)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '僕' AND "Reading" = 'ぼく' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '僕はアイスを食べる。', 'Tớ sẽ ăn kem. (Thân mật)', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '僕の家へ遊びに来ない？', 'Cậu có muốn đến nhà tớ chơi không?', '', NOW(), NOW());
    END IF;

    -- 5. 君 (Cậu / Em)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '君' AND "Reading" = 'くん' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '君は学生？', 'Cậu là sinh viên à? (Thân mật)', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '佐藤君は優しいね。', 'Cậu Sato hiền lành nhỉ.', '', NOW(), NOW());
    END IF;

	-------------------------------------------------------
    -- BÀI 21: TƯỜNG THUẬT & DỰ ĐOÁN
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 21' LIMIT 1;

    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "WordType", "IsCommon", "Priority", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '思う', 'おもう', 'Nghĩ là', 'Động từ', true, 101, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '言う', 'いう', 'Nói', 'Động từ', true, 102, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '勝つ', 'かつ', 'Thắng', 'Động từ', true, 103, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '負ける', 'まける', 'Thua', 'Động từ', true, 104, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '役に立つ', 'やくにたつ', 'Có ích', 'Động từ/Cụm từ', true, 105, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 22: MỆNH ĐỀ ĐỊNH NGỮ (TRANG PHỤC)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 22' LIMIT 1;

    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "WordType", "IsCommon", "Priority", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '着る', 'きる', 'Mặc (từ thắt lưng trở lên)', 'Động từ', true, 106, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '履く', 'はく', 'Mặc (từ thắt lưng trở xuống)', 'Động từ', true, 107, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '帽子', 'ぼうし', 'Mũ / Nón', 'Danh từ', true, 108, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '眼鏡', 'めがね', 'Kính mắt', 'Danh từ', true, 109, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '約束', 'やくそく', 'Hẹn / Lời hứa', 'Danh từ/Động từ', true, 110, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- BÀI 22: MỆNH ĐỀ ĐỊNH NGỮ (TRANG PHỤC)
    -------------------------------------------------------

    -- 1. 着る (Mặc)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '着る' AND "Reading" = 'きる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '赤いシャツを着ている人は田中さんです。', 'Người đang mặc cái áo sơ mi màu đỏ là anh Tanaka.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '寒い時、コートを着ます。', 'Khi trời lạnh, tôi mặc áo khoác.', '', NOW(), NOW());
    END IF;

    -- 2. 履く (Mặc/Đi giầy, quần)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '履く' AND "Reading" = 'はく' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '新しい靴を履いて出かけます。', 'Tôi đi đôi giày mới rồi đi ra ngoài.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '黒いズボンを履いている人はだれですか。', 'Người đang mặc cái quần màu đen là ai thế?', '', NOW(), NOW());
    END IF;

    -- 3. 帽子 (Mũ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '帽子' AND "Reading" = 'ぼうし' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '可愛い帽子をかぶっていますね。', 'Bạn đang đội cái mũ đáng yêu nhỉ.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'あそこに帽子を忘れないでください。', 'Đừng quên cái mũ ở đằng kia nhé.', '', NOW(), NOW());
    END IF;

    -- 4. 眼鏡 (Kính)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '眼鏡' AND "Reading" = 'めがね' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '眼鏡をかけて本を読みます。', 'Tôi đeo kính để đọc sách.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'あの眼鏡をかけている人は先生です。', 'Người đang đeo kính đằng kia là thầy giáo.', '', NOW(), NOW());
    END IF;

    -- 5. 約束 (Hẹn)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '約束' AND "Reading" = 'やくそく' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '友達と会う約束があります。', 'Tôi có hẹn gặp bạn.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '約束の時間を忘れないでください。', 'Xin đừng quên thời gian cuộc hẹn.', '', NOW(), NOW());
    END IF;

    -------------------------------------------------------
    -- BÀI 23: THỜI ĐIỂM & CHỈ ĐƯỜNG
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 23' LIMIT 1;

    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "WordType", "IsCommon", "Priority", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '渡る', 'わたる', 'Băng qua (cầu, đường)', 'Động từ', true, 111, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '曲がる', 'まがる', 'Rẽ / Quẹo', 'Động từ', true, 112, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '寂しい', 'さびしい', 'Buồn / Cô đơn', 'Tính từ i', true, 113, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), 'お湯', 'おゆ', 'Nước nóng', 'Danh từ', true, 114, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '交差点', 'こうさてん', 'Ngã tư', 'Danh từ', true, 115, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- BÀI 23: THỜI ĐIỂM & CHỈ ĐƯỜNG
    -------------------------------------------------------

    -- 1. 渡る (Băng qua)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '渡る' AND "Reading" = 'わたる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '橋を渡る時、気をつけてください。', 'Khi đi qua cầu hãy cẩn thận nhé.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '道を渡ります。', 'Băng qua đường.', '', NOW(), NOW());
    END IF;

    -- 2. 曲がる (Rẽ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '曲がる' AND "Reading" = 'まがる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '信号を右へ曲がってください。', 'Hãy rẽ phải ở chỗ đèn tín hiệu.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '角を左に曲がると、銀行があります。', 'Hễ rẽ trái ở góc đường thì sẽ thấy ngân hàng.', '', NOW(), NOW());
    END IF;

    -- 3. 寂しい (Buồn)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '寂しい' AND "Reading" = 'さびしい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '家族に会えなくて寂しいです。', 'Không được gặp gia đình nên tôi thấy buồn.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '寂しい時、音楽を聞きます。', 'Khi buồn tôi thường nghe nhạc.', '', NOW(), NOW());
    END IF;

    -- 4. お湯 (Nước nóng)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'お湯' AND "Reading" = 'おゆ' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'お湯が出ません。', 'Nước nóng không chảy ra.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'お湯を沸かしてください。', 'Hãy đun sôi nước giúp tôi.', '', NOW(), NOW());
    END IF;

    -- 5. 交差点 (Ngã tư)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '交差点' AND "Reading" = 'こうさてん' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '交差点をまっすぐ行きます。', 'Đi thẳng qua ngã tư.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'あの交差点で止まってください。', 'Hãy dừng lại ở ngã tư kia.', '', NOW(), NOW());
    END IF;

    -------------------------------------------------------
    -- BÀI 24: CHO NHẬN TRỢ GIÚP
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 24' LIMIT 1;

    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "WordType", "IsCommon", "Priority", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), 'くれる', 'くれる', 'Cho / Tặng (cho người nói)', 'Động từ', true, 116, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '連れて行く', 'つれていく', 'Dẫn đi', 'Động từ', true, 117, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '送る', 'おくる', 'Đưa đi / Tiễn (người)', 'Động từ', true, 118, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '紹介', 'しょうかい', 'Giới thiệu', 'Danh từ/Động từ', true, 119, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '準備', 'じゅん備', 'Chuẩn bị', 'Danh từ/Động từ', true, 120, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- BÀI 24: CHO NHẬN TRỢ GIÚP
    -------------------------------------------------------

    -- 1. くれる (Cho tôi)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = 'くれる' AND "Reading" = 'くれる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '佐藤さんがお菓子をくれました。', 'Chị Sato đã cho tôi kẹo.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '友達が日本語を教えてくれました。', 'Bạn tôi đã dạy tiếng Nhật cho tôi.', '', NOW(), NOW());
    END IF;

    -- 2. 連れて行く (Dẫn đi)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '連れて行く' AND "Reading" = 'つれていく' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '子供を公園へ連れて行きます。', 'Tôi dẫn con đi công viên.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'いい病院へ連れて行ってください。', 'Hãy dẫn tôi đến một bệnh viện tốt.', '', NOW(), NOW());
    END IF;

    -- 3. 送る (Đưa đi/Tiễn)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '送る' AND "Reading" = 'おくる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '駅まで友達を送ります。', 'Tôi tiễn bạn ra tận ga.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '車で家まで送ってくれました。', 'Anh ấy đã đưa tôi về tận nhà bằng xe hơi.', '', NOW(), NOW());
    END IF;

    -- 4. 紹介 (Giới thiệu)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '紹介' AND "Reading" = 'しょうかい' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '自己紹介をしてください。', 'Hãy tự giới thiệu bản thân.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'いい人を紹介してくれませんか。', 'Bạn giới thiệu cho tôi một người tốt được không?', '', NOW(), NOW());
    END IF;

    -- 5. 準備 (Chuẩn bị)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '準備' AND "Reading" = 'じゅん備' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '旅行の準備をします。', 'Chuẩn bị cho chuyến du lịch.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '準備ができました。', 'Tôi đã chuẩn bị xong rồi.', '', NOW(), NOW());
    END IF;

    -------------------------------------------------------
    -- BÀI 25: CÂU ĐIỀU KIỆN
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 25' LIMIT 1;

    INSERT INTO "Vocabularies" 
    ("VocabID", "Word", "Reading", "Meaning", "WordType", "IsCommon", "Priority", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt", "AudioURL") 
    VALUES
    (gen_random_uuid(), '考える', 'かんがえる', 'Suy nghĩ / Xem xét', 'Động từ', true, 121, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '着く', 'つく', 'Đến nơi', 'Động từ', true, 122, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '留学', 'りゅうがく', 'Du học', 'Danh từ/Động từ', true, 123, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '頑張る', 'がんばる', 'Cố gắng', 'Động từ', true, 124, 1, n5_id, t_id, l_id, NOW(), NOW(), ''),
    (gen_random_uuid(), '田舎', 'いなか', 'Quê / Nông thôn', 'Danh từ', true, 125, 1, n5_id, t_id, l_id, NOW(), NOW(), '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- BÀI 25: CÂU ĐIỀU KIỆN
    -------------------------------------------------------

    -- 1. 考える (Suy nghĩ)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '考える' AND "Reading" = 'かんガえる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, 'よく考えてから返事します。', 'Tôi sẽ suy nghĩ kỹ rồi mới trả lời.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '将来のことを考えています。', 'Tôi đang suy nghĩ về tương lai.', '', NOW(), NOW());
    END IF;

    -- 2. 着く (Đến nơi)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '着く' AND "Reading" = 'つく' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '駅に着いたら、電話してください。', 'Khi nào đến ga hãy gọi điện cho tôi nhé.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, 'あしたの８時に東京に着きます。', '8 giờ ngày mai tôi sẽ đến Tokyo.', '', NOW(), NOW());
    END IF;

    -- 3. 留学 (Du học)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '留学' AND "Reading" = 'りゅうがく' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '日本へ留学したいです。', 'Tôi muốn đi du học Nhật Bản.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '大学を卒業してから、留学します。', 'Sau khi tốt nghiệp đại học tôi sẽ đi du học.', '', NOW(), NOW());
    END IF;

    -- 4. 頑張る (Cố gắng)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '頑張る' AND "Reading" = 'がんばる' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '明日から頑張ります。', 'Từ ngày mai tôi sẽ cố gắng.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '日本語の勉強を頑張ってください。', 'Hãy cố gắng học tiếng Nhật nhé.', '', NOW(), NOW());
    END IF;

    -- 5. 田舎 (Quê)
    SELECT "VocabID" INTO v_id FROM "Vocabularies" WHERE "Word" = '田舎' AND "Reading" = 'いなか' LIMIT 1;
    IF v_id IS NOT NULL THEN
        INSERT INTO "Examples" ("ExampleID", "VocabID", "Content", "Translation", "AudioURL", "CreatedAt", "UpdatedAt") VALUES
        (gen_random_uuid(), v_id, '田舎へ帰ったら、農業をします。', 'Hễ về quê tôi sẽ làm nông nghiệp.', '', NOW(), NOW()),
        (gen_random_uuid(), v_id, '私の田舎はとても静かです。', 'Quê tôi rất yên tĩnh.', '', NOW(), NOW());
    END IF;

	RAISE NOTICE 'Đã tạo xong từ vựng N5.';

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
    SELECT "TopicID" INTO t_id FROM "Topics" WHERE "TopicName" = 'Bài Đọc N5 Tổng Hợp' LIMIT 1;

    -------------------------------------------------------
    -- BÀI ĐỌC 1: GIỚI THIỆU GIA ĐÌNH
    -------------------------------------------------------
	SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 1' LIMIT 1;
    r_id := gen_random_uuid();
    INSERT INTO "Readings" ("ReadingID", "Title", "Content", "Translation", "WordCount", "EstimatedTime", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (r_id, 'わたしの家族 (Gia đình của tôi)', 
    'わたしの家族は４人です。父と母と兄がいます。父は会社員です。母は日本語の先生です。', 
    'Gia đình tôi có 4 người. Có bố, mẹ và anh trai. Bố tôi là nhân viên công ty. Mẹ tôi là giáo viên tiếng Nhật.', 
    45, 5, 1, n5_id, t_id, l_id, NOW(), NOW())
    ON CONFLICT ("Title") DO NOTHING;

    -- Câu hỏi 1 cho bài 1
    q_id := gen_random_uuid();
    INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '家族は何人ですか？ (Gia đình có mấy người?)', 0, 1, 1, l_id, r_id, NULL, NOW(), NOW());
    
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, '３人です', false),
    (gen_random_uuid(), q_id, '４人です', true),
    (gen_random_uuid(), q_id, '５人です', false),
	(gen_random_uuid(), q_id, '２人です', false);

    -- Câu hỏi 2 cho bài 1
    q_id := gen_random_uuid();
        INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, 'お母さんの仕事は何ですか？ (Công việc của mẹ là gì?)', 0, 1, 1, l_id, r_id, NULL, NOW(), NOW());
    
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
    INSERT INTO "Readings" ("ReadingID", "Title", "Content", "Translation", "WordCount", "EstimatedTime", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (r_id, '私の hằng ngày (Một ngày của tôi)', 
    '私は毎日６時に起きます。朝ご飯を食べて、学校へ行きます。夜は１１時に寝ます。', 
    'Mỗi ngày tôi thức dậy lúc 6 giờ. Tôi ăn sáng rồi đi đến trường. Buổi tối tôi đi ngủ lúc 11 giờ.', 
    35, 3, 1, n5_id, t_id, l_id, NOW(), NOW())
    ON CONFLICT ("Title") DO NOTHING;

    -- Câu hỏi 1 cho bài 2
    q_id := gen_random_uuid();
        INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '何時に起きますか？ (Thức dậy lúc mấy giờ?)', 0, 1, 1, l_id, r_id, NULL, NOW(), NOW());
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, '６時です', true),
    (gen_random_uuid(), q_id, '７時です', false),
	(gen_random_uuid(), q_id, '８時です', false),
	(gen_random_uuid(), q_id, '９時です', false);

    -- Câu hỏi 2 cho bài 2
    q_id := gen_random_uuid();
        INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '学校へ行きますか？ (Có đi đến trường không?)', 0, 1, 1, l_id, r_id, NULL, NOW(), NOW());
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
    INSERT INTO "Readings" ("ReadingID", "Title", "Content", "Translation", "WordCount", "EstimatedTime", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (r_id, '教室 (Lớp học)', 
    '教室に机といすがあります。あそこに時計があります。学生は５人います。', 
    'Trong lớp học có bàn và ghế. Ở kia có cái đồng hồ. Có 5 học sinh.', 
    30, 3, 1, n5_id, t_id, l_id, NOW(), NOW())
    ON CONFLICT ("Title") DO NOTHING;

    -- Câu hỏi 1 cho bài 3
    q_id := gen_random_uuid();
        INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '時計はどこにありますか？ (Cái đồng hồ ở đâu?)', 0, 1, 1, l_id, r_id, NULL, NOW(), NOW());
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, 'あそこにあります', true),
    (gen_random_uuid(), q_id, '教室の外にあります', false),
	(gen_random_uuid(), q_id, 'かばんの中にあります', false),
	(gen_random_uuid(), q_id, '机の下にあります', false);

    -- Câu hỏi 2 cho bài 3
    q_id := gen_random_uuid();
        INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '学生は何人いますか？ (Có bao nhiêu học sinh?)', 0, 1, 1, l_id, r_id, NULL, NOW(), NOW());
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
    INSERT INTO "Readings" ("ReadingID", "Title", "Content", "Translation", "WordCount", "EstimatedTime", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (r_id, '私の趣味 (Sở thích của tôi)', 
    '私の趣味は読書です。休みの日に図書館へ行きます。日本の本が大好きです。', 
    'Sở thích của tôi là đọc sách. Vào ngày nghỉ tôi đến thư viện. Tôi rất thích sách Nhật Bản.', 
    32, 4, 1, n5_id, t_id, l_id, NOW(), NOW())
    ON CONFLICT ("Title") DO NOTHING;

    -- Câu hỏi 1 cho bài 4
    q_id := gen_random_uuid();
        INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '趣味は何ですか？ (Sở thích là gì?)', 0, 1, 1, l_id, r_id, NULL, NOW(), NOW());
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, '読書です', true),
    (gen_random_uuid(), q_id, 'スポーツです', false),
	(gen_random_uuid(), q_id, '料理です', false),
	(gen_random_uuid(), q_id, '映画です', false);

    -- Câu hỏi 2 cho bài 4
    q_id := gen_random_uuid();
        INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '休みの日にどこへ行きますか？ (Ngày nghỉ đi đâu?)', 0, 1, 1, l_id, r_id, NULL, NOW(), NOW());
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
    INSERT INTO "Readings" ("ReadingID", "Title", "Content", "Translation", "WordCount", "EstimatedTime", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (r_id, '日本料理 (Món ăn Nhật)', 
    '私はすしが大好きです。昨日、友達とレストランで食べました。とてもおいしかったです。', 
    'Tôi rất thích Sushi. Hôm qua tôi đã ăn cùng bạn ở nhà hàng. Nó đã rất ngon.', 
    38, 4, 1, n5_id, t_id, l_id, NOW(), NOW())
    ON CONFLICT ("Title") DO NOTHING;

    -- Câu hỏi 1 cho bài 5
    q_id := gen_random_uuid();
        INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '何が大好きですか？ (Thích cái gì nhất?)', 0, 1, 1, l_id, r_id, NULL, NOW(), NOW());
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, 'すしです', true),
    (gen_random_uuid(), q_id, 'ラーメンです', false),
	(gen_random_uuid(), q_id, 'お酒です', false),
	(gen_random_uuid(), q_id, 'パンです', false);

    -- Câu hỏi 2 cho bài 5
    q_id := gen_random_uuid();
        INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, 'だれと食べましたか？ (Đã ăn cùng với ai?)', 0, 1, 1, l_id, r_id, NULL, NOW(), NOW());
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
    INSERT INTO "Readings" ("ReadingID", "Title", "Content", "Translation", "WordCount", "EstimatedTime", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (r_id, '今日の天気 (Thời tiết hôm nay)', 
    '今日はいい天気です。とても暑いです。公園で散歩をします。明日は雨です。', 
    'Hôm nay thời tiết đẹp. Trời rất nóng. Tôi đi dạo ở công viên. Ngày mai trời sẽ mưa.', 
    35, 4, 1, n5_id, t_id, l_id, NOW(), NOW())
    ON CONFLICT ("Title") DO NOTHING;

    -- Câu hỏi 1 bài 6
    q_id := gen_random_uuid();
        INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '今日の天気はどうですか？ (Thời tiết hôm nay thế nào?)', 0, 1, 1, l_id, r_id, NULL, NOW(), NOW());
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, 'いい天気です', true),
    (gen_random_uuid(), q_id, '寒いです', false),
    (gen_random_uuid(), q_id, '雪です', false),
    (gen_random_uuid(), q_id, 'あまりよくないです', false);

    -- Câu hỏi 2 bài 6
    q_id := gen_random_uuid();
        INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '明日の天気は何ですか？ (Thời tiết ngày mai là gì?)', 0, 1, 1, l_id, r_id, NULL, NOW(), NOW());
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
    INSERT INTO "Readings" ("ReadingID", "Title", "Content", "Translation", "WordCount", "EstimatedTime", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (r_id, 'スーパーで買い物 (Mua sắm ở siêu thị)', 
    'このスーパーはとても大きいです。りんごとみかんを買いました。全部で５００円でした。', 
    'Siêu thị này rất lớn. Tôi đã mua táo và quýt. Tổng cộng hết 500 Yên.', 
    38, 4, 1, n5_id, t_id, l_id, NOW(), NOW())
    ON CONFLICT ("Title") DO NOTHING;

    -- Câu hỏi 1 bài 7
    q_id := gen_random_uuid();
        INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '何を買いましたか？ (Đã mua cái gì?)', 0, 1, 1, l_id, r_id, NULL, NOW(), NOW());
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, '果物です', true),
    (gen_random_uuid(), q_id, '肉です', false),
    (gen_random_uuid(), q_id, '魚です', false),
    (gen_random_uuid(), q_id, '野菜です', false);

    -- Câu hỏi 2 bài 7
    q_id := gen_random_uuid();
        INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '全部でいくらでしたか？ (Tổng cộng bao nhiêu tiền?)', 0, 1, 1, l_id, r_id, NULL, NOW(), NOW());
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
    INSERT INTO "Readings" ("ReadingID", "Title", "Content", "Translation", "WordCount", "EstimatedTime", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (r_id, '新しい家 (Ngôi nhà mới)', 
    '私の家は新しくてきれいです。庭にきれいな花がたくさんあります。犬も一匹います。', 
    'Nhà của tôi mới và đẹp. Ở sân có rất nhiều hoa đẹp. Cũng có một con chó nữa.', 
    36, 5, 1, n5_id, t_id, l_id, NOW(), NOW())
    ON CONFLICT ("Title") DO NOTHING;

    -- Câu hỏi 1 bài 8
    q_id := gen_random_uuid();
        INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, 'どんな家ですか？ (Ngôi nhà như thế nào?)', 0, 1, 1, l_id, r_id, NULL, NOW(), NOW());
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, '新しくてきれいです', true),
    (gen_random_uuid(), q_id, '古くて安いです', false),
    (gen_random_uuid(), q_id, '狭くて暗いです', false),
    (gen_random_uuid(), q_id, '大きくて近いです', false);

    -- Câu hỏi 2 bài 8
    q_id := gen_random_uuid();
        INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '庭に何がありますか？ (Ở sân có cái gì?)', 0, 1, 1, l_id, r_id, NULL, NOW(), NOW());
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
    INSERT INTO "Readings" ("ReadingID", "Title", "Content", "Translation", "WordCount", "EstimatedTime", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (r_id, '週末の予定 (Kế hoạch cuối tuần)', 
    '今週の土曜日に友達と海へ行きます。泳いで、魚を食べます。日曜日はうちで休みます。', 
    'Thứ Bảy tuần này tôi sẽ đi biển cùng bạn. Chúng tôi sẽ bơi và ăn cá. Chủ Nhật tôi sẽ nghỉ ngơi ở nhà.', 
    37, 4, 1, n5_id, t_id, l_id, NOW(), NOW())
    ON CONFLICT ("Title") DO NOTHING;

    -- Câu hỏi 1 bài 9
    q_id := gen_random_uuid();
        INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '土曜日にどこへ行きますか？ (Thứ Bảy đi đâu?)', 0, 1, 1, l_id, r_id, NULL, NOW(), NOW());
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, '海です', true),
    (gen_random_uuid(), q_id, '山です', false),
    (gen_random_uuid(), q_id, '公園です', false),
    (gen_random_uuid(), q_id, 'デパートです', false);

    -- Câu hỏi 2 bài 9
    q_id := gen_random_uuid();
        INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '日曜日は何をしますか？ (Chủ Nhật làm gì?)', 0, 1, 1, l_id, r_id, NULL, NOW(), NOW());
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
    INSERT INTO "Readings" ("ReadingID", "Title", "Content", "Translation", "WordCount", "EstimatedTime", "Status", "LevelID", "TopicID", "LessonID", "CreatedAt", "UpdatedAt")
    VALUES (r_id, '私の日本語 (Tiếng Nhật của tôi)', 
    '私は３ヶ月日本語を勉強しました。漢字は難しいですが、とてもおもしろいです。毎日頑張ります。', 
    'Tôi đã học tiếng Nhật được 3 tháng. Kanji thì khó nhưng rất thú vị. Mỗi ngày tôi đều cố gắng.', 
    42, 5, 1, n5_id, t_id, l_id, NOW(), NOW())
    ON CONFLICT ("Title") DO NOTHING;

    -- Câu hỏi 1 bài 10
    q_id := gen_random_uuid();
        INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, 'どのくらい勉強しましたか？ (Đã học được bao lâu rồi?)', 0, 1, 1, l_id, r_id, NULL, NOW(), NOW());
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, '３ヶ月です', true),
    (gen_random_uuid(), q_id, '１ヶ月です', false),
    (gen_random_uuid(), q_id, '半年です', false),
    (gen_random_uuid(), q_id, '１年です', false);

    -- Câu hỏi 2 bài 10
    q_id := gen_random_uuid();
        INSERT INTO "Questions" ("QuestionID", "Content", "QuestionType", "Difficulty", "Status", "LessonID", "ReadingID", "ListeningID", "CreatedAt", "UpdatedAt")
    VALUES (q_id, '漢字はどうですか？ (Chữ Hán thì thế nào?)', 0, 1, 1, l_id, r_id, NULL, NOW(), NOW());
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect") VALUES 
    (gen_random_uuid(), q_id, '難しいですがおもしろいです', true),
    (gen_random_uuid(), q_id, '易しいです', false),
    (gen_random_uuid(), q_id, 'あまり好きじゃないです', false),
    (gen_random_uuid(), q_id, '全然わかりません', false);

	RAISE NOTICE 'Đã tạo xong bài đọc N5.';

END $$;

-------------------------------------------------------
-- 1. XÓA DỮ LIỆU CHI TIẾT (Bảng dữ liệu thực tế)
-------------------------------------------------------

-- Xóa toàn bộ câu trả lời (Answers)
TRUNCATE TABLE "Answers" RESTART IDENTITY CASCADE;

-- Xóa toàn bộ câu hỏi (Questions)
TRUNCATE TABLE "Questions" RESTART IDENTITY CASCADE;

-- Xóa toàn bộ ví dụ (Examples)
TRUNCATE TABLE "Examples" RESTART IDENTITY CASCADE;

-- Xóa toàn bộ bài đọc (Readings)
TRUNCATE TABLE "Readings" RESTART IDENTITY CASCADE;

-- Xóa liên kết từ vựng - kanji (VocabularyKanjis)
TRUNCATE TABLE "VocabularyKanjis" RESTART IDENTITY CASCADE;

-- Xóa toàn bộ từ vựng (Vocabularies)
TRUNCATE TABLE "Vocabularies" RESTART IDENTITY CASCADE;

-- Xóa toàn bộ ngữ pháp (Grammars)
TRUNCATE TABLE "Grammars" RESTART IDENTITY CASCADE;

-- Xóa toàn bộ Kanji (Kanjis)
TRUNCATE TABLE "Kanjis" RESTART IDENTITY CASCADE;

-------------------------------------------------------
-- 2. XÓA CẤP ĐỘ TRUNG GIAN (Cấu trúc bài học)
-------------------------------------------------------

-- Xóa các bài học (Lessons)
TRUNCATE TABLE "Lessons" RESTART IDENTITY CASCADE;

-- Xóa các chủ đề (Topics)
TRUNCATE TABLE "Topics" RESTART IDENTITY CASCADE;

-------------------------------------------------------
-- 3. XÓA CẤU TRÚC GỐC (Danh mục chính)
-------------------------------------------------------

-- Xóa các khóa học (Courses)
TRUNCATE TABLE "Courses" RESTART IDENTITY CASCADE;

-- Xóa các trình độ JLPT (JLPT_Levels)
TRUNCATE TABLE "JLPT_Levels" RESTART IDENTITY CASCADE;

SELECT * FROM "Questions" 
WHERE "GrammarID" = 'd94ed5fd-78b8-4c8c-9fcd-30d0a19c4436';

-------------------------------------------------------
-- XÓA TẤT CẢ DỮ LIỆU CƠ SỞ DỮ LIỆU HỌC TẬP
-------------------------------------------------------
DO $$ 
BEGIN
    TRUNCATE TABLE 
        "Answers",
        "Questions",
        "VocabularyKanjis",
        "Vocabularies", 
        "Grammars", 
        "Kanjis", 
        "Readings",
        "Examples",
        "Lessons", 
        "Topics", 
        "Courses", 
        "JLPT_Levels"
    RESTART IDENTITY CASCADE;

    RAISE NOTICE 'Dữ liệu đã được xóa sạch. Các trường ID đã được reset.';
END $$;