namespace QuizzTiengNhat.Models
{
    /// <summary>Một bản ghi (Id = 1) lưu chỉ số admin được gán lần trước cho Round Robin.</summary>
    public class ChatRoundRobinState
    {
        public int Id { get; set; } = 1;

        /// <summary>Index trong danh sách admin đã sắp xếp; -1 nếu chưa gán lần nào.</summary>
        public int LastAssignedIndex { get; set; } = -1;
    }
}
