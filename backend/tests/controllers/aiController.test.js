jest.mock('../../services/webScraper', () => ({
  fetchContent: jest.fn()
}));

jest.mock('../../services/aiService', () => ({
  extractKeyPoints: jest.fn()
}));

jest.mock('../../services/ttsService', () => ({
  textToSpeech: jest.fn()
}));

const { extractNewsContent, textToSpeech } = require('../../controllers/aiController');
const WebScraper = require('../../services/webScraper');
const AIService = require('../../services/aiService');
const TTSService = require('../../services/ttsService');

describe('AI控制器测试', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = { body: {} };
    mockRes = {};
    mockRes.status = jest.fn(() => mockRes);
    mockRes.json = jest.fn();
    jest.clearAllMocks();
  });

  describe('extractNewsContent', () => {
    test('缺少URL参数应返回错误', async () => {
      mockReq.body = {};

      await extractNewsContent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('正常提取内容应返回成功', async () => {
      mockReq.body = { url: 'http://example.com/news' };
      WebScraper.fetchContent.mockResolvedValue({ success: true, title: '标题', content: '内容' });
      AIService.extractKeyPoints.mockResolvedValue({ success: true, keyPoints: ['要点1'], summary: '摘要' });

      await extractNewsContent(mockReq, mockRes);

      expect(WebScraper.fetchContent).toHaveBeenCalled();
      expect(AIService.extractKeyPoints).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });

    test('WebScraper失败时应继续处理', async () => {
      mockReq.body = { url: 'http://example.com/news' };
      WebScraper.fetchContent.mockResolvedValue({ success: false });
      AIService.extractKeyPoints.mockResolvedValue({ success: true, keyPoints: [], summary: '' });

      await extractNewsContent(mockReq, mockRes);

      expect(AIService.extractKeyPoints).toHaveBeenCalled();
    });

    test('AI服务失败应返回错误', async () => {
      mockReq.body = { url: 'http://example.com/news' };
      WebScraper.fetchContent.mockResolvedValue({ success: true, title: '标题', content: '内容' });
      AIService.extractKeyPoints.mockResolvedValue({ success: false, error: 'AI处理失败' });

      await extractNewsContent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('textToSpeech', () => {
    test('缺少text参数应返回错误', async () => {
      mockReq.body = {};

      await textToSpeech(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('正常语音合成应返回成功', async () => {
      mockReq.body = { text: '测试文本' };
      TTSService.textToSpeech.mockResolvedValue({ success: true, audioUrl: 'http://example.com/audio.mp3' });

      await textToSpeech(mockReq, mockRes);

      expect(TTSService.textToSpeech).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });

    test('使用默认音色', async () => {
      mockReq.body = { text: '测试文本' };
      TTSService.textToSpeech.mockResolvedValue({ success: true });

      await textToSpeech(mockReq, mockRes);

      expect(TTSService.textToSpeech).toHaveBeenCalledWith('测试文本', expect.objectContaining({ voice: 'Neil' }));
    });

    test('使用指定音色', async () => {
      mockReq.body = { text: '测试文本', voice: 'Ethan' };
      TTSService.textToSpeech.mockResolvedValue({ success: true });

      await textToSpeech(mockReq, mockRes);

      expect(TTSService.textToSpeech).toHaveBeenCalledWith('测试文本', expect.objectContaining({ voice: 'Ethan' }));
    });

    test('使用无效音色应使用默认', async () => {
      mockReq.body = { text: '测试文本', voice: 'InvalidVoice' };
      TTSService.textToSpeech.mockResolvedValue({ success: true });

      await textToSpeech(mockReq, mockRes);

      expect(TTSService.textToSpeech).toHaveBeenCalledWith('测试文本', expect.objectContaining({ voice: 'Neil' }));
    });

    test('TTS服务失败应返回错误', async () => {
      mockReq.body = { text: '测试文本' };
      TTSService.textToSpeech.mockResolvedValue({ success: false, error: '服务不可用' });

      await textToSpeech(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});