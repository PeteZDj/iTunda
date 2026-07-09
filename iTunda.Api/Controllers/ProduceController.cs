using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using iTunda.Api.Data;
using iTunda.Api.Dtos;
using iTunda.Api.Models;
using iTunda.Api.Services;

namespace iTunda.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProduceController : ControllerBase
{
    private readonly ItundaDbContext _db;

    public ProduceController(ItundaDbContext db) => _db = db;

    public static ProduceResponse ToResponse(Produce p)
    {
        // Prefer seller-uploaded photos (from the sell flow) over generated stock.
        var uploaded = ParseImages(p.ImagesJson);
        if (uploaded.Count == 0 && !string.IsNullOrWhiteSpace(p.ImagePath))
            uploaded.Add(p.ImagePath!);

        var hero = uploaded.Count > 0 ? uploaded[0] : Media.ImageUrl(p.Category, p.Id);
        var gallery = uploaded.Count > 0 ? uploaded : Media.Gallery(p.Category, p.Id);

        // Per-listing coordinates fall back to the farmer profile.
        var lat = p.FarmLatitude ?? p.FarmerProfile!.FarmLatitude;
        var lng = p.FarmLongitude ?? p.FarmerProfile!.FarmLongitude;

        return new(
            p.Id, p.Name, p.Category, p.Description, p.Price, p.Unit, p.QuantityAvailable,
            p.ImagePath, p.PlantingDate, p.HarvestDate, p.ExpiryDate, p.AvailableFrom, p.IsExportReady, p.GradeQuality,
            p.FarmerProfileId,
            p.FarmerProfile!.User!.Name, p.FarmerProfile.Phone, p.FarmerProfile.ImagePath,
            p.FarmerProfile.FarmName,
            p.FarmerProfile.LocationCounty, p.FarmerProfile.LocationSubCounty, p.FarmerProfile.LocationTown,
            lat, lng,
            p.FarmerProfile.RatingFarmer, p.FarmerProfile.OrdersFulfilled,
            p.FarmerProfile.Region, p.FarmerProfile.Country, p.FarmerProfile.CountryCode, p.FarmerProfile.Zone,
            hero, gallery, Media.IconUrl(p.Category));
    }

    private static List<string> ParseImages(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new();
        try { return System.Text.Json.JsonSerializer.Deserialize<List<string>>(json) ?? new(); }
        catch { return new(); }
    }

    [HttpGet]
    public async Task<ActionResult<List<ProduceResponse>>> GetAll(
        [FromQuery] string? q,
        [FromQuery] string? category,
        [FromQuery] string? county,
        [FromQuery] string? region,
        [FromQuery] string? country,
        [FromQuery] int? zone,
        [FromQuery] bool? exportReady,
        [FromQuery] bool includeFuture = false)
    {
        var query = _db.Produce
            .Include(p => p.FarmerProfile!.User)
            .Where(p => p.IsActive);

        if (!includeFuture)
            query = query.Where(p => p.AvailableFrom == null || p.AvailableFrom <= DateTime.UtcNow);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var qLower = q.ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(qLower) || p.Category.ToLower().Contains(qLower)
                || (p.Description != null && p.Description.ToLower().Contains(qLower))
                || (p.FarmerProfile!.LocationCounty != null && p.FarmerProfile!.LocationCounty.ToLower().Contains(qLower))
                || (p.FarmerProfile!.Region != null && p.FarmerProfile!.Region.ToLower().Contains(qLower))
                || (p.FarmerProfile!.Country != null && p.FarmerProfile!.Country.ToLower().Contains(qLower)));
        }

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(p => p.Category == category);

        if (!string.IsNullOrWhiteSpace(county))
            query = query.Where(p => p.FarmerProfile!.LocationCounty == county);

        if (!string.IsNullOrWhiteSpace(region))
            query = query.Where(p => p.FarmerProfile!.Region == region);

        if (!string.IsNullOrWhiteSpace(country))
            query = query.Where(p => p.FarmerProfile!.Country == country);

        if (zone.HasValue)
            query = query.Where(p => p.FarmerProfile!.Zone == zone.Value);

        if (exportReady.HasValue)
            query = query.Where(p => p.IsExportReady == exportReady.Value);

        var items = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
        return Ok(items.Select(ToResponse));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProduceResponse>> GetById(int id)
    {
        var item = await _db.Produce
            .Include(p => p.FarmerProfile!.User)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (item is null) return NotFound();
        return Ok(ToResponse(item));
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Farmer))]
    public async Task<ActionResult<ProduceResponse>> Create(CreateProduceRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var farmerProfile = await _db.FarmerProfiles.FirstOrDefaultAsync(f => f.UserId == userId);
        if (farmerProfile is null) return BadRequest("Farmer profile not found.");

        // Sellers must provide the essentials before a listing goes live.
        var images = request.Images?.Where(s => !string.IsNullOrWhiteSpace(s)).ToList() ?? new();
        if (images.Count == 0 && string.IsNullOrWhiteSpace(request.ImagePath))
            return BadRequest("At least one produce photo is required.");
        if (request.PlantingDate is null)
            return BadRequest("Planting date is required.");
        if (request.ExpiryDate is null)
            return BadRequest("Best-before date is required.");

        var lat = request.FarmLatitude ?? farmerProfile.FarmLatitude;
        var lng = request.FarmLongitude ?? farmerProfile.FarmLongitude;
        if (lat is null || lng is null)
            return BadRequest("Farm location (GPS) is required.");

        var produce = new Produce
        {
            FarmerProfileId = farmerProfile.Id,
            Name = request.Name,
            Category = request.Category,
            Description = request.Description,
            Price = request.Price,
            Unit = request.Unit,
            QuantityAvailable = request.QuantityAvailable,
            ImagePath = images.Count > 0 ? images[0] : request.ImagePath,
            ImagesJson = images.Count > 0 ? System.Text.Json.JsonSerializer.Serialize(images) : null,
            PlantingDate = request.PlantingDate,
            HarvestDate = request.HarvestDate,
            ExpiryDate = request.ExpiryDate,
            AvailableFrom = request.AvailableFrom,
            FarmLatitude = lat,
            FarmLongitude = lng,
            IsExportReady = request.IsExportReady,
            GradeQuality = request.GradeQuality
        };

        _db.Produce.Add(produce);
        await _db.SaveChangesAsync();

        await _db.Entry(produce).Reference(p => p.FarmerProfile).LoadAsync();
        await _db.Entry(produce.FarmerProfile!).Reference(f => f.User).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { id = produce.Id }, ToResponse(produce));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = nameof(UserRole.Farmer))]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var produce = await _db.Produce.Include(p => p.FarmerProfile)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (produce is null) return NotFound();
        if (produce.FarmerProfile!.UserId != userId) return Forbid();

        _db.Produce.Remove(produce);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
