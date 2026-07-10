using iTunda.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace iTunda.Api.Data;

public static class SeedData
{
    private record FarmerDef(string Name, string Email, string FarmName, int RegionIndex);

    private static readonly Dictionary<string, string> Dial = new()
    {
        ["KE"] = "+254", ["UG"] = "+256", ["ET"] = "+251", ["TZ"] = "+255",
        ["ZA"] = "+27",  ["MX"] = "+52",  ["CL"] = "+56",  ["PE"] = "+51",
        ["CO"] = "+57",  ["BR"] = "+55",  ["IN"] = "+91",  ["ES"] = "+34",
    };

    public static async Task SeedAsync(ItundaDbContext db)
    {
        if (await db.Users.AnyAsync()) return;

        var passwordHash = BCrypt.Net.BCrypt.HashPassword("Password123!");
        var rng = new Random(42);
        var now = DateTime.UtcNow;

        // ── Farmers across the top crop regions (region index → RegionData.All) ─
        // Keep james.kamau@farm.ke first so the mobile demo login keeps working.
        var farmerDefs = new[]
        {
            new FarmerDef("James Kamau",        "james.kamau@farm.ke",     "Kamau Avocado Estate",        0),
            new FarmerDef("Grace Wanjiku",      "grace.wanjiku@farm.ke",   "Wanjiku Green Beans Farm",    1),
            new FarmerDef("Moses Kariuki",      "moses.kariuki@farm.ke",   "Kirinyaga Macadamia Co-op",   2),
            new FarmerDef("David Mwangi",       "david.mwangi@farm.ke",    "Naivasha Rose Estate",        3),
            new FarmerDef("Samuel Kipchoge",    "samuel.kipchoge@farm.ke", "Nandi Highlands Tea",         4),
            new FarmerDef("Isaac Ngetich",      "isaac.ngetich@farm.ke",   "Uasin Gishu Mixed Farm",      5),
            new FarmerDef("Mary Njeri",         "mary.njeri@farm.ke",      "Meru Avocado Growers",        6),
            new FarmerDef("Rose Achieng",       "rose.achieng@farm.ke",    "Kisii Tomato Hub",            7),
            new FarmerDef("John Mutua",         "john.mutua@farm.ke",      "Machakos Capsicum Gardens",   8),
            new FarmerDef("Joseph Okello",      "joseph.okello@farm.ug",   "Kabale Passion Growers",      9),
            new FarmerDef("Sarah Nakato",       "sarah.nakato@farm.ug",    "Mbale Banana Estate",        10),
            new FarmerDef("David Mugisha",      "david.mugisha@farm.ug",   "Masaka Fruit Co-op",         11),
            new FarmerDef("Abebe Bekele",       "abebe.bekele@farm.et",    "Sidama Avocado Union",       12),
            new FarmerDef("Mulu Tesfaye",       "mulu.tesfaye@farm.et",    "Jimma Orchards",             13),
            new FarmerDef("Juma Mushi",         "juma.mushi@farm.tz",      "Kilimanjaro Avocado Farm",   14),
            new FarmerDef("Neema Kessy",        "neema.kessy@farm.tz",     "Arusha Export Vegetables",   15),
            new FarmerDef("Pieter van der Merwe","pieter.vdm@farm.za",     "Limpopo Avo Estate",         16),
            new FarmerDef("Thandiwe Nkosi",     "thandiwe.nkosi@farm.za",  "Mpumalanga Subtropicals",    17),
            new FarmerDef("Johan Botha",        "johan.botha@farm.za",     "Cape Bloom Roses",           18),
            new FarmerDef("Miguel Hernández",   "miguel.hernandez@farm.mx","Michoacán Aguacates",        19),
            new FarmerDef("Camila Rojas",       "camila.rojas@farm.cl",    "Petorca Palta Orchards",     20),
            new FarmerDef("Carlos Mendoza",     "carlos.mendoza@farm.pe",  "La Libertad Agroexport",     21),
            new FarmerDef("Juan Restrepo",      "juan.restrepo@farm.co",   "Antioquia Avocado Fincas",   22),
            new FarmerDef("Ana Silva",          "ana.silva@farm.br",       "São Paulo Tropical Fruits",  23),
            new FarmerDef("Rajesh Nair",        "rajesh.nair@farm.in",     "Kerala Plantations",         24),
            new FarmerDef("Lucía Fernández",    "lucia.fernandez@farm.es", "Málaga Subtropical",         25),
        };

        var farmerUsers = farmerDefs
            .Select(d => new User { Name = d.Name, Email = d.Email, PasswordHash = passwordHash, Role = UserRole.Farmer })
            .ToArray();
        db.Users.AddRange(farmerUsers);
        await db.SaveChangesAsync();

        // Buyer demo accounts
        var buyerUsers = new[]
        {
            new User { Name="Nairobi Fresh Ltd",      Email="orders@nairobifresh.ke",  PasswordHash=passwordHash, Role=UserRole.Buyer },
            new User { Name="Rotterdam Produce BV",    Email="buy@rotterdamproduce.nl", PasswordHash=passwordHash, Role=UserRole.Buyer },
            new User { Name="Gulf Fresh Imports",      Email="supply@gulffresh.ae",     PasswordHash=passwordHash, Role=UserRole.Buyer },
        };
        db.Users.AddRange(buyerUsers);
        await db.SaveChangesAsync();

        // ── Farmer profiles anchored to real growing regions ───────────────
        var profiles = new List<FarmerProfile>();
        foreach (var d in farmerDefs)
        {
            var r = RegionData.All[d.RegionIndex];
            var spec = r.Crops[0];
            var experience = rng.Next(6, 26);
            var exportZone = r.Zone <= 3;
            var canExport = exportZone && rng.Next(10) < 7;
            var jitterLat = (rng.NextDouble() - 0.5) * 0.10;
            var jitterLng = (rng.NextDouble() - 0.5) * 0.10;
            var user = farmerUsers.First(u => u.Email == d.Email);

            profiles.Add(new FarmerProfile
            {
                UserId = user.Id,
                FarmName = d.FarmName,
                Description = $"{spec} specialist and premium horticulture from {d.FarmName} in {r.Name}, {r.Country}. " +
                              $"{(canExport ? "Export-certified with cold-chain handling." : "Supplying regional wholesale and fresh markets.")}",
                Experience = $"{experience} years",
                Specialization = spec,
                Certifications = canExport
                    ? "GlobalG.A.P, " + (r.Zone == 3 ? "SENASA Export Cert" : "Phytosanitary Export Cert")
                    : "Local Quality Assured",
                LocationCounty = r.Name,
                LocationSubCounty = r.Name,
                LocationTown = r.Name,
                FarmLatitude = Math.Round(r.Lat + jitterLat, 4),
                FarmLongitude = Math.Round(r.Lng + jitterLng, 4),
                Region = r.Name,
                Country = r.Country,
                CountryCode = r.CountryCode,
                Zone = r.Zone,
                SizeOfFarmAcres = rng.Next(15, 140),
                AbleToExportDirectly = canExport,
                ExportsDomain = r.Zone switch
                {
                    1 => "EU, Middle East, China",
                    2 => "EU, UK, Middle East",
                    3 => "USA, EU, Asia",
                    _ => "EU, UK",
                },
                Phone = $"{Dial.GetValueOrDefault(r.CountryCode, "+000")} 7{rng.Next(10, 99)} {rng.Next(100, 999)} {rng.Next(100, 999)}",
                RatingFarmer = Math.Round(4.2 + rng.NextDouble() * 0.7, 1),
                OrdersFulfilled = rng.Next(80, 520),
            });
        }
        db.FarmerProfiles.AddRange(profiles);
        await db.SaveChangesAsync();

        // ── Produce catalogue ───────────────────────────────────────────────
        var categories = new[]
        {
            "Avocados", "Macadamia Nuts", "French Beans", "Tea",
            "Peas & Mange Tout", "Passion Fruit", "Mangoes", "Bananas",
            "Tomatoes", "Onions", "Capsicum & Peppers", "Roses",
            "Coffee", "Apples", "Pineapples", "Oranges", "Grapes",
            "Lemons & Limes", "Strawberries", "Cashew Nuts", "Cocoa",
            "Vanilla", "Ginger", "Green Chillies", "Sweet Potatoes"
        };

        var catDetails = new Dictionary<string, (string unit, decimal minP, decimal maxP, double minQ, double maxQ, string[] varieties, string[] grades)>
        {
            ["Avocados"]         = ("kg",  55, 110, 100, 5000, new[]{"Hass", "Fuerte", "Jumbo Hass", "Reed"}, new[]{"Grade A", "Grade B", "Export Grade", "Premium"}),
            ["Macadamia Nuts"]   = ("kg", 280, 480, 50, 2000, new[]{"Integrifolia", "Tetraphylla", "In-Shell", "Kernel"}, new[]{"Grade A", "Grade 1", "Organic", "Premium"}),
            ["French Beans"]     = ("kg",  80, 150, 50, 800,  new[]{"Fine Bean", "Extra Fine", "Bobby Bean", "Haricot Vert"}, new[]{"Grade A", "Grade B", "Export Grade"}),
            ["Tea"]              = ("kg",  60, 200, 100, 5000, new[]{"CTC Black", "Orthodox Green", "White Tea", "Purple Tea"}, new[]{"KTDA Grade", "Premium", "Specialty"}),
            ["Peas & Mange Tout"]= ("kg",  90, 160, 50, 600,  new[]{"Snow Peas", "Sugar Snap", "Mange Tout", "Garden Peas"}, new[]{"Grade A", "Export Grade", "Premium"}),
            ["Passion Fruit"]    = ("kg",  70, 140, 50, 1000, new[]{"Purple Passion", "Yellow Passion", "Sweet Granadilla"}, new[]{"Grade A", "Grade B", "Fresh Market"}),
            ["Mangoes"]          = ("kg",  45, 120, 100, 3000, new[]{"Apple Mango", "Tommy Atkins", "Kent", "Ngowe"}, new[]{"Grade A", "Grade B", "Export Grade", "Organic"}),
            ["Bananas"]          = ("bunch", 80, 180, 50, 2000, new[]{"Cavendish", "Tissue Culture", "Plantain", "Apple Banana"}, new[]{"Grade A", "Grade B", "Premium"}),
            ["Tomatoes"]         = ("kg",  40, 90, 100, 3000, new[]{"Cal-J", "Money Maker", "Cherry Tomato", "Roma"}, new[]{"Grade A", "Grade B", "Greenhouse"}),
            ["Onions"]           = ("kg",  30, 70, 200, 8000, new[]{"Red Creole", "White Onion", "Spring Onion", "Shallots"}, new[]{"Grade A", "Grade B", "Dry Onion"}),
            ["Capsicum & Peppers"]= ("kg", 100, 200, 50, 1000, new[]{"Red Capsicum", "Yellow Capsicum", "Green Capsicum", "Chilli"}, new[]{"Grade A", "Export Grade", "Premium"}),
            ["Roses"]            = ("stem",  8, 25, 500, 50000, new[]{"Red Naomi", "Pink Avalanche", "White O'Hara", "Yellow Texas"}, new[]{"Grade A", "Grade AA", "Premium", "Select"}),
            ["Coffee"]           = ("kg", 350, 900, 60, 4000, new[]{"Arabica SL28", "Arabica SL34", "Ruiru 11", "Bourbon", "Robusta"}, new[]{"AA", "AB", "Specialty", "Grade 1"}),
            ["Apples"]           = ("kg",  70, 160, 100, 4000, new[]{"Golden Delicious", "Granny Smith", "Royal Gala", "Fuji"}, new[]{"Grade A", "Grade B", "Class 1", "Premium"}),
            ["Pineapples"]       = ("kg",  45, 110, 100, 3000, new[]{"MD2 Sweet Gold", "Smooth Cayenne", "Queen Victoria"}, new[]{"Grade A", "Export Grade", "Class 1"}),
            ["Oranges"]          = ("kg",  40, 100, 150, 6000, new[]{"Valencia", "Navel", "Washington", "Blood Orange"}, new[]{"Grade A", "Grade B", "Class 1", "Juice Grade"}),
            ["Grapes"]           = ("kg", 120, 320, 50, 2000, new[]{"Thompson Seedless", "Crimson", "Red Globe", "Flame"}, new[]{"Grade A", "Export Grade", "Premium"}),
            ["Lemons & Limes"]   = ("kg",  60, 150, 80, 3000, new[]{"Eureka Lemon", "Lisbon Lemon", "Tahiti Lime", "Persian Lime"}, new[]{"Grade A", "Class 1", "Juice Grade"}),
            ["Strawberries"]     = ("kg", 180, 420, 30, 1000, new[]{"Chandler", "Albion", "Camarosa", "Festival"}, new[]{"Grade A", "Premium", "Class 1"}),
            ["Cashew Nuts"]      = ("kg", 320, 720, 40, 1500, new[]{"W240", "W320", "Raw In-Shell", "Roasted Kernel"}, new[]{"W240", "W320", "Grade 1", "Premium"}),
            ["Cocoa"]            = ("kg", 260, 560, 100, 5000, new[]{"Criollo", "Forastero", "Trinitario", "Fermented Beans"}, new[]{"Grade 1", "Grade 2", "Fine Flavour"}),
            ["Vanilla"]          = ("kg", 3500, 9000, 5, 200, new[]{"Bourbon", "Grade A Gourmet", "Grade B Extract"}, new[]{"Gourmet", "Extract", "Grade A", "Grade B"}),
            ["Ginger"]           = ("kg",  90, 220, 80, 3000, new[]{"Fresh Rhizome", "Organic", "Dried"}, new[]{"Grade A", "Export Grade", "Organic"}),
            ["Green Chillies"]   = ("kg",  80, 200, 40, 1200, new[]{"Bird's Eye", "Cayenne", "Jalapeño", "Serrano"}, new[]{"Grade A", "Export Grade", "Class 1"}),
            ["Sweet Potatoes"]   = ("kg",  35, 90, 150, 6000, new[]{"Orange Flesh", "Purple", "White", "Beauregard"}, new[]{"Grade A", "Grade B", "Class 1"}),
        };

        var listings = new List<Produce>();
        for (int i = 0; i < 1000; i++)
        {
            var farmerIdx = rng.Next(profiles.Count);
            var farmer = profiles[farmerIdx];
            var regionCrops = RegionData.All[farmerDefs[farmerIdx].RegionIndex].Crops;
            var cat = rng.Next(10) < 8 ? regionCrops[rng.Next(regionCrops.Length)] : categories[rng.Next(categories.Length)];
            var det = catDetails[cat];

            DateTime? availableFrom = rng.Next(10) < 3 ? now.AddDays(rng.Next(1, 91)) : null;

            var harvestDaysAgo = rng.Next(0, 30);
            var harvestDate = now.AddDays(-harvestDaysAgo);
            var plantingDate = harvestDate.AddDays(-rng.Next(75, 320));
            var expiryDays = cat == "Roses" ? rng.Next(7, 21) : rng.Next(14, 61);
            var expiryDate = harvestDate.AddDays(expiryDays);

            var variety = det.varieties[rng.Next(det.varieties.Length)];
            var grade = det.grades[rng.Next(det.grades.Length)];
            var qty = Math.Round(det.minQ + rng.NextDouble() * (det.maxQ - det.minQ), 1);
            var price = Math.Round(det.minP + (decimal)(rng.NextDouble() * (double)(det.maxP - det.minP)), 0);
            var exportReady = farmer.AbleToExportDirectly && rng.Next(10) < 6;

            listings.Add(new Produce
            {
                FarmerProfileId = farmer.Id,
                Name = variety,
                Category = cat,
                Description = BuildDescription(cat, variety, grade, qty, det.unit, farmer),
                Price = price,
                Unit = det.unit,
                QuantityAvailable = qty,
                PlantingDate = plantingDate,
                HarvestDate = harvestDate,
                ExpiryDate = expiryDate,
                AvailableFrom = availableFrom,
                IsActive = true,
                IsExportReady = exportReady,
                GradeQuality = grade,
                DeliveryScope = exportReady ? (rng.Next(2) == 0 ? "Export" : "Both") : "Local",
                CreatedAt = availableFrom ?? now.AddDays(-rng.Next(0, 60))
            });
        }
        db.Produce.AddRange(listings);
        await db.SaveChangesAsync();

        // ── Sample ads for the demo seller (james.kamau@farm.ke) ────────────
        // Two live listings + two drafts, so the Account → My Ads view has data.
        var demo = profiles[0];
        var sampleAds = new[]
        {
            new Produce
            {
                FarmerProfileId = demo.Id, Name = "Hass Avocado", Category = "Avocados",
                Description = "Premium export-grade Hass avocados, hand-picked and cold-stored. Consistent 12–16 count, dry matter 23%+.",
                Price = 95, Unit = "kg", QuantityAvailable = 2400.5,
                PlantingDate = now.AddDays(-540), HarvestDate = now.AddDays(-6), ExpiryDate = now.AddDays(28),
                FarmLatitude = demo.FarmLatitude, FarmLongitude = demo.FarmLongitude,
                IsActive = true, IsDraft = false, IsExportReady = true, GradeQuality = "Export Grade",
                DeliveryScope = "Both", CreatedAt = now.AddDays(-6),
            },
            new Produce
            {
                FarmerProfileId = demo.Id, Name = "Fuerte Avocado", Category = "Avocados",
                Description = "Smooth-skinned Fuerte avocados for the fresh local market. Great value, harvested to order.",
                Price = 72, Unit = "kg", QuantityAvailable = 860.25,
                PlantingDate = now.AddDays(-480), HarvestDate = now.AddDays(-2), ExpiryDate = now.AddDays(21),
                FarmLatitude = demo.FarmLatitude, FarmLongitude = demo.FarmLongitude,
                IsActive = true, IsDraft = false, IsExportReady = false, GradeQuality = "Grade A",
                DeliveryScope = "Local", CreatedAt = now.AddDays(-2),
            },
            new Produce
            {
                FarmerProfileId = demo.Id, Name = "Reed Avocado (draft)", Category = "Avocados",
                Description = "Large round Reed avocados — finishing paperwork and photos before publishing.",
                Price = 88, Unit = "kg", QuantityAvailable = 500,
                PlantingDate = now.AddDays(-500), HarvestDate = now.AddDays(7), ExpiryDate = now.AddDays(35),
                FarmLatitude = demo.FarmLatitude, FarmLongitude = demo.FarmLongitude,
                IsActive = true, IsDraft = true, IsExportReady = true, GradeQuality = "Export Grade",
                DeliveryScope = "Export", CreatedAt = now.AddDays(-1),
            },
            new Produce
            {
                FarmerProfileId = demo.Id, Name = "Macadamia Nuts (draft)", Category = "Macadamia Nuts",
                Description = "In-shell macadamia from the estate's new block. Draft — pricing to be confirmed.",
                Price = 380, Unit = "kg", QuantityAvailable = 300,
                PlantingDate = now.AddDays(-900), ExpiryDate = now.AddDays(120),
                FarmLatitude = demo.FarmLatitude, FarmLongitude = demo.FarmLongitude,
                IsActive = true, IsDraft = true, IsExportReady = false, GradeQuality = "Grade 1",
                DeliveryScope = "Local", CreatedAt = now,
            },
        };
        db.Produce.AddRange(sampleAds);
        await db.SaveChangesAsync();

        // ── Commodity buy orders (bids) ─────────────────────────────────────
        var buyerNames = new[]
        {
            "Rotterdam Produce BV", "Gulf Fresh Imports", "Shanghai Green Co", "London Exotics Ltd",
            "Barcelona Fruta SA", "Tokyo Fresh KK", "Nairobi Fresh Ltd", "Cape Town Distributors",
            "Dubai Gulf Foods", "Hamburg Import GmbH", "Mombasa Export House", "Paris Primeurs",
        };

        var kinds = new[] { "Spot", "Limit", "Limit", "Futures", "Futures", "Put" };
        var buyOrders = new List<BuyOrder>();
        for (int i = 0; i < 60; i++)
        {
            var region = RegionData.All[rng.Next(RegionData.All.Length)];
            var cat = region.Crops[rng.Next(region.Crops.Length)];
            var det = catDetails[cat];
            var variety = det.varieties[rng.Next(det.varieties.Length)];
            var grade = det.grades[rng.Next(det.grades.Length)];
            var mid = (det.minP + det.maxP) / 2m;
            var qty = Math.Round(det.minQ * 3 + rng.NextDouble() * (det.maxQ - det.minQ), 0);

            // Mostly buy-side bids, some farmer sell-side offers.
            var side = rng.Next(10) < 7 ? "Buy" : "Sell";
            var kind = kinds[rng.Next(kinds.Length)];
            // Buyers bid below mid; sellers offer above mid — a realistic book.
            var factor = side == "Buy" ? 0.88 + rng.NextDouble() * 0.14 : 1.02 + rng.NextDouble() * 0.16;
            var target = Math.Round(mid * (decimal)factor, 0);
            DateTime? contractDate = kind is "Futures" or "Put" ? now.AddMonths(rng.Next(1, 7)) : null;

            buyOrders.Add(new BuyOrder
            {
                Commodity = cat,
                Variety = variety,
                Grade = grade,
                Unit = det.unit,
                Quantity = qty,
                TargetPrice = target,
                Side = side,
                Kind = kind,
                ContractDate = contractDate,
                Region = region.Name,
                Country = region.Country,
                CountryCode = region.CountryCode,
                Zone = region.Zone,
                BuyerName = side == "Buy" ? buyerNames[rng.Next(buyerNames.Length)] : profiles[rng.Next(profiles.Count)].FarmName,
                BuyerContact = "desk@itunda.example",
                ExportRequired = rng.Next(10) < 6,
                Status = rng.Next(10) < 8 ? BuyOrderStatus.Open : BuyOrderStatus.Matched,
                CreatedAt = now.AddDays(-rng.Next(0, 20)),
                NeededBy = now.AddDays(rng.Next(5, 46)),
            });
        }
        db.BuyOrders.AddRange(buyOrders);
        await db.SaveChangesAsync();
    }

