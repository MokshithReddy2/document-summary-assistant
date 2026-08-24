const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
  'below', 'between', 'both', 'but', 'by', 'can\'t', 'cannot', 'could', 'couldn\'t',
  'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
  'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here',
  'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i',
  'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it',
  'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my',
  'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
  'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t',
  'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some',
  'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves',
  'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
  'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
  'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were',
  'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which',
  'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would',
  'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours',
  'yourself', 'yourselves', 'also', 'furthermore', 'therefore', 'moreover', 'thus'
]);

function cleanText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitIntoSentences(text) {
  if (!text) return [];
  const normalized = text.replace(/([.?!])\s+(?=[A-Z0-9])/g, '$1|__SPLIT__|');
  const rawParts = normalized.split('|__SPLIT__|');
  
  const sentences = [];
  for (const part of rawParts) {
    const trimmed = part.trim();
    const lines = trimmed.split(/\n+/);
    for (const line of lines) {
      const cleanLine = line.trim();
      if (cleanLine.length >= 5 && /[a-zA-Z]/.test(cleanLine)) {
        sentences.push(cleanLine);
      }
    }
  }
  return sentences;
}

function tokenizeWords(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1);
}

function calculateWordFrequencies(words) {
  const frequencies = {};
  for (const word of words) {
    if (!STOP_WORDS.has(word) && isNaN(word)) {
      frequencies[word] = (frequencies[word] || 0) + 1;
    }
  }
  return frequencies;
}

function countSyllables(word) {
  word = word.toLowerCase().trim();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]|ed|es|e)$/, '');
  word = word.replace(/^y/, '');
  const syllables = word.match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
}

function calculateReadabilityMetrics(text) {
  const cleaned = cleanText(text);
  const words = tokenizeWords(cleaned);
  const sentences = splitIntoSentences(cleaned);

  const wordCount = words.length;
  const sentenceCount = Math.max(sentences.length, 1);
  const characterCount = cleaned.replace(/\s/g, '').length;
  
  if (wordCount === 0) {
    return {
      wordCount: 0,
      sentenceCount: 0,
      characterCount: 0,
      readingTimeMinutes: 0,
      fleschReadingEase: 0,
      readingLevel: 'N/A',
      avgWordsPerSentence: 0,
      avgSyllablesPerWord: 0
    };
  }

  let totalSyllables = 0;
  let complexWordsCount = 0;

  for (const word of words) {
    const syl = countSyllables(word);
    totalSyllables += syl;
    if (syl >= 3) complexWordsCount++;
  }

  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = totalSyllables / wordCount;

  let fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  fleschScore = Math.min(100, Math.max(0, Math.round(fleschScore * 10) / 10));

  let readingLevel = 'Standard';
  if (fleschScore >= 90) readingLevel = 'Very Easy (5th Grade)';
  else if (fleschScore >= 80) readingLevel = 'Easy (6th Grade)';
  else if (fleschScore >= 70) readingLevel = 'Fairly Easy (7th Grade)';
  else if (fleschScore >= 60) readingLevel = 'Standard (8th-9th Grade)';
  else if (fleschScore >= 50) readingLevel = 'Fairly Difficult (10th-12th Grade)';
  else if (fleschScore >= 30) readingLevel = 'Difficult (College Level)';
  else readingLevel = 'Very Difficult (Professional / Academic)';

  const readingTimeMinutes = Math.ceil(wordCount / 200);

  return {
    wordCount,
    sentenceCount,
    characterCount,
    readingTimeMinutes,
    fleschReadingEase: fleschScore,
    readingLevel,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
    complexWordsPercent: Math.round((complexWordsCount / wordCount) * 100)
  };
}

module.exports = {
  STOP_WORDS,
  cleanText,
  splitIntoSentences,
  tokenizeWords,
  calculateWordFrequencies,
  countSyllables,
  calculateReadabilityMetrics
};
