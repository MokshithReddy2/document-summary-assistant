const assert = require('assert');
const { calculateReadabilityMetrics, cleanText, splitIntoSentences } = require('../src/utils/textUtils');
const { generateNlpSummary, extractKeyPoints } = require('../src/services/summarizerService');
const { generateHeuristicSuggestions } = require('../src/services/suggestionsService');
const { SAMPLE_DOCUMENTS } = require('../src/controllers/documentController');

async function runTests() {
  console.log('🧪 Starting Document Summary Assistant Backend Test Suite...\n');
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
    }
  }

  test('cleanText should normalize whitespaces and line endings', () => {
    const raw = 'Hello \r\n world \t\t test \n\n\n\n end';
    const cleaned = cleanText(raw);
    assert.strictEqual(cleaned.includes('\r'), false);
    assert.strictEqual(cleaned.includes('\t\t'), false);
  });

  test('splitIntoSentences should correctly tokenize sentences', () => {
    const text = 'First sentence. Second sentence with details! Third sentence? Here is another one.';
    const sentences = splitIntoSentences(text);
    assert.ok(sentences.length >= 3, `Expected at least 3 sentences, got ${sentences.length}`);
  });

  test('calculateReadabilityMetrics should compute valid Flesch scores', () => {
    const sample = SAMPLE_DOCUMENTS[0].text;
    const metrics = calculateReadabilityMetrics(sample);
    assert.ok(metrics.wordCount > 50, 'Word count should be > 50');
    assert.ok(metrics.fleschReadingEase >= 0 && metrics.fleschReadingEase <= 100, 'Score between 0-100');
    assert.ok(metrics.readingLevel.length > 0, 'Reading level string should be populated');
  });

  test('generateNlpSummary should generate Short, Medium, and Long summaries', () => {
    const sample = SAMPLE_DOCUMENTS[0].text;
    
    const shortSum = generateNlpSummary(sample, 'short');
    const medSum = generateNlpSummary(sample, 'medium');
    const longSum = generateNlpSummary(sample, 'long');

    assert.ok(shortSum.summary.length > 0, 'Short summary must have text');
    assert.ok(medSum.summary.length > 0, 'Medium summary must have text');
    assert.ok(longSum.summary.length > 0, 'Long summary must have text');

    assert.ok(shortSum.summary.length <= medSum.summary.length, 'Short should be <= Medium');
    assert.ok(medSum.summary.length <= longSum.summary.length, 'Medium should be <= Long');
    
    assert.ok(shortSum.keyPoints.length >= 2, 'Key points extracted');
    assert.ok(medSum.keyPoints.length >= 3, 'Key points extracted');
  });

  test('generateHeuristicSuggestions should produce actionable recommendations', () => {
    const sample = SAMPLE_DOCUMENTS[0].text;
    const result = generateHeuristicSuggestions(sample);
    assert.ok(result.suggestions && result.suggestions.length > 0, 'Suggestions should not be empty');
    assert.ok(result.suggestions[0].title, 'Suggestion title should exist');
    assert.ok(result.suggestions[0].category, 'Suggestion category should exist');
    assert.ok(result.suggestions[0].priority, 'Suggestion priority should exist');
  });

  test('SAMPLE_DOCUMENTS contains PDF and OCR image fixture datasets', () => {
    assert.ok(SAMPLE_DOCUMENTS.length >= 3, 'At least 3 sample documents defined');
    const pdfSamples = SAMPLE_DOCUMENTS.filter(s => s.type === 'pdf');
    const imgSamples = SAMPLE_DOCUMENTS.filter(s => s.type === 'image');
    assert.ok(pdfSamples.length >= 1, 'PDF sample exists');
    assert.ok(imgSamples.length >= 1, 'Image OCR sample exists');
  });

  console.log(`\n📊 Test Summary: ${passed}/${total} tests passed.\n`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
