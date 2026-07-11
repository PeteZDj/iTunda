using System.Net.Http.Json;
using System.Text.Json;

namespace iTunda.App.Services;

// App-wide currency selection + conversion. Prices are stored in KES; this
// converts/formats them into the user's chosen currency. Live rates are pulled
// from open.er-api.com with sensible static fallbacks so it always works offline.
public static class Currency
{
    public record Info(string Code, string Symbol, int Decimals);

    public static readonly Info[] All =
    {
        new("KES", "KSh ", 0),
        new("USD", "$", 2),
        new("EUR", "\u20AC", 2),
        new("GBP", "\u00A3", 2),
        new("AED", "AED ", 2),
        new("ZAR", "R", 2),
        new("NGN", "\u20A6", 0),
        new("INR", "\u20B9", 0),
    };

    public static Info Current { get; private set; } = All[0];

    // Target units per 1 KES (static fallback; refreshed by LoadRatesAsync).
    static readonly Dictionary<string, decimal> Rates = new()
    {
        ["KES"] = 1m,
        ["USD"] = 0.0077m,
        ["EUR"] = 0.0071m,
        ["GBP"] = 0.0061m,
        ["AED"] = 0.028m,
        ["ZAR"] = 0.14m,
        ["NGN"] = 11.5m,
        ["INR"] = 0.65m,
    };

    public static event Action? Changed;

    public static void Set(string code)
    {
        var info = All.FirstOrDefault(x => x.Code == code);
        if (info is not null && info.Code != Current.Code)
        {
            Current = info;
            Changed?.Invoke();
        }
    }

    public static decimal Convert(decimal kes) =>
        kes * (Rates.TryGetValue(Current.Code, out var r) ? r : 1m);

    public static string Format(decimal kes)
    {
        var v = Convert(kes);
        return Current.Decimals == 0 ? $"{Current.Symbol}{v:N0}" : $"{Current.Symbol}{v:N2}";
    }

    static bool _loaded;

    public static async Task LoadRatesAsync()
    {
        if (_loaded) return;
        try
        {
            using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(8) };
            var doc = await http.GetFromJsonAsync<JsonElement>("https://open.er-api.com/v6/latest/KES");
            if (doc.TryGetProperty("rates", out var rates) && rates.ValueKind == JsonValueKind.Object)
            {
                foreach (var info in All)
                {
                    if (rates.TryGetProperty(info.Code, out var v) && v.TryGetDecimal(out var d) && d > 0)
                        Rates[info.Code] = d;
                }
                _loaded = true;
            }
        }
        catch
        {
            // keep static fallbacks
        }
    }
}
