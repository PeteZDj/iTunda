using System.Globalization;
using Microsoft.Maui.Media;
using iTunda.App.Models;
using iTunda.App.Services;

namespace iTunda.App.Pages;

// Farmer post/sell desk — mirrors the web SellPage: photos (camera or gallery),
// decimal quantity, delivery scope, export flag, harvest/expiry dates, drafts,
// plus edit / publish / delete for existing listings.
public class MyListingsPage : ContentPage
{
    static readonly Color Primary = Color.FromArgb("#0A4A26");
    static readonly Color Accent  = Color.FromArgb("#16A34A");
    static readonly Color Amber   = Color.FromArgb("#F4A621");

    private static readonly string[] Categories = {
        "Avocados", "Macadamia Nuts", "French Beans", "Tea", "Coffee",
        "Peas & Mange Tout", "Passion Fruit", "Mangoes", "Bananas", "Pineapples",
        "Tomatoes", "Onions", "Capsicum & Peppers", "Roses", "Apples"
    };
    private static readonly string[] Scopes = { "Local & Export", "Local only", "Export only" };

    private readonly ApiClient _api;
    private readonly Entry _nameEntry;
    private readonly Picker _categoryPicker;
    private readonly Entry _priceEntry;
    private readonly Entry _unitEntry;
    private readonly Entry _quantityEntry;
    private readonly Entry _gradeEntry;
    private readonly Editor _descriptionEditor;
    private readonly Picker _scopePicker;
    private readonly Switch _exportSwitch;
    private readonly DatePicker _plantingPicker;
    private readonly DatePicker _harvestPicker;
    private readonly DatePicker _expiryPicker;
    private readonly Button _locationBtn;
    private readonly Label _locationStatus;
    private readonly HorizontalStackLayout _thumbs;
    private readonly Label _addErrorLabel;
    private readonly Label _formTitle;
    private readonly Button _publishBtn;
    private readonly Button _draftBtn;
    private readonly Button _cancelEditBtn;
    private readonly VerticalStackLayout _listContainer;
    private readonly ActivityIndicator _spinner;

    private readonly List<string> _images = new();
    private int? _editingId;
    private double? _farmLat;
    private double? _farmLng;

