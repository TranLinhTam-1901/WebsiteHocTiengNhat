using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models
{
    public class VocabWordTypes
    {
        // Khóa ngoại nối tới bảng Vocabularies
        public Guid VocabID { get; set; }
        [ForeignKey("VocabID")]
        public virtual Vocabularies Vocabulary { get; set; }

        // Khóa ngoại nối tới bảng WordTypes
        public Guid WordTypeID { get; set; }
        [ForeignKey("WordTypeID")]
        public virtual WordTypes WordType { get; set; }
    }
}