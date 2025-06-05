// ocr-extract-by-chapter.js

const fs = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');
const { execSync } = require('child_process');

const chapters = require('./chapters.json');

const pdfPath = 'sample.pdf'; // 원본 PDF 경로
const outputDir = './output';
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

async function runOCR(imagePath) {
  const worker = await createWorker('eng+kor');
  await worker.loadLanguage('eng+kor');
  await worker.initialize('eng+kor');
  const {
    data: { text }
  } = await worker.recognize(imagePath);
  await worker.terminate();
  return text;
}

function convertPdfToImages(start, end, outputPrefix) {
  const outputPath = path.join(outputDir, outputPrefix);
  const cmd = `pdftoppm -f ${start} -l ${end} -png "${pdfPath}" "${outputPath}"`;
  execSync(cmd);
}

async function processChapter(chapterNameOrIndex) {
  const chapter = isNaN(chapterNameOrIndex)
    ? chapters.find(c => c.name.includes(chapterNameOrIndex))
    : chapters[Number(chapterNameOrIndex) - 1];

  if (!chapter) {
    console.error('❌ 해당 장을 찾을 수 없습니다.');
    return;
  }

  console.log(`\n📖 ${chapter.name} (p.${chapter.start}~${chapter.end}) OCR 시작...`);
  const prefix = chapter.name.replace(/\s+/g, '_');

  convertPdfToImages(chapter.start, chapter.end, prefix);

  const imageFiles = fs
    .readdirSync(outputDir)
    .filter(file => file.startsWith(prefix) && file.endsWith('.png'));

  let fullText = '';
  for (const img of imageFiles) {
    const imgPath = path.join(outputDir, img);
    console.log(`🔍 OCR 중: ${img}`);
    const text = await runOCR(imgPath);
    fullText += `\n--- [${img}] ---\n` + text;
  }

  const txtPath = path.join(outputDir, `${prefix}.txt`);
  fs.writeFileSync(txtPath, fullText, 'utf-8');
  console.log(`✅ 저장 완료: ${txtPath}`);
}

// 실행 시: node ocr-extract-by-chapter.js [장 번호 또는 일부 이름]
const arg = process.argv[2];
if (!arg) {
  console.log('사용법: node ocr-extract-by-chapter.js [장 번호 또는 이름 일부]');
} else {
  processChapter(arg);
}
