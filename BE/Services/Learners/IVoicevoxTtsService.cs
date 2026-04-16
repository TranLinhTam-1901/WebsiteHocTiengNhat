namespace QuizzTiengNhat.Services.Learners;

public interface IVoicevoxTtsService
{
    Task<byte[]> SynthesizeWavAsync(string text, int speakerId, CancellationToken cancellationToken = default);
}
