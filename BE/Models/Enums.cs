namespace QuizzTiengNhat.Models.Enums
{
    // Định nghĩa cho các loại kỹ năng trong Lesson
    public enum SkillType
    {
        Vocabulary,
        Grammar,
        Kanji,
        Reading,
        Listening
    }

    // Định nghĩa cho các loại câu hỏi
    public enum QuestionType
    {
       MultipleChoice = 0, // Chọn 1 trong 4 (Kanji, Từ vựng, Ngữ pháp)
        FillInBlank = 1,    // Điền từ (Thường là trợ từ hoặc đuôi động từ)
        Ordering = 2,       // Sắp xếp câu (Dạng bài dấu sao ★ cực kỳ quan trọng)
        Synonym = 3,        // Tìm từ đồng nghĩa (Dạng bài đặc thù JLPT)
        Usage = 4,          // Cách dùng từ (Chọn câu sử dụng từ đó đúng nhất)
    }

    // Định nghĩa trạng thái câu hỏi
    public enum QuestionStatus
    {
        Draft= 0,
        Active= 1
    }

}