using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace QuizzTiengNhat.Migrations
{
    /// <inheritdoc />
    public partial class InitialDB : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GrammarGroups",
                columns: table => new
                {
                    GrammarGroupID = table.Column<Guid>(type: "uuid", nullable: false),
                    GroupName = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GrammarGroups", x => x.GrammarGroupID);
                });

            migrationBuilder.CreateTable(
                name: "JLPT_Levels",
                columns: table => new
                {
                    LevelID = table.Column<Guid>(type: "uuid", nullable: false),
                    LevelName = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JLPT_Levels", x => x.LevelID);
                });

            migrationBuilder.CreateTable(
                name: "Radicals",
                columns: table => new
                {
                    RadicalID = table.Column<Guid>(type: "uuid", nullable: false),
                    Character = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Meaning = table.Column<string>(type: "text", nullable: true),
                    StrokeCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Radicals", x => x.RadicalID);
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
                name: "WordTypes",
                columns: table => new
                {
                    WordTypeID = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WordTypes", x => x.WordTypeID);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoleId = table.Column<string>(type: "text", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    FullName = table.Column<string>(type: "text", nullable: false),
                    LevelID = table.Column<Guid>(type: "uuid", nullable: true),
                    UserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: true),
                    SecurityStamp = table.Column<string>(type: "text", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true),
                    PhoneNumber = table.Column<string>(type: "text", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUsers_JLPT_Levels_LevelID",
                        column: x => x.LevelID,
                        principalTable: "JLPT_Levels",
                        principalColumn: "LevelID");
                });

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
                name: "ExamTemplates",
                columns: table => new
                {
                    TemplateID = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    LevelID = table.Column<Guid>(type: "uuid", nullable: false),
                    Duration = table.Column<int>(type: "integer", nullable: false),
                    PassingScore = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    MinLanguageKnowledgeScore = table.Column<double>(type: "double precision", nullable: false),
                    MinReadingScore = table.Column<double>(type: "double precision", nullable: true),
                    MinListeningScore = table.Column<double>(type: "double precision", nullable: true),
                    TotalMaxScore = table.Column<decimal>(type: "numeric(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExamTemplates", x => x.TemplateID);
                    table.ForeignKey(
                        name: "FK_ExamTemplates_JLPT_Levels_LevelID",
                        column: x => x.LevelID,
                        principalTable: "JLPT_Levels",
                        principalColumn: "LevelID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RadicalVariants",
                columns: table => new
                {
                    VariantID = table.Column<Guid>(type: "uuid", nullable: false),
                    Character = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Meaning = table.Column<string>(type: "text", nullable: true),
                    StrokeCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RadicalID = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RadicalVariants", x => x.VariantID);
                    table.ForeignKey(
                        name: "FK_RadicalVariants_Radicals_RadicalID",
                        column: x => x.RadicalID,
                        principalTable: "Radicals",
                        principalColumn: "RadicalID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    ProviderKey = table.Column<string>(type: "text", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    RoleId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Lessons",
                columns: table => new
                {
                    LessonID = table.Column<Guid>(type: "uuid", nullable: false),
                    CourseID = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    SkillType = table.Column<string>(type: "text", nullable: false),
                    Difficulty = table.Column<int>(type: "integer", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    JLPT_LevelLevelID = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Lessons", x => x.LessonID);
                    table.ForeignKey(
                        name: "FK_Lessons_Courses_CourseID",
                        column: x => x.CourseID,
                        principalTable: "Courses",
                        principalColumn: "CourseID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Lessons_JLPT_Levels_JLPT_LevelLevelID",
                        column: x => x.JLPT_LevelLevelID,
                        principalTable: "JLPT_Levels",
                        principalColumn: "LevelID");
                });

            migrationBuilder.CreateTable(
                name: "ExamTemplateDetails",
                columns: table => new
                {
                    DetailID = table.Column<Guid>(type: "uuid", nullable: false),
                    SkillType = table.Column<int>(type: "integer", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    PointPerQuestion = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    TemplateID = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExamTemplateDetails", x => x.DetailID);
                    table.ForeignKey(
                        name: "FK_ExamTemplateDetails_ExamTemplates_TemplateID",
                        column: x => x.TemplateID,
                        principalTable: "ExamTemplates",
                        principalColumn: "TemplateID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Exams",
                columns: table => new
                {
                    ExamID = table.Column<Guid>(type: "uuid", nullable: false),
                    TemplateID = table.Column<Guid>(type: "uuid", nullable: true),
                    LessonID = table.Column<Guid>(type: "uuid", nullable: true),
                    LevelID = table.Column<Guid>(type: "uuid", nullable: true),
                    TargetSkill = table.Column<int>(type: "integer", nullable: true),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TotalMaxScore = table.Column<double>(type: "double precision", nullable: false),
                    PassingScore = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    MinLanguageKnowledgeScore = table.Column<double>(type: "double precision", nullable: false),
                    MinReadingScore = table.Column<double>(type: "double precision", nullable: false),
                    MinListeningScore = table.Column<double>(type: "double precision", nullable: false),
                    ShowResultImmediately = table.Column<bool>(type: "boolean", nullable: false),
                    Duration = table.Column<int>(type: "integer", nullable: false),
                    IsPublished = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Exams", x => x.ExamID);
                    table.ForeignKey(
                        name: "FK_Exams_ExamTemplates_TemplateID",
                        column: x => x.TemplateID,
                        principalTable: "ExamTemplates",
                        principalColumn: "TemplateID",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Exams_JLPT_Levels_LevelID",
                        column: x => x.LevelID,
                        principalTable: "JLPT_Levels",
                        principalColumn: "LevelID");
                    table.ForeignKey(
                        name: "FK_Exams_Lessons_LessonID",
                        column: x => x.LessonID,
                        principalTable: "Lessons",
                        principalColumn: "LessonID",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Grammars",
                columns: table => new
                {
                    GrammarID = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Structure = table.Column<string>(type: "text", nullable: false),
                    Meaning = table.Column<string>(type: "text", nullable: false),
                    Explanation = table.Column<string>(type: "text", nullable: false),
                    GrammarType = table.Column<int>(type: "integer", nullable: false),
                    Formality = table.Column<int>(type: "integer", nullable: false),
                    GrammarGroupID = table.Column<Guid>(type: "uuid", nullable: true),
                    UsageNote = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LevelID = table.Column<Guid>(type: "uuid", nullable: false),
                    LessonID = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Grammars", x => x.GrammarID);
                    table.ForeignKey(
                        name: "FK_Grammars_GrammarGroups_GrammarGroupID",
                        column: x => x.GrammarGroupID,
                        principalTable: "GrammarGroups",
                        principalColumn: "GrammarGroupID",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Grammars_JLPT_Levels_LevelID",
                        column: x => x.LevelID,
                        principalTable: "JLPT_Levels",
                        principalColumn: "LevelID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Grammars_Lessons_LessonID",
                        column: x => x.LessonID,
                        principalTable: "Lessons",
                        principalColumn: "LessonID",
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
                    StrokeCount = table.Column<int>(type: "integer", nullable: false),
                    StrokeGif = table.Column<string>(type: "text", nullable: true),
                    RadicalID = table.Column<Guid>(type: "uuid", nullable: false),
                    SearchVector = table.Column<string>(type: "text", nullable: true),
                    Note = table.Column<string>(type: "text", nullable: true),
                    Mnemonics = table.Column<string>(type: "text", nullable: true),
                    Popularity = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LevelID = table.Column<Guid>(type: "uuid", nullable: false),
                    TopicID = table.Column<Guid>(type: "uuid", nullable: false),
                    LessonID = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Kanjis", x => x.KanjiID);
                    table.ForeignKey(
                        name: "FK_Kanjis_JLPT_Levels_LevelID",
                        column: x => x.LevelID,
                        principalTable: "JLPT_Levels",
                        principalColumn: "LevelID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Kanjis_Lessons_LessonID",
                        column: x => x.LessonID,
                        principalTable: "Lessons",
                        principalColumn: "LessonID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Kanjis_Radicals_RadicalID",
                        column: x => x.RadicalID,
                        principalTable: "Radicals",
                        principalColumn: "RadicalID",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Kanjis_Topics_TopicID",
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
                        principalColumn: "LessonID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Lessons_Topics_Topics_TopicID",
                        column: x => x.TopicID,
                        principalTable: "Topics",
                        principalColumn: "TopicID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Listenings",
                columns: table => new
                {
                    ListeningID = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    AudioURL = table.Column<string>(type: "text", nullable: false),
                    Script = table.Column<string>(type: "text", nullable: true),
                    Transcript = table.Column<string>(type: "text", nullable: true),
                    Duration = table.Column<int>(type: "integer", nullable: false),
                    SpeedCategory = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LevelID = table.Column<Guid>(type: "uuid", nullable: false),
                    LessonID = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Listenings", x => x.ListeningID);
                    table.ForeignKey(
                        name: "FK_Listenings_JLPT_Levels_LevelID",
                        column: x => x.LevelID,
                        principalTable: "JLPT_Levels",
                        principalColumn: "LevelID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Listenings_Lessons_LessonID",
                        column: x => x.LessonID,
                        principalTable: "Lessons",
                        principalColumn: "LessonID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Progresses",
                columns: table => new
                {
                    ProgressID = table.Column<Guid>(type: "uuid", nullable: false),
                    UserID = table.Column<string>(type: "text", nullable: false),
                    LevelID = table.Column<Guid>(type: "uuid", nullable: false),
                    LessonsID = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    LastAccessed = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Progresses", x => x.ProgressID);
                    table.ForeignKey(
                        name: "FK_Progresses_AspNetUsers_UserID",
                        column: x => x.UserID,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Progresses_Lessons_LessonsID",
                        column: x => x.LessonsID,
                        principalTable: "Lessons",
                        principalColumn: "LessonID",
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
                    WordCount = table.Column<int>(type: "integer", nullable: false),
                    EstimatedTime = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LevelID = table.Column<Guid>(type: "uuid", nullable: false),
                    LessonID = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Readings", x => x.ReadingID);
                    table.ForeignKey(
                        name: "FK_Readings_JLPT_Levels_LevelID",
                        column: x => x.LevelID,
                        principalTable: "JLPT_Levels",
                        principalColumn: "LevelID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Readings_Lessons_LessonID",
                        column: x => x.LessonID,
                        principalTable: "Lessons",
                        principalColumn: "LessonID",
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
                    IsCommon = table.Column<bool>(type: "boolean", nullable: false),
                    Mnemonics = table.Column<string>(type: "text", nullable: true),
                    ImageURL = table.Column<string>(type: "text", nullable: true),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LevelID = table.Column<Guid>(type: "uuid", nullable: false),
                    LessonID = table.Column<Guid>(type: "uuid", nullable: false),
                    AudioURL = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vocabularies", x => x.VocabID);
                    table.ForeignKey(
                        name: "FK_Vocabularies_JLPT_Levels_LevelID",
                        column: x => x.LevelID,
                        principalTable: "JLPT_Levels",
                        principalColumn: "LevelID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Vocabularies_Lessons_LessonID",
                        column: x => x.LessonID,
                        principalTable: "Lessons",
                        principalColumn: "LessonID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Exam_Results",
                columns: table => new
                {
                    ResultID = table.Column<Guid>(type: "uuid", nullable: false),
                    UserID = table.Column<string>(type: "text", nullable: false),
                    ExamID = table.Column<Guid>(type: "uuid", nullable: false),
                    Score = table.Column<float>(type: "real", nullable: false),
                    TimeSpent = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Exam_Results", x => x.ResultID);
                    table.ForeignKey(
                        name: "FK_Exam_Results_AspNetUsers_UserID",
                        column: x => x.UserID,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Exam_Results_Exams_ExamID",
                        column: x => x.ExamID,
                        principalTable: "Exams",
                        principalColumn: "ExamID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GrammarTopics",
                columns: table => new
                {
                    GrammarID = table.Column<Guid>(type: "uuid", nullable: false),
                    TopicID = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GrammarTopics", x => new { x.GrammarID, x.TopicID });
                    table.ForeignKey(
                        name: "FK_GrammarTopics_Grammars_GrammarID",
                        column: x => x.GrammarID,
                        principalTable: "Grammars",
                        principalColumn: "GrammarID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GrammarTopics_Topics_TopicID",
                        column: x => x.TopicID,
                        principalTable: "Topics",
                        principalColumn: "TopicID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ListeningTopics",
                columns: table => new
                {
                    ListeningID = table.Column<Guid>(type: "uuid", nullable: false),
                    TopicID = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ListeningTopics", x => new { x.ListeningID, x.TopicID });
                    table.ForeignKey(
                        name: "FK_ListeningTopics_Listenings_ListeningID",
                        column: x => x.ListeningID,
                        principalTable: "Listenings",
                        principalColumn: "ListeningID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ListeningTopics_Topics_TopicID",
                        column: x => x.TopicID,
                        principalTable: "Topics",
                        principalColumn: "TopicID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Questions",
                columns: table => new
                {
                    QuestionID = table.Column<Guid>(type: "uuid", nullable: false),
                    ReadingID = table.Column<Guid>(type: "uuid", nullable: true),
                    ListeningID = table.Column<Guid>(type: "uuid", nullable: true),
                    LessonID = table.Column<Guid>(type: "uuid", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    QuestionType = table.Column<int>(type: "integer", nullable: false),
                    SkillType = table.Column<int>(type: "integer", nullable: false),
                    AudioURL = table.Column<string>(type: "text", nullable: true),
                    ImageURL = table.Column<string>(type: "text", nullable: true),
                    Difficulty = table.Column<int>(type: "integer", nullable: false),
                    Explanation = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false, defaultValue: 1),
                    EquivalentID = table.Column<Guid>(type: "uuid", nullable: true),
                    MediaTimestamp = table.Column<string>(type: "text", nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SourceID = table.Column<Guid>(type: "uuid", nullable: true),
                    ParentID = table.Column<Guid>(type: "uuid", nullable: true),
                    JLPT_LevelLevelID = table.Column<Guid>(type: "uuid", nullable: true),
                    LessonsLessonID = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Questions", x => x.QuestionID);
                    table.ForeignKey(
                        name: "FK_Questions_JLPT_Levels_JLPT_LevelLevelID",
                        column: x => x.JLPT_LevelLevelID,
                        principalTable: "JLPT_Levels",
                        principalColumn: "LevelID");
                    table.ForeignKey(
                        name: "FK_Questions_Lessons_LessonID",
                        column: x => x.LessonID,
                        principalTable: "Lessons",
                        principalColumn: "LessonID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Questions_Lessons_LessonsLessonID",
                        column: x => x.LessonsLessonID,
                        principalTable: "Lessons",
                        principalColumn: "LessonID");
                    table.ForeignKey(
                        name: "FK_Questions_Listenings_ListeningID",
                        column: x => x.ListeningID,
                        principalTable: "Listenings",
                        principalColumn: "ListeningID");
                    table.ForeignKey(
                        name: "FK_Questions_Questions_ParentID",
                        column: x => x.ParentID,
                        principalTable: "Questions",
                        principalColumn: "QuestionID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Questions_Readings_ReadingID",
                        column: x => x.ReadingID,
                        principalTable: "Readings",
                        principalColumn: "ReadingID");
                });

            migrationBuilder.CreateTable(
                name: "ReadingTopics",
                columns: table => new
                {
                    ReadingID = table.Column<Guid>(type: "uuid", nullable: false),
                    TopicID = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReadingTopics", x => new { x.ReadingID, x.TopicID });
                    table.ForeignKey(
                        name: "FK_ReadingTopics_Readings_ReadingID",
                        column: x => x.ReadingID,
                        principalTable: "Readings",
                        principalColumn: "ReadingID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ReadingTopics_Topics_TopicID",
                        column: x => x.TopicID,
                        principalTable: "Topics",
                        principalColumn: "TopicID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Examples",
                columns: table => new
                {
                    ExampleID = table.Column<Guid>(type: "uuid", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    Translation = table.Column<string>(type: "text", nullable: false),
                    AudioURL = table.Column<string>(type: "text", nullable: true),
                    VocabID = table.Column<Guid>(type: "uuid", nullable: true),
                    GrammarID = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Examples", x => x.ExampleID);
                    table.ForeignKey(
                        name: "FK_Examples_Grammars_GrammarID",
                        column: x => x.GrammarID,
                        principalTable: "Grammars",
                        principalColumn: "GrammarID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Examples_Vocabularies_VocabID",
                        column: x => x.VocabID,
                        principalTable: "Vocabularies",
                        principalColumn: "VocabID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VocabTopics",
                columns: table => new
                {
                    VocabID = table.Column<Guid>(type: "uuid", nullable: false),
                    TopicID = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VocabTopics", x => new { x.VocabID, x.TopicID });
                    table.ForeignKey(
                        name: "FK_VocabTopics_Topics_TopicID",
                        column: x => x.TopicID,
                        principalTable: "Topics",
                        principalColumn: "TopicID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VocabTopics_Vocabularies_VocabID",
                        column: x => x.VocabID,
                        principalTable: "Vocabularies",
                        principalColumn: "VocabID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VocabularyKanjis",
                columns: table => new
                {
                    VocabID = table.Column<Guid>(type: "uuid", nullable: false),
                    KanjiID = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VocabularyKanjis", x => new { x.VocabID, x.KanjiID });
                    table.ForeignKey(
                        name: "FK_VocabularyKanjis_Kanjis_KanjiID",
                        column: x => x.KanjiID,
                        principalTable: "Kanjis",
                        principalColumn: "KanjiID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VocabularyKanjis_Vocabularies_VocabID",
                        column: x => x.VocabID,
                        principalTable: "Vocabularies",
                        principalColumn: "VocabID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VocabWordTypes",
                columns: table => new
                {
                    VocabID = table.Column<Guid>(type: "uuid", nullable: false),
                    WordTypeID = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VocabWordTypes", x => new { x.VocabID, x.WordTypeID });
                    table.ForeignKey(
                        name: "FK_VocabWordTypes_Vocabularies_VocabID",
                        column: x => x.VocabID,
                        principalTable: "Vocabularies",
                        principalColumn: "VocabID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VocabWordTypes_WordTypes_WordTypeID",
                        column: x => x.WordTypeID,
                        principalTable: "WordTypes",
                        principalColumn: "WordTypeID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Answers",
                columns: table => new
                {
                    AnswerID = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestionID = table.Column<Guid>(type: "uuid", nullable: false),
                    AnswerText = table.Column<string>(type: "text", nullable: false),
                    IsCorrect = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Answers", x => x.AnswerID);
                    table.ForeignKey(
                        name: "FK_Answers_Questions_QuestionID",
                        column: x => x.QuestionID,
                        principalTable: "Questions",
                        principalColumn: "QuestionID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Exam_Questions",
                columns: table => new
                {
                    ExamQuestionID = table.Column<Guid>(type: "uuid", nullable: false),
                    ExamID = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestionID = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderIndex = table.Column<int>(type: "integer", nullable: false),
                    Score = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    QuestionsQuestionID = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Exam_Questions", x => x.ExamQuestionID);
                    table.ForeignKey(
                        name: "FK_Exam_Questions_Exams_ExamID",
                        column: x => x.ExamID,
                        principalTable: "Exams",
                        principalColumn: "ExamID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Exam_Questions_Questions_QuestionID",
                        column: x => x.QuestionID,
                        principalTable: "Questions",
                        principalColumn: "QuestionID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Exam_Questions_Questions_QuestionsQuestionID",
                        column: x => x.QuestionsQuestionID,
                        principalTable: "Questions",
                        principalColumn: "QuestionID");
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

            migrationBuilder.CreateIndex(
                name: "IX_Answers_QuestionID",
                table: "Answers",
                column: "QuestionID");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_LevelID",
                table: "AspNetUsers",
                column: "LevelID");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Courses_LevelID",
                table: "Courses",
                column: "LevelID");

            migrationBuilder.CreateIndex(
                name: "IX_Exam_Questions_ExamID",
                table: "Exam_Questions",
                column: "ExamID");

            migrationBuilder.CreateIndex(
                name: "IX_Exam_Questions_QuestionID",
                table: "Exam_Questions",
                column: "QuestionID");

            migrationBuilder.CreateIndex(
                name: "IX_Exam_Questions_QuestionsQuestionID",
                table: "Exam_Questions",
                column: "QuestionsQuestionID");

            migrationBuilder.CreateIndex(
                name: "IX_Exam_Results_ExamID",
                table: "Exam_Results",
                column: "ExamID");

            migrationBuilder.CreateIndex(
                name: "IX_Exam_Results_UserID",
                table: "Exam_Results",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_Examples_GrammarID",
                table: "Examples",
                column: "GrammarID");

            migrationBuilder.CreateIndex(
                name: "IX_Examples_VocabID",
                table: "Examples",
                column: "VocabID");

            migrationBuilder.CreateIndex(
                name: "IX_Exams_LessonID",
                table: "Exams",
                column: "LessonID");

            migrationBuilder.CreateIndex(
                name: "IX_Exams_LevelID",
                table: "Exams",
                column: "LevelID");

            migrationBuilder.CreateIndex(
                name: "IX_Exams_TemplateID",
                table: "Exams",
                column: "TemplateID");

            migrationBuilder.CreateIndex(
                name: "IX_ExamTemplateDetails_TemplateID",
                table: "ExamTemplateDetails",
                column: "TemplateID");

            migrationBuilder.CreateIndex(
                name: "IX_ExamTemplates_LevelID",
                table: "ExamTemplates",
                column: "LevelID");

            migrationBuilder.CreateIndex(
                name: "IX_Grammars_GrammarGroupID",
                table: "Grammars",
                column: "GrammarGroupID");

            migrationBuilder.CreateIndex(
                name: "IX_Grammars_LessonID",
                table: "Grammars",
                column: "LessonID");

            migrationBuilder.CreateIndex(
                name: "IX_Grammars_LevelID",
                table: "Grammars",
                column: "LevelID");

            migrationBuilder.CreateIndex(
                name: "IX_GrammarTopics_TopicID",
                table: "GrammarTopics",
                column: "TopicID");

            migrationBuilder.CreateIndex(
                name: "IX_Kanjis_LessonID",
                table: "Kanjis",
                column: "LessonID");

            migrationBuilder.CreateIndex(
                name: "IX_Kanjis_LevelID",
                table: "Kanjis",
                column: "LevelID");

            migrationBuilder.CreateIndex(
                name: "IX_Kanjis_RadicalID",
                table: "Kanjis",
                column: "RadicalID");

            migrationBuilder.CreateIndex(
                name: "IX_Kanjis_TopicID",
                table: "Kanjis",
                column: "TopicID");

            migrationBuilder.CreateIndex(
                name: "IX_Lessons_CourseID",
                table: "Lessons",
                column: "CourseID");

            migrationBuilder.CreateIndex(
                name: "IX_Lessons_JLPT_LevelLevelID",
                table: "Lessons",
                column: "JLPT_LevelLevelID");

            migrationBuilder.CreateIndex(
                name: "IX_Lessons_Topics_TopicID",
                table: "Lessons_Topics",
                column: "TopicID");

            migrationBuilder.CreateIndex(
                name: "IX_Listenings_LessonID",
                table: "Listenings",
                column: "LessonID");

            migrationBuilder.CreateIndex(
                name: "IX_Listenings_LevelID",
                table: "Listenings",
                column: "LevelID");

            migrationBuilder.CreateIndex(
                name: "IX_ListeningTopics_TopicID",
                table: "ListeningTopics",
                column: "TopicID");

            migrationBuilder.CreateIndex(
                name: "IX_Progresses_LessonsID",
                table: "Progresses",
                column: "LessonsID");

            migrationBuilder.CreateIndex(
                name: "IX_Progresses_UserID",
                table: "Progresses",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_Questions_JLPT_LevelLevelID",
                table: "Questions",
                column: "JLPT_LevelLevelID");

            migrationBuilder.CreateIndex(
                name: "IX_Questions_LessonID",
                table: "Questions",
                column: "LessonID");

            migrationBuilder.CreateIndex(
                name: "IX_Questions_LessonsLessonID",
                table: "Questions",
                column: "LessonsLessonID");

            migrationBuilder.CreateIndex(
                name: "IX_Questions_ListeningID",
                table: "Questions",
                column: "ListeningID");

            migrationBuilder.CreateIndex(
                name: "IX_Questions_ParentID",
                table: "Questions",
                column: "ParentID");

            migrationBuilder.CreateIndex(
                name: "IX_Questions_ReadingID",
                table: "Questions",
                column: "ReadingID");

            migrationBuilder.CreateIndex(
                name: "IX_Questions_Topics_TopicID",
                table: "Questions_Topics",
                column: "TopicID");

            migrationBuilder.CreateIndex(
                name: "IX_RadicalVariants_RadicalID",
                table: "RadicalVariants",
                column: "RadicalID");

            migrationBuilder.CreateIndex(
                name: "IX_Readings_LessonID",
                table: "Readings",
                column: "LessonID");

            migrationBuilder.CreateIndex(
                name: "IX_Readings_LevelID",
                table: "Readings",
                column: "LevelID");

            migrationBuilder.CreateIndex(
                name: "IX_ReadingTopics_TopicID",
                table: "ReadingTopics",
                column: "TopicID");

            migrationBuilder.CreateIndex(
                name: "IX_VocabTopics_TopicID",
                table: "VocabTopics",
                column: "TopicID");

            migrationBuilder.CreateIndex(
                name: "IX_Vocabularies_LessonID",
                table: "Vocabularies",
                column: "LessonID");

            migrationBuilder.CreateIndex(
                name: "IX_Vocabularies_LevelID",
                table: "Vocabularies",
                column: "LevelID");

            migrationBuilder.CreateIndex(
                name: "IX_VocabularyKanjis_KanjiID",
                table: "VocabularyKanjis",
                column: "KanjiID");

            migrationBuilder.CreateIndex(
                name: "IX_VocabWordTypes_WordTypeID",
                table: "VocabWordTypes",
                column: "WordTypeID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Answers");

            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "Exam_Questions");

            migrationBuilder.DropTable(
                name: "Exam_Results");

            migrationBuilder.DropTable(
                name: "Examples");

            migrationBuilder.DropTable(
                name: "ExamTemplateDetails");

            migrationBuilder.DropTable(
                name: "GrammarTopics");

            migrationBuilder.DropTable(
                name: "Lessons_Topics");

            migrationBuilder.DropTable(
                name: "ListeningTopics");

            migrationBuilder.DropTable(
                name: "Progresses");

            migrationBuilder.DropTable(
                name: "Questions_Topics");

            migrationBuilder.DropTable(
                name: "RadicalVariants");

            migrationBuilder.DropTable(
                name: "ReadingTopics");

            migrationBuilder.DropTable(
                name: "VocabTopics");

            migrationBuilder.DropTable(
                name: "VocabularyKanjis");

            migrationBuilder.DropTable(
                name: "VocabWordTypes");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "Exams");

            migrationBuilder.DropTable(
                name: "Grammars");

            migrationBuilder.DropTable(
                name: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "Questions");

            migrationBuilder.DropTable(
                name: "Kanjis");

            migrationBuilder.DropTable(
                name: "Vocabularies");

            migrationBuilder.DropTable(
                name: "WordTypes");

            migrationBuilder.DropTable(
                name: "ExamTemplates");

            migrationBuilder.DropTable(
                name: "GrammarGroups");

            migrationBuilder.DropTable(
                name: "Listenings");

            migrationBuilder.DropTable(
                name: "Readings");

            migrationBuilder.DropTable(
                name: "Radicals");

            migrationBuilder.DropTable(
                name: "Topics");

            migrationBuilder.DropTable(
                name: "Lessons");

            migrationBuilder.DropTable(
                name: "Courses");

            migrationBuilder.DropTable(
                name: "JLPT_Levels");
        }
    }
}
