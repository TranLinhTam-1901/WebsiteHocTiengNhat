using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QuizzTiengNhat.Data;
using QuizzTiengNhat.Hubs;
using QuizzTiengNhat.Middlewares;
using QuizzTiengNhat.Models;
using QuizzTiengNhat.Providers;
using QuizzTiengNhat.Services;
using QuizzTiengNhat.Services.Learners;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<ApplicationDbContext>(options =>

options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Cấu hình CORS cho phép Frontend gọi API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        // Thay .AllowAnyOrigin() bằng .WithOrigins(...)
        policy.WithOrigins("http://localhost:5173") // URL chính xác của React/Vite
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); // Bắt buộc phải có cho SignalR
    });
});

// 3. Cấu hình Identity để quản lý ApplicationUser và Role (Admin/User)
builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddSingleton<IUserIdProvider, CustomEmailUserIdProvider>();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = builder.Configuration["JWT:Issuer"],
        ValidAudience = builder.Configuration["JWT:Audience"],
        RoleClaimType = ClaimTypes.Role,

        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["JWT:SecretKey"])
        )
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/presenceHub"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddAuthorization();
builder.Services.AddScoped<ITokenService, TokenService>();

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddSignalR(options => {
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(15);
    options.KeepAliveInterval = TimeSpan.FromSeconds(7);
});

// --- Đăng ký các Service cho Hệ thống Học tập ---
builder.Services.AddScoped<IVocabService, VocabService>();
builder.Services.AddScoped<IGrammarService, GrammarService>();
builder.Services.AddScoped<IQuestionService, QuestionService>();
builder.Services.AddScoped<IFlashcardService, FlashcardService>();
builder.Services.AddScoped<IUserProgressService, UserProgressService>();

// Đảm bảo tạo folder wwwroot nếu nó chưa tồn tại để WebRootPath không bị null
if (!Directory.Exists(Path.Combine(builder.Environment.ContentRootPath, "wwwroot")))
{
    Directory.CreateDirectory(Path.Combine(builder.Environment.ContentRootPath, "wwwroot"));
}

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;

    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
    var context = services.GetRequiredService<ApplicationDbContext>(); 

    await DbInitializer.SeedRoles(roleManager);
    await DbInitializer.SeedAdminUser(userManager);
    await Data.Initialize(context);
}
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection(); // Chỉ bắt buộc dùng HTTPS ở môi trường thật
}

app.UseStaticFiles();

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "uploads")),
    RequestPath = "/uploads"
});

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<SingleSessionMiddleware>();

app.MapControllers();

app.MapHub<PresenceHub>("/presenceHub");

app.Run();