const { extractTextFromPDF } = require('../services/pdfService');
const { extractTextFromImage } = require('../services/ocrService');
const { generateSummary } = require('../services/summarizerService');
const { generateImprovementSuggestions } = require('../services/suggestionsService');
const { calculateReadabilityMetrics } = require('../utils/textUtils');

const SAMPLE_DOCUMENTS = [
  {
    id: 'sample-ai-report',
    title: 'Executive Report: Next-Gen AI in Enterprise 2025',
    type: 'pdf',
    fileName: 'Enterprise_AI_Report_2025.pdf',
    text: `Executive Summary: Artificial Intelligence in Modern Enterprise Transformation

Artificial intelligence has rapidly transitioned from an experimental capability into the foundational driver of operational efficiency and revenue expansion across global industries. During the fiscal year 2024-2025, organizations adopting generative AI workflows reported an average productivity increase of 34% in customer support operations and a 28% reduction in software development cycle times.

Key Drivers of Adoption:
The primary catalyst for this shift is the availability of cost-effective small language models (SLMs) and multimodal processing pipelines. Unlike early iterations requiring prohibitive high-performance cloud clusters, modern architectures leverage quantized models running on edge devices and hybrid enterprise servers. Furthermore, automated document processing, contract intelligence, and real-time synthesis have eliminated up to 15 hours of manual clerical work per employee every week.

Challenges and Risk Mitigation:
Despite these remarkable efficiency gains, critical challenges remain regarding data privacy, model hallucinations, and enterprise governance. Approximately 42% of surveyed Chief Technology Officers cited cybersecurity vulnerability and unverified data leakage as their top concerns prior to enterprise deployment. To mitigate these risks, leading enterprises are adopting strict Retrieval-Augmented Generation (RAG) guardrails, zero-trust data access protocols, and continuous automated auditing frameworks.

Strategic Recommendations for 2025-2026:
Organizations must focus on three core strategic pillars over the next eighteen months:
1. Establish a cross-functional AI Governance Council to evaluate compliance, ethics, and security.
2. Invest aggressively in employee upskilling programs to ensure workforce fluency with intelligent assistant tools.
3. Prioritize high-ROI use cases such as customer knowledge bases, legal contract summarization, and automated code review before attempting company-wide model rollouts.

Conclusion:
In conclusion, enterprises that strategically implement governed AI systems will gain a substantial competitive advantage in market velocity and cost discipline. Early adopters have already demonstrated measurable ROI, establishing a clear blueprint for sustainable digital transformation.`
  },
  {
    id: 'sample-medical-research',
    title: 'Research Paper: Telemedicine Adoption & Patient Outcomes',
    type: 'pdf',
    fileName: 'Clinical_Telehealth_Study.pdf',
    text: `Clinical Study: Long-Term Health Outcomes of Hybrid Telemedicine Frameworks

Abstract:
The integration of digital telehealth solutions with traditional in-person clinical consultations has altered chronic disease management protocols. This longitudinal cohort study evaluated 4,250 patients diagnosed with Type 2 Diabetes and Hypertension across 12 healthcare facilities over a 24-month observation period.

Methodology and Patient Cohorts:
Participants were divided into two equal groups. Group A received standard ambulatory care consisting of quarterly in-person clinic visits. Group B engaged in a hybrid care model combining asynchronous biometric tracking (wearable blood pressure and continuous glucose monitoring) with bi-weekly virtual physician consultations.

Primary Clinical Findings:
Patients enrolled in the hybrid telemedicine model (Group B) demonstrated statistically significant improvements in key clinical biomarkers. Mean HbA1c levels decreased by 1.4% in Group B compared to 0.6% in Group A (p < 0.001). Furthermore, systolic blood pressure control rates reached 82% in the hybrid group versus 64% in the standard care group. Notably, emergency department readmission rates were reduced by 41% due to early automated anomaly alerts triggered by wearable telemetry.

Economic Impact on Healthcare Systems:
From an economic perspective, the hybrid protocol yielded an average annual cost reduction of $1,850 per patient, driven primarily by prevented emergency hospitalizations and decreased transportation overhead. Patient satisfaction indices were exceptionally high, with 94% of Group B participants reporting superior accessibility and better adherence to medication regimens.

Limitations and Future Scope:
The study acknowledges certain limitations, including variations in digital health literacy among elderly demographics and regional disparities in broadband internet connectivity. Future research will explore AI-driven automated triage and predictive flare-up models to further personalize care pathways.

Conclusion:
Hybrid telemedicine frameworks offer superior clinical efficacy, lower systemic costs, and enhanced patient satisfaction compared to standard care alone. Healthcare providers should accelerate the formal accreditation and reimbursement of continuous remote patient monitoring programs.`
  },
  {
    id: 'sample-scanned-invoice',
    title: 'Scanned Document: Cloud Infrastructure Services Invoice',
    type: 'image',
    fileName: 'Scanned_Invoice_Nov2025.png',
    text: `INVOICE & SERVICE STATEMENT
Apex Cloud Solutions LLC
100 Innovation Way, Suite 400, San Francisco, CA 94105
Tax ID: 82-4910294 | Phone: (415) 555-0199 | support@apexcloud.io

Bill To:
Acme Global Logistics Inc.
Attn: Finance Department - Accounts Payable
742 Evergreen Terrace, Seattle, WA 98101

Invoice Details:
Invoice Number: INV-2025-8841
Invoice Date: November 15, 2025
Payment Terms: Net 30 Days
Due Date: December 15, 2025

Service Breakdown:
1. Enterprise Cloud Compute Cluster (128 vCPU, 512GB RAM) - Billing Period: Oct 1 - Oct 31, 2025 | $3,450.00
2. Managed Kubernetes Orchestration & Auto-scaling Service (Tier 1 Support) | $850.00
3. Distributed Object Storage (25 TB Data Transfer + Snapshot Backups) | $620.00
4. Advanced Cloud Security Shield, WAF & DDoS Mitigation Suite | $480.00
5. AI Inference Acceleration & Vector Database Hosting Add-on | $1,200.00

Summary:
Subtotal: $6,600.00
Applicable State & Local Tax (8.25%): $544.50
Total Balance Due: $7,144.50

Payment Instructions:
Please remit payment via ACH Wire Transfer to:
Bank Name: Silicon Valley Commercial Bank
Account Number: *******9281 | Routing Number: 121000358
Reference: INV-2025-8841

Thank you for choosing Apex Cloud Solutions for your mission-critical infrastructure.`
  }
];

