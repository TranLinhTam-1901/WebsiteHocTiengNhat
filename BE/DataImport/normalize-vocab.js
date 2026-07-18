const fs = require("fs");
const path = require("path");

const rawDir = path.join(__dirname, "../Data/SeedFiles/raw");
const normalizedDir = path.join(__dirname, "../Data/SeedFiles/normalized");

const jmdictPath = path.join(rawDir, "jmdict.json");
const jlptPath = path.join(rawDir, "jlpt_words.json");

const jmdict = JSON.parse(fs.readFileSync(jmdictPath, "utf8"));
const jlptWordsRaw = JSON.parse(fs.readFileSync(jlptPath, "utf8"));

const translatedVocabPath = path.join(
  normalizedDir,
  "translated_vocab.json"
);

const translatedVocab = fs.existsSync(translatedVocabPath)
  ? JSON.parse(fs.readFileSync(translatedVocabPath, "utf8"))
  : [];

function makeTranslateKey(expression, reading) {
  return `${expression || ""}|${reading || ""}`;
}

const translatedByReading = new Map(
  translatedVocab
    .filter(x => x.reading)
    .map(x => [x.reading, x])
);
const allowedLevels = new Set(["N5", "N4", "N3"]);


function extractLevelFromTags(tags) {
  const value = String(tags || "").toUpperCase();

  const hasN5 = value.includes("JLPT_5") || value.includes("JLPT_N5");
  const hasN4 = value.includes("JLPT_4") || value.includes("JLPT_N4");
  const hasN3 = value.includes("JLPT_3") || value.includes("JLPT_N3");

  // Ưu tiên level "cao hơn" để tránh N4/N3 bị nuốt hết vào N5
  if (hasN3) return "N3";
  if (hasN4) return "N4";
  if (hasN5) return "N5";

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

const wordTypesPath = path.join(rawDir, "word_types.json");

const wordTypesRaw = JSON.parse(
  fs.readFileSync(wordTypesPath, "utf8")
);

const wordTypeMap = new Map(
  wordTypesRaw.map(x => [x.name, x.description])
);

const translatedMap = new Map(
  translatedVocab
    .filter(x => x.expression && x.reading)
    .map(x => [
      makeTranslateKey(x.expression, x.reading),
      x
    ])
);

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

  if (text.includes("noun")) return ["Danh từ"];

  if (
    text.includes("godan") ||
    text.includes("ichidan") ||
    text.includes("verb")
  ) {
    return ["Động từ"];
  }

  if (text.includes("i-adjective")) return ["Tính từ đuôi i"];
  if (text.includes("na-adjective")) return ["Tính từ đuôi na"];
  if (text.includes("adverb")) return ["Trạng từ"];
  if (text.includes("particle")) return ["Trợ từ"];

  return ["Cụm biểu đạt"];
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

function assignCourseLesson(level, indexInLevel) {
  const courseCount = 5;
  const lessonPerCourse = 5;

  const position =
    indexInLevel % (courseCount * lessonPerCourse);

  const courseNumber =
    Math.floor(position / lessonPerCourse) + 1;

  const lessonNumber =
    (position % lessonPerCourse) + 1;

  return {
    courseTitle: `${level} - Khóa ${courseNumber}`,
    lessonTitle: `${level} - Khóa ${courseNumber} - Bài ${lessonNumber}`
  };
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

const levelCounters = {
  N5: 0,
  N4: 0,
  N3: 0
};

const entries = getEntries(jmdict);
const results = [];
const seen = new Set();

for (const entry of entries) {
  const word = getWord(entry);
  const reading = getReading(entry);
  const meaning = getMeaning(entry);

  const translated =
  translatedMap.get(
    makeTranslateKey(word, reading)
  ) ||
  translatedByReading.get(reading);

  const meaningEn = translated?.meaningEn || meaning;
  const meaningVi = translated?.meaningVi || meaningEn;

  if (!word || !reading || !meaning) continue;

  const level = findJlptLevel(word, reading);
  const indexInLevel = levelCounters[level]++;
  if (!level || !allowedLevels.has(level)) continue;

  const key = `${word}|${reading}`;
  if (seen.has(key)) continue;
  seen.add(key);

  const isCommon = getCommon(entry);
  const posList = entry.sense?.[0]?.partOfSpeech || [];
  const {
    courseTitle,
    lessonTitle
  } = assignCourseLesson(
    level,
    indexInLevel
  );
  results.push({
    word,
    reading,
    meaning: meaningVi,
    meaningEn,
    level,
    courseTitle,
    lessonTitle,
    topics: assignTopics(meaningEn),
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