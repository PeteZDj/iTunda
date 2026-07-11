using System.Net.Http.Headers;
using System.Net.Http.Json;
using iTunda.App.Models;

namespace iTunda.App.Services;

public class ApiClient
{
    private readonly HttpClient _http;
    private readonly AppState _appState;

    // Live API behind IIS. `localhost` only works in the desktop debugger — on a
    // real phone it points at the device itself, which caused "connection failure".
    public const string BaseUrl = "https://itunda.org/api";
    public const string Origin  = "https://itunda.org";

    public ApiClient(AppState appState)
    {
        _appState = appState;
        _http = new HttpClient { BaseAddress = new Uri(BaseUrl + "/") };
    }

    private void ApplyAuthHeader()
    {
        _http.DefaultRequestHeaders.Authorization = _appState.Token is null
            ? null
            : new AuthenticationHeaderValue("Bearer", _appState.Token);
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var resp = await _http.PostAsJsonAsync("auth/register", request);
        await EnsureSuccess(resp);
        return (await resp.Content.ReadFromJsonAsync<AuthResponse>())!;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var resp = await _http.PostAsJsonAsync("auth/login", request);
        await EnsureSuccess(resp);
        return (await resp.Content.ReadFromJsonAsync<AuthResponse>())!;
    }

    public async Task<List<string>> GetCategoriesAsync()
    {
        var resp = await _http.GetAsync("categories");
        await EnsureSuccess(resp);
        return (await resp.Content.ReadFromJsonAsync<List<string>>()) ?? new();
    }

    public async Task<List<CommodityDto>> GetCommoditiesAsync()
    {
        var resp = await _http.GetAsync("commodities");
        await EnsureSuccess(resp);
        return (await resp.Content.ReadFromJsonAsync<List<CommodityDto>>()) ?? new();
    }

    public async Task<PriceHistory?> GetPriceHistoryAsync(string category, string range)
    {
        var resp = await _http.GetAsync($"commodities/{Uri.EscapeDataString(category)}/history?range={range}");
        if (!resp.IsSuccessStatusCode) return null;
        return await resp.Content.ReadFromJsonAsync<PriceHistory>();
    }

    public async Task<List<ProduceResponse>> GetProduceAsync(
        string? q = null, string? category = null, string? county = null,
        bool? exportReady = null, bool includeFuture = false)
    {
        var qs = new List<string>();
        if (!string.IsNullOrWhiteSpace(q)) qs.Add($"q={Uri.EscapeDataString(q)}");
        if (!string.IsNullOrWhiteSpace(category)) qs.Add($"category={Uri.EscapeDataString(category)}");
        if (!string.IsNullOrWhiteSpace(county)) qs.Add($"county={Uri.EscapeDataString(county)}");
        if (exportReady.HasValue) qs.Add($"exportReady={exportReady.Value}");
        if (includeFuture) qs.Add("includeFuture=true");
        var url = "produce" + (qs.Count == 0 ? "" : "?" + string.Join("&", qs));
        var resp = await _http.GetAsync(url);
        await EnsureSuccess(resp);
        return (await resp.Content.ReadFromJsonAsync<List<ProduceResponse>>()) ?? new();
    }

    public async Task<ProduceResponse> GetProduceByIdAsync(int id)
    {
        var resp = await _http.GetAsync($"produce/{id}");
        await EnsureSuccess(resp);
        return (await resp.Content.ReadFromJsonAsync<ProduceResponse>())!;
    }

    public async Task<ProduceResponse> CreateProduceAsync(CreateProduceRequest request)
    {
        ApplyAuthHeader();
        var resp = await _http.PostAsJsonAsync("produce", request);
        await EnsureSuccess(resp);
        return (await resp.Content.ReadFromJsonAsync<ProduceResponse>())!;
    }

    public async Task<List<ProduceResponse>> GetMyListingsAsync(int farmerProfileId)
    {
        var resp = await _http.GetAsync($"farmers/{farmerProfileId}/produce");
        await EnsureSuccess(resp);
        return (await resp.Content.ReadFromJsonAsync<List<ProduceResponse>>()) ?? new();
    }

    public async Task<List<FarmerResponse>> GetFarmersAsync(string? county = null)
    {
        var url = "farmers" + (string.IsNullOrWhiteSpace(county) ? "" : $"?county={Uri.EscapeDataString(county)}");
        var resp = await _http.GetAsync(url);
        await EnsureSuccess(resp);
        return (await resp.Content.ReadFromJsonAsync<List<FarmerResponse>>()) ?? new();
    }

    public async Task<FarmerResponse> GetFarmerByIdAsync(int id)
    {
        var resp = await _http.GetAsync($"farmers/{id}");
        await EnsureSuccess(resp);
        return (await resp.Content.ReadFromJsonAsync<FarmerResponse>())!;
    }

    public async Task<FarmerResponse> GetMyFarmerProfileAsync()
    {
        ApplyAuthHeader();
        var resp = await _http.GetAsync("farmers/me");
        await EnsureSuccess(resp);
        return (await resp.Content.ReadFromJsonAsync<FarmerResponse>())!;
    }

    public async Task<OrderResponse> CreateOrderAsync(CreateOrderRequest request)
    {
        ApplyAuthHeader();
        var resp = await _http.PostAsJsonAsync("orders", request);
        await EnsureSuccess(resp);
        return (await resp.Content.ReadFromJsonAsync<OrderResponse>())!;
    }

    public async Task<List<OrderResponse>> GetMyOrdersAsync()
    {
        ApplyAuthHeader();
        var resp = await _http.GetAsync("orders/mine");
        await EnsureSuccess(resp);
        return (await resp.Content.ReadFromJsonAsync<List<OrderResponse>>()) ?? new();
    }

    public async Task<List<OrderResponse>> GetFarmerOrdersAsync()
    {
        ApplyAuthHeader();
        var resp = await _http.GetAsync("orders/farmer");
        await EnsureSuccess(resp);
        return (await resp.Content.ReadFromJsonAsync<List<OrderResponse>>()) ?? new();
    }

    private static async Task EnsureSuccess(HttpResponseMessage resp)
    {
        if (!resp.IsSuccessStatusCode)
        {
            var body = await resp.Content.ReadAsStringAsync();
            throw new ApiException(resp.StatusCode, string.IsNullOrWhiteSpace(body) ? resp.ReasonPhrase ?? "Request failed" : body);
        }
    }
}

public class ApiException : Exception
{
    public System.Net.HttpStatusCode StatusCode { get; }

    public ApiException(System.Net.HttpStatusCode statusCode, string message) : base(message)
    {
        StatusCode = statusCode;
    }
}
