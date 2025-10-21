/**
 * Environment Variables Loader
 * Loads environment variables from .env file
 */

class EnvLoader {
    constructor() {
        this.env = {};
        this.loadEnv();
    }

    loadEnv() {
        // Default environment variables (fallback values)
        this.env = {
            GEMINI_API_KEY: 'YOUR_API_KEY_HERE',
            GEMINI_MODEL: 'gemini-2.0-flash',
            GEMINI_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models',
            GEMINI_MAX_TOKENS: 512,
            GEMINI_TEMPERATURE: 0.7,
            EXTENSION_VERSION: '1.0.0',
            DEBUG_MODE: false
        };

        // Load from Chrome storage (where .env values are stored)
        this.loadFromStorage();
    }

    async loadFromStorage() {
        try {
            const result = await chrome.storage.sync.get([
                'GEMINI_API_KEY', 
                'GEMINI_MODEL', 
                'GEMINI_MAX_TOKENS',
                'GEMINI_TEMPERATURE'
            ]);
            
            if (result.GEMINI_API_KEY && result.GEMINI_API_KEY !== 'YOUR_API_KEY_HERE') {
                this.env.GEMINI_API_KEY = result.GEMINI_API_KEY;
            }
            if (result.GEMINI_MODEL) {
                this.env.GEMINI_MODEL = result.GEMINI_MODEL;
            }
            if (result.GEMINI_MAX_TOKENS) {
                this.env.GEMINI_MAX_TOKENS = result.GEMINI_MAX_TOKENS;
            }
            if (result.GEMINI_TEMPERATURE) {
                this.env.GEMINI_TEMPERATURE = result.GEMINI_TEMPERATURE;
            }
        } catch (error) {
            console.log('Using default environment variables');
        }
    }

    get(key) {
        return this.env[key];
    }

    getAll() {
        return this.env;
    }

    // Save API key to Chrome storage
    async saveApiKey(apiKey) {
        try {
            await chrome.storage.sync.set({ GEMINI_API_KEY: apiKey });
            this.env.GEMINI_API_KEY = apiKey;
            console.log('API key saved successfully');
        } catch (error) {
            console.error('Failed to save API key:', error);
        }
    }
}

// Create global instance
window.envLoader = new EnvLoader();
