const fs = require('fs');
const pdfParse = require('pdf-parse');

// PDF 파일 읽기
const pdfBuffer = fs.readFileSync('sample.pdf');

pdfParse(pdfBuffer).then(data => {
  const extractedText = data.text;

  // 결과를 텍스트 파일로 저장
  fs.writeFileSync('sample_output.txt', extractedText, 'utf-8');
  console.log('\n✅ sample_output.txt 파일로 저장 완료!');
});
