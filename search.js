/**
 * Smart Web Assistant - AI Search Interface
 * 간단하고 직접적인 AI 검색 기능
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
            // URL 파라미터에서 tabId 가져오기
            const urlParams = new URLSearchParams(window.location.search);
            const tabId = urlParams.get('tabId');
            const targetUrl = urlParams.get('url');
            
            console.log('Loading content from tabId:', tabId, 'URL:', targetUrl);
            
            if (tabId && targetUrl) {
                try {
                    const results = await chrome.scripting.executeScript({
                        target: { tabId: parseInt(tabId) },
                        func: () => {
                            return {
                                title: document.title,
                                url: window.location.href,
                                text: document.body.innerText || document.body.textContent || '',
                                domain: window.location.hostname
                            };
                        }
                    });
                    
                    if (results && results[0] && results[0].result) {
                        this.pageContent = results[0].result;
                        console.log('웹페이지 내용 로드됨:', this.pageContent.text.length, '자');
                        this.showToast('✅ 웹페이지 내용 로드 완료!');
                    } else {
                        this.showError('웹페이지 내용을 가져올 수 없습니다.');
                    }
                } catch (scriptError) {
                    console.log('Script execution failed:', scriptError.message);
                    this.showError('웹페이지 내용을 읽을 수 없습니다.');
                }
            } else {
                this.showError('웹페이지 정보를 찾을 수 없습니다. 웹페이지에서 AI Search 버튼을 클릭해주세요.');
            }
        } catch (error) {
            console.error('Error loading page content:', error);
            this.showError('페이지 로드 실패: ' + error.message);
        }
    }
    
    createFallbackContent(tab) {
        this.pageContent = {
            title: tab.title || 'Unknown Page',
            url: tab.url || 'Unknown URL',
            text: `페이지 제목: ${tab.title || 'Unknown Page'}\nURL: ${tab.url || 'Unknown URL'}`,
            domain: tab.url ? new URL(tab.url).hostname : 'unknown'
        };
        console.log('Fallback content created');
        this.showToast('✅ 기본 정보로 검색 준비 완료!');
    }

    async performSearch() {
        const query = this.searchInput.value.trim();
        if (!query) {
            this.showError('검색어를 입력해주세요.');
            return;
        }

        if (!this.pageContent) {
            this.showError('페이지 내용이 로드되지 않았습니다. 다시 시도해주세요.');
            return;
        }

        if (this.isSearching) return;

        this.isSearching = true;
        this.updateSearchButton(true);
        this.showLoading();

        try {
            console.log('Searching with query:', query);
            console.log('Page text length:', this.pageContent.text.length);
            
            // 페이지 내용과 질문을 함께 전달
            const prompt = `다음은 웹페이지의 내용입니다:\n\n${this.pageContent.text}\n\n사용자 질문: ${query}\n\n위 페이지 내용을 바탕으로 질문에 답변해주세요.`;
            
            const results = await this.gemini.generateText(prompt);
            this.displayResults(query, results);
        } catch (error) {
            console.error('Search error:', error);
            this.showError('검색 실패: ' + error.message);
        } finally {
            this.isSearching = false;
            this.updateSearchButton(false);
        }
    }

    updateSearchButton(isSearching) {
        if (isSearching) {
            this.searchBtn.disabled = true;
            this.searchBtn.innerHTML = '<span>⏳</span> 검색 중...';
        } else {
            this.searchBtn.disabled = false;
            this.searchBtn.innerHTML = '<span>🔍</span> 검색';
        }
    }

    showLoading() {
        this.resultsContainer.style.display = 'block';
        this.resultsContainer.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>AI로 검색 중...</p>
            </div>
        `;
    }

    displayResults(query, results) {
        const html = `
            <div class="result-item">
                <div class="result-title">🔍 "${query}" 검색 결과</div>
                <div class="result-content">${results}</div>
                <div class="result-meta">
                    <span>AI 검색</span>
                    <span class="relevance-score">높은 관련성</span>
                </div>
            </div>
        `;

        this.resultsContainer.innerHTML = html;
        this.attachResultActions(results);
    }

    attachResultActions(results) {
        // 복사 기능
        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn copy-btn';
        copyBtn.innerHTML = '📋 복사';
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(results).then(() => {
                this.showToast('결과가 클립보드에 복사되었습니다!');
            }).catch(() => {
                this.showToast('복사 실패');
            });
        });

        // 닫기 기능
        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn btn-secondary';
        closeBtn.innerHTML = '✕ 닫기';
        closeBtn.addEventListener('click', () => {
            window.close();
        });

        // 버튼들을 결과에 추가
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
                <h3>오류</h3>
                <p>${message}</p>
                <div class="actions">
                    <button class="btn btn-secondary" onclick="window.close()">✕ 닫기</button>
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

// 검색 인터페이스 초기화
document.addEventListener('DOMContentLoaded', () => {
    new AISearch();
});