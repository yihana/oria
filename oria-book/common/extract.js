const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

/**
 * PDF에서 텍스트를 추출하는 공통 함수
 * @param {string} pdfPath - PDF 파일 경로
 * @returns {Promise<string>} 추출된 텍스트
 */
async function extractTextFromPDF(pdfPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error(`PDF 텍스트 추출 실패: ${pdfPath}`, error);
    throw error;
  }
}

/**
 * 여러 PDF 파일에서 텍스트를 추출
 * @param {string} dataDir - PDF 파일들이 있는 디렉토리
 * @param {Array} chapters - 챕터 정보 배열
 * @returns {Promise<Object>} 챕터별 텍스트 객체
 */
async function extractAllTexts(dataDir, chapters) {
  const allTexts = {};
  
  console.log('PDF 텍스트 추출 시작...');
  
  for (const chapter of chapters) {
    console.log(`${chapter.name} 처리 중... (페이지 ${chapter.start}-${chapter.end})`);
    
    const texts = [];
    
    for (let page = chapter.start; page <= chapter.end; page++) {
      const pdfPath = path.join(dataDir, `${page}.pdf`);
      
      if (fs.existsSync(pdfPath)) {
        try {
          const text = await extractTextFromPDF(pdfPath);
          texts.push(text);
          console.log(`  페이지 ${page} 완료`);
        } catch (error) {
          console.error(`  페이지 ${page} 실패:`, error.message);
          texts.push(''); // 빈 텍스트로 대체
        }
      } else {
        console.warn(`  페이지 ${page} 파일 없음: ${pdfPath}`);
        texts.push(''); // 빈 텍스트로 대체
      }
    }
    
    allTexts[chapter.name] = texts.join('\n\n');
  }
  
  console.log('PDF 텍스트 추출 완료!');
  return allTexts;
}

module.exports = {
  extractTextFromPDF,
  extractAllTexts
};