    public MyListingsPage(ApiClient api, AppState appState)
    {
        _api = api;
        Title = "Post Produce";
        BackgroundColor = Color.FromArgb("#F3FAF5");

        _nameEntry = StyledEntry("Produce variety (e.g. Hass Avocado)");

        _categoryPicker = new Picker { Title = "Select category...", BackgroundColor = Color.FromArgb("#F0F0F0"), TextColor = Colors.Black };
        foreach (var cat in Categories) _categoryPicker.Items.Add(cat);

        _priceEntry    = StyledEntry("Price per unit (KES)", Keyboard.Numeric);
        _unitEntry     = StyledEntry("Unit (default: kg)");
        _quantityEntry = StyledEntry("Quantity available (decimals ok)", Keyboard.Numeric);
        _gradeEntry    = StyledEntry("Grade (e.g. Grade A, Export Grade)");
        _descriptionEditor = new Editor { Placeholder = "Description (optional)", HeightRequest = 80, BackgroundColor = Color.FromArgb("#F0F0F0") };

        _scopePicker = new Picker { Title = "Delivery scope", BackgroundColor = Color.FromArgb("#F0F0F0"), TextColor = Colors.Black };
        foreach (var s in Scopes) _scopePicker.Items.Add(s);
        _scopePicker.SelectedIndex = 0;

        _exportSwitch = new Switch { OnColor = Accent };
        var exportRow = new HorizontalStackLayout
        {
            Spacing = 10,
            Children = { new Label { Text = "Export-ready produce", FontSize = 13, TextColor = Color.FromArgb("#333"), VerticalOptions = LayoutOptions.Center }, _exportSwitch }
        };

        _plantingPicker = new DatePicker { Date = DateTime.Today.AddMonths(-3), BackgroundColor = Color.FromArgb("#F0F0F0"), TextColor = Colors.Black };
        _harvestPicker = new DatePicker { Date = DateTime.Today, BackgroundColor = Color.FromArgb("#F0F0F0"), TextColor = Colors.Black };
        _expiryPicker  = new DatePicker { Date = DateTime.Today.AddDays(14), BackgroundColor = Color.FromArgb("#F0F0F0"), TextColor = Colors.Black };

        _locationBtn = SecondaryButton("📍 Use my current farm location");
        _locationBtn.Clicked += OnUseLocation;
        _locationStatus = new Label { FontSize = 12, TextColor = Colors.Gray, IsVisible = false };

        // ── Photos (camera / gallery) ────────────────────────────────────────
        _thumbs = new HorizontalStackLayout { Spacing = 8 };
        var pickBtn = SecondaryButton("＋ Gallery");
        pickBtn.Clicked += async (_, _) => await AddPhotoAsync(fromCamera: false);
        var camBtn = SecondaryButton("📷 Camera");
        camBtn.Clicked += async (_, _) => await AddPhotoAsync(fromCamera: true);
        var photoBtns = new Grid { ColumnSpacing = 10, ColumnDefinitions = { new ColumnDefinition(GridLength.Star), new ColumnDefinition(GridLength.Star) } };
        photoBtns.Add(pickBtn, 0, 0);
        photoBtns.Add(camBtn, 1, 0);
        var thumbsScroll = new ScrollView { Orientation = ScrollOrientation.Horizontal, HorizontalScrollBarVisibility = ScrollBarVisibility.Never, Content = _thumbs };

        _addErrorLabel = new Label { TextColor = Colors.Red, IsVisible = false, FontSize = 13 };

        _publishBtn = new Button { Text = "PUBLISH LISTING", BackgroundColor = Accent, TextColor = Colors.White, FontAttributes = FontAttributes.Bold, CornerRadius = 28, HeightRequest = 52 };
        _publishBtn.Clicked += (_, _) => _ = SubmitAsync(isDraft: false);
        _draftBtn = new Button { Text = "Save as draft", BackgroundColor = Colors.White, TextColor = Primary, BorderColor = Accent, BorderWidth = 1.5, FontAttributes = FontAttributes.Bold, CornerRadius = 28, HeightRequest = 48 };
        _draftBtn.Clicked += (_, _) => _ = SubmitAsync(isDraft: true);
        _cancelEditBtn = new Button { Text = "Cancel edit", BackgroundColor = Colors.Transparent, TextColor = Colors.Gray, FontSize = 13, IsVisible = false };
        _cancelEditBtn.Clicked += (_, _) => ResetForm();

        _formTitle = new Label { Text = "Post New Produce", FontSize = 16, FontAttributes = FontAttributes.Bold, TextColor = Primary };

        var formCard = new Frame
        {
            BackgroundColor = Colors.White,
            CornerRadius = 12,
            HasShadow = true,
            Margin = new Thickness(16, 12),
            Padding = new Thickness(20, 16),
            Content = new VerticalStackLayout
            {
                Spacing = 10,
                Children =
                {
                    _formTitle,
                    new BoxView { BackgroundColor = Color.FromArgb("#EEE"), HeightRequest = 1 },
                    FieldLabel("Photos"), photoBtns, thumbsScroll,
                    FieldLabel("Produce Name *"), _nameEntry,
                    FieldLabel("Category *"), _categoryPicker,
                    FieldLabel("Price (KES) *"), _priceEntry,
                    FieldLabel("Unit"), _unitEntry,
                    FieldLabel("Quantity Available *"), _quantityEntry,
                    FieldLabel("Quality Grade"), _gradeEntry,
                    FieldLabel("Delivery scope"), _scopePicker,
                    exportRow,
                    FieldLabel("Farm location (GPS)"), _locationBtn, _locationStatus,
                    FieldLabel("Planting date"), _plantingPicker,
                    FieldLabel("Harvest date"), _harvestPicker,
                    FieldLabel("Best before / expiry"), _expiryPicker,
                    FieldLabel("Description"), _descriptionEditor,
                    _addErrorLabel,
                    _publishBtn,
                    _draftBtn,
                    _cancelEditBtn
                }
            }
        };

        _spinner = new ActivityIndicator { Color = Accent, IsVisible = false, IsRunning = false, HorizontalOptions = LayoutOptions.Center, Margin = new Thickness(0, 20) };
        _listContainer = new VerticalStackLayout { Spacing = 0, Padding = new Thickness(16, 0, 16, 24) };

        var header = new Grid
        {
            BackgroundColor = Primary,
            Padding = new Thickness(16, 44, 16, 16),
            Children = { new Label { Text = "Farmer Dashboard", FontSize = 20, FontAttributes = FontAttributes.Bold, TextColor = Colors.White } }
        };

        Content = new ScrollView
        {
            Content = new VerticalStackLayout
            {
                Children =
                {
                    header,
                    formCard,
                    new Label { Text = "My Listings & Drafts", FontSize = 15, FontAttributes = FontAttributes.Bold, TextColor = Primary, Margin = new Thickness(16, 4, 16, 0) },
                    _spinner,
                    _listContainer
                }
            }
        };
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await LoadAsync();
    }

