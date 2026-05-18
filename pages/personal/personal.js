const app = getApp();
const util = require('../../utils/util.js');

const BASE_URL = 'http://localhost:3001';

const _themeColor = (wx.getStorageSync('themeConfig') || {}).primaryColor || '#1AAD19';

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    isAdmin: false,
    collectionsCount: 0,
    showLoginModal: false,
    loginType: 'wechat',
    adminUsername: '',
    adminPassword: '',
    themeColor: _themeColor,
    // 编辑资料相关
    showEditModal: false,
    editNickname: '',
    editAvatar: '',
    avatarList: [
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%23FF6B6B"/%3E%3Ctext x="50" y="60" text-anchor="middle" font-size="40"%3E%E2%98%80%3C/text%3E%3C/svg%3E',
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%234ECDC4"/%3E%3Ctext x="50" y="60" text-anchor="middle" font-size="40"%3E%E2%98%81%3C/text%3E%3C/svg%3E',
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%2345B7D1"/%3E%3Ctext x="50" y="60" text-anchor="middle" font-size="40"%3E%E2%99%A6%3C/text%3E%3C/svg%3E',
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%23FFA07A"/%3E%3Ctext x="50" y="60" text-anchor="middle" font-size="40"%3E%F0%9F%A6%8A%3C/text%3E%3C/svg%3E',
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%2398D8C8"/%3E%3Ctext x="50" y="60" text-anchor="middle" font-size="40"%3E%F0%9F%90%83%3C/text%3E%3C/svg%3E'
    ],
    avatarNames: ['熊', '猫', '狗', '狐狸', '兔子']
  },

  onLoad() {
    // 立即应用缓存的主题颜色，避免页面跳转时闪烁
    const app = getApp();
    const themeConfig = wx.getStorageSync('themeConfig');
    if (themeConfig) {
      app.globalData.themeConfig = themeConfig;
      app.applyThemeConfig(themeConfig);
      this.setData({ themeColor: themeConfig.primaryColor || '#1AAD19' });
    }
    this.checkLoginStatus();
  },

  onShow() {
    const app = getApp();
    const themeConfig = wx.getStorageSync('themeConfig');
    if (themeConfig) {
      app.globalData.themeConfig = themeConfig;
      app.applyThemeConfig(themeConfig);
      this.setData({ themeColor: themeConfig.primaryColor || '#1AAD19' });
    }
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
              data: {
                code: loginRes.code,
                nickname: profileRes.userInfo.nickName,
                avatar_url: profileRes.userInfo.avatarUrl
              },
              success: (authRes) => {
                let token = '';
                let isAdmin = false;
                let nickName = profileRes.userInfo.nickName;
                let avatarUrl = profileRes.userInfo.avatarUrl;
                if (authRes.data && authRes.data.success) {
                  token = authRes.data.data.token;
                  isAdmin = authRes.data.data.user.is_admin || false;
                  // 使用后端返回的用户信息（包含修改后的昵称和头像）
                  if (authRes.data.data.user.nickname) {
                    nickName = authRes.data.data.user.nickname;
                  }
                  if (authRes.data.data.user.avatar_url) {
                    avatarUrl = authRes.data.data.user.avatar_url;
                  }
                  wx.setStorageSync('token', token);
                }
                const userInfo = {
                  nickName,
                  avatarUrl,
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

  onAdminTheme() {
    wx.navigateTo({ url: '/pages/admin/themeConfig/themeConfig' });
  },

  onFontSetting() {
    wx.navigateTo({ url: '/pages/fontSetting/fontSetting' });
  },

  onFeedback() {
    wx.navigateTo({ url: '/pages/feedback/feedback' });
  },

  onAbout() {
    wx.navigateTo({ url: '/pages/about/about' });
  },

  // 显示编辑资料弹窗
  showEditModal() {
    const { userInfo } = this.data;
    this.setData({
      showEditModal: true,
      editNickname: userInfo.nickName || '',
      editAvatar: userInfo.avatarUrl || ''
    });
  },

  // 隐藏编辑资料弹窗
  hideEditModal() {
    this.setData({ showEditModal: false });
  },

  // 阻止弹窗内容区域点击事件冒泡
  onEditModalTap() {
    // 空方法，阻止事件冒泡
  },

  // 昵称输入
  onEditNicknameInput(e) {
    this.setData({ editNickname: e.detail.value });
  },

  // 选择头像
  selectAvatar(e) {
    const avatar = e.currentTarget.dataset.avatar;
    this.setData({ editAvatar: avatar });
  },

  // 保存用户信息
  saveUserInfo() {
    const { editNickname, editAvatar } = this.data;
    
    if (!editNickname.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }

    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.request({
      url: `${BASE_URL}/api/auth/user`,
      method: 'PUT',
      header: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        nickname: editNickname.trim(),
        avatar_url: editAvatar
      },
      success: (res) => {
        if (res.data && res.data.success) {
          const userInfo = {
            nickName: res.data.data.nickname,
            avatarUrl: res.data.data.avatar_url || '',
            isAdmin: this.data.isAdmin
          };
          app.globalData.userInfo = userInfo;
          wx.setStorageSync('userInfo', userInfo);
          this.setData({
            userInfo,
            showEditModal: false
          });
          wx.showToast({ title: '修改成功', icon: 'success' });
        } else {
          wx.showToast({ title: res.data.message || '修改失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '修改失败，请重试', icon: 'none' });
      }
    });
  }
});
