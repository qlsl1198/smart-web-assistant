/**
 * Smart Web Assistant - Results Window
 * Dedicated window for displaying AI analysis results
 */
class ResultsWindow {
    constructor() {
        this.resultsContainer = document.getElementById('resultsContainer');
        this.init();
    }

    init() {
        // URL 파라미터에서 결과 데이터 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const resultType = urlParams.get('type');
        const resultData = urlParams.get('data');

        if (resultType && resultData) {
            try {
                const data = JSON.parse(decodeURIComponent(resultData));
                this.displayResult(resultType, data);
            } catch (error) {
                this.displayError('Failed to parse result data');
            }
        } else {
            this.displayError('No result data found');
        }
    }

    displayResult(type, data) {
        let html = '';

        switch (type) {
            case 'summary':
                html = this.createSummaryResult(data);
                break;
            case 'translation':
                html = this.createTranslationResult(data);
                break;
            case 'search':
                html = this.createSearchResult(data);
                break;
            case 'highlight':
                html = this.createHighlightResult(data);
                break;
            default:
                html = this.createGenericResult(data);
        }

        this.resultsContainer.innerHTML = html;
        this.attachEventListeners();
    }

    createSummaryResult(data) {
        return `
            <div class="result-section">
                <div class="result-title">
                    📄 Page Summary
                </div>
                <div class="result-content summary-content">
                    ${data.summary || data.content || 'No summary available'}
                </div>
                <div class="actions">
                    <button class="btn btn-primary copy-btn" data-copy-text="${this.escapeHtml(data.summary || data.content || '')}">
                        📋 Copy Summary
                    </button>
                    <button class="btn btn-secondary close-btn">
                        ✕ Close
                    </button>
                </div>
                ${this.createStats(data)}
            </div>
        `;
    }

    createTranslationResult(data) {
        return `
            <div class="result-section">
                <div class="result-title">
                    🌐 Translation Result
                </div>
                <div class="result-content translation-content">
                    ${data.translation || data.content || 'No translation available'}
                </div>
                <div class="actions">
                    <button class="btn btn-primary copy-btn" data-copy-text="${this.escapeHtml(data.translation || data.content || '')}">
                        📋 Copy Translation
                    </button>
                    <button class="btn btn-secondary close-btn">
                        ✕ Close
                    </button>
                </div>
                ${this.createStats(data)}
            </div>
        `;
    }

    createSearchResult(data) {
        return `
            <div class="result-section">
                <div class="result-title">
                    🔍 Search Results
                </div>
                <div class="result-content search-content">
                    ${data.results || data.content || 'No search results available'}
                </div>
                <div class="actions">
                    <button class="btn btn-primary copy-btn" data-copy-text="${this.escapeHtml(data.results || data.content || '')}">
                        📋 Copy Results
                    </button>
                    <button class="btn btn-secondary close-btn">
                        ✕ Close
                    </button>
                </div>
                ${this.createStats(data)}
            </div>
        `;
    }

    createHighlightResult(data) {
        return `
            <div class="result-section">
                <div class="result-title">
                    ✨ Highlighted Content
                </div>
                <div class="result-content highlight-content">
                    <p>Important content has been highlighted on the original page. Look for the sparkle icons (✨) to identify key information.</p>
                    <p><strong>Status:</strong> ${data.success ? 'Successfully highlighted' : 'Highlighting failed'}</p>
                </div>
                <div class="actions">
                    <button class="btn btn-success remove-highlights-btn">
                        🗑️ Remove Highlights
                    </button>
                    <button class="btn btn-secondary close-btn">
                        ✕ Close
                    </button>
                </div>
            </div>
        `;
    }

    createGenericResult(data) {
        return `
            <div class="result-section">
                <div class="result-title">
                    📊 Analysis Result
                </div>
                <div class="result-content">
                    ${data.content || JSON.stringify(data, null, 2)}
                </div>
                <div class="actions">
                    <button class="btn btn-primary copy-btn" data-copy-text="${this.escapeHtml(data.content || JSON.stringify(data, null, 2))}">
                        📋 Copy Result
                    </button>
                    <button class="btn btn-secondary close-btn">
                        ✕ Close
                    </button>
                </div>
            </div>
        `;
    }

    createStats(data) {
        if (!data.stats) return '';

        return `
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number">${data.stats.wordCount || 0}</div>
                    <div class="stat-label">Words</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${data.stats.charCount || 0}</div>
                    <div class="stat-label">Characters</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${data.stats.processingTime || 0}ms</div>
                    <div class="stat-label">Processing Time</div>
                </div>
            </div>
        `;
    }

    displayError(message) {
        this.resultsContainer.innerHTML = `
            <div class="result-section">
                <div class="result-title">
                    ❌ Error
                </div>
                <div class="result-content" style="background: #fff5f5; border-left: 4px solid #f56565;">
                    ${message}
                </div>
                <div class="actions">
                    <button class="btn btn-secondary close-btn">
                        ✕ Close
                    </button>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Copy to clipboard functionality
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('copy-btn')) {
                const text = e.target.getAttribute('data-copy-text');
                if (text) {
                    navigator.clipboard.writeText(text).then(() => {
                        this.showToast('Copied to clipboard!');
                    }).catch(() => {
                        this.showToast('Failed to copy');
                    });
                }
            }
        });

        // Close window functionality
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-btn')) {
                window.close();
            }
        });

        // Remove highlights functionality
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-highlights-btn')) {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]) {
                        chrome.tabs.sendMessage(tabs[0].id, { action: 'removeHighlights' });
                        this.showToast('Highlights removed');
                    }
                });
            }
        });
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #667eea;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 1000;
            font-weight: 600;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            document.body.removeChild(toast);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize results window
document.addEventListener('DOMContentLoaded', () => {
    new ResultsWindow();
});
