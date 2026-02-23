using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using QuizzTiengNhat.DTOs.Auth;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Services;

namespace QuizzTiengNhat.Controllers.Auth
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ITokenService _tokenService;

        public AuthController(UserManager<ApplicationUser> userManager, ITokenService tokenService)
        {
            _userManager = userManager;
            _tokenService = tokenService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDTO dto)
        {
            var user = new ApplicationUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                FullName = dto.FullName
            };

            var result = await _userManager.CreateAsync(user, dto.Password);

            if (!result.Succeeded)
                return BadRequest(result.Errors);

            await _userManager.AddToRoleAsync(user, SD.Role_Learner);

            return Ok();
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDTO dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);

            if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
                return Unauthorized();

            if (await _userManager.IsLockedOutAsync(user))
            {
                return BadRequest("Tài khoản của bạn đã bị khóa.");
            }
                        var token = await _tokenService.CreateToken(user);
            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new AuthResponseDTO
            {
                Token = token,
                Email = user.Email,
                Roles = roles
            });
        }
    }
}
