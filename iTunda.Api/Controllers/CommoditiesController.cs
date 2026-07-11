using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using iTunda.Api.Data;
using iTunda.Api.Dtos;
using iTunda.Api.Services;

namespace iTunda.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CommoditiesController : ControllerBase
{
    private readonly ItundaDbContext _db;

    public CommoditiesController(ItundaDbContext db) => _db = db;

    // Deterministic daily "market move" per commodity so the ticker feels live
    // without a real price feed. Stable within a UTC day.
    private static double DailyChange(string category)
    {
        int h = 17;
        foreach (var c in category) h = unchecked(h * 31 + c);
        h = unchecked(h + DateTime.UtcNow.DayOfYear * 7919);
        var rnd = new Random(h);
        return Math.Round((rnd.NextDouble() * 2 - 1) * 6.5, 2); // -6.5% .. +6.5%
    }

    [HttpGet]
    public async Task<ActionResult<List<CommodityDto>>> GetAll()
    {
        // SQLite can't translate decimal aggregates, so pull the rows and
        // compute the stats in memory.
        var rows = await _db.Produce
            .Where(p => p.IsActive)
            .Select(p => new { p.Category, p.Unit, p.Price })
            .ToListAsync();

        var result = rows
            .GroupBy(r => r.Category)
            .Select(cat => new CommodityDto(
                cat.Key,
                cat.GroupBy(x => x.Unit).OrderByDescending(g => g.Count()).First().Key,
                Media.IconUrl(cat.Key),
                Math.Round(cat.Average(x => x.Price), 0),
                cat.Min(x => x.Price),
                cat.Max(x => x.Price),
                DailyChange(cat.Key),
                cat.Count()))
            .OrderBy(c => c.Category)
            .ToList();

        return Ok(result);
    }

    // Synthetic-but-stable price history so charts have data without a real feed.
    // The series is a seeded random walk anchored so the last point == current avg.
    [HttpGet("{category}/history")]
    public async Task<ActionResult<PriceHistoryDto>> GetHistory(string category, [FromQuery] string range = "1M")
    {
        var rows = await _db.Produce
            .Where(p => p.IsActive && p.Category == category)
            .Select(p => new { p.Unit, p.Price })
            .ToListAsync();

        if (rows.Count == 0) return NotFound();

        var unit = rows.GroupBy(x => x.Unit).OrderByDescending(g => g.Count()).First().Key;
        var current = Math.Round(rows.Average(x => x.Price), 0);

        // range → (number of points, step, label formatter granularity)
        var (count, stepDays, monthly) = range.ToUpperInvariant() switch
        {
            "1W" => (7, 1, false),
            "1Y" => (12, 30, true),
            _    => (30, 1, false), // 1M default
        };

        // Seed is stable per (category, range) so reloads show the same chart.
        int h = 23;
        foreach (var c in category) h = unchecked(h * 31 + c);
        h = unchecked(h + range.ToUpperInvariant().GetHashCode());
        var rnd = new Random(h);

        // Volatility scales with the range so 1Y swings wider than 1W.
        double vol = range.ToUpperInvariant() switch { "1W" => 0.015, "1Y" => 0.06, _ => 0.03 };
        double drift = (rnd.NextDouble() * 2 - 1) * vol * 0.4;

        // Walk backwards from the current price, then reverse so it ends at "now".
        var prices = new List<decimal>();
        double p = (double)current;
        for (int i = 0; i < count; i++)
        {
            prices.Add((decimal)Math.Round(p, 0));
            var shock = (rnd.NextDouble() * 2 - 1) * vol + drift;
            p = Math.Max(1, p / (1 + shock));
        }
        prices.Reverse();
        // Pin the final point exactly to the live average.
        prices[^1] = current;

        var now = DateTime.UtcNow.Date;
        var points = new List<PricePointDto>();
        for (int i = 0; i < count; i++)
        {
            var date = monthly ? now.AddMonths(-(count - 1 - i)) : now.AddDays(-(count - 1 - i) * stepDays);
            points.Add(new PricePointDto(date, prices[i]));
        }

        var first = prices[0];
        var changePct = first == 0 ? 0 : Math.Round((double)((current - first) / first) * 100, 2);

        return Ok(new PriceHistoryDto(
            category, unit, range.ToUpperInvariant(),
            current, Math.Round(prices.Average(), 0), prices.Min(), prices.Max(),
            changePct, points));
    }
}
