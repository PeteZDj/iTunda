using iTunda.App.Services;

namespace iTunda.App.Pages;

// Local, pin-to-pin courier assignment (Uber-style) — the mobile twin of the
// web /delivery local mode: pick pickup + drop-off, choose a courier, assign
// and watch the live status advance.
public class DeliveryPage : ContentPage
{
    static readonly Color Primary = Color.FromArgb("#0A4A26");
    static readonly Color Accent  = Color.FromArgb("#16A34A");
    static readonly Color Amber   = Color.FromArgb("#F4A621");
    static readonly Color Muted   = Color.FromArgb("#6B7C72");

    record Courier(string Id, string Name, string Vehicle, string Emoji, double Rating, int Base, int PerKm, int KgMax, int Speed);

    static readonly Courier[] Couriers =
    {
        new("boda",   "James Mwangi",     "Motorbike (boda)",   "\U0001F3CD\uFE0F", 4.9,  150,  38,    80, 32),
        new("tuk",    "Grace Wanjiru",    "Tuk-tuk",            "\U0001F6FA",       4.7,  250,  48,   400, 26),
        new("pickup", "Otieno Kevin",     "Pickup truck",       "\U0001F6FB",       4.8,  600,  72,  1500, 45),
        new("van",    "Fatuma Ali",       "Refrigerated van",   "\U0001F690",       4.9, 1200,  96,  3000, 48),
        new("truck",  "Brian Cheruiyot",  "Cold-chain truck",   "\U0001F69A",       4.6, 3500, 125, 12000, 55),
    };

    static readonly string[] Steps =
    {
        "Assigned", "Driver en route to pickup", "Produce picked up", "Out for delivery", "Delivered"
    };

    readonly Entry _pickup, _drop, _distance, _weight;
    readonly VerticalStackLayout _courierList;
    readonly VerticalStackLayout _planView;
    readonly VerticalStackLayout _assignedView;
    readonly Button _assignBtn;
    string? _selected;
    IDispatcherTimer? _timer;
    int _step;

    public DeliveryPage()
    {
        Title = "Delivery";
        BackgroundColor = Color.FromArgb("#F3FAF5");

        var header = new VerticalStackLayout
        {
            BackgroundColor = Primary,
            Padding = new Thickness(20, 44, 20, 20),
            Spacing = 4,
            Children =
            {
                new Label { Text = "Delivery & Logistics", FontSize = 26, FontAttributes = FontAttributes.Bold, TextColor = Colors.White },
                new Label { Text = "Assign a local courier, pin to pin \u2014 Uber-style", FontSize = 13, TextColor = Color.FromArgb("#A7E8C0") }
            }
        };

        _pickup = MakeEntry("Farm / warehouse pickup point", "Nairobi CBD");
        _drop = MakeEntry("Buyer / market drop-off point", "");
        _distance = MakeEntry("Distance (km)", "12"); _distance.Keyboard = Keyboard.Numeric;
        _weight = MakeEntry("Load weight (kg)", "50"); _weight.Keyboard = Keyboard.Numeric;
        _distance.TextChanged += (_, _) => BuildCouriers();
        _weight.TextChanged += (_, _) => BuildCouriers();

        _courierList = new VerticalStackLayout { Spacing = 9, Margin = new Thickness(0, 6, 0, 0) };

        _assignBtn = new Button
        {
            Text = "\U0001F680 Request pickup & assign courier",
            BackgroundColor = Primary, TextColor = Colors.White, CornerRadius = 12,
            FontAttributes = FontAttributes.Bold, Margin = new Thickness(0, 8, 0, 0), IsEnabled = false
        };
        _assignBtn.Clicked += OnAssign;

        var planCard = new Frame
        {
            BackgroundColor = Colors.White, CornerRadius = 16, HasShadow = true,
            Padding = new Thickness(16), Margin = new Thickness(16, 16, 16, 8),
            Content = new VerticalStackLayout
            {
                Spacing = 8,
                Children =
                {
                    Section("\U0001F4E6 Pickup"), _pickup,
                    Section("\U0001F4CD Drop-off"), _drop,
                    new Grid
                    {
                        ColumnSpacing = 10,
                        ColumnDefinitions = { new ColumnDefinition(GridLength.Star), new ColumnDefinition(GridLength.Star) },
                        Children = { WrapCol(_distance, 0), WrapCol(_weight, 1) }
                    },
                    Section("Choose a courier"),
                    _courierList,
                    _assignBtn
                }
            }
        };

        _planView = new VerticalStackLayout { Children = { planCard } };
        _assignedView = new VerticalStackLayout { IsVisible = false, Margin = new Thickness(16, 16, 16, 24) };

        Content = new ScrollView
        {
            Content = new VerticalStackLayout { Children = { header, _planView, _assignedView } }
        };

        BuildCouriers();
    }

    static Label Section(string t) => new Label { Text = t, FontSize = 14, FontAttributes = FontAttributes.Bold, TextColor = Primary, Margin = new Thickness(0, 6, 0, 0) };

