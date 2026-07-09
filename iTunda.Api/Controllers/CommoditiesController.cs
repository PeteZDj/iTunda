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
}
