namespace HariKnowsBackend.Data.Entities;

public class EtlStagingRow
{
    public int Id { get; set; }
    public required string BatchId { get; set; }
    public required string Category { get; set; }
    public required string FileName { get; set; }
    public int SourceRowNumber { get; set; }
    public string StudentNo { get; set; } = string.Empty;
    public string PayloadJson { get; set; } = "{}";
    public string Status { get; set; } = "staged";
    public string ConflictNote { get; set; } = string.Empty;
    public string Error { get; set; } = string.Empty;
}
