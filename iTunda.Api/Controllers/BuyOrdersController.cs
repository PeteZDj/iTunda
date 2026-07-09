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
public class BuyOrdersController : ControllerBase
{
    private readonly ItundaDbContext _db;

    public BuyOrdersController(ItundaDbContext db) => _db = db;

    private static BuyOrderResponse ToResponse(BuyOrder b) => new(
        b.Id, b.Commodity, b.Variety, b.Grade, b.Unit, b.Quantity, b.TargetPrice,
        b.Side, b.Kind, b.ContractDate,
        b.Region, b.Country, b.CountryCode, b.Zone, b.BuyerName, b.ExportRequired,
        b.Status.ToString(), b.CreatedAt, b.NeededBy, Media.IconUrl(b.Commodity));

    [HttpGet]
    public async Task<ActionResult<List<BuyOrderResponse>>> GetAll(
        [FromQuery] string? commodity,
        [FromQuery] int? zone,
        [FromQuery] string? country,
        [FromQuery] string? side,
        [FromQuery] string? kind)
    {
        var query = _db.BuyOrders.AsQueryable();

        if (!string.IsNullOrWhiteSpace(commodity))
            query = query.Where(b => b.Commodity == commodity);
        if (zone.HasValue)
            query = query.Where(b => b.Zone == zone.Value);
        if (!string.IsNullOrWhiteSpace(country))
            query = query.Where(b => b.Country == country);
        if (!string.IsNullOrWhiteSpace(side))
            query = query.Where(b => b.Side == side);
        if (!string.IsNullOrWhiteSpace(kind))
            query = query.Where(b => b.Kind == kind);

        var items = await query
            .OrderByDescending(b => b.Status == BuyOrderStatus.Open)
            .ThenByDescending(b => b.CreatedAt)
            .ToListAsync();

        return Ok(items.Select(ToResponse));
    }

    // Anyone can post a bid to the order book (commodity-desk style, no login required).
    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<BuyOrderResponse>> Create(CreateBuyOrderRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Commodity) || string.IsNullOrWhiteSpace(request.BuyerName))
            return BadRequest("Commodity and buyer name are required.");
        if (request.Quantity <= 0 || request.TargetPrice <= 0)
            return BadRequest("Quantity and target price must be greater than zero.");

        var side = request.Side == "Sell" ? "Sell" : "Buy";
        var kind = request.Kind is "Spot" or "Limit" or "Futures" or "Put" ? request.Kind : "Limit";

        var order = new BuyOrder
        {
            Commodity = request.Commodity,
            Variety = request.Variety,
            Grade = request.Grade,
            Unit = string.IsNullOrWhiteSpace(request.Unit) ? "kg" : request.Unit,
            Quantity = request.Quantity,
            TargetPrice = request.TargetPrice,
            Side = side,
            Kind = kind,
            ContractDate = request.ContractDate,
            Region = request.Region,
            Country = request.Country,
            CountryCode = request.CountryCode,
            Zone = request.Zone,
            BuyerName = request.BuyerName,
            BuyerContact = request.BuyerContact,
            ExportRequired = request.ExportRequired,
            NeededBy = request.NeededBy,
            Status = BuyOrderStatus.Open,
        };

        _db.BuyOrders.Add(order);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { }, ToResponse(order));
    }
}