    private async Task LoadAsync()
    {
        _spinner.IsVisible = _spinner.IsRunning = true;
        _listContainer.Children.Clear();
        try
        {
            var produce = await _api.GetMyProduceAsync();
            if (produce.Count == 0)
            {
                _listContainer.Children.Add(new Label { Text = "You have no listings yet. Add one above.", TextColor = Colors.Gray, HorizontalTextAlignment = TextAlignment.Center, Margin = new Thickness(0, 20) });
            }
            else
            {
                foreach (var p in produce.OrderByDescending(p => p.IsDraft))
                    _listContainer.Children.Add(ListingCard(p));
            }
        }
        catch (Exception ex)
        {
            _listContainer.Children.Add(new Label { Text = FriendlyError(ex), TextColor = Colors.Red });
        }
        finally { _spinner.IsVisible = _spinner.IsRunning = false; }
    }

    private View ListingCard(ProduceResponse p)
    {
        var titleRow = new HorizontalStackLayout
        {
            Spacing = 8,
            Children = { new Label { Text = p.Name, FontSize = 15, FontAttributes = FontAttributes.Bold, TextColor = Color.FromArgb("#0A4A26") } }
        };
        if (p.IsDraft)
            titleRow.Children.Add(new Frame { BackgroundColor = Amber, CornerRadius = 8, Padding = new Thickness(8, 2), HasShadow = false, VerticalOptions = LayoutOptions.Center, Content = new Label { Text = "DRAFT", FontSize = 10, FontAttributes = FontAttributes.Bold, TextColor = Colors.White } });

        var info = new VerticalStackLayout
        {
            Spacing = 2,
            Children =
            {
                titleRow,
                new Label { Text = $"{p.Category}  •  {p.QuantityDisplay}", FontSize = 13, TextColor = Colors.Gray },
                new Label { Text = p.PriceDisplay, FontSize = 13, FontAttributes = FontAttributes.Bold, TextColor = Amber }
            }
        };

        var actions = new HorizontalStackLayout { Spacing = 6, Margin = new Thickness(0, 8, 0, 0) };
        var editBtn = MiniButton("Edit", Accent);
        editBtn.Clicked += (_, _) => BeginEdit(p);
        actions.Children.Add(editBtn);
        if (p.IsDraft)
        {
            var pubBtn = MiniButton("Publish", Primary);
            pubBtn.Clicked += async (_, _) => await PublishAsync(p);
            actions.Children.Add(pubBtn);
        }
        var delBtn = MiniButton("Delete", Color.FromArgb("#C0392B"));
        delBtn.Clicked += async (_, _) => await DeleteAsync(p);
        actions.Children.Add(delBtn);

        return new Frame
        {
            BackgroundColor = Colors.White,
            CornerRadius = 10,
            HasShadow = true,
            Padding = new Thickness(16, 12),
            Margin = new Thickness(0, 6),
            Content = new VerticalStackLayout { Children = { info, actions } }
        };
    }

