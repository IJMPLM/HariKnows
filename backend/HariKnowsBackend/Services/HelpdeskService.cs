using HariKnowsBackend.Models;
using HariKnowsBackend.Repositories;

namespace HariKnowsBackend.Services;

public sealed class HelpdeskService(IHelpdeskRepository repository) : IHelpdeskService
{
    public ChatMessageDto CreateMessage(CreateChatMessageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
        {
            throw new ArgumentException("Content is required.");
        }

        var sender = string.IsNullOrWhiteSpace(request.Sender) ? "user" : request.Sender.Trim().ToLowerInvariant();
        var content = request.Content.Trim();
        var createdAt = DateTime.UtcNow;

        return repository.CreateMessage(sender, content, createdAt);
    }

    public ChatMessagePageDto GetMessages(int? beforeId, int? afterId, int? limit)
    {
        var requestedLimit = Math.Clamp(limit ?? 20, 1, 100);
        var take = requestedLimit + 1;

        var rows = repository.GetMessages(beforeId, afterId, take).ToList();

        var hasMore = rows.Count > requestedLimit;
        if (hasMore)
        {
            rows.RemoveAt(rows.Count - 1);
        }

        if (!afterId.HasValue)
        {
            rows.Reverse();
        }

        return new ChatMessagePageDto(rows, hasMore);
    }
}
