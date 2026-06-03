const fs = require("fs");
const path = require("path");
const translate = require("translate-google");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function makeKey(item) {
  const expression = item.expression || "";
  const reading = item.reading || "";
  const meaning = item.meaning || item.meaningEn || "";

  return `${expression}|${reading}|${meaning}`;
}

function saveResults(outputPath, results) {
  fs.writeFileSync(
    outputPath,
    JSON.stringify(results, null, 2),
    "utf8"
  );
}

async function translateBatch(batch, startIndex) {
  const separator = "\n@@@JLPT_SPLIT_9X9@@@\n";

  const text = batch
    .map(item => item.meaning)
    .join(separator);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const translatedText = await translate(text, { to: "vi" });

      const translatedParts = translatedText
        .split(/@@@JLPT_SPLIT_9X9@@@|---ITEM---|---MỤC---/g)
        .map(x => x.trim())
        .filter(Boolean);

      return batch.map((item, index) => {
        const meaningVi = translatedParts[index] || "";

        console.log(`✓ [${item.originalIndex || startIndex + index}] ${item.expression} -> ${meaningVi}`);

        return {
          expression: item.expression,
          reading: item.reading,
          meaningVi,
          meaningEn: item.meaning,
          tags: item.tags
        };
      });
    } catch (err) {
      const message = err.message || String(err);

      console.log(`✗ Batch từ [${startIndex}] lỗi lần ${attempt}: ${message}`);

      if (message.includes("429")) {
        console.log("Bị 429, nghỉ lâu hơn...");
        await sleep(60000 * attempt);
      } else {
        await sleep(5000 * attempt);
      }
    }
  }

  return batch.map(item => ({
    expression: item.expression,
    reading: item.reading,
    meaningVi: "",
    meaningEn: item.meaning,
    tags: item.tags
  }));
}
async function main() {
  const inputPath = path.join(
    __dirname,
    "../Data/SeedFiles/raw/jlpt_words.json"
  );

  const outputPath = path.join(
    __dirname,
    "../Data/SeedFiles/normalized/translated_vocab.json"
  );

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  let results = readJsonIfExists(outputPath, []);

  const translatedMap = new Map(
    results
      .filter(x => x.expression)
      .map(x => [makeKey(x), x])
  );

  console.log(`Đã có sẵn: ${results.length}/${data.length}`);

  const batchSize = 10;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data
      .slice(i, i + batchSize)
      .filter(item => {
        const existed = translatedMap.get(makeKey(item));
        return !(existed && existed.meaningVi);
      });

    if (batch.length === 0) {
      console.log(`↷ Bỏ qua batch ${i + 1}-${i + batchSize}, đã dịch`);
      continue;
    }

    const translatedBatch = await translateBatch(batch, i + 1);

    for (const translatedItem of translatedBatch) {
      translatedMap.set(makeKey(translatedItem), translatedItem);
    }

    results = data
      .map(x => translatedMap.get(makeKey(x)))
      .filter(Boolean);

    saveResults(outputPath, results);

    console.log(`Đã lưu tạm: ${results.length}/${data.length}`);

    await sleep(5000);
  }

  console.log("Done!");
}

main();