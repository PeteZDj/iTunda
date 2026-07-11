using iTunda.App.Controls;
using iTunda.App.Models;
using iTunda.App.Services;

namespace iTunda.App.Pages;

// Commodity price trends: pick a crop + timeframe (1W/1M/1Y) and see a live
// average-price chart plus a quote board — the mobile twin of the web market page.
public class PricesPage : ContentPage
{
    static readonly Color Primary = Color.FromArgb("#0A4A26");
    static readonly Color Accent  = Color.FromArgb("#16A34A");
    static readonly Color Amber   = Color.FromArgb("#F4A621");
    static readonly Color Muted   = Color.FromArgb("#6B7C72");

    readonly ApiClient _api;
    readonly AppState _appState;
    readonly Picker _picker;
    readonly Picker _currencyPicker;
    readonly GraphicsView _chartView;
    readonly PriceChartDrawable _drawable = new();
    readonly ActivityIndicator _spinner;
    readonly Label _title, _sub, _vCurrent, _vAvg, _vLow, _vHigh, _vChange, _lChange;
    readonly VerticalStackLayout _board;
    readonly Button[] _rangeButtons;
    readonly Button _tradeBtn;

    string _range = "1M";
    string _selected = "Avocados";
    PriceHistory? _history;
    List<CommodityDto> _commodities = new();
    static readonly (string Id, string Long)[] Ranges = { ("1W", "1-week"), ("1M", "1-month"), ("1Y", "1-year") };

    public PricesPage(ApiClient api, AppState appState)
    {
        _api = api;
        _appState = appState;
        Title = "Market";
        BackgroundColor = Color.FromArgb("#F3FAF5");

        _title = new Label { Text = "Commodity Market", FontSize = 26, FontAttributes = FontAttributes.Bold, TextColor = Colors.White };
        _sub = new Label { Text = "Live farm-gate prices · trade spot, limit & futures", FontSize = 13, TextColor = Color.FromArgb("#A7E8C0") };

        _currencyPicker = new Picker
        {
            Title = "Currency",
            TextColor = Colors.White,
            TitleColor = Color.FromArgb("#A7E8C0"),
            FontSize = 13,
            FontAttributes = FontAttributes.Bold,
            BackgroundColor = Color.FromArgb("#0E5C30"),
            WidthRequest = 96,
            HorizontalOptions = LayoutOptions.End
        };
        foreach (var c in Currency.All) _currencyPicker.Items.Add(c.Code);
        _currencyPicker.SelectedItem = Currency.Current.Code;
        _currencyPicker.SelectedIndexChanged += OnCurrencyChanged;

        var headerTop = new Grid
        {
            ColumnDefinitions = { new ColumnDefinition(GridLength.Star), new ColumnDefinition(GridLength.Auto) }
        };
        headerTop.Add(new VerticalStackLayout { Spacing = 4, Children = { _title, _sub } }, 0, 0);
        headerTop.Add(_currencyPicker, 1, 0);

        var header = new VerticalStackLayout
        {
            BackgroundColor = Primary,
            Padding = new Thickness(20, 44, 20, 22),
            Spacing = 4,
            Children = { headerTop }
        };

        _picker = new Picker
        {
            Title = "Select commodity",
            TextColor = Primary,
            TitleColor = Muted,
            FontAttributes = FontAttributes.Bold,
            BackgroundColor = Color.FromArgb("#EEF4F0")
        };
        _picker.SelectedIndexChanged += OnPickerChanged;

        // Timeframe segmented control
        _rangeButtons = Ranges.Select(r => MakeRangeButton(r.Id)).ToArray();
        var rangeBar = new Grid
        {
            ColumnSpacing = 8,
            ColumnDefinitions = { new ColumnDefinition(GridLength.Star), new ColumnDefinition(GridLength.Star), new ColumnDefinition(GridLength.Star) }
        };
        for (int i = 0; i < _rangeButtons.Length; i++) rangeBar.Add(_rangeButtons[i], i, 0);

        _spinner = new ActivityIndicator { Color = Accent, HorizontalOptions = LayoutOptions.Center, IsVisible = false };

        _chartView = new GraphicsView { Drawable = _drawable, HeightRequest = 230, BackgroundColor = Colors.White };

        _vCurrent = StatValue(); _vAvg = StatValue(); _vLow = StatValue(); _vHigh = StatValue();
        _vChange = StatValue(); _lChange = StatLabel("Change");

        var stats = new Grid
        {
            ColumnDefinitions =
            {
                new ColumnDefinition(GridLength.Star), new ColumnDefinition(GridLength.Star),
                new ColumnDefinition(GridLength.Star), new ColumnDefinition(GridLength.Star),
                new ColumnDefinition(GridLength.Star),
            },
            RowDefinitions = { new RowDefinition(GridLength.Auto), new RowDefinition(GridLength.Auto) },
            ColumnSpacing = 6, RowSpacing = 2, Margin = new Thickness(0, 12, 0, 4)
        };
        AddStat(stats, 0, StatLabel("Current"), _vCurrent);
        AddStat(stats, 1, StatLabel("Avg"), _vAvg);
        AddStat(stats, 2, StatLabel("Low"), _vLow);
        AddStat(stats, 3, StatLabel("High"), _vHigh);
        AddStat(stats, 4, _lChange, _vChange);

        _tradeBtn = new Button
        {
            Text = "Buy / Sell",
            BackgroundColor = Amber,
            TextColor = Colors.White,
            FontAttributes = FontAttributes.Bold,
            CornerRadius = 24,
            HeightRequest = 48,
            FontSize = 15,
            Margin = new Thickness(0, 4, 0, 0)
        };
        _tradeBtn.Clicked += OnTradeClicked;

        var chartCard = new Frame
        {
            BackgroundColor = Colors.White,
            CornerRadius = 16,
            HasShadow = true,
            Padding = new Thickness(14, 16),
            Margin = new Thickness(16, 16, 16, 8),
            Content = new VerticalStackLayout
            {
                Spacing = 10,
                Children = { _picker, rangeBar, stats, _spinner, _chartView, _tradeBtn }
            }
        };

        _board = new VerticalStackLayout { Spacing = 8, Margin = new Thickness(16, 0, 16, 24) };

        Content = new ScrollView
        {
            Content = new VerticalStackLayout
            {
                Children =
                {
                    header,
                    chartCard,
                    new Label { Text = "All commodities · tap to trade", FontSize = 16, FontAttributes = FontAttributes.Bold, TextColor = Primary, Margin = new Thickness(20, 6, 20, 0) },
                    _board
                }
            }
        };

        StyleRangeButtons();
        _ = LoadAsync();
    }

