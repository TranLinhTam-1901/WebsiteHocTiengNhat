using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuizzTiengNhat.Migrations
{
    /// <inheritdoc />
    public partial class InitialV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Lessons_JLPT_Levels_LevelID",
                table: "Lessons");

            migrationBuilder.DropForeignKey(
                name: "FK_Questions_JLPT_Levels_JLPT_LevelLevelID",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "LevelID",
                table: "Questions");

            migrationBuilder.RenameColumn(
                name: "JLPT_LevelLevelID",
                table: "Questions",
                newName: "ParentID");

            migrationBuilder.RenameIndex(
                name: "IX_Questions_JLPT_LevelLevelID",
                table: "Questions",
                newName: "IX_Questions_ParentID");

            migrationBuilder.RenameColumn(
                name: "LevelID",
                table: "Lessons",
                newName: "CourseID");

            migrationBuilder.RenameIndex(
                name: "IX_Lessons_LevelID",
                table: "Lessons",
                newName: "IX_Lessons_CourseID");

            migrationBuilder.AddColumn<Guid>(
                name: "EquivalentID",
                table: "Questions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MediaTimestamp",
                table: "Questions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Questions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "Courses",
                columns: table => new
                {
                    CourseID = table.Column<Guid>(type: "uuid", nullable: false),
                    CourseName = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    LevelID = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Courses", x => x.CourseID);
                    table.ForeignKey(
                        name: "FK_Courses_JLPT_Levels_LevelID",
                        column: x => x.LevelID,
                        principalTable: "JLPT_Levels",
                        principalColumn: "LevelID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Kanjis",
                columns: table => new
                {
                    KanjiID = table.Column<Guid>(type: "uuid", nullable: false),
                    Character = table.Column<string>(type: "text", nullable: false),
                    Onyomi = table.Column<string>(type: "text", nullable: false),
                    Kunyomi = table.Column<string>(type: "text", nullable: false),
                    Meaning = table.Column<string>(type: "text", nullable: false),
                    LessonID = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Kanjis", x => x.KanjiID);
                    table.ForeignKey(
                        name: "FK_Kanjis_Lessons_LessonID",
                        column: x => x.LessonID,
                        principalTable: "Lessons",
                        principalColumn: "LessonsID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Topics",
                columns: table => new
                {
                    TopicID = table.Column<Guid>(type: "uuid", nullable: false),
                    TopicName = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Topics", x => x.TopicID);
                });

            migrationBuilder.CreateTable(
                name: "Grammars",
                columns: table => new
                {
                    GrammarID = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Structure = table.Column<string>(type: "text", nullable: false),
                    Explanation = table.Column<string>(type: "text", nullable: false),
                    Example = table.Column<string>(type: "text", nullable: false),
                    LessonID = table.Column<Guid>(type: "uuid", nullable: false),
                    TopicID = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Grammars", x => x.GrammarID);
                    table.ForeignKey(
                        name: "FK_Grammars_Lessons_LessonID",
                        column: x => x.LessonID,
                        principalTable: "Lessons",
                        principalColumn: "LessonsID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Grammars_Topics_TopicID",
                        column: x => x.TopicID,
                        principalTable: "Topics",
                        principalColumn: "TopicID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Lessons_Topics",
                columns: table => new
                {
                    LessonsID = table.Column<Guid>(type: "uuid", nullable: false),
                    TopicID = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Lessons_Topics", x => new { x.LessonsID, x.TopicID });
                    table.ForeignKey(
                        name: "FK_Lessons_Topics_Lessons_LessonsID",
                        column: x => x.LessonsID,
                        principalTable: "Lessons",
                        principalColumn: "LessonsID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Lessons_Topics_Topics_TopicID",
                        column: x => x.TopicID,
                        principalTable: "Topics",
                        principalColumn: "TopicID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Listenings",
                columns: table => new
                {
                    ListeningID = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    AudioURL = table.Column<string>(type: "text", nullable: false),
                    Transcript = table.Column<string>(type: "text", nullable: false),
                    LessonID = table.Column<Guid>(type: "uuid", nullable: false),
                    TopicID = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Listenings", x => x.ListeningID);
                    table.ForeignKey(
                        name: "FK_Listenings_Lessons_LessonID",
                        column: x => x.LessonID,
                        principalTable: "Lessons",
                        principalColumn: "LessonsID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Listenings_Topics_TopicID",
                        column: x => x.TopicID,
                        principalTable: "Topics",
                        principalColumn: "TopicID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Questions_Topics",
                columns: table => new
                {
                    QuestionID = table.Column<Guid>(type: "uuid", nullable: false),
                    TopicID = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Questions_Topics", x => new { x.QuestionID, x.TopicID });
                    table.ForeignKey(
                        name: "FK_Questions_Topics_Questions_QuestionID",
                        column: x => x.QuestionID,
                        principalTable: "Questions",
                        principalColumn: "QuestionID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Questions_Topics_Topics_TopicID",
                        column: x => x.TopicID,
                        principalTable: "Topics",
                        principalColumn: "TopicID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Readings",
                columns: table => new
                {
                    ReadingID = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    Translation = table.Column<string>(type: "text", nullable: false),
                    LessonID = table.Column<Guid>(type: "uuid", nullable: false),
                    TopicID = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Readings", x => x.ReadingID);
                    table.ForeignKey(
                        name: "FK_Readings_Lessons_LessonID",
                        column: x => x.LessonID,
                        principalTable: "Lessons",
                        principalColumn: "LessonsID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Readings_Topics_TopicID",
                        column: x => x.TopicID,
                        principalTable: "Topics",
                        principalColumn: "TopicID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Vocabularies",
                columns: table => new
                {
                    VocabID = table.Column<Guid>(type: "uuid", nullable: false),
                    Word = table.Column<string>(type: "text", nullable: false),
                    Reading = table.Column<string>(type: "text", nullable: false),
                    Meaning = table.Column<string>(type: "text", nullable: false),
                    AudioURL = table.Column<string>(type: "text", nullable: false),
                    Example = table.Column<string>(type: "text", nullable: false),
                    LessonID = table.Column<Guid>(type: "uuid", nullable: false),
                    TopicID = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vocabularies", x => x.VocabID);
                    table.ForeignKey(
                        name: "FK_Vocabularies_Lessons_LessonID",
                        column: x => x.LessonID,
                        principalTable: "Lessons",
                        principalColumn: "LessonsID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Vocabularies_Topics_TopicID",
                        column: x => x.TopicID,
                        principalTable: "Topics",
                        principalColumn: "TopicID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Courses_LevelID",
                table: "Courses",
                column: "LevelID");

            migrationBuilder.CreateIndex(
                name: "IX_Grammars_LessonID",
                table: "Grammars",
                column: "LessonID");

            migrationBuilder.CreateIndex(
                name: "IX_Grammars_TopicID",
                table: "Grammars",
                column: "TopicID");

            migrationBuilder.CreateIndex(
                name: "IX_Kanjis_LessonID",
                table: "Kanjis",
                column: "LessonID");

            migrationBuilder.CreateIndex(
                name: "IX_Lessons_Topics_TopicID",
                table: "Lessons_Topics",
                column: "TopicID");

            migrationBuilder.CreateIndex(
                name: "IX_Listenings_LessonID",
                table: "Listenings",
                column: "LessonID");

            migrationBuilder.CreateIndex(
                name: "IX_Listenings_TopicID",
                table: "Listenings",
                column: "TopicID");

            migrationBuilder.CreateIndex(
                name: "IX_Questions_Topics_TopicID",
                table: "Questions_Topics",
                column: "TopicID");

            migrationBuilder.CreateIndex(
                name: "IX_Readings_LessonID",
                table: "Readings",
                column: "LessonID");

            migrationBuilder.CreateIndex(
                name: "IX_Readings_TopicID",
                table: "Readings",
                column: "TopicID");

            migrationBuilder.CreateIndex(
                name: "IX_Vocabularies_LessonID",
                table: "Vocabularies",
                column: "LessonID");

            migrationBuilder.CreateIndex(
                name: "IX_Vocabularies_TopicID",
                table: "Vocabularies",
                column: "TopicID");

            migrationBuilder.AddForeignKey(
                name: "FK_Lessons_Courses_CourseID",
                table: "Lessons",
                column: "CourseID",
                principalTable: "Courses",
                principalColumn: "CourseID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Questions_Questions_ParentID",
                table: "Questions",
                column: "ParentID",
                principalTable: "Questions",
                principalColumn: "QuestionID",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Lessons_Courses_CourseID",
                table: "Lessons");

            migrationBuilder.DropForeignKey(
                name: "FK_Questions_Questions_ParentID",
                table: "Questions");

            migrationBuilder.DropTable(
                name: "Courses");

            migrationBuilder.DropTable(
                name: "Grammars");

            migrationBuilder.DropTable(
                name: "Kanjis");

            migrationBuilder.DropTable(
                name: "Lessons_Topics");

            migrationBuilder.DropTable(
                name: "Listenings");

            migrationBuilder.DropTable(
                name: "Questions_Topics");

            migrationBuilder.DropTable(
                name: "Readings");

            migrationBuilder.DropTable(
                name: "Vocabularies");

            migrationBuilder.DropTable(
                name: "Topics");

            migrationBuilder.DropColumn(
                name: "EquivalentID",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "MediaTimestamp",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Questions");

            migrationBuilder.RenameColumn(
                name: "ParentID",
                table: "Questions",
                newName: "JLPT_LevelLevelID");

            migrationBuilder.RenameIndex(
                name: "IX_Questions_ParentID",
                table: "Questions",
                newName: "IX_Questions_JLPT_LevelLevelID");

            migrationBuilder.RenameColumn(
                name: "CourseID",
                table: "Lessons",
                newName: "LevelID");

            migrationBuilder.RenameIndex(
                name: "IX_Lessons_CourseID",
                table: "Lessons",
                newName: "IX_Lessons_LevelID");

            migrationBuilder.AddColumn<Guid>(
                name: "LevelID",
                table: "Questions",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddForeignKey(
                name: "FK_Lessons_JLPT_Levels_LevelID",
                table: "Lessons",
                column: "LevelID",
                principalTable: "JLPT_Levels",
                principalColumn: "LevelID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Questions_JLPT_Levels_JLPT_LevelLevelID",
                table: "Questions",
                column: "JLPT_LevelLevelID",
                principalTable: "JLPT_Levels",
                principalColumn: "LevelID");
        }
    }
}
