const fs = require("fs");
const path = require("path");

const rawDir = path.join(__dirname, "../Data/SeedFiles/raw");
const normalizedDir = path.join(__dirname, "../Data/SeedFiles/normalized");

const kanjidicPath = path.join(rawDir, "kanjidic2.json");
const radicalsPath = path.join(rawDir, "radicals_214.json");

const translatedKanjiPath = path.join(
  normalizedDir,
  "translated_kanji_meanings.json"
);

const kanjidic = JSON.parse(fs.readFileSync(kanjidicPath, "utf8"));
const radicalList = JSON.parse(fs.readFileSync(radicalsPath, "utf8"));

const translatedKanji = fs.existsSync(translatedKanjiPath)
  ? JSON.parse(fs.readFileSync(translatedKanjiPath, "utf8"))
  : [];

const allowedLevels = new Set(["N5", "N4", "N3"]);

function getEntries(db) {
  if (Array.isArray(db)) return db;
  if (Array.isArray(db.characters)) return db.characters;
  if (Array.isArray(db.kanji)) return db.kanji;
  return [];
}

/**
 * KANJIDIC2 dùng JLPT cũ:
 * 1 -> N1
 * 2 -> N2
 * 3 -> N4 gần đúng
 * 4 -> N5 gần đúng
 *
 * Không có N3 chính xác trong KANJIDIC2.
 */
function normalizeJlptLevelFromKanjidic(value) {
  const v = String(value || "").trim();

  if (v === "4") return "N5";
  if (v === "3") return "N4";

  // bỏ N1/N2
  if (v === "2") return "N3";
  if (v === "1") return "N1";

  return null;
}

function assignCourseLesson(level, indexInLevel) {
  const courseCount = 5;
  const lessonPerCourse = 5;

  const position = indexInLevel % (courseCount * lessonPerCourse);

  const courseNumber =
    Math.floor(position / lessonPerCourse) + 1;

  const lessonNumber =
    (position % lessonPerCourse) + 1;

  return {
    courseTitle: `${level} - Khóa ${courseNumber}`,
    lessonTitle: `${level} - Khóa ${courseNumber} - Bài ${lessonNumber}`
  };
}

function assignTopic(meaning) {
  const m = String(meaning || "").toLowerCase();

  if (m.includes("study") || m.includes("school") || m.includes("learn")) {
    return "Trường học";
  }

  if (m.includes("father") || m.includes("mother") || m.includes("child")) {
    return "Gia đình";
  }

  if (m.includes("money") || m.includes("buy") || m.includes("sell")) {
    return "Mua bán";
  }

  if (m.includes("day") || m.includes("month") || m.includes("year") || m.includes("time")) {
    return "Thời gian";
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
  return normalizeJlptLevelFromKanjidic(
    entry.misc?.jlptLevel ||
    entry.jlpt ||
    entry.jlptLevel
  );
}

function getMeaningsEn(entry) {
  const meanings =
    entry.readingMeaning?.groups?.[0]?.meanings ||
    entry.meanings ||
    entry.meaning ||
    [];

  if (Array.isArray(meanings)) {
    return meanings
      .filter(x => {
        if (typeof x === "string") return true;
        return !x.lang || x.lang === "en";
      })
      .map(x => typeof x === "string" ? x : x.value || x.text || "")
      .filter(Boolean)
      .join(", ");
  }

  return String(meanings || "");
}

function getHanViet(entry) {
  const readings =
    entry.readingMeaning?.groups?.[0]?.readings ||
    entry.readings ||
    [];

  if (!Array.isArray(readings)) return "";

  return readings
    .filter(x => x.type === "vietnam")
    .map(x => x.value || x.text || "")
    .filter(Boolean)
    .join(", ");
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
      if (type === "onyomi") return rType === "ja_on" || rType.includes("on");
      if (type === "kunyomi") return rType === "ja_kun" || rType.includes("kun");
      return false;
    })
    .map(x => x.value || x.text || "")
    .filter(Boolean)
    .join(", ");
}

/**
 * Trong KANJIDIC2:
 * radicals classical value là số bộ thủ, ví dụ 7.
 * Ta map số 7 sang radicals_214.json[id = 7].
 */
function buildRadicalMap(radicals) {
  const map = new Map();

  for (const r of radicals) {
    map.set(String(r.id), {
      id: r.id,
      character: r.character,
      name: r.name,
      meaning: r.meaning,
      strokeCount: r.strokeCount
    });
  }

  return map;
}

function getRadicalNumber(entry) {
  if (Array.isArray(entry.radicals)) {
    const classical = entry.radicals.find(x => x.type === "classical");
    if (classical) return String(classical.value);
  }

  return null;
}

const entries = getEntries(kanjidic);
const radical214Map = buildRadicalMap(radicalList);

const translatedMeaningMap = new Map(
  translatedKanji
    .filter(x => x.character)
    .map(x => [x.character, x])
);

const levelCounters = {
  N5: 0,
  N4: 0,
  N3: 0
};
const kanjis = [];
const usedRadicals = new Map();

for (const entry of entries) {
  const level = getJlpt(entry);
const indexInLevel = levelCounters[level]++;
  // chỉ lấy N5, N4, N3
  // với KANJIDIC2 hiện tại thực tế chỉ lấy được N5/N4
  if (!level || !allowedLevels.has(level)) continue;

  const character = getCharacter(entry);
  if (!character) continue;

  const meaningEn = getMeaningsEn(entry);

  const translated = translatedMeaningMap.get(character);

  const meaning = translated?.meaningVi || meaningEn;

  const hanViet = getHanViet(entry);

  const radicalNumber = getRadicalNumber(entry);
  const radicalInfo = radical214Map.get(radicalNumber);

  if (!radicalInfo) {
    console.log(`Không tìm thấy bộ thủ ${radicalNumber} cho chữ ${character}`);
    continue;
  }

  if (!usedRadicals.has(radicalInfo.id)) {
    usedRadicals.set(radicalInfo.id, radicalInfo);
  }
  const {
    courseTitle,
    lessonTitle
  } = assignCourseLesson(
    level,
    indexInLevel
  );
  kanjis.push({
    character,
    onyomi: getReadings(entry, "onyomi"),
    kunyomi: getReadings(entry, "kunyomi"),
    hanViet,
    meaning,
    meaningEn,
    strokeCount: getStrokeCount(entry),

    radicalId: radicalInfo.id,
    radical: radicalInfo.character,
    radicalName: radicalInfo.name,
    radicalMeaning: radicalInfo.meaning,

    level,
    courseTitle,
    lessonTitle,
    topic: assignTopic(meaningEn),
    popularity: Number(entry.misc?.frequency || entry.frequency || 9999),
    status: 1
  });
}

fs.mkdirSync(normalizedDir, { recursive: true });

fs.writeFileSync(
  path.join(normalizedDir, "radicals.json"),
  JSON.stringify([...usedRadicals.values()], null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(normalizedDir, "kanjis_n5_n3.json"),
  JSON.stringify(kanjis, null, 2),
  "utf8"
);

console.log(`Generated ${usedRadicals.size} radicals.`);
console.log(`Generated ${kanjis.length} kanjis.`);