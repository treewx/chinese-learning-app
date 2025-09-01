import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, Settings, Heart, RefreshCw } from 'lucide-react';
import pinyin from 'pinyin';

// Comprehensive fallback pinyin for common characters
const fallbackPinyinMap = {
  '你': 'nǐ', '好': 'hǎo', '我': 'wǒ', '是': 'shì', '爱': 'ài',
  '中': 'zhōng', '国': 'guó', '人': 'rén', '大': 'dà', '小': 'xiǎo',
  '吃': 'chī', '饭': 'fàn', '水': 'shuǐ', '茶': 'chá', '书': 'shū',
  '学': 'xué', '生': 'shēng', '老': 'lǎo', '师': 'shī', '家': 'jiā',
  '朋': 'péng', '友': 'yǒu', '高': 'gāo', '兴': 'xìng', '见': 'jiàn',
  '面': 'miàn', '谢': 'xiè', '再': 'zài', '狗': 'gǒu', '猫': 'māo',
  '鱼': 'yú', '鸟': 'niǎo', '花': 'huā', '树': 'shù', '山': 'shān',
  '河': 'hé', '天': 'tiān', '地': 'dì', 
  // Additional characters from your screenshot  
  '毛': 'máo', '茸': 'róng', '的': 'de', '得': 'de',
  '来': 'lái', '去': 'qù', '有': 'yǒu', '没': 'méi', '很': 'hěn',
  '也': 'yě', '都': 'dōu', '在': 'zài', '了': 'le', '着': 'zhe',
  '过': 'guò', '说': 'shuō', '话': 'huà', '时': 'shí', '间': 'jiān',
  '年': 'nián', '月': 'yuè', '日': 'rì', '今': 'jīn', '明': 'míng',
  '昨': 'zuó', '早': 'zǎo', '晚': 'wǎn', '上': 'shàng', '下': 'xià',
  '里': 'lǐ', '外': 'wài', '前': 'qián', '后': 'hòu', '左': 'zuǒ',
  '右': 'yòu', '东': 'dōng', '西': 'xī', '南': 'nán', '北': 'běi',
  '城': 'chéng', '市': 'shì', '路': 'lù', '街': 'jiē', '店': 'diàn',
  '买': 'mǎi', '卖': 'mài', '钱': 'qián', '块': 'kuài', '元': 'yuán',
  '工': 'gōng', '作': 'zuò', '公': 'gōng', '司': 'sī', '医': 'yī',
  '院': 'yuàn', '学': 'xué', '校': 'xiào', '车': 'chē', '站': 'zhàn',
  '飞': 'fēi', '机': 'jī', '火': 'huǒ', '船': 'chuán', '开': 'kāi',
  '关': 'guān', '门': 'mén', '窗': 'chuāng', '房': 'fáng', '住': 'zhù',
  '睡': 'shuì', '觉': 'jiào', '起': 'qǐ', '床': 'chuáng', '洗': 'xǐ',
  '澡': 'zǎo', '穿': 'chuān', '衣': 'yī', '服': 'fú', '鞋': 'xié',
  '帽': 'mào', '手': 'shǒu', '脚': 'jiǎo', '头': 'tóu', '眼': 'yǎn',
  '耳': 'ěr', '鼻': 'bí', '嘴': 'zuǐ', '牙': 'yá', '身': 'shēn',
  '体': 'tǐ', '心': 'xīn', '情': 'qíng', '感': 'gǎn', '觉': 'jiào',
  '想': 'xiǎng', '知': 'zhī', '道': 'dào', '认': 'rèn', '识': 'shí',
  '会': 'huì', '能': 'néng', '可': 'kě', '以': 'yǐ', '要': 'yào',
  '不': 'bù', '没': 'méi', '别': 'bié', '让': 'ràng', '给': 'gěi',
  '白': 'bái', '黑': 'hēi', '红': 'hóng', '绿': 'lǜ', '蓝': 'lán',
  '黄': 'huáng', '紫': 'zǐ', '粉': 'fěn', '灰': 'huī', '棕': 'zōng'
};

