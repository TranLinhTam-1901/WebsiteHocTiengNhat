namespace QuizzTiengNhat.Services.Learners
{
    public interface IUserProgressService
    {
        Task<double> GetTopicProgressAsync(string userId, Guid topicId);
        Task<object> GetPersonalizedSuggestionsAsync(string userId);
    }
}
