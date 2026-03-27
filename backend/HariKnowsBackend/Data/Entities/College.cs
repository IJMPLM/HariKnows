namespace HariKnowsBackend.Data.Entities;

public class College
{
    public int Id { get; set; }
    public required string Name { get; set; }

    public ICollection<AcademicProgram> Programs { get; set; } = new List<AcademicProgram>();
}
