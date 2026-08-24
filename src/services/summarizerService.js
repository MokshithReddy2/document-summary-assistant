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

function generateNlpSummary(text, length = 'medium') {
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

async function generateAiSummary(text, length = 'medium', apiKey) {
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;
  if (!effectiveKey) {
    return generateNlpSummary(text, length);
  }

  const lengthInstructions = {
    short: 'Create a concise 2-3 sentence executive summary that captures the absolute core message and outcome.',
    medium: 'Create a well-structured summary of 1-2 balanced paragraphs covering background, primary findings, and key takeaways.',
    long: 'Create a comprehensive multi-section summary with an Overview paragraph, Deep-Dive Insights, and Strategic Implications.'
  };

  const prompt = `You are a Document Summary Assistant. Analyze the following document text and produce a smart summary.

Instructions:
1. Summary Length: ${length.toUpperCase()} - ${lengthInstructions[length] || lengthInstructions.medium}
2. Extract 4-6 distinct Key Points and Main Ideas that highlight crucial information.
3. Respond ONLY in valid JSON format matching this exact schema:
{
  "summary": "The complete summary text here...",
  "keyPoints": [
    "Key point 1...",
    "Key point 2...",
    "Key point 3...",
    "Key point 4..."
  ]
}

Document Content:
"""
${text.slice(0, 15000)}
"""`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${effectiveKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      console.warn('Gemini API returned status', response.status, '- Falling back to NLP summarizer');
      return generateNlpSummary(text, length);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      return generateNlpSummary(text, length);
    }

    const parsed = JSON.parse(candidateText);
    return {
      summary: parsed.summary || '',
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      summaryLength: length,
      engine: 'gemini-ai'
    };
  } catch (aiError) {
    console.warn('AI Summary error, falling back to NLP summarizer:', aiError.message);
    return generateNlpSummary(text, length);
  }
}

async function generateSummary(text, length = 'medium', customApiKey = null) {
  if (!text || text.trim().length === 0) {
    throw new Error('No text provided for summary generation.');
  }

  const effectiveKey = customApiKey || process.env.GEMINI_API_KEY;
  if (effectiveKey) {
    return await generateAiSummary(text, length, effectiveKey);
  } else {
    return generateNlpSummary(text, length);
  }
}

module.exports = {
  generateSummary,
  generateNlpSummary,
  generateAiSummary,
  extractKeyPoints
};
