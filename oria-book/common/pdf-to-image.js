const { exec } = require('child_process');
const path = require('path');

function convertPdfToImages(pdfPath, outputDir) {
  return new Promise((resolve, reject) => {
    const baseName = path.basename(pdfPath, '.pdf');
    const outputPath = path.join(outputDir, `${baseName}-%d.png`);

    //const command = `magick -density 300 "${pdfPath}" -quality 100 "${outputPath}"`;
    const quotedPdfPath = `"${pdfPath.replace(/\\/g, "/")}"`;
    const quotedImagePath = `"${path.join(outputDir, `${baseName}-%d.png`).replace(/\\/g, "/")}"`;
    const command = `magick -density 150 ${quotedPdfPath} -quality 70 ${quotedImagePath}`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('ImageMagick 오류:', stderr);
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

module.exports = { convertPdfToImages };
