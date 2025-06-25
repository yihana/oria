// ✅ common/extract-to-txt.js : 워커 관리 개선 및 spacing 문제 해결 포함 + 강화된 오류 처리

const fs = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');

// 전역 설정
const WORKER_TIMEOUT = 60000; // 60초 타임아웃
const MAX_RETRIES = 3;
const INITIALIZATION_DELAY = 2000; // 워커 초기화 대기 시간

/**
 * OCR 결과에서 불필요한 공백 제거 및 텍스트 정리
 * @param {string} text - 원본 OCR 텍스트
 * @returns {string} 정리된 텍스트
 */
function cleanOcrText(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    // 한글 글자 사이의 불필요한 공백 제거 (ㄱ-ㅎ, ㅏ-ㅣ, 가-힣)
    .replace(/([가-힣])\s+([가-힣])/g, '$1$2')
    // 숫자 사이의 불필요한 공백 제거
    .replace(/(\d)\s+(\d)/g, '$1$2')
    // 영문자 사이의 불필요한 공백 제거 (단어 단위는 유지)
    .replace(/([a-zA-Z])\s+([a-zA-Z])/g, '$1$2')
    // 연속된 공백을 하나로 통합
    .replace(/\s+/g, ' ')
    // 줄바꿈 정리
    .replace(/\n\s*\n/g, '\n\n')
    // 앞뒤 공백 제거
    .trim();
}

/**
 * 더미 이미지로 워커 상태 테스트
 * @param {Object} worker - 테스트할 워커
 * @returns {Promise<boolean>} 워커 정상 여부
 */
async function validateWorker(worker) {
  try {
    // 간단한 더미 이미지 데이터 (1x1 픽셀 PNG)
    const dummyImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAHiAxXWgNAAAAABJRU5ErkJggg==',
      'base64'
    );
    
    // 임시 파일로 저장
    const tempPath = path.join(__dirname, 'temp_test.png');
    fs.writeFileSync(tempPath, dummyImageBuffer);
    
    // 워커 테스트
    await Promise.race([
      worker.recognize(tempPath),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('워커 테스트 타임아웃')), 10000)
      )
    ]);
    
    // 임시 파일 삭제
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    
    return true;
  } catch (error) {
    console.warn('워커 검증 실패:', error.message);
    return false;
  }
}

/**
 * 강화된 워커 생성 및 초기화
 * @param {string} lang - 언어 설정
 * @param {boolean} verbose - 상세 로그 여부
 * @returns {Promise<Object>} 워커 객체
 */
