const path = require("path");
const fs = require("fs");
const { convertPdfToImages } = require("../common/pdf-to-image");
const { extractTextFromAllImages } = require("../common/extract-to-txt");

const bookType = "micro"; // 미시경제학용 구분자

const DATA_DIR = path.resolve(__dirname, "data");
const IMAGE_DIR = path.resolve(DATA_DIR, "images");
const OUTPUT_DIR = path.resolve(__dirname, "output");

const pdfList = [
  "01장_경제학의_개요.pdf",
  "03장_수요와_공급의_이론.pdf"
  // 필요시 추가
];

async function processPdfToImages() {
  console.log(`\n=== ${bookType} PDF → 이미지 변환 시작 ===`);

  if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });

  for (const pdfName of pdfList) {
    const pdfPath = path.join(DATA_DIR, pdfName);
    if (!fs.existsSync(pdfPath)) {
      console.warn(`❗ PDF 파일 없음: ${pdfPath}`);
      continue;
    }

    try {
      console.log(`ImageMagick로 변환 중: ${pdfPath}`);
      await convertPdfToImages(pdfPath, IMAGE_DIR);
      console.log(`✅ PDF → 이미지 변환 완료: ${IMAGE_DIR}`);
    } catch (err) {
      console.error(`❌ 변환 실패: ${err.message}`);
    }
  }

  console.log(`\n✅ ${bookType} PDF → 이미지 변환 완료! ✅`);
}

async function run() {
  console.log(`\n📊 ${bookType} 처리 시작 📊`);
  console.log("데이터 디렉토리:", DATA_DIR);
  console.log("출력 디렉토리:", OUTPUT_DIR);

  await processPdfToImages();

  console.log("\n=== OCR 텍스트 추출 시작 ===");
  await extractTextFromAllImages(IMAGE_DIR, OUTPUT_DIR, bookType);
  console.log("=== OCR 텍스트 추출 완료 ===");

  console.log(`\n✅ ${bookType} 처리 완료! ✅`);
}

run();