// Comprehensive fallback translations (used when API fails)
const fallbackTranslationMap = {
  '你': 'you', '好': 'good/well', '我': 'I/me', '是': 'am/is/are', '爱': 'love',
  '中': 'middle/center', '国': 'country', '人': 'person', '大': 'big', '小': 'small',
  '吃': 'eat', '饭': 'rice/meal', '水': 'water', '茶': 'tea', '书': 'book',
  '学': 'study/learn', '生': 'life/birth', '老': 'old', '师': 'teacher', '家': 'home/family',
  '朋': 'friend', '友': 'friend', '高': 'tall/high', '兴': 'interest/excited', '见': 'see/meet',
  '面': 'face/surface', '谢': 'thank', '再': 'again', '狗': 'dog', '猫': 'cat',
  '鱼': 'fish', '鸟': 'bird', '花': 'flower', '树': 'tree', '山': 'mountain',
  '河': 'river', '天': 'sky/day', '地': 'earth/ground',
  // Additional character translations
  '毛': 'hair/wool', '茸': 'mushroom/fluffy', '的': 'of/possessive', '得': 'get/must', 
  '来': 'come', '去': 'go', '有': 'have', '没': 'not have', '很': 'very',
  '也': 'also', '都': 'all', '在': 'at/in', '了': 'completed', '着': 'ongoing',
  '过': 'past/through', '说': 'say', '话': 'speak', '时': 'time', '间': 'room/between',
  '年': 'year', '月': 'month', '日': 'day', '今': 'today', '明': 'bright/tomorrow',
  '昨': 'yesterday', '早': 'early/morning', '晚': 'late/evening', '上': 'up/on', '下': 'down/under',
  '里': 'inside', '外': 'outside', '前': 'front', '后': 'back', '左': 'left',
  '右': 'right', '东': 'east', '西': 'west', '南': 'south', '北': 'north',
  '城': 'city', '市': 'market/city', '路': 'road', '街': 'street', '店': 'shop',
  '买': 'buy', '卖': 'sell', '钱': 'money', '块': 'piece/dollar', '元': 'yuan/dollar',
  '工': 'work', '作': 'do/work', '公': 'public', '司': 'company', '医': 'medicine',
  '院': 'institution', '学': 'study', '校': 'school', '车': 'vehicle', '站': 'station',
  '飞': 'fly', '机': 'machine', '火': 'fire', '船': 'boat', '开': 'open/drive',
  '关': 'close/pass', '门': 'door', '窗': 'window', '房': 'house', '住': 'live',
  '睡': 'sleep', '觉': 'sleep/feel', '起': 'rise', '床': 'bed', '洗': 'wash',
  '澡': 'bath', '穿': 'wear', '衣': 'clothes', '服': 'clothes', '鞋': 'shoes',
  '帽': 'hat', '手': 'hand', '脚': 'foot', '头': 'head', '眼': 'eye',
  '耳': 'ear', '鼻': 'nose', '嘴': 'mouth', '牙': 'tooth', '身': 'body',
  '体': 'body', '心': 'heart', '情': 'feeling', '感': 'feel', '觉': 'feel',
  '想': 'think', '知': 'know', '道': 'way/know', '认': 'recognize', '识': 'know',
  '会': 'can/meeting', '能': 'can', '可': 'can', '以': 'with/use', '要': 'want',
  '不': 'not', '没': 'not have', '别': 'other/don\'t', '让': 'let', '给': 'give',
  '白': 'white', '黑': 'black', '红': 'red', '绿': 'green', '蓝': 'blue',
  '黄': 'yellow', '紫': 'purple', '粉': 'pink', '灰': 'gray', '棕': 'brown'
};

// Fallback phrase translations
const fallbackPhraseTranslations = {
  '你好': 'hello', '我是': 'I am', '中国人': 'Chinese person',
  '老师': 'teacher', '学生': 'student', '朋友': 'friend',
  '高兴': 'happy', '见面': 'meet', '谢谢': 'thank you', '再见': 'goodbye'
};

// API Configuration
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || 'your-openai-api-key-here';

// Chinese translation and pinyin APIs
const PINYIN_API_URL = 'https://api.mymemory.translated.net/get';
const DICT_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/zh';

// Multiple pinyin conversion APIs for robustness
const PINYIN_APIS = {
  // Free Chinese pinyin conversion services
  pinyin_rest: 'https://pinyin-api.python-china.org/pinyin',
  hanzi_writer: 'https://cdn.jsdelivr.net/npm/hanzi-writer-data/',
  cc_cedict: 'https://api.chinese-tools.com/tools/hanzi-to-pinyin',
  unicode_org: 'https://www.unicode.org/cgi-bin/GetUnihanData.pl'
};

// IndexedDB Database Setup
class ChineseLearningDB {
  constructor() {
    this.dbName = 'ChineseLearningApp';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Store for phrase translations and metadata
        if (!db.objectStoreNames.contains('phrases')) {
          const phraseStore = db.createObjectStore('phrases', { keyPath: 'text' });
          phraseStore.createIndex('language', 'language', { unique: false });
          phraseStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Store for individual character data
        if (!db.objectStoreNames.contains('characters')) {
          const charStore = db.createObjectStore('characters', { keyPath: 'char' });
        }
        
        // Store for images
        if (!db.objectStoreNames.contains('images')) {
          const imageStore = db.createObjectStore('images', { keyPath: 'key' });
        }
        
        // Store for audio data (future enhancement)
        if (!db.objectStoreNames.contains('audio')) {
          const audioStore = db.createObjectStore('audio', { keyPath: 'text' });
        }
      };
    });
  }

  async storePhrase(text, data) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['phrases'], 'readwrite');
    const store = transaction.objectStore('phrases');
    
    const phraseData = {
      text: text,
      language: detectLanguage(text),
      chineseText: data.chineseText,
      pinyin: data.pinyin,
      translation: data.translation,
      characters: data.characters,
      originalEnglish: data.originalEnglish,
      timestamp: Date.now()
    };
    
    return store.put(phraseData);
  }

  async getPhrase(text) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['phrases'], 'readonly');
    const store = transaction.objectStore('phrases');
    
    return new Promise((resolve, reject) => {
      const request = store.get(text);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async storeCharacter(char, data) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['characters'], 'readwrite');
    const store = transaction.objectStore('characters');
    
    const charData = {
      char: char,
      pinyin: data.pinyin,
      translation: data.translation,
      timestamp: Date.now()
    };
    
    return store.put(charData);
  }

  async getCharacter(char) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['characters'], 'readonly');
    const store = transaction.objectStore('characters');
    
    return new Promise((resolve, reject) => {
      const request = store.get(char);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async storeImage(key, imageUrl, description) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['images'], 'readwrite');
    const store = transaction.objectStore('images');
    
    const imageData = {
      key: key,
      url: imageUrl,
      description: description,
      timestamp: Date.now()
    };
    
    return store.put(imageData);
  }

  async getImage(key) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['images'], 'readonly');
    const store = transaction.objectStore('images');
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPhrases() {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['phrases'], 'readonly');
    const store = transaction.objectStore('phrases');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePhrase(text) {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction(['phrases'], 'readwrite');
    const store = transaction.objectStore('phrases');
    
    return store.delete(text);
  }

  async clearAll() {
    if (!this.db) await this.init();
    
    const stores = ['phrases', 'characters', 'images', 'audio'];
    const transaction = this.db.transaction(stores, 'readwrite');
    
    for (const storeName of stores) {
      const store = transaction.objectStore(storeName);
      store.clear();
    }
    
    return transaction.complete;
  }
}

