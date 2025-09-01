// High-performance API client with caching and optimization
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Check if we're in production and API URL is not set
const isProduction = window.location.hostname !== 'localhost';
const actualApiUrl = isProduction && !import.meta.env.VITE_API_URL 
  ? `${window.location.protocol}//${window.location.hostname}:3001`
  : API_BASE_URL;

class ChineseLearningAPI {
  constructor() {
    this.cache = new Map();
    this.requestQueue = new Map();
  }

  // Generic fetch with caching and error handling
  async fetch(endpoint, options = {}) {
    const url = `${actualApiUrl}${endpoint}`;
    const cacheKey = `${url}_${JSON.stringify(options)}`;
    
    // Return cached result if available
    if (this.cache.has(cacheKey)) {
      console.log('Using client cache for:', endpoint);
      return this.cache.get(cacheKey);
    }
    
    // Prevent duplicate requests
    if (this.requestQueue.has(cacheKey)) {
      console.log('Request already in progress for:', endpoint);
      return this.requestQueue.get(cacheKey);
    }
    
    const request = fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })
    .then(async response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      // Cache successful results
      this.cache.set(cacheKey, data);
      
      // Set cache TTL (remove after 5 minutes for API responses)
      setTimeout(() => {
        this.cache.delete(cacheKey);
      }, 5 * 60 * 1000);
      
      return data;
    })
    .catch(error => {
      console.error('API request failed:', endpoint, error);
      throw error;
    })
    .finally(() => {
      // Remove from request queue
      this.requestQueue.delete(cacheKey);
    });
    
    this.requestQueue.set(cacheKey, request);
    return request;
  }

  // Get character data
  async getCharacter(char) {
    try {
      return await this.fetch(`/api/character/${encodeURIComponent(char)}`);
    } catch (error) {
      console.warn('Character API failed, using fallback for:', char);
      return this.getFallbackCharacter(char);
    }
  }

  // Get phrase data
  async getPhrase(text) {
    try {
      return await this.fetch(`/api/phrase/${encodeURIComponent(text)}`);
    } catch (error) {
      console.warn('Phrase API failed, using fallback for:', text);
      return this.getFallbackPhrase(text);
    }
  }

  // Batch get characters (performance optimization)
  async getCharactersBatch(characters) {
    try {
      return await this.fetch('/api/characters/batch', {
        method: 'POST',
        body: JSON.stringify({ characters })
      });
    } catch (error) {
      console.warn('Batch character API failed, using individual requests');
      
      // Fallback to individual requests
      const results = {};
      await Promise.all(
        characters.map(async (char) => {
          try {
            results[char] = await this.getCharacter(char);
          } catch (err) {
            results[char] = this.getFallbackCharacter(char);
          }
        })
      );
      return results;
    }
  }

  // Generate image
  async generateImage(char, englishMeaning, prompt = null) {
    try {
      return await this.fetch('/api/image/generate', {
        method: 'POST',
        body: JSON.stringify({ char, englishMeaning, prompt })
      });
    } catch (error) {
      console.warn('Image generation API failed:', error);
      return { 
        error: 'Image generation failed',
        fallback: true,
        fallback_url: this.getFallbackImageUrl(char, englishMeaning)
      };
    }
  }

  // Get cached image
  async getImage(char, englishMeaning) {
    try {
      return await this.fetch(`/api/image/${encodeURIComponent(char)}/${encodeURIComponent(englishMeaning)}`);
    } catch (error) {
      console.warn('Image fetch failed, generating new one');
      return this.generateImage(char, englishMeaning);
    }
  }

  // Fallback data
  getFallbackCharacter(char) {
    const fallbackPinyinMap = {
      '你': 'nǐ', '好': 'hǎo', '我': 'wǒ', '是': 'shì', '爱': 'ài',
      '中': 'zhōng', '国': 'guó', '人': 'rén', '大': 'dà', '小': 'xiǎo'
    };
    
    const fallbackTranslationMap = {
      '你': 'you', '好': 'good/well', '我': 'I/me', '是': 'am/is/are', '爱': 'love',
      '中': 'middle/center', '国': 'country', '人': 'person', '大': 'big', '小': 'small'
    };

    return {
      char,
      pinyin: fallbackPinyinMap[char] || char,
      translation: fallbackTranslationMap[char] || char,
      fallback: true,
      cached: false
    };
  }

  getFallbackPhrase(text) {
    const isChineseText = /[\u4e00-\u9fff]/.test(text);
    
    if (isChineseText) {
      const characters = text.split('');
      const characterData = characters.map(char => this.getFallbackCharacter(char));
      
      return {
        original_text: text,
        chinese_text: text,
        pinyin: characterData.map(c => c.pinyin).join(' '),
        translation: characterData.map(c => c.translation).join(' '),
        language: 'chinese',
        characters: characterData,
        fallback: true,
        cached: false
      };
    } else {
      return {
        original_text: text,
        chinese_text: text,
        pinyin: text,
        translation: text,
        language: 'english',
        characters: [{ char: text, pinyin: text, translation: text }],
        fallback: true,
        cached: false
      };
    }
  }

  getFallbackImageUrl(char, englishMeaning) {
    // Generate SVG fallback image - use encodeURIComponent to handle Chinese characters
    const svgContent = `
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="400" fill="#4F46E5"/>
        <text x="200" y="200" font-family="Arial, sans-serif" font-size="120" fill="white" 
              text-anchor="middle" dominant-baseline="middle">${char}</text>
        <text x="200" y="320" font-family="Arial, sans-serif" font-size="20" fill="white" 
              text-anchor="middle" dominant-baseline="middle">${englishMeaning || char}</text>
      </svg>
    `;
    
    // Use encodeURIComponent instead of btoa for Unicode safety
    return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
  }

  // Clear client cache
  clearCache() {
    this.cache.clear();
    console.log('API cache cleared');
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()).map(k => k.split('_')[0])
    };
  }

  // Preload common data for faster initial experience
  async preloadCommonData() {
    const commonChars = ['你', '好', '我', '是', '爱', '中', '国', '人', '大', '小'];
    
    try {
      console.log('Preloading common characters...');
      await this.getCharactersBatch(commonChars);
      console.log('Common characters preloaded');
    } catch (error) {
      console.warn('Preloading failed:', error);
    }
  }
}

// Export singleton instance
export const api = new ChineseLearningAPI();

// Auto-preload common data
api.preloadCommonData();