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

    public static async Task SeedDataAsync(HariKnowsDbContext dbContext)
    {
        var seedDepartments = new[] { "Registrar", "Department A", "Department B", "Department C" };
        foreach (var deptName in seedDepartments)
        {
            if (!dbContext.Departments.Any(d => d.Name == deptName))
            {
                dbContext.Departments.Add(new Department { Name = deptName });
            }
        }

        await dbContext.SaveChangesAsync();

        var now = DateTime.UtcNow;
        var seedDocuments = new[]
        {
            new { Code = "#S-10452", Student = "Jane Doe", Title = "Transcript Verify", DepartmentId = 1 },
            new { Code = "#S-10983", Student = "Marcus Sterling", Title = "Enrollment Audit", DepartmentId = 1 },
            new { Code = "#S-11004", Student = "Elias Vance", Title = "Research Grant", DepartmentId = 3 }
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
