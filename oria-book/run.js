// run.js

const path = require("path");
const fs = require("fs");
const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");
require("dotenv").config();

const { convertPdfToImages } = require("./common/pdf-to-image");
const { extractTextFromAllImages, extractTextByChapter } = require("./common/extract-to-txt");
const { uploadTxtFilesToNotion, uploadToNotion } = require("./common/notion-upload");

const argv = yargs(hideBin(process.argv))
  .option("book", {
    alias: "b",
    type: "string",
    describe: "책 폴더명",
    demandOption: true,
  })
  .option("chapter", {
    alias: "c",
    type: "string",
    describe: "특정 챕터만 실행",
  })
  .argv;

const bookName = argv.book;
const selectedChapter = argv.chapter;
const BASE_PATH = path.join(__dirname, bookName);
const DATA_PATH = path.join(BASE_PATH, "data");
const IMAGE_PATH = path.join(DATA_PATH, "images");
const OUTPUT_PATH = path.join(BASE_PATH, "output");
const CHAPTERS_PATH = path.join(BASE_PATH, "chapters.json");

if (!fs.existsSync(OUTPUT_PATH)) fs.mkdirSync(OUTPUT_PATH, { recursive: true });
if (!fs.existsSync(IMAGE_PATH)) fs.mkdirSync(IMAGE_PATH, { recursive: true });

async function run() {
  try {
    console.log(`\n📚 [${bookName}] 처리 시작${selectedChapter ? ` (${selectedChapter})` : ""}`);

    const pdfFiles = fs.readdirSync(DATA_PATH).filter(f => f.endsWith(".pdf"));
    for (const pdf of pdfFiles) {
      const pdfPath = path.join(DATA_PATH, pdf);
      await convertPdfToImages(pdfPath, IMAGE_PATH);
    }
    console.log("✅ 이미지 변환 완료");

    const chapters = JSON.parse(fs.readFileSync(CHAPTERS_PATH, "utf-8"));
    const targetChapters = selectedChapter ? chapters.filter(c => c.name === selectedChapter) : chapters;

    for (const chapter of targetChapters) {
      console.log(`🔍 OCR: ${chapter.name}.pdf (${chapter.name})`);
      await extractTextByChapter(chapter, IMAGE_PATH, OUTPUT_PATH, bookName);
    }
    console.log("✅ OCR 완료! Notion 업로드 시작");

    const txtFiles = fs.readdirSync(OUTPUT_PATH).filter(f => f.endsWith(".txt"));
    for (const file of txtFiles) {
      const filePath = path.join(OUTPUT_PATH, file);
      const title = path.basename(file, ".txt");
      const content = fs.readFileSync(filePath, "utf8");
      try {
        await uploadToNotion(title, content);
        console.log(`📤 Notion 업로드 완료: ${title}`);
      } catch (err) {
        console.error(`❌ Notion 업로드 실패: ${title}`, err.message);
      }
    }

    console.log(`\n🎉 [${bookName}] 전체 처리 완료${selectedChapter ? ` (${selectedChapter})` : ""}`);
  } catch (err) {
    console.error("❌ 처리 중 오류 발생:", err);
  }
}

run();
