using HariKnowsBackend.Models;
using HariKnowsBackend.Services;
using Microsoft.AspNetCore.Mvc;

namespace HariKnowsBackend.Controllers;

[ApiController]
[Route("api/helpdesk")]
public sealed class HelpdeskController(IHelpdeskService helpdeskService) : ControllerBase
{
    [HttpPost("messages")]
    public IActionResult CreateMessage([FromBody] CreateChatMessageRequest request)
    {
        try
        {
            var created = helpdeskService.CreateMessage(request);
            return Ok(created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("messages")]
    public IActionResult GetMessages([FromQuery] int? beforeId, [FromQuery] int? afterId, [FromQuery] int? limit)
    {
        var page = helpdeskService.GetMessages(beforeId, afterId, limit);
        return Ok(new { messages = page.Messages, hasMore = page.HasMore });
    }
}
