namespace iTunda.Api.Models;

public enum BuyOrderStatus
{
    Open,
    Matched,
    Filled,
    Cancelled
}

/// <summary>
/// A commodity-style order on the exchange book. Despite the name it now covers
/// both sides (Buy/Sell) and several instrument kinds so the platform behaves
/// like a farmer-to-futures desk:
///   • Spot    — buy/sell at market now
///   • Limit   — a resting bid/offer at <see cref="TargetPrice"/>
///   • Futures — a forward contract to be delivered by <see cref="ContractDate"/>
///   • Put     — a price-floor option with strike <see cref="TargetPrice"/> expiring <see cref="ContractDate"/>
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

    /// <summary>Buy | Sell.</summary>
    public string Side { get; set; } = "Buy";

    /// <summary>Spot | Limit | Futures | Put.</summary>
    public string Kind { get; set; } = "Limit";

    /// <summary>Delivery month for futures / expiry for options.</summary>
    public DateTime? ContractDate { get; set; }

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
