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
        return Ok(new { departments = state.Departments, documents = state.Documents, activity = state.Activity });
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
}
