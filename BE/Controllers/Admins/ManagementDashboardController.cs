using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace QuizzTiengNhat.Controllers.Learner
{
    [ApiController]
    [Route("api/admin/management")]
    [Authorize(Roles = "Admin")] 
    public class ManagementDashboardController : ControllerBase
    {
        private readonly IProgressService _progressService;

        public ManagementDashboardController(IProgressService progressService)
        {
            _progressService = progressService;
        }

        [HttpGet("learner-progress/{learnerId}")]
        public async Task<IActionResult> GetLearnerProgress(string learnerId)
        {
            var result = await _progressService.CalculateGlobalProgressAsync(learnerId);
            if (result == null) return NotFound("Không tìm thấy học viên.");
            
            return Ok(result);
        }
    }
}