using Microsoft.AspNetCore.Http;
using HariKnowsBackend.Models;

namespace HariKnowsBackend.Services;

public interface IRegistrarService
{
    RegistrarStateDto GetState();

    RegistrarCatalogDto GetCatalog();

    CollegeMutationResult CreateCollege(CreateCollegeRequest request);

    CollegeMutationResult UpdateCollege(int collegeId, UpdateCollegeRequest request);

    MutationResult DeleteCollege(int collegeId);

    ProgramMutationResult CreateProgram(int collegeId, CreateProgramRequest request);

    ProgramMutationResult UpdateProgram(int programId, UpdateProgramRequest request);

    MutationResult DeleteProgram(int programId);

    DepartmentCreateResult CreateDepartment(CreateDepartmentRequest request);

    DocumentCreateResult CreateDocument(CreateRegistrarDocumentRequest request);

    DocumentMoveResult MoveDocument(int documentId, MoveDocumentRequest request);

    IReadOnlyList<StudentDirectoryEntryDto> SearchStudents(string? query, int limit);

    StudentDirectoryEntryDto? UpdateStudentCredentials(UpsertStudentCredentialsRequestDto request);

    IctoAccountImportResultDto ImportIctoAccounts(IFormFile file, CancellationToken cancellationToken);

    IReadOnlyList<StudentDocumentRequestDto> GetStudentRequests(string? studentNo, string? status, int limit);

    StudentDocumentRequestDto CreateStudentRequest(CreateStudentDocumentRequestDto request);

    RequestStatusMutationResult UpdateStudentRequestStatus(int requestId, UpdateStudentDocumentStatusDto request);

    IReadOnlyList<FaqContextEntryDto> GetFaqEntries(string? scopeType, string? collegeCode, string? programCode, bool includeUnpublished, int limit);

    FaqContextEntryDto? GetFaqEntry(int faqId);

    FaqContextEntryDto CreateFaqEntry(CreateFaqContextEntryDto request);

    FaqContextEntryDto? UpdateFaqEntry(int faqId, UpdateFaqContextEntryDto request);

    bool DeleteFaqEntry(int faqId);

    IReadOnlyList<UncertainQuestionDto> GetUncertainQuestions(string? status, int limit);

    UncertainQuestionDto? GetUncertainQuestion(int questionId);

    (UncertainQuestionDto Question, FaqContextEntryDto CreatedEntry)? ResolveUncertainQuestion(int questionId, ResolveUncertainQuestionRequestDto request);

    UncertainQuestionDto? CloseUncertainQuestion(int questionId, CloseUncertainQuestionRequestDto request);
}

public record DepartmentCreateResult(bool Success, bool NameConflict, string? Error, DepartmentDto? Department);

public record CollegeMutationResult(bool Success, bool NameConflict, bool NotFound, string? Error, CollegeDto? College);

public record ProgramMutationResult(bool Success, bool NameConflict, bool NotFound, string? Error, ProgramDto? Program);

public record MutationResult(bool Success, bool NotFound, string? Error);

public record DocumentCreateResult(bool Success, string? Error, RegistrarDocumentDto? Document);

public record DocumentMoveResult(bool Success, bool NotFound, string? Error, bool? Moved);

public record RequestStatusMutationResult(bool Success, bool NotFound, bool InvalidTransition, string? Error, StudentDocumentRequestDto? Request);
