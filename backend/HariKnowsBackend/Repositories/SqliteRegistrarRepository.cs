using HariKnowsBackend.Models;
using Microsoft.Data.Sqlite;

namespace HariKnowsBackend.Repositories;

public sealed class SqliteRegistrarRepository(string connectionString) : IRegistrarRepository
{
    public IReadOnlyList<CollegeDto> GetCollegesWithPrograms()
    {
        // Legacy SQLite repository is retained for compatibility only.
        return [];
    }

    public CollegeDto CreateCollege(string name)
    {
        throw new NotSupportedException("College CRUD is not supported by SqliteRegistrarRepository.");
    }

    public CollegeDto? UpdateCollege(int collegeId, string name)
    {
        throw new NotSupportedException("College CRUD is not supported by SqliteRegistrarRepository.");
    }

    public bool DeleteCollege(int collegeId)
    {
        throw new NotSupportedException("College CRUD is not supported by SqliteRegistrarRepository.");
    }

    public bool CollegeExists(int collegeId)
    {
        return false;
    }

    public ProgramDto CreateProgram(int collegeId, string name, string code, string group)
    {
        throw new NotSupportedException("Program CRUD is not supported by SqliteRegistrarRepository.");
    }

    public ProgramDto? UpdateProgram(int programId, int collegeId, string name, string code, string group)
    {
        throw new NotSupportedException("Program CRUD is not supported by SqliteRegistrarRepository.");
    }

    public bool DeleteProgram(int programId)
    {
        throw new NotSupportedException("Program CRUD is not supported by SqliteRegistrarRepository.");
    }

    public IReadOnlyList<DepartmentDto> GetDepartments()
    {
        using var connection = new SqliteConnection(connectionString);
        connection.Open();

        var departments = new List<DepartmentDto>();
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT Id, Name FROM Departments ORDER BY Id ASC;";
        using var reader = command.ExecuteReader();
        while (reader.Read())
        {
            departments.Add(new DepartmentDto(reader.GetInt32(0), reader.GetString(1)));
        }

        return departments;
    }

    public IReadOnlyList<RegistrarDocumentDto> GetDocuments()
    {
        using var connection = new SqliteConnection(connectionString);
        connection.Open();

        var documents = new List<RegistrarDocumentDto>();
        using var command = connection.CreateCommand();
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

        return documents;
    }

    public IReadOnlyList<ActivityLogDto> GetActivity(int limit)
    {
        using var connection = new SqliteConnection(connectionString);
        connection.Open();

        var activity = new List<ActivityLogDto>();
        using var command = connection.CreateCommand();
        command.CommandText = @"
            SELECT Id, Action, Actor, CreatedAt
            FROM ActivityLog
            ORDER BY Id DESC
            LIMIT $limit;";
        command.Parameters.AddWithValue("$limit", limit);

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

        return activity;
    }

