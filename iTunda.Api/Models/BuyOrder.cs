namespace iTunda.Api.Models;

public enum BuyOrderStatus
{
    Open,
    Matched,
    Filled,
    Cancelled
}

/// <summary>
/// A commodity-style buy order (bid): a buyer posts the commodity, quantity and
/// target price they want to purchase at. Sellers/farmers can match against it.
/// </summary>
public class BuyOrder
{
    public int Id { get; set; }

    public string Commodity { get; set; } = string.Empty;
    public string? Variety { get; set; }
    public string? Grade { get; set; }
    public string Unit { get; set; } = "kg";
    public double Quantity { get; set; }
    public decimal TargetPrice { get; set; }

    // Where the buyer wants to source from / deliver to
    public string? Region { get; set; }
    public string? Country { get; set; }
    public string? CountryCode { get; set; }
    public int Zone { get; set; }

    public string BuyerName { get; set; } = string.Empty;
    public string? BuyerContact { get; set; }
    public bool ExportRequired { get; set; }

    public BuyOrderStatus Status { get; set; } = BuyOrderStatus.Open;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? NeededBy { get; set; }
}
