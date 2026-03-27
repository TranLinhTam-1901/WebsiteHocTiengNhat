using QuizzTiengNhat.Models;

namespace QuizzTiengNhat.Services
{
    public interface ITokenService
    {
        Task<string> CreateToken(ApplicationUser user, bool rememberMe);
    }
}
