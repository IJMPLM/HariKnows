using System.Text;
using HariKnowsBackend.Data;
using HariKnowsBackend.Data.Entities;
using HariKnowsBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace HariKnowsBackend.Services;

public interface IFaqCsvSyncService
{
    FaqCsvSyncResultDto SyncFromDatabase();
}

public sealed class FaqCsvSyncService(HariKnowsDbContext dbContext, IHostEnvironment hostEnvironment) : IFaqCsvSyncService
{
    public FaqCsvSyncResultDto SyncFromDatabase()
    {
        var normalizedRows = NormalizeCategories();

        var allEntries = dbContext.FaqContextEntries
            .AsNoTracking()
            .OrderBy(entry => entry.ScopeType)
            .ThenBy(entry => entry.Category)
            .ThenBy(entry => entry.Question)
            .ToList();

        var exportEntries = allEntries
            .DistinctBy(BuildExportKey)
            .ToList();

        var faqRows = exportEntries.Where(entry => PromptRoleTags.IsFaq(entry.ScopeType)).ToList();
        var contextRows = exportEntries.Where(entry => !PromptRoleTags.IsFaq(entry.ScopeType)).ToList();

        var faqPath = ResolveDocsContextPath("faqs.csv");
        var contextPath = ResolveDocsContextPath("consolidated_context.csv");

        WriteCsv(faqPath, faqRows);
        WriteCsv(contextPath, contextRows);

        return new FaqCsvSyncResultDto(
            faqRows.Count,
            contextRows.Count,
            normalizedRows,
            faqPath,
            contextPath
        );
    }

    private int NormalizeCategories()
    {
        var candidates = dbContext.FaqContextEntries
            .ToList();

        var changed = 0;
        foreach (var entry in candidates)
        {
            var normalizedScope = NormalizeLegacyScope(entry.ScopeType, entry.Category);
            var expectedCategory = PromptRoleTagCategoryMapper.DeriveCategory(normalizedScope, entry.Category);

            if (entry.ScopeType != normalizedScope)
            {
                entry.ScopeType = normalizedScope;
                changed++;
            }

            if (!string.Equals(entry.Category, expectedCategory, StringComparison.OrdinalIgnoreCase))
            {
                entry.Category = expectedCategory;
                changed++;
            }
        }

        if (changed > 0)
        {
            dbContext.SaveChanges();
        }

        return changed;
    }

    private static string NormalizeLegacyScope(string scopeType, string category)
    {
        var normalizedScope = PromptRoleTags.Normalize(scopeType);
        if (PromptRoleTags.IsValid(normalizedScope))
        {
            return normalizedScope;
        }

        var normalizedCategory = category.Trim().ToLowerInvariant();
        var isFaqCategory = normalizedCategory == "faq";

        if (normalizedScope is "global" or "general")
        {
            return isFaqCategory ? PromptRoleTags.FaqGeneral : PromptRoleTags.ContextGeneral;
        }

        if (normalizedScope is "non-guest" or "non_guest" or "nonguest" or "student")
        {
            return isFaqCategory ? PromptRoleTags.FaqStudent : PromptRoleTags.ContextStudent;
        }

        return PromptRoleTags.Other;
    }

    private static void WriteCsv(string targetPath, IReadOnlyList<FaqContextEntry> rows)
    {
        var directory = Path.GetDirectoryName(targetPath);
        if (!string.IsNullOrWhiteSpace(directory))
        {
            Directory.CreateDirectory(directory);
        }

        using var writer = new StreamWriter(targetPath, false, new UTF8Encoding(false));
        writer.WriteLine("promptRoleTag,category,title,answer");
        foreach (var row in rows)
        {
            writer.WriteLine(string.Join(",", new[]
            {
                EscapeCsv(PromptRoleTags.Normalize(row.ScopeType)),
                EscapeCsv(PromptRoleTagCategoryMapper.DeriveCategory(row.ScopeType, row.Category)),
                EscapeCsv(row.Question),
                EscapeCsv(row.Answer)
            }));
        }
    }

    private static string BuildExportKey(FaqContextEntry entry)
    {
        return string.Join(
            "|",
            PromptRoleTags.Normalize(entry.ScopeType),
            PromptRoleTagCategoryMapper.DeriveCategory(entry.ScopeType, entry.Category),
            entry.Question.Trim(),
            entry.Answer.Trim()
        );
    }

    private string ResolveDocsContextPath(string fileName)
    {
        return Path.GetFullPath(Path.Combine(hostEnvironment.ContentRootPath, "..", "..", "docs", "context", fileName));
    }

    private static string EscapeCsv(string value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return string.Empty;
        }

        var escaped = value.Replace("\"", "\"\"");
        return escaped.IndexOfAny([',', '"', '\n', '\r']) >= 0
            ? $"\"{escaped}\""
            : escaped;
    }
}