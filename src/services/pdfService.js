const pdfParse = require('pdf-parse');

async function extractTextFromPDF(pdfBuffer) {
  if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
    throw new Error('Invalid PDF file provided: Buffer is empty or invalid.');
  }

  try {
    const options = {
      pagerender: function (pageData) {
        return pageData.getTextContent().then(function (textContent) {
          let lastY, text = '';
          for (let item of textContent.items) {
            if (lastY == item.transform[5] || !lastY) {
              text += item.str + ' ';
            } else {
              text += '\n' + item.str + ' ';
            }
            lastY = item.transform[5];
          }
          return text + '\n\n';
        });
      }
    };

    const data = await pdfParse(pdfBuffer, options);

    const extractedText = (data.text && data.text.trim().length > 0)
      ? data.text.trim()
      : (await pdfParse(pdfBuffer)).text.trim();

    if (!extractedText || extractedText.length === 0) {
      throw new Error('The PDF document contains no readable text. It may be an image-only/scanned PDF. Try uploading it as an image for OCR processing.');
    }

    const wordCount = extractedText.split(/\s+/).filter(Boolean).length;

    return {
      text: extractedText,
      numPages: data.numpages || 1,
      info: {
        title: data.info?.Title || 'Untitled Document',
        author: data.info?.Author || 'Unknown',
        creator: data.info?.Creator || 'PDF Generator',
        producer: data.info?.Producer || 'PDF Producer'
      },
      wordCount
    };
  } catch (error) {
    if (error.message.includes('password') || error.message.includes('encrypted')) {
      throw new Error('The PDF is password protected or encrypted. Please remove password protection and try again.');
    }
    throw new Error(`Failed to parse PDF document: ${error.message}`);
  }
}

module.exports = {
  extractTextFromPDF
};
