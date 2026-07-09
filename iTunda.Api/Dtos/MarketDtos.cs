using iTunda.Api.Models;

namespace iTunda.Api.Dtos;

public record RegionDto(
    string Name,
    string Country,
    string CountryCode,
    int Zone,
    string ZoneName,
    double Lat,
    double Lng,
    string[] Crops,
    int ListingCount);

public record CommodityDto(
    string Category,
    string Unit,
    string IconUrl,
    decimal AvgPrice,
    decimal Low,
    decimal High,
    double ChangePct,
    int Listings);

public record BuyOrderResponse(
    int Id,
    string Commodity,
    string? Variety,
    string? Grade,
    string Unit,
    double Quantity,
    decimal TargetPrice,
    string? Region,
    string? Country,
    string? CountryCode,
    int Zone,
    string BuyerName,
    bool ExportRequired,
    string Status,
    DateTime CreatedAt,
    DateTime? NeededBy,
    string IconUrl);

public record CreateBuyOrderRequest(
    string Commodity,
    string? Variety,
    string? Grade,
    string Unit,
    double Quantity,
    decimal TargetPrice,
    string? Region,
    string? Country,
    string? CountryCode,
    int Zone,
    string BuyerName,
    string? BuyerContact,
    bool ExportRequired,
    DateTime? NeededBy);

public record DeliveryEstimateRequest(
    double OriginLat,
    double OriginLng,
    double DestLat,
    double DestLng,
    string? OriginLabel,
    string? DestLabel,
    double? WeightKg);

public record DeliveryEstimateResponse(
    double DistanceKm,
    double EtaHours,
    decimal BaseFee,
    decimal PerKm,
    decimal PriceKes,
    decimal PriceUsd,
    string Mode,
    string GoogleMapsUrl,
    double OriginLat,
    double OriginLng,
    double DestLat,
    double DestLng,
    string? OriginLabel,
    string? DestLabel);
