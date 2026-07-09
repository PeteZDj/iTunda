using iTunda.App.Models;
using iTunda.App.Services;

namespace iTunda.App.Pages;

public class AccountPage : ContentPage
{
    static readonly Color Primary = Color.FromArgb("#0A4A26");
    static readonly Color Accent  = Color.FromArgb("#16A34A");
    static readonly Color Amber   = Color.FromArgb("#F4A621");
    static readonly Color Banner  = Color.FromArgb("#2E7D32");

    private readonly AppState _appState;
    private readonly ApiClient _api;
    private readonly Label _nameLabel;
    private readonly Label _roleLabel;
    private readonly Label _emailLabel;
    private readonly VerticalStackLayout _farmerDetails;
    private readonly ActivityIndicator _spinner;

    public AccountPage(AppState appState, ApiClient api)
    {
        _appState = appState;
        _api = api;
        Title = "Account";
        BackgroundColor = Color.FromArgb("#F3FAF5");

        // ── Profile banner (Teachify MasterPage style) ────────────────────
        _nameLabel = new Label
        {
            FontSize = 22,
            FontAttributes = FontAttributes.Bold,
            TextColor = Colors.White,
            HorizontalTextAlignment = TextAlignment.Center
        };

        _roleLabel = new Label
        {
            FontSize = 14,
            TextColor = Color.FromArgb("#A5D6A7"),
            HorizontalTextAlignment = TextAlignment.Center
        };

        _emailLabel = new Label
        {
            FontSize = 13,
            TextColor = Color.FromArgb("#CCCCCC"),
            HorizontalTextAlignment = TextAlignment.Center
        };

        var banner = new Grid
        {
            BackgroundColor = Banner,
            Padding = new Thickness(20, 50, 20, 30),
            Children =
            {
                new VerticalStackLayout
                {
                    HorizontalOptions = LayoutOptions.Center,
                    Spacing = 6,
                    Children =
                    {
                        // Avatar circle
                        new Frame
                        {
                            BackgroundColor = Colors.White,
                            CornerRadius = 36,
                            Padding = new Thickness(0),
                            HasShadow = false,
                            HeightRequest = 72,
                            WidthRequest = 72,
                            HorizontalOptions = LayoutOptions.Center,
                            Content = new Label
                            {
                                Text = "👤",
                                FontSize = 36,
                                HorizontalTextAlignment = TextAlignment.Center,
                                VerticalTextAlignment = TextAlignment.Center
                            }
                        },
                        _nameLabel,
                        _roleLabel,
                        _emailLabel
                    }
                }
            }
        };

        // ── Farmer profile info card ───────────────────────────────────────
        _spinner = new ActivityIndicator
        {
            Color = Accent, IsVisible = false, IsRunning = false,
            HorizontalOptions = LayoutOptions.Center, Margin = new Thickness(0, 16)
        };

        _farmerDetails = new VerticalStackLayout { Spacing = 0, IsVisible = false };

        // ── Logout button ─────────────────────────────────────────────────
        var logoutBtn = new Button
        {
            Text = "SIGN OUT",
            BackgroundColor = Colors.Transparent,
            TextColor = Colors.Red,
            FontAttributes = FontAttributes.Bold,
            BorderColor = Colors.Red,
            BorderWidth = 1,
            CornerRadius = 30,
            HeightRequest = 48,
            Margin = new Thickness(32, 8)
        };
        logoutBtn.Clicked += OnLogoutClicked;

        var appVersionCard = new Frame
        {
            BackgroundColor = Colors.White,
            CornerRadius = 10,
            HasShadow = true,
            Margin = new Thickness(16, 12),
            Padding = new Thickness(20, 16),
            Content = new VerticalStackLayout
            {
                Spacing = 8,
                Children =
                {
                    new Label { Text = "iTunda", FontSize = 15, FontAttributes = FontAttributes.Bold, TextColor = Primary },
                    new Label { Text = "Farm to Fork Marketplace", FontSize = 13, TextColor = Colors.Gray },
                    new Label { Text = "Kenya's Premier Produce Platform", FontSize = 13, TextColor = Colors.Gray },
                    new BoxView { BackgroundColor = Color.FromArgb("#EEE"), HeightRequest = 1 },
                    new Label { Text = "v1.0 — Built with .NET MAUI 8", FontSize = 12, TextColor = Colors.LightGray }
                }
            }
        };

        Content = new ScrollView
        {
            Content = new VerticalStackLayout
            {
                Children = { banner, _spinner, _farmerDetails, appVersionCard, logoutBtn }
            }
        };
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        _nameLabel.Text = _appState.Name ?? "Unknown";
        _roleLabel.Text = _appState.Role == UserRole.Farmer ? "Farmer" : "Buyer";
        _emailLabel.Text = _appState.Email ?? "";

        if (_appState.Role == UserRole.Farmer)
            await LoadFarmerDetailsAsync();
    }

    private async Task LoadFarmerDetailsAsync()
    {
        _spinner.IsVisible = true;
        _spinner.IsRunning = true;
        _farmerDetails.IsVisible = false;
        _farmerDetails.Children.Clear();

        try
        {
            var profile = await _api.GetMyFarmerProfileAsync();

            _farmerDetails.Children.Add(new Frame
            {
                BackgroundColor = Colors.White,
                CornerRadius = 10,
                HasShadow = true,
                Margin = new Thickness(16, 0, 16, 12),
                Padding = new Thickness(20, 16),
                Content = new VerticalStackLayout
                {
                    Spacing = 10,
                    Children =
                    {
                        new Label { Text = "My Farm", FontSize = 15, FontAttributes = FontAttributes.Bold, TextColor = Primary },
                        new BoxView { BackgroundColor = Color.FromArgb("#EEE"), HeightRequest = 1 },
                        InfoRow("Farm Name", profile.FarmName),
                        InfoRow("County", profile.LocationDisplay),
                        InfoRow("Size", $"{profile.SizeOfFarmAcres:0.#} acres"),
                        InfoRow("Specialization", profile.Specialization ?? "—"),
                        InfoRow("Rating", $"★ {profile.RatingFarmer:0.0}"),
                        InfoRow("Orders Fulfilled", $"{profile.OrdersFulfilled}"),
                        InfoRow("Export Capable", profile.AbleToExportDirectly ? "Yes" : "No")
                    }
                }
            });

            _farmerDetails.IsVisible = true;
        }
        catch { }
        finally
        {
            _spinner.IsVisible = false;
            _spinner.IsRunning = false;
        }
    }

    private static Grid InfoRow(string label, string value)
    {
        var g = new Grid
        {
            ColumnDefinitions =
            {
                new ColumnDefinition(new GridLength(140)),
                new ColumnDefinition(GridLength.Star)
            }
        };
        g.Add(new Label { Text = label, FontSize = 13, TextColor = Colors.Gray, FontAttributes = FontAttributes.Bold }, 0, 0);
        g.Add(new Label { Text = value, FontSize = 13, TextColor = Color.FromArgb("#333") }, 1, 0);
        return g;
    }

    private void OnLogoutClicked(object? sender, EventArgs e)
    {
        _appState.Clear();
        Application.Current!.Windows[0].Page = new NavigationPage(new LoginPage(_api, _appState));
    }
}
