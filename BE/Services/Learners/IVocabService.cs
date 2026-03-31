using QuizzTiengNhat.Models;

namespace QuizzTiengNhat.Services.Learners
{
    public interface IVocabService
    {
        Task<List<Vocabularies>> GetVocabsByTopicAsync(Guid topicId);
        Task<object> GetFullVocabDetailAsync(Guid vocabId);
        Task<List<Vocabularies>> GetVocabsByWordTypeAsync(string typeName);
    }
}
