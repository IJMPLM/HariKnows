using HariKnowsBackend.Models;
using Microsoft.AspNetCore.Http;

namespace HariKnowsBackend.Services;

public interface IRegistrarEtlService
{
    Task<BulkUploadResultDto> BulkUploadAsync(IReadOnlyList<IFormFile> files, IReadOnlyList<string> incompleteFiles, CancellationToken cancellationToken);
    Task<FaqImportResultDto> ImportFaqTextAsync(IFormFile file, CancellationToken cancellationToken);
    FaqCsvSyncResultDto SyncFaqCsv();
    Task<EtlCommitResultDto> CommitAsync(CommitEtlRequest request, CancellationToken cancellationToken);
    Task<EtlStagingDashboardDto?> GetStagingAsync(string batchId, CancellationToken cancellationToken);
    Task<IReadOnlyList<EtlUploadHistoryEntryDto>> GetUploadHistoryAsync(int limit, CancellationToken cancellationToken);
    Task<IReadOnlyList<CollegeTabDto>> GetAvailableCollegeTabsAsync(CancellationToken cancellationToken);
    Task<bool> ClearStagingAsync(string batchId, CancellationToken cancellationToken);
    Task<FlushDatabaseResultDto> FlushDatabaseAsync(FlushDatabaseRequest request, CancellationToken cancellationToken);
}
