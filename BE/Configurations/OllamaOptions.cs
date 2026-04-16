namespace QuizzTiengNhat.Configurations;

public class OllamaOptions
{
    public const string SectionName = "Ollama";

    public string BaseUrl { get; set; } = "http://127.0.0.1:11434";
    public string Model { get; set; } = "llama3.2";
    public int TimeoutSeconds { get; set; } = 120;
    public int MaxPromptChars { get; set; } = 12000;
    public int MaxHistoryMessages { get; set; } = 24;
}
