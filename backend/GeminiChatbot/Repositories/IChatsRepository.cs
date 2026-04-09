using GeminiChatbot.Models;

namespace GeminiChatbot.Repositories;

public interface IChatsRepository
{
    Task<ChatResponseDto> SaveMessageAsync(string role, string content, string conversationId);

    Task<IReadOnlyList<ChatResponseDto>> GetChatHistoryAsync(string conversationId, int limit = 20);

    Task ClearHistoryAsync(string conversationId);

    Task<IReadOnlyList<ConversationSessionDto>> GetConversationSessionsAsync(string studentNo, int maxAgeInDays = 30);
}
