#!/bin/bash

# 사용법: ./scripts/init.sh "책제목(폴더이름)"
# 예시: ./scripts/init.sh "micro"

BOOK=$1

if [ -z "$BOOK" ]; then
  echo "❗ 책 제목(폴더 이름)을 인자로 전달하세요."
  echo "사용법: ./scripts/init.sh [책제목]"
  exit 1
fi

echo "📁 [$BOOK] 책 폴더 구조 생성 중..."

mkdir -p "$BOOK/data"
mkdir -p "$BOOK/output"

cp templates/chapters.template.json "$BOOK/chapters.json"

cat <<EOF > "$BOOK/run.js"
const path = require("path");
const fs = require("fs");
const { convertPdfToImages } = require("../common/pdf-to-image");
const { extractTextByChapterJson } = require("../common/extract-to-txt");

const BOOK_NAME = "${BOOK}";
const DATA_DIR = path.resolve(__dirname, "data");
const IMAGE_DIR = path.resolve(DATA_DIR, "images");
const OUTPUT_DIR = path.resolve(__dirname, "output");
const CHAPTERS_FILE = path.resolve(__dirname, "chapters.json");

async function processPdfToImages() {
  console.log("\\n=== \${BOOK_NAME} PDF → 이미지 변환 시작 ===");

  if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });

  const pdfFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".pdf"));

  for (const pdfName of pdfFiles) {
    const pdfPath = path.join(DATA_DIR, pdfName);
    try {
      console.log(\`ImageMagick로 변환 중: \${pdfPath}\`);
      await convertPdfToImages(pdfPath, IMAGE_DIR);
    } catch (err) {
      console.error(\`❌ 변환 실패: \${err.message}\`);
    }
  }

  console.log("\\n✅ \${BOOK_NAME} PDF → 이미지 변환 완료!");
}

async function run() {
  console.log("\\n📚 \${BOOK_NAME} 처리 시작 📚");
  console.log("데이터 디렉토리:", DATA_DIR);
  console.log("출력 디렉토리:", OUTPUT_DIR);

  await processPdfToImages();

  console.log("\\n=== OCR 텍스트 추출 시작 ===");
  await extractTextByChapterJson(CHAPTERS_FILE, IMAGE_DIR, OUTPUT_DIR);
  console.log("=== OCR 텍스트 추출 완료 ===");

  console.log("\\n✅ \${BOOK_NAME} 처리 완료! ✅");
}

run();
EOF

echo "✅ [$BOOK] 구조 및 실행 스크립트 생성 완료!"
