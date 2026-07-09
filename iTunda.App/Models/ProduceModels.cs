namespace iTunda.App.Models;

public class ProduceResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string Unit { get; set; } = string.Empty;
    public double QuantityAvailable { get; set; }
    public string? ImagePath { get; set; }
    public DateTime? HarvestDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public DateTime? AvailableFrom { get; set; }
    public bool IsExportReady { get; set; }
    public string? GradeQuality { get; set; }
    public int FarmerProfileId { get; set; }
    public string FarmerName { get; set; } = string.Empty;
    public string? FarmerPhone { get; set; }
    public string? FarmerImage { get; set; }
    public string? FarmName { get; set; }
    public string? County { get; set; }
    public string? SubCounty { get; set; }
    public string? Town { get; set; }
    public double? FarmLatitude { get; set; }
    public double? FarmLongitude { get; set; }
    public double FarmerRating { get; set; }
    public int FarmerOrdersFulfilled { get; set; }

    public string? Region { get; set; }
    public string? Country { get; set; }
    public string? CountryCode { get; set; }
    public int Zone { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public List<string> Gallery { get; set; } = new();
    public string IconUrl { get; set; } = string.Empty;

    public string PriceDisplay => $"KES {Price:0} / {Unit}";
    public string QuantityDisplay => $"{QuantityAvailable:0.#} {Unit}";
    public string ExpiryDisplay => ExpiryDate.HasValue ? $"Expires {ExpiryDate.Value:MMM d}" : "Fresh";
    public string LocationDisplay => !string.IsNullOrEmpty(Region)
        ? (string.IsNullOrEmpty(Country) ? Region : $"{Region}, {Country}")
        : (string.IsNullOrEmpty(Town) ? County ?? "" : $"{Town}, {County}");
    public string FlagUrl => string.IsNullOrEmpty(CountryCode)
        ? "https://flagcdn.com/24x18/un.png"
        : $"https://flagcdn.com/24x18/{CountryCode.ToLower()}.png";
    public bool HasGeo => FarmLatitude.HasValue && FarmLongitude.HasValue;
    public string GoogleMapsUrl => $"https://www.google.com/maps?q={FarmLatitude},{FarmLongitude}";
    public bool IsScheduled => AvailableFrom.HasValue && AvailableFrom > DateTime.UtcNow;
    public string AvailabilityDisplay => IsScheduled ? $"Available {AvailableFrom!.Value:MMM d}" : "Available Now";
}

public class CreateProduceRequest
{
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string Unit { get; set; } = "kg";
    public double QuantityAvailable { get; set; }
    public string? ImagePath { get; set; }
    public DateTime? HarvestDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public DateTime? AvailableFrom { get; set; }
    public bool IsExportReady { get; set; }
    public string? GradeQuality { get; set; }
}