async function createRobustWorker(lang = 'kor', verbose = false) {
  let worker = null;
  let retryCount = 0;
  
  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`[시도 ${retryCount + 1}/${MAX_RETRIES}] 워커 생성 중...`);
      
      // 워커 생성 (최소한의 옵션)
      worker = await createWorker();
      
      console.log('워커 언어 로드 중...');
      await worker.loadLanguage(lang);
      
      console.log('워커 초기화 중...');
      await worker.initialize(lang);
      
      // 설정 적용
      await worker.setParameters({
        tessedit_pageseg_mode: '1', // 자동 페이지 분할
        tessedit_ocr_engine_mode: '1', // LSTM OCR 엔진
      });
      
      console.log('워커 초기화 완료, 안정화 대기...');
      await new Promise(resolve => setTimeout(resolve, INITIALIZATION_DELAY));
      
      // 워커 상태 검증
      console.log('워커 상태 검증 중...');
      const isValid = await validateWorker(worker);
      
      if (isValid) {
        console.log('✅ 워커 생성 및 검증 완료');
        return worker;
      } else {
        throw new Error('워커 검증 실패');
      }
      
    } catch (error) {
      console.error(`워커 생성 실패 (시도 ${retryCount + 1}):`, error.message);
      
      // 실패한 워커 정리
      if (worker) {
        try {
          await worker.terminate();
        } catch (termError) {
          console.warn('실패한 워커 종료 오류:', termError.message);
        }
        worker = null;
      }
      
      retryCount++;
      
      if (retryCount < MAX_RETRIES) {
        const waitTime = 3000 * retryCount;
        console.log(`${waitTime}ms 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // 메모리 정리
        if (global.gc) {
          console.log('메모리 정리 중...');
          global.gc();
        }
      }
    }
  }
  
  throw new Error(`워커 생성 완전 실패: ${MAX_RETRIES}번 모두 실패`);
}

/**
 * 안전한 워커 종료
 * @param {Object} worker - 종료할 워커
 */
async function terminateWorkerSafely(worker) {
  if (!worker) return;
  
  try {
    console.log('워커 종료 중...');
    await Promise.race([
      worker.terminate(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('워커 종료 타임아웃')), 10000)
      )
    ]);
    console.log('워커 정상 종료 완료');
  } catch (error) {
    console.warn('워커 강제 종료:', error.message);
  }
}

/**
 * 단일 이미지에서 OCR로 텍스트 추출 (완전히 새로운 접근)
 * @param {string} imagePath - 이미지 파일 경로
 * @param {Object} options - OCR 옵션
 * @returns {Promise<string>} 추출된 텍스트
 */
async function extractTextFromImage(imagePath, options = {}) {
  const { verbose = false, lang = 'kor' } = options;
  
  // 파일 검증
  if (!fs.existsSync(imagePath)) {
    console.error(`❌ 파일 없음: ${imagePath}`);
    return '';
  }
  
  const stats = fs.statSync(imagePath);
  if (stats.size === 0) {
    console.error(`❌ 빈 파일: ${imagePath}`);
    return '';
  }
  
  if (stats.size > 100 * 1024 * 1024) { // 100MB 초과
    console.error(`❌ 파일 너무 큼 (${Math.round(stats.size / 1024 / 1024)}MB): ${imagePath}`);
    return '';
  }
  
  console.log(`📸 처리 시작: ${path.basename(imagePath)} (${Math.round(stats.size / 1024)}KB)`);
  
  let worker = null;
  let attemptCount = 0;
  
  while (attemptCount < MAX_RETRIES) {
    try {
      attemptCount++;
      console.log(`🔄 OCR 시도 ${attemptCount}/${MAX_RETRIES}`);
      
      // 매번 새로운 워커 생성
      worker = await createRobustWorker(lang, verbose);
      
      console.log('🔍 OCR 실행 중...');
      
      // OCR 실행 (타임아웃 포함)
      const ocrPromise = worker.recognize(imagePath);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OCR 처리 타임아웃')), WORKER_TIMEOUT)
      );
      
      const result = await Promise.race([ocrPromise, timeoutPromise]);
      
      if (!result || !result.data) {
        throw new Error('OCR 결과가 없습니다');
      }
      
      const text = result.data.text || '';
      const cleanedText = cleanOcrText(text);
      
      console.log(`✅ OCR 완료: ${cleanedText.length}자 추출`);
      
      // 워커 정리
      await terminateWorkerSafely(worker);
      worker = null;
      
      return cleanedText;
      
    } catch (error) {
      console.error(`❌ OCR 실패 (시도 ${attemptCount}): ${error.message}`);
      
      // 워커 정리
      if (worker) {
        await terminateWorkerSafely(worker);
        worker = null;
      }
      
      if (attemptCount < MAX_RETRIES) {
        const waitTime = 5000 * attemptCount;
        console.log(`⏳ ${waitTime}ms 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // 강제 메모리 정리
        if (global.gc) {
          console.log('🧹 메모리 정리...');
          global.gc();
        }
      }
    }
  }
  
  console.error(`💥 모든 시도 실패: ${imagePath}`);
  return '';
}

/**
 * 디렉토리의 모든 이미지에서 텍스트 추출
 * @param {string} imageDir - 이미지 디렉토리
 * @param {string} outputDir - 출력 디렉토리
 * @param {Object} options - 옵션 설정
 */
