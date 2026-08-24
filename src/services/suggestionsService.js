const {
  cleanText,
  splitIntoSentences,
  tokenizeWords,
  calculateReadabilityMetrics
} = require('../utils/textUtils');

const WORDY_PHRASES = [
  { phrase: 'due to the fact that', suggestion: 'use "because"' },
  { phrase: 'in order to', suggestion: 'use "to"' },
  { phrase: 'at this point in time', suggestion: 'use "currently" or "now"' },
  { phrase: 'for the purpose of', suggestion: 'use "for" or "to"' },
  { phrase: 'in the event that', suggestion: 'use "if"' },
  { phrase: 'with regard to', suggestion: 'use "regarding" or "about"' },
  { phrase: 'utilize', suggestion: 'use "use"' },
  { phrase: 'a large number of', suggestion: 'use "many"' },
  { phrase: 'prior to', suggestion: 'use "before"' },
  { phrase: 'subsequent to', suggestion: 'use "after"' },
  { phrase: 'in addition to', suggestion: 'use "also" or "besides"' }
];

const PASSIVE_INDICATORS = [
  'was done', 'were made', 'has been observed', 'have been conducted',
  'is considered', 'was found', 'were given', 'is being processed'
];

function generateHeuristicSuggestions(text) {
  const cleaned = cleanText(text);
  const metrics = calculateReadabilityMetrics(cleaned);
  const sentences = splitIntoSentences(cleaned);
  const lowerText = cleaned.toLowerCase();

  const suggestions = [];

  if (metrics.fleschReadingEase < 50) {
    suggestions.push({
      category: 'Readability',
      icon: 'book-open',
      priority: 'High',
      title: 'Simplify Sentence Structures',
      description: `The document has a Flesch Reading Ease score of ${metrics.fleschReadingEase} (${metrics.readingLevel}). Consider shortening sentences and replacing multi-syllable jargon with simpler terminology to improve accessibility.`
    });
  } else if (metrics.fleschReadingEase > 85) {
    suggestions.push({
      category: 'Readability',
      icon: 'check-circle',
      priority: 'Low',
      title: 'Optimal Readability',
      description: `The document is very easy to read (${metrics.fleschReadingEase}/100 score). The language is clear and straightforward.`
    });
  }

  const longSentences = sentences.filter(s => tokenizeWords(s).length > 35);
  if (longSentences.length > 0) {
    suggestions.push({
      category: 'Clarity',
      icon: 'scissors',
      priority: 'Medium',
      title: `Break Down Long Sentences (${longSentences.length} detected)`,
      description: `Found sentences with more than 35 words. Splitting them into shorter, focused sentences will make your core arguments easier to digest. Example: "${longSentences[0].slice(0, 80)}..."`
    });
  }

  const detectedWordy = [];
  for (const item of WORDY_PHRASES) {
    if (lowerText.includes(item.phrase)) {
      detectedWordy.push(`"${item.phrase}" (${item.suggestion})`);
    }
  }

  if (detectedWordy.length > 0) {
    suggestions.push({
      category: 'Conciseness',
      icon: 'zap',
      priority: 'Medium',
      title: 'Eliminate Wordy Expressions',
      description: `Streamline your phrasing to tighten prose: replace ${detectedWordy.slice(0, 3).join(', ')}.`
    });
  }

  const hasParagraphBreaks = cleaned.includes('\n\n') || cleaned.includes('\n');
  const hasListsOrBullets = /[•\-\*\d+\.]\s+[A-Z]/.test(cleaned);

  if (sentences.length > 8 && !hasParagraphBreaks) {
    suggestions.push({
      category: 'Structure',
      icon: 'layout',
      priority: 'High',
      title: 'Add Paragraph Breaks & Section Headers',
      description: 'The text is presented as a dense block. Adding descriptive sub-headings and distinct paragraph breaks will dramatically improve visual hierarchy.'
    });
  }

  if (sentences.length > 10 && !hasListsOrBullets) {
    suggestions.push({
      category: 'Structure',
      icon: 'list',
      priority: 'Medium',
      title: 'Use Bullet Points for Key Takeaways',
      description: 'Important enumerations, metrics, or recommendations are easier to scan when formatted as bulleted or numbered lists.'
    });
  }

  const passiveMatches = PASSIVE_INDICATORS.filter(ind => lowerText.includes(ind));
  if (passiveMatches.length > 0) {
    suggestions.push({
      category: 'Tone & Style',
      icon: 'feather',
      priority: 'Low',
      title: 'Strengthen Active Voice',
      description: `Several passive constructions were detected (e.g., "${passiveMatches[0]}"). Using active voice makes statements more direct and impactful.`
    });
  }

  const hasConclusionKeywords = ['conclu', 'summar', 'next step', 'recommend', 'action', 'outcome'].some(kw => lowerText.includes(kw));
  if (!hasConclusionKeywords && sentences.length > 6) {
    suggestions.push({
      category: 'Impact',
      icon: 'target',
      priority: 'Medium',
      title: 'Include a Clear Conclusion or Next Steps',
      description: 'Add a concluding section summarizing key outcomes, next steps, or decision items for your readers.'
    });
  }

  return {
    metrics,
    suggestions: suggestions.length > 0 ? suggestions : [
      {
        category: 'Overall Quality',
        icon: 'check-circle',
        priority: 'Low',
        title: 'Document is Well-Structured',
        description: 'The document shows good sentence variation, balanced length, and clear phrasing.'
      }
    ]
  };
}

async function generateAiSuggestions(text, apiKey) {
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;
  if (!effectiveKey) {
    return generateHeuristicSuggestions(text);
  }

  const prompt = `Analyze this document and provide 4-6 specific, actionable improvement suggestions covering:
- Readability & Flow
- Structural Hierarchy
- Clarity & Conciseness
- Tone & Audience Engagement

Respond ONLY in valid JSON matching this schema:
{
  "suggestions": [
    {
      "category": "Readability | Structure | Clarity | Tone & Style | Impact",
      "priority": "High | Medium | Low",
      "title": "Short title",
      "description": "Actionable, specific recommendation with example if relevant"
    }
  ]
}

Document:
"""
${text.slice(0, 10000)}
"""`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${effectiveKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      return generateHeuristicSuggestions(text);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return generateHeuristicSuggestions(text);

    const parsed = JSON.parse(candidateText);
    const metrics = calculateReadabilityMetrics(text);

    return {
      metrics,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : generateHeuristicSuggestions(text).suggestions
    };
  } catch (err) {
    console.warn('AI suggestions error, using heuristics:', err.message);
    return generateHeuristicSuggestions(text);
  }
}

async function generateImprovementSuggestions(text, customApiKey = null) {
  const effectiveKey = customApiKey || process.env.GEMINI_API_KEY;
  if (effectiveKey) {
    return await generateAiSuggestions(text, effectiveKey);
  } else {
    return generateHeuristicSuggestions(text);
  }
}

module.exports = {
  generateImprovementSuggestions,
  generateHeuristicSuggestions
};
