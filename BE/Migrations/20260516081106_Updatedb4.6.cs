using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuizzTiengNhat.Migrations
{
    /// <inheritdoc />
    public partial class Updatedb46 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "ExamTemplates",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "Version",
                table: "ExamTemplates",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TemplateVersion",
                table: "Exams",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "ExamTemplates");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "ExamTemplates");

            migrationBuilder.DropColumn(
                name: "TemplateVersion",
                table: "Exams");
        }
    }
}
