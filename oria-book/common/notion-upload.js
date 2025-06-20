require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function uploadTxtFilesToNotion(txtDir) {
  const files = fs.readdirSync(txtDir).filter(f => f.endsWith(".txt"));
  for (const file of files) {
    const content = fs.readFileSync(path.join(txtDir, file), "utf-8");
    const title = file.replace(".txt", "");

    await notion.pages.create({
      parent: { database_id: process.env.NOTION_DB_ID },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: title
              }
            }
          ]
        }
      },
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: content.slice(0, 2000)  // 블록 제한
                }
              }
            ]
          }
        }
      ]
    });

    console.log(`✅ ${file} → Notion 업로드 완료`);
  }
}

module.exports = { uploadTxtFilesToNotion };
