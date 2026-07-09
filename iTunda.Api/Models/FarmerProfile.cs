namespace iTunda.Api.Models;

public class FarmerProfile
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }

    public string FarmName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Experience { get; set; }
    public string? Specialization { get; set; }
    public string? Certifications { get; set; }

    public string? LocationCounty { get; set; }
    public string? LocationSubCounty { get; set; }
    public string? LocationTown { get; set; }
    public double? FarmLatitude { get; set; }
    public double? FarmLongitude { get; set; }

    // Regional / export-zone metadata
    public string? Region { get; set; }
    public string? Country { get; set; }
    public string? CountryCode { get; set; }
    public int Zone { get; set; }

    public double SizeOfFarmAcres { get; set; }
    public bool AbleToExportDirectly { get; set; }
    public string? ExportsDomain { get; set; }
    public double RatingFarmer { get; set; } = 5.0;
    public int OrdersFulfilled { get; set; }
    public string? Phone { get; set; }
    public string? ImagePath { get; set; }

    public List<Produce> Listings { get; set; } = new();
}
