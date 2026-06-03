const fs = require("fs");
const path = require("path");

const rawDir = path.join(__dirname, "../Data/SeedFiles/raw");
const normalizedDir = path.join(__dirname, "../Data/SeedFiles/normalized");

const vocabPath = path.join(normalizedDir, "vocabularies_n5_n3.json");
const tatoebaPath = path.join(rawDir, "tatoeba_jpn_vie.tsv");

const vocabularies = JSON.parse(fs.readFileSync(vocabPath, "utf8"));

const maxExamplesPerWord = 2;
const maxJapaneseLength = 45;

function parseTsvLine(line) {
  return line.split("\t").map(x => x.trim());
}

function normalizeSentencePair(parts) {
  // Tatoeba exports có thể khác format tùy loại export.
  // Ta cố gắng lấy 2 cột text cuối làm jp/en.
  if (parts.length >= 4) {
    return {
      japanese: parts[1] || parts[0],
      english: parts[3] || parts[2]
    };
  }

  if (parts.length >= 2) {
    return {
      japanese: parts[0],
      english: parts[1]
    };
  }

  return null;
}

function containsTarget(sentence, vocab) {
  if (!sentence) return false;

  return sentence.includes(vocab.word) || sentence.includes(vocab.reading);
}

function isGoodSentence(sentence) {
  if (!sentence) return false;
  if (sentence.length > maxJapaneseLength) return false;
  if (sentence.includes("http")) return false;
  return true;
}

if (!fs.existsSync(tatoebaPath)) {
  console.error(`Missing file: ${tatoebaPath}`);
  process.exit(1);
}

const lines = fs.readFileSync(tatoebaPath, "utf8")
  .split(/\r?\n/)
  .map(x => x.trim())
  .filter(Boolean);

const examples = [];
const countByWord = new Map();
const seen = new Set();

for (const line of lines) {
  const pair = normalizeSentencePair(parseTsvLine(line));
  if (!pair) continue;

  const japanese = pair.japanese;
  const vietnamese = pair.english;

  if (!isGoodSentence(japanese)) continue;

  for (const vocab of vocabularies) {
    const keyBase = `${vocab.word}|${vocab.reading}`;
    const currentCount = countByWord.get(keyBase) || 0;

    if (currentCount >= maxExamplesPerWord) continue;
    if (!containsTarget(japanese, vocab)) continue;

    const key = `${japanese}|${vocab.word}`;
    if (seen.has(key)) continue;

    seen.add(key);
    countByWord.set(keyBase, currentCount + 1);

    examples.push({
      content: japanese,
      translation: vietnamese,
      targetWord: vocab.word,
      targetReading: vocab.reading,
      level: vocab.level,
      source: "Tatoeba"
    });

    break;
  }
}

fs.mkdirSync(normalizedDir, { recursive: true });
console.log("__dirname =", __dirname);
console.log("normalizedDir =", normalizedDir);
fs.writeFileSync(
  path.join(normalizedDir, "examples_n5_n3.json"),
  JSON.stringify(examples, null, 2),
  "utf8"
);

console.log(`Generated ${examples.length} examples.`);