// Initialize database
const db = new ChineseLearningDB();

// Image generation prompts for characters (more detailed for better AI generation)
const imagePrompts = {
  '你': 'A friendly person pointing to themselves, warm and welcoming expression, simple illustration style',
  '好': 'A thumbs up gesture with a bright smile, positive energy, clean minimalist style',
  '我': 'A person with hand on chest in a "me" gesture, self-referential pose, soft lighting',
  '是': 'An equals sign made of golden light, mathematical concept, abstract but clear',
  '爱': 'A glowing red heart with warm rays of light, love and affection, romantic style',
  '中': 'A perfect circle with a dot in the center, balance and centeredness, zen-like',
  '国': 'A beautiful flag waving in the wind against blue sky, patriotic and proud',
  '人': 'A simple human silhouette standing tall, dignity and humanity, minimalist',
  '大': 'A massive mountain or building showing scale and grandeur, impressive size',
  '小': 'A tiny flower or small animal, delicate and cute, emphasizing smallness',
  '吃': 'Someone enjoying a delicious meal with chopsticks, happy eating, food culture',
  '饭': 'A bowl of steaming white rice with chopsticks, traditional Asian meal',
  '水': 'Crystal clear water droplet or flowing stream, pure and refreshing',
  '茶': 'An elegant tea ceremony setup with steam rising, peaceful and traditional',
  '书': 'An open book with knowledge flowing out as light, learning and wisdom',
  '学': 'A student studying with books and light bulb above head, learning moment',
  '生': 'A seed sprouting into a plant, new life and growth, nature and vitality',
  '老': 'A wise elderly person with kind eyes, respect and experience',
  '师': 'A teacher at a blackboard with students, education and guidance',
  '家': 'A cozy house with warm light in windows, home and family comfort',
  '朋': 'Two people shaking hands or hugging, friendship and connection',
  '友': 'A group of friends laughing together, joy and companionship',
  '高': 'A tall skyscraper reaching toward clouds, height and ambition',
  '兴': 'A person jumping with joy and excitement, celebration and happiness',
  '见': 'Eyes opening wide with recognition, the moment of seeing and understanding',
  '面': 'A kind human face with gentle expression, meeting face to face',
  '谢': 'Hands pressed together in gratitude, thankfulness and respect',
  '再': 'A circular arrow showing repetition, doing something again',
  '狗': 'A happy golden retriever with tongue out, loyal and friendly pet',
  '猫': 'A cute cat with big eyes sitting gracefully, feline elegance',
  '鱼': 'A colorful fish swimming in clear blue water, aquatic life',
  '鸟': 'A beautiful bird in flight against sky, freedom and nature',
  '花': 'A vibrant blooming flower with petals in sunlight, natural beauty',
  '树': 'A majestic oak tree with full green canopy, strength and growth',
  '山': 'A mountain peak with snow and clouds, natural majesty',
  '河': 'A peaceful river flowing through landscape, water and journey',
  '天': 'Blue sky with white clouds and sunlight, heaven and openness',
  '地': 'Rich earth with growing plants, ground and foundation'
};

// Convert Unicode code point to get character info
const getUnicodeInfo = (char) => {
  const codePoint = char.codePointAt(0);
  return {
    unicode: codePoint.toString(16).toUpperCase().padStart(4, '0'),
    isChineseChar: codePoint >= 0x4E00 && codePoint <= 0x9FFF
  };
};

