// ocr-extract-by-chapter.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const Tesseract = require('tesseract.js');

const CHAPTERS_FILE = './chapters.json';
const PDF_FILE = '01장_경제학의_개요.pdf'; // 🔄 수정된 파일명
const OUTPUT_DIR = './output';

const chapterId = process.argv[2];
if (!chapterId) {
  console.error('❗장 번호(예: 01)를 인자로 입력해주세요.');
  process.exit(1);
}

function loadChapters() {
  const data = fs.readFileSync(CHAPTERS_FILE, 'utf-8');
  return JSON.parse(data);
}

function convertPdfToImages(pdfPath, chapterName, startPage, endPage) {
  const outputPath = path.join(OUTPUT_DIR, chapterName);
  fs.mkdirSync(outputPath, { recursive: true });

  const cmd = `pdftoppm -f ${startPage} -l ${endPage} -png "${pdfPath}" "${path.join(outputPath, chapterName)}"`;
  execSync(cmd);
  return outputPath;
}

async function runOcrOnImages(imageDir, chapterName) {
  const files = fs.readdirSync(imageDir).filter(f => f.endsWith('.png')).sort();
  let fullText = '';

  const worker = await Tesseract.createWorker();
  await worker.loadLanguage('eng+kor');
  await worker.initialize('eng+kor');

  for (const file of files) {
    const filePath = path.join(imageDir, file);
    console.log(`🔍 OCR 중: ${file}`);
    const { data: { text } } = await worker.recognize(filePath);
    fullText += `\n\n--- ${file} ---\n\n${text}`;
  }

  await worker.terminate();

  const outPath = path.join(OUTPUT_DIR, `${chapterName}.txt`);
  fs.writeFileSync(outPath, fullText, 'utf-8');
  console.log(`✅ OCR 결과 저장: ${outPath}`);
}

async function processChapter() {
  const chapters = loadChapters();
  const chapter = chapters[parseInt(chapterId, 10) - 1];

  if (!chapter) {
    console.error(`❌ ${chapterId}장 정보를 찾을 수 없습니다.`);
    return;
  }

  const { name, start, end } = chapter;
  console.log(`📖 ${name} (p.${start}~${end}) OCR 시작...`);

  if (!fs.existsSync(PDF_FILE)) {
    console.error(`❌ PDF 파일을 찾을 수 없습니다: ${PDF_FILE}`);
    process.exit(1);
  }

  const imageDir = convertPdfToImages(PDF_FILE, name, start, end);
  await runOcrOnImages(imageDir, name);
}

processChapter();
