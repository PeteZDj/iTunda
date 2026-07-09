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

    public string LocationDisplay => string.IsNullOrEmpty(LocationTown)
        ? LocationCounty ?? ""
        : $"{LocationTown}, {LocationCounty}";
}