    Button MakeRangeButton(string id)
    {
        var b = new Button
        {
            Text = id,
            FontSize = 13,
            FontAttributes = FontAttributes.Bold,
            CornerRadius = 18,
            HeightRequest = 36,
            Padding = new Thickness(4),
            HorizontalOptions = LayoutOptions.Fill
        };
        b.Clicked += (_, _) => { _range = id; StyleRangeButtons(); _ = LoadHistoryAsync(); };
        return b;
    }

    void StyleRangeButtons()
    {
        for (int i = 0; i < _rangeButtons.Length; i++)
        {
            var active = Ranges[i].Id == _range;
            _rangeButtons[i].BackgroundColor = active ? Primary : Color.FromArgb("#EEF4F0");
            _rangeButtons[i].TextColor = active ? Colors.White : Muted;
        }
    }

    static Label StatValue() => new Label { FontSize = 16, FontAttributes = FontAttributes.Bold, TextColor = Color.FromArgb("#17271E") };
    static Label StatLabel(string t) => new Label { Text = t, FontSize = 10, TextColor = Muted, FontAttributes = FontAttributes.Bold };

    static void AddStat(Grid grid, int col, Label label, Label value)
    {
        grid.Add(label, col, 0);
        grid.Add(value, col, 1);
    }

    async void OnPickerChanged(object? sender, EventArgs e)
    {
        if (_picker.SelectedItem is string cat && cat != _selected)
        {
            _selected = cat;
            await LoadHistoryAsync();
        }
    }

    void OnCurrencyChanged(object? sender, EventArgs e)
    {
        if (_currencyPicker.SelectedItem is string code)
        {
            Currency.Set(code);
            BuildBoard();
            RenderStats();
        }
    }

    async void OnTradeClicked(object? sender, EventArgs e)
    {
        var commodity = _commodities.FirstOrDefault(c => c.Category == _selected);
        if (commodity is null) return;
        await Navigation.PushAsync(new CommodityTradePage(_api, _appState, commodity));
    }

