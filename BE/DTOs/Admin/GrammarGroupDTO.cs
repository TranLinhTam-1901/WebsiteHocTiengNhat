using System.ComponentModel.DataAnnotations;

namespace QuizzTiengNhat.DTOs.Admin
{
    public class GrammarGroupDTO
    {
        public string GroupName { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}