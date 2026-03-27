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
