using GeminiChatbot.Models;
using HariKnowsBackend.Data;
using HariKnowsBackend.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace GeminiChatbot.Repositories;

public sealed class EfChatsRepository(HariKnowsDbContext dbContext) : IChatsRepository
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
            .OrderBy(c => c.CreatedAt)
            .TakeLast(limit)
            .AsNoTracking()
            .ToListAsync();

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
}
