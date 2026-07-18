const fs = require("fs");
const path = require("path");

const templatesPath = path.join(
  __dirname,
  "../Data/SeedFiles/generated/grammar_templates.json"
);

const outputPath = path.join(
  __dirname,
  "../Data/SeedFiles/generated/grammars_generated.json"
);

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

function assignCourseLesson(level, indexInLevel) {
  const courseNumber = Math.floor(indexInLevel / 3) + 1;
  const lessonNumber = (indexInLevel % 3) + 1;

  return {
    courseTitle: `${level} - Khóa ${courseNumber}`,
    lessonTitle: `${level} - Khóa ${courseNumber} - Bài ${lessonNumber}`
  };
}

function buildMeaningQuestion(template, displayOrder) {
  const wrongAnswers = [
    "đã từng làm",
    "không được phép làm",
    "đang làm",
    "có thể làm",
    "phải làm",
    "làm thử",
    "trước khi làm",
    "sau khi làm",
    "nếu làm",
    "vừa mới làm"
  ].filter(x => x !== template.meaning);

  return {
    content: `Mẫu ngữ pháp "${template.pattern}" có ý nghĩa là gì?`,
    displayOrder,
    difficulty: template.difficulty || 1,
    questionType: "MultipleChoice",
    questionFormat: "StandardChoice",
    skillType: "Grammar",
    explanation: `Mẫu ${template.pattern} có nghĩa là "${template.meaning}". Ví dụ: ${template.example} - ${template.translation}`,
    answers: shuffleArray([
      {
        answerText: template.meaning,
        isCorrect: true
      },
      {
        answerText: wrongAnswers[0],
        isCorrect: false
      },
      {
        answerText: wrongAnswers[1],
        isCorrect: false
      },
      {
        answerText: wrongAnswers[2],
        isCorrect: false
      }
    ])
  };
}

function buildStructureQuestion(template, displayOrder) {
  const wrongStructures = [
    "N + を + V",
    "Vて + ください",
    "Vます + たいです",
    "Place + で + V",
    "N + が + あります",
    "Sentence + から",
    "V辞書形 + つもりです",
    "N1 + の + N2"
  ].filter(x => x !== template.structure);

  return {
    content: `Cấu trúc đúng của mẫu "${template.pattern}" là gì?`,
    displayOrder,
    difficulty: template.difficulty || 1,
    questionType: "MultipleChoice",
    questionFormat: "StandardChoice",
    skillType: "Grammar",
    explanation: `Cấu trúc đúng là: ${template.structure}. Ví dụ: ${template.example}`,
    answers: shuffleArray([
      {
        answerText: template.structure,
        isCorrect: true
      },
      {
        answerText: wrongStructures[0],
        isCorrect: false
      },
      {
        answerText: wrongStructures[1],
        isCorrect: false
      },
      {
        answerText: wrongStructures[2],
        isCorrect: false
      }
    ])
  };
}

console.log("Loading grammar templates...");

const templates = readJson(templatesPath);

const levelCounters = {
  N5: 0,
  N4: 0,
  N3: 0
};

const generated = [];

for (const template of templates) {
  const level = template.level;

  if (!levelCounters[level] && levelCounters[level] !== 0) {
    levelCounters[level] = 0;
  }

  const index = levelCounters[level]++;

  const { courseTitle, lessonTitle } = assignCourseLesson(level, index);

  generated.push({
    level,
    courseTitle,
    lessonTitle,

    topic: template.topic,
    topics: [template.topic],

    title: template.pattern,
    pattern: template.pattern,
    meaning: template.meaning,
    structure: template.structure,
    example: template.example,
    translation: template.translation,
    explanation: `Mẫu ${template.pattern} có nghĩa là "${template.meaning}". Cấu trúc: ${template.structure}. Ví dụ: ${template.example}`,
    difficulty: template.difficulty || 1,
    status: 1,

    questions: [
      buildMeaningQuestion(template, 1)
    ]
  });

  console.log(`Generated Grammar: ${template.pattern} -> ${lessonTitle}`);
}

fs.mkdirSync(path.dirname(outputPath), {
  recursive: true
});

fs.writeFileSync(
  outputPath,
  JSON.stringify(generated, null, 2),
  "utf8"
);

console.log(`Generated ${generated.length} grammar records`);
console.log(
  `Generated ${generated.reduce((sum, x) => sum + x.questions.length, 0)} grammar questions`
);
console.log(`Saved to ${outputPath}`);