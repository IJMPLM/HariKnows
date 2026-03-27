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
}
