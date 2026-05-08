-- =============================================================================
-- Fill_SQL_N5_LearnerExam_Test.sql
-- Mục tiêu: seed dữ liệu ĐẦU VÀO để gọi API Admin tạo đề:
--   POST /api/admins/exams/generate
-- dùng được cho Level N5 và tạo được duy nhất 1 đề theo cấu trúc JLPT N5.
--
-- Luồng GenerateExam trong ExamsController lọc theo:
--   - SkillType (từ request.Parts)
--   - nếu MockTest/SkillPractice: q.Lesson.Course.LevelID == request.LevelID
--   - nếu LessonPractice: q.LessonID == request.LessonID
--
-- Script này:
--   1) Tạo Level N5 nếu thiếu
--   2) Tạo Course + Lesson test N5
--   3) Tạo template "Cấu trúc JLPT N5 Chuẩn" (25/20/10/20 như Initialize.cs)
--   4) Seed ngân hàng câu hỏi đủ số lượng theo 4 kỹ năng
--   5) KHÔNG tạo sẵn bản ghi Exams/Exam_Questions (để bạn tự gọi API generate)
-- =============================================================================

DO $$
DECLARE
    v_level_n5 uuid;
    v_course_id uuid := 'cccccccc-cccc-cccc-cccc-ccccccccccc1';
    v_lesson_id uuid := 'd1111111-1111-1111-1111-111111111101';
    v_template_id uuid := 'a5555555-5555-5555-5555-555555555501';
    v_now timestamptz := NOW();
