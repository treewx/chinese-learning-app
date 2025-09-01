import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';
import pg from 'pg';
import pinyin from 'pinyin';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// In-memory cache for ultra-fast responses (1 hour TTL)
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://chinese-learning-app-production.up.railway.app'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use(limiter);

// Fallback data for offline/fast responses
const fallbackPinyinMap = {
  '你': 'nǐ', '好': 'hǎo', '我': 'wǒ', '是': 'shì', '爱': 'ài',
  '中': 'zhōng', '国': 'guó', '人': 'rén', '大': 'dà', '小': 'xiǎo',
  '吃': 'chī', '饭': 'fàn', '水': 'shuǐ', '茶': 'chá', '书': 'shū',
  '学': 'xué', '生': 'shēng', '老': 'lǎo', '师': 'shī', '家': 'jiā',
  '朋': 'péng', '友': 'yǒu', '高': 'gāo', '兴': 'xìng', '见': 'jiàn',
  '面': 'miàn', '谢': 'xiè', '再': 'zài', '狗': 'gǒu', '猫': 'māo'
};

const fallbackTranslationMap = {
  '你': 'you', '好': 'good/well', '我': 'I/me', '是': 'am/is/are', '爱': 'love',
  '中': 'middle/center', '国': 'country', '人': 'person', '大': 'big', '小': 'small',
  '吃': 'eat', '饭': 'rice/meal', '水': 'water', '茶': 'tea', '书': 'book',
  '学': 'study/learn', '生': 'life/birth', '老': 'old', '师': 'teacher', '家': 'home/family',
  '朋': 'friend', '友': 'friend', '高': 'tall/high', '兴': 'interest/excited', '见': 'see/meet',
  '面': 'face/surface', '谢': 'thank', '再': 'again', '狗': 'dog', '猫': 'cat'
};

// Utility functions
const isChineseChar = (char) => {
  const codePoint = char.codePointAt(0);
  return codePoint >= 0x4E00 && codePoint <= 0x9FFF;
};

const detectLanguage = (text) => {
  return /[\u4e00-\u9fff]/.test(text) ? 'chinese' : 'english';
};

