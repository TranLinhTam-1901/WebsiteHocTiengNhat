using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuizzTiengNhat.Migrations
{
    /// <inheritdoc />
    public partial class addEnums1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SourceID",
                table: "Questions",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SourceID",
                table: "Questions");
        }
    }
}
