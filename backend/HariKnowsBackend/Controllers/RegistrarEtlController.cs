using HariKnowsBackend.Models;
using HariKnowsBackend.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;

namespace HariKnowsBackend.Controllers;

[ApiController]
[Route("api/registrar/etl")]
public sealed class RegistrarEtlController(IRegistrarEtlService etlService) : ControllerBase
{
    [HttpPost("bulk-upload")]
    [RequestSizeLimit(50_000_000)]
    public async Task<IActionResult> BulkUpload([FromForm] List<IFormFile> files, [FromForm] List<string>? incompleteFiles, CancellationToken cancellationToken)
    {
        if (files.Count == 0)
        {
            return BadRequest(new { error = "No files were uploaded." });
        }

        var csvFiles = files
            .Where(f => f.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (csvFiles.Count == 0)
        {
            return BadRequest(new { error = "Only CSV files are accepted." });
        }

        try
        {
            var result = await etlService.BulkUploadAsync(csvFiles, incompleteFiles ?? [], cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("import-faqs")]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> ImportFaqs([FromForm] IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { error = "No FAQ file was uploaded." });
        }

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { error = "Only .csv FAQ files are accepted." });
        }

        try
        {
            var result = await etlService.ImportFaqTextAsync(file, cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("commit")]
    public async Task<IActionResult> Commit([FromBody] CommitEtlRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await etlService.CommitAsync(request, cancellationToken);
            return Ok(result);
        }
        catch (DbUpdateException ex)
        {
            var detail = ex.InnerException?.Message ?? ex.Message;
            return BadRequest(new { error = $"Database update failed: {detail}" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("staging/{batchId}")]
    public async Task<IActionResult> GetStaging(string batchId, CancellationToken cancellationToken)
    {
        var staging = await etlService.GetStagingAsync(batchId, cancellationToken);
        if (staging is null)
        {
            return NotFound(new { error = "Batch not found." });
        }

        return Ok(staging);
    }

    [HttpGet("upload-history")]
    public async Task<IActionResult> GetUploadHistory([FromQuery] int limit = 100, CancellationToken cancellationToken = default)
    {
        var safeLimit = Math.Clamp(limit, 1, 500);
        var history = await etlService.GetUploadHistoryAsync(safeLimit, cancellationToken);
        return Ok(history);
    }

    [HttpGet("college-tabs")]
    public async Task<IActionResult> GetCollegeTabs(CancellationToken cancellationToken)
    {
        var tabs = await etlService.GetAvailableCollegeTabsAsync(cancellationToken);
        return Ok(tabs);
    }

    [HttpDelete("staging/{batchId}")]
    public async Task<IActionResult> ClearStaging(string batchId, CancellationToken cancellationToken)
    {
        var deleted = await etlService.ClearStagingAsync(batchId, cancellationToken);
        if (!deleted)
        {
            return NotFound(new { error = "Batch not found." });
        }

        return Ok(new { deleted = true });
    }

    [HttpPost("flush-database")]
    public async Task<IActionResult> FlushDatabase([FromBody] FlushDatabaseRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await etlService.FlushDatabaseAsync(request, cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