// Client-side pinyin conversion using Unicode ranges and patterns
const getClientSidePinyin = (char) => {
  // This is a simplified client-side pinyin generator
  // It uses Unicode code point patterns to approximate pinyin
  const codePoint = char.codePointAt(0);
  
  if (codePoint < 0x4E00 || codePoint > 0x9FFF) {
    return char; // Not a Chinese character
  }

  // Simple approximation based on Unicode ranges
  // This is not perfect but provides a reasonable fallback
  const ranges = [
    { start: 0x4E00, end: 0x4EFF, sounds: ['yi', 'ding', 'qi', 'shang', 'xia', 'wan', 'zhang', 'san', 'shang', 'xia'] },
    { start: 0x4F00, end: 0x4FFF, sounds: ['yi', 'ren', 'ru', 'ba', 'dao', 'li', 'shan', 'chuan', 'gong', 'ji'] },
    { start: 0x5000, end: 0x50FF, sounds: ['yuan', 'yun', 'wu', 'jing', 'yu', 'ya', 'kang', 'qing', 'cang', 'xian'] },
    { start: 0x5100, end: 0x51FF, sounds: ['dong', 'le', 'ping', 'ka', 'bei', 'zhan', 'tai', 'shi', 'you', 'bu'] },
    // Add more ranges as needed
  ];

  for (const range of ranges) {
    if (codePoint >= range.start && codePoint <= range.end) {
      const index = Math.floor((codePoint - range.start) / ((range.end - range.start) / range.sounds.length));
      return range.sounds[Math.min(index, range.sounds.length - 1)] || 'unknown';
    }
  }

  return `u${codePoint.toString(16)}`; // Unicode fallback
};

// Get pinyin using reliable client-side library
const getClientSidePinyinAccurate = (char) => {
  try {
    // Use the pinyin library with tone marks
    const result = pinyin(char, {
      style: pinyin.STYLE_TONE, // Include tone marks (nǐ, hǎo, etc.)
      segment: false // Don't segment words
    });
    
    if (result && result.length > 0 && result[0].length > 0) {
      return result[0][0]; // Get the first pinyin result
    }
    
    return null;
  } catch (error) {
    console.warn('Client-side pinyin conversion failed:', error);
    return null;
  }
};

// Comprehensive pinyin function with API calls and caching
const getPinyin = async (text, forceRefresh = false) => {
  try {
    // Check database cache first (unless forced refresh)
    if (!forceRefresh) {
      const cachedData = await db.getPhrase(text);
      if (cachedData && cachedData.pinyin) {
        console.log('Using cached pinyin for:', text);
        return cachedData.pinyin;
      }
    }
    
    // Process character by character for accurate pinyin
    const characters = text.split('');
    const pinyinResults = await Promise.all(characters.map(async (char) => {
      // Check character cache first (unless forced refresh)
      if (!forceRefresh) {
        const cachedChar = await db.getCharacter(char);
        if (cachedChar && cachedChar.pinyin && !cachedChar.pinyin.startsWith('[')) {
          return cachedChar.pinyin;
        }
      }
      
      let pinyinResult = null;

      // Try accurate client-side pinyin library first
      if (getUnicodeInfo(char).isChineseChar) {
        pinyinResult = getClientSidePinyinAccurate(char);
        if (pinyinResult) {
          console.log('Using pinyin library for', char, ':', pinyinResult);
        }
      }

      // If library failed, check our fallback map
      if (!pinyinResult && fallbackPinyinMap[char]) {
        pinyinResult = fallbackPinyinMap[char];
        console.log('Using fallback pinyin for', char, ':', pinyinResult);
      }

      // If still no pinyin, try basic client-side generation
      if (!pinyinResult && getUnicodeInfo(char).isChineseChar) {
        pinyinResult = getClientSidePinyin(char);
        if (pinyinResult && pinyinResult !== char && !pinyinResult.startsWith('u')) {
          console.log('Using approximated pinyin for', char, ':', pinyinResult);
        } else {
          pinyinResult = null; // All methods failed
        }
      }

      // Final fallback - bracket notation for unknown characters
      if (!pinyinResult) {
        pinyinResult = getUnicodeInfo(char).isChineseChar ? `[${char}]` : char;
        console.warn('No pinyin found for character:', char, 'using bracket notation:', pinyinResult);
      }

      // Store result in database
      try {
        await db.storeCharacter(char, {
          pinyin: pinyinResult,
          translation: fallbackTranslationMap[char] || char
        });
      } catch (dbError) {
        console.warn('Failed to store character:', dbError);
      }

      return pinyinResult;
    }));
    
    const result = pinyinResults.join(' ');
    console.log('Final pinyin result for', text, ':', result);
    
    return result;
  } catch (error) {
    console.error('Error getting pinyin:', error);
    // Final fallback to character-by-character lookup
    return text.split('').map(char => fallbackPinyinMap[char] || char).join(' ');
  }
};

// Detect if text is Chinese or English
const detectLanguage = (text) => {
  // Check if text contains Chinese characters
  const chineseRegex = /[\u4e00-\u9fff]/;
  return chineseRegex.test(text) ? 'chinese' : 'english';
};

// Get English translation for Chinese text with database caching
const getTranslation = async (text, forceRefresh = false) => {
  try {
    // Check database cache first (unless forced refresh)
    if (!forceRefresh) {
      const cachedData = await db.getPhrase(text);
      if (cachedData && cachedData.translation) {
        console.log('Using cached translation for:', text);
        return cachedData.translation;
      }
    }
    
    let translation = null;
    
    // Check fallback phrases first
    if (fallbackPhraseTranslations[text]) {
      translation = fallbackPhraseTranslations[text];
    } else {
      // Use free translation API
      try {
        const response = await fetch(
          `${PINYIN_API_URL}?q=${encodeURIComponent(text)}&langpair=zh-CN|en-US`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.responseData && data.responseData.translatedText) {
            translation = data.responseData.translatedText;
          }
        }
      } catch (apiError) {
        console.warn('Translation API failed:', apiError);
      }
      
      // Fallback to character-by-character if API failed
      if (!translation) {
        translation = text.split('').map(char => fallbackTranslationMap[char] || char).join(' ');
      }
    }
    
    // Store in database for future use (without circular dependency)
    try {
      await db.storePhrase(text, {
        chineseText: text,
        pinyin: text.split('').map(char => fallbackPinyinMap[char] || char).join(' '),
        translation: translation,
        characters: []
      });
    } catch (dbError) {
      console.warn('Failed to store phrase in database:', dbError);
    }
    
    return translation;
  } catch (error) {
    console.error('Error getting translation:', error);
    // Final fallback
    if (fallbackPhraseTranslations[text]) {
      return fallbackPhraseTranslations[text];
    }
    return text.split('').map(char => fallbackTranslationMap[char] || char).join(' ');
  }
};

