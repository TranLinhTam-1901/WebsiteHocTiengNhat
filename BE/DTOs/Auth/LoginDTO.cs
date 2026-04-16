namespace QuizzTiengNhat.DTOs.Auth
{
    public class LoginDTO
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public bool RememberMe { get; set; }

        /// <summary>Id cố định theo profile trình duyệt (localStorage); nhiều tab cùng giá trị.</summary>
        public string? BrowserSessionId { get; set; }
    }
}
