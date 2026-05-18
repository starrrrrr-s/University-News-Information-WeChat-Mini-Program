const WebScraper = require('../services/webScraper');
const AIService = require('../services/aiService');
const TTSService = require('../services/ttsService');
const { success, error } = require('../utils/response');

const extractNewsContent = async (req, res) => {
  try {
    const { url, newsId } = req.body;
    
    if (!url) {
      return error(res, '缺少URL参数');
    }

    let pageTitle = '';
    let pageContent = '';
    
    const scrapeResult = await WebScraper.fetchContent(url);
    
    if (scrapeResult.success) {
      pageTitle = scrapeResult.title;
      pageContent = scrapeResult.content;
    }
    
    const aiResult = await AIService.extractKeyPoints(pageTitle, pageContent);
    
    if (!aiResult.success) {
      return error(res, aiResult.error);
    }
    
    return success(res, {
      title: pageTitle,
      content: pageContent,
      keyPoints: aiResult.keyPoints,
      summary: aiResult.summary
    }, '内容提取成功');
  } catch (err) {
    console.error('AI 处理失败:', err);
    return error(res, '处理失败');
  }
};

const textToSpeech = async (req, res) => {
  try {
    const { text, voice = 'Neil' } = req.body;
    
    if (!text) {
      return error(res, '缺少text参数');
    }

    // 支持的音色
    const validVoices = ['Neil', 'Ethan', 'Serena', 'Jada', 'Dylan'];
    const selectedVoice = validVoices.includes(voice) ? voice : 'Neil';

    const ttsResult = await TTSService.textToSpeech(text, { 
      voice: selectedVoice, 
      model: 'qwen-tts-latest'
    });
    
    if (!ttsResult.success) {
      return error(res, ttsResult.error);
    }
    
    return success(res, ttsResult, '语音合成成功');
  } catch (err) {
    console.error('TTS 处理失败:', err);
    return error(res, '处理失败');
  }
};

module.exports = {
  extractNewsContent,
  textToSpeech
};
