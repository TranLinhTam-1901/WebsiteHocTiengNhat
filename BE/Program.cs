using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using QuizzTiengNhat.Configurations;
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
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
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
            if (!string.IsNullOrEmpty(accessToken) &&
                (path.StartsWithSegments("/presenceHub") || path.StartsWithSegments("/chatHub")))
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

builder.Services.Configure<FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = 32_768_000;
});

builder.Services.AddAuthorization();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IChatService, ChatService>();

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddSignalR(options =>
{
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(15);
    options.KeepAliveInterval = TimeSpan.FromSeconds(7);
});

// --- Đăng ký các Service cho Hệ thống Học tập ---
builder.Services.AddScoped<IVocabService, VocabService>();
builder.Services.AddScoped<IGrammarService, GrammarService>();
builder.Services.AddScoped<IFlashcardService, FlashcardService>();
builder.Services.AddScoped<IQuestionService, QuestionService>();
builder.Services.AddScoped<IUserProgressService, UserProgressService>();

builder.Services.Configure<OllamaOptions>(builder.Configuration.GetSection(OllamaOptions.SectionName));
builder.Services.Configure<VoicevoxOptions>(builder.Configuration.GetSection(VoicevoxOptions.SectionName));
builder.Services.Configure<WhisperOptions>(builder.Configuration.GetSection(WhisperOptions.SectionName));
builder.Services.AddHttpClient<IWhisperSpeechToTextService, WhisperSpeechToTextService>((sp, client) =>
{
    var opt = sp.GetRequiredService<IOptions<WhisperOptions>>().Value;
    var baseUrl = opt.BaseUrl.Trim();
    if (!baseUrl.EndsWith('/'))
        baseUrl += "/";
    client.BaseAddress = new Uri(baseUrl);
    client.Timeout = TimeSpan.FromSeconds(Math.Max(15, opt.TimeoutSeconds));
});
builder.Services.AddHttpClient<IOllamaTutorService, OllamaTutorService>((sp, client) =>
{
    var opt = sp.GetRequiredService<IOptions<OllamaOptions>>().Value;
    client.BaseAddress = new Uri(opt.BaseUrl.TrimEnd('/') + "/");
    client.Timeout = TimeSpan.FromSeconds(Math.Max(10, opt.TimeoutSeconds));
});

builder.Services.AddHttpClient<IVoicevoxTtsService, VoicevoxTtsService>((sp, client) =>
{
    var opt = sp.GetRequiredService<IOptions<VoicevoxOptions>>().Value;
    // Đảm bảo URL kết thúc bằng dấu / để không bị lỗi cộng chuỗi
    client.BaseAddress = new Uri(opt.BaseUrl.TrimEnd('/') + "/");
    // Tăng timeout vì Voicevox tạo file audio khá chậm (tầm 30-60s)
    client.Timeout = TimeSpan.FromSeconds(Math.Max(30, opt.TimeoutSeconds));
});

builder.Services.AddScoped<ITutorArchiveService, TutorArchiveService>();
builder.Services.AddSingleton<IBrowserSessionHubCoordinator, BrowserSessionHubCoordinator>();

// Đảm bảo tạo folder wwwroot nếu nó chưa tồn tại để WebRootPath không bị null
if (!Directory.Exists(Path.Combine(builder.Environment.ContentRootPath, "wwwroot")))
{
    Directory.CreateDirectory(Path.Combine(builder.Environment.ContentRootPath, "wwwroot"));
}

var tutorAudioDir = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "uploads", "tutor-audio");
if (!Directory.Exists(tutorAudioDir))
{
    Directory.CreateDirectory(tutorAudioDir);
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
    app.UseHttpsRedirection();
}

app.UseStaticFiles(); // Cho wwwroot chuẩn

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "uploads")),
    RequestPath = "/uploads",
    // Cho phép trình duyệt phát audio tốt hơn
    OnPrepareResponse = ctx => {
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
        ctx.Context.Response.Headers.Append("Accept-Ranges", "bytes");
    }
});

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<SingleSessionMiddleware>();

app.MapControllers();

app.MapHub<PresenceHub>("/presenceHub");
app.MapHub<ChatHub>("/chatHub");

app.Run();