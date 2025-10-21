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
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
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

    async handleSearch() {
        try {
            // 현재 활성 탭 정보 가져오기
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const currentTab = tabs[0];
            
            if (currentTab && currentTab.url && 
                !currentTab.url.startsWith('chrome-extension://') && 
                !currentTab.url.startsWith('chrome://') &&
                (currentTab.url.startsWith('http://') || currentTab.url.startsWith('https://'))) {
                
                // 웹페이지인 경우 URL을 파라미터로 전달
                const searchUrl = chrome.runtime.getURL(`search.html?tabId=${currentTab.id}&url=${encodeURIComponent(currentTab.url)}`);
                chrome.windows.create({
                    url: searchUrl,
                    type: 'popup',
                    width: 800,
                    height: 600,
                    left: 100,
                    top: 100
                });
            } else {
                this.updateStatus('웹페이지에서만 사용 가능합니다', true);
            }
        } catch (error) {
            console.error('Search error:', error);
            this.updateStatus('Search failed', true);
        }
    }

    async handleTranslate() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.updateStatus('Translating...');
        
        try {
            this.showSummarySection();
            const content = await this.getPageContent();
            const translation = await this.gemini.translate(content.text, 'Korean');
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
        return new Promise(async (resolve, reject) => {
            // 탭 ID 유효성 검사
            if (!this.currentTab || !this.currentTab.id || this.currentTab.id < 0) {
                console.error('Invalid tab ID:', this.currentTab);
                resolve(this.getFallbackContent());
                return;
            }

            try {
                // 먼저 content script를 주입
                await this.injectContentScript();
                
                // 잠시 대기 후 메시지 전송
                setTimeout(() => {
                    chrome.tabs.sendMessage(this.currentTab.id, {
                        action: 'getPageContent'
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            const errorMsg = chrome.runtime.lastError.message || chrome.runtime.lastError.toString();
                            console.error('Chrome runtime error:', errorMsg);
                            resolve(this.getFallbackContent());
                        } else if (response?.content) {
                            resolve(response.content);
                        } else {
                            console.log('No content received, using fallback');
                            resolve(this.getFallbackContent());
                        }
                    });
                }, 1000); // 대기 시간 증가
            } catch (error) {
                console.error('Content script injection failed:', error);
                resolve(this.getFallbackContent());
            }
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
            // 이미 주입되었는지 확인
            const response = await chrome.tabs.sendMessage(this.currentTab.id, { action: 'ping' });
            if (response) {
                console.log('Content script already loaded');
                return;
            }
        } catch (error) {
            // Content script가 없으면 주입
            console.log('Content script not found, injecting...');
        }

        try {
            await chrome.scripting.executeScript({
                target: { tabId: this.currentTab.id },
                files: ['content.js']
            });
            console.log('Content script injected successfully');
        } catch (error) {
            console.error('Content script injection failed:', error.message);
            throw error;
        }
    }

    async sendMessageToContentScript(action, data = {}) {
        return new Promise((resolve, reject) => {
            // 탭 ID 유효성 검사
            if (!this.currentTab || !this.currentTab.id || this.currentTab.id < 0) {
                console.error('Invalid tab ID for message:', this.currentTab);
                reject(new Error('Invalid tab ID'));
                return;
            }

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
        if (summarySection) {
            summarySection.style.display = 'block';
        } else {
            console.log('Summary section not found - using results window instead');
        }
    }

    displaySummary(summary) {
        this.openResultsWindow('summary', { summary: summary });
    }

    displayTranslation(translation) {
        this.openResultsWindow('translation', { translation: translation });
    }

    displaySearchResults(results) {
        this.openResultsWindow('search', { results: results });
    }

    updateSummaryContent(html) {
        const summaryContent = document.getElementById('summaryContent');
        if (summaryContent) summaryContent.innerHTML = html;
    }

    // ==================== RESULTS WINDOW ====================
    
    openResultsWindow(type, data) {
        try {
            // 데이터를 URL 파라미터로 인코딩
            const encodedData = encodeURIComponent(JSON.stringify(data));
            const url = `results.html?type=${type}&data=${encodedData}`;
            
            // 새 창 열기
            chrome.windows.create({
                url: chrome.runtime.getURL(url),
                type: 'popup',
                width: 1000,
                height: 700,
                left: 100,
                top: 100
            });
            
            console.log(`Opened results window for ${type}:`, data);
        } catch (error) {
            console.error('Failed to open results window:', error);
            // Fallback: 기존 방식으로 표시
            this.updateSummaryContent(`<div class="result-content">${JSON.stringify(data, null, 2)}</div>`);
        }
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
        
        // API 503 오류인 경우 특별한 메시지 표시
        if (error.message && (error.message.includes('503') || error.message.includes('API Error'))) {
            this.displayError(`AI 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.`);
        } else {
            this.displayError(`Failed to ${operation.toLowerCase()}: ${this.getErrorMessage(error)}`);
        }
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
