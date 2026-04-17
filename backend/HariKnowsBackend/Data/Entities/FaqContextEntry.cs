namespace HariKnowsBackend.Data.Entities;

public class FaqContextEntry
{
    public int Id { get; set; }
    public required string ScopeType { get; set; }
    public string CollegeCode { get; set; } = string.Empty;
    public string ProgramCode { get; set; } = string.Empty;
    public required string Category { get; set; }
    public required string Question { get; set; }
    public required string Answer { get; set; }
    public string AvailabilityCriteria { get; set; } = string.Empty;
    public string EligibilityRules { get; set; } = string.Empty;
    public string PricingDetails { get; set; } = string.Empty;
    public string Requirements { get; set; } = string.Empty;
    public string Caveats { get; set; } = string.Empty;
    public string EscalationGuidance { get; set; } = string.Empty;
    public string CitationUrl { get; set; } = string.Empty;
    public string TagsCsv { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
