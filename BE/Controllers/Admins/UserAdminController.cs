using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.DTOs.Admin;
namespace QuizzTiengNhat.Controllers.Admins
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class UserAdminController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public UserAdminController(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        [HttpGet("get-users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = _userManager.Users.ToList();
            var userList = new List<UserDTO>();

            foreach (var user in users)
            {
                // Lấy danh sách Roles của user (thường mỗi user trong hệ thống của bạn sẽ có 1 role chính)
                var roles = await _userManager.GetRolesAsync(user);
                
                userList.Add(new UserDTO
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    Role = roles.FirstOrDefault() ?? "No Role",
                    // Logic quan trọng: Nếu LockoutEnd có giá trị và thời gian đó lớn hơn hiện tại => Đang bị khóa
                    IsLocked = user.LockoutEnd.HasValue && user.LockoutEnd > DateTimeOffset.UtcNow
                });
            }

            return Ok(userList);
        }
        // 1. Thay đổi vai trò tài khoản
        [HttpPost("change-role")]
        public async Task<IActionResult> ChangeRole([FromBody] UpdateRoleDTO dto)
        {
            var user = await _userManager.FindByIdAsync(dto.UserId);
            if (user == null) return NotFound("Không tìm thấy người dùng.");

            // Lấy danh sách các role hiện tại và xóa hết
            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);

            // Thêm role mới
            var result = await _userManager.AddToRoleAsync(user, dto.NewRole);

            if (result.Succeeded) return Ok(new { message = $"Đã đổi quyền sang {dto.NewRole} thành công" });
            return BadRequest(result.Errors);
        }

        // 2. Khóa hoặc Mở khóa tài khoản
        [HttpPost("lock-user")]
        public async Task<IActionResult> LockUnlockUser([FromBody] LockUserDTO dto)
        {
            var user = await _userManager.FindByIdAsync(dto.UserId);
            if (user == null) return NotFound("Không tìm thấy người dùng.");

            if (dto.IsLocked)
            {
                var lockoutDate = new DateTimeOffset(2099, 1, 1, 0, 0, 0, TimeSpan.Zero);
                // Khóa tài khoản vĩnh viễn (đến năm 2099)
                await _userManager.SetLockoutEndDateAsync(user, lockoutDate);
            }
            else
            {
                // Mở khóa bằng cách set thời gian khóa về hiện tại
                await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow);
            }

            return Ok(new { message = dto.IsLocked ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản" });
        }
    }
}