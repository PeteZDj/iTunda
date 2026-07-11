using iTunda.App.Models;
using iTunda.App.Services;

namespace iTunda.App.Pages;

// Growers directory — the mobile twin of the web /farmers page: farm photos,
// ratings, export badge and key stats, tapping through to the full profile.
public class FarmersPage : ContentPage
{
    static readonly Color Primary = Color.FromArgb("#0A4A26");
    static readonly Color Accent  = Color.FromArgb("#16A34A");
    static readonly Color Amber   = Color.FromArgb("#F4A621");
    static readonly Color Muted   = Color.FromArgb("#6B7C72");

    readonly ApiClient _api;
    readonly AppState _appState;
    readonly Entry _search;
    readonly ActivityIndicator _spinner;
    readonly VerticalStackLayout _list;
    readonly Label _sub;
    List<FarmerResponse> _all = new();

    public FarmersPage(ApiClient api, AppState appState)
    {
        _api = api;
        _appState = appState;
        Title = "Farms";
        BackgroundColor = Color.FromArgb("#F3FAF5");

        _sub = new Label { Text = "Verified growers & exporters", FontSize = 13, TextColor = Color.FromArgb("#A7E8C0") };

        _search = new Entry
        {
            Placeholder = "Search farms, counties, crops…",
            PlaceholderColor = Color.FromArgb("#6B7C72"),
            TextColor = Primary,
            BackgroundColor = Colors.White,
            Margin = new Thickness(0, 10, 0, 0)
        };
        _search.TextChanged += (_, _) => Render();

        var header = new VerticalStackLayout
        {
            BackgroundColor = Primary,
            Padding = new Thickness(20, 44, 20, 18),
            Spacing = 4,
            Children =
            {
                new Label { Text = "Meet the Growers", FontSize = 26, FontAttributes = FontAttributes.Bold, TextColor = Colors.White },
                _sub,
                _search
            }
        };

        _spinner = new ActivityIndicator { Color = Accent, HorizontalOptions = LayoutOptions.Center, IsVisible = false };
        _list = new VerticalStackLayout { Spacing = 14, Margin = new Thickness(16, 16, 16, 24) };

        Content = new ScrollView
        {
            Content = new VerticalStackLayout { Children = { header, _spinner, _list } }
        };

        _ = LoadAsync();
    }

    async Task LoadAsync()
    {
        try
        {
            _spinner.IsVisible = _spinner.IsRunning = true;
            _all = await _api.GetFarmersAsync(null);
            _sub.Text = $"{_all.Count} verified growers · {_all.Count(f => f.AbleToExportDirectly)} exporters";
            Render();
        }
        catch
        {
            _sub.Text = "Could not load farms — check your connection.";
        }
        finally { _spinner.IsVisible = _spinner.IsRunning = false; }
    }

    void Render()
    {
        _list.Clear();
        var q = (_search.Text ?? "").Trim().ToLowerInvariant();
        var items = _all.Where(f =>
            q.Length == 0
            || (f.Name ?? "").ToLowerInvariant().Contains(q)
            || (f.FarmName ?? "").ToLowerInvariant().Contains(q)
            || (f.LocationCounty ?? "").ToLowerInvariant().Contains(q)
            || (f.Specialization ?? "").ToLowerInvariant().Contains(q)
            || (f.Country ?? "").ToLowerInvariant().Contains(q))
            .OrderByDescending(f => f.RatingFarmer)
            .ToList();

        if (items.Count == 0)
        {
            _list.Add(new Label { Text = "No farms match your search.", TextColor = Muted, HorizontalTextAlignment = TextAlignment.Center, Margin = new Thickness(0, 24) });
            return;
        }

        foreach (var f in items)
            _list.Add(FarmerCard(f));
    }

