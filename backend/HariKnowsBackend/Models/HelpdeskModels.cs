namespace HariKnowsBackend.Models;

public record CreateChatMessageRequest(string Sender, string Content);

public record ChatMessageDto(int Id, string Sender, string Content, DateTime CreatedAt);

public record ChatMessagePageDto(IReadOnlyList<ChatMessageDto> Messages, bool HasMore);
