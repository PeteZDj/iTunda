using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using iTunda.Api.Data;
using iTunda.Api.Dtos;
using iTunda.Api.Models;

namespace iTunda.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProduceController : ControllerBase
{
    private readonly ItundaDbContext _db;

    public ProduceController(ItundaDbContext db) => _db = db;

    private static ProduceResponse ToResponse(Produce p) => new(
        p.Id, p.Name, p.Category, p.Description, p.Price, p.Unit, p.QuantityAvailable,
        p.ImagePath, p.HarvestDate, p.ExpiryDate, p.AvailableFrom, p.IsExportReady, p.GradeQuality,
        p.FarmerProfileId,
        p.FarmerProfile!.User!.Name, p.FarmerProfile.Phone, p.FarmerProfile.ImagePath,
        p.FarmerProfile.FarmName,
        p.FarmerProfile.LocationCounty, p.FarmerProfile.LocationSubCounty, p.FarmerProfile.LocationTown,
        p.FarmerProfile.FarmLatitude, p.FarmerProfile.FarmLongitude,
        p.FarmerProfile.RatingFarmer, p.FarmerProfile.OrdersFulfilled);

    [HttpGet]
    public async Task<ActionResult<List<ProduceResponse>>> GetAll(
        [FromQuery] string? q,
        [FromQuery] string? category,
        [FromQuery] string? county,
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
                || (p.FarmerProfile!.LocationCounty != null && p.FarmerProfile!.LocationCounty.ToLower().Contains(qLower)));
        }

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(p => p.Category == category);

        if (!string.IsNullOrWhiteSpace(county))
            query = query.Where(p => p.FarmerProfile!.LocationCounty == county);

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

        var produce = new Produce
        {
            FarmerProfileId = farmerProfile.Id,
            Name = request.Name,
            Category = request.Category,
            Description = request.Description,
            Price = request.Price,
            Unit = request.Unit,
            QuantityAvailable = request.QuantityAvailable,
            ImagePath = request.ImagePath,
            HarvestDate = request.HarvestDate,
            ExpiryDate = request.ExpiryDate,
            AvailableFrom = request.AvailableFrom,
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
