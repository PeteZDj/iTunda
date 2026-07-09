namespace iTunda.Api.Dtos;

public record FarmerResponse(
    int Id,
    int UserId,
    string Name,
    string FarmName,
    string? Description,
    string? Specialization,
    string? Certifications,
    string? LocationCounty,
    string? LocationSubCounty,
    string? LocationTown,
    double? FarmLatitude,
    double? FarmLongitude,
    double SizeOfFarmAcres,
    bool AbleToExportDirectly,
    string? ExportsDomain,
    double RatingFarmer,
    int OrdersFulfilled,
    string? Phone,
    string? ImagePath);

public record UpdateFarmerProfileRequest(
    string FarmName,
    string? Description,
    string? Experience,
    string? Specialization,
    string? Certifications,
    string? LocationCounty,
    string? LocationSubCounty,
    string? LocationTown,
    double? FarmLatitude,
    double? FarmLongitude,
    double SizeOfFarmAcres,
    bool AbleToExportDirectly,
    string? ExportsDomain,
    string? Phone,
    string? ImagePath);
