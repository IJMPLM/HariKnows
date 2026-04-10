using HariKnowsBackend.Data;
using HariKnowsBackend.Data.Entities;
using HariKnowsBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace HariKnowsBackend.Repositories;

public sealed class EfRegistrarRepository(HariKnowsDbContext dbContext) : IRegistrarRepository
{
    private static string NormalizeFaqScope(string rawScope)
    {
        var normalized = rawScope.Trim().ToLowerInvariant();
        return normalized switch
        {
            "global" => "general",
            "non_guest" => "non-guest",
            "nonguest" => "non-guest",
            _ => normalized
        };
    }

    private static StudentDocumentRequestDto ToRequestDto(StudentDocumentRequest request) =>
        new(
            request.Id,
            request.RequestCode,
            request.StudentNo,
            request.StudentName,
            request.DocumentType,
            request.DepartmentId,
            request.Status,
            request.RequestedAt,
            request.PreparedAt,
            request.ClaimedAt,
            request.DisposedAt,
            request.DisposedReason,
            request.HandledBy,
            request.Notes,
            request.UpdatedAt
        );

    private static FaqContextEntryDto ToFaqDto(FaqContextEntry entry) =>
        new(
            entry.Id,
            entry.ScopeType,
            entry.CollegeCode,
            entry.ProgramCode,
            entry.Category,
            entry.Question,
            entry.Answer,
            entry.IsPublished,
            entry.CreatedAt,
            entry.UpdatedAt
        );

    private IQueryable<StudentDocumentRequest> RequestQuery() => dbContext.StudentDocumentRequests.AsQueryable();

    public IReadOnlyList<DepartmentDto> GetDepartments()
    {
        return dbContext.Departments
            .OrderBy(d => d.Id)
            .AsEnumerable()
            .Select(d => new DepartmentDto(d.Id, d.Name))
            .ToList();
    }

    public IReadOnlyList<RegistrarDocumentDto> GetDocuments()
    {
        return dbContext.Documents
            .OrderBy(d => d.Id)
            .AsEnumerable()
            .Select(d => new RegistrarDocumentDto(d.Id, d.ReferenceCode, d.StudentName, d.Title, d.DepartmentId, d.CreatedAt))
            .ToList();
    }

    public CollegeDto CreateCollege(string name)
    {
        var college = new College { Name = name };
        dbContext.Colleges.Add(college);
        dbContext.SaveChanges();

        return new CollegeDto(college.Id, college.Name, []);
    }

    public CollegeDto? UpdateCollege(int collegeId, string name)
    {
        var college = dbContext.Colleges.FirstOrDefault(c => c.Id == collegeId);
        if (college is null)
        {
            return null;
        }

        college.Name = name;
        dbContext.SaveChanges();
        var programs = dbContext.AcademicPrograms
            .Where(p => p.CollegeId == collegeId)
            .OrderBy(p => p.Group)
            .ThenBy(p => p.Name)
            .Select(p => new ProgramDto(p.Id, p.Name, p.Code, p.Group))
            .ToList();

        return new CollegeDto(college.Id, college.Name, programs);
    }

    public bool DeleteCollege(int collegeId)
    {
        var college = dbContext.Colleges.FirstOrDefault(c => c.Id == collegeId);
        if (college is null)
        {
            return false;
        }

        dbContext.Colleges.Remove(college);
        dbContext.SaveChanges();
        return true;
    }

    public bool CollegeExists(int collegeId)
    {
        return dbContext.Colleges.Any(c => c.Id == collegeId);
    }

    public ProgramDto CreateProgram(int collegeId, string name, string code, string group)
    {
        var program = new AcademicProgram
        {
            CollegeId = collegeId,
            Name = name,
            Code = code,
            Group = group
        };

        dbContext.AcademicPrograms.Add(program);
        dbContext.SaveChanges();

        return new ProgramDto(program.Id, program.Name, program.Code, program.Group);
    }

