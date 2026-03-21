using Microsoft.Data.Sqlite;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
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

var app = builder.Build();
var databasePath = Path.Combine(app.Environment.ContentRootPath, "hariknows.db");
var connectionString = $"Data Source={databasePath}";

InitializeDatabase(connectionString);

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("frontends");

app.MapPost("/api/helpdesk/messages", (CreateChatMessageRequest request) =>
{
    if (string.IsNullOrWhiteSpace(request.Content))
    {
        return Results.BadRequest(new { error = "Content is required." });
    }

    var sender = string.IsNullOrWhiteSpace(request.Sender) ? "user" : request.Sender.Trim().ToLowerInvariant();
    var createdAt = DateTime.UtcNow;

    using var connection = new SqliteConnection(connectionString);
    connection.Open();

    using var command = connection.CreateCommand();
    command.CommandText = @"
        INSERT INTO ChatMessages (Sender, Content, CreatedAt)
        VALUES ($sender, $content, $createdAt);
        SELECT last_insert_rowid();";
    command.Parameters.AddWithValue("$sender", sender);
    command.Parameters.AddWithValue("$content", request.Content.Trim());
    command.Parameters.AddWithValue("$createdAt", createdAt.ToString("O"));

    var id = Convert.ToInt32(command.ExecuteScalar());

    return Results.Ok(new ChatMessageDto(id, sender, request.Content.Trim(), createdAt));
});

app.MapGet("/api/helpdesk/messages", (int? beforeId, int? afterId, int? limit) =>
{
    var requestedLimit = Math.Clamp(limit ?? 20, 1, 100);
    var take = requestedLimit + 1;

    using var connection = new SqliteConnection(connectionString);
    connection.Open();

    using var command = connection.CreateCommand();

    if (afterId.HasValue)
    {
        command.CommandText = @"
            SELECT Id, Sender, Content, CreatedAt
            FROM ChatMessages
            WHERE Id > $afterId
            ORDER BY Id ASC
            LIMIT $take;";
        command.Parameters.AddWithValue("$afterId", afterId.Value);
    }
    else if (beforeId.HasValue)
    {
        command.CommandText = @"
            SELECT Id, Sender, Content, CreatedAt
            FROM ChatMessages
            WHERE Id < $beforeId
            ORDER BY Id DESC
            LIMIT $take;";
        command.Parameters.AddWithValue("$beforeId", beforeId.Value);
    }
    else
    {
        command.CommandText = @"
            SELECT Id, Sender, Content, CreatedAt
            FROM ChatMessages
            ORDER BY Id DESC
            LIMIT $take;";
    }

    command.Parameters.AddWithValue("$take", take);

    var rows = new List<ChatMessageDto>();
    using (var reader = command.ExecuteReader())
    {
        while (reader.Read())
        {
            rows.Add(new ChatMessageDto(
                reader.GetInt32(0),
                reader.GetString(1),
                reader.GetString(2),
                DateTime.Parse(reader.GetString(3), null, System.Globalization.DateTimeStyles.RoundtripKind)
            ));
        }
    }

    var hasMore = rows.Count > requestedLimit;
    if (hasMore)
    {
        rows.RemoveAt(rows.Count - 1);
    }

    if (!afterId.HasValue)
    {
        rows.Reverse();
    }

    return Results.Ok(new
    {
        messages = rows,
        hasMore
    });
});

app.MapGet("/api/registrar/state", () =>
{
    using var connection = new SqliteConnection(connectionString);
    connection.Open();

    var departments = new List<DepartmentDto>();
    using (var command = connection.CreateCommand())
    {
        command.CommandText = "SELECT Id, Name FROM Departments ORDER BY Id ASC;";
        using var reader = command.ExecuteReader();
        while (reader.Read())
        {
            departments.Add(new DepartmentDto(reader.GetInt32(0), reader.GetString(1)));
        }
    }

    var documents = new List<RegistrarDocumentDto>();
    using (var command = connection.CreateCommand())
    {
        command.CommandText = @"
            SELECT Id, ReferenceCode, StudentName, Title, DepartmentId, CreatedAt
            FROM Documents
            ORDER BY Id ASC;";
        using var reader = command.ExecuteReader();
        while (reader.Read())
        {
            documents.Add(new RegistrarDocumentDto(
                reader.GetInt32(0),
                reader.GetString(1),
                reader.GetString(2),
                reader.GetString(3),
                reader.GetInt32(4),
                DateTime.Parse(reader.GetString(5), null, System.Globalization.DateTimeStyles.RoundtripKind)
            ));
        }
    }

    var activity = new List<ActivityLogDto>();
    using (var command = connection.CreateCommand())
    {
        command.CommandText = @"
            SELECT Id, Action, Actor, CreatedAt
            FROM ActivityLog
            ORDER BY Id DESC
            LIMIT 60;";
        using var reader = command.ExecuteReader();
        while (reader.Read())
        {
            activity.Add(new ActivityLogDto(
                reader.GetInt32(0),
                reader.GetString(1),
                reader.GetString(2),
                DateTime.Parse(reader.GetString(3), null, System.Globalization.DateTimeStyles.RoundtripKind)
            ));
        }
    }

    return Results.Ok(new { departments, documents, activity });
});

