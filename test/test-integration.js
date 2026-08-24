const http = require('http');
const app = require('../server');

let server;
const PORT = 3456;

async function runIntegrationTests() {
  console.log('🌐 Running Express API Integration Tests on Port', PORT);

  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });

  function makeRequest(path, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : null;
      const reqHeaders = { ...headers };
      if (payload) {
        reqHeaders['Content-Type'] = 'application/json';
        reqHeaders['Content-Length'] = Buffer.byteLength(payload);
      }

      const req = http.request({
        hostname: 'localhost',
        port: PORT,
        path,
        method,
        headers: reqHeaders
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });

      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  }

  try {
    const health = await makeRequest('/api/health');
    console.log('  ✅ GET /api/health status:', health.status, health.body.status);
    if (health.status !== 200 || health.body.status !== 'healthy') {
      throw new Error('Health check failed');
    }

    const samplesRes = await makeRequest('/api/sample-documents');
    console.log('  ✅ GET /api/sample-documents count:', samplesRes.body.samples?.length);
    if (samplesRes.status !== 200 || !samplesRes.body.samples || samplesRes.body.samples.length < 3) {
      throw new Error('Sample documents failed');
    }

    const analyzeRes = await makeRequest('/api/analyze-document', 'POST', {
      sampleId: 'sample-ai-report',
      summaryLength: 'short'
    });
    console.log('  ✅ POST /api/analyze-document (sample-ai-report) status:', analyzeRes.status);
    if (analyzeRes.status !== 200 || !analyzeRes.body.success) {
      throw new Error('Document analysis failed: ' + JSON.stringify(analyzeRes.body));
    }

    const resummarizeRes = await makeRequest('/api/re-summarize', 'POST', {
      text: analyzeRes.body.document.extractedText,
      length: 'long'
    });
    console.log('  ✅ POST /api/re-summarize status:', resummarizeRes.status, 'Length:', resummarizeRes.body.summary.length);
    if (resummarizeRes.status !== 200 || resummarizeRes.body.summary.length !== 'long') {
      throw new Error('Re-summarize failed');
    }

    console.log('\n🎉 All Express Integration Tests Passed Successfully!\n');
  } finally {
    server.close();
  }
}

runIntegrationTests().catch(err => {
  console.error('❌ Integration test failed:', err);
  if (server) server.close();
  process.exit(1);
});
