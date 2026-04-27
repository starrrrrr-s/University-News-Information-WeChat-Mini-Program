App({
  globalData: {
    userInfo: null,
    isAdmin: false
  },

  onLaunch() {
    // 从本地存储恢复登录状态
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
      this.globalData.isAdmin = userInfo.isAdmin || false;
    }
  },

  /**
   * 开发调试：快速切换管理员模式
   * 在控制台调用 getApp().setAdminMode(true) 即可
   */
  setAdminMode(isAdmin) {
    const userInfo = this.globalData.userInfo;
    if (userInfo) {
      userInfo.isAdmin = isAdmin;
      this.globalData.isAdmin = isAdmin;
      wx.setStorageSync('userInfo', userInfo);
    }
  }
});
