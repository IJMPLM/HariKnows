namespace HariKnowsBackend.Data.Entities;

public class StudentMaster
{
    public int Id { get; set; }
    public required string StudentNo { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string MiddleName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string CollegeCode { get; set; } = string.Empty;
    public string ProgramCode { get; set; } = string.Empty;
    public int? CurrentYear { get; set; }
    public string Block { get; set; } = string.Empty;
    public string EnrollmentStatus { get; set; } = string.Empty;
    public string BirthCertStatus { get; set; } = string.Empty;
    public string Form137Status { get; set; } = string.Empty;
    public string GoodMoralStatus { get; set; } = string.Empty;
    public string NstpStatus { get; set; } = string.Empty;
    public string TocStatus { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime DateCreated { get; set; }
    public DateTime DateUpdated { get; set; }
}
