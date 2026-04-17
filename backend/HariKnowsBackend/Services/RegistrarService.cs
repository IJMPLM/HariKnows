using System.Text;
using HariKnowsBackend.Data;
using HariKnowsBackend.Data.Entities;
using HariKnowsBackend.Models;
using HariKnowsBackend.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace HariKnowsBackend.Services;

public sealed class RegistrarService(IRegistrarRepository repository, IAuthService authService, HariKnowsDbContext dbContext, IFaqCsvSyncService faqCsvSyncService) : IRegistrarService
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

    public StudentDirectoryEntryDto? UpdateStudentCredentials(UpsertStudentCredentialsRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.StudentNo) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ArgumentException("Student number, email, and password are required.");
        }

        var studentNo = request.StudentNo.Trim();
        var email = request.Email.Trim().ToLowerInvariant();
        var passwordHash = authService.HashPassword(request.Password.Trim());
        var updated = repository.UpdateStudentCredentials(studentNo, email, passwordHash, DateTime.UtcNow);

        if (updated is not null)
        {
            repository.WriteActivity($"Student credentials updated: {studentNo}", "Registrar");
        }

        return updated;
    }

    public IctoAccountImportResultDto ImportIctoAccounts(IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            throw new ArgumentException("ICTO CSV file is empty.");
        }

        using var stream = file.OpenReadStream();
        using var reader = new StreamReader(stream, Encoding.UTF8, true);

        var lines = new List<string>();
        while (true)
        {
            var line = reader.ReadLine();
            if (line is null)
            {
                break;
            }

            if (!string.IsNullOrWhiteSpace(line))
            {
                lines.Add(line);
            }
        }

        if (lines.Count < 2)
        {
            throw new InvalidOperationException("ICTO CSV must contain a metadata row and a header row.");
        }

        var delimiter = DetectDelimiter(lines[0]);
        var headerRow = ParseCsvLine(lines[1], delimiter).Select(NormalizeCsvHeader).ToArray();
        if (!headerRow.Contains("studentNo", StringComparer.OrdinalIgnoreCase)
            || !headerRow.Contains("email", StringComparer.OrdinalIgnoreCase)
            || !headerRow.Contains("password", StringComparer.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("ICTO CSV must include student number, email, and password columns.");
        }

        var imported = 0;
        var updated = 0;
        var skipped = 0;
        var notFound = 0;
        var errors = new List<string>();

        for (var lineIndex = 2; lineIndex < lines.Count; lineIndex++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var cells = ParseCsvLine(lines[lineIndex], delimiter);
            if (IsBlankRow(cells))
            {
                skipped++;
                continue;
            }

            var payload = MapCsvRow(headerRow, cells);
            var studentNo = GetValue(payload, "studentNo");
            var email = GetValue(payload, "email");
            var password = GetValue(payload, "password");

            if (string.IsNullOrWhiteSpace(studentNo) || string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            {
                skipped++;
                errors.Add($"Row {lineIndex + 1}: studentNo, email, and password are required.");
                continue;
            }

            var result = UpdateStudentCredentials(new UpsertStudentCredentialsRequestDto(studentNo, email, password));
            if (result is null)
            {
                notFound++;
                errors.Add($"Row {lineIndex + 1}: student '{studentNo}' was not found.");
                continue;
            }

            imported++;
            updated++;
        }

        return new IctoAccountImportResultDto(imported, updated, skipped, notFound, errors);
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
        var normalizedScope = NormalizeFaqScopeType(request.ScopeType);
        var normalizedCategory = PromptRoleTagCategoryMapper.DeriveCategory(normalizedScope, request.Category);
        var normalizedRequest = request with
        {
            ScopeType = normalizedScope,
            Category = normalizedCategory,
            CollegeCode = string.Empty,
            ProgramCode = string.Empty
        };

        ValidateFaqRequest(normalizedRequest.ScopeType, normalizedRequest.Category, normalizedRequest.Title, normalizedRequest.Answer);
        var created = repository.CreateFaqEntry(normalizedRequest, DateTime.UtcNow);
        faqCsvSyncService.SyncFromDatabase();
        repository.WriteActivity($"FAQ/context created: {created.Title}", "Registrar");
        return created;
    }

    public FaqContextEntryDto? UpdateFaqEntry(int faqId, UpdateFaqContextEntryDto request)
    {
        var normalizedScope = NormalizeFaqScopeType(request.ScopeType);
        var normalizedCategory = PromptRoleTagCategoryMapper.DeriveCategory(normalizedScope, request.Category);
        var normalizedRequest = request with
        {
            ScopeType = normalizedScope,
            Category = normalizedCategory,
            CollegeCode = string.Empty,
            ProgramCode = string.Empty
        };

        ValidateFaqRequest(normalizedRequest.ScopeType, normalizedRequest.Category, normalizedRequest.Title, normalizedRequest.Answer);
        var updated = repository.UpdateFaqEntry(faqId, normalizedRequest, DateTime.UtcNow);
        if (updated is not null)
        {
            faqCsvSyncService.SyncFromDatabase();
            repository.WriteActivity($"FAQ/context updated: {updated.Title}", "Registrar");
        }

        return updated;
    }

    public bool DeleteFaqEntry(int faqId)
    {
        var deleted = repository.DeleteFaqEntry(faqId);
        if (deleted)
        {
            faqCsvSyncService.SyncFromDatabase();
            repository.WriteActivity($"FAQ/context deleted: {faqId}", "Registrar");
        }

        return deleted;
    }

    public IReadOnlyList<UncertainQuestionDto> GetUncertainQuestions(string? status, int limit)
    {
        var safeLimit = Math.Clamp(limit, 1, 250);
        var query = dbContext.UncertainQuestions.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            var normalizedStatus = status.Trim().ToLowerInvariant();
            query = query.Where(entry => entry.Status.ToLower() == normalizedStatus);
        }

        return query
            .OrderBy(entry => entry.Status)
            .ThenByDescending(entry => entry.CreatedAt)
            .Take(safeLimit)
            .Select(ToUncertainQuestionDto)
            .ToList();
    }

    public UncertainQuestionDto? GetUncertainQuestion(int questionId)
    {
        var question = dbContext.UncertainQuestions
            .AsNoTracking()
            .FirstOrDefault(entry => entry.Id == questionId);
        return question is null ? null : ToUncertainQuestionDto(question);
    }

    public (UncertainQuestionDto Question, FaqContextEntryDto CreatedEntry)? ResolveUncertainQuestion(int questionId, ResolveUncertainQuestionRequestDto request)
    {
        var question = dbContext.UncertainQuestions.FirstOrDefault(entry => entry.Id == questionId);
        if (question is null)
        {
            return null;
        }

        if (!string.Equals(question.Status, "open", StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Only open questions can be resolved.");
        }

        var normalizedCategory = NormalizeResolutionCategory(request.Category);
        var normalizedScope = NormalizeFaqScopeType(request.ScopeType);
        ValidateFaqRequest(normalizedScope, normalizedCategory, request.Title, request.Answer);

        var created = CreateFaqEntry(new CreateFaqContextEntryDto(
            normalizedScope,
            string.Empty,
            string.Empty,
            normalizedCategory,
            request.Title.Trim(),
            request.Answer.Trim()
        ));

        var duplicateOpenQuestions = dbContext.UncertainQuestions
            .Where(entry =>
                entry.Id != question.Id
                && entry.Status.ToLower() == "open"
                && entry.NormalizedQuestion == question.NormalizedQuestion)
            .ToList();

        if (duplicateOpenQuestions.Count > 0)
        {
            dbContext.UncertainQuestions.RemoveRange(duplicateOpenQuestions);
        }

        var now = DateTime.UtcNow;
        question.Status = "closed";
        question.ResolutionCategory = normalizedCategory;
        question.ResolutionEntryId = created.Id;
        question.ResolutionAnswer = request.Answer.Trim();
        question.ResolvedAt = now;
        question.UpdatedAt = now;
        dbContext.SaveChanges();

        repository.WriteActivity($"Question {question.Id} resolved to {normalizedCategory} entry {created.Id}", "Registrar");

        return (ToUncertainQuestionDto(question), created);
    }

    public UncertainQuestionDto? CloseUncertainQuestion(int questionId, CloseUncertainQuestionRequestDto request)
    {
        var question = dbContext.UncertainQuestions.FirstOrDefault(entry => entry.Id == questionId);
        if (question is null)
        {
            return null;
        }

        if (!string.Equals(question.Status, "open", StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Only open questions can be closed.");
        }

        var now = DateTime.UtcNow;
        question.Status = "closed";
        question.ResolutionCategory = "closed-without-entry";
        question.ResolutionEntryId = null;
        question.ResolutionAnswer = request.Notes?.Trim() ?? string.Empty;
        question.ResolvedAt = now;
        question.UpdatedAt = now;
        dbContext.SaveChanges();

        repository.WriteActivity($"Question {question.Id} closed without creating entry", "Registrar");

        return ToUncertainQuestionDto(question);
    }

    private static UncertainQuestionDto ToUncertainQuestionDto(UncertainQuestion entry)
    {
        return new UncertainQuestionDto(
            entry.Id,
            entry.ConversationId,
            entry.StudentNo,
            entry.CollegeCode,
            entry.ProgramCode,
            entry.QuestionText,
            entry.Routing,
            entry.Confidence,
            entry.Status,
            entry.ResolutionCategory,
            entry.ResolutionEntryId,
            entry.CreatedAt,
            entry.UpdatedAt,
            entry.ResolvedAt
        );
    }

    private static string NormalizeResolutionCategory(string category)
    {
        var normalized = category.Trim().ToLowerInvariant();
        if (normalized == "faq")
        {
            return "faq";
        }

        return string.IsNullOrWhiteSpace(normalized) ? "context" : normalized;
    }

    private static string NormalizeFaqScopeType(string scopeType)
    {
        var normalized = PromptRoleTags.Normalize(scopeType);
        if (string.IsNullOrWhiteSpace(normalized) || !PromptRoleTags.IsValid(normalized))
        {
            throw new ArgumentException("A valid prompt role tag is required.");
        }

        return normalized;
    }

    private static void ValidateFaqRequest(string scopeType, string category, string title, string answer)
    {
        if (string.IsNullOrWhiteSpace(scopeType) || string.IsNullOrWhiteSpace(category) || string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(answer))
        {
            throw new ArgumentException("Prompt role tag, category, title, and answer are required.");
        }

        if (!PromptRoleTags.IsValid(scopeType))
        {
            throw new ArgumentException($"Invalid prompt role tag '{scopeType}'.");
        }
    }

    private static Dictionary<string, string> MapCsvRow(IReadOnlyList<string> headers, IReadOnlyList<string> row)
    {
        var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        for (var i = 0; i < headers.Count; i++)
        {
            var key = headers[i];
            if (string.IsNullOrWhiteSpace(key))
            {
                continue;
            }

            map[key] = i < row.Count ? row[i].Trim() : string.Empty;
        }

        return map;
    }

    private static string NormalizeCsvHeader(string input)
    {
        return NormalizeTag(input) switch
        {
            "STUDENTNO" or "STUDENTNUMBER" or "STUDENTNO." => "studentNo",
            "EMAIL" or "EMAILADDRESS" or "PLMEMAIL" => "email",
            "PASSWORD" or "PASS" or "ICTOPASSWORD" or "STUDENTPASSWORD" => "password",
            _ => string.Empty
        };
    }

    private static char DetectDelimiter(string line)
    {
        var comma = line.Count(c => c == ',');
        var semicolon = line.Count(c => c == ';');
        var tab = line.Count(c => c == '\t');
        return tab >= comma && tab >= semicolon ? '\t' : semicolon > comma ? ';' : ',';
    }

    private static List<string> ParseCsvLine(string line, char delimiter)
    {
        var values = new List<string>();
        var builder = new StringBuilder();
        var inQuotes = false;

        for (var i = 0; i < line.Length; i++)
        {
            var current = line[i];

            if (current == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    builder.Append('"');
                    i++;
                    continue;
                }

                inQuotes = !inQuotes;
                continue;
            }

            if (current == delimiter && !inQuotes)
            {
                values.Add(builder.ToString());
                builder.Clear();
                continue;
            }

            builder.Append(current);
        }

        values.Add(builder.ToString());
        return values;
    }

    private static bool IsBlankRow(IReadOnlyList<string> row)
    {
        return row.All(cell => string.IsNullOrWhiteSpace(cell));
    }

    private static string GetValue(IReadOnlyDictionary<string, string> map, string key)
    {
        return map.TryGetValue(key, out var value) ? value : string.Empty;
    }

    private static string NormalizeTag(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var builder = new StringBuilder(value.Length);
        foreach (var ch in value.Trim().ToUpperInvariant())
        {
            if (char.IsLetterOrDigit(ch))
            {
                builder.Append(ch);
            }
        }

        return builder.ToString();
    }
}
