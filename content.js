/**
 * Smart Web Assistant - Refactored Content Script
 * Clean, efficient, and maintainable content analysis
 */

// 중복 선언 방지
if (typeof window.contentAnalyzer === 'undefined') {
    class ContentAnalyzer {
        constructor() {
            this.highlightedElements = [];
            this.originalStyles = new Map();
            this.isLoaded = false;
            this.init();
        }

        init() {
            if (window.smartWebAssistantLoaded) {
                console.log('Content script already loaded, skipping...');
                return;
            }
            
            window.smartWebAssistantLoaded = true;
            this.setupMessageListener();
        this.injectStyles();
        this.isLoaded = true;
        console.log('Smart Web Assistant content analyzer initialized');
    }

    // ==================== MESSAGE HANDLING ====================
    
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log('Content script received message:', request);
            
            try {
                switch (request.action) {
                    case 'ping':
                        sendResponse({ status: 'alive' });
                        break;
                    
                    case 'getPageContent':
                        this.getPageContent().then(content => sendResponse({ content }));
                        return true;
                    
                    case 'highlightImportantContent':
                        this.highlightImportantContent();
                        sendResponse({ success: true });
                        break;
                    
                    case 'removeHighlights':
                        this.removeHighlights();
                        sendResponse({ success: true });
                        break;
                    
                    case 'searchInPage':
                        this.searchInPage(request.query).then(results => sendResponse(results));
                        return true;
                    
                    default:
                        sendResponse({ success: false, error: 'Unknown action' });
                }
            } catch (error) {
                console.error('Content script error:', error);
                sendResponse({ success: false, error: error.message });
            }
        });
    }

    // ==================== STYLE INJECTION ====================
    
    injectStyles() {
        if (document.getElementById('smart-assistant-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'smart-assistant-styles';
        style.textContent = this.getHighlightStyles();
        document.head.appendChild(style);
    }

    getHighlightStyles() {
        return `
            .smart-assistant-highlight {
                background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%) !important;
                border-radius: 4px !important;
                padding: 2px 4px !important;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
                transition: all 0.3s ease !important;
                position: relative !important;
                animation: highlightPulse 2s ease-in-out !important;
            }
            
            @keyframes highlightPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.02); }
            }
            
            .smart-assistant-highlight:hover {
                transform: translateY(-1px) !important;
                box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
            }
            
            .smart-assistant-highlight::after {
                content: '✨' !important;
                position: absolute !important;
                top: -8px !important;
                right: -8px !important;
                font-size: 12px !important;
                background: #667eea !important;
                color: white !important;
                border-radius: 50% !important;
                width: 16px !important;
                height: 16px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                animation: sparkle 1.5s ease-in-out infinite !important;
            }
            
            @keyframes sparkle {
                0%, 100% { transform: rotate(0deg) scale(1); }
                50% { transform: rotate(180deg) scale(1.1); }
            }
        `;
    }

    // ==================== CONTENT EXTRACTION ====================
    
    async getPageContent() {
        return {
            title: document.title,
            url: window.location.href,
            text: this.extractTextContent(),
            images: this.extractImages(),
            links: this.extractLinks(),
            headings: this.extractHeadings(),
            metadata: this.extractMetadata()
        };
    }

    extractTextContent() {
        // 불필요한 요소들 제거
        const elementsToRemove = document.querySelectorAll('script, style, nav, header, footer, aside, .ad, .advertisement, .sidebar');
        elementsToRemove.forEach(el => el.remove());
        
        // 메인 콘텐츠 영역 찾기
        const mainContent = document.querySelector('main, article, .content, .post, .entry, .main-content, .page-content') || document.body;
        
        // 더 강력한 텍스트 추출
        let text = '';
        
        // 1. innerText 사용 (가장 좋은 방법)
        if (mainContent.innerText) {
            text = mainContent.innerText;
        }
        // 2. textContent 사용 (대안)
        else if (mainContent.textContent) {
            text = mainContent.textContent;
        }
        // 3. 모든 텍스트 노드 수집
        else {
            const textNodes = [];
            const walker = document.createTreeWalker(
                mainContent,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            let node;
            while (node = walker.nextNode()) {
                if (node.textContent.trim()) {
                    textNodes.push(node.textContent.trim());
                }
            }
            text = textNodes.join(' ');
        }
        
        // 텍스트 정리
        text = text
            .replace(/\s+/g, ' ')  // 여러 공백을 하나로
            .replace(/\n\s*\n/g, '\n')  // 빈 줄 제거
            .trim();
        
        return text.substring(0, 15000); // 최대 15,000자로 제한
    }

    extractImages() {
        return Array.from(document.querySelectorAll('img[src]')).map(img => ({
            src: img.src,
            alt: img.alt,
            title: img.title
        }));
    }

    extractLinks() {
        return Array.from(document.querySelectorAll('a[href]')).map(link => ({
            href: link.href,
            text: link.textContent.trim(),
            title: link.title
        }));
    }

    extractHeadings() {
        return Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(heading => ({
            level: parseInt(heading.tagName.charAt(1)),
            text: heading.textContent.trim(),
            id: heading.id
        }));
    }

    extractMetadata() {
        const meta = {};
        document.querySelectorAll('meta').forEach(tag => {
            const name = tag.getAttribute('name') || tag.getAttribute('property');
            const content = tag.getAttribute('content');
            if (name && content) meta[name] = content;
        });
        return meta;
    }

    // ==================== HIGHLIGHTING ====================
    
    async highlightImportantContent() {
        this.removeHighlights();
        
        const content = await this.getPageContent();
        const importantSentences = this.findImportantSentences(content.text);
        
        this.highlightSentences(importantSentences);
        this.showSummaryPopup(content);
    }

    findImportantSentences(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        
        const scoredSentences = sentences.map(sentence => ({
            text: sentence.trim(),
            score: this.scoreSentence(sentence)
        }));
        
        return scoredSentences
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(s => s.text);
    }

    scoreSentence(sentence) {
        let score = 0;
        
        // Length factor
        score += Math.min(sentence.length / 100, 2);
        
        // Keywords
        const keywords = ['중요', '핵심', '주요', '결론', '요약', 'key', 'important', 'main', 'summary'];
        keywords.forEach(keyword => {
            if (sentence.toLowerCase().includes(keyword.toLowerCase())) {
                score += 1;
            }
        });
        
        // Position factor
        const position = sentence.length / 1000;
        score += Math.max(0, 1 - position);
        
        return score;
    }

    highlightSentences(sentences) {
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let node;
        while (node = walker.nextNode()) {
            if (this.isValidTextNode(node)) {
                sentences.forEach(sentence => {
                    if (node.textContent.includes(sentence)) {
                        this.highlightTextInNode(node, sentence);
                    }
                });
            }
        }
    }

    isValidTextNode(node) {
        const parent = node.parentElement;
        return parent && 
               parent.tagName !== 'SCRIPT' && 
               parent.tagName !== 'STYLE' &&
               node.textContent.trim().length > 0;
    }

    highlightTextInNode(node, text) {
        const parent = node.parentNode;
        const textContent = node.textContent;
        const index = textContent.indexOf(text);
        
        if (index === -1) return;
        
        const beforeText = textContent.substring(0, index);
        const highlightedText = textContent.substring(index, index + text.length);
        const afterText = textContent.substring(index + text.length);
        
        const fragment = document.createDocumentFragment();
        
        if (beforeText) fragment.appendChild(document.createTextNode(beforeText));
        
        const highlightSpan = document.createElement('span');
        highlightSpan.className = 'smart-assistant-highlight';
        highlightSpan.textContent = highlightedText;
        fragment.appendChild(highlightSpan);
        
        if (afterText) fragment.appendChild(document.createTextNode(afterText));
        
        parent.replaceChild(fragment, node);
    }

    removeHighlights() {
        const highlights = document.querySelectorAll('.smart-assistant-highlight');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
            parent.normalize();
        });
        
        const popup = document.getElementById('smart-assistant-summary');
        if (popup) popup.remove();
    }

    // ==================== SEARCH ====================
    
    async searchInPage(query) {
        const content = await this.getPageContent();
        const results = [];
        
        const textContent = content.text.toLowerCase();
        const queryLower = query.toLowerCase();
        
        if (textContent.includes(queryLower)) {
            results.push({
                type: 'text',
                content: `Found "${query}" in page content`,
                relevance: 1
            });
        }
        
        content.headings.forEach(heading => {
            if (heading.text.toLowerCase().includes(queryLower)) {
                results.push({
                    type: 'heading',
                    content: heading.text,
                    relevance: 2
                });
            }
        });
        
        return results;
    }

    // ==================== UI POPUP ====================
    
    showSummaryPopup(content) {
        this.removeExistingPopup();
        
        const popup = this.createSummaryPopup();
        document.body.appendChild(popup);
        
        setTimeout(() => {
            if (popup.parentNode) popup.remove();
        }, 10000);
    }

    removeExistingPopup() {
        const existingPopup = document.getElementById('smart-assistant-summary');
        if (existingPopup) existingPopup.remove();
    }

    createSummaryPopup() {
        const popup = document.createElement('div');
        popup.id = 'smart-assistant-summary';
        popup.style.cssText = `
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            background: white !important;
            border: 2px solid #667eea !important;
            border-radius: 12px !important;
            padding: 16px !important;
            max-width: 300px !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important;
            z-index: 10000 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            font-size: 14px !important;
            line-height: 1.5 !important;
            animation: slideIn 0.5s ease-out !important;
        `;
        
        popup.innerHTML = `
            <button onclick="this.parentElement.remove()" style="position: absolute; top: 8px; right: 8px; background: none; border: none; font-size: 18px; cursor: pointer; color: #999;">×</button>
            <h3 style="margin: 0 0 8px 0; color: #667eea; font-size: 16px;">📄 Page Summary</h3>
            <p style="margin: 0; color: #333;">This page has been analyzed and important content has been highlighted. Key information is marked with sparkles (✨) for easy identification.</p>
        `;
        
        return popup;
    }
    }

    // ==================== INITIALIZATION ====================

    // Initialize content analyzer
    window.contentAnalyzer = new ContentAnalyzer();
}