async function extractTextFromAllImages(imageDir, outputDir, options = {}) {
  const { 
    imageExtensions = ['.png', '.jpg', '.jpeg', '.tiff', '.bmp'],
    verbose = false,
    lang = 'kor'
  } = options;
  
  // 출력 디렉토리 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  if (!fs.existsSync(imageDir)) {
    console.error(`❌ 디렉토리 없음: ${imageDir}`);
    return;
  }
  
  console.log(`🔍 OCR 텍스트 추출 시작: ${imageDir}`);
  
  // 이미지 파일 목록 가져오기
  const imageFiles = fs.readdirSync(imageDir)
    .filter(file => imageExtensions.some(ext => file.toLowerCase().endsWith(ext)))
    .sort();
  
  if (imageFiles.length === 0) {
    console.warn('⚠️ 처리할 이미지 파일이 없습니다.');
    return;
  }
  
  console.log(`📊 총 ${imageFiles.length}개 이미지 파일 발견`);
  
  const allTexts = [];
  const failedFiles = [];
  const startTime = Date.now();
  
  // 완전 순차 처리
  for (let i = 0; i < imageFiles.length; i++) {
    const imageFile = imageFiles[i];
    const imagePath = path.join(imageDir, imageFile);
    
    console.log(`\n📄 [${i + 1}/${imageFiles.length}] ${imageFile}`);
    
    try {
      const text = await extractTextFromImage(imagePath, { verbose, lang });
      
      if (text.trim()) {
        allTexts.push(`=== ${imageFile} ===\n${text}`);
        console.log(`✅ 성공: ${text.length}자 추출`);
      } else {
        console.log(`⚠️ 텍스트 없음`);
        failedFiles.push({ file: imageFile, reason: '텍스트 없음' });
      }
      
    } catch (error) {
      console.error(`❌ 처리 실패: ${error.message}`);
      failedFiles.push({ file: imageFile, reason: error.message });
    }
    
    // 진행률 출력
    const progress = Math.round((i + 1) / imageFiles.length * 100);
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const estimated = Math.round(elapsed / (i + 1) * imageFiles.length);
    console.log(`📈 진행률: ${progress}% (${elapsed}s/${estimated}s)`);
    
    // 각 파일 처리 후 휴식
    console.log('😴 시스템 휴식...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (global.gc && (i + 1) % 5 === 0) {
      console.log('🧹 메모리 정리...');
      global.gc();
    }
  }
  
  // 결과 저장
  const outputFileName = 'extracted_text.txt';
  const outputPath = path.join(outputDir, outputFileName);
  
  try {
    const combinedText = allTexts.join('\n\n');
    fs.writeFileSync(outputPath, combinedText, 'utf8');
    
    console.log(`\n📄 결과 저장: ${outputPath}`);
    console.log(`✅ 성공: ${allTexts.length}개 파일`);
    
    if (failedFiles.length > 0) {
      console.log(`❌ 실패: ${failedFiles.length}개 파일`);
      failedFiles.forEach(({ file, reason }) => {
        console.log(`  - ${file}: ${reason}`);
      });
    }
    
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    console.log(`⏱️ 총 소요 시간: ${totalTime}초`);
    
  } catch (error) {
    console.error(`❌ 파일 저장 실패: ${error.message}`);
  }
}

/**
 * 챕터별로 텍스트 파일 분리 저장
 * @param {string} imageDir - 이미지 디렉토리  
 * @param {string} outputDir - 출력 디렉토리
 * @param {Array} chapters - 챕터 정보 배열
 * @param {Object} options - 옵션 설정
 */