BEGIN
    -- -------------------------------------------------------------------------
    -- 0) Ensure N5 level tồn tại
    -- -------------------------------------------------------------------------
    INSERT INTO "JLPT_Levels" ("LevelID", "LevelName")
    VALUES ('550e8400-e29b-41d4-a716-446655440000', 'N5')
    ON CONFLICT ("LevelName") DO NOTHING;

    SELECT "LevelID"
    INTO v_level_n5
    FROM "JLPT_Levels"
    WHERE "LevelName" = 'N5'
    LIMIT 1;

    IF v_level_n5 IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy hoặc tạo được Level N5.';
    END IF;

    -- -------------------------------------------------------------------------
    -- 1) Dọn seed cũ của bộ TEST này (an toàn, không ảnh hưởng khóa khác)
    -- -------------------------------------------------------------------------
    DELETE FROM "Exam_Result_Details"
    WHERE "QuestionID" IN (
        SELECT "QuestionID"
        FROM "Questions"
        WHERE "LessonID" = v_lesson_id
    );

    DELETE FROM "UserAnswerHistories"
    WHERE "QuestionID" IN (
        SELECT "QuestionID"
        FROM "Questions"
        WHERE "LessonID" = v_lesson_id
    );

    DELETE FROM "Exam_Results"
    WHERE "ExamID" IN (
        SELECT DISTINCT eq."ExamID"
        FROM "Exam_Questions" eq
        JOIN "Questions" q ON q."QuestionID" = eq."QuestionID"
        WHERE q."LessonID" = v_lesson_id
    );

    DELETE FROM "ExamTemplateDetails"
    WHERE "TemplateID" = v_template_id;

    DELETE FROM "ExamTemplates"
    WHERE "TemplateID" = v_template_id;

    DELETE FROM "Answers"
    WHERE "QuestionID" IN (
        SELECT "QuestionID"
        FROM "Questions"
        WHERE "LessonID" = v_lesson_id
    );

    DELETE FROM "Questions_Topics"
    WHERE "QuestionID" IN (
        SELECT "QuestionID"
        FROM "Questions"
        WHERE "LessonID" = v_lesson_id
    );

    DELETE FROM "Exam_Questions"
    WHERE "QuestionID" IN (
        SELECT "QuestionID"
        FROM "Questions"
        WHERE "LessonID" = v_lesson_id
    );

    DELETE FROM "Questions"
    WHERE "LessonID" = v_lesson_id;

    DELETE FROM "Lessons"
    WHERE "LessonID" = v_lesson_id;

    DELETE FROM "Courses"
    WHERE "CourseID" = v_course_id;

    -- -------------------------------------------------------------------------
    -- 2) Tạo Course/Lesson N5 làm nguồn câu hỏi cho GenerateExam
    -- -------------------------------------------------------------------------
    INSERT INTO "Courses" ("CourseID", "CourseName", "Description", "LevelID")
    VALUES (
        v_course_id,
        '[TEST] N5 - Generate Exam Source',
        'Nguồn dữ liệu câu hỏi để admin generate duy nhất 1 đề N5.',
        v_level_n5
    );

    INSERT INTO "Lessons" (
        "LessonID", "CourseID", "Title", "SkillType", "Difficulty", "Priority", "JLPT_LevelLevelID"
    ) VALUES (
        v_lesson_id, v_course_id, '[TEST] N5 Lesson - Question Bank', 0, 1, 1, NULL
    );

    -- -------------------------------------------------------------------------
    -- 3) Tạo template N5 đúng cấu trúc Initialize.cs
    -- -------------------------------------------------------------------------
    INSERT INTO "ExamTemplates" (
        "TemplateID", "Title", "LevelID", "Duration", "PassingScore",
        "MinLanguageKnowledgeScore", "MinReadingScore", "MinListeningScore", "TotalMaxScore"
    ) VALUES (
        v_template_id, 'Cấu trúc JLPT N5 Chuẩn', v_level_n5, 140, 80.00,
        38, 0, 19, 180.00
    );

    INSERT INTO "ExamTemplateDetails" ("DetailID", "SkillType", "Quantity", "PointPerQuestion", "TemplateID")
    VALUES
        (gen_random_uuid(), 1, 25, 2.0000, v_template_id), -- Vocabulary
        (gen_random_uuid(), 2, 20, 1.7500, v_template_id), -- Grammar
        (gen_random_uuid(), 4, 10, 3.5000, v_template_id), -- Reading
        (gen_random_uuid(), 5, 20, 3.0000, v_template_id); -- Listening

    -- -------------------------------------------------------------------------
    -- 4) Seed question bank đủ 25/20/10/20 câu cho N5
    --    AudioURL cho Listening để trống 1 khoảng trắng theo yêu cầu.
    -- -------------------------------------------------------------------------

    -- 4.1 Vocabulary (SkillType = 1): 25 câu
    INSERT INTO "Questions" (
        "QuestionID", "LessonID", "Content", "QuestionType", "SkillType",
        "Difficulty", "Status", "AudioURL", "ImageURL", "Explanation",
        "CreatedAt", "UpdatedAt", "ReadingID", "ListeningID"
    )
    SELECT
        gen_random_uuid(),
        v_lesson_id,
        format('Từ vựng N5 câu %s: chọn nghĩa đúng của từ được gạch chân.', gs),
        0, 1, 1, 1,
        NULL, NULL, NULL,
        v_now, v_now, NULL, NULL
    FROM generate_series(1, 25) AS gs;

    -- Mỗi câu Vocabulary có 4 đáp án để FE hiển thị được đề thật
    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect")
    SELECT gen_random_uuid(), q."QuestionID", x.answer_text, x.is_correct
    FROM "Questions" q
    CROSS JOIN LATERAL (
        VALUES
            ('Nghĩa đúng của từ', true),
            ('Nghĩa gần đúng nhưng sai ngữ cảnh', false),
            ('Nghĩa đối lập', false),
            ('Phương án gây nhiễu', false)
    ) AS x(answer_text, is_correct)
    WHERE q."LessonID" = v_lesson_id
      AND q."SkillType" = 1;

    -- 4.2 Grammar (SkillType = 2): 20 câu
    INSERT INTO "Questions" (
        "QuestionID", "LessonID", "Content", "QuestionType", "SkillType",
        "Difficulty", "Status", "AudioURL", "ImageURL", "Explanation",
        "CreatedAt", "UpdatedAt", "ReadingID", "ListeningID"
    )
    SELECT
        gen_random_uuid(),
        v_lesson_id,
        format('Ngữ pháp N5 câu %s: 私___学生です。Chọn trợ từ đúng.', gs),
        0, 2, 1, 1,
        NULL, NULL, NULL,
        v_now, v_now, NULL, NULL
    FROM generate_series(1, 20) AS gs;

    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect")
    SELECT gen_random_uuid(), q."QuestionID", x.answer_text, x.is_correct
    FROM "Questions" q
    CROSS JOIN LATERAL (
        VALUES
            ('は', true),
            ('を', false),
            ('に', false),
            ('で', false)
    ) AS x(answer_text, is_correct)
    WHERE q."LessonID" = v_lesson_id
      AND q."SkillType" = 2;

    -- 4.3 Reading (SkillType = 4): 10 câu
    INSERT INTO "Questions" (
        "QuestionID", "LessonID", "Content", "QuestionType", "SkillType",
        "Difficulty", "Status", "AudioURL", "ImageURL", "Explanation",
        "CreatedAt", "UpdatedAt", "ReadingID", "ListeningID"
    )
    SELECT
        gen_random_uuid(),
        v_lesson_id,
        format('Đọc hiểu N5 câu %s: きょうは いい てんきです。Ý đúng là gì?', gs),
        0, 4, 1, 1,
        NULL, NULL, NULL,
        v_now, v_now, NULL, NULL
    FROM generate_series(1, 10) AS gs;

    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect")
    SELECT gen_random_uuid(), q."QuestionID", x.answer_text, x.is_correct
    FROM "Questions" q
    CROSS JOIN LATERAL (
        VALUES
            ('Hôm nay thời tiết đẹp.', true),
            ('Hôm nay trời mưa to.', false),
            ('Ngày mai trời lạnh.', false),
            ('Hôm qua thời tiết xấu.', false)
    ) AS x(answer_text, is_correct)
    WHERE q."LessonID" = v_lesson_id
      AND q."SkillType" = 4;

    -- 4.4 Listening (SkillType = 5): 20 câu
    INSERT INTO "Questions" (
        "QuestionID", "LessonID", "Content", "QuestionType", "SkillType",
        "Difficulty", "Status", "AudioURL", "ImageURL", "Explanation",
        "CreatedAt", "UpdatedAt", "ReadingID", "ListeningID"
    )
    SELECT
        gen_random_uuid(),
        v_lesson_id,
        format('Nghe hiểu N5 câu %s: nghe và chọn đáp án đúng theo nội dung.', gs),
        0, 5, 1, 1,
        ' ', NULL, NULL,   -- placeholder audio theo yêu cầu
        v_now, v_now, NULL, NULL
    FROM generate_series(1, 20) AS gs;

    INSERT INTO "Answers" ("AnswerID", "QuestionID", "AnswerText", "IsCorrect")
    SELECT gen_random_uuid(), q."QuestionID", x.answer_text, x.is_correct
    FROM "Questions" q
    CROSS JOIN LATERAL (
        VALUES
            ('Chào buổi sáng.', true),
            ('Chào buổi tối.', false),
            ('Tạm biệt.', false),
            ('Xin lỗi.', false)
    ) AS x(answer_text, is_correct)
    WHERE q."LessonID" = v_lesson_id
      AND q."SkillType" = 5;

    RAISE NOTICE 'Done seed N5 generate source.';
    RAISE NOTICE 'LevelID N5      : %', v_level_n5;
    RAISE NOTICE 'CourseID         : %', v_course_id;
    RAISE NOTICE 'LessonID         : %', v_lesson_id;
    RAISE NOTICE 'TemplateID N5    : %', v_template_id;
    RAISE NOTICE 'Question counts  : Vocab=25, Grammar=20, Reading=10, Listening=20';
    RAISE NOTICE 'Answer counts    : 4 options/question (1 correct)';
END $$;

-- ---------------------------------------------------------------------------
-- Check nhanh sau khi chạy script
-- ---------------------------------------------------------------------------
-- SELECT q."SkillType", COUNT(*) AS total
-- FROM "Questions" q
-- WHERE q."LessonID" = 'd1111111-1111-1111-1111-111111111101'
-- GROUP BY q."SkillType"
-- ORDER BY q."SkillType";
--
-- SELECT et."TemplateID", et."Title", etd."SkillType", etd."Quantity", etd."PointPerQuestion"
-- FROM "ExamTemplates" et
-- JOIN "ExamTemplateDetails" etd ON etd."TemplateID" = et."TemplateID"
-- WHERE et."TemplateID" = 'a5555555-5555-5555-5555-555555555501'
-- ORDER BY etd."SkillType";
