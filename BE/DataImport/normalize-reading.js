const fs = require("fs");
const path = require("path");

const rawDir = path.join(__dirname, "../Data/SeedFiles/raw");
const normalizedDir = path.join(__dirname, "../Data/SeedFiles/normalized");

const rawPath = path.join(rawDir, "reading_raw.json");
const outputPath = path.join(normalizedDir, "readings_n5_n3.json");

function countJapaneseUnits(text) {
  return String(text || "")
    .replace(/\s/g, "")
    .length;
}

function normalizeLevel(level) {
  const value = String(level || "").toUpperCase().trim();
  return ["N5", "N4", "N3"].includes(value) ? value : "N5";
}

function defaultLessonTitle(level) {
  if (level === "N5") return "N5 - Bài 1: Từ vựng cơ bản";
  if (level === "N4") return "N4 - Bài 1: Từ vựng cơ bản";
  if (level === "N3") return "N3 - Bài 1: Từ vựng cơ bản";
  return "N5 - Bài 1: Từ vựng cơ bản";
}

if (!fs.existsSync(rawPath)) {
  console.error(`Missing file: ${rawPath}`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(rawPath, "utf8"));

const readings = raw
  .filter(x => x.title && x.content)
  .map(x => {
    const level = normalizeLevel(x.level);

    return {
      title: x.title,
      content: x.content,
      translation: x.translation || "",
      wordCount: x.wordCount || countJapaneseUnits(x.content),
      estimatedTime: x.estimatedTime || 3,
      status: x.status ?? 1,
      level,
      lessonTitle: x.lessonTitle || defaultLessonTitle(level),
      topics: Array.isArray(x.topics) && x.topics.length > 0
        ? x.topics
        : ["Tổng hợp"]
    };
  });

fs.mkdirSync(normalizedDir, { recursive: true });

fs.writeFileSync(
  outputPath,
  JSON.stringify(readings, null, 2),
  "utf8"
);

console.log(`Generated ${readings.length} readings.`);