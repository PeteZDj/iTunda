using iTunda.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace iTunda.Api.Data;

public static class SeedData
{
    public static async Task SeedAsync(ItundaDbContext db)
    {
        if (await db.Users.AnyAsync()) return;

        var passwordHash = BCrypt.Net.BCrypt.HashPassword("Password123!");

        // ── 15 Kenyan farmers ──────────────────────────────────────────────
        var farmerUsers = new[]
        {
            new User { Name="James Kamau",    Email="james.kamau@farm.ke",    PasswordHash=passwordHash, Role=UserRole.Farmer },
            new User { Name="Grace Wanjiku",  Email="grace.wanjiku@farm.ke",  PasswordHash=passwordHash, Role=UserRole.Farmer },
            new User { Name="Peter Omondi",   Email="peter.omondi@farm.ke",   PasswordHash=passwordHash, Role=UserRole.Farmer },
            new User { Name="Fatuma Hassan",  Email="fatuma.hassan@farm.ke",  PasswordHash=passwordHash, Role=UserRole.Farmer },
            new User { Name="Samuel Kipchoge",Email="samuel.kipchoge@farm.ke",PasswordHash=passwordHash, Role=UserRole.Farmer },
            new User { Name="Mary Njeri",     Email="mary.njeri@farm.ke",     PasswordHash=passwordHash, Role=UserRole.Farmer },
            new User { Name="David Mwangi",   Email="david.mwangi@farm.ke",   PasswordHash=passwordHash, Role=UserRole.Farmer },
            new User { Name="Rose Achieng",   Email="rose.achieng@farm.ke",   PasswordHash=passwordHash, Role=UserRole.Farmer },
            new User { Name="John Mutua",     Email="john.mutua@farm.ke",     PasswordHash=passwordHash, Role=UserRole.Farmer },
            new User { Name="Esther Wafula",  Email="esther.wafula@farm.ke",  PasswordHash=passwordHash, Role=UserRole.Farmer },
            new User { Name="Moses Kariuki",  Email="moses.kariuki@farm.ke",  PasswordHash=passwordHash, Role=UserRole.Farmer },
            new User { Name="Agnes Chebet",   Email="agnes.chebet@farm.ke",   PasswordHash=passwordHash, Role=UserRole.Farmer },
            new User { Name="Daniel Otieno",  Email="daniel.otieno@farm.ke",  PasswordHash=passwordHash, Role=UserRole.Farmer },
            new User { Name="Naomi Wambua",   Email="naomi.wambua@farm.ke",   PasswordHash=passwordHash, Role=UserRole.Farmer },
            new User { Name="Isaac Ngetich",  Email="isaac.ngetich@farm.ke",  PasswordHash=passwordHash, Role=UserRole.Farmer },
        };
        db.Users.AddRange(farmerUsers);
        await db.SaveChangesAsync();

        // Buyer demo accounts
        var buyerUsers = new[]
        {
            new User { Name="Nairobi Fresh Ltd",      Email="orders@nairobifresh.ke",  PasswordHash=passwordHash, Role=UserRole.Buyer },
            new User { Name="Nakumatt Exporters",     Email="buy@nakumatt-export.ke",  PasswordHash=passwordHash, Role=UserRole.Buyer },
            new User { Name="Java House Procurement", Email="supply@javahouseke.ke",   PasswordHash=passwordHash, Role=UserRole.Buyer },
        };
        db.Users.AddRange(buyerUsers);
        await db.SaveChangesAsync();

        // ── Farmer profiles with real Kenyan GPS coords ────────────────────
        var profiles = new[]
        {
            new FarmerProfile {
                UserId=farmerUsers[0].Id, FarmName="Kamau Avocado Estate",
                Description="Third-generation avocado grower in Murang'a with Hass and Fuerte varieties. Export-certified since 2015.",
                Experience="15 years", Specialization="Avocados",
                Certifications="GlobalG.A.P, KFC Export Cert",
                LocationCounty="Murang'a", LocationSubCounty="Kangema", LocationTown="Kangema",
                FarmLatitude=-0.7614, FarmLongitude=36.9553,
                SizeOfFarmAcres=45, AbleToExportDirectly=true,
                ExportsDomain="EU, Middle East", Phone="+254712345001",
                RatingFarmer=4.8, OrdersFulfilled=312 },

            new FarmerProfile {
                UserId=farmerUsers[1].Id, FarmName="Wanjiku Green Beans Farm",
                Description="Specialising in fine French beans and snow peas for Nairobi supermarkets and export.",
                Experience="8 years", Specialization="French Beans",
                Certifications="KFC, KEPHIS Phytosanitary",
                LocationCounty="Nyeri", LocationSubCounty="Tetu", LocationTown="Karatina",
                FarmLatitude=-0.4837, FarmLongitude=36.9984,
                SizeOfFarmAcres=18, AbleToExportDirectly=false,
                ExportsDomain="UK", Phone="+254712345002",
                RatingFarmer=4.6, OrdersFulfilled=189 },

            new FarmerProfile {
                UserId=farmerUsers[2].Id, FarmName="Omondi Mango Orchard",
                Description="Large mango orchard on the shores of Lake Victoria. Apple and Tommy Atkins varieties.",
                Experience="20 years", Specialization="Mangoes",
                Certifications="Organic Kenya Cert",
                LocationCounty="Kisumu", LocationSubCounty="Seme", LocationTown="Luanda",
                FarmLatitude=-0.0863, FarmLongitude=34.7543,
                SizeOfFarmAcres=60, AbleToExportDirectly=true,
                ExportsDomain="Middle East, East Africa", Phone="+254712345003",
                RatingFarmer=4.7, OrdersFulfilled=256 },

            new FarmerProfile {
                UserId=farmerUsers[3].Id, FarmName="Hassan Coastal Horticulture",
                Description="Passion fruit, bananas and tropical produce from the Coast region.",
                Experience="12 years", Specialization="Passion Fruit",
                Certifications="KFC",
                LocationCounty="Kilifi", LocationSubCounty="Malindi", LocationTown="Malindi",
                FarmLatitude=-3.2175, FarmLongitude=40.1169,
                SizeOfFarmAcres=32, AbleToExportDirectly=false,
                ExportsDomain="Middle East", Phone="+254712345004",
                RatingFarmer=4.5, OrdersFulfilled=143 },

            new FarmerProfile {
                UserId=farmerUsers[4].Id, FarmName="Kipchoge Highlands Tea",
                Description="Premium CTC and orthodox tea from the Nandi Hills. KTDA-registered.",
                Experience="25 years", Specialization="Tea",
                Certifications="Rainforest Alliance, KTDA",
                LocationCounty="Nandi", LocationSubCounty="Nandi Hills", LocationTown="Nandi Hills",
                FarmLatitude=0.1042, FarmLongitude=35.1727,
                SizeOfFarmAcres=120, AbleToExportDirectly=true,
                ExportsDomain="UK, China, Pakistan", Phone="+254712345005",
                RatingFarmer=4.9, OrdersFulfilled=478 },

            new FarmerProfile {
                UserId=farmerUsers[5].Id, FarmName="Njeri Onion Fields",
                Description="Red creole and white onion specialist from Kajiado plains.",
                Experience="10 years", Specialization="Onions",
                Certifications="KFC",
                LocationCounty="Kajiado", LocationSubCounty="Kajiado Central", LocationTown="Kajiado",
                FarmLatitude=-1.8515, FarmLongitude=36.7820,
                SizeOfFarmAcres=28, AbleToExportDirectly=false,
                ExportsDomain="East Africa", Phone="+254712345006",
                RatingFarmer=4.4, OrdersFulfilled=201 },

            new FarmerProfile {
                UserId=farmerUsers[6].Id, FarmName="Mwangi Macadamia Co-op",
                Description="Macadamia nut grower and processor in Mt Kenya foothills. In-shell and kernel supply.",
                Experience="18 years", Specialization="Macadamia Nuts",
                Certifications="GlobalG.A.P, Fairtrade",
                LocationCounty="Kirinyaga", LocationSubCounty="Gichugu", LocationTown="Kerugoya",
                FarmLatitude=-0.4880, FarmLongitude=37.2757,
                SizeOfFarmAcres=55, AbleToExportDirectly=true,
                ExportsDomain="USA, EU, Japan", Phone="+254712345007",
                RatingFarmer=4.8, OrdersFulfilled=389 },

            new FarmerProfile {
                UserId=farmerUsers[7].Id, FarmName="Achieng Tomato Hub",
                Description="Year-round tomato supply from greenhouses in Kisii highlands.",
                Experience="7 years", Specialization="Tomatoes",
                Certifications="KEPHIS",
                LocationCounty="Kisii", LocationSubCounty="Kisii Central", LocationTown="Kisii",
                FarmLatitude=-0.6817, FarmLongitude=34.7669,
                SizeOfFarmAcres=15, AbleToExportDirectly=false,
                ExportsDomain="East Africa", Phone="+254712345008",
                RatingFarmer=4.3, OrdersFulfilled=167 },

            new FarmerProfile {
                UserId=farmerUsers[8].Id, FarmName="Mutua Capsicum Gardens",
                Description="Red, yellow and green capsicum peppers from Machakos semi-arid zone using drip irrigation.",
                Experience="9 years", Specialization="Capsicum & Peppers",
                Certifications="KFC, KEPHIS",
                LocationCounty="Machakos", LocationSubCounty="Mwala", LocationTown="Mwala",
                FarmLatitude=-1.2983, FarmLongitude=37.4524,
                SizeOfFarmAcres=22, AbleToExportDirectly=false,
                ExportsDomain="UK, Netherlands", Phone="+254712345009",
                RatingFarmer=4.6, OrdersFulfilled=220 },

            new FarmerProfile {
                UserId=farmerUsers[9].Id, FarmName="Wafula Banana Plantation",
                Description="Cavendish and tissue-culture banana plantation in Trans Nzoia.",
                Experience="14 years", Specialization="Bananas",
                Certifications="KFC",
                LocationCounty="Trans Nzoia", LocationSubCounty="Kiminini", LocationTown="Kiminini",
                FarmLatitude=1.0310, FarmLongitude=35.0014,
                SizeOfFarmAcres=80, AbleToExportDirectly=false,
                ExportsDomain="East Africa", Phone="+254712345010",
                RatingFarmer=4.5, OrdersFulfilled=298 },

            new FarmerProfile {
                UserId=farmerUsers[10].Id, FarmName="Kariuki Rose Farm",
                Description="Commercial cut-flower rose farm in Naivasha supplying Nairobi and export markets.",
                Experience="16 years", Specialization="Roses",
                Certifications="Fairtrade, MPS-A",
                LocationCounty="Nakuru", LocationSubCounty="Naivasha", LocationTown="Naivasha",
                FarmLatitude=-0.7167, FarmLongitude=36.4333,
                SizeOfFarmAcres=40, AbleToExportDirectly=true,
                ExportsDomain="Netherlands, UK, UAE", Phone="+254712345011",
                RatingFarmer=4.9, OrdersFulfilled=512 },

            new FarmerProfile {
                UserId=farmerUsers[11].Id, FarmName="Chebet Peas & Legumes",
                Description="Snow peas, sugar snaps and mange tout from the Rift Valley highlands.",
                Experience="11 years", Specialization="Peas & Mange Tout",
                Certifications="GlobalG.A.P",
                LocationCounty="Elgeyo Marakwet", LocationSubCounty="Keiyo South", LocationTown="Iten",
                FarmLatitude=0.6706, FarmLongitude=35.5088,
                SizeOfFarmAcres=25, AbleToExportDirectly=true,
                ExportsDomain="UK, Netherlands", Phone="+254712345012",
                RatingFarmer=4.7, OrdersFulfilled=334 },

            new FarmerProfile {
                UserId=farmerUsers[12].Id, FarmName="Otieno Lake Region Produce",
                Description="Mixed horticulture near Lake Victoria including avocados, tomatoes and onions.",
                Experience="13 years", Specialization="Avocados",
                Certifications="KFC",
                LocationCounty="Homa Bay", LocationSubCounty="Rachuonyo North", LocationTown="Kendu Bay",
                FarmLatitude=-0.3573, FarmLongitude=34.6489,
                SizeOfFarmAcres=35, AbleToExportDirectly=false,
                ExportsDomain="East Africa", Phone="+254712345013",
                RatingFarmer=4.4, OrdersFulfilled=178 },

            new FarmerProfile {
                UserId=farmerUsers[13].Id, FarmName="Wambua Dryland Passion",
                Description="Passion fruit cultivation adapted to Makueni's semi-arid climate using rainwater harvesting.",
                Experience="6 years", Specialization="Passion Fruit",
                Certifications="Organic Kenya Cert",
                LocationCounty="Makueni", LocationSubCounty="Mbooni", LocationTown="Mbooni",
                FarmLatitude=-1.6465, FarmLongitude=37.6268,
                SizeOfFarmAcres=20, AbleToExportDirectly=false,
                ExportsDomain="East Africa", Phone="+254712345014",
                RatingFarmer=4.3, OrdersFulfilled=112 },

            new FarmerProfile {
                UserId=farmerUsers[14].Id, FarmName="Ngetich Uasin Gishu Farm",
                Description="Large mixed farm in the breadbasket of Kenya — macadamia, French beans, roses.",
                Experience="22 years", Specialization="Macadamia Nuts",
                Certifications="GlobalG.A.P, Rainforest Alliance",
                LocationCounty="Uasin Gishu", LocationSubCounty="Kapsabet", LocationTown="Eldoret",
                FarmLatitude=0.5212, FarmLongitude=35.2699,
                SizeOfFarmAcres=95, AbleToExportDirectly=true,
                ExportsDomain="USA, EU", Phone="+254712345015",
                RatingFarmer=4.8, OrdersFulfilled=421 },
        };
        db.FarmerProfiles.AddRange(profiles);
        await db.SaveChangesAsync();

        // ── 1000 produce listings ──────────────────────────────────────────
        var rng = new Random(42);
        var now = DateTime.UtcNow;

        var categories = new[]
        {
            "Avocados", "Macadamia Nuts", "French Beans", "Tea",
            "Peas & Mange Tout", "Passion Fruit", "Mangoes", "Bananas",
            "Tomatoes", "Onions", "Capsicum & Peppers", "Roses"
        };

        // Category details: (unit, price range per unit, qty range, varieties, grade)
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
        };

