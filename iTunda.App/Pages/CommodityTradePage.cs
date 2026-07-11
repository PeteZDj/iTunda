using iTunda.App.Controls;
using iTunda.App.Models;
using iTunda.App.Services;

namespace iTunda.App.Pages;

// A mobile commodity trade desk: live bid/ask, a price chart with timeframes,
// a Buy/Sell order ticket (spot/limit/futures/put) that posts to the shared
// order book, and the public order book for the commodity.
public class CommodityTradePage : ContentPage
{
    static readonly Color Primary = Color.FromArgb("#0A4A26");
    static readonly Color Accent  = Color.FromArgb("#16A34A");
    static readonly Color Amber   = Color.FromArgb("#F4A621");
    static readonly Color Red     = Color.FromArgb("#C0392B");
    static readonly Color Muted   = Color.FromArgb("#6B7C72");

    readonly ApiClient _api;
    readonly AppState _appState;
    readonly CommodityDto _c;

    readonly PriceChartDrawable _drawable = new();
    readonly GraphicsView _chartView;
    readonly Button[] _rangeButtons;
    readonly Label _bidLabel, _askLabel, _statCurrent, _statChange;
    readonly VerticalStackLayout _book;
    readonly ActivityIndicator _bookSpinner;

    // Ticket controls
    readonly Button _buyToggle, _sellToggle;
    readonly Picker _kindPicker;
    readonly Entry _qtyEntry, _priceEntry, _nameEntry, _contactEntry;
    readonly Switch _exportSwitch;
    readonly Button _placeBtn;

    string _range = "1M";
    string _side = "Buy";
    static readonly (string Id, string Long)[] Ranges = { ("1W", "1 week"), ("1M", "1 month"), ("1Y", "1 year") };
    static readonly string[] Kinds = { "Spot", "Limit", "Futures", "Put" };

