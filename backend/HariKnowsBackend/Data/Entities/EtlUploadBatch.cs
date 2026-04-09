namespace HariKnowsBackend.Data.Entities;

public class EtlUploadBatch
{
    public int Id { get; set; }
    public required string BatchId { get; set; }
    public DateTime CreatedAt { get; set; }
    public string Status { get; set; } = "staged";
}
