const fs = require("fs");
const path = require("path");

const kanjiPath = path.join(
  __dirname,
  "../Data/SeedFiles/normalized/kanjis_n5_n3.json"
);

const outputPath = path.join(
  __dirname,
  "../Data/SeedFiles/generated/kanji_questions_generated.json"
);

const QUESTIONS_PER_LEVEL = {
  N5: 30,
  N4: 30,
  N3: 30
};

function readJson(filePath) {
  const content = fs
    .readFileSync(filePath, "utf8")
    .replace(/^\uFEFF/, "")
    .trim();

  return JSON.parse(content);
}

function shuffleArray(arr) {
  return [...arr].sort(() => 0.5 - Math.random());
}

function getRandomItems(arr, count) {
  return shuffleArray(arr).slice(0, Math.min(count, arr.length));
}

function assignCourseLesson(level, indexInLevel) {
  const lessonIndexGlobal = indexInLevel % 15;

  const courseNumber = Math.floor(lessonIndexGlobal / 3) + 1;
  const lessonNumber = (lessonIndexGlobal % 3) + 1;

  return {
    courseTitle: `${level} - Khóa ${courseNumber}`,
    lessonTitle: `${level} - Khóa ${courseNumber} - Bài ${lessonNumber}`
  };
}

function getKanjiChar(item) {
  return item.character || item.kanji || item.word || "";
}

function getMeaning(item) {
  return item.meaning || item.meaningVi || item.meaningEn || "";
}

function getReading(item) {
  return (
    item.onyomi ||
    item.kunyomi ||
    item.reading ||
    item.readings ||
    ""
  );
}

function normalizeReading(reading) {
  if (Array.isArray(reading)) {
    return reading.filter(Boolean).join(", ");
  }

  return String(reading || "").trim();
}

function buildMeaningQuestion(kanji, kanjisForLevel, displayOrder) {
  const kanjiChar = getKanjiChar(kanji);
  const correctMeaning = getMeaning(kanji);

  const wrongMeanings = getRandomItems(
    kanjisForLevel
      .filter(x => getKanjiChar(x) !== kanjiChar)
      .map(getMeaning)
      .filter(Boolean)
      .filter(x => x !== correctMeaning),
    3
  );

  if (!kanjiChar || !correctMeaning || wrongMeanings.length < 3) {
    return null;
  }

  return {
    content: `Kanji「${kanjiChar}」の意味は何ですか。`,
    displayOrder,
    difficulty: kanji.difficulty || 1,
    questionType: "MultipleChoice",
    questionFormat: "StandardChoice",
    skillType: "Kanji",
    explanation: `Kanji「${kanjiChar}」có nghĩa là "${correctMeaning}".`,
    answers: shuffleArray([
      {
        answerText: correctMeaning,
        isCorrect: true
      },
      ...wrongMeanings.map(x => ({
        answerText: x,
        isCorrect: false
      }))
    ])
  };
}

function buildReadingQuestion(kanji, kanjisForLevel, displayOrder) {
  const kanjiChar = getKanjiChar(kanji);
  const correctReading = normalizeReading(getReading(kanji));

  const wrongReadings = getRandomItems(
    kanjisForLevel
      .filter(x => getKanjiChar(x) !== kanjiChar)
      .map(x => normalizeReading(getReading(x)))
      .filter(Boolean)
      .filter(x => x !== correctReading),
    3
  );

  if (!kanjiChar || !correctReading || wrongReadings.length < 3) {
    return null;
  }

  return {
    content: `Kanji「${kanjiChar}」の読み方はどれですか。`,
    displayOrder,
    difficulty: kanji.difficulty || 1,
    questionType: "MultipleChoice",
    questionFormat: "StandardChoice",
    skillType: "Kanji",
    explanation: `Kanji「${kanjiChar}」có cách đọc là "${correctReading}".`,
    answers: shuffleArray([
      {
        answerText: correctReading,
        isCorrect: true
      },
      ...wrongReadings.map(x => ({
        answerText: x,
        isCorrect: false
      }))
    ])
  };
}

console.log("Loading kanji data...");

const kanjis = readJson(kanjiPath);

const kanjiByLevel = {};

for (const item of kanjis) {
  const level = item.level || item.Level;

  if (!level) continue;

  if (!kanjiByLevel[level]) {
    kanjiByLevel[level] = [];
  }

  kanjiByLevel[level].push(item);
}

const generated = [];

for (const level of Object.keys(QUESTIONS_PER_LEVEL)) {
  const kanjisForLevel = kanjiByLevel[level] || [];
  const targetCount = QUESTIONS_PER_LEVEL[level];

  if (kanjisForLevel.length < 4) {
    console.log(`Skip ${level}: not enough kanji`);
    continue;
  }

  let questionIndex = 0;
  let kanjiIndex = 0;

  while (questionIndex < targetCount && kanjiIndex < kanjisForLevel.length * 2) {
    const kanji = kanjisForLevel[kanjiIndex % kanjisForLevel.length];

    const question =
      questionIndex % 2 === 0
        ? buildMeaningQuestion(kanji, kanjisForLevel, questionIndex + 1)
        : buildReadingQuestion(kanji, kanjisForLevel, questionIndex + 1);

    kanjiIndex++;

    if (!question) continue;

    const { courseTitle, lessonTitle } = assignCourseLesson(level, questionIndex);

    generated.push({
      level,
      courseTitle,
      lessonTitle,
      kanji: getKanjiChar(kanji),
      meaning: getMeaning(kanji),
      reading: normalizeReading(getReading(kanji)),
      difficulty: kanji.difficulty || 1,
      status: 1,
      questions: [question]
    });

    questionIndex++;
  }

  console.log(`Generated ${questionIndex} Kanji questions for ${level}`);
}

fs.mkdirSync(path.dirname(outputPath), {
  recursive: true
});

fs.writeFileSync(
  outputPath,
  JSON.stringify(generated, null, 2),
  "utf8"
);

console.log(`Total generated records: ${generated.length}`);
console.log(`Saved to ${outputPath}`);