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
}
