using Microsoft.Maui.Authentication;
using iTunda.App.Models;

namespace iTunda.App.Services;

// Runs Google sign-in in the system browser against the hosted bridge page,
// which returns a real iTunda JWT via the "itunda://auth" custom scheme.
public static class GoogleSignIn
{
    public static async Task<AuthResponse?> AuthenticateAsync()
    {
        var result = await WebAuthenticator.Default.AuthenticateAsync(
            new Uri(ApiClient.Origin + "/mobile-signin.html"),
            new Uri("itunda://auth"));

        string Get(string key) => result.Properties.TryGetValue(key, out var v) ? v : string.Empty;

        var token = Get("token");
        if (string.IsNullOrEmpty(token)) return null; // cancelled / no token

        int.TryParse(Get("userId"), out var uid);
        int.TryParse(Get("role"), out var role);

        return new AuthResponse
        {
            Token = token,
            UserId = uid,
            Name = Get("name"),
            Email = Get("email"),
            Role = (UserRole)role
        };
    }
}
