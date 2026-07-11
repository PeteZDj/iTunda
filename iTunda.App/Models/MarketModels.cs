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

    public bool IsUp => ChangePct >= 0;
    public string ChangeDisplay => $"{(IsUp ? "\u25B2" : "\u25BC")} {Math.Abs(ChangePct):0.00}%";
    public string PriceDisplay => $"KES {AvgPrice:0}/{Unit}";
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
