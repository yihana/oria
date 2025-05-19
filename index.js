import clipboard from 'clipboardy';
import { saveToNotion } from './notion.js';
import { extractKeywords } from './keywords.js';

let lastText = '';

setInterval(async () => {
  const currentText = clipboard.readSync();

  if (currentText && currentText !== lastText) {
    lastText = currentText;

    const keywords = extractKeywords(currentText);
    console.log('감지된 드래프트:', currentText.slice(0, 80), '...');
    
    await saveToNotion(currentText, keywords);
    console.log('✅ Notion 저장 완료!');
  }
}, 3000);
