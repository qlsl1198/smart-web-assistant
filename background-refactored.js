/**
 * Smart Web Assistant - Refactored Background Service Worker
 * Clean, efficient, and maintainable background processing
 */
class BackgroundService {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        this.setupEventListeners();
        this.setupContextMenus();
        this.isInitialized = true;
        console.log('Smart Web Assistant background service initialized');
    }

    // ==================== EVENT LISTENERS ====================
    
    setupEventListeners() {
        // Extension lifecycle events
        chrome.runtime.onInstalled.addListener(this.handleInstall.bind(this));
        chrome.runtime.onStartup.addListener(this.handleStartup.bind(this));
        
        // Message handling
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
        
        // Tab events
        chrome.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));
    }

    async handleInstall(details) {
        console.log('Extension installed:', details.reason);
        
        if (details.reason === 'install') {
            await this.setDefaultSettings();
        } else if (details.reason === 'update') {
            await this.handleUpdate(details.previousVersion);
        }
    }

    async handleStartup() {
        console.log('Extension startup');
        await this.setupContextMenus();
    }

    // ==================== MESSAGE HANDLING ====================
    
    async handleMessage(request, sender, sendResponse) {
        console.log('Background received message:', request);
        
        try {
            const response = await this.processMessage(request, sender);
            sendResponse(response);
        } catch (error) {
            console.error('Background service error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async processMessage(request, sender) {
        const handlers = {
            'getPageInfo': () => this.getPageInfo(sender.tab),
            'analyzeContent': () => this.analyzeContent(request.content),
            'generateSummary': () => this.generateSummary(request.content),
            'translateText': () => this.translateText(request.text, request.targetLang),
            'searchContent': () => this.searchContent(request.content, request.query),
            'getSettings': () => this.getSettings(),
            'updateSettings': () => this.updateSettings(request.settings)
        };

        const handler = handlers[request.action];
        if (!handler) {
            throw new Error('Unknown action');
        }

        const data = await handler();
        return { success: true, data };
    }

    // ==================== TAB MANAGEMENT ====================
    
    async handleTabUpdate(tabId, changeInfo, tab) {
        if (changeInfo.status === 'complete' && tab.url) {
            console.log('Tab updated:', tab.url);
            
            if (this.isValidPage(tab.url)) {
                console.log('Valid page for AI analysis:', tab.url);
                await this.injectContentScript(tabId);
            }
        }
    }

    async injectContentScript(tabId) {
        try {
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ['content.js']
            });
            
            await chrome.scripting.insertCSS({
                target: { tabId },
                files: ['content.css']
            });
        } catch (error) {
            console.log('Content script injection skipped:', error.message);
        }
    }

    isValidPage(url) {
        if (!url) return false;
        
        const invalidProtocols = ['chrome:', 'moz-extension:', 'edge:', 'about:'];
        return !invalidProtocols.some(protocol => url.startsWith(protocol));
    }

    // ==================== CONTEXT MENUS ====================
    
    async setupContextMenus() {
        if (!chrome.contextMenus) {
            console.log('Context menus API not available');
            return;
        }

        try {
            await chrome.contextMenus.removeAll();
            
            const menuItems = [
                { id: 'smart-summarize', title: '🤖 Summarize with AI', contexts: ['page'] },
                { id: 'smart-highlight', title: '✨ Highlight Important Content', contexts: ['page'] },
                { id: 'smart-translate', title: '🌐 Translate Page', contexts: ['page'] },
                { id: 'smart-search', title: '🔍 AI Search in Page', contexts: ['selection'] }
            ];

            menuItems.forEach(item => {
                chrome.contextMenus.create(item);
            });

            chrome.contextMenus.onClicked.addListener(this.handleContextMenuClick.bind(this));
        } catch (error) {
            console.error('Context menu setup error:', error);
        }
    }

    async handleContextMenuClick(info, tab) {
        console.log('Context menu clicked:', info.menuItemId);
        
        const actions = {
            'smart-summarize': () => this.triggerSummarize(tab.id),
            'smart-highlight': () => this.triggerHighlight(tab.id),
            'smart-translate': () => this.triggerTranslate(tab.id),
            'smart-search': () => this.triggerSearch(tab.id, info.selectionText)
        };

        const action = actions[info.menuItemId];
        if (action) {
            try {
                await action();
            } catch (error) {
                console.error('Context menu action error:', error);
            }
        }
    }

    // ==================== CONTEXT MENU ACTIONS ====================
    
    async triggerSummarize(tabId) {
        await this.sendMessageToTab(tabId, { action: 'summarizePage' });
    }

    async triggerHighlight(tabId) {
        await this.sendMessageToTab(tabId, { action: 'highlightImportantContent' });
    }

    async triggerTranslate(tabId) {
        await this.sendMessageToTab(tabId, { action: 'translatePage' });
    }

    async triggerSearch(tabId, query) {
        await this.sendMessageToTab(tabId, { action: 'searchInPage', query });
    }

    async sendMessageToTab(tabId, message) {
        try {
            await chrome.tabs.sendMessage(tabId, message);
        } catch (error) {
            console.error('Failed to send message to tab:', error);
        }
    }

    // ==================== DATA PROCESSING ====================
    
    async getPageInfo(tab) {
        return {
            url: tab.url,
            title: tab.title,
            favicon: tab.favIconUrl,
            timestamp: Date.now()
        };
    }

    async analyzeContent(content) {
        // Simulate AI analysis
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    sentiment: 'positive',
                    topics: ['technology', 'AI', 'web development'],
                    keyPoints: [
                        'This page discusses modern web technologies',
                        'AI integration is becoming more common',
                        'User experience is a key focus'
                    ],
                    confidence: 0.85
                });
            }, 1000);
        });
    }

    async generateSummary(content) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    summary: `This page contains information about ${content.title || 'the current topic'}. ` +
                            `Key points include: ${content.text?.substring(0, 200)}...`,
                    keyPoints: [
                        'Main topic discussed',
                        'Important information highlighted',
                        'Key takeaways provided'
                    ],
                    wordCount: content.text?.length || 0
                });
            }, 2000);
        });
    }

    async translateText(text, targetLang = 'en') {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    originalText: text,
                    translatedText: `Translated: ${text}`,
                    sourceLanguage: 'auto',
                    targetLanguage: targetLang,
                    confidence: 0.9
                });
            }, 1500);
        });
    }

    async searchContent(content, query) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    query: query,
                    results: [{
                        text: `Found relevant information about "${query}"`,
                        relevance: 0.9,
                        position: 0
                    }],
                    totalResults: 1
                });
            }, 1000);
        });
    }

    // ==================== SETTINGS MANAGEMENT ====================
    
    async setDefaultSettings() {
        const defaultSettings = {
            autoHighlight: false,
            summaryLength: 'medium',
            language: 'en',
            theme: 'light',
            version: chrome.runtime.getManifest().version
        };

        await chrome.storage.sync.set(defaultSettings);
        console.log('Default settings applied');
    }

    async handleUpdate(previousVersion) {
        console.log(`Extension updated from ${previousVersion}`);
        
        const settings = await chrome.storage.sync.get();
        if (!settings.version) {
            settings.version = chrome.runtime.getManifest().version;
            await chrome.storage.sync.set(settings);
        }
    }

    async getSettings() {
        return await chrome.storage.sync.get();
    }

    async updateSettings(settings) {
        await chrome.storage.sync.set(settings);
    }
}

// ==================== INITIALIZATION ====================

const backgroundService = new BackgroundService();
