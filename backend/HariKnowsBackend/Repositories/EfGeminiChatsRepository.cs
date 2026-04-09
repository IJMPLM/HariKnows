using GeminiChatbot.Models;
using GeminiChatbot.Repositories;
using HariKnowsBackend.Data;
using HariKnowsBackend.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace HariKnowsBackend.Repositories;

public sealed class EfGeminiChatsRepository(HariKnowsDbContext dbContext) : IChatsRepository
{
    public async Task<ChatResponseDto> SaveMessageAsync(string role, string content, string conversationId)
    {
        var chat = new GeminiChat
        {
            Role = role,
            Content = content,
            CreatedAt = DateTime.UtcNow,
            ConversationId = conversationId
        };

        dbContext.GeminiChats.Add(chat);
        await dbContext.SaveChangesAsync();

        return new ChatResponseDto(chat.Id, chat.Role, chat.Content, chat.CreatedAt);
    }

    public async Task<IReadOnlyList<ChatResponseDto>> GetChatHistoryAsync(string conversationId, int limit = 20)
    {
        var messages = await dbContext.GeminiChats
            .Where(c => c.ConversationId == conversationId)
            .OrderByDescending(c => c.CreatedAt)
            .Take(limit)
            .AsNoTracking()
            .ToListAsync();

        messages.Reverse();

        return messages
            .Select(m => new ChatResponseDto(m.Id, m.Role, m.Content, m.CreatedAt))
            .ToList();
    }

    public async Task ClearHistoryAsync(string conversationId)
    {
        var messages = await dbContext.GeminiChats
            .Where(c => c.ConversationId == conversationId)
            .ToListAsync();

        dbContext.GeminiChats.RemoveRange(messages);
        await dbContext.SaveChangesAsync();
    }

    public async Task<IReadOnlyList<ConversationSessionDto>> GetConversationSessionsAsync(string studentNo, int maxAgeInDays = 30)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-maxAgeInDays);
        var studentPattern = $"{studentNo}:";

        var chatRows = await dbContext.GeminiChats
            .Where(c => c.ConversationId.StartsWith(studentPattern) && c.CreatedAt >= cutoffDate)
            .AsNoTracking()
            .ToListAsync();

        return chatRows
            .GroupBy(c => c.ConversationId)
            .Select(group =>
            {
                var orderedMessages = group.OrderBy(c => c.CreatedAt).ToList();
                var latestMessage = orderedMessages.LastOrDefault();
                var latestUserMessage = orderedMessages.LastOrDefault(c => c.Role == "user");
                var previewSource = latestUserMessage?.Content ?? latestMessage?.Content ?? string.Empty;

                return new ConversationSessionDto(
                    group.Key,
                    orderedMessages.First().CreatedAt,
                    orderedMessages.Last().CreatedAt,
                    orderedMessages.Count,
                    previewSource.Length > 100 ? previewSource[..100] + "..." : previewSource,
                    (int)Math.Ceiling((cutoffDate.AddDays(maxAgeInDays) - orderedMessages.Last().CreatedAt).TotalDays)
                );
            })
            .OrderByDescending(session => session.LastMessageAt)
            .ToList();
    }
}
