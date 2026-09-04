using FlowCRM.Application.Common.Interfaces;
using FlowCRM.Application.Common.Security;
using FlowCRM.Domain.Entities;
using FlowCRM.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using TaskStatus = FlowCRM.Domain.Enums.TaskStatus;

namespace FlowCRM.Infrastructure.Persistence;

public sealed class DatabaseSeeder
{
    private readonly FlowCrmDbContext _context;
    private readonly IPasswordHasher _hasher;

    // 1. Users
    public static readonly Guid AdminId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public static readonly Guid ManagerId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    public static readonly Guid SaraId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    public static readonly Guid OmarId = Guid.Parse("44444444-4444-4444-4444-444444444444");

    // 2. Pipeline & Stages
    public static readonly Guid PipelineId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    public static readonly Guid StageQualificationId = Guid.Parse("bbbbbbbb-1111-1111-1111-111111111111");
    public static readonly Guid StageProposalId = Guid.Parse("bbbbbbbb-2222-2222-2222-222222222222");
    public static readonly Guid StageNegotiationId = Guid.Parse("bbbbbbbb-3333-3333-3333-333333333333");
    public static readonly Guid StageWonId = Guid.Parse("bbbbbbbb-4444-4444-4444-444444444444");
    public static readonly Guid StageLostId = Guid.Parse("bbbbbbbb-5555-5555-5555-555555555555");

