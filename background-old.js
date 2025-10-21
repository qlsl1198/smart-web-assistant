// Smart Web Assistant - Background Service Worker (Fixed)
console.log('Smart Web Assistant background service worker starting...');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed:', details.reason);
    
    // Set default settings
    chrome.storage.sync.set({
        autoHighlight: false,
        summaryLength: 'medium',
        language: 'en',
        theme: 'light'
    });
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received:', request);
    
    try {
        switch (request.action) {
            case 'getPageInfo':
                const pageInfo = {
                    url: sender.tab?.url,
                    title: sender.tab?.title,
                    timestamp: Date.now()
                };
                sendResponse({ success: true, data: pageInfo });
                break;

            case 'analyzeContent':
                // Simulate AI analysis
                setTimeout(() => {
                    sendResponse({
                        success: true,
                        data: {
                            sentiment: 'positive',
                            topics: ['technology', 'AI'],
                            keyPoints: ['Key point 1', 'Key point 2'],
                            confidence: 0.85
                        }
                    });
                }, 1000);
                return true; // Keep message channel open

            case 'generateSummary':
                // Simulate summary generation
                setTimeout(() => {
                    sendResponse({
                        success: true,
                        data: {
                            summary: `This page contains information about ${request.content?.title || 'the current topic'}. Key points include: ${request.content?.text?.substring(0, 200)}...`,
                            keyPoints: ['Main topic discussed', 'Important information highlighted'],
                            wordCount: request.content?.text?.length || 0
                        }
                    });
                }, 2000);
                return true;

            case 'translateText':
                // Simulate translation
                setTimeout(() => {
                    sendResponse({
                        success: true,
                        data: {
                            originalText: request.text,
                            translatedText: `Translated: ${request.text}`,
                            sourceLanguage: 'auto',
                            targetLanguage: request.targetLang || 'en',
                            confidence: 0.9
                        }
                    });
                }, 1500);
                return true;

            case 'searchContent':
                // Simulate search
                setTimeout(() => {
                    sendResponse({
                        success: true,
                        data: {
                            query: request.query,
                            results: [{
                                text: `Found relevant information about "${request.query}"`,
                                relevance: 0.9,
                                position: 0
                            }],
                            totalResults: 1
                        }
                    });
                }, 1000);
                return true;

            case 'getSettings':
                chrome.storage.sync.get().then(settings => {
                    sendResponse({ success: true, data: settings });
                });
                return true;

            case 'updateSettings':
                chrome.storage.sync.set(request.settings).then(() => {
                    sendResponse({ success: true });
                });
                return true;

            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }
    } catch (error) {
        console.error('Background service error:', error);
        sendResponse({ success: false, error: error.message });
    }
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        console.log('Tab updated:', tab.url);
        
        // Check if the page is suitable for AI analysis
        const invalidProtocols = ['chrome:', 'moz-extension:', 'edge:', 'about:'];
        const isValidPage = !invalidProtocols.some(protocol => tab.url.startsWith(protocol));
        
        if (isValidPage) {
            console.log('Valid page for AI analysis:', tab.url);
        }
    }
});

// Setup context menus
function setupContextMenus() {
    // Check if contextMenus API is available
    if (!chrome.contextMenus) {
        console.log('Context menus API not available');
        return;
    }

    // Clear existing context menus first
    chrome.contextMenus.removeAll(() => {
        // Create context menu items
        chrome.contextMenus.create({
            id: 'smart-summarize',
            title: '🤖 Summarize with AI',
            contexts: ['page']
        });

        chrome.contextMenus.create({
            id: 'smart-highlight',
            title: '✨ Highlight Important Content',
            contexts: ['page']
        });

        chrome.contextMenus.create({
            id: 'smart-translate',
            title: '🌐 Translate Page',
            contexts: ['page']
        });

        chrome.contextMenus.create({
            id: 'smart-search',
            title: '🔍 AI Search in Page',
            contexts: ['selection']
        });

        // Handle context menu clicks
        chrome.contextMenus.onClicked.addListener((info, tab) => {
            console.log('Context menu clicked:', info.menuItemId);
            
            switch (info.menuItemId) {
                case 'smart-summarize':
                    chrome.tabs.sendMessage(tab.id, { action: 'summarizePage' });
                    break;
                case 'smart-highlight':
                    chrome.tabs.sendMessage(tab.id, { action: 'highlightImportantContent' });
                    break;
                case 'smart-translate':
                    chrome.tabs.sendMessage(tab.id, { action: 'translatePage' });
                    break;
                case 'smart-search':
                    chrome.tabs.sendMessage(tab.id, { action: 'searchInPage', query: info.selectionText });
                    break;
            }
        });
    });
}

// Initialize context menus
setupContextMenus();

console.log('Smart Web Assistant background service worker initialized');