    public CommodityTradePage(ApiClient api, AppState appState, CommodityDto commodity)
    {
        _api = api;
        _appState = appState;
        _c = commodity;
        NavigationPage.SetHasNavigationBar(this, false);
        BackgroundColor = Color.FromArgb("#F3FAF5");

        // ── Header ────────────────────────────────────────────────────────
        var back = new Button { Text = "\u2190 Back", BackgroundColor = Colors.Transparent, TextColor = Colors.White, FontSize = 15, HorizontalOptions = LayoutOptions.Start, Padding = 0 };
        back.Clicked += async (_, _) => await Navigation.PopAsync();

        _statCurrent = new Label { Text = _c.PriceDisplay, FontSize = 24, FontAttributes = FontAttributes.Bold, TextColor = Colors.White };
        _statChange = new Label { Text = _c.ChangeDisplay, FontSize = 14, FontAttributes = FontAttributes.Bold, TextColor = _c.IsUp ? Color.FromArgb("#8BE3AC") : Color.FromArgb("#FF9C8A"), VerticalOptions = LayoutOptions.End, Margin = new Thickness(8, 0, 0, 3) };

        var header = new VerticalStackLayout
        {
            BackgroundColor = Primary,
            Padding = new Thickness(20, 48, 20, 22),
            Spacing = 6,
            Children =
            {
                back,
                new HorizontalStackLayout
                {
                    Spacing = 8,
                    Children =
                    {
                        new Image { Source = _c.IconUrl, WidthRequest = 26, HeightRequest = 26, VerticalOptions = LayoutOptions.Center },
                        new Label { Text = _c.Category, FontSize = 22, FontAttributes = FontAttributes.Bold, TextColor = Colors.White, VerticalOptions = LayoutOptions.Center }
                    }
                },
                new HorizontalStackLayout { Children = { _statCurrent, _statChange } },
                new Label { Text = $"Live farm-gate market \u00b7 per {_c.Unit}", FontSize = 12, TextColor = Color.FromArgb("#A7E8C0") }
            }
        };

        // ── Bid / Ask cards (tap to trade that side) ─────────────────────────
        _bidLabel = new Label { Text = _c.BidDisplay, FontSize = 20, FontAttributes = FontAttributes.Bold, TextColor = Colors.White };
        _askLabel = new Label { Text = _c.AskDisplay, FontSize = 20, FontAttributes = FontAttributes.Bold, TextColor = Colors.White };

        var bidCard = QuoteCard("SELL (BID)", _bidLabel, Red, () => SetSide("Sell"));
        var askCard = QuoteCard("BUY (ASK)", _askLabel, Accent, () => SetSide("Buy"));
        var quotes = new Grid
        {
            ColumnSpacing = 10,
            Margin = new Thickness(16, 14, 16, 0),
            ColumnDefinitions = { new ColumnDefinition(GridLength.Star), new ColumnDefinition(GridLength.Star) }
        };
        quotes.Add(bidCard, 0, 0);
        quotes.Add(askCard, 1, 0);

        // ── Chart card ───────────────────────────────────────────────────────
        _rangeButtons = Ranges.Select(r => MakeRangeButton(r.Id)).ToArray();
        var rangeBar = new Grid { ColumnSpacing = 8, ColumnDefinitions = { new ColumnDefinition(GridLength.Star), new ColumnDefinition(GridLength.Star), new ColumnDefinition(GridLength.Star) } };
        for (int i = 0; i < _rangeButtons.Length; i++) rangeBar.Add(_rangeButtons[i], i, 0);
        _chartView = new GraphicsView { Drawable = _drawable, HeightRequest = 210, BackgroundColor = Colors.White };

        var chartCard = Card(new VerticalStackLayout { Spacing = 10, Children = { rangeBar, _chartView } });

        // ── Trade ticket ─────────────────────────────────────────────────────
        _buyToggle = SideToggle("BUY", Accent);
        _sellToggle = SideToggle("SELL", Red);
        _buyToggle.Clicked += (_, _) => SetSide("Buy");
        _sellToggle.Clicked += (_, _) => SetSide("Sell");
        var sideBar = new Grid { ColumnSpacing = 10, ColumnDefinitions = { new ColumnDefinition(GridLength.Star), new ColumnDefinition(GridLength.Star) } };
        sideBar.Add(_buyToggle, 0, 0);
        sideBar.Add(_sellToggle, 1, 0);

        _kindPicker = new Picker { Title = "Order type", TextColor = Primary, BackgroundColor = Color.FromArgb("#EEF4F0"), FontAttributes = FontAttributes.Bold };
        foreach (var k in Kinds) _kindPicker.Items.Add(k);
        _kindPicker.SelectedIndex = 1; // Limit

        _qtyEntry = Field("Quantity (e.g. 500)", Keyboard.Numeric);
        _priceEntry = Field($"Target price (KES / {_c.Unit})", Keyboard.Numeric);
        _priceEntry.Text = ((int)Math.Round(_c.Ask > 0 ? _c.Ask : _c.AvgPrice)).ToString();
        _nameEntry = Field("Your name or company");
        _nameEntry.Text = _appState.Name ?? "";
        _contactEntry = Field("Phone or email (optional)");

        _exportSwitch = new Switch { OnColor = Accent };
        var exportRow = new HorizontalStackLayout { Spacing = 10, Children = { new Label { Text = "Export-grade required", FontSize = 13, TextColor = Color.FromArgb("#333"), VerticalOptions = LayoutOptions.Center }, _exportSwitch } };

        _placeBtn = new Button { Text = "PLACE BUY ORDER", BackgroundColor = Accent, TextColor = Colors.White, FontAttributes = FontAttributes.Bold, CornerRadius = 28, HeightRequest = 52, FontSize = 16 };
        _placeBtn.Clicked += OnPlaceOrder;

        var ticket = Card(new VerticalStackLayout
        {
            Spacing = 10,
            Children =
            {
                new Label { Text = "Place an order", FontSize = 16, FontAttributes = FontAttributes.Bold, TextColor = Primary },
                new BoxView { BackgroundColor = Color.FromArgb("#EEE"), HeightRequest = 1 },
                sideBar,
                FieldLabel("Order type"), _kindPicker,
                FieldLabel("Quantity *"), _qtyEntry,
                FieldLabel("Target price *"), _priceEntry,
                FieldLabel("Contact name *"), _nameEntry,
                FieldLabel("Contact details"), _contactEntry,
                exportRow,
                _placeBtn
            }
        });

        // ── Order book ───────────────────────────────────────────────────────
        _bookSpinner = new ActivityIndicator { Color = Accent, HorizontalOptions = LayoutOptions.Center, IsVisible = false, Margin = new Thickness(0, 12) };
        _book = new VerticalStackLayout { Spacing = 8 };
        var bookCard = Card(new VerticalStackLayout
        {
            Spacing = 8,
            Children =
            {
                new Label { Text = "Order book", FontSize = 16, FontAttributes = FontAttributes.Bold, TextColor = Primary },
                new Label { Text = "Live buyer bids & seller offers \u00b7 tap for details", FontSize = 12, TextColor = Muted },
                _bookSpinner,
                _book
            }
        });

        Content = new ScrollView
        {
            Content = new VerticalStackLayout { Children = { header, quotes, chartCard, ticket, bookCard, new BoxView { HeightRequest = 24, Color = Colors.Transparent } } }
        };

        SetSide("Buy");
        StyleRangeButtons();
        _ = LoadHistoryAsync();
        _ = LoadBookAsync();
    }

