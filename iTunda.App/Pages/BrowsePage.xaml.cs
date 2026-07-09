using iTunda.App.Models;
using iTunda.App.Services;

namespace iTunda.App.Pages;

public class BrowsePage : ContentPage
{
    static readonly Color Primary = Color.FromArgb("#0A4A26");
    static readonly Color Accent  = Color.FromArgb("#16A34A");
    static readonly Color Amber   = Color.FromArgb("#F4A621");

    private static readonly string[] Categories = {
        "Avocados", "Macadamia Nuts", "French Beans", "Tea",
        "Peas & Mange Tout", "Passion Fruit", "Mangoes", "Bananas",
        "Tomatoes", "Onions", "Capsicum & Peppers", "Roses"
    };

    private readonly ApiClient _api;
    private readonly AppState _appState;
    private readonly Entry _searchEntry;
    private readonly HorizontalStackLayout _categoryRow;
    private readonly VerticalStackLayout _listContainer;
    private readonly ActivityIndicator _spinner;
    private readonly Label _emptyLabel;
    private string? _activeCategory;

    public BrowsePage(ApiClient api, AppState appState)
    {
        _api = api;
        _appState = appState;
        Title = "Browse";
        BackgroundColor = Color.FromArgb("#F3FAF5");

        _searchEntry = new Entry
        {
            Placeholder = "Search produce (e.g. avocados, onions...)",
            BackgroundColor = Colors.White,
            TextColor = Colors.Black,
            PlaceholderColor = Colors.Gray,
            HeightRequest = 46
        };
        _searchEntry.Completed += async (_, _) => await LoadAsync();

        var searchBtn = new Button
        {
            Text = "Search",
            BackgroundColor = Amber,
            TextColor = Colors.White,
            CornerRadius = 8,
            FontAttributes = FontAttributes.Bold,
            HeightRequest = 46,
            WidthRequest = 90
        };
        searchBtn.Clicked += async (_, _) => await LoadAsync();

        var searchRow = new Grid
        {
            Padding = new Thickness(16, 12, 16, 0),
            ColumnSpacing = 8,
            ColumnDefinitions =
            {
                new ColumnDefinition(GridLength.Star),
                new ColumnDefinition(GridLength.Auto)
            }
        };
        searchRow.Add(_searchEntry, 0, 0);
        searchRow.Add(searchBtn, 1, 0);

        _categoryRow = new HorizontalStackLayout { Spacing = 8, Padding = new Thickness(16, 10) };
        BuildCategoryChips();

        var categoryScroll = new ScrollView
        {
            Orientation = ScrollOrientation.Horizontal,
            HorizontalScrollBarVisibility = ScrollBarVisibility.Never,
            Content = _categoryRow
        };

        _spinner = new ActivityIndicator
        {
            Color = Accent, IsVisible = true, IsRunning = true,
            HorizontalOptions = LayoutOptions.Center,
            Margin = new Thickness(0, 40)
        };

        _emptyLabel = new Label
        {
            Text = "No produce found.",
            TextColor = Colors.Gray,
            HorizontalTextAlignment = TextAlignment.Center,
            FontSize = 15,
            Margin = new Thickness(0, 40),
            IsVisible = false
        };

        _listContainer = new VerticalStackLayout { Spacing = 0, Padding = new Thickness(16, 8, 16, 24) };

        var header = new Grid
        {
            BackgroundColor = Primary,
            Padding = new Thickness(16, 14),
            Children =
            {
                new Label
                {
                    Text = "The World's Freshest Produce",
                    FontSize = 18,
                    FontAttributes = FontAttributes.Bold,
                    TextColor = Colors.White
                }
            }
        };

        Content = new ScrollView
        {
            Content = new VerticalStackLayout
            {
                Children = { header, searchRow, categoryScroll, _spinner, _emptyLabel, _listContainer }
            }
        };
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await LoadAsync();
    }

    private void BuildCategoryChips()
    {
        _categoryRow.Children.Clear();
        _categoryRow.Children.Add(CategoryChip("All", _activeCategory == null));
        foreach (var cat in Categories)
            _categoryRow.Children.Add(CategoryChip(cat, _activeCategory == cat));
    }

