const util = require('../../utils/util.js');
const app = getApp();

const BASE_URL = 'http://localhost:3001';

Page({
  data: {
    news: null,
    isCollected: false,
    isLoggedIn: false,
    fontSize: 30,

    commentList: [],
    commentTotal: 0,
    commentPage: 1,
    commentLimit: 20,
    hasMoreComments: false,
    commentLoading: false,

    showCommentInput: false,
    commentInputFocus: false,
    commentContent: '',
    replyTo: null,

    // AI 相关
    aiLoading: false,
    aiError: '',
    aiData: {},

    // 语音朗读相关
    isSpeaking: false,
    speakMode: '',
    innerAudioContext: null,
    ttsMode: 'real', // 'real' 真实 TTS，'mock' 模拟
    currentVoice: 'Neil', // Neil, Ethan, Serena, Bellona
    showVoiceSelector: false
  },

  onLoad(options) {
    const fontSize = wx.getStorageSync('fontSize') || 30;
    this.setData({ fontSize });

    // 初始化语音播放器
    const innerAudioContext = wx.createInnerAudioContext();
    this.setData({ innerAudioContext });

    innerAudioContext.onEnded(() => {
      this.setData({ isSpeaking: false, speakMode: '' });
    });

    innerAudioContext.onError((err) => {
      console.error('语音播放错误:', err);
      this.setData({ isSpeaking: false, speakMode: '' });
      wx.showToast({ title: '语音播放失败', icon: 'none' });
    });

    if (options.id) {
      this.loadNews(options.id);
    }
  },

  onShow() {
    const userInfo = app.globalData.userInfo;
    this.setData({ isLoggedIn: !!userInfo });
    if (this.data.news) {
      this.checkCollectStatus(this.data.news.id);
      this.loadComments(true);
    }
    const fontSize = wx.getStorageSync('fontSize') || 30;
    this.setData({ fontSize });
  },

  loadNews(id) {
    wx.showLoading({ title: '加载中...' });
    
    wx.request({
      url: `${BASE_URL}/api/news/${id}`,
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.success) {
          const news = res.data.data;
          // 将图片URL转换为数组格式
          let images = [];
          if (news.image_url) {
            images = [news.image_url];
          } else if (news.image) {
            images = [news.image];
          }
          
          const newsWithColor = {
            ...news,
            images: images,
            sourceUrl: news.source_url || '',
            categoryColor: util.getCategoryColor(news.categoryId)
          };
          this.setData({ news: newsWithColor });
          this.checkCollectStatus(news.id);
          wx.setNavigationBarTitle({ title: news.title });
          this.loadComments(true);
          // 自动获取 AI 要点提炼
          if (newsWithColor.sourceUrl) {
            this.onExtractContent();
          }
          // 自动获取 AI 要点提炼
          if (newsWithColor.sourceUrl) {
            this.onExtractContent();
          }
        } else {
          wx.showToast({ title: '新闻不存在', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '获取新闻失败', icon: 'none' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  checkCollectStatus(newsId) {
    const isLoggedIn = !!app.globalData.userInfo;
    if (isLoggedIn) {
      const isCollected = util.isNewsCollected(newsId);
      this.setData({ isCollected });
    } else {
      this.setData({ isCollected: false });
    }
  },

  onToggleCollect() {
    const news = this.data.news;
    if (!news) return;

    if (!app.globalData.userInfo) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再收藏',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/personal/personal' });
          }
        }
      });
      return;
    }

    if (this.data.isCollected) {
      util.removeFromCollection(news.id);
      this.setData({ isCollected: false });
      wx.showToast({ title: '已取消收藏', icon: 'success' });
    } else {
      const newsToSave = {
        id: news.id,
        title: news.title,
        summary: news.summary,
        category: news.category,
        categoryId: news.categoryId,
        image: news.image,
        date: news.date
      };
      util.addToCollection(newsToSave);
      this.setData({ isCollected: true });
      wx.showToast({ title: '收藏成功', icon: 'success' });
    }
  },

  loadComments(reset = false) {
    const news = this.data.news;
    if (!news) return;

    if (this.data.commentLoading) return;

    const page = reset ? 1 : this.data.commentPage;

    this.setData({ commentLoading: true });

    wx.request({
      url: `${BASE_URL}/api/comments`,
      method: 'GET',
      data: {
        target_type: 'news',
        target_id: news.id,
        page,
        limit: this.data.commentLimit
      },
      success: (res) => {
        if (res.data && res.data.success) {
          const newComments = res.data.data || [];
          const formatted = newComments.map(c => ({
            ...c,
            createdAt: this.formatTime(c.createdAt)
          }));

          const commentList = reset ? formatted : [...this.data.commentList, ...formatted];
          const pagination = res.data.pagination || {};
          const hasMore = pagination.page < pagination.pages;

          this.setData({
            commentList,
            commentTotal: pagination.total || 0,
            commentPage: page + 1,
            hasMoreComments: hasMore
          });
        }
      },
      fail: () => {
        const newsId = this.data.news.id;
        const storageKey = `local_comments_news_${newsId}`;
        const localComments = wx.getStorageSync(storageKey) || [];
        const formatted = localComments.map(c => ({
          ...c,
          createdAt: this.formatTime(c.createdAt)
        }));
        if (reset) {
          this.setData({
            commentList: formatted,
            commentTotal: formatted.length,
            commentPage: 2,
            hasMoreComments: false
          });
        }
      },
      complete: () => {
        this.setData({ commentLoading: false });
      }
    });
  },

  loadMoreComments() {
    this.loadComments(false);
  },

  onFocusComment() {
    if (!app.globalData.userInfo) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再评论',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/personal/personal' });
          }
        }
      });
      return;
    }
    this.setData({
      showCommentInput: true,
      commentInputFocus: true
    });
  },

  onReply(e) {
    if (!app.globalData.userInfo) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再回复',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/personal/personal' });
          }
        }
      });
      return;
    }
    const { id, nickname } = e.currentTarget.dataset;
    this.setData({
      replyTo: { id, nickname },
      showCommentInput: true,
      commentInputFocus: true
    });
  },

  onCancelReply() {
    this.setData({ replyTo: null });
  },

  onHideCommentInput() {
    this.setData({
      showCommentInput: false,
      commentInputFocus: false,
      replyTo: null
    });
  },

  onCommentInput(e) {
    this.setData({ commentContent: e.detail.value });
  },

  onSubmitComment() {
    const content = this.data.commentContent.trim();
    if (!content) {
      wx.showToast({ title: '评论内容不能为空', icon: 'none' });
      return;
    }

    const news = this.data.news;
    const userInfo = app.globalData.userInfo;
    if (!userInfo) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    const token = wx.getStorageSync('token');
    const body = {
      target_type: 'news',
      target_id: news.id,
      content
    };
    if (this.data.replyTo) {
      body.parent_id = this.data.replyTo.id;
    }

    wx.showLoading({ title: '发送中...' });

    wx.request({
      url: `${BASE_URL}/api/comments`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: body,
      success: (res) => {
        if (res.data && res.data.success) {
          wx.showToast({ title: '评论成功', icon: 'success' });
          this.setData({
            commentContent: '',
            showCommentInput: false,
            replyTo: null
          });
          this.loadComments(true);
        } else {
          wx.showToast({ title: res.data.message || '评论失败', icon: 'none' });
        }
      },
      fail: () => {
        const newsId = this.data.news.id;
        const storageKey = `local_comments_news_${newsId}`;
        const mockComment = {
          id: Date.now(),
          content,
          parent_id: this.data.replyTo ? this.data.replyTo.id : null,
          is_top: 0,
          createdAt: new Date().toISOString(),
          user: {
            id: 0,
            nickname: userInfo.nickName || '我',
            avatar_url: userInfo.avatarUrl || ''
          }
        };
        const localComments = wx.getStorageSync(storageKey) || [];
        localComments.unshift(mockComment);
        wx.setStorageSync(storageKey, localComments);

        const formatted = {
          ...mockComment,
          createdAt: this.formatTime(mockComment.createdAt)
        };
        const commentList = [formatted, ...this.data.commentList];
        this.setData({
          commentList,
          commentTotal: this.data.commentTotal + 1,
          commentContent: '',
          showCommentInput: false,
          replyTo: null
        });
        wx.showToast({ title: '评论成功', icon: 'success' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  formatTime(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  onShareAppMessage() {
    const news = this.data.news;
    if (!news) {
      return {
        title: '高校新闻资讯',
        path: '/pages/index/index'
      };
    }

    let shareTitle = news.title;
    if (news.category) {
      shareTitle = `【${news.category}】${news.title}`;
    }

    return {
      title: shareTitle,
      path: `/pages/newsDetail/newsDetail?id=${news.id}`,
      imageUrl: news.image || ''
    };
  },

  onShareTimeline() {
    const news = this.data.news;
    if (!news) {
      return {
        title: '高校新闻资讯',
        query: ''
      };
    }

    let shareTitle = news.title;
    if (news.category) {
      shareTitle = `【${news.category}】${news.title}`;
    }

    return {
      title: shareTitle,
      query: `id=${news.id}`,
      imageUrl: news.image || ''
    };
  },

  previewImage(e) {
    const news = this.data.news;
    if (!news || !news.images || news.images.length === 0) return;
    
    const index = parseInt(e.currentTarget.dataset.index) || 0;
    
    wx.previewImage({
      urls: news.images,
      current: news.images[index],
      success: () => {},
      fail: () => {
        wx.showToast({ title: '预览失败', icon: 'none' });
      }
    });
  },

  // AI：提取内容
  onExtractContent() {
    const news = this.data.news;
    if (!news || !news.sourceUrl) {
      wx.showToast({ title: '暂无原文链接', icon: 'none' });
      return;
    }

    this.setData({ aiLoading: true, aiError: '' });

    wx.request({
      url: `${BASE_URL}/api/news/extract-content`,
      method: 'POST',
      data: {
        url: news.sourceUrl,
        newsId: news.id
      },
      success: (res) => {
        if (res.data && res.data.success) {
          this.setData({
            aiLoading: false,
            aiData: res.data.data
          });
        } else {
          this.setData({
            aiLoading: false,
            aiError: res.data.message || '获取失败'
          });
        }
      },
      fail: () => {
        this.setData({ aiLoading: false });
        this.extractLocalContent(news);
      }
    });
  },

  // 本地内容提取（降级方案）
  extractLocalContent(news) {
    const keyPoints = [];
    
    if (news.date) keyPoints.push({ type: 'time', text: `时间：${news.date}` });
    if (news.author) keyPoints.push({ type: 'person', text: `作者：${news.author}` });
    if (news.summary) {
      keyPoints.push({ type: 'content', text: news.summary });
    } else if (news.content) {
      keyPoints.push({ type: 'content', text: news.content.substring(0, 100) + '...' });
    }
    
    if (keyPoints.length === 0) {
      keyPoints.push({ type: 'info', text: '请查看原文了解更多详情' });
    }

    this.setData({
      aiData: {
        keyPoints,
        summary: news.summary || news.content.substring(0, 150) + '...',
        content: news.content || ''
      }
    });
  },

  // 语音：朗读要点
  onSpeakKeyPoints() {
    const { aiData, isSpeaking, speakMode } = this.data;
    if (!aiData.keyPoints || aiData.keyPoints.length === 0) {
      wx.showToast({ title: '暂无要点可朗读', icon: 'none' });
      return;
    }

    if (isSpeaking && speakMode === 'keyPoints') {
      this.stopSpeaking();
      return;
    }

    if (isSpeaking) {
      this.stopSpeaking();
    }

    const speakText = aiData.keyPoints.map(kp => kp.text).join('。');
    this.startSpeaking(speakText, 'keyPoints');
  },

  // 语音：朗读全文
  onSpeakFullText() {
    const { aiData, news, isSpeaking, speakMode } = this.data;
    const fullText = aiData.content || (news && news.content);
    
    if (!fullText) {
      wx.showToast({ title: '暂无内容可朗读', icon: 'none' });
      return;
    }

    if (isSpeaking && speakMode === 'fullText') {
      this.stopSpeaking();
      return;
    }

    if (isSpeaking) {
      this.stopSpeaking();
    }

    this.startSpeaking(fullText, 'fullText');
  },

  // 开始语音朗读
  startSpeaking(text, mode) {
    if (this.data.ttsMode === 'real') {
      this.startRealTTS(text, mode);
    } else {
      this.startMockSpeaking(text, mode);
    }
  },

  // 真实 TTS 朗读
  startRealTTS(text, mode) {
    this.setData({ isSpeaking: true, speakMode: mode });
    wx.showLoading({ title: '正在合成语音...' });

    wx.request({
      url: `${BASE_URL}/api/news/tts`,
      method: 'POST',
      data: {
        text: text,
        voice: this.data.currentVoice
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data && res.data.success) {
          if (res.data.data.isMock) {
            wx.showToast({ title: 'TTS 服务未开通，使用模拟模式', icon: 'none', duration: 2000 });
            this.startMockSpeaking(text, mode);
          } else if (res.data.data.audioUrl) {
            this.playAudio(res.data.data.audioUrl);
          }
        } else {
          wx.showToast({ title: '语音合成失败', icon: 'none' });
          this.startMockSpeaking(text, mode);
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误，使用模拟模式', icon: 'none' });
        this.startMockSpeaking(text, mode);
      }
    });
  },

  // 播放音频
  playAudio(audioUrl) {
    const innerAudioContext = this.data.innerAudioContext;
    innerAudioContext.src = audioUrl;
    innerAudioContext.play();
    wx.showToast({ title: '开始朗读', icon: 'success', duration: 1500 });
  },

  // 模拟朗读（降级方案）
  startMockSpeaking(text, mode) {
    this.setData({ isSpeaking: true, speakMode: mode });
    wx.showToast({ title: '开始朗读', icon: 'none', duration: 1000 });
    const chunks = this.splitText(text, 500);
    this.speakChunks(chunks, 0);
  },

  // 分段模拟朗读
  speakChunks(chunks, index) {
    if (index >= chunks.length) {
      this.setData({ isSpeaking: false, speakMode: '' });
      return;
    }

    wx.showToast({ title: `朗读中 ${index + 1}/${chunks.length}`, icon: 'none', duration: 1500 });

    setTimeout(() => {
      if (index < chunks.length - 1) {
        this.speakChunks(chunks, index + 1);
      } else {
        this.setData({ isSpeaking: false, speakMode: '' });
        wx.showToast({ title: '朗读完成', icon: 'success' });
      }
    }, Math.min(chunks[index].length * 200, 30000));
  },

  // 停止朗读
  stopSpeaking() {
    if (this.data.innerAudioContext) {
      this.data.innerAudioContext.stop();
    }
    this.setData({ isSpeaking: false, speakMode: '' });
    wx.showToast({ title: '已停止朗读', icon: 'none' });
  },

  // 切换音色选择器
  onToggleVoiceSelector() {
    this.setData({ showVoiceSelector: !this.data.showVoiceSelector });
  },

  // 选择音色
  onSelectVoice(e) {
    const voice = e.currentTarget.dataset.voice;
    this.setData({ currentVoice: voice, showVoiceSelector: false });
    wx.showToast({ title: '已切换音色', icon: 'success' });
  },

  // 文本分段
  splitText(text, maxLength) {
    const chunks = [];
    let current = '';
    
    const sentences = text.match(/[^。！？!?]+[。！？!?]?/g) || [text];
    
    for (const sentence of sentences) {
      if (current.length + sentence.length > maxLength && current.length > 0) {
        chunks.push(current);
        current = sentence;
      } else {
        current += sentence;
      }
    }
    
    if (current.length > 0) chunks.push(current);
    return chunks;
  },

  onUnload() {
    if (this.data.innerAudioContext) {
      this.data.innerAudioContext.stop();
      this.data.innerAudioContext.destroy();
    }
  },

  onOpenSourceUrl() {
    const news = this.data.news;
    if (!news || !news.sourceUrl) {
      wx.showToast({ title: '暂无原文链接', icon: 'none' });
      return;
    }

    wx.navigateTo({
      url: `/pages/webview/webview?url=${encodeURIComponent(news.sourceUrl)}`,
      fail: () => {
        // 跳转失败时降级为复制链接
        wx.setClipboardData({
          data: news.sourceUrl,
          success: () => {
            wx.showModal({
              title: '链接已复制',
              content: '原文链接已复制到剪贴板，你可以在浏览器中打开查看。',
              showCancel: false,
              confirmText: '好的',
              confirmColor: '#1AAD19'
            });
          }
        });
      }
    });
  }
});
