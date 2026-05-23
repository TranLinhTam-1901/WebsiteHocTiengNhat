using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuizzTiengNhat.Migrations
{
    /// <inheritdoc />
    public partial class Updatedb5 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Exam_Sessions",
                columns: table => new
                {
                    SessionID = table.Column<Guid>(type: "uuid", nullable: false),
                    UserID = table.Column<string>(type: "text", nullable: false),
                    ExamID = table.Column<Guid>(type: "uuid", nullable: false),
                    RemainingTime = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastAccessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExamVersion = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Exam_Sessions", x => x.SessionID);
                    table.ForeignKey(
                        name: "FK_Exam_Sessions_Exams_ExamID",
                        column: x => x.ExamID,
                        principalTable: "Exams",
                        principalColumn: "ExamID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Exam_Session_Answers",
                columns: table => new
                {
                    SessionAnswerID = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionID = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestionID = table.Column<Guid>(type: "uuid", nullable: false),
                    SelectedAnswerID = table.Column<Guid>(type: "uuid", nullable: true),
                    TextAnswer = table.Column<string>(type: "text", nullable: true),
                    ResponseTime = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Exam_Session_Answers", x => x.SessionAnswerID);
                    table.ForeignKey(
                        name: "FK_Exam_Session_Answers_Exam_Sessions_SessionID",
                        column: x => x.SessionID,
                        principalTable: "Exam_Sessions",
                        principalColumn: "SessionID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Exam_Session_Answers_SessionID",
                table: "Exam_Session_Answers",
                column: "SessionID");

            migrationBuilder.CreateIndex(
                name: "IX_Exam_Sessions_ExamID",
                table: "Exam_Sessions",
                column: "ExamID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Exam_Session_Answers");

            migrationBuilder.DropTable(
                name: "Exam_Sessions");
        }
    }
}
