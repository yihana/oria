// ✅ common/extract-to-txt.js (최종버전)

const fs = require("fs");
const path = require("path");
const Tesseract = require("tesseract.js");

// 한글 글자 사이 과도한 공백 제거 (개선된 버전)
function removeExtraSpaces(text) {
  return text
    .replace(/([\uAC00-\uD7A3])\s+(?=[\uAC00-\uD7A3])/g, "$1") // 한글 사이 공백 제거
    .replace(/[ ]{2,}/g, " "); // 다중 공백을 하나로
}

// 이미지 하나에서 텍스트 추출
async function extractText(imagePath) {
  const worker = await Tesseract.createWorker("kor", 1, {
    cachePath: path.resolve(__dirname, "../config/tessdata"),
  });
  await worker.loadLanguage("kor");
  await worker.initialize("kor");
  const {
    data: { text },
  } = await worker.recognize(imagePath);
  await worker.terminate();
  return removeExtraSpaces(text);
}

// 전체 이미지에서 OCR 수행 후 txt로 저장
async function extractTextFromAllImages(imageDir, outputDir) {
  const files = fs.readdirSync(imageDir).filter(f => f.endsWith(".png"));
  const chapters = {};

  for (const file of files) {
    const [chapter] = file.split("_");
    if (!chapters[chapter]) chapters[chapter] = [];
    chapters[chapter].push(file);
  }

  for (const chapter of Object.keys(chapters)) {
    const images = chapters[chapter].sort();
    let chapterText = "";

    for (const imageFile of images) {
      const imagePath = path.join(imageDir, imageFile);
      console.log(`  📄 OCR: ${imageFile}`);
      const text = await extractText(imagePath);
      chapterText += text + "\n";
    }

    const outputFile = path.join(outputDir, `${chapter}.txt`);
    fs.writeFileSync(outputFile, chapterText, "utf-8");
    console.log(`✅ 저장 완료: ${outputFile}`);
  }
}

module.exports = { extractTextFromAllImages };
