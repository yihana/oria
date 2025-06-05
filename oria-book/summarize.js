const fs = require('fs');
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');

// ✅ GPT API 키 넣기
const openai = new OpenAI({
  apiKey: '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'
});

// ✅ PDF 파일 이름
const pdfBuffer = fs.readFileSync('sample.pdf');

pdfParse(pdfBuffer).then(async data => {
  const fullText = data.text;
  const chunk = fullText.substring(0, 3000); // 너무 길면 오류나므로 일부만 사용

  const prompt = `
다음 내용을 요약해줘. 그리고 아래와 같은 문제를 만들어줘:

1. OX문제 1개
2. 객관식 문제 1개 (보기 4개, 정답 표시)
3. 빈칸 채우기 문제 1개

--- 내용 시작 ---
${chunk}
--- 내용 끝 ---
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }]
  });

  const result = response.choices[0].message.content;

  // 콘솔 출력
  console.log('\n✅ GPT 결과:\n');
  console.log(result);

  // 텍스트 파일로 저장
  fs.writeFileSync('summary_output.txt', result, 'utf-8');
  console.log('\n📄 결과가 summary_output.txt 파일로 저장되었습니다.');
});
