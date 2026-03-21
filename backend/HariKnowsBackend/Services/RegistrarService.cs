using HariKnowsBackend.Models;
using HariKnowsBackend.Repositories;
using Microsoft.Data.Sqlite;

namespace HariKnowsBackend.Services;

public sealed class RegistrarService(IRegistrarRepository repository) : IRegistrarService
{
    public RegistrarStateDto GetState()
    {
        var departments = repository.GetDepartments();
        var documents = repository.GetDocuments();
        var activity = repository.GetActivity(60);

        return new RegistrarStateDto(departments, documents, activity);
    }

    public DepartmentCreateResult CreateDepartment(CreateDepartmentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return new DepartmentCreateResult(false, false, "Department name is required.", null);
        }

        var name = request.Name.Trim();

        try
        {
            var department = repository.CreateDepartment(name);
            repository.WriteActivity($"Department created: {name}", "Admin");
            return new DepartmentCreateResult(true, false, null, department);
        }
        catch (SqliteException ex) when (ex.SqliteErrorCode == 19)
        {
            return new DepartmentCreateResult(false, true, "Department name already exists.", null);
        }
    }

    public DocumentCreateResult CreateDocument(CreateRegistrarDocumentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.StudentName) || string.IsNullOrWhiteSpace(request.Title))
        {
            return new DocumentCreateResult(false, "Student name and title are required.", null);
        }

        if (!repository.DepartmentExists(request.DepartmentId))
        {
            return new DocumentCreateResult(false, "Department does not exist.", null);
        }

        var studentName = request.StudentName.Trim();
        var title = request.Title.Trim();
        var createdAt = DateTime.UtcNow;
        var code = $"#S-{Random.Shared.Next(10000, 99999)}";

        var document = repository.CreateDocument(studentName, title, request.DepartmentId, code, createdAt);
        repository.WriteActivity($"New document created: {code} for {studentName}", "System");

        return new DocumentCreateResult(true, null, document);
    }

    public DocumentMoveResult MoveDocument(int documentId, MoveDocumentRequest request)
    {
        var (fromDepartmentId, referenceCode) = repository.GetDocumentLocation(documentId);

        if (!fromDepartmentId.HasValue)
        {
            return new DocumentMoveResult(false, true, "Document not found.", null);
        }

        var targetDepartmentName = repository.GetDepartmentName(request.ToDepartmentId);
        if (string.IsNullOrWhiteSpace(targetDepartmentName))
        {
            return new DocumentMoveResult(false, false, "Target department does not exist.", null);
        }

        if (fromDepartmentId.Value == request.ToDepartmentId)
        {
            return new DocumentMoveResult(true, false, null, false);
        }

        repository.MoveDocument(documentId, request.ToDepartmentId, DateTime.UtcNow);
        repository.WriteActivity($"Document {referenceCode} moved to {targetDepartmentName}", "Admin");

        return new DocumentMoveResult(true, false, null, true);
    }
}
