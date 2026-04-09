using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Data;
using QuizzTiengNhat.DTOs.Admin.Grammar;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Models.Enums;

namespace QuizzTiengNhat.Controllers.Admins
{
    [ApiController]
    [Route("api/admin/grammar")]
    [Authorize(Roles = "Admin")]
    public class GrammarAdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public GrammarAdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. Lấy danh sách Ngữ pháp
        [HttpGet("get-all")]
        public async Task<IActionResult> GetGrammars()
        {
            var grammars = await _context.Grammars
                .Include(g => g.JLPTLevel)
                .Include(g => g.GrammarGroup)
                .Include(g => g.GrammarTopics).ThenInclude(gt => gt.Topic)
                .OrderByDescending(g => g.UpdatedAt)
                .Select(g => new
                {
                    id = g.GrammarID,
                    title = g.Title,
                    structure = g.Structure,
                    meaning = g.Meaning,
                    grammarType = g.GrammarType,
                    formality = (int)g.Formality,
                    groupName = g.GrammarGroup != null ? g.GrammarGroup.GroupName : "Không có nhóm",
                    levelName = g.JLPTLevel != null ? g.JLPTLevel.LevelName : "N/A",
                    // MỚI: Trả về danh sách tên Topic
                    topics = g.GrammarTopics.Select(gt => gt.Topic.TopicName).ToList(),
                    status = g.Status,
                    updatedAt = g.UpdatedAt
                })
                .ToListAsync();

            return Ok(grammars);
        }

        // 2. Lấy chi tiết ngữ pháp
        [HttpGet("get-by-id/{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var g = await _context.Grammars
                .Include(g => g.Examples)
                .Include(g => g.GrammarGroup)
                .Include(g => g.GrammarTopics) // MỚI: Lấy danh sách Topic liên kết
                .FirstOrDefaultAsync(g => g.GrammarID == id);

            if (g == null) return NotFound("Không tìm thấy ngữ pháp.");

            return Ok(new
            {
                id = g.GrammarID,
                title = g.Title,
                structure = g.Structure,
                meaning = g.Meaning,
                explanation = g.Explanation,
                grammarType = g.GrammarType,
                formality = (int)g.Formality,
                grammarGroupID = g.GrammarGroupID,
                usageNote = g.UsageNote,
                status = g.Status,
                levelID = g.LevelID,
                // SỬA: Trả về danh sách IDs để FE chọn trong Multi-select
                topicIDs = g.GrammarTopics.Select(gt => gt.TopicID).ToList(),
                lessonID = g.LessonID,
                examples = g.Examples.Select(e => new {
                    japanese = e.Content,
                    vietnamese = e.Translation,
                    audioURL = e.AudioURL
                })
            });
        }

        // 3. Thêm mới
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateUpdateGrammarDTO dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var grammar = new Grammars
                {
                    GrammarID = Guid.NewGuid(),
                    Title = dto.Title,
                    Structure = dto.Structure,
                    Meaning = dto.Meaning,
                    Explanation = dto.Explanation,
                    GrammarType = dto.GrammarType,
                    Formality = (FormalityLevel)dto.Formality,
                    GrammarGroupID = dto.GrammarGroupID,
                    UsageNote = dto.UsageNote,
                    Status = dto.Status,
                    LevelID = dto.LevelID,
                    LessonID = dto.LessonID,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Grammars.Add(grammar);

                // MỚI: Gán nhiều Topic
                if (dto.TopicIDs != null && dto.TopicIDs.Any())
                {
                    foreach (var topicId in dto.TopicIDs)
                    {
                        _context.GrammarTopics.Add(new GrammarTopics
                        {
                            GrammarID = grammar.GrammarID,
                            TopicID = topicId
                        });
                    }
                }

                // Xử lý Ví dụ (Giữ nguyên logic)
                if (dto.Examples != null)
                {
                    foreach (var exDto in dto.Examples)
                    {
                        _context.Examples.Add(new Examples
                        {
                            ExampleID = Guid.NewGuid(),
                            Content = exDto.Content,
                            Translation = exDto.Translation,
                            GrammarID = grammar.GrammarID
                        });
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Thêm ngữ pháp thành công", id = grammar.GrammarID });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest($"Lỗi: {ex.Message}");
            }
        }

        // 4. Cập nhật
        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreateUpdateGrammarDTO dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var grammar = await _context.Grammars
                    .Include(g => g.Examples)
                    .Include(g => g.GrammarTopics) // MỚI
                    .FirstOrDefaultAsync(g => g.GrammarID == id);

                if (grammar == null) return NotFound();

                grammar.Title = dto.Title;
                grammar.Structure = dto.Structure;
                grammar.Meaning = dto.Meaning;
                grammar.Explanation = dto.Explanation;
                grammar.GrammarType = dto.GrammarType;
                grammar.Formality = (FormalityLevel)dto.Formality;
                grammar.GrammarGroupID = dto.GrammarGroupID;
                grammar.UsageNote = dto.UsageNote;
                grammar.Status = dto.Status;
                grammar.LevelID = dto.LevelID;
                grammar.LessonID = dto.LessonID;
                grammar.UpdatedAt = DateTime.UtcNow;

                // MỚI: Cập nhật danh sách Topic (Xóa sạch gán lại)
                _context.GrammarTopics.RemoveRange(grammar.GrammarTopics);
                if (dto.TopicIDs != null)
                {
                    foreach (var tId in dto.TopicIDs)
                    {
                        _context.GrammarTopics.Add(new GrammarTopics { GrammarID = id, TopicID = tId });
                    }
                }

                // Cập nhật ví dụ (Xóa sạch gán lại)
                _context.Examples.RemoveRange(grammar.Examples);
                if (dto.Examples != null)
                {
                    foreach (var exDto in dto.Examples)
                    {
                        _context.Examples.Add(new Examples { ExampleID = Guid.NewGuid(), Content = exDto.Content, Translation = exDto.Translation, GrammarID = id });
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(new { message = "Cập nhật thành công" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest($"Lỗi: {ex.Message}");
            }
        }

        // 5. Xóa Ngữ pháp
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var grammar = await _context.Grammars.FindAsync(id);
            if (grammar == null) return NotFound();

            _context.Grammars.Remove(grammar);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa ngữ pháp và ví dụ liên quan" });
        }

        // --- Các phương thức bổ trợ Metadata (Dùng cho Dropdown FE) ---
        [HttpGet("metadata/grammar-groups")]
        public async Task<IActionResult> GetGrammarGroups() =>
            Ok(await _context.GrammarGroups.Select(gg => new { id = gg.GrammarGroupID, name = gg.GroupName }).ToListAsync());

        [HttpGet("metadata/levels")]
        public async Task<IActionResult> GetLevels() =>
            Ok(await _context.JLPT_Levels.Select(l => new { id = l.LevelID, name = l.LevelName }).ToListAsync());

        [HttpGet("metadata/topics")]
        public async Task<IActionResult> GetTopics() =>
            Ok(await _context.Topics.Select(t => new { id = t.TopicID, name = t.TopicName }).ToListAsync());

        [HttpGet("metadata/lessons")]
        public async Task<IActionResult> GetLessons() =>
            Ok(await _context.Lessons.Select(l => new { id = l.LessonID, name = l.Title }).ToListAsync());
    }
}