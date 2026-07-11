using iTunda.Api.Models;

namespace iTunda.Api.Dtos;

public record RegisterRequest(string Name, string Email, string Password, string Phone, UserRole Role);

public record LoginRequest(string Email, string Password);

public record GoogleAuthRequest(string Credential);

public record AuthResponse(string Token, int UserId, string Name, string? Email, UserRole Role, string? ImagePath = null);

public record MeResponse(
    int UserId,
    string Name,
    string? Email,
    string? Phone,
    UserRole Role,
    string? ImagePath,
    bool HasFarmerProfile);

public record UpdateMeRequest(string Name, string? Phone, string? ImagePath);
