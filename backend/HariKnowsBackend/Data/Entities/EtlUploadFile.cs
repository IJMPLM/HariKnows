namespace HariKnowsBackend.Data.Entities;

public class EtlUploadFile
{
    public int Id { get; set; }
    public required string BatchId { get; set; }
    public required string FileName { get; set; }
    public string Category { get; set; } = string.Empty;
    public string CollegeCode { get; set; } = string.Empty;
    public string ProgramCode { get; set; } = string.Empty;
    public int ParsedRows { get; set; }
    public string Status { get; set; } = "staged";
    public string Error { get; set; } = string.Empty;
    public DateTime ParsedAt { get; set; }
}
