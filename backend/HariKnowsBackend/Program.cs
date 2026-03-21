using HariKnowsBackend.Repositories;
using HariKnowsBackend.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddControllers();
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

builder.Services.AddSingleton<IHelpdeskRepository>(_ => new SqliteHelpdeskRepository(connectionString));
builder.Services.AddSingleton<IRegistrarRepository>(_ => new SqliteRegistrarRepository(connectionString));
builder.Services.AddSingleton<IHelpdeskService, HelpdeskService>();
builder.Services.AddSingleton<IRegistrarService, RegistrarService>();

var app = builder.Build();

app.Services.GetRequiredService<IRegistrarRepository>().EnsureDatabaseInitialized();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("frontends");

app.MapControllers();

app.Run();
