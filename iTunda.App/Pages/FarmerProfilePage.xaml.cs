using iTunda.App.Models;
using iTunda.App.Services;

namespace iTunda.App.Pages;

public class FarmerProfilePage : ContentPage
{
    static readonly Color Primary = Color.FromArgb("#1A3A2A");
    static readonly Color Accent  = Color.FromArgb("#00BFA5");
    static readonly Color Amber   = Color.FromArgb("#FF8F00");

    public FarmerProfilePage(ApiClient api, AppState appState, FarmerResponse farmer)
    {
        NavigationPage.SetHasNavigationBar(this, false);
        BackgroundColor = Color.FromArgb("#F5F5F5");

        // ── Dark header ───────────────────────────────────────────────────
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

        var header = new VerticalStackLayout
        {
            BackgroundColor = Primary,
            Padding = new Thickness(20, 50, 20, 30),
            Spacing = 6,
            Children =
            {
                backBtn,
                new Label { Text = farmer.FarmName, FontSize = 24, FontAttributes = FontAttributes.Bold, TextColor = Colors.White },
                new Label { Text = $"by {farmer.Name}", FontSize = 14, TextColor = Color.FromArgb("#A5D6A7") },
                new HorizontalStackLayout
                {
                    Spacing = 16,
                    Margin = new Thickness(0, 8, 0, 0),
                    Children =
                    {
                        StatChip($"★ {farmer.RatingFarmer:0.0}", "Rating"),
                        StatChip($"{farmer.OrdersFulfilled}", "Orders"),
                        StatChip($"{farmer.SizeOfFarmAcres:0.#} ac", "Farm Size")
                    }
                }
            }
        };

        // ── Info card ─────────────────────────────────────────────────────
        var infoCard = new Frame
        {
            BackgroundColor = Colors.White,
            CornerRadius = 10,
            HasShadow = true,
            Margin = new Thickness(16, 12),
            Padding = new Thickness(20, 16),
            Content = new VerticalStackLayout
            {
                Spacing = 12,
                Children =
                {
                    new Label { Text = "Farm Information", FontSize = 15, FontAttributes = FontAttributes.Bold, TextColor = Primary },
                    new BoxView { BackgroundColor = Color.FromArgb("#EEE"), HeightRequest = 1 },
                    InfoRow("Location", farmer.LocationDisplay),
                    InfoRow("Specialization", farmer.Specialization ?? "Mixed Produce"),
                    InfoRow("Certifications", farmer.Certifications ?? "—"),
                    InfoRow("Export", farmer.AbleToExportDirectly ? $"Yes — {farmer.ExportsDomain}" : "No"),
                    farmer.Phone != null ? InfoRow("Phone", farmer.Phone) : new BoxView { IsVisible = false, HeightRequest = 0 }
                }
            }
        };

        // ── GPS coordinates card ──────────────────────────────────────────
        View gpsCard = farmer.FarmLatitude.HasValue
            ? new Frame
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
                        new Label { Text = "Farm Location (GPS)", FontSize = 15, FontAttributes = FontAttributes.Bold, TextColor = Primary },
                        new BoxView { BackgroundColor = Color.FromArgb("#EEE"), HeightRequest = 1 },
                        InfoRow("Latitude", $"{farmer.FarmLatitude:0.0000}°"),
                        InfoRow("Longitude", $"{farmer.FarmLongitude:0.0000}°"),
                        InfoRow("County", farmer.LocationCounty ?? "—"),
                        InfoRow("Sub-County", farmer.LocationSubCounty ?? "—")
                    }
                }
            }
            : new BoxView { IsVisible = false, HeightRequest = 0 };

        // ── Description card ──────────────────────────────────────────────
        View descCard = farmer.Description != null
            ? new Frame
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
                        new Label { Text = "About the Farm", FontSize = 15, FontAttributes = FontAttributes.Bold, TextColor = Primary },
                        new Label { Text = farmer.Description, FontSize = 14, TextColor = Color.FromArgb("#444"), LineHeight = 1.5 }
                    }
                }
            }
            : new BoxView { IsVisible = false, HeightRequest = 0 };

        // ── Contact button ────────────────────────────────────────────────
        View contactBtn = farmer.Phone != null
            ? new Button
            {
                Text = $"Call {farmer.Name}",
                BackgroundColor = Accent,
                TextColor = Colors.White,
                FontAttributes = FontAttributes.Bold,
                CornerRadius = 30,
                HeightRequest = 52,
                FontSize = 15,
                Margin = new Thickness(16, 0, 16, 24)
            }
            : new BoxView { IsVisible = false, HeightRequest = 0 };

        Content = new ScrollView
        {
            Content = new VerticalStackLayout
            {
                Children = { header, infoCard, gpsCard, descCard, contactBtn }
            }
        };
    }

    private static VerticalStackLayout StatChip(string value, string label) =>
        new VerticalStackLayout
        {
            HorizontalOptions = LayoutOptions.Center,
            Spacing = 2,
            Children =
            {
                new Label { Text = value, FontSize = 16, FontAttributes = FontAttributes.Bold, TextColor = Colors.White, HorizontalTextAlignment = TextAlignment.Center },
                new Label { Text = label, FontSize = 11, TextColor = Color.FromArgb("#A5D6A7"), HorizontalTextAlignment = TextAlignment.Center }
            }
        };

    private static Grid InfoRow(string label, string value)
    {
        var g = new Grid
        {
            ColumnDefinitions =
            {
                new ColumnDefinition(new GridLength(130)),
                new ColumnDefinition(GridLength.Star)
            }
        };
        g.Add(new Label { Text = label, FontSize = 13, TextColor = Colors.Gray, FontAttributes = FontAttributes.Bold }, 0, 0);
        g.Add(new Label { Text = value, FontSize = 13, TextColor = Color.FromArgb("#333") }, 1, 0);
        return g;
    }
}
