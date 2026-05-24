namespace QuizzTiengNhat.DTOs.Auth
{
    public class RegisterDTO
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string FullName { get; set; }
        public Guid? LevelID { get; set; }
    }
}
