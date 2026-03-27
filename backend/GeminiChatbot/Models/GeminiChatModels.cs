namespace GeminiChatbot.Models;

public record CreateChatRequest(string Content);

public record ChatResponseDto(int Id, string Role, string Content, DateTime CreatedAt);

public record ChatHistoryDto(IReadOnlyList<ChatResponseDto> Messages);

public record ClearHistoryResponse(bool Success, string Message);
