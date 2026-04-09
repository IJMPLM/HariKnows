namespace HariKnowsBackend.Models;

public record StudentDirectoryEntryDto(string StudentNo, string FullName, string CollegeCode, string ProgramCode, string Email);

public record StudentDocumentRequestDto(
    int Id,
    string RequestCode,
    string StudentNo,
    string StudentName,
    string DocumentType,
    int DepartmentId,
    string Status,
    DateTime RequestedAt,
    DateTime? PreparedAt,
    DateTime? ClaimedAt,
    DateTime? DisposedAt,
    string DisposedReason,
    string HandledBy,
    string Notes,
    DateTime UpdatedAt
);

public record CreateStudentDocumentRequestDto(string StudentNo, string DocumentType, int DepartmentId, string Notes);

public record UpdateStudentDocumentStatusDto(string Status, string? HandledBy, string? DisposedReason, string? Notes);

public record FaqContextEntryDto(
    int Id,
    string ScopeType,
    string CollegeCode,
    string ProgramCode,
    string Category,
    string Title,
    string Answer,
    bool IsGuestVisible,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateFaqContextEntryDto(
    string ScopeType,
    string CollegeCode,
    string ProgramCode,
    string Category,
    string Title,
    string Answer,
    bool IsGuestVisible
);

public record UpdateFaqContextEntryDto(
    string ScopeType,
    string CollegeCode,
    string ProgramCode,
    string Category,
    string Title,
    string Answer,
    bool IsGuestVisible
);

