namespace HariKnowsBackend.Models;

public record BulkUploadResultDto(
    string BatchId,
    EtlStagingDashboardDto Staging,
    IReadOnlyList<EtlFileResultDto> Files,
    IReadOnlyList<EtlConflictDto> Conflicts,
    IReadOnlyList<EtlErrorDto> Errors
);

public record EtlStagingDashboardDto(
    IReadOnlyList<EtlRowDto> Departments,
    IReadOnlyList<EtlRowDto> Admissions,
    IReadOnlyList<EtlRowDto> Discipline,
    IReadOnlyList<EtlRowDto> Service,
    IReadOnlyList<EtlRowDto> Technology,
    IReadOnlyList<EtlRowDto> Students,
    IReadOnlyList<EtlRowDto> Grades,
    IReadOnlyList<EtlRowDto> Curriculums,
    IReadOnlyList<EtlRowDto> Syllabi,
    IReadOnlyList<EtlRowDto> Thesis
);

public record EtlRowDto(
    int StagingId,
    string Category,
    string FileName,
    int SourceRow,
    string Status,
    string ConflictNote,
    string Error,
    Dictionary<string, string> Data
);

public record EtlFileResultDto(string FileName, string Category, int ParsedRows, string Status, string Error);

public record EtlConflictDto(int StagingId, string FileName, string StudentNo, string Note);

public record EtlErrorDto(string FileName, int Row, string Message);

public record FaqImportResultDto(int Imported, int Updated, int Skipped);

public record FaqCsvSyncResultDto(
    int FaqRows,
    int ContextRows,
    int NormalizedRows,
    string FaqCsvPath,
    string ContextCsvPath
);

public record CommitEtlRequest(string BatchId, IReadOnlyList<EtlDecisionDto> Decisions);

public record EtlDecisionDto(int StagingId, string Action);

public record EtlCommitResultDto(int Inserted, int Updated, int Skipped, int Errors);

public record EtlUploadHistoryEntryDto(
    string BatchId,
    string FileName,
    string Category,
    string CollegeCode,
    string ProgramCode,
    int ParsedRows,
    string Status,
    bool IsActive,
    bool IsIncomplete,
    string Error,
    DateTime ParsedAt
);

public record CollegeTabDto(string Code, string Label, string Href);

public record FlushDatabaseRequest(string Confirmation);

public record FlushDatabaseResultDto(
    bool Flushed,
    int DeletedStudents,
    int DeletedCurriculumCourses,
    int DeletedStagingRows,
    int DeletedStagingFiles,
    int DeletedStagingBatches,
    int DeletedDocuments,
    int DeletedActivityLogs,
    int DeletedPrograms,
    int DeletedColleges,
    int DeletedDepartments,
    int DeletedStudentRequests,
    int DeletedFaqEntries,
    int DeletedGeminiChats
);