    private static string BuildDescription(string cat, string variety, string grade, double qty, string unit, FarmerProfile farmer)
    {
        var where = $"{farmer.Region}, {farmer.Country}";
        return cat switch
        {
            "Avocados" => $"Fresh {variety} avocados from {farmer.FarmName} in {where}. {grade} certified. {qty}{unit} available. Harvested at optimal ripeness for local and export markets.",
            "Macadamia Nuts" => $"{variety} macadamia from {farmer.FarmName}, {where}. {grade} quality. {qty}{unit} in stock. Carefully dried and sorted for maximum shelf life.",
            "French Beans" => $"Crisp {variety} from {farmer.FarmName} in {where}. {grade}. {qty}{unit} harvested within 24 hours. Ideal for supermarket and export packing.",
            "Tea" => $"{variety} tea leaf from {farmer.FarmName}, {where}. {grade}. {qty}{unit} processed and ready for blending or direct sale.",
            "Peas & Mange Tout" => $"Tender {variety} from {farmer.FarmName} in {where}. {grade}. {qty}{unit} freshly picked, ideal for export chilling.",
            "Passion Fruit" => $"Ripe {variety} from {farmer.FarmName}, {where}. {grade}. {qty}{unit} available. High Brix content, excellent for juice and fresh consumption.",
            "Mangoes" => $"Sweet {variety} mangoes from {farmer.FarmName} in {where}. {grade}. {qty}{unit}. Naturally ripened, low acid, great for juice and fresh eating.",
            "Bananas" => $"Premium {variety} from {farmer.FarmName}, {where}. {grade}. {qty} bunches available. Harvested at green stage for transport.",
            "Tomatoes" => $"Fresh {variety} tomatoes from {farmer.FarmName} in {where}. {grade}. {qty}{unit}. Greenhouse or open-field grown with drip irrigation.",
            "Onions" => $"Dry {variety} from {farmer.FarmName}, {where}. {grade}. {qty}{unit} cured and ready for long storage or immediate market.",
            "Capsicum & Peppers" => $"Bright {variety} from {farmer.FarmName} in {where}. {grade}. {qty}{unit} hand-picked at peak colour.",
            "Roses" => $"Cut {variety} roses from {farmer.FarmName}, {where}. {grade}. {qty} stems available. Cold-chain maintained from farm to market.",
            _ => $"{variety} from {farmer.FarmName}, {where}. {grade}. {qty}{unit} available."
        };
    }
}
