const data = require('../../utils/data.js');
const util = require('../../utils/util.js');
const app = getApp();

// 后端 API 基础地址（与后端 app.js 中的 PORT 一致）
const BASE_URL = 'http://localhost:3000';

Page({
  data: {
    news: null,
    isCollected: false,
    isLoggedIn: false,
    fontSize: 30,  // 默认字体大小（rpx），从全局设置读取

    // 评论相关
    commentList: [],
    commentTotal: 0,
    commentPage: 1,
    commentLimit: 20,
    hasMoreComments: false,
    commentLoading: false,

    // 评论输入框
    showCommentInput: false,
    commentInputFocus: false,
    commentContent: '',
    replyTo: null  // { id, nickname } 回复目标
  },

  onLoad(options) {
    // 读取字体大小设置
    const fontSize = wx.getStorageSync('fontSize') || 30;
    this.setData({ fontSize });

    if (options.id) {
      this.loadNews(parseInt(options.id));
    }
  },

  onShow() {
    const userInfo = app.globalData.userInfo;
    this.setData({ isLoggedIn: !!userInfo });
    if (this.data.news) {
      this.checkCollectStatus(this.data.news.id);
    }
    // 刷新字体大小
    const fontSize = wx.getStorageSync('fontSize') || 30;
    this.setData({ fontSize });
  },

  loadNews(id) {
    const news = data.getNewsById(id);
    if (news) {
      const newsWithColor = {
        ...news,
        categoryColor: util.getCategoryColor(news.categoryId)
      };
      this.setData({ news: newsWithColor });
      this.checkCollectStatus(news.id);
      wx.setNavigationBarTitle({ title: news.title });
      // 加载评论
      this.loadComments(true);
    } else {
      wx.showToast({ title: '新闻不存在', icon: 'none' });
    }
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

  // ─── 评论功能 ────────────────────────────────────────────────

  /**
   * 加载评论列表
   * @param {boolean} reset 是否重置（第一页）
   */
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
          // 格式化时间
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
        // 后端未启动时静默失败，不影响新闻阅读
      },
      complete: () => {
        this.setData({ commentLoading: false });
      }
    });
  },

  loadMoreComments() {
    this.loadComments(false);
  },

  /** 点击底部评论按钮，显示输入框 */
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

  /** 点击回复按钮 */
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

  /** 提交评论 */
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
          // 重新加载评论
          this.loadComments(true);
        } else {
          wx.showToast({ title: res.data.message || '评论失败', icon: 'none' });
        }
      },
      fail: () => {
        // 后端未启动时，本地模拟添加评论
        const mockComment = {
          id: Date.now(),
          content,
          parent_id: this.data.replyTo ? this.data.replyTo.id : null,
          is_top: 0,
          createdAt: this.formatTime(new Date().toISOString()),
          user: {
            id: 0,
            nickname: userInfo.nickName || '我',
            avatar_url: userInfo.avatarUrl || ''
          }
        };
        const commentList = [mockComment, ...this.data.commentList];
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

  /** 格式化时间 */
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

  // 微信分享
  onShareAppMessage() {
    const news = this.data.news;
    return {
      title: news ? news.title : '高校新闻资讯',
      path: news ? '/pages/newsDetail/newsDetail?id=' + news.id : '/pages/index/index'
    };
  }
});
