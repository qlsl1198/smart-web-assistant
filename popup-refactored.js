/**
 * Smart Web Assistant - Refactored Popup Script
 * Clean, modular, and maintainable code structure
 */
class SmartWebAssistant {
    constructor() {
        this.currentTab = null;
        this.isProcessing = false;
        this.gemini = new GeminiClient();
        this.init();
    }

    async init() {
        try {
            await this.getCurrentTab();
            this.setupEventListeners();
            this.updateStatus('Ready');
        } catch (error) {
            console.error('Initialization error:', error);
            this.updateStatus('Initialization failed', true);
        }
    }

    // ==================== TAB MANAGEMENT ====================
    
    async getCurrentTab() {
        try {
            const [tab] = [null] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) throw new Error('No active tab found');
            this.currentTab = tab;
        } catch (error) {
            console.error('Failed to get current tab:', error);
            throw error;
        }
    }

    // ==================== EVENT LISTENERS ====================
    
    setupEventListeners() {
        const eventMap = {
            'summarizeBtn': () => this.handleSummarize(),
            'highlightBtn': () => this.handleHighlight(),
            'searchBtn': () => this.handleSearch(),
            'translateBtn': () => this.handleTranslate(),
            'searchSubmitBtn': () => this.performSearch(),
            'searchInput': (e) => e.key === 'Enter' && this.performSearch(),
            'settingsBtn': () => this.openSettings()
        };

        Object.entries(eventMap).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                if (id === 'searchInput') {
                    element.addEventListener('keypress', handler);
                } else {
                    element.addEventListener('click', handler);
                }
            }
        });
    }

    // ==================== STATUS MANAGEMENT ====================
    
    updateStatus(status, isError = false) {
        try {
            const statusIndicator = document.getElementById('statusIndicator');
            const statusText = statusIndicator?.querySelector('.status-text');
            const statusDot = statusIndicator?.querySelector('.status-dot');
            
            if (statusText) statusText.textContent = status;
            if (statusDot) statusDot.style.background = isError ? '#ef4444' : '#4ade80';
        } catch (error) {
            console.error('Status update error:', error);
        }
    }

    // ==================== CORE FEATURES ====================
    
    async handleSummarize() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.updateStatus('Analyzing...');
        
        try {
            this.showSummarySection();
            const content = await this.getPageContent();
            const summary = await this.gemini.summarize(content.text);
            this.displaySummary(summary);
            this.updateStatus('Summary complete');
        } catch (error) {
            this.handleError('Summarization', error);
        } finally {
            this.isProcessing = false;
        }
    }

    async handleHighlight() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.updateStatus('Highlighting...');
        
        try {
            await this.injectContentScript();
            await this.sendMessageToContentScript('highlightImportantContent');
            this.updateStatus('Highlights applied');
        } catch (error) {
            this.handleError('Highlighting', error);
        } finally {
            this.isProcessing = false;
        }
    }

    handleSearch() {
        const searchSection = document.getElementById('searchSection');
        const isVisible = searchSection.style.display !== 'none';
        
        searchSection.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            document.getElementById('searchInput').focus();
        }
    }

    async handleTranslate() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.updateStatus('Translating...');
        
        try {
            const content = await this.getPageContent();
            const translation = await this.gemini.translate(content.text);
            this.displayTranslation(translation);
            this.updateStatus('Translation complete');
        } catch (error) {
            this.handleError('Translation', error);
        } finally {
            this.isProcessing = false;
        }
    }

    async performSearch() {
        const query = document.getElementById('searchInput').value.trim();
        if (!query) return;
        
        this.isProcessing = true;
        this.updateStatus('Searching...');
        
        try {
            const content = await this.getPageContent();
            const results = await this.gemini.search(content.text, query);
            this.displaySearchResults(results);
            this.updateStatus('Search complete');
        } catch (error) {
            this.handleError('Search', error);
        } finally {
            this.isProcessing = false;
        }
    }

    // ==================== CONTENT INTERACTION ====================
    
    async getPageContent() {
        return new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'getPageContent'
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Chrome runtime error:', chrome.runtime.lastError);
                    resolve(this.getFallbackContent());
                } else if (response?.content) {
                    resolve(response.content);
                } else {
                    resolve(this.getFallbackContent());
                }
            });
        });
    }

    getFallbackContent() {
        return {
            title: this.currentTab.title,
            url: this.currentTab.url,
            text: 'Content not available. Please refresh the page and try again.',
            images: [],
            links: [],
            headings: [],
            metadata: {}
        };
    }

    async injectContentScript() {
        try {
            await chrome.scripting.executeScript({
                target: { tabId: this.currentTab.id },
                files: ['content.js']
            });
        } catch (error) {
            console.log('Content script injection skipped:', error.message);
        }
    }

    async sendMessageToContentScript(action, data = {}) {
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    await chrome.tabs.sendMessage(this.currentTab.id, { action, ...data });
                    resolve();
                } catch (error) {
                    reject(error);
                }
            }, 1000);
        });
    }

    // ==================== UI DISPLAY METHODS ====================
    
    showSummarySection() {
        const summarySection = document.getElementById('summarySection');
        if (summarySection) summarySection.style.display = 'block';
    }

    displaySummary(summary) {
        this.updateSummaryContent(`
            <div class="summary-text">${summary}</div>
            <div class="summary-actions">
                <button class="action-btn" id="copyBtn">📋 Copy</button>
                <button class="action-btn" id="shareBtn">📤 Share</button>
            </div>
        `);
        
        this.attachSummaryActions(summary);
    }

    displayTranslation(translation) {
        this.updateSummaryContent(`<div class="translation-text">${translation}</div>`);
    }

    displaySearchResults(results) {
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.innerHTML = `<div class="search-result">${results}</div>`;
        }
    }

    updateSummaryContent(html) {
        const summaryContent = document.getElementById('summaryContent');
        if (summaryContent) summaryContent.innerHTML = html;
    }

    attachSummaryActions(summary) {
        const copyBtn = document.getElementById('copyBtn');
        const shareBtn = document.getElementById('shareBtn');
        
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyToClipboard(summary));
        }
        
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareSummary());
        }
    }

    // ==================== ERROR HANDLING ====================
    
    handleError(operation, error) {
        console.error(`${operation} error:`, error);
        this.updateStatus('Error occurred', true);
        this.displayError(`Failed to ${operation.toLowerCase()}: ${this.getErrorMessage(error)}`);
    }

    displayError(message) {
        this.updateSummaryContent(`<div class="error-message">❌ ${message}</div>`);
    }

    getErrorMessage(error) {
        if (typeof error === 'string') return error;
        if (error?.message) return error.message;
        if (error?.toString) return error.toString();
        return 'Unknown error occurred';
    }

    // ==================== UTILITY METHODS ====================
    
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showSuccessFeedback('Copied!');
        } catch (error) {
            console.error('Copy to clipboard error:', error);
        }
    }

    async shareSummary() {
        try {
            const text = document.querySelector('.summary-text')?.textContent;
            if (navigator.share && text) {
                await navigator.share({ title: 'Page Summary', text });
            } else {
                await this.copyToClipboard(text);
            }
        } catch (error) {
            console.error('Share summary error:', error);
        }
    }

    showSuccessFeedback(message) {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = `✅ ${message}`;
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }

    openSettings() {
        try {
            chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
        } catch (error) {
            console.error('Open settings error:', error);
        }
    }
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    try {
        new SmartWebAssistant();
    } catch (error) {
        console.error('Failed to initialize SmartWebAssistant:', error);
    }
});
