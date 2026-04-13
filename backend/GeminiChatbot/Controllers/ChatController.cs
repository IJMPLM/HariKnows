using GeminiChatbot.Models;
using GeminiChatbot.Repositories;
using GeminiChatbot.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;
using System.Security.Claims;

namespace GeminiChatbot.Controllers;

[ApiController]
[Route("api/chat")]
public sealed class ChatController(IRagAssistantService ragAssistantService, IGeminiService geminiService, IChatsRepository chatsRepository, IWebHostEnvironment hostEnvironment) : ControllerBase
{
    [HttpPost("message")]
    [AllowAnonymous]
    public async Task<IActionResult> SendMessage([FromBody] CreateChatRequest request, [FromQuery] string? conversationId)
    {
        try
        {
            var studentNo = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isGuest = string.IsNullOrWhiteSpace(studentNo);
            var convId = BuildConversationId(studentNo, conversationId, isGuest);
            if (string.IsNullOrWhiteSpace(convId))
            {
                return Forbid();
            }

            var trimmedContent = request.Content.Trim();

            if (string.IsNullOrWhiteSpace(request.Content))
            {
                return BadRequest(new { error = "Content is required." });
            }

            var history = isGuest
                ? new List<ChatResponseDto>()
                : await chatsRepository.GetChatHistoryAsync(convId);

            var ragResponse = await ragAssistantService.AnswerAsync(studentNo, convId, trimmedContent, history, HttpContext.RequestAborted);

            ChatResponseDto assistantMessage;
            if (isGuest)
            {
                assistantMessage = new ChatResponseDto(0, "assistant", ragResponse.Reply, DateTime.UtcNow);
            }
            else
            {
                // Persist only after a successful model response.
                await chatsRepository.SaveMessageAsync("user", trimmedContent, convId);

                // Save AI response
                assistantMessage = await chatsRepository.SaveMessageAsync("assistant", ragResponse.Reply, convId);
            }

            return Ok(new { conversationId = convId, message = assistantMessage, meta = ragResponse });
        }
        catch (GeminiRateLimitException ex)
        {
            return StatusCode(StatusCodes.Status429TooManyRequests, new
            {
                error = "Gemini API quota exceeded or rate-limited. Please retry later or update Gemini API billing/quota.",
                retryAfterSeconds = ex.RetryAfterSeconds
            });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("debug/raw-prompt")]
    [AllowAnonymous]
    public async Task<IActionResult> BuildRawPrompt([FromBody] CreateChatRequest request, [FromQuery] string? conversationId)
    {
        var studentNo = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isGuest = string.IsNullOrWhiteSpace(studentNo);
        var convId = BuildConversationId(studentNo, conversationId, isGuest);
        if (string.IsNullOrWhiteSpace(convId))
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest(new { error = "Content is required." });
        }

        var trimmedContent = request.Content.Trim();
        var history = isGuest
            ? new List<ChatResponseDto>()
            : await chatsRepository.GetChatHistoryAsync(convId);

        var rawPrompt = await ragAssistantService.BuildRawPromptAsync(studentNo, trimmedContent, history, HttpContext.RequestAborted);
        var preview = geminiService.BuildRequestPreview(rawPrompt, history);

        var output = new StringBuilder();
        output.AppendLine("# Exact Prompt Sent To Gemini");
        output.AppendLine();
        output.AppendLine("## Raw Prompt String");
        output.AppendLine();
        output.AppendLine(rawPrompt);
        output.AppendLine();
        output.AppendLine("## Gemini API Contents Payload");
        output.AppendLine();
        output.AppendLine(JsonSerializer.Serialize(preview, new JsonSerializerOptions { WriteIndented = true }));

        var targetFile = Path.GetFullPath(Path.Combine(hostEnvironment.ContentRootPath, "..", "..", "docs", "context", "complete_raw_prompt.txt"));
        var targetDir = Path.GetDirectoryName(targetFile);
        if (!string.IsNullOrWhiteSpace(targetDir))
        {
            Directory.CreateDirectory(targetDir);
        }

        await System.IO.File.WriteAllTextAsync(targetFile, output.ToString(), HttpContext.RequestAborted);

        return Ok(new
        {
            conversationId = convId,
            outputPath = targetFile,
            rawPrompt,
            payload = preview
        });
    }

    [HttpGet("history")]
    [Authorize]
    public async Task<IActionResult> GetHistory([FromQuery] string? conversationId, [FromQuery] int limit = 20)
    {
        if (string.IsNullOrWhiteSpace(conversationId))
        {
            return BadRequest(new { error = "conversationId is required." });
        }

        var studentNo = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(studentNo) || !IsStudentConversation(studentNo, conversationId))
        {
            return Forbid();
        }

        try
        {
            var history = await chatsRepository.GetChatHistoryAsync(conversationId, limit);
            return Ok(new { messages = history });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpDelete("history")]
    [Authorize]
    public async Task<IActionResult> ClearHistory([FromQuery] string? conversationId)
    {
        if (string.IsNullOrWhiteSpace(conversationId))
        {
            return BadRequest(new { error = "conversationId is required." });
        }

        var studentNo = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(studentNo) || !IsStudentConversation(studentNo, conversationId))
        {
            return Forbid();
        }

        try
        {
            await chatsRepository.ClearHistoryAsync(conversationId);
            return Ok(new { success = true, message = "Chat history cleared." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("conversations")]
    [Authorize]
    public async Task<IActionResult> GetConversationSessions([FromQuery] int maxAgeInDays = 30)
    {
        var studentNo = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(studentNo))
        {
            return Forbid();
        }

        try
        {
            var sessions = await chatsRepository.GetConversationSessionsAsync(studentNo, maxAgeInDays);
            return Ok(new { sessions });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpDelete("conversation")]
    [Authorize]
    public async Task<IActionResult> DeleteConversation([FromQuery] string? conversationId)
    {
        if (string.IsNullOrWhiteSpace(conversationId))
        {
            return BadRequest(new { error = "conversationId is required." });
        }

        var studentNo = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(studentNo) || !IsStudentConversation(studentNo, conversationId))
        {
            return Forbid();
        }

        try
        {
            await chatsRepository.DeleteConversationAsync(conversationId);
            return Ok(new { success = true, message = "Conversation deleted." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    private static string? BuildConversationId(string? studentNo, string? requestedConversationId, bool isGuest)
    {
        if (string.IsNullOrWhiteSpace(requestedConversationId))
        {
            return isGuest ? $"guest:{Guid.NewGuid():N}" : $"{studentNo}:{Guid.NewGuid():N}";
        }

        if (isGuest)
        {
            return requestedConversationId.StartsWith("guest:", StringComparison.Ordinal)
                ? requestedConversationId
                : null;
        }

        return IsStudentConversation(studentNo!, requestedConversationId)
            ? requestedConversationId
            : null;
    }

    private static bool IsStudentConversation(string studentNo, string conversationId)
    {
        return conversationId.StartsWith($"{studentNo}:", StringComparison.Ordinal);
    }
}
