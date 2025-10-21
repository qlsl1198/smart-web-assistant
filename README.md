# Smart Web Assistant

AI-powered Chrome extension that summarizes pages, highlights important content, and provides smart search capabilities using Chrome's built-in AI APIs.

## Features
- 📄 **AI Summarization** - Extract key points from web pages
- 🎯 **Smart Highlighting** - Auto-highlight important content  
- 🔍 **Semantic Search** - Ask questions in natural language
- 🌐 **Real-time Translation** - Instant translation of web content

## Built With
JavaScript, HTML5/CSS3, Chrome Extension Manifest V3, Google Gemini API, Service Workers, Content Scripts

## Installation
1. Clone this repository
2. **Set up API Key** (Required):
   - Get a free Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Open Chrome DevTools (F12) → Console
   - Run: `window.envLoader.saveApiKey('YOUR_API_KEY_HERE')`
3. Open Chrome and go to chrome://extensions/
4. Enable Developer mode
5. Click 'Load unpacked' and select the project folder
6. The extension will be available in your browser

## Usage
- Click the extension icon to open the popup
- Use AI features to summarize, translate, search, or highlight content
- Results will open in dedicated windows for better readability

## Development
- `manifest.json` - Extension configuration
- `popup.html/js` - Main popup interface
- `content.js` - Page content interaction
- `background.js` - Service worker
- `ai/gemini-client.js` - AI API integration
- `search.html/js` - Search interface
- `results.html/js` - Results display

## License
MIT License
