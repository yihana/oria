import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export async function saveToNotion(text, keywords) {
  const date = new Date().toISOString();

  await notion.pages.create({
    parent: { database_id: process.env.NOTION_DATABASE_ID },
    properties: {
      Title: {
        title: [{ text: { content: text.slice(0, 50) } }]
      },
      Date: {
        date: { start: date }
      },
      Keywords: {
        multi_select: keywords.map(k => ({ name: k }))
      }
    },
    children: [{
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ text: { content: text } }]
      }
    }]
  });
}
