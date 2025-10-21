// Smart Web Assistant - Content Script (Fixed)
console.log('Smart Web Assistant content script loaded');

// Check if already loaded
if (window.smartWebAssistantLoaded) {
    console.log('Content script already loaded, skipping...');
} else {
    window.smartWebAssistantLoaded = true;

    class ContentAnalyzer {
        constructor() {
            this.highlightedElements = [];
            this.originalStyles = new Map();
            this.init();
        }

        init() {
            this.setupMessageListener();
            this.injectStyles();
        }

        setupMessageListener() {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                console.log('Content script received message:', request);
                
                switch (request.action) {
                    case 'getPageContent':
                        this.getPageContent().then(content => sendResponse({ content: content }));
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
                }
            });
        }

        injectStyles() {
            if (document.getElementById('smart-assistant-styles')) return;
            
            const style = document.createElement('style');
            style.id = 'smart-assistant-styles';
            style.textContent = `
                .smart-assistant-highlight {
                    background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%) !important;
                    border-radius: 4px !important;
                    padding: 2px 4px !important;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
                    transition: all 0.3s ease !important;
                    position: relative !important;
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
                }
            `;
            document.head.appendChild(style);
        }

        async getPageContent() {
            const content = {
                title: document.title,
                url: window.location.href,
                text: this.extractTextContent(),
                images: this.extractImages(),
                links: this.extractLinks(),
                headings: this.extractHeadings(),
                metadata: this.extractMetadata()
            };
            
            return content;
        }

        extractTextContent() {
            // Remove script and style elements
            const elementsToRemove = document.querySelectorAll('script, style, nav, header, footer, aside');
            elementsToRemove.forEach(el => el.remove());
            
            // Get main content areas
            const mainContent = document.querySelector('main, article, .content, .post, .entry') || document.body;
            return mainContent.innerText || mainContent.textContent || '';
        }

        extractImages() {
            const images = Array.from(document.querySelectorAll('img[src]'));
            return images.map(img => ({
                src: img.src,
                alt: img.alt,
                title: img.title
            }));
        }

        extractLinks() {
            const links = Array.from(document.querySelectorAll('a[href]'));
            return links.map(link => ({
                href: link.href,
                text: link.textContent.trim(),
                title: link.title
            }));
        }

        extractHeadings() {
            const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
            return headings.map(heading => ({
                level: parseInt(heading.tagName.charAt(1)),
                text: heading.textContent.trim(),
                id: heading.id
            }));
        }

        extractMetadata() {
            const meta = {};
            const metaTags = document.querySelectorAll('meta');
            
            metaTags.forEach(tag => {
                const name = tag.getAttribute('name') || tag.getAttribute('property');
                const content = tag.getAttribute('content');
                if (name && content) {
                    meta[name] = content;
                }
            });
            
            return meta;
        }

        async highlightImportantContent() {
            // Remove existing highlights
            this.removeHighlights();
            
            // Get page content for AI analysis
            const content = await this.getPageContent();
            
            // Simulate AI analysis to find important content
            const importantSentences = this.findImportantSentences(content.text);
            
            // Highlight important content
            this.highlightSentences(importantSentences);
            
            // Show summary popup
            this.showSummaryPopup(content);
        }

        findImportantSentences(text) {
            // Simple algorithm to find important sentences
            const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
            
            // Score sentences based on keywords and length
            const scoredSentences = sentences.map(sentence => ({
                text: sentence.trim(),
                score: this.scoreSentence(sentence)
            }));
            
            // Return top 3-5 most important sentences
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
            const keywords = ['important', 'key', 'main', 'primary', 'essential', 'critical', 'significant'];
            keywords.forEach(keyword => {
                if (sentence.toLowerCase().includes(keyword)) {
                    score += 1;
                }
            });
            
            // Position factor (sentences at the beginning are often more important)
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
                if (node.parentElement.tagName === 'SCRIPT' || 
                    node.parentElement.tagName === 'STYLE') continue;
                    
                sentences.forEach(sentence => {
                    if (node.textContent.includes(sentence)) {
                        this.highlightTextInNode(node, sentence);
                    }
                });
            }
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
            
            if (beforeText) {
                fragment.appendChild(document.createTextNode(beforeText));
            }
            
            const highlightSpan = document.createElement('span');
            highlightSpan.className = 'smart-assistant-highlight';
            highlightSpan.textContent = highlightedText;
            fragment.appendChild(highlightSpan);
            
            if (afterText) {
                fragment.appendChild(document.createTextNode(afterText));
            }
            
            parent.replaceChild(fragment, node);
        }

        showSummaryPopup(content) {
            // Remove existing popup
            const existingPopup = document.getElementById('smart-assistant-summary');
            if (existingPopup) {
                existingPopup.remove();
            }
            
            // Create summary popup
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
            `;
            popup.innerHTML = `
                <button onclick="this.parentElement.remove()" style="position: absolute; top: 8px; right: 8px; background: none; border: none; font-size: 18px; cursor: pointer; color: #999;">×</button>
                <h3 style="margin: 0 0 8px 0; color: #667eea; font-size: 16px;">📄 Page Summary</h3>
                <p style="margin: 0; color: #333;">This page has been analyzed and important content has been highlighted. Key information is marked with sparkles (✨) for easy identification.</p>
            `;
            
            document.body.appendChild(popup);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (popup.parentNode) {
                    popup.remove();
                }
            }, 10000);
        }

        removeHighlights() {
            const highlights = document.querySelectorAll('.smart-assistant-highlight');
            highlights.forEach(highlight => {
                const parent = highlight.parentNode;
                parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
                parent.normalize();
            });
            
            const popup = document.getElementById('smart-assistant-summary');
            if (popup) {
                popup.remove();
            }
        }

        async searchInPage(query) {
            // Simple text search implementation
            const content = await this.getPageContent();
            const results = [];
            
            // Search in text content
            const textContent = content.text.toLowerCase();
            const queryLower = query.toLowerCase();
            
            if (textContent.includes(queryLower)) {
                results.push({
                    type: 'text',
                    content: `Found "${query}" in page content`,
                    relevance: 1
                });
            }
            
            // Search in headings
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
    }

    // Initialize content analyzer
    const contentAnalyzer = new ContentAnalyzer();
    console.log('Smart Web Assistant content analyzer initialized');
}
