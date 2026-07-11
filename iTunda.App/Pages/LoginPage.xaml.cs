using iTunda.App.Models;
using iTunda.App.Services;

namespace iTunda.App.Pages;

// White-on-green: deep green header band, centered leaf logo, rounded fields,
// gold action button, overlapping white card.
public class LoginPage : ContentPage
{
    static readonly Color Primary = Color.FromArgb("#0A4A26");    // deep forest green
    static readonly Color Accent  = Color.FromArgb("#16A34A");    // fresh green
    static readonly Color Amber   = Color.FromArgb("#F4A621");    // harvest gold

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
        BackgroundColor = Color.FromArgb("#F3FAF5");

        // ── Deep green header band with leaf logo ──────────────────────────
        var header = new Grid
        {
            BackgroundColor = Primary,
            Padding = new Thickness(0, 64, 0, 48),
            Children =
            {
                new VerticalStackLayout
                {
                    HorizontalOptions = LayoutOptions.Center,
                    Spacing = 4,
                    Children =
                    {
                        new Label
                        {
                            Text = "\U0001F33F",
                            FontSize = 46,
                            HorizontalTextAlignment = TextAlignment.Center
                        },
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
                            Text = "Global Farm-to-Fork Marketplace",
                            FontSize = 14,
                            TextColor = Color.FromArgb("#A7E8C0"),
                            HorizontalTextAlignment = TextAlignment.Center
                        }
                    }
                }
            }
        };

        // ── Form card ──────────────────────────────────────────────────────
        _emailEntry = StyledEntry("Email address", Keyboard.Email);
        _passwordEntry = StyledEntry("Password", isPassword: true);
        // Prefill a demo account for a one-tap sign-in demo.
        _emailEntry.Text = "james.kamau@farm.ke";
        _passwordEntry.Text = "Password123!";

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
            TextColor = Color.FromArgb("#3A2600"),
            FontAttributes = FontAttributes.Bold,
            CornerRadius = 28,
            HeightRequest = 54,
            FontSize = 16
        };
        loginBtn.Clicked += OnLoginClicked;

        var orRow = new Grid
        {
            ColumnDefinitions = { new ColumnDefinition(GridLength.Star), new ColumnDefinition(GridLength.Auto), new ColumnDefinition(GridLength.Star) },
            ColumnSpacing = 10,
            VerticalOptions = LayoutOptions.Center,
        };
        orRow.Add(new BoxView { HeightRequest = 1, Color = Color.FromArgb("#E0E8E3"), VerticalOptions = LayoutOptions.Center }, 0, 0);
        orRow.Add(new Label { Text = "or", TextColor = Colors.Gray, FontSize = 12, HorizontalOptions = LayoutOptions.Center }, 1, 0);
        orRow.Add(new BoxView { HeightRequest = 1, Color = Color.FromArgb("#E0E8E3"), VerticalOptions = LayoutOptions.Center }, 2, 0);

        var googleBtn = new Button
        {
            Text = "Continue with Google",
            BackgroundColor = Colors.White,
            TextColor = Color.FromArgb("#1F1F1F"),
            BorderColor = Color.FromArgb("#DADCE0"),
            BorderWidth = 1,
            FontAttributes = FontAttributes.Bold,
            CornerRadius = 28,
            HeightRequest = 52,
            FontSize = 15,
            ImageSource = new FontImageSource { Glyph = "G", Color = Color.FromArgb("#4285F4"), Size = 20, FontFamily = "OpenSansSemibold" }
        };
        googleBtn.Clicked += OnGoogleClicked;

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

        var demoHint = new Frame
        {
            BackgroundColor = Color.FromArgb("#E9F6EE"),
            BorderColor = Color.FromArgb("#C6E9D3"),
            CornerRadius = 10,
            HasShadow = false,
            Padding = new Thickness(12, 8),
            Content = new Label
            {
                FormattedText = new FormattedString
                {
                    Spans =
                    {
                        new Span { Text = "Demo login  ", TextColor = Primary, FontSize = 12, FontAttributes = FontAttributes.Bold },
                        new Span { Text = "james.kamau@farm.ke · Password123!", TextColor = Color.FromArgb("#3B5044"), FontSize = 12 }
                    }
                },
                HorizontalTextAlignment = TextAlignment.Center
            }
        };

        var card = new Frame
        {
            BackgroundColor = Colors.White,
            CornerRadius = 18,
            HasShadow = true,
            Margin = new Thickness(24, -34, 24, 24),
            Padding = new Thickness(24, 30),
            Content = new VerticalStackLayout
            {
                Spacing = 14,
                Children =
                {
                    new Label { Text = "Welcome Back", FontSize = 22, FontAttributes = FontAttributes.Bold, TextColor = Primary },
                    new Label { Text = "Sign in to your iTunda account", FontSize = 13, TextColor = Colors.Gray },
                    new BoxView { HeightRequest = 4, Color = Colors.Transparent },
                    FieldLabel("Email"),
                    _emailEntry,
                    FieldLabel("Password"),
                    _passwordEntry,
                    _spinner,
                    _errorLabel,
                    loginBtn,
                    orRow,
                    googleBtn,
                    demoHint,
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
            BackgroundColor = Color.FromArgb("#F1F6F2"),
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

    private async void OnGoogleClicked(object? sender, EventArgs e)
    {
        _errorLabel.IsVisible = false;
        try
        {
            _spinner.IsVisible = true;
            _spinner.IsRunning = true;
            var auth = await GoogleSignIn.AuthenticateAsync();
            if (auth is null) return; // user cancelled
            _appState.SetSession(auth);
            Application.Current!.Windows[0].Page = new AppShell(_api, _appState);
        }
        catch (TaskCanceledException) { /* dismissed */ }
        catch (Exception ex) { ShowError("Google sign-in failed. " + ex.Message); }
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
