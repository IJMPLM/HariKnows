using HariKnowsBackend.Models;

namespace HariKnowsBackend.Services;

public interface IRegistrarService
{
    RegistrarStateDto GetState();

    RegistrarCatalogDto GetCatalog();

    CollegeMutationResult CreateCollege(CreateCollegeRequest request);

    CollegeMutationResult UpdateCollege(int collegeId, UpdateCollegeRequest request);

    MutationResult DeleteCollege(int collegeId);

    ProgramMutationResult CreateProgram(int collegeId, CreateProgramRequest request);

    ProgramMutationResult UpdateProgram(int programId, UpdateProgramRequest request);

    MutationResult DeleteProgram(int programId);

    DepartmentCreateResult CreateDepartment(CreateDepartmentRequest request);

    DocumentCreateResult CreateDocument(CreateRegistrarDocumentRequest request);

    DocumentMoveResult MoveDocument(int documentId, MoveDocumentRequest request);
}

public record DepartmentCreateResult(bool Success, bool NameConflict, string? Error, DepartmentDto? Department);

public record CollegeMutationResult(bool Success, bool NameConflict, bool NotFound, string? Error, CollegeDto? College);

public record ProgramMutationResult(bool Success, bool NameConflict, bool NotFound, string? Error, ProgramDto? Program);

public record MutationResult(bool Success, bool NotFound, string? Error);

public record DocumentCreateResult(bool Success, string? Error, RegistrarDocumentDto? Document);

public record DocumentMoveResult(bool Success, bool NotFound, string? Error, bool? Moved);
