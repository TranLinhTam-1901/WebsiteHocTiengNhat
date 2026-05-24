namespace QuizzTiengNhat.DTOs.Admin
{
    public class UserDTO
    {
        public string Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
        public bool IsLocked { get; set; }
        public string LevelName { get; set; }
        public int ProgressPercent { get; set; }

    }
}