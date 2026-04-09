using HariKnowsBackend.Data;
using GeminiChatbot.Repositories;
using GeminiChatbot.Services;
using HariKnowsBackend.Models;
using HariKnowsBackend.Repositories;
using HariKnowsBackend.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("registrar-defaults.json", optional: false, reloadOnChange: true);

builder.Services.AddOpenApi();
builder.Services.AddControllers()
    .AddApplicationPart(typeof(GeminiChatbot.Controllers.ChatController).Assembly);
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontends", policy =>
    {
        policy
            .WithOrigins("http://localhost:3001", "http://localhost:3002")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var databasePath = Path.Combine(builder.Environment.ContentRootPath, "hariknows.db");
var connectionString = $"Data Source={databasePath}";

// Register DbContext
builder.Services.AddDbContext<HariKnowsDbContext>(options =>
    options.UseSqlite(connectionString)
);

// Register repositories
builder.Services.AddScoped<IHelpdeskRepository, EfHelpdeskRepository>();
builder.Services.AddScoped<IRegistrarRepository, EfRegistrarRepository>();

// Register GeminiChatbot services
builder.Services.AddScoped<IChatsRepository, EfGeminiChatsRepository>();
builder.Services.AddScoped<IGeminiService, GeminiService>();

// Register services
builder.Services.AddScoped<IHelpdeskService, HelpdeskService>();
builder.Services.AddScoped<IRegistrarService, RegistrarService>();
builder.Services.AddScoped<IRegistrarEtlService, RegistrarEtlService>();

var app = builder.Build();

var registrarDefaults = builder.Configuration.GetSection("RegistrarDefaults").Get<RegistrarDefaultsOptions>()
    ?? throw new InvalidOperationException("RegistrarDefaults configuration is missing.");

if (registrarDefaults.Colleges.Count == 0)
{
    throw new InvalidOperationException("RegistrarDefaults must include at least one college.");
}

// Ensure database is initialized
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<HariKnowsDbContext>();
    await db.Database.EnsureCreatedAsync();
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE TABLE IF NOT EXISTS ""GeminiChats"" (
            ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_GeminiChats"" PRIMARY KEY AUTOINCREMENT,
            ""Role"" TEXT NOT NULL,
            ""Content"" TEXT NOT NULL,
            ""CreatedAt"" TEXT NOT NULL,
            ""ConversationId"" TEXT NOT NULL
        );
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE INDEX IF NOT EXISTS ""IX_GeminiChats_ConversationId""
        ON ""GeminiChats"" (""ConversationId"");
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE TABLE IF NOT EXISTS ""Departments"" (
            ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_Departments"" PRIMARY KEY AUTOINCREMENT,
            ""Name"" TEXT NOT NULL
        );
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Departments_Name""
        ON ""Departments"" (""Name"");
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE TABLE IF NOT EXISTS ""Documents"" (
            ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_Documents"" PRIMARY KEY AUTOINCREMENT,
            ""ReferenceCode"" TEXT NOT NULL,
            ""StudentName"" TEXT NOT NULL,
            ""Title"" TEXT NOT NULL,
            ""DepartmentId"" INTEGER NOT NULL,
            ""CreatedAt"" TEXT NOT NULL,
            ""UpdatedAt"" TEXT NOT NULL,
            CONSTRAINT ""FK_Documents_Departments_DepartmentId"" FOREIGN KEY (""DepartmentId"") REFERENCES ""Departments"" (""Id"") ON DELETE CASCADE
        );
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE INDEX IF NOT EXISTS ""IX_Documents_DepartmentId""
        ON ""Documents"" (""DepartmentId"");
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE TABLE IF NOT EXISTS ""ActivityLogs"" (
            ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_ActivityLogs"" PRIMARY KEY AUTOINCREMENT,
            ""Action"" TEXT NOT NULL,
            ""Actor"" TEXT NOT NULL,
            ""CreatedAt"" TEXT NOT NULL
        );
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE TABLE IF NOT EXISTS ""Colleges"" (
            ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_Colleges"" PRIMARY KEY AUTOINCREMENT,
            ""Name"" TEXT NOT NULL
        );
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Colleges_Name""
        ON ""Colleges"" (""Name"");
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE TABLE IF NOT EXISTS ""AcademicPrograms"" (
            ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_AcademicPrograms"" PRIMARY KEY AUTOINCREMENT,
            ""Name"" TEXT NOT NULL,
            ""Code"" TEXT NOT NULL,
            ""Group"" TEXT NOT NULL,
            ""CollegeId"" INTEGER NOT NULL,
            CONSTRAINT ""FK_AcademicPrograms_Colleges_CollegeId"" FOREIGN KEY (""CollegeId"") REFERENCES ""Colleges"" (""Id"") ON DELETE CASCADE
        );
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE UNIQUE INDEX IF NOT EXISTS ""IX_AcademicPrograms_CollegeId_Name""
        ON ""AcademicPrograms"" (""CollegeId"", ""Name"");
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE UNIQUE INDEX IF NOT EXISTS ""IX_AcademicPrograms_CollegeId_Code""
        ON ""AcademicPrograms"" (""CollegeId"", ""Code"");
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE TABLE IF NOT EXISTS ""StudentMasters"" (
            ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_StudentMasters"" PRIMARY KEY AUTOINCREMENT,
            ""StudentNo"" TEXT NOT NULL,
            ""FirstName"" TEXT NOT NULL DEFAULT '',
            ""MiddleName"" TEXT NOT NULL DEFAULT '',
            ""LastName"" TEXT NOT NULL DEFAULT '',
            ""FullName"" TEXT NOT NULL DEFAULT '',
            ""CollegeCode"" TEXT NOT NULL DEFAULT '',
            ""ProgramCode"" TEXT NOT NULL DEFAULT '',
            ""CurrentYear"" INTEGER NULL,
            ""Block"" TEXT NOT NULL DEFAULT '',
            ""EnrollmentStatus"" TEXT NOT NULL DEFAULT '',
            ""BirthCertStatus"" TEXT NOT NULL DEFAULT '',
            ""Form137Status"" TEXT NOT NULL DEFAULT '',
            ""GoodMoralStatus"" TEXT NOT NULL DEFAULT '',
            ""NstpStatus"" TEXT NOT NULL DEFAULT '',
            ""TocStatus"" TEXT NOT NULL DEFAULT '',
            ""Email"" TEXT NOT NULL DEFAULT '',
            ""DateCreated"" TEXT NOT NULL,
            ""DateUpdated"" TEXT NOT NULL
        );
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE UNIQUE INDEX IF NOT EXISTS ""IX_StudentMasters_StudentNo""
        ON ""StudentMasters"" (""StudentNo"");
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE TABLE IF NOT EXISTS ""EtlUploadBatches"" (
            ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_EtlUploadBatches"" PRIMARY KEY AUTOINCREMENT,
            ""BatchId"" TEXT NOT NULL,
            ""CreatedAt"" TEXT NOT NULL,
            ""Status"" TEXT NOT NULL
        );
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE UNIQUE INDEX IF NOT EXISTS ""IX_EtlUploadBatches_BatchId""
        ON ""EtlUploadBatches"" (""BatchId"");
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE TABLE IF NOT EXISTS ""EtlUploadFiles"" (
            ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_EtlUploadFiles"" PRIMARY KEY AUTOINCREMENT,
            ""BatchId"" TEXT NOT NULL,
            ""FileName"" TEXT NOT NULL,
            ""Category"" TEXT NOT NULL,
            ""CollegeCode"" TEXT NOT NULL DEFAULT '',
            ""ProgramCode"" TEXT NOT NULL DEFAULT '',
            ""ParsedRows"" INTEGER NOT NULL,
            ""Status"" TEXT NOT NULL,
            ""Error"" TEXT NOT NULL,
            ""ParsedAt"" TEXT NOT NULL
        );
    ");
    await EnsureSqliteColumnAsync(db, "EtlUploadFiles", "CollegeCode", "TEXT NOT NULL DEFAULT ''");
    await EnsureSqliteColumnAsync(db, "EtlUploadFiles", "ProgramCode", "TEXT NOT NULL DEFAULT ''");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE INDEX IF NOT EXISTS ""IX_EtlUploadFiles_BatchId""
        ON ""EtlUploadFiles"" (""BatchId"");
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE TABLE IF NOT EXISTS ""EtlStagingRows"" (
            ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_EtlStagingRows"" PRIMARY KEY AUTOINCREMENT,
            ""BatchId"" TEXT NOT NULL,
            ""Category"" TEXT NOT NULL,
            ""FileName"" TEXT NOT NULL,
            ""SourceRowNumber"" INTEGER NOT NULL,
            ""StudentNo"" TEXT NOT NULL,
            ""PayloadJson"" TEXT NOT NULL,
            ""Status"" TEXT NOT NULL,
            ""ConflictNote"" TEXT NOT NULL,
            ""Error"" TEXT NOT NULL
        );
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE INDEX IF NOT EXISTS ""IX_EtlStagingRows_BatchId_Status""
        ON ""EtlStagingRows"" (""BatchId"", ""Status"");
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE INDEX IF NOT EXISTS ""IX_EtlStagingRows_BatchId_Category""
        ON ""EtlStagingRows"" (""BatchId"", ""Category"");
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE TABLE IF NOT EXISTS ""CurriculumCourses"" (
            ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_CurriculumCourses"" PRIMARY KEY AUTOINCREMENT,
            ""CollegeCode"" TEXT NOT NULL,
            ""ProgramCode"" TEXT NOT NULL,
            ""Level"" INTEGER NOT NULL,
            ""Term"" INTEGER NOT NULL,
            ""Units"" REAL NOT NULL,
            ""Code"" TEXT NOT NULL,
            ""Title"" TEXT NOT NULL,
            ""DateUpdated"" TEXT NOT NULL
        );
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE UNIQUE INDEX IF NOT EXISTS ""IX_CurriculumCourses_Unique""
        ON ""CurriculumCourses"" (""CollegeCode"", ""ProgramCode"", ""Level"", ""Term"", ""Code"");
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE TABLE IF NOT EXISTS ""GradeRecords"" (
            ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_GradeRecords"" PRIMARY KEY AUTOINCREMENT,
            ""CollegeCode"" TEXT NOT NULL,
            ""ProgramCode"" TEXT NOT NULL,
            ""CourseCode"" TEXT NOT NULL,
            ""StudentNo"" TEXT NOT NULL,
            ""Grade"" TEXT NOT NULL,
            ""DateUpdated"" TEXT NOT NULL
        );
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE UNIQUE INDEX IF NOT EXISTS ""IX_GradeRecords_Unique""
        ON ""GradeRecords"" (""CollegeCode"", ""ProgramCode"", ""CourseCode"", ""StudentNo"");
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE TABLE IF NOT EXISTS ""SyllabusEntries"" (
            ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_SyllabusEntries"" PRIMARY KEY AUTOINCREMENT,
            ""CollegeCode"" TEXT NOT NULL,
            ""ProgramCode"" TEXT NOT NULL,
            ""Code"" TEXT NOT NULL,
            ""Title"" TEXT NOT NULL,
            ""Description"" TEXT NOT NULL,
            ""DateUpdated"" TEXT NOT NULL
        );
    ");
    await db.Database.ExecuteSqlRawAsync(@"
        CREATE UNIQUE INDEX IF NOT EXISTS ""IX_SyllabusEntries_Unique""
        ON ""SyllabusEntries"" (""CollegeCode"", ""ProgramCode"", ""Code"");
    ");
    
    // Seed data if needed
    if (!db.Departments.Any() || !db.Colleges.Any() || !db.AcademicPrograms.Any())
    {
        await EfRegistrarRepository.SeedDataAsync(db, registrarDefaults);
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("frontends");

app.MapControllers();

app.Run();

static async Task EnsureSqliteColumnAsync(HariKnowsDbContext db, string tableName, string columnName, string columnSql)
{
    var connection = db.Database.GetDbConnection();
    await using var command = connection.CreateCommand();
    if (connection.State != System.Data.ConnectionState.Open)
    {
        await connection.OpenAsync();
    }

    command.CommandText = $"PRAGMA table_info(\"{tableName}\");";
    var existingColumns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
    await using (var reader = await command.ExecuteReaderAsync())
    {
        while (await reader.ReadAsync())
        {
            existingColumns.Add(reader.GetString(1));
        }
    }

    if (existingColumns.Contains(columnName))
    {
        return;
    }

    await using var alter = connection.CreateCommand();
    alter.CommandText = $"ALTER TABLE \"{tableName}\" ADD COLUMN \"{columnName}\" {columnSql};";
    await alter.ExecuteNonQueryAsync();
}
