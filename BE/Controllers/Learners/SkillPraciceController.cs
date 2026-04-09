using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.DTOs.Learner;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Services.Learners;

namespace QuizzTiengNhat.Controllers.Learners
{
    [ApiController]
    [Route("api/learner/skill-practice")]
    [Authorize(Roles = "Learner")]
    public class SkillPraciceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IQuestionService _questionService;

        public SkillPraciceController(ApplicationDbContext context, IQuestionService questionService)
        {
            _context = context;
            _questionService = questionService;
        }

        [HttpGet("questions-by-filter")]
        public async Task<IActionResult> GetQuestions([FromQuery] SkillPracticeDTO filter)
        {
            try
            {
                // Đảm bảo limit không quá lớn gây sập server
                if (filter.Limit > 50) filter.Limit = 50;

                var questions = await _questionService.GetQuestionsByFilterAsync(filter);

                if (questions == null || !questions.Any())
                    return NotFound("Không tìm thấy câu hỏi nào phù hợp với bộ lọc.");

                return Ok(questions);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi lấy danh sách câu hỏi", detail = ex.Message });
            }
        }

        [HttpGet("metadata/radicals")]
        public async Task<IActionResult> GetRadicals()
        {
            var radicals = await _context.Radicals
                .Include(r => r.RadicalVariants) // Lấy kèm biến thể
                .OrderBy(r => r.StrokeCount)
                .Select(r => new {
                    id = r.RadicalID,
                    // Hiển thị tên kèm các biến thể nếu có
                    name = r.Name + (r.RadicalVariants.Any()
                        ? " [" + string.Join(", ", r.RadicalVariants.Select(v => v.Character)) + "]"
                        : ""),
                    character = r.Character,
                    stroke = r.StrokeCount
                })
                .ToListAsync();
            return Ok(radicals);
        }

        [HttpGet("metadata/word-types")]
        public async Task<IActionResult> GetWordTypes() => Ok(await _context.WordTypes.Select(w => new { id = w.WordTypeID, name = w.Name }).ToListAsync());

        [HttpGet("metadata/grammar-groups")]
        public async Task<IActionResult> GetGrammarGroups() =>
            Ok(await _context.GrammarGroups.Select(gg => new { id = gg.GrammarGroupID, name = gg.GroupName }).ToListAsync());

        [HttpGet("metadata/levels")]
        public async Task<IActionResult> GetLevels() => Ok(await _context.JLPT_Levels.Select(l => new { id = l.LevelID, name = l.LevelName }).ToListAsync());

        [HttpGet("metadata/topics")]
        public async Task<IActionResult> GetTopics() => Ok(await _context.Topics.Select(t => new { id = t.TopicID, name = t.TopicName }).ToListAsync());

        [HttpGet("metadata/lessons")]
        public async Task<IActionResult> GetLessons() => Ok(await _context.Lessons.Select(l => new { id = l.LessonID, name = l.Title }).ToListAsync());
    }
}