app.MapPost("/api/registrar/departments", (CreateDepartmentRequest request) =>
{
    if (string.IsNullOrWhiteSpace(request.Name))
    {
        return Results.BadRequest(new { error = "Department name is required." });
    }

    using var connection = new SqliteConnection(connectionString);
    connection.Open();

    using var command = connection.CreateCommand();
    command.CommandText = @"
        INSERT INTO Departments (Name)
        VALUES ($name);
        SELECT last_insert_rowid();";
    command.Parameters.AddWithValue("$name", request.Name.Trim());

    try
    {
        var id = Convert.ToInt32(command.ExecuteScalar());
        WriteActivity(connection, $"Department created: {request.Name.Trim()}", "Admin");
        return Results.Ok(new DepartmentDto(id, request.Name.Trim()));
    }
    catch (SqliteException ex) when (ex.SqliteErrorCode == 19)
    {
        return Results.Conflict(new { error = "Department name already exists." });
    }
});

app.MapPost("/api/registrar/documents", (CreateRegistrarDocumentRequest request) =>
{
    if (string.IsNullOrWhiteSpace(request.StudentName) || string.IsNullOrWhiteSpace(request.Title))
    {
        return Results.BadRequest(new { error = "Student name and title are required." });
    }

    using var connection = new SqliteConnection(connectionString);
    connection.Open();

    var departmentExists = false;
    using (var command = connection.CreateCommand())
    {
        command.CommandText = "SELECT 1 FROM Departments WHERE Id = $id LIMIT 1;";
        command.Parameters.AddWithValue("$id", request.DepartmentId);
        departmentExists = command.ExecuteScalar() is not null;
    }

    if (!departmentExists)
    {
        return Results.BadRequest(new { error = "Department does not exist." });
    }

    var createdAt = DateTime.UtcNow;
    var code = $"#S-{Random.Shared.Next(10000, 99999)}";

    using (var command = connection.CreateCommand())
    {
        command.CommandText = @"
            INSERT INTO Documents (ReferenceCode, StudentName, Title, DepartmentId, CreatedAt, UpdatedAt)
            VALUES ($code, $studentName, $title, $departmentId, $createdAt, $createdAt);
            SELECT last_insert_rowid();";
        command.Parameters.AddWithValue("$code", code);
        command.Parameters.AddWithValue("$studentName", request.StudentName.Trim());
        command.Parameters.AddWithValue("$title", request.Title.Trim());
        command.Parameters.AddWithValue("$departmentId", request.DepartmentId);
        command.Parameters.AddWithValue("$createdAt", createdAt.ToString("O"));

        var id = Convert.ToInt32(command.ExecuteScalar());
        WriteActivity(connection, $"New document created: {code} for {request.StudentName.Trim()}", "System");

        return Results.Ok(new RegistrarDocumentDto(
            id,
            code,
            request.StudentName.Trim(),
            request.Title.Trim(),
            request.DepartmentId,
            createdAt
        ));
    }
});

app.MapPost("/api/registrar/documents/{documentId:int}/move", (int documentId, MoveDocumentRequest request) =>
{
    using var connection = new SqliteConnection(connectionString);
    connection.Open();

    int? fromDepartmentId = null;
    string? referenceCode = null;

    using (var command = connection.CreateCommand())
    {
        command.CommandText = @"
            SELECT ReferenceCode, DepartmentId
            FROM Documents
            WHERE Id = $id
            LIMIT 1;";
        command.Parameters.AddWithValue("$id", documentId);

        using var reader = command.ExecuteReader();
        if (reader.Read())
        {
            referenceCode = reader.GetString(0);
            fromDepartmentId = reader.GetInt32(1);
        }
    }

    if (!fromDepartmentId.HasValue)
    {
        return Results.NotFound(new { error = "Document not found." });
    }

    var targetDepartmentName = string.Empty;
    using (var command = connection.CreateCommand())
    {
        command.CommandText = "SELECT Name FROM Departments WHERE Id = $id LIMIT 1;";
        command.Parameters.AddWithValue("$id", request.ToDepartmentId);
        targetDepartmentName = command.ExecuteScalar()?.ToString() ?? string.Empty;
    }

    if (string.IsNullOrWhiteSpace(targetDepartmentName))
    {
        return Results.BadRequest(new { error = "Target department does not exist." });
    }

    if (fromDepartmentId.Value == request.ToDepartmentId)
    {
        return Results.Ok(new { moved = false });
    }

    using (var command = connection.CreateCommand())
    {
        command.CommandText = @"
            UPDATE Documents
            SET DepartmentId = $departmentId,
                UpdatedAt = $updatedAt
            WHERE Id = $id;";
        command.Parameters.AddWithValue("$departmentId", request.ToDepartmentId);
        command.Parameters.AddWithValue("$updatedAt", DateTime.UtcNow.ToString("O"));
        command.Parameters.AddWithValue("$id", documentId);
        command.ExecuteNonQuery();
    }

    WriteActivity(connection, $"Document {referenceCode} moved to {targetDepartmentName}", "Admin");
    return Results.Ok(new { moved = true });
});