// Get Chinese translation for English text with database caching
const getChineseTranslation = async (englishText, forceRefresh = false) => {
  try {
    // Check database cache first (unless forced refresh)
    if (!forceRefresh) {
      const cachedData = await db.getPhrase(englishText);
      if (cachedData && cachedData.chineseText && cachedData.chineseText !== englishText) {
        console.log('Using cached Chinese translation for:', englishText);
        return cachedData.chineseText;
      }
    }
    
    let chineseText = null;
    
    // Fallback to reverse lookup in phrase translations first
    const englishLower = englishText.toLowerCase();
    for (const [chinese, english] of Object.entries(fallbackPhraseTranslations)) {
      if (english.toLowerCase() === englishLower) {
        chineseText = chinese;
        break;
      }
    }
    
    // If no fallback found, try API
    if (!chineseText) {
      try {
        const response = await fetch(
          `${PINYIN_API_URL}?q=${encodeURIComponent(englishText)}&langpair=en-US|zh-CN`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.responseData && data.responseData.translatedText) {
            chineseText = data.responseData.translatedText;
          }
        }
      } catch (apiError) {
        console.warn('English to Chinese API failed:', apiError);
      }
    }
    
    // If still no translation, return original
    if (!chineseText) {
      chineseText = englishText;
    }
    
    // Store in database for future use (without circular dependency)
    try {
      await db.storePhrase(englishText, {
        chineseText: chineseText,
        pinyin: chineseText.split('').map(char => fallbackPinyinMap[char] || char).join(' '),
        translation: englishText,
        originalEnglish: englishText,
        characters: []
      });
    } catch (dbError) {
      console.warn('Failed to store English phrase in database:', dbError);
    }
    
    return chineseText;
  } catch (error) {
    console.error('Error getting Chinese translation:', error);
    return englishText;
  }
};

// Generate image using DALL-E API with database caching
const generateImage = async (character, englishMeaning, forceRefresh = false) => {
  try {
    const imageKey = `${character}-${englishMeaning}`;
    
    // Check database cache first (unless forced refresh)
    if (!forceRefresh) {
      const cachedImage = await db.getImage(imageKey);
      if (cachedImage && cachedImage.url) {
        console.log('Using cached image for:', character);
        return cachedImage.url;
      }
    }
    
    // Create prompt based on English meaning, not Chinese character
    let prompt;
    if (imagePrompts[character]) {
      prompt = imagePrompts[character];
    } else {
      // Use English meaning to create educational image
      prompt = `A simple, clear illustration of ${englishMeaning}, educational style, bright colors, minimalist design, no text, visual concept only`;
    }
    
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
      console.warn('OpenAI API key not configured, using placeholder');
      return null;
    }
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "natural"
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate image');
    }
    
    const data = await response.json();
    const imageUrl = data.data[0].url;
    
    // Store in database for future use
    await db.storeImage(imageKey, imageUrl, `Visual concept for: ${englishMeaning}`);
    
    return imageUrl;
  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
};

