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
            var path = context.Request.Path;

            // Chỉ kiểm tra phiên cho API và negotiate / websocket của SignalR
            var needsSessionValidation =
                path.StartsWithSegments("/api")
                || path.StartsWithSegments("/presenceHub")
                || path.StartsWithSegments("/chatHub");

            if (!needsSessionValidation)
            {
                await _next(context);
                return;
            }

            if (context.User.Identity?.IsAuthenticated == true)
            {
                var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var tokenStamp = context.User.FindFirst("AspNet.Identity.SecurityStamp")?.Value
                                 ?? context.User.FindFirst("SecurityStamp")?.Value;

                if (!string.IsNullOrEmpty(userId) && !string.IsNullOrEmpty(tokenStamp))
                {
                    var user = await userManager.FindByIdAsync(userId);

                    if (user != null && user.SecurityStamp != tokenStamp)
                    {
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        await context.Response.WriteAsJsonAsync(new
                        {
                            message = "Tài khoản đã đăng nhập ở nơi khác.",
                            isForceLogout = true
                        });
                        return;
                    }
                }
            }

            await _next(context);
        }
    }
}
