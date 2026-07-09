using iTunda.App.Models;
using iTunda.App.Pages;
using iTunda.App.Services;

namespace iTunda.App;

public class AppShell : Shell
{
    static readonly Color Primary = Color.FromArgb("#0A4A26");
    static readonly Color Gold    = Color.FromArgb("#F4A621");
    static readonly Color Muted   = Color.FromArgb("#9CC7AD");

    public AppShell(ApiClient api, AppState appState)
    {
        FlyoutBehavior = FlyoutBehavior.Disabled;
        Title = "iTunda";

        // Green shell chrome (nav bar + tab bar) — replaces the old per-page
        // NavigationPage wrappers, which are invalid inside ShellContent and
        // caused a blank/crash on Windows.
        Shell.SetBackgroundColor(this, Primary);
        Shell.SetForegroundColor(this, Colors.White);
        Shell.SetTitleColor(this, Colors.White);
        SetValue(Shell.TabBarBackgroundColorProperty, Primary);
        SetValue(Shell.TabBarForegroundColorProperty, Gold);
        SetValue(Shell.TabBarTitleColorProperty, Gold);
        SetValue(Shell.TabBarUnselectedColorProperty, Muted);

        var tabBar = new TabBar();

        tabBar.Items.Add(new Tab
        {
            Title = "Browse",
            Items = { new ShellContent { Title = "Browse", Content = new BrowsePage(api, appState) } }
        });

        if (appState.Role == UserRole.Farmer)
        {
            tabBar.Items.Add(new Tab
            {
                Title = "Post",
                Items = { new ShellContent { Title = "Post Produce", Content = new MyListingsPage(api, appState) } }
            });
        }

        tabBar.Items.Add(new Tab
        {
            Title = "Orders",
            Items = { new ShellContent { Title = "Orders", Content = new OrdersPage(api, appState) } }
        });

        tabBar.Items.Add(new Tab
        {
            Title = "Account",
            Items = { new ShellContent { Title = "Account", Content = new AccountPage(appState, api) } }
        });

        Items.Add(tabBar);
    }
}
