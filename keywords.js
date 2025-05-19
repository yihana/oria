export function extractKeywords(text) {
  const words = text
    .toLowerCase()
    .replace(/[^a-zA-Z가-힣\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !['그리고', '하지만', '그러나', '있는', '해서', '그런'].includes(w));

  const frequency = {};
  for (const word of words) {
    frequency[word] = (frequency[word] || 0) + 1;
  }

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0]);
}