    private async void OnUseLocation(object? sender, EventArgs e)
    {
        _locationBtn.IsEnabled = false;
        var original = _locationBtn.Text;
        _locationBtn.Text = "Locating…";
        try
        {
            var loc = await Geolocation.Default.GetLocationAsync(new GeolocationRequest(GeolocationAccuracy.Medium, TimeSpan.FromSeconds(15)))
                      ?? await Geolocation.Default.GetLastKnownLocationAsync();
            if (loc is not null)
            {
                _farmLat = loc.Latitude;
                _farmLng = loc.Longitude;
                _locationStatus.Text = $"📍 Pinned at {loc.Latitude:0.0000}, {loc.Longitude:0.0000}";
                _locationStatus.TextColor = Accent;
                _locationStatus.IsVisible = true;
            }
            else
            {
                _locationStatus.Text = "Couldn't get GPS. Your farm's saved location will be used.";
                _locationStatus.TextColor = Colors.Gray;
                _locationStatus.IsVisible = true;
            }
        }
        catch
        {
            _locationStatus.Text = "Location unavailable — grant location permission or use your saved farm location.";
            _locationStatus.TextColor = Colors.Gray;
            _locationStatus.IsVisible = true;
        }
        finally
        {
            _locationBtn.IsEnabled = true;
            _locationBtn.Text = original;
        }
    }

    // ── Photos ────────────────────────────────────────────────────────────
    private async Task AddPhotoAsync(bool fromCamera)
    {
        try
        {
            FileResult? file = fromCamera
                ? (MediaPicker.Default.IsCaptureSupported ? await MediaPicker.Default.CapturePhotoAsync() : null)
                : await MediaPicker.Default.PickPhotoAsync();
            if (file is null)
            {
                if (fromCamera) await DisplayAlert("Camera unavailable", "This device can't capture photos. Try picking from the gallery.", "OK");
                return;
            }

            using var stream = await file.OpenReadAsync();
            var dataUri = await ImageUtil.ToDataUriAsync(stream);
            _images.Add(dataUri);
            AddThumb(dataUri);
        }
        catch (Exception ex)
        {
            await DisplayAlert("Photo error", ex.Message, "OK");
        }
    }

    private void AddThumb(string dataUri)
    {
        // Decode the base64 payload into a stream (data: URIs can't be fetched via FromUri).
        var b64 = dataUri.Substring(dataUri.IndexOf(',') + 1);
        var bytes = Convert.FromBase64String(b64);
        var img = new Image { Source = ImageSource.FromStream(() => new MemoryStream(bytes)), Aspect = Aspect.AspectFill, WidthRequest = 72, HeightRequest = 60 };

        var removeTap = new TapGestureRecognizer();
        var captured = dataUri;
        removeTap.Tapped += (_, _) => { _images.Remove(captured); RebuildThumbs(); };
        var frame = new Frame { CornerRadius = 8, Padding = 0, IsClippedToBounds = true, HasShadow = false, BorderColor = Color.FromArgb("#DDD"), WidthRequest = 72, HeightRequest = 60, Content = img };
        frame.GestureRecognizers.Add(removeTap);
        _thumbs.Children.Add(frame);
    }

    private void RebuildThumbs()
    {
        _thumbs.Children.Clear();
        foreach (var uri in _images) AddThumb(uri);
    }

