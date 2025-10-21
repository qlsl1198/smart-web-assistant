/**
 * Gemini AI Client - Free Tier Optimized
 * Uses free tier compatible models and endpoints
 */
class GeminiClient {
    constructor() {
        this.apiKey = 'AIzaSyByptWj8LM1rDpl-myiUogE0ePQPDGGeQk';
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.model = 'gemini-2.0-flash'; // Free tier model
        this.defaultConfig = {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 512 // Reduced for free tier
        };
    }

    /**
     * Generate text using Gemini API
     * @param {string} prompt - The input prompt
     * @param {Object} options - Generation options
     * @returns {Promise<string>} Generated text
     */
    async generateText(prompt, options = {}) {
        const maxRetries = 3;
        const retryDelay = 1000; // 1초

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const config = { ...this.defaultConfig, ...options };
                
                const response = await fetch(`${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: config
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    
                    // 503 오류인 경우 재시도
                    if (response.status === 503 && attempt < maxRetries) {
                        console.log(`API 503 error, retrying in ${retryDelay * attempt}ms... (attempt ${attempt}/${maxRetries})`);
                        await this.delay(retryDelay * attempt);
                        continue;
                    }
                    
                    throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
                }

                const data = await response.json();
                
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    return data.candidates[0].content.parts[0].text;
                } else {
                    throw new Error('No content generated');
                }
            } catch (error) {
                console.error(`Gemini API Error (attempt ${attempt}/${maxRetries}):`, error);
                
                // 마지막 시도가 아니면 재시도
                if (attempt < maxRetries) {
                    await this.delay(retryDelay * attempt);
                    continue;
                }
                
                // 모든 재시도 실패 시 fallback
                return this.getFallbackResponse(prompt, error);
            }
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getFallbackResponse(prompt, error) {
        console.log('Using fallback response due to API error:', error.message);
        
        // 간단한 fallback 응답 생성
        if (prompt.includes('요약') || prompt.includes('summary')) {
            return '죄송합니다. 현재 AI 서비스에 일시적인 문제가 있습니다. 페이지를 새로고침하고 다시 시도해주세요.';
        } else if (prompt.includes('번역') || prompt.includes('translate')) {
            return '번역 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
        } else if (prompt.includes('검색') || prompt.includes('search')) {
            return '검색 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
        } else {
            return 'AI 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
        }
    }

    /**
     * Summarize text content
     * @param {string} text - Text to summarize
     * @param {Object} options - Summary options
     * @returns {Promise<string>} Summary text
     */
    async summarize(text, options = {}) {
        // 무료 등급을 위한 텍스트 길이 제한
        const maxLength = 2000;
        const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        
        const prompt = `다음 텍스트를 한국어로 요약해주세요 (3-4문장):\n\n${truncatedText}\n\n요약:`;
        
        return await this.generateText(prompt, {
            temperature: 0.3,
            maxOutputTokens: 200, // 무료 등급 제한
            ...options
        });
    }

    /**
     * Translate text to target language
     * @param {string} text - Text to translate
     * @param {string} targetLang - Target language
     * @param {Object} options - Translation options
     * @returns {Promise<string>} Translated text
     */
    async translate(text, targetLang = 'Korean', options = {}) {
        // 무료 등급을 위한 텍스트 길이 제한
        const maxLength = 1000;
        const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        
        const prompt = `다음 텍스트를 ${targetLang}로 번역해주세요:\n\n${truncatedText}\n\n번역:`;
        
        return await this.generateText(prompt, {
            temperature: 0.1,
            maxOutputTokens: 300, // 무료 등급 제한
            ...options
        });
    }

    /**
     * Search for relevant information in text
     * @param {string} text - Text to search in
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<string>} Search results
     */
    async search(text, query, options = {}) {
        // 무료 등급을 위한 텍스트 길이 제한
        const maxLength = 1500;
        const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        
        const prompt = `다음 텍스트에서 "${query}"와 관련된 정보를 찾아서 설명해주세요:\n\n텍스트:\n${truncatedText}\n\n검색어: ${query}\n\n관련 정보:`;
        
        return await this.generateText(prompt, {
            temperature: 0.3,
            maxOutputTokens: 250, // 무료 등급 제한
            ...options
        });
    }

    /**
     * Analyze content and extract key information
     * @param {string} text - Text to analyze
     * @param {Object} options - Analysis options
     * @returns {Promise<string>} Analysis results
     */
    async analyze(text, options = {}) {
        const prompt = `다음 텍스트를 분석하여 다음 정보를 제공해주세요:
1. 주제/제목
2. 핵심 내용 (3-5개 포인트)
3. 감정/톤
4. 키워드 (5-10개)
5. 요약

텍스트:\n${text}\n\n분석 결과:`;
        
        return await this.generateText(prompt, {
            temperature: 0.4,
            maxOutputTokens: 1000,
            ...options
        });
    }

    /**
     * Extract important sentences from text
     * @param {string} text - Text to analyze
     * @param {Object} options - Extraction options
     * @returns {Promise<string>} Important sentences
     */
    async extractImportant(text, options = {}) {
        const prompt = `다음 텍스트에서 가장 중요한 문장들을 찾아서 나열해주세요. 각 문장의 중요도를 설명해주세요:\n\n${text}\n\n중요한 문장들:`;
        
        return await this.generateText(prompt, {
            temperature: 0.2,
            maxOutputTokens: 800,
            ...options
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeminiClient;
} else {
    window.GeminiClient = GeminiClient;
}
