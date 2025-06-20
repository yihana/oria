// tax/run.js
const path = require("path");
const { extractTextByChapters } = require("../common/ocr-extract-by-chapter");

const baseDir = __dirname;
const dataDir = path.join(bookDir, 'data');
const outputDir = path.join(bookDir, 'output');
const chaptersPath = path.join(baseDir, "chapters.json");

(async () => {
  console.log("📘 [tax] OCR 추출 시작");
  await extractTextByChapters(dataDir, outputDir, chaptersPath);
  console.log("✅ [tax] OCR 추출 완료");
})();