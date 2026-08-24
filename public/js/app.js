document.addEventListener('DOMContentLoaded', () => {
  const state = {
    selectedFile: null,
    selectedSampleId: null,
    selectedLength: 'medium',
    currentDocumentData: null,
    isProcessing: false
  };

  const elements = {
    dropZone: document.getElementById('dropZone'),
    fileInput: document.getElementById('fileInput'),
    selectedFilePreview: document.getElementById('selectedFilePreview'),
    previewFileName: document.getElementById('previewFileName'),
    previewFileSize: document.getElementById('previewFileSize'),
    previewFileIcon: document.getElementById('previewFileIcon'),
    removeFileBtn: document.getElementById('removeFileBtn'),
    processDocBtn: document.getElementById('processDocBtn'),
    initialLengthBtns: document.querySelectorAll('.segmented-control .segment-btn'),
    
    uploadSection: document.getElementById('uploadSection'),
    processingSection: document.getElementById('processingSection'),
    resultsSection: document.getElementById('resultsSection'),
    
    resetBtn: document.getElementById('resetBtn'),
    copySummaryBtn: document.getElementById('copySummaryBtn'),
    downloadSummaryBtn: document.getElementById('downloadSummaryBtn'),
    summaryLengthTabs: document.querySelectorAll('.summary-length-tabs .tab-btn'),
    textInspectorToggle: document.getElementById('textInspectorToggle'),
    textInspectorContent: document.getElementById('textInspectorContent'),
    copyRawTextBtn: document.getElementById('copyRawTextBtn'),
    
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon'),
    apiKeyBtn: document.getElementById('apiKeyBtn'),
    apiKeyModal: document.getElementById('apiKeyModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
    clearApiKeyBtn: document.getElementById('clearApiKeyBtn'),
    geminiApiKeyInput: document.getElementById('geminiApiKeyInput'),
    apiKeyStatus: document.getElementById('apiKeyStatus')
  };

  initApp();

  function initApp() {
    initTheme();
    initModal();
    initUploadEvents();
    initResultControls();
    loadSampleDocuments();
  }

  function initTheme() {
    const savedTheme = localStorage.getItem('doc_summary_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    elements.themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('doc_summary_theme', nextTheme);
      updateThemeIcon(nextTheme);
    });
  }

  function updateThemeIcon(theme) {
    if (elements.themeIcon) {
      elements.themeIcon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
      if (window.lucide) lucide.createIcons();
    }
  }

  function initModal() {
    const savedKey = API.getApiKey();
    if (elements.geminiApiKeyInput) {
      elements.geminiApiKeyInput.value = savedKey ? '••••••••••••••••' : '';
    }
    updateApiKeyStatus(savedKey);

    elements.apiKeyBtn.addEventListener('click', () => {
      elements.apiKeyModal.classList.remove('hidden');
      const key = API.getApiKey();
      elements.geminiApiKeyInput.value = key;
    });

    elements.closeModalBtn.addEventListener('click', () => {
      elements.apiKeyModal.classList.add('hidden');
    });

    elements.apiKeyModal.addEventListener('click', (e) => {
      if (e.target === elements.apiKeyModal) {
        elements.apiKeyModal.classList.add('hidden');
      }
    });

    elements.saveApiKeyBtn.addEventListener('click', () => {
      const key = elements.geminiApiKeyInput.value.trim();
      API.setApiKey(key);
      updateApiKeyStatus(key);
      elements.apiKeyModal.classList.add('hidden');
      UI.showToast('API Key settings saved!', 'success');
    });

    elements.clearApiKeyBtn.addEventListener('click', () => {
      API.setApiKey('');
      elements.geminiApiKeyInput.value = '';
      updateApiKeyStatus('');
      UI.showToast('API Key cleared. Using Smart NLP Engine.', 'info');
    });
  }

  function updateApiKeyStatus(key) {
    if (!elements.apiKeyStatus) return;
    if (key && key.length > 0) {
      elements.apiKeyStatus.innerHTML = '<span style="color:var(--success)">✓ Google Gemini AI Key Configured</span>';
    } else {
      elements.apiKeyStatus.innerHTML = '<span style="color:var(--text-muted)">Using Built-in Smart NLP Engine (Offline Ready)</span>';
    }
  }

  function initUploadEvents() {
    const { dropZone, fileInput, removeFileBtn, processDocBtn } = elements;

    dropZone.addEventListener('click', (e) => {
      if (e.target.closest('#removeFileBtn')) return;
      fileInput.click();
    });

    dropZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileSelection(files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        handleFileSelection(fileInput.files[0]);
      }
    });

    removeFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearSelectedFile();
    });

    elements.initialLengthBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.initialLengthBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.selectedLength = btn.getAttribute('data-length') || 'medium';
      });
    });

    processDocBtn.addEventListener('click', () => {
      if (state.selectedFile) {
        processDocument(state.selectedFile);
      } else if (state.selectedSampleId) {
        processDocument({ sampleId: state.selectedSampleId });
      }
    });
  }

  function handleFileSelection(file) {
    const validExts = /\.(pdf|png|jpe?g|webp|bmp|tiff?)$/i;
    if (!validExts.test(file.name) && !file.type.match(/(pdf|image\/)/)) {
      UI.showToast('Please select a valid PDF (.pdf) or image file (.png, .jpg, .jpeg, .webp, .bmp).', 'error');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      UI.showToast('File size exceeds the 25MB limit.', 'error');
      return;
    }

    state.selectedFile = file;
    state.selectedSampleId = null;

    elements.previewFileName.textContent = file.name;
    elements.previewFileSize.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp)$/i.test(file.name);
    elements.previewFileIcon.setAttribute('data-lucide', isImage ? 'image' : 'file-text');

    elements.dropZone.querySelector('.dropzone-content').classList.add('hidden');
    elements.selectedFilePreview.classList.remove('hidden');
    elements.processDocBtn.disabled = false;

    if (window.lucide) lucide.createIcons();
    UI.showToast(`Selected file: ${file.name}`, 'info', 2000);
  }

  function clearSelectedFile() {
    state.selectedFile = null;
    state.selectedSampleId = null;
    elements.fileInput.value = '';
    elements.dropZone.querySelector('.dropzone-content').classList.remove('hidden');
    elements.selectedFilePreview.classList.add('hidden');
    elements.processDocBtn.disabled = true;
  }

  async function loadSampleDocuments() {
    const samples = await API.getSampleDocuments();
    UI.renderSampleCards(samples, (sampleId) => {
      state.selectedSampleId = sampleId;
      state.selectedFile = null;
      processDocument({ sampleId });
    });
  }

  async function processDocument(fileOrSample) {
    if (state.isProcessing) return;
    state.isProcessing = true;

    elements.uploadSection.classList.add('hidden');
    elements.resultsSection.classList.add('hidden');
    elements.processingSection.classList.remove('hidden');

    try {
      UI.updateProgressStep(0, 'Uploading Document...', 'Preparing file stream for analysis');
      await delay(400);

      UI.updateProgressStep(1, 'Extracting Document Text...', 'Parsing structure and running OCR for images');
      
      const length = state.selectedLength || 'medium';

      const result = await API.analyzeDocument(fileOrSample, length);

      UI.updateProgressStep(2, 'Generating Smart Summary...', 'Extracting core insights and key points');
      await delay(400);

      UI.updateProgressStep(3, 'Formulating Writing Insights...', 'Calculating readability ease and structural improvements');
      await delay(300);

      state.currentDocumentData = result;
      elements.processingSection.classList.add('hidden');
      elements.resultsSection.classList.remove('hidden');

      updateSummaryTabs(result.summary.length || length);

      UI.renderResults(result);
      UI.showToast('Document analyzed and summarized successfully!', 'success');

      elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      console.error('Processing error:', error);
      UI.showToast(error.message || 'An error occurred while processing.', 'error', 6000);
      
      elements.processingSection.classList.add('hidden');
      elements.uploadSection.classList.remove('hidden');
    } finally {
      state.isProcessing = false;
    }
  }

  function initResultControls() {
    elements.resetBtn.addEventListener('click', () => {
      clearSelectedFile();
      elements.resultsSection.classList.add('hidden');
      elements.uploadSection.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    elements.summaryLengthTabs.forEach(tab => {
      tab.addEventListener('click', async () => {
        const newLength = tab.getAttribute('data-length');
        if (!state.currentDocumentData || state.isProcessing) return;

        const currentLength = state.currentDocumentData.summary.length;
        if (newLength === currentLength) return;

        updateSummaryTabs(newLength);
        
        try {
          const rawText = state.currentDocumentData.document.extractedText;
          const container = document.getElementById('summaryTextContainer');
          container.innerHTML = '<p class="text-muted"><i data-lucide="loader-2" class="spin"></i> Generating ' + newLength + ' summary...</p>';
          if (window.lucide) lucide.createIcons();

          const result = await API.resummarizeText(rawText, newLength);
          
          state.currentDocumentData.summary = result.summary;
          UI.renderSummaryText(result.summary);
          UI.renderKeyPoints(result.summary.keyPoints);
          UI.showToast(`Updated to ${newLength} summary.`, 'info', 2000);
        } catch (err) {
          UI.showToast(err.message || 'Failed to switch summary length.', 'error');
        }
      });
    });

    elements.copySummaryBtn.addEventListener('click', () => {
      const summaryText = state.currentDocumentData?.summary?.text;
      if (summaryText) {
        UI.copyToClipboard(summaryText, 'Summary copied to clipboard!');
      }
    });

    elements.downloadSummaryBtn.addEventListener('click', () => {
      const doc = state.currentDocumentData?.document;
      const summary = state.currentDocumentData?.summary;
      if (!doc || !summary) return;

      const keyPointsList = (summary.keyPoints || []).map((kp, idx) => `${idx + 1}. ${kp}`).join('\n');
      const fileContent = `=====================================================
DOCUMENT SUMMARY ASSISTANT REPORT
=====================================================
Document: ${doc.fileName}
Type: ${doc.documentType}
Date: ${new Date().toLocaleString()}
Summary Length: ${summary.length.toUpperCase()} (${summary.engine})
Word Count: ${doc.metrics?.wordCount || 0} words
Readability Ease: ${doc.metrics?.fleschReadingEase || 0}/100 (${doc.metrics?.readingLevel || ''})

-----------------------------------------------------
EXECUTIVE SUMMARY:
-----------------------------------------------------
${summary.text}

-----------------------------------------------------
KEY POINTS & MAIN IDEAS:
-----------------------------------------------------
${keyPointsList}

=====================================================
`;
      const outName = `${(doc.fileName || 'summary').replace(/\.[^/.]+$/, '')}_summary.txt`;
      UI.downloadTextFile(outName, fileContent);
    });

    elements.textInspectorToggle.addEventListener('click', () => {
      const isExpanded = elements.textInspectorToggle.getAttribute('aria-expanded') === 'true';
      elements.textInspectorToggle.setAttribute('aria-expanded', String(!isExpanded));
      elements.textInspectorContent.classList.toggle('hidden', isExpanded);
    });

    elements.copyRawTextBtn.addEventListener('click', () => {
      const rawText = state.currentDocumentData?.document?.extractedText;
      if (rawText) {
        UI.copyToClipboard(rawText, 'Full extracted text copied!');
      }
    });
  }

  function updateSummaryTabs(activeLength) {
    elements.summaryLengthTabs.forEach(tab => {
      const isMatch = tab.getAttribute('data-length') === activeLength;
      tab.classList.toggle('active', isMatch);
      tab.setAttribute('aria-selected', String(isMatch));
    });
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
});
