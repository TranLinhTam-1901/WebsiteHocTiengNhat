using Microsoft.AspNetCore.Identity;
using QuizzTiengNhat.Models;

namespace QuizzTiengNhat.Data
{
    public static class DbInitializer
    {
        public static async Task SeedRoles(RoleManager<IdentityRole> roleManager)
        {
            if (!await roleManager.RoleExistsAsync(SD.Role_Admin))
                await roleManager.CreateAsync(new IdentityRole(SD.Role_Admin));

            if (!await roleManager.RoleExistsAsync(SD.Role_Learner))
                await roleManager.CreateAsync(new IdentityRole(SD.Role_Learner));
        }

        public static async Task SeedAdminUser(UserManager<ApplicationUser> userManager)
        {
            string adminEmail = "Admin1@quiz.com";
            string adminPassword = "Admin1@quiz.com";

            var adminUser = await userManager.FindByEmailAsync(adminEmail);

            // Nếu admin chưa tồn tại
            if (adminUser == null)
            {
                var user = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    FullName = "System Admin"
                };

                var result = await userManager.CreateAsync(user, adminPassword);

                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, SD.Role_Admin);
                }
            }
        }
    }
}