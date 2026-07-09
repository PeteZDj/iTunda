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
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly ItundaDbContext _db;

    public OrdersController(ItundaDbContext db)
    {
        _db = db;
    }

    private static OrderResponse ToResponse(Order o) => new(
        o.Id, o.Status, o.DeliveryAddress, o.TotalAmount, o.CreatedAt,
        o.Items.Select(i => new OrderItemResponse(i.ProduceId, i.Produce!.Name, i.Quantity, i.UnitPriceAtOrder)).ToList());

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Buyer))]
    public async Task<ActionResult<OrderResponse>> Create(CreateOrderRequest request)
    {
        if (request.Items is null || request.Items.Count == 0)
            return BadRequest("An order must contain at least one item.");

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var order = new Order
        {
            BuyerUserId = userId,
            DeliveryAddress = request.DeliveryAddress
        };

        decimal total = 0;
        foreach (var line in request.Items)
        {
            var produce = await _db.Produce.FindAsync(line.ProduceId);
            if (produce is null) return BadRequest($"Produce {line.ProduceId} not found.");
            if (produce.QuantityAvailable < line.Quantity)
                return BadRequest($"Not enough '{produce.Name}' available.");

            produce.QuantityAvailable -= line.Quantity;
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
        var role = User.FindFirstValue(ClaimTypes.Role);
        if (role == nameof(UserRole.Buyer) && order.BuyerUserId != userId) return Forbid();

        return Ok(ToResponse(order));
    }

    [HttpGet("mine")]
    [Authorize(Roles = nameof(UserRole.Buyer))]
    public async Task<ActionResult<List<OrderResponse>>> GetMine()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var orders = await _db.Orders.Include(o => o.Items).ThenInclude(i => i.Produce)
            .Where(o => o.BuyerUserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Ok(orders.Select(ToResponse));
    }

    [HttpGet("farmer")]
    [Authorize(Roles = nameof(UserRole.Farmer))]
    public async Task<ActionResult<List<OrderResponse>>> GetForFarmer()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var farmerProfile = await _db.FarmerProfiles.FirstOrDefaultAsync(f => f.UserId == userId);
        if (farmerProfile is null) return Ok(new List<OrderResponse>());

        var orders = await _db.Orders.Include(o => o.Items).ThenInclude(i => i.Produce)
            .Where(o => o.Items.Any(i => i.Produce!.FarmerProfileId == farmerProfile.Id))
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Ok(orders.Select(ToResponse));
    }
}
