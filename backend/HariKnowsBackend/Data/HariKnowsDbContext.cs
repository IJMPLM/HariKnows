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
    }
}
