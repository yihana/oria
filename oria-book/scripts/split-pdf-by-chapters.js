// split-pdf-by-chapters.js
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const chapters = require('./chapters.json');

async function splitPdfByChapters(sourcePdfPath, outputDir) {
  const pdfBytes = fs.readFileSync(sourcePdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  for (const chapter of chapters) {
    const newPdf = await PDFDocument.create();
    const copiedPages = await pdfDoc.copyPages(pdfDoc, Array.from({ length: chapter.end - chapter.start + 1 }, (_, i) => chapter.start - 1 + i));
    copiedPages.forEach(p => newPdf.addPage(p));

    const pdfBytes = await newPdf.save();
    fs.writeFileSync(path.join(outputDir, `${chapter.number}_${chapter.title}.pdf`), pdfBytes);
    console.log(`✅ ${chapter.title} 저장 완료`);
  }
}

// 사용 예: node split-pdf-by-chapters.js
splitPdfByChapters('./micro/full.pdf', './micro/data');