async function extractTextByChapters(imageDir, outputDir, chapters, options = {}) {
  const { verbose = false, lang = 'kor' } = options;
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log(`📚 챕터별 OCR 텍스트 추출 시작`);
  
  // 모든 이미지 파일 목록
  const allImageFiles = fs.readdirSync(imageDir)
    .filter(file => /\.(png|jpg|jpeg|tiff|bmp)$/i.test(file))
    .sort();
  
  console.log(`📊 총 이미지 파일: ${allImageFiles.length}개`);
  
  const overallStartTime = Date.now();
  
  for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex++) {
    const chapter = chapters[chapterIndex];
    const chapterName = chapter.name || `${chapter.number}장_${chapter.title}`;
    const startPage = chapter.start || chapter.startPage;
    const endPage = chapter.end || chapter.endPage;
    
    console.log(`\n📖 [${chapterIndex + 1}/${chapters.length}] ${chapterName} (${startPage}-${endPage})`);
    
    const chapterTexts = [];
    const failedImages = [];
    const chapterStartTime = Date.now();
    
    // 해당 챕터 이미지 찾기
    const chapterImageFiles = allImageFiles.filter(file => {
      const match = file.match(/(\d+)장_(.+?)-(\d+)\.(png|jpg|jpeg|tiff|bmp)$/i);
      if (match) {
        const pageNum = parseInt(match[3]);
        return pageNum >= startPage && pageNum <= endPage;
      }
      return false;
    });
    
    // 페이지 순서 정렬
    chapterImageFiles.sort((a, b) => {
      const aMatch = a.match(/-(\d+)\./);
      const bMatch = b.match(/-(\d+)\./);
      if (aMatch && bMatch) {
        return parseInt(aMatch[1]) - parseInt(bMatch[1]);
      }
      return a.localeCompare(b);
    });
    
    console.log(`📸 처리할 이미지: ${chapterImageFiles.length}개`);
    
    if (chapterImageFiles.length === 0) {
      console.warn(`⚠️ ${chapterName}: 이미지 없음`);
      continue;
    }
    
    // 챕터 이미지 순차 처리
    for (let i = 0; i < chapterImageFiles.length; i++) {
      const imageFile = chapterImageFiles[i];
      const imagePath = path.join(imageDir, imageFile);
      
      console.log(`\n  📄 [${i + 1}/${chapterImageFiles.length}] ${imageFile}`);
      
      try {
        const text = await extractTextFromImage(imagePath, { verbose, lang });
        
        if (text.trim()) {
          chapterTexts.push(`=== ${imageFile} ===\n${text}`);
          console.log(`  ✅ 성공: ${text.length}자`);
        } else {
          console.log(`  ⚠️ 텍스트 없음`);
          failedImages.push({ file: imageFile, reason: '텍스트 없음' });
        }
        
      } catch (error) {
        console.error(`  ❌ 실패: ${error.message}`);
        failedImages.push({ file: imageFile, reason: error.message });
      }
      
      // 이미지 간 휴식
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // 챕터 파일 저장
    if (chapterTexts.length > 0) {
      const chapterFileName = `${chapterName.replace(/[/\\?%*:|"<>]/g, '_')}.txt`;
      const chapterPath = path.join(outputDir, chapterFileName);
      
      try {
        const combinedText = chapterTexts.join('\n\n');
        fs.writeFileSync(chapterPath, combinedText, 'utf8');
        
        const chapterTime = Math.round((Date.now() - chapterStartTime) / 1000);
        console.log(`\n📄 저장 완료: ${chapterFileName}`);
        console.log(`✅ 성공: ${chapterTexts.length}개 이미지 (${combinedText.length}자)`);
        console.log(`⏱️ 소요 시간: ${chapterTime}초`);
        
        if (failedImages.length > 0) {
          console.log(`❌ 실패: ${failedImages.length}개 이미지`);
        }
        
      } catch (error) {
        console.error(`❌ 저장 실패: ${error.message}`);
      }
    } else {
      console.warn(`❌ ${chapterName}: 추출된 텍스트 없음`);
    }
    
    // 챕터 간 긴 휴식
    if (chapterIndex < chapters.length - 1) {
      console.log(`😴 챕터 간 휴식 (10초)...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    // 주기적 메모리 정리
    if (global.gc) {
      console.log('🧹 메모리 정리...');
      global.gc();
    }
  }
  
  const totalTime = Math.round((Date.now() - overallStartTime) / 1000);
  console.log(`\n🎉 모든 챕터 처리 완료! (총 ${totalTime}초)`);
}

// 프로세스 안전 종료
process.on('SIGINT', () => {
  console.log('\n🛑 강제 종료 신호 감지');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('💥 처리되지 않은 예외:', error.message);
  process.exit(1);
});

module.exports = {
  extractTextFromImage,
  extractTextFromAllImages,
  extractTextByChapters,
  cleanOcrText
};