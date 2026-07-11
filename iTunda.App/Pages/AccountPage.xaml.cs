using Microsoft.Maui.Media;
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
    private readonly Image _avatarImage;
    private readonly Label _avatarEmoji;
    private readonly Entry _editName;
    private readonly Entry _editPhone;
    private readonly Button _saveBtn;
    private readonly Label _saveStatus;
    private readonly Picker _currencyPicker;
    private readonly VerticalStackLayout _farmerDetails;
    private readonly ActivityIndicator _spinner;

    private string? _photoDataUri;

    public AccountPage(AppState appState, ApiClient api)
    {
        _appState = appState;
        _api = api;
        Title = "Account";
        BackgroundColor = Color.FromArgb("#F3FAF5");

        _nameLabel  = new Label { FontSize = 22, FontAttributes = FontAttributes.Bold, TextColor = Colors.White, HorizontalTextAlignment = TextAlignment.Center };
        _roleLabel  = new Label { FontSize = 14, TextColor = Color.FromArgb("#A5D6A7"), HorizontalTextAlignment = TextAlignment.Center };
        _emailLabel = new Label { FontSize = 13, TextColor = Color.FromArgb("#CCCCCC"), HorizontalTextAlignment = TextAlignment.Center };

        _avatarEmoji = new Label { Text = "👤", FontSize = 36, HorizontalTextAlignment = TextAlignment.Center, VerticalTextAlignment = TextAlignment.Center };
        _avatarImage = new Image { Aspect = Aspect.AspectFill, WidthRequest = 72, HeightRequest = 72, IsVisible = false };
        var avatarFrame = new Frame
        {
            BackgroundColor = Colors.White, CornerRadius = 36, Padding = 0, HasShadow = false, IsClippedToBounds = true,
            HeightRequest = 72, WidthRequest = 72, HorizontalOptions = LayoutOptions.Center,
            Content = new Grid { Children = { _avatarEmoji, _avatarImage } }
        };

        var banner = new VerticalStackLayout
        {
            BackgroundColor = Banner,
            Padding = new Thickness(20, 50, 20, 30),
            Spacing = 6,
            HorizontalOptions = LayoutOptions.Fill,
            Children = { avatarFrame, _nameLabel, _roleLabel, _emailLabel }
        };

        // ── Edit profile card ────────────────────────────────────────────────
        _editName = Field("Your name");
        _editPhone = Field("Phone number", Keyboard.Telephone);
        var photoBtn = new Button { Text = "📷 Change photo", BackgroundColor = Color.FromArgb("#EEF4F0"), TextColor = Primary, FontAttributes = FontAttributes.Bold, CornerRadius = 20, HeightRequest = 44, FontSize = 14 };
        photoBtn.Clicked += OnChangePhoto;
        _saveBtn = new Button { Text = "SAVE PROFILE", BackgroundColor = Accent, TextColor = Colors.White, FontAttributes = FontAttributes.Bold, CornerRadius = 24, HeightRequest = 48 };
        _saveBtn.Clicked += OnSaveProfile;
        _saveStatus = new Label { FontSize = 13, IsVisible = false };

        var editCard = new Frame
        {
            BackgroundColor = Colors.White, CornerRadius = 12, HasShadow = true, Margin = new Thickness(16, 12, 16, 0), Padding = new Thickness(20, 16),
            Content = new VerticalStackLayout
            {
                Spacing = 10,
                Children =
                {
                    new Label { Text = "Edit profile", FontSize = 15, FontAttributes = FontAttributes.Bold, TextColor = Primary },
                    new BoxView { BackgroundColor = Color.FromArgb("#EEE"), HeightRequest = 1 },
                    FieldLabel("Name"), _editName,
                    FieldLabel("Phone"), _editPhone,
                    photoBtn,
                    _saveBtn,
                    _saveStatus
                }
            }
        };

        // ── Currency preference card ─────────────────────────────────────────
        _currencyPicker = new Picker { Title = "Currency", BackgroundColor = Color.FromArgb("#F0F0F0"), TextColor = Colors.Black };
        foreach (var c in Currency.All) _currencyPicker.Items.Add($"{c.Code}  ({c.Symbol.Trim()})");
        _currencyPicker.SelectedIndex = Array.FindIndex(Currency.All, c => c.Code == Currency.Current.Code);
        _currencyPicker.SelectedIndexChanged += (_, _) =>
        {
            if (_currencyPicker.SelectedIndex >= 0) Currency.Set(Currency.All[_currencyPicker.SelectedIndex].Code);
        };
        var currencyCard = new Frame
        {
            BackgroundColor = Colors.White, CornerRadius = 12, HasShadow = true, Margin = new Thickness(16, 12, 16, 0), Padding = new Thickness(20, 16),
            Content = new VerticalStackLayout
            {
                Spacing = 8,
                Children =
                {
                    new Label { Text = "Display currency", FontSize = 15, FontAttributes = FontAttributes.Bold, TextColor = Primary },
                    new Label { Text = "Prices across the app are shown in this currency.", FontSize = 12, TextColor = Colors.Gray },
                    _currencyPicker
                }
            }
        };

        _spinner = new ActivityIndicator { Color = Accent, IsVisible = false, IsRunning = false, HorizontalOptions = LayoutOptions.Center, Margin = new Thickness(0, 16) };
        _farmerDetails = new VerticalStackLayout { Spacing = 0, IsVisible = false };

        var logoutBtn = new Button { Text = "SIGN OUT", BackgroundColor = Colors.Transparent, TextColor = Colors.Red, FontAttributes = FontAttributes.Bold, BorderColor = Colors.Red, BorderWidth = 1, CornerRadius = 30, HeightRequest = 48, Margin = new Thickness(32, 8) };
        logoutBtn.Clicked += OnLogoutClicked;

        var appVersionCard = new Frame
        {
            BackgroundColor = Colors.White, CornerRadius = 10, HasShadow = true, Margin = new Thickness(16, 12), Padding = new Thickness(20, 16),
            Content = new VerticalStackLayout
            {
                Spacing = 8,
                Children =
                {
                    new Label { Text = "iTunda", FontSize = 15, FontAttributes = FontAttributes.Bold, TextColor = Primary },
                    new Label { Text = "Farm to Fork · Farm to Futures Marketplace", FontSize = 13, TextColor = Colors.Gray },
                    new BoxView { BackgroundColor = Color.FromArgb("#EEE"), HeightRequest = 1 },
                    new Label { Text = "v1.1 — Trade, sell & deliver", FontSize = 12, TextColor = Colors.LightGray }
                }
            }
        };

        Content = new ScrollView
        {
            Content = new VerticalStackLayout
            {
                Children = { banner, editCard, currencyCard, _spinner, _farmerDetails, appVersionCard, logoutBtn }
            }
        };
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        _nameLabel.Text = _appState.Name ?? "Unknown";
        _roleLabel.Text = _appState.Role == UserRole.Farmer ? "Farmer" : "Buyer";
        _emailLabel.Text = _appState.Email ?? "";
        _editName.Text = _appState.Name ?? "";

        await LoadProfileAsync();
        if (_appState.Role == UserRole.Farmer)
            await LoadFarmerDetailsAsync();
    }

    private async Task LoadProfileAsync()
    {
        try
        {
            var me = await _api.GetMeAsync();
            _editName.Text = me.Name;
            _editPhone.Text = me.Phone;
            _nameLabel.Text = me.Name;
            ShowAvatar(me.ImagePath);
        }
        catch { }
    }

    private void ShowAvatar(string? imagePath)
    {
        if (string.IsNullOrWhiteSpace(imagePath)) return;
        try
        {
            if (imagePath.StartsWith("data:"))
            {
                var bytes = Convert.FromBase64String(imagePath[(imagePath.IndexOf(',') + 1)..]);
                _avatarImage.Source = ImageSource.FromStream(() => new MemoryStream(bytes));
            }
            else
            {
                var url = imagePath.StartsWith("http") ? imagePath : $"{ApiClient.Origin}{imagePath}";
                _avatarImage.Source = ImageSource.FromUri(new Uri(url));
            }
            _avatarImage.IsVisible = true;
            _avatarEmoji.IsVisible = false;
        }
        catch { }
    }

    private async void OnChangePhoto(object? sender, EventArgs e)
    {
        try
        {
            var file = await MediaPicker.Default.PickPhotoAsync();
            if (file is null) return;
            using var stream = await file.OpenReadAsync();
            _photoDataUri = await ImageUtil.ToDataUriAsync(stream, 512);
            var bytes = Convert.FromBase64String(_photoDataUri[(_photoDataUri.IndexOf(',') + 1)..]);
            _avatarImage.Source = ImageSource.FromStream(() => new MemoryStream(bytes));
            _avatarImage.IsVisible = true;
            _avatarEmoji.IsVisible = false;
        }
        catch (Exception ex) { await DisplayAlert("Photo error", ex.Message, "OK"); }
    }

    private async void OnSaveProfile(object? sender, EventArgs e)
    {
        if (string.IsNullOrWhiteSpace(_editName.Text))
        {
            ShowStatus("Please enter your name.", Colors.Red);
            return;
        }
        _saveBtn.IsEnabled = false;
        var original = _saveBtn.Text;
        _saveBtn.Text = "Saving…";
        try
        {
            var me = await _api.UpdateMeAsync(new UpdateMeRequest
            {
                Name = _editName.Text.Trim(),
                Phone = string.IsNullOrWhiteSpace(_editPhone.Text) ? null : _editPhone.Text.Trim(),
                ImagePath = _photoDataUri
            });
            _appState.SetName(me.Name);
            _nameLabel.Text = me.Name;
            ShowStatus("Profile updated.", Accent);
        }
        catch (Exception ex)
        {
            var msg = ex is HttpRequestException or TaskCanceledException ? "Can't reach iTunda. Check your connection." : ex.Message;
            ShowStatus(msg, Colors.Red);
        }
        finally
        {
            _saveBtn.IsEnabled = true;
            _saveBtn.Text = original;
        }
    }

    private void ShowStatus(string text, Color color)
    {
        _saveStatus.Text = text;
        _saveStatus.TextColor = color;
        _saveStatus.IsVisible = true;
    }

    private async Task LoadFarmerDetailsAsync()
    {
        _spinner.IsVisible = _spinner.IsRunning = true;
        _farmerDetails.IsVisible = false;
        _farmerDetails.Children.Clear();
        try
        {
            var profile = await _api.GetMyFarmerProfileAsync();
            _farmerDetails.Children.Add(new Frame
            {
                BackgroundColor = Colors.White, CornerRadius = 10, HasShadow = true, Margin = new Thickness(16, 12, 16, 0), Padding = new Thickness(20, 16),
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
        finally { _spinner.IsVisible = _spinner.IsRunning = false; }
    }

    private static Grid InfoRow(string label, string value)
    {
        var g = new Grid { ColumnDefinitions = { new ColumnDefinition(new GridLength(140)), new ColumnDefinition(GridLength.Star) } };
        g.Add(new Label { Text = label, FontSize = 13, TextColor = Colors.Gray, FontAttributes = FontAttributes.Bold }, 0, 0);
        g.Add(new Label { Text = value, FontSize = 13, TextColor = Color.FromArgb("#333") }, 1, 0);
        return g;
    }

    private static Entry Field(string placeholder, Keyboard? kb = null) => new()
    {
        Placeholder = placeholder, Keyboard = kb ?? Keyboard.Default, BackgroundColor = Color.FromArgb("#F0F0F0"),
        TextColor = Colors.Black, PlaceholderColor = Colors.Gray, HeightRequest = 46
    };

    private static Label FieldLabel(string text) => new() { Text = text, FontSize = 12, TextColor = Color.FromArgb("#555"), FontAttributes = FontAttributes.Bold };

    private void OnLogoutClicked(object? sender, EventArgs e)
    {
        _appState.Clear();
        Application.Current!.Windows[0].Page = new NavigationPage(new LoginPage(_api, _appState));
    }
}
