const fs = require('fs');
const path = require('path');

/**
 * 텍스트를 청크로 나누는 함수
 * @param {string} text - 나눌 텍스트
 * @param {number} maxLength - 최대 길이
 * @returns {Array<string>} 청크 배열
 */
function splitTextIntoChunks(text, maxLength = 4000) {
  const chunks = [];
  let currentChunk = '';
  
  const sentences = text.split(/[.!?]\s+/);
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
    }
    currentChunk += sentence + '. ';
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Claude API를 사용하여 텍스트 요약 (실제 구현 시 API 호출 코드 필요)
 * @param {string} text - 요약할 텍스트
 * @param {Object} options - 요약 옵션
 * @returns {Promise<string>} 요약된 텍스트
 */
async function summarizeText(text, options = {}) {
  const { 
    summaryType = 'detailed', 
    maxLength = 1000,
    subject = '경제학' 
  } = options;
  
  // 실제 구현에서는 Claude API 호출
  // 여기서는 샘플 구현
  console.log(`텍스트 요약 중... (${text.length}자 -> 목표: ${maxLength}자)`);
  
  // 실제로는 API 호출 결과를 반환
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`[${summaryType} 요약] ${subject} 관련 내용 요약입니다.`);
    }, 1000);
  });
}

/**
 * 여러 챕터의 텍스트를 요약
 * @param {Object} allTexts - 챕터별 텍스트 객체
 * @param {Object} options - 요약 옵션
 * @returns {Promise<Object>} 챕터별 요약 객체
 */
async function summarizeAllChapters(allTexts, options = {}) {
  const summaries = {};
  
  console.log('챕터별 요약 시작...');
  
  for (const [chapterName, text] of Object.entries(allTexts)) {
    console.log(`${chapterName} 요약 중...`);
    
    try {
      if (text.trim()) {
        const chunks = splitTextIntoChunks(text);
        const chunkSummaries = [];
        
        for (let i = 0; i < chunks.length; i++) {
          console.log(`  청크 ${i + 1}/${chunks.length} 요약 중...`);
          const summary = await summarizeText(chunks[i], options);
          chunkSummaries.push(summary);
        }
        
        // 여러 청크가 있는 경우 다시 요약
        if (chunkSummaries.length > 1) {
          const combinedSummary = chunkSummaries.join('\n\n');
          summaries[chapterName] = await summarizeText(combinedSummary, {
            ...options,
            summaryType: 'final'
          });
        } else {
          summaries[chapterName] = chunkSummaries[0] || '';
        }
        
        console.log(`  ${chapterName} 요약 완료`);
      } else {
        summaries[chapterName] = '내용이 없습니다.';
        console.log(`  ${chapterName} 내용 없음`);
      }
    } catch (error) {
      console.error(`  ${chapterName} 요약 실패:`, error.message);
      summaries[chapterName] = '요약 실패';
    }
  }
  
  console.log('챕터별 요약 완료!');
  return summaries;
}

/**
 * 요약 결과를 파일로 저장
 * @param {Object} summaries - 요약 결과 객체
 * @param {string} outputDir - 출력 디렉토리
 * @param {string} prefix - 파일명 접두사
 */
function saveSummariesToFiles(summaries, outputDir, prefix = '') {
  // 출력 디렉토리가 없으면 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log('요약 파일 저장 시작...');
  
  // 개별 챕터 요약 저장
  Object.entries(summaries).forEach(([chapterName, summary]) => {
    const filename = prefix ? `${prefix}_${chapterName}_summary.txt` : `${chapterName}_summary.txt`;
    const filePath = path.join(outputDir, filename);
    
    try {
      fs.writeFileSync(filePath, summary, 'utf8');
      console.log(`  ${filename} 저장 완료`);
    } catch (error) {
      console.error(`  ${filename} 저장 실패:`, error.message);
    }
  });
  
  // 전체 요약 파일 저장
  const allSummaryFilename = prefix ? `${prefix}_all_summaries.txt` : 'all_summaries.txt';
  const allSummaryPath = path.join(outputDir, allSummaryFilename);
  
  try {
    let combinedSummary = '';
    Object.entries(summaries).forEach(([chapterName, summary]) => {
      combinedSummary += `\n\n=== ${chapterName} 요약 ===\n\n`;
      combinedSummary += summary;
    });
    
    fs.writeFileSync(allSummaryPath, combinedSummary, 'utf8');
    console.log(`전체 요약 파일 저장 완료: ${allSummaryFilename}`);
  } catch (error) {
    console.error(`전체 요약 파일 저장 실패:`, error.message);
  }
  
  console.log('요약 파일 저장 완료!');
}

module.exports = {
  splitTextIntoChunks,
  summarizeText,
  summarizeAllChapters,
  saveSummariesToFiles
};