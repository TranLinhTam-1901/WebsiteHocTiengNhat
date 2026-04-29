using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuizzTiengNhat.Migrations
{
    /// <inheritdoc />
    public partial class UpdateExamQuestion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Exam_Questions_Questions_QuestionID",
                table: "Exam_Questions");

            migrationBuilder.AlterColumn<Guid>(
                name: "QuestionID",
                table: "Exam_Questions",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "ListeningID",
                table: "Exam_Questions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReadingID",
                table: "Exam_Questions",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Exam_Questions_ListeningID",
                table: "Exam_Questions",
                column: "ListeningID");

            migrationBuilder.CreateIndex(
                name: "IX_Exam_Questions_ReadingID",
                table: "Exam_Questions",
                column: "ReadingID");

            migrationBuilder.AddForeignKey(
                name: "FK_Exam_Questions_Listenings_ListeningID",
                table: "Exam_Questions",
                column: "ListeningID",
                principalTable: "Listenings",
                principalColumn: "ListeningID");

            migrationBuilder.AddForeignKey(
                name: "FK_Exam_Questions_Questions_QuestionID",
                table: "Exam_Questions",
                column: "QuestionID",
                principalTable: "Questions",
                principalColumn: "QuestionID");

            migrationBuilder.AddForeignKey(
                name: "FK_Exam_Questions_Readings_ReadingID",
                table: "Exam_Questions",
                column: "ReadingID",
                principalTable: "Readings",
                principalColumn: "ReadingID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Exam_Questions_Listenings_ListeningID",
                table: "Exam_Questions");

            migrationBuilder.DropForeignKey(
                name: "FK_Exam_Questions_Questions_QuestionID",
                table: "Exam_Questions");

            migrationBuilder.DropForeignKey(
                name: "FK_Exam_Questions_Readings_ReadingID",
                table: "Exam_Questions");

            migrationBuilder.DropIndex(
                name: "IX_Exam_Questions_ListeningID",
                table: "Exam_Questions");

            migrationBuilder.DropIndex(
                name: "IX_Exam_Questions_ReadingID",
                table: "Exam_Questions");

            migrationBuilder.DropColumn(
                name: "ListeningID",
                table: "Exam_Questions");

            migrationBuilder.DropColumn(
                name: "ReadingID",
                table: "Exam_Questions");

            migrationBuilder.AlterColumn<Guid>(
                name: "QuestionID",
                table: "Exam_Questions",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Exam_Questions_Questions_QuestionID",
                table: "Exam_Questions",
                column: "QuestionID",
                principalTable: "Questions",
                principalColumn: "QuestionID",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
