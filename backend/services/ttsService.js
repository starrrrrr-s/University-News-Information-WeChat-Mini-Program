const https = require('https');
const fs = require('fs');
const path = require('path');

class TTSService {
  static MODE = 'real'; // 'real' 真实 TTS，'mock' 模拟
  static DASHSCOPE_API_KEY = 'sk-f4a989e259b4436ab77afbe4b9687dc5';
  static API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
  
  // 音频临时存储目录
  static TEMP_DIR = path.join(__dirname, '../temp');

  static init() {
    if (!fs.existsSync(this.TEMP_DIR)) {
      fs.mkdirSync(this.TEMP_DIR, { recursive: true });
    }
  }

  static async textToSpeech(text, options = {}) {
    this.init();

    if (this.MODE === 'mock') {
      return this.mockTextToSpeech(text, options);
    }

    try {
      return await this.callHttpTTS(text, options);
    } catch (error) {
      console.error('HTTP TTS 调用失败，使用模拟模式:', error.message);
      return this.mockTextToSpeech(text, options);
    }
  }

  static async callHttpTTS(text, options = {}) {
    return new Promise((resolve, reject) => {
      const {
        voice = 'Neil',
        model = 'qwen3-tts-flash'
      } = options;

      console.log(`🚀 正在调用 Qwen-TTS HTTP API`);
      console.log(`   - 模型: ${model}`);
      console.log(`   - 音色: ${voice}`);
      console.log(`   - 文本长度: ${text.length} 字符`);

      const requestBody = {
        model: model,
        input: {
          text: text.substring(0, 2000),
          voice: voice,
          language_type: 'Chinese'
        }
      };

      const postData = JSON.stringify(requestBody);

      const options_https = {
        hostname: 'dashscope.aliyuncs.com',
        port: 443,
        path: '/api/v1/services/aigc/multimodal-generation/generation',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      let responseData = '';

      const req = https.request(options_https, (res) => {
        console.log(`📥 响应状态码: ${res.statusCode}`);

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);
            console.log('✅ TTS 响应:', JSON.stringify(result, null, 2));

            if (result.code && result.code !== 'Success') {
              console.error('❌ TTS API 错误:', result.message || result.code);
              reject(new Error(result.message || result.code || 'TTS API 调用失败'));
              return;
            }

            if (result.output && result.output.audio && result.output.audio.url) {
              console.log('🎵 音频 URL 已获取');
              resolve({
                success: true,
                audioUrl: result.output.audio.url,
                isMock: false
              });
            } else {
              console.error('❌ 响应中没有音频 URL');
              reject(new Error('响应中没有音频 URL'));
            }
          } catch (e) {
            console.error('❌ 解析响应失败:', e);
            console.error('原始响应:', responseData);
            reject(e);
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ HTTP 请求错误:', error);
        reject(error);
      });

      // 设置超时
      req.setTimeout(60000, () => {
        req.destroy();
        reject(new Error('TTS 请求超时'));
      });

      console.log('📤 发送请求...');
      req.write(postData);
      req.end();
    });
  }

  static mockTextToSpeech(text, options = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('📢 使用模拟 TTS 模式');
        resolve({
          success: true,
          isMock: true,
          message: 'TTS 模拟模式'
        });
      }, 500);
    });
  }
}

module.exports = TTSService;
