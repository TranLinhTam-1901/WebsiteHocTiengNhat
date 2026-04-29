using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuizzTiengNhat.Migrations
{
    /// <inheritdoc />
    public partial class Updatedb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CourseID",
                table: "Exams",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsCheckpoint",
                table: "Exams",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "OrderIndex",
                table: "Exams",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Exam_Result_Details",
                columns: table => new
                {
                    ResultDetailID = table.Column<Guid>(type: "uuid", nullable: false),
                    ResultID = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestionID = table.Column<Guid>(type: "uuid", nullable: false),
                    IsCorrect = table.Column<bool>(type: "boolean", nullable: false),
                    ResponseTime = table.Column<int>(type: "integer", nullable: false),
                    TopicID = table.Column<Guid>(type: "uuid", nullable: true),
                    SkillType = table.Column<int>(type: "integer", nullable: true),
                    ReadingID = table.Column<Guid>(type: "uuid", nullable: true),
                    ListeningID = table.Column<Guid>(type: "uuid", nullable: true),
                    ExamQuestionID = table.Column<Guid>(type: "uuid", nullable: true),
                    ExamsExamID = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Exam_Result_Details", x => x.ResultDetailID);
                    table.ForeignKey(
                        name: "FK_Exam_Result_Details_Exam_Questions_ExamQuestionID",
                        column: x => x.ExamQuestionID,
                        principalTable: "Exam_Questions",
                        principalColumn: "ExamQuestionID",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Exam_Result_Details_Exam_Results_ResultID",
                        column: x => x.ResultID,
                        principalTable: "Exam_Results",
                        principalColumn: "ResultID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Exam_Result_Details_Exams_ExamsExamID",
                        column: x => x.ExamsExamID,
                        principalTable: "Exams",
                        principalColumn: "ExamID");
                    table.ForeignKey(
                        name: "FK_Exam_Result_Details_Listenings_ListeningID",
                        column: x => x.ListeningID,
                        principalTable: "Listenings",
                        principalColumn: "ListeningID",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Exam_Result_Details_Questions_QuestionID",
                        column: x => x.QuestionID,
                        principalTable: "Questions",
                        principalColumn: "QuestionID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Exam_Result_Details_Readings_ReadingID",
                        column: x => x.ReadingID,
                        principalTable: "Readings",
                        principalColumn: "ReadingID",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Exam_Result_Details_Topics_TopicID",
                        column: x => x.TopicID,
                        principalTable: "Topics",
                        principalColumn: "TopicID",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "User_Skill_Matrices",
                columns: table => new
                {
                    MatrixID = table.Column<Guid>(type: "uuid", nullable: false),
                    UserID = table.Column<string>(type: "text", nullable: false),
                    SkillType = table.Column<int>(type: "integer", nullable: false),
                    ProficiencyScore = table.Column<int>(type: "integer", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LevelID = table.Column<Guid>(type: "uuid", nullable: true),
                    NeedsReview = table.Column<bool>(type: "boolean", nullable: false),
                    Confidence = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_User_Skill_Matrices", x => x.MatrixID);
                    table.ForeignKey(
                        name: "FK_User_Skill_Matrices_AspNetUsers_UserID",
                        column: x => x.UserID,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_User_Skill_Matrices_JLPT_Levels_LevelID",
                        column: x => x.LevelID,
                        principalTable: "JLPT_Levels",
                        principalColumn: "LevelID",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Exams_CourseID",
                table: "Exams",
                column: "CourseID");

            migrationBuilder.CreateIndex(
                name: "IX_Exam_Result_Details_ExamQuestionID",
                table: "Exam_Result_Details",
                column: "ExamQuestionID");

            migrationBuilder.CreateIndex(
                name: "IX_Exam_Result_Details_ExamsExamID",
                table: "Exam_Result_Details",
                column: "ExamsExamID");

            migrationBuilder.CreateIndex(
                name: "IX_Exam_Result_Details_ListeningID",
                table: "Exam_Result_Details",
                column: "ListeningID");

            migrationBuilder.CreateIndex(
                name: "IX_Exam_Result_Details_QuestionID",
                table: "Exam_Result_Details",
                column: "QuestionID");

            migrationBuilder.CreateIndex(
                name: "IX_Exam_Result_Details_ReadingID",
                table: "Exam_Result_Details",
                column: "ReadingID");

            migrationBuilder.CreateIndex(
                name: "IX_Exam_Result_Details_ResultID",
                table: "Exam_Result_Details",
                column: "ResultID");

            migrationBuilder.CreateIndex(
                name: "IX_Exam_Result_Details_TopicID",
                table: "Exam_Result_Details",
                column: "TopicID");

            migrationBuilder.CreateIndex(
                name: "IX_User_Skill_Matrices_LevelID",
                table: "User_Skill_Matrices",
                column: "LevelID");

            migrationBuilder.CreateIndex(
                name: "IX_User_Skill_Matrices_UserID_SkillType",
                table: "User_Skill_Matrices",
                columns: new[] { "UserID", "SkillType" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Exams_Courses_CourseID",
                table: "Exams",
                column: "CourseID",
                principalTable: "Courses",
                principalColumn: "CourseID",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Exams_Courses_CourseID",
                table: "Exams");

            migrationBuilder.DropTable(
                name: "Exam_Result_Details");

            migrationBuilder.DropTable(
                name: "User_Skill_Matrices");

            migrationBuilder.DropIndex(
                name: "IX_Exams_CourseID",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "CourseID",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "IsCheckpoint",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "OrderIndex",
                table: "Exams");
        }
    }
}
