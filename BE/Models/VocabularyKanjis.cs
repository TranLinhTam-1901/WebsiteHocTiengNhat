using System.ComponentModel.DataAnnotations.Schema;

namespace QuizzTiengNhat.Models
{
    public class VocabularyKanjis
    {
        public Guid VocabID { get; set; }
        [ForeignKey("VocabID")]
        public virtual Vocabularies Vocabulary { get; set; }

        public Guid KanjiID { get; set; }
        [ForeignKey("KanjiID")]
        public virtual Kanjis Kanji { get; set; }
    }
}