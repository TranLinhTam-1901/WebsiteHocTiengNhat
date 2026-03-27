using Microsoft.AspNetCore.Identity;
using QuizzTiengNhat.Models;
using System.Security.Claims;

namespace QuizzTiengNhat.Middlewares
{
    public class SingleSessionMiddleware
    {
        private readonly RequestDelegate _next;

        public SingleSessionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, UserManager<ApplicationUser> userManager)
        {
            // 1. Bỏ qua các yêu cầu không phải API hoặc yêu cầu tới Hub
            if (!context.Request.Path.StartsWithSegments("/api") ||
                context.Request.Path.StartsWithSegments("/presenceHub"))
            {
                await _next(context);
                return;
            }

            // 2. Kiểm tra nếu đã đăng nhập
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var tokenStamp = context.User.FindFirst("AspNet.Identity.SecurityStamp")?.Value
                                 ?? context.User.FindFirst("SecurityStamp")?.Value;

                if (!string.IsNullOrEmpty(userId) && !string.IsNullOrEmpty(tokenStamp))
                {
                    // TÌM USER (Nên dùng Cache nếu có thể để tăng tốc độ)
                    var user = await userManager.FindByIdAsync(userId);

                    // 3. Nếu Stamp trong Token khác Stamp trong DB -> Đã có người đăng nhập mới/Đổi pass
                    if (user != null && user.SecurityStamp != tokenStamp)
                    {
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        await context.Response.WriteAsJsonAsync(new
                        {
                            message = "Tài khoản đã đăng nhập ở nơi khác.",
                            isForceLogout = true // Flag quan trọng
                        });
                        return;
                    }
                }
            }

            await _next(context);
        }
    }
}