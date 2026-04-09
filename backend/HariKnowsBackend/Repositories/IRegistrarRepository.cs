using HariKnowsBackend.Models;

namespace HariKnowsBackend.Repositories;

public interface IRegistrarRepository
{
    IReadOnlyList<DepartmentDto> GetDepartments();

    IReadOnlyList<CollegeDto> GetCollegesWithPrograms();

    CollegeDto CreateCollege(string name);

    CollegeDto? UpdateCollege(int collegeId, string name);

    bool DeleteCollege(int collegeId);

    bool CollegeExists(int collegeId);

    ProgramDto CreateProgram(int collegeId, string name, string code, string group);

    ProgramDto? UpdateProgram(int programId, int collegeId, string name, string code, string group);

    bool DeleteProgram(int programId);

    IReadOnlyList<RegistrarDocumentDto> GetDocuments();

    IReadOnlyList<ActivityLogDto> GetActivity(int limit);

    DepartmentDto CreateDepartment(string name);

    bool DepartmentExists(int departmentId);

    RegistrarDocumentDto CreateDocument(string studentName, string title, int departmentId, string referenceCode, DateTime createdAt);

    (int? DepartmentId, string? ReferenceCode) GetDocumentLocation(int documentId);

    string? GetDepartmentName(int departmentId);

    void MoveDocument(int documentId, int toDepartmentId, DateTime updatedAt);

    void WriteActivity(string action, string actor);

    IReadOnlyList<StudentDirectoryEntryDto> SearchStudents(string? query, int limit);

    IReadOnlyList<StudentDocumentRequestDto> GetStudentRequests(string? studentNo, string? status, int limit);

    StudentDocumentRequestDto? GetStudentRequest(int requestId);

    StudentDocumentRequestDto CreateStudentRequest(string studentNo, string studentName, string documentType, int departmentId, string notes, DateTime now, string requestCode);

    StudentDocumentRequestDto? UpdateStudentRequestStatus(int requestId, string status, string? handledBy, string? disposedReason, string? notes, DateTime now);

    IReadOnlyList<FaqContextEntryDto> GetFaqEntries(string? scopeType, string? collegeCode, string? programCode, bool includeUnpublished, int limit);

    FaqContextEntryDto? GetFaqEntry(int faqId);

    FaqContextEntryDto CreateFaqEntry(CreateFaqContextEntryDto request, DateTime now);

    FaqContextEntryDto? UpdateFaqEntry(int faqId, UpdateFaqContextEntryDto request, DateTime now);

    bool DeleteFaqEntry(int faqId);

    IReadOnlyList<FaqContextEntryDto> SearchFaqEntries(string query, string? scopeType, string? collegeCode, string? programCode, int limit);

    void EnsureDatabaseInitialized();
}
