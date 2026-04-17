using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using System.Text.Json;
using HariKnowsBackend.Data;
using HariKnowsBackend.Data.Entities;
using HariKnowsBackend.Models;
using HariKnowsBackend.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;

namespace HariKnowsBackend.Services;

public sealed class RegistrarEtlService(HariKnowsDbContext db, IConfiguration configuration, IHostEnvironment hostEnvironment, IAuthService authService, IFaqCsvSyncService faqCsvSyncService) : IRegistrarEtlService
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
    private sealed record ParsedStagingRow(int SourceRowNumber, Dictionary<string, string> Data);
    private static readonly Dictionary<string, string> ProgramToCollegeMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["BSCS"] = "CT",
        ["BSIT"] = "CT",
        ["BSN"] = "CN",
        ["BSA"] = "CA"
    };

    public async Task<BulkUploadResultDto> BulkUploadAsync(IReadOnlyList<IFormFile> files, IReadOnlyList<string> incompleteFiles, CancellationToken cancellationToken)
    {
        if (files.Count == 0)
        {
            throw new ArgumentException("At least one CSV file is required.");
        }

        var batchId = Guid.NewGuid().ToString("N");
        var now = DateTime.UtcNow;

        db.EtlUploadBatches.Add(new EtlUploadBatch
        {
            BatchId = batchId,
            CreatedAt = now,
            Status = "staged"
        });

        var fileResults = new List<EtlFileResultDto>();
        var errors = new List<EtlErrorDto>();
        var stagedRows = new List<EtlStagingRow>();
        var incompleteSet = incompleteFiles
            .Select(f => f.Trim())
            .Where(f => !string.IsNullOrWhiteSpace(f))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var file in files)
        {
            try
            {
                using var stream = file.OpenReadStream();
                using var reader = new StreamReader(stream, Encoding.UTF8, true);
                var allLines = new List<string>();

                while (true)
                {
                    var line = await reader.ReadLineAsync(cancellationToken);
                    if (line is null)
                    {
                        break;
                    }

                    allLines.Add(line);
                }

                if (allLines.Count < 2)
                {
                    throw new InvalidOperationException("CSV must contain metadata row and header row.");
                }

                var delimiter = DetectDelimiter(allLines);
                var metadata = ParseCsvLine(allLines[0], delimiter).Select(x => x.Trim()).ToArray();
                var category = ResolveCategory(metadata, allLines, file.FileName, delimiter);
                var (sourceCollegeCode, sourceProgramCode) = ResolveAcademicCodes(metadata, file.FileName);
                var scopeKey = BuildScopeKey(category, sourceCollegeCode, sourceProgramCode, metadata, file.FileName);
                var parsed = ParseRowsForCategory(category, metadata, allLines, sourceCollegeCode, sourceProgramCode, delimiter);

                var obsoleteEntries = await db.EtlUploadFiles
                    .Where(f => f.IsActive && f.ScopeKey == scopeKey)
                    .ToListAsync(cancellationToken);
                foreach (var obsolete in obsoleteEntries)
                {
                    obsolete.IsActive = false;
                    obsolete.Status = "archived";
                }

                var isIncomplete = incompleteSet.Contains(file.FileName);
                var lifecycleStatus = isIncomplete ? "active-incomplete" : "active";

                foreach (var parsedRow in parsed)
                {
                    var studentNo = GetValue(parsedRow.Data, "studentNo");
                    stagedRows.Add(new EtlStagingRow
                    {
                        BatchId = batchId,
                        Category = category,
                        FileName = file.FileName,
                        SourceRowNumber = parsedRow.SourceRowNumber,
                        StudentNo = studentNo,
                        PayloadJson = JsonSerializer.Serialize(parsedRow.Data),
                        Status = "staged",
                        ConflictNote = string.Empty,
                        Error = string.Empty
                    });
                }

                db.EtlUploadFiles.Add(new EtlUploadFile
                {
                    BatchId = batchId,
                    FileName = file.FileName,
                    Category = category,
                    CollegeCode = sourceCollegeCode,
                    ProgramCode = sourceProgramCode,
                    ScopeKey = scopeKey,
                    IsActive = true,
                    IsIncomplete = isIncomplete,
                    ParsedRows = parsed.Count,
                    Status = lifecycleStatus,
                    Error = string.Empty,
                    ParsedAt = now
                });

                fileResults.Add(new EtlFileResultDto(file.FileName, category, parsed.Count, lifecycleStatus, string.Empty));
            }
            catch (Exception ex)
            {
                errors.Add(new EtlErrorDto(file.FileName, 0, ex.Message));
                db.EtlUploadFiles.Add(new EtlUploadFile
                {
                    BatchId = batchId,
                    FileName = file.FileName,
                    Category = "unknown",
                    CollegeCode = string.Empty,
                    ProgramCode = string.Empty,
                    ScopeKey = BuildScopeKey("unknown", string.Empty, string.Empty, [], file.FileName),
                    IsActive = false,
                    IsIncomplete = incompleteSet.Contains(file.FileName),
                    ParsedRows = 0,
                    Status = "error",
                    Error = ex.Message,
                    ParsedAt = now
                });
                fileResults.Add(new EtlFileResultDto(file.FileName, "unknown", 0, "error", ex.Message));
            }
        }

        var stagedStudentNos = stagedRows
            .Where(r => r.Category == "students" && !string.IsNullOrWhiteSpace(r.StudentNo))
            .Select(r => r.StudentNo)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var referencedStudentNos = stagedRows
            .Where(r => !string.IsNullOrWhiteSpace(r.StudentNo))
            .Select(r => r.StudentNo)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var existingStudentNos = await db.StudentMasters.AsNoTracking()
            .Where(s => referencedStudentNos.Contains(s.StudentNo))
            .Select(s => s.StudentNo)
            .ToListAsync(cancellationToken);

        var existingSet = existingStudentNos.ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var row in stagedRows)
        {
            if (string.IsNullOrWhiteSpace(row.StudentNo))
            {
                continue;
            }

            if (row.Category == "students" && existingSet.Contains(row.StudentNo))
            {
                row.Status = "conflict";
                row.ConflictNote = "Student already exists in masterlist. Review before commit.";
                continue;
            }

            if (RequiresStudentReference(row.Category)
                && !existingSet.Contains(row.StudentNo)
                && !stagedStudentNos.Contains(row.StudentNo))
            {
                row.Status = "missing-student";
                row.ConflictNote = "No student masterlist reference found for this student number.";
            }
        }

        if (stagedRows.Count > 0)
        {
            db.EtlStagingRows.AddRange(stagedRows);
        }

        await db.SaveChangesAsync(cancellationToken);

        var conflicts = stagedRows
            .Where(r => r.Status is "conflict" or "missing-student")
            .Select(r => new EtlConflictDto(r.Id, r.FileName, r.StudentNo, r.ConflictNote))
            .ToList();

        var staging = await GetStagingAsync(batchId, cancellationToken)
            ?? new EtlStagingDashboardDto([], [], [], [], [], [], [], [], [], []);

        return new BulkUploadResultDto(batchId, staging, fileResults, conflicts, errors);
    }

    public async Task<FaqImportResultDto> ImportFaqTextAsync(IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            throw new ArgumentException("FAQ file is empty.");
        }

        using var stream = file.OpenReadStream();
        using var reader = new StreamReader(stream, Encoding.UTF8, true);
        var content = await reader.ReadToEndAsync();
        var entries = ParseFaqCsv(content);
        if (entries.Count == 0)
        {
            throw new InvalidOperationException("No FAQ entries were found in the CSV file.");
        }

        var now = DateTime.UtcNow;
        var imported = 0;
        var updated = 0;
        var skipped = 0;

        foreach (var request in entries)
        {
            if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Answer))
            {
                skipped++;
                continue;
            }

            var normalizedScope = NormalizeFaqScopeType(request.ScopeType);
            var normalizedCollege = string.Empty;
            var normalizedProgram = string.Empty;
            var normalizedCategory = PromptRoleTagCategoryMapper.DeriveCategory(normalizedScope, request.Category);
            var normalizedTitle = request.Title.Trim();

            var existing = await db.FaqContextEntries.FirstOrDefaultAsync(entry =>
                entry.ScopeType == normalizedScope &&
                entry.CollegeCode == normalizedCollege &&
                entry.ProgramCode == normalizedProgram &&
                entry.Category == normalizedCategory &&
                entry.Question == normalizedTitle,
                cancellationToken);

            if (existing is null)
            {
                db.FaqContextEntries.Add(new FaqContextEntry
                {
                    ScopeType = normalizedScope,
                    CollegeCode = normalizedCollege,
                    ProgramCode = normalizedProgram,
                    Category = normalizedCategory,
                    Question = normalizedTitle,
                    Answer = request.Answer.Trim(),
                    CreatedAt = now,
                    UpdatedAt = now
                });
                imported++;
                continue;
            }

            existing.ScopeType = normalizedScope;
            existing.CollegeCode = string.Empty;
            existing.ProgramCode = string.Empty;
            existing.Category = normalizedCategory;
            existing.Question = normalizedTitle;
            existing.Answer = request.Answer.Trim();
            existing.UpdatedAt = now;
            updated++;
        }

        await db.SaveChangesAsync(cancellationToken);
        faqCsvSyncService.SyncFromDatabase();
        return new FaqImportResultDto(imported, updated, skipped);
    }

    public FaqCsvSyncResultDto SyncFaqCsv()
    {
        return faqCsvSyncService.SyncFromDatabase();
    }

    public async Task<EtlCommitResultDto> CommitAsync(CommitEtlRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.BatchId))
        {
            throw new ArgumentException("BatchId is required.");
        }

        var decisions = request.Decisions.ToDictionary(d => d.StagingId, d => d.Action.Trim().ToLowerInvariant());
        var rows = (await db.EtlStagingRows
            .Where(r => r.BatchId == request.BatchId && r.Status != "committed")
            .ToListAsync(cancellationToken))
            .OrderBy(r => GetCategoryCommitPriority(r.Category))
            .ThenBy(r => r.Id)
            .ToList();

        var inserted = 0;
        var updated = 0;
        var skipped = 0;
        var errors = 0;

        foreach (var row in rows)
        {
            var action = decisions.TryGetValue(row.Id, out var explicitAction)
                ? explicitAction
                : row.Status == "missing-student" ? "skip" : "merge";

            if (action == "skip")
            {
                row.Status = "skipped";
                skipped++;
                continue;
            }

            try
            {
                var payload = JsonSerializer.Deserialize<Dictionary<string, string>>(row.PayloadJson, JsonOptions)
                    ?? new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

                switch (row.Category)
                {
                    case "departments":
                        await UpsertDepartmentAsync(payload, cancellationToken);
                        break;
                    case "students":
                        await UpsertStudentAsync(payload, cancellationToken);
                        break;
                    case "admissions":
                        await UpdateStudentStatusAsync(payload, "admissions", cancellationToken);
                        break;
                    case "discipline":
                        await UpdateStudentStatusAsync(payload, "discipline", cancellationToken);
                        break;
                    case "service":
                        await UpdateStudentStatusAsync(payload, "service", cancellationToken);
                        break;
                    case "technology":
                        await UpdateStudentStatusAsync(payload, "technology", cancellationToken);
                        break;
                    case "thesis":
                        await UpdateStudentStatusAsync(payload, "thesis", cancellationToken);
                        break;
                    case "curriculums":
                        await UpsertCurriculumAsync(payload, cancellationToken);
                        break;
                    case "grades":
                        await UpsertGradeRecordAsync(payload, cancellationToken);
                        break;
                    case "syllabi":
                        await UpsertSyllabusEntryAsync(payload, cancellationToken);
                        break;
                    default:
                        throw new InvalidOperationException($"Unsupported staging category: {row.Category}");
                }

                row.Status = "committed";
                if (action == "merge")
                {
                    updated++;
                }
                else
                {
                    inserted++;
                }
            }
            catch (Exception ex)
            {
                row.Status = "error";
                row.Error = ex.Message;
                errors++;
            }
        }

        var batch = await db.EtlUploadBatches.FirstOrDefaultAsync(b => b.BatchId == request.BatchId, cancellationToken);
        if (batch is not null)
        {
            batch.Status = errors > 0 ? "partial" : "committed";
        }

        await db.SaveChangesAsync(cancellationToken);
        return new EtlCommitResultDto(inserted, updated, skipped, errors);
    }

    public async Task<EtlStagingDashboardDto?> GetStagingAsync(string batchId, CancellationToken cancellationToken)
    {
        var rows = await db.EtlStagingRows
            .AsNoTracking()
            .Where(r => r.BatchId == batchId)
            .OrderBy(r => r.FileName)
            .ThenBy(r => r.SourceRowNumber)
            .ToListAsync(cancellationToken);

        if (rows.Count == 0)
        {
            return null;
        }

        IReadOnlyList<EtlRowDto> MapCategory(string category) => rows
            .Where(r => r.Category == category)
            .Select(r => new EtlRowDto(
                r.Id,
                r.Category,
                r.FileName,
                r.SourceRowNumber,
                r.Status,
                r.ConflictNote,
                r.Error,
                JsonSerializer.Deserialize<Dictionary<string, string>>(r.PayloadJson, JsonOptions)
                    ?? new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            ))
            .ToList();

        return new EtlStagingDashboardDto(
            Departments: MapCategory("departments"),
            Admissions: MapCategory("admissions"),
            Discipline: MapCategory("discipline"),
            Service: MapCategory("service"),
            Technology: MapCategory("technology"),
            Students: MapCategory("students"),
            Grades: MapCategory("grades"),
            Curriculums: MapCategory("curriculums"),
            Syllabi: MapCategory("syllabi"),
            Thesis: MapCategory("thesis")
        );
    }

    public async Task<IReadOnlyList<EtlUploadHistoryEntryDto>> GetUploadHistoryAsync(int limit, CancellationToken cancellationToken)
    {
        var safeLimit = Math.Clamp(limit, 1, 500);
        var rows = await db.EtlUploadFiles
            .AsNoTracking()
            .OrderByDescending(f => f.ParsedAt)
            .ThenByDescending(f => f.Id)
            .Take(safeLimit)
            .ToListAsync(cancellationToken);

        return rows.Select(f =>
        {
            var (collegeCode, programCode) = ResolveAcademicCodes([], f.FileName);
            return new EtlUploadHistoryEntryDto(
                f.BatchId,
                f.FileName,
                f.Category,
                string.IsNullOrWhiteSpace(f.CollegeCode) ? collegeCode : f.CollegeCode,
                string.IsNullOrWhiteSpace(f.ProgramCode) ? programCode : f.ProgramCode,
                f.ParsedRows,
                f.Status,
                f.IsActive,
                f.IsIncomplete,
                f.Error,
                f.ParsedAt
            );
        }).ToList();
    }

    public async Task<IReadOnlyList<CollegeTabDto>> GetAvailableCollegeTabsAsync(CancellationToken cancellationToken)
    {
        var detectedCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        var storedCollegeCodes = await db.StudentMasters
            .AsNoTracking()
            .Where(s => !string.IsNullOrWhiteSpace(s.CollegeCode))
            .Select(s => s.CollegeCode)
            .Distinct()
            .ToListAsync(cancellationToken);
        foreach (var code in storedCollegeCodes)
        {
            detectedCodes.Add(code.Trim().ToUpperInvariant());
        }

        var curriculumCollegeCodes = await db.CurriculumCourses
            .AsNoTracking()
            .Where(c => !string.IsNullOrWhiteSpace(c.CollegeCode))
            .Select(c => c.CollegeCode)
            .Distinct()
            .ToListAsync(cancellationToken);
        foreach (var code in curriculumCollegeCodes)
        {
            detectedCodes.Add(code.Trim().ToUpperInvariant());
        }

        var gradeCollegeCodes = await db.GradeRecords
            .AsNoTracking()
            .Where(g => !string.IsNullOrWhiteSpace(g.CollegeCode))
            .Select(g => g.CollegeCode)
            .Distinct()
            .ToListAsync(cancellationToken);
        foreach (var code in gradeCollegeCodes)
        {
            detectedCodes.Add(code.Trim().ToUpperInvariant());
        }

        var syllabusCollegeCodes = await db.SyllabusEntries
            .AsNoTracking()
            .Where(s => !string.IsNullOrWhiteSpace(s.CollegeCode))
            .Select(s => s.CollegeCode)
            .Distinct()
            .ToListAsync(cancellationToken);
        foreach (var code in syllabusCollegeCodes)
        {
            detectedCodes.Add(code.Trim().ToUpperInvariant());
        }

        foreach (var csvFile in EnumerateCsvDataFiles())
        {
            var fileName = Path.GetFileName(csvFile);
            var (_, programCode) = ResolveAcademicCodes([], fileName);
            var mappedCollege = ResolveCollegeFromProgram(programCode);
            if (!string.IsNullOrWhiteSpace(mappedCollege))
            {
                detectedCodes.Add(mappedCollege);
            }
        }

        var knownTabs = new[]
        {
            new CollegeTabDto("CT", "CT", "/ct"),
            new CollegeTabDto("CN", "CN", "/cn"),
            new CollegeTabDto("CA", "CA", "/ca")
        };

        return knownTabs.Where(t => detectedCodes.Contains(t.Code)).OrderBy(t => t.Code).ToList();
    }

    public async Task<bool> ClearStagingAsync(string batchId, CancellationToken cancellationToken)
    {
        var rows = await db.EtlStagingRows.Where(r => r.BatchId == batchId).ToListAsync(cancellationToken);
        var files = await db.EtlUploadFiles.Where(f => f.BatchId == batchId).ToListAsync(cancellationToken);
        var batch = await db.EtlUploadBatches.FirstOrDefaultAsync(b => b.BatchId == batchId, cancellationToken);

        if (rows.Count == 0 && files.Count == 0 && batch is null)
        {
            return false;
        }

        if (rows.Count > 0)
        {
            db.EtlStagingRows.RemoveRange(rows);
        }

        if (files.Count > 0)
        {
            db.EtlUploadFiles.RemoveRange(files);
        }

        if (batch is not null)
        {
            db.EtlUploadBatches.Remove(batch);
        }

        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<FlushDatabaseResultDto> FlushDatabaseAsync(FlushDatabaseRequest request, CancellationToken cancellationToken)
    {
        if (!string.Equals(request.Confirmation?.Trim(), "FLUSH", StringComparison.Ordinal))
        {
            throw new ArgumentException("Confirmation token mismatch. Enter FLUSH to continue.");
        }

        // Delete in order of foreign key dependencies (reverse of creation order)
        // StudentDocumentRequests must be deleted before Departments (has FK to Dept with Restrict)
        var deletedStudentRequests = await db.StudentDocumentRequests.ExecuteDeleteAsync(cancellationToken);
        var deletedGeminiChats = await db.GeminiChats.ExecuteDeleteAsync(cancellationToken);
        var deletedFaqEntries = await db.FaqContextEntries.ExecuteDeleteAsync(cancellationToken);
        
        var deletedStudents = await db.StudentMasters.ExecuteDeleteAsync(cancellationToken);
        var deletedCurriculumCourses = await db.CurriculumCourses.ExecuteDeleteAsync(cancellationToken);
        var deletedGradeRecords = await db.GradeRecords.ExecuteDeleteAsync(cancellationToken);
        var deletedSyllabusEntries = await db.SyllabusEntries.ExecuteDeleteAsync(cancellationToken);
        var deletedStagingRows = await db.EtlStagingRows.ExecuteDeleteAsync(cancellationToken);
        var deletedStagingFiles = await db.EtlUploadFiles.ExecuteDeleteAsync(cancellationToken);
        var deletedStagingBatches = await db.EtlUploadBatches.ExecuteDeleteAsync(cancellationToken);
        
        // Documents has FK to Departments with Restrict, delete before Departments
        var deletedDocuments = await db.Documents.ExecuteDeleteAsync(cancellationToken);
        var deletedActivityLogs = await db.ActivityLogs.ExecuteDeleteAsync(cancellationToken);
        var deletedPrograms = await db.AcademicPrograms.ExecuteDeleteAsync(cancellationToken);
        var deletedColleges = await db.Colleges.ExecuteDeleteAsync(cancellationToken);
        var deletedDepartments = await db.Departments.ExecuteDeleteAsync(cancellationToken);

        var defaults = configuration.GetSection("RegistrarDefaults").Get<RegistrarDefaultsOptions>();
        if (defaults is not null)
        {
            await EfRegistrarRepository.SeedDataAsync(db, defaults);
        }

        return new FlushDatabaseResultDto(
            Flushed: true,
            DeletedStudents: deletedStudents,
            DeletedCurriculumCourses: deletedCurriculumCourses + deletedGradeRecords + deletedSyllabusEntries,
            DeletedStagingRows: deletedStagingRows,
            DeletedStagingFiles: deletedStagingFiles,
            DeletedStagingBatches: deletedStagingBatches,
            DeletedDocuments: deletedDocuments,
            DeletedActivityLogs: deletedActivityLogs,
            DeletedPrograms: deletedPrograms,
            DeletedColleges: deletedColleges,
            DeletedDepartments: deletedDepartments,
            DeletedStudentRequests: deletedStudentRequests,
            DeletedFaqEntries: deletedFaqEntries,
            DeletedGeminiChats: deletedGeminiChats
        );
    }

    private async Task UpsertDepartmentAsync(Dictionary<string, string> payload, CancellationToken cancellationToken)
    {
        var name = GetValue(payload, "name");
        if (string.IsNullOrWhiteSpace(name))
        {
            return;
        }

        var tracked = db.Departments.Local.FirstOrDefault(d => d.Name == name);
        if (tracked is not null)
        {
            return;
        }

        var existing = await db.Departments.FirstOrDefaultAsync(d => d.Name == name, cancellationToken);
        if (existing is null)
        {
            db.Departments.Add(new Department { Name = name });
        }
    }

    private async Task UpsertStudentAsync(Dictionary<string, string> payload, CancellationToken cancellationToken)
    {
        var studentNo = GetValue(payload, "studentNo");
        if (string.IsNullOrWhiteSpace(studentNo))
        {
            return;
        }

        var now = DateTime.UtcNow;
        var fullName = ComposeFullName(payload);
        var student = await GetOrCreateStudentAsync(studentNo, now, fullName, cancellationToken);
        if (student is null)
        {
            return;
        }

        var firstName = GetValue(payload, "firstName");
        var middleName = GetValue(payload, "middleName");
        var lastName = GetValue(payload, "lastName");
        if (string.IsNullOrWhiteSpace(firstName) && string.IsNullOrWhiteSpace(lastName) && !string.IsNullOrWhiteSpace(fullName))
        {
            var split = SplitName(fullName);
            firstName = split.first;
            middleName = split.middle;
            lastName = split.last;
        }

        student.FullName = fullName;
        student.FirstName = firstName;
        student.MiddleName = middleName;
        student.LastName = lastName;
        student.CollegeCode = GetValue(payload, "collegeCode");
        student.ProgramCode = GetValue(payload, "programCode");
        student.Block = GetValue(payload, "block");
        student.EnrollmentStatus = GetValue(payload, "status");
        student.DateUpdated = now;

        if (int.TryParse(GetValue(payload, "year"), out var parsedYear))
        {
            student.CurrentYear = parsedYear;
        }
    }

    private async Task UpdateStudentStatusAsync(Dictionary<string, string> payload, string sourceCategory, CancellationToken cancellationToken)
    {
        var studentNo = GetValue(payload, "studentNo");
        if (string.IsNullOrWhiteSpace(studentNo))
        {
            return;
        }

        var student = await FindStudentAsync(studentNo, cancellationToken);
        if (student is null)
        {
            throw new InvalidOperationException($"No masterlist reference found for student '{studentNo}'. Upload masterlist first or include it in the same batch.");
        }

        var now = DateTime.UtcNow;

        if (sourceCategory == "admissions")
        {
            student.BirthCertStatus = GetValue(payload, "bcStatus");
            student.Form137Status = GetValue(payload, "f1Status");
        }
        else if (sourceCategory == "discipline")
        {
            student.GoodMoralStatus = GetValue(payload, "status");
        }
        else if (sourceCategory == "service")
        {
            student.NstpStatus = GetValue(payload, "status");
        }
        else if (sourceCategory == "technology")
        {
            student.Email = GetValue(payload, "email");

            var rawPassword = GetTechnologyPassword(payload);
            if (!string.IsNullOrWhiteSpace(rawPassword))
            {
                student.PasswordHash = authService.HashPassword(rawPassword);
                student.IsPasswordConfigured = false;
            }
        }
        else if (sourceCategory == "thesis")
        {
            student.TocStatus = GetValue(payload, "status");
            if (string.IsNullOrWhiteSpace(student.CollegeCode))
            {
                student.CollegeCode = GetValue(payload, "collegeCode");
            }
            if (string.IsNullOrWhiteSpace(student.ProgramCode))
            {
                student.ProgramCode = GetValue(payload, "programCode");
            }
        }

        student.DateUpdated = now;
    }

    private static string GetTechnologyPassword(Dictionary<string, string> payload)
    {
        var candidateKeys = new[]
        {
            "password",
            "pass",
            "passwordPlain",
            "studentPassword",
            "ictoPassword"
        };

        foreach (var key in candidateKeys)
        {
            var value = GetValue(payload, key);
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value;
            }
        }

        return string.Empty;
    }

    private async Task ApplyGradeReferenceAsync(Dictionary<string, string> payload, CancellationToken cancellationToken)
    {
        var studentNo = GetValue(payload, "studentNo");
        if (string.IsNullOrWhiteSpace(studentNo))
        {
            return;
        }

        var student = await FindStudentAsync(studentNo, cancellationToken);
        if (student is null)
        {
            throw new InvalidOperationException($"No masterlist reference found for student '{studentNo}'. Upload masterlist first or include it in the same batch.");
        }

        student.DateUpdated = DateTime.UtcNow;
    }

    private async Task UpsertGradeRecordAsync(Dictionary<string, string> payload, CancellationToken cancellationToken)
    {
        await ApplyGradeReferenceAsync(payload, cancellationToken);

        var collegeCode = GetValue(payload, "collegeCode");
        var programCode = GetValue(payload, "programCode");
        var courseCode = GetValue(payload, "courseCode");
        var studentNo = GetValue(payload, "studentNo");

        if (string.IsNullOrWhiteSpace(studentNo) || string.IsNullOrWhiteSpace(courseCode))
        {
            return;
        }

        var tracked = db.GradeRecords.Local.FirstOrDefault(g =>
            g.CollegeCode == collegeCode
            && g.ProgramCode == programCode
            && g.CourseCode == courseCode
            && g.StudentNo == studentNo);

        var existing = tracked ?? await db.GradeRecords.FirstOrDefaultAsync(g =>
            g.CollegeCode == collegeCode
            && g.ProgramCode == programCode
            && g.CourseCode == courseCode
            && g.StudentNo == studentNo,
            cancellationToken);

        if (existing is null)
        {
            existing = new GradeRecord
            {
                CollegeCode = collegeCode,
                ProgramCode = programCode,
                CourseCode = courseCode,
                StudentNo = studentNo
            };
            db.GradeRecords.Add(existing);
        }

        existing.Grade = GetValue(payload, "grade");
        existing.DateUpdated = DateTime.UtcNow;
    }

    private async Task UpsertSyllabusEntryAsync(Dictionary<string, string> payload, CancellationToken cancellationToken)
    {
        var collegeCode = GetValue(payload, "collegeCode");
        var programCode = GetValue(payload, "programCode");
        var code = GetValue(payload, "code");

        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(programCode))
        {
            return;
        }

        var tracked = db.SyllabusEntries.Local.FirstOrDefault(s =>
            s.CollegeCode == collegeCode
            && s.ProgramCode == programCode
            && s.Code == code);

        var existing = tracked ?? await db.SyllabusEntries.FirstOrDefaultAsync(s =>
            s.CollegeCode == collegeCode
            && s.ProgramCode == programCode
            && s.Code == code,
            cancellationToken);

        if (existing is null)
        {
            existing = new SyllabusEntry
            {
                CollegeCode = collegeCode,
                ProgramCode = programCode,
                Code = code
            };
            db.SyllabusEntries.Add(existing);
        }

        existing.Title = GetValue(payload, "title");
        existing.Description = GetValue(payload, "description");
        existing.DateUpdated = DateTime.UtcNow;
    }

    private async Task UpsertCurriculumAsync(Dictionary<string, string> payload, CancellationToken cancellationToken)
    {
        var collegeCode = GetValue(payload, "collegeCode");
        var programCode = GetValue(payload, "programCode");
        var code = GetValue(payload, "code");

        if (!int.TryParse(GetValue(payload, "level"), out var level)
            || !int.TryParse(GetValue(payload, "term"), out var term)
            || string.IsNullOrWhiteSpace(code)
            || string.IsNullOrWhiteSpace(programCode))
        {
            return;
        }

        var unitsRaw = GetValue(payload, "units");
        decimal.TryParse(unitsRaw, NumberStyles.Any, CultureInfo.InvariantCulture, out var units);

        var tracked = db.CurriculumCourses.Local.FirstOrDefault(c =>
            c.CollegeCode == collegeCode
            && c.ProgramCode == programCode
            && c.Level == level
            && c.Term == term
            && c.Code == code);

        var existing = tracked ?? await db.CurriculumCourses.FirstOrDefaultAsync(c =>
            c.CollegeCode == collegeCode
            && c.ProgramCode == programCode
            && c.Level == level
            && c.Term == term
            && c.Code == code,
            cancellationToken);

        if (existing is null)
        {
            existing = new CurriculumCourse
            {
                CollegeCode = collegeCode,
                ProgramCode = programCode,
                Level = level,
                Term = term,
                Code = code
            };
            db.CurriculumCourses.Add(existing);
        }

        existing.Units = units;
        existing.Title = GetValue(payload, "title");
        existing.DateUpdated = DateTime.UtcNow;
    }

    private async Task<StudentMaster?> GetOrCreateStudentAsync(string studentNo, DateTime now, string fullName, CancellationToken cancellationToken)
    {
        var tracked = db.StudentMasters.Local.FirstOrDefault(s => s.StudentNo == studentNo);
        if (tracked is not null)
        {
            return tracked;
        }

        var existing = await db.StudentMasters.FirstOrDefaultAsync(s => s.StudentNo == studentNo, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var split = SplitName(fullName);
        var created = new StudentMaster
        {
            StudentNo = studentNo,
            FullName = fullName,
            FirstName = split.first,
            MiddleName = split.middle,
            LastName = split.last,
            DateCreated = now,
            DateUpdated = now
        };

        db.StudentMasters.Add(created);
        return created;
    }

    private async Task<StudentMaster?> FindStudentAsync(string studentNo, CancellationToken cancellationToken)
    {
        var tracked = db.StudentMasters.Local.FirstOrDefault(s => s.StudentNo == studentNo);
        if (tracked is not null)
        {
            return tracked;
        }

        return await db.StudentMasters.FirstOrDefaultAsync(s => s.StudentNo == studentNo, cancellationToken);
    }

    private static string ResolveCategory(IReadOnlyList<string> metadata, IReadOnlyList<string> allLines, string fileName, char delimiter)
    {
        var row0 = metadata.ToArray();
        var col0 = row0.Length > 0 ? NormalizeTag(row0[0]) : string.Empty;
        var col2 = row0.Length > 2 ? NormalizeTag(row0[2]) : string.Empty;
        var header = allLines.Count > 1
            ? ParseCsvLine(allLines[1], delimiter).Select(NormalizeTag).Where(x => !string.IsNullOrWhiteSpace(x)).ToHashSet()
            : new HashSet<string>();

        if (col0 is "OUR" or "AO" or "OSD" or "NSTP" or "ICTO")
        {
            return col0 switch
            {
                "OUR" => "departments",
                "AO" => "admissions",
                "OSD" => "discipline",
                "NSTP" => "service",
                "ICTO" => "technology",
                _ => throw new InvalidOperationException("Unsupported office masterlist.")
            };
        }

        if (col2 is "MASTERLIST" or "MASTER")
        {
            if (header.Contains("EMAIL") && header.Contains("PASSWORD"))
            {
                return "technology";
            }

            if (header.Contains("LASTNAME") || header.Contains("FIRSTNAME") || header.Contains("NAME"))
            {
                return "students";
            }

            if (header.Contains("STUDENTNO") && header.Contains("GRADE"))
            {
                return "grades";
            }

            return "students";
        }

        if (col2 is "CURRICULUM" or "CURRICULA")
        {
            return "curriculums";
        }

        if (col2 is "GRADES" or "GRADE")
        {
            return "grades";
        }

        if (col2 is "SYLLABUS" or "SYLLABI")
        {
            return "syllabi";
        }

        if (col2 == "THESIS")
        {
            return "thesis";
        }

        var inferred = InferCategoryFromHeaderAndFile(allLines, fileName, delimiter);
        if (!string.IsNullOrWhiteSpace(inferred))
        {
            return inferred;
        }

        throw new InvalidOperationException("Unable to categorize CSV from metadata row.");
    }

    private static string InferCategoryFromHeaderAndFile(IReadOnlyList<string> allLines, string fileName, char delimiter)
    {
        var header = allLines.Count > 1
            ? ParseCsvLine(allLines[1], delimiter).Select(NormalizeTag).Where(x => !string.IsNullOrWhiteSpace(x)).ToHashSet()
            : new HashSet<string>();

        if (header.Contains("STUDENTNO") && header.Contains("GRADE"))
        {
            return "grades";
        }

        var normalizedFileName = NormalizeTag(Path.GetFileNameWithoutExtension(fileName));
        if (normalizedFileName.EndsWith("G", StringComparison.Ordinal))
        {
            return "grades";
        }

        if (normalizedFileName.EndsWith("C", StringComparison.Ordinal))
        {
            return "curriculums";
        }

        if (normalizedFileName.EndsWith("S", StringComparison.Ordinal))
        {
            return "syllabi";
        }

        if (header.Contains("FIRSTNAME") || header.Contains("LASTNAME"))
        {
            return "students";
        }

        if (header.Contains("LEVEL") && header.Contains("TERM") && header.Contains("UNITS"))
        {
            return "curriculums";
        }

        if (header.Contains("DESCRIPTION") && header.Contains("CODE") && header.Contains("TITLE"))
        {
            return "syllabi";
        }

        if (header.Contains("EMAIL") && header.Contains("PASSWORD"))
        {
            return "technology";
        }

        if (header.Contains("THESIS")) return "thesis";
        if (header.Contains("CURRICULUM") || header.Contains("CURRICULA")) return "curriculums";
        if (header.Contains("SYLLABUS") || header.Contains("SYLLABI")) return "syllabi";
        if (header.Contains("MASTERLIST") || header.Contains("MASTER")) return "students";

        return string.Empty;
    }

    private static string BuildScopeKey(string category, string collegeCode, string programCode, IReadOnlyList<string> metadata, string fileName)
    {
        if (category is "students" or "grades" or "curriculums" or "syllabi" or "thesis")
        {
            return $"{category}:{collegeCode.Trim().ToUpperInvariant()}:{programCode.Trim().ToUpperInvariant()}";
        }

        if (category is "departments" or "admissions" or "discipline" or "service" or "technology")
        {
            var officeTag = metadata.Count > 0 ? NormalizeTag(metadata[0]) : string.Empty;
            return $"{category}:{officeTag}";
        }

        return $"{category}:{NormalizeTag(fileName)}";
    }

    private static string NormalizeTag(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        return Regex.Replace(value.Trim().ToUpperInvariant(), "[^A-Z0-9]", string.Empty);
    }

    private static List<ParsedStagingRow> ParseRowsForCategory(
        string category,
        IReadOnlyList<string> metadata,
        IReadOnlyList<string> allLines,
        string sourceCollegeCode,
        string sourceProgramCode,
        char delimiter)
    {
        return category == "grades"
            ? ParseGradeRows(metadata, allLines, sourceCollegeCode, sourceProgramCode, delimiter)
            : ParseSimpleRows(category, metadata, allLines, sourceCollegeCode, sourceProgramCode, delimiter);
    }

    private static List<ParsedStagingRow> ParseSimpleRows(
        string category,
        IReadOnlyList<string> metadata,
        IReadOnlyList<string> allLines,
        string sourceCollegeCode,
        string sourceProgramCode,
        char delimiter)
    {
        if (allLines.Count < 2)
        {
            return [];
        }

        var headers = ParseCsvLine(allLines[1], delimiter).Select(x => x.Trim()).ToArray();
        var parsedRows = new List<ParsedStagingRow>();

        for (var lineIndex = 2; lineIndex < allLines.Count; lineIndex++)
        {
            var row = ParseCsvLine(allLines[lineIndex], delimiter);
            if (IsBlankRow(row))
            {
                continue;
            }

            var cappedRow = new string[headers.Length];
            for (var i = 0; i < headers.Length; i++)
            {
                cappedRow[i] = i < row.Count ? row[i].Trim() : string.Empty;
            }

            var normalized = NormalizeRow(category, metadata, headers, cappedRow, sourceCollegeCode, sourceProgramCode);
            if (normalized.Count == 0)
            {
                continue;
            }

            parsedRows.Add(new ParsedStagingRow(lineIndex + 1, normalized));
        }

        return parsedRows;
    }

    private static List<ParsedStagingRow> ParseGradeRows(
        IReadOnlyList<string> metadata,
        IReadOnlyList<string> allLines,
        string sourceCollegeCode,
        string sourceProgramCode,
        char delimiter)
    {
        var parsedRows = new List<ParsedStagingRow>();
        var currentCourseCode = string.Empty;
        var hasGradeHeader = false;

        for (var lineIndex = 1; lineIndex < allLines.Count; lineIndex++)
        {
            var cells = ParseCsvLine(allLines[lineIndex], delimiter).Select(c => c.Trim()).ToList();
            if (IsBlankRow(cells))
            {
                continue;
            }

            var upper = cells.Select(c => c.ToUpperInvariant()).ToList();
            if (upper.Contains("NAME") && upper.Contains("STUDENT NO") && upper.Contains("GRADE"))
            {
                hasGradeHeader = true;
                continue;
            }

            var first = cells.Count > 0 ? cells[0] : string.Empty;
            var second = cells.Count > 1 ? cells[1] : string.Empty;
            var third = cells.Count > 2 ? cells[2] : string.Empty;
            var compactFirst = first.Replace(" ", string.Empty, StringComparison.Ordinal).ToUpperInvariant();
            if (!string.IsNullOrWhiteSpace(first)
                && string.IsNullOrWhiteSpace(second)
                && string.IsNullOrWhiteSpace(third)
                && compactFirst.Any(char.IsLetter)
                && compactFirst.Any(char.IsDigit)
                && compactFirst.All(char.IsLetterOrDigit))
            {
                currentCourseCode = compactFirst;
                continue;
            }

            if (!hasGradeHeader || cells.Count < 3)
            {
                continue;
            }

            var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["name"] = first,
                ["studentNo"] = second,
                ["grade"] = third,
                ["courseCode"] = currentCourseCode,
                ["collegeCode"] = sourceCollegeCode,
                ["programCode"] = sourceProgramCode
            };

            if (!string.IsNullOrWhiteSpace(map["name"]))
            {
                var split = SplitName(map["name"]);
                map["firstName"] = split.first;
                map["middleName"] = split.middle;
                map["lastName"] = split.last;
            }

            if (string.IsNullOrWhiteSpace(map["studentNo"]))
            {
                continue;
            }

            parsedRows.Add(new ParsedStagingRow(lineIndex + 1, map));
        }

        return parsedRows;
    }

    private static Dictionary<string, string> NormalizeRow(
        string category,
        IReadOnlyList<string> metadata,
        IReadOnlyList<string> headers,
        IReadOnlyList<string> row,
        string sourceCollegeCode,
        string sourceProgramCode)
    {
        var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        for (var i = 0; i < headers.Count; i++)
        {
            if (string.IsNullOrWhiteSpace(headers[i]))
            {
                continue;
            }

            var key = NormalizeHeader(headers[i]);
            if (string.IsNullOrWhiteSpace(key))
            {
                continue;
            }

            map[key] = i < row.Count ? row[i].Trim() : string.Empty;
        }

        if (category is "students" or "curriculums" or "thesis" or "grades" or "syllabi")
        {
            map["collegeCode"] = sourceCollegeCode;
            map["programCode"] = sourceProgramCode;
        }

        if (!map.ContainsKey("name"))
        {
            var first = GetValue(map, "firstName");
            var middle = GetValue(map, "middleName");
            var last = GetValue(map, "lastName");
            var composed = string.Join(' ', new[] { first, middle, last }.Where(x => !string.IsNullOrWhiteSpace(x)));
            if (!string.IsNullOrWhiteSpace(composed))
            {
                map["name"] = composed;
            }
        }

        if (map.TryGetValue("name", out var fullName) && !string.IsNullOrWhiteSpace(fullName)
            && (string.IsNullOrWhiteSpace(GetValue(map, "firstName")) || string.IsNullOrWhiteSpace(GetValue(map, "lastName"))))
        {
            var split = SplitName(fullName);
            map["firstName"] = split.first;
            map["middleName"] = split.middle;
            map["lastName"] = split.last;
        }

        return map;
    }

    private static string NormalizeHeader(string input)
    {
        var normalizedTag = NormalizeTag(input);
        return normalizedTag switch
        {
            "DEPTID" => "deptId",
            "NAME" => "name",
            "FIRSTNAME" => "firstName",
            "MIDDLENAME" => "middleName",
            "LASTNAME" => "lastName",
            "NAMEABBR" => "nameAbbr",
            "STUDENTNO" => "studentNo",
            "BCSTATUS" => "bcStatus",
            "F1STATUS" => "f1Status",
            "STATUS" => "status",
            "EMAIL" => "email",
            "EMAILADDRESS" => "email",
            "PLMEMAIL" => "email",
            "PASSWORD" => "password",
            "PASS" => "password",
            "STUDENTPASSWORD" => "password",
            "ICTOPASSWORD" => "password",
            "YEAR" => "year",
            "BLOCK" => "block",
            "LEVEL" => "level",
            "TERM" => "term",
            "UNITS" => "units",
            "CODE" => "code",
            "GRADE" => "grade",
            "DESCRIPTION" => "description",
            "TITLE" => "title",
            _ => string.Empty
        };
    }

    private static bool RequiresStudentReference(string category)
    {
        return category is "admissions" or "discipline" or "service" or "technology" or "thesis" or "grades";
    }

    private static int GetCategoryCommitPriority(string category)
    {
        return category switch
        {
            "departments" => 0,
            "students" => 1,
            "curriculums" => 2,
            "syllabi" => 3,
            "admissions" => 4,
            "discipline" => 5,
            "service" => 6,
            "technology" => 7,
            "thesis" => 8,
            "grades" => 9,
            _ => 99
        };
    }

    private static bool IsBlankRow(IReadOnlyList<string> row)
    {
        return row.Count == 0 || row.All(string.IsNullOrWhiteSpace);
    }

    private static string ComposeFullName(IReadOnlyDictionary<string, string> payload)
    {
        var existing = GetValue(payload, "name");
        if (!string.IsNullOrWhiteSpace(existing))
        {
            return existing;
        }

        var first = GetValue(payload, "firstName");
        var middle = GetValue(payload, "middleName");
        var last = GetValue(payload, "lastName");
        return string.Join(' ', new[] { first, middle, last }.Where(x => !string.IsNullOrWhiteSpace(x)));
    }

    private IEnumerable<string> EnumerateCsvDataFiles()
    {
        var candidates = new List<string>
        {
            Path.Combine(hostEnvironment.ContentRootPath, "..", "..", "docs"),
            Path.Combine(hostEnvironment.ContentRootPath, "docs")
        };

        foreach (var path in candidates.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            if (!Directory.Exists(path))
            {
                continue;
            }

            foreach (var file in Directory.EnumerateFiles(path, "*.csv", SearchOption.TopDirectoryOnly))
            {
                yield return file;
            }
        }
    }

    private static List<CreateFaqContextEntryDto> ParseFaqCsv(string content)
    {
        var entries = new List<CreateFaqContextEntryDto>();
        var lines = content.Split(new[] { "\r\n", "\n" }, StringSplitOptions.None);
        var delimiter = DetectDelimiter(lines);
        var rows = ParseCsvRows(content, delimiter);

        if (rows.Count < 2)
        {
            return entries;
        }

        var header = rows[0].Select(value => value.Trim()).ToArray();
        var headerLookup = header.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var hasAnswerLikeColumn = headerLookup.Contains("answer") || headerLookup.Contains("context") || headerLookup.Contains("content");

        if (!headerLookup.Contains("promptRoleTag") || !headerLookup.Contains("category") || !headerLookup.Contains("title") || !hasAnswerLikeColumn)
        {
            throw new InvalidOperationException("FAQ/context CSV must include promptRoleTag, category, title, and answer (or context/content) columns.");
        }

        for (var rowIndex = 1; rowIndex < rows.Count; rowIndex++)
        {
            var cells = rows[rowIndex].Select(value => value.Trim()).ToArray();
            if (cells.All(string.IsNullOrWhiteSpace))
            {
                continue;
            }

            var fields = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            for (var cellIndex = 0; cellIndex < header.Length; cellIndex++)
            {
                if (cellIndex < cells.Length)
                {
                    fields[header[cellIndex]] = cells[cellIndex];
                }
            }

            var inferredCategory = fields.TryGetValue("category", out var category)
                ? category
                : "context";

            var title = fields.TryGetValue("title", out var titleValue)
                ? titleValue
                : fields.TryGetValue("question", out var q)
                    ? q
                    : fields.TryGetValue("section", out var sectionTitle) ? sectionTitle : string.Empty;

            var answer = fields.TryGetValue("answer", out var a)
                ? a
                : fields.TryGetValue("context", out var contextValue)
                    ? contextValue
                : fields.TryGetValue("content", out var contentValue)
                    ? contentValue
                    : string.Empty;

            var scopeType = NormalizeFaqScopeType(fields.TryGetValue("promptRoleTag", out var scopeTypeRaw) ? scopeTypeRaw : string.Empty);
            if (string.IsNullOrWhiteSpace(title))
            {
                title = answer;
            }

            title = title.Replace("\\n", Environment.NewLine);
            answer = answer.Replace("\\n", Environment.NewLine);

            entries.Add(new CreateFaqContextEntryDto(
                scopeType,
                string.Empty,
                string.Empty,
                inferredCategory,
                title,
                answer
            ));
        }

        return entries;
    }

    private static List<List<string>> ParseCsvRows(string content, char delimiter = ',')
    {
        var rows = new List<List<string>>();
        if (string.IsNullOrWhiteSpace(content))
        {
            return rows;
        }

        var currentRow = new List<string>();
        var currentCell = new StringBuilder();
        var inQuotes = false;

        for (var i = 0; i < content.Length; i++)
        {
            var c = content[i];

            if (c == '"')
            {
                if (inQuotes && i + 1 < content.Length && content[i + 1] == '"')
                {
                    currentCell.Append('"');
                    i++;
                    continue;
                }

                inQuotes = !inQuotes;
                continue;
            }

            if (c == delimiter && !inQuotes)
            {
                currentRow.Add(currentCell.ToString());
                currentCell.Clear();
                continue;
            }

            if ((c == '\n' || c == '\r') && !inQuotes)
            {
                if (c == '\r' && i + 1 < content.Length && content[i + 1] == '\n')
                {
                    i++;
                }

                currentRow.Add(currentCell.ToString());
                currentCell.Clear();

                if (currentRow.Any(cell => !string.IsNullOrWhiteSpace(cell)))
                {
                    rows.Add(currentRow);
                }

                currentRow = new List<string>();
                continue;
            }

            currentCell.Append(c);
        }

        currentRow.Add(currentCell.ToString());
        if (currentRow.Any(cell => !string.IsNullOrWhiteSpace(cell)))
        {
            rows.Add(currentRow);
        }

        return rows;
    }

    private static string NormalizeFaqScopeType(string rawScopeType)
    {
        var normalized = rawScopeType.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalized) || !PromptRoleTags.IsValid(normalized))
        {
            throw new InvalidOperationException($"Invalid promptRoleTag '{rawScopeType}'. See rag_guide.md for supported values.");
        }

        return normalized;
    }

    private static (string CollegeCode, string ProgramCode) ResolveAcademicCodes(IReadOnlyList<string> metadata, string fileName)
    {
        var metaCollege = metadata.Count > 0 ? metadata[0].Trim().ToUpperInvariant() : string.Empty;
        var metaProgram = metadata.Count > 1 ? metadata[1].Trim().ToUpperInvariant() : string.Empty;

        var fileProgram = ExtractProgramCodeFromFileName(fileName);
        var programCode = !string.IsNullOrWhiteSpace(fileProgram) ? fileProgram : metaProgram;
        var mappedCollege = ResolveCollegeFromProgram(programCode);
        var collegeCode = !string.IsNullOrWhiteSpace(mappedCollege) ? mappedCollege : metaCollege;

        return (collegeCode, programCode);
    }

    private static string ExtractProgramCodeFromFileName(string fileName)
    {
        var baseName = Path.GetFileNameWithoutExtension(fileName).ToUpperInvariant();
        var match = Regex.Match(baseName, "^([A-Z0-9]+)\\s*-\\s*[A-Z]$");
        if (match.Success)
        {
            return match.Groups[1].Value;
        }

        var token = baseName.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? string.Empty;
        return ProgramToCollegeMap.ContainsKey(token) ? token : string.Empty;
    }

    private static string ResolveCollegeFromProgram(string programCode)
    {
        return ProgramToCollegeMap.TryGetValue(programCode, out var collegeCode) ? collegeCode : string.Empty;
    }

    private static string GetValue(IReadOnlyDictionary<string, string> payload, string key)
    {
        return payload.TryGetValue(key, out var value) ? value?.Trim() ?? string.Empty : string.Empty;
    }

    private static (string first, string middle, string last) SplitName(string fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName))
        {
            return (string.Empty, string.Empty, string.Empty);
        }

        var tokens = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (tokens.Length == 1)
        {
            return (tokens[0], string.Empty, string.Empty);
        }

        if (tokens.Length == 2)
        {
            return (tokens[0], string.Empty, tokens[1]);
        }

        var first = tokens[0];
        var last = tokens[^1];
        var middle = string.Join(' ', tokens[1..^1]);
        return (first, middle, last);
    }

    private static char DetectDelimiter(IReadOnlyList<string> lines)
    {
        foreach (var line in lines)
        {
            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            var tabCount = line.Count(c => c == '\t');
            var commaCount = line.Count(c => c == ',');
            if (tabCount == 0 && commaCount == 0)
            {
                continue;
            }

            return tabCount > commaCount ? '\t' : ',';
        }

        return ',';
    }

    private static List<string> ParseCsvLine(string line, char delimiter = ',')
    {
        var output = new List<string>();
        if (line is null)
        {
            return output;
        }

        var sb = new StringBuilder();
        var inQuotes = false;

        for (var i = 0; i < line.Length; i++)
        {
            var c = line[i];
            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    sb.Append('"');
                    i++;
                    continue;
                }

                inQuotes = !inQuotes;
                continue;
            }

            if (c == delimiter && !inQuotes)
            {
                output.Add(sb.ToString());
                sb.Clear();
                continue;
            }

            sb.Append(c);
        }

        output.Add(sb.ToString());
        return output;
    }
}
