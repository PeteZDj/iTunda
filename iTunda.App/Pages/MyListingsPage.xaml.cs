using System.Globalization;
using iTunda.App.Models;
using iTunda.App.Services;

namespace iTunda.App.Pages;

public class MyListingsPage : ContentPage
{
    static readonly Color Primary = Color.FromArgb("#1A3A2A");
    static readonly Color Accent  = Color.FromArgb("#00BFA5");
    static readonly Color Amber   = Color.FromArgb("#FF8F00");

    private static readonly string[] Categories = {
        "Avocados", "Macadamia Nuts", "French Beans", "Tea",
        "Peas & Mange Tout", "Passion Fruit", "Mangoes", "Bananas",
        "Tomatoes", "Onions", "Capsicum & Peppers", "Roses"
    };

    private readonly ApiClient _api;
    private readonly Entry _nameEntry;
    private readonly Picker _categoryPicker;
    private readonly Entry _priceEntry;
    private readonly Entry _unitEntry;
    private readonly Entry _quantityEntry;
    private readonly Entry _gradeEntry;
    private readonly Editor _descriptionEditor;
    private readonly Label _addErrorLabel;
    private readonly VerticalStackLayout _listContainer;
    private readonly ActivityIndicator _spinner;

    public MyListingsPage(ApiClient api, AppState appState)
    {
        _api = api;
        Title = "My Listings";
        BackgroundColor = Color.FromArgb("#F5F5F5");

        // ── Form card ──────────────────────────────────────────────────────
        _nameEntry = StyledEntry("Produce variety (e.g. Hass Avocado)");

        _categoryPicker = new Picker
        {
            Title = "Select category...",
            BackgroundColor = Color.FromArgb("#F0F0F0"),
            TextColor = Colors.Black
        };
        foreach (var cat in Categories)
            _categoryPicker.Items.Add(cat);

        _priceEntry   = StyledEntry("Price per unit (KES)", Keyboard.Numeric);
        _unitEntry    = StyledEntry("Unit (default: kg)");
        _quantityEntry = StyledEntry("Quantity available", Keyboard.Numeric);
        _gradeEntry   = StyledEntry("Grade (e.g. Grade A, Export Grade)");
        _descriptionEditor = new Editor
        {
            Placeholder = "Description (optional)",
            HeightRequest = 80,
            BackgroundColor = Color.FromArgb("#F0F0F0")
        };

        _addErrorLabel = new Label { TextColor = Colors.Red, IsVisible = false, FontSize = 13 };

        var addBtn = new Button
        {
            Text = "ADD LISTING",
            BackgroundColor = Amber,
            TextColor = Colors.White,
            FontAttributes = FontAttributes.Bold,
            CornerRadius = 30,
            HeightRequest = 52
        };
        addBtn.Clicked += OnAddListingClicked;

        var formCard = new Frame
        {
            BackgroundColor = Colors.White,
            CornerRadius = 10,
            HasShadow = true,
            Margin = new Thickness(16, 12),
            Padding = new Thickness(20, 16),
            Content = new VerticalStackLayout
            {
                Spacing = 10,
                Children =
                {
                    new Label { Text = "Post New Produce", FontSize = 16, FontAttributes = FontAttributes.Bold, TextColor = Primary },
                    new BoxView { BackgroundColor = Color.FromArgb("#EEE"), HeightRequest = 1 },
                    FieldLabel("Produce Name *"), _nameEntry,
                    FieldLabel("Category *"), _categoryPicker,
                    FieldLabel("Price (KES) *"), _priceEntry,
                    FieldLabel("Unit"), _unitEntry,
                    FieldLabel("Quantity Available *"), _quantityEntry,
                    FieldLabel("Quality Grade"), _gradeEntry,
                    FieldLabel("Description"), _descriptionEditor,
                    _addErrorLabel,
                    addBtn
                }
            }
        };

        // ── Listings list ──────────────────────────────────────────────────
        _spinner = new ActivityIndicator
        {
            Color = Accent, IsVisible = false, IsRunning = false,
            HorizontalOptions = LayoutOptions.Center,
            Margin = new Thickness(0, 20)
        };

        _listContainer = new VerticalStackLayout { Spacing = 0, Padding = new Thickness(16, 0, 16, 24) };

        var header = new Grid
        {
            BackgroundColor = Primary,
            Padding = new Thickness(16, 14),
            Children =
            {
                new Label { Text = "Farmer Dashboard", FontSize = 18, FontAttributes = FontAttributes.Bold, TextColor = Colors.White }
            }
        };

        Content = new ScrollView
        {
            Content = new VerticalStackLayout
            {
                Children =
                {
                    header,
                    formCard,
                    new Label { Text = "My Active Listings", FontSize = 15, FontAttributes = FontAttributes.Bold,
                                TextColor = Primary, Margin = new Thickness(16, 4, 16, 0) },
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
        _spinner.IsVisible = true;
        _spinner.IsRunning = true;
        _listContainer.Children.Clear();

        try
        {
            var profile = await _api.GetMyFarmerProfileAsync();
            var produce = await _api.GetMyListingsAsync(profile.Id);

            if (produce.Count == 0)
            {
                _listContainer.Children.Add(new Label
                {
                    Text = "You have no listings yet. Add one above.",
                    TextColor = Colors.Gray,
                    HorizontalTextAlignment = TextAlignment.Center,
                    Margin = new Thickness(0, 20)
                });
            }
            else
            {
                foreach (var p in produce)
                    _listContainer.Children.Add(ListingCard(p));
            }
        }
        catch (Exception ex)
        {
            _listContainer.Children.Add(new Label { Text = ex.Message, TextColor = Colors.Red });
        }
        finally
        {
            _spinner.IsVisible = false;
            _spinner.IsRunning = false;
        }
    }

    private View ListingCard(ProduceResponse p)
    {
        var row = new Grid
        {
            ColumnDefinitions =
            {
                new ColumnDefinition(GridLength.Star),
                new ColumnDefinition(GridLength.Auto)
            }
        };
        row.Add(new VerticalStackLayout
        {
            Spacing = 2,
            Children =
            {
                new Label { Text = p.Name, FontSize = 15, FontAttributes = FontAttributes.Bold, TextColor = Color.FromArgb("#1A3A2A") },
                new Label { Text = $"{p.Category}  •  {p.QuantityDisplay}", FontSize = 13, TextColor = Colors.Gray },
                new Label { Text = p.ExpiryDisplay, FontSize = 12, TextColor = p.ExpiryDate.HasValue && p.ExpiryDate < DateTime.UtcNow.AddDays(7) ? Colors.Red : Colors.Gray }
            }
        }, 0, 0);
        row.Add(new Label
        {
            Text = p.PriceDisplay,
            FontSize = 14,
            FontAttributes = FontAttributes.Bold,
            TextColor = Color.FromArgb("#FF8F00"),
            VerticalTextAlignment = TextAlignment.Center
        }, 1, 0);

        return new Frame
        {
            BackgroundColor = Colors.White,
            CornerRadius = 8,
            HasShadow = true,
            Padding = new Thickness(16, 12),
            Margin = new Thickness(0, 6),
            Content = row
        };
    }

    private async void OnAddListingClicked(object? sender, EventArgs e)
    {
        _addErrorLabel.IsVisible = false;

        if (string.IsNullOrWhiteSpace(_nameEntry.Text) ||
            _categoryPicker.SelectedIndex < 0 ||
            !decimal.TryParse(_priceEntry.Text, NumberStyles.Any, CultureInfo.InvariantCulture, out var price) ||
            !double.TryParse(_quantityEntry.Text, NumberStyles.Any, CultureInfo.InvariantCulture, out var quantity))
        {
            _addErrorLabel.Text = "Please fill in name, category, a valid price and quantity.";
            _addErrorLabel.IsVisible = true;
            return;
        }

        try
        {
            await _api.CreateProduceAsync(new CreateProduceRequest
            {
                Name = _nameEntry.Text.Trim(),
                Category = _categoryPicker.SelectedItem!.ToString()!,
                Description = _descriptionEditor.Text?.Trim(),
                Price = price,
                Unit = string.IsNullOrWhiteSpace(_unitEntry.Text) ? "kg" : _unitEntry.Text.Trim(),
                QuantityAvailable = quantity,
                GradeQuality = string.IsNullOrWhiteSpace(_gradeEntry.Text) ? null : _gradeEntry.Text.Trim()
            });

            _nameEntry.Text = _priceEntry.Text = _unitEntry.Text =
            _quantityEntry.Text = _gradeEntry.Text = _descriptionEditor.Text = string.Empty;
            _categoryPicker.SelectedIndex = -1;

            await LoadAsync();
        }
        catch (Exception ex)
        {
            _addErrorLabel.Text = ex.Message;
            _addErrorLabel.IsVisible = true;
        }
    }

    private static Entry StyledEntry(string placeholder, Keyboard? keyboard = null) =>
        new Entry
        {
            Placeholder = placeholder,
            Keyboard = keyboard ?? Keyboard.Default,
            BackgroundColor = Color.FromArgb("#F0F0F0"),
            TextColor = Colors.Black,
            PlaceholderColor = Colors.Gray,
            HeightRequest = 48
        };

    private static Label FieldLabel(string text) =>
        new Label { Text = text, FontSize = 13, TextColor = Color.FromArgb("#555"), FontAttributes = FontAttributes.Bold };
}
