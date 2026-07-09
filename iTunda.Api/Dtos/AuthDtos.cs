using iTunda.Api.Models;

namespace iTunda.Api.Dtos;

public record RegisterRequest(string Name, string Email, string Password, string Phone, UserRole Role);

public record LoginRequest(string Email, string Password);

public record AuthResponse(string Token, int UserId, string Name, string? Email, UserRole Role);
