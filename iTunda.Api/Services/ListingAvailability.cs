using iTunda.Api.Models;

namespace iTunda.Api.Services;

public static class ListingAvailability
{
    // Seller-entered dates are calendar dates. The Kenyan marketplace closes
    // a listing at the end of its stated best-before day in East Africa time.
    public static DateTime MarketDay(DateTime utc) => utc.AddHours(3).Date;

    public static IQueryable<Produce> Marketable(this IQueryable<Produce> listings, DateTime now, bool includeFuture = false)
    {
        var today = MarketDay(now);
        var tomorrow = today.AddDays(1);
        return listings.Where(p => p.IsActive && !p.IsDraft && p.QuantityAvailable > 0
            && p.ExpiryDate >= today && p.ImagePath != null && p.ImagePath != ""
            && (includeFuture || p.AvailableFrom == null || p.AvailableFrom < tomorrow));
    }

    public static string? CheckDates(DateTime? bestBefore, DateTime? availableFrom, DateTime? harvest, DateTime now)
    {
        var today = MarketDay(now);
        if (bestBefore is null || bestBefore.Value.Date < today)
            return "Add a best-before date of today or later.";
        if (availableFrom?.Date > bestBefore.Value.Date || harvest?.Date > bestBefore.Value.Date)
            return "The harvest and availability dates must be on or before the best-before date.";
        if ((availableFrom ?? today).Date < harvest?.Date)
            return "Set availability on or after the harvest date.";
        return null;
    }
}
