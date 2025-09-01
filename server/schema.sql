-- Chinese Learning App Database Schema
-- Optimized for fast lookups and caching

-- Characters table - individual Chinese characters with their data
CREATE TABLE IF NOT EXISTS characters (
    id SERIAL PRIMARY KEY,
    char VARCHAR(10) UNIQUE NOT NULL,
    pinyin VARCHAR(50),
    translation TEXT,
    unicode_point INTEGER,
    frequency_rank INTEGER, -- for prioritizing common characters
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Phrases table - complete phrases/sentences
CREATE TABLE IF NOT EXISTS phrases (
    id SERIAL PRIMARY KEY,
    original_text TEXT NOT NULL,
    chinese_text TEXT,
    pinyin TEXT,
    translation TEXT,
    language VARCHAR(10) NOT NULL, -- 'chinese' or 'english'
    character_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(original_text, language)
);

-- Images table - AI generated images for characters
CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    char VARCHAR(10),
    english_meaning TEXT,
    image_key VARCHAR(200) UNIQUE NOT NULL,
    image_url TEXT,
    image_data BYTEA, -- store image binary data for faster loading
    description TEXT,
    generation_prompt TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Phrase characters mapping - for character breakdown
CREATE TABLE IF NOT EXISTS phrase_characters (
    id SERIAL PRIMARY KEY,
    phrase_id INTEGER REFERENCES phrases(id) ON DELETE CASCADE,
    character_id INTEGER REFERENCES characters(id),
    position INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audio cache - TTS audio data
CREATE TABLE IF NOT EXISTS audio_cache (
    id SERIAL PRIMARY KEY,
    text TEXT UNIQUE NOT NULL,
    audio_data BYTEA,
    format VARCHAR(10) DEFAULT 'mp3',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_characters_char ON characters(char);
CREATE INDEX IF NOT EXISTS idx_characters_frequency ON characters(frequency_rank);
CREATE INDEX IF NOT EXISTS idx_phrases_original_text ON phrases(original_text);
CREATE INDEX IF NOT EXISTS idx_phrases_chinese_text ON phrases(chinese_text);
CREATE INDEX IF NOT EXISTS idx_phrases_language ON phrases(language);
CREATE INDEX IF NOT EXISTS idx_images_char ON images(char);
CREATE INDEX IF NOT EXISTS idx_images_key ON images(image_key);
CREATE INDEX IF NOT EXISTS idx_phrase_characters_phrase_id ON phrase_characters(phrase_id);
CREATE INDEX IF NOT EXISTS idx_audio_cache_text ON audio_cache(text);

-- Insert common characters with frequency rankings (top 100 most used)
INSERT INTO characters (char, pinyin, translation, frequency_rank) VALUES
('的', 'de', 'possessive particle', 1),
('一', 'yī', 'one', 2),
('是', 'shì', 'to be', 3),
('不', 'bù', 'not', 4),
('了', 'le', 'completed action', 5),
('人', 'rén', 'person', 6),
('我', 'wǒ', 'I/me', 7),
('在', 'zài', 'at/in', 8),
('有', 'yǒu', 'to have', 9),
('他', 'tā', 'he/him', 10),
('这', 'zhè', 'this', 11),
('中', 'zhōng', 'middle/center', 12),
('大', 'dà', 'big/large', 13),
('为', 'wèi', 'for/because of', 14),
('上', 'shàng', 'up/above', 15),
('个', 'gè', 'classifier', 16),
('国', 'guó', 'country', 17),
('我', 'wǒ', 'I/me', 18),
('以', 'yǐ', 'with/by means of', 19),
('要', 'yào', 'to want/need', 20),
('他', 'tā', 'he/him', 21),
('时', 'shí', 'time', 22),
('来', 'lái', 'to come', 23),
('用', 'yòng', 'to use', 24),
('们', 'men', 'plural marker', 25),
('生', 'shēng', 'to be born/life', 26),
('到', 'dào', 'to arrive', 27),
('作', 'zuò', 'to do/work', 28),
('地', 'dì', 'earth/ground', 29),
('于', 'yú', 'at/in/on', 30),
('出', 'chū', 'to go out', 31),
('就', 'jiù', 'then/just', 32),
('分', 'fēn', 'to divide/minute', 33),
('对', 'duì', 'correct/toward', 34),
('成', 'chéng', 'to become', 35),
('会', 'huì', 'can/meeting', 36),
('可', 'kě', 'can/may', 37),
('主', 'zhǔ', 'main/owner', 38),
('发', 'fā', 'to send/emit', 39),
('年', 'nián', 'year', 40),
('动', 'dòng', 'to move', 41),
('同', 'tóng', 'same/together', 42),
('工', 'gōng', 'work/worker', 43),
('也', 'yě', 'also', 44),
('能', 'néng', 'can/able', 45),
('下', 'xià', 'down/below', 46),
('过', 'guò', 'to pass/through', 47),
('子', 'zǐ', 'child/son', 48),
('说', 'shuō', 'to say/speak', 49),
('产', 'chǎn', 'to produce', 50)
ON CONFLICT (char) DO NOTHING;

-- Insert common phrase translations
INSERT INTO phrases (original_text, chinese_text, pinyin, translation, language) VALUES
('hello', '你好', 'nǐ hǎo', 'hello', 'english'),
('thank you', '谢谢', 'xiè xiè', 'thank you', 'english'),
('goodbye', '再见', 'zài jiàn', 'goodbye', 'english'),
('yes', '是', 'shì', 'yes', 'english'),
('no', '不', 'bù', 'no', 'english'),
('I love you', '我爱你', 'wǒ ài nǐ', 'I love you', 'english'),
('how are you', '你好吗', 'nǐ hǎo ma', 'how are you', 'english'),
('what time is it', '现在几点', 'xiàn zài jǐ diǎn', 'what time is it', 'english'),
('你好', '你好', 'nǐ hǎo', 'hello', 'chinese'),
('谢谢', '谢谢', 'xiè xiè', 'thank you', 'chinese'),
('再见', '再见', 'zài jiàn', 'goodbye', 'chinese'),
('我爱你', '我爱你', 'wǒ ài nǐ', 'I love you', 'chinese'),
('你好吗', '你好吗', 'nǐ hǎo ma', 'how are you', 'chinese')
ON CONFLICT (original_text, language) DO NOTHING;