    public DepartmentDto CreateDepartment(string name)
    {
        using var connection = new SqliteConnection(connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = @"
            INSERT INTO Departments (Name)
            VALUES ($name);
            SELECT last_insert_rowid();";
        command.Parameters.AddWithValue("$name", name);

        var id = Convert.ToInt32(command.ExecuteScalar());
        return new DepartmentDto(id, name);
    }

    public bool DepartmentExists(int departmentId)
    {
        using var connection = new SqliteConnection(connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = "SELECT 1 FROM Departments WHERE Id = $id LIMIT 1;";
        command.Parameters.AddWithValue("$id", departmentId);
        return command.ExecuteScalar() is not null;
    }

    public RegistrarDocumentDto CreateDocument(string studentName, string title, int departmentId, string referenceCode, DateTime createdAt)
    {
        using var connection = new SqliteConnection(connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = @"
            INSERT INTO Documents (ReferenceCode, StudentName, Title, DepartmentId, CreatedAt, UpdatedAt)
            VALUES ($code, $studentName, $title, $departmentId, $createdAt, $createdAt);
            SELECT last_insert_rowid();";
        command.Parameters.AddWithValue("$code", referenceCode);
        command.Parameters.AddWithValue("$studentName", studentName);
        command.Parameters.AddWithValue("$title", title);
        command.Parameters.AddWithValue("$departmentId", departmentId);
        command.Parameters.AddWithValue("$createdAt", createdAt.ToString("O"));

        var id = Convert.ToInt32(command.ExecuteScalar());
        return new RegistrarDocumentDto(id, referenceCode, studentName, title, departmentId, createdAt);
    }

    public (int? DepartmentId, string? ReferenceCode) GetDocumentLocation(int documentId)
    {
        using var connection = new SqliteConnection(connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = @"
            SELECT ReferenceCode, DepartmentId
            FROM Documents
            WHERE Id = $id
            LIMIT 1;";
        command.Parameters.AddWithValue("$id", documentId);

        using var reader = command.ExecuteReader();
        if (!reader.Read())
        {
            return (null, null);
        }

        return (reader.GetInt32(1), reader.GetString(0));
    }

    public string? GetDepartmentName(int departmentId)
    {
        using var connection = new SqliteConnection(connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = "SELECT Name FROM Departments WHERE Id = $id LIMIT 1;";
        command.Parameters.AddWithValue("$id", departmentId);
        return command.ExecuteScalar()?.ToString();
    }

    public void MoveDocument(int documentId, int toDepartmentId, DateTime updatedAt)
    {
        using var connection = new SqliteConnection(connectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = @"
            UPDATE Documents
            SET DepartmentId = $departmentId,
                UpdatedAt = $updatedAt
            WHERE Id = $id;";
        command.Parameters.AddWithValue("$departmentId", toDepartmentId);
        command.Parameters.AddWithValue("$updatedAt", updatedAt.ToString("O"));
        command.Parameters.AddWithValue("$id", documentId);
        command.ExecuteNonQuery();
    }

    public void WriteActivity(string action, string actor)
    {
        using var connection = new SqliteConnection(connectionString);
        connection.Open();

        WriteActivity(connection, action, actor);
    }

    public IReadOnlyList<StudentDirectoryEntryDto> SearchStudents(string? query, int limit)
    {
        return [];
    }

    public StudentDirectoryEntryDto? UpdateStudentCredentials(string studentNo, string email, string passwordHash, DateTime updatedAt)
    {
        throw new NotSupportedException("Student account operations are not supported by SqliteRegistrarRepository.");
    }

    public StudentStatusDto? GetStudentStatus(string studentNo)
    {
        return null;
    }

    public StudentGradeSnapshotDto GetStudentGradeSnapshot(string studentNo)
    {
        return new StudentGradeSnapshotDto(0, 0, null);
    }

    public int GetCurriculumCourseCount(string collegeCode, string programCode)
    {
        return 0;
    }

    public IReadOnlyList<CurriculumCourseSnapshotDto> GetCurriculumCourses(string collegeCode, string programCode, int limit)
    {
        return [];
    }

    public int GetSyllabusEntryCount(string collegeCode, string programCode)
    {
        return 0;
    }

    public IReadOnlyList<SyllabusEntrySnapshotDto> GetSyllabusEntries(string collegeCode, string programCode, int limit)
    {
        return [];
    }

    public IReadOnlyList<StudentDocumentRequestDto> GetStudentRequests(string? studentNo, string? status, int limit)
    {
        return [];
    }

    public StudentDocumentRequestDto? GetStudentRequest(int requestId)
    {
        return null;
    }

    public StudentDocumentRequestDto CreateStudentRequest(string studentNo, string studentName, string documentType, int departmentId, string notes, DateTime now, string requestCode)
    {
        throw new NotSupportedException("Student request operations are not supported by SqliteRegistrarRepository.");
    }

    public StudentDocumentRequestDto? UpdateStudentRequestStatus(int requestId, string status, string? handledBy, string? disposedReason, string? notes, DateTime now)
    {
        throw new NotSupportedException("Student request operations are not supported by SqliteRegistrarRepository.");
    }

    public IReadOnlyList<FaqContextEntryDto> GetFaqEntries(string? scopeType, string? collegeCode, string? programCode, bool includeUnpublished, int limit)
    {
        return [];
    }

    public FaqContextEntryDto? GetFaqEntry(int faqId)
    {
        return null;
    }

    public FaqContextEntryDto CreateFaqEntry(CreateFaqContextEntryDto request, DateTime now)
    {
        throw new NotSupportedException("FAQ operations are not supported by SqliteRegistrarRepository.");
    }

    public FaqContextEntryDto? UpdateFaqEntry(int faqId, UpdateFaqContextEntryDto request, DateTime now)
    {
        throw new NotSupportedException("FAQ operations are not supported by SqliteRegistrarRepository.");
    }

    public bool DeleteFaqEntry(int faqId)
    {
        throw new NotSupportedException("FAQ operations are not supported by SqliteRegistrarRepository.");
    }

    public IReadOnlyList<FaqContextEntryDto> SearchFaqEntries(string query, string? scopeType, string? collegeCode, string? programCode, int limit)
    {
        return [];
    }

    public void EnsureDatabaseInitialized()
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

        using (var command = connection.CreateCommand())
        {
            command.CommandText = "SELECT 1 FROM Departments LIMIT 1;";
            if (command.ExecuteScalar() is not null)
            {
                return;
            }
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

    private static void WriteActivity(SqliteConnection connection, string action, string actor)
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
}
