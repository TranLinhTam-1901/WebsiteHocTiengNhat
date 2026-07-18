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
    return `${item.character}|${item.meaningEn}`;
  }

    async function translateBatch(batch, startIndex) {
    const separator = "\n@@@KANJI_SPLIT_9X9@@@\n";

    const text = batch
      .map(item => item.meaningEn)
      .join(separator);

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const translatedText = await translate(text, { to: "vi" });

        const translatedParts = translatedText
          .split(/@@@KANJI_SPLIT_9X9@@@|---ITEM---|---MỤC---/g)
          .map(x => x.trim())
          .filter(Boolean);

        return batch.map((item, index) => {
          const meaningVi = translatedParts[index] || "";

          console.log(
            `✓ [${item.originalIndex || startIndex + index}] ${item.character} -> ${meaningVi}`
          );

          return {
            character: item.character,
            meaningVi,
            meaningEn: item.meaningEn,
            level: item.level
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

    return [];
  }

  function chunkArray(array, size) {
    const chunks = [];

    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }

    return chunks;
  }

  function saveResults(outputPath, results) {
    fs.writeFileSync(
      outputPath,
      JSON.stringify(results, null, 2),
      "utf8"
    );
  }

  function getEntries(db) {
    if (Array.isArray(db)) return db;
    if (Array.isArray(db.characters)) return db.characters;
    if (Array.isArray(db.kanji)) return db.kanji;
    return [];
  }

  function normalizeJlptLevelFromKanjidic(value) {
    const v = String(value || "").trim();

    if (v === "4") return "N5";
    if (v === "3") return "N4";

    // KANJIDIC2 không có N3 mới chính xác.
    // Để phục vụ demo N5-N3, tạm map JLPT cũ level 2 thành N3.
    if (v === "2") return "N3";

    if (v === "1") return "N1";

    return null;
  }

  function getCharacter(entry) {
    return entry.literal || entry.character || entry.kanji || "";
  }

  function getJlpt(entry) {
    return normalizeJlptLevelFromKanjidic(
      entry.misc?.jlptLevel ||
      entry.jlpt ||
      entry.jlptLevel
    );
  }

  function getMeaningsEn(entry) {
    const meanings =
      entry.readingMeaning?.groups?.[0]?.meanings ||
      entry.meanings ||
      entry.meaning ||
      [];

    if (Array.isArray(meanings)) {
      return meanings
        .filter(x => {
          if (typeof x === "string") return true;
          return !x.lang || x.lang === "en";
        })
        .map(x => typeof x === "string" ? x : x.value || x.text || "")
        .filter(Boolean)
        .join(", ");
    }

    return String(meanings || "");
  }

  async function translateOne(item, index) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const meaningVi = await translate(item.meaningEn, { to: "vi" });

        console.log(`✓ [${index}] ${item.character} -> ${meaningVi}`);

        return {
          character: item.character,
          meaningVi,
          meaningEn: item.meaningEn,
          level: item.level
        };
      } catch (err) {
        const message = err.message || String(err);

        console.log(`✗ [${index}] ${item.character} lần ${attempt}: ${message}`);

        if (message.includes("429")) {
          console.log("Bị 429, nghỉ lâu hơn...");
          await sleep(30000 * attempt);
        } else {
          await sleep(3000 * attempt);
        }
      }
    }

    return null;
  }

  async function main() {
    const inputPath = path.join(
      __dirname,
      "../Data/SeedFiles/raw/kanjidic2.json"
    );

    const outputPath = path.join(
      __dirname,
      "../Data/SeedFiles/normalized/translated_kanji_meanings.json"
    );

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const raw = JSON.parse(fs.readFileSync(inputPath, "utf8"));
    const entries = getEntries(raw);

    const allowedLevels = new Set(["N5", "N4", "N3"]);

    const data = entries
      .map(entry => {
        const character = getCharacter(entry);
        const level = getJlpt(entry);
        const meaningEn = getMeaningsEn(entry);

        return {
          character,
          level,
          meaningEn
        };
      })
      .filter(x =>
        x.character &&
        x.meaningEn &&
        x.level &&
        allowedLevels.has(x.level)
      );

    let results = readJsonIfExists(outputPath, []);

   const translatedMap = new Map(
    results
      .filter(x => x.character)
      .map(x => [makeKey(x), x])
  );

    console.log(`Đã có sẵn: ${translatedMap.size}/${data.length}`);

    const remaining = data.filter(item => {
    const existed = translatedMap.get(item.character);
      return !(existed && existed.meaningVi);
    });

  console.log(`Cần dịch thêm: ${remaining.length}/${data.length}`);

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
      if (translatedItem && translatedItem.meaningVi) {
        translatedMap.set(makeKey(translatedItem), translatedItem);
      }
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