        // Preferred categories per farmer
        var farmerCategories = new Dictionary<int, string[]>
        {
            [0]  = new[]{"Avocados"},
            [1]  = new[]{"French Beans", "Peas & Mange Tout"},
            [2]  = new[]{"Mangoes", "Bananas"},
            [3]  = new[]{"Passion Fruit", "Mangoes"},
            [4]  = new[]{"Tea"},
            [5]  = new[]{"Onions", "Tomatoes"},
            [6]  = new[]{"Macadamia Nuts", "Avocados"},
            [7]  = new[]{"Tomatoes", "Capsicum & Peppers"},
            [8]  = new[]{"Capsicum & Peppers", "Onions"},
            [9]  = new[]{"Bananas"},
            [10] = new[]{"Roses"},
            [11] = new[]{"Peas & Mange Tout", "French Beans"},
            [12] = new[]{"Avocados", "Tomatoes", "Onions"},
            [13] = new[]{"Passion Fruit"},
            [14] = new[]{"Macadamia Nuts", "French Beans", "Roses"},
        };

        var listings = new List<Produce>();

        for (int i = 0; i < 1000; i++)
        {
            var farmerIdx = rng.Next(15);
            var farmer = profiles[farmerIdx];
            var preferred = farmerCategories[farmerIdx];
            var cat = rng.Next(10) < 8 ? preferred[rng.Next(preferred.Length)] : categories[rng.Next(categories.Length)];
            var det = catDetails[cat];

            // 30% of listings are future/scheduled posts (AvailableFrom in next 1-90 days)
            DateTime? availableFrom = rng.Next(10) < 3
                ? now.AddDays(rng.Next(1, 91))
                : null;

            // Harvest 0-30 days ago; expiry 7-60 days from harvest
            var harvestDaysAgo = rng.Next(0, 30);
            var harvestDate = now.AddDays(-harvestDaysAgo);
            var expiryDays = cat == "Roses" ? rng.Next(7, 21) : rng.Next(14, 61);
            var expiryDate = harvestDate.AddDays(expiryDays);

            var variety = det.varieties[rng.Next(det.varieties.Length)];
            var grade = det.grades[rng.Next(det.grades.Length)];
            var qty = Math.Round(det.minQ + rng.NextDouble() * (det.maxQ - det.minQ), 1);
            var price = det.minP + (decimal)(rng.NextDouble() * (double)(det.maxP - det.minP));
            price = Math.Round(price, 0);

            var exportReady = farmer.AbleToExportDirectly && rng.Next(10) < 6;

            listings.Add(new Produce
            {
                FarmerProfileId = farmer.Id,
                Name = variety,
                Category = cat,
                Description = BuildDescription(cat, variety, grade, (double)qty, det.unit, farmer),
                Price = price,
                Unit = det.unit,
                QuantityAvailable = qty,
                HarvestDate = harvestDate,
                ExpiryDate = expiryDate,
                AvailableFrom = availableFrom,
                IsActive = true,
                IsExportReady = exportReady,
                GradeQuality = grade,
                CreatedAt = availableFrom ?? now.AddDays(-rng.Next(0, 60))
            });
        }

