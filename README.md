# Document Summary Assistant 📄✨

An AI-powered web application that accepts documents (**PDF** and **Scanned Images**), extracts text with formatting preservation and OCR, generates customizable smart summaries (**Short**, **Medium**, **Long**), highlights **Key Points & Main Ideas**, and provides actionable **Document Improvement Suggestions**.

---

## 📝 Approach Write-Up (Technical Assessment Deliverable)

> **Approach & Architecture Summary (178 words):**
> 
> The Document Summary Assistant was engineered with a modular, full-stack pipeline emphasizing resilience, performance, and user experience. 
> 
> 1. **Document Ingestion & Text Extraction**: Incoming documents (PDFs and images) are processed through dedicated extraction micro-services. PDFs are parsed using `pdf-parse` with structural layout coordinates to retain paragraphs and headings. Scanned images are processed via `tesseract.js` Optical Character Recognition (OCR) with confidence scoring.
> 2. **Multi-Engine Intelligence**: For summary generation, the backend employs a hybrid dual-engine approach. An algorithmic NLP engine utilizes TF-IDF frequency scoring, TextRank sentence centrality, positional heuristics, and cue-phrase weighting to deliver instant, high-quality extractive summaries and key takeaways with zero external dependencies. Additionally, an optional Google Gemini AI integration provides generative synthesis.
> 3. **Quality & Improvement Analysis**: Extracted text is evaluated using Flesch-Kincaid readability scoring, sentence complexity metrics, wordiness detection, and structural hierarchy audits to generate actionable writing recommendations.
> 4. **Modern UI/UX**: The frontend is built with semantic HTML5, responsive CSS with glassmorphism and dark/light themes, and reactive JavaScript supporting drag-and-drop, step-by-step progress tracking, and dynamic re-summarization.

---

## ✨ Features Traceability Matrix

| Feature from Assessment | Implementation Details | Status |
| :--- | :--- | :---: |
| **1. Document Upload** | • Drag-and-drop zone + native file picker<br>• Supports `.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.bmp`<br>• Preloaded 1-click sample documents for instant testing | ✅ Complete |
| **2. Text Extraction** | • **PDF Parsing**: Server-side parsing preserving line breaks & structure<br>• **OCR Engine**: Tesseract.js for scanned images and photos | ✅ Complete |
| **3. Summary Generation** | • Customizable length: **Short** (2-3 sentences), **Medium** (balanced), **Long** (comprehensive)<br>• **Key Points & Main Ideas** extraction cards<br>• Dual-engine (Smart NLP + Optional Gemini AI) | ✅ Complete |
| **4. Improvement Suggestions** | • Automated document quality analysis (Readability, Clarity, Structure, Tone, Conciseness)<br>• Actionable recommendations with priority levels | ✅ Complete |
| **9. UI/UX** | • Clean, modern interface with Dark and Light mode toggle<br>• Mobile-responsive grid/flex layout<br>• Multi-stage animated loading progress states | ✅ Complete |
| **10. Hosting Ready** | • Zero-configuration deployment for Render, Heroku, Vercel, or Railway<br>• `vercel.json` & `Procfile` included | ✅ Complete |

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **File Uploads**: Multer (Memory Storage)
- **PDF Extraction**: `pdf-parse` (preserves line structure and formatting)
- **OCR Technology**: `tesseract.js`
- **Smart Summarization**: Algorithmic NLP Engine (TF-IDF, TextRank sentence graph, position heuristics) + Google Gemini API (Free tier integration)
- **Frontend**: Vanilla HTML5, Vanilla CSS3 (Custom Design System, Dark/Light Themes), Vanilla JavaScript (ES Modules, reactive state)
- **Icons**: Lucide Icons
- **Typography**: Google Fonts (Plus Jakarta Sans & JetBrains Mono)

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (v8 or higher)

### Installation & Setup

1. **Clone or Navigate to the project directory:**
   ```bash
   cd proj1
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional):**
   ```bash
   cp .env.example .env
   ```
   *Note: The application works 100% out of the box with the built-in Smart NLP Engine. Adding `GEMINI_API_KEY` in `.env` or through the in-app settings modal is optional.*

4. **Start the Application:**
   ```bash
   # Production mode
   npm start

   # Development mode with auto-reload
   npm run dev
   ```

5. **Open in Browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🧪 Testing

Run the automated backend and integration test suites:

```bash
# Run unit tests
npm test

# Run API integration tests
node test/test-integration.js
```

---

## 🌐 Deployment & Hosting Guide

The application is structured for instant deployment to any cloud hosting provider:

### Option 1: Render / Railway / Heroku
1. Push the repository to GitHub.
2. Connect your GitHub repository on Render / Railway / Heroku.
3. Set the build command to `npm install` and start command to `node server.js` (or use the included `Procfile`).
4. Set optional environment variable `GEMINI_API_KEY` (if desired).

### Option 2: Vercel
The repository includes a ready-to-use `vercel.json` serverless function configuration:
1. Run `npx vercel` or link the repository on [Vercel](https://vercel.com).
2. Deploy directly with zero additional configuration.

---

## 📂 Project Structure

```
proj1/
├── server.js                  # Main Express application server
├── package.json               # Dependencies and scripts
├── vercel.json                # Vercel deployment configuration
├── Procfile                   # Heroku / Render deployment configuration
├── .env.example               # Environment variables template
├── .gitignore
├── README.md                  # Project documentation & approach write-up
├── test/
│   ├── test-backend.js        # Unit test suite for utilities and services
│   └── test-integration.js    # HTTP API integration test suite
├── src/
│   ├── controllers/
│   │   └── documentController.js # Upload, OCR, and summary orchestration
│   ├── routes/
│   │   └── api.js             # REST API routes
│   ├── services/
│   │   ├── pdfService.js      # Multi-page PDF text extraction
│   │   ├── ocrService.js      # Tesseract OCR image text extraction
│   │   ├── summarizerService.js # Smart NLP & Gemini multi-length summarization
│   │   └── suggestionsService.js # Readability analysis & improvement suggestions
│   └── utils/
│       └── textUtils.js       # Text tokenization, TF-IDF, and Flesch metrics
└── public/
    ├── index.html             # Semantic Single Page App HTML5 interface
    ├── css/
    │   └── styles.css         # Responsive modern CSS design system
    └── js/
        ├── api.js             # Client API communication
        ├── ui.js              # DOM rendering, notifications, and animations
        └── app.js             # Frontend state & event handling
```

---

## 📄 License
MIT License
