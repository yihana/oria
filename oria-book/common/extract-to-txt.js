const fs = require("fs");
const path = require("path");
const Tesseract = require("tesseract.js");

/**
 * 이미지에서 한글 텍스트 추출 후 TXT로 저장
 * @param {string} imageDir - 이미지가 저장된 디렉토리
 * @param {string} outputDir - 텍스트 출력 디렉토리
 * @param {string} prefix - 출력 파일명 접두사 (예: 'micro')
 */
async function extractTextFromAllImages(imageDir, outputDir, prefix = "micro") {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const files = fs.readdirSync(imageDir).filter(f => f.endsWith(".png"));
  const grouped = groupByPrefix(files);

  let allTexts = "";

  for (const [title, images] of Object.entries(grouped)) {
    const sortedImages = images.sort(); // 이미지 순서 보장
    let combinedText = "";

    for (const image of sortedImages) {
      const imagePath = path.join(imageDir, image);
      const { data: { text } } = await Tesseract.recognize(
        imagePath,
        "kor",
        {
          langPath: path.resolve(__dirname, "../tessdata"), // 직접 다운로드한 kor.traineddata 경로
          logger: m => process.stdout.write(".") // 진행 표시
        }
      );
      combinedText += text + "\n";
    }

    const outputFilename = `${prefix}_ocr_${title}.txt`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, combinedText, "utf-8");
    console.log(`\n✅ ${outputFilename} 저장 완료`);
    allTexts += combinedText + "\n";
  }

  const allOutputPath = path.join(outputDir, `${prefix}_ocr_all_texts.txt`);
  fs.writeFileSync(allOutputPath, allTexts, "utf-8");
  console.log(`\n✅ 전체 텍스트 저장 완료: ${allOutputPath}`);
}

/**
 * 이미지 파일을 챕터별로 묶기 (예: '01장_경제학의_개요-001.png' → '01장_경제학의_개요')
 */
function groupByPrefix(files) {
  const groups = {};
  for (const file of files) {
    const match = file.match(/^(.+)-\d{3}\.png$/);
    if (!match) continue;
    const prefix = match[1];
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(file);
  }
  return groups;
}

module.exports = { extractTextFromAllImages };