    async Task LoadAsync()
    {
        try
        {
            _spinner.IsVisible = _spinner.IsRunning = true;
            _commodities = await _api.GetCommoditiesAsync();
            _picker.ItemsSource = _commodities.Select(c => c.Category).ToList();
            if (!_commodities.Any(c => c.Category == _selected))
                _selected = _commodities.FirstOrDefault()?.Category ?? _selected;
            _picker.SelectedItem = _selected;
            BuildBoard();
            await LoadHistoryAsync();
            _ = RefreshRatesAsync();
        }
        catch
        {
            _title.Text = "Commodity Market";
            _sub.Text = "Could not load prices — check your connection.";
        }
        finally { _spinner.IsVisible = _spinner.IsRunning = false; }
    }

    async Task RefreshRatesAsync()
    {
        await Currency.LoadRatesAsync();
        MainThread.BeginInvokeOnMainThread(() => { BuildBoard(); RenderStats(); });
    }

    void BuildBoard()
    {
        _board.Clear();
        foreach (var c in _commodities)
        {
            var up = c.IsUp;
            var rowGrid = new Grid
            {
                ColumnSpacing = 8,
                ColumnDefinitions =
                {
                    new ColumnDefinition(new GridLength(30)),
                    new ColumnDefinition(GridLength.Star),
                    new ColumnDefinition(new GridLength(84)),
                    new ColumnDefinition(new GridLength(70)),
                },
            };
            rowGrid.Add(new Image { Source = c.IconUrl, WidthRequest = 24, HeightRequest = 24, VerticalOptions = LayoutOptions.Center }, 0, 0);
            rowGrid.Add(new VerticalStackLayout
            {
                Spacing = 1,
                VerticalOptions = LayoutOptions.Center,
                Children =
                {
                    new Label { Text = c.Category, FontAttributes = FontAttributes.Bold, TextColor = Primary },
                    new Label { Text = $"Bid {c.BidDisplay}  ·  Ask {c.AskDisplay}", FontSize = 11, TextColor = Muted }
                }
            }, 1, 0);
            rowGrid.Add(new Label { Text = c.PriceDisplay, FontSize = 12, TextColor = Color.FromArgb("#17271E"), HorizontalTextAlignment = TextAlignment.End, VerticalOptions = LayoutOptions.Center }, 2, 0);
            rowGrid.Add(new Label { Text = c.ChangeDisplay, TextColor = up ? Accent : Color.FromArgb("#C0392B"), FontSize = 12, FontAttributes = FontAttributes.Bold, HorizontalTextAlignment = TextAlignment.End, VerticalOptions = LayoutOptions.Center }, 3, 0);

            var row = new Frame
            {
                BackgroundColor = Colors.White,
                CornerRadius = 12,
                HasShadow = false,
                BorderColor = Color.FromArgb("#E4EFE8"),
                Padding = new Thickness(12, 10),
                Content = rowGrid
            };
            var tap = new TapGestureRecognizer();
            var captured = c;
            tap.Tapped += async (_, _) => await Navigation.PushAsync(new CommodityTradePage(_api, _appState, captured));
            row.GestureRecognizers.Add(tap);
            _board.Add(row);
        }
    }

    async Task LoadHistoryAsync()
    {
        try
        {
            _spinner.IsVisible = _spinner.IsRunning = true;
            _history = await _api.GetPriceHistoryAsync(_selected, _range);
            RenderStats();
            if (_history != null)
            {
                _drawable.Points = _history.Points;
                _drawable.Up = _history.IsUp;
            }
            else
            {
                _drawable.Points = new();
            }
            _chartView.Invalidate();
        }
        catch { }
        finally { _spinner.IsVisible = _spinner.IsRunning = false; }
    }

    void RenderStats()
    {
        var longLabel = Ranges.First(r => r.Id == _range).Long;
        _title.Text = $"{_selected} market";
        var h = _history;
        _sub.Text = $"Average farm-gate price · per {h?.Unit ?? "kg"}";
        if (h == null) return;
        _vCurrent.Text = Currency.Format(h.Current);
        _vAvg.Text = Currency.Format(h.Avg);
        _vLow.Text = Currency.Format(h.Low);
        _vHigh.Text = Currency.Format(h.High);
        _lChange.Text = longLabel;
        _vChange.Text = $"{(h.IsUp ? "\u25B2" : "\u25BC")} {Math.Abs(h.ChangePct):0.0}%";
        _vChange.TextColor = h.IsUp ? Accent : Color.FromArgb("#C0392B");
    }
}