    public ProgramDto? UpdateProgram(int programId, int collegeId, string name, string code, string group)
    {
        var program = dbContext.AcademicPrograms.FirstOrDefault(p => p.Id == programId);
        if (program is null)
        {
            return null;
        }

        program.CollegeId = collegeId;
        program.Name = name;
        program.Code = code;
        program.Group = group;
        dbContext.SaveChanges();

        return new ProgramDto(program.Id, program.Name, program.Code, program.Group);
    }

    public bool DeleteProgram(int programId)
    {
        var program = dbContext.AcademicPrograms.FirstOrDefault(p => p.Id == programId);
        if (program is null)
        {
            return false;
        }

        dbContext.AcademicPrograms.Remove(program);
        dbContext.SaveChanges();
        return true;
    }

    public IReadOnlyList<CollegeDto> GetCollegesWithPrograms()
    {
        return dbContext.Colleges
            .Include(c => c.Programs)
            .OrderBy(c => c.Name)
            .AsEnumerable()
            .Select(c => new CollegeDto(
                c.Id,
                c.Name,
                c.Programs
                    .OrderBy(p => p.Group)
                    .ThenBy(p => p.Name)
                    .Select(p => new ProgramDto(p.Id, p.Name, p.Code, p.Group))
                    .ToList()
            ))
            .ToList();
    }

    public IReadOnlyList<ActivityLogDto> GetActivity(int limit)
    {
        return dbContext.ActivityLogs
            .OrderByDescending(a => a.Id)
            .Take(limit)
            .AsEnumerable()
            .Select(a => new ActivityLogDto(a.Id, a.Action, a.Actor, a.CreatedAt))
            .ToList();
    }

    public DepartmentDto CreateDepartment(string name)
    {
        var department = new Department { Name = name };
        dbContext.Departments.Add(department);
        dbContext.SaveChanges();
        return new DepartmentDto(department.Id, department.Name);
    }

    public bool DepartmentExists(int departmentId)
    {
        return dbContext.Departments.Any(d => d.Id == departmentId);
    }

    public RegistrarDocumentDto CreateDocument(string studentName, string title, int departmentId, string referenceCode, DateTime createdAt)
    {
        var document = new Document
        {
            ReferenceCode = referenceCode,
            StudentName = studentName,
            Title = title,
            DepartmentId = departmentId,
            CreatedAt = createdAt,
            UpdatedAt = createdAt
        };

        dbContext.Documents.Add(document);
        dbContext.SaveChanges();

        return new RegistrarDocumentDto(document.Id, document.ReferenceCode, document.StudentName, document.Title, document.DepartmentId, document.CreatedAt);
    }

    public (int? DepartmentId, string? ReferenceCode) GetDocumentLocation(int documentId)
    {
        var doc = dbContext.Documents.FirstOrDefault(d => d.Id == documentId);
        return doc != null ? (doc.DepartmentId, doc.ReferenceCode) : (null, null);
    }

    public string? GetDepartmentName(int departmentId)
    {
        return dbContext.Departments
            .Where(d => d.Id == departmentId)
            .Select(d => d.Name)
            .FirstOrDefault();
    }

    public void MoveDocument(int documentId, int toDepartmentId, DateTime updatedAt)
    {
        var doc = dbContext.Documents.FirstOrDefault(d => d.Id == documentId);
        if (doc != null)
        {
            doc.DepartmentId = toDepartmentId;
            doc.UpdatedAt = updatedAt;
            dbContext.SaveChanges();
        }
    }