const ChineseLearningApp = () => {
  const [input, setInput] = useState('');
  const [currentText, setCurrentText] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [translation, setTranslation] = useState('');
  const [characters, setCharacters] = useState([]);
  const [inputLanguage, setInputLanguage] = useState('chinese');
  const [originalInput, setOriginalInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCharIndex, setCurrentCharIndex] = useState(-1);
  const [showTranslation, setShowTranslation] = useState(true);
  const [currentImage, setCurrentImage] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [playbackSpeed, setPlaybackSpeed] = useState(0.3);
  const [favorites, setFavorites] = useState([]);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageCache, setImageCache] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);
  
  const audioRef = useRef(null);
  const timeoutRef = useRef(null);
  const isPlayingRef = useRef(false);

  // Initialize database on component mount
  useEffect(() => {
    const initDB = async () => {
      try {
        await db.init();
        setDbInitialized(true);
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    
    initDB();
  }, []);

  // Process input text - handles both Chinese and English with database
  const processText = async (text, forceRefresh = false) => {
    const language = detectLanguage(text);
    console.log('Detected language:', language, 'for text:', text);
    
    try {
      // Check database cache first (unless forced refresh)
      if (!forceRefresh && dbInitialized) {
        const cachedData = await db.getPhrase(text);
        if (cachedData) {
          console.log('Using cached phrase data for:', text);
          return cachedData;
        }
      }
      
      if (language === 'english') {
        // English input: translate to Chinese first
        console.log('Processing English input:', text);
        const chineseText = await getChineseTranslation(text, forceRefresh);
        console.log('Got Chinese translation:', chineseText);
        
        // Now process the Chinese text
        const [pinyinResult, translationResult] = await Promise.all([
          getPinyin(chineseText, forceRefresh),
          getTranslation(chineseText, forceRefresh) // This should return the original English or refined translation
        ]);
        
        // Get individual character data
        const characters = chineseText.split('');
        const characterData = await Promise.all(characters.map(async (char) => {
          const charPinyin = await getPinyin(char, forceRefresh);
          const charTranslation = await getTranslation(char, forceRefresh);
          return {
            char,
            pinyin: charPinyin,
            translation: charTranslation
          };
        }));
        
        const result = { 
          chineseText,
          pinyin: pinyinResult, 
          translation: text, // Keep original English as the translation
          characters: characterData,
          originalEnglish: text
        };
        
        // Store complete result in database
        try {
          if (dbInitialized) {
            await db.storePhrase(text, result);
          }
        } catch (dbError) {
          console.warn('Failed to store result in database:', dbError);
        }
        
        return result;
        
      } else {
        // Chinese input: get pinyin and English translation
        console.log('Processing Chinese input:', text);
        const [pinyinResult, translationResult] = await Promise.all([
          getPinyin(text, forceRefresh),
          getTranslation(text, forceRefresh)
        ]);
        
        // Get individual character data
        const characters = text.split('');
        const characterData = await Promise.all(characters.map(async (char) => {
          const charPinyin = await getPinyin(char, forceRefresh);
          const charTranslation = await getTranslation(char, forceRefresh);
          return {
            char,
            pinyin: charPinyin,
            translation: charTranslation
          };
        }));
        
        const result = { 
          chineseText: text,
          pinyin: pinyinResult, 
          translation: translationResult,
          characters: characterData
        };
        
        // Store complete result in database
        try {
          if (dbInitialized) {
            await db.storePhrase(text, result);
          }
        } catch (dbError) {
          console.warn('Failed to store result in database:', dbError);
        }
        
        return result;
      }
    } catch (error) {
      console.error('Error processing text:', error);
      
      // Fallback handling
      if (language === 'english') {
        // For English fallback, just return the input as is
        return {
          chineseText: text,
          pinyin: text,
          translation: text,
          characters: [{
            char: text,
            pinyin: text,
            translation: text
          }],
          originalEnglish: text
        };
      } else {
        // Chinese fallback
        const characters = text.split('');
        const pinyinResult = characters.map(char => fallbackPinyinMap[char] || char).join(' ');
        
        let translationResult = '';
        if (fallbackPhraseTranslations[text]) {
          translationResult = fallbackPhraseTranslations[text];
        } else {
          translationResult = characters.map(char => fallbackTranslationMap[char] || char).join(' ');
        }
        
        const characterData = characters.map(char => ({
          char,
          pinyin: fallbackPinyinMap[char] || char,
          translation: fallbackTranslationMap[char] || char
        }));
        
        return { 
          chineseText: text,
          pinyin: pinyinResult, 
          translation: translationResult,
          characters: characterData
        };
      }
    }
  };

  // Handle text submission
  const handleSubmit = async (forceRefresh = false) => {
    if (!input.trim()) return;
    
    if (forceRefresh) {
      setIsRefreshing(true);
    }
    
    try {
      const detectedLanguage = detectLanguage(input);
      setInputLanguage(detectedLanguage);
      setOriginalInput(input);
      
      const { chineseText, pinyin: pinyinResult, translation: translationResult, characters: characterData } = await processText(input, forceRefresh);
      
      // Set the Chinese text as the current text (what we'll speak)
      setCurrentText(chineseText);
      setPinyin(pinyinResult);
      setTranslation(translationResult);
      setCharacters(characterData);
      setCurrentCharIndex(-1);
      setCurrentImage('');
    } catch (error) {
      console.error('Error submitting text:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    if (input.trim()) {
      handleSubmit(true);
    }
  };

  // Synchronized character-by-character pronunciation with images
  const handlePlay = async () => {
    if (!currentText) return;
    
    setIsPlaying(true);
    isPlayingRef.current = true;
    setCurrentCharIndex(-1);
    setCurrentImage('');
    setCurrentImageUrl('');
    
    const characters = currentText.split('');
    console.log('Starting playback for characters:', characters);
    
    try {
      // Process each character synchronously - wait for image before speaking
      for (let index = 0; index < characters.length; index++) {
        if (!isPlayingRef.current) {
          console.log('Playback stopped at index', index);
          break;
        }
        
        const char = characters[index];
        console.log('Processing character:', char, 'at index', index);
        setCurrentCharIndex(index);
        
        // First, ensure we have the image ready
        await prepareCharacterImage(char, index);
        
        // Then speak the character with proper timing
        await speakCharacter(char);
        
        // Pause between characters for comprehension
        if (isPlayingRef.current) {
          await new Promise(resolve => setTimeout(resolve, 500 / playbackSpeed));
        }
      }
      
      // Final pause to let user absorb the last character
      if (isPlayingRef.current) {
        await new Promise(resolve => setTimeout(resolve, 1000 / playbackSpeed));
      }
    } catch (error) {
      console.error('Error during playback:', error);
    } finally {
      // Clean up
      setIsPlaying(false);
      isPlayingRef.current = false;
      setCurrentCharIndex(-1);
      setCurrentImage('');
      setCurrentImageUrl('');
      console.log('Playback finished');
    }
  };

  // Prepare image for a character (wait for generation if needed)
  const prepareCharacterImage = async (char, charIndex) => {
    setGeneratingImage(true);
    
    // Get the character data
    const charData = characters[charIndex];
    const englishMeaning = charData?.translation || char;
    
    // Check database cache first
    const imageKey = `${char}-${englishMeaning}`;
    const cachedImage = await db.getImage(imageKey);
    
    if (cachedImage && cachedImage.url) {
      setCurrentImageUrl(cachedImage.url);
      setCurrentImage(cachedImage.description);
      setGeneratingImage(false);
      return;
    }
    
    // Check memory cache (legacy)
    if (imageCache[char]) {
      setCurrentImageUrl(imageCache[char]);
      setCurrentImage(`Visual concept for: ${englishMeaning}`);
      setGeneratingImage(false);
      return;
    }
    
    // Try to generate new image based on English meaning
    try {
      const imageUrl = await generateImage(char, englishMeaning);
      if (imageUrl) {
        setCurrentImageUrl(imageUrl);
        setCurrentImage(`Visual concept for: ${englishMeaning}`);
        // Cache the image in memory as well
        setImageCache(prev => ({...prev, [char]: imageUrl}));
      } else {
        // Fallback: Create a simple colored placeholder with better encoding
        const fallbackUrl = `data:image/svg+xml;base64,${btoa(`
          <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="400" fill="#4F46E5"/>
            <text x="200" y="200" font-family="Arial, sans-serif" font-size="120" fill="white" 
                  text-anchor="middle" dominant-baseline="middle">${char}</text>
          </svg>
        `)}`;
        setCurrentImageUrl(fallbackUrl);
        setCurrentImage(`Character: ${char} (${englishMeaning})`);
      }
    } catch (error) {
      console.error('Error generating image for', char, error);
      
      // Better fallback using SVG data URL
      const fallbackUrl = `data:image/svg+xml;base64,${btoa(`
        <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="400" fill="#6366F1"/>
          <text x="200" y="200" font-family="Arial, sans-serif" font-size="120" fill="white" 
                text-anchor="middle" dominant-baseline="middle">${char}</text>
        </svg>
      `)}`;
      setCurrentImageUrl(fallbackUrl);
      setCurrentImage(`Character: ${char} (${englishMeaning})`);
    }
    
    setGeneratingImage(false);
  };
  
  // Speak individual character with proper timing
  const speakCharacter = async (char) => {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(char);
        utterance.lang = 'zh-CN';
        utterance.rate = Math.max(0.1, playbackSpeed * 0.8); // Even slower for individual chars
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onend = () => {
          // Add extra pause after each character for absorption
          setTimeout(resolve, 800 / playbackSpeed);
        };
        
        utterance.onerror = () => {
          setTimeout(resolve, 1000 / playbackSpeed); // Fallback timing
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        // Fallback without TTS - just wait
        setTimeout(resolve, 1500 / playbackSpeed);
      }
    });
  };

  const handlePause = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    window.speechSynthesis.cancel();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setCurrentCharIndex(-1);
    setCurrentImage('');
    setCurrentImageUrl('');
    setGeneratingImage(false);
  };

  const toggleFavorite = () => {
    if (favorites.includes(currentText)) {
      setFavorites(favorites.filter(item => item !== currentText));
    } else {
      setFavorites([...favorites, currentText]);
    }
  };

  // Example texts for quick testing - both Chinese and English
  const exampleTexts = [
    '你好', '我爱你', '中国人', '老师', '学生', '朋友',
    'hello', 'thank you', 'goodbye', 'what time is it', 'how are you', 'I love you'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-yellow-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-800 mb-2">汉语学习 Chinese Visual Learning</h1>
          <p className="text-gray-600">Learn Chinese through direct visual-audio association</p>
        </header>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter Chinese characters or English words (e.g., 你好 or hello)"
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg text-lg focus:border-red-400 focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button
              onClick={() => handleSubmit(false)}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              Analyze
            </button>
            <button
              onClick={handleRefresh}
              disabled={!input.trim() || isRefreshing}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 flex items-center gap-2"
              title="Refresh - fetch new translations and images"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          
          {/* Example texts */}
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Try these examples (Chinese or English):</p>
            <div className="flex flex-wrap gap-2">
              {exampleTexts.slice(0, 6).map((text) => (
                <button
                  key={text}
                  onClick={() => setInput(text)}
                  className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded-full text-sm transition-colors"
                >
                  {text}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {exampleTexts.slice(6).map((text) => (
                <button
                  key={text}
                  onClick={() => setInput(text)}
                  className="px-3 py-1 bg-green-100 hover:bg-green-200 rounded-full text-sm transition-colors"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Section */}
        {currentText && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Results</h2>
                {originalInput && originalInput !== currentText && (
                  <p className="text-sm text-gray-500 mt-1">
                    {inputLanguage === 'english' ? 'English → Chinese' : 'Chinese → English'}: "{originalInput}"
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggleFavorite}
                  className={`p-2 rounded-lg transition-colors ${
                    favorites.includes(currentText) ? 'text-red-600 bg-red-100' : 'text-gray-400 hover:text-red-600'
                  }`}
                >
                  <Heart className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowTranslation(!showTranslation)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                >
                  {showTranslation ? 'Hide' : 'Show'} Translation
                </button>
              </div>
            </div>
            
            {/* Chinese Characters with Individual Pinyin */}
            <div className="text-center mb-6">
              <div className="flex justify-center items-start gap-4 mb-4">
                {characters.map((charData, index) => (
                  <div
                    key={index}
                    className={`text-center transition-all duration-300 ${
                      currentCharIndex === index 
                        ? 'transform scale-110' 
                        : ''
                    }`}
                  >
                    {/* Individual Character */}
                    <div className={`text-6xl font-bold mb-2 px-2 py-1 rounded-lg ${
                      currentCharIndex === index 
                        ? 'text-red-600 bg-red-100' 
                        : 'text-gray-800'
                    }`}>
                      {charData.char}
                    </div>
                    
                    {/* Individual Pinyin */}
                    <div className={`text-lg font-mono mb-1 ${
                      currentCharIndex === index 
                        ? 'text-red-500 font-bold' 
                        : 'text-gray-600'
                    }`}>
                      {charData.pinyin}
                    </div>
                    
                    {/* Individual Translation */}
                    {showTranslation && (
                      <div className={`text-sm ${
                        currentCharIndex === index 
                          ? 'text-red-400 font-medium' 
                          : 'text-gray-400'
                      }`}>
                        {charData.translation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Full Phrase Translation */}
              {showTranslation && (
                <div className="text-xl text-gray-500 italic mt-4 pt-4 border-t">
                  <span className="text-sm text-gray-400 block mb-1">Full phrase:</span>
                  {translation}
                </div>
              )}
            </div>

            {/* Audio Controls */}
            <div className="flex justify-center items-center gap-4 mb-6">
              <button
                onClick={isPlaying ? handlePause : handlePlay}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                  isPlaying 
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {isPlaying ? 'Pause' : 'Play & Learn'}
              </button>
              
              <button
                onClick={handlePlay}
                className="p-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                title="Replay"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value={0.1}>Ultra Slow (0.1x)</option>
                <option value={0.2}>Very Slow (0.2x)</option>
                <option value={0.3}>Slow (0.3x) - Default</option>
                <option value={0.5}>Medium (0.5x)</option>
                <option value={0.7}>Normal (0.7x)</option>
                <option value={1.0}>Fast (1.0x)</option>
              </select>
            </div>
          </div>
        )}

        {/* Visual Learning Section */}
        {(currentImage || generatingImage) && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">Visual Association</h3>
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-6 mb-4">
                <div className="relative w-80 h-80 mx-auto mb-4 bg-gray-200 rounded-lg overflow-hidden shadow-lg">
                  {generatingImage ? (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-purple-400 to-blue-400">
                      <div className="text-center text-white">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-lg font-medium">Generating image...</p>
                        <p className="text-sm opacity-80">Creating visual for: {currentText[currentCharIndex]}</p>
                      </div>
                    </div>
                  ) : currentImageUrl ? (
                    <img
                      src={currentImageUrl}
                      alt={currentImage}
                      className="w-full h-full object-cover transition-all duration-700 hover:scale-105"
                      onError={(e) => {
                        e.target.src = `https://via.placeholder.com/400x400/4F46E5/ffffff?text=${encodeURIComponent(currentText[currentCharIndex] || '?')}`;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300">
                      <span className="text-4xl text-gray-600">🖼️</span>
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-3">
                    <p className="text-sm font-medium">{currentImage}</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-gray-700 font-medium text-lg mb-2">
                    Current Character: <span className="text-3xl text-red-600 font-bold">{currentText[currentCharIndex]}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    {generatingImage ? 'AI is creating a custom image for this character...' : 'Associate this image with the sound you\'re hearing'}
                  </p>
                  {currentImageUrl && !generatingImage && (
                    <p className="text-xs text-green-600 mt-2">✨ Generated by DALL-E 3</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Learning Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Learning Progress</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{characters.length}</div>
              <div className="text-sm text-gray-600">Characters Studied</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{favorites.length}</div>
              <div className="text-sm text-gray-600">Favorites</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">Direct</div>
              <div className="text-sm text-gray-600">Learning Method</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className={`text-2xl font-bold ${dbInitialized ? 'text-orange-600' : 'text-gray-400'}`}>
                {dbInitialized ? '💾' : '⏳'}
              </div>
              <div className="text-sm text-gray-600">
                {dbInitialized ? 'Database Ready' : 'Loading...'}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-gray-600 text-sm space-y-2">
          <p>💡 Enter Chinese characters above to see pinyin, translation, and hear pronunciation</p>
          <p>🎯 Focus on the AI-generated images during audio playbook to build direct associations</p>
          <p>🤖 <strong>Setup Required:</strong> Replace 'your-openai-api-key-here' in the code with your OpenAI API key</p>
          <p>🔑 Get your API key at: <a href="https://platform.openai.com/api-keys" target="_blank" className="text-blue-600 hover:underline">platform.openai.com/api-keys</a></p>
        </div>
      </div>
    </div>
  );
};

export default ChineseLearningApp;