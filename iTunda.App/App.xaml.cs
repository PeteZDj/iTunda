using iTunda.App.Pages;
using iTunda.App.Services;

namespace iTunda.App;

public class App : Application
{
    public App(ApiClient api, AppState appState)
    {
        MainPage = appState.IsLoggedIn
            ? new AppShell(api, appState)
            : new NavigationPage(new LoginPage(api, appState));
    }
}
