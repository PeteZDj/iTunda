namespace iTunda.Api.Models;

public enum OrderStatus
{
    Pending,
    Confirmed,
    InTransit,
    Delivered,
    Cancelled
}

public class Order
{
    public int Id { get; set; }

    public int BuyerUserId { get; set; }
    public User? Buyer { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public string? DeliveryAddress { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<OrderItem> Items { get; set; } = new();
}

public class OrderItem
{
    public int Id { get; set; }

    public int OrderId { get; set; }
    public Order? Order { get; set; }

    public int ProduceId { get; set; }
    public Produce? Produce { get; set; }

    public double Quantity { get; set; }
    public decimal UnitPriceAtOrder { get; set; }
}
