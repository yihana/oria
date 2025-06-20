// init-book.js
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('book', { type: 'string', demandOption: true, describe: '책 폴더명' })
  .option('template', { type: 'string', demandOption: true, describe: '템플릿 파일 경로' })
  .argv;

const { book, template } = argv;
const bookDir = path.join(__dirname, '..', book);

const foldersToCreate = ['data', 'output'];
const filesToCreate = ['chapters.json', 'run.js'];

if (!fs.existsSync(bookDir)) {
  fs.mkdirSync(bookDir);
  console.log(`📁 ${book} 폴더 생성됨`);
}

foldersToCreate.forEach(folder => {
  const dirPath = path.join(bookDir, folder);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
    console.log(`📁 ${folder} 폴더 생성됨`);
  }
});

const templateContent = fs.readFileSync(template, 'utf-8');
fs.writeFileSync(path.join(bookDir, 'chapters.json'), templateContent);
console.log('✅ chapters.json 생성 완료');

const runScript = `
// ${book}/run.js
const path = require("path");
const { extractTextByChapters } = require("../common/ocr-extract-by-chapter");

const baseDir = __dirname;
const dataDir = path.join(bookDir, 'data');
const outputDir = path.join(bookDir, 'output');
const chaptersPath = path.join(baseDir, "chapters.json");

(async () => {
  console.log("📘 [${book}] OCR 추출 시작");
  await extractTextByChapters(dataDir, outputDir, chaptersPath);
  console.log("✅ [${book}] OCR 추출 완료");
})();
`;

fs.writeFileSync(path.join(bookDir, 'run.js'), runScript.trim());
console.log('✅ run.js 생성 완료');
