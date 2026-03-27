using HariKnowsBackend.Data;
using GeminiChatbot.Repositories;
using GeminiChatbot.Services;
using HariKnowsBackend.Repositories;
using HariKnowsBackend.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

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
    
    // Seed data if needed
    if (!db.Departments.Any())
    {
        await EfRegistrarRepository.SeedDataAsync(db);
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("frontends");

app.MapControllers();

app.Run();
