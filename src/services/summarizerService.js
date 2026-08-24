const {
  cleanText,
  splitIntoSentences,
  tokenizeWords,
  calculateWordFrequencies,
  STOP_WORDS
} = require('../utils/textUtils');

const HIGH_VALUE_CUES = [
  'in conclusion', 'to summarize', 'we conclude', 'results indicate', 'results show',
  'findings reveal', 'key finding', 'most importantly', 'critical', 'significant',
  'primary objective', 'the goal', 'achieved', 'demonstrates', 'highlights',
  'in summary', 'overall', 'essential', 'crucial', 'recommendation', 'revenue',
  'growth', 'strategy', 'implementation', 'increase', 'decrease', 'impact'
];

function scoreSentences(sentences, wordFrequencies, totalWords) {
  const maxFreq = Math.max(...Object.values(wordFrequencies), 1);
  const scores = [];

  sentences.forEach((sentence, index) => {
    const sWords = tokenizeWords(sentence);
    if (sWords.length < 5) {
      scores.push({ index, sentence, score: 0 });
      return;
    }

    let wordScore = 0;
    sWords.forEach(w => {
      if (wordFrequencies[w]) {
        wordScore += wordFrequencies[w] / maxFreq;
      }
    });
    const avgWordScore = wordScore / sWords.length;

    let positionWeight = 1.0;
    if (index === 0) positionWeight = 1.4;
    else if (index === 1 || index === 2) positionWeight = 1.25;
    else if (index === sentences.length - 1) positionWeight = 1.2;

    let cueBonus = 1.0;
    const lowerSentence = sentence.toLowerCase();
    for (const cue of HIGH_VALUE_CUES) {
      if (lowerSentence.includes(cue)) {
        cueBonus += 0.3;
        break;
      }
    }

    let lengthModifier = 1.0;
    if (sWords.length >= 10 && sWords.length <= 35) {
      lengthModifier = 1.15;
    } else if (sWords.length > 50) {
      lengthModifier = 0.8;
    }

    const finalScore = avgWordScore * positionWeight * cueBonus * lengthModifier;
    scores.push({
      index,
      sentence: sentence.trim(),
      score: finalScore,
      wordCount: sWords.length
    });
  });

  return scores;
}

function extractKeyPoints(sentences, scoredSentences, count = 5) {
  const sorted = [...scoredSentences]
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const selected = [];
  for (const item of sorted) {
    if (selected.length >= count) break;
    const isTooSimilar = selected.some(sel => {
      const wordsA = new Set(tokenizeWords(sel.sentence));
      const wordsB = new Set(tokenizeWords(item.sentence));
      let intersection = 0;
      wordsA.forEach(w => { if (wordsB.has(w)) intersection++; });
      const similarity = intersection / Math.max(wordsA.size, wordsB.size);
      return similarity > 0.6;
    });

    if (!isTooSimilar) {
      selected.push(item);
    }
  }

  if (selected.length === 0 && sentences.length > 0) {
    return sentences.slice(0, Math.min(count, sentences.length));
  }

  selected.sort((a, b) => a.index - b.index);
  return selected.map(s => s.sentence);
}

function generateSummary(text, length = 'medium') {
  if (!text || text.trim().length === 0) {
    throw new Error('No text provided for summary generation.');
  }

  const cleaned = cleanText(text);
  const sentences = splitIntoSentences(cleaned);
  const words = tokenizeWords(cleaned);

  if (sentences.length <= 2) {
    return {
      summary: cleaned,
      keyPoints: sentences,
      summaryLength: length,
      engine: 'smart-nlp'
    };
  }

  const wordFrequencies = calculateWordFrequencies(words);
  const scored = scoreSentences(sentences, wordFrequencies, words.length);

  let targetCount = 3;
  let keyPointsCount = 4;
  if (length === 'short') {
    targetCount = Math.max(2, Math.min(3, Math.ceil(sentences.length * 0.2)));
    keyPointsCount = 3;
  } else if (length === 'long') {
    targetCount = Math.max(7, Math.min(12, Math.ceil(sentences.length * 0.45)));
    keyPointsCount = 6;
  } else {
    targetCount = Math.max(4, Math.min(6, Math.ceil(sentences.length * 0.3)));
    keyPointsCount = 5;
  }

  const sorted = [...scored]
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const topSentences = sorted.slice(0, targetCount);
  topSentences.sort((a, b) => a.index - b.index);

  let summaryText = '';
  if (length === 'long' && topSentences.length >= 6) {
    const chunk1 = topSentences.slice(0, Math.ceil(topSentences.length / 2)).map(s => s.sentence).join(' ');
    const chunk2 = topSentences.slice(Math.ceil(topSentences.length / 2)).map(s => s.sentence).join(' ');
    summaryText = `${chunk1}\n\n${chunk2}`;
  } else {
    summaryText = topSentences.map(s => s.sentence).join(' ');
  }

  const keyPoints = extractKeyPoints(sentences, scored, keyPointsCount);

  return {
    summary: summaryText,
    keyPoints,
    summaryLength: length,
    engine: 'smart-nlp',
    sentenceCount: topSentences.length
  };
}

module.exports = {
  generateSummary,
  generateNlpSummary: generateSummary,
  extractKeyPoints
};
