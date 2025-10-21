/**
 * Smart Web Assistant - AI Search Interface
 * Dedicated search functionality with real-time AI search
 */
class AISearch {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.isSearching = false;
        this.gemini = new GeminiClient();
        this.pageContent = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPageContent();
    }

    setupEventListeners() {
        this.searchBtn.addEventListener('click', () => this.performSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });
    }

    async loadPageContent() {
        try {
            // 현재 탭의 콘텐츠 가져오기
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]) {
                // Content script에 메시지 전송
                chrome.tabs.sendMessage(tabs[0].id, { action: 'getPageContent' }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Failed to get page content:', chrome.runtime.lastError);
                        this.showError('Failed to load page content. Please refresh the page and try again.');
                    } else if (response?.content) {
                        this.pageContent = response.content;
                        console.log('Page content loaded:', this.pageContent);
                    } else {
                        this.showError('No content available on this page.');
                    }
                });
            }
        } catch (error) {
            console.error('Error loading page content:', error);
            this.showError('Failed to load page content.');
        }
    }

    async performSearch() {
        const query = this.searchInput.value.trim();
        if (!query) {
            this.showError('Please enter a search query.');
            return;
        }

        if (!this.pageContent) {
            this.showError('Page content not loaded. Please try again.');
            return;
        }

        if (this.isSearching) return;

        this.isSearching = true;
        this.updateSearchButton(true);
        this.showLoading();

        try {
            const results = await this.gemini.search(this.pageContent.text, query);
            this.displayResults(query, results);
        } catch (error) {
            console.error('Search error:', error);
            // API 오류인 경우 사용자에게 친화적인 메시지 표시
            if (error.message.includes('503') || error.message.includes('API Error')) {
                this.showError('AI 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
            } else {
                this.showError(`Search failed: ${error.message}`);
            }
        } finally {
            this.isSearching = false;
            this.updateSearchButton(false);
        }
    }

    updateSearchButton(isSearching) {
        if (isSearching) {
            this.searchBtn.disabled = true;
            this.searchBtn.innerHTML = '<span>⏳</span> Searching...';
        } else {
            this.searchBtn.disabled = false;
            this.searchBtn.innerHTML = '<span>🔍</span> Search';
        }
    }

    showLoading() {
        this.resultsContainer.style.display = 'block';
        this.resultsContainer.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Searching with AI...</p>
            </div>
        `;
    }

    displayResults(query, results) {
        const html = `
            <div class="result-item">
                <div class="result-title">🔍 Search Results for: "${query}"</div>
                <div class="result-content">${results}</div>
                <div class="result-meta">
                    <span>AI-powered search</span>
                    <span class="relevance-score">High Relevance</span>
                </div>
            </div>
        `;

        this.resultsContainer.innerHTML = html;
        this.attachResultActions(results);
    }

    attachResultActions(results) {
        // Copy functionality
        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn copy-btn';
        copyBtn.innerHTML = '📋 Copy Results';
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(results).then(() => {
                this.showToast('Results copied to clipboard!');
            }).catch(() => {
                this.showToast('Failed to copy');
            });
        });

        // Close functionality
        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn btn-secondary';
        closeBtn.innerHTML = '✕ Close';
        closeBtn.addEventListener('click', () => {
            window.close();
        });

        // Add buttons to results
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'actions';
        actionsDiv.appendChild(copyBtn);
        actionsDiv.appendChild(closeBtn);
        
        this.resultsContainer.appendChild(actionsDiv);
    }

    showError(message) {
        this.resultsContainer.style.display = 'block';
        this.resultsContainer.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">❌</div>
                <h3>Error</h3>
                <p>${message}</p>
                <div class="actions">
                    <button class="btn btn-secondary" onclick="window.close()">✕ Close</button>
                </div>
            </div>
        `;
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
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 3000);
    }
}

// Initialize search interface
document.addEventListener('DOMContentLoaded', () => {
    new AISearch();
});
