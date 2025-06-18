const { fromPath } = require("pdf2pic");
const path = require("path");
const fs = require("fs");

/**
 * PDF를 페이지별 이미지로 변환
 * @param {string} pdfPath - PDF 경로
 * @param {string} outputDir - 이미지 저장 디렉토리
 */
async function convertPdfToImages(pdfPath, outputDir) {
  const options = {
    density: 150,
    saveFilename: path.basename(pdfPath, path.extname(pdfPath)),
    savePath: outputDir,
    format: "png",
    width: 1240,
    height: 1754
  };

  const convert = fromPath(pdfPath, options);
  const totalPages = await getPdfPageCount(pdfPath);

  for (let page = 1; page <= totalPages; page++) {
    console.log(`페이지 ${page} 이미지 변환 중...`);
    await convert(page);
  }

  console.log(`✅ PDF → 이미지 변환 완료: ${pdfPath}`);
}

/**
 * PDF 페이지 수 구하기 (pdf-parse 사용)
 */
async function getPdfPageCount(pdfPath) {
  const pdfParse = require("pdf-parse");
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(dataBuffer);
  return data.numpages;
}

module.exports = { convertPdfToImages };