app.Run();

static void InitializeDatabase(string connectionString)
{
    using var connection = new SqliteConnection(connectionString);
    connection.Open();

    using (var command = connection.CreateCommand())
    {
        command.CommandText = @"
            CREATE TABLE IF NOT EXISTS ChatMessages (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Sender TEXT NOT NULL,
                Content TEXT NOT NULL,
                CreatedAt TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS Departments (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Name TEXT NOT NULL UNIQUE
            );

            CREATE TABLE IF NOT EXISTS Documents (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                ReferenceCode TEXT NOT NULL,
                StudentName TEXT NOT NULL,
                Title TEXT NOT NULL,
                DepartmentId INTEGER NOT NULL,
                CreatedAt TEXT NOT NULL,
                UpdatedAt TEXT NOT NULL,
                FOREIGN KEY (DepartmentId) REFERENCES Departments(Id)
            );

            CREATE TABLE IF NOT EXISTS ActivityLog (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Action TEXT NOT NULL,
                Actor TEXT NOT NULL,
                CreatedAt TEXT NOT NULL
            );";
        command.ExecuteNonQuery();
    }

    var hasDepartments = false;
    using (var command = connection.CreateCommand())
    {
        command.CommandText = "SELECT 1 FROM Departments LIMIT 1;";
        hasDepartments = command.ExecuteScalar() is not null;
    }

    if (hasDepartments)
    {
        return;
    }

    var seedDepartments = new[] { "Registrar", "Department A", "Department B", "Department C" };
    foreach (var department in seedDepartments)
    {
        using var departmentCommand = connection.CreateCommand();
        departmentCommand.CommandText = "INSERT INTO Departments (Name) VALUES ($name);";
        departmentCommand.Parameters.AddWithValue("$name", department);
        departmentCommand.ExecuteNonQuery();
    }

    var now = DateTime.UtcNow.ToString("O");
    var seedDocuments = new[]
    {
        new { Code = "#S-10452", Student = "Jane Doe", Title = "Transcript Verify", DepartmentId = 1 },
        new { Code = "#S-10983", Student = "Marcus Sterling", Title = "Enrollment Audit", DepartmentId = 1 },
        new { Code = "#S-11004", Student = "Elias Vance", Title = "Research Grant", DepartmentId = 3 }
    };

    foreach (var document in seedDocuments)
    {
        using var documentCommand = connection.CreateCommand();
        documentCommand.CommandText = @"
            INSERT INTO Documents (ReferenceCode, StudentName, Title, DepartmentId, CreatedAt, UpdatedAt)
            VALUES ($code, $student, $title, $departmentId, $createdAt, $createdAt);";
        documentCommand.Parameters.AddWithValue("$code", document.Code);
        documentCommand.Parameters.AddWithValue("$student", document.Student);
        documentCommand.Parameters.AddWithValue("$title", document.Title);
        documentCommand.Parameters.AddWithValue("$departmentId", document.DepartmentId);
        documentCommand.Parameters.AddWithValue("$createdAt", now);
        documentCommand.ExecuteNonQuery();
    }

    WriteActivity(connection, "Initial registrar workflow seeded.", "System");
}

static void WriteActivity(SqliteConnection connection, string action, string actor)
{
    using var command = connection.CreateCommand();
    command.CommandText = @"
        INSERT INTO ActivityLog (Action, Actor, CreatedAt)
        VALUES ($action, $actor, $createdAt);";
    command.Parameters.AddWithValue("$action", action);
    command.Parameters.AddWithValue("$actor", actor);
    command.Parameters.AddWithValue("$createdAt", DateTime.UtcNow.ToString("O"));
    command.ExecuteNonQuery();
}

record CreateChatMessageRequest(string Sender, string Content);
record ChatMessageDto(int Id, string Sender, string Content, DateTime CreatedAt);

record DepartmentDto(int Id, string Name);
record CreateDepartmentRequest(string Name);

record RegistrarDocumentDto(int Id, string ReferenceCode, string StudentName, string Title, int DepartmentId, DateTime CreatedAt);
record CreateRegistrarDocumentRequest(string StudentName, string Title, int DepartmentId);
record MoveDocumentRequest(int ToDepartmentId);

record ActivityLogDto(int Id, string Action, string Actor, DateTime CreatedAt);