using HariKnowsBackend.Data;
using HariKnowsBackend.Data.Entities;
using HariKnowsBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace HariKnowsBackend.Repositories;

public sealed class EfHelpdeskRepository(HariKnowsDbContext dbContext) : IHelpdeskRepository
{
    public ChatMessageDto CreateMessage(string sender, string content, DateTime createdAt)
    {
        var message = new ChatMessage
        {
            Sender = sender,
            Content = content,
            CreatedAt = createdAt
        };

        dbContext.ChatMessages.Add(message);
        dbContext.SaveChanges();

        return new ChatMessageDto(message.Id, message.Sender, message.Content, message.CreatedAt);
    }

    public IReadOnlyList<ChatMessageDto> GetMessages(int? beforeId, int? afterId, int take)
    {
        IQueryable<ChatMessage> query = dbContext.ChatMessages;

        if (afterId.HasValue)
        {
            query = query
                .Where(m => m.Id > afterId.Value)
                .OrderBy(m => m.Id);
        }
        else if (beforeId.HasValue)
        {
            query = query
                .Where(m => m.Id < beforeId.Value)
                .OrderByDescending(m => m.Id);
        }
        else
        {
            query = query.OrderByDescending(m => m.Id);
        }

        var messages = query
            .Take(take)
            .ToList()
            .Select(m => new ChatMessageDto(m.Id, m.Sender, m.Content, m.CreatedAt))
            .ToList();

        return messages;
    }
}
