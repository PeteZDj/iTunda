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
public class FarmersController : ControllerBase
{
    private readonly ItundaDbContext _db;

    public FarmersController(ItundaDbContext db) => _db = db;

    private static FarmerResponse ToResponse(FarmerProfile f) => new(
        f.Id, f.UserId, f.User!.Name, f.User!.Username, f.FarmName, f.Description, f.Specialization,
        f.Certifications, f.LocationCounty, f.LocationSubCounty, f.LocationTown,
        f.FarmLatitude, f.FarmLongitude,
        f.SizeOfFarmAcres, f.AbleToExportDirectly, f.ExportsDomain,
        f.RatingFarmer, f.OrdersFulfilled, f.Phone, f.ImagePath,
        f.Region, f.Country, f.CountryCode, f.Zone, Media.FarmImages(f.Country, f.Id));

    private static ProduceResponse ToProduceResponse(Produce p) => ProduceController.ToResponse(p);

    [HttpGet]
    public async Task<ActionResult<List<FarmerResponse>>> GetAll([FromQuery] string? county)
    {
        var query = _db.FarmerProfiles.Include(f => f.User).AsQueryable();
        if (!string.IsNullOrWhiteSpace(county))
            query = query.Where(f => f.LocationCounty == county);
        var farmers = await query.ToListAsync();
        return Ok(farmers.Select(ToResponse));
    }

    [HttpGet("me")]
    [Authorize(Roles = nameof(UserRole.Farmer))]
    public async Task<ActionResult<FarmerResponse>> GetMine()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var farmer = await _db.FarmerProfiles.Include(f => f.User).FirstOrDefaultAsync(f => f.UserId == userId);
        if (farmer is null) return NotFound();
        return Ok(ToResponse(farmer));
    }

    // Accepts either a numeric profile id (legacy links) or a user's username slug.
    private async Task<FarmerProfile?> ResolveAsync(string key)
    {
        var query = _db.FarmerProfiles.Include(f => f.User).AsQueryable();
        if (int.TryParse(key, out var id))
            return await query.FirstOrDefaultAsync(f => f.Id == id);
        var slug = key.ToLower();
        return await query.FirstOrDefaultAsync(f => f.User!.Username.ToLower() == slug);
    }

    [HttpGet("{key}")]
    public async Task<ActionResult<FarmerResponse>> GetByKey(string key)
    {
        var farmer = await ResolveAsync(key);
        if (farmer is null) return NotFound();
        return Ok(ToResponse(farmer));
    }

    [HttpGet("{key}/produce")]
    public async Task<ActionResult<List<ProduceResponse>>> GetProduce(string key)
    {
        var farmer = await ResolveAsync(key);
        if (farmer is null) return Ok(new List<ProduceResponse>());

        var items = await _db.Produce
            .Include(p => p.FarmerProfile!.User)
            .Where(p => p.FarmerProfileId == farmer.Id && p.IsActive && !p.IsDraft)
            .ToListAsync();

        return Ok(items.Select(ToProduceResponse));
    }

    [HttpPut("me")]
    [Authorize(Roles = nameof(UserRole.Farmer))]
    public async Task<ActionResult<FarmerResponse>> UpdateMyProfile(UpdateFarmerProfileRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var farmer = await _db.FarmerProfiles.Include(f => f.User).FirstOrDefaultAsync(f => f.UserId == userId);
        if (farmer is null) return NotFound();

        farmer.FarmName = request.FarmName;
        farmer.Description = request.Description;
        farmer.Experience = request.Experience;
        farmer.Specialization = request.Specialization;
        farmer.Certifications = request.Certifications;
        farmer.LocationCounty = request.LocationCounty;
        farmer.LocationSubCounty = request.LocationSubCounty;
        farmer.LocationTown = request.LocationTown;
        farmer.FarmLatitude = request.FarmLatitude;
        farmer.FarmLongitude = request.FarmLongitude;
        farmer.SizeOfFarmAcres = request.SizeOfFarmAcres;
        farmer.AbleToExportDirectly = request.AbleToExportDirectly;
        farmer.ExportsDomain = request.ExportsDomain;
        farmer.Phone = request.Phone;
        farmer.ImagePath = request.ImagePath;

        await _db.SaveChangesAsync();
        return Ok(ToResponse(farmer));
    }
}
