using iTunda.App.Models;
using iTunda.App.Services;

namespace iTunda.App.Pages;

public class ProduceDetailPage : ContentPage
{
    static readonly Color Primary = Color.FromArgb("#0A4A26");
    static readonly Color Accent  = Color.FromArgb("#16A34A");
    static readonly Color Amber   = Color.FromArgb("#F4A621");

    private readonly ApiClient _api;
    private readonly AppState _appState;
    private readonly ProduceResponse _item;

    public ProduceDetailPage(ApiClient api, AppState appState, ProduceResponse item)
    {
        _api = api;
        _appState = appState;
        _item = item;
        NavigationPage.SetHasNavigationBar(this, false);
        BackgroundColor = Color.FromArgb("#F3FAF5");

        // ── Dark header (Teachify InstructorProfilePage style) ────────────
        var header = new Grid
        {
            BackgroundColor = Primary,
            Padding = new Thickness(20, 50, 20, 30),
            RowDefinitions =
            {
                new RowDefinition(GridLength.Auto),
                new RowDefinition(GridLength.Auto),
                new RowDefinition(GridLength.Auto)
            }
        };

        // Back button
        var backBtn = new Button
        {
            Text = "← Back",
            BackgroundColor = Colors.Transparent,
            TextColor = Colors.White,
            FontSize = 15,
            HorizontalOptions = LayoutOptions.Start,
            Padding = new Thickness(0)
        };
        backBtn.Clicked += async (_, _) => await Navigation.PopAsync();
        header.Add(backBtn, 0, 0);

        header.Add(new Label
        {
            Text = item.Name,
            FontSize = 26,
            FontAttributes = FontAttributes.Bold,
            TextColor = Colors.White,
            Margin = new Thickness(0, 8, 0, 4)
        }, 0, 1);

        header.Add(new HorizontalStackLayout
        {
            Spacing = 6,
            Children =
            {
                new Image { Source = item.IconUrl, WidthRequest = 18, HeightRequest = 18, VerticalOptions = LayoutOptions.Center },
                new Label { Text = item.Category, FontSize = 14, TextColor = Accent, VerticalOptions = LayoutOptions.Center },
                new Image { Source = item.FlagUrl, WidthRequest = 22, HeightRequest = 15, VerticalOptions = LayoutOptions.Center, Margin = new Thickness(8, 0, 0, 0) },
                new Label { Text = item.LocationDisplay, FontSize = 13, TextColor = Color.FromArgb("#A5D6A7"), VerticalOptions = LayoutOptions.Center }
            }
        }, 0, 2);

        // ── Price + badges band ───────────────────────────────────────────
        var priceRow = new Grid
        {
            BackgroundColor = Color.FromArgb("#2E7D32"),
            Padding = new Thickness(20, 12),
            ColumnDefinitions =
            {
                new ColumnDefinition(GridLength.Star),
                new ColumnDefinition(GridLength.Auto)
            }
        };
        priceRow.Add(new VerticalStackLayout
        {
            Spacing = 2,
            Children =
            {
                new Label { Text = item.PriceDisplay, FontSize = 22, FontAttributes = FontAttributes.Bold, TextColor = Colors.White },
                new Label { Text = item.AvailabilityDisplay, FontSize = 13, TextColor = Color.FromArgb("#A5D6A7") }
            }
        }, 0, 0);

        var badges = new HorizontalStackLayout { Spacing = 6, VerticalOptions = LayoutOptions.Center };
        if (item.GradeQuality is not null)
            badges.Children.Add(Badge(item.GradeQuality, Accent));
        if (item.IsExportReady)
            badges.Children.Add(Badge("Export Ready", Amber));
        priceRow.Add(badges, 1, 0);

        // ── Photo gallery (hero + thumbnails) ─────────────────────────────
        var mainImage = new Image
        {
            Source = string.IsNullOrEmpty(item.ImageUrl) ? null : item.ImageUrl,
            Aspect = Aspect.AspectFill,
            HeightRequest = 220,
            BackgroundColor = Color.FromArgb("#E9F6EE")
        };
        var galleryCard = new Frame
        {
            BackgroundColor = Colors.White,
            CornerRadius = 12,
            HasShadow = true,
            IsClippedToBounds = true,
            Padding = new Thickness(0),
            Margin = new Thickness(16, 12, 16, 0),
            Content = new VerticalStackLayout { Spacing = 0, Children = { mainImage } }
        };

        var thumbs = new HorizontalStackLayout { Spacing = 8, Padding = new Thickness(16, 8, 16, 0) };
        var allImages = new List<string>();
        if (!string.IsNullOrEmpty(item.ImageUrl)) allImages.Add(item.ImageUrl);
        allImages.AddRange(item.Gallery);
        foreach (var src in allImages)
        {
            var thumb = new Image { Source = src, Aspect = Aspect.AspectFill, WidthRequest = 66, HeightRequest = 50, BackgroundColor = Color.FromArgb("#E9F6EE") };
            var tf = new Frame { CornerRadius = 8, Padding = 0, IsClippedToBounds = true, HasShadow = false, BorderColor = Color.FromArgb("#DDD"), WidthRequest = 66, HeightRequest = 50, Content = thumb };
            var tg = new TapGestureRecognizer();
            var captured = src;
            tg.Tapped += (_, _) => mainImage.Source = captured;
            tf.GestureRecognizers.Add(tg);
            thumbs.Children.Add(tf);
        }
        var thumbsScroll = new ScrollView { Orientation = ScrollOrientation.Horizontal, HorizontalScrollBarVisibility = ScrollBarVisibility.Never, Content = thumbs };

        // ── Info grid card ────────────────────────────────────────────────
        var infoCard = new Frame
        {
            BackgroundColor = Colors.White,
            CornerRadius = 10,
            HasShadow = true,
            Margin = new Thickness(16, 12),
            Padding = new Thickness(20, 16),
            Content = new Grid
            {
                RowDefinitions =
                {
                    new RowDefinition(GridLength.Auto),
                    new RowDefinition(GridLength.Auto)
                },
                ColumnDefinitions =
                {
                    new ColumnDefinition(GridLength.Star),
                    new ColumnDefinition(GridLength.Star),
                    new ColumnDefinition(GridLength.Star)
                },
                RowSpacing = 16
            }
        };

        var infoGrid = (Grid)infoCard.Content;
        infoGrid.Add(DetailCell("QUANTITY", item.QuantityDisplay), 0, 0);
        infoGrid.Add(DetailCell("EXPIRY", item.ExpiryDisplay), 1, 0);
        infoGrid.Add(DetailCell("LOCATION", item.LocationDisplay), 2, 0);
        infoGrid.Add(DetailCell("HARVEST", item.HarvestDate?.ToString("MMM d, yyyy") ?? "—"), 0, 1);
        infoGrid.Add(DetailCell("UNIT", item.Unit.ToUpper()), 1, 1);
        infoGrid.Add(DetailCell("GRADE", item.GradeQuality ?? "Standard"), 2, 1);

        // ── Description card ──────────────────────────────────────────────
        var descCard = new Frame
        {
            BackgroundColor = Colors.White,
            CornerRadius = 10,
            HasShadow = true,
            Margin = new Thickness(16, 0, 16, 12),
            Padding = new Thickness(20, 16),
            Content = new VerticalStackLayout
            {
                Spacing = 8,
                Children =
                {
                    new Label { Text = "About this listing", FontSize = 15, FontAttributes = FontAttributes.Bold, TextColor = Primary },
                    new Label { Text = item.Description ?? "No description provided.", FontSize = 14, TextColor = Color.FromArgb("#444"), LineHeight = 1.5 }
                }
            }
        };

        // ── Farmer card (Teachify instructor info style) ──────────────────
        var farmerCard = new Frame
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
                    new Label { Text = "About the Farmer", FontSize = 15, FontAttributes = FontAttributes.Bold, TextColor = Primary },
                    new BoxView { BackgroundColor = Color.FromArgb("#EEE"), HeightRequest = 1 },
                    FarmerInfoRow("Farm", item.FarmName ?? item.FarmerName),
                    FarmerInfoRow("Farmer", item.FarmerName),
                    FarmerInfoRow("Region", item.LocationDisplay),
                    FarmerInfoRow("Export Zone", $"Zone {item.Zone}"),
                    FarmerInfoRow("Rating", $"★ {item.FarmerRating:0.0}  ({item.FarmerOrdersFulfilled} orders fulfilled)"),
                    item.FarmerPhone != null ? FarmerInfoRow("Phone", item.FarmerPhone) : new BoxView { IsVisible = false, HeightRequest = 0 }
                }
            }
        };

        // ── Action buttons ────────────────────────────────────────────────
        var orderBtn = new Button
        {
            Text = "PLACE ORDER",
            BackgroundColor = Amber,
            TextColor = Colors.White,
            FontAttributes = FontAttributes.Bold,
            CornerRadius = 30,
            HeightRequest = 52,
            FontSize = 16,
            Margin = new Thickness(16, 0, 16, 8)
        };
        orderBtn.Clicked += OnOrderClicked;

        var mapsBtn = new Button
        {
            Text = "🗺  Open farm & meet-up in Google Maps",
            BackgroundColor = Colors.White,
            TextColor = Primary,
            BorderColor = Accent,
            BorderWidth = 1.5,
            FontAttributes = FontAttributes.Bold,
            CornerRadius = 30,
            HeightRequest = 48,
            FontSize = 14,
            Margin = new Thickness(16, 0, 16, 8),
            IsVisible = item.HasGeo
        };
        mapsBtn.Clicked += async (_, _) =>
        {
            try { await Launcher.OpenAsync(new Uri(item.GoogleMapsUrl)); } catch { }
        };

        var viewFarmerBtn = new Button
        {
            Text = "View Farmer Profile",
            BackgroundColor = Colors.Transparent,
            TextColor = Accent,
            FontAttributes = FontAttributes.Bold,
            HeightRequest = 44,
            FontSize = 14,
            Margin = new Thickness(16, 0, 16, 20)
        };
        viewFarmerBtn.Clicked += async (_, _) =>
        {
            try
            {
                var farmer = await _api.GetFarmerByIdAsync(item.FarmerProfileId);
                await Navigation.PushAsync(new FarmerProfilePage(_api, _appState, farmer));
            }
            catch { }
        };

        Content = new ScrollView
        {
            Content = new VerticalStackLayout
            {
                Children = { header, priceRow, galleryCard, thumbsScroll, infoCard, descCard, farmerCard, orderBtn, mapsBtn, viewFarmerBtn }
            }
        };
    }

    private static Frame Badge(string text, Color bg) => new Frame
    {
        BackgroundColor = bg, CornerRadius = 10, Padding = new Thickness(10, 4), HasShadow = false,
        Content = new Label { Text = text, TextColor = Colors.White, FontSize = 12, FontAttributes = FontAttributes.Bold }
    };

    private static VerticalStackLayout DetailCell(string label, string value) =>
        new VerticalStackLayout
        {
            Spacing = 3,
            Children =
            {
                new Label { Text = label, FontSize = 10, TextColor = Colors.Gray, FontAttributes = FontAttributes.Bold },
                new Label { Text = value, FontSize = 14, TextColor = Color.FromArgb("#0A4A26"), FontAttributes = FontAttributes.Bold }
            }
        };

    private static Grid FarmerInfoRow(string label, string value)
    {
        var g = new Grid
        {
            ColumnDefinitions =
            {
                new ColumnDefinition(new GridLength(110)),
                new ColumnDefinition(GridLength.Star)
            }
        };
        g.Add(new Label { Text = label, FontSize = 13, TextColor = Colors.Gray, FontAttributes = FontAttributes.Bold }, 0, 0);
        g.Add(new Label { Text = value, FontSize = 13, TextColor = Color.FromArgb("#333") }, 1, 0);
        return g;
    }

    private async void OnOrderClicked(object? sender, EventArgs e)
    {
        if (_appState.Token == null)
        {
            await DisplayAlert("Sign In Required", "Please sign in to place an order.", "OK");
            return;
        }

        var qtyStr = await DisplayPromptAsync("Quantity", $"How many {_item.Unit} would you like?", "Order", "Cancel",
            initialValue: "10", maxLength: 6, keyboard: Keyboard.Numeric);

        if (string.IsNullOrWhiteSpace(qtyStr) || !double.TryParse(qtyStr, out var qty) || qty <= 0)
            return;

        var address = await DisplayPromptAsync("Delivery Address", "Enter your delivery address:", "Confirm", "Cancel");
        if (string.IsNullOrWhiteSpace(address)) return;

        try
        {
            await _api.CreateOrderAsync(new CreateOrderRequest
            {
                DeliveryAddress = address,
                Items = new List<OrderItemRequest>
                {
                    new OrderItemRequest { ProduceId = _item.Id, Quantity = qty }
                }
            });
            await DisplayAlert("Order Placed!", $"Your order for {qty} {_item.Unit} of {_item.Name} has been placed.", "OK");
        }
        catch (Exception ex)
        {
            await DisplayAlert("Order Failed", ex.Message, "OK");
        }
    }
}