    public void WriteActivity(string action, string actor)
    {
        var log = new ActivityLog
        {
            Action = action,
            Actor = actor,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.ActivityLogs.Add(log);
        dbContext.SaveChanges();
    }

    public IReadOnlyList<StudentDirectoryEntryDto> SearchStudents(string? query, int limit)
    {
        var safeLimit = Math.Clamp(limit, 1, 100);
        var normalized = query?.Trim() ?? string.Empty;

        var students = dbContext.StudentMasters.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(normalized))
        {
            students = students.Where(s =>
                s.StudentNo.Contains(normalized) ||
                s.FullName.Contains(normalized) ||
                s.Email.Contains(normalized) ||
                s.CollegeCode.Contains(normalized) ||
                s.ProgramCode.Contains(normalized));
        }

        return students
            .OrderBy(s => s.FullName)
            .ThenBy(s => s.StudentNo)
            .Take(safeLimit)
            .AsEnumerable()
            .Select(s => new StudentDirectoryEntryDto(s.StudentNo, s.FullName, s.CollegeCode, s.ProgramCode, s.Email))
            .ToList();
    }

    public StudentStatusDto? GetStudentStatus(string studentNo)
    {
        var student = dbContext.StudentMasters.AsNoTracking().FirstOrDefault(s => s.StudentNo == studentNo.Trim());
        if (student is null)
        {
            return null;
        }

        return new StudentStatusDto(
            student.StudentNo,
            student.FullName,
            student.CollegeCode,
            student.ProgramCode,
            student.CurrentYear,
            student.EnrollmentStatus,
            student.GoodMoralStatus,
            student.NstpStatus,
            student.BirthCertStatus,
            student.Form137Status,
            student.Email
        );
    }

    public IReadOnlyList<StudentDocumentRequestDto> GetStudentRequests(string? studentNo, string? status, int limit)
    {
        var safeLimit = Math.Clamp(limit, 1, 200);
        var requestQuery = RequestQuery().AsNoTracking();

        if (!string.IsNullOrWhiteSpace(studentNo))
        {
            requestQuery = requestQuery.Where(r => r.StudentNo == studentNo.Trim());
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            requestQuery = requestQuery.Where(r => r.Status == status.Trim());
        }

        return requestQuery
            .OrderByDescending(r => r.RequestedAt)
            .ThenByDescending(r => r.Id)
            .Take(safeLimit)
            .AsEnumerable()
            .Select(ToRequestDto)
            .ToList();
    }

    public StudentDocumentRequestDto? GetStudentRequest(int requestId)
    {
        var request = dbContext.StudentDocumentRequests.AsNoTracking().FirstOrDefault(r => r.Id == requestId);
        return request is null ? null : ToRequestDto(request);
    }

    public StudentDocumentRequestDto CreateStudentRequest(string studentNo, string studentName, string documentType, int departmentId, string notes, DateTime now, string requestCode)
    {
        var request = new StudentDocumentRequest
        {
            RequestCode = requestCode,
            StudentNo = studentNo,
            StudentName = studentName,
            DocumentType = documentType,
            DepartmentId = departmentId,
            Status = "requested",
            RequestedAt = now,
            UpdatedAt = now,
            Notes = notes
        };

        dbContext.StudentDocumentRequests.Add(request);
        dbContext.SaveChanges();
        return ToRequestDto(request);
    }

    public StudentDocumentRequestDto? UpdateStudentRequestStatus(int requestId, string status, string? handledBy, string? disposedReason, string? notes, DateTime now)
    {
        var request = dbContext.StudentDocumentRequests.FirstOrDefault(r => r.Id == requestId);
        if (request is null)
        {
            return null;
        }

        request.Status = status;
        request.HandledBy = handledBy?.Trim() ?? request.HandledBy;
        request.Notes = notes?.Trim() ?? request.Notes;
        request.UpdatedAt = now;

        if (status == "prepared")
        {
            request.PreparedAt ??= now;
        }
        else if (status == "claimed")
        {
            request.ClaimedAt ??= now;
        }
        else if (status == "disposed")
        {
            request.DisposedAt ??= now;
            request.DisposedReason = disposedReason?.Trim() ?? string.Empty;
        }

        dbContext.SaveChanges();
        return ToRequestDto(request);
    }