    View FarmerCard(FarmerResponse f)
    {
        var cover = new Image
        {
            Source = FarmPhoto(f),
            Aspect = Aspect.AspectFill,
            HeightRequest = 130
        };

        // Export badge / rating overlay
        var badges = new Grid { Padding = new Thickness(10, 10), ColumnDefinitions = { new ColumnDefinition(GridLength.Star), new ColumnDefinition(GridLength.Auto) } };
        if (f.AbleToExportDirectly)
        {
            badges.Add(new Frame
            {
                BackgroundColor = Color.FromArgb("#F4A621"), CornerRadius = 12, Padding = new Thickness(8, 3), HasShadow = false,
                HorizontalOptions = LayoutOptions.Start, VerticalOptions = LayoutOptions.Start,
                Content = new Label { Text = "\u2708 Export-ready", FontSize = 10, FontAttributes = FontAttributes.Bold, TextColor = Color.FromArgb("#3A2600") }
            }, 0, 0);
        }
        badges.Add(new Frame
        {
            BackgroundColor = Color.FromArgb("#B3000000"), CornerRadius = 12, Padding = new Thickness(8, 3), HasShadow = false,
            HorizontalOptions = LayoutOptions.End, VerticalOptions = LayoutOptions.Start,
            Content = new Label { Text = $"\u2605 {f.RatingFarmer:0.0}", FontSize = 11, FontAttributes = FontAttributes.Bold, TextColor = Amber }
        }, 1, 0);

        var coverStack = new Grid { HeightRequest = 130 };
        coverStack.Add(cover);
        coverStack.Add(badges);

        var titleRow = new HorizontalStackLayout
        {
            Spacing = 7,
            Children =
            {
                new Image { Source = f.FlagUrl, WidthRequest = 20, HeightRequest = 14, VerticalOptions = LayoutOptions.Center },
                new Label { Text = f.LocationDisplay, FontSize = 12, TextColor = Muted, VerticalOptions = LayoutOptions.Center }
            }
        };

        var stats = new HorizontalStackLayout
        {
            Spacing = 16, Margin = new Thickness(0, 4, 0, 0),
            Children =
            {
                Stat($"{f.SizeOfFarmAcres:0} ac", "acres"),
                Stat($"{f.OrdersFulfilled}", "orders"),
                Stat(f.Specialization ?? "Mixed", "crops"),
            }
        };

        var body = new VerticalStackLayout
        {
            Padding = new Thickness(14, 12, 14, 14),
            Spacing = 5,
            Children =
            {
                new Label { Text = f.FarmName, FontSize = 17, FontAttributes = FontAttributes.Bold, TextColor = Primary },
                new Label { Text = $"by {f.Name}", FontSize = 12.5, TextColor = Muted },
                titleRow,
                stats
            }
        };

        var card = new Frame
        {
            BackgroundColor = Colors.White,
            CornerRadius = 16,
            HasShadow = true,
            IsClippedToBounds = true,
            Padding = new Thickness(0),
            Content = new VerticalStackLayout { Children = { coverStack, body } }
        };

        var tap = new TapGestureRecognizer();
        tap.Tapped += async (_, _) => await Navigation.PushAsync(new FarmerProfilePage(_api, _appState, f));
        card.GestureRecognizers.Add(tap);
        return card;
    }

    static View Stat(string value, string label) => new VerticalStackLayout
    {
        Spacing = 0,
        Children =
        {
            new Label { Text = value, FontSize = 13, FontAttributes = FontAttributes.Bold, TextColor = Color.FromArgb("#17271E") },
            new Label { Text = label, FontSize = 9, TextColor = Muted }
        }
    };

    static string FarmPhoto(FarmerResponse f)
    {
        if (f.FarmImages != null && f.FarmImages.Count > 0 && !string.IsNullOrWhiteSpace(f.FarmImages[0]))
            return f.FarmImages[0];
        var topic = (f.Specialization ?? "farm").Split(',', '&')[0].Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(topic)) topic = "farm";
        return $"https://loremflickr.com/640/360/{Uri.EscapeDataString(topic)},farm?lock={f.Id}";
    }
}
