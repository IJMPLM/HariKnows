namespace HariKnowsBackend.Models;

public record DepartmentDto(int Id, string Name);

public record ProgramDto(int Id, string Name, string Code, string Group);

public record CollegeDto(int Id, string Name, IReadOnlyList<ProgramDto> Programs);

public record RegistrarCatalogDto(IReadOnlyList<CollegeDto> Colleges, IReadOnlyList<DepartmentDto> Departments);

public record CreateDepartmentRequest(string Name);

public record CreateCollegeRequest(string Name);

public record UpdateCollegeRequest(string Name);

public record CreateProgramRequest(string Name, string Code, string Group);

public record UpdateProgramRequest(string Name, string Code, string Group, int CollegeId);

public record RegistrarDocumentDto(int Id, string ReferenceCode, string StudentName, string Title, int DepartmentId, DateTime CreatedAt);

public record CreateRegistrarDocumentRequest(string StudentName, string Title, int DepartmentId);

public record MoveDocumentRequest(int ToDepartmentId);

public record ActivityLogDto(int Id, string Action, string Actor, DateTime CreatedAt);

public record RegistrarStateDto(
    IReadOnlyList<DepartmentDto> Departments,
    IReadOnlyList<RegistrarDocumentDto> Documents,
    IReadOnlyList<ActivityLogDto> Activity,
    RegistrarCatalogDto Catalog
);