    // 3. Customers (Gyms, Fitness Clubs & Clinics)
    public static readonly Guid CustFitZoneId = Guid.Parse("cccccccc-1111-1111-1111-111111111111");
    public static readonly Guid CustGoldsId = Guid.Parse("cccccccc-2222-2222-2222-222222222222");
    public static readonly Guid CustIronHouseId = Guid.Parse("cccccccc-3333-3333-3333-333333333333");
    public static readonly Guid CustTitansId = Guid.Parse("cccccccc-4444-4444-4444-444444444444");
    public static readonly Guid CustChampionsId = Guid.Parse("cccccccc-5555-5555-5555-555555555555");
    public static readonly Guid CustApexId = Guid.Parse("cccccccc-6666-6666-6666-666666666666");
    public static readonly Guid CustRoyalFitId = Guid.Parse("cccccccc-7777-7777-7777-777777777777");
    public static readonly Guid CustOxygenId = Guid.Parse("cccccccc-8888-8888-8888-888888888888");
    public static readonly Guid CustBeastModeId = Guid.Parse("cccccccc-9999-9999-9999-999999999999");
    public static readonly Guid CustPowerHouseId = Guid.Parse("cccccccc-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    public DatabaseSeeder(FlowCrmDbContext context, IPasswordHasher hasher)
    {
        _context = context;
        _hasher = hasher;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        // 1. Seed Users
        if (!await _context.Users.AnyAsync(cancellationToken))
        {
            var users = new List<User>
            {
                new()
                {
                    Id = AdminId,
                    FirstName = "Flow",
                    LastName = "Admin",
                    Email = "admin@flowcrm.local",
                    PasswordHash = _hasher.HashPassword("FlowAdmin123!"),
                    Role = UserRole.Admin,
                    IsActive = true
                },
                new()
                {
                    Id = ManagerId,
                    FirstName = "Mariam",
                    LastName = "Saleh",
                    Email = "manager@flowcrm.local",
                    PasswordHash = _hasher.HashPassword("FlowManager123!"),
                    Role = UserRole.Manager,
                    IsActive = true
                },
                new()
                {
                    Id = SaraId,
                    FirstName = "Sara",
                    LastName = "Ahmed",
                    Email = "sara@flowcrm.local",
                    PasswordHash = _hasher.HashPassword("FlowSara123!"),
                    Role = UserRole.SalesRepresentative,
                    IsActive = true
                },
                new()
                {
                    Id = OmarId,
                    FirstName = "Omar",
                    LastName = "Hassan",
                    Email = "omar@flowcrm.local",
                    PasswordHash = _hasher.HashPassword("FlowOmar123!"),
                    Role = UserRole.SalesRepresentative,
                    IsActive = true
                }
            };

            _context.Users.AddRange(users);
            await _context.SaveChangesAsync(cancellationToken);
        }

        // 2. Seed Lead Sources (Gym Supplements Channels)
        var sources = new List<LeadSource>
        {
            new() { Id = 1, Name = "WhatsApp Inquiries" },
            new() { Id = 2, Name = "Instagram Ads & DMs" },
            new() { Id = 3, Name = "In-Person Gym Visit" },
            new() { Id = 4, Name = "Coach & Trainer Referral" },
            new() { Id = 5, Name = "TikTok Fitness Shop" },
            new() { Id = 6, Name = "Website Wholesale Form" }
        };
        foreach (var src in sources)
        {
            if (!await _context.LeadSources.AnyAsync(s => s.Id == src.Id, cancellationToken))
            {
                _context.LeadSources.Add(src);
            }
        }
        await _context.SaveChangesAsync(cancellationToken);

        // 3. Seed Pipeline & Stages (Wholesale & Athlete Order Flow)
        if (!await _context.Pipelines.AnyAsync(p => p.Id == PipelineId, cancellationToken))
        {
            var pipeline = new Pipeline
            {
                Id = PipelineId,
                Name = "Supplements Sales Pipeline",
                IsDefault = true,
                Stages = new List<PipelineStage>
                {
                    new() { Id = StageQualificationId, Name = "Inquiry & Catalog Request", Order = 1, Probability = 20 },
                    new() { Id = StageProposalId, Name = "Wholesale Quotation Sent", Order = 2, Probability = 50 },
                    new() { Id = StageNegotiationId, Name = "Order Review & Payment Terms", Order = 3, Probability = 80 },
                    new() { Id = StageWonId, Name = "Order Confirmed & Dispatched", Order = 4, Probability = 100 },
                    new() { Id = StageLostId, Name = "Cancelled / Stock Out", Order = 5, Probability = 0 }
                }
            };
            _context.Pipelines.Add(pipeline);
            await _context.SaveChangesAsync(cancellationToken);
        }

        // 4. Seed Rich Customers (Gyms, Athletic Clubs & Clinics)
        var customersToSeed = new List<Customer>
        {
            new()
            {
                Id = CustFitZoneId,
                CompanyName = "FitZone Platinum Gym",
                Industry = "Fitness Club & Gym Chain",
                Email = "purchasing@fitzone-gym.example",
                Phone = "+20 2 2770 1200",
                Website = "https://fitzone-gym.example",
                Address = "Plot 44, New Cairo Sports Zone, Cairo",
                AssignedUserId = SaraId,
                Status = "Active"
            },
            new()
            {
                Id = CustGoldsId,
                CompanyName = "Gold's Gym Elite Branch",
                Industry = "Sports & Athletic Center",
                Email = "nutrition@golds-elite.example",
                Phone = "+20 3 4880 3400",
                Website = "https://golds-elite.example",
                Address = "Fouad St, Alexandria",
                AssignedUserId = OmarId,
                Status = "Active"
            },
            new()
            {
                Id = CustIronHouseId,
                CompanyName = "Iron House Crossfit & Strength Club",
                Industry = "CrossFit & Olympic Weightlifting",
                Email = "gear@ironhouse-crossfit.example",
                Phone = "+20 2 2519 4411",
                Website = "https://ironhouse.example",
                Address = "Road 9, Degla, Maadi, Cairo",
                AssignedUserId = SaraId,
                Status = "Active"
            },
            new()
            {
                Id = CustTitansId,
                CompanyName = "Titans Performance & Bodybuilding Center",
                Industry = "Bodybuilding & Sports Science",
                Email = "nutrition@titans-performance.example",
                Phone = "+20 2 3851 9090",
                Website = "https://titans-performance.example",
                Address = "Capital Business Park, Sheikh Zayed, Giza",
                AssignedUserId = OmarId,
                Status = "Active"
            },
            new()
            {
                Id = CustChampionsId,
                CompanyName = "Champions Health & Martial Arts Academy",
                Industry = "Combat Sports & Conditioning",
                Email = "management@champions-academy.example",
                Phone = "+20 2 2634 8100",
                Website = "https://champions-academy.example",
                Address = "El-Hegaz Square, Heliopolis, Cairo",
                AssignedUserId = SaraId,
                Status = "Active"
            },
            new()
            {
                Id = CustApexId,
                CompanyName = "Apex Athlete Rehab & Sports Nutrition Clinic",
                Industry = "Sports Medicine & Clinical Nutrition",
                Email = "clinic@apex-rehab.example",
                Phone = "+20 2 3762 1199",
                Website = "https://apex-rehab.example",
                Address = "Mesaha Square, Dokki, Giza",
                AssignedUserId = OmarId,
                Status = "Active"
            },
            new()
            {
                Id = CustRoyalFitId,
                CompanyName = "Royal Fit Executive Health Club",
                Industry = "Luxury Fitness & Spa Lounge",
                Email = "concierge@royalfit-club.example",
                Phone = "+20 2 2271 6060",
                Website = "https://royalfit-club.example",
                Address = "Abbas El-Akkad, Nasr City, Cairo",
                AssignedUserId = SaraId,
                Status = "Active"
            },
            new()
            {
                Id = CustOxygenId,
                CompanyName = "Oxygen Gym & Wellness Lounge",
                Industry = "Premium Fitness & Wellness",
                Email = "bar@oxygengym.example",
                Phone = "+20 2 2813 5500",
                Website = "https://oxygengym.example",
                Address = "South 90th Street, 5th Settlement, New Cairo",
                AssignedUserId = OmarId,
                Status = "Active"
            },
            new()
            {
                Id = CustBeastModeId,
                CompanyName = "Beast Mode Crossfit Box",
                Industry = "Functional Training & Crossfit",
                Email = "box@beastmode-crossfit.example",
                Phone = "+20 2 2268 7000",
                Website = "https://beastmode-crossfit.example",
                Address = "Ankara Street, Sheraton, Heliopolis, Cairo",
                AssignedUserId = SaraId,
                Status = "Active"
            },
            new()
            {
                Id = CustPowerHouseId,
                CompanyName = "PowerHouse Fitness & Powerlifting Club",
                Industry = "Strength & Powerlifting Gym",
                Email = "frontdesk@powerhouse-gym.example",
                Phone = "+20 2 3338 2900",
                Website = "https://powerhouse-gym.example",
                Address = "Gameat El-Dowal, Mohandessin, Giza",
                AssignedUserId = OmarId,
                Status = "Active"
            }
        };

        foreach (var cust in customersToSeed)
        {
            if (!await _context.Customers.AnyAsync(c => c.Id == cust.Id, cancellationToken))
            {
                _context.Customers.Add(cust);
            }
        }
        await _context.SaveChangesAsync(cancellationToken);

        // 5. Seed Contacts for Customers
        var contactsToSeed = new List<Contact>
        {
            new() { CustomerId = CustFitZoneId, FirstName = "Captain", LastName = "Tarek", JobTitle = "Head Nutritionist & Bar Manager", Email = "tarek@fitzone-gym.example", Phone = "+20 100 555 0101", IsPrimary = true },
            new() { CustomerId = CustGoldsId, FirstName = "Captain", LastName = "Sherif", JobTitle = "Operations Director", Email = "sherif@golds-elite.example", Phone = "+20 122 555 0199", IsPrimary = true },
            new() { CustomerId = CustIronHouseId, FirstName = "Captain", LastName = "Hossam", JobTitle = "Head Coach & Purchasing Lead", Email = "hossam@ironhouse.example", Phone = "+20 111 555 0144", IsPrimary = true },
            new() { CustomerId = CustTitansId, FirstName = "Dr.", LastName = "Ahmed Refaat", JobTitle = "Sports Nutrition Consultant", Email = "refaat@titans-performance.example", Phone = "+20 106 555 0177", IsPrimary = true },
            new() { CustomerId = CustChampionsId, FirstName = "Coach", LastName = "Mina Boulos", JobTitle = "Facility Director", Email = "mina@champions-academy.example", Phone = "+20 128 555 0133", IsPrimary = true },
            new() { CustomerId = CustApexId, FirstName = "Dr.", LastName = "Yasmine Nabil", JobTitle = "Clinic Director & Sports Dietitian", Email = "yasmine@apex-rehab.example", Phone = "+20 102 555 0188", IsPrimary = true },
            new() { CustomerId = CustRoyalFitId, FirstName = "Tamer", LastName = "Helmy", JobTitle = "General Manager", Email = "tamer@royalfit-club.example", Phone = "+20 114 555 0155", IsPrimary = true },
            new() { CustomerId = CustOxygenId, FirstName = "Captain", LastName = "Ziad Mansour", JobTitle = "Nutrition Bar Manager", Email = "ziad@oxygengym.example", Phone = "+20 109 555 0122", IsPrimary = true },
            new() { CustomerId = CustBeastModeId, FirstName = "Coach", LastName = "Nourhan Kamel", JobTitle = "Owner & Head Trainer", Email = "nourhan@beastmode-crossfit.example", Phone = "+20 120 555 0166", IsPrimary = true },
            new() { CustomerId = CustPowerHouseId, FirstName = "Captain", LastName = "Mostafa Goliath", JobTitle = "Strength & Powerlifting Lead", Email = "mostafa@powerhouse-gym.example", Phone = "+20 101 555 0111", IsPrimary = true }
        };

        foreach (var contact in contactsToSeed)
        {
            if (!await _context.Contacts.AnyAsync(c => c.CustomerId == contact.CustomerId && c.Email == contact.Email, cancellationToken))
            {
                _context.Contacts.Add(contact);
            }
        }
        await _context.SaveChangesAsync(cancellationToken);

        // 6. Seed Inbound Leads (Scoped for Sara & Omar)
        var leadsToSeed = new List<Lead>
        {
            // Sara's Leads
            new()
            {
                Id = Guid.Parse("dddddddd-1111-1111-1111-111111111111"),
                FirstName = "Captain",
                LastName = "Tarek",
                CompanyName = "FitZone Platinum Gym",
                Email = "tarek@fitzone-gym.example",
                Phone = "+20 100 555 0101",
                SourceId = 1,
                SourceName = "WhatsApp Inquiries",
                Status = LeadStatus.Qualified,
                AssignedUserId = SaraId,
                EstimatedValue = 45000,
                Notes = "Interested in monthly wholesale shipment: 50 Whey Isolate + 30 Creatine tubs."
            },
            new()
            {
                Id = Guid.Parse("dddddddd-3333-3333-3333-333333333333"),
                FirstName = "Captain",
                LastName = "Hossam",
                CompanyName = "Iron House Crossfit",
                Email = "hossam.crossfit@ironhouse.example",
                Phone = "+20 111 555 0144",
                SourceId = 4,
                SourceName = "Coach & Trainer Referral",
                Status = LeadStatus.New,
                AssignedUserId = SaraId,
                EstimatedValue = 18000,
                Notes = "Coach referral requesting price tier for competition prep supplement stack."
            },
            new()
            {
                Id = Guid.Parse("dddddddd-4444-4444-4444-444444444444"),
                FirstName = "Dr. Kareem",
                LastName = "Fawzy",
                CompanyName = "Alexandria Sports Medical Center",
                Email = "kareem.fawzy@alex-sports.example",
                Phone = "+20 100 888 4422",
                SourceId = 6,
                SourceName = "Website Wholesale Form",
                Status = LeadStatus.Qualified,
                AssignedUserId = SaraId,
                EstimatedValue = 65000,
                Notes = "Private clinic prescribing pharmaceutical-grade Dymatize ISO100 and Animal Pak."
            },
            new()
            {
                Id = Guid.Parse("dddddddd-5555-5555-5555-555555555555"),
                FirstName = "Coach Nourhan",
                LastName = "Kamel",
                CompanyName = "Beast Mode Crossfit Box",
                Email = "nourhan@beastmode-crossfit.example",
                Phone = "+20 120 555 0166",
                SourceId = 2,
                SourceName = "Instagram Ads & DMs",
                Status = LeadStatus.Contacted,
                AssignedUserId = SaraId,
                EstimatedValue = 28000,
                Notes = "Inquired about intra-workout BCAA tubs and wholesale pre-workouts for box members."
            },
            new()
            {
                Id = Guid.Parse("dddddddd-6666-6666-6666-666666666666"),
                FirstName = "Captain Youssef",
                LastName = "Gabr",
                CompanyName = "Smash Tennis & Fitness Club",
                Email = "youssef.gabr@smashtennis.example",
                Phone = "+20 102 777 9933",
                SourceId = 3,
                SourceName = "In-Person Gym Visit",
                Status = LeadStatus.New,
                AssignedUserId = SaraId,
                EstimatedValue = 42000,
                Notes = "Met at Cairo Fitness Expo. Wants sample package for athletic academy bar."
            },
            new()
            {
                Id = Guid.Parse("dddddddd-7777-7777-7777-777777777777"),
                FirstName = "Coach Sarah",
                LastName = "Ezzat",
                CompanyName = "Curves Women Fitness Lounge",
                Email = "sarah.ezzat@curves-egypt.example",
                Phone = "+20 114 333 1155",
                SourceId = 1,
                SourceName = "WhatsApp Inquiries",
                Status = LeadStatus.Qualified,
                AssignedUserId = SaraId,
                EstimatedValue = 22000,
                Notes = "Looking for low-calorie collagen peptides and liquid L-Carnitine wholesale pricing."
            },

            // Omar's Leads
            new()
            {
                Id = Guid.Parse("dddddddd-2222-2222-2222-222222222222"),
                FirstName = "Captain",
                LastName = "Sherif",
                CompanyName = "Gold's Gym Elite Branch",
                Email = "sherif@golds-elite.example",
                Phone = "+20 122 555 0199",
                SourceId = 2,
                SourceName = "Instagram Ads & DMs",
                Status = LeadStatus.Contacted,
                AssignedUserId = OmarId,
                EstimatedValue = 32000,
                Notes = "Pre-workout energy drinks and protein bars restock for supplement shake bar."
            },
            new()
            {
                Id = Guid.Parse("dddddddd-8888-8888-8888-888888888888"),
                FirstName = "Dr. Ahmed",
                LastName = "Refaat",
                CompanyName = "Titans Performance Center",
                Email = "refaat@titans-performance.example",
                Phone = "+20 106 555 0177",
                SourceId = 4,
                SourceName = "Coach & Trainer Referral",
                Status = LeadStatus.Qualified,
                AssignedUserId = OmarId,
                EstimatedValue = 75000,
                Notes = "Customized athlete recovery stacks: 100x Serious Mass + 50x Creatine Monohydrate."
            },
            new()
            {
                Id = Guid.Parse("dddddddd-9999-9999-9999-999999999999"),
                FirstName = "Captain Mostafa",
                LastName = "Goliath",
                CompanyName = "PowerHouse Fitness & Powerlifting",
                Email = "mostafa@powerhouse-gym.example",
                Phone = "+20 101 555 0111",
                SourceId = 5,
                SourceName = "TikTok Fitness Shop",
                Status = LeadStatus.New,
                AssignedUserId = OmarId,
                EstimatedValue = 38000,
                Notes = "Saw viral video on Platinum Creatine purity. Wants 50 tubs for powerlifting athletes."
            },
            new()
            {
                Id = Guid.Parse("dddddddd-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                FirstName = "Moataz",
                LastName = "Samy",
                CompanyName = "FitFormula Nutrition Store",
                Email = "moataz@fitformula-store.example",
                Phone = "+20 115 999 4411",
                SourceId = 6,
                SourceName = "Website Wholesale Form",
                Status = LeadStatus.Qualified,
                AssignedUserId = OmarId,
                EstimatedValue = 90000,
                Notes = "Retail nutrition store requesting wholesale distributor tier for ON and Dymatize products."
            },
            new()
            {
                Id = Guid.Parse("dddddddd-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                FirstName = "Captain Ramy",
                LastName = "El-Sharkawy",
                CompanyName = "Nile Watersports Gym",
                Email = "ramy.sharkawy@nilesports.example",
                Phone = "+20 127 444 8822",
                SourceId = 3,
                SourceName = "In-Person Gym Visit",
                Status = LeadStatus.Contacted,
                AssignedUserId = OmarId,
                EstimatedValue = 26000,
                Notes = "Shake bar restock for summer season: pre-workouts and protein energy drinks."
            },
            new()
            {
                Id = Guid.Parse("dddddddd-cccc-cccc-cccc-cccccccccccc"),
                FirstName = "Captain Ziad",
                LastName = "Mansour",
                CompanyName = "Oxygen Gym & Wellness Lounge",
                Email = "ziad@oxygengym.example",
                Phone = "+20 109 555 0122",
                SourceId = 1,
                SourceName = "WhatsApp Inquiries",
                Status = LeadStatus.Unqualified,
                AssignedUserId = OmarId,
                EstimatedValue = 15000,
                Notes = "Client temporarily paused orders due to new gym floor renovations."

            }
        };

        foreach (var lead in leadsToSeed)
        {
            if (!await _context.Leads.AnyAsync(l => l.Id == lead.Id, cancellationToken))
            {
                _context.Leads.Add(lead);
            }
        }
        await _context.SaveChangesAsync(cancellationToken);

        // 7. Seed Diverse Pipeline Opportunities (Across All 5 Stages)
        var oppsToSeed = new List<Opportunity>
        {
            // Stage 1: Inquiry & Catalog Request (20%)
            new()
            {
                Id = Guid.Parse("eeeeeeee-1111-1111-1111-111111111111"),
                Name = "Iron House - 30x Pre-Workout & BCAA Starter Stack",
                CustomerId = CustIronHouseId,
                PipelineId = PipelineId,
                PipelineStageId = StageQualificationId,
                AssignedUserId = SaraId,
                Value = 24000,
                Probability = 20,
                ExpectedCloseDate = DateTime.UtcNow.AddDays(25),
                Description = "Trial wholesale order for CrossFit athlete store: 20x C4 Pre-Workout + 10x Xtend BCAAs."
            },
            new()
            {
                Id = Guid.Parse("eeeeeeee-2222-2222-2222-222222222222"),
                Name = "Oxygen Lounge - Energy Shakes & Hydration Restock",
                CustomerId = CustOxygenId,
                PipelineId = PipelineId,
                PipelineStageId = StageQualificationId,
                AssignedUserId = OmarId,
                Value = 22000,
                Probability = 20,
                ExpectedCloseDate = DateTime.UtcNow.AddDays(30),
                Description = "Catalog inquiry for RTD protein shakes, hydration BCAAs, and low-carb energy bars."
            },
            new()
            {
                Id = Guid.Parse("eeeeeeee-3333-3333-3333-333333333333"),
                Name = "Beast Mode - Intra-Workout Hydration & Creatine Order",
                CustomerId = CustBeastModeId,
                PipelineId = PipelineId,
                PipelineStageId = StageQualificationId,
                AssignedUserId = SaraId,
                Value = 19500,
                Probability = 20,
                ExpectedCloseDate = DateTime.UtcNow.AddDays(20),
                Description = "Initial inquiry from Coach Nourhan for box athletes: 25 tubs Creatine + 15 tubs BCAAs."
            },

            // Stage 2: Wholesale Quotation Sent (50%)
            new()
            {
                Id = Guid.Parse("eeeeeeee-4444-4444-4444-444444444444"),
                Name = "Champions Health Academy - 60x Gold Standard Whey + 40x Creatine",
                CustomerId = CustChampionsId,
                PipelineId = PipelineId,
                PipelineStageId = StageProposalId,
                AssignedUserId = SaraId,
                Value = 48000,
                Probability = 50,
                ExpectedCloseDate = DateTime.UtcNow.AddDays(18),
                Description = "Formal quote sent to Facility Director Coach Mina. Includes 10% volume discount."
            },
            new()
            {
                Id = Guid.Parse("eeeeeeee-5555-5555-5555-555555555555"),
                Name = "PowerHouse Club - Powerlifting Creatine & Mass Gainer Tier 1",
                CustomerId = CustPowerHouseId,
                PipelineId = PipelineId,
                PipelineStageId = StageProposalId,
                AssignedUserId = OmarId,
                Value = 35000,
                Probability = 50,
                ExpectedCloseDate = DateTime.UtcNow.AddDays(14),
                Description = "Official wholesale quote delivered to Captain Goliath for powerlifting championship team."
            },
            new()
            {
                Id = Guid.Parse("eeeeeeee-6666-6666-6666-666666666666"),
                Name = "Oxygen Lounge - Premium ISO100 Protein Shake Bar Restock",
                CustomerId = CustOxygenId,
                PipelineId = PipelineId,
                PipelineStageId = StageProposalId,
                AssignedUserId = OmarId,
                Value = 31000,
                Probability = 50,
                ExpectedCloseDate = DateTime.UtcNow.AddDays(12),
                Description = "Quotation sent for 25 tubs Dymatize ISO100 Gourmet Vanilla + 15 tubs Double Chocolate."
            },

            // Stage 3: Order Review & Payment Terms (80%)
            new()
            {
                Id = Guid.Parse("eeeeeeee-7777-7777-7777-777777777777"),
                Name = "FitZone Platinum - 50 Tubs Whey Isolate + 30 Creatine Wholesale",
                CustomerId = CustFitZoneId,
                PipelineId = PipelineId,
                PipelineStageId = StageNegotiationId,
                AssignedUserId = SaraId,
                Value = 45000,
                Probability = 80,
                ExpectedCloseDate = DateTime.UtcNow.AddDays(7),
                Description = "Monthly recurring bulk supply order for FitZone Gym shake bar. Reviewing Net 30 terms."
            },
            new()
            {
                Id = Guid.Parse("eeeeeeee-8888-8888-8888-888888888888"),
                Name = "Titans Performance - 100x Serious Mass + 80x Dymatize ISO100",
                CustomerId = CustTitansId,
                PipelineId = PipelineId,
                PipelineStageId = StageNegotiationId,
                AssignedUserId = OmarId,
                Value = 95000,
                Probability = 80,
                ExpectedCloseDate = DateTime.UtcNow.AddDays(10),
                Description = "Quarterly bulk order for bodybuilding team. Reviewing installment payment schedule with Dr. Refaat."
            },
            new()
            {
                Id = Guid.Parse("eeeeeeee-9999-9999-9999-999999999999"),
                Name = "Apex Athlete Clinic - Clinical Nutrition & Animal Pak Vitamins Order",
                CustomerId = CustApexId,
                PipelineId = PipelineId,
                PipelineStageId = StageNegotiationId,
                AssignedUserId = OmarId,
                Value = 54000,
                Probability = 80,
                ExpectedCloseDate = DateTime.UtcNow.AddDays(8),
                Description = "Sports rehab clinic order for athlete recovery: 30x Animal Pak + 25x ISO100 Hydrolyzed."
            },

            // Stage 4: Order Confirmed & Dispatched (100% - Closed Won)
            new()
            {
                Id = Guid.Parse("eeeeeeee-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                Name = "FitZone Platinum - Pre-Workout & BCAA Restock Package",
                CustomerId = CustFitZoneId,
                PipelineId = PipelineId,
                PipelineStageId = StageWonId,
                AssignedUserId = SaraId,
                Value = 28000,
                Probability = 100,
                ExpectedCloseDate = DateTime.UtcNow.AddDays(-5),
                Description = "Delivered and paid in full. Tub replenishment reminder scheduled for 30 days."
            },
            new()
            {
                Id = Guid.Parse("eeeeeeee-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                Name = "Gold's Gym Elite - Annual High-Protein Wholesale Supply Q3",
                CustomerId = CustGoldsId,
                PipelineId = PipelineId,
                PipelineStageId = StageWonId,
                AssignedUserId = OmarId,
                Value = 110000,
                Probability = 100,
                ExpectedCloseDate = DateTime.UtcNow.AddDays(-2),
                Description = "Annual wholesale contract confirmed. First consignment of 150 protein tubs dispatched."
            },
            new()
            {
                Id = Guid.Parse("eeeeeeee-cccc-cccc-cccc-cccccccccccc"),
                Name = "Royal Fit Health Club - Platinum Whey 50x Batch Delivery",
                CustomerId = CustRoyalFitId,
                PipelineId = PipelineId,
                PipelineStageId = StageWonId,
                AssignedUserId = SaraId,
                Value = 42000,
                Probability = 100,
                ExpectedCloseDate = DateTime.UtcNow.AddDays(-1),
                Description = "Dispatched and stocked at VIP health club shake counter. Invoice paid via bank transfer."
            },

            // Stage 5: Cancelled / Stock Out (0% - Closed Lost)
            new()
            {
                Id = Guid.Parse("eeeeeeee-dddd-dddd-dddd-dddddddddddd"),
                Name = "Delta Sports Academy - 40x Imported Mass Gainer (Customs Delay)",
                CustomerId = CustGoldsId,
                PipelineId = PipelineId,
                PipelineStageId = StageLostId,
                AssignedUserId = OmarId,
                Value = 31000,
                Probability = 0,
                ExpectedCloseDate = DateTime.UtcNow.AddDays(-10),
                Description = "Order cancelled due to delayed international shipment clearance. Client rescheduled for next quarter."
            },
            new()
            {
                Id = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
                Name = "Giza Olympic Gym - Off-Season Bulk Order (Budget Postponed)",
                CustomerId = CustChampionsId,
                PipelineId = PipelineId,
                PipelineStageId = StageLostId,
                AssignedUserId = SaraId,
                Value = 18000,
                Probability = 0,
                ExpectedCloseDate = DateTime.UtcNow.AddDays(-14),
                Description = "Management board deferred procurement budget until winter competitive season."
            }
        };

        foreach (var opp in oppsToSeed)
        {
            if (!await _context.Opportunities.AnyAsync(o => o.Id == opp.Id, cancellationToken))
            {
                _context.Opportunities.Add(opp);
            }
        }
        await _context.SaveChangesAsync(cancellationToken);

        // 8. Seed Tasks (Supplement Follow-ups & Replenishments)
        var tasksToSeed = new List<TaskItem>
        {
            new()
            {
                Id = Guid.Parse("ffffffff-1111-1111-1111-111111111111"),
                Title = "Whey Protein 30-Day Replenishment Check",
                Description = "Follow up with Captain Tarek on FitZone protein tub replenishment.",
                DueDate = DateTime.UtcNow.Date.AddHours(16),
                Priority = TaskPriority.High,
                Status = TaskStatus.Pending,
                AssignedUserId = SaraId,
                CreatedById = AdminId,
                CustomerId = CustFitZoneId
            },
            new()
            {
                Id = Guid.Parse("ffffffff-2222-2222-2222-222222222222"),
                Title = "WhatsApp Captain Sherif: Review C4 Pre-Workout Wholesale Quotation",
                Description = "Provide Applied Nutrition wholesale tiers to Captain Sherif at Gold's Gym.",
                DueDate = DateTime.UtcNow.Date.AddDays(1).AddHours(11),
                Priority = TaskPriority.Medium,
                Status = TaskStatus.InProgress,
                AssignedUserId = OmarId,
                CreatedById = AdminId,
                CustomerId = CustGoldsId
            },
            new()
            {
                Id = Guid.Parse("ffffffff-3333-3333-3333-333333333333"),
                Title = "Send Animal Pak & Multi-Vitamins Price Sheet to Iron House",
                Description = "Email detailed specification sheet for Universal Animal Pak to Captain Hossam.",
                DueDate = DateTime.UtcNow.Date.AddDays(2).AddHours(14),
                Priority = TaskPriority.Medium,
                Status = TaskStatus.Pending,
                AssignedUserId = SaraId,
                CreatedById = AdminId,
                CustomerId = CustIronHouseId
            },
            new()
            {
                Id = Guid.Parse("ffffffff-4444-4444-4444-444444444444"),
                Title = "Follow-up on Net 30 Payment Terms with Champions Fitness",
                Description = "Coordinate with accounting department and Coach Mina regarding wholesale invoice terms.",
                DueDate = DateTime.UtcNow.Date.AddDays(3).AddHours(10),
                Priority = TaskPriority.High,
                Status = TaskStatus.Pending,
                AssignedUserId = SaraId,
                CreatedById = AdminId,
                CustomerId = CustChampionsId
            },
            new()
            {
                Id = Guid.Parse("ffffffff-5555-5555-5555-555555555555"),
                Title = "Schedule Nutrition Bar Restock Meeting with Titans Gym",
                Description = "In-person visit to Sheikh Zayed facility with Dr. Ahmed Refaat for quarterly replenishment.",
                DueDate = DateTime.UtcNow.Date.AddDays(1).AddHours(15),
                Priority = TaskPriority.High,
                Status = TaskStatus.InProgress,
                AssignedUserId = OmarId,
                CreatedById = AdminId,
                CustomerId = CustTitansId
            },
            new()
            {
                Id = Guid.Parse("ffffffff-6666-6666-6666-666666666666"),
                Title = "Prepare wholesale invoice for 50x Gold Standard Whey",
                Description = "Generated tax invoice with 10% wholesale discount for FitZone Gym.",
                DueDate = DateTime.UtcNow.Date.AddDays(-2),
                Priority = TaskPriority.Medium,
                Status = TaskStatus.Completed,
                CompletedAt = DateTime.UtcNow.AddDays(-2),
                AssignedUserId = SaraId,
                CreatedById = AdminId,
                CustomerId = CustFitZoneId
            },
            new()
            {
                Id = Guid.Parse("ffffffff-7777-7777-7777-777777777777"),
                Title = "Call Dr. Yasmine at Apex Clinic regarding hydrolyzed batch availability",
                Description = "Verify Dymatize ISO100 batch expiration dates and COA laboratory testing certificate.",
                DueDate = DateTime.UtcNow.Date.AddDays(1).AddHours(13),
                Priority = TaskPriority.High,
                Status = TaskStatus.Pending,
                AssignedUserId = OmarId,
                CreatedById = AdminId,
                CustomerId = CustApexId
            },
            new()
            {
                Id = Guid.Parse("ffffffff-8888-8888-8888-888888888888"),
                Title = "Send sample flavors of Dymatize ISO100 to Beast Mode Crossfit",
                Description = "Deliver sample satchels (Fudge Brownie & Gourmet Vanilla) for athlete feedback.",
                DueDate = DateTime.UtcNow.Date.AddDays(4).AddHours(12),
                Priority = TaskPriority.Low,
                Status = TaskStatus.InProgress,
                AssignedUserId = SaraId,
                CreatedById = AdminId,
                CustomerId = CustBeastModeId
            },
            new()
            {
                Id = Guid.Parse("ffffffff-9999-9999-9999-999999999999"),
                Title = "Follow-up with PowerHouse Club on bulk creatine delivery confirmation",
                Description = "Confirm arrival of 50 jars MuscleTech Platinum Creatine at Mohandessin branch.",
                DueDate = DateTime.UtcNow.Date.AddDays(-1),
                Priority = TaskPriority.Medium,
                Status = TaskStatus.Completed,
                CompletedAt = DateTime.UtcNow.AddDays(-1),
                AssignedUserId = OmarId,
                CreatedById = AdminId,
                CustomerId = CustPowerHouseId
            },
            new()
            {
                Id = Guid.Parse("ffffffff-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                Title = "Check warehouse stock levels for Optimum Serious Mass 5kg",
                Description = "Verify pallet availability at Cairo logistics hub for Titans Gym bulk order.",
                DueDate = DateTime.UtcNow.Date.AddHours(18),
                Priority = TaskPriority.High,
                Status = TaskStatus.Pending,
                AssignedUserId = SaraId,
                CreatedById = AdminId,
                CustomerId = CustFitZoneId
            }
        };

        foreach (var task in tasksToSeed)
        {
            if (!await _context.Tasks.AnyAsync(t => t.Id == task.Id, cancellationToken))
            {
                _context.Tasks.Add(task);
            }
        }
        await _context.SaveChangesAsync(cancellationToken);

        // 9. Seed Activities (Calls, Meetings, Emails & Notes on Customer Timelines)
        var activitiesToSeed = new List<Activity>
        {
            new()
            {
                Id = Guid.Parse("11110000-1111-1111-1111-111111111111"),
                Type = ActivityType.Call,
                Subject = "Discovery call with Captain Tarek regarding monthly supplement demand",
                Description = "Reviewed FitZone Platinum member influx and high demand for Gold Standard Whey & Creatine.",
                ActivityDate = DateTime.UtcNow.AddDays(-4),
                UserId = SaraId,
                CustomerId = CustFitZoneId
            },
            new()
            {
                Id = Guid.Parse("11110000-2222-2222-2222-222222222222"),
                Type = ActivityType.Meeting,
                Subject = "In-person product demo & shake bar sampling at Gold's Gym",
                Description = "Sampled Dymatize ISO100 Gourmet Vanilla and C4 Pre-workout with Captain Sherif and training staff.",
                ActivityDate = DateTime.UtcNow.AddDays(-3),
                UserId = OmarId,
                CustomerId = CustGoldsId
            },
            new()
            {
                Id = Guid.Parse("11110000-3333-3333-3333-333333333333"),
                Type = ActivityType.Email,
                Subject = "Wholesale catalog & tier-pricing sheet sent to Iron House Crossfit",
                Description = "Delivered PDF wholesale price schedule with volume discounts for Olympic weightlifters.",
                ActivityDate = DateTime.UtcNow.AddDays(-2),
                UserId = SaraId,
                CustomerId = CustIronHouseId
            },
            new()
            {
                Id = Guid.Parse("11110000-4444-4444-4444-444444444444"),
                Type = ActivityType.Call,
                Subject = "Consultation call with Dr. Ahmed Refaat on Mass Gainer formulation",
                Description = "Discussed enzyme blend in Optimum Serious Mass and athlete bulking targets for upcoming championship.",
                ActivityDate = DateTime.UtcNow.AddDays(-1),
                UserId = OmarId,
                CustomerId = CustTitansId
            },
            new()
            {
                Id = Guid.Parse("11110000-5555-5555-5555-555555555555"),
                Type = ActivityType.Meeting,
                Subject = "Wholesale contract review with Facility Director Coach Mina",
                Description = "Finalized quotation review for 60x Whey and 40x Creatine jars with Champions Academy.",
                ActivityDate = DateTime.UtcNow.AddHours(-18),
                UserId = SaraId,
                CustomerId = CustChampionsId
            },
            new()
            {
                Id = Guid.Parse("11110000-6666-6666-6666-666666666666"),
                Type = ActivityType.Note,
                Subject = "Delivery Confirmation: 50 Tubs Platinum Whey Dispatched",
                Description = "Consignment received at Royal Fit Health Club shake counter. Verified intact tamper seals.",
                ActivityDate = DateTime.UtcNow.AddHours(-6),
                UserId = SaraId,
                CustomerId = CustRoyalFitId
            }
        };

        foreach (var act in activitiesToSeed)
        {
            if (!await _context.Activities.AnyAsync(a => a.Id == act.Id, cancellationToken))
            {
                _context.Activities.Add(act);
            }
        }
        await _context.SaveChangesAsync(cancellationToken);

        // 10. Seed Gym Supplement Products Catalog (12 Top Brands)
        var productsToSeed = new List<Product>
        {
            new()
            {
                Id = Guid.Parse("99990000-1111-1111-1111-111111111111"),
                Name = "Optimum Nutrition Gold Standard 100% Whey",
                Category = "Protein",
                Sku = "ON-WHEY-CHOC-2KG",
                FlavorOrSize = "Double Rich Chocolate · 2.27kg (74 Servings)",
                UnitPrice = 3200m,
                CostPrice = 2400m,
                StockQuantity = 120,
                LowStockThreshold = 15,
                Description = "World's #1 selling whey protein isolate powder for post-workout muscle recovery and lean growth.",
                IsActive = true
            },
            new()
            {
                Id = Guid.Parse("99990000-2222-2222-2222-222222222222"),
                Name = "Dymatize ISO100 Hydrolyzed Whey Isolate",
                Category = "Protein",
                Sku = "DYM-ISO100-VAN-2KG",
                FlavorOrSize = "Gourmet Vanilla · 2.3kg (76 Servings)",
                UnitPrice = 3900m,
                CostPrice = 3000m,
                StockQuantity = 45,
                LowStockThreshold = 10,
                Description = "Ultra-fast absorbing hydrolyzed 100% whey protein isolate with zero fat, low carb, and zero sugar.",
                IsActive = true
            },
            new()
            {
                Id = Guid.Parse("99990000-3333-3333-3333-333333333333"),
                Name = "MuscleTech Platinum 100% Creatine Monohydrate",
                Category = "Creatine",
                Sku = "MT-CREATINE-400G",
                FlavorOrSize = "Unflavored · 400g (80 Servings)",
                UnitPrice = 1100m,
                CostPrice = 750m,
                StockQuantity = 85,
                LowStockThreshold = 20,
                Description = "HPLC-tested ultra-pure micronized creatine monohydrate for lean muscle, explosive ATP power, and strength.",
                IsActive = true
            },
            new()
            {
                Id = Guid.Parse("99990000-4444-4444-4444-444444444444"),
                Name = "Cellucor C4 Original Pre-Workout",
                Category = "Pre-Workout",
                Sku = "CEL-C4-BLUE-30SERV",
                FlavorOrSize = "Icy Blue Razz · 30 Servings (180g)",
                UnitPrice = 1450m,
                CostPrice = 950m,
                StockQuantity = 60,
                LowStockThreshold = 12,
                Description = "Explosive energy pre-workout supplement with CarnoSyn Beta-Alanine, Creatine Nitrate, and Caffeine.",
                IsActive = true
            },
            new()
            {
                Id = Guid.Parse("99990000-5555-5555-5555-555555555555"),
                Name = "Scivation Xtend Original BCAA Formula",
                Category = "Amino & BCAAs",
                Sku = "XTEND-BCAA-WMELON-90",
                FlavorOrSize = "Watermelon Explosion · 90 Servings (1.2kg)",
                UnitPrice = 2100m,
                CostPrice = 1500m,
                StockQuantity = 35,
                LowStockThreshold = 10,
                Description = "7g of clinically researched 2:1:1 BCAAs with hydrating electrolytes for intra-workout endurance.",
                IsActive = true
            },
            new()
            {
                Id = Guid.Parse("99990000-6666-6666-6666-666666666666"),
                Name = "Optimum Nutrition Serious Mass High-Calorie Gainer",
                Category = "Mass Gainer",
                Sku = "ON-SMASS-CHOC-5KG",
                FlavorOrSize = "Chocolate · 5.44kg (16 Huge Servings)",
                UnitPrice = 3600m,
                CostPrice = 2700m,
                StockQuantity = 25,
                LowStockThreshold = 8,
                Description = "1,250 calories and 50g of protein per serving for serious mass, rapid weight gain, and muscle recovery.",
                IsActive = true
            },
            new()
            {
                Id = Guid.Parse("99990000-7777-7777-7777-777777777777"),
                Name = "Universal Nutrition Animal Pak Performance Multivitamin",
                Category = "Vitamins & Health",
                Sku = "ANIMAL-PAK-44PK",
                FlavorOrSize = "44 Training Packs",
                UnitPrice = 1850m,
                CostPrice = 1300m,
                StockQuantity = 40,
                LowStockThreshold = 10,
                Description = "The ultimate foundation training pack loaded with 85+ nutrients, amino acids, antioxidants, and digestive enzymes.",
                IsActive = true
            },
            new()
            {
                Id = Guid.Parse("99990000-8888-8888-8888-888888888888"),
                Name = "Applied Nutrition ABE All Black Everything Pre-Workout",
                Category = "Pre-Workout",
                Sku = "ABE-ENERGY-30SERV",
                FlavorOrSize = "Energy Flavour · 30 Servings (315g)",
                UnitPrice = 1550m,
                CostPrice = 1050m,
                StockQuantity = 50,
                LowStockThreshold = 10,
                Description = "High-stimulant UK pre-workout powder with TeaCrine, Dynamine, Citrulline Malate, and Beta-Alanine.",
                IsActive = true
            },
            new()
            {
                Id = Guid.Parse("99990000-9999-9999-9999-999999999999"),
                Name = "BSN SYNTHA-6 Ultra-Premium Protein Matrix",
                Category = "Protein",
                Sku = "BSN-SYNTHA6-STRAW-2KG",
                FlavorOrSize = "Strawberry Milkshake · 2.27kg (48 Servings)",
                UnitPrice = 2950m,
                CostPrice = 2100m,
                StockQuantity = 30,
                LowStockThreshold = 8,
                Description = "Multi-functional 6-source protein powder blend providing sustained amino acid release and legendary milkshake taste.",
                IsActive = true
            },
            new()
            {
                Id = Guid.Parse("99990000-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                Name = "Rule 1 R1 Protein 100% Pure Whey Isolate & Hydrolysate",
                Category = "Protein",
                Sku = "R1-ISOLATE-FUDGE-2KG",
                FlavorOrSize = "Fudge Brownie · 2.27kg (76 Servings)",
                UnitPrice = 3750m,
                CostPrice = 2850m,
                StockQuantity = 38,
                LowStockThreshold = 10,
                Description = "Flagship pure whey isolate and hydrolysate blend with zero gums, zero creamers, zero amino spiking.",
                IsActive = true
            },
            new()
            {
                Id = Guid.Parse("99990000-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                Name = "Kevin Levrone Signature Series Anabolic Mass Gainer",
                Category = "Mass Gainer",
                Sku = "LEV-ANABOLIC-MASS-7KG",
                FlavorOrSize = "White Chocolate · 7kg (58 Servings)",
                UnitPrice = 4200m,
                CostPrice = 3100m,
                StockQuantity = 20,
                LowStockThreshold = 5,
                Description = "Heavyweight athlete anabolic gainer enriched with D-Aspartic Acid, Fenugreek extract, and HMB.",
                IsActive = true
            },
            new()
            {
                Id = Guid.Parse("99990000-cccc-cccc-cccc-cccccccccccc"),
                Name = "Nutrex Research L-Carnitine 3000 Liquid",
                Category = "Weight Management",
                Sku = "NUTREX-CARN-APPLE-473",
                FlavorOrSize = "Green Apple · 473ml (31 Servings)",
                UnitPrice = 980m,
                CostPrice = 620m,
                StockQuantity = 55,
                LowStockThreshold = 15,
                Description = "Fast-acting liquid L-Carnitine supplying 3000mg per serving to support fatty acid breakdown into cellular energy.",
                IsActive = true
            }
        };

        foreach (var prod in productsToSeed)
        {
            if (!await _context.Products.AnyAsync(p => p.Sku == prod.Sku, cancellationToken))
            {
                _context.Products.Add(prod);
            }
        }
        await _context.SaveChangesAsync(cancellationToken);
    }
}
