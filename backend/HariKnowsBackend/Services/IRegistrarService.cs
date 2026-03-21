using HariKnowsBackend.Models;

namespace HariKnowsBackend.Services;

public interface IRegistrarService
{
    RegistrarStateDto GetState();

    DepartmentCreateResult CreateDepartment(CreateDepartmentRequest request);

    DocumentCreateResult CreateDocument(CreateRegistrarDocumentRequest request);

    DocumentMoveResult MoveDocument(int documentId, MoveDocumentRequest request);
}

public record DepartmentCreateResult(bool Success, bool NameConflict, string? Error, DepartmentDto? Department);

public record DocumentCreateResult(bool Success, string? Error, RegistrarDocumentDto? Document);

public record DocumentMoveResult(bool Success, bool NotFound, string? Error, bool? Moved);
