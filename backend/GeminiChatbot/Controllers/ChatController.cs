using GeminiChatbot.Models;
using GeminiChatbot.Repositories;
using GeminiChatbot.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace GeminiChatbot.Controllers;

[ApiController]
[Route("api/chat")]
public sealed class ChatController(IGeminiService geminiService, IChatsRepository chatsRepository) : ControllerBase
{
    [HttpPost("message")]
    public async Task<IActionResult> SendMessage([FromBody] CreateChatRequest request, [FromQuery] string? conversationId)
    {
        try
        {
            var convId = conversationId ?? Guid.NewGuid().ToString();
            var trimmedContent = request.Content.Trim();

            if (string.IsNullOrWhiteSpace(request.Content))
            {
                return BadRequest(new { error = "Content is required." });
            }

            // Get conversation history
            var history = await chatsRepository.GetChatHistoryAsync(convId);

            // Get AI response
            var aiResponse = await geminiService.GetChatResponseAsync(trimmedContent, history);

            // Persist only after a successful model response.
            await chatsRepository.SaveMessageAsync("user", trimmedContent, convId);

            // Save AI response
            var assistantMessage = await chatsRepository.SaveMessageAsync("assistant", aiResponse, convId);

            return Ok(new { conversationId = convId, message = assistantMessage });
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

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] string? conversationId, [FromQuery] int limit = 20)
    {
        if (string.IsNullOrWhiteSpace(conversationId))
        {
            return BadRequest(new { error = "conversationId is required." });
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
    public async Task<IActionResult> ClearHistory([FromQuery] string? conversationId)
    {
        if (string.IsNullOrWhiteSpace(conversationId))
        {
            return BadRequest(new { error = "conversationId is required." });
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
}
