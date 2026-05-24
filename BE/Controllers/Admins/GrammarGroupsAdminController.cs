using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizzTiengNhat.Data;
using QuizzTiengNhat.DTOs.Admin.Grammar;
using QuizzTiengNhat.Models;

namespace QuizzTiengNhat.Controllers.Admins
{
    [ApiController]
    [Route("api/admin/grammar-group")]
    [Authorize(Roles = "Admin")]
    public class GrammarGroupsAdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public GrammarGroupsAdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. Lấy tất cả nhóm ngữ pháp (kèm số lượng ngữ pháp bên trong)
        [HttpGet("get-all")]
        public async Task<IActionResult> GetAll()
        {
            var groups = await _context.GrammarGroups
                .Select(g => new
                {
                    grammarGroupID = g.GrammarGroupID,
                    groupName = g.GroupName,
                    description = g.Description,
                    usageCount = g.Grammars.Count
                })
                .ToListAsync();

            return Ok(groups);
        }

        // 2. Lấy chi tiết một nhóm
        [HttpGet("get-by-id/{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var group = await _context.GrammarGroups.FindAsync(id);
            if (group == null) return NotFound("Không tìm thấy nhóm ngữ pháp.");

            return Ok(new
            {
                grammarGroupID = group.GrammarGroupID,
                groupName = group.GroupName,
                description = group.Description
            });
        }

        // 3. Thêm mới nhóm ngữ pháp
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] GrammarGroupDTO dto)
        {
            if (string.IsNullOrEmpty(dto.GroupName))
                return BadRequest("Tên nhóm không được để trống.");

            var group = new GrammarGroups
            {
                GrammarGroupID = Guid.NewGuid(),
                GroupName = dto.GroupName,
                Description = dto.Description
            };

            _context.GrammarGroups.Add(group);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Thêm nhóm ngữ pháp thành công", id = group.GrammarGroupID });
        }

        // 4. Cập nhật nhóm ngữ pháp
        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] GrammarGroupDTO dto)
        {
            var group = await _context.GrammarGroups.FindAsync(id);
            if (group == null) return NotFound("Không tìm thấy nhóm ngữ pháp.");

            group.GroupName = dto.GroupName;
            group.Description = dto.Description;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thành công" });
        }

        // 5. Xóa nhóm ngữ pháp
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var group = await _context.GrammarGroups.FindAsync(id);
            if (group == null) return NotFound();

            _context.GrammarGroups.Remove(group);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa nhóm ngữ pháp thành công" });
        }

        // 6. Metadata cho Dropdowns
        [HttpGet("metadata")]
        public async Task<IActionResult> GetMetadata()
        {
            var metadata = await _context.GrammarGroups
                .Select(g => new {
                    grammarGroupID = g.GrammarGroupID,
                    groupName = g.GroupName
                })
                .ToListAsync();
            return Ok(metadata);
        }
    }
}