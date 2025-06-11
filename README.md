ORIA-BOOK
PDF/이미지에서 텍스트를 추출하고 요약하는 도구입니다.
📁 프로젝트 구조
C:\workspace\oria\oria-book\
├── common/                    # 공통 모듈들
│   ├── extract.js            # PDF 텍스트 추출
│   ├── extract-to-txt.js     # 텍스트 파일 저장
│   ├── ocr-extract-by-chapter.js  # OCR 텍스트 추출
│   └── summarize.js          # 텍스트 요약
├── config/                   # 설정 파일들
│   └── tessdata/            # Tesseract OCR 언어 데이터
├── macro/                   # 거시경제학
│   ├── chapters.json        # 거시편 목차
│   ├── data/               # 거시편 PDF들
│   ├── output/             # 거시편 결과물
│   └── run.js              # 거시편 실행 스크립트
├── micro/                  # 미시경제학
│   ├── chapters.json       # 미시편 목차
│   ├── data/              # 미시편 PDF들
│   ├── output/            # 미시편 결과물
│   └── run.js             # 미시편 실행 스크립트
├── package.json
└── README.md
🚀 설치 및 설정
1. 의존성 설치
bashnpm install
2. 데이터 준비
미시경제학 PDF 파일

micro/data/ 디렉토리에 페이지별 PDF 파일 배치
파일명 형식: 21.pdf, 22.pdf, ..., 827.pdf

거시경제학 PDF 파일

macro/data/ 디렉토리에 페이지별 PDF 파일 배치
파일명 형식: 21.pdf, 22.pdf, ..., 827.pdf

OCR용 이미지 파일 (선택사항)

같은 디렉토리에 이미지 파일 배치
파일명 형식: 21.png, 21.jpg, 21.jpeg 등

📋 사용법
NPM 스크립트 사용
미시경제학
bash# PDF 텍스트 추출 (기본)
npm run micro
npm run micro:pdf

# OCR로 이미지 텍스트 추출
npm run micro:ocr

# 기존 텍스트 파일 요약
npm run micro:summarize

# PDF 추출 + 요약 한번에 실행
npm run micro:all
거시경제학
bash# PDF 텍스트 추출 (기본)
npm run macro
npm run macro:pdf

# OCR로 이미지 텍스트 추출
npm run macro:ocr

# 기존 텍스트 파일 요약
npm run macro:summarize

# PDF 추출 + 요약 한번에 실행
npm run macro:all
직접 Node.js 실행
bash# 미시경제학
cd micro
node run.js [pdf|ocr|summarize|all]

# 거시경제학  
cd macro
node run.js [pdf|ocr|summarize|all]
📊 출력 결과
텍스트 추출 결과

output/ 디렉토리에 챕터별 텍스트 파일 생성
micro_01장_경제학의_개요.txt 형식
micro_all_texts.txt: 전체 텍스트 통합 파일

OCR 추출 결과

output/ocr/ 디렉토리에 OCR 결과 저장
micro_ocr_01장_경제학의_개요.txt 형식

요약 결과

output/summaries/ 디렉토리에 요약 파일 생성
micro_01장_경제학의_개요_summary.txt 형식
micro_all_summaries.txt: 전체 요약 통합 파일

🔧 설정 커스터마이징
챕터 정보 수정
micro/chapters.json 또는 macro/chapters.json 파일에서 챕터별 페이지 범위 수정:
json[
  {
    "name": "01장_경제학의_개요",
    "start": 21,
    "end": 34
  }
]
OCR 옵션 수정
각 run.js 파일의 CONFIG.ocrOptions에서 설정:
javascriptocrOptions: {
  imageExtensions: ['.png', '.jpg', '.jpeg'],
  verbose: true  // OCR 진행상황 상세 출력
}
요약 옵션 수정
각 run.js 파일의 CONFIG.summaryOptions에서 설정:
javascriptsummaryOptions: {
  summaryType: 'detailed',
  maxLength: 2000,  // 요약 최대 길이
  subject: '미시경제학'
}
🛠️ 개발 및 확장
공통 모듈 수정

common/ 디렉토리의 모듈들은 미시/거시 공통으로 사용
새로운 기능 추가 시 공통 모듈로 분리하여 재사용성 향상

새로운 교재 추가

새 디렉토리 생성 (예: international/)
chapters.json 파일 생성
run.js 파일 생성 (기존 파일 참고)
package.json에 스크립트 추가

📝 주의사항

PDF 파일이 없는 페이지는 빈 텍스트로 처리됩니다
OCR은 한국어(kor) 언어팩을 사용합니다
요약 기능은 현재 샘플 구현이며, 실제 Claude API 연동이 필요합니다
대용량 파일 처리 시 메모리 사용량에 주의하세요

🔗 의존성

pdf-parse: PDF 텍스트 추출
tesseract.js: OCR 텍스트 추출
Node.js: >=16.0.0

📄 라이선스
MIT License
