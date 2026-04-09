namespace HariKnowsBackend.Data.Entities;

public class GradeRecord
{
    public int Id { get; set; }
    public string CollegeCode { get; set; } = string.Empty;
    public string ProgramCode { get; set; } = string.Empty;
    public string CourseCode { get; set; } = string.Empty;
    public string StudentNo { get; set; } = string.Empty;
    public string Grade { get; set; } = string.Empty;
    public DateTime DateUpdated { get; set; }
}
