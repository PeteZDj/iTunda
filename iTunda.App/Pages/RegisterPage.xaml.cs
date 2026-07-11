using iTunda.App.Models;
using iTunda.App.Services;

namespace iTunda.App.Pages;

public class RegisterPage : ContentPage
{
    static readonly Color Primary = Color.FromArgb("#0A4A26");
    static readonly Color Accent  = Color.FromArgb("#16A34A");
    static readonly Color Amber   = Color.FromArgb("#F4A621");

    private readonly ApiClient _api;
    private readonly AppState _appState;
    private readonly Entry _nameEntry;
    private readonly Entry _emailEntry;
    private readonly Entry _phoneEntry;
    private readonly Entry _passwordEntry;
    private readonly Picker _rolePicker;
    private readonly Label _errorLabel;
    private readonly ActivityIndicator _spinner;

    public RegisterPage(ApiClient api, AppState appState)
    {
        _api = api;
        _appState = appState;
        NavigationPage.SetHasNavigationBar(this, false);
        BackgroundColor = Color.FromArgb("#F3FAF5");

        var header = new Grid
        {
            BackgroundColor = Primary,
            Padding = new Thickness(0, 50, 0, 36),
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
                            Text = "iTunda",
                            FontSize = 36,
                            FontAttributes = FontAttributes.Bold,
                            TextColor = Colors.White,
                            HorizontalTextAlignment = TextAlignment.Center
                        },
                        new Label
                        {
                            Text = "Create your account",
                            FontSize = 14,
                            TextColor = Color.FromArgb("#A5D6A7"),
                            HorizontalTextAlignment = TextAlignment.Center
                        }
                    }
                }
            }
        };

        _nameEntry     = StyledEntry("Full name");
        _emailEntry    = StyledEntry("Email address", Keyboard.Email);
        _phoneEntry    = StyledEntry("Phone number (optional)", Keyboard.Telephone);
        _passwordEntry = StyledEntry("Password", isPassword: true);

        _rolePicker = new Picker
        {
            Title = "I am a...",
            BackgroundColor = Color.FromArgb("#F0F0F0"),
            TextColor = Colors.Black
        };
        _rolePicker.Items.Add("Buyer (Restaurant / Store / Exporter)");
        _rolePicker.Items.Add("Farmer");
        _rolePicker.SelectedIndex = 0;

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

        var registerBtn = new Button
        {
            Text = "CREATE ACCOUNT",
            BackgroundColor = Amber,
            TextColor = Colors.White,
            FontAttributes = FontAttributes.Bold,
            CornerRadius = 30,
            HeightRequest = 52,
            FontSize = 16
        };
        registerBtn.Clicked += OnRegisterClicked;

        var orRow = new Grid
        {
            ColumnDefinitions = { new ColumnDefinition(GridLength.Star), new ColumnDefinition(GridLength.Auto), new ColumnDefinition(GridLength.Star) },
            ColumnSpacing = 10,
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
            FontSize = 15
        };
        googleBtn.Clicked += OnGoogleClicked;

        var loginLink = new Label
        {
            FormattedText = new FormattedString
            {
                Spans =
                {
                    new Span { Text = "Already have an account? ", TextColor = Colors.Gray, FontSize = 14 },
                    new Span { Text = "Sign In", TextColor = Accent, FontSize = 14, FontAttributes = FontAttributes.Bold }
                }
            },
            HorizontalTextAlignment = TextAlignment.Center
        };
        var loginGesture = new TapGestureRecognizer();
        loginGesture.Tapped += async (_, _) => await Navigation.PopAsync();
        loginLink.GestureRecognizers.Add(loginGesture);

        var card = new Frame
        {
            BackgroundColor = Colors.White,
            CornerRadius = 12,
            HasShadow = true,
            Margin = new Thickness(24, -24, 24, 0),
            Padding = new Thickness(24, 28),
            Content = new VerticalStackLayout
            {
                Spacing = 12,
                Children =
                {
                    new Label { Text = "Full Name *", FontSize = 13, TextColor = Color.FromArgb("#555"), FontAttributes = FontAttributes.Bold },
                    _nameEntry,
                    new Label { Text = "Email *", FontSize = 13, TextColor = Color.FromArgb("#555"), FontAttributes = FontAttributes.Bold },
                    _emailEntry,
                    new Label { Text = "Phone", FontSize = 13, TextColor = Color.FromArgb("#555"), FontAttributes = FontAttributes.Bold },
                    _phoneEntry,
                    new Label { Text = "Password *", FontSize = 13, TextColor = Color.FromArgb("#555"), FontAttributes = FontAttributes.Bold },
                    _passwordEntry,
                    new Label { Text = "Account Type *", FontSize = 13, TextColor = Color.FromArgb("#555"), FontAttributes = FontAttributes.Bold },
                    _rolePicker,
                    _spinner,
                    _errorLabel,
                    new BoxView { HeightRequest = 4 },
                    registerBtn,
                    orRow,
                    googleBtn,
                    loginLink
                }
            }
        };

        Content = new ScrollView
        {
            Content = new VerticalStackLayout { Children = { header, card } }
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
            HeightRequest = 50
        };

    private async void OnRegisterClicked(object? sender, EventArgs e)
    {
        _errorLabel.IsVisible = false;
        if (_rolePicker.SelectedIndex < 0 ||
            string.IsNullOrWhiteSpace(_nameEntry.Text) ||
            string.IsNullOrWhiteSpace(_emailEntry.Text) ||
            string.IsNullOrWhiteSpace(_passwordEntry.Text))
        {
            ShowError("Please fill in all required fields.");
            return;
        }

        var isFarmer = _rolePicker.SelectedItem?.ToString()?.StartsWith("Farmer") == true;
        var role = isFarmer ? UserRole.Farmer : UserRole.Buyer;

        try
        {
            _spinner.IsVisible = true;
            _spinner.IsRunning = true;
            var auth = await _api.RegisterAsync(new RegisterRequest
            {
                Name = _nameEntry.Text.Trim(),
                Email = _emailEntry.Text.Trim(),
                Phone = _phoneEntry.Text?.Trim() ?? string.Empty,
                Password = _passwordEntry.Text,
                Role = role
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

    private void ShowError(string msg) { _errorLabel.Text = msg; _errorLabel.IsVisible = true; }
}
