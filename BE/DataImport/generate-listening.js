const fs = require("fs");
const path = require("path");

const AUDIO_URL =
  "/listening-audios/JLPTAudio.mp4";

const QUESTION_IMAGE =
  "/listening-questions/JLPTTestImage.jpg";

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
  "../Data/SeedFiles/generated/listening_templates.json"
);

const outputPath = path.join(
  __dirname,
  "../Data/SeedFiles/generated/listenings_generated.json"
);

function readJson(filePath) {
  const content = fs
    .readFileSync(filePath, "utf8")
    .replace(/^\uFEFF/, "")
    .trim();

  return JSON.parse(content);
}

function getRandomItem(arr) {
  return arr[
    Math.floor(Math.random() * arr.length)
  ];
}

function getRandomItems(arr, count) {
  const shuffled = [...arr]
    .sort(() => 0.5 - Math.random());

  return shuffled.slice(
    0,
    Math.min(count, arr.length)
  );
}

function shuffleArray(arr) {
  return [...arr]
    .sort(() => 0.5 - Math.random());
}

function getExampleJapanese(example) {
  return (
    example.content ||
    example.japanese ||
    ""
  );
}

function getExampleTranslation(example) {
  return (
    example.translation ||
    example.vietnamese ||
    example.english ||
    ""
  );
}

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

function buildScript(examples) {
  return examples
    .map(x => getExampleJapanese(x))
    .filter(Boolean)
    .join("\n");
}

function buildTranscript(examples) {
  return examples
    .map(x => getExampleTranslation(x))
    .filter(Boolean)
    .join(" ");
}

function buildTopicQuestion(
  topic,
  displayOrder
) {

  const topics = [
    "Trường học",
    "Gia đình",
    "Mua sắm",
    "Thời gian",
    "Công việc",
    "Du lịch",
    "Ẩm thực",
    "Sức khỏe",
    "Tổng hợp"
  ];

  const wrongTopics =
    topics.filter(x => x !== topic);

  return {
    content:
      "会話の主なテーマは何ですか。",

     explanation:
    `Chủ đề chính của đoạn nghe là "${topic}". Hãy dựa vào các từ khóa và ngữ cảnh trong audio để chọn đáp án đúng.`,

    imageUrl:
      QUESTION_IMAGE,

    mediaTimestamp:
      "00:05",

    displayOrder,

    difficulty: 1,

    questionType:
      "MultipleChoice",

    answers: shuffleArray([
      {
        answerText: topic,
        isCorrect: true
      },
      ...getRandomItems(
        wrongTopics,
        3
      ).map(x => ({
        answerText: x,
        isCorrect: false
      }))
    ])
  };
}

function buildVocabularyQuestion(
  vocabForLevel,
  displayOrder
) {

  const vocab =
    getRandomItem(vocabForLevel);

  if (!vocab) return null;

  const correct =
    vocab.word;

  const wrongWords =
    getRandomItems(
      vocabForLevel
        .map(x => x.word)
        .filter(x =>
          x &&
          x !== correct
        ),
      3
    );

  return {
    content:
      "会話の中で出てきた言葉はどれですか。",

    explanation:
      `Từ đúng xuất hiện trong đoạn nghe là "${correct}". Cần nghe kỹ từ vựng được nhắc đến trong audio.`,

    imageUrl:
      QUESTION_IMAGE,

    mediaTimestamp:
      "00:10",

    displayOrder,

    difficulty: 1,

    questionType:
      "MultipleChoice",

    answers: shuffleArray([
      {
        answerText: correct,
        isCorrect: true
      },
      ...wrongWords.map(x => ({
        answerText: x,
        isCorrect: false
      }))
    ])
  };
}

