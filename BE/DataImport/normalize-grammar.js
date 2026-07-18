const fs = require("fs");
const path = require("path");

const rawDir = path.join(__dirname, "../Data/SeedFiles/raw");
const normalizedDir = path.join(__dirname, "../Data/SeedFiles/normalized");

const rawPath = path.join(rawDir, "grammar_raw.csv");

const grammarTypes = new Set([
  "General",
  "Particle",
  "TeForm",
  "TaForm",
  "NaiForm",
  "DictionaryForm",
  "SentenceEnding",
  "Conjunction",
  "Adjective",
  "Comparison",
  "NounModification",
  "Condition",
  "GivingReceiving",
  "Potential",
  "Honorific"
]);

const formalities = new Set([
  "Neutral",
  "Casual",
  "Polite",
  "Formal",
  "Honorific",
  "Humble"
]);

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let insideQuote = false;

  for (const char of line) {
    if (char === '"') {
      insideQuote = !insideQuote;
      continue;
    }

    if (char === "," && !insideQuote) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

function normalizeGrammarType(value) {
  const v = String(value || "").trim();
  return grammarTypes.has(v) ? v : "General";
}

function normalizeFormality(value) {
  const v = String(value || "").trim();
  return formalities.has(v) ? v : "Neutral";
}

function normalizeTopics(value) {
  if (!value) return ["Tổng hợp"];

  return String(value)
    .split("|")
    .map(x => x.trim())
    .filter(Boolean);
}

if (!fs.existsSync(rawPath)) {
  console.error(`Missing file: ${rawPath}`);
  process.exit(1);
}

const csv = fs.readFileSync(rawPath, "utf8");
const lines = csv
  .split(/\r?\n/)
  .map(x => x.trim())
  .filter(Boolean);

const headers = parseCsvLine(lines[0]);
const rows = lines.slice(1);

const grammars = [];
const groupMap = new Map();

for (const row of rows) {
  const values = parseCsvLine(row);
  const item = {};

  headers.forEach((h, i) => {
    item[h] = values[i] || "";
  });

  if (!item.title || !item.structure || !item.level || !item.lessonTitle) {
    continue;
  }

  const groupName = item.group || "Khác";

  if (!groupMap.has(groupName)) {
    groupMap.set(groupName, {
      groupName,
      description: `Nhóm ngữ pháp: ${groupName}`
    });
  }

  grammars.push({
    title: item.title,
    structure: item.structure,
    meaning: item.meaning || "",
    explanation: item.explanation || "",
    grammarType: normalizeGrammarType(item.grammarType),
    formality: normalizeFormality(item.formality),
    group: groupName,
    usageNote: item.usageNote || "",
    level: item.level.toUpperCase(),
    lessonTitle: item.lessonTitle,
    topics: normalizeTopics(item.topics),
    status: 1
  });
}

fs.mkdirSync(normalizedDir, { recursive: true });

fs.writeFileSync(
  path.join(normalizedDir, "grammar_groups.json"),
  JSON.stringify([...groupMap.values()], null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(normalizedDir, "grammars_n5_n3.json"),
  JSON.stringify(grammars, null, 2),
  "utf8"
);

console.log(`Generated ${groupMap.size} grammar groups.`);
console.log(`Generated ${grammars.length} grammars.`);