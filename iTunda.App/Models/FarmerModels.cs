namespace iTunda.App.Models;

public class FarmerResponse
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FarmName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Specialization { get; set; }
    public string? Certifications { get; set; }
    public string? LocationCounty { get; set; }
    public string? LocationSubCounty { get; set; }
    public string? LocationTown { get; set; }
    public double? FarmLatitude { get; set; }
    public double? FarmLongitude { get; set; }
    public double SizeOfFarmAcres { get; set; }
    public bool AbleToExportDirectly { get; set; }
    public string? ExportsDomain { get; set; }
    public double RatingFarmer { get; set; }
    public int OrdersFulfilled { get; set; }
    public string? Phone { get; set; }
    public string? ImagePath { get; set; }

    public string? Region { get; set; }
    public string? Country { get; set; }
    public string? CountryCode { get; set; }
    public int Zone { get; set; }
    public List<string> FarmImages { get; set; } = new();

    public string LocationDisplay => !string.IsNullOrEmpty(Region)
        ? (string.IsNullOrEmpty(Country) ? Region : $"{Region}, {Country}")
        : (string.IsNullOrEmpty(LocationTown) ? LocationCounty ?? "" : $"{LocationTown}, {LocationCounty}");
    public string FlagUrl => string.IsNullOrEmpty(CountryCode)
        ? "https://flagcdn.com/24x18/un.png"
        : $"https://flagcdn.com/24x18/{CountryCode.ToLower()}.png";
    public bool HasGeo => FarmLatitude.HasValue && FarmLongitude.HasValue;
    public string GoogleMapsUrl => $"https://www.google.com/maps?q={FarmLatitude},{FarmLongitude}";
}
