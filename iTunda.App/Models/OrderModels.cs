namespace iTunda.App.Models;

public enum OrderStatus
{
    Pending,
    Confirmed,
    InTransit,
    Delivered,
    Cancelled
}

public class OrderItemRequest
{
    public int ProduceId { get; set; }
    public double Quantity { get; set; }
}

public class CreateOrderRequest
{
    public string? DeliveryAddress { get; set; }
    public string? DeliveryScope { get; set; }
    public double? DeliveryLat { get; set; }
    public double? DeliveryLng { get; set; }
    public List<OrderItemRequest> Items { get; set; } = new();
}

public class OrderItemResponse
{
    public int ProduceId { get; set; }
    public string ProduceName { get; set; } = string.Empty;
    public double Quantity { get; set; }
    public decimal UnitPriceAtOrder { get; set; }
}

public class OrderResponse
{
    public int Id { get; set; }
    public OrderStatus Status { get; set; }
    public string? DeliveryAddress { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<OrderItemResponse> Items { get; set; } = new();
}
