namespace HariKnowsBackend.Data.Entities;

public class CurriculumCourse
{
    public int Id { get; set; }
    public string CollegeCode { get; set; } = string.Empty;
    public string ProgramCode { get; set; } = string.Empty;
    public int Level { get; set; }
    public int Term { get; set; }
    public decimal Units { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public DateTime DateUpdated { get; set; }
}
