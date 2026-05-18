using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuizzTiengNhat.Migrations
{
    /// <inheritdoc />
    public partial class Updatedb47 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "Score",
                table: "Exam_Questions",
                type: "numeric(18,10)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "Score",
                table: "Exam_Questions",
                type: "numeric(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,10)");
        }
    }
}
