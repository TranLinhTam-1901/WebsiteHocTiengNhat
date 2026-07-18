const fs = require("fs");
const path = require("path");

const normalizedDir = path.join(__dirname, "../Data/SeedFiles/normalized");
const outputPath = path.join(normalizedDir, "lessons.json");

const levels = ["N5", "N4", "N3"];
const lessons = [];

for (const level of levels) {
  for (let course = 1; course <= 5; course++) {
    for (let lesson = 1; lesson <= 5; lesson++) {
      lessons.push({
        title: `${level} - Khóa ${course} - Bài ${lesson}`,
        courseName: `${level} - Khóa ${course}`,
        sortOrder: lesson,
        topics: ["Tổng hợp"]
      });
    }
  }
}

fs.writeFileSync(
  outputPath,
  JSON.stringify(lessons, null, 2),
  "utf8"
);

console.log(`Generated ${lessons.length} lessons.`);