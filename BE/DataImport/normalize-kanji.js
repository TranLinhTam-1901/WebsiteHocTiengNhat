const fs = require("fs");
const path = require("path");

const rawDir = path.join(__dirname, "../Data/SeedFiles/raw");
const normalizedDir = path.join(__dirname, "../Data/SeedFiles/normalized");

const kanjidicPath = path.join(rawDir, "kanjidic2.json");

const kanjidic = JSON.parse(fs.readFileSync(kanjidicPath, "utf8"));

const allowedLevels = new Set(["N5", "N4", "N3"]);

function getEntries(db) {
  if (Array.isArray(db)) return db;
  if (Array.isArray(db.characters)) return db.characters;
  if (Array.isArray(db.kanji)) return db.kanji;
  return [];
}

function normalizeJlptLevel(value) {
  const v = String(value || "").toUpperCase().replace("JLPT", "").trim();

  if (v === "5" || v === "N5") return "N5";
  if (v === "4" || v === "N4") return "N4";
  if (v === "3" || v === "N3") return "N3";

  return null;
}

function assignLessonTitle(level) {
  if (level === "N5") return "N5 - Bài 1: Từ vựng cơ bản";
  if (level === "N4") return "N4 - Bài 1: Từ vựng cơ bản";
  if (level === "N3") return "N3 - Bài 1: Từ vựng cơ bản";
  return "";
}

function assignTopic(meaning) {
  const m = String(meaning || "").toLowerCase();

  if (m.includes("study") || m.includes("school") || m.includes("learn")) {
    return "Trường học";
  }

  if (m.includes("father") || m.includes("mother") || m.includes("child")) {
    return "Gia đình";
  }

  return "Tổng hợp";
}

function getCharacter(entry) {
  return entry.literal || entry.character || entry.kanji || "";
}

function getStrokeCount(entry) {
  return Number(
    entry.misc?.strokeCounts?.[0] ||
    entry.strokeCount ||
    entry.stroke_count ||
    0
  );
}

function getJlpt(entry) {
  return normalizeJlptLevel(
    entry.misc?.jlptLevel ||
    entry.jlpt ||
    entry.jlptLevel
  );
}

function getMeanings(entry) {
  const meanings =
    entry.readingMeaning?.groups?.[0]?.meanings ||
    entry.meanings ||
    entry.meaning ||
    [];

  if (Array.isArray(meanings)) {
    return meanings
      .map(x => typeof x === "string" ? x : x.value || x.text || "")
      .filter(Boolean)
      .join(", ");
  }

  return String(meanings || "");
}

function getReadings(entry, type) {
  const readings =
    entry.readingMeaning?.groups?.[0]?.readings ||
    entry.readings ||
    [];

  if (!Array.isArray(readings)) return "";

  return readings
    .filter(x => {
      const rType = x.type || x.readingType || "";
      if (type === "onyomi") return rType.includes("ja_on") || rType.includes("on");
      if (type === "kunyomi") return rType.includes("ja_kun") || rType.includes("kun");
      return false;
    })
    .map(x => x.value || x.text || "")
    .filter(Boolean)
    .join(", ");
}

function getRadical(entry) {
  return (
    entry.radicals?.classical ||
    entry.radical?.classical ||
    entry.radical ||
    "?"
  );
}

const entries = getEntries(kanjidic);

const kanjis = [];
const radicalMap = new Map();

for (const entry of entries) {
  const level = getJlpt(entry);

  if (!level || !allowedLevels.has(level)) continue;

  const character = getCharacter(entry);
  if (!character) continue;

  const meaning = getMeanings(entry);
  const radical = String(getRadical(entry));

  if (!radicalMap.has(radical)) {
    radicalMap.set(radical, {
      character: radical,
      name: `Bộ ${radical}`,
      meaning: null,
      strokeCount: 0,
      variants: []
    });
  }

  kanjis.push({
    character,
    onyomi: getReadings(entry, "onyomi"),
    kunyomi: getReadings(entry, "kunyomi"),
    meaning,
    strokeCount: getStrokeCount(entry),
    radical,
    level,
    topic: assignTopic(meaning),
    lessonTitle: assignLessonTitle(level),
    popularity: Number(entry.misc?.frequency || entry.frequency || 9999),
    status: 1
  });
}

fs.mkdirSync(normalizedDir, { recursive: true });

fs.writeFileSync(
  path.join(normalizedDir, "radicals.json"),
  JSON.stringify([...radicalMap.values()], null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(normalizedDir, "kanjis_n5_n3.json"),
  JSON.stringify(kanjis, null, 2),
  "utf8"
);

console.log(`Generated ${radicalMap.size} radicals.`);
console.log(`Generated ${kanjis.length} kanjis.`);