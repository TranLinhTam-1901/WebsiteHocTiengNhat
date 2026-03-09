namespace QuizzTiengNhat.Models.Enums
{
    // Định nghĩa cho các loại kỹ năng trong Lesson
    public enum SkillType
    {
        General = 0,    // Bài học tổng hợp (Minna Bài 1, 2...)
        Vocabulary = 1,
        Grammar = 2,
        Kanji = 3,
        Reading = 4,
        Listening = 5,
        Practice = 6    // Bài luyện tập/kiểm tra tổng hợp
    }

    // Định nghĩa cho các loại câu hỏi
    public enum QuestionType
    {
        MultipleChoice = 0, // Chọn 1 trong 4 (Kanji, Từ vựng, Ngữ pháp)
        FillInBlank = 1,    // Điền từ (Thường là trợ từ hoặc đuôi động từ)
        Ordering = 2,       // Sắp xếp câu (Dạng bài dấu sao ★ cực kỳ quan trọng)
        Synonym = 3,        // Tìm từ đồng nghĩa (Dạng bài đặc thù JLPT)
        Usage = 4,          // Cách dùng từ (Chọn câu sử dụng từ đó đúng nhất)
        TextCompletion = 5
    }

    // Định nghĩa trạng thái câu hỏi
    public enum QuestionStatus
    {
        Draft= 0,
        Active= 1,
        Hidden = 2
    }

}