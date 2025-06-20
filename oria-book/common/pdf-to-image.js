const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

/**
 * PDF를 페이지별 이미지로 변환 (ImageMagick CLI 사용)
 * @param {string} pdfPath - PDF 파일 경로
 * @param {string} outputDir - 출력 디렉토리
 */
async function convertPdfToImages(pdfPath, outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const baseName = path.basename(pdfPath, path.extname(pdfPath));
  const outputPattern = path.join(outputDir, `${baseName}-%03d.png`);

  try {
    console.log(`ImageMagick로 변환 중: ${pdfPath}`);
    
    const command = `magick -density 150 "${pdfPath}" "${outputPattern}"`;
    execSync(command, { stdio: "inherit" });

    console.log(`✅ PDF → 이미지 변환 완료: ${outputDir}`);
  } catch (error) {
    console.error(`❌ 변환 실패: ${error.message}`);
    throw error;
  }
}

module.exports = { convertPdfToImages };
