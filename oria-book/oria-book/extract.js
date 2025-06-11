// extract.js
const fs = require('fs');
const pdfParse = require('pdf-parse');

const pdfBuffer = fs.readFileSync('sample.pdf');

pdfParse(pdfBuffer).then(data => {
  console.log('\n✅ 추출된 텍스트 (앞부분 1000자):\n');
  console.log(data.text.substring(0, 1000));
});
