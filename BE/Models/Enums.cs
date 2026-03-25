namespace QuizzTiengNhat.Models.Enums
{
    // Định nghĩa cho các loại kỹ năng trong Lesson
    public enum SkillType
    {
        General = 0,    // Bài học tổng hợp (Giáo trình Minna...)
        Vocabulary = 1,
        Grammar = 2,
        Kanji = 3,
        Reading = 4,
        Listening = 5,
        Practice = 6
    }

    // --- BỔ SUNG: Sắc thái ngữ pháp ---
    public enum FormalityLevel
    {
        Neutral = 0,    // Trung tính
        Casual = 1,     // Thân mật (Thể từ điển)
        Polite = 2,     // Lịch sự (Desu/Masu)
        Formal = 3,     // Trang trọng (Văn viết, thông báo)
        Honorific = 4,  // Kính ngữ (Sonkeigo)
        Humble = 5      // Khiêm nhường ngữ (Kenjougo)
    }

    public enum GrammarCategory
    {
        General = 0,        // Các cấu trúc chung/phức hợp
        Particle = 1,       // Trợ từ (wa, ga, o, ni, e, de...)
        TeForm = 2,         // Các mẫu dùng thể Te
        TaForm = 3,         // Các mẫu dùng thể Ta (Kinh nghiệm, liệt kê)
        NaiForm = 4,        // Các mẫu dùng thể Nai (Cấm đoán, nghĩa vụ)
        DictionaryForm = 5, // Các mẫu dùng thể Từ điển (Khả năng, dự định)
        SentenceEnding = 6, // Cách kết thúc câu (Desu, masu, da, deshō)
        Conjunction = 7,    // Liên từ (Kara, node, noni, từ nối câu)
        Adjective = 8,      // Biến đổi tính từ (Nối tính từ, chuyển tính từ thành phó từ)
        Comparison = 9,     // So sánh (Yori, hō ga, ichiban)
        NounModification = 10, // Mệnh đề định ngữ (Bổ nghĩa danh từ)
        Condition = 11,     // Câu điều kiện (Tara, to, ba, nara)
        GivingReceiving = 12, // Cho nhận (Agemasu, kuremasu, moraimasu)
        Potential = 13,     // Khả năng (Thể khả năng, koto ga dekiru)
        Honorific = 14      // Kính ngữ/Khiêm nhường ngữ
    }

    // Định nghĩa cho các loại câu hỏi
    public enum QuestionType
    {
        MultipleChoice = 0,
        FillInBlank = 1,
        Ordering = 2,
        Synonym = 3,
        Usage = 4,
        TextCompletion = 5,
        ListeningComp = 6,  // Nghe hiểu
        ReadingComp = 7     // Đọc hiểu
    }

    // Định nghĩa trạng thái
    public enum Status
    {
        Draft = 0,
        Published = 1,
        Archived = 2
    }

    public enum ExamType
    {
        MockTest = 0,    // Đề thi thử JLPT chuẩn (Theo cấu trúc Template)
        LessonPractice = 1, // Luyện tập theo từng bài học (Theo LessonID)
        SkillPractice = 2   // Luyện tập chuyên sâu kỹ năng (Theo QuestionType)
    }

}