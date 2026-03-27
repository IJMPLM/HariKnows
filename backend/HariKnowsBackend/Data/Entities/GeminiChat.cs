namespace HariKnowsBackend.Data.Entities;

public class GeminiChat
{
    public int Id { get; set; }
    public required string Role { get; set; } // "user" or "assistant"
    public required string Content { get; set; }
    public DateTime CreatedAt { get; set; }
    public required string ConversationId { get; set; } // Session identifier
}
