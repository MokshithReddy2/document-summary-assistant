const { createWorker } = require('tesseract.js');

async function extractTextFromImage(imageBuffer, progressCallback) {
  if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
    throw new Error('Invalid image file provided: Buffer is empty or invalid.');
  }

  let worker = null;
  try {
    worker = await createWorker('eng');
    const result = await worker.recognize(imageBuffer);
    const text = result?.data?.text ? result.data.text.trim() : '';
    const confidence = result?.data?.confidence || 0;

    if (!text || text.length === 0) {
      throw new Error('OCR could not detect any readable text in the image. Please ensure the image is clear and contains legible text.');
    }

    const wordCount = text.split(/\s+/).filter(Boolean).length;

    return {
      text,
      confidence: Math.round(confidence * 10) / 10,
      wordCount
    };
  } catch (error) {
    throw new Error(`OCR Processing Failed: ${error.message}`);
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (termErr) {
        console.warn('Worker termination warning:', termErr.message);
      }
    }
  }
}

module.exports = {
  extractTextFromImage
};
