const app = getApp();

const BASE_URL = 'http://localhost:3001';

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    
    // 标签切换
    activeTab: 'submit',
    unreadCount: 0,
    
    // 反馈类型
    feedbackTypes: ['功能建议', '问题反馈', '内容纠错', '其他'],
    selectedType: '',
    
    // 反馈内容
    content: '',
    contact: '', // 联系方式（可选）
    
    // 字数统计
    maxLength: 500,
    contentLength: 0,
    
    // 提交状态
    submitting: false,
    
    // 反馈历史
    feedbackHistory: [],
    historyLoading: false,
    
    // 详情弹窗
    showDetailModal: false,
    currentDetail: null
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    // 应用主题颜色
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

  // 切换标签
  switchTab(tab) {
    this.setData({ activeTab: tab });
    if (tab === 'history') {
      this.loadFeedbackHistory();
    }
  },

  // 选择反馈类型
  onTypeSelect(e) {
    const index = e.detail.value;
    this.setData({
      selectedType: this.data.feedbackTypes[index]
    });
  },

  // 输入反馈内容
  onContentInput(e) {
    const content = e.detail.value;
    this.setData({
      content,
      contentLength: content.length
    });
  },

  // 输入联系方式
  onContactInput(e) {
    this.setData({
      contact: e.detail.value
    });
  },

  // 提交反馈
  onSubmit() {
    // 检查登录状态
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

    // 验证反馈类型
    if (!this.data.selectedType) {
      wx.showToast({ title: '请选择反馈类型', icon: 'none' });
      return;
    }

    // 验证反馈内容
    const content = this.data.content.trim();
    if (!content) {
      wx.showToast({ title: '请输入反馈内容', icon: 'none' });
      return;
    }

    if (content.length < 10) {
      wx.showToast({ title: '反馈内容至少10个字', icon: 'none' });
      return;
    }

    // 提交反馈
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
          // 清空表单
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
        // 后端不可用时，保存到本地
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

  // 本地保存反馈（离线模式）
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

  // 加载反馈历史
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
        if (res.data && res.data.success) {
          const list = res.data.data || [];
          this.setData({
            feedbackHistory: list
          });
          this.updateUnreadCount(list);
        }
      },
      fail: () => {
        // 离线模式，读取本地存储
        const localFeedback = wx.getStorageSync('local_feedback') || [];
        const list = localFeedback.map(item => ({
          ...item,
          status: 0,
          is_read: true,
          created_at: item.createdAt
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

  // 更新未读数量
  updateUnreadCount(list) {
    const count = list.filter(item => item.reply && !item.is_read).length;
    this.setData({ unreadCount: count });
  },

  // 查看反馈详情（标记为已读并显示弹窗）
  viewFeedbackDetail(e) {
    const { id } = e.currentTarget.dataset;
    const feedback = this.data.feedbackHistory.find(f => f.id === id);
    
    if (feedback) {
      // 显示详情弹窗
      this.setData({
        showDetailModal: true,
        currentDetail: feedback
      });
      
      // 如果有回复且未读，标记为已读
      if (feedback.reply && !feedback.is_read) {
        this.markAsRead(id);
      }
    }
  },

  // 关闭详情弹窗
  hideDetailModal() {
    this.setData({
      showDetailModal: false,
      currentDetail: null
    });
  },

  // 标记为已读
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
          // 更新本地状态
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

  // 获取状态文字
  getStatusText(status) {
    const statusMap = {
      0: '待处理',
      1: '处理中',
      2: '已解决'
    };
    return statusMap[status] || '未知';
  },

  // 获取状态样式
  getStatusClass(status) {
    const classMap = {
      0: 'status-pending',
      1: 'status-processing',
      2: 'status-done'
    };
    return classMap[status] || '';
  },

  // 获取类型样式
  getTypeClass(type) {
    const classMap = {
      '功能建议': 'type-suggestion',
      '问题反馈': 'type-problem',
      '内容纠错': 'type-correction',
      '其他': 'type-other'
    };
    return classMap[type] || 'type-other';
  },

  // 格式化时间
  formatTime(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${hour}:${min}`;
  }
});