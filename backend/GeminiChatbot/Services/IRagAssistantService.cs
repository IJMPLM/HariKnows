using GeminiChatbot.Models;

namespace GeminiChatbot.Services;

public interface IRagAssistantService
{
    Task<RagResponseDto> AnswerAsync(string? studentNo, string conversationId, string message, IReadOnlyList<ChatResponseDto> conversationHistory, CancellationToken cancellationToken);
}