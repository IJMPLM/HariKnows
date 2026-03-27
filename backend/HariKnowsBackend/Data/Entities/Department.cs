namespace HariKnowsBackend.Data.Entities;

public class Department
{
    public int Id { get; set; }
    public required string Name { get; set; }

    // Navigation
    public ICollection<Document> Documents { get; set; } = new List<Document>();
}
