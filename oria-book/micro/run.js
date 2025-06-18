const fs = require('fs');
const path = require('path');

// 공통 모듈 import
const { extractAllTexts } = require('../common/extract');
const { saveTextsToFiles, saveAllTextsToOneFile } = require('../common/extract-to-txt');
const { convertPdfToImages } = require('../common/pdf-to-image');
const { extractAllTextsWithOCR } = require('../common/ocr-extract-by-chapter');
const { summarizeAllChapters, saveSummariesToFiles } = require('../common/summarize');

// 거시경제학 설정
const CONFIG = {
  name: 'macro',
  displayName: '거시경제학',
  dataDir: path.join(__dirname, 'data'),
  outputDir: path.join(__dirname, 'output'),
  chaptersFile: path.join(__dirname, 'chapters.json'),
  
  // 거시경제학 특화 옵션
  ocrOptions: {
    imageExtensions: ['.png', '.jpg', '.jpeg'],
    verbose: false
  },
  
  summaryOptions: {
    summaryType: 'detailed',
    maxLength: 1500,
    subject: '거시경제학'
  }
};

/**
 * 거시경제학 챕터 정보 로드
 */
function loadChapters() {
  try {
    const chaptersData = fs.readFileSync(CONFIG.chaptersFile, 'utf8');
    return JSON.parse(chaptersData);
  } catch (error) {
    console.error('챕터 정보 로드 실패:', error.message);
    process.exit(1);
  }
}

/**
 * PDF 텍스트 추출 실행
 */
async function runPDFExtraction() {
  console.log(`\n=== ${CONFIG.displayName} PDF 텍스트 추출 시작 ===`);
  
  const chapters = loadChapters();
  const allTexts = await extractAllTexts(CONFIG.dataDir, chapters);
  
  // 개별 파일로 저장
  saveTextsToFiles(allTexts, CONFIG.outputDir, CONFIG.name);
  
  // 전체 파일로 저장
  saveAllTextsToOneFile(allTexts, CONFIG.outputDir, `${CONFIG.name}_all_texts.txt`);
  
  console.log(`${CONFIG.displayName} PDF 텍스트 추출 완료!\n`);
  return allTexts;
}

/**
 * OCR 텍스트 추출 실행
 */
async function runOCRExtraction() {
  console.log(`\n=== ${CONFIG.displayName} OCR 텍스트 추출 시작 ===`);
  
  const chapters = loadChapters();
  const allTexts = await extractAllTextsWithOCR(CONFIG.dataDir, chapters, CONFIG.ocrOptions);
  
  // OCR 결과 저장
  const ocrOutputDir = path.join(CONFIG.outputDir, 'ocr');
  saveTextsToFiles(allTexts, ocrOutputDir, `${CONFIG.name}_ocr`);
  saveAllTextsToOneFile(allTexts, ocrOutputDir, `${CONFIG.name}_ocr_all_texts.txt`);
  
  console.log(`${CONFIG.displayName} OCR 텍스트 추출 완료!\n`);
  return allTexts;
}

/**
 * 텍스트 요약 실행
 */
async function runSummarization(allTexts) {
  console.log(`\n=== ${CONFIG.displayName} 텍스트 요약 시작 ===`);
  
  const summaries = await summarizeAllChapters(allTexts, CONFIG.summaryOptions);
  
  // 요약 결과 저장
  const summaryOutputDir = path.join(CONFIG.outputDir, 'summaries');
  saveSummariesToFiles(summaries, summaryOutputDir, CONFIG.name);
  
  console.log(`${CONFIG.displayName} 텍스트 요약 완료!\n`);
  return summaries;
}

/**
 * 메인 실행 함수
 */
async function main() {
  try {
    console.log(`\n📊 ${CONFIG.displayName} 처리 시작 📊`);
    console.log(`데이터 디렉토리: ${CONFIG.dataDir}`);
    console.log(`출력 디렉토리: ${CONFIG.outputDir}`);
    
    // 출력 디렉토리 생성
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }
    
    // 명령행 인자 처리
    const args = process.argv.slice(2);
    const command = args[0] || 'pdf';
    
    let allTexts;
    
    switch (command.toLowerCase()) {
      case 'pdf':
        allTexts = await runPDFExtraction();
        break;

      case 'convert':
        console.log(`\n=== ${CONFIG.displayName} PDF → 이미지 변환 시작 ===`);
        const chaptersForImages = loadChapters();

        for (const chapter of chaptersForImages) {
          const pdfFileName = `${chapter.name}.pdf`;  // e.g., 01_서론.pdf
          const pdfPath = path.join(CONFIG.dataDir, pdfFileName);
          const imageOutputDir = path.join(CONFIG.dataDir, 'images');

          if (!fs.existsSync(imageOutputDir)) {
            fs.mkdirSync(imageOutputDir, { recursive: true });
          }

          if (fs.existsSync(pdfPath)) {
            await convertPdfToImages(pdfPath, imageOutputDir);
          } else {
            console.warn(`❗ PDF 파일 없음: ${pdfPath}`);
          }
        }

        console.log(`\n✅ ${CONFIG.displayName} PDF → 이미지 변환 완료! ✅`);
        break;
        
      case 'ocr':
        allTexts = await runOCRExtraction();
        break;
        
      case 'summarize':
        // 기존 텍스트 파일에서 로드하여 요약
        const chapters = loadChapters();
        allTexts = {};
        
        for (const chapter of chapters) {
          const textFile = path.join(CONFIG.outputDir, `${CONFIG.name}_${chapter.name}.txt`);
          if (fs.existsSync(textFile)) {
            allTexts[chapter.name] = fs.readFileSync(textFile, 'utf8');
          }
        }
        
        if (Object.keys(allTexts).length > 0) {
          await runSummarization(allTexts);
        } else {
          console.log('요약할 텍스트 파일이 없습니다. 먼저 PDF 또는 OCR 추출을 실행하세요.');
        }
        break;
        
      case 'all':
        allTexts = await runPDFExtraction();
        await runSummarization(allTexts);
        break;
        
      default:
        console.log(`사용법: node run.js [pdf|ocr|summarize|all]`);
        console.log(`  pdf: PDF에서 텍스트 추출 (기본)`);
        console.log(`  ocr: OCR로 이미지에서 텍스트 추출`);
        console.log(`  summarize: 기존 텍스트 파일 요약`);
        console.log(`  all: PDF 추출 + 요약 실행`);
        break;
    }
    
    console.log(`\n✅ ${CONFIG.displayName} 처리 완료! ✅`);
    
  } catch (error) {
    console.error(`\n❌ ${CONFIG.displayName} 처리 중 오류 발생:`, error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시에만 main 함수 호출
if (require.main === module) {
  main();
}

module.exports = {
  CONFIG,
  runPDFExtraction,
  runOCRExtraction,
  runSummarization,
  main
};