namespace iTunda.Api.Models;

public class Produce
{
    public int Id { get; set; }

    public int FarmerProfileId { get; set; }
    public FarmerProfile? FarmerProfile { get; set; }

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
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
    public bool IsExportReady { get; set; }
    public string? GradeQuality { get; set; }
}
