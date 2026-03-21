using HariKnowsBackend.Models;

namespace HariKnowsBackend.Repositories;

public interface IHelpdeskRepository
{
    ChatMessageDto CreateMessage(string sender, string content, DateTime createdAt);

    IReadOnlyList<ChatMessageDto> GetMessages(int? beforeId, int? afterId, int take);
}
