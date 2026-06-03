const fs = require("fs");
const path = require("path");

const vocabPath = path.join(
  __dirname,
  "../Data/SeedFiles/normalized/vocabularies_n5_n3.json"
);

const outputPath = path.join(
  __dirname,
  "../Data/SeedFiles/generated/vocabulary_questions_generated.json"
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

function getWord(item) {
  return item.word || item.Word || "";
}

function getReading(item) {
  return item.reading || item.Reading || "";
}

function getMeaning(item) {
  return item.meaning || item.Meaning || item.meaningVi || item.meaningEn || "";
}

function getDifficulty(item) {
  return item.difficulty || item.Difficulty || 1;
}

function buildMeaningQuestion(vocab, vocabForLevel, displayOrder) {
  const word = getWord(vocab);
  const reading = getReading(vocab);
  const correctMeaning = getMeaning(vocab);

  const wrongMeanings = getRandomItems(
    vocabForLevel
      .filter(x => getWord(x) !== word)
      .map(getMeaning)
      .filter(Boolean)
      .filter(x => x !== correctMeaning),
    3
  );

  if (!word || !correctMeaning || wrongMeanings.length < 3) {
    return null;
  }

  const shownWord = reading && reading !== word
    ? `${word}（${reading}）`
    : word;

  return {
    content: `「${shownWord}」の意味は何ですか。`,
    displayOrder,
    difficulty: getDifficulty(vocab),
    questionType: "MultipleChoice",
    questionFormat: "StandardChoice",
    skillType: "Vocabulary",
    explanation: `「${word}」có nghĩa là "${correctMeaning}".`,
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

function buildWordQuestion(vocab, vocabForLevel, displayOrder) {
  const word = getWord(vocab);
  const correctMeaning = getMeaning(vocab);

  const wrongWords = getRandomItems(
    vocabForLevel
      .filter(x => getWord(x) !== word)
      .map(getWord)
      .filter(Boolean)
      .filter(x => x !== word),
    3
  );

  if (!word || !correctMeaning || wrongWords.length < 3) {
    return null;
  }

  return {
    content: `Từ nào có nghĩa là "${correctMeaning}"?`,
    displayOrder,
    difficulty: getDifficulty(vocab),
    questionType: "MultipleChoice",
    questionFormat: "StandardChoice",
    skillType: "Vocabulary",
    explanation: `"${correctMeaning}" trong tiếng Nhật là 「${word}」.`,
    answers: shuffleArray([
      {
        answerText: word,
        isCorrect: true
      },
      ...wrongWords.map(x => ({
        answerText: x,
        isCorrect: false
      }))
    ])
  };
}

console.log("Loading vocabulary data...");

const vocabularies = readJson(vocabPath);

const vocabByLevel = {};

for (const item of vocabularies) {
  const level = item.level || item.Level;

  if (!level) continue;

  if (!vocabByLevel[level]) {
    vocabByLevel[level] = [];
  }

  vocabByLevel[level].push(item);
}

const generated = [];

for (const level of Object.keys(QUESTIONS_PER_LEVEL)) {
  const vocabForLevel = vocabByLevel[level] || [];
  const targetCount = QUESTIONS_PER_LEVEL[level];

  if (vocabForLevel.length < 4) {
    console.log(`Skip ${level}: not enough vocabulary`);
    continue;
  }

  let questionIndex = 0;
  let vocabIndex = 0;

  while (
    questionIndex < targetCount &&
    vocabIndex < vocabForLevel.length * 2
  ) {
    const vocab = vocabForLevel[vocabIndex % vocabForLevel.length];

    const question =
      questionIndex % 2 === 0
        ? buildMeaningQuestion(vocab, vocabForLevel, questionIndex + 1)
        : buildWordQuestion(vocab, vocabForLevel, questionIndex + 1);

    vocabIndex++;

    if (!question) continue;

    const { courseTitle, lessonTitle } = assignCourseLesson(level, questionIndex);

    generated.push({
      level,
      courseTitle,
      lessonTitle,
      word: getWord(vocab),
      reading: getReading(vocab),
      meaning: getMeaning(vocab),
      difficulty: getDifficulty(vocab),
      status: 1,
      questions: [question]
    });

    questionIndex++;
  }

  console.log(`Generated ${questionIndex} Vocabulary questions for ${level}`);
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