using Microsoft.EntityFrameworkCore;
using iTunda.Api.Models;

namespace iTunda.Api.Data;

public class ItundaDbContext : DbContext
{
    public ItundaDbContext(DbContextOptions<ItundaDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<FarmerProfile> FarmerProfiles => Set<FarmerProfile>();
    public DbSet<Produce> Produce => Set<Produce>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Delivery> Deliveries => Set<Delivery>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasOne(u => u.FarmerProfile)
            .WithOne(f => f.User)
            .HasForeignKey<FarmerProfile>(f => f.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<FarmerProfile>()
            .HasMany(f => f.Listings)
            .WithOne(p => p.FarmerProfile)
            .HasForeignKey(p => p.FarmerProfileId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Order>()
            .HasOne(o => o.Buyer)
            .WithMany()
            .HasForeignKey(o => o.BuyerUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<OrderItem>()
            .HasOne(oi => oi.Order)
            .WithMany(o => o.Items)
            .HasForeignKey(oi => oi.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrderItem>()
            .HasOne(oi => oi.Produce)
            .WithMany()
            .HasForeignKey(oi => oi.ProduceId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Delivery>()
            .HasOne(d => d.Order)
            .WithMany()
            .HasForeignKey(d => d.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Produce>()
            .Property(p => p.Price)
            .HasPrecision(10, 2);

        modelBuilder.Entity<Order>()
            .Property(o => o.TotalAmount)
            .HasPrecision(10, 2);

        modelBuilder.Entity<OrderItem>()
            .Property(oi => oi.UnitPriceAtOrder)
            .HasPrecision(10, 2);

        modelBuilder.Entity<Delivery>()
            .Property(d => d.DeliveryFee)
            .HasPrecision(8, 2);
    }
}
