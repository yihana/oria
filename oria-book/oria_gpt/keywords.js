const stopwords = ['이', '그', '저', '것', '수', '등', '들', '및', '는', '은', '이', '가', '을', '를'];

export function extractKeywords(text) {

  return text

    .split(/\s+/)

    .filter((w) => w.length > 1 && !stopwords.includes(w))

    .slice(0, 5);

}