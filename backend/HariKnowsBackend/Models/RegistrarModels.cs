namespace HariKnowsBackend.Models;

public record DepartmentDto(int Id, string Name);

public record CreateDepartmentRequest(string Name);

public record RegistrarDocumentDto(int Id, string ReferenceCode, string StudentName, string Title, int DepartmentId, DateTime CreatedAt);

public record CreateRegistrarDocumentRequest(string StudentName, string Title, int DepartmentId);

public record MoveDocumentRequest(int ToDepartmentId);

public record ActivityLogDto(int Id, string Action, string Actor, DateTime CreatedAt);

public record RegistrarStateDto(
    IReadOnlyList<DepartmentDto> Departments,
    IReadOnlyList<RegistrarDocumentDto> Documents,
    IReadOnlyList<ActivityLogDto> Activity
);