    // ── Layout helpers ──────────────────────────────────────────────────────
    static Frame Card(View content) => new()
    {
        BackgroundColor = Colors.White, CornerRadius = 16, HasShadow = true,
        Padding = new Thickness(16, 16), Margin = new Thickness(16, 14, 16, 0), Content = content
    };

    static Frame QuoteCard(string title, Label value, Color bg, Action onTap)
    {
        var frame = new Frame
        {
            BackgroundColor = bg, CornerRadius = 14, HasShadow = false, Padding = new Thickness(14, 12),
            Content = new VerticalStackLayout
            {
                Spacing = 2,
                Children = { new Label { Text = title, FontSize = 11, FontAttributes = FontAttributes.Bold, TextColor = Colors.White }, value }
            }
        };
        var tap = new TapGestureRecognizer();
        tap.Tapped += (_, _) => onTap();
        frame.GestureRecognizers.Add(tap);
        return frame;
    }

    Button SideToggle(string text, Color color) => new()
    {
        Text = text, FontAttributes = FontAttributes.Bold, CornerRadius = 24, HeightRequest = 46,
        BackgroundColor = Color.FromArgb("#EEF4F0"), TextColor = color
    };

    static Entry Field(string placeholder, Keyboard? kb = null) => new()
    {
        Placeholder = placeholder, Keyboard = kb ?? Keyboard.Default, BackgroundColor = Color.FromArgb("#F0F0F0"),
        TextColor = Colors.Black, PlaceholderColor = Colors.Gray, HeightRequest = 46
    };

    static Label FieldLabel(string t) => new() { Text = t, FontSize = 12, TextColor = Color.FromArgb("#555"), FontAttributes = FontAttributes.Bold };

