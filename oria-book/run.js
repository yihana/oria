// Regactored run.js
const path = require('path');
const fs = require('fs');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

// 공통 모듈 import
const { convertPdfToImages } = require('./common/pdf-to-image');
const { extractAllTextsWithOCR } = require('./common/ocr-extract-by-chapter');
const { extractTextFromAllImages, extractTextByChapters } = require('./common/extract-to-txt');
const { uploadToNotion, uploadTxtFilesToNotion } = require('./common/notion-upload');

// 명령행 인자 처리
const argv = yargs(hideBin(process.argv))
  .option('book', {
    alias: 'b',
    type: 'string',
    describe: '처리할 책 폴더명 (예: micro, macro, tax)',
    demandOption: true
  })
  .option('chapter', {
    alias: 'c',
    type: 'string',
    describe: '특정 챕터 이름만 처리 (예: "01장_경제학의_개요")'
  })
  .option('mode', {
    alias: 'm',
    type: 'string',
    choices: ['all', 'chapter'],
    default: 'all',
    describe: '처리 모드: all(전체), chapter(챕터별)'
  })
  .option('skip-pdf', {
    type: 'boolean',
    default: false,
    describe: 'PDF → 이미지 변환 건너뛰기'
  })
  .option('skip-image', {
    type: 'boolean',
    default: false,
    describe: '이미지 단계 생략'
  })
  .option('skip-ocr', {
    type: 'boolean',
    default: false,
    describe: 'OCR 텍스트 추출 건너뛰기'
  })
  .option('skip-upload', {
    type: 'boolean',
    default: false,
    describe: 'Notion 업로드 건너뛰기'
  })  
  .help()  
  .argv;

// 경로 설정
const BOOK_NAME = argv.book;
const CHAPTER_FILTER = argv.chapter;
const BASE_PATH = path.join(__dirname, BOOK_NAME);
const DATA_PATH = path.join(BASE_PATH, 'data');
const IMAGE_PATH = path.join(DATA_PATH, 'images');
const OUTPUT_PATH = path.join(BASE_PATH, 'output');
const CHAPTERS_PATH = path.join(BASE_PATH, 'chapters.json');

/**
 * 필요한 디렉토리 생성
 */
function ensureDirectories() {
  const dirs = [BASE_PATH, DATA_PATH, IMAGE_PATH, OUTPUT_PATH];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 디렉토리 생성: ${dir}`);
    }
  });
}

/**
 * PDF 파일을 이미지로 변환
 */
async function processPdfToImages() {
  if (argv.skipImage) {
    console.log('⏭️ 이미지 생성 단계 건너뛰기');
    return;
  }
  if (argv.skipPdf) {
    console.log('⏭️ PDF 변환 건너뛰기');
    return;
  }
  
  console.log(`\n🔄 PDF → 이미지 변환 시작`);
  
  if (!fs.existsSync(DATA_PATH)) {
    console.error(`❌ 데이터 디렉토리가 없습니다: ${DATA_PATH}`);
    return;
  }
  
  const pdfFiles = fs.readdirSync(DATA_PATH)
    .filter(file => file.toLowerCase().endsWith('.pdf'))
    .sort();
  
  if (pdfFiles.length === 0) {
    console.warn('⚠️ 처리할 PDF 파일이 없습니다.');
    return;
  }
  
  console.log(`📄 발견된 PDF 파일: ${pdfFiles.length}개`);
  
  for (let i = 0; i < pdfFiles.length; i++) {
    const pdfFile = pdfFiles[i];
    const pdfPath = path.join(DATA_PATH, pdfFile);
    
    console.log(`[${i + 1}/${pdfFiles.length}] ${pdfFile} 변환 중...`);
    
    try {
      await convertPdfToImages(pdfPath, IMAGE_PATH);
      console.log(`  ✅ ${pdfFile} 변환 완료`);
    } catch (error) {
      console.error(`  ❌ ${pdfFile} 변환 실패:`, error.message);
    }
  }
  
  console.log('✅ PDF → 이미지 변환 완료');
}

/**
 * 이미지에서 텍스트 추출
 */
async function processOcrExtraction() {
  if (argv.skipOcr) {
    console.log('⏭️ OCR 추출 건너뛰기');
    return;
  }
  
  console.log(`\n🔍 OCR 텍스트 추출 시작`);
  
  if (!fs.existsSync(IMAGE_PATH)) {
    console.error(`❌ 이미지 디렉토리가 없습니다: ${IMAGE_PATH}`);
    return;
  }
  
  try {
    if (argv.mode === 'chapter' && fs.existsSync(CHAPTERS_PATH)) {
      // 챕터별 처리
      console.log('📚 챕터별 모드로 처리');
      const chapters = JSON.parse(fs.readFileSync(CHAPTERS_PATH, 'utf8'));
      await extractTextByChapters(IMAGE_PATH, OUTPUT_PATH, chapters, { verbose: true });
    } else {
      // 전체 파일 처리
      console.log('📖 전체 모드로 처리');
      await extractTextFromAllImages(IMAGE_PATH, OUTPUT_PATH, { verbose: true });
    }
    
    console.log('✅ OCR 텍스트 추출 완료');
  } catch (error) {
    console.error('❌ OCR 추출 실패:', error.message);
  }
}

/**
 * Notion 업로드
 */
async function processNotionUpload() {
  if (argv.skipUpload) {
    console.log('⏭️ Notion 업로드 건너뛰기');
    return;
  }
  
  console.log(`\n📤 Notion 업로드 시작`);
  
  if (!fs.existsSync(OUTPUT_PATH)) {
    console.error(`❌ 출력 디렉토리가 없습니다: ${OUTPUT_PATH}`);
    return;
  }
  
  const txtFiles = fs.readdirSync(OUTPUT_PATH)
    .filter(file => file.toLowerCase().endsWith('.txt'));
  
  if (txtFiles.length === 0) {
    console.warn('⚠️ 업로드할 텍스트 파일이 없습니다.');
    return;
  }
  
  try {
    await uploadTxtFilesToNotion(OUTPUT_PATH);
    console.log('✅ Notion 업로드 완료');
  } catch (error) {
    console.error('❌ Notion 업로드 실패:', error.message);
  }
}

/**
 * 메인 실행 함수
 */
async function run() {
  console.log(`\n📊 ${BOOK_NAME} 처리 시작 📊`);
  console.log(`처리 모드: ${argv.mode}`);
  console.log(`작업 경로: ${BASE_PATH}`);
  
  try {
    // 1. 디렉토리 확인/생성
    ensureDirectories();
    
    // 2. PDF → 이미지 변환
    await processPdfToImages();
    
    // 3. OCR 텍스트 추출
    await processOcrExtraction();
    
    // 4. Notion 업로드
    await processNotionUpload();
    
    console.log(`\n🎉 ${BOOK_NAME} 전체 처리 완료! 🎉`);
    
  } catch (error) {
    console.error('\n❌ 처리 중 오류 발생:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  run();
}

module.exports = { run };


