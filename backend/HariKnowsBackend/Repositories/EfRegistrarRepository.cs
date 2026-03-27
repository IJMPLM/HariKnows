using HariKnowsBackend.Data;
using HariKnowsBackend.Data.Entities;
using HariKnowsBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace HariKnowsBackend.Repositories;

public sealed class EfRegistrarRepository(HariKnowsDbContext dbContext) : IRegistrarRepository
{
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
