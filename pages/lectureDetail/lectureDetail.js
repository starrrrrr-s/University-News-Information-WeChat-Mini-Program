const data = require('../../utils/data.js');
const app = getApp();

const BASE_URL = 'http://localhost:3000';

Page({
  data: {
    lecture: null,
    fontSize: 28,  // 默认字体大小，从全局设置读取

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
    replyTo: null
  },

  onLoad(options) {
    const fontSize = wx.getStorageSync('fontSize') || 28;
    this.setData({ fontSize });

    if (options.id) {
      this.loadLecture(parseInt(options.id));
    }
  },

  onShow() {
    const fontSize = wx.getStorageSync('fontSize') || 28;
    this.setData({ fontSize });
    // 每次页面显示时重新加载评论，确保评论列表是最新的
    if (this.data.lecture) {
      this.loadComments(true);
    }
  },

  loadLecture(id) {
    const lecture = data.getLectureById(id);
    if (lecture) {
      this.setData({ lecture });
      wx.setNavigationBarTitle({ title: lecture.title });
      this.loadComments(true);
    } else {
      wx.showToast({ title: '讲座不存在', icon: 'none' });
    }
  },

  // ─── 评论功能 ────────────────────────────────────────────────

  loadComments(reset = false) {
    const lecture = this.data.lecture;
    if (!lecture) return;
    if (this.data.commentLoading) return;

    const page = reset ? 1 : this.data.commentPage;
    this.setData({ commentLoading: true });

    wx.request({
      url: `${BASE_URL}/api/comments`,
      method: 'GET',
      data: {
        target_type: 'lecture',
        target_id: lecture.id,
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
          this.setData({
            commentList,
            commentTotal: pagination.total || 0,
            commentPage: page + 1,
            hasMoreComments: pagination.page < pagination.pages
          });
        }
      },
      fail: () => {
        // 后端未启动时，从本地 Storage 读取持久化的评论
        const lectureId = this.data.lecture.id;
        const storageKey = `local_comments_lecture_${lectureId}`;
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
    this.setData({ showCommentInput: true, commentInputFocus: true });
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
    this.setData({ showCommentInput: false, commentInputFocus: false, replyTo: null });
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

    const lecture = this.data.lecture;
    const userInfo = app.globalData.userInfo;
    if (!userInfo) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    const token = wx.getStorageSync('token');
    const body = {
      target_type: 'lecture',
      target_id: lecture.id,
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
          wx.showToast({ title: '发布成功', icon: 'success' });
          this.setData({ commentContent: '', showCommentInput: false, replyTo: null });
          this.loadComments(true);
        } else {
          wx.showToast({ title: res.data.message || '发布失败', icon: 'none' });
        }
      },
      fail: () => {
        // 后端未启动时，本地模拟添加评论并持久化到 Storage
        const lectureId = this.data.lecture.id;
        const storageKey = `local_comments_lecture_${lectureId}`;
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
        // 持久化到本地 Storage
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
        wx.showToast({ title: '发布成功', icon: 'success' });
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
    const lecture = this.data.lecture;
    return {
      title: lecture ? lecture.title : '高校讲座资讯',
      path: lecture ? '/pages/lectureDetail/lectureDetail?id=' + lecture.id : '/pages/index/index'
    };
  }
});
