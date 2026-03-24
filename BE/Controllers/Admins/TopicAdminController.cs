using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Data;
using QuizzTiengNhat.DTOs.Admin;
using QuizzTiengNhat.Models;

namespace QuizzTiengNhat.Controllers.Admins
{
    [ApiController]
    [Route("api/admin/topic")]
    [Authorize(Roles = "Admin")]
    public class TopicsAdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TopicsAdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. Lấy danh sách tất cả các chủ đề (Full data)
        [HttpGet("get-all")]
        public async Task<IActionResult> GetAll()
        {
            var topics = await _context.Topics
                .Select(t => new
                {
                    topicID = t.TopicID,
                    topicName = t.TopicName,
                    description = t.Description,
                    usageCount = t.ListeningTopics.Count + t.VocabTopics.Count + t.GrammarTopics.Count
                })
                .ToListAsync();

            return Ok(topics);
        }

        // 2. Lấy chi tiết một chủ đề
        [HttpGet("get-by-id/{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var topic = await _context.Topics.FindAsync(id);
            if (topic == null) return NotFound("Không tìm thấy chủ đề.");

            return Ok(new
            {
                topicID = topic.TopicID,
                topicName = topic.TopicName,
                description = topic.Description
            });
        }

        // 3. Thêm mới chủ đề
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] TopicDTO dto)
        {
            if (string.IsNullOrEmpty(dto.TopicName))
                return BadRequest("Tên chủ đề không được để trống.");

            var topic = new Topics
            {
                TopicID = Guid.NewGuid(),
                TopicName = dto.TopicName,
                Description = dto.Description
            };

            _context.Topics.Add(topic);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Thêm chủ đề thành công", id = topic.TopicID });
        }

        // 4. Cập nhật chủ đề
        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] TopicDTO dto)
        {
            var topic = await _context.Topics.FindAsync(id);
            if (topic == null) return NotFound("Không tìm thấy chủ đề.");

            topic.TopicName = dto.TopicName;
            topic.Description = dto.Description;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật chủ đề thành công" });
        }

        // 5. Xóa chủ đề
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var topic = await _context.Topics.FindAsync(id);
            if (topic == null) return NotFound();

            // Lưu ý: Nếu có ràng buộc khóa ngoại (Foreign Key) với các bảng ListeningTopics, VocabTopics...
            // Bạn có thể cần xóa các liên kết đó trước hoặc thông báo lỗi nếu đã có dữ liệu sử dụng topic này.

            _context.Topics.Remove(topic);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa chủ đề thành công" });
        }

        // 6. Metadata: Trả về format tối giản cho dropdowns (Giống trong ListeningAdminController)
        [HttpGet("metadata")]
        public async Task<IActionResult> GetMetadata()
        {
            var metadata = await _context.Topics
                .Select(t => new { topicID = t.TopicID, topicName = t.TopicName })
                .ToListAsync();
            return Ok(metadata);
        }
    }
}