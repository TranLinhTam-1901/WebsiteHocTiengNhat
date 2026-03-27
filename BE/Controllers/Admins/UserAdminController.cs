using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.DTOs.Admin;
using Microsoft.AspNetCore.SignalR; // THÊM DÒNG NÀY
using QuizzTiengNhat.Hubs; // THÊM DÒNG NÀY (Thay bằng namespace Hub của bạn)

namespace QuizzTiengNhat.Controllers.Admins
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class UserAdminController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<PresenceHub> _hubContext; // THÊM BIẾN NÀY

        // Sửa Constructor để Inject HubContext
        public UserAdminController(
            UserManager<ApplicationUser> userManager,
            ApplicationDbContext context,
            IHubContext<PresenceHub> hubContext) // INJECT TẠI ĐÂY
        {
            _userManager = userManager;
            _context = context;
            _hubContext = hubContext;
        }

        [HttpGet("get-users")]
        public async Task<IActionResult> GetUsers()
        {
            // Lấy danh sách bao gồm cả Level để tránh lỗi 'does not contain a definition'
            var users = await _userManager.Users
                .Include(u => u.Level)
                .ToListAsync();

            var userList = new List<UserDTO>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);

                // Tính toán tiến độ thực tế
                var completedLessons = await _context.Progresses
                    .CountAsync(p => p.UserID == user.Id && p.Status == "Completed");

                // Giả sử 50 bài học/level, bạn có thể thay bằng count thực tế từ bảng Lessons
                int totalLessons = 50;
                int percent = totalLessons > 0 ? (int)((double)completedLessons / totalLessons * 100) : 0;
                if (percent > 100) percent = 100;

                userList.Add(new UserDTO
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    Role = roles.FirstOrDefault() ?? "No Role",
                    // Kiểm tra trạng thái khóa chính xác
                    IsLocked = user.LockoutEnd.HasValue && user.LockoutEnd > DateTimeOffset.UtcNow,
                    LevelName = user.Level?.LevelName ?? "N5",
                    ProgressPercent = percent
                });
            }

            return Ok(userList);
        }

        [HttpPost("change-role")]
        public async Task<IActionResult> ChangeRole([FromBody] UpdateRoleDTO dto)
        {
            var user = await _userManager.FindByIdAsync(dto.UserId);
            if (user == null) return NotFound("Không tìm thấy người dùng.");

            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            var result = await _userManager.AddToRoleAsync(user, dto.NewRole);

            if (result.Succeeded)
            {
                // PHÁT TÍN HIỆU REALTIME
                await _hubContext.Clients.All.SendAsync("ReceiveUserUpdate");
                return Ok(new { message = $"Đã đổi quyền sang {dto.NewRole} thành công" });
            }
            return BadRequest(result.Errors);
        }

        [HttpPost("lock-user")]
        public async Task<IActionResult> LockUnlockUser([FromBody] LockUserDTO dto)
        {
            var user = await _userManager.FindByIdAsync(dto.UserId);
            if (user == null) return NotFound("Không tìm thấy người dùng.");

            IdentityResult result;
            if (dto.IsLocked)
            {
                result = await _userManager.SetLockoutEndDateAsync(user, new DateTimeOffset(2099, 1, 1, 0, 0, 0, TimeSpan.Zero));
            }
            else
            {
                result = await _userManager.SetLockoutEndDateAsync(user, null);
            }

            if (result.Succeeded)
            {
                // QUAN TRỌNG NHẤT: PHÁT TÍN HIỆU REALTIME SAU KHI KHÓA/MỞ THÀNH CÔNG
                await _hubContext.Clients.All.SendAsync("ReceiveUserUpdate");

                return Ok(new { message = dto.IsLocked ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản" });
            }

            return BadRequest(result.Errors);
        }
    }
}