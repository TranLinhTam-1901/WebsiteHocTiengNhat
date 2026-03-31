using QuizzTiengNhat.Models;

namespace QuizzTiengNhat.Services.Learners
{
    public interface IGrammarService
    {
        Task<List<Grammars>> GetGrammarsByGroupAsync(Guid groupId);
        Task<List<Grammars>> GetGrammarsByTopicAsync(Guid topicId);
    }
}
