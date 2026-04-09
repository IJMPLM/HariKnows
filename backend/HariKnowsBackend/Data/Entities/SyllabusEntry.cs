namespace HariKnowsBackend.Data.Entities;

public class SyllabusEntry
{
    public int Id { get; set; }
    public string CollegeCode { get; set; } = string.Empty;
    public string ProgramCode { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime DateUpdated { get; set; }
}
