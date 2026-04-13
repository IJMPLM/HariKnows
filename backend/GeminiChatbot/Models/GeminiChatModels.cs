namespace GeminiChatbot.Models;

public record CreateChatRequest(string Content);

public record ChatResponseDto(int Id, string Role, string Content, DateTime CreatedAt);

public record ChatHistoryDto(IReadOnlyList<ChatResponseDto> Messages);

public record ClearHistoryResponse(bool Success, string Message);

public record RagCitationDto(int Id, string Title, string Url, string ScopeType, string Category);

public record RagResponseDto(string Reply, string ModelSource, string Routing, double Confidence, IReadOnlyList<RagCitationDto> Citations, string? RedirectOffice, string? RedirectReason, string? UncertainQuestion = null);

public record ConversationSessionDto(
    string ConversationId,
    DateTime FirstMessageAt,
    DateTime LastMessageAt,
    int MessageCount,
    string PreviewText,
    int ExpiresInDays
);