    public IReadOnlyList<FaqContextEntryDto> GetFaqEntries(string? scopeType, string? collegeCode, string? programCode, bool includeUnpublished, int limit)
    {
        var safeLimit = Math.Clamp(limit, 1, 250);
        var query = dbContext.FaqContextEntries.AsNoTracking().AsQueryable();

        if (!includeUnpublished)
        {
            query = query.Where(e => e.IsPublished);
        }

        if (!string.IsNullOrWhiteSpace(scopeType))
        {
            var normalizedScope = NormalizeFaqScope(scopeType);
            if (normalizedScope == "general")
            {
                query = query.Where(e =>
                    e.ScopeType.ToLower() == "general" ||
                    e.ScopeType.ToLower() == "global");
            }
            else if (normalizedScope == "non-guest")
            {
                query = query.Where(e =>
                    e.ScopeType.ToLower() == "non-guest" ||
                    e.ScopeType.ToLower() == "non_guest" ||
                    e.ScopeType.ToLower() == "nonguest");
            }
            else
            {
                query = query.Where(e =>
                    e.ScopeType.ToLower() == normalizedScope);
            }
        }

        if (!string.IsNullOrWhiteSpace(collegeCode))
        {
            query = query.Where(e => e.CollegeCode == collegeCode.Trim());
        }

        if (!string.IsNullOrWhiteSpace(programCode))
        {
            query = query.Where(e => e.ProgramCode == programCode.Trim());
        }

        return query
            .OrderBy(e => e.Category)
            .ThenBy(e => e.Question)
            .Take(safeLimit)
            .AsEnumerable()
            .Select(ToFaqDto)
            .ToList();
    }

    public FaqContextEntryDto? GetFaqEntry(int faqId)
    {
        var entry = dbContext.FaqContextEntries.AsNoTracking().FirstOrDefault(e => e.Id == faqId);
        return entry is null ? null : ToFaqDto(entry);
    }

    public FaqContextEntryDto CreateFaqEntry(CreateFaqContextEntryDto request, DateTime now)
    {
        var entry = new FaqContextEntry
        {
            ScopeType = request.ScopeType,
            CollegeCode = request.CollegeCode,
            ProgramCode = request.ProgramCode,
            Category = request.Category,
            Question = request.Title,
            Answer = request.Answer,
            IsPublished = request.IsGuestVisible,
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.FaqContextEntries.Add(entry);
        dbContext.SaveChanges();
        return ToFaqDto(entry);
    }

    public FaqContextEntryDto? UpdateFaqEntry(int faqId, UpdateFaqContextEntryDto request, DateTime now)
    {
        var entry = dbContext.FaqContextEntries.FirstOrDefault(e => e.Id == faqId);
        if (entry is null)
        {
            return null;
        }

        entry.ScopeType = request.ScopeType;
        entry.CollegeCode = request.CollegeCode;
        entry.ProgramCode = request.ProgramCode;
        entry.Category = request.Category;
        entry.Question = request.Title;
        entry.Answer = request.Answer;
        entry.IsPublished = request.IsGuestVisible;
        entry.UpdatedAt = now;

        dbContext.SaveChanges();
        return ToFaqDto(entry);
    }

    public bool DeleteFaqEntry(int faqId)
    {
        var entry = dbContext.FaqContextEntries.FirstOrDefault(e => e.Id == faqId);
        if (entry is null)
        {
            return false;
        }

        dbContext.FaqContextEntries.Remove(entry);
        dbContext.SaveChanges();
        return true;
    }

    public IReadOnlyList<FaqContextEntryDto> SearchFaqEntries(string query, string? scopeType, string? collegeCode, string? programCode, int limit)
    {
        var safeLimit = Math.Clamp(limit, 1, 50);
        var normalized = query.Trim();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return [];
        }

        var entries = GetFaqEntries(scopeType, collegeCode, programCode, false, safeLimit * 2)
            .Where(entry =>
                entry.Title.Contains(normalized, StringComparison.OrdinalIgnoreCase) ||
                entry.Answer.Contains(normalized, StringComparison.OrdinalIgnoreCase) ||
                entry.Category.Contains(normalized, StringComparison.OrdinalIgnoreCase))
            .Take(safeLimit)
            .ToList();

        return entries;
    }