// Get pinyin for character with fallback
const getPinyinForChar = (char) => {
  try {
    const result = pinyin(char, { style: pinyin.STYLE_TONE, segment: false });
    if (result && result.length > 0 && result[0].length > 0) {
      return result[0][0];
    }
  } catch (error) {
    console.warn('Pinyin library failed for', char, error);
  }
  return fallbackPinyinMap[char] || (isChineseChar(char) ? `[${char}]` : char);
};

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get character data with caching
app.get('/api/character/:char', async (req, res) => {
  try {
    const { char } = req.params;
    const cacheKey = `char_${char}`;
    
    // Check cache first
    let cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }
    
    // Check database
    const dbResult = await pool.query(
      'SELECT * FROM characters WHERE char = $1',
      [char]
    );
    
    let charData;
    if (dbResult.rows.length > 0) {
      charData = dbResult.rows[0];
    } else {
      // Generate new character data
      const pinyin = getPinyinForChar(char);
      const translation = fallbackTranslationMap[char] || char;
      
      // Insert into database
      const insertResult = await pool.query(`
        INSERT INTO characters (char, pinyin, translation, unicode_point) 
        VALUES ($1, $2, $3, $4) 
        ON CONFLICT (char) DO UPDATE SET 
          pinyin = EXCLUDED.pinyin,
          translation = EXCLUDED.translation,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [char, pinyin, translation, char.codePointAt(0)]);
      
      charData = insertResult.rows[0];
    }
    
    // Cache for future requests
    cache.set(cacheKey, charData, 7200); // 2 hours
    
    res.json({ ...charData, cached: false });
  } catch (error) {
    console.error('Error fetching character:', error);
    
    // Fallback response
    const char = req.params.char;
    res.json({
      char,
      pinyin: fallbackPinyinMap[char] || char,
      translation: fallbackTranslationMap[char] || char,
      cached: false,
      fallback: true
    });
  }
});

// Get phrase data with caching
app.get('/api/phrase/:text', async (req, res) => {
  try {
    const { text } = req.params;
    const language = detectLanguage(text);
    const cacheKey = `phrase_${text}_${language}`;
    
    // Check cache first
    let cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }
    
    // Check database
    const dbResult = await pool.query(
      'SELECT * FROM phrases WHERE original_text = $1 AND language = $2',
      [text, language]
    );
    
    let phraseData;
    if (dbResult.rows.length > 0) {
      phraseData = dbResult.rows[0];
      
      // Get character breakdown
      const characters = phraseData.chinese_text.split('');
      const characterData = await Promise.all(
        characters.map(async (char) => {
          const charResult = await pool.query(
            'SELECT * FROM characters WHERE char = $1',
            [char]
          );
          
          if (charResult.rows.length > 0) {
            return charResult.rows[0];
          } else {
            return {
              char,
              pinyin: getPinyinForChar(char),
              translation: fallbackTranslationMap[char] || char
            };
          }
        })
      );
      
      phraseData.characters = characterData;
    } else {
      // Generate new phrase data
      if (language === 'english') {
        // English to Chinese translation would go here
        // For now, return fallback
        phraseData = {
          original_text: text,
          chinese_text: text,
          pinyin: text,
          translation: text,
          language: 'english',
          characters: [{ char: text, pinyin: text, translation: text }]
        };
      } else {
        // Chinese phrase processing
        const characters = text.split('');
        const pinyinParts = characters.map(char => getPinyinForChar(char));
        const translationParts = characters.map(char => fallbackTranslationMap[char] || char);
        
        phraseData = {
          original_text: text,
          chinese_text: text,
          pinyin: pinyinParts.join(' '),
          translation: translationParts.join(' '),
          language: 'chinese',
          characters: characters.map(char => ({
            char,
            pinyin: getPinyinForChar(char),
            translation: fallbackTranslationMap[char] || char
          }))
        };
        
        // Insert into database
        await pool.query(`
          INSERT INTO phrases (original_text, chinese_text, pinyin, translation, language, character_count) 
          VALUES ($1, $2, $3, $4, $5, $6) 
          ON CONFLICT (original_text, language) DO UPDATE SET 
            pinyin = EXCLUDED.pinyin,
            translation = EXCLUDED.translation,
            updated_at = CURRENT_TIMESTAMP
        `, [text, text, phraseData.pinyin, phraseData.translation, 'chinese', characters.length]);
      }
    }
    
    // Cache for future requests
    cache.set(cacheKey, phraseData, 3600); // 1 hour
    
    res.json({ ...phraseData, cached: false });
  } catch (error) {
    console.error('Error fetching phrase:', error);
    
    // Fallback response
    const text = req.params.text;
    const language = detectLanguage(text);
    
    if (language === 'chinese') {
      const characters = text.split('');
      res.json({
        original_text: text,
        chinese_text: text,
        pinyin: characters.map(char => fallbackPinyinMap[char] || char).join(' '),
        translation: characters.map(char => fallbackTranslationMap[char] || char).join(' '),
        language: 'chinese',
        characters: characters.map(char => ({
          char,
          pinyin: fallbackPinyinMap[char] || char,
          translation: fallbackTranslationMap[char] || char
        })),
        cached: false,
        fallback: true
      });
    } else {
      res.json({
        original_text: text,
        chinese_text: text,
        pinyin: text,
        translation: text,
        language: 'english',
        characters: [{ char: text, pinyin: text, translation: text }],
        cached: false,
        fallback: true
      });
    }
  }
});

// Generate and cache image
app.post('/api/image/generate', async (req, res) => {
  try {
    const { char, englishMeaning, prompt } = req.body;
    const imageKey = `${char}-${englishMeaning}`;
    const cacheKey = `image_${imageKey}`;
    
    // Check cache first
    let cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }
    
    // Check database
    const dbResult = await pool.query(
      'SELECT * FROM images WHERE image_key = $1',
      [imageKey]
    );
    
    if (dbResult.rows.length > 0) {
      const imageData = dbResult.rows[0];
      cache.set(cacheKey, imageData, 7200); // Cache for 2 hours
      return res.json({ ...imageData, cached: false });
    }
    
    // Generate new image with OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return res.json({ error: 'OpenAI API key not configured', fallback: true });
    }
    
    const imagePrompt = prompt || `A simple, clear illustration of ${englishMeaning}, educational style, bright colors, minimalist design, no text, visual concept only`;
    
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "natural"
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        timeout: 30000
      }
    );
    
    const imageUrl = openaiResponse.data.data[0].url;
    const description = `Visual concept for: ${englishMeaning}`;
    
    // Store in database
    const insertResult = await pool.query(`
      INSERT INTO images (char, english_meaning, image_key, image_url, description, generation_prompt) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `, [char, englishMeaning, imageKey, imageUrl, description, imagePrompt]);
    
    const imageData = insertResult.rows[0];
    
    // Cache for future requests
    cache.set(cacheKey, imageData, 7200);
    
    res.json({ ...imageData, cached: false });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ 
      error: 'Failed to generate image', 
      fallback: true,
      message: error.message 
    });
  }
});

// Get cached image
app.get('/api/image/:char/:meaning', async (req, res) => {
  try {
    const { char, meaning } = req.params;
    const imageKey = `${char}-${meaning}`;
    const cacheKey = `image_${imageKey}`;
    
    // Check cache first
    let cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }
    
    // Check database
    const dbResult = await pool.query(
      'SELECT * FROM images WHERE image_key = $1',
      [imageKey]
    );
    
    if (dbResult.rows.length > 0) {
      const imageData = dbResult.rows[0];
      cache.set(cacheKey, imageData, 7200);
      res.json({ ...imageData, cached: false });
    } else {
      res.json({ error: 'Image not found', fallback: true });
    }
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

// Batch endpoint for multiple characters (performance optimization)
app.post('/api/characters/batch', async (req, res) => {
  try {
    const { characters } = req.body;
    const results = {};
    
    // Process characters in parallel for speed
    await Promise.all(
      characters.map(async (char) => {
        const cacheKey = `char_${char}`;
        
        // Check cache first
        let cached = cache.get(cacheKey);
        if (cached) {
          results[char] = { ...cached, cached: true };
          return;
        }
        
        // Check database
        const dbResult = await pool.query(
          'SELECT * FROM characters WHERE char = $1',
          [char]
        );
        
        if (dbResult.rows.length > 0) {
          const charData = dbResult.rows[0];
          cache.set(cacheKey, charData, 7200);
          results[char] = { ...charData, cached: false };
        } else {
          // Generate fallback
          const charData = {
            char,
            pinyin: getPinyinForChar(char),
            translation: fallbackTranslationMap[char] || char
          };
          results[char] = { ...charData, cached: false, fallback: true };
        }
      })
    );
    
    res.json(results);
  } catch (error) {
    console.error('Error in batch character fetch:', error);
    res.status(500).json({ error: 'Batch processing failed' });
  }
});

// Cache statistics endpoint
app.get('/api/stats/cache', (req, res) => {
  const stats = cache.getStats();
  res.json({
    ...stats,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Initialize database
const initDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('Database connected successfully');
    
    // Note: In production, you'd run the schema.sql file separately
    // This is just for development
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const startServer = async () => {
  await initDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 Chinese Learning API Server running on port ${PORT}`);
    console.log(`📊 Cache enabled with ${cache.options.stdTTL}s TTL`);
    console.log(`🗄️  Database connected: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
    console.log(`🎨 Image generation: ${process.env.OPENAI_API_KEY ? 'Enabled' : 'Disabled'}`);
  });
};

startServer().catch(console.error);