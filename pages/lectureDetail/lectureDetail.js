const data = require('../../utils/data.js');
const util = require('../../utils/util.js');
const app = getApp();

const BASE_URL = 'http://localhost:3001';

Page({
  data: {
    lecture: null,
    fontSize: 28,

    // 收藏相关
    isCollected: false,

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
    
    const app = getApp();
    const themeConfig = wx.getStorageSync('themeConfig');
    if (themeConfig) {
      app.globalData.themeConfig = themeConfig;
      app.applyThemeConfig(themeConfig);
    }
    
    if (this.data.lecture) {
      this.loadComments(true);
    }
  },

  loadLecture(id) {
    wx.showLoading({ title: '加载中...' });
    wx.request({
      url: `${BASE_URL}/api/lectures/${id}`,
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.success) {
          const lecture = res.data.data;
          const isCollected = util.isLectureCollected(lecture.id);
          this.setData({ lecture, isCollected });
          wx.setNavigationBarTitle({ title: lecture.title });
          this.loadComments(true);
        } else {
          wx.showToast({ title: res.data.message || '讲座不存在', icon: 'none' });
        }
      },
      fail: () => {
        // 后端未启动时，从本地数据获取
        const lecture = data.getLectureById(id);
        if (lecture) {
          this.setData({ lecture });
          wx.setNavigationBarTitle({ title: lecture.title });
          this.loadComments(true);
        } else {
          wx.showToast({ title: '讲座不存在', icon: 'none' });
        }
      },
      complete: () => {
        wx.hideLoading();
      }
    });
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

  onToggleCollect() {
    const lecture = this.data.lecture;
    if (!lecture) return;

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
      util.removeLectureFromCollection(lecture.id);
      this.setData({ isCollected: false });
      wx.showToast({ title: '已取消收藏', icon: 'success' });
    } else {
      const lectureToSave = {
        id: lecture.id,
        title: lecture.title,
        speaker: lecture.speaker,
        speakerTitle: lecture.speakerTitle,
        start_time: lecture.start_time || lecture.time,
        location: lecture.location,
        organizer: lecture.organizer,
        category: lecture.category,
        image: lecture.image
      };
      util.addLectureToCollection(lectureToSave);
      this.setData({ isCollected: true });
      wx.showToast({ title: '收藏成功', icon: 'success' });
    }
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

  // ─── 分享功能 ────────────────────────────────────────────────

  /**
   * 格式化讲座时间用于分享
   * @param {string|Date} time 讲座时间
   * @returns {string} 格式化后的时间字符串
   */
  formatLectureTime(time) {
    if (!time) return '';
    const d = new Date(time);
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    const weekDay = weekDays[d.getDay()];
    return `${m}月${day}日(${weekDay}) ${hour}:${minute}`;
  },

  /**
   * 分享给好友
   * 分享卡片显示完整的讲座信息：标题 + 时间 + 地点 + 主讲人
   * 方便接收者无需打开小程序就能判断是否参加
   */
  onShareAppMessage() {
    const lecture = this.data.lecture;
    if (!lecture) {
      return {
        title: '高校讲座资讯',
        path: '/pages/index/index'
      };
    }

    // 构建分享标题，包含时间地点等关键信息
    // 格式：【讲座】标题 | 时间 | 地点
    const timeStr = this.formatLectureTime(lecture.start_time || lecture.time);
    const location = lecture.location || '';
    
    let shareTitle = `【讲座】${lecture.title}`;
    if (timeStr) {
      shareTitle += ` | ${timeStr}`;
    }
    if (location) {
      shareTitle += ` | ${location}`;
    }
    if (lecture.speaker) {
      shareTitle += ` | 主讲：${lecture.speaker}`;
    }

    return {
      title: shareTitle,
      path: `/pages/lectureDetail/lectureDetail?id=${lecture.id}`,
      imageUrl: lecture.image || ''
    };
  },

  /**
   * 分享到朋友圈
   * 用户可以将讲座分享到朋友圈，邀请更多人参加
   */
  onShareTimeline() {
    const lecture = this.data.lecture;
    if (!lecture) {
      return {
        title: '高校讲座资讯',
        query: ''
      };
    }

    // 构建分享标题，包含时间地点信息
    const timeStr = this.formatLectureTime(lecture.start_time || lecture.time);
    const location = lecture.location || '';
    
    let shareTitle = `【讲座】${lecture.title}`;
    if (timeStr) {
      shareTitle += `\n时间：${timeStr}`;
    }
    if (location) {
      shareTitle += `\n地点：${location}`;
    }
    if (lecture.speaker) {
      shareTitle += `\n主讲：${lecture.speaker}`;
    }

    return {
      title: shareTitle,
      query: `id=${lecture.id}`,
      imageUrl: lecture.image || ''
    };
  },

  // 打开讲座链接
  openLink() {
    const lecture = this.data.lecture;
    if (!lecture || !lecture.link) {
      wx.showToast({ title: '链接不存在', icon: 'none' });
      return;
    }

    // 使用web-view打开链接（需要跳转到专门的web-view页面）
    // 或者复制链接到剪贴板
    wx.setClipboardData({
      data: lecture.link,
      success: () => {
        wx.showModal({
          title: '提示',
          content: '链接已复制到剪贴板，请在浏览器中打开',
          showCancel: false
        });
      }
    });
  }
});