    static Entry MakeEntry(string placeholder, string initial) => new Entry
    {
        Placeholder = placeholder, Text = initial, PlaceholderColor = Muted, TextColor = Color.FromArgb("#17271E"),
        BackgroundColor = Color.FromArgb("#F1F5F2")
    };

    static View WrapCol(View v, int col) { Grid.SetColumn(v, col); return v; }

    double Distance => double.TryParse(_distance.Text, out var d) && d > 0 ? d : 0;
    double Weight => double.TryParse(_weight.Text, out var w) && w > 0 ? w : 0;

    (int price, int eta) Quote(Courier c)
    {
        var price = (int)Math.Round(c.Base + c.PerKm * Distance);
        var eta = Math.Max(6, (int)Math.Round(Distance / c.Speed * 60) + 5);
        return (price, eta);
    }

    void BuildCouriers()
    {
        _courierList.Clear();
        var available = Couriers.Where(c => c.KgMax >= Weight).ToList();
        if (available.Count == 0)
        {
            _courierList.Add(new Label { Text = "No courier can carry that load. Reduce the weight.", TextColor = Muted, FontSize = 12.5 });
            _selected = null; _assignBtn.IsEnabled = false;
            return;
        }
        foreach (var c in available)
        {
            var (price, eta) = Quote(c);
            var active = _selected == c.Id;

            var grid = new Grid
            {
                ColumnDefinitions =
                {
                    new ColumnDefinition(GridLength.Auto),
                    new ColumnDefinition(GridLength.Star),
                    new ColumnDefinition(GridLength.Auto),
                },
                ColumnSpacing = 10
            };
            grid.Add(new Label { Text = c.Emoji, FontSize = 24, VerticalOptions = LayoutOptions.Center }, 0, 0);
            grid.Add(new VerticalStackLayout
            {
                VerticalOptions = LayoutOptions.Center,
                Children =
                {
                    new Label { Text = c.Vehicle, FontAttributes = FontAttributes.Bold, TextColor = Color.FromArgb("#17271E"), FontSize = 14 },
                    new Label { Text = $"{c.Name} \u00B7 \u2605 {c.Rating:0.0} \u00B7 up to {c.KgMax:N0} kg", FontSize = 11, TextColor = Muted }
                }
            }, 1, 0);
            grid.Add(new VerticalStackLayout
            {
                VerticalOptions = LayoutOptions.Center, HorizontalOptions = LayoutOptions.End,
                Children =
                {
                    new Label { Text = $"KSh {price:N0}", FontAttributes = FontAttributes.Bold, TextColor = Primary, FontSize = 14, HorizontalTextAlignment = TextAlignment.End },
                    new Label { Text = $"{eta} min", FontSize = 11, TextColor = Muted, HorizontalTextAlignment = TextAlignment.End }
                }
            }, 2, 0);

            var frame = new Frame
            {
                BackgroundColor = active ? Color.FromArgb("#EAF6EE") : Colors.White,
                BorderColor = active ? Primary : Color.FromArgb("#E4EFE8"),
                CornerRadius = 12, HasShadow = false, Padding = new Thickness(12, 10),
                Content = grid
            };
            var id = c.Id;
            var tap = new TapGestureRecognizer();
            tap.Tapped += (_, _) => { _selected = id; _assignBtn.IsEnabled = true; BuildCouriers(); };
            frame.GestureRecognizers.Add(tap);
            _courierList.Add(frame);
        }
    }

    async void OnAssign(object? sender, EventArgs e)
    {
        var c = Couriers.FirstOrDefault(x => x.Id == _selected);
        if (c == null) return;
        if (string.IsNullOrWhiteSpace(_drop.Text))
        {
            await DisplayAlert("Drop-off needed", "Enter a drop-off point first.", "OK");
            return;
        }
        var (price, eta) = Quote(c);
        var ok = await DisplayAlert("Assign courier",
            $"Assign {c.Name} ({c.Vehicle}) to deliver from {(_pickup.Text ?? "pickup")} to {_drop.Text}?\n\nPrice KSh {price:N0} \u00B7 ETA {eta} min", "Assign", "Cancel");
        if (!ok) return;

        _step = 0;
        ShowAssigned(c, price, eta);
        _planView.IsVisible = false;
        _assignedView.IsVisible = true;

        _timer?.Stop();
        _timer = Dispatcher.CreateTimer();
        _timer.Interval = TimeSpan.FromSeconds(6);
        _timer.Tick += (_, _) =>
        {
            if (_step >= Steps.Length - 1) { _timer!.Stop(); return; }
            _step++;
            ShowAssigned(c, price, eta);
        };
        _timer.Start();
    }