    // ── Submit / edit / publish / delete ────────────────────────────────────
    private void BeginEdit(ProduceResponse p)
    {
        _editingId = p.Id;
        _formTitle.Text = $"Edit · {p.Name}";
        _nameEntry.Text = p.Name;
        _categoryPicker.SelectedItem = Categories.FirstOrDefault(c => c == p.Category);
        _priceEntry.Text = p.Price.ToString("0.##", CultureInfo.InvariantCulture);
        _unitEntry.Text = p.Unit;
        _quantityEntry.Text = p.QuantityAvailable.ToString("0.##", CultureInfo.InvariantCulture);
        _gradeEntry.Text = p.GradeQuality;
        _descriptionEditor.Text = p.Description;
        _scopePicker.SelectedIndex = p.DeliveryScope switch { "Local" => 1, "Export" => 2, _ => 0 };
        _exportSwitch.IsToggled = p.IsExportReady;
        if (p.PlantingDate.HasValue) _plantingPicker.Date = p.PlantingDate.Value;
        if (p.HarvestDate.HasValue) _harvestPicker.Date = p.HarvestDate.Value;
        if (p.ExpiryDate.HasValue) _expiryPicker.Date = p.ExpiryDate.Value;
        _farmLat = p.FarmLatitude;
        _farmLng = p.FarmLongitude;
        _cancelEditBtn.IsVisible = true;
        _publishBtn.Text = "SAVE CHANGES";
    }

    private void ResetForm()
    {
        _editingId = null;
        _formTitle.Text = "Post New Produce";
        _nameEntry.Text = _priceEntry.Text = _unitEntry.Text = _quantityEntry.Text = _gradeEntry.Text = _descriptionEditor.Text = string.Empty;
        _categoryPicker.SelectedIndex = -1;
        _scopePicker.SelectedIndex = 0;
        _exportSwitch.IsToggled = false;
        _plantingPicker.Date = DateTime.Today.AddMonths(-3);
        _harvestPicker.Date = DateTime.Today;
        _expiryPicker.Date = DateTime.Today.AddDays(14);
        _farmLat = null;
        _farmLng = null;
        _locationStatus.IsVisible = false;
        _images.Clear();
        _thumbs.Children.Clear();
        _addErrorLabel.IsVisible = false;
        _cancelEditBtn.IsVisible = false;
        _publishBtn.Text = "PUBLISH LISTING";
    }

    private string ScopeValue() => _scopePicker.SelectedIndex switch { 1 => "Local", 2 => "Export", _ => "Both" };

    private async Task SubmitAsync(bool isDraft)
    {
        _addErrorLabel.IsVisible = false;

        var hasName = !string.IsNullOrWhiteSpace(_nameEntry.Text);
        var hasCat = _categoryPicker.SelectedIndex >= 0;
        var hasPrice = decimal.TryParse(_priceEntry.Text, NumberStyles.Any, CultureInfo.InvariantCulture, out var price);
        var hasQty = double.TryParse(_quantityEntry.Text, NumberStyles.Any, CultureInfo.InvariantCulture, out var quantity);

        // Drafts can be incomplete; published listings need the essentials.
        if (!isDraft && (!hasName || !hasCat || !hasPrice || !hasQty))
        {
            _addErrorLabel.Text = "To publish, fill in name, category, a valid price and quantity.";
            _addErrorLabel.IsVisible = true;
            return;
        }
        if (!isDraft && _images.Count == 0 && !_editingId.HasValue)
        {
            _addErrorLabel.Text = "Add at least one produce photo to publish (or save as a draft).";
            _addErrorLabel.IsVisible = true;
            return;
        }
        if (!hasName)
        {
            _addErrorLabel.Text = "Give your listing a name before saving.";
            _addErrorLabel.IsVisible = true;
            return;
        }

        var req = new CreateProduceRequest
        {
            Name = _nameEntry.Text!.Trim(),
            Category = hasCat ? _categoryPicker.SelectedItem!.ToString()! : (Categories.FirstOrDefault() ?? "Avocados"),
            Description = _descriptionEditor.Text?.Trim(),
            Price = hasPrice ? price : 0,
            Unit = string.IsNullOrWhiteSpace(_unitEntry.Text) ? "kg" : _unitEntry.Text.Trim(),
            QuantityAvailable = hasQty ? quantity : 0,
            GradeQuality = string.IsNullOrWhiteSpace(_gradeEntry.Text) ? null : _gradeEntry.Text.Trim(),
            IsExportReady = _exportSwitch.IsToggled,
            DeliveryScope = ScopeValue(),
            PlantingDate = _plantingPicker.Date,
            HarvestDate = _harvestPicker.Date,
            ExpiryDate = _expiryPicker.Date,
            FarmLatitude = _farmLat,
            FarmLongitude = _farmLng,
            Images = new List<string>(_images),
            IsDraft = isDraft
        };

        var btn = isDraft ? _draftBtn : _publishBtn;
        var original = btn.Text;
        btn.IsEnabled = false;
        btn.Text = "Saving…";
        try
        {
            if (_editingId.HasValue)
                await _api.UpdateProduceAsync(_editingId.Value, req);
            else
                await _api.CreateProduceAsync(req);

            ResetForm();
            await DisplayAlert("Saved", isDraft ? "Draft saved. You can publish it anytime." : "Your listing is now live.", "OK");
            await LoadAsync();
        }
        catch (Exception ex)
        {
            _addErrorLabel.Text = FriendlyError(ex);
            _addErrorLabel.IsVisible = true;
        }
        finally
        {
            btn.IsEnabled = true;
            btn.Text = original;
        }
    }