    public void EnsureDatabaseInitialized()
    {
        // This is now handled in Program.cs with EF Core migrations
        // Keeping this method for backwards compatibility
    }

    public static async Task SeedDataAsync(HariKnowsDbContext dbContext, RegistrarDefaultsOptions defaults)
    {
        foreach (var deptName in defaults.Departments.Select(name => name.Trim()).Where(name => !string.IsNullOrWhiteSpace(name)))
        {
            if (!dbContext.Departments.Any(d => d.Name == deptName))
            {
                dbContext.Departments.Add(new Department { Name = deptName });
            }
        }

        await dbContext.SaveChangesAsync();

        foreach (var collegeDefaults in defaults.Colleges.Where(college => !string.IsNullOrWhiteSpace(college.Name)))
        {
            var normalizedCollegeName = collegeDefaults.Name.Trim();
            var college = await dbContext.Colleges.FirstOrDefaultAsync(c => c.Name == normalizedCollegeName);

            if (college is null)
            {
                college = new College { Name = normalizedCollegeName };
                dbContext.Colleges.Add(college);
                await dbContext.SaveChangesAsync();
            }

            foreach (var programDefaults in collegeDefaults.Programs)
            {
                var programName = programDefaults.Name.Trim();
                var programCode = string.IsNullOrWhiteSpace(programDefaults.Code) ? programName : programDefaults.Code.Trim();
                var programGroup = string.IsNullOrWhiteSpace(programDefaults.Group) ? "General" : programDefaults.Group.Trim();

                if (string.IsNullOrWhiteSpace(programName))
                {
                    continue;
                }

                var exists = await dbContext.AcademicPrograms.AnyAsync(p => p.CollegeId == college.Id && p.Name == programName);
                if (!exists)
                {
                    dbContext.AcademicPrograms.Add(new AcademicProgram
                    {
                        Name = programName,
                        Code = programCode,
                        Group = programGroup,
                        CollegeId = college.Id
                    });
                }
            }
        }

        await dbContext.SaveChangesAsync();

        var now = DateTime.UtcNow;
        var firstDepartmentId = dbContext.Departments.OrderBy(d => d.Id).Select(d => d.Id).FirstOrDefault();
        var fallbackDepartmentId = firstDepartmentId == 0 ? 1 : firstDepartmentId;
        var seedDocuments = new[]
        {
            new { Code = "#S-10452", Student = "Jane Doe", Title = "Transcript Verify", DepartmentId = fallbackDepartmentId },
            new { Code = "#S-10983", Student = "Marcus Sterling", Title = "Enrollment Audit", DepartmentId = fallbackDepartmentId },
            new { Code = "#S-11004", Student = "Elias Vance", Title = "Research Grant", DepartmentId = fallbackDepartmentId }
        };

        foreach (var docData in seedDocuments)
        {
            if (!dbContext.Documents.Any(d => d.ReferenceCode == docData.Code))
            {
                dbContext.Documents.Add(new Document
                {
                    ReferenceCode = docData.Code,
                    StudentName = docData.Student,
                    Title = docData.Title,
                    DepartmentId = docData.DepartmentId,
                    CreatedAt = now,
                    UpdatedAt = now
                });
            }
        }

        await dbContext.SaveChangesAsync();

        // Add seed activity log
        if (!dbContext.ActivityLogs.Any())
        {
            dbContext.ActivityLogs.Add(new ActivityLog
            {
                Action = "Initial registrar workflow seeded.",
                Actor = "System",
                CreatedAt = now
            });
            await dbContext.SaveChangesAsync();
        }
    }
}
