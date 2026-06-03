const fs = require("fs");
const path = require("path");

const vocabPath = path.join(
  __dirname,
  "../Data/SeedFiles/normalized/vocabularies_n5_n3.json"
);

const examplesPath = path.join(
  __dirname,
  "../Data/SeedFiles/normalized/examples_n5_n3.json"
);

const templatesPath = path.join(
  __dirname,
  "../Data/SeedFiles/generated/reading_templates.json"
);

const outputPath = path.join(
  __dirname,
  "../Data/SeedFiles/generated/readings_generated.json"
);

function readJson(filePath) {
  const content = fs
    .readFileSync(filePath, "utf8")
    .replace(/^\uFEFF/, "")
    .trim();

  return JSON.parse(content);
}

function getExampleJapanese(example) {
  return example.content || example.japanese || example.jp || "";
}

function getExampleTranslation(example) {
  return (
    example.translation ||
    example.vietnamese ||
    example.english ||
    ""
  );
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomItems(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
}

function shuffleArray(arr) {
  return [...arr].sort(() => 0.5 - Math.random());
}

function countJapaneseChars(text) {
  return (
    text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []
  ).length;
}

function calculateEstimatedTime(wordCount) {
  const charsPerMinute = 250;
  return Math.max(1, Math.ceil(wordCount / charsPerMinute));
}

// SỬA: giống Listening, 5 khóa x 3 bài = 15 lesson / level
function assignCourseLesson(level, indexInLevel) {
  const courseCount = 5;
  const lessonPerCourse = 3;

  const position = indexInLevel % (courseCount * lessonPerCourse);

  const courseNumber = Math.floor(position / lessonPerCourse) + 1;
  const lessonNumber = (position % lessonPerCourse) + 1;

  return {
    courseTitle: `${level} - Khóa ${courseNumber}`,
    lessonTitle: `${level} - Khóa ${courseNumber} - Bài ${lessonNumber}`
  };
}

function buildTopicQuestion(template) {
  const correctTopic = template.topic || "Tổng hợp";

  const wrongTopics = [
    "Trường học",
    "Gia đình",
    "Mua sắm",
    "Du lịch",
    "Công việc",
    "Sức khỏe",
    "Thời gian",
    "Ẩm thực",
    "Tổng hợp"
  ].filter(x => x !== correctTopic);

  const answers = [
    {
      answerText: correctTopic,
      isCorrect: true
    },
    ...getRandomItems(wrongTopics, 3).map(x => ({
      answerText: x,
      isCorrect: false
    }))
  ];

  return {
    content: "この文章の主なテーマは何ですか。",
    explanation: `Đáp án đúng là "${correctTopic}" vì nội dung bài đọc thuộc chủ đề "${correctTopic}".`,
    displayOrder: 1,
    difficulty: 1,
    questionType: "MultipleChoice",
    questionFormat: "Passage",
    skillType: "Reading",
    answers: shuffleArray(answers)
  };
}

function buildKeywordQuestion(template, vocabForLevel) {
  if (!template.keywords || template.keywords.length === 0) {
    return null;
  }

  const keyword = getRandomItem(template.keywords);

  const wrongWords = getRandomItems(
    vocabForLevel
      .map(v => v.word)
      .filter(w => w && w !== keyword),
    3
  );

  const answers = [
    {
      answerText: keyword,
      isCorrect: true
    },
    ...wrongWords.map(w => ({
      answerText: w,
      isCorrect: false
    }))
  ];

  while (answers.length < 4) {
    answers.push({
      answerText: "その他",
      isCorrect: false
    });
  }

  return {
    content: "文章に出てくる言葉はどれですか。",
    explanation: `Đáp án đúng là "${keyword}" vì từ này xuất hiện hoặc phù hợp với nội dung bài đọc.`,
    displayOrder: 2,
    difficulty: 1,
    questionType: "MultipleChoice",
    questionFormat: "StandardChoice",
    skillType: "Reading",
    answers: shuffleArray(answers)
  };
}

function buildMeaningQuestion(vocabForLevel) {
  if (!vocabForLevel || vocabForLevel.length === 0) {
    return null;
  }

  const vocab = getRandomItem(vocabForLevel);

  const correctMeaning =
    vocab.meaning ||
    vocab.translation ||
    vocab.meaningEn ||
    "";

  if (!vocab.word || !correctMeaning) {
    return null;
  }

  const wrongMeanings = getRandomItems(
    vocabForLevel
      .filter(v => v.word !== vocab.word)
      .map(v => v.meaning || v.translation || v.meaningEn)
      .filter(Boolean)
      .filter(m => m !== correctMeaning),
    3
  );

  const answers = [
    {
      answerText: correctMeaning,
      isCorrect: true
    },
    ...wrongMeanings.map(m => ({
      answerText: m,
      isCorrect: false
    }))
  ];

  while (answers.length < 4) {
    answers.push({
      answerText: "その他",
      isCorrect: false
    });
  }

  return {
    content: `「${vocab.word}」の意味は何ですか。`,
    explanation: `Đáp án đúng là "${correctMeaning}" vì 「${vocab.word}」 có nghĩa là "${correctMeaning}".`,
    displayOrder: 3,
    difficulty: 1,
    questionType: "MultipleChoice",
    questionFormat: "StandardChoice",
    skillType: "Reading",
    answers: shuffleArray(answers)
  };
}

function buildFallbackQuestion(displayOrder) {
  return {
    content: "この文章について正しいものはどれですか。",
    explanation: "Đáp án đúng là lựa chọn phù hợp với nội dung bài đọc.",
    displayOrder,
    difficulty: 1,
    questionType: "MultipleChoice",
    questionFormat: "Passage",
    skillType: "Reading",
    answers: shuffleArray([
      {
        answerText: "文章の内容に合っています。",
        isCorrect: true
      },
      {
        answerText: "文章の内容と違います。",
        isCorrect: false
      },
      {
        answerText: "文章には書いてありません。",
        isCorrect: false
      },
      {
        answerText: "関係がありません。",
        isCorrect: false
      }
    ])
  };
}

function buildQuestions(template, vocabForLevel) {
  const readingType = template.readingType || "Passage";

  // Passage = 3 câu
  if (readingType === "Passage") {
    const questions = [];

    questions.push(buildTopicQuestion(template));

    const keywordQuestion =
      buildKeywordQuestion(template, vocabForLevel);

    if (keywordQuestion) {
      questions.push(keywordQuestion);
    }

    while (questions.length < (template.questionCount || 3)) {
      questions.push(
        buildFallbackQuestion(
          questions.length + 1
        )
      );
    }

    return questions.map((q, index) => ({
      ...q,
      questionFormat: "Passage",
      skillType: "Reading",
      displayOrder: index + 1
    }));
  }

  // StandardChoice = 1 câu
  const question =
    buildKeywordQuestion(template, vocabForLevel) ||
    buildMeaningQuestion(vocabForLevel) ||
    buildFallbackQuestion(1);

  return [
    {
      ...question,
      questionFormat: "StandardChoice",
      skillType: "Reading",
      displayOrder: 1
    }
  ];
}

console.log("Loading data...");

const vocabularies = readJson(vocabPath);
const examples = readJson(examplesPath);
const templates = readJson(templatesPath);

console.log(`Loaded vocabulary: ${vocabularies.length}`);
console.log(`Loaded examples: ${examples.length}`);
console.log(`Loaded templates: ${templates.length}`);

const vocabByLevel = {};
const examplesByLevel = {};

for (const vocab of vocabularies) {
  const level = vocab.level || "N5";

  if (!vocabByLevel[level]) {
    vocabByLevel[level] = [];
  }

  vocabByLevel[level].push(vocab);
}

for (const example of examples) {
  const level = example.level || "N5";

  if (!examplesByLevel[level]) {
    examplesByLevel[level] = [];
  }

  examplesByLevel[level].push(example);
}

console.log(
  "Vocabulary by level:",
  Object.keys(vocabByLevel)
    .map(level => `${level}: ${vocabByLevel[level].length}`)
    .join(", ")
);

console.log(
  "Examples by level:",
  Object.keys(examplesByLevel)
    .map(level => `${level}: ${examplesByLevel[level].length}`)
    .join(", ")
);

const generatedReadings = [];
const skippedTemplates = [];

const levelCounters = {
  N5: 0,
  N4: 0,
  N3: 0
};

for (const template of templates) {
  const level = template.level;
  const examplesForLevel = examplesByLevel[level] || [];
  const vocabForLevel = vocabByLevel[level] || [];

  if (!Object.prototype.hasOwnProperty.call(levelCounters, level)) {
    skippedTemplates.push({
      title: template.title,
      level,
      reason: "Unsupported level"
    });
    continue;
  }

  if (examplesForLevel.length < template.minSentences) {
    skippedTemplates.push({
      title: template.title,
      level,
      reason: `Not enough examples: ${examplesForLevel.length}/${template.minSentences}`
    });
    continue;
  }

  let filteredExamples = examplesForLevel;

  if (template.keywords && template.keywords.length > 0) {
    const keywordPattern = new RegExp(
      template.keywords
        .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|")
    );

    filteredExamples = examplesForLevel.filter(example => {
      const japanese = getExampleJapanese(example);
      const translation = getExampleTranslation(example);

      return keywordPattern.test(japanese) || keywordPattern.test(translation);
    });

    if (filteredExamples.length < template.minSentences) {
      filteredExamples = examplesForLevel;
    }
  }

  const sentenceCount =
    Math.floor(
      Math.random() *
        (template.maxSentences - template.minSentences + 1)
    ) + template.minSentences;

  const selectedExamples = getRandomItems(filteredExamples, sentenceCount);

  const content = selectedExamples
  .map(example => getExampleJapanese(example))
  .filter(Boolean)
  .join("\n");

  const translation = selectedExamples
    .map(example => getExampleTranslation(example))
    .filter(Boolean)
    .join("\n");

  if (!content) {
    skippedTemplates.push({
      title: template.title,
      level,
      reason: "Generated empty content"
    });
    continue;
  }

  const wordCount = countJapaneseChars(content);
  const estimatedTime = calculateEstimatedTime(wordCount);

  const indexInLevel = levelCounters[level]++;
  const { courseTitle, lessonTitle } = assignCourseLesson(
    level,
    indexInLevel
  );

  const questions = buildQuestions(template, vocabForLevel);

  const reading = {
    title: template.title,
    content,
    translation,
    wordCount,
    estimatedTime,
    level,
    courseTitle,
    lessonTitle,
    topics: [template.topic || "Tổng hợp"],
    questions
  };

  generatedReadings.push(reading);

  console.log(
    `Generated reading: "${template.title}" (${level}) -> ${courseTitle} / ${lessonTitle} - ${wordCount} chars, ${questions.length} questions`
  );
}

fs.mkdirSync(path.dirname(outputPath), {
  recursive: true
});

fs.writeFileSync(
  outputPath,
  JSON.stringify(generatedReadings, null, 2),
  "utf8"
);

console.log(`\nGenerated ${generatedReadings.length} readings`);
console.log(`Skipped ${skippedTemplates.length} templates`);

const stats = {};
const formatStats = {};

for (const reading of generatedReadings) {
  if (!stats[reading.level]) {
    stats[reading.level] = 0;
  }

  stats[reading.level]++;

  for (const question of reading.questions) {
    const key = `${reading.level}-${question.questionFormat}`;

    if (!formatStats[key]) {
      formatStats[key] = 0;
    }

    formatStats[key]++;
  }
}

console.log(
  "Generated by level:",
  Object.entries(stats)
    .map(([level, count]) => `${level}: ${count}`)
    .join(", ")
);

console.log(
  "Question format stats:",
  Object.entries(formatStats)
    .map(([key, count]) => `${key}: ${count}`)
    .join(", ")
);

if (skippedTemplates.length > 0) {
  console.log("\nSkipped templates:");
  for (const skipped of skippedTemplates) {
    console.log(
      `- ${skipped.title} (${skipped.level}): ${skipped.reason}`
    );
  }
}

console.log(`Saved to: ${outputPath}`);