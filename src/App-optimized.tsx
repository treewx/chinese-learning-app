import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, Settings, Heart, RefreshCw, Zap } from 'lucide-react';
import { api } from './services/api.js';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiStats, setApiStats] = useState({ cached: 0, fresh: 0 });
  
  const audioRef = useRef(null);
  const timeoutRef = useRef(null);
  const isPlayingRef = useRef(false);

  // Process input text using API
  const processText = async (text, forceRefresh = false) => {
    setLoading(true);
    
    try {
      console.log('🚀 Processing text via API:', text);
      
      // Clear cache if forcing refresh
      if (forceRefresh) {
        api.clearCache();
      }
      
      // Get phrase data from API
      const phraseData = await api.getPhrase(text);
      
      // Update stats
      setApiStats(prev => ({
        cached: prev.cached + (phraseData.cached ? 1 : 0),
        fresh: prev.fresh + (phraseData.cached ? 0 : 1)
      }));
      
      console.log('📊 API Response:', {
        cached: phraseData.cached,
        fallback: phraseData.fallback,
        charactersCount: phraseData.characters?.length
      });
      
      return {
        chineseText: phraseData.chinese_text,
        pinyin: phraseData.pinyin,
        translation: phraseData.translation,
        characters: phraseData.characters,
        originalEnglish: phraseData.original_text !== phraseData.chinese_text ? phraseData.original_text : null
      };
      
    } catch (error) {
      console.error('❌ API processing failed:', error);
      
      // Enhanced fallback for offline/error situations
      const isChineseText = /[\u4e00-\u9fff]/.test(text);
      if (isChineseText) {
        const chars = text.split('');
        return {
          chineseText: text,
          pinyin: chars.map(char => char).join(' '), // Simplified fallback
          translation: text,
          characters: chars.map(char => ({
            char,
            pinyin: char,
            translation: char
          }))
        };
      } else {
        return {
          chineseText: text,
          pinyin: text,
          translation: text,
          characters: [{ char: text, pinyin: text, translation: text }]
        };
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle text submission with API
  const handleSubmit = async (forceRefresh = false) => {
    if (!input.trim()) return;
    
    if (forceRefresh) {
      setIsRefreshing(true);
    }
    
    try {
      const detectedLanguage = /[\u4e00-\u9fff]/.test(input) ? 'chinese' : 'english';
      setInputLanguage(detectedLanguage);
      setOriginalInput(input);
      
      const result = await processText(input, forceRefresh);
      
      setCurrentText(result.chineseText);
      setPinyin(result.pinyin);
      setTranslation(result.translation);
      setCharacters(result.characters);
      setCurrentCharIndex(-1);
      setCurrentImage('');
      setCurrentImageUrl('');
      
    } catch (error) {
      console.error('Error submitting text:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Manual refresh
  const handleRefresh = () => {
    if (input.trim()) {
      handleSubmit(true);
    }
  };

  // Optimized image preparation using API
  const prepareCharacterImage = async (char, charIndex) => {
    setGeneratingImage(true);
    
    try {
      const charData = characters[charIndex];
      const englishMeaning = charData?.translation || char;
      
      console.log(`🎨 Getting image for ${char} (${englishMeaning})`);
      
      // Try to get cached image first
      const imageResult = await api.getImage(char, englishMeaning);
      
      if (imageResult.error || imageResult.fallback) {
        console.log('🔄 Generating new image...');
        const generateResult = await api.generateImage(char, englishMeaning);
        
        if (generateResult.error) {
          // Use SVG fallback
          const fallbackUrl = api.getFallbackImageUrl(char, englishMeaning);
          setCurrentImageUrl(fallbackUrl);
          setCurrentImage(`Character: ${char} (${englishMeaning})`);
        } else {
          setCurrentImageUrl(generateResult.image_url);
          setCurrentImage(generateResult.description);
        }
      } else {
        setCurrentImageUrl(imageResult.image_url);
        setCurrentImage(imageResult.description);
      }
      
    } catch (error) {
      console.error('Error preparing image:', error);
      const fallbackUrl = api.getFallbackImageUrl(char, englishMeaning);
      setCurrentImageUrl(fallbackUrl);
      setCurrentImage(`Character: ${char} (${englishMeaning || 'unknown'})`);
    }
    
    setGeneratingImage(false);
  };

  // Enhanced playback with API-optimized images
  const handlePlay = async () => {
    if (!currentText) return;
    
    setIsPlaying(true);
    isPlayingRef.current = true;
    setCurrentCharIndex(-1);
    setCurrentImage('');
    setCurrentImageUrl('');
    
    const chars = currentText.split('');
    console.log('▶️ Starting enhanced playback for:', chars);
    
    try {
      for (let index = 0; index < chars.length; index++) {
        if (!isPlayingRef.current) break;
        
        const char = chars[index];
        setCurrentCharIndex(index);
        
        // Load image and speak in parallel for better performance
        const [imagePromise, speakPromise] = [
          prepareCharacterImage(char, index),
          speakCharacter(char)
        ];
        
        // Wait for both to complete
        await Promise.all([imagePromise, speakPromise]);
        
        // Pause between characters
        if (isPlayingRef.current) {
          await new Promise(resolve => setTimeout(resolve, 500 / playbackSpeed));
        }
      }
      
      // Final pause
      if (isPlayingRef.current) {
        await new Promise(resolve => setTimeout(resolve, 1000 / playbackSpeed));
      }
    } catch (error) {
      console.error('Error during playback:', error);
    } finally {
      setIsPlaying(false);
      isPlayingRef.current = false;
      setCurrentCharIndex(-1);
      setCurrentImage('');
      setCurrentImageUrl('');
    }
  };

  // Optimized speech synthesis
  const speakCharacter = async (char) => {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(char);
        utterance.lang = 'zh-CN';
        utterance.rate = Math.max(0.1, playbackSpeed * 0.8);
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onend = () => {
          setTimeout(resolve, 800 / playbackSpeed);
        };
        
        utterance.onerror = () => {
          setTimeout(resolve, 1000 / playbackSpeed);
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
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

  // Example texts for quick testing
  const exampleTexts = [
    '你好', '我爱你', '中国人', '老师', '学生', '朋友',
    'hello', 'thank you', 'goodbye', 'what time is it', 'how are you', 'I love you'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-yellow-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-800 mb-2">
            汉语学习 Chinese Visual Learning <Zap className="inline w-8 h-8 text-yellow-500" />
          </h1>
          <p className="text-gray-600">Learn Chinese through direct visual-audio association</p>
          <div className="text-sm text-blue-600 mt-2">
            ⚡ Powered by high-performance API | 
            📊 Cache hits: {apiStats.cached} | Fresh: {apiStats.fresh}
          </div>
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
              disabled={loading}
            />
            <button
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:bg-gray-400"
            >
              {loading ? '⏳ Processing...' : '🚀 Analyze'}
            </button>
            <button
              onClick={handleRefresh}
              disabled={!input.trim() || isRefreshing || loading}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 flex items-center gap-2"
              title="Refresh - bypass cache and get fresh data"
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
            
            {/* Chinese Characters Display */}
            <div className="text-center mb-6">
              <div className="flex justify-center items-start gap-4 mb-4">
                {characters.map((charData, index) => (
                  <div
                    key={index}
                    className={`text-center transition-all duration-300 ${
                      currentCharIndex === index ? 'transform scale-110' : ''
                    }`}
                  >
                    <div className={`text-6xl font-bold mb-2 px-2 py-1 rounded-lg ${
                      currentCharIndex === index 
                        ? 'text-red-600 bg-red-100' 
                        : 'text-gray-800'
                    }`}>
                      {charData.char}
                    </div>
                    
                    <div className={`text-lg font-mono mb-1 ${
                      currentCharIndex === index 
                        ? 'text-red-500 font-bold' 
                        : 'text-gray-600'
                    }`}>
                      {charData.pinyin}
                    </div>
                    
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
              
              {/* Full Translation */}
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
                disabled={loading}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400 ${
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
                disabled={loading}
                className="p-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors disabled:bg-gray-400"
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
            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              🎨 AI Visual Association
            </h3>
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-6 mb-4">
                <div className="relative w-80 h-80 mx-auto mb-4 bg-gray-200 rounded-lg overflow-hidden shadow-lg">
                  {generatingImage ? (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-purple-400 to-blue-400">
                      <div className="text-center text-white">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-lg font-medium">⚡ AI Generating Image...</p>
                        <p className="text-sm opacity-80">Visual for: {currentText[currentCharIndex]}</p>
                      </div>
                    </div>
                  ) : currentImageUrl ? (
                    <img
                      src={currentImageUrl}
                      alt={currentImage}
                      className="w-full h-full object-cover transition-all duration-700 hover:scale-105"
                      onError={(e) => {
                        const char = currentText[currentCharIndex] || '?';
                        e.target.src = api.getFallbackImageUrl(char, characters[currentCharIndex]?.translation || char);
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
                    {generatingImage ? '🤖 AI creating custom visual association...' : '💡 Connect this image with the sound you hear'}
                  </p>
                  {currentImageUrl && !generatingImage && (
                    <p className="text-xs text-green-600 mt-2">✨ Generated by DALL-E 3 via API</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Learning Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">⚡ Performance Dashboard</h3>
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
              <div className="text-2xl font-bold text-purple-600">{apiStats.cached}</div>
              <div className="text-sm text-gray-600">Cache Hits</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {loading ? '⏳' : '🚀'}
              </div>
              <div className="text-sm text-gray-600">
                {loading ? 'Processing...' : 'API Ready'}
              </div>
            </div>
          </div>
          
          {/* API Stats */}
          <div className="mt-4 text-center text-xs text-gray-500">
            🔥 Optimized with server-side caching & PostgreSQL database
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-gray-600 text-sm space-y-2">
          <p>⚡ Now powered by high-performance API with database caching</p>
          <p>🎯 Focus on AI-generated images during playback for direct learning</p>
          <p>🗄️ All translations cached in PostgreSQL for instant responses</p>
        </div>
      </div>
    </div>
  );
};

export default ChineseLearningApp;