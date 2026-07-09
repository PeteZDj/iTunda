namespace iTunda.Api.Models;

public enum DeliveryStatus
{
    Pending,
    Assigned,
    PickedUp,
    InTransit,
    Delivered,
    Failed
}

public class Delivery
{
    public int Id { get; set; }

    public int OrderId { get; set; }
    public Order? Order { get; set; }

    public string RiderName { get; set; } = string.Empty;
    public string RiderPhone { get; set; } = string.Empty;
    public string? VehicleInfo { get; set; }
    public DeliveryStatus Status { get; set; } = DeliveryStatus.Pending;
    public string? PickupAddress { get; set; }
    public string? DeliveryAddress { get; set; }
    public DateTime? EstimatedDelivery { get; set; }
    public DateTime? ActualDelivery { get; set; }
    public decimal DeliveryFee { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
