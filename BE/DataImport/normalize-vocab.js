const fs = require("fs");
const path = require("path");

const rawDir = path.join(__dirname, "../Data/SeedFiles/raw");
const normalizedDir = path.join(__dirname, "../Data/SeedFiles/normalized");

const jmdictPath = path.join(rawDir, "jmdict.json");
const jlptPath = path.join(rawDir, "jlpt_words.json");

const jmdict = JSON.parse(fs.readFileSync(jmdictPath, "utf8"));
const jlptWordsRaw = JSON.parse(fs.readFileSync(jlptPath, "utf8"));

const allowedLevels = new Set(["N5", "N4", "N3"]);

function extractLevelFromTags(tags) {
  const value = String(tags || "").toUpperCase();

  if (value.includes("JLPT_5")) return "N5";
  if (value.includes("JLPT_4")) return "N4";
  if (value.includes("JLPT_3")) return "N3";

  return null;
}
function normalizeJlptList(raw) {
  const source = Array.isArray(raw) ? raw : [];

  return source
    .map(item => ({
      expression: item.expression || item.word || item.kanji || "",
      reading: item.reading || item.kana || "",
      meaning: item.meaning || "",
      level: item.level || item.jlpt || extractLevelFromTags(item.tags)
    }))
    .filter(item =>
      item.expression &&
      item.reading &&
      allowedLevels.has(item.level)
    );
}

const jlptWords = normalizeJlptList(jlptWordsRaw);

function getEntries(db) {
  if (Array.isArray(db)) return db;
  if (Array.isArray(db.words)) return db.words;
  return [];
}

function getWord(entry) {
  return entry.kanji?.[0]?.text || entry.kana?.[0]?.text || "";
}

function getReading(entry) {
  return entry.kana?.[0]?.text || "";
}

function getMeaning(entry) {
  return entry.sense?.[0]?.gloss?.[0]?.text || "";
}

function getCommon(entry) {
  return Boolean(entry.kanji?.[0]?.common || entry.kana?.[0]?.common);
}

function mapPos(posList = []) {
  const text = posList.join(" ").toLowerCase();

  if (text.includes("noun")) return ["Noun"];
  if (text.includes("godan") || text.includes("ichidan") || text.includes("verb")) return ["Verb"];
  if (text.includes("i-adjective")) return ["I-Adjective"];
  if (text.includes("na-adjective")) return ["Na-Adjective"];
  if (text.includes("adverb")) return ["Adverb"];
  if (text.includes("particle")) return ["Particle"];

  return ["Expression"];
}

function normalizeLevel(level) {
  const value = String(level || "").toUpperCase().replace("JLPT", "").trim();

  if (value === "5" || value === "N5") return "N5";
  if (value === "4" || value === "N4") return "N4";
  if (value === "3" || value === "N3") return "N3";

  return null;
}

function getJlptWord(item) {
  return item.expression || item.word || item.kanji || item.vocabulary || "";
}

function getJlptReading(item) {
  return item.reading || item.kana || "";
}

function findJlptLevel(word, reading) {
  const found = jlptWords.find(x =>
    x.expression === word || x.reading === reading
  );

  if (!found) return null;

  return found.level;
}

function assignLessonTitle(level) {
  if (level === "N5") return "N5 - Bài 1: Từ vựng cơ bản";
  if (level === "N4") return "N4 - Bài 1: Từ vựng cơ bản";
  if (level === "N3") return "N3 - Bài 1: Từ vựng cơ bản";
  return "";
}

function assignTopics(meaning) {
  const m = String(meaning || "").toLowerCase();

  if (m.includes("student") || m.includes("school") || m.includes("teacher")) {
    return ["Trường học"];
  }

  if (m.includes("father") || m.includes("mother") || m.includes("family")) {
    return ["Gia đình"];
  }

  return ["Tổng hợp"];
}

function priorityByLevel(level, isCommon) {
  let base = 3;

  if (level === "N5") base = 1;
  if (level === "N4") base = 2;
  if (level === "N3") base = 3;

  return isCommon ? base : base + 1;
}

const entries = getEntries(jmdict);
const results = [];
const seen = new Set();

for (const entry of entries) {
  const word = getWord(entry);
  const reading = getReading(entry);
  const meaning = getMeaning(entry);

  if (!word || !reading || !meaning) continue;

  const level = findJlptLevel(word, reading);
  if (!level || !allowedLevels.has(level)) continue;

  const key = `${word}|${reading}`;
  if (seen.has(key)) continue;
  seen.add(key);

  const isCommon = getCommon(entry);
  const posList = entry.sense?.[0]?.partOfSpeech || [];

  results.push({
    word,
    reading,
    meaning,
    level,
    lessonTitle: assignLessonTitle(level),
    topics: assignTopics(meaning),
    wordTypes: mapPos(posList),
    isCommon,
    priority: priorityByLevel(level, isCommon)
  });
}

fs.mkdirSync(normalizedDir, { recursive: true });

fs.writeFileSync(
  path.join(normalizedDir, "vocabularies_n5_n3.json"),
  JSON.stringify(results, null, 2),
  "utf8"
);

console.log(`Generated ${results.length} vocabulary items.`);