using HariKnowsBackend.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace HariKnowsBackend.Data;

public class HariKnowsDbContext(DbContextOptions<HariKnowsDbContext> options) : DbContext(options)
{
    public DbSet<ChatMessage> ChatMessages { get; set; }
    public DbSet<College> Colleges { get; set; }
    public DbSet<AcademicProgram> AcademicPrograms { get; set; }
    public DbSet<Department> Departments { get; set; }
    public DbSet<Document> Documents { get; set; }
    public DbSet<ActivityLog> ActivityLogs { get; set; }
    public DbSet<GeminiChat> GeminiChats { get; set; }
    public DbSet<StudentMaster> StudentMasters { get; set; }
    public DbSet<StudentDocumentRequest> StudentDocumentRequests { get; set; }
    public DbSet<FaqContextEntry> FaqContextEntries { get; set; }
    public DbSet<EtlUploadBatch> EtlUploadBatches { get; set; }
    public DbSet<EtlUploadFile> EtlUploadFiles { get; set; }
    public DbSet<EtlStagingRow> EtlStagingRows { get; set; }
    public DbSet<CurriculumCourse> CurriculumCourses { get; set; }
    public DbSet<GradeRecord> GradeRecords { get; set; }
    public DbSet<SyllabusEntry> SyllabusEntries { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ChatMessage configuration
        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Sender).IsRequired();
            entity.Property(e => e.Content).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
        });

        // Department configuration
        modelBuilder.Entity<Department>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired();
            entity.HasIndex(e => e.Name).IsUnique();
            entity.HasMany(e => e.Documents)
                .WithOne(d => d.Department)
                .HasForeignKey(d => d.DepartmentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // College configuration
        modelBuilder.Entity<College>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired();
            entity.HasIndex(e => e.Name).IsUnique();
            entity.HasMany(e => e.Programs)
                .WithOne(p => p.College)
                .HasForeignKey(p => p.CollegeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // AcademicProgram configuration
        modelBuilder.Entity<AcademicProgram>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired();
            entity.Property(e => e.Code).IsRequired();
            entity.Property(e => e.Group).IsRequired();
            entity.HasIndex(e => new { e.CollegeId, e.Name }).IsUnique();
            entity.HasIndex(e => new { e.CollegeId, e.Code }).IsUnique();
        });

        // Document configuration
        modelBuilder.Entity<Document>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ReferenceCode).IsRequired();
            entity.Property(e => e.StudentName).IsRequired();
            entity.Property(e => e.Title).IsRequired();
            entity.Property(e => e.DepartmentId).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();
            entity.HasOne(e => e.Department)
                .WithMany(d => d.Documents)
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ActivityLog configuration
        modelBuilder.Entity<ActivityLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Action).IsRequired();
            entity.Property(e => e.Actor).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
        });

        // GeminiChat configuration
        modelBuilder.Entity<GeminiChat>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Role).IsRequired();
            entity.Property(e => e.Content).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.ConversationId).IsRequired();
            entity.HasIndex(e => e.ConversationId);
        });

        modelBuilder.Entity<StudentMaster>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.StudentNo).IsRequired();
            entity.HasIndex(e => e.StudentNo).IsUnique();
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.DateCreated).IsRequired();
            entity.Property(e => e.DateUpdated).IsRequired();
        });

        modelBuilder.Entity<StudentDocumentRequest>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.RequestCode).IsRequired();
            entity.Property(e => e.StudentNo).IsRequired();
            entity.Property(e => e.StudentName).IsRequired();
            entity.Property(e => e.DocumentType).IsRequired();
            entity.Property(e => e.Status).IsRequired();
            entity.Property(e => e.RequestedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();
            entity.HasIndex(e => e.RequestCode).IsUnique();
            entity.HasIndex(e => new { e.StudentNo, e.Status });
            entity.HasIndex(e => e.DepartmentId);
            entity.HasOne(e => e.Department)
                .WithMany()
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<FaqContextEntry>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ScopeType).IsRequired();
            entity.Property(e => e.Category).IsRequired();
            entity.Property(e => e.Question).IsRequired();
            entity.Property(e => e.Answer).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();
            entity.HasIndex(e => new { e.ScopeType, e.CollegeCode, e.ProgramCode });
            entity.HasIndex(e => e.IsPublished);
        });

        modelBuilder.Entity<EtlUploadBatch>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.BatchId).IsRequired();
            entity.HasIndex(e => e.BatchId).IsUnique();
            entity.Property(e => e.CreatedAt).IsRequired();
        });

        modelBuilder.Entity<EtlUploadFile>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.BatchId).IsRequired();
            entity.Property(e => e.FileName).IsRequired();
            entity.Property(e => e.ScopeKey).IsRequired();
            entity.Property(e => e.ParsedAt).IsRequired();
            entity.HasIndex(e => e.BatchId);
            entity.HasIndex(e => new { e.ScopeKey, e.IsActive });
        });

        modelBuilder.Entity<EtlStagingRow>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.BatchId).IsRequired();
            entity.Property(e => e.Category).IsRequired();
            entity.Property(e => e.FileName).IsRequired();
            entity.Property(e => e.PayloadJson).IsRequired();
            entity.HasIndex(e => new { e.BatchId, e.Category });
            entity.HasIndex(e => new { e.BatchId, e.Status });
        });

        modelBuilder.Entity<CurriculumCourse>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.DateUpdated).IsRequired();
            entity.HasIndex(e => new { e.CollegeCode, e.ProgramCode, e.Level, e.Term, e.Code }).IsUnique();
        });

        modelBuilder.Entity<GradeRecord>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.DateUpdated).IsRequired();
            entity.HasIndex(e => new { e.CollegeCode, e.ProgramCode, e.CourseCode, e.StudentNo }).IsUnique();
        });

        modelBuilder.Entity<SyllabusEntry>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.DateUpdated).IsRequired();
            entity.HasIndex(e => new { e.CollegeCode, e.ProgramCode, e.Code }).IsUnique();
        });
    }
}
