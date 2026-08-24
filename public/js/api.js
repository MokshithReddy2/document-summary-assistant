const API = {
  getApiKey() {
    return localStorage.getItem('doc_summary_gemini_key') || '';
  },

  setApiKey(key) {
    if (key && key.trim().length > 0) {
      localStorage.setItem('doc_summary_gemini_key', key.trim());
    } else {
      localStorage.removeItem('doc_summary_gemini_key');
    }
  },

  async analyzeDocument(fileOrSample, summaryLength = 'medium') {
    const apiKey = this.getApiKey();
    const headers = {};
    if (apiKey) {
      headers['x-gemini-key'] = apiKey;
    }

    let body;
    if (fileOrSample instanceof File) {
      body = new FormData();
      body.append('document', fileOrSample);
      body.append('summaryLength', summaryLength);
      if (apiKey) body.append('apiKey', apiKey);

      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        headers,
        body
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze document.');
      }
      return data;
    } else if (typeof fileOrSample === 'object' && fileOrSample.sampleId) {
      headers['Content-Type'] = 'application/json';
      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sampleId: fileOrSample.sampleId,
          summaryLength,
          apiKey
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
    const apiKey = this.getApiKey();
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) {
      headers['x-gemini-key'] = apiKey;
    }

    const response = await fetch('/api/re-summarize', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        text,
        length,
        apiKey
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
