using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuizzTiengNhat.Migrations
{
    /// <inheritdoc />
    public partial class Updatedb52 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SelectedAnswerID",
                table: "Exam_Result_Details",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TextAnswer",
                table: "Exam_Result_Details",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SelectedAnswerID",
                table: "Exam_Result_Details");

            migrationBuilder.DropColumn(
                name: "TextAnswer",
                table: "Exam_Result_Details");
        }
    }
}
