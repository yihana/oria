//**✅ micro/run.js**

const path = require("path");
const fs = require("fs");
const { convertPdfToImages } = require("../common/pdf-to-image");
const { extractTextFromAllImages } = require("../common/extract-to-txt");
const { uploadTxtFilesToNotion } = require("../common/notion-upload");
require("dotenv").config();

const bookName = process.argv[2];
if (!bookName) {
  console.error("❌ 책 이름이 필요합니다: 예) node run.js micro");
  process.exit(1);
}

const BASE_DIR = path.resolve(__dirname, bookName);
const DATA_DIR = path.join(BASE_DIR, "data");
const IMAGE_DIR = path.join(DATA_DIR, "images");
const OUTPUT_DIR = path.join(BASE_DIR, "output");

const pdfList = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".pdf"));

async function processPdfToImages() {
  console.log(`\n=== ${bookName} PDF → 이미지 변환 시작 ===`);
  if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });

  // for (const pdfName of pdfList) {
  //   const pdfPath = path.join(DATA_DIR, pdfName);
  //   if (!fs.existsSync(pdfPath)) {
  //     console.warn(`❗ PDF 파일 없음: ${pdfPath}`);
  //     continue;
  //   }

  //   try {
  //     console.log(`ImageMagick로 변환 중: ${pdfPath}`);
  //     await convertPdfToImages(pdfPath, IMAGE_DIR);
  //     console.log(`✅ PDF → 이미지 변환 완료: ${IMAGE_DIR}`);
  //   } catch (err) {
  //     console.error(`❌ 변환 실패: ${err.message}`);
  //   }
  // }

  const pdfFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".pdf"));
  for (const pdf of pdfFiles) {
    const pdfPath = path.join(DATA_DIR, pdf);
    await convertPdfToImages(pdfPath, IMAGE_DIR);
  }
  console.log(`\n✅ ${bookName} PDF → 이미지 변환 완료! ✅`);

}

async function run() {
  console.log("\n📊 ${bookName} 처리 시작 📊");
  console.log("데이터 디렉토리:", DATA_DIR);
  console.log("출력 디렉토리:", OUTPUT_DIR);

  await processPdfToImages();

  console.log("\n=== OCR 텍스트 추출 시작 ===");
  await extractTextFromAllImages(IMAGE_DIR, OUTPUT_DIR);
  console.log("=== OCR 텍스트 추출 완료 ===");

  console.log("\n=== Notion 업로드 시작 ===");
  await uploadTxtFilesToNotion(OUTPUT_DIR);
  console.log("=== Notion 업로드 완료 ===");

  console.log("\n✅ micro 처리 완료! ✅");
}

run();