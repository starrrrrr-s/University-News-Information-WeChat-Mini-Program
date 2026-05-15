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
    replyTo: null
  },

  onLoad(options) {
    const fontSize = wx.getStorageSync('fontSize') || 30;
    this.setData({ fontSize });

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
          const newsWithColor = {
            ...news,
            categoryColor: util.getCategoryColor(news.categoryId)
          };
          this.setData({ news: newsWithColor });
          this.checkCollectStatus(news.id);
          wx.setNavigationBarTitle({ title: news.title });
          this.loadComments(true);
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
  }
});