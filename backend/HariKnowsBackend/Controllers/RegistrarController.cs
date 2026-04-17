using HariKnowsBackend.Models;
using HariKnowsBackend.Services;
using Microsoft.AspNetCore.Mvc;

namespace HariKnowsBackend.Controllers;

[ApiController]
[Route("api/registrar")]
public sealed class RegistrarController(IRegistrarService registrarService) : ControllerBase
{
    [HttpGet("state")]
    public IActionResult GetState()
    {
        var state = registrarService.GetState();
        return Ok(new { departments = state.Departments, documents = state.Documents, activity = state.Activity, catalog = state.Catalog });
    }

    [HttpGet("catalog")]
    public IActionResult GetCatalog()
    {
        var catalog = registrarService.GetCatalog();
        return Ok(catalog);
    }

    [HttpPost("colleges")]
    public IActionResult CreateCollege([FromBody] CreateCollegeRequest request)
    {
        var result = registrarService.CreateCollege(request);

        if (!result.Success && result.NameConflict)
        {
            return Conflict(new { error = result.Error });
        }

        if (!result.Success)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.College);
    }

    [HttpPut("colleges/{collegeId:int}")]
    public IActionResult UpdateCollege(int collegeId, [FromBody] UpdateCollegeRequest request)
    {
        var result = registrarService.UpdateCollege(collegeId, request);

        if (!result.Success && result.NotFound)
        {
            return NotFound(new { error = result.Error });
        }

        if (!result.Success && result.NameConflict)
        {
            return Conflict(new { error = result.Error });
        }

        if (!result.Success)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.College);
    }

    [HttpDelete("colleges/{collegeId:int}")]
    public IActionResult DeleteCollege(int collegeId)
    {
        var result = registrarService.DeleteCollege(collegeId);

        if (!result.Success && result.NotFound)
        {
            return NotFound(new { error = result.Error });
        }

        if (!result.Success)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { deleted = true });
    }

    [HttpPost("colleges/{collegeId:int}/programs")]
    public IActionResult CreateProgram(int collegeId, [FromBody] CreateProgramRequest request)
    {
        var result = registrarService.CreateProgram(collegeId, request);

        if (!result.Success && result.NotFound)
        {
            return NotFound(new { error = result.Error });
        }

        if (!result.Success && result.NameConflict)
        {
            return Conflict(new { error = result.Error });
        }

        if (!result.Success)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Program);
    }

    [HttpPut("programs/{programId:int}")]
    public IActionResult UpdateProgram(int programId, [FromBody] UpdateProgramRequest request)
    {
        var result = registrarService.UpdateProgram(programId, request);

        if (!result.Success && result.NotFound)
        {
            return NotFound(new { error = result.Error });
        }

        if (!result.Success && result.NameConflict)
        {
            return Conflict(new { error = result.Error });
        }

        if (!result.Success)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Program);
    }

    [HttpDelete("programs/{programId:int}")]
    public IActionResult DeleteProgram(int programId)
    {
        var result = registrarService.DeleteProgram(programId);

        if (!result.Success && result.NotFound)
        {
            return NotFound(new { error = result.Error });
        }

        if (!result.Success)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { deleted = true });
    }

    [HttpPost("departments")]
    public IActionResult CreateDepartment([FromBody] CreateDepartmentRequest request)
    {
        var result = registrarService.CreateDepartment(request);

        if (!result.Success && result.NameConflict)
        {
            return Conflict(new { error = result.Error });
        }

        if (!result.Success)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Department);
    }

    [HttpPost("documents")]
    public IActionResult CreateDocument([FromBody] CreateRegistrarDocumentRequest request)
    {
        var result = registrarService.CreateDocument(request);

        if (!result.Success)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Document);
    }

    [HttpPost("documents/{documentId:int}/move")]
    public IActionResult MoveDocument(int documentId, [FromBody] MoveDocumentRequest request)
    {
        var result = registrarService.MoveDocument(documentId, request);

        if (!result.Success && result.NotFound)
        {
            return NotFound(new { error = result.Error });
        }

        if (!result.Success)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { moved = result.Moved });
    }

    [HttpGet("students/search")]
    public IActionResult SearchStudents([FromQuery] string? query, [FromQuery] int limit = 20)
    {
        return Ok(registrarService.SearchStudents(query, limit));
    }

    [HttpPut("students/{studentNo}/credentials")]
    public IActionResult UpdateStudentCredentials(string studentNo, [FromBody] UpsertStudentCredentialsRequestDto request)
    {
        try
        {
            var result = registrarService.UpdateStudentCredentials(request with { StudentNo = studentNo });
            return result is null ? NotFound(new { error = "Student account not found." }) : Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("students/import-icto")]
    [RequestSizeLimit(10_000_000)]
    public IActionResult ImportIctoAccounts([FromForm] IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { error = "No CSV file was uploaded." });
        }

        try
        {
            return Ok(registrarService.ImportIctoAccounts(file, cancellationToken));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("requests")]
    public IActionResult GetRequests([FromQuery] string? studentNo, [FromQuery] string? status, [FromQuery] int limit = 50)
    {
        return Ok(registrarService.GetStudentRequests(studentNo, status, limit));
    }

    [HttpPost("requests")]
    public IActionResult CreateRequest([FromBody] CreateStudentDocumentRequestDto request)
    {
        try
        {
            return Ok(registrarService.CreateStudentRequest(request));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPatch("requests/{requestId:int}/status")]
    public IActionResult UpdateRequestStatus(int requestId, [FromBody] UpdateStudentDocumentStatusDto request)
    {
        try
        {
            var result = registrarService.UpdateStudentRequestStatus(requestId, request);
            if (!result.Success && result.NotFound)
            {
                return NotFound(new { error = result.Error });
            }

            if (!result.Success && result.InvalidTransition)
            {
                return BadRequest(new { error = result.Error });
            }

            return Ok(result.Request);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("faq")]
    public IActionResult GetFaq([FromQuery] string? scopeType, [FromQuery] string? collegeCode, [FromQuery] string? programCode, [FromQuery] bool includeUnpublished = false, [FromQuery] int limit = 100)
    {
        return Ok(registrarService.GetFaqEntries(scopeType, collegeCode, programCode, includeUnpublished, limit));
    }

    [HttpGet("faq/{faqId:int}")]
    public IActionResult GetFaqEntry(int faqId)
    {
        var faq = registrarService.GetFaqEntry(faqId);
        return faq is null ? NotFound(new { error = "FAQ/context entry not found." }) : Ok(faq);
    }

    [HttpPost("faq")]
    public IActionResult CreateFaqEntry([FromBody] CreateFaqContextEntryDto request)
    {
        try
        {
            return Ok(registrarService.CreateFaqEntry(request));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("faq/{faqId:int}")]
    public IActionResult UpdateFaqEntry(int faqId, [FromBody] UpdateFaqContextEntryDto request)
    {
        try
        {
            var faq = registrarService.UpdateFaqEntry(faqId, request);
            return faq is null ? NotFound(new { error = "FAQ/context entry not found." }) : Ok(faq);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("faq/{faqId:int}")]
    public IActionResult DeleteFaqEntry(int faqId)
    {
        return registrarService.DeleteFaqEntry(faqId)
            ? Ok(new { deleted = true })
            : NotFound(new { error = "FAQ/context entry not found." });
    }

    [HttpGet("questions")]
    public IActionResult GetUncertainQuestions([FromQuery] string? status, [FromQuery] int limit = 100)
    {
        return Ok(registrarService.GetUncertainQuestions(status, limit));
    }

    [HttpPost("questions")]
    public IActionResult CreateUncertainQuestion([FromBody] CreateUncertainQuestionRequestDto request)
    {
        try
        {
            return Ok(registrarService.CreateUncertainQuestion(request));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("questions/{questionId:int}")]
    public IActionResult GetUncertainQuestion(int questionId)
    {
        var question = registrarService.GetUncertainQuestion(questionId);
        return question is null ? NotFound(new { error = "Question entry not found." }) : Ok(question);
    }

    [HttpDelete("questions/{questionId:int}")]
    public IActionResult DeleteUncertainQuestion(int questionId)
    {
        return registrarService.DeleteUncertainQuestion(questionId)
            ? Ok(new { deleted = true })
            : NotFound(new { error = "Question entry not found." });
    }

    [HttpPost("questions/{questionId:int}/resolve")]
    public IActionResult ResolveUncertainQuestion(int questionId, [FromBody] ResolveUncertainQuestionRequestDto request)
    {
        try
        {
            var result = registrarService.ResolveUncertainQuestion(questionId, request);
            return result is null
                ? NotFound(new { error = "Question entry not found." })
                : Ok(new { question = result.Value.Question, createdEntry = result.Value.CreatedEntry });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("questions/{questionId:int}/close")]
    public IActionResult CloseUncertainQuestion(int questionId, [FromBody] CloseUncertainQuestionRequestDto? request)
    {
        try
        {
            var result = registrarService.CloseUncertainQuestion(questionId, request ?? new CloseUncertainQuestionRequestDto(null));
            return result is null
                ? NotFound(new { error = "Question entry not found." })
                : Ok(new { question = result });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("faq/seed-mockup")]
    public IActionResult SeedMockupFaqData()
    {
        var mockupEntries = new[]
        {
            new CreateFaqContextEntryDto(
                "context-general",
                "",
                "",
                "documents",
                "What is a Transcript of Records (TOR)?",
                "A Transcript of Records is an official academic document that shows your complete enrollment history, grades achieved in each course, and your cumulative grade point average (GPA)."
            ),
            new CreateFaqContextEntryDto(
                "context-general",
                "",
                "",
                "enrollment",
                "How do I enroll for the next semester?",
                "Enrollment occurs online through the student portal during the designated enrollment period. You'll select courses, pay the appropriate fees, and confirm your registration."
            ),
            new CreateFaqContextEntryDto(
                "context-general",
                "",
                "",
                "grades",
                "When will my grades be posted?",
                "Final grades are typically posted to your student portal 3-5 working days after the examination period ends. Instructors submit grades through the faculty portal."
            )
        };

        int created = 0;
        foreach (var entry in mockupEntries)
        {
            try
            {
                registrarService.CreateFaqEntry(entry);
                created++;
            }
            catch
            {
                // Skip duplicates or errors
            }
        }

        return Ok(new { message = $"Seeded {created} mockup FAQ/context entries", count = created });
    }
}