async function analyzeDocument(req, res) {
  try {
    const summaryLength = req.body.summaryLength || 'medium';

    let extractedText = '';
    let documentType = 'unknown';
    let originalName = 'uploaded-document';
    let fileMetadata = {};

    if (req.file) {
      originalName = req.file.originalname;
      const mimeType = req.file.mimetype.toLowerCase();

      if (mimeType === 'application/pdf' || originalName.toLowerCase().endsWith('.pdf')) {
        documentType = 'PDF Document';
        const pdfResult = await extractTextFromPDF(req.file.buffer);
        extractedText = pdfResult.text;
        fileMetadata = {
          numPages: pdfResult.numPages,
          info: pdfResult.info,
          fileSize: `${(req.file.size / 1024).toFixed(1)} KB`
        };
      } else if (
        mimeType.startsWith('image/') ||
        /\.(png|jpe?g|webp|bmp|tiff?)$/i.test(originalName)
      ) {
        documentType = 'Scanned Image (OCR)';
        const ocrResult = await extractTextFromImage(req.file.buffer);
        extractedText = ocrResult.text;
        fileMetadata = {
          ocrConfidence: `${ocrResult.confidence}%`,
          fileSize: `${(req.file.size / 1024).toFixed(1)} KB`
        };
      } else {
        return res.status(400).json({
          success: false,
          error: 'Unsupported file type. Please upload a PDF document (.pdf) or an image file (.png, .jpg, .jpeg, .webp, .bmp).'
        });
      }
    } else if (req.body.sampleId) {
      const sample = SAMPLE_DOCUMENTS.find(s => s.id === req.body.sampleId);
      if (!sample) {
        return res.status(404).json({ success: false, error: 'Sample document not found.' });
      }
      extractedText = sample.text;
      documentType = sample.type === 'pdf' ? 'Sample PDF Document' : 'Sample Scanned Image (OCR)';
      originalName = sample.fileName;
      fileMetadata = {
        sampleTitle: sample.title,
        source: 'Built-in Demo Sample'
      };
    } else if (req.body.rawText) {
      extractedText = req.body.rawText;
      documentType = 'Direct Text Input';
      originalName = 'Text Document';
    } else {
      return res.status(400).json({
        success: false,
        error: 'No document uploaded. Please upload a PDF or image file, or choose a sample document.'
      });
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(422).json({
        success: false,
        error: 'Could not extract text from the document. Please ensure the file contains legible content.'
      });
    }

    const summaryResult = generateSummary(extractedText, summaryLength);
    const suggestionsResult = generateImprovementSuggestions(extractedText);
    const metrics = calculateReadabilityMetrics(extractedText);

    return res.json({
      success: true,
      document: {
        fileName: originalName,
        documentType,
        metadata: fileMetadata,
        extractedText,
        metrics
      },
      summary: {
        text: summaryResult.summary,
        length: summaryLength,
        keyPoints: summaryResult.keyPoints || [],
        engine: 'smart-nlp'
      },
      improvementSuggestions: suggestionsResult.suggestions || []
    });
  } catch (error) {
    console.error('Error in analyzeDocument:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred while processing the document.'
    });
  }
}

async function resummarizeText(req, res) {
  try {
    const { text, length = 'medium' } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text content is required for re-summarization.'
      });
    }

    const validLengths = ['short', 'medium', 'long'];
    const selectedLength = validLengths.includes(length.toLowerCase()) ? length.toLowerCase() : 'medium';

    const summaryResult = generateSummary(text, selectedLength);

    return res.json({
      success: true,
      summary: {
        text: summaryResult.summary,
        length: selectedLength,
        keyPoints: summaryResult.keyPoints || [],
        engine: 'smart-nlp'
      }
    });
  } catch (error) {
    console.error('Error in resummarizeText:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate summary.'
    });
  }
}

function getSampleDocuments(req, res) {
  const samples = SAMPLE_DOCUMENTS.map(s => ({
    id: s.id,
    title: s.title,
    type: s.type,
    fileName: s.fileName,
    preview: s.text.slice(0, 160) + '...'
  }));

  return res.json({
    success: true,
    samples
  });
}

module.exports = {
  analyzeDocument,
  resummarizeText,
  getSampleDocuments,
  SAMPLE_DOCUMENTS
};
