const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    isAdmin: false,
    collectionsCount: 0
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

  onLogin() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = {
          nickName: res.userInfo.nickName,
          avatarUrl: res.userInfo.avatarUrl,
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
            this.onLogin();
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

  onAdminUser() {
    wx.navigateTo({ url: '/pages/admin/userAdmin/userAdmin' });
  }
});