    private View CategoryChip(string label, bool isActive)
    {
        var frame = new Frame
        {
            BackgroundColor = isActive ? Primary : Colors.White,
            BorderColor = isActive ? Primary : Color.FromArgb("#CCC"),
            CornerRadius = 20,
            Padding = new Thickness(14, 7),
            HasShadow = false,
            Content = new Label
            {
                Text = label,
                TextColor = isActive ? Colors.White : Color.FromArgb("#333"),
                FontSize = 13,
                FontAttributes = isActive ? FontAttributes.Bold : FontAttributes.None
            }
        };
        var tap = new TapGestureRecognizer();
        tap.Tapped += async (_, _) =>
        {
            _activeCategory = label == "All" ? null : label;
            BuildCategoryChips();
            await LoadAsync();
        };
        frame.GestureRecognizers.Add(tap);
        return frame;
    }

    private async Task LoadAsync()
    {
        _spinner.IsVisible = true;
        _spinner.IsRunning = true;
        _emptyLabel.IsVisible = false;
        _listContainer.Children.Clear();

        try
        {
            var items = await _api.GetProduceAsync(q: _searchEntry.Text?.Trim(), category: _activeCategory);
            if (items.Count == 0)
            {
                _emptyLabel.Text = "No produce found.";
                _emptyLabel.IsVisible = true;
            }
            else
            {
                foreach (var item in items)
                    _listContainer.Children.Add(ProduceCard(item));
            }
        }
        catch (Exception ex)
        {
            _emptyLabel.Text = $"Error: {ex.Message}";
            _emptyLabel.IsVisible = true;
        }
        finally
        {
            _spinner.IsVisible = false;
            _spinner.IsRunning = false;
        }
    }

