namespace HariKnowsBackend.Data.Entities;

public class ActivityLog
{
    public int Id { get; set; }
    public required string Action { get; set; }
    public required string Actor { get; set; }
    public DateTime CreatedAt { get; set; }
}