function buildMeaningQuestion(
  vocabForLevel,
  displayOrder
) {

  const vocab =
    getRandomItem(vocabForLevel);

  if (!vocab) return null;

  const correctMeaning =
    vocab.meaning ||
    vocab.meaningEn ||
    "";

  const wrongMeanings =
    getRandomItems(
      vocabForLevel
        .filter(
          x => x.word !== vocab.word
        )
        .map(
          x =>
            x.meaning ||
            x.meaningEn
        )
        .filter(Boolean),
      3
    );

  return {
    content:
      `「${vocab.word}」の意味は何ですか。`,

    explanation:
  `「${vocab.word}」có nghĩa là "${correctMeaning}". Vì vậy đáp án đúng là "${correctMeaning}".`,
  
    imageUrl:
      QUESTION_IMAGE,

    mediaTimestamp:
      "00:15",

    displayOrder,

    difficulty: 1,

    questionType:
      "MultipleChoice",

    answers: shuffleArray([
      {
        answerText:
          correctMeaning,
        isCorrect: true
      },
      ...wrongMeanings.map(x => ({
        answerText: x,
        isCorrect: false
      }))
    ])
  };
}

function buildQuestions(
  template,
  vocabForLevel
) {

  const questions = [];

  questions.push(
    buildTopicQuestion(
      template.topic,
      1
    )
  );

  const vocabQuestion =
    buildVocabularyQuestion(
      vocabForLevel,
      2
    );

  if (vocabQuestion) {
    questions.push(vocabQuestion);
  }

  const meaningQuestion =
    buildMeaningQuestion(
      vocabForLevel,
      3
    );

  if (meaningQuestion) {
    questions.push(
      meaningQuestion
    );
  }

  return questions.slice(
    0,
    template.questionCount
  );
}

console.log("Loading data...");

const vocabularies =
  readJson(vocabPath);

const examples =
  readJson(examplesPath);

const templates =
  readJson(templatesPath);

const vocabByLevel = {};
const examplesByLevel = {};

for (const vocab of vocabularies) {

  if (!vocabByLevel[vocab.level]) {
    vocabByLevel[vocab.level] = [];
  }

  vocabByLevel[vocab.level]
    .push(vocab);
}

for (const example of examples) {

  if (!examplesByLevel[example.level]) {
    examplesByLevel[
      example.level
    ] = [];
  }

  examplesByLevel[
    example.level
  ].push(example);
}

const generated = [];

const levelCounters = {
  N5: 0,
  N4: 0,
  N3: 0
};

for (const template of templates) {

  const level =
    template.level;

  const examplesForLevel =
    examplesByLevel[level] || [];

  const vocabForLevel =
    vocabByLevel[level] || [];

  if (
    examplesForLevel.length < 3
  ) {
    console.log(
      `Skip ${template.title}`
    );
    continue;
  }

  const selectedExamples =
    getRandomItems(
      examplesForLevel,
      4
    );

  const script =
    buildScript(
      selectedExamples
    );

  const transcript =
    buildTranscript(
      selectedExamples
    );

  const index =
    levelCounters[level]++;

  const {
    courseTitle,
    lessonTitle
  } = assignCourseLesson(
    level,
    index
  );

  const questions =
    buildQuestions(
      template,
      vocabForLevel
    );

  generated.push({

    title:
      template.title,

    audioUrl:
      AUDIO_URL,

    script,

    transcript,

    duration:
      Math.max(
        30,
        Math.floor(
          script.length / 3
        )
      ),

    speedCategory:
      template.speedCategory,

    status: 1,

    level,

    courseTitle,

    lessonTitle,

    topics: [
      template.topic
    ],

    questions
  });

  console.log(
    `Generated: ${template.title}`
  );
}

fs.mkdirSync(
  path.dirname(outputPath),
  {
    recursive: true
  }
);

fs.writeFileSync(
  outputPath,
  JSON.stringify(
    generated,
    null,
    2
  ),
  "utf8"
);

console.log(
  `Generated ${generated.length} listenings`
);

console.log(
  `Saved to ${outputPath}`
);