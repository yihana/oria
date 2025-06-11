const fs = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');

/**
 * OCR을 사용하여 이미지에서 텍스트 추출
 * @param {string} imagePath - 이미지 파일 경로
 * @param {Object} options - OCR 옵션
 * @returns {Promise<string>} 추출된 텍스트
 */
async function extractTextFromImage(imagePath, options = {}) {
  const worker = await createWorker('kor', 1, {
    logger: m => {
      if (options.verbose) console.log(m);
    }
  });
  
  try {
    const { data: { text } } = await worker.recognize(imagePath);
    return text;
  } finally {
    await worker.terminate();
  }
}

/**
 * 여러 이미지 파일에서 OCR로 텍스트를 추출
 * @param {string} dataDir - 이미지 파일들이 있는 디렉토리
 * @param {Array} chapters - 챕터 정보 배열
 * @param {Object} options - 옵션 설정
 * @returns {Promise<Object>} 챕터별 텍스트 객체
 */
async function extractAllTextsWithOCR(dataDir, chapters, options = {}) {
  const { imageExtensions = ['.png', '.jpg', '.jpeg'], verbose = false } = options;
  const allTexts = {};
  
  console.log('OCR 텍스트 추출 시작...');
  
  for (const chapter of chapters) {
    console.log(`${chapter.name} OCR 처리 중... (페이지 ${chapter.start}-${chapter.end})`);
    
    const texts = [];
    
    for (let page = chapter.start; page <= chapter.end; page++) {
      let imageFound = false;
      
      // 지원하는 이미지 확장자로 파일 찾기
      for (const ext of imageExtensions) {
        const imagePath = path.join(dataDir, `${page}${ext}`);
        
        if (fs.existsSync(imagePath)) {
          try {
            console.log(`  페이지 ${page} OCR 처리 중...`);
            const text = await extractTextFromImage(imagePath, { verbose });
            texts.push(text);
            console.log(`  페이지 ${page} OCR 완료`);
            imageFound = true;
            break;
          } catch (error) {
            console.error(`  페이지 ${page} OCR 실패:`, error.message);
            texts.push(''); // 빈 텍스트로 대체
            imageFound = true;
            break;
          }
        }
      }
      
      if (!imageFound) {
        console.warn(`  페이지 ${page} 이미지 파일 없음`);
        texts.push(''); // 빈 텍스트로 대체
      }
    }
    
    allTexts[chapter.name] = texts.join('\n\n');
  }
  
  console.log('OCR 텍스트 추출 완료!');
  return allTexts;
}

module.exports = {
  extractTextFromImage,
  extractAllTextsWithOCR
};