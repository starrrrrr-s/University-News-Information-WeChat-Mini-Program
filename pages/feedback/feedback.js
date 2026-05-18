const app = getApp();

const BASE_URL = 'http://localhost:3001';

const STATUS_MAP = {
  0: '待处理',
  1: '处理中',
  2: '已解决'
};

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,

    activeTab: 'submit',
    unreadCount: 0,

    feedbackTypes: ['功能建议', '问题反馈', '内容纠错', '其他'],
    selectedType: '',

    content: '',
    contact: '',

    maxLength: 500,
    contentLength: 0,

    submitting: false,

    feedbackHistory: [],
    historyLoading: false,

    showDetailModal: false,
    currentDetail: null
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    const themeConfig = wx.getStorageSync('themeConfig');
    if (themeConfig) {
      app.globalData.themeConfig = themeConfig;
      app.applyThemeConfig(themeConfig);
    }
    this.checkLoginStatus();
    if (this.data.activeTab === 'history') {
      this.loadFeedbackHistory();
    }
  },

  checkLoginStatus() {
    const userInfo = app.globalData.userInfo;
    const isLoggedIn = !!userInfo;
    this.setData({ isLoggedIn, userInfo });
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    if (tab === 'history') {
      this.loadFeedbackHistory();
    }
  },

  stopPropagation() {},

  onTypeSelect(e) {
    const index = e.detail.value;
    this.setData({
      selectedType: this.data.feedbackTypes[index]
    });
  },

  onContentInput(e) {
    const content = e.detail.value;
    this.setData({
      content,
      contentLength: content.length
    });
  },

  onContactInput(e) {
    this.setData({
      contact: e.detail.value
    });
  },

  onSubmit() {
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再提交反馈',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/personal/personal' });
          }
        }
      });
      return;
    }

    if (!this.data.selectedType) {
      wx.showToast({ title: '请选择反馈类型', icon: 'none' });
      return;
    }

    const content = this.data.content.trim();
    if (!content) {
      wx.showToast({ title: '请输入反馈内容', icon: 'none' });
      return;
    }

    if (content.length < 10) {
      wx.showToast({ title: '反馈内容至少10个字', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    const token = wx.getStorageSync('token');
    const feedbackData = {
      type: this.data.selectedType,
      content: content,
      contact: this.data.contact.trim()
    };

    wx.showLoading({ title: '提交中...' });

    wx.request({
      url: `${BASE_URL}/api/feedback`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: feedbackData,
      success: (res) => {
        if (res.data && res.data.success) {
          wx.showToast({ title: '提交成功', icon: 'success' });
          this.setData({
            selectedType: '',
            content: '',
            contact: '',
            contentLength: 0
          });
        } else {
          wx.showToast({ title: res.data.message || '提交失败', icon: 'none' });
        }
      },
      fail: () => {
        this.saveToLocal(feedbackData);
        wx.showToast({ title: '反馈已保存', icon: 'success' });
        this.setData({
          selectedType: '',
          content: '',
          contact: '',
          contentLength: 0
        });
      },
      complete: () => {
        this.setData({ submitting: false });
        wx.hideLoading();
      }
    });
  },

  saveToLocal(feedbackData) {
    const feedbackList = wx.getStorageSync('local_feedback') || [];
    feedbackList.push({
      ...feedbackData,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      user: {
        nickname: this.data.userInfo?.nickName || '匿名用户'
      }
    });
    wx.setStorageSync('local_feedback', feedbackList);
  },

  loadFeedbackHistory() {
    if (!this.data.isLoggedIn) return;

    this.setData({ historyLoading: true });

    const token = wx.getStorageSync('token');

    wx.request({
      url: `${BASE_URL}/api/feedback/my`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        console.log('反馈列表返回数据：', res.data);
        if (res.data && res.data.success) {
          const list = res.data.data || [];
          console.log('处理前的列表：', list);

          const processedList = list.map(item => {
            const processed = { ...item };

            if (item.createdAt && !item.created_at) {
              processed.created_at = item.createdAt;
            }
            if (item.updatedAt && !item.updated_at) {
              processed.updated_at = item.updatedAt;
            }
            if (item.adminRead && !item.admin_read) {
              processed.admin_read = item.adminRead;
            }
            if (item.isRead && !item.is_read) {
              processed.is_read = item.isRead;
            }
            if (typeof processed.status === 'string') {
              processed.status = parseInt(processed.status);
            }

            const statusKey = processed.status;
            processed.statusText = STATUS_MAP[statusKey] || STATUS_MAP[parseInt(statusKey)] || '待处理';
            processed.formattedTime = this.formatTime(processed.created_at);

            console.log('processed item:', JSON.stringify(processed));
            return processed;
          });

          console.log('处理后的列表：', JSON.stringify(processedList));

          this.setData({
            feedbackHistory: processedList
          });
          this.updateUnreadCount(processedList);
        }
      },
      fail: () => {
        const localFeedback = wx.getStorageSync('local_feedback') || [];
        const list = localFeedback.map(item => ({
          ...item,
          status: 0,
          statusText: '待处理',
          is_read: true,
          created_at: item.createdAt,
          formattedTime: this.formatTime(item.createdAt)
        }));
        this.setData({
          feedbackHistory: list
        });
      },
      complete: () => {
        this.setData({ historyLoading: false });
      }
    });
  },

  updateUnreadCount(list) {
    const count = list.filter(item => item.reply && !item.is_read).length;
    this.setData({ unreadCount: count });
  },

  viewFeedbackDetail(e) {
    const { id } = e.currentTarget.dataset;
    const feedback = this.data.feedbackHistory.find(f => f.id === id);

    if (feedback) {
      this.setData({
        showDetailModal: true,
        currentDetail: feedback
      });

      if (feedback.reply && !feedback.is_read) {
        this.markAsRead(id);
      }
    }
  },

  hideDetailModal() {
    this.setData({
      showDetailModal: false,
      currentDetail: null
    });
  },

  markAsRead(id) {
    const token = wx.getStorageSync('token');

    wx.request({
      url: `${BASE_URL}/api/feedback/${id}/read`,
      method: 'PUT',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.data && res.data.success) {
          this.setData({
            feedbackHistory: this.data.feedbackHistory.map(item =>
              item.id === id ? { ...item, is_read: true } : item
            )
          });
          this.updateUnreadCount(this.data.feedbackHistory.map(item =>
            item.id === id ? { ...item, is_read: true } : item
          ));
        }
      }
    });
  },

  getStatusText(status) {
    return STATUS_MAP[status] || STATUS_MAP[parseInt(status)] || '待处理';
  },

  getStatusClass(status) {
    const classMap = {
      0: 'status-pending',
      1: 'status-processing',
      2: 'status-done'
    };
    const statusNum = typeof status === 'string' ? parseInt(status) : status;
    return classMap[status] || classMap[statusNum] || 'status-pending';
  },

  getTypeClass(type) {
    const classMap = {
      '功能建议': 'type-suggestion',
      '问题反馈': 'type-problem',
      '内容纠错': 'type-correction',
      '其他': 'type-other'
    };
    return classMap[type] || 'type-other';
  },

  formatTime(isoStr) {
    if (!isoStr) return '未知时间';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '未知时间';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${hour}:${min}`;
  }
});