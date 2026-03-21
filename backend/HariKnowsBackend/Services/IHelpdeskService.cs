using HariKnowsBackend.Models;

namespace HariKnowsBackend.Services;

public interface IHelpdeskService
{
    ChatMessageDto CreateMessage(CreateChatMessageRequest request);

    ChatMessagePageDto GetMessages(int? beforeId, int? afterId, int? limit);
}
