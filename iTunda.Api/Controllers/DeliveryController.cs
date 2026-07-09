using System.Security.Claims;
using System.Globalization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using iTunda.Api.Data;
using iTunda.Api.Dtos;
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

    // Public: estimate a delivery route + price between two points. No login needed.
    [HttpPost("estimate")]
    [AllowAnonymous]
    public ActionResult<DeliveryEstimateResponse> Estimate([FromBody] DeliveryEstimateRequest req)
    {
        var distance = Math.Round(Haversine(req.OriginLat, req.OriginLng, req.DestLat, req.DestLng), 1);

        // Long hauls (> 1500 km) or crossing oceans priced as air/sea freight.
        var isFreight = distance > 1500;
        var mode = isFreight ? "Air / sea freight" : "Road transport";

        var weight = req.WeightKg is > 0 ? req.WeightKg.Value : 500; // default a 500 kg consignment
        var weightFactor = Math.Max(1.0, weight / 500.0);

        decimal baseFee = isFreight ? 18000m : 1500m;
        decimal perKm = isFreight ? 95m : 42m;
        var price = Math.Round((baseFee + perKm * (decimal)distance) * (decimal)weightFactor, 0);

        var avgSpeed = isFreight ? 650.0 : 48.0; // km/h
        var handling = isFreight ? 12.0 : 3.0;   // hours
        var eta = Math.Round(distance / avgSpeed + handling, 1);

        var gmaps = string.Create(CultureInfo.InvariantCulture,
            $"https://www.google.com/maps/dir/?api=1&origin={req.OriginLat},{req.OriginLng}&destination={req.DestLat},{req.DestLng}&travelmode=driving");

        var res = new DeliveryEstimateResponse(
            distance, eta, baseFee, perKm, price, Math.Round(price / 130m, 0), mode, gmaps,
            req.OriginLat, req.OriginLng, req.DestLat, req.DestLng, req.OriginLabel, req.DestLabel);

        return Ok(res);
    }

    private static double Haversine(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371.0;
        double dLat = (lat2 - lat1) * Math.PI / 180.0;
        double dLon = (lon2 - lon1) * Math.PI / 180.0;
        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                   Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) *
                   Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

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
