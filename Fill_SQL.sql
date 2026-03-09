-------------------------------------------------------
-- 0. DỌN DẸP VÀ CẤU HÌNH RÀNG BUỘC
-------------------------------------------------------
TRUNCATE TABLE "Answers", "Questions", "Vocabularies", "Kanjis", "Grammars", "Topics", "Lessons", "JLPT_Levels" CASCADE;

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
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uc_lessontitle') THEN
        ALTER TABLE "Lessons" ADD CONSTRAINT uc_lessontitle UNIQUE ("Title");
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

    -- Định nghĩa ID cố định cho Courses
    course_n5_id uuid := '11111111-1111-1111-1111-111111111111';
    course_n4_id uuid := '22222222-2222-2222-2222-222222222222';
    course_n3_id uuid := '33333333-3333-3333-3333-333333333333';
BEGIN
    -------------------------------------------------------
    -- 1. TẠO CÁC LEVEL (JLPT_Levels)
    -------------------------------------------------------
    INSERT INTO "JLPT_Levels" ("LevelID", "LevelName") VALUES 
    (level_n5_id, 'N5'),
    (level_n4_id, 'N4'),
    (level_n3_id, 'N3')
    ON CONFLICT ("LevelName") DO NOTHING;

    -------------------------------------------------------
    -- 2. TẠO CÁC TOPIC
    -------------------------------------------------------
    INSERT INTO "Topics" ("TopicID", "TopicName", "Description") VALUES
    (gen_random_uuid(), 'Ngữ Pháp N5 Tổng Hợp', 'Tổng hợp 25 bài ngữ pháp căn bản theo giáo trình Minna no Nihongo'),
    (gen_random_uuid(), 'Kanji N5 Tổng Hợp', 'Tổng hợp các chữ kanji căn bản theo giáo trình Minna no Nihongo'),
    (gen_random_uuid(), 'Từ Vựng N5 Tổng Hợp', 'Tổng hợp các từ vựng căn bản theo giáo trình Minna no Nihongo')
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
                'Vocabulary', -- Khớp với Enum SkillType trong C# của bạn
                1,            -- Độ khó mặc định
                i,            -- Thứ tự ưu tiên
                course_n5_id  -- Khóa ngoại trỏ về bảng Courses
            ) ON CONFLICT ("Title") DO NOTHING;
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
BEGIN
    -- Lấy Topic ID chung cho Ngữ pháp N5 (Đã tạo ở script trước)
    SELECT "TopicID" INTO t_id FROM "Topics" WHERE "TopicName" = 'Ngữ Pháp N5 Tổng Hợp' LIMIT 1;

    -------------------------------------------------------
    -- BÀI 1: DANH TỪ & CÂU KHẲNG ĐỊNH/PHỦ ĐỊNH
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 1';
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Example", "ExampleMeaning", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), 'Khẳng định', 'N1 は N2 です', 'N1 là N2', 'Câu khẳng định lịch sự', 'わたしは たなかです。', 'Tôi là Tanaka.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Phủ định', 'N1 は N2 じゃありません', 'N1 không phải là N2', 'Câu phủ định của です', 'あの方（かた）は 医者（いしゃ）じゃありません。', 'Vị kia không phải là bác sĩ.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Câu hỏi', 'S + か', 'Câu hỏi (?)', 'Thêm か vào cuối câu', 'たなかさんは 学生（がくせい）ですか。', 'Anh Tanaka là sinh viên phải không?', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Đồng nhất (cũng là)', 'N1 も N2', 'N1 cũng là N2', 'Trợ từ も (cũng)', 'ミラーさんも 会社員（かいしゃいん）です。', 'Anh Miller cũng là nhân viên công ty.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Sở hữu (của)', 'N1 の N2', 'N2 của N1 / N2 thuộc N1', 'Trợ từ の nối 2 danh từ', 'これは 私（わたし）の本（ほん）です。', 'Đây là cuốn sách của tôi.', n5_id, t_id, l_id)
    ON CONFLICT ("Structure") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 2: ĐẠI TỪ CHỈ ĐỊNH (ĐỒ VẬT)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 2';
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Example", "ExampleMeaning", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), 'Vật gần/xa (Cái này)', 'これ / それ / あれ', 'Cái này / đó / kia', 'Đại từ chỉ định làm chủ ngữ', 'これは コンピューターです。', 'Đây là máy tính.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Bổ nghĩa danh từ', 'この N / その N / あの N', 'Cái N này / đó / kia', 'Phải có danh từ N đi kèm sau', 'あの人は だれですか。', 'Người kia là ai vậy?', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Xác nhận thông tin', 'そうですか', 'Ra vậy / Thế à', 'Tiếp nhận thông tin mới', 'そうですか。わかりました。', 'Thế à. Tôi hiểu rồi.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Câu hỏi lựa chọn', 'S1 か、S2 か', 'S1 hay là S2?', 'Lựa chọn giữa các phương án', 'これは 「９」ですか、「７」ですか。', 'Đây là số 9 hay số 7?', n5_id, t_id, l_id)
    ON CONFLICT ("Structure") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 3: ĐỊA ĐIỂM & PHƯƠNG HƯỚNG
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 3';
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Example", "ExampleMeaning", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), 'Địa điểm (Chỗ này)', 'ここ / そこ / あそこ', 'Chỗ này / đó / kia', 'Đại từ chỉ địa điểm', 'あそこは 食堂（しょくどう）です。', 'Chỗ kia là nhà ăn.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Phương hướng (Phía này)', 'こちら / そちら / あちら', 'Phía này / đó / kia', 'Chỉ hướng hoặc địa điểm lịch sự', 'お手洗い（おてあらい）は こちらです。', 'Nhà vệ sinh ở phía này.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Vị trí vật/người', 'N1 は N2 (địa điểm) です', 'N1 ở N2', 'Chỉ vị trí của đối tượng', '電話（でんわ）は ２階（にかい）です。', 'Điện thoại ở tầng 2.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Hỏi nơi chốn', 'どこ / どちら', 'Ở đâu / Phía nào', 'Từ để hỏi địa điểm', '大学（だいがく）は どこですか。', 'Trường đại học ở đâu?', n5_id, t_id, l_id)
    ON CONFLICT ("Structure") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 4: THỜI GIAN & ĐỘNG TỪ
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 4';
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Example", "ExampleMeaning", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), 'Giờ phút hiện tại', '今 ～時 ～分 です', 'Bây giờ là...', 'Cách nói thời gian', '今（いま）４時（よじ）５分（ごふん）です。', 'Bây giờ là 4 giờ 5 phút.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Động từ hiện tại', 'V-ます / V-ません', 'Làm / Không làm', 'Thói quen hoặc sự thật', '毎日（まいにち）勉強（べんきょう）します。', 'Hàng ngày tôi đều học bài.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Động từ quá khứ', 'V-ました / V-ませんでした', 'Đã làm / Đã không làm', 'Hành động trong quá khứ', 'きのう 働きませんでした。', 'Hôm qua tôi đã không làm việc.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Thời điểm hành động', 'N (thời gian) に V', 'Làm gì vào lúc...', 'Trợ từ に đi với thời gian có số', '６時（ろくじ）に 起きます。', 'Tôi thức dậy lúc 6 giờ.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Phạm vi', 'N1 から N2 まで', 'Từ N1 đến N2', 'Phạm vi thời gian/không gian', '９時から ５時まで 働きます。', 'Tôi làm việc từ 9 giờ đến 5 giờ.', n5_id, t_id, l_id)
    ON CONFLICT ("Structure") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 5: DI CHUYỂN
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 5';
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Example", "ExampleMeaning", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), 'Hướng di chuyển', 'N へ 行きます/来ます/帰ります', 'Đi / Đến / Về đâu', 'Trợ từ へ chỉ hướng', '京都（きょうと）へ 行きます。', 'Tôi đi Kyoto.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Phủ định hoàn toàn', 'どこ [へ] も 行きません', 'Không đi đâu cả', 'Phủ định hoàn toàn', 'どこへも 行きませんでした。', 'Tôi đã không đi đâu cả.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Phương tiện', 'N で 行きます', 'Đi bằng phương tiện gì', 'Trợ từ で chỉ cách thức', '電車（でんしゃ）で 行きます。', 'Tôi đi bằng tàu điện.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Cùng với ai', 'N と V', 'Làm gì cùng ai', 'Trợ từ と chỉ bạn đồng hành', '家族（かぞく）と 日本（にほん）へ 来ました。', 'Tôi đã đến Nhật cùng gia đình.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Hỏi thời điểm', 'いつ V ますか', 'Khi nào làm V?', 'Từ hỏi いつ', 'いつ 日本へ 来ましたか。', 'Bạn đã đến Nhật khi nào?', n5_id, t_id, l_id)
    ON CONFLICT ("Structure") DO NOTHING;

	-------------------------------------------------------
    -- BÀI 6: NGOẠI ĐỘNG TỪ (Wo, De, Issho ni)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 6';
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Example", "ExampleMeaning", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), 'Tác động trực tiếp', 'N を V (ngoại động từ)', 'Làm / Tác động vào N', 'Trợ từ を chỉ đối tượng trực tiếp của hành động', 'ごはんを 食べます。', 'Tôi ăn cơm.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Hỏi nội dung hành động', '何 を しますか', 'Làm cái gì?', 'Dùng để hỏi về nội dung hành động', '月曜日（げつようび） 何を しますか。', 'Thứ Hai bạn làm gì?', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Địa điểm xảy ra hành động', 'N (địa điểm) で V', 'Làm việc gì tại đâu', 'Trợ từ で chỉ nơi xảy ra hành động', '駅（えき）で 新聞（しんぶん）を 買います。', 'Tôi mua báo ở nhà ga.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Mời mọc lịch sự', 'V-ませんか', 'Cùng làm... nhé?', 'Lời mời mọc, rủ rê một cách lịch sự', 'いっしょに 京都（きょうと）へ 行きませんか。', 'Cùng đi Kyoto với tôi không?', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Đề nghị cùng làm', 'V-ましょう', 'Cùng làm... thôi!', 'Lời đề nghị cùng thực hiện hành động', 'ちょっと 休みましょう。', 'Nghỉ một chút nào.', n5_id, t_id, l_id)
    ON CONFLICT ("Structure") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 7: CÔNG CỤ & CHO/NHẬN (Agemasu, Moraimasu)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 7';
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Example", "ExampleMeaning", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), 'Công cụ/Ngôn ngữ', 'N (công cụ) で V', 'Làm bằng công cụ/ngôn ngữ gì', 'Trợ từ で chỉ phương thức thực hiện', 'はしで 食べます。', 'Tôi ăn bằng đũa.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Hỏi cách nói', '「Từ/Câu」は ～語で 何ですか', '... tiếng ~ nói là gì?', 'Hỏi cách dịch một từ', '「Thank you」は 日本語で 何ですか。', '"Thank you" tiếng Nhật là gì?', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Cho/Tặng ai đó', 'N1 に N2 を あげます', 'Cho/Tặng N1 cái N2', 'Hành động cho đi', '木村（きむら）さんに 花（はな）を あげました。', 'Tôi đã tặng hoa cho chị Kimura.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Nhận từ ai đó', 'N1 に N2 を もらいます', 'Nhận N2 từ N1', 'Hành động nhận về', 'カリナさんに CDを もらいました。', 'Tôi đã nhận đĩa CD từ Karina.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Đã hoàn thành', 'もう V-ました', 'Đã làm... rồi', 'Hành động đã hoàn tất', 'もう 荷物（にもつ）を 送（おく）りましたか。', 'Bạn đã gửi hành lý đi chưa?', n5_id, t_id, l_id)
    ON CONFLICT ("Structure") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 8: TÍNH TỪ (Adj-i, Adj-na)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 8';
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Example", "ExampleMeaning", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), 'Tính chất (Tĩnh từ đuôi i)', 'N は Adj-い です', 'N thì... (tính từ đuôi i)', 'Khẳng định tính chất với tính từ đuôi i', '富士山（ふじさん）は 高（たか）いです。', 'Núi Phú Sĩ cao.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Tính chất (Tĩnh từ đuôi na)', 'N は Adj-な [です]', 'N thì... (tính từ đuôi na)', 'Khẳng định tính chất với tính từ đuôi na', 'この町（まち）は 静（しず）かです。', 'Thành phố này yên tĩnh.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Phủ định đuôi i', 'Adj-い (bỏ い) + くないです', 'Không... (phủ định đuôi i)', 'Phủ định của tính từ đuôi i', 'この本（ほん）は おもしろくないです。', 'Cuốn sách này không hay.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Phủ định đuôi na', 'Adj-な じゃありません', 'Không... (phủ định đuôi na)', 'Phủ định của tính từ đuôi na', 'あそこは べんりじゃありません。', 'Chỗ kia không tiện lợi.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Tính từ bổ nghĩa danh từ', 'Adj N', 'Tính từ bổ nghĩa danh từ', 'Đuôi i giữ い, đuôi na giữ な', '奈良（なら）は 古（ふる）い 町（まち）です。', 'Nara là một thành phố cổ.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Mức độ (Rất/Không lắm)', 'とても / あまり', 'Rất / Không... lắm', 'Phó từ chỉ mức độ', '北京（ぺきん）は とても 寒（さむ）いです。', 'Bắc Kinh rất lạnh.', n5_id, t_id, l_id)
    ON CONFLICT ("Structure") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 9: SỞ THÍCH & KHẢ NĂNG
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 9';
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Example", "ExampleMeaning", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), 'Sở hữu/Trạng thái', 'N が あります / わかります', 'Có N / Hiểu N', 'Trợ từ が chỉ trạng thái/sở hữu', '英語（えいご）が わかります。', 'Tôi hiểu tiếng Anh.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Sở thích', 'N が 好きです / 嫌いです', 'Thích N / Ghét N', 'Chỉ tâm trạng, sở thích', '料理（りょうり）が 好きです。', 'Tôi thích nấu ăn.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Năng khiếu', 'N が 上手です / 下手です', 'Giỏi N / Kém N', 'Chỉ năng khiếu', '歌（うた）が 上手（じょうず）です。', 'Anh/Chị hát giỏi.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Hỏi tính chất/chủng loại', 'どんな N', 'N như thế nào?', 'Hỏi về tính chất cụ thể', 'どんな スポーツが 好きですか。', 'Bạn thích môn thể thao như thế nào?', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Nguyên nhân - Hệ quả', 'S1 から、S2', 'Vì S1 nên S2', 'Nối câu chỉ lý do', '時間（じかん）が ありませんから、読みません。', 'Vì không có thời gian nên tôi không đọc.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Hỏi lý do', 'どうして', 'Tại sao?', 'Từ dùng để hỏi lý do', 'どうして 遅（おそ）くなりましたか。', 'Tại sao bạn lại đến muộn?', n5_id, t_id, l_id)
    ON CONFLICT ("Structure") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 10: SỰ TỒN TẠI (Arimasu, Imasu)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 10';
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Example", "ExampleMeaning", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), 'Sự tồn tại vật/cây', 'N に N が あります', 'Ở địa điểm có vật/cây', 'Dùng cho vật vô tri', '机（つくえ）の上（うえ）に 本があります。', 'Trên bàn có cuốn sách.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Sự tồn tại người/vật', 'N に N が います', 'Ở địa điểm có người/động vật', 'Dùng cho người hoặc con vật', 'あそこに 男（おとこ）の人が います。', 'Ở kia có người đàn ông.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Chủ đề vị trí', 'N は N に あります/います', 'N thì ở địa điểm', 'Nhấn mạnh chủ thể đã biết', 'ミラーさんは 事務所（じむしょ）に います。', 'Anh Miller ở trong văn phòng.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Vị trí tương đối', 'N1 の N2 (vị trí)', 'N2 của N1', 'Chỉ vị trí cụ thể (trên, dưới, trong...)', '箱（はこ）の 中（なか）に 何がありますか。', 'Trong hộp có cái gì vậy?', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Liệt kê không đầy đủ', 'N1 や N2', 'N1 và N2 (vẫn còn nữa)', 'Liệt kê không hết các đối tượng', '店（みせ）に パンや 卵（たまご）が あります。', 'Trong cửa hàng có bánh mì, trứng... (và các thứ khác).', n5_id, t_id, l_id)
    ON CONFLICT ("Structure") DO NOTHING;

	-------------------------------------------------------
    -- BÀI 11: CÁCH ĐẾM SỐ LƯỢNG (Tsu, Nin, Mai, Kai...)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 11';
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Example", "ExampleMeaning", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), 'Số lượng vật', 'N を Số lượng V', 'Làm V với số lượng N', 'Số từ đặt sau trợ từ và trước động từ', 'りんごを ４つ 買いました。', 'Tôi đã mua 4 quả táo.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Tần suất', 'Khoảng thời gian に Số lần V', 'Làm V mấy lần trong khoảng thời gian', 'Chỉ tần suất thực hiện hành động', '１か月に ２回 映画を 見ます。', 'Một tháng tôi xem phim 2 lần.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Giới hạn (Chỉ)', 'Số lượng + だけ', 'Chỉ (số lượng)', 'Biểu thị sự giới hạn', '休みは 日曜日だけです。', 'Ngày nghỉ chỉ có chủ nhật.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Hỏi khoảng thời gian/giá cả', 'どのくらい', 'Mất bao lâu / Bao nhiêu tiền', 'Hỏi về lượng thời gian hoặc tiền bạc', '東京から 大阪まで どのくらい かかりますか。', 'Từ Tokyo đến Osaka mất bao lâu?', n5_id, t_id, l_id)
    ON CONFLICT ("Structure") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 12: THÌ QUÁ KHỨ CỦA TÍNH TỪ & SO SÁNH
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 12';
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Example", "ExampleMeaning", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), 'So sánh hơn', 'N1 は N2 より Adj です', 'N1 Adj hơn N2', 'Cấu trúc so sánh hơn giữa 2 vật', 'この車は あの車より 速いです。', 'Cái xe ô tô này nhanh hơn cái ô tô kia.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'So sánh lựa chọn', 'N1 と N2 と どちらが Adj ですか', 'N1 và N2 cái nào Adj hơn?', 'Hỏi để lựa chọn giữa 2 đối tượng', 'サッカーと 野球と どちらが おもしろいですか。', 'Bóng đá và bóng chày cái nào thú vị hơn?', n5_id, t_id, l_id),
    (gen_random_uuid(), 'So sánh nhất', 'N1 [の中で] N2 が いちばん Adj です', 'Trong phạm vi N1, N2 là Adj nhất', 'So sánh nhất trong một tập hợp', '１年で いつが いちばん 暑いですか。', 'Trong một năm khi nào là nóng nhất?', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Quá khứ đuôi i', 'Adj-i (bỏ い) + かったです', 'Đã... (quá khứ tính từ đuôi i)', 'Thì quá khứ của tính từ đuôi i', '昨日のパーティーは 楽しかったです。', 'Bữa tiệc hôm qua đã rất vui.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Quá khứ đuôi na/danh từ', 'Adj-na / N + でした', 'Đã là... (quá khứ)', 'Thì quá khứ của tính từ đuôi na và danh từ', '昨日は 雨でした。', 'Hôm qua đã trời mưa.', n5_id, t_id, l_id)
    ON CONFLICT ("Structure") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 13: MONG MUỐN & MỤC ĐÍCH
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 13';
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Example", "ExampleMeaning", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), 'Mong muốn vật', 'N が ほしいです', 'Muốn có N', 'Diễn tả mong muốn sở hữu vật', '私は 新しい車が ほしいです。', 'Tôi muốn có một chiếc xe hơi mới.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Mong muốn hành động', 'V-ます (bỏ ます) + たいです', 'Muốn làm V', 'Diễn tả nguyện vọng làm việc gì đó', '日本へ 行きたいです。', 'Tôi muốn đi Nhật.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Mục đích di chuyển', 'N へ V-ます (bỏ ます) に 行きます', 'Đi đến đâu để làm gì', 'Chỉ mục đích của hành động di chuyển', 'デパートへ 買い物に 行きます。', 'Tôi đi đến trung tâm thương mại để mua sắm.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Đối tượng không xác định', 'どこか / なにか', 'Đâu đó / Cái gì đó', 'Chỉ đối tượng không xác định cụ thể', '冬休みは どこかへ 行きましたか。', 'Kỳ nghỉ đông bạn có đi đâu đó không?', n5_id, t_id, l_id)
    ON CONFLICT ("Structure") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 14: THỂ TE (1) - SAI KHIẾN & ĐANG LÀM
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 14';
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Example", "ExampleMeaning", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), 'Yêu cầu lịch sự (Hãy)', 'V-て ください', 'Hãy làm V', 'Nhờ vả hoặc yêu cầu người khác', 'ここに 住所を 書いてください。', 'Hãy viết địa chỉ vào đây.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Hành động đang diễn ra', 'V-て います', 'Đang làm V', 'Hành động đang tiếp diễn', '今 本を 読んでいます。', 'Bây giờ tôi đang đọc sách.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Đề nghị giúp đỡ', 'V-ましょうか (đề nghị)', 'Để tôi làm... nhé?', 'Lời đề nghị giúp đỡ đối phương', 'タクシーを 呼びましょうか。', 'Để tôi gọi taxi cho bạn nhé?', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Nối câu tương phản', 'S1 が、S2', 'S1 nhưng S2', 'Nối hai mệnh đề ngược nghĩa', '失礼ですが、お名前は？', 'Xin lỗi (nhưng) tên bạn là gì ạ?', n5_id, t_id, l_id)
    ON CONFLICT ("Structure") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 15: THỂ TE (2) - CHO PHÉP & CẤM ĐOÁN
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 15';
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Example", "ExampleMeaning", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), 'Xin phép/Cho phép', 'V-て も いいです', 'Làm V cũng được', 'Biểu thị sự cho phép hoặc xin phép', '写真を 撮っても いいですか。', 'Tôi chụp ảnh có được không?', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Cấm đoán', 'V-て は いけません', 'Không được làm V', 'Biểu thị sự cấm đoán', 'ここで タバコを 吸ってはいけません。', 'Không được hút thuốc ở đây.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Trạng thái/Nghề nghiệp', 'V-て います (trạng thái)', 'Đang... (kết quả/nghề nghiệp)', 'Trạng thái hiện tại hoặc nghề nghiệp', '私は 結婚しています。', 'Tôi đã kết hôn (đang ở trạng thái kết hôn).', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Động từ trạng thái đặc biệt', 'N に 住んでいます/勤めています', 'Sống ở/Làm việc ở...', 'Dùng trợ từ に với các động từ trạng thái địa điểm', '大阪に 住んでいます。', 'Tôi đang sống ở Osaka.', n5_id, t_id, l_id)
    ON CONFLICT ("Structure") DO NOTHING;

	-------------------------------------------------------
    -- BÀI 16: LIỆT KÊ HÀNH ĐỘNG & TÍNH TỪ (Te-form)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 16';
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Example", "ExampleMeaning", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), 'Liệt kê hành động (Trình tự)', 'V1-て, V2-て, V3', 'Làm V1, rồi V2, rồi V3', 'Liệt kê các hành động theo trình tự thời gian', '朝（あさ） 起（お）きて、顔（かお）を 洗（あら）って、朝（あさ）ごはんを 食（た）べます。', 'Sáng tôi thức dậy, rửa mặt rồi ăn sáng.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Nối tính từ đuôi i', 'Adj1-くて, Adj2', 'Adj1 và Adj2', 'Cách nối 2 tính từ đuôi i', 'この部屋（へや）は 広（ひろ）くて、明（あか）るいです。', 'Căn phòng này rộng và sáng sủa.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Nối tính từ na/danh từ', 'Adj-na / N + で, Adj2', 'Adj1/N và Adj2', 'Cách nối tính từ đuôi na hoặc danh từ', '奈良（なら）は 静（しず）かで、きれいな 町（まち）です。', 'Nara là thành phố yên tĩnh và đẹp.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Hành động nối tiếp nhấn mạnh', 'V1-て から, V2', 'Sau khi làm V1, thì làm V2', 'Nhấn mạnh V2 xảy ra ngay sau V1', '仕事（しごと）が 終（お）わってから、飲（の）みに 行（い）きます。', 'Sau khi xong việc, tôi sẽ đi uống (bia/rượu).', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Miêu tả bộ phận cơ thể', 'N1 は N2 が Adj です', 'N1 có N2 thì Adj', 'Miêu tả đặc điểm bộ phận cơ thể', 'マリアさんは 目（め）が 大（おお）きいです。', 'Chị Maria có đôi mắt to.', n5_id, t_id, l_id)
    ON CONFLICT ("Structure") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 17: THỂ NAI (Phủ định ngắn - Nai-form)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 17';
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Example", "ExampleMeaning", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), 'Yêu cầu không làm', 'V-ないで ください', 'Đừng làm V / Xin đừng V', 'Yêu cầu lịch sự không làm gì đó', 'ここで 写真（しゃしん）を 撮（と）らないで ください。', 'Xin đừng chụp ảnh ở đây.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Nghĩa vụ (Phải làm)', 'V-なければ なりません', 'Phải làm V', 'Diễn tả nghĩa vụ bắt buộc', '薬（くすり）を 飲（の）まなければ なりません。', 'Tôi phải uống thuốc.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Không cần thiết', 'V-なくても いいです', 'Không cần làm V cũng được', 'Biểu thị sự không cần thiết', '明日（あした） 来（こ）なくても いいです。', 'Ngày mai bạn không cần đến cũng được.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Nhấn mạnh tân ngữ', 'N (tân ngữ) は', 'N thì...', 'Đưa tân ngữ lên làm chủ đề thảo luận', '資料（しりょう）は どこですか。', 'Tài liệu (thì) ở đâu thế?', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Thời hạn (Trước khi)', 'N (thời gian) までに V', 'Làm V trước thời hạn N', 'Chỉ hạn chót thực hiện hành động', '会議（かいぎ）は ５時（ごじ）までに 終（お）わります。', 'Cuộc họp sẽ kết thúc trước 5 giờ.', n5_id, t_id, l_id)
    ON CONFLICT ("Structure") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 18: THỂ TỪ ĐIỂN (Khả năng & Sở thích)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 18';
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Example", "ExampleMeaning", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), 'Khả năng/Năng lực', 'V-ること が できます', 'Có thể làm V', 'Diễn tả năng lực hoặc khả năng', '漢字（かんじ）を 読（よ）むことが できます。', 'Tôi có thể đọc được chữ Hán.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Sở thích (Danh từ hóa)', '趣味 は V-ること です', 'Sở thích là làm V', 'Cách nói về sở thích cá nhân', '私の趣味は 写真（しゃしん）を 撮（と）ることです。', 'Sở thích của tôi là chụp ảnh.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Trước khi hành động', 'V1-る / N の + まえに, V2', 'Trước khi làm V1, thì làm V2', 'Chỉ trình tự thời gian', '寝（ね）る前（まえ）に、日記（にっき）を 書（か）きます。', 'Trước khi đi ngủ, tôi viết nhật ký.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Sự khó khăn', 'なかなか V-ません', 'Mãi mà không...', 'Chỉ sự khó khăn, trì trệ', '日本（にほん）では なかなか 馬（うま）を 見（み）ることが できません。', 'Ở Nhật mãi mà chẳng thể thấy ngựa được.', n5_id, t_id, l_id)
    ON CONFLICT ("Structure") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 19: THỂ TA (Kinh nghiệm & Liệt kê)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 19';
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Example", "ExampleMeaning", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), 'Kinh nghiệm (Đã từng)', 'V-た こと が あります', 'Đã từng làm V', 'Diễn tả trải nghiệm trong quá khứ', '北海道（ほっかいどう）へ 行（い）ったことが あります。', 'Tôi đã từng đi Hokkaido.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Liệt kê hành động', 'V1-たり, V2-たり します', 'Lúc thì V1, lúc thì V2', 'Liệt kê hành động không theo thứ tự', '日曜日は 買い物したり、映画を 見たり します。', 'Chủ nhật tôi lúc thì đi mua sắm, lúc thì xem phim.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Sự thay đổi (Đuôi i)', 'Adj-い (bỏ い) -> くなります', 'Trở nên...', 'Diễn tả sự biến đổi trạng thái', '寒（さむ）く なりました。', 'Trời đã trở nên lạnh rồi.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Sự thay đổi (Na/Danh từ)', 'Adj-na / N + に なります', 'Trở nên... / Thành...', 'Diễn tả sự thay đổi trạng thái', '元気（げんき）に なりました。', 'Tôi đã khỏe lại rồi.', n5_id, t_id, l_id)
    ON CONFLICT ("Structure") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 20: THỂ THÔNG THƯỜNG (Giao tiếp thân mật)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 20';
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Example", "ExampleMeaning", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), 'Động từ thân mật', 'V-る / V-ない / V-た', 'Làm / Không / Đã làm (thân mật)', 'Thể ngắn dùng với bạn bè', '明日（あした） 行（い）く？', 'Mai đi không?', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Tính từ i thân mật', 'Adj-い (bỏ です)', 'Tính chất (thân mật)', 'Lược bỏ です ở cuối câu', 'そのカレー、辛（から）い？', 'Món cà ri đó cay không?', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Danh từ/Tính từ na thân mật', 'N / Adj-na + だ', 'Là... (thân mật)', 'Sử dụng だ thay cho です', '今日は 雨（あめ）だ。', 'Hôm nay trời mưa đấy.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Nối câu thân mật', 'S + けど', 'S nhưng mà...', 'Cách nói thân mật của が', 'その映画（えいが）、見（み）たけど おもしろくなかった。', 'Phim đó tớ xem rồi nhưng không hay lắm.', n5_id, t_id, l_id)
    ON CONFLICT ("Structure") DO NOTHING;

	-------------------------------------------------------
    -- BÀI 21: TƯỜNG THUẬT & DỰ ĐOÁN
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 21';
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Example", "ExampleMeaning", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), 'Bày tỏ ý kiến', 'Thể thông thường + と 思います', 'Tôi nghĩ là...', 'Bày tỏ ý kiến, suy đoán cá nhân', '明日（あした） 雨（あめ）が 降（ふ）ると 思（おも）います。', 'Tôi nghĩ là ngày mai trời sẽ mưa.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Trích dẫn lời nói', 'Thể thông thường + と 言いました', 'Đã nói là...', 'Trích dẫn lại lời nói của người khác', '寝（ね）る前（まえ）に 「おやすみなさい」と 言（い）います。', 'Trước khi đi ngủ, chúng ta nói "Chúc ngủ ngon".', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Xác nhận/Dự đoán', 'S + でしょう', 'S có đúng không? / S chắc là...', 'Xác nhận sự đồng ý hoặc dự đoán', '明日（あした）は パーティーに 行（い）くでしょう？', 'Ngày mai bạn đi dự tiệc chứ nhỉ?', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Tổ chức sự kiện', 'N1 (địa điểm) で N2 (sự kiện) が あります', 'Ở N1 tổ chức N2', 'Dùng あります cho sự kiện, lễ hội', '東京（とうきょう）で お祭（まつ）りが あります。', 'Ở Tokyo có lễ hội.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Đưa ra ví dụ gợi ý', 'N でも V', 'Làm V (như là N)', 'Đưa ra ví dụ gợi ý', 'ちょっと ビールでも 飲（の）みませんか。', 'Bạn có muốn uống chút bia hay gì đó không?', n5_id, t_id, l_id)
    ON CONFLICT ("Structure") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 22: MỆNH ĐỀ ĐỊNH NGỮ (Bổ nghĩa danh từ)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 22';
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Example", "ExampleMeaning", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), 'Bổ nghĩa danh từ bằng động từ', 'V (thể ngắn) + N', 'Cái N mà làm V...', 'Cụm động từ bổ nghĩa cho danh từ', 'これは ミラーさんが 作（つく）った ケーキです。', 'Đây là chiếc bánh mà anh Miller đã làm.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Chủ ngữ trong mệnh đề phụ', 'N1 が V-る N2', 'N2 mà N1 làm...', 'Chủ ngữ trong mệnh đề định ngữ dùng が', '私（わたし）が 住（す）んでいる アパートは 古（ふる）いです。', 'Căn hộ mà tôi đang sống đã cũ rồi.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Bổ nghĩa danh từ chỉ kế hoạch', 'V-る / V-ない + 時間/約束/用事', 'Thời gian/Hẹn để làm V', 'Bổ nghĩa cho danh từ kế hoạch', '明日（あした） 友達（ともだち）と 会（あ）う 約束（やくそく）が あります。', 'Ngày mai tôi có hẹn gặp bạn.', n5_id, t_id, l_id)
    ON CONFLICT ("Structure") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 23: KHI... THÌ (Toki) & HỆ QUẢ (To)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 23';
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Example", "ExampleMeaning", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), 'Thời điểm (Khi)', 'V-る / V-た + とき', 'Khi (làm) V...', 'Chỉ thời điểm thực hiện hành động', '図書館（としょかん）で 本（ほん）を 借（か）りるとき、カードが 要（い）ります。', 'Khi mượn sách ở thư viện cần có thẻ.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Khi (Tính từ/Danh từ)', 'Adj / N の + とき', 'Khi... (tính chất/danh từ)', 'Cách dùng Toki với Adj/N', '暇（ひま）なとき、本（ほん）を 読（よ）みます。', 'Khi rảnh rỗi, tôi thường đọc sách.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Hệ quả tất yếu', 'V-る + と, S2', 'Hễ làm V thì S2 xảy ra', 'Diễn tả hệ quả tất yếu hoặc chỉ đường', 'このボタンを 押（お）すと、お釣（つ）りが 出（で）ます。', 'Hễ ấn nút này thì tiền thừa sẽ ra.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Trạng thái tự nhiên', 'N が 出ます / 動きます', 'N xuất hiện / N chuyển động', 'Trợ từ が với tự động từ', '電気（でんき）が つきました。', 'Điện đã sáng (tự nhiên sáng).', n5_id, t_id, l_id)
    ON CONFLICT ("Structure") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 24: CHO NHẬN TRỢ GIÚP
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 24';
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Example", "ExampleMeaning", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), 'Người khác cho mình', 'N は (tôi) に N を くれます', 'Ai đó cho tôi cái gì', 'Dùng khi mình là người nhận', '佐藤（さとう）さんは 私（わたし）に クリスマスカードを くれました。', 'Chị Sato đã cho tôi tấm thiệp Giáng sinh.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Làm giúp ai đó', 'V-て あげます', 'Làm việc gì đó cho ai', 'Làm việc tốt cho người khác', '私（わたし）は 木村（きむら）さんに 本（ほん）を 貸（か）して あげました。', 'Tôi đã cho chị Kimura mượn sách.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Được ai đó giúp', 'V-て もらいます', 'Được ai đó làm giúp', 'Biết ơn khi được giúp đỡ', '私（わたし）は 鈴木（すずき）さんに 漢字（かんじ）を 教（おそ）えて もらいました。', 'Tôi đã được anh Suzuki dạy chữ Hán.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Ai đó làm giúp mình', 'V-て くれます', 'Ai đó làm việc giúp tôi', 'Người khác chủ động giúp mình', '家内（かない）は 私（わたし）のシャツを 洗（あら）って くれました。', 'Vợ tôi đã giặt áo sơ mi cho tôi.', n5_id, t_id, l_id)
    ON CONFLICT ("Structure") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 25: CÂU ĐIỀU KIỆN (Tara) & NGHỊCH LÝ (Temo)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 25';
    INSERT INTO "Grammars" ("GrammarID", "Title", "Structure", "Meaning", "Explanation", "Example", "ExampleMeaning", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), 'Giả định (Nếu)', 'V-たら, S2', 'Nếu... thì S2', 'Câu điều kiện giả định', '雨（あめ）が 降（ふ）ったら、出（で）かけません。', 'Nếu trời mưa, tôi sẽ không ra ngoài.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Nghịch lý (Cho dù)', 'V-ても, S2', 'Cho dù... thì cũng S2', 'Diễn tả sự tương phản', '雨（あめ）が 降（ふ）っても、洗濯（せんたく）します。', 'Cho dù trời mưa, tôi vẫn giặt đồ.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Nhấn mạnh giả thuyết', 'もし', 'Nếu như', 'Phó từ đi kèm với Tara', 'もし １億円（いちおくえん） あったら、留学（りゅうがく）したいです。', 'Nếu như có 100 triệu Yên, tôi muốn đi du học.', n5_id, t_id, l_id),
    (gen_random_uuid(), 'Nhấn mạnh nghịch lý', 'いくら', 'Cho dù... bao nhiêu đi nữa', 'Đi kèm với mẫu câu Temo', 'いくら 考（かんが）えても、わかりません。', 'Dù có suy nghĩ bao nhiêu đi nữa, tôi vẫn không hiểu.', n5_id, t_id, l_id)
    ON CONFLICT ("Structure") DO NOTHING;

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

    -- BÀI 1: CHÀO HỎI & GIỚI THIỆU
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 1';
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), '人', 'ジン, ニン', 'ひと', 'Người', 2, '人', n5_id, t_id, l_id),
    (gen_random_uuid(), '学', 'ガク', 'まな.ぶ', 'Học', 8, '子', n5_id, t_id, l_id),
    (gen_random_uuid(), '生', 'セイ, ショウ', 'い.きる', 'Sinh', 5, '生', n5_id, t_id, l_id),
    (gen_random_uuid(), '先', 'セン', 'さき', 'Trước', 6, '儿', n5_id, t_id, l_id),
    (gen_random_uuid(), '日', 'ニチ', 'ひ', 'Ngày/Mặt trời', 4, '日', n5_id, t_id, l_id) ON CONFLICT ("Character") DO NOTHING;

    -- BÀI 2: ĐỒ VẬT SỞ HỮU
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 2';
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), '本', 'ホン', 'もと', 'Sách/Gốc', 5, '木', n5_id, t_id, l_id),
    (gen_random_uuid(), '車', 'シャ', 'くるま', 'Xe ô tô', 7, '車', n5_id, t_id, l_id),
    (gen_random_uuid(), '何', 'カ', 'なに, なん', 'Cái gì', 7, '人', n5_id, t_id, l_id),
    (gen_random_uuid(), '名', 'メイ, ミョウ', 'な', 'Tên', 6, '口', n5_id, t_id, l_id),
    (gen_random_uuid(), '語', 'ゴ', 'かた.る', 'Ngôn ngữ', 14, '言', n5_id, t_id, l_id) ON CONFLICT ("Character") DO NOTHING;

    -- BÀI 3: ĐỊA ĐIỂM
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 3';
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), '円', 'エン', 'まる.い', 'Tiền Yên/Tròn', 4, '囗', n5_id, t_id, l_id),
    (gen_random_uuid(), '万', 'マン, バン', 'よろず', 'Vạn (10.000)', 3, '一', n5_id, t_id, l_id),
    (gen_random_uuid(), '百', 'ヒャク', 'もも', 'Trăm', 6, '白', n5_id, t_id, l_id),
    (gen_random_uuid(), '千', 'セン', 'ち', 'Nghìn', 3, '十', n5_id, t_id, l_id),
    (gen_random_uuid(), '社', 'シャ', 'やしろ', 'Công ty/Đền', 8, '示', n5_id, t_id, l_id) ON CONFLICT ("Character") DO NOTHING;

    -- BÀI 4: THỜI GIAN & NGÀY THÁNG
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 4';
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), '時', 'ジ', 'とき', 'Giờ', 10, '日', n5_id, t_id, l_id),
    (gen_random_uuid(), '分', 'ブン, フン', 'わ.ける', 'Phút/Hiểu', 4, '刀', n5_id, t_id, l_id),
    (gen_random_uuid(), '半', 'ハン', 'なか.ば', 'Một nửa', 5, '十', n5_id, t_id, l_id),
    (gen_random_uuid(), '午', 'ゴ', 'うま', 'Ngọ (Trưa)', 4, '十', n5_id, t_id, l_id),
    (gen_random_uuid(), '月', 'ゲツ, ガツ', 'つき', 'Tháng/Trăng', 4, '月', n5_id, t_id, l_id) ON CONFLICT ("Character") DO NOTHING;

    -- BÀI 5: DI CHUYỂN
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 5';
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), '行', 'コウ', 'い.く', 'Đi', 6, '行', n5_id, t_id, l_id),
	(gen_random_uuid(), '来', 'ライ', 'く.る', 'Đến', 7, '木', n5_id, t_id, l_id),
	(gen_random_uuid(), '帰', 'キ', 'かえ.る', 'Về', 10, '止', n5_id, t_id, l_id),
	(gen_random_uuid(), '年', 'ネン', 'とし', 'Năm', 6, '干', n5_id, t_id, l_id),
	(gen_random_uuid(), '週', 'シュウ', '---', 'Tuần', 11, '⻌', n5_id, t_id, l_id) ON CONFLICT ("Character") DO NOTHING;

    -- BÀI 6: ĂN UỐNG & HÀNH ĐỘNG
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 6';
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), '食', 'ショク', 'た.べる', 'Ăn', 9, '食', n5_id, t_id, l_id),
    (gen_random_uuid(), '飲', 'イン', 'の.む', 'Uống', 12, '食', n5_id, t_id, l_id),
    (gen_random_uuid(), '見', 'ケン', 'み.る', 'Nhìn/Xem', 7, '見', n5_id, t_id, l_id),
    (gen_random_uuid(), '聞', 'ブン', 'き.く', 'Nghe', 14, '耳', n5_id, t_id, l_id),
    (gen_random_uuid(), '買', 'バイ', 'か.う', 'Mua', 12, '貝', n5_id, t_id, l_id) ON CONFLICT ("Character") DO NOTHING;

    -- BÀI 7: CÔNG CỤ & TẶNG QUÀ
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 7';
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), '手', 'シュ', 'て', 'Tay', 4, '手', n5_id, t_id, l_id),
    (gen_random_uuid(), '紙', 'シ', 'かみ', 'Giấy', 10, '糸', n5_id, t_id, l_id),
    (gen_random_uuid(), '父', 'フ', 'ちち', 'Bố', 4, '父', n5_id, t_id, l_id),
    (gen_random_uuid(), '母', 'ボ', 'はは', 'Mẹ', 5, '毋', n5_id, t_id, l_id),
    (gen_random_uuid(), '子', 'シ', 'こ', 'Con', 3, '子', n5_id, t_id, l_id) ON CONFLICT ("Character") DO NOTHING;

    -- BÀI 8: TÍNH TỪ CƠ BẢN
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 8';
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), '大', 'ダイ', 'おお.きい', 'Lớn', 3, '大', n5_id, t_id, l_id),
    (gen_random_uuid(), '小', 'ショウ', 'ちい.さい', 'Nhỏ', 3, '小', n5_id, t_id, l_id),
    (gen_random_uuid(), '高', 'コウ', 'たか.い', 'Cao/Đắt', 10, '高', n5_id, t_id, l_id),
    (gen_random_uuid(), '安', 'アン', 'やす.い', 'Rẻ/An tâm', 6, '宀', n5_id, t_id, l_id),
    (gen_random_uuid(), '新', 'シン', 'あたら.しい', 'Mới', 13, '斤', n5_id, t_id, l_id) ON CONFLICT ("Character") DO NOTHING;

    -- BÀI 9: TRẠNG THÁI & SỞ THÍCH
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 9';
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), '友', 'ユウ', 'とも', 'Bạn bè', 4, '又', n5_id, t_id, l_id),
    (gen_random_uuid(), '書', 'ショ', 'か.く', 'Viết', 10, '曰', n5_id, t_id, l_id),
    (gen_random_uuid(), '少', 'ショウ', 'すく.ない', 'Ít', 4, '小', n5_id, t_id, l_id),
    (gen_random_uuid(), '多', 'タ', 'おお.い', 'Nhiều', 6, '夕', n5_id, t_id, l_id),
    (gen_random_uuid(), '長', 'チョウ', 'なが.い', 'Dài', 8, '長', n5_id, t_id, l_id) ON CONFLICT ("Character") DO NOTHING;

    -- BÀI 10: VỊ TRÍ & TỒN TẠI
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 10';
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), '上', 'ジョウ', 'うえ', 'Trên', 3, '一', n5_id, t_id, l_id),
    (gen_random_uuid(), '下', 'カ', 'した', 'Dưới', 3, '一', n5_id, t_id, l_id),
    (gen_random_uuid(), '中', 'チュウ', 'なか', 'Trong/Giữa', 4, '丨', n5_id, t_id, l_id),
    (gen_random_uuid(), '右', 'ウ', 'みぎ', 'Bên phải', 5, '口', n5_id, t_id, l_id),
    (gen_random_uuid(), '左', 'サ', 'ひだり', 'Bên trái', 5, '工', n5_id, t_id, l_id) ON CONFLICT ("Character") DO NOTHING;

	-- BÀI 11: SỐ LƯỢNG & ĐƠN VỊ ĐẾM
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 11';
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), '枚', 'マイ', '---', 'Tờ, lá (vật mỏng)', 8, '木', n5_id, t_id, l_id),
    (gen_random_uuid(), '台', 'ダイ, タイ', '---', 'Cái (máy móc, xe)', 5, '口', n5_id, t_id, l_id),
    (gen_random_uuid(), '回', 'カイ', 'まわ.る', 'Lần / Vòng quanh', 6, '囗', n5_id, t_id, l_id) ON CONFLICT ("Character") DO NOTHING;

    -- BÀI 12: SO SÁNH & THỜI TIẾT
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 12';
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), '雨', 'ウ', 'あめ', 'Mưa', 8, '雨', n5_id, t_id, l_id),
    (gen_random_uuid(), '天', 'テン', 'あめ', 'Trời', 4, '大', n5_id, t_id, l_id),
    (gen_random_uuid(), '気', 'キ', '---', 'Khí / Tâm trạng', 6, '气', n5_id, t_id, l_id),
    (gen_random_uuid(), '風', 'フウ', 'かぜ', 'Gió', 9, '風', n5_id, t_id, l_id) ON CONFLICT ("Character") DO NOTHING;

    -- BÀI 13: MONG MUỐN & CƠ THỂ
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 13';
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), '口', 'コウ', 'くち', 'Miệng', 3, '口', n5_id, t_id, l_id),
    (gen_random_uuid(), '目', 'モク', 'め', 'Mắt', 5, '目', n5_id, t_id, l_id),
    (gen_random_uuid(), '耳', 'ジ', 'みみ', 'Tai', 6, '耳', n5_id, t_id, l_id),
    (gen_random_uuid(), '足', 'ソク', 'あし', 'Chân', 7, '足', n5_id, t_id, l_id) ON CONFLICT ("Character") DO NOTHING;

    -- BÀI 14: THỂ TE & ĐỊA ĐIỂM CÔNG CỘNG
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 14';
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), '駅', 'エキ', '---', 'Nhà ga', 14, '馬', n5_id, t_id, l_id),
    (gen_random_uuid(), '電', 'デン', '---', 'Điện', 13, '雨', n5_id, t_id, l_id),
    (gen_random_uuid(), '話', 'ワ', 'はな.す', 'Nói chuyện', 13, '言', n5_id, t_id, l_id),
    (gen_random_uuid(), '出', 'シュツ', 'で.る, だ.す', 'Ra / Đưa ra', 5, '凵', n5_id, t_id, l_id) ON CONFLICT ("Character") DO NOTHING;

    -- BÀI 15: SỞ HỮU & CÔNG VIỆC
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 15';
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), '住', 'ジュウ', 'す.む', 'Cư trú / Sống', 7, '人', n5_id, t_id, l_id),
    (gen_random_uuid(), '所', 'ショ', 'ところ', 'Nơi chốn', 8, '戸', n5_id, t_id, l_id),
    (gen_random_uuid(), '知', 'チ', 'し.る', 'Biết', 8, '矢', n5_id, t_id, l_id),
    (gen_random_uuid(), '工', 'コウ', '---', 'Công việc / Kỹ thuật', 3, '工', n5_id, t_id, l_id) ON CONFLICT ("Character") DO NOTHING;

    -- BÀI 16: LIÊN KẾT HÀNH ĐỘNG
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 16';
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), '入', 'ニュウ', 'はい.る, い.れる', 'Vào / Cho vào', 2, '入', n5_id, t_id, l_id),
    (gen_random_uuid(), '体', 'タイ', 'からだ', 'Cơ thể', 7, '人', n5_id, t_id, l_id),
    (gen_random_uuid(), '明', 'メイ', 'あか.るい', 'Sáng', 8, '日', n5_id, t_id, l_id),
    (gen_random_uuid(), '暗', 'アン', 'くら.い', 'Tối', 13, '日', n5_id, t_id, l_id) ON CONFLICT ("Character") DO NOTHING;

    -- BÀI 17: PHỦ ĐỊNH & SỨC KHỎE
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 17';
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), '病', 'ビョウ', 'やまい', 'Bệnh', 10, '疒', n5_id, t_id, l_id),
    (gen_random_uuid(), '院', 'イン', '---', 'Viện (Bệnh viện)', 10, '阜', n5_id, t_id, l_id),
    (gen_random_uuid(), '医', 'イ', '---', 'Y (Bác sĩ)', 7, '匚', n5_id, t_id, l_id),
    (gen_random_uuid(), '者', 'シャ', 'もの', 'Người (giả)', 8, '老', n5_id, t_id, l_id) ON CONFLICT ("Character") DO NOTHING;

    -- BÀI 18: KHẢ NĂNG & THIÊN NHIÊN
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 18';
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), '山', 'サン', 'やま', 'Núi', 3, '山', n5_id, t_id, l_id),
    (gen_random_uuid(), '川', 'セン', 'かわ', 'Sông', 3, '巛', n5_id, t_id, l_id),
    (gen_random_uuid(), '田', 'デン', 'た', 'Ruộng', 5, '田', n5_id, t_id, l_id),
    (gen_random_uuid(), '海', 'カイ', 'うみ', 'Biển', 9, '水', n5_id, t_id, l_id) ON CONFLICT ("Character") DO NOTHING;

    -- BÀI 19: KINH NGHIỆM & TRẠNG THÁI
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 19';
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), '火', 'カ', 'ひ', 'Lửa', 4, '火', n5_id, t_id, l_id),
    (gen_random_uuid(), '水', 'スイ', 'みず', 'Nước', 4, '水', n5_id, t_id, l_id),
    (gen_random_uuid(), '木', 'モク', 'き', 'Cây', 4, '木', n5_id, t_id, l_id),
    (gen_random_uuid(), '金', 'キン', 'かね', 'Vàng / Tiền', 8, '金', n5_id, t_id, l_id),
    (gen_random_uuid(), '土', 'ド', 'つち', 'Đất', 3, '土', n5_id, t_id, l_id) ON CONFLICT ("Character") DO NOTHING;

    -- BÀI 20: GIAO TIẾP THÂN MẬT
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 20';
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), '道', 'ドウ', 'みち', 'Đường / Đạo', 12, '辵', n5_id, t_id, l_id),
    (gen_random_uuid(), '店', 'テン', 'みせ', 'Cửa hàng', 8, '广', n5_id, t_id, l_id),
    (gen_random_uuid(), '少', 'ショウ', 'すく.ない, すこ.し', 'Ít', 4, '小', n5_id, t_id, l_id),
    (gen_random_uuid(), '多', 'タ', 'おお.い', 'Nhiều', 6, '夕', n5_id, t_id, l_id) ON CONFLICT ("Character") DO NOTHING;

	-- BÀI 21: TƯỜNG THUẬT & DỰ ĐOÁN
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 21';
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), '思', 'シ', 'おも.う', 'Nghĩ', 9, '心', n5_id, t_id, l_id),
    (gen_random_uuid(), '言', 'ゲン, ゴン', 'い.う, こと', 'Nói', 7, '言', n5_id, t_id, l_id),
    (gen_random_uuid(), '物', 'ブツ, モツ', 'もの', 'Vật / Đồ vật', 8, '牛', n5_id, t_id, l_id),
    (gen_random_uuid(), '正', 'セイ, ショウ', 'ただ.しい', 'Chính xác / Đúng', 5, '止', n5_id, t_id, l_id) ON CONFLICT ("Character") DO NOTHING;

    -- BÀI 22: MỆNH ĐỀ ĐỊNH NGỮ (TRANG PHỤC)
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 22';
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), '着', 'チャク', 'き.る, つ.く', 'Mặc / Đến nơi', 12, '羊', n5_id, t_id, l_id),
    (gen_random_uuid(), '下', 'カ, ゲ', 'した, くだ.る', 'Dưới (Đồ lót/Bên dưới)', 3, '一', n5_id, t_id, l_id),
    (gen_random_uuid(), '足', 'ソク', 'あし', 'Chân (Tất/Giày)', 7, '足', n5_id, t_id, l_id) ON CONFLICT ("Character") DO NOTHING;

    -- BÀI 23: KHI... THÌ (PHƯƠNG HƯỚNG & GIAO THÔNG)
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 23';
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), '東', 'トウ', 'ひがし', 'Phía Đông', 8, '木', n5_id, t_id, l_id),
    (gen_random_uuid(), '西', 'セイ, サイ', 'にし', 'Phía Tây', 6, '襾', n5_id, t_id, l_id),
    (gen_random_uuid(), '南', 'ナン', 'みなみ', 'Phía Nam', 9, '十', n5_id, t_id, l_id),
    (gen_random_uuid(), '北', 'ホク', 'きた', 'Phía Bắc', 5, '匕', n5_id, t_id, l_id),
    (gen_random_uuid(), '右', 'ウ, ユウ', 'みぎ', 'Phải', 5, '口', n5_id, t_id, l_id),
    (gen_random_uuid(), '左', 'サ', 'ひだり', 'Trái', 5, '工', n5_id, t_id, l_id) ON CONFLICT ("Character") DO NOTHING;

    -- BÀI 24: CHO NHẬN TRỢ GIÚP (GIA ĐÌNH)
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 24';
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), '兄', 'キョウ', 'あに', 'Anh trai', 5, '儿', n5_id, t_id, l_id),
    (gen_random_uuid(), '姉', 'シ', 'あね', 'Chị gái', 8, '女', n5_id, t_id, l_id),
    (gen_random_uuid(), '弟', 'ダイ', 'おとうと', 'Em trai', 7, '弓', n5_id, t_id, l_id),
    (gen_random_uuid(), '妹', 'マイ', 'いもうと', 'Em gái', 8, '女', n5_id, t_id, l_id),
    (gen_random_uuid(), '家', 'カ', 'いえ, うち', 'Nhà / Gia đình', 10, '宀', n5_id, t_id, l_id) ON CONFLICT ("Character") DO NOTHING;

    -- BÀI 25: ĐIỀU KIỆN & KẾT THÚC
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 25';
    INSERT INTO "Kanjis" ("KanjiID", "Character", "Onyomi", "Kunyomi", "Meaning", "StrokeCount", "Radical", "LevelID", "TopicID", "LessonID") VALUES
    (gen_random_uuid(), '運', 'ウン', 'はこ.ぶ', 'Vận chuyển / Số mệnh', 12, '辵', n5_id, t_id, l_id),
    (gen_random_uuid(), '動', 'ドウ', 'うご.く', 'Chuyển động', 11, '力', n5_id, t_id, l_id),
    (gen_random_uuid(), '止', 'シ', 'と.まる, と.める', 'Dừng lại', 4, '止', n5_id, t_id, l_id),
    (gen_random_uuid(), '歩', 'ホ', 'ある.く', 'Đi bộ', 8, '止', n5_id, t_id, l_id) ON CONFLICT ("Character") DO NOTHING;

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
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 1';
    INSERT INTO "Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "LevelID", "TopicID", "LessonID", "Example", "ExampleMeaning", "AudioURL") VALUES
    (gen_random_uuid(), '私', 'わたし', 'Tôi', n5_id, t_id, l_id, '私はマインです。', 'Tôi là Nam.', ''),
    (gen_random_uuid(), '学生', 'がくせい', 'Sinh viên', n5_id, t_id, l_id, '彼は学生です。', 'Anh ấy là sinh viên.', ''),
    (gen_random_uuid(), '先生', 'せんせい', 'Thầy giáo/Cô giáo', n5_id, t_id, l_id, 'ワット先生はイギリス人です。', 'Thầy Watt là người Anh.', ''),
    (gen_random_uuid(), '会社員', 'かいしゃいん', 'Nhân viên công ty', n5_id, t_id, l_id, '私は会社員です。', 'Tôi là nhân viên công ty.', ''),
    (gen_random_uuid(), '銀行員', 'ぎんこういん', 'Nhân viên ngân hàng', n5_id, t_id, l_id, '田中さんは銀行員です。', 'Anh Tanaka là nhân viên ngân hàng.', '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 2: ĐỒ VẬT XUNG QUANH
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 2';
    INSERT INTO "Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "LevelID", "TopicID", "LessonID", "Example", "ExampleMeaning", "AudioURL") VALUES
    (gen_random_uuid(), '本', 'ほん', 'Sách', n5_id, t_id, l_id, 'これは日本語の本です。', 'Đây là sách tiếng Nhật.', ''),
    (gen_random_uuid(), '辞書', 'じしょ', 'Từ điển', n5_id, t_id, l_id, 'それは私の辞書です。', 'Đó là từ điển của tôi.', ''),
    (gen_random_uuid(), '雑誌', 'ざっし', 'Tạp chí', n5_id, t_id, l_id, '雑誌を読みます。', 'Đọc tạp chí.', ''),
    (gen_random_uuid(), '新聞', 'しんぶん', 'Tờ báo', n5_id, t_id, l_id, '毎朝新聞を読みます。', 'Mỗi sáng tôi đều đọc báo.', ''),
    (gen_random_uuid(), '時計', 'とけい', 'Đồng hồ', n5_id, t_id, l_id, 'この時計は高いです。', 'Cái đồng hồ này đắt.', '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 3: ĐỊA ĐIỂM & GIÁ CẢ
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 3';
    INSERT INTO "Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "LevelID", "TopicID", "LessonID", "Example", "ExampleMeaning", "AudioURL") VALUES
    (gen_random_uuid(), '教室', 'きょうしつ', 'Lớp học', n5_id, t_id, l_id, '教室はあちらです。', 'Lớp học ở phía kia.', ''),
    (gen_random_uuid(), '食堂', 'しょくどう', 'Nhà ăn', n5_id, t_id, l_id, '食堂で昼ご飯を食べます。', 'Ăn trưa tại nhà ăn.', ''),
    (gen_random_uuid(), '受付', 'うけつけ', 'Quầy lễ tân', n5_id, t_id, l_id, '受付で聞きます。', 'Hỏi tại quầy lễ tân.', ''),
    (gen_random_uuid(), '事務所', 'じむしょ', 'Văn phòng', n5_id, t_id, l_id, '事務所は２階です。', 'Văn phòng ở tầng 2.', ''),
    (gen_random_uuid(), '会議室', 'かいぎしつ', 'Phòng họp', n5_id, t_id, l_id, '会議室はどこですか。', 'Phòng họp ở đâu?', '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 4: THỜI GIAN & LÀM VIỆC
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 4';
    INSERT INTO "Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "LevelID", "TopicID", "LessonID", "Example", "ExampleMeaning", "AudioURL") VALUES
    (gen_random_uuid(), '起きる', 'おきる', 'Thức dậy', n5_id, t_id, l_id, '毎朝６時に起きます。', 'Mỗi sáng thức dậy lúc 6 giờ.', ''),
    (gen_random_uuid(), '寝る', 'ねる', 'Đi ngủ', n5_id, t_id, l_id, '夜１１時に寝ます。', 'Ngủ lúc 11 giờ đêm.', ''),
    (gen_random_uuid(), '働く', 'はたらく', 'Làm việc', n5_id, t_id, l_id, '月曜日から金曜日まで働きます。', 'Làm việc từ thứ Hai đến thứ Sáu.', ''),
    (gen_random_uuid(), '勉強', 'べんきょう', 'Học tập', n5_id, t_id, l_id, '毎日日本語を勉強します。', 'Học tiếng Nhật mỗi ngày.', ''),
    (gen_random_uuid(), '休み', 'やすみ', 'Nghỉ ngơi/Ngày nghỉ', n5_id, t_id, l_id, '今日は休みです。', 'Hôm nay là ngày nghỉ.', '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 5: DI CHUYỂN & GIAO THÔNG
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 5';
    INSERT INTO "Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "LevelID", "TopicID", "LessonID", "Example", "ExampleMeaning", "AudioURL") VALUES
    (gen_random_uuid(), '行く', 'いく', 'Đi', n5_id, t_id, l_id, '学校へ行きます。', 'Đi đến trường.', ''),
    (gen_random_uuid(), '来る', 'くる', 'Đến', n5_id, t_id, l_id, '日本へ来ました。', 'Tôi đã đến Nhật Bản.', ''),
    (gen_random_uuid(), '帰る', 'かえる', 'Về', n5_id, t_id, l_id, 'うちに帰ります。', 'Tôi đi về nhà.', ''),
    (gen_random_uuid(), '電車', 'でんしゃ', 'Tàu điện', n5_id, t_id, l_id, '電車で行きます。', 'Đi bằng tàu điện.', ''),
    (gen_random_uuid(), '飛行機', 'ひこうき', 'Máy bay', n5_id, t_id, l_id, '飛行機で国へ帰ります。', 'Về nước bằng máy bay.', '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- BÀI 6: ĂN UỐNG & HOẠT ĐỘNG
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 6';
    INSERT INTO "Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "LevelID", "TopicID", "LessonID", "Example", "ExampleMeaning", "AudioURL") VALUES
    (gen_random_uuid(), '食べる', 'たべる', 'Ăn', n5_id, t_id, l_id, 'パンを食べます。', 'Tôi ăn bánh mì.', ''),
    (gen_random_uuid(), '飲む', 'のむ', 'Uống', n5_id, t_id, l_id, 'お酒を飲みます。', 'Tôi uống rượu.', ''),
    (gen_random_uuid(), '吸う', 'すう', 'Hút (thuốc)', n5_id, t_id, l_id, 'たばこを吸います。', 'Hút thuốc lá.', ''),
    (gen_random_uuid(), '見る', 'みる', 'Xem / Nhìn', n5_id, t_id, l_id, 'テレビを見ます。', 'Xem tivi.', ''),
    (gen_random_uuid(), '聞く', 'きく', 'Nghe', n5_id, t_id, l_id, '音楽を聞きます。', 'Nghe nhạc.', '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 7: GIAO TIẾP & TẶNG QUÀ
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 7';
    INSERT INTO "Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "LevelID", "TopicID", "LessonID", "Example", "ExampleMeaning", "AudioURL") VALUES
    (gen_random_uuid(), '切る', 'きる', 'Cắt', n5_id, t_id, l_id, 'はさみで紙を切ります。', 'Cắt giấy bằng kéo.', ''),
    (gen_random_uuid(), '送る', 'おくる', 'Gửi', n5_id, t_id, l_id, '荷物を送ります。', 'Gửi hành lý.', ''),
    (gen_random_uuid(), 'あげる', 'あげる', 'Cho / Tặng', n5_id, t_id, l_id, '花をあげます。', 'Tặng hoa.', ''),
    (gen_random_uuid(), 'もらう', 'もらう', 'Nhận', n5_id, t_id, l_id, '本をもらいました。', 'Tôi đã nhận được cuốn sách.', ''),
    (gen_random_uuid(), '貸す', 'かす', 'Cho vay / Cho mượn', n5_id, t_id, l_id, 'お金を貸します。', 'Cho mượn tiền.', '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 8: TÍNH CHẤT & TRẠNG THÁI (TÍNH TỪ)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 8';
    INSERT INTO "Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "LevelID", "TopicID", "LessonID", "Example", "ExampleMeaning", "AudioURL") VALUES
    (gen_random_uuid(), 'ハンサム', 'はんさむ', 'Đẹp trai', n5_id, t_id, l_id, '彼はハンサムですね。', 'Anh ấy đẹp trai nhỉ.', ''),
    (gen_random_uuid(), '静か', 'しずか', 'Yên tĩnh', n5_id, t_id, l_id, 'この町は静かです。', 'Thị trấn này yên tĩnh.', ''),
    (gen_random_uuid(), '大きい', 'おおきい', 'Lớn / To', n5_id, t_id, l_id, '大きい家ですね。', 'Ngôi nhà lớn nhỉ.', ''),
    (gen_random_uuid(), '新しい', 'あたらしい', 'Mới', n5_id, t_id, l_id, '新しい靴を買いました。', 'Tôi đã mua đôi giày mới.', ''),
    (gen_random_uuid(), '高い', 'たかい', 'Đắt / Cao', n5_id, t_id, l_id, '日本の果物は高いです。', 'Trái cây Nhật Bản đắt.', '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 9: SỞ THÍCH & NĂNG LỰC
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 9';
    INSERT INTO "Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "LevelID", "TopicID", "LessonID", "Example", "ExampleMeaning", "AudioURL") VALUES
    (gen_random_uuid(), '好き', 'すき', 'Thích', n5_id, t_id, l_id, 'りんごが好きです。', 'Tôi thích táo.', ''),
    (gen_random_uuid(), '上手', 'じょうず', 'Giỏi', n5_id, t_id, l_id, '歌が上手です。', 'Hát giỏi.', ''),
    (gen_random_uuid(), 'わかる', 'わかる', 'Hiểu / Biết', n5_id, t_id, l_id, '日本語がわかります。', 'Tôi hiểu tiếng Nhật.', ''),
    (gen_random_uuid(), 'ある', 'ある', 'Có (vật)', n5_id, t_id, l_id, 'お金があります。', 'Tôi có tiền.', ''),
    (gen_random_uuid(), '料理', 'りょうり', 'Món ăn / Nấu ăn', n5_id, t_id, l_id, '料理が上手ですね。', 'Bạn nấu ăn giỏi nhỉ.', '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 10: SỰ TỒN TẠI & VỊ TRÍ
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 10';
    INSERT INTO "Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "LevelID", "TopicID", "LessonID", "Example", "ExampleMeaning", "AudioURL") VALUES
    (gen_random_uuid(), 'いる', 'いる', 'Có (người/động vật)', n5_id, t_id, l_id, '子供がいます。', 'Tôi có con.', ''),
    (gen_random_uuid(), '箱', 'はこ', 'Cái hộp', n5_id, t_id, l_id, '箱の中に何がありますか。', 'Trong hộp có cái gì thế?', ''),
    (gen_random_uuid(), '上', 'うえ', 'Trên', n5_id, t_id, l_id, '机の上に本があります。', 'Trên bàn có cuốn sách.', ''),
    (gen_random_uuid(), '下', 'した', 'Dưới', n5_id, t_id, l_id, 'いすの下に猫がいます。', 'Dưới ghế có con mèo.', ''),
    (gen_random_uuid(), '近く', 'ちかく', 'Gần', n5_id, t_id, l_id, '駅の近くにスーパーがあります。', 'Gần nhà ga có siêu thị.', '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

-------------------------------------------------------
    -- BÀI 11: SỐ LƯỢNG & THỜI GIAN
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 11';
    INSERT INTO "Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "LevelID", "TopicID", "LessonID", "Example", "ExampleMeaning", "AudioURL") VALUES
    (gen_random_uuid(), 'いくつ', 'いくつ', 'Bao nhiêu cái', n5_id, t_id, l_id, 'りんごをいくつ買いましたか。', 'Bạn đã mua bao nhiêu quả táo?', ''),
    (gen_random_uuid(), '一人', 'ひとり', '1 người', n5_id, t_id, l_id, '家族は一人です。', 'Gia đình có một người.', ''),
    (gen_random_uuid(), '期間', 'きかん', 'Thời gian / Kỳ hạn', n5_id, t_id, l_id, 'どのくらい日本にいますか。', 'Bạn ở Nhật bao lâu rồi?', ''),
    (gen_random_uuid(), 'ぐらい', 'ぐらい', 'Khoảng', n5_id, t_id, l_id, '３週間ぐらい休みます。', 'Nghỉ khoảng 3 tuần.', ''),
    (gen_random_uuid(), '全部', 'ぜんぶ', 'Tất cả', n5_id, t_id, l_id, '全部でいくらですか。', 'Tất cả hết bao nhiêu tiền?', '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 12: SO SÁNH & THÌ QUÁ KHỨ (TÍNH TỪ)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 12';
    INSERT INTO "Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "LevelID", "TopicID", "LessonID", "Example", "ExampleMeaning", "AudioURL") VALUES
    (gen_random_uuid(), '簡単', 'かんたん', 'Đơn giản / Dễ', n5_id, t_id, l_id, '試験は簡単でした。', 'Kỳ thi đã rất đơn giản.', ''),
    (gen_random_uuid(), '暑い', 'あつい', 'Nóng (thời tiết)', n5_id, t_id, l_id, '昨日は暑かったです。', 'Hôm qua đã rất nóng.', ''),
    (gen_random_uuid(), '速い', 'はやい', 'Nhanh', n5_id, t_id, l_id, '新幹線は速いです。', 'Tàu Shinkansen rất nhanh.', ''),
    (gen_random_uuid(), 'より', 'より', 'Hơn (so sánh)', n5_id, t_id, l_id, 'この鞄はあの鞄より安いです。', 'Cái cặp này rẻ hơn cái cặp kia.', ''),
    (gen_random_uuid(), '一番', 'いちばん', 'Nhất', n5_id, t_id, l_id, '１年でいつが一番寒いですか。', 'Trong 1 năm khi nào lạnh nhất?', '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 13: MONG MUỐN & DỰ ĐỊNH
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 13';
    INSERT INTO "Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "LevelID", "TopicID", "LessonID", "Example", "ExampleMeaning", "AudioURL") VALUES
    (gen_random_uuid(), '欲しい', 'ほしい', 'Muốn (có gì đó)', n5_id, t_id, l_id, '新しい靴が欲しいです。', 'Tôi muốn có đôi giày mới.', ''),
    (gen_random_uuid(), '遊びます', 'あそびます', 'Chơi', n5_id, t_id, l_id, '週末は友達と遊びます。', 'Cuối tuần tôi đi chơi với bạn.', ''),
    (gen_random_uuid(), '泳ぎます', 'およぎます', 'Bơi', n5_id, t_id, l_id, 'プールで泳ぎます。', 'Bơi ở hồ bơi.', ''),
    (gen_random_uuid(), '迎えます', 'むかえます', 'Đón', n5_id, t_id, l_id, '駅へ友達を迎えに行きます。', 'Tôi đi đến ga để đón bạn.', ''),
    (gen_random_uuid(), '食事', 'しょくじ', 'Bữa ăn', n5_id, t_id, l_id, '一緒に食事をしませんか。', 'Cùng ăn cơm với tôi không?', '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 14: THỂ TE (YÊU CẦU / ĐANG LÀM)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 14';
    INSERT INTO "Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "LevelID", "TopicID", "LessonID", "Example", "ExampleMeaning", "AudioURL") VALUES
    (gen_random_uuid(), 'つけます', 'つけます', 'Bật (điện/máy lạnh)', n5_id, t_id, l_id, '電気をつけます。', 'Bật điện.', ''),
    (gen_random_uuid(), '開けます', 'あけます', 'Mở (cửa)', n5_id, t_id, l_id, 'ドアを開けてください。', 'Hãy mở cửa ra.', ''),
    (gen_random_uuid(), '急ぎます', 'いそぎます', 'Vội vàng / Gấp', n5_id, t_id, l_id, '急いでください。', 'Hãy khẩn trương lên.', ''),
    (gen_random_uuid(), '待つ', 'まつ', 'Chờ / Đợi', n5_id, t_id, l_id, 'ちょっと待ってください。', 'Vui lòng đợi một chút.', ''),
    (gen_random_uuid(), '降る', 'ふる', 'Rơi (mưa/tuyết)', n5_id, t_id, l_id, '雨が降っています。', 'Trời đang mưa.', '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 15: PHÉP TẮC & TRẠNG THÁI KẾT QUẢ
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 15';
    INSERT INTO "Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "LevelID", "TopicID", "LessonID", "Example", "ExampleMeaning", "AudioURL") VALUES
    (gen_random_uuid(), '置く', 'おく', 'Đặt / Để', n5_id, t_id, l_id, 'ここに荷物を置かないでください。', 'Đừng để hành lý ở đây.', ''),
    (gen_random_uuid(), '売る', 'うる', 'Bán', n5_id, t_id, l_id, '古い車を売りました。', 'Tôi đã bán chiếc xe cũ.', ''),
    (gen_random_uuid(), '住む', 'すむ', 'Sống / Cư trú', n5_id, t_id, l_id, 'ハノイに住んでいます。', 'Tôi đang sống ở Hà Nội.', ''),
    (gen_random_uuid(), '知る', 'しる', 'Biết', n5_id, t_id, l_id, 'そのニュースを知っていますか。', 'Bạn có biết tin đó không?', ''),
    (gen_random_uuid(), '思い出す', 'おもいだす', 'Nhớ lại / Hồi tưởng', n5_id, t_id, l_id, '家族を思い出します。', 'Tôi nhớ về gia đình.', '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- BÀI 16: LIÊU KẾ HÀNH ĐỘNG & BỘ PHẬN CƠ THỂ
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 16';
    INSERT INTO "Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "LevelID", "TopicID", "LessonID", "Example", "ExampleMeaning", "AudioURL") VALUES
    (gen_random_uuid(), '降りる', 'おりる', 'Xuống (tàu, xe)', n5_id, t_id, l_id, '電車を降ります。', 'Xuống tàu điện.', ''),
    (gen_random_uuid(), '浴びる', 'あびる', 'Tắm (vòi sen)', n5_id, t_id, l_id, 'シャワーを浴びます。', 'Tắm vòi hoa sen.', ''),
    (gen_random_uuid(), '若い', 'わかい', 'Trẻ trung', n5_id, t_id, l_id, 'あの人は若いです。', 'Người kia trẻ thật.', ''),
    (gen_random_uuid(), '長い', 'ながい', 'Dài', n5_id, t_id, l_id, '髪が長いです。', 'Tóc dài.', ''),
    (gen_random_uuid(), '明るい', 'あかるい', 'Sáng sủa', n5_id, t_id, l_id, 'この部屋は明るいです。', 'Căn phòng này sáng sủa.', '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 17: SỨC KHỎE & PHỦ ĐỊNH
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 17';
    INSERT INTO "Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "LevelID", "TopicID", "LessonID", "Example", "ExampleMeaning", "AudioURL") VALUES
    (gen_random_uuid(), '忘れる', 'わすれる', 'Quên', n5_id, t_id, l_id, '宿題を忘れました。', 'Tôi đã quên bài tập về nhà.', ''),
    (gen_random_uuid(), '払う', 'はらう', 'Trả tiền', n5_id, t_id, l_id, 'お金を払います。', 'Trả tiền.', ''),
    (gen_random_uuid(), '脱ぐ', 'ぬぐ', 'Cởi (đồ, giày)', n5_id, t_id, l_id, 'ここで靴を脱いでください。', 'Hãy cởi giày ở đây.', ''),
    (gen_random_uuid(), '心配', 'しんぱい', 'Lo lắng', n5_id, t_id, l_id, '心配しないでください。', 'Xin đừng lo lắng.', ''),
    (gen_random_uuid(), '大切', 'たいせつ', 'Quan trọng / Quý giá', n5_id, t_id, l_id, '大切にしてください。', 'Hãy giữ gìn cẩn thận.', '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 18: KHẢ NĂNG & SỞ THÍCH
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 18';
    INSERT INTO "Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "LevelID", "TopicID", "LessonID", "Example", "ExampleMeaning", "AudioURL") VALUES
    (gen_random_uuid(), 'できる', 'できる', 'Có thể', n5_id, t_id, l_id, 'スキーができます。', 'Tôi có thể trượt tuyết.', ''),
    (gen_random_uuid(), '洗う', 'あらう', 'Rửa', n5_id, t_id, l_id, '手を洗います。', 'Rửa tay.', ''),
    (gen_random_uuid(), '弾く', 'ひく', 'Chơi (nhạc cụ dây)', n5_id, t_id, l_id, 'ピアノを弾きます。', 'Chơi đàn piano.', ''),
    (gen_random_uuid(), '歌う', 'うたう', 'Hát', n5_id, t_id, l_id, '歌を歌います。', 'Hát một bài hát.', ''),
    (gen_random_uuid(), '集める', 'あつめる', 'Sưu tầm / Thu thập', n5_id, t_id, l_id, '切手を集めています。', 'Tôi đang sưu tầm tem.', '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 19: KINH NGHIỆM & TRẠNG THÁI
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 19';
    INSERT INTO "Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "LevelID", "TopicID", "LessonID", "Example", "ExampleMeaning", "AudioURL") VALUES
    (gen_random_uuid(), '登る', 'のぼる', 'Leo (núi)', n5_id, t_id, l_id, '山に登ったことがあります。', 'Tôi đã từng leo núi.', ''),
    (gen_random_uuid(), '泊まる', 'とまる', 'Trọ lại', n5_id, t_id, l_id, 'ホテルに泊まります。', 'Trọ lại khách sạn.', ''),
    (gen_random_uuid(), '掃除', 'そうじ', 'Dọn dẹp vệ sinh', n5_id, t_id, l_id, '部屋を掃除します。', 'Dọn dẹp phòng.', ''),
    (gen_random_uuid(), '洗濯', 'せんたく', 'Giặt giũ', n5_id, t_id, l_id, '服を洗濯します。', 'Giặt quần áo.', ''),
    (gen_random_uuid(), '練習', 'れんしゅう', 'Luyện tập', n5_id, t_id, l_id, '毎日ピアノを練習します。', 'Luyện tập piano mỗi ngày.', '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 20: GIAO TIẾP THÂN MẬT
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 20';
    INSERT INTO "Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "LevelID", "TopicID", "LessonID", "Example", "ExampleMeaning", "AudioURL") VALUES
    (gen_random_uuid(), '要る', 'いる', 'Cần', n5_id, t_id, l_id, 'ビザが要ります。', 'Cần visa.', ''),
    (gen_random_uuid(), '調べる', 'しらべる', 'Tìm hiểu / Điều tra', n5_id, t_id, l_id, '辞書で調べます。', 'Tra từ điển.', ''),
    (gen_random_uuid(), '直す', 'なおす', 'Sửa chữa', n5_id, t_id, l_id, '時計を直します。', 'Sửa đồng hồ.', ''),
    (gen_random_uuid(), '僕', 'ぼく', 'Tôi (cách xưng hô của nam)', n5_id, t_id, l_id, '僕も行きます。', 'Mình cũng đi.', ''),
    (gen_random_uuid(), '君', 'くん', 'Cậu / Em (thân mật)', n5_id, t_id, l_id, '君は学生？', 'Cậu là sinh viên à?', '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	-------------------------------------------------------
    -- BÀI 21: TƯỜNG THUẬT & DỰ ĐOÁN
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 21';
    INSERT INTO "Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "LevelID", "TopicID", "LessonID", "Example", "ExampleMeaning", "AudioURL") VALUES
    (gen_random_uuid(), '思う', 'おもう', 'Nghĩ là', n5_id, t_id, l_id, '日本はきれいだと思います。', 'Tôi nghĩ Nhật Bản đẹp.', ''),
    (gen_random_uuid(), '言う', 'いう', 'Nói', n5_id, t_id, l_id, '寝る前に「おやすみ」と言います。', 'Trước khi ngủ thì nói "Chúc ngủ ngon".', ''),
    (gen_random_uuid(), '勝つ', 'かつ', 'Thắng', n5_id, t_id, l_id, '試合に勝ちました。', 'Đã thắng trận đấu.', ''),
    (gen_random_uuid(), '負ける', 'まける', 'Thua', n5_id, t_id, l_id, '試合に負けました。', 'Đã thua trận đấu.', ''),
    (gen_random_uuid(), '役に立つ', 'やくにたつ', 'Có ích', n5_id, t_id, l_id, 'この辞書は役に立ちます。', 'Cuốn từ điển này rất có ích.', '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 22: MỆNH ĐỀ ĐỊNH NGỮ (TRANG PHỤC)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 22';
    INSERT INTO "Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "LevelID", "TopicID", "LessonID", "Example", "ExampleMeaning", "AudioURL") VALUES
    (gen_random_uuid(), '着る', 'きる', 'Mặc (áo sơ mi,...)', n5_id, t_id, l_id, 'シャツを着ます。', 'Mặc áo sơ mi.', ''),
    (gen_random_uuid(), '履く', 'はく', 'Mặc (quần), đi (giày,...)', n5_id, t_id, l_id, '靴を履きます。', 'Đi giày.', ''),
    (gen_random_uuid(), '帽子', 'ぼうし', 'Mũ / Nón', n5_id, t_id, l_id, '帽子をかぶります。', 'Đội mũ.', ''),
    (gen_random_uuid(), '眼鏡', 'めがね', 'Kính mắt', n5_id, t_id, l_id, '眼鏡をかけます。', 'Đeo kính.', ''),
    (gen_random_uuid(), '約束', 'やくそく', 'Hẹn / Lời hứa', n5_id, t_id, l_id, '友達と約束があります。', 'Tôi có hẹn với bạn.', '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 23: KHI... THÌ (THỜI ĐIỂM & CHỈ ĐƯỜNG)
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 23';
    INSERT INTO "Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "LevelID", "TopicID", "LessonID", "Example", "ExampleMeaning", "AudioURL") VALUES
    (gen_random_uuid(), '渡る', 'わたる', 'Băng qua', n5_id, t_id, l_id, '橋を渡ります。', 'Đi qua cầu.', ''),
    (gen_random_uuid(), '曲がる', 'まがる', 'Rẽ / Quẹo', n5_id, t_id, l_id, '右へ曲がります。', 'Rẽ phải.', ''),
    (gen_random_uuid(), '寂しい', 'さびしい', 'Buồn / Cô đơn', n5_id, t_id, l_id, '家族に会えなくて寂しいです。', 'Không được gặp gia đình nên buồn.', ''),
    (gen_random_uuid(), 'お湯', 'おゆ', 'Nước nóng', n5_id, t_id, l_id, 'お湯が出ます。', 'Nước nóng chảy ra.', ''),
    (gen_random_uuid(), '交差点', 'こうさてん', 'Ngã tư', n5_id, t_id, l_id, '交差点を左へ曲がります。', 'Rẽ trái ở ngã tư.', '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 24: CHO NHẬN TRỢ GIÚP
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 24';
    INSERT INTO "Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "LevelID", "TopicID", "LessonID", "Example", "ExampleMeaning", "AudioURL") VALUES
    (gen_random_uuid(), 'くれる', 'くれる', 'Cho (mình)', n5_id, t_id, l_id, '佐藤さんはお菓子をくれました。', 'Chị Sato đã cho tôi bánh kẹo.', ''),
    (gen_random_uuid(), '連れて行く', 'つれていく', 'Dẫn đi', n5_id, t_id, l_id, '子供を公園へ連れて行きます。', 'Dẫn con đi công viên.', ''),
    (gen_random_uuid(), '送る', 'おくる', 'Đưa đi / Tiễn', n5_id, t_id, l_id, '駅まで送ります。', 'Tôi tiễn bạn đến nhà ga.', ''),
    (gen_random_uuid(), '紹介', 'しょうかい', 'Giới thiệu', n5_id, t_id, l_id, '友達を紹介します。', 'Giới thiệu bạn bè.', ''),
    (gen_random_uuid(), '準備', 'じゅんび', 'Chuẩn bị', n5_id, t_id, l_id, '旅行の準備をします。', 'Chuẩn bị cho chuyến du lịch.', '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

    -------------------------------------------------------
    -- BÀI 25: CÂU ĐIỀU KIỆN
    -------------------------------------------------------
    SELECT "LessonID" INTO l_id FROM "Lessons" WHERE "Title" = 'Bài 25';
    INSERT INTO "Vocabularies" ("VocabID", "Word", "Reading", "Meaning", "LevelID", "TopicID", "LessonID", "Example", "ExampleMeaning", "AudioURL") VALUES
    (gen_random_uuid(), '考える', 'かんがえる', 'Suy nghĩ / Xem xét', n5_id, t_id, l_id, 'よく考えてください。', 'Hãy suy nghĩ kỹ.', ''),
    (gen_random_uuid(), '着く', 'つく', 'Đến nơi', n5_id, t_id, l_id, '駅に着きました。', 'Đã đến nhà ga.', ''),
    (gen_random_uuid(), '留学', 'りゅうがく', 'Du học', n5_id, t_id, l_id, '日本へ留学したいです。', 'Tôi muốn đi du học Nhật Bản.', ''),
    (gen_random_uuid(), '頑張る', 'がんばる', 'Cố gắng', n5_id, t_id, l_id, '明日も頑張ります。', 'Ngày mai tôi cũng sẽ cố gắng.', ''),
    (gen_random_uuid(), '田舎', 'いなか', 'Quê / Nông thôn', n5_id, t_id, l_id, '田舎へ帰ります。', 'Về quê.', '')
    ON CONFLICT ("Word", "Reading") DO NOTHING;

	RAISE NOTICE 'Đã tạo xong từ vựng N5.';

END $$;

-------------------------------------------------------
-- XÓA TẤT CẢ DỮ LIỆU
-------------------------------------------------------
DO $$ 
BEGIN
    TRUNCATE TABLE 
        "Vocabularies", 
        "Grammars", 
        "Kanjis", 
        "Lessons", 
        "Topics", 
        "Courses", 
        "JLPT_Levels"
    RESTART IDENTITY CASCADE;
    RAISE NOTICE 'BƯỚC 1: Đã xóa sạch dữ liệu cũ.';
END $$;

-------------------------------------------------------
-- XÓA DỮ LIỆU CHI TIẾT
-------------------------------------------------------
-- Xóa toàn bộ từ vựng
TRUNCATE TABLE "Vocabularies" RESTART IDENTITY;

-- Xóa toàn bộ ngữ pháp
TRUNCATE TABLE "Grammars" RESTART IDENTITY;

-- Xóa toàn bộ Kanji
TRUNCATE TABLE "Kanjis" RESTART IDENTITY;

-------------------------------------------------------
-- XÓA CẤP ĐỘ TRUNG GIAN
-------------------------------------------------------

-- Xóa các bài học (Ví dụ: Bài 1, Bài 2...)
TRUNCATE TABLE "Lessons" RESTART IDENTITY CASCADE;

-- Xóa các chủ đề (Ví dụ: Từ vựng N5, Kanji N4...)
TRUNCATE TABLE "Topics" RESTART IDENTITY CASCADE;

-------------------------------------------------------
-- XÓA CẤU TRÚC GỐC
-------------------------------------------------------

-- Xóa các khóa học (Ví dụ: Minna no Nihongo)
TRUNCATE TABLE "Courses" RESTART IDENTITY CASCADE;

-- Xóa các trình độ (N1, N2, N3, N4, N5)
TRUNCATE TABLE "JLPT_Levels" RESTART IDENTITY CASCADE;