        db.Produce.AddRange(listings);
        await db.SaveChangesAsync();
    }

    private static string BuildDescription(string cat, string variety, string grade, double qty, string unit, FarmerProfile farmer)
    {
        return cat switch
        {
            "Avocados" => $"Fresh {variety} avocados from {farmer.FarmName} in {farmer.LocationCounty}. {grade} certified. {qty}{unit} available. Harvested at optimal ripeness for local and export markets.",
            "Macadamia Nuts" => $"{variety} macadamia from {farmer.FarmName}, {farmer.LocationCounty}. {grade} quality. {qty}{unit} in stock. Carefully dried and sorted for maximum shelf life.",
            "French Beans" => $"Crisp {variety} from {farmer.FarmName} in {farmer.LocationCounty}. {grade}. {qty}{unit} harvested within 24 hours. Ideal for supermarket and export packing.",
            "Tea" => $"{variety} tea leaf from {farmer.FarmName}, {farmer.LocationCounty}. {grade}. {qty}{unit} processed and ready for blending or direct sale.",
            "Peas & Mange Tout" => $"Tender {variety} from {farmer.FarmName} in {farmer.LocationCounty}. {grade}. {qty}{unit} freshly picked, ideal for export chilling.",
            "Passion Fruit" => $"Ripe {variety} from {farmer.FarmName}, {farmer.LocationCounty}. {grade}. {qty}{unit} available. High Brix content, excellent for juice and fresh consumption.",
            "Mangoes" => $"Sweet {variety} mangoes from {farmer.FarmName} in {farmer.LocationCounty}. {grade}. {qty}{unit}. Naturally ripened, low acid, great for juice and fresh eating.",
            "Bananas" => $"Premium {variety} from {farmer.FarmName}, {farmer.LocationCounty}. {grade}. {qty} bunches available. Harvested at green stage for transport.",
            "Tomatoes" => $"Fresh {variety} tomatoes from {farmer.FarmName} in {farmer.LocationCounty}. {grade}. {qty}{unit}. Greenhouse or open-field grown with drip irrigation.",
            "Onions" => $"Dry {variety} from {farmer.FarmName}, {farmer.LocationCounty}. {grade}. {qty}{unit} cured and ready for long storage or immediate market.",
            "Capsicum & Peppers" => $"Bright {variety} from {farmer.FarmName} in {farmer.LocationCounty}. {grade}. {qty}{unit} hand-picked at peak colour.",
            "Roses" => $"Cut {variety} roses from {farmer.FarmName}, {farmer.LocationCounty}. {grade}. {qty} stems available. Cold-chain maintained from farm to market.",
            _ => $"{variety} from {farmer.FarmName}, {farmer.LocationCounty}. {grade}. {qty}{unit} available."
        };
    }
}
