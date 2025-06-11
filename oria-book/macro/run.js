const path = require('path');
const fs = require('fs');

// 공통 모듈 import
const { extractText } = require('../common/extract');
const { extractToTxt } = require('../common/extract-to-txt');
const { ocrExtractByChapter } = require('../common/ocr-extract-by-chapter');
const { summarize } = require('../common/summarize');

// 설정 파일 경로
const configPath = path.join(__dirname, '../config');
const tessDataPath = path.join(configPath, 'tessdata');

// 거시편 데이터 경로
const dataPath = path.join(__dirname, 'data');
const outputPath = path.join(__dirname, 'output');
const chaptersPath = path.join(__dirname, 'chapters.json');

// 출력 디렉토리 생성
if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
}

async function runMacroProcessing() {
    try {
        console.log('=== 거시경제학 교재 처리 시작 ===');
        
        // chapters.json 읽기
        const chapters = JSON.parse(fs.readFileSync(chaptersPath, 'utf8'));
        console.log(`총 ${chapters.length}개 챕터 발견`);
        
        // 데이터 폴더의 PDF 파일들 확인
        const pdfFiles = fs.readdirSync(dataPath).filter(file => file.endsWith('.pdf'));
        console.log(`PDF 파일: ${pdfFiles.join(', ')}`);
        
        for (const pdfFile of pdfFiles) {
            const pdfPath = path.join(dataPath, pdfFile);
            const outputFileName = path.basename(pdfFile, '.pdf');
            
            console.log(`\n처리 중: ${pdfFile}`);
            
            // OCR 추출 실행
            await ocrExtractByChapter(pdfPath, chapters, outputPath, outputFileName);
            
            console.log(`완료: ${pdfFile}`);
        }
        
        console.log('\n=== 거시경제학 교재 처리 완료 ===');
        
    } catch (error) {
        console.error('처리 중 오류 발생:', error);
    }
}

// 실행
if (require.main === module) {
    runMacroProcessing();
}

module.exports = { runMacroProcessing };