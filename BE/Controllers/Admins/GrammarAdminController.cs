using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.DTOs.Admin;
using QuizzTiengNhat.Data;

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

        // 1. Lấy danh sách Ngữ pháp (Scannable list cho bảng quản lý)
        [HttpGet("get-all")]
        public async Task<IActionResult> GetGrammars()
        {
            var grammars = await _context.Grammars
                .Include(g => g.JLPTLevel)
                .Include(g => g.Topic)
                .OrderByDescending(g => g.UpdatedAt)
                .Select(g => new
                {
                    id = g.GrammarID,
                    title = g.Title,
                    structure = g.Structure,
                    meaning = g.Meaning,
                    levelName = g.JLPTLevel != null ? g.JLPTLevel.LevelName : "N/A",
                    topicName = g.Topic != null ? g.Topic.TopicName : "N/A",
                    status = g.Status,
                    updatedAt = g.UpdatedAt
                })
                .ToListAsync();

            return Ok(grammars);
        }

        // 2. Lấy chi tiết ngữ pháp để Edit (Kèm danh sách ví dụ)
        [HttpGet("get-by-id/{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var g = await _context.Grammars
                .Include(g => g.Examples)
                .FirstOrDefaultAsync(g => g.GrammarID == id);

            if (g == null) return NotFound("Không tìm thấy ngữ pháp.");

            // Trả về object khớp với interface FE
            return Ok(new
            {
                id = g.GrammarID,
                title = g.Title,
                structure = g.Structure,
                meaning = g.Meaning,
                explanation = g.Explanation,
                formality = g.Formality,
                similarGrammar = g.SimilarGrammar,
                usageNote = g.UsageNote,
                status = g.Status,
                levelID = g.LevelID,
                topicID = g.TopicID,
                lessonID = g.LessonID,
                examples = g.Examples.Select(e => new {
                    japanese = e.Content,      // Ép tên về giống React
                    vietnamese = e.Translation, // Ép tên về giống React
                    audioURL = e.AudioURL
                })
            });
        }

        // 3. Thêm mới Ngữ pháp và các Ví dụ đi kèm
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateUpdateGrammarDTO dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

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
                    Formality = dto.Formality,
                    SimilarGrammar = dto.SimilarGrammar,
                    UsageNote = dto.UsageNote,
                    Status = dto.Status,
                    LevelID = dto.LevelID,
                    TopicID = dto.TopicID,
                    LessonID = dto.LessonID,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Grammars.Add(grammar);

                // Thêm ví dụ trực tiếp vào Navigation Property
                if (dto.Examples != null)
                {
                    foreach (var exDto in dto.Examples)
                    {
                        grammar.Examples.Add(new Examples
                        {
                            ExampleID = Guid.NewGuid(),
                            Content = exDto.Content,
                            Translation = exDto.Translation,
                            AudioURL = exDto.AudioURL,
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
                return BadRequest($"Lỗi hệ thống: {ex.Message}");
            }
        }

        // 4. Cập nhật Ngữ pháp (Đồng bộ lại danh sách ví dụ)
        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreateUpdateGrammarDTO dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var grammar = await _context.Grammars
                    .Include(g => g.Examples)
                    .FirstOrDefaultAsync(g => g.GrammarID == id);

                if (grammar == null) return NotFound("Không tìm thấy ngữ pháp.");

                // Cập nhật thông tin cơ bản
                grammar.Title = dto.Title;
                grammar.Structure = dto.Structure;
                grammar.Meaning = dto.Meaning;
                grammar.Explanation = dto.Explanation;
                grammar.Formality = dto.Formality;
                grammar.SimilarGrammar = dto.SimilarGrammar;
                grammar.UsageNote = dto.UsageNote;
                grammar.Status = dto.Status;
                grammar.LevelID = dto.LevelID;
                grammar.TopicID = dto.TopicID;
                grammar.LessonID = dto.LessonID;
                grammar.UpdatedAt = DateTime.UtcNow;

                // Xử lý Ví dụ: Xóa các ví dụ cũ để làm sạch dữ liệu
                if (grammar.Examples.Any())
                {
                    _context.Examples.RemoveRange(grammar.Examples);
                }

                // Chèn danh sách ví dụ mới từ FE
                if (dto.Examples != null)
                {
                    foreach (var exDto in dto.Examples)
                    {
                        var newEx = new Examples
                        {
                            ExampleID = Guid.NewGuid(),
                            Content = exDto.Content,
                            Translation = exDto.Translation,
                            AudioURL = exDto.AudioURL,
                            GrammarID = id
                        };
                        _context.Examples.Add(newEx);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(new { message = "Cập nhật ngữ pháp thành công" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest($"Lỗi khi cập nhật: {ex.Message}");
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