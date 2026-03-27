namespace HariKnowsBackend.Data.Entities;

public class Document
{
    public int Id { get; set; }
    public required string ReferenceCode { get; set; }
    public required string StudentName { get; set; }
    public required string Title { get; set; }
    public int DepartmentId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public Department? Department { get; set; }
}
