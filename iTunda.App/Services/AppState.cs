using iTunda.App.Models;

namespace iTunda.App.Services;

public class AppState
{
    public string? Token { get; private set; }
    public int UserId { get; private set; }
    public string? Name { get; private set; }
    public string? Email { get; private set; }
    public UserRole Role { get; private set; }

    public bool IsLoggedIn => !string.IsNullOrEmpty(Token);

    public AppState()
    {
        Token  = Preferences.Get(nameof(Token), null);
        UserId = Preferences.Get(nameof(UserId), 0);
        Name   = Preferences.Get(nameof(Name), null);
        Email  = Preferences.Get(nameof(Email), null);
        Role   = (UserRole)Preferences.Get(nameof(Role), 0);
    }

    public void SetSession(AuthResponse auth)
    {
        Token  = auth.Token;
        UserId = auth.UserId;
        Name   = auth.Name;
        Email  = auth.Email;
        Role   = auth.Role;

        Preferences.Set(nameof(Token), Token);
        Preferences.Set(nameof(UserId), UserId);
        Preferences.Set(nameof(Name), Name ?? string.Empty);
        Preferences.Set(nameof(Email), Email ?? string.Empty);
        Preferences.Set(nameof(Role), (int)Role);
    }

    public void Clear()
    {
        Token  = null;
        UserId = 0;
        Name   = null;
        Email  = null;
        Preferences.Clear();
    }
}
