using HariKnowsBackend.Models;
using HariKnowsBackend.Repositories;
using Microsoft.Data.Sqlite;

namespace HariKnowsBackend.Services;

public sealed class RegistrarService(IRegistrarRepository repository) : IRegistrarService
{
    private static readonly HashSet<string> TerminalRequestStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "claimed",
        "disposed"
    };

    public RegistrarStateDto GetState()
    {
        var departments = repository.GetDepartments();
        var documents = repository.GetDocuments();
        var activity = repository.GetActivity(60);
        var catalog = new RegistrarCatalogDto(repository.GetCollegesWithPrograms(), departments);

        return new RegistrarStateDto(departments, documents, activity, catalog);
    }

    public RegistrarCatalogDto GetCatalog()
    {
        var departments = repository.GetDepartments();
        var colleges = repository.GetCollegesWithPrograms();
        return new RegistrarCatalogDto(colleges, departments);
    }

    public CollegeMutationResult CreateCollege(CreateCollegeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return new CollegeMutationResult(false, false, false, "College name is required.", null);
        }

        var name = request.Name.Trim();

        try
        {
            var college = repository.CreateCollege(name);
            repository.WriteActivity($"College created: {name}", "Admin");
            return new CollegeMutationResult(true, false, false, null, college);
        }
        catch (SqliteException ex) when (ex.SqliteErrorCode == 19)
        {
            return new CollegeMutationResult(false, true, false, "College name already exists.", null);
        }
    }

    public CollegeMutationResult UpdateCollege(int collegeId, UpdateCollegeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return new CollegeMutationResult(false, false, false, "College name is required.", null);
        }

        var name = request.Name.Trim();

        try
        {
            var college = repository.UpdateCollege(collegeId, name);
            if (college is null)
            {
                return new CollegeMutationResult(false, false, true, "College not found.", null);
            }

            repository.WriteActivity($"College updated: {name}", "Admin");
            return new CollegeMutationResult(true, false, false, null, college);
        }
        catch (SqliteException ex) when (ex.SqliteErrorCode == 19)
        {
            return new CollegeMutationResult(false, true, false, "College name already exists.", null);
        }
    }

    public MutationResult DeleteCollege(int collegeId)
    {
        var removed = repository.DeleteCollege(collegeId);
        if (!removed)
        {
            return new MutationResult(false, true, "College not found.");
        }

        repository.WriteActivity($"College deleted: {collegeId}", "Admin");
        return new MutationResult(true, false, null);
    }

    public ProgramMutationResult CreateProgram(int collegeId, CreateProgramRequest request)
    {
        if (!repository.CollegeExists(collegeId))
        {
            return new ProgramMutationResult(false, false, true, "College not found.", null);
        }

        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Code) || string.IsNullOrWhiteSpace(request.Group))
        {
            return new ProgramMutationResult(false, false, false, "Name, code, and group are required.", null);
        }

        try
        {
            var program = repository.CreateProgram(collegeId, request.Name.Trim(), request.Code.Trim(), request.Group.Trim());
            repository.WriteActivity($"Program created: {program.Code} - {program.Name}", "Admin");
            return new ProgramMutationResult(true, false, false, null, program);
        }
        catch (SqliteException ex) when (ex.SqliteErrorCode == 19)
        {
            return new ProgramMutationResult(false, true, false, "Program code or name already exists for this college.", null);
        }
    }

    public ProgramMutationResult UpdateProgram(int programId, UpdateProgramRequest request)
    {
        if (!repository.CollegeExists(request.CollegeId))
        {
            return new ProgramMutationResult(false, false, true, "Target college not found.", null);
        }

        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Code) || string.IsNullOrWhiteSpace(request.Group))
        {
            return new ProgramMutationResult(false, false, false, "Name, code, and group are required.", null);
        }

        try
        {
            var program = repository.UpdateProgram(programId, request.CollegeId, request.Name.Trim(), request.Code.Trim(), request.Group.Trim());
            if (program is null)
            {
                return new ProgramMutationResult(false, false, true, "Program not found.", null);
            }

            repository.WriteActivity($"Program updated: {program.Code} - {program.Name}", "Admin");
            return new ProgramMutationResult(true, false, false, null, program);
        }
        catch (SqliteException ex) when (ex.SqliteErrorCode == 19)
        {
            return new ProgramMutationResult(false, true, false, "Program code or name already exists for this college.", null);
        }
    }

    public MutationResult DeleteProgram(int programId)
    {
        var removed = repository.DeleteProgram(programId);
        if (!removed)
        {
            return new MutationResult(false, true, "Program not found.");
        }

        repository.WriteActivity($"Program deleted: {programId}", "Admin");
        return new MutationResult(true, false, null);
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

    public IReadOnlyList<StudentDirectoryEntryDto> SearchStudents(string? query, int limit)
    {
        return repository.SearchStudents(query, limit);
    }

    public IReadOnlyList<StudentDocumentRequestDto> GetStudentRequests(string? studentNo, string? status, int limit)
    {
        return repository.GetStudentRequests(studentNo, status, limit);
    }

    public StudentDocumentRequestDto CreateStudentRequest(CreateStudentDocumentRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.StudentNo) || string.IsNullOrWhiteSpace(request.DocumentType))
        {
            throw new ArgumentException("Student number and document type are required.");
        }

        var student = repository.SearchStudents(request.StudentNo, 1).FirstOrDefault();
        if (student is null || !string.Equals(student.StudentNo, request.StudentNo.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Student not found.");
        }

        if (!repository.DepartmentExists(request.DepartmentId))
        {
            throw new ArgumentException("Department does not exist.");
        }

        var now = DateTime.UtcNow;
        var requestCode = $"REQ-{now:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";
        var created = repository.CreateStudentRequest(student.StudentNo, student.FullName, request.DocumentType.Trim(), request.DepartmentId, request.Notes?.Trim() ?? string.Empty, now, requestCode);
        repository.WriteActivity($"Student request created: {created.RequestCode} for {created.StudentNo}", "Registrar");
        return created;
    }

    public RequestStatusMutationResult UpdateStudentRequestStatus(int requestId, UpdateStudentDocumentStatusDto request)
    {
        var existing = repository.GetStudentRequest(requestId);
        if (existing is null)
        {
            return new RequestStatusMutationResult(false, true, false, "Request not found.", null);
        }

        var nextStatus = request.Status.Trim().ToLowerInvariant();
        var currentStatus = existing.Status.Trim().ToLowerInvariant();
        var allowed = nextStatus switch
        {
            "requested" => currentStatus is "requested",
            "prepared" => currentStatus is "requested",
            "claimed" => currentStatus is "prepared",
            "disposed" => currentStatus is "requested" or "prepared",
            _ => false
        };

        if (!allowed)
        {
            return new RequestStatusMutationResult(false, false, true, $"Invalid transition from '{existing.Status}' to '{request.Status}'.", null);
        }

        if (nextStatus == "disposed" && string.IsNullOrWhiteSpace(request.DisposedReason))
        {
            return new RequestStatusMutationResult(false, false, true, "Disposed requests require a reason.", null);
        }

        var updated = repository.UpdateStudentRequestStatus(requestId, nextStatus, request.HandledBy, request.DisposedReason, request.Notes, DateTime.UtcNow);
        if (updated is null)
        {
            return new RequestStatusMutationResult(false, true, false, "Request not found.", null);
        }

        repository.WriteActivity($"Request {updated.RequestCode} marked {updated.Status}", request.HandledBy?.Trim() ?? "Registrar");
        return new RequestStatusMutationResult(true, false, false, null, updated);
    }

    public IReadOnlyList<FaqContextEntryDto> GetFaqEntries(string? scopeType, string? collegeCode, string? programCode, bool includeUnpublished, int limit)
    {
        return repository.GetFaqEntries(scopeType, collegeCode, programCode, includeUnpublished, limit);
    }

    public FaqContextEntryDto? GetFaqEntry(int faqId)
    {
        return repository.GetFaqEntry(faqId);
    }

    public FaqContextEntryDto CreateFaqEntry(CreateFaqContextEntryDto request)
    {
        ValidateFaqRequest(request.ScopeType, request.Category, request.Title, request.Answer);
        var created = repository.CreateFaqEntry(request, DateTime.UtcNow);
        repository.WriteActivity($"FAQ/context created: {created.Title}", "Registrar");
        return created;
    }

    public FaqContextEntryDto? UpdateFaqEntry(int faqId, UpdateFaqContextEntryDto request)
    {
        ValidateFaqRequest(request.ScopeType, request.Category, request.Title, request.Answer);
        var updated = repository.UpdateFaqEntry(faqId, request, DateTime.UtcNow);
        if (updated is not null)
        {
            repository.WriteActivity($"FAQ/context updated: {updated.Title}", "Registrar");
        }

        return updated;
    }

    public bool DeleteFaqEntry(int faqId)
    {
        var deleted = repository.DeleteFaqEntry(faqId);
        if (deleted)
        {
            repository.WriteActivity($"FAQ/context deleted: {faqId}", "Registrar");
        }

        return deleted;
    }

    private static void ValidateFaqRequest(string scopeType, string category, string title, string answer)
    {
        if (string.IsNullOrWhiteSpace(scopeType) || string.IsNullOrWhiteSpace(category) || string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(answer))
        {
            throw new ArgumentException("Scope, category, title, and answer are required.");
        }
    }
}
