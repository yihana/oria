const fs = require('fs');
const path = require('path');

/**
 * 텍스트를 파일로 저장하는 공통 함수
 * @param {Object} allTexts - 챕터별 텍스트 객체
 * @param {string} outputDir - 출력 디렉토리
 * @param {string} prefix - 파일명 접두사 (예: 'micro', 'macro')
 */
function saveTextsToFiles(allTexts, outputDir, prefix = '') {
  // 출력 디렉토리가 없으면 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log('텍스트 파일 저장 시작...');
  
  Object.entries(allTexts).forEach(([chapterName, text]) => {
    const filename = prefix ? `${prefix}_${chapterName}.txt` : `${chapterName}.txt`;
    const filePath = path.join(outputDir, filename);
    
    try {
      fs.writeFileSync(filePath, text, 'utf8');
      console.log(`  ${filename} 저장 완료`);
    } catch (error) {
      console.error(`  ${filename} 저장 실패:`, error.message);
    }
  });
  
  console.log('텍스트 파일 저장 완료!');
}

/**
 * 전체 텍스트를 하나의 파일로 저장
 * @param {Object} allTexts - 챕터별 텍스트 객체
 * @param {string} outputDir - 출력 디렉토리
 * @param {string} filename - 파일명
 */
function saveAllTextsToOneFile(allTexts, outputDir, filename) {
  // 출력 디렉토리가 없으면 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const filePath = path.join(outputDir, filename);
  
  try {
    let combinedText = '';
    
    Object.entries(allTexts).forEach(([chapterName, text]) => {
      combinedText += `\n\n=== ${chapterName} ===\n\n`;
      combinedText += text;
    });
    
    fs.writeFileSync(filePath, combinedText, 'utf8');
    console.log(`전체 텍스트 파일 저장 완료: ${filename}`);
  } catch (error) {
    console.error(`전체 텍스트 파일 저장 실패:`, error.message);
  }
}

module.exports = {
  saveTextsToFiles,
  saveAllTextsToOneFile
};