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
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly ItundaDbContext _db;

    public OrdersController(ItundaDbContext db)
    {
        _db = db;
    }

    private static OrderResponse ToResponse(Order order, int? sellerId = null)
    {
        var items = order.Items.Where(i => sellerId is null || i.Produce!.FarmerProfileId == sellerId)
            .Select(i => new OrderItemResponse(i.ProduceId, i.Produce!.Name, i.Quantity, i.UnitPriceAtOrder)).ToList();
        var total = sellerId is null ? order.TotalAmount : items.Sum(i => i.UnitPriceAtOrder * (decimal)i.Quantity);
        return new(order.Id, order.Status, order.DeliveryAddress, order.DeliveryScope, total, order.CreatedAt,
            items, order.RequestedDeliveryAt, sellerId is null || items.Count == order.Items.Count ? order.Packaging : null);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<OrderResponse>> Create(CreateOrderRequest request)
    {
        if (request.Items is null || request.Items.Count == 0)
            return BadRequest("An order must contain at least one item.");
        if (request.Items.Any(line => !double.IsFinite(line.Quantity) || line.Quantity <= 0))
            return BadRequest("Enter a positive quantity for every item.");

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var now = DateTime.UtcNow;
        if (request.RequestedDeliveryAt is { } requested && requested.ToUniversalTime() <= now)
            return BadRequest("Choose a delivery time in the future.");

        var order = new Order
        {
            BuyerUserId = userId,
            DeliveryAddress = request.DeliveryAddress,
            DeliveryScope = request.DeliveryScope == "Export" ? "Export" : "Local",
            DeliveryLat = request.DeliveryLat,
            DeliveryLng = request.DeliveryLng,
            RequestedDeliveryAt = request.RequestedDeliveryAt,
            Packaging = string.IsNullOrWhiteSpace(request.Packaging) ? null : request.Packaging.Trim(),
        };

        decimal total = 0;
        await using var transaction = await _db.Database.BeginTransactionAsync();
        foreach (var line in request.Items)
        {
            var listing = _db.Produce.Marketable(now).Where(p => p.Id == line.ProduceId
                && p.FarmerProfile!.UserId != userId
                && (order.DeliveryScope == "Export" ? p.DeliveryScope != "Local" : p.DeliveryScope != "Export"));
            if (request.RequestedDeliveryAt is { } delivery)
            {
                var deliveryDay = ListingAvailability.MarketDay(delivery.ToUniversalTime());
                listing = listing.Where(p => p.ExpiryDate >= deliveryDay);
            }
            var produce = await listing.AsNoTracking().FirstOrDefaultAsync();
            if (produce is null) return BadRequest("This listing is unavailable for the requested delivery date.");

            var updated = await listing.Where(p => p.QuantityAvailable >= line.Quantity)
                .ExecuteUpdateAsync(setters => setters.SetProperty(p => p.QuantityAvailable,
                    p => p.QuantityAvailable - line.Quantity));
            if (updated == 0) return BadRequest($"Not enough '{produce.Name}' available.");

            var lineTotal = produce.Price * (decimal)line.Quantity;
            total += lineTotal;

            order.Items.Add(new OrderItem
            {
                ProduceId = produce.Id,
                Quantity = line.Quantity,
                UnitPriceAtOrder = produce.Price
            });
        }

        order.TotalAmount = total;

        _db.Orders.Add(order);
        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        await _db.Entry(order).Collection(o => o.Items).Query().Include(i => i.Produce).LoadAsync();
        return CreatedAtAction(nameof(GetById), new { id = order.Id }, ToResponse(order));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrderResponse>> GetById(int id)
    {
        var order = await _db.Orders.Include(o => o.Items).ThenInclude(i => i.Produce)
            .FirstOrDefaultAsync(o => o.Id == id);
        if (order is null) return NotFound();

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (order.BuyerUserId == userId) return Ok(ToResponse(order));
        var seller = await _db.FarmerProfiles.FirstOrDefaultAsync(f => f.UserId == userId);
        if (seller is null || !order.Items.Any(i => i.Produce!.FarmerProfileId == seller.Id)) return Forbid();
        return Ok(ToResponse(order, seller.Id));
    }

    [HttpGet("mine")]
    [Authorize]
    public async Task<ActionResult<List<OrderResponse>>> GetMine()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var orders = await _db.Orders.Include(o => o.Items).ThenInclude(i => i.Produce)
            .Where(o => o.BuyerUserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Ok(orders.Select(order => ToResponse(order)));
    }

    [HttpGet("farmer")]
    public async Task<ActionResult<List<OrderResponse>>> GetForFarmer()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var farmerProfile = await _db.FarmerProfiles.FirstOrDefaultAsync(f => f.UserId == userId);
        if (farmerProfile is null) return Ok(new List<OrderResponse>());

        var orders = await _db.Orders.Include(o => o.Items).ThenInclude(i => i.Produce)
            .Where(o => o.Items.Any(i => i.Produce!.FarmerProfileId == farmerProfile.Id))
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Ok(orders.Select(order => ToResponse(order, farmerProfile.Id)));
    }
}
