using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using iTunda.Api.Data;
using iTunda.Api.Models;

namespace iTunda.Api.Controllers;

public record DeliveryResponse(
    int Id, int OrderId, string RiderName, string RiderPhone,
    string? VehicleInfo, string Status, string? PickupAddress,
    string? DeliveryAddress, DateTime? EstimatedDelivery, DateTime? ActualDelivery,
    decimal DeliveryFee, string? Notes, DateTime CreatedAt);

public record CreateDeliveryRequest(
    int OrderId, string RiderName, string RiderPhone,
    string? VehicleInfo, string? PickupAddress, string? DeliveryAddress,
    DateTime? EstimatedDelivery, decimal DeliveryFee, string? Notes);

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DeliveryController : ControllerBase
{
    private readonly ItundaDbContext _db;

    public DeliveryController(ItundaDbContext db) => _db = db;

    private static DeliveryResponse ToResponse(Delivery d) => new(
        d.Id, d.OrderId, d.RiderName, d.RiderPhone, d.VehicleInfo,
        d.Status.ToString(), d.PickupAddress, d.DeliveryAddress,
        d.EstimatedDelivery, d.ActualDelivery, d.DeliveryFee, d.Notes, d.CreatedAt);

    [HttpGet("order/{orderId}")]
    public async Task<ActionResult<DeliveryResponse>> GetByOrder(int orderId)
    {
        var delivery = await _db.Deliveries.FirstOrDefaultAsync(d => d.OrderId == orderId);
        if (delivery is null) return NotFound();
        return Ok(ToResponse(delivery));
    }

    [HttpPost]
    public async Task<ActionResult<DeliveryResponse>> Create(CreateDeliveryRequest request)
    {
        var orderExists = await _db.Orders.AnyAsync(o => o.Id == request.OrderId);
        if (!orderExists) return BadRequest("Order not found.");

        var delivery = new Delivery
        {
            OrderId = request.OrderId,
            RiderName = request.RiderName,
            RiderPhone = request.RiderPhone,
            VehicleInfo = request.VehicleInfo,
            PickupAddress = request.PickupAddress,
            DeliveryAddress = request.DeliveryAddress,
            EstimatedDelivery = request.EstimatedDelivery,
            DeliveryFee = request.DeliveryFee,
            Notes = request.Notes
        };

        _db.Deliveries.Add(delivery);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetByOrder), new { orderId = delivery.OrderId }, ToResponse(delivery));
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult<DeliveryResponse>> UpdateStatus(int id, [FromBody] string status)
    {
        var delivery = await _db.Deliveries.FindAsync(id);
        if (delivery is null) return NotFound();

        if (!Enum.TryParse<DeliveryStatus>(status, true, out var parsed))
            return BadRequest($"Invalid status. Valid values: {string.Join(", ", Enum.GetNames<DeliveryStatus>())}");

        delivery.Status = parsed;
        if (parsed == DeliveryStatus.Delivered)
            delivery.ActualDelivery = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(ToResponse(delivery));
    }
}
