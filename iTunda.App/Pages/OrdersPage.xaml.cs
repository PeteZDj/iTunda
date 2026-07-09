using iTunda.App.Models;
using iTunda.App.Services;

namespace iTunda.App.Pages;

public class OrdersPage : ContentPage
{
    static readonly Color Primary = Color.FromArgb("#0A4A26");
    static readonly Color Accent  = Color.FromArgb("#16A34A");
    static readonly Color Amber   = Color.FromArgb("#F4A621");

    private readonly ApiClient _api;
    private readonly AppState _appState;
    private readonly VerticalStackLayout _listContainer;
    private readonly ActivityIndicator _spinner;
    private readonly Label _emptyLabel;

    public OrdersPage(ApiClient api, AppState appState)
    {
        _api = api;
        _appState = appState;
        Title = "Orders";
        BackgroundColor = Color.FromArgb("#F3FAF5");

        _spinner = new ActivityIndicator
        {
            Color = Accent, IsVisible = true, IsRunning = true,
            HorizontalOptions = LayoutOptions.Center, Margin = new Thickness(0, 40)
        };

        _emptyLabel = new Label
        {
            Text = "No orders yet.",
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
                    Text = appState.Role == UserRole.Farmer ? "Incoming Orders" : "My Orders",
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
                Children = { header, _spinner, _emptyLabel, _listContainer }
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
        _emptyLabel.IsVisible = false;
        _listContainer.Children.Clear();

        try
        {
            var orders = _appState.Role == UserRole.Farmer
                ? await _api.GetFarmerOrdersAsync()
                : await _api.GetMyOrdersAsync();

            if (orders.Count == 0)
            {
                _emptyLabel.IsVisible = true;
            }
            else
            {
                foreach (var order in orders)
                    _listContainer.Children.Add(OrderCard(order));
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

    private View OrderCard(OrderResponse order)
    {
        var statusColor = order.Status switch
        {
            OrderStatus.Delivered  => Colors.Green,
            OrderStatus.Cancelled  => Colors.Red,
            OrderStatus.InTransit  => Accent,
            OrderStatus.Confirmed  => Amber,
            _                      => Colors.Gray
        };

        var statusBadge = new Frame
        {
            BackgroundColor = statusColor,
            CornerRadius = 10,
            Padding = new Thickness(10, 4),
            HasShadow = false,
            Content = new Label { Text = order.Status.ToString(), TextColor = Colors.White, FontSize = 12, FontAttributes = FontAttributes.Bold }
        };

        var titleRow = new Grid
        {
            ColumnDefinitions = { new ColumnDefinition(GridLength.Star), new ColumnDefinition(GridLength.Auto) }
        };
        titleRow.Add(new Label
        {
            Text = $"Order #{order.Id}",
            FontSize = 16,
            FontAttributes = FontAttributes.Bold,
            TextColor = Primary
        }, 0, 0);
        titleRow.Add(statusBadge, 1, 0);

        var itemLines = new VerticalStackLayout { Spacing = 2 };
        foreach (var item in order.Items)
        {
            itemLines.Children.Add(new Label
            {
                Text = $"• {item.ProduceName}  ×{item.Quantity:0.#}  @ KES {item.UnitPriceAtOrder:0}",
                FontSize = 13,
                TextColor = Color.FromArgb("#444")
            });
        }

        return new Frame
        {
            BackgroundColor = Colors.White,
            CornerRadius = 10,
            HasShadow = true,
            Padding = new Thickness(16, 14),
            Margin = new Thickness(0, 6),
            Content = new VerticalStackLayout
            {
                Spacing = 10,
                Children =
                {
                    titleRow,
                    new BoxView { BackgroundColor = Color.FromArgb("#EEE"), HeightRequest = 1 },
                    itemLines,
                    new BoxView { BackgroundColor = Color.FromArgb("#EEE"), HeightRequest = 1 },
                    new Grid
                    {
                        ColumnDefinitions = { new ColumnDefinition(GridLength.Star), new ColumnDefinition(GridLength.Auto) },
                        Children =
                        {
                            new Label { Text = order.DeliveryAddress ?? "—", FontSize = 12, TextColor = Colors.Gray, VerticalTextAlignment = TextAlignment.Center },
                            new Label { Text = $"KES {order.TotalAmount:0}", FontSize = 16, FontAttributes = FontAttributes.Bold, TextColor = Amber, HorizontalTextAlignment = TextAlignment.End }
                        }
                    }.WithCol(1)
                }
            }
        };
    }
}

internal static class GridExtensions
{
    internal static Grid WithCol(this Grid g, int col)
    {
        Grid.SetColumn((BindableObject)g.Children[1], col);
        return g;
    }
}