    void ShowAssigned(Courier c, int price, int eta)
    {
        var headGrid = new Grid { ColumnDefinitions = { new ColumnDefinition(GridLength.Auto), new ColumnDefinition(GridLength.Star), new ColumnDefinition(GridLength.Auto) }, ColumnSpacing = 12 };
        headGrid.Add(new Label { Text = c.Emoji, FontSize = 40, VerticalOptions = LayoutOptions.Center }, 0, 0);
        headGrid.Add(new VerticalStackLayout
        {
            VerticalOptions = LayoutOptions.Center,
            Children =
            {
                new Label { Text = c.Name, FontAttributes = FontAttributes.Bold, FontSize = 16, TextColor = Primary },
                new Label { Text = $"{c.Vehicle} \u00B7 \u2605 {c.Rating:0.0}", FontSize = 12, TextColor = Muted }
            }
        }, 1, 0);
        headGrid.Add(new Label { Text = $"KSh {price:N0}", FontAttributes = FontAttributes.Bold, FontSize = 20, TextColor = Amber, VerticalOptions = LayoutOptions.Center }, 2, 0);

        var route = new VerticalStackLayout
        {
            Spacing = 6, Margin = new Thickness(0, 10, 0, 6),
            Children =
            {
                RouteRow(Accent, _pickup.Text ?? "Pickup"),
                RouteRow(Amber, _drop.Text ?? "Drop-off")
            }
        };

        var steps = new VerticalStackLayout { Spacing = 0, Margin = new Thickness(0, 8, 0, 4) };
        for (int i = 0; i < Steps.Length; i++)
        {
            var done = i < _step; var active = i == _step;
            var dot = new Frame
            {
                WidthRequest = 24, HeightRequest = 24, CornerRadius = 12, Padding = 0, HasShadow = false,
                BackgroundColor = done ? Accent : active ? Amber : Color.FromArgb("#EEF4F0"),
                Content = new Label { Text = done ? "\u2713" : (i + 1).ToString(), FontSize = 11, FontAttributes = FontAttributes.Bold, TextColor = (done || active) ? Colors.White : Muted, HorizontalTextAlignment = TextAlignment.Center, VerticalTextAlignment = TextAlignment.Center }
            };
            var row = new HorizontalStackLayout
            {
                Spacing = 10, Margin = new Thickness(0, 4),
                Children =
                {
                    dot,
                    new Label { Text = Steps[i], FontSize = 13.5, VerticalOptions = LayoutOptions.Center,
                        TextColor = (done || active) ? Color.FromArgb("#17271E") : Muted,
                        FontAttributes = (done || active) ? FontAttributes.Bold : FontAttributes.None }
                }
            };
            steps.Add(row);
        }

        var children = new VerticalStackLayout
        {
            Spacing = 4,
            Children =
            {
                headGrid, route,
                new Grid
                {
                    ColumnSpacing = 10, Margin = new Thickness(0, 4),
                    ColumnDefinitions = { new ColumnDefinition(GridLength.Star), new ColumnDefinition(GridLength.Star) },
                    Children = { WrapCol(Metric("Distance", $"{Distance:0.#} km"), 0), WrapCol(Metric("ETA", $"{eta} min"), 1) }
                },
                steps
            }
        };

        if (_step >= Steps.Length - 1)
            children.Add(new Label { Text = $"\u2705 Delivered to {_drop.Text}!", TextColor = Accent, FontAttributes = FontAttributes.Bold, Margin = new Thickness(0, 6, 0, 0) });
        else
            children.Add(new Label { Text = $"Live status updates automatically. {c.Name} has been notified.", FontSize = 11.5, TextColor = Muted, Margin = new Thickness(0, 6, 0, 0) });

        var newBtn = new Button
        {
            Text = _step >= Steps.Length - 1 ? "Book another delivery" : "Cancel delivery",
            BackgroundColor = Colors.Transparent, TextColor = Primary, BorderColor = Primary, BorderWidth = 1,
            CornerRadius = 10, Margin = new Thickness(0, 8, 0, 0)
        };
        newBtn.Clicked += (_, _) =>
        {
            _timer?.Stop();
            _assignedView.IsVisible = false;
            _planView.IsVisible = true;
            _selected = null; _assignBtn.IsEnabled = false;
            BuildCouriers();
        };
        children.Add(newBtn);

        _assignedView.Clear();
        _assignedView.Add(new Frame { BackgroundColor = Colors.White, CornerRadius = 16, HasShadow = true, Padding = new Thickness(16), Content = children });
    }

    static View RouteRow(Color dot, string text) => new HorizontalStackLayout
    {
        Spacing = 9,
        Children =
        {
            new Frame { WidthRequest = 10, HeightRequest = 10, CornerRadius = 5, Padding = 0, HasShadow = false, BackgroundColor = dot, VerticalOptions = LayoutOptions.Center },
            new Label { Text = text, FontSize = 13.5, TextColor = Color.FromArgb("#17271E"), VerticalOptions = LayoutOptions.Center }
        }
    };

    static View Metric(string label, string value) => new Frame
    {
        BackgroundColor = Color.FromArgb("#F1F7F3"), CornerRadius = 10, HasShadow = false, Padding = new Thickness(12, 8),
        Content = new VerticalStackLayout
        {
            Children =
            {
                new Label { Text = label, FontSize = 10, TextColor = Muted, FontAttributes = FontAttributes.Bold },
                new Label { Text = value, FontSize = 16, FontAttributes = FontAttributes.Bold, TextColor = Primary }
            }
        }
    };
}
