const app = getApp();
const util = require('../../utils/util.js');

const BASE_URL = 'http://localhost:3001';

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    isAdmin: false,
    collectionsCount: 0,
    showLoginModal: false,
    loginType: 'wechat',
    adminUsername: '',
    adminPassword: ''
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    this.checkLoginStatus();
  },

  checkLoginStatus() {
    const userInfo = app.globalData.userInfo;
    const isAdmin = app.globalData.isAdmin;
    const isLoggedIn = !!userInfo;

    let collectionsCount = 0;
    if (isLoggedIn) {
      collectionsCount = util.getCollections().length;
    }

    this.setData({
      isLoggedIn,
      userInfo,
      isAdmin,
      collectionsCount
    });
  },

  // 显示登录弹窗
  showLoginModal() {
    this.setData({ showLoginModal: true });
  },

  // 隐藏登录弹窗
  hideLoginModal() {
    this.setData({ showLoginModal: false });
  },

  // 阻止弹窗内容区域的点击事件冒泡
  onModalContentTap() {
    // 空方法，阻止事件冒泡
  },

  // 设置登录类型
  setLoginType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ 
      loginType: type,
      adminUsername: '',
      adminPassword: ''
    });
  },

  // 管理员用户名输入
  onAdminUsernameInput(e) {
    this.setData({ adminUsername: e.detail.value });
  },

  // 管理员密码输入
  onAdminPasswordInput(e) {
    this.setData({ adminPassword: e.detail.value });
  },

  // 管理员账号密码登录
  onAdminLogin() {
    const { adminUsername, adminPassword } = this.data;
    
    if (!adminUsername || !adminPassword) {
      wx.showToast({ title: '请输入用户名和密码', icon: 'none' });
      return;
    }

    wx.request({
      url: `${BASE_URL}/api/auth/admin/login`,
      method: 'POST',
      data: {
        username: adminUsername,
        password: adminPassword
      },
      success: (res) => {
        if (res.data && res.data.success) {
          const token = res.data.data.token;
          const isAdmin = res.data.data.user.is_admin;
          wx.setStorageSync('token', token);
          
          const userInfo = {
            nickName: res.data.data.user.nickname,
            avatarUrl: res.data.data.user.avatar_url || '',
            isAdmin
          };
          
          app.globalData.userInfo = userInfo;
          app.globalData.isAdmin = isAdmin;
          wx.setStorageSync('userInfo', userInfo);
          
          this.setData({
            isLoggedIn: true,
            userInfo,
            isAdmin,
            collectionsCount: util.getCollections().length,
            showLoginModal: false
          });
          
          wx.showToast({ title: '登录成功', icon: 'success' });
        } else {
          wx.showToast({ title: res.data.message || '登录失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '登录失败，请重试', icon: 'none' });
      }
    });
  },

  // 微信登录
  onWechatLogin() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (profileRes) => {
        // 先获取微信登录 code
        wx.login({
          success: (loginRes) => {
            if (!loginRes.code) {
              wx.showToast({ title: '登录失败，请重试', icon: 'none' });
              return;
            }
            // 调用后端登录接口，获取 JWT token
            wx.request({
              url: `${BASE_URL}/api/auth/login`,
              method: 'POST',
              data: { code: loginRes.code },
              success: (authRes) => {
                let token = '';
                let isAdmin = false;
                if (authRes.data && authRes.data.success) {
                  token = authRes.data.data.token;
                  isAdmin = authRes.data.data.user.is_admin || false;
                  wx.setStorageSync('token', token);
                }
                const userInfo = {
                  nickName: profileRes.userInfo.nickName,
                  avatarUrl: profileRes.userInfo.avatarUrl,
                  isAdmin
                };
                app.globalData.userInfo = userInfo;
                app.globalData.isAdmin = isAdmin;
                wx.setStorageSync('userInfo', userInfo);
                this.setData({
                  isLoggedIn: true,
                  userInfo,
                  isAdmin,
                  collectionsCount: util.getCollections().length
                });
                wx.showToast({ title: '登录成功', icon: 'success' });
              },
              fail: () => {
                // 后端不可用时，降级为本地登录（无法发评论等需认证的操作）
                const userInfo = {
                  nickName: profileRes.userInfo.nickName,
                  avatarUrl: profileRes.userInfo.avatarUrl,
                  isAdmin: false
                };
                app.globalData.userInfo = userInfo;
                app.globalData.isAdmin = false;
                wx.setStorageSync('userInfo', userInfo);
                this.setData({
                  isLoggedIn: true,
                  userInfo,
                  isAdmin: false,
                  collectionsCount: util.getCollections().length
                });
                wx.showToast({ title: '登录成功', icon: 'success' });
              }
            });
          },
          fail: () => {
            wx.showToast({ title: '登录失败，请重试', icon: 'none' });
          }
        });
      },
      fail: () => {
        wx.showToast({ title: '登录失败，请重试', icon: 'none' });
      }
    });
  },

  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.globalData.userInfo = null;
          app.globalData.isAdmin = false;
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('token');
          this.setData({
            isLoggedIn: false,
            userInfo: null,
            isAdmin: false,
            collectionsCount: 0
          });
          wx.showToast({ title: '已退出登录', icon: 'success' });
        }
      }
    });
  },

  onMyCollections() {
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后查看收藏',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            this.showLoginModal();
          }
        }
      });
      return;
    }
    wx.navigateTo({
      url: '/pages/collections/collections'
    });
  },

  onAdminNews() {
    wx.navigateTo({ url: '/pages/admin/newsAdmin/newsAdmin' });
  },

  onAdminLecture() {
    wx.navigateTo({ url: '/pages/admin/lectureAdmin/lectureAdmin' });
  },

  onAdminComment() {
    wx.navigateTo({ url: '/pages/admin/commentAdmin/commentAdmin' });
  },

  onAdminFeedback() {
    wx.navigateTo({ url: '/pages/admin/feedbackAdmin/feedbackAdmin' });
  },

  onAdminUser() {
    wx.navigateTo({ url: '/pages/admin/userAdmin/userAdmin' });
  },

  onFontSetting() {
    wx.navigateTo({ url: '/pages/fontSetting/fontSetting' });
  },

  onFeedback() {
    wx.navigateTo({ url: '/pages/feedback/feedback' });
  },

  onAbout() {
    wx.navigateTo({ url: '/pages/about/about' });
  }
});
