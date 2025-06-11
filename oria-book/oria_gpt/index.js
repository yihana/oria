import dotenv from 'dotenv';
dotenv.config({path: './.env'});
console.log('✅ 1'+process.env.NOTION_TOKEN);
console.log('✅ 2'+process.env.DB_GPT);

import clipboard from 'clipboardy';

import { saveToNotion } from './notion.js';

import { extractKeywords } from './keywords.js';

let lastText = '';

setInterval(async () => {

  const currentText = clipboard.readSync();

  if (currentText && currentText !== lastText) {

    lastText = currentText;

    const keywords = extractKeywords(currentText);

    const title = currentText.slice(0, 80);

    const channel = 'GPT'; // 변경 가능

    await saveToNotion(title, currentText, keywords, channel);

    console.log('✅ 저장 완료'+channel);

  }

}, 3000);