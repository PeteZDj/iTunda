namespace iTunda.Api.Services;

/// <summary>
/// Builds deterministic, free-to-hotlink image + icon URLs for produce and farms.
/// Photos come from loremflickr (keyword-matched marketplace-style stock) and
/// fruit icons from Twemoji (CC-BY 4.0) served over jsDelivr.
/// </summary>
public static class Media
{
    // category -> (photo keyword, twemoji codepoint)
    private static readonly Dictionary<string, (string Keyword, string Emoji)> Map = new()
    {
        ["Avocados"]           = ("avocado",          "1f951"),
        ["Macadamia Nuts"]     = ("macadamia,nuts",   "1f330"),
        ["French Beans"]       = ("green,beans",      "1fad8"),
        ["Tea"]                = ("tea,plantation",   "1f375"),
        ["Peas & Mange Tout"]  = ("peas,pods",        "1fad8"),
        ["Passion Fruit"]      = ("passion,fruit",    "1f349"),
        ["Mangoes"]            = ("mango",            "1f96d"),
        ["Bananas"]            = ("banana,bunch",     "1f34c"),
        ["Tomatoes"]           = ("tomato",           "1f345"),
        ["Onions"]             = ("onion,harvest",    "1f9c5"),
        ["Capsicum & Peppers"] = ("bell,pepper",      "1fad1"),
        ["Roses"]              = ("roses,flowers",    "1f339"),
    };

    private const string TwemojiBase = "https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/72x72/";

    public static string Keyword(string category) =>
        Map.TryGetValue(category, out var v) ? v.Keyword : "farm,produce";

    public static string IconUrl(string category)
    {
        var code = Map.TryGetValue(category, out var v) ? v.Emoji : "1f33e"; // 🌾 fallback
        return $"{TwemojiBase}{code}.png";
    }

    /// <summary>Primary hero photo for a produce listing (deterministic by id).</summary>
    public static string ImageUrl(string category, int seed) =>
        $"https://loremflickr.com/800/600/{Keyword(category)}?lock={seed}";

    /// <summary>A small gallery of related photos for a produce listing.</summary>
    public static List<string> Gallery(string category, int seed, int count = 4)
    {
        var kw = Keyword(category);
        var list = new List<string>(count);
        for (int i = 0; i < count; i++)
            list.Add($"https://loremflickr.com/800/600/{kw}?lock={seed * 17 + i + 1}");
        return list;
    }

    /// <summary>Photos of a farm/growing region for a farmer profile.</summary>
    public static List<string> FarmImages(string? country, int seed, int count = 3)
    {
        var place = string.IsNullOrWhiteSpace(country) ? "farm,field" : $"farm,field,{country.Replace(" ", "")}";
        var list = new List<string>(count);
        for (int i = 0; i < count; i++)
            list.Add($"https://loremflickr.com/1000/560/{place}?lock={seed * 29 + i + 1}");
        return list;
    }
}
