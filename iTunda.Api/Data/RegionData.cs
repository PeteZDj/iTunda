namespace iTunda.Api.Data;

public record RegionInfo(
    string Name,
    string Country,
    string CountryCode,
    int Zone,
    double Lat,
    double Lng,
    string[] Crops);

/// <summary>
/// Top crop-producing regions across four export zones. Coordinates are the
/// approximate centre of each growing region and are used to drop map pins.
/// </summary>
public static class RegionData
{
    public static readonly Dictionary<int, string> ZoneNames = new()
    {
        [1] = "Zone 1 · East Africa",
        [2] = "Zone 2 · Southern Africa",
        [3] = "Zone 3 · Americas",
        [4] = "Zone 4 · Global",
    };

    public static string ZoneName(int zone) => ZoneNames.TryGetValue(zone, out var n) ? n : $"Zone {zone}";

    public static readonly RegionInfo[] All =
    {
        // ── Zone 1 · East Africa ────────────────────────────────────────────
        new("Murang'a",       "Kenya",        "KE", 1, -0.7839, 37.0400, new[]{"Avocados","Macadamia Nuts"}),
        new("Nyeri",          "Kenya",        "KE", 1, -0.4197, 36.9489, new[]{"French Beans","Peas & Mange Tout","Avocados"}),
        new("Kirinyaga",      "Kenya",        "KE", 1, -0.4988, 37.2803, new[]{"Macadamia Nuts","Avocados","Tomatoes"}),
        new("Nakuru",         "Kenya",        "KE", 1, -0.7167, 36.4333, new[]{"Roses","Onions"}),
        new("Nandi Hills",    "Kenya",        "KE", 1,  0.1042, 35.1727, new[]{"Tea"}),
        new("Uasin Gishu",    "Kenya",        "KE", 1,  0.5143, 35.2698, new[]{"Macadamia Nuts","French Beans","Roses"}),
        new("Meru",           "Kenya",        "KE", 1,  0.0463, 37.6559, new[]{"Avocados","Bananas","Macadamia Nuts"}),
        new("Kisii",          "Kenya",        "KE", 1, -0.6817, 34.7669, new[]{"Tomatoes","Bananas"}),
        new("Machakos",       "Kenya",        "KE", 1, -1.5177, 37.2634, new[]{"Capsicum & Peppers","Mangoes","Passion Fruit"}),
        new("Kabale",         "Uganda",       "UG", 1, -1.2489, 29.9899, new[]{"Passion Fruit","Peas & Mange Tout"}),
        new("Mbale",          "Uganda",       "UG", 1,  1.0644, 34.1797, new[]{"Bananas","Avocados"}),
        new("Masaka",         "Uganda",       "UG", 1, -0.3333, 31.7333, new[]{"Bananas","Passion Fruit"}),
        new("Sidama",         "Ethiopia",     "ET", 1,  6.7500, 38.4667, new[]{"Avocados","Passion Fruit"}),
        new("Jimma",          "Ethiopia",     "ET", 1,  7.6733, 36.8344, new[]{"Mangoes","Avocados"}),
        new("Kilimanjaro",    "Tanzania",     "TZ", 1, -3.3349, 37.3404, new[]{"Avocados","Bananas"}),
        new("Arusha",         "Tanzania",     "TZ", 1, -3.3869, 36.6830, new[]{"French Beans","Roses","Peas & Mange Tout"}),

        // ── Zone 2 · Southern Africa ────────────────────────────────────────
        new("Limpopo",        "South Africa", "ZA", 2, -23.8331, 30.1636, new[]{"Avocados","Mangoes"}),
        new("Mpumalanga",     "South Africa", "ZA", 2, -25.4753, 30.9694, new[]{"Avocados","Bananas","Macadamia Nuts"}),
        new("Western Cape",   "South Africa", "ZA", 2, -33.9249, 18.4241, new[]{"Roses","Onions"}),

        // ── Zone 3 · Americas ───────────────────────────────────────────────
        new("Michoacán",      "Mexico",       "MX", 3,  19.5665, -101.7068, new[]{"Avocados"}),
        new("Petorca",        "Chile",        "CL", 3, -32.2500,  -70.9333, new[]{"Avocados"}),
        new("La Libertad",    "Peru",         "PE", 3,  -8.1150,  -79.0289, new[]{"Avocados","Mangoes","Capsicum & Peppers"}),
        new("Antioquia",      "Colombia",     "CO", 3,   6.2518,  -75.5636, new[]{"Avocados","Bananas"}),
        new("São Paulo",      "Brazil",       "BR", 3, -23.5505,  -46.6333, new[]{"Mangoes","Passion Fruit"}),

        // ── Zone 4 · Global ─────────────────────────────────────────────────
        new("Kerala",         "India",        "IN", 4,  10.8505,  76.2711, new[]{"Bananas","Passion Fruit","Mangoes"}),
        new("Málaga",         "Spain",        "ES", 4,  36.7213,  -4.4214, new[]{"Avocados","Mangoes"}),
    };
}