    private async Task PublishAsync(ProduceResponse p)
    {
        try
        {
            await _api.UpdateProduceAsync(p.Id, new CreateProduceRequest
            {
                Name = p.Name,
                Category = p.Category,
                Description = p.Description,
                Price = p.Price,
                Unit = p.Unit,
                QuantityAvailable = p.QuantityAvailable,
                GradeQuality = p.GradeQuality,
                IsExportReady = p.IsExportReady,
                DeliveryScope = p.DeliveryScope,
                PlantingDate = p.PlantingDate ?? p.HarvestDate ?? DateTime.Today.AddMonths(-3),
                HarvestDate = p.HarvestDate,
                ExpiryDate = p.ExpiryDate ?? DateTime.Today.AddDays(14),
                FarmLatitude = p.FarmLatitude,
                FarmLongitude = p.FarmLongitude,
                IsDraft = false
            });
            await LoadAsync();
        }
        catch (Exception ex) { await DisplayAlert("Couldn't publish", FriendlyError(ex), "OK"); }
    }

    private async Task DeleteAsync(ProduceResponse p)
    {
        if (!await DisplayAlert("Delete listing", $"Remove \"{p.Name}\"? This can't be undone.", "Delete", "Cancel")) return;
        try
        {
            await _api.DeleteProduceAsync(p.Id);
            await LoadAsync();
        }
        catch (Exception ex) { await DisplayAlert("Couldn't delete", FriendlyError(ex), "OK"); }
    }

    private static string FriendlyError(Exception ex) =>
        ex is HttpRequestException or TaskCanceledException
            ? "Can't reach iTunda. Check your internet connection and try again."
            : ex.Message;

    private static Entry StyledEntry(string placeholder, Keyboard? keyboard = null) => new()
    {
        Placeholder = placeholder, Keyboard = keyboard ?? Keyboard.Default, BackgroundColor = Color.FromArgb("#F0F0F0"),
        TextColor = Colors.Black, PlaceholderColor = Colors.Gray, HeightRequest = 48
    };

    private static Label FieldLabel(string text) => new() { Text = text, FontSize = 13, TextColor = Color.FromArgb("#555"), FontAttributes = FontAttributes.Bold };

    private static Button SecondaryButton(string text) => new()
    {
        Text = text, BackgroundColor = Color.FromArgb("#EEF4F0"), TextColor = Primary, FontAttributes = FontAttributes.Bold,
        CornerRadius = 20, HeightRequest = 44, FontSize = 14
    };

    private static Button MiniButton(string text, Color color) => new()
    {
        Text = text, BackgroundColor = Colors.Transparent, TextColor = color, BorderColor = color, BorderWidth = 1,
        CornerRadius = 16, HeightRequest = 34, FontSize = 12, Padding = new Thickness(12, 0)
    };
}
