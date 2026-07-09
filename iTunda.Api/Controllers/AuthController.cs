using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using iTunda.Api.Data;
using iTunda.Api.Dtos;
using iTunda.Api.Models;
using iTunda.Api.Services;

namespace iTunda.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ItundaDbContext _db;
    private readonly TokenService _tokenService;

    public AuthController(ItundaDbContext db, TokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            return Conflict("A user with this email already exists.");

        var user = new User
        {
            Name = request.Name,
            Email = request.Email,
            Phone = request.Phone,
            Role = request.Role,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };

        if (request.Role == UserRole.Farmer)
        {
            user.FarmerProfile = new FarmerProfile
            {
                FarmName = request.Name + "'s Farm"
            };
        }

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = _tokenService.CreateToken(user);
        return Ok(new AuthResponse(token, user.Id, user.Name, user.Email, user.Role));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized("Invalid email or password.");

        var token = _tokenService.CreateToken(user);
        return Ok(new AuthResponse(token, user.Id, user.Name, user.Email, user.Role));
    }
}
