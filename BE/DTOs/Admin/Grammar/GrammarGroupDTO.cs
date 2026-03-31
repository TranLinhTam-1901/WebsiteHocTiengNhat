using System.ComponentModel.DataAnnotations;

namespace QuizzTiengNhat.DTOs.Admin.Grammar
{
    public class GrammarGroupDTO
    {
        public string GroupName { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}