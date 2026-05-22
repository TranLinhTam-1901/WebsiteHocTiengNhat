namespace QuizzTiengNhat.Configurations;

public class VoicevoxOptions
{
    public const string SectionName = "Voicevox";

    public string BaseUrl { get; set; } = "http://127.0.0.1:50021";

    /// <summary>VOICEVOX speaker id — cấu hình trong appsettings: <c>Voicevox:DefaultSpeakerId</c>.</summary>
    public int DefaultSpeakerId { get; set; }
    public int TimeoutSeconds { get; set; } = 120;
}