    Button MakeRangeButton(string id)
    {
        var b = new Button { Text = id, FontSize = 13, FontAttributes = FontAttributes.Bold, CornerRadius = 18, HeightRequest = 34, Padding = new Thickness(4), HorizontalOptions = LayoutOptions.Fill };
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

    void SetSide(string side)
    {
        _side = side == "Sell" ? "Sell" : "Buy";
        var buy = _side == "Buy";
        _buyToggle.BackgroundColor = buy ? Accent : Color.FromArgb("#EEF4F0");
        _buyToggle.TextColor = buy ? Colors.White : Accent;
        _sellToggle.BackgroundColor = buy ? Color.FromArgb("#EEF4F0") : Red;
        _sellToggle.TextColor = buy ? Red : Colors.White;
        _placeBtn.Text = buy ? "PLACE BUY ORDER" : "PLACE SELL ORDER";
        _placeBtn.BackgroundColor = buy ? Accent : Red;
        var anchor = buy ? _c.Ask : _c.Bid;
        if (anchor <= 0) anchor = _c.AvgPrice;
        _priceEntry.Text = ((int)Math.Round(anchor)).ToString();
    }

    async Task LoadHistoryAsync()
    {
        try
        {
            var h = await _api.GetPriceHistoryAsync(_c.Category, _range);
            if (h != null)
            {
                _drawable.Points = h.Points;
                _drawable.Up = h.IsUp;
            }
            else _drawable.Points = new();
            _chartView.Invalidate();
        }
        catch { }
    }

    async Task LoadBookAsync()
    {
        _bookSpinner.IsVisible = _bookSpinner.IsRunning = true;
        _book.Clear();
        try
        {
            var orders = await _api.GetBuyOrdersAsync(_c.Category);
            var open = orders.Where(o => o.Status == "Open").Take(20).ToList();
            if (open.Count == 0)
            {
                _book.Add(new Label { Text = "No open orders yet. Be the first to post one.", FontSize = 13, TextColor = Muted, Margin = new Thickness(0, 6) });
            }
            else
            {
                foreach (var o in open)
                    _book.Add(BookRow(o));
            }
        }
        catch
        {
            _book.Add(new Label { Text = "Couldn't load the order book.", FontSize = 13, TextColor = Red });
        }
        finally { _bookSpinner.IsVisible = _bookSpinner.IsRunning = false; }
    }

    View BookRow(BuyOrderResponse o)
    {
        var sideColor = o.IsBuy ? Accent : Red;
        var grid = new Grid
        {
            ColumnDefinitions = { new ColumnDefinition(new GridLength(56)), new ColumnDefinition(GridLength.Star), new ColumnDefinition(GridLength.Auto) },
            ColumnSpacing = 8
        };
        grid.Add(new Frame
        {
            BackgroundColor = sideColor, CornerRadius = 8, Padding = new Thickness(6, 4), HasShadow = false, VerticalOptions = LayoutOptions.Center,
            Content = new Label { Text = o.IsBuy ? "BUY" : "SELL", FontSize = 11, FontAttributes = FontAttributes.Bold, TextColor = Colors.White, HorizontalTextAlignment = TextAlignment.Center }
        }, 0, 0);
        grid.Add(new VerticalStackLayout
        {
            Spacing = 1,
            Children =
            {
                new Label { Text = $"{o.BuyerName}", FontSize = 14, FontAttributes = FontAttributes.Bold, TextColor = Primary },
                new Label { Text = $"{o.Kind} \u00b7 {o.QuantityDisplay} \u00b7 {o.LocationDisplay}", FontSize = 12, TextColor = Muted }
            }
        }, 1, 0);
        grid.Add(new Label { Text = o.PriceDisplay, FontSize = 14, FontAttributes = FontAttributes.Bold, TextColor = sideColor, VerticalOptions = LayoutOptions.Center }, 2, 0);

        var frame = new Frame { BackgroundColor = Colors.White, CornerRadius = 12, HasShadow = false, BorderColor = Color.FromArgb("#E4EFE8"), Padding = new Thickness(12, 10), Content = grid };
        var tap = new TapGestureRecognizer();
        tap.Tapped += async (_, _) => await ShowOrderDetail(o);
        frame.GestureRecognizers.Add(tap);
        return frame;
    }

    async Task ShowOrderDetail(BuyOrderResponse o)
    {
        var party = o.IsBuy ? "Buyer" : "Seller";
        var lines = new List<string>
        {
            $"{party}: {o.BuyerName}",
            $"Side: {o.Side}   Type: {o.Kind}",
            $"Quantity: {o.QuantityDisplay}",
            $"Target price: {o.PriceDisplay} / {o.Unit}",
            $"Location: {o.LocationDisplay}",
            o.ExportRequired ? "Export-grade required" : "Local or export"
        };
        if (o.NeededBy.HasValue) lines.Add($"Needed by: {o.NeededBy:MMM d, yyyy}");

        var body = string.Join("\n", lines);
        var hasContact = !string.IsNullOrWhiteSpace(o.BuyerContact);
        if (hasContact)
        {
            var contact = await DisplayAlert($"{o.Commodity} \u00b7 {party}", $"{body}\n\nContact: {o.BuyerContact}", $"Contact {party.ToLower()}", "Close");
            if (contact)
            {
                try
                {
                    if (o.BuyerContact!.Contains('@'))
                        await Launcher.OpenAsync(new Uri($"mailto:{o.BuyerContact}"));
                    else
                        await Launcher.OpenAsync(new Uri($"tel:{new string(o.BuyerContact.Where(ch => char.IsDigit(ch) || ch == '+').ToArray())}"));
                }
                catch { }
            }
        }
        else
        {
            await DisplayAlert($"{o.Commodity} \u00b7 {party}", body, "Close");
        }
    }

    async void OnPlaceOrder(object? sender, EventArgs e)
    {
        if (!double.TryParse(_qtyEntry.Text, out var qty) || qty <= 0)
        {
            await DisplayAlert("Check quantity", "Enter a quantity greater than zero.", "OK");
            return;
        }
        if (!decimal.TryParse(_priceEntry.Text, out var price) || price <= 0)
        {
            await DisplayAlert("Check price", "Enter a target price greater than zero.", "OK");
            return;
        }
        if (string.IsNullOrWhiteSpace(_nameEntry.Text))
        {
            await DisplayAlert("Add your name", "Enter a contact name or company so counterparties can reach you.", "OK");
            return;
        }

        var kind = _kindPicker.SelectedItem?.ToString() ?? "Limit";
        var verb = _side == "Buy" ? "buy" : "sell";
        var total = (decimal)qty * price;
        var confirmed = await DisplayAlert(
            $"Confirm {verb} \u00b7 {_c.Category}",
            $"You are about to post a {kind.ToUpper()} order to {verb} {qty:0.##} {_c.Unit} of {_c.Category} at KSh {price:N0}/{_c.Unit} (\u2248 KSh {total:N0}).\n\nThis is added to the public order book.",
            $"\u2713 Post {verb} order", "Cancel");
        if (!confirmed) return;

        _placeBtn.IsEnabled = false;
        var original = _placeBtn.Text;
        _placeBtn.Text = "Posting…";
        try
        {
            await _api.CreateBuyOrderAsync(new CreateBuyOrderRequest
            {
                Commodity = _c.Category,
                Unit = _c.Unit,
                Quantity = qty,
                TargetPrice = price,
                Side = _side,
                Kind = kind,
                BuyerName = _nameEntry.Text.Trim(),
                BuyerContact = string.IsNullOrWhiteSpace(_contactEntry.Text) ? null : _contactEntry.Text.Trim(),
                ExportRequired = _exportSwitch.IsToggled,
                Zone = 0
            });
            await DisplayAlert("Order posted!", $"Your {verb} order for {qty:0.##} {_c.Unit} of {_c.Category} is now live on the order book.", "Great");
            _qtyEntry.Text = "";
            await LoadBookAsync();
        }
        catch (Exception ex)
        {
            var msg = ex is ApiException ? ex.Message : "Can't reach iTunda. Check your connection and try again.";
            await DisplayAlert("Couldn't post order", msg, "OK");
        }
        finally
        {
            _placeBtn.IsEnabled = true;
            _placeBtn.Text = original;
        }
    }
}
