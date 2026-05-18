const axios = require('axios');

class AIService {
  static MODE = 'real'; // 使用真实 AI
  
  static DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
  static API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
  static MODEL = 'qwen-plus'; // 使用测试成功的 qwen-plus

  static async extractKeyPoints(title, content) {
    if (this.MODE === 'mock') {
      console.log('使用模拟 AI 模式');
      return this.mockAIExtraction(title, content);
    }

    if (this.MODE === 'rule') {
      console.log('使用规则提取模式');
      return this.ruleBasedExtraction(title, content);
    }

    try {
      const aiResult = await this.callDashScopeAPI(title, content);
      if (aiResult.success) {
        return aiResult;
      }
      console.log('AI 调用失败，降级到规则提取:', aiResult.error);
      return this.ruleBasedExtraction(title, content);
    } catch (error) {
      console.error('AI 处理异常，降级到规则提取:', error.message);
      return this.ruleBasedExtraction(title, content);
    }
  }

  static async callDashScopeAPI(title, content) {
    try {
      if (!content || content.length < 50) {
        return {
          success: true,
          keyPoints: [{ type: 'info', text: '内容较短，暂无更多要点' }],
          summary: title || '暂无内容'
        };
      }

      const prompt = this.buildPrompt(title, content);

      console.log('正在调用通义千问 API...');

      const response = await axios.post(
        this.API_URL,
        {
          model: this.MODEL,
          input: {
            messages: [
              {
                role: 'system',
                content: '你是一个专业的新闻摘要助手，擅长提取新闻的核心要点。请严格按照 JSON 格式返回结果。'
              },
              {
                role: 'user',
                content: prompt
              }
            ]
          },
          parameters: {
            result_format: 'message',
            temperature: 0.7,
            max_tokens: 1000
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.DASHSCOPE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 20000
        }
      );

      console.log('通义千问 API 调用成功');

      if (response.data && response.data.output && response.data.output.choices) {
        const aiText = response.data.output.choices[0].message.content;
        const parsedResult = this.parseAIResponse(aiText, title, content);
        return { success: true, ...parsedResult };
      }

      return { success: false, error: 'AI 返回格式错误' };
    } catch (error) {
      console.error('通义千问 API 调用失败:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  static buildPrompt(title, content) {
    return `请分析以下新闻内容，完成两个任务：

1. 生成一段简洁的内容摘要（约100-200字）
2. 提取6个以内的核心要点（时间、地点、人物、事件等）

新闻标题：${title}

新闻内容：
${content.substring(0, 3000)}

请严格按以下 JSON 格式返回结果，不要包含其他文字：
{
  "summary": "这里填写摘要",
  "keyPoints": [
    {"type": "time", "text": "时间：..."},
    {"type": "location", "text": "地点：..."},
    {"type": "person", "text": "人物：..."},
    {"type": "content", "text": "要点内容"}
  ]
}

type 的可选值：time, location, person, content, title, info`;
  }

  static parseAIResponse(aiText, title, originalContent) {
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || title,
          keyPoints: (parsed.keyPoints || []).slice(0, 6)
        };
      }
    } catch (e) {
      console.log('解析 AI JSON 失败，使用规则提取');
    }
    return this.ruleBasedExtraction(title, originalContent);
  }

  static mockAIExtraction(title, content) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const keyPoints = [];
        
        if (title) {
          keyPoints.push({ type: 'title', text: `标题：${title}` });
        }
        
        keyPoints.push({ type: 'info', text: '📌 模拟 AI 要点生成' });
        keyPoints.push({ type: 'content', text: '💡 这是模拟的 AI 要点 1' });
        keyPoints.push({ type: 'content', text: '💡 这是模拟的 AI 要点 2' });

        const summary = `【模拟 AI 摘要】${title || '新闻'} - 这是一段模拟的摘要内容。`;

        resolve({
          success: true,
          keyPoints: keyPoints.slice(0, 6),
          summary
        });
      }, 800);
    });
  }

  static ruleBasedExtraction(title, content) {
    const keyPoints = [];
    const sentences = content.match(/[^。！？!?]+[。！？!?]?/g) || [];
    
    const timePatterns = [/\d{4}年\d{1,2}月\d{1,2}日/g, /\d{4}-\d{1,2}-\d{1,2}/g, /\d{1,2}月\d{1,2}日/g];
    for (const pattern of timePatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        keyPoints.push({ type: 'time', text: `时间：${matches[0]}` });
        break;
      }
    }
    
    const locationKeywords = ['大学', '学院', '图书馆', '报告厅', '会议室', '中心', '馆', '楼', '室'];
    for (const keyword of locationKeywords) {
      const locationPattern = new RegExp(`[^，。,\\s]{2,20}${keyword}`, 'g');
      const matches = content.match(locationPattern);
      if (matches && matches.length > 0) {
        keyPoints.push({ type: 'location', text: `地点：${matches[0]}` });
        break;
      }
    }
    
    const speakerPatterns = [/主讲人[：:]\s*([^，。\s]{2,10})/g, /演讲人[：:]\s*([^，。\s]{2,10})/g];
    for (const pattern of speakerPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        keyPoints.push({ type: 'person', text: matches[0] });
        break;
      }
    }
    
    const importantSentences = sentences.slice(0, 3).filter(s => s.length > 10 && s.length < 100);
    for (const sentence of importantSentences) {
      if (!keyPoints.find(kp => kp.text.includes(sentence.trim()))) {
        keyPoints.push({ type: 'content', text: sentence.trim() });
      }
    }
    
    if (keyPoints.length === 0) {
      keyPoints.push(
        { type: 'title', text: title },
        { type: 'info', text: '请查看原文了解更多详情' }
      );
    }
    
    return {
      keyPoints: keyPoints.slice(0, 6),
      summary: this.generateSummary(title, content)
    };
  }

  static generateSummary(title, content) {
    const sentences = content.match(/[^。！？!?]+[。！？!?]?/g) || [];
    if (sentences.length > 0) {
      const firstTwo = sentences.slice(0, 2).join('');
      return firstTwo.length > 200 ? firstTwo.substring(0, 200) + '...' : firstTwo;
    }
    return title || content.substring(0, 100);
  }
}

module.exports = AIService;
