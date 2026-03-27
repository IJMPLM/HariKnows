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

    void EnsureDatabaseInitialized();
}
