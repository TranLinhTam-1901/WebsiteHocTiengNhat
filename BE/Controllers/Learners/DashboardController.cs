using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace QuizzTiengNhat.Controllers.Learner
{
    [ApiController]
    [Route("api/learner/dashboard")]
    [Authorize] 
    public class DashboardController : ControllerBase
    {
        private readonly IProgressService _progressService;

        public DashboardController(IProgressService progressService)
        {
            _progressService = progressService;
        }

        [HttpGet("progress")]
        public async Task<IActionResult> GetProgress()
        {
            // Lấy UserId từ Token của người dùng hiện tại
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "Không tìm thấy thông tin người dùng." });

            var result = await _progressService.CalculateGlobalProgressAsync(userId);
            return Ok(result);
        }
    }
}