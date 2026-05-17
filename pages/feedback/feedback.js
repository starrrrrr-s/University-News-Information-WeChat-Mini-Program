const app = getApp();

const BASE_URL = 'http://localhost:3000';

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    
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
    submitting: false
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
  },

  checkLoginStatus() {
    const userInfo = app.globalData.userInfo;
    const isLoggedIn = !!userInfo;
    this.setData({ isLoggedIn, userInfo });
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
          // 延迟返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
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
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
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
  }
});
