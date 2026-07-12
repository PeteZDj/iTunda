using iTunda.Api.Models;

namespace iTunda.Api.Dtos;

public record CreateOrderItemRequest(int ProduceId, double Quantity);

public record CreateOrderRequest(
    string? DeliveryAddress,
    List<CreateOrderItemRequest> Items,
    string? DeliveryScope = null,
    double? DeliveryLat = null,
    double? DeliveryLng = null,
    DateTime? RequestedDeliveryAt = null,
    string? Packaging = null);

public record OrderItemResponse(int ProduceId, string ProduceName, double Quantity, decimal UnitPriceAtOrder);

public record OrderResponse(
    int Id,
    OrderStatus Status,
    string? DeliveryAddress,
    string DeliveryScope,
    decimal TotalAmount,
    DateTime CreatedAt,
    List<OrderItemResponse> Items,
    DateTime? RequestedDeliveryAt = null,
    string? Packaging = null);
