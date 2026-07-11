using iTunda.App.Services;

namespace iTunda.App.Models;

public class CommodityDto
{
    public string Category { get; set; } = string.Empty;
    public string Unit { get; set; } = "kg";
    public string IconUrl { get; set; } = string.Empty;
    public decimal AvgPrice { get; set; }
    public decimal Low { get; set; }
    public decimal High { get; set; }
    public double ChangePct { get; set; }
    public int Listings { get; set; }
    public decimal Bid { get; set; }
    public decimal Ask { get; set; }

    public bool IsUp => ChangePct >= 0;
    public string ChangeDisplay => $"{(IsUp ? "\u25B2" : "\u25BC")} {Math.Abs(ChangePct):0.00}%";
    public string PriceDisplay => $"{Currency.Format(AvgPrice)}/{Unit}";
    public string BidDisplay => Currency.Format(Bid);
    public string AskDisplay => Currency.Format(Ask);
}

// A public order-book bid/offer (commodity-desk style).
public class BuyOrderResponse
{
    public int Id { get; set; }
    public string Commodity { get; set; } = string.Empty;
    public string? Variety { get; set; }
    public string? Grade { get; set; }
    public string Unit { get; set; } = "kg";
    public double Quantity { get; set; }
    public decimal TargetPrice { get; set; }
    public string Side { get; set; } = "Buy";
    public string Kind { get; set; } = "Limit";
    public DateTime? ContractDate { get; set; }
    public string? Region { get; set; }
    public string? Country { get; set; }
    public string? CountryCode { get; set; }
    public int Zone { get; set; }
    public string BuyerName { get; set; } = string.Empty;
    public string? BuyerContact { get; set; }
    public bool ExportRequired { get; set; }
    public string Status { get; set; } = "Open";
    public DateTime CreatedAt { get; set; }
    public DateTime? NeededBy { get; set; }
    public string IconUrl { get; set; } = string.Empty;

    public bool IsBuy => Side == "Buy";
    public string PriceDisplay => Currency.Format(TargetPrice);
    public string QuantityDisplay => $"{Quantity:0.##} {Unit}";
    public string LocationDisplay => !string.IsNullOrEmpty(Region)
        ? (string.IsNullOrEmpty(Country) ? Region : $"{Region}, {Country}")
        : (Country ?? "—");
    public string FlagUrl => string.IsNullOrEmpty(CountryCode)
        ? "https://flagcdn.com/24x18/un.png"
        : $"https://flagcdn.com/24x18/{CountryCode.ToLower()}.png";
}

public class CreateBuyOrderRequest
{
    public string Commodity { get; set; } = string.Empty;
    public string? Variety { get; set; }
    public string? Grade { get; set; }
    public string Unit { get; set; } = "kg";
    public double Quantity { get; set; }
    public decimal TargetPrice { get; set; }
    public string? Region { get; set; }
    public string? Country { get; set; }
    public string? CountryCode { get; set; }
    public int Zone { get; set; }
    public string BuyerName { get; set; } = string.Empty;
    public string? BuyerContact { get; set; }
    public bool ExportRequired { get; set; }
    public DateTime? NeededBy { get; set; }
    public string? Side { get; set; } = "Buy";
    public string? Kind { get; set; } = "Limit";
    public DateTime? ContractDate { get; set; }
}

public class PricePoint
{
    public DateTime Date { get; set; }
    public decimal Price { get; set; }
}

public class PriceHistory
{
    public string Category { get; set; } = string.Empty;
    public string Unit { get; set; } = "kg";
    public string Range { get; set; } = "1M";
    public decimal Current { get; set; }
    public decimal Avg { get; set; }
    public decimal Low { get; set; }
    public decimal High { get; set; }
    public double ChangePct { get; set; }
    public List<PricePoint> Points { get; set; } = new();

    public bool IsUp => ChangePct >= 0;
}
