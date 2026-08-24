const UI = {
  showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    else if (type === 'error') iconName = 'alert-circle';

    toast.innerHTML = `
      <i data-lucide="${iconName}"></i>
      <span>${this.escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) lucide.createIcons({ root: toast });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  updateProgressStep(stepIndex, title, subtitle) {
    const titleEl = document.getElementById('processingTitle');
    const subEl = document.getElementById('processingSubtitle');
    if (titleEl) titleEl.textContent = title;
    if (subEl) subEl.textContent = subtitle;

    const steps = ['stepUpload', 'stepExtract', 'stepSummarize', 'stepSuggestions'];
    const lines = ['line1', 'line2', 'line3'];

    steps.forEach((id, idx) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (idx < stepIndex) {
        el.className = 'step-item completed';
      } else if (idx === stepIndex) {
        el.className = 'step-item active';
      } else {
        el.className = 'step-item';
      }
    });

    lines.forEach((id, idx) => {
      const line = document.getElementById(id);
      if (!line) return;
      if (idx < stepIndex) {
        line.className = 'step-line completed';
      } else {
        line.className = 'step-line';
      }
    });

    if (window.lucide) lucide.createIcons();
  },

  renderResults(data) {
    const { document: doc, summary, improvementSuggestions } = data;

    const typeBadge = document.getElementById('resultDocTypeBadge');
    if (typeBadge) typeBadge.textContent = doc.documentType || 'Document';

    const docName = document.getElementById('resultDocName');
    if (docName) docName.textContent = doc.fileName || 'Uploaded Document';

    const metrics = doc.metrics || {};
    const wordCountEl = document.getElementById('metricWordCount');
    if (wordCountEl) wordCountEl.textContent = `${metrics.wordCount || 0} words`;

    const readingTimeEl = document.getElementById('metricReadingTime');
    if (readingTimeEl) readingTimeEl.textContent = `${metrics.readingTimeMinutes || 1} min read`;

    const readabilityEl = document.getElementById('metricReadabilityScore');
    if (readabilityEl) {
      readabilityEl.textContent = `Readability: ${metrics.fleschReadingEase || 0}/100`;
    }

    const scoreCircle = document.getElementById('readabilityScoreCircle');
    if (scoreCircle) {
      const score = metrics.fleschReadingEase || 0;
      scoreCircle.textContent = Math.round(score);
      if (score >= 70) {
        scoreCircle.style.color = 'var(--success)';
        scoreCircle.style.borderColor = 'var(--success)';
      } else if (score >= 50) {
        scoreCircle.style.color = 'var(--warning)';
        scoreCircle.style.borderColor = 'var(--warning)';
      } else {
        scoreCircle.style.color = 'var(--danger)';
        scoreCircle.style.borderColor = 'var(--danger)';
      }
    }

    const readDesc = document.getElementById('readabilityDesc');
    if (readDesc) {
      readDesc.textContent = `${metrics.readingLevel || 'Standard'} • ${metrics.avgWordsPerSentence || 0} words/sentence`;
    }

    this.renderSummaryText(summary);
    this.renderKeyPoints(summary.keyPoints || []);
    this.renderSuggestions(improvementSuggestions || []);

    const rawTextEl = document.getElementById('rawTextDisplay');
    if (rawTextEl) rawTextEl.textContent = doc.extractedText || '';

    const lengthCountEl = document.getElementById('extractedLengthCount');
    if (lengthCountEl) lengthCountEl.textContent = `${(doc.extractedText || '').length} chars`;

    if (window.lucide) lucide.createIcons();
  },

  renderSummaryText(summary) {
    const container = document.getElementById('summaryTextContainer');
    if (!container) return;

    const engineBadge = document.getElementById('summaryEngineBadge');
    if (engineBadge) {
      engineBadge.textContent = summary.engine === 'gemini-ai' ? 'Gemini AI Engine' : 'Smart NLP Engine';
    }

    const paragraphs = (summary.text || '')
      .split(/\n\n+/)
      .filter(Boolean)
      .map(p => `<p>${this.escapeHtml(p.trim())}</p>`)
      .join('');

    container.innerHTML = paragraphs || '<p class="text-muted">No summary available.</p>';

    const wordCount = (summary.text || '').split(/\s+/).filter(Boolean).length;
    const wordBadge = document.getElementById('summaryWordCountBadge');
    if (wordBadge) {
      wordBadge.textContent = `${wordCount} words in summary`;
    }
  },

  renderKeyPoints(keyPoints) {
    const container = document.getElementById('keyPointsContainer');
    if (!container) return;

    if (!keyPoints || keyPoints.length === 0) {
      container.innerHTML = '<p class="text-muted">No key points extracted.</p>';
      return;
    }

    container.innerHTML = keyPoints.map((point, idx) => `
      <div class="keypoint-item">
        <span class="keypoint-badge">${idx + 1}</span>
        <div class="keypoint-text">${this.escapeHtml(point)}</div>
      </div>
    `).join('');
  },

  renderSuggestions(suggestions) {
    const container = document.getElementById('suggestionsContainer');
    if (!container) return;

    if (!suggestions || suggestions.length === 0) {
      container.innerHTML = '<p class="text-muted">No improvement suggestions available.</p>';
      return;
    }

    container.innerHTML = suggestions.map(item => {
      const priorityClass = (item.priority || 'medium').toLowerCase();
      return `
        <div class="suggestion-item">
          <div class="suggestion-top-row">
            <span class="suggestion-category">
              <i data-lucide="${item.icon || 'lightbulb'}"></i>
              ${this.escapeHtml(item.category || 'Quality')}
            </span>
            <span class="priority-pill ${priorityClass}">${this.escapeHtml(item.priority || 'Medium')}</span>
          </div>
          <h4 class="suggestion-title">${this.escapeHtml(item.title)}</h4>
          <p class="suggestion-desc">${this.escapeHtml(item.description)}</p>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons({ root: container });
  },

  renderSampleCards(samples, onSelectSample) {
    const container = document.getElementById('sampleCardsContainer');
    if (!container) return;

    if (!samples || samples.length === 0) {
      container.innerHTML = '<p class="text-muted">No sample documents loaded.</p>';
      return;
    }

    container.innerHTML = samples.map(sample => `
      <div class="sample-card" data-sample-id="${sample.id}">
        <div class="sample-card-top">
          <span class="sample-type-tag ${sample.type === 'image' ? 'ocr' : ''}">
            ${sample.type === 'image' ? 'OCR IMAGE' : 'PDF DOC'}
          </span>
          <i data-lucide="${sample.type === 'image' ? 'scan' : 'file-text'}" style="width:16px;height:16px;color:var(--text-muted);"></i>
        </div>
        <div class="sample-card-title">${this.escapeHtml(sample.title)}</div>
        <div class="sample-card-preview">${this.escapeHtml(sample.preview)}</div>
      </div>
    `).join('');

    container.querySelectorAll('.sample-card').forEach(card => {
      card.addEventListener('click', () => {
        const sampleId = card.getAttribute('data-sample-id');
        if (sampleId && onSelectSample) onSelectSample(sampleId);
      });
    });

    if (window.lucide) lucide.createIcons({ root: container });
  },

  async copyToClipboard(text, successMessage = 'Copied to clipboard!') {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast(successMessage, 'success');
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      this.showToast(successMessage, 'success');
    }
  },

  downloadTextFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.showToast(`Downloaded ${filename}`, 'success');
  }
};

window.UI = UI;
