const API = {
  async analyzeDocument(fileOrSample, summaryLength = 'medium') {
    if (fileOrSample instanceof File) {
      const body = new FormData();
      body.append('document', fileOrSample);
      body.append('summaryLength', summaryLength);

      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        body
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze document.');
      }
      return data;
    } else if (typeof fileOrSample === 'object' && fileOrSample.sampleId) {
      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleId: fileOrSample.sampleId,
          summaryLength
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze sample document.');
      }
      return data;
    } else {
      throw new Error('Invalid upload payload.');
    }
  },

  async resummarizeText(text, length = 'medium') {
    const response = await fetch('/api/re-summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        length
      })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to generate new summary length.');
    }
    return data;
  },

  async getSampleDocuments() {
    try {
      const response = await fetch('/api/sample-documents');
      const data = await response.json();
      return data.success ? data.samples : [];
    } catch (err) {
      console.warn('Could not fetch sample documents:', err.message);
      return [];
    }
  }
};

window.API = API;
