namespace HariKnowsBackend.Data.Entities;

public class UncertainQuestion
{
    public int Id { get; set; }
    public string ConversationId { get; set; } = string.Empty;
    public string StudentNo { get; set; } = string.Empty;
    public string CollegeCode { get; set; } = string.Empty;
    public string ProgramCode { get; set; } = string.Empty;
    public string QuestionText { get; set; } = string.Empty;
    public string NormalizedQuestion { get; set; } = string.Empty;
    public string Routing { get; set; } = string.Empty;
    public double Confidence { get; set; }
    public string Status { get; set; } = "open";
    public string ResolutionCategory { get; set; } = string.Empty;
    public int? ResolutionEntryId { get; set; }
    public string ResolutionAnswer { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
}
