namespace QuizzTiengNhat.Configurations;

public class WhisperOptions
{
    public const string SectionName = "Whisper";

    /// <summary>
    /// URL gốc API OpenAI-compatible (kết thúc bằng /). Docker image
    /// <c>onerahmet/openai-whisper-asr-webservice:latest</c> mặc định map cổng host <c>9000</c> → <c>http://127.0.0.1:9000/v1/</c>.
    /// </summary>
    public string BaseUrl { get; set; } = "http://127.0.0.1:9000/v1/";

    /// <summary>Tham số multipart <c>model</c> (vd. <c>base</c> khớp <c>ASR_MODEL=base</c> trong container).</summary>
    public string Model { get; set; } = "base";

    public int TimeoutSeconds { get; set; } = 120;

    /// <summary>Giới hạn upload (bytes), mặc định ~12MB.</summary>
    public long MaxUploadBytes { get; set; } = 12_582_912;
}