    private View ProduceCard(ProduceResponse item)
    {
        // Produce photo header + fruit icon
        var photo = new Image
        {
            Source = item.ImageUrl,
            Aspect = Aspect.AspectFill,
            HeightRequest = 150,
            BackgroundColor = Color.FromArgb("#E9F6EE")
        };

        var catBadge = new Frame
        {
            BackgroundColor = Accent, CornerRadius = 10, Padding = new Thickness(8, 3), HasShadow = false,
            Content = new HorizontalStackLayout
            {
                Spacing = 5,
                Children =
                {
                    new Image { Source = item.IconUrl, WidthRequest = 14, HeightRequest = 14, VerticalOptions = LayoutOptions.Center },
                    new Label { Text = item.Category, TextColor = Colors.White, FontSize = 11, VerticalOptions = LayoutOptions.Center }
                }
            }
        };

        View exportBadge = item.IsExportReady
            ? new Frame
            {
                BackgroundColor = Amber, CornerRadius = 10, Padding = new Thickness(8, 3), HasShadow = false,
                Content = new Label { Text = "Export Ready", TextColor = Colors.White, FontSize = 11 }
            }
            : new BoxView { IsVisible = false, HeightRequest = 0 };

        View scheduledBadge = item.IsScheduled
            ? new Frame
            {
                BackgroundColor = Color.FromArgb("#FFF3E0"), CornerRadius = 10, Padding = new Thickness(8, 3), HasShadow = false,
                Content = new Label { Text = item.AvailabilityDisplay, TextColor = Amber, FontSize = 11, FontAttributes = FontAttributes.Bold }
            }
            : new BoxView { IsVisible = false, HeightRequest = 0 };

        // Title / price row
        var titlePriceRow = new Grid
        {
            ColumnDefinitions =
            {
                new ColumnDefinition(GridLength.Star),
                new ColumnDefinition(GridLength.Auto)
            }
        };
        titlePriceRow.Add(new Label
        {
            Text = item.Name,
            FontSize = 17,
            FontAttributes = FontAttributes.Bold,
            TextColor = Primary
        }, 0, 0);
        titlePriceRow.Add(new Label
        {
            Text = item.PriceDisplay,
            FontSize = 14,
            FontAttributes = FontAttributes.Bold,
            TextColor = Amber,
            HorizontalTextAlignment = TextAlignment.End
        }, 1, 0);

        // Flag + region row
        var flagRow = new HorizontalStackLayout
        {
            Spacing = 7,
            Children =
            {
                new Image { Source = item.FlagUrl, WidthRequest = 22, HeightRequest = 15, VerticalOptions = LayoutOptions.Center },
                new Label { Text = item.LocationDisplay, FontSize = 13, FontAttributes = FontAttributes.Bold, TextColor = Color.FromArgb("#333"), VerticalOptions = LayoutOptions.Center },
                new Frame
                {
                    BackgroundColor = Color.FromArgb("#DCFCE7"), CornerRadius = 6, Padding = new Thickness(6, 1), HasShadow = false,
                    VerticalOptions = LayoutOptions.Center,
                    Content = new Label { Text = $"Zone {item.Zone}", FontSize = 10, FontAttributes = FontAttributes.Bold, TextColor = Primary }
                }
            }
        };

        // Info row: qty | expiry | grade
        var infoRow = new Grid
        {
            ColumnDefinitions =
            {
                new ColumnDefinition(GridLength.Star),
                new ColumnDefinition(GridLength.Star),
                new ColumnDefinition(GridLength.Star)
            }
        };
        infoRow.Add(InfoCell("QTY", item.QuantityDisplay), 0, 0);
        infoRow.Add(InfoCell("EXPIRY", item.ExpiryDisplay), 1, 0);
        infoRow.Add(InfoCell("GRADE", item.GradeQuality ?? "Standard"), 2, 0);

        // Farmer row
        var farmerRow = new Grid
        {
            ColumnDefinitions =
            {
                new ColumnDefinition(GridLength.Star),
                new ColumnDefinition(GridLength.Auto)
            }
        };
        farmerRow.Add(new VerticalStackLayout
        {
            Spacing = 1,
            Children =
            {
                new Label { Text = item.FarmName ?? item.FarmerName, FontSize = 13, FontAttributes = FontAttributes.Bold, TextColor = Color.FromArgb("#333") },
                new Label { Text = $"by {item.FarmerName}", FontSize = 12, TextColor = Colors.Gray }
            }
        }, 0, 0);
        farmerRow.Add(new VerticalStackLayout
        {
            HorizontalOptions = LayoutOptions.End,
            Spacing = 1,
            Children =
            {
                new Label { Text = $"★ {item.FarmerRating:0.0}", TextColor = Amber, FontSize = 13, FontAttributes = FontAttributes.Bold },
                new Label { Text = $"{item.FarmerOrdersFulfilled} orders", FontSize = 11, TextColor = Colors.Gray }
            }
        }, 1, 0);

        var innerContent = new VerticalStackLayout
        {
            Spacing = 10,
            Padding = new Thickness(16, 14),
            Children =
            {
                new HorizontalStackLayout { Spacing = 6, Children = { catBadge, exportBadge, scheduledBadge } },
                titlePriceRow,
                flagRow,
                infoRow,
                new BoxView { BackgroundColor = Color.FromArgb("#EEE"), HeightRequest = 1 },
                farmerRow
            }
        };

        var card = new Frame
        {
            BackgroundColor = Colors.White,
            CornerRadius = 12,
            HasShadow = true,
            IsClippedToBounds = true,
            Padding = new Thickness(0),
            Margin = new Thickness(0, 6),
            Content = new VerticalStackLayout
            {
                Spacing = 0,
                Children = { photo, innerContent }
            }
        };

        var tap = new TapGestureRecognizer();
        tap.Tapped += async (_, _) => await Navigation.PushAsync(new ProduceDetailPage(_api, _appState, item));
        card.GestureRecognizers.Add(tap);
        return card;
    }

    private static VerticalStackLayout InfoCell(string label, string value) =>
        new VerticalStackLayout
        {
            Spacing = 2,
            Children =
            {
                new Label { Text = label, FontSize = 10, TextColor = Colors.Gray },
                new Label { Text = value, FontSize = 13, FontAttributes = FontAttributes.Bold, TextColor = Color.FromArgb("#222") }
            }
        };
}
