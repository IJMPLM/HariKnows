namespace HariKnowsBackend.Data.Entities;

public class ChatMessage
{
    public int Id { get; set; }
    public required string Sender { get; set; }
    public required string Content { get; set; }
    public DateTime CreatedAt { get; set; }
}
