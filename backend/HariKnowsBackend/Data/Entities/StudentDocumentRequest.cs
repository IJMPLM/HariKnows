namespace HariKnowsBackend.Data.Entities;

public class StudentDocumentRequest
{
    public int Id { get; set; }
    public required string RequestCode { get; set; }
    public required string StudentNo { get; set; }
    public required string StudentName { get; set; }
    public required string DocumentType { get; set; }
    public int DepartmentId { get; set; }
    public required string Status { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? PreparedAt { get; set; }
    public DateTime? ClaimedAt { get; set; }
    public DateTime? DisposedAt { get; set; }
    public string DisposedReason { get; set; } = string.Empty;
    public string HandledBy { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }

    public Department? Department { get; set; }
}
