using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using iTunda.Api.Data;

namespace iTunda.Api.Services;

// Turns a display name into a URL-safe handle (e.g. "James Kamau" -> "james-kamau")
// and guarantees uniqueness across the Users table.
public static class Slug
{
    public static string Make(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return "user";

        // Strip accents/diacritics so "Miguel Hernández" -> "miguel-hernandez".
        var normalized = input.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(normalized.Length);
        foreach (var ch in normalized)
        {
            var cat = CharUnicodeInfo.GetUnicodeCategory(ch);
            if (cat == UnicodeCategory.NonSpacingMark) continue;
            if (char.IsLetterOrDigit(ch)) sb.Append(char.ToLowerInvariant(ch));
            else if (ch is ' ' or '-' or '_' or '.' or '&' or '/' or '\'') sb.Append('-');
        }

        var slug = sb.ToString();
        while (slug.Contains("--")) slug = slug.Replace("--", "-");
        slug = slug.Trim('-');
        return string.IsNullOrEmpty(slug) ? "user" : slug;
    }

    // Returns a unique username for the DB, appending -2, -3, ... on collision.
    public static async Task<string> UniqueAsync(ItundaDbContext db, string? name, HashSet<string>? reserved = null)
    {
        var baseSlug = Make(name);
        var candidate = baseSlug;
        var n = 2;
        while ((reserved != null && reserved.Contains(candidate)) ||
               await db.Users.AnyAsync(u => u.Username == candidate))
        {
            candidate = $"{baseSlug}-{n++}";
        }
        reserved?.Add(candidate);
        return candidate;
    }
}
