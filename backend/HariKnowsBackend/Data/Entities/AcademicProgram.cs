namespace HariKnowsBackend.Data.Entities;

public class AcademicProgram
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Code { get; set; }
    public required string Group { get; set; }
    public int CollegeId { get; set; }

    public College? College { get; set; }
}
