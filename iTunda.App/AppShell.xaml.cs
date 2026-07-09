using iTunda.App.Models;
using iTunda.App.Pages;
using iTunda.App.Services;

namespace iTunda.App;

public class AppShell : Shell
{
    public AppShell(ApiClient api, AppState appState)
    {
        FlyoutBehavior = FlyoutBehavior.Disabled;
        Title = "iTunda";

        var tabBar = new TabBar();

        tabBar.Items.Add(new Tab
        {
            Title = "Browse",
            Items =
            {
                new ShellContent
                {
                    Title = "Browse",
                    Content = new NavigationPage(new BrowsePage(api, appState)) { BarBackgroundColor = Color.FromArgb("#1A3A2A"), BarTextColor = Colors.White }
                }
            }
        });

        if (appState.Role == UserRole.Farmer)
        {
            tabBar.Items.Add(new Tab
            {
                Title = "Post",
                Items =
                {
                    new ShellContent
                    {
                        Title = "Post Produce",
                        Content = new NavigationPage(new MyListingsPage(api, appState)) { BarBackgroundColor = Color.FromArgb("#1A3A2A"), BarTextColor = Colors.White }
                    }
                }
            });
        }

        tabBar.Items.Add(new Tab
        {
            Title = "Orders",
            Items =
            {
                new ShellContent
                {
                    Title = "Orders",
                    Content = new NavigationPage(new OrdersPage(api, appState)) { BarBackgroundColor = Color.FromArgb("#1A3A2A"), BarTextColor = Colors.White }
                }
            }
        });

        tabBar.Items.Add(new Tab
        {
            Title = "Account",
            Items =
            {
                new ShellContent
                {
                    Title = "Account",
                    Content = new NavigationPage(new AccountPage(appState, api)) { BarBackgroundColor = Color.FromArgb("#1A3A2A"), BarTextColor = Colors.White }
                }
            }
        });

        Items.Add(tabBar);
    }
}
