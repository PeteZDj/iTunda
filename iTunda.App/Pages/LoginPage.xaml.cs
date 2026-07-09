using iTunda.App.Models;
using iTunda.App.Services;

namespace iTunda.App.Pages;

// Teachify-style: dark header band, centered logo, rounded entry fields, amber action button
public class LoginPage : ContentPage
{
    static readonly Color Primary = Color.FromArgb("#1A3A2A");    // deep forest green
    static readonly Color Accent  = Color.FromArgb("#00BFA5");    // teal
    static readonly Color Amber   = Color.FromArgb("#FF8F00");    // amber action

    private readonly ApiClient _api;
    private readonly AppState _appState;
    private readonly Entry _emailEntry;
    private readonly Entry _passwordEntry;
    private readonly Label _errorLabel;
    private readonly ActivityIndicator _spinner;

    public LoginPage(ApiClient api, AppState appState)
    {
        _api = api;
        _appState = appState;
        NavigationPage.SetHasNavigationBar(this, false);
        BackgroundColor = Color.FromArgb("#F5F5F5");

        // ── Dark header band with logo ─────────────────────────────────────
        var header = new Grid
        {
            BackgroundColor = Primary,
            Padding = new Thickness(0, 60, 0, 40),
            Children =
            {
                new VerticalStackLayout
                {
                    HorizontalOptions = LayoutOptions.Center,
                    Spacing = 6,
                    Children =
                    {
                        new Label
                        {
                            Text = "iTunda",
                            FontSize = 42,
                            FontAttributes = FontAttributes.Bold,
                            TextColor = Colors.White,
                            HorizontalTextAlignment = TextAlignment.Center
                        },
                        new Label
                        {
                            Text = "Farm to Fork Marketplace",
                            FontSize = 14,
                            TextColor = Color.FromArgb("#A5D6A7"),
                            HorizontalTextAlignment = TextAlignment.Center
                        }
                    }
                }
            }
        };

        // ── Form card ──────────────────────────────────────────────────────
        _emailEntry = StyledEntry("Email address", Keyboard.Email);
        _passwordEntry = StyledEntry("Password", isPassword: true);

        _errorLabel = new Label
        {
            TextColor = Colors.Red,
            IsVisible = false,
            HorizontalTextAlignment = TextAlignment.Center,
            FontSize = 13
        };

        _spinner = new ActivityIndicator
        {
            Color = Accent,
            IsVisible = false,
            HorizontalOptions = LayoutOptions.Center
        };

        var loginBtn = new Button
        {
            Text = "SIGN IN",
            BackgroundColor = Amber,
            TextColor = Colors.White,
            FontAttributes = FontAttributes.Bold,
            CornerRadius = 30,
            HeightRequest = 52,
            FontSize = 16
        };
        loginBtn.Clicked += OnLoginClicked;

        var signupLink = new Label
        {
            FormattedText = new FormattedString
            {
                Spans =
                {
                    new Span { Text = "Don't have an account? ", TextColor = Colors.Gray, FontSize = 14 },
                    new Span { Text = "Sign Up", TextColor = Accent, FontSize = 14, FontAttributes = FontAttributes.Bold }
                }
            },
            HorizontalTextAlignment = TextAlignment.Center
        };
        var signupGesture = new TapGestureRecognizer();
        signupGesture.Tapped += OnGoToRegisterTapped;
        signupLink.GestureRecognizers.Add(signupGesture);

        var card = new Frame
        {
            BackgroundColor = Colors.White,
            CornerRadius = 12,
            HasShadow = true,
            Margin = new Thickness(24, -30, 24, 0),
            Padding = new Thickness(24, 28),
            Content = new VerticalStackLayout
            {
                Spacing = 14,
                Children =
                {
                    new Label { Text = "Welcome Back", FontSize = 20, FontAttributes = FontAttributes.Bold, TextColor = Primary },
                    new Label { Text = "Sign in to your iTunda account", FontSize = 13, TextColor = Colors.Gray },
                    new BoxView { HeightRequest = 4 },
                    FieldLabel("Email"),
                    _emailEntry,
                    FieldLabel("Password"),
                    _passwordEntry,
                    _spinner,
                    _errorLabel,
                    loginBtn,
                    signupLink
                }
            }
        };

        Content = new ScrollView
        {
            Content = new VerticalStackLayout
            {
                Children = { header, card }
            }
        };
    }

    private static Entry StyledEntry(string placeholder, Keyboard? keyboard = null, bool isPassword = false) =>
        new Entry
        {
            Placeholder = placeholder,
            IsPassword = isPassword,
            Keyboard = keyboard ?? Keyboard.Default,
            BackgroundColor = Color.FromArgb("#F0F0F0"),
            TextColor = Colors.Black,
            PlaceholderColor = Colors.Gray,
            Margin = new Thickness(0),
            HeightRequest = 50
        };

    private static Label FieldLabel(string text) =>
        new Label { Text = text, FontSize = 13, TextColor = Color.FromArgb("#555"), FontAttributes = FontAttributes.Bold };

    private async void OnLoginClicked(object? sender, EventArgs e)
    {
        _errorLabel.IsVisible = false;
        if (string.IsNullOrWhiteSpace(_emailEntry.Text) || string.IsNullOrWhiteSpace(_passwordEntry.Text))
        {
            ShowError("Please enter your email and password.");
            return;
        }
        try
        {
            _spinner.IsVisible = true;
            _spinner.IsRunning = true;
            var auth = await _api.LoginAsync(new LoginRequest
            {
                Email = _emailEntry.Text.Trim(),
                Password = _passwordEntry.Text
            });
            _appState.SetSession(auth);
            Application.Current!.Windows[0].Page = new AppShell(_api, _appState);
        }
        catch (Exception ex) { ShowError(ex.Message); }
        finally
        {
            _spinner.IsVisible = false;
            _spinner.IsRunning = false;
        }
    }

    private async void OnGoToRegisterTapped(object? sender, TappedEventArgs e) =>
        await Navigation.PushAsync(new RegisterPage(_api, _appState));

    private void ShowError(string msg) { _errorLabel.Text = msg; _errorLabel.IsVisible = true; }
}
