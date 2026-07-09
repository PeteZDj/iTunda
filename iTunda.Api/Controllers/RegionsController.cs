using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using iTunda.Api.Data;
using iTunda.Api.Dtos;

namespace iTunda.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RegionsController : ControllerBase
{
    private readonly ItundaDbContext _db;

    public RegionsController(ItundaDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<RegionDto>>> GetAll()
    {
        var counts = await _db.Produce
            .Where(p => p.IsActive && p.FarmerProfile!.Region != null)
            .GroupBy(p => p.FarmerProfile!.Region!)
            .Select(g => new { Region = g.Key, Count = g.Count() })
            .ToListAsync();

        var byRegion = counts.ToDictionary(c => c.Region, c => c.Count);

        var result = RegionData.All.Select(r => new RegionDto(
            r.Name, r.Country, r.CountryCode, r.Zone, RegionData.ZoneName(r.Zone),
            r.Lat, r.Lng, r.Crops,
            byRegion.TryGetValue(r.Name, out var n) ? n : 0));

        return Ok(result);
    }
}
