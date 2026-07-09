using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using iTunda.Api.Data;

namespace iTunda.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    public static readonly string[] KenyanExportCategories = new[]
    {
        "Avocados", "Macadamia Nuts", "French Beans", "Tea", "Peas & Mange Tout",
        "Passion Fruit", "Mangoes", "Bananas", "Tomatoes", "Onions", "Capsicum & Peppers", "Roses",
        "Coffee", "Apples", "Pineapples", "Oranges", "Grapes", "Lemons & Limes", "Strawberries",
        "Cashew Nuts", "Cocoa", "Vanilla", "Ginger", "Green Chillies", "Sweet Potatoes"
    };

    private readonly ItundaDbContext _db;

    public CategoriesController(ItundaDbContext db) => _db = db;

    [HttpGet]
    public ActionResult<string[]> GetAll() => Ok(KenyanExportCategories);

    [HttpGet("{category}/stats")]
    public async Task<ActionResult<object>> GetStats(string category)
    {
        var listings = await _db.Produce
            .Where(p => p.Category == category && p.IsActive)
            .CountAsync();

        var farmers = await _db.Produce
            .Where(p => p.Category == category && p.IsActive)
            .Select(p => p.FarmerProfileId)
            .Distinct()
            .CountAsync();

        return Ok(new { Category = category, ActiveListings = listings, FarmersOffering = farmers });
